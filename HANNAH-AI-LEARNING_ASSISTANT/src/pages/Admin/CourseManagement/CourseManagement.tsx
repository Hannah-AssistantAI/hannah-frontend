import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Map, Plus, Search, Filter, Edit, Trash2, Eye,
  Save, X, Clock
} from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import { mockSemesters } from '../../../data/mockSemesters';
import './CourseManagement.css';

interface Roadmap {
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
}

// interface Course {
//   code: string;
//   name: string;
//   credits: number;
//   prerequisites: string[];
//   order?: number;
// }

export default function CourseRoadmapManagement() {
  const [roadmapName, setRoadmapName] = useState('');
  const [specialty, setSpecialty] = useState('ES');
  const [semester, setSemester] = useState(1);
  const [description, setDescription] = useState('');
  // const [courses, setCourses] = useState<Course[]>([]);
  // const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [, setEditingRoadmap] = useState<Roadmap | null>(null);

  const specialties = [
    { value: 'ES', label: 'Embedded Systems', color: 'blue' },
    { value: 'IS', label: 'Information Systems', color: 'green' },
    { value: 'JS', label: 'Software Engineering', color: 'purple' }
  ];

  const roadmaps = [
    {
      id: 1,
      name: 'Introduction to Programming',
      code: 'PRF192',
      specialty: 'ES',
      semester: 1,
      description: 'Basic programming concepts using C language',
      learningOutcomes: ['Understand basic programming concepts', 'Write simple C programs', 'Debug code effectively'],
      challenges: ['Pointer concepts', 'Memory management', 'Debugging'],
      courses: 8,
      status: 'published',
      lastUpdated: '01/01/2024',
      credits: 24
    },
    {
      id: 2,
      name: 'Data Structures & Algorithms',
      code: 'CSD201',
      specialty: 'IS',
      semester: 3,
      description: 'Advanced data structures and algorithm design',
      learningOutcomes: ['Implement common data structures', 'Analyze algorithm complexity', 'Solve optimization problems'],
      challenges: ['Graph algorithms', 'Dynamic programming', 'Time complexity'],
      courses: 6,
      status: 'draft',
      lastUpdated: '15/10/2024',
      credits: 18
    },
    {
      id: 3,
      name: 'Software Engineering',
      code: 'SWE301',
      specialty: 'JS',
      semester: 5,
      description: 'Software development methodologies and practices',
      learningOutcomes: ['Apply SDLC models', 'Design software architecture', 'Manage software projects'],
      challenges: ['Requirements analysis', 'Design patterns', 'Testing strategies'],
      courses: 7,
      status: 'published',
      lastUpdated: '10/10/2024',
      credits: 21
    }
  ];

  // const availableCourses = [
  //   { code: 'CS101', name: 'Introduction to Programming', credits: 3, prerequisites: [] },
  //   { code: 'CS102', name: 'Data Structures', credits: 3, prerequisites: ['CS101'] },
  //   { code: 'CS201', name: 'Algorithms', credits: 3, prerequisites: ['CS102'] },
  //   { code: 'CS301', name: 'Database Systems', credits: 3, prerequisites: ['CS102'] },
  //   { code: 'ES101', name: 'Digital Logic Design', credits: 3, prerequisites: [] },
  //   { code: 'ES201', name: 'Microprocessors', credits: 3, prerequisites: ['ES101'] }
  // ];

  // const getSpecialtyColor = (spec: string) => {
  //   const specialty = specialties.find(s => s.value === spec);
  //   return specialty?.color || 'gray';
  // };

  const handleCreateRoadmap = () => {
    setView('create');
    setRoadmapName('');
    setSpecialty('ES');
    setSemester(1);
    setDescription('');
    // setCourses([]);
  };

  // const handleAddCourse = (course: { code: any; }) => {
  //   if (!courses.find(c => c.code === course.code)) {
  //     setCourses([...courses, {
  //       ...course, order: courses.length + 1,
  //       name: '',
  //       credits: 0,
  //       prerequisites: []
  //     }]);
  //   }
  // };

  // const handleRemoveCourse = (courseCode: any) => {
  //   setCourses(courses.filter(c => c.code !== courseCode));
  // };

  const handleSaveRoadmap = () => {
    setView('list');
  };

  const filteredRoadmaps = roadmaps.filter(roadmap => {
    const matchSpecialty = selectedSpecialty === 'all' || roadmap.specialty === selectedSpecialty;
    const matchSemester = selectedSemester === 'all' || roadmap.semester === parseInt(selectedSemester);
    const matchSearch = roadmap.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSpecialty && matchSemester && matchSearch;
  });

  return (
    <AdminPageWrapper title="Course Roadmap Management">
      <div className="course-container">
        {/* List View */}
        {view === 'list' && (
          <>
            {/* Header */}
            <div className="course-header">
              <div className="course-header-top">
                <div>
                  <p className="course-subtitle">Create and manage learning roadmaps by specialty and semester</p>
                </div>
                <div className="course-actions">
                  <button onClick={handleCreateRoadmap} className="btn-create-course">
                    <Plus size={20} />
                    Create New Course
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="filters-container">
                <div className="filters-grid">
                  <div className="search-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Specialties</option>
                    {specialties.map(spec => (
                      <option key={spec.value} value={spec.value}>{spec.label}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Semesters</option>
                    {mockSemesters.map(sem => (
                      <option key={sem.id} value={sem.id}>{sem.name}</option>
                    ))}
                  </select>

                  <button className="btn-more-filters">
                    <Filter size={16} />
                    More filters
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            {/* <div className="semester-stats">
              {[1,2,3,4,5,6,7,8,9].map(sem => {
                const semesterRoadmaps = roadmaps.filter(r => r.semester === sem);
                const isActive = selectedSemester === sem.toString();
                return (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem.toString())}
                    className={`semester-card ${isActive ? 'active' : ''}`}
                  >
                    <div className="semester-count">
                      {semesterRoadmaps.length}
                    </div>
                    <div className="semester-label">Sem {sem}</div>
                  </button>
                );
              })}
            </div> */}

            {/* Course Cards */}
            <div className="courses-grid">
              {filteredRoadmaps.map(roadmap => (
                <div key={roadmap.id} className="course-card">
                  <div className="course-card-content">
                    {/* Header */}
                    <div className="course-card-header">
                      <h3 className="course-card-title">{roadmap.name}</h3>
                      <div className="course-card-actions">
                        <Link 
                          to={`/admin/course-management/${roadmap.id}`}
                          className="btn-view"
                          aria-label={`View details of ${roadmap.name}`}
                        >
                          <Eye size={20} />
                        </Link>
                        <button 
                          onClick={() => { setEditingRoadmap(roadmap); setView('edit'); }}
                          className="btn-edit"
                        >
                          <Edit size={20} />
                        </button>
                        <button className="btn-delete">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Course Code & Badges */}
                    <div className="course-badges">
                      <span className="course-code">{roadmap.code}</span>
                      <span className={`specialty-badge ${roadmap.specialty.toLowerCase()}`}>
                        {roadmap.specialty}
                      </span>
                      <span className="semester-badge">
                        Sem {roadmap.semester}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="course-description">{roadmap.description}</p>

                    {/* Learning Outcomes */}
                    <div className="course-section">
                      <h4 className="course-section-title">Learning Outcomes:</h4>
                      <div className="tags-wrapper">
                        {roadmap.learningOutcomes.map((outcome, idx) => (
                          <span key={idx} className="tag tag-outcome">
                            {outcome}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Common Challenges */}
                    <div className="course-section">
                      <h4 className="course-section-title">Common Challenges:</h4>
                      <div className="tags-wrapper">
                        {roadmap.challenges.map((challenge, idx) => (
                          <span key={idx} className="tag tag-challenge">
                            {challenge}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="course-footer">
                      <div className="course-footer-item">
                        <Clock size={16} />
                        Updated: {roadmap.lastUpdated}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRoadmaps.length === 0 && (
              <div className="empty-state">
                <Map className="empty-icon" size={64} />
                <p className="empty-title">No courses found</p>
                <p className="empty-description">Try adjusting filters or create a new course</p>
              </div>
            )}
          </>
        )}

        {/* Create/Edit View */}
        {(view === 'create' || view === 'edit') && (
          <div className="create-view">
            {/* Header */}
            <div className="create-header">
              <div>
                <h1 className="create-title">
                  <Map size={32} />
                  {view === 'create' ? 'Create New Course' : 'Edit Course'}
                </h1>
                <p className="create-subtitle">Define course information and learning outcomes</p>
              </div>
              <button onClick={() => setView('list')} className="btn-cancel">
                <X size={16} />
                Cancel
              </button>
            </div>

            <div className="create-layout">
              {/* Main Form */}
              <div className="create-main">
                {/* Basic Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Course Information</h3>
                  
                  <div className="form-content">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Course Code *</label>
                        <input
                          type="text"
                          placeholder="e.g., PRF192"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Specialty *</label>
                        <select
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="form-select"
                        >
                          {specialties.map(spec => (
                            <option key={spec.value} value={spec.value}>{spec.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Course Name *</label>
                      <input
                        type="text"
                        value={roadmapName}
                        onChange={(e) => setRoadmapName(e.target.value)}
                        placeholder="e.g., Introduction to Programming"
                        className="form-input"
                        style={{width: '92%'}}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Semester *</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(parseInt(e.target.value))}
                        className="form-select"
                        style={{width: '95%'}}
                      >
                        {mockSemesters.map(sem => (
                          <option key={sem.id} value={sem.id}>{sem.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="A brief description of the course..."
                        className="form-textarea"
                        style={{width: '92%'}}
                      />
                    </div>
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div className="form-section">
                  <h3 className="form-section-title">Learning Outcomes</h3>

                  <div className="form-content">
                    <div className="input-with-button">
                      <input
                        type="text"
                        placeholder="Add a learning outcome..."
                        className="form-input"
                      />
                      <button className="btn-add">
                        <Plus size={20} />
                      </button>
                    </div>

                    <div className="outcome-list">
                      {['Understand basic programming concepts', 'Write simple C programs', 'Debug code effectively'].map((outcome, idx) => (
                        <div key={idx} className="outcome-item">
                          <span className="outcome-text">{outcome}</span>
                          <button className="btn-remove">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Common Challenges */}
                <div className="form-section">
                  <h3 className="form-section-title">Common Challenges</h3>

                  <div className="form-content">
                    <div className="input-with-button">
                      <input
                        type="text"
                        placeholder="Add a common challenge..."
                        className="form-input"
                      />
                      <button className="btn-add-challenge">
                        <Plus size={20} />
                      </button>
                    </div>

                    <div className="challenge-list">
                      {['Pointer concepts', 'Memory management', 'Debugging'].map((challenge, idx) => (
                        <div key={idx} className="challenge-item">
                          <span className="challenge-text">{challenge}</span>
                          <button className="btn-remove">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Preview */}
              <div className="create-sidebar">
                <div className="preview-card">
                  <h3 className="preview-title">Preview</h3>

                  <div className="preview-content">
                    <div className="preview-item">
                      <label className="preview-label">Course Code</label>
                      <p className="preview-value">PRF192</p>
                    </div>

                    <div className="preview-item">
                      <label className="preview-label">Specialty</label>
                      <span className="preview-badge">
                        {specialty}
                      </span>
                    </div>

                    <div className="preview-item">
                      <label className="preview-label">Semester</label>
                      <p className="preview-value">Semester {semester}</p>
                    </div>

                    <div className="preview-item">
                      <label className="preview-label">Status</label>
                      <p className="preview-value">Draft</p>
                    </div>

                    <div className="preview-footer">
                      <p className="preview-note">
                        This is how your course will appear in the list
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button onClick={handleSaveRoadmap} className="btn-save">
                <Save size={20} />
                Save Course
              </button>
              <button className="btn-publish">
                Publish
              </button>
              <button className="btn-draft">
                Save Draft
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}