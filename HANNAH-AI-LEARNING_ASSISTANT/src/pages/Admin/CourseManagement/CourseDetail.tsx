import { Link, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, FileText, AlertTriangle, CheckSquare, Map, ChevronRight, Loader, Check, X, Download, RefreshCw, Wifi, WifiOff, Eye } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import subjectService, { type Subject } from '../../../service/subjectService';
import documentService, { type Document } from '../../../service/documentService';
import suggestionService, { type Suggestion, SuggestionStatus, SuggestionContentType } from '../../../service/suggestionService';
import SyllabusImporter from './SyllabusImporter';
import { useRealtimeEvent } from '../../../hooks/useRealtime';
import type { DocumentData } from '../../../hooks/useRealtime';
import { useRealtimeContext } from '../../../contexts/RealtimeContext';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import { formatDateVN, formatDateTimeVN } from '../../../utils/dateUtils';
import './CourseManagement.css';

// Semester enum mapping - Backend returns 'First', 'Second', etc. Convert to numbers
const SEMESTER_ENUM_TO_NUMBER: { [key: string]: number } = {
  'First': 1,
  'Second': 2,
  'Third': 3,
  'Fourth': 4,
  'Fifth': 5,
  'Sixth': 6,
  'Seventh': 7,
  'Eighth': 8,
  'Ninth': 9,
};

