import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, FileText, AlertTriangle, CheckSquare, Map, ChevronRight, Loader, Check, X, Download } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import subjectService, { type Subject } from '../../../service/subjectService';
import documentService, { type Document } from '../../../service/documentService';
import './CourseManagement.css';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'document' | 'outcome' | 'challenge'>('document');
  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [processingDocId, setProcessingDocId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      const fetchSubjectDetail = async () => {
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
      fetchSubjectDetail();
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'document') {
      fetchPendingDocuments();
    }
  }, [id, activeTab]);

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
      // Refresh the list
      await fetchPendingDocuments();
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Failed to reject document');
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
                <h3 className="form-section-title">Learning Outcomes</h3>
                <div className="form-content">
                  <div className="tags-wrapper">
                    {subject.learningOutcomes && subject.learningOutcomes.length > 0
                      ? subject.learningOutcomes.map((o, i) => <span key={i} className="tag tag-outcome">{o}</span>)
                      : <p className="empty-description" style={{ margin: 0 }}>None available.</p>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Common Challenges</h3>
                <div className="form-content">
                  <div className="tags-wrapper">
                    {subject.commonChallenges && subject.commonChallenges.length > 0
                      ? subject.commonChallenges.map((c, i) => <span key={i} className="tag tag-challenge">{c}</span>)
                      : <p className="empty-description" style={{ margin: 0 }}>None available.</p>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Teacher Upload Requests</h3>
                <div className="form-content">
                  <div className="tabs">
                    <button className={`tab ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}>
                      <FileText size={16} /> Documents <span className="count-chip">{pendingDocuments.length}</span>
                    </button>
                    <button className={`tab ${activeTab === 'outcome' ? 'active' : ''}`} onClick={() => setActiveTab('outcome')}>
                      <CheckSquare size={16} /> Learning Outcome <span className="count-chip">0</span>
                    </button>
                    <button className={`tab ${activeTab === 'challenge' ? 'active' : ''}`} onClick={() => setActiveTab('challenge')}>
                      <AlertTriangle size={16} /> Common Challenge <span className="count-chip">0</span>
                    </button>
                  </div>

                  {activeTab === 'document' && (
                    <div style={{ marginTop: '1rem' }}>
                      {loadingDocuments ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <Loader className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Loading documents...</p>
                        </div>
                      ) : pendingDocuments.length === 0 ? (
                        <p className="empty-description">No pending documents.</p>
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
                                    onClick={() => handleApprove(doc.documentId)}
                                    disabled={processingDocId === doc.documentId}
                                    className="btn-primary"
                                    style={{
                                      padding: '0.5rem 1rem',
                                      fontSize: '0.875rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      backgroundColor: '#28a745',
                                      borderColor: '#28a745'
                                    }}
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
                                    className="btn-secondary"
                                    style={{
                                      padding: '0.5rem 1rem',
                                      fontSize: '0.875rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      backgroundColor: '#dc3545',
                                      borderColor: '#dc3545',
                                      color: 'white'
                                    }}
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
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'outcome' && (
                    <p className="empty-description">No learning outcome requests yet.</p>
                  )}

                  {activeTab === 'challenge' && (
                    <p className="empty-description">No common challenge requests yet.</p>
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
                    <div className="meta-item"><span className="meta-label">Documents</span><span className="meta-value">0</span></div>
                    <div className="meta-item"><span className="meta-label">Outcome</span><span className="meta-value">0</span></div>
                    <div className="meta-item"><span className="meta-label">Challenge</span><span className="meta-value">0</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}