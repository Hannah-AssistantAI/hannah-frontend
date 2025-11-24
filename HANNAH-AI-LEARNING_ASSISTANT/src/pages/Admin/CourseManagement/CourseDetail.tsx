import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, FileText, AlertTriangle, CheckSquare, Map, ChevronRight, Loader, Check, X, Download } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import subjectService, { type Subject } from '../../../service/subjectService';
import documentService, { type Document } from '../../../service/documentService';
import suggestionService, { type Suggestion, SuggestionStatus, SuggestionContentType } from '../../../service/suggestionService';
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

  const handleReject = async (documentId: number) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      setProcessingDocId(documentId);
      await documentService.rejectDocument(documentId, reason);
      toast.success('Document rejected');
      await fetchPendingDocuments();
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Failed to reject document');
    } finally {
      setProcessingDocId(null);
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

  const handleRejectSuggestion = async (suggestionId: number) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      setProcessingSuggestionId(suggestionId);
      await suggestionService.rejectSuggestion(suggestionId, reason);
      toast.success('Suggestion rejected.');
      await fetchSuggestions(); // Refresh list
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      toast.error('Failed to reject suggestion.');
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
            <div className="course-actions" style={{ gap: 8 }}>
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
                  <div className="time-tools">
                    <div className="time-box"><h4 className="subsection-title">Time Allocation</h4><p>{subject.timeAllocation || 'Not specified'}</p></div>
                    <div className="tools-box"><h4 className="subsection-title">Tools</h4><div className="tags-wrapper"><span className="tag">{subject.tools || 'Not specified'}</span></div></div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Prerequisites</h3>
                <div className="form-content">
                  <div className="tags-wrapper">
                    {subject.prerequisites && subject.prerequisites.length > 0
                      ? subject.prerequisites.map((p, i) => <span key={i} className="tag tag-prerequisite">{p}</span>)
                      : <p className="empty-description" style={{ margin: 0 }}>None available.</p>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Material</h3>
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
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                  <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{doc.title}</h4>
                                    {doc.description && (
                                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {doc.description}
                                      </p>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
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
                                      onClick={() => handleReject(doc.documentId)}
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
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                  <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{doc.title}</h4>
                                    {doc.description && (
                                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {doc.description}
                                      </p>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                  <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{doc.title}</h4>
                                    {doc.description && (
                                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {doc.description}
                                      </p>
                                    )}
                                    {doc.rejectionReason && (
                                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fee', borderRadius: '4px', fontSize: '0.875rem' }}>
                                        <strong style={{ color: '#dc2626' }}>Rejection Reason:</strong> {doc.rejectionReason}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                            onClick={() => handleRejectSuggestion(suggestion.id)}
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
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
    </AdminPageWrapper >
  );
}