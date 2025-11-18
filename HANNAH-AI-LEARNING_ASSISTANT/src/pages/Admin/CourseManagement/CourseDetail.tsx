import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, FileText, AlertTriangle, CheckSquare, Map, ChevronRight, Loader } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import subjectService, { type Subject } from '../../../service/subjectService';
import './CourseManagement.css';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'document' | 'outcome' | 'challenge'>('document');

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
                <h3 className="form-section-title">Learning Outcomes</h3>
                <div className="form-content"><div className="tags-wrapper">{subject.learningOutcomes?.map((o, i) => <span key={i} className="tag tag-outcome">{o}</span>) || 'None'}</div></div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Common Challenges</h3>
                <div className="form-content"><div className="tags-wrapper">{subject.commonChallenges?.map((c, i) => <span key={i} className="tag tag-challenge">{c}</span>) || 'None'}</div></div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Teacher Upload Requests</h3>
                <div className="form-content">
                  <div className="tabs">
                    <button className={`tab ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}><FileText size={16} /> Documents <span className="count-chip">0</span></button>
                    <button className={`tab ${activeTab === 'outcome' ? 'active' : ''}`} onClick={() => setActiveTab('outcome')}><CheckSquare size={16} /> Learning Outcome <span className="count-chip">0</span></button>
                    <button className={`tab ${activeTab === 'challenge' ? 'active' : ''}`} onClick={() => setActiveTab('challenge')}><AlertTriangle size={16} /> Common Challenge <span className="count-chip">0</span></button>
                  </div>
                  <p className="empty-description">No documents yet.</p>
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