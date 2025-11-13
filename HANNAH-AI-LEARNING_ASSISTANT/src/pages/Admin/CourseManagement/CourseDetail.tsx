import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Clock, FileText, AlertTriangle, CheckSquare, Map, X, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import './CourseManagement.css';

type Roadmap = {
  id: number;
  name: string;
  code: string;
  specialty: string;
  semester: number;
  description: string;
  learningOutcomes: string[];
  challenges: string[];
  courses: number;
  status: string;
  lastUpdated: string;
  credits: number;
  degreeLevel: 'Undergraduate' | 'Graduate' | 'Postgraduate' | string;
  timeAllocation: { lecture: number; lab: number; selfStudy: number };
  tools: string[];
  scoringScale: '10-point' | '4-point' | string;
  isApproved: boolean;
  decisionNo?: string;
  minAvgMarkToPass: number; // e.g., 5.0 (10-point) or 2.0 (4-point)
  approvedDate?: string; // ISO or display string
};

// Temporary mock data. In a real app, fetch by id from API.
const roadmaps: Roadmap[] = [
  {
    id: 1,
    name: 'Introduction to Programming',
    code: 'PRF192',
    specialty: 'ES',
    semester: 1,
    description: 'Basic programming concepts using C language',
    learningOutcomes: [
      'Understand basic programming concepts',
      'Write simple C programs',
      'Debug code effectively',
    ],
    challenges: ['Pointer concepts', 'Memory management', 'Debugging'],
    courses: 8,
    status: 'published',
    lastUpdated: '01/01/2024',
    credits: 24,
    degreeLevel: 'Undergraduate',
    timeAllocation: { lecture: 30, lab: 15, selfStudy: 45 },
    tools: ['GCC', 'VS Code', 'GDB'],
    scoringScale: '10-point',
    isApproved: true,
    decisionNo: 'QD-PRF-2024-01',
    minAvgMarkToPass: 5.0,
    approvedDate: '2024-01-15',
  },
  {
    id: 2,
    name: 'Data Structures & Algorithms',
    code: 'CSD201',
    specialty: 'IS',
    semester: 3,
    description: 'Advanced data structures and algorithm design',
    learningOutcomes: [
      'Implement common data structures',
      'Analyze algorithm complexity',
      'Solve optimization problems',
    ],
    challenges: ['Graph algorithms', 'Dynamic programming', 'Time complexity'],
    courses: 6,
    status: 'draft',
    lastUpdated: '15/10/2024',
    credits: 18,
    degreeLevel: 'Undergraduate',
    timeAllocation: { lecture: 36, lab: 18, selfStudy: 66 },
    tools: ['C++', 'Python', 'LeetCode'],
    scoringScale: '10-point',
    isApproved: false,
    decisionNo: undefined,
    minAvgMarkToPass: 5.0,
    approvedDate: undefined,
  },
  {
    id: 3,
    name: 'Software Engineering',
    code: 'SWE301',
    specialty: 'JS',
    semester: 5,
    description: 'Software development methodologies and practices',
    learningOutcomes: [
      'Apply SDLC models',
      'Design software architecture',
      'Manage software projects',
    ],
    challenges: ['Requirements analysis', 'Design patterns', 'Testing strategies'],
    courses: 7,
    status: 'published',
    lastUpdated: '10/10/2024',
    credits: 21,
    degreeLevel: 'Undergraduate',
    timeAllocation: { lecture: 30, lab: 10, selfStudy: 50 },
    tools: ['Jira', 'Git', 'Draw.io'],
    scoringScale: '10-point',
    isApproved: true,
    decisionNo: 'QD-SWE-2024-10',
    minAvgMarkToPass: 5.0,
    approvedDate: '2024-10-20',
  },
];

// Mock teacher uploads for the course
interface TeacherUpload {
  id: number;
  courseId: number;
  teacher: string;
  type: 'document' | 'outcome' | 'challenge';
  title: string;
  submittedAt: string;
  description?: string;
  link?: string;
  status: 'pending' | 'approved' | 'rejected';
  files?: Array<{ name: string; size: number }>; // Only for document type
}