// Helper to convert semester (number or enum string) to display number
const getSemesterNumber = (semester: number | string | undefined): number | string => {
  if (typeof semester === 'number') return semester;
  if (typeof semester === 'string') {
    return SEMESTER_ENUM_TO_NUMBER[semester] || parseInt(semester) || semester;
  }
  return semester ?? '-';
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'document' | 'outcome' | 'challenge'>('document');
  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const [approvedDocuments, setApprovedDocuments] = useState<Document[]>([]);
  const [rejectedDocuments, setRejectedDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [processingDocId, setProcessingDocId] = useState<number | null>(null);

  // State for suggestions
  const [pendingSuggestions, setPendingSuggestions] = useState<Suggestion[]>([]);
  const [approvedSuggestions, setApprovedSuggestions] = useState<Suggestion[]>([]);
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<number | null>(null);

  // State for reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectModalType, setRejectModalType] = useState<'document' | 'suggestion'>('document');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'document' | 'suggestion';
    id: number | null;
    name: string;
  }>({
    isOpen: false,
    type: 'document',
    id: null,
    name: ''
  });

  // State for document preview modal
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    documentId: number | null;
    documentTitle: string;
    previewUrls: string[];
    loading: boolean;
  }>({
    isOpen: false,
    documentId: null,
    documentTitle: '',
    previewUrls: [],
    loading: false
  });

  // Real-time connection context
  const { isConnected, joinSubjectGroup, leaveSubjectGroup } = useRealtimeContext();

  // 🔔 Real-time: Handle document uploaded by Faculty
  const handleDocumentUploaded = useCallback((data: DocumentData) => {
    console.log('[CourseDetail] Document uploaded event:', data);
    // Check if this document belongs to the current subject
    if (data.subjectId === parseInt(id || '0')) {
      console.log('[CourseDetail] Document for current subject! Refreshing pending list...');
      // Refresh pending documents to show new upload
      fetchPendingDocuments();
      toast.success(`New document uploaded: ${data.fileName}`);
    }
  }, [id]);

  // 🔔 Real-time: Handle document processed (status change)
  // No toast - just refresh silently (Admin already saw action toast if they triggered it)
  const handleDocumentProcessed = useCallback((data: DocumentData) => {
    console.log('[CourseDetail] Document processed event:', data);
    if (data.subjectId === parseInt(id || '0')) {
      fetchApprovedDocuments();
      // No toast - avoid double toast if Admin triggered the action
    }
  }, [id]);

  // 🔔 Real-time: Handle document deleted
  // No toast for Admin - they already see success toast from their delete action
  const handleDocumentDeleted = useCallback((data: DocumentData) => {
    console.log('[CourseDetail] Document deleted event:', data);
    if (data.subjectId === parseInt(id || '0')) {
      // Remove from pending list
      setPendingDocuments(prev => prev.filter(doc => doc.documentId !== data.documentId));
      // Also refresh approved in case it was approved
      fetchApprovedDocuments();
      // No toast - Admin already sees success toast from delete action
    }
  }, [id]);

  // 🔔 Real-time: Handle suggestion created by Faculty
  const handleSuggestionCreated = useCallback((data: { subjectId: number; suggestionId: number; contentType: string; content: string; status: string }) => {
    console.log('[CourseDetail] Suggestion created event:', data);
    if (data.subjectId === parseInt(id || '0')) {
      // Add to pending suggestions locally to avoid full refetch
      const newSuggestion = {
        id: data.suggestionId,
        subjectId: data.subjectId,
        contentType: data.contentType === 'LearningOutcome' ? SuggestionContentType.LearningOutcome : SuggestionContentType.CommonChallenge,
        content: data.content,
        status: SuggestionStatus.Pending,
        createdAt: new Date().toISOString(),
        suggestedByUserId: 0,
        suggestedByUserName: 'Faculty'
      };
      setPendingSuggestions(prev => [...prev, newSuggestion]);
      const type = data.contentType === 'LearningOutcome' ? 'Learning Outcome' : 'Common Challenge';
      toast.success(`New ${type} suggestion submitted by Faculty`);
    }
  }, [id]);

  // 🔔 Real-time: Handle suggestion approved (update local state to avoid flicker)
  // No toast - Admin already sees toast from their approve action
  const handleSuggestionApproved = useCallback((data: { subjectId: number; suggestionId: number }) => {
    console.log('[CourseDetail] Suggestion approved event:', data);
    if (data.subjectId === parseInt(id || '0')) {
      // Move from pending to approved locally
      setPendingSuggestions(prev => {
        const approved = prev.find(s => s.id === data.suggestionId);
        if (approved) {
          setApprovedSuggestions(prevApproved => [...prevApproved, { ...approved, status: SuggestionStatus.Approved }]);
        }
        return prev.filter(s => s.id !== data.suggestionId);
      });
      fetchSubjectDetail(); // Refresh subject to show new outcome/challenge in official list
    }
  }, [id]);

  // 🔔 Real-time: Handle suggestion rejected (update local state to avoid flicker)
  // No toast - Admin already sees toast from their reject action
  const handleSuggestionRejected = useCallback((data: { subjectId: number; suggestionId: number; rejectionReason?: string }) => {
    console.log('[CourseDetail] Suggestion rejected event:', data);
    if (data.subjectId === parseInt(id || '0')) {
      // Move from pending to rejected locally
      setPendingSuggestions(prev => {
        const rejected = prev.find(s => s.id === data.suggestionId);
        if (rejected) {
          setRejectedSuggestions(prevRejected => [...prevRejected, {
            ...rejected,
            status: SuggestionStatus.Rejected,
            rejectionReason: data.rejectionReason || null
          }]);
        }
        return prev.filter(s => s.id !== data.suggestionId);
      });
    }
  }, [id]);

  // 🔔 Real-time: Handle suggestion deleted
  // No toast - Admin already sees toast from their delete action
  const handleSuggestionDeleted = useCallback((data: { subjectId: number; suggestionId: number }) => {
    console.log('[CourseDetail] Suggestion deleted event:', data);
    if (data.subjectId === parseInt(id || '0')) {
      // Remove from all lists locally
      setPendingSuggestions(prev => prev.filter(s => s.id !== data.suggestionId));
      setApprovedSuggestions(prev => prev.filter(s => s.id !== data.suggestionId));
      setRejectedSuggestions(prev => prev.filter(s => s.id !== data.suggestionId));
    }
  }, [id]);

  // Subscribe to real-time events
  useRealtimeEvent('DocumentUploaded', handleDocumentUploaded);
  useRealtimeEvent('DocumentProcessed', handleDocumentProcessed);
  useRealtimeEvent('DocumentDeleted', handleDocumentDeleted);
  useRealtimeEvent('SuggestionCreated', handleSuggestionCreated);
  useRealtimeEvent('SuggestionApproved', handleSuggestionApproved);
  useRealtimeEvent('SuggestionRejected', handleSuggestionRejected);
  useRealtimeEvent('SuggestionDeleted', handleSuggestionDeleted);

  // Join subject group for targeted updates
  useEffect(() => {
    if (id && isConnected) {
      const subjectId = parseInt(id);
      joinSubjectGroup(subjectId);
      return () => {
        leaveSubjectGroup(subjectId);
      };
    }
  }, [id, isConnected, joinSubjectGroup, leaveSubjectGroup]);

  // State for expanded document descriptions
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set());
  const toggleDocExpand = (docId: number) => {
    setExpandedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const fetchSubjectDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await subjectService.getSubjectById(parseInt(id, 10));
      setSubject(data);
    } catch (error) {
      toast.error('Failed to fetch subject details.');
      console.error('Error fetching subject details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedDocuments = async () => {
    if (!id) return;
    try {
      const docs = await documentService.getDocumentsBySubject(id);
      // Separate approved and rejected documents
      setApprovedDocuments(docs.filter(d => d.processingStatus === 'completed' || d.approvalStatus === 'approved'));
      setRejectedDocuments(docs.filter(d => d.approvalStatus === 'rejected'));
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  useEffect(() => {
    fetchSubjectDetail();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPendingDocuments();
      fetchApprovedDocuments();
      fetchSuggestions();
    }
  }, [id]);

  const fetchPendingDocuments = async () => {
    if (!id) return;
    try {
      setLoadingDocuments(true);
      const docs = await documentService.getPendingDocuments(parseInt(id, 10));
      setPendingDocuments(docs);
    } catch (error) {
      console.error('Error fetching pending documents:', error);
      toast.error('Failed to fetch pending documents');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleApprove = async (documentId: number) => {
    try {
      setProcessingDocId(documentId);
      await documentService.approveDocument(documentId);
      toast.success('Document approved successfully!');
      // Refresh the list
      await fetchPendingDocuments();
      await fetchApprovedDocuments();
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    } finally {
      setProcessingDocId(null);
    }
  };

  // Open reject modal for document
  const openRejectModal = (itemId: number, type: 'document' | 'suggestion') => {
    setRejectingId(itemId);
    setRejectModalType(type);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Handle reject submission from modal
  const handleRejectSubmit = async () => {
    const trimmedReason = rejectReason.trim();

    if (!trimmedReason || !rejectingId) {
      toast.error('Please enter a rejection reason');
      return;
    }

    // Backend requires minimum 10 characters
    if (trimmedReason.length < 10) {
      toast.error(`Rejection reason must be at least 10 characters (currently ${trimmedReason.length})`);
      return;
    }

    // Backend allows maximum 500 characters
    if (trimmedReason.length > 500) {
      toast.error(`Rejection reason cannot exceed 500 characters (currently ${trimmedReason.length})`);
      return;
    }

    try {
      setRejectSubmitting(true);
      if (rejectModalType === 'document') {
        setProcessingDocId(rejectingId);
        await documentService.rejectDocument(rejectingId, trimmedReason);
        toast.success('Document rejected');
        await fetchPendingDocuments();
        setProcessingDocId(null);
      } else {
        setProcessingSuggestionId(rejectingId);
        await suggestionService.rejectSuggestion(rejectingId, trimmedReason);
        toast.success('Suggestion rejected');
        await fetchSuggestions();
        setProcessingSuggestionId(null);
      }
      setShowRejectModal(false);
      setRejectReason('');
      setRejectingId(null);
    } catch (error: any) {
      console.error('Error rejecting:', error);
      // Show detailed error from backend if available
      if (error.errors) {
        const errorMessages = Object.values(error.errors).flat().join(', ');
        toast.error(errorMessages || 'Validation error');
      } else {
        toast.error(error.message || 'Failed to reject');
      }
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleDownload = async (documentId: number, title: string) => {
    try {
      toast.loading('Downloading document...', { id: 'download' });
      const blob = await documentService.downloadDocument(documentId.toString());

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = title; // Use the document title as filename
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Document downloaded successfully!', { id: 'download' });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document', { id: 'download' });
    }
  };

  // Handle opening document preview modal
  const handleOpenPreview = async (documentId: number, documentTitle: string) => {
    setPreviewModal({
      isOpen: true,
      documentId,
      documentTitle,
      previewUrls: [],
      loading: true
    });

    try {
      const response = await documentService.getDocumentPreviews(documentId);
      setPreviewModal(prev => ({
        ...prev,
        previewUrls: response.previewUrls || [],
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching document previews:', error);
      setPreviewModal(prev => ({
        ...prev,
        previewUrls: [],
        loading: false
      }));
    }
  };

  // Close preview modal
  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      documentId: null,
      documentTitle: '',
      previewUrls: [],
      loading: false
    });
  };

  const fetchSuggestions = async () => {
    if (!id) return;
    try {
      setSuggestionsLoading(true);
      // Fetch all suggestions for this subject (no status filter)
      const allSuggestions = await suggestionService.getSuggestions({
        subjectId: parseInt(id, 10)
      });

      // Separate by status
      setPendingSuggestions(allSuggestions.filter(s => s.status === SuggestionStatus.Pending));
      setApprovedSuggestions(allSuggestions.filter(s => s.status === SuggestionStatus.Approved));
      setRejectedSuggestions(allSuggestions.filter(s => s.status === SuggestionStatus.Rejected));
      setSuggestionsError(null);
    } catch (err: any) {
      setSuggestionsError('Failed to load suggestions.');
      toast.error('Failed to load suggestions.');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleApproveSuggestion = async (suggestionId: number) => {
    if (!id) return;
    try {
      setProcessingSuggestionId(suggestionId);
      await suggestionService.approveSuggestion(suggestionId, { subjectIds: [parseInt(id, 10)] });
      toast.success('Suggestion approved and applied!');
      await fetchSuggestions(); // Refresh suggestion list
      await fetchSubjectDetail(); // Refresh subject details to show the new outcome/challenge
    } catch (error) {
      console.error('Error approving suggestion:', error);
      toast.error('Failed to approve suggestion.');
    } finally {
      setProcessingSuggestionId(null);
    }
  };



  // Open delete confirmation modal
  const openDeleteModal = (type: 'document' | 'suggestion', id: number, name: string) => {
    setDeleteModal({ isOpen: true, type, id, name });
  };

  // Handle confirmed delete
  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      if (deleteModal.type === 'suggestion') {
        setProcessingSuggestionId(deleteModal.id);
        await suggestionService.deleteSuggestion(deleteModal.id);
        toast.success('Suggestion deleted successfully.');
        await fetchSuggestions();
        setProcessingSuggestionId(null);
      } else {
        setProcessingDocId(deleteModal.id);
        await documentService.deleteDocument(deleteModal.id.toString());
        toast.success('Document deleted successfully.');
        await fetchApprovedDocuments();
        setProcessingDocId(null);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Failed to delete ${deleteModal.type}.`);
      setProcessingDocId(null);
      setProcessingSuggestionId(null);
    }

    setDeleteModal({ isOpen: false, type: 'document', id: null, name: '' });
  };

  // Legacy handlers - now open modal instead
  const handleDeleteSuggestion = (suggestionId: number, suggestionTitle: string) => {
    openDeleteModal('suggestion', suggestionId, suggestionTitle || 'this suggestion');
  };

  const handleDeleteDocument = (documentId: number, documentTitle: string) => {
    openDeleteModal('document', documentId, documentTitle || 'this document');
  };

  // Handle reprocess failed document
  const handleReprocessDocument = async (documentId: number) => {
    try {
      setProcessingDocId(documentId);
      await documentService.reprocessDocument(documentId.toString());
      toast.success('Document reprocessing started. This may take a few minutes.');
      await fetchApprovedDocuments(); // Refresh list
    } catch (error) {
      console.error('Error reprocessing document:', error);
      toast.error('Failed to reprocess document.');
    } finally {
      setProcessingDocId(null);
    }
  };

  if (loading) {
    return <AdminPageWrapper title="Loading..."><div className="loading-state"><Loader className="animate-spin" size={48} /><p>Loading Course...</p></div></AdminPageWrapper>;
  }

  return (
    <AdminPageWrapper title="Course Detail">
      <div className="course-container">
        <div className="course-header">
          <nav className="breadcrumb">
            <Link className="breadcrumb-link" to="/admin">Admin</Link>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <Link className="breadcrumb-link" to="/admin/course-management">Course Management</Link>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <span className="breadcrumb-current">{subject?.code ?? 'N/A'}</span>
          </nav>

          <div className="course-header-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Map size={24} />
              <div>
                <h2 className="course-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {subject?.name ?? 'Course not found'}
                  {subject && <span className="chip code">{subject.code}</span>}
                </h2>
                {subject && (
                  <p className="course-subtitle" style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>Semester: {getSemesterNumber(subject.semester)}</span>
                    <span className="dot">•</span>
                    <span className={`chip status ${subject.isActive ? 'published' : 'draft'}`}>{subject.isActive ? 'Active' : 'Inactive'}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="course-actions" style={{ gap: 8, display: 'flex', alignItems: 'center' }}>
              {subject && (
                <SyllabusImporter
                  subjectId={subject.subjectId}
                  subjectCode={subject.code}
                  onImportSuccess={fetchSubjectDetail}
                />
              )}
              <Link to="/admin/course-management" className="btn-secondary" aria-label="Back to list">Back</Link>
            </div>
          </div>
        </div>

        {!subject ? (
          <div className="empty-state">
            <Map className="empty-icon" size={64} />
            <p className="empty-title">Course not found</p>
            <p className="empty-description">Please check the URL or go back to the list</p>
          </div>
        ) : (
          <div className="create-layout">
            <div className="create-main">
              <div className="form-section">
                <h3 className="form-section-title">Course Description</h3>
                <div className="form-content">
                  <p className="course-description" style={{ marginTop: 0 }}>{subject.description || 'No description available.'}</p>
                  <div className="course-footer">
                    <div className="course-footer-item"><Clock size={16} /> Created: {formatDateVN(subject.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Course Information</h3>
                <div className="form-content">
                  <div className="info-grid">
                    <div className="info-item"><label className="preview-label">Degree Level</label><p className="preview-value">{subject.degreeLevel || '-'}</p></div>
                    <div className="info-item"><label className="preview-label">Grading Scale</label><p className="preview-value">{subject.scoringScale || '-'}</p></div>
                    <div className="info-item"><label className="preview-label">Minimum Passing Average</label><p className="preview-value">{subject.minAvgMarkToPass || '-'}</p></div>
                    <div className="info-item"><label className="preview-label">Approval</label><span className={`chip status ${subject.isApproved ? 'published' : 'draft'}`}>{subject.isApproved ? 'Approved' : 'Not approved'}</span></div>
                    <div className="info-item"><label className="preview-label">Decision No.</label><p className="preview-value">{subject.decisionNo || '-'}</p></div>
                    <div className="info-item"><label className="preview-label">Approved Date</label><p className="preview-value">{formatDateVN(subject.approvedDate)}</p></div>
                  </div>
                  <div className="time-tools" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="time-box"><h4 className="subsection-title">Time Allocation</h4><p>{subject.timeAllocation || 'Not specified'}</p></div>
                    <div className="tools-box"><h4 className="subsection-title">Tools</h4><div className="tags-wrapper"><span className="tag">{subject.tools || 'Not specified'}</span></div></div>
                    <div className="tools-box"><h4 className="subsection-title">Prerequisites</h4><div className="tags-wrapper">{subject.prerequisites && subject.prerequisites.length > 0 ? subject.prerequisites.map((p, i) => <span key={i} className="tag tag-prerequisite">{p}</span>) : <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>None</p>}</div></div>
                  </div>
                </div>
              </div>

              {/* Two column grid: Learning Outcomes, Common Challenges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Learning Outcomes Section */}
                <div className="form-section" style={{ margin: 0 }}>
                  <h3 className="form-section-title">Learning Outcomes</h3>
                  <div className="form-content">
                    <div className="tags-wrapper">
                      {subject.learningOutcomes && subject.learningOutcomes.length > 0
                        ? subject.learningOutcomes.map((outcome, i) => (
                          <span key={i} className="tag" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>{outcome}</span>
                        ))
                        : <p className="empty-description" style={{ margin: 0 }}>None available.</p>}
                    </div>
                  </div>
                </div>

                {/* Common Challenges Section */}
                <div className="form-section" style={{ margin: 0 }}>
                  <h3 className="form-section-title">Common Challenges</h3>
                  <div className="form-content">
                    <div className="tags-wrapper">
                      {subject.commonChallenges && subject.commonChallenges.length > 0
                        ? subject.commonChallenges.map((challenge, i) => (
                          <span key={i} className="tag" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>{challenge}</span>
                        ))
                        : <p className="empty-description" style={{ margin: 0 }}>None available.</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Syllabus Data: Sessions, Assessments, Materials */}
              {(subject.sessions || subject.assessments || subject.syllabusMaterials || subject.studentTasks) && (
                <div className="form-section">
                  <h3 className="form-section-title">📚 Imported Syllabus Data</h3>
                  <div className="form-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Sessions Table */}
                    {subject.sessions && (() => {
                      try {
                        const sessions = JSON.parse(subject.sessions) as Array<{ session?: string; topic?: string; type?: string; lo?: string; materials?: string; studentTasks?: string }>;
                        return (
                          <div>
                            <h4 style={{ margin: '0 0 0.75rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              📅 Course Sessions ({sessions.length})
                            </h4>
                            <div style={{ maxHeight: '350px', overflowY: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead style={{ background: '#10b981', color: 'white', position: 'sticky', top: 0 }}>
                                  <tr>
                                    <th style={{ padding: '0.6rem', textAlign: 'left', width: '60px' }}>#</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Topic</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left', width: '100px' }}>Type</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left', width: '80px' }}>LO</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sessions.map((s, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                                      <td style={{ padding: '0.5rem 0.6rem', color: '#6b7280', fontWeight: 500 }}>{s.session || i + 1}</td>
                                      <td style={{ padding: '0.5rem 0.6rem' }}>{s.topic || '-'}</td>
                                      <td style={{ padding: '0.5rem 0.6rem', color: '#6b7280' }}>{s.type || '-'}</td>
                                      <td style={{ padding: '0.5rem 0.6rem', color: '#6366f1', fontWeight: 500 }}>{s.lo || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      } catch { return null; }
                    })()}

                    {/* Assessments Table */}
                    {subject.assessments && (() => {
                      try {
                        const assessments = JSON.parse(subject.assessments) as Array<{ type?: string; category?: string; weight?: string; duration?: string; clo?: string; passCondition?: string }>;
                        return (
                          <div>
                            <h4 style={{ margin: '0 0 0.75rem 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              📝 Assessments ({assessments.length})
                            </h4>
                            <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ background: '#f59e0b', color: 'white' }}>
                                  <tr>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Category</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Weight</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>Duration</th>
                                    <th style={{ padding: '0.6rem', textAlign: 'left' }}>CLO</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {assessments.map((a, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: i % 2 === 0 ? '#fffbeb' : 'white' }}>
                                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>{a.type || '-'}</td>
                                      <td style={{ padding: '0.6rem' }}>{a.category || '-'}</td>
                                      <td style={{ padding: '0.6rem', color: '#10b981', fontWeight: 700 }}>{a.weight || '-'}</td>
                                      <td style={{ padding: '0.6rem', color: '#6b7280' }}>{a.duration || '-'}</td>
                                      <td style={{ padding: '0.6rem', color: '#6366f1', fontWeight: 500 }}>{a.clo || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      } catch { return null; }
                    })()}

                    {/* Two column grid: Materials and Student Tasks */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      {/* Materials List */}
                      {subject.syllabusMaterials && (() => {
                        try {
                          const materials = JSON.parse(subject.syllabusMaterials) as Array<{ description?: string; author?: string; isMain?: boolean }>;
                          return (
                            <div>
                              <h4 style={{ margin: '0 0 0.75rem 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📖 Learning Materials ({materials.length})
                              </h4>
                              <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '1rem', border: '1px solid #bfdbfe' }}>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                  {materials.map((m, i) => (
                                    <li key={i} style={{ marginBottom: '0.5rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                      <span style={{ color: '#1e40af' }}>{m.description}</span>
                                      {m.author && <span style={{ color: '#6b7280' }}> - {m.author}</span>}
                                      {m.isMain && <span style={{ background: '#3b82f6', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', marginLeft: '0.5rem' }}>Main</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        } catch { return null; }
                      })()}

                      {/* Student Tasks */}
                      {subject.studentTasks && (
                        <div>
                          <h4 style={{ margin: '0 0 0.75rem 0', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ✅ Student Tasks
                          </h4>
                          <div style={{ background: '#f5f3ff', borderRadius: '8px', padding: '1rem', border: '1px solid #ddd6fe', fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {subject.studentTasks}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-section">
                <h3 className="form-section-title">Faculty Submissions</h3>
                <div className="form-content">
                  <div className="tabs">
                    <button className={`tab ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}>
                      <FileText size={16} /> Documents
                      <span className="count-chip">
                        {pendingDocuments.length + approvedDocuments.length + rejectedDocuments.length}
                      </span>
                      {pendingDocuments.length > 0 && (
                        <span className="pending-badge" style={{ backgroundColor: '#ef4444', color: 'white', borderRadius: '999px', padding: '2px 6px', fontSize: '0.7rem', marginLeft: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px' }} title="Pending Requests">
                          {pendingDocuments.length}
                        </span>
                      )}
                    </button>
                    <button className={`tab ${activeTab === 'outcome' ? 'active' : ''}`} onClick={() => setActiveTab('outcome')}>
                      <CheckSquare size={16} /> Learning Outcome
                      <span className="count-chip">
                        {pendingSuggestions.filter(s => s.contentType === SuggestionContentType.LearningOutcome).length + approvedSuggestions.filter(s => s.contentType === SuggestionContentType.LearningOutcome).length + rejectedSuggestions.filter(s => s.contentType === SuggestionContentType.LearningOutcome).length}
                      </span>
                      {pendingSuggestions.filter(s => s.contentType === SuggestionContentType.LearningOutcome).length > 0 && (
                        <span className="pending-badge" style={{ backgroundColor: '#ef4444', color: 'white', borderRadius: '999px', padding: '2px 6px', fontSize: '0.7rem', marginLeft: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px' }} title="Pending Requests">
                          {pendingSuggestions.filter(s => s.contentType === SuggestionContentType.LearningOutcome).length}
                        </span>
                      )}
                    </button>
                    <button className={`tab ${activeTab === 'challenge' ? 'active' : ''}`} onClick={() => setActiveTab('challenge')}>
                      <AlertTriangle size={16} /> Common Challenge
                      <span className="count-chip">
                        {pendingSuggestions.filter(s => s.contentType === SuggestionContentType.CommonChallenge).length + approvedSuggestions.filter(s => s.contentType === SuggestionContentType.CommonChallenge).length + rejectedSuggestions.filter(s => s.contentType === SuggestionContentType.CommonChallenge).length}
                      </span>
                      {pendingSuggestions.filter(s => s.contentType === SuggestionContentType.CommonChallenge).length > 0 && (
                        <span className="pending-badge" style={{ backgroundColor: '#ef4444', color: 'white', borderRadius: '999px', padding: '2px 6px', fontSize: '0.7rem', marginLeft: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px' }} title="Pending Requests">
                          {pendingSuggestions.filter(s => s.contentType === SuggestionContentType.CommonChallenge).length}
                        </span>
                      )}
                    </button>
                  </div>

                  {activeTab === 'document' && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {/* Part 1: Faculty Requests */}
                      <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertTriangle size={18} className="text-warning" /> Faculty Requests
                        </h4>
                        {loadingDocuments ? (
                          <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <Loader className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Loading documents...</p>
                          </div>
                        ) : pendingDocuments.length === 0 ? (
                          <p className="empty-description">No pending document requests.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {pendingDocuments.map((doc) => (
                              <div key={doc.documentId} style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '1rem',
                                backgroundColor: 'var(--bg-secondary)'
                              }}>
                                <div style={{ marginBottom: '0.75rem' }}>
                                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e3a5f', lineHeight: 1.4 }}>{doc.title}</h4>
                                  {doc.description && (
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                      Uploaded file: {doc.description}
                                    </p>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => handleDownload(doc.documentId, doc.title)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      fontSize: '0.875rem',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                                    title="Download document"
                                  >
                                    <Download size={16} />
                                    Download
                                  </button>
                                  <button
                                    onClick={() => handleOpenPreview(doc.documentId, doc.title)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      fontSize: '0.875rem',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      backgroundColor: '#8b5cf6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#8b5cf6')}
                                    title="Preview document thumbnails"
                                  >
                                    <Eye size={16} />
                                    Preview
                                  </button>
                                  <button
                                    onClick={() => handleApprove(doc.documentId)}
                                    disabled={processingDocId === doc.documentId}
                                    style={{
                                      padding: '0.6rem 1.2rem',
                                      fontSize: '0.875rem',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                                    title="Approve document"
                                  >
                                    {processingDocId === doc.documentId ? (
                                      <Loader size={16} className="animate-spin" />
                                    ) : (
                                      <Check size={16} />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(doc.documentId, 'document')}
                                    disabled={processingDocId === doc.documentId}
                                    style={{
                                      padding: '0.6rem 1.2rem',
                                      fontSize: '0.875rem',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      backgroundColor: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                                    title="Reject document"
                                  >
                                    <X size={16} />
                                    Reject
                                  </button>
                                </div>
                                <div style={{
                                  display: 'flex',
                                  gap: '1rem',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '0.5rem',
                                  paddingTop: '0.5rem',
                                  borderTop: '1px solid var(--border-color)'
                                }}>
                                  <span>📁 {doc.mimeType}</span>
                                  <span>📊 {documentService.formatFileSize(doc.fileSize)}</span>
                                  <span>👤 {doc.uploadedByName || 'Unknown'}</span>
                                  <span>🕒 {formatDateVN(doc.createdAt)}</span>
                                  <span className="chip status draft">Pending Approval</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Part 2: Current Documents */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h4 style={{ fontSize: '1.1rem', margin: 0, color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckSquare size={18} className="text-success" /> Current Documents
                            {approvedDocuments.filter(d => d.processingStatus === 'failed').length > 0 && (
                              <span style={{
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                fontWeight: 600
                              }}>
                                {approvedDocuments.filter(d => d.processingStatus === 'failed').length} failed
                              </span>
                            )}
                          </h4>
                          {approvedDocuments.filter(d => d.processingStatus === 'failed').length > 0 && (
                            <button
                              onClick={async () => {
                                const failedDocs = approvedDocuments.filter(d => d.processingStatus === 'failed');
                                toast.loading(`Reprocessing ${failedDocs.length} documents...`, { id: 'reprocess-all' });
                                for (const doc of failedDocs) {
                                  try {
                                    await documentService.reprocessDocument(doc.documentId.toString());
                                  } catch (error) {
                                    console.error(`Failed to reprocess doc ${doc.documentId}:`, error);
                                  }
                                }
                                toast.success(`Started reprocessing ${failedDocs.length} documents. This may take a few minutes.`, { id: 'reprocess-all' });
                                await fetchApprovedDocuments();
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d97706')}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f59e0b')}
                              title="Reprocess all failed documents"
                            >
                              <RefreshCw size={14} />
                              Reprocess All Failed
                            </button>
                          )}
                        </div>
                        {/* Warning banner for failed documents */}
                        {approvedDocuments.filter(d => d.processingStatus === 'failed').length > 0 && (
                          <div style={{
                            backgroundColor: '#fef3c7',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.875rem',
                            color: '#92400e'
                          }}>
                            <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <div>
                              <strong>{approvedDocuments.filter(d => d.processingStatus === 'failed').length} document(s) failed processing.</strong>{' '}
                              These documents are approved but not indexed for AI search. Click "Reprocess" to retry.
                            </div>
                          </div>
                        )}
                        {!approvedDocuments || approvedDocuments.length === 0 ? (
                          <p className="empty-description">No approved documents available.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {approvedDocuments.map((doc, idx) => (
                              <div key={idx} style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '1rem',
                                backgroundColor: 'var(--bg-primary)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, wordBreak: 'break-word', color: '#1e293b' }}>{doc.title}</h4>
                                    {doc.description && (
                                      <>
                                        <p style={{
                                          margin: '0.25rem 0 0 0',
                                          fontSize: '0.875rem',
                                          color: '#475569',
                                          ...(expandedDocs.has(doc.documentId) ? {} : {
                                            maxHeight: '3rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical' as any,
                                          }),
                                        }}>
                                          Uploaded file: {doc.description}
                                        </p>
                                        {doc.description.length > 100 && (
                                          <button
                                            onClick={() => toggleDocExpand(doc.documentId)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              color: '#3b82f6',
                                              fontSize: '0.75rem',
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                              padding: '0.25rem 0',
                                              marginTop: '0.25rem',
                                            }}
                                          >
                                            {expandedDocs.has(doc.documentId) ? '▲ Thu gọn' : '▼ Xem thêm'}
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                    <span className="chip status published">Approved</span>
                                    {/* Processing Status Badge */}
                                    {doc.processingStatus === 'completed' && (
                                      <span className="chip" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>✓ Indexed</span>
                                    )}
                                    {doc.processingStatus === 'failed' && (
                                      <span className="chip" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>⚠ Processing Failed</span>
                                    )}
                                    {(doc.processingStatus === 'pending' || doc.processingStatus === 'processing') && (
                                      <span className="chip" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>⏳ Processing...</span>
                                    )}
                                    {/* Reprocess Button for Failed Documents */}
                                    {doc.processingStatus === 'failed' && (
                                      <button
                                        onClick={() => handleReprocessDocument(doc.documentId)}
                                        disabled={processingDocId === doc.documentId}
                                        style={{
                                          padding: '0.5rem 0.75rem',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.4rem',
                                          backgroundColor: '#f59e0b',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                        }}
                                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d97706')}
                                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f59e0b')}
                                        title="Reprocess this document"
                                      >
                                        {processingDocId === doc.documentId ? (
                                          <Loader size={14} className="animate-spin" />
                                        ) : (
                                          <RefreshCw size={14} />
                                        )}
                                        Reprocess
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDownload(doc.documentId, doc.title)}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                                      title="Download document"
                                    >
                                      <Download size={16} />
                                      Download
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDocument(doc.documentId, doc.title)}
                                      disabled={processingDocId === doc.documentId}
                                      style={{
                                        padding: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
                                      title="Delete document"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                                <div style={{
                                  display: 'flex',
                                  gap: '1rem',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '0.5rem',
                                  paddingTop: '0.5rem',
                                  borderTop: '1px solid var(--border-color)'
                                }}>
                                  <span>📁 {doc.mimeType}</span>
                                  <span>📊 {documentService.formatFileSize(doc.fileSize)}</span>
                                  <span>👤 {doc.uploadedByName || 'Unknown'}</span>
                                  <span>🕒 {formatDateVN(doc.createdAt)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Part 3: Rejected Documents */}
                      <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <X size={18} style={{ color: '#ef4444' }} /> Rejected Documents
                        </h4>
                        {!rejectedDocuments || rejectedDocuments.length === 0 ? (
                          <p className="empty-description">No rejected documents.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {rejectedDocuments.map((doc, idx) => (
                              <div key={idx} style={{
                                border: '1px solid #fee',
                                borderRadius: '8px',
                                padding: '1rem',
                                backgroundColor: '#fef2f2'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem', gap: '1rem' }}>
                                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, wordBreak: 'break-word', color: '#1e293b' }}>{doc.title}</h4>
                                    {doc.description && (
                                      <>
                                        <p style={{
                                          margin: '0.25rem 0 0 0',
                                          fontSize: '0.875rem',
                                          color: '#475569',
                                          ...(expandedDocs.has(doc.documentId) ? {} : {
                                            maxHeight: '3rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical' as any,
                                          }),
                                        }}>
                                          Uploaded file: {doc.description}
                                        </p>
                                        {doc.description.length > 100 && (
                                          <button
                                            onClick={() => toggleDocExpand(doc.documentId)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              color: '#3b82f6',
                                              fontSize: '0.75rem',
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                              padding: '0.25rem 0',
                                              marginTop: '0.25rem',
                                            }}
                                          >
                                            {expandedDocs.has(doc.documentId) ? '▲ Thu gọn' : '▼ Xem thêm'}
                                          </button>
                                        )}
                                      </>
                                    )}
                                    {doc.rejectionReason && (
                                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fecaca', borderRadius: '4px', fontSize: '0.875rem' }}>
                                        <strong style={{ color: '#dc2626' }}>Rejection Reason:</strong>{' '}
                                        <span style={{ color: '#7f1d1d' }}>{doc.rejectionReason}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                    <span className="chip" style={{ backgroundColor: '#fecaca', color: '#991b1b' }}>Rejected</span>
                                    <button
                                      onClick={() => handleDownload(doc.documentId, doc.title)}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                                      title="Download document"
                                    >
                                      <Download size={16} />
                                      Download
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDocument(doc.documentId, doc.title)}
                                      disabled={processingDocId === doc.documentId}
                                      style={{
                                        padding: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
                                      title="Delete document"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                                <div style={{
                                  display: 'flex',
                                  gap: '1rem',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '0.5rem',
                                  paddingTop: '0.5rem',
                                  borderTop: '1px solid var(--border-color)'
                                }}>
                                  <span>📁 {doc.mimeType}</span>
                                  <span>📊 {documentService.formatFileSize(doc.fileSize)}</span>
                                  <span>👤 {doc.uploadedByName || 'Unknown'}</span>
                                  <span>🕒 {formatDateVN(doc.createdAt)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(activeTab === 'outcome' || activeTab === 'challenge') && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {suggestionsLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <Loader className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Loading suggestions...</p>
                        </div>
                      ) : suggestionsError ? (
                        <p className="empty-description" style={{ color: 'red' }}>{suggestionsError}</p>
                      ) : (
                        <>
                          {/* Part 1: Pending Requests */}
                          <div>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <AlertTriangle size={18} className="text-warning" /> Pending Requests
                            </h4>
                            {pendingSuggestions.filter(s => s.contentType === (activeTab === 'outcome' ? SuggestionContentType.LearningOutcome : SuggestionContentType.CommonChallenge)).length === 0 ? (
                              <p className="empty-description">No pending requests.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {pendingSuggestions
                                  .filter(s => s.contentType === (activeTab === 'outcome' ? SuggestionContentType.LearningOutcome : SuggestionContentType.CommonChallenge))
                                  .map(suggestion => (
                                    <div key={suggestion.id} style={{
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '8px',
                                      padding: '1rem',
                                      backgroundColor: 'var(--bg-secondary)'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{suggestion.content}</p>
                                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            Suggested by: <strong>{suggestion.suggestedByUserName || 'Unknown'}</strong> • {formatDateVN(suggestion.createdAt)}
                                          </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                          <button
                                            onClick={() => handleApproveSuggestion(suggestion.id)}
                                            disabled={processingSuggestionId === suggestion.id}
                                            style={{
                                              padding: '0.6rem 1.2rem',
                                              fontSize: '0.875rem',
                                              fontWeight: 600,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.5rem',
                                              backgroundColor: '#10b981',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '8px',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s ease',
                                              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                                            title="Approve suggestion"
                                          >
                                            {processingSuggestionId === suggestion.id ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => openRejectModal(suggestion.id, 'suggestion')}
                                            disabled={processingSuggestionId === suggestion.id}
                                            style={{
                                              padding: '0.6rem 1.2rem',
                                              fontSize: '0.875rem',
                                              fontWeight: 600,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.5rem',
                                              backgroundColor: '#ef4444',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '8px',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s ease',
                                              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                                            title="Reject suggestion"
                                          >
                                            <X size={16} />
                                            Reject
                                          </button>
                                        </div>
                                      </div>
                                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                                        <span className="chip status draft">Pending</span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>

                          {/* Part 2: Approved Suggestions */}
                          <div>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <CheckSquare size={18} className="text-success" /> Approved
                            </h4>
                            {approvedSuggestions.filter(s => s.contentType === (activeTab === 'outcome' ? SuggestionContentType.LearningOutcome : SuggestionContentType.CommonChallenge)).length === 0 ? (
                              <p className="empty-description">No approved items.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {approvedSuggestions
                                  .filter(s => s.contentType === (activeTab === 'outcome' ? SuggestionContentType.LearningOutcome : SuggestionContentType.CommonChallenge))
                                  .map(suggestion => (
                                    <div key={suggestion.id} style={{
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '8px',
                                      padding: '1rem',
                                      backgroundColor: 'var(--bg-primary)'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{suggestion.content}</p>
                                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            Suggested by: <strong>{suggestion.suggestedByUserName || 'Unknown'}</strong> • {formatDateVN(suggestion.createdAt)}
                                            {suggestion.reviewedByUserName && suggestion.reviewedAt && (
                                              <> • Approved by: <strong>{suggestion.reviewedByUserName}</strong> on {formatDateVN(suggestion.reviewedAt)}</>
                                            )}
                                          </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                          <span className="chip status published">Approved</span>
                                          <button
                                            onClick={() => handleDeleteSuggestion(suggestion.id, suggestion.content)}
                                            disabled={processingSuggestionId === suggestion.id}
                                            style={{
                                              padding: '0.5rem',
                                              fontSize: '0.875rem',
                                              fontWeight: 600,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.5rem',
                                              backgroundColor: '#6b7280',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '8px',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s ease',
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
                                            title="Delete suggestion"
                                          >
                                            <X size={16} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>

                          {/* Part 3: Rejected Suggestions */}
                          <div>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <X size={18} style={{ color: '#ef4444' }} /> Rejected
                            </h4>
                            {rejectedSuggestions.filter(s => s.contentType === (activeTab === 'outcome' ? SuggestionContentType.LearningOutcome : SuggestionContentType.CommonChallenge)).length === 0 ? (
                              <p className="empty-description">No rejected items.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {rejectedSuggestions
                                  .filter(s => s.contentType === (activeTab === 'outcome' ? SuggestionContentType.LearningOutcome : SuggestionContentType.CommonChallenge))
                                  .map(suggestion => (
                                    <div key={suggestion.id} style={{
                                      border: '1px solid #fee',
                                      borderRadius: '8px',
                                      padding: '1rem',
                                      backgroundColor: '#fef2f2'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{suggestion.content}</p>
                                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            Suggested by: <strong>{suggestion.suggestedByUserName || 'Unknown'}</strong> • {formatDateVN(suggestion.createdAt)}
                                            {suggestion.reviewedByUserName && suggestion.reviewedAt && (
                                              <> • Rejected by: <strong>{suggestion.reviewedByUserName}</strong> on {formatDateVN(suggestion.reviewedAt)}</>
                                            )}
                                          </p>
                                          {suggestion.rejectionReason && (
                                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fee', borderRadius: '4px', fontSize: '0.875rem' }}>
                                              <strong style={{ color: '#dc2626' }}>Rejection Reason:</strong> {suggestion.rejectionReason}
                                            </div>
                                          )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                          <span className="chip" style={{ backgroundColor: '#fecaca', color: '#991b1b' }}>Rejected</span>
                                          <button
                                            onClick={() => handleDeleteSuggestion(suggestion.id, suggestion.content)}
                                            disabled={processingSuggestionId === suggestion.id}
                                            style={{
                                              padding: '0.5rem',
                                              fontSize: '0.875rem',
                                              fontWeight: 600,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.5rem',
                                              backgroundColor: '#6b7280',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '8px',
                                              cursor: 'pointer',
                                              transition: 'all 0.2s ease',
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
                                            title="Delete suggestion"
                                          >
                                            <X size={16} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="create-sidebar">
              <div className="preview-card">
                <h3 className="preview-title">Summary</h3>
                <div className="preview-content">
                  <div className="preview-item"><label className="preview-label">Course Code</label><p className="preview-value">{subject.code}</p></div>
                  <div className="preview-item"><label className="preview-label">Semester</label><p className="preview-value">Semester {getSemesterNumber(subject.semester)}</p></div>
                  <div className="preview-item"><label className="preview-label">Status</label><span className={`chip status ${subject.isActive ? 'published' : 'draft'}`}>{subject.isActive ? 'Active' : 'Inactive'}</span></div>
                  <div className="preview-item"><label className="preview-label">Credits</label><p className="preview-value">{subject.credits}</p></div>
                  <div className="preview-item"><label className="preview-label">Degree Level</label><p className="preview-value">{subject.degreeLevel || '-'}</p></div>
                  <div className="preview-item"><label className="preview-label">Grading Scale</label><p className="preview-value">{subject.scoringScale || '-'}</p></div>
                  <div className="preview-item"><label className="preview-label">Minimum Passing Average</label><p className="preview-value">{subject.minAvgMarkToPass || '-'}</p></div>
                  <div className="preview-item"><label className="preview-label">Approval</label><span className={`chip status ${subject.isApproved ? 'published' : 'draft'}`}>{subject.isApproved ? 'Approved' : 'Not approved'}</span></div>
                  <div className="preview-item"><label className="preview-label">Decision No.</label><p className="preview-value">{subject.decisionNo || '-'}</p></div>
                  <div className="preview-item"><label className="preview-label">Approved Date</label><p className="preview-value">{formatDateVN(subject.approvedDate)}</p></div>
                  <div className="meta-grid">
                    <div className="meta-item"><span className="meta-label">Documents</span><span className="meta-value">{approvedDocuments.length}</span></div>
                    <div className="meta-item"><span className="meta-label">Outcome</span><span className="meta-value">{subject.learningOutcomes?.length || 0}</span></div>
                    <div className="meta-item"><span className="meta-label">Challenge</span><span className="meta-value">{subject.commonChallenges?.length || 0}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {
        showRejectModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                Reject {rejectModalType === 'document' ? 'Document' : 'Suggestion'}
              </h3>
              <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                Please provide a reason for rejection. This will be shown to the submitter.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason (minimum 10 characters)..."
                maxLength={500}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  border: `2px solid ${rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ? '#ef4444' : '#e2e8f0'}
                autoFocus
              />
              {/* Character counter and helper text */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.5rem',
                fontSize: '0.75rem',
              }}>
                <span style={{
                  color: rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ? '#ef4444' : '#64748b'
                }}>
                  {rejectReason.trim().length > 0 && rejectReason.trim().length < 10
                    ? `Need ${10 - rejectReason.trim().length} more characters`
                    : 'Minimum 10 characters'}
                </span>
                <span style={{
                  color: rejectReason.trim().length > 450 ? '#f59e0b' : '#64748b'
                }}>
                  {rejectReason.trim().length}/500
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectingId(null); }}
                  style={{
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim() || rejectSubmitting}
                  style={{
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    backgroundColor: rejectSubmitting || !rejectReason.trim() ? '#fca5a5' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: rejectSubmitting || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {rejectSubmitting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteModal.type === 'document' ? 'Document' : 'Suggestion'}`}
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Document Preview Modal */}
      {previewModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}
          onClick={closePreviewModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: 'white',
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={22} />
                Document Preview: {previewModal.documentTitle}
              </h3>
              <button
                onClick={closePreviewModal}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'white',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '1.5rem',
              maxHeight: 'calc(90vh - 80px)',
              overflowY: 'auto',
            }}>
              {previewModal.loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <Loader className="animate-spin" size={48} style={{ margin: '0 auto', color: '#8b5cf6' }} />
                  <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading preview thumbnails...</p>
                </div>
              ) : previewModal.previewUrls.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <FileText size={64} style={{ color: '#d1d5db', margin: '0 auto' }} />
                  <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '1rem' }}>
                    No preview available yet.
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    Preview thumbnails are being generated. Please try again in a few moments.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem',
                }}>
                  {previewModal.previewUrls.map((url, index) => (
                    <div
                      key={index}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: '#f9fafb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#f3f4f6',
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        fontWeight: 500,
                      }}>
                        Slide {index + 1}
                      </div>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Slide ${index + 1}`}
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            cursor: 'zoom-in',
                          }}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%23f3f4f6" width="200" height="150"/><text x="50%" y="50%" fill="%236b7280" font-family="system-ui" font-size="12" text-anchor="middle">Image not found</text></svg>';
                          }}
                        />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageWrapper >
  );
}