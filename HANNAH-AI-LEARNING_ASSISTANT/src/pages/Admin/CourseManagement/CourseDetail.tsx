import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, FileText, AlertTriangle, CheckSquare, Map, ChevronRight, Loader, Check, X, Download } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import subjectService, { type Subject } from '../../../service/subjectService';
import documentService, { type Document } from '../../../service/documentService';
import suggestionService, { type Suggestion, SuggestionStatus, SuggestionContentType } from '../../../service/suggestionService';
import SyllabusImporter from './SyllabusImporter';
import './CourseManagement.css';

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
    if (!rejectReason.trim() || !rejectingId) {
      toast.error('Please enter a rejection reason');
      return;
    }

    try {
      setRejectSubmitting(true);
      if (rejectModalType === 'document') {
        setProcessingDocId(rejectingId);
        await documentService.rejectDocument(rejectingId, rejectReason);
        toast.success('Document rejected');
        await fetchPendingDocuments();
        setProcessingDocId(null);
      } else {
        setProcessingSuggestionId(rejectingId);
        await suggestionService.rejectSuggestion(rejectingId, rejectReason);
        toast.success('Suggestion rejected');
        await fetchSuggestions();
        setProcessingSuggestionId(null);
      }
      setShowRejectModal(false);
      setRejectReason('');
      setRejectingId(null);
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject');
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



  const handleDeleteSuggestion = async (suggestionId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this suggestion? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setProcessingSuggestionId(suggestionId);
      await suggestionService.deleteSuggestion(suggestionId);
      toast.success('Suggestion deleted successfully.');
      await fetchSuggestions(); // Refresh list
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast.error('Failed to delete suggestion.');
    } finally {
      setProcessingSuggestionId(null);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this document? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setProcessingDocId(documentId);
      await documentService.deleteDocument(documentId.toString());
      toast.success('Document deleted successfully.');
      await fetchApprovedDocuments(); // Refresh list
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document.');
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
                    <span>Semester: {subject.semester}</span>
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
                    <div className="course-footer-item"><Clock size={16} /> Created: {new Date(subject.createdAt).toLocaleDateString()}</div>
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
                    <div className="info-item"><label className="preview-label">Approved Date</label><p className="preview-value">{subject.approvedDate ? new Date(subject.approvedDate).toLocaleDateString() : '-'}</p></div>
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
                                  <span>🕒 {new Date(doc.createdAt).toLocaleDateString()}</span>
                                  <span className="chip status draft">Pending Approval</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Part 2: Current Documents */}
                      <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckSquare size={18} className="text-success" /> Current Documents
                        </h4>
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
                                      onClick={() => handleDeleteDocument(doc.documentId)}
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
                                  <span>🕒 {new Date(doc.createdAt).toLocaleDateString()}</span>
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
                                      onClick={() => handleDeleteDocument(doc.documentId)}
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
                                  <span>🕒 {new Date(doc.createdAt).toLocaleDateString()}</span>
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
                                            Suggested by: <strong>{suggestion.suggestedByUserName || 'Unknown'}</strong> • {new Date(suggestion.createdAt).toLocaleDateString()}
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
                                            Suggested by: <strong>{suggestion.suggestedByUserName || 'Unknown'}</strong> • {new Date(suggestion.createdAt).toLocaleDateString()}
                                            {suggestion.reviewedByUserName && suggestion.reviewedAt && (
                                              <> • Approved by: <strong>{suggestion.reviewedByUserName}</strong> on {new Date(suggestion.reviewedAt).toLocaleDateString()}</>
                                            )}
                                          </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                          <span className="chip status published">Approved</span>
                                          <button
                                            onClick={() => handleDeleteSuggestion(suggestion.id)}
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
                                            Suggested by: <strong>{suggestion.suggestedByUserName || 'Unknown'}</strong> • {new Date(suggestion.createdAt).toLocaleDateString()}
                                            {suggestion.reviewedByUserName && suggestion.reviewedAt && (
                                              <> • Rejected by: <strong>{suggestion.reviewedByUserName}</strong> on {new Date(suggestion.reviewedAt).toLocaleDateString()}</>
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
                                            onClick={() => handleDeleteSuggestion(suggestion.id)}
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
                  <div className="preview-item"><label className="preview-label">Semester</label><p className="preview-value">Semester {subject.semester}</p></div>
                  <div className="preview-item"><label className="preview-label">Status</label><span className={`chip status ${subject.isActive ? 'published' : 'draft'}`}>{subject.isActive ? 'Active' : 'Inactive'}</span></div>
                  <div className="preview-item"><label className="preview-label">Credits</label><p className="preview-value">{subject.credits}</p></div>
                  <div className="preview-item"><label className="preview-label">Degree Level</label><p className="preview-value">{subject.degreeLevel || '-'}</p></div>
                  <div className="preview-item"><label className="preview-label">Grading Scale</label><p className="preview-value">{subject.scoringScale || '-'}</p></div>
                  <div className="preview-item"><label className="preview-label">Minimum Passing Average</label><p className="preview-value">{subject.minAvgMarkToPass || '-'}</p></div>
                  <div className="preview-item"><label className="preview-label">Approval</label><span className={`chip status ${subject.isApproved ? 'published' : 'draft'}`}>{subject.isApproved ? 'Approved' : 'Not approved'}</span></div>
                  <div className="preview-item"><label className="preview-label">Decision No.</label><p className="preview-value">{subject.decisionNo || '-'}</p></div>
                  <div className="preview-item"><label className="preview-label">Approved Date</label><p className="preview-value">{subject.approvedDate ? new Date(subject.approvedDate).toLocaleDateString() : '-'}</p></div>
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
                placeholder="Enter rejection reason..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                autoFocus
              />
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
    </AdminPageWrapper >
  );
}