const teacherUploads: TeacherUpload[] = [
  {
    id: 1001,
    courseId: 1,
    teacher: 'Nguyễn Văn A',
    type: 'document',
    title: 'Session 1 Materials',
    submittedAt: '2025-10-01 10:30',
    status: 'pending',
    files: [
      { name: '01_gioi-thieu-C.pdf', size: 1_245_123 },
      { name: '01_vi-du-pointer.c', size: 8_532 },
    ],
  },
  {
    id: 1002,
    courseId: 1,
    teacher: 'Trần Thị B',
    type: 'outcome',
    title: 'Add: Understanding function pointers',
    submittedAt: '2025-10-02 09:10',
    description: 'Propose adding an outcome about function pointers and their usage.',
    status: 'pending',
  },
  {
    id: 1003,
    courseId: 1,
    teacher: 'Lê Văn C',
    type: 'challenge',
    title: 'Challenge: Managing dynamic memory',
    submittedAt: '2025-10-03 14:05',
    description: 'Students often confuse malloc and calloc; propose adding more examples.',
    status: 'approved',
  },
  {
    id: 1004,
    courseId: 2,
    teacher: 'Phạm D',
    type: 'document',
    title: 'Advanced Linked List Exercises',
    submittedAt: '2025-10-04 08:45',
    link: '#',
    status: 'pending',
  },
];

// Utility kept previously for labels; not needed with tab separation.

export default function CourseDetail() {
  const { id } = useParams();
  const courseId = Number(id);
  const course = roadmaps.find((r) => r.id === courseId);

  const [uploads, setUploads] = useState<TeacherUpload[]>(teacherUploads);
  const [activeTab, setActiveTab] = useState<'document' | 'outcome' | 'challenge'>('document');

  const byCourse = uploads.filter((u) => u.courseId === courseId);
  const documents = byCourse.filter((u) => u.type === 'document');
  const outcomes = byCourse.filter((u) => u.type === 'outcome');
  const challenges = byCourse.filter((u) => u.type === 'challenge');

  const formatSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let b = bytes;
    while (b >= 1024 && i < units.length - 1) {
      b /= 1024;
      i++;
    }
    return `${b.toFixed(b < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  };

  type Toast = { id: number; type: 'success' | 'error'; message: string };
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const t = { id, ...toast } as Toast;
    setToasts((prev) => [t, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 2500);
  };

  const handleApprove = (id: number) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'approved' } : u)));
    addToast({ type: 'success', message: `Request #${id} approved` });
  };

  const handleReject = (id: number) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'rejected' } : u)));
    addToast({ type: 'error', message: `Request #${id} rejected` });
  };

  return (
    <AdminPageWrapper title="Course Detail">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-icon">
              {t.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            </div>
            <div className="toast-message">{t.message}</div>
          </div>
        ))}
      </div>
      <div className="course-container">
        <div className="course-header">
          <nav className="breadcrumb">
            <Link className="breadcrumb-link" to="/admin">Admin</Link>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <Link className="breadcrumb-link" to="/admin/course-management">Course Management</Link>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <span className="breadcrumb-current">{course?.code ?? 'N/A'}</span>
          </nav>

          <div className="course-header-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Map size={24} />
              <div>
                <h2 className="course-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {course?.name ?? 'Course not found'}
                  {course && (
                    <span className="chip code">{course.code}</span>
                  )}
                </h2>
                {course && (
                  <p className="course-subtitle" style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>Specialty: {course.specialty}</span>
                    <span className="dot">•</span>
                    <span>Semester: {course.semester}</span>
                    <span className="dot">•</span>
                    <span className={`chip status ${course.status}`}>{course.status}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="course-actions" style={{ gap: 8 }}>
              <Link to="/admin/course-management" className="btn-secondary" aria-label="Back to list">
                Back
              </Link>
            </div>
          </div>
        </div>

        {!course ? (
          <div className="empty-state">
            <Map className="empty-icon" size={64} />
            <p className="empty-title">Course not found</p>
            <p className="empty-description">Please check the URL or go back to the list</p>
          </div>
        ) : (
          <div className="create-layout">
            <div className="create-main">
              {/* Course description */}
              <div className="form-section">
                <h3 className="form-section-title">Course Description</h3>
                <div className="form-content">
                  <p className="course-description" style={{ marginTop: 0 }}>{course.description}</p>
                  <div className="course-footer">
                    <div className="course-footer-item">
                      <Clock size={16} /> Updated: {course.lastUpdated}
                    </div>
                  </div>
                </div>
              </div>

              {/* Course info */}
              <div className="form-section">
                <h3 className="form-section-title">Course Information</h3>
                <div className="form-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <label className="preview-label">Degree Level</label>
                      <p className="preview-value">{course.degreeLevel}</p>
                    </div>
                    <div className="info-item">
                      <label className="preview-label">Grading Scale</label>
                      <p className="preview-value">{course.scoringScale}</p>
                    </div>
                    <div className="info-item">
                      <label className="preview-label">Minimum Passing Average</label>
                      <p className="preview-value">{course.minAvgMarkToPass}</p>
                    </div>
                    <div className="info-item">
                      <label className="preview-label">Approval</label>
                      <span className={`chip status ${course.isApproved ? 'published' : 'draft'}`}>
                        {course.isApproved ? 'Approved' : 'Not approved'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label className="preview-label">Decision No.</label>
                      <p className="preview-value">{course.decisionNo ?? '-'}</p>
                    </div>
                    <div className="info-item">
                      <label className="preview-label">Approved Date</label>
                      <p className="preview-value">{course.approvedDate ?? '-'}</p>
                    </div>
                  </div>

                  <div className="time-tools">
                    <div className="time-box">
                      <h4 className="subsection-title">Time Allocation</h4>
                      <div className="meta-grid">
                        <div className="meta-item"><span className="meta-label">Lecture</span><span className="meta-value">{course.timeAllocation.lecture}h</span></div>
                        <div className="meta-item"><span className="meta-label">Lab</span><span className="meta-value">{course.timeAllocation.lab}h</span></div>
                        <div className="meta-item"><span className="meta-label">Self-study</span><span className="meta-value">{course.timeAllocation.selfStudy}h</span></div>
                      </div>
                    </div>
                    <div className="tools-box">
                      <h4 className="subsection-title">Tools</h4>
                      <div className="tags-wrapper">
                        {course.tools.map((t, i) => (
                          <span key={i} className="tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning outcomes */}
              <div className="form-section">
                <h3 className="form-section-title">Learning Outcomes</h3>
                <div className="form-content">
                  <div className="tags-wrapper">
                    {course.learningOutcomes.map((o, i) => (
                      <span key={i} className="tag tag-outcome">{o}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Challenges */}
              <div className="form-section">
                <h3 className="form-section-title">Common Challenges</h3>
                <div className="form-content">
                  <div className="tags-wrapper">
                    {course.challenges.map((c, i) => (
                      <span key={i} className="tag tag-challenge">{c}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Teacher uploads with tabs */}
              <div className="form-section">
                <h3 className="form-section-title">Teacher Upload Requests</h3>
                <div className="form-content">
                  <div className="tabs">
                    <button className={`tab ${activeTab === 'document' ? 'active' : ''}`} onClick={() => setActiveTab('document')}>
                      <FileText size={16} /> Documents <span className="count-chip">{documents.length}</span>
                    </button>
                    <button className={`tab ${activeTab === 'outcome' ? 'active' : ''}`} onClick={() => setActiveTab('outcome')}>
                      <CheckSquare size={16} /> Learning Outcome <span className="count-chip">{outcomes.length}</span>
                    </button>
                    <button className={`tab ${activeTab === 'challenge' ? 'active' : ''}`} onClick={() => setActiveTab('challenge')}>
                      <AlertTriangle size={16} /> Common Challenge <span className="count-chip">{challenges.length}</span>
                    </button>
                  </div>

                  {/* Documents Tab */}
                  {activeTab === 'document' && (
                    documents.length === 0 ? (
                      <p className="empty-description">No documents yet.</p>
                    ) : (
                      <div className="courses-grid">
                        {documents.map((u) => (
                          <div key={u.id} className={`course-card card-status-${u.status}`}>
                            <div className="course-card-content">
                              <div className="course-card-header">
                                <h3 className="course-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <FileText size={18} /> {u.title}
                                </h3>
                                <span className={`status-badge ${u.status}`}>{u.status}</span>
                              </div>
                              <div className="course-badges">
                                <span className="course-code">Teacher: {u.teacher}</span>
                                <span className="semester-badge">{u.submittedAt}</span>
                              </div>
                              <div className="file-list">
                                {(u.files ?? []).map((f, idx) => (
                                  <div key={idx} className="file-row">
                                    <div className="file-main">
                                      <FileText size={16} />
                                      <span className="file-name">{f.name}</span>
                                    </div>
                                    <span className="file-size">{formatSize(f.size)}</span>
                                  </div>
                                ))}
                              </div>
                              {u.status === 'pending' && (
                                <div className="action-buttons" style={{ marginTop: 12 }}>
                                  <button className="btn-approve" onClick={() => handleApprove(u.id)}>
                                    <CheckSquare size={18} /> Accept
                                  </button>
                                  <button className="btn-reject" onClick={() => handleReject(u.id)}>
                                    <X size={18} /> Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Outcomes Tab */}
                  {activeTab === 'outcome' && (
                    outcomes.length === 0 ? (
                      <p className="empty-description">No Learning Outcome proposals yet.</p>
                    ) : (
                      <div className="courses-grid">
                        {outcomes.map((u) => (
                          <div key={u.id} className={`course-card card-status-${u.status}`}>
                            <div className="course-card-content">
                              <div className="course-card-header">
                                <h3 className="course-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <CheckSquare size={18} /> {u.title}
                                </h3>
                                <span className={`status-badge ${u.status}`}>{u.status}</span>
                              </div>
                              <div className="course-badges">
                                <span className="course-code">Teacher: {u.teacher}</span>
                                <span className="semester-badge">{u.submittedAt}</span>
                              </div>
                              {u.description && (
                                <p className="course-description">{u.description}</p>
                              )}
                              {u.status === 'pending' && (
                                <div className="action-buttons" style={{ marginTop: 12 }}>
                                  <button className="btn-approve" onClick={() => handleApprove(u.id)}>
                                    <CheckSquare size={18} /> Accept
                                  </button>
                                  <button className="btn-reject" onClick={() => handleReject(u.id)}>
                                    <X size={18} /> Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Challenges Tab */}
                  {activeTab === 'challenge' && (
                    challenges.length === 0 ? (
                      <p className="empty-description">No Common Challenge proposals yet.</p>
                    ) : (
                      <div className="courses-grid">
                        {challenges.map((u) => (
                          <div key={u.id} className={`course-card card-status-${u.status}`}>
                            <div className="course-card-content">
                              <div className="course-card-header">
                                <h3 className="course-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <AlertTriangle size={18} /> {u.title}
                                </h3>
                                <span className={`status-badge ${u.status}`}>{u.status}</span>
                              </div>
                              <div className="course-badges">
                                <span className="course-code">Teacher: {u.teacher}</span>
                                <span className="semester-badge">{u.submittedAt}</span>
                              </div>
                              {u.description && (
                                <p className="course-description">{u.description}</p>
                              )}
                              {u.status === 'pending' && (
                                <div className="action-buttons" style={{ marginTop: 12 }}>
                                  <button className="btn-approve" onClick={() => handleApprove(u.id)}>
                                    <CheckSquare size={18} /> Accept
                                  </button>
                                  <button className="btn-reject" onClick={() => handleReject(u.id)}>
                                    <X size={18} /> Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar summary */}
            <div className="create-sidebar">
              <div className="preview-card">
                  <h3 className="preview-title">Summary</h3>
                <div className="preview-content">
                  <div className="preview-item">
                    <label className="preview-label">Course Code</label>
                    <p className="preview-value">{course.code}</p>
                  </div>
                  <div className="preview-item">
                    <label className="preview-label">Specialty</label>
                    <span className="preview-badge">{course.specialty}</span>
                  </div>
                  <div className="preview-item">
                    <label className="preview-label">Semester</label>
                    <p className="preview-value">Semester {course.semester}</p>
                  </div>
                  <div className="preview-item">
                    <label className="preview-label">Status</label>
                    <span className={`chip status ${course.status}`}>{course.status}</span>
                  </div>
                  <div className="preview-item">
                    <label className="preview-label">Credits</label>
                    <p className="preview-value">{course.credits}</p>
                  </div>

                  <div className="preview-item">
                    <label className="preview-label">Degree Level</label>
                    <p className="preview-value">{course.degreeLevel}</p>
                  </div>
                  <div className="preview-item">
                    <label className="preview-label">Grading Scale</label>
                    <p className="preview-value">{course.scoringScale}</p>
                  </div>
                  <div className="preview-item">
                    <label className="preview-label">Minimum Passing Average</label>
                    <p className="preview-value">{course.minAvgMarkToPass}</p>
                  </div>
                  <div className="preview-item">
                    <label className="preview-label">Approval</label>
                    <span className={`chip status ${course.isApproved ? 'published' : 'draft'}`}>
                      {course.isApproved ? 'Approved' : 'Not approved'}
                    </span>
                  </div>
                  <div className="preview-item">
                    <label className="preview-label">Decision No.</label>
                    <p className="preview-value">{course.decisionNo ?? '-'}</p>
                  </div>
                  <div className="preview-item">
                    <label className="preview-label">Approved Date</label>
                    <p className="preview-value">{course.approvedDate ?? '-'}</p>
                  </div>

                  <div className="meta-grid">
                    <div className="meta-item">
                      <span className="meta-label">Documents</span>
                      <span className="meta-value">{documents.length}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Outcome</span>
                      <span className="meta-value">{outcomes.length}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Challenge</span>
                      <span className="meta-value">{challenges.length}</span>
                    </div>
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
