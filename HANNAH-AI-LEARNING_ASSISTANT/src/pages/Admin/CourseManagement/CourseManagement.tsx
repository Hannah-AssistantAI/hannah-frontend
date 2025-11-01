import React, { useState } from 'react';
import {
  Map, Plus, Search, Filter, Edit, Trash2, Copy, Eye,
  BookOpen, Calendar, Award, ArrowRight, Save, X,
  GripVertical, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle, FileText, Download, Upload, Clock
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

interface Course {
  code: string;
  name: string;
  credits: number;
  prerequisites: string[];
  order?: number;
}

export default function CourseRoadmapManagement() {
  const [roadmapName, setRoadmapName] = useState('');
  const [specialty, setSpecialty] = useState('ES');
  const [semester, setSemester] = useState(1);
  const [description, setDescription] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [editingRoadmap, setEditingRoadmap] = useState<Roadmap | null>(null);

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

  const availableCourses = [
    { code: 'CS101', name: 'Introduction to Programming', credits: 3, prerequisites: [] },
    { code: 'CS102', name: 'Data Structures', credits: 3, prerequisites: ['CS101'] },
    { code: 'CS201', name: 'Algorithms', credits: 3, prerequisites: ['CS102'] },
    { code: 'CS301', name: 'Database Systems', credits: 3, prerequisites: ['CS102'] },
    { code: 'ES101', name: 'Digital Logic Design', credits: 3, prerequisites: [] },
    { code: 'ES201', name: 'Microprocessors', credits: 3, prerequisites: ['ES101'] }
  ];

  const getSpecialtyColor = (spec: string) => {
    const specialty = specialties.find(s => s.value === spec);
    return specialty?.color || 'gray';
  };

  const handleCreateRoadmap = () => {
    setView('create');
    setRoadmapName('');
    setSpecialty('ES');
    setSemester(1);
    setDescription('');
    setCourses([]);
  };

  const handleAddCourse = (course: { code: any; }) => {
    if (!courses.find(c => c.code === course.code)) {
      setCourses([...courses, {
        ...course, order: courses.length + 1,
        name: '',
        credits: 0,
        prerequisites: []
      }]);
    }
  };

  const handleRemoveCourse = (courseCode: any) => {
    setCourses(courses.filter(c => c.code !== courseCode));
  };

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
    <AdminPageWrapper title="Quản lý Lộ trình Môn học">
      <div className="course-container">
        {/* List View */}
        {view === 'list' && (
          <>
            {/* Header */}
            <div className="course-header">
              <div className="course-header-top">
                <div>
                  <p className="course-subtitle">Tạo và quản lý lộ trình học tập theo chuyên ngành và học kỳ</p>
                </div>
                <div className="course-actions">
                  <button onClick={handleCreateRoadmap} className="btn-create-course">
                    <Plus size={20} />
                    Tạo Môn học Mới
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
                      placeholder="Tìm kiếm môn học..."
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
                    <option value="all">Tất cả Chuyên ngành</option>
                    {specialties.map(spec => (
                      <option key={spec.value} value={spec.value}>{spec.label}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Tất cả Học kỳ</option>
                    {mockSemesters.map(sem => (
                      <option key={sem.id} value={sem.id}>{sem.name}</option>
                    ))}
                  </select>

                  <button className="btn-more-filters">
                    <Filter size={16} />
                    Bộ lọc khác
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
                        HK {roadmap.semester}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="course-description">{roadmap.description}</p>

                    {/* Learning Outcomes */}
                    <div className="course-section">
                      <h4 className="course-section-title">Kết quả Học tập:</h4>
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
                      <h4 className="course-section-title">Thách thức Thường gặp:</h4>
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
                        Cập nhật: {roadmap.lastUpdated}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRoadmaps.length === 0 && (
              <div className="empty-state">
                <Map className="empty-icon" size={64} />
                <p className="empty-title">Không tìm thấy môn học</p>
                <p className="empty-description">Thử điều chỉnh bộ lọc hoặc tạo môn học mới</p>
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
                  {view === 'create' ? 'Tạo Môn học Mới' : 'Chỉnh sửa Môn học'}
                </h1>
                <p className="create-subtitle">Định nghĩa thông tin môn học và kết quả học tập</p>
              </div>
              <button onClick={() => setView('list')} className="btn-cancel">
                <X size={16} />
                Hủy
              </button>
            </div>

            <div className="create-layout">
              {/* Main Form */}
              <div className="create-main">
                {/* Basic Information */}
                <div className="form-section">
                  <h3 className="form-section-title">Thông tin Môn học</h3>
                  
                  <div className="form-content">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Mã Môn học *</label>
                        <input
                          type="text"
                          placeholder="VD: PRF192"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Chuyên ngành *</label>
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
                      <label className="form-label">Tên Môn học *</label>
                      <input
                        type="text"
                        value={roadmapName}
                        onChange={(e) => setRoadmapName(e.target.value)}
                        placeholder="VD: Nhập môn Lập trình"
                        className="form-input"
                        style={{width: '92%'}}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Học kỳ *</label>
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
                      <label className="form-label">Mô tả</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Mô tả ngắn gọn về môn học..."
                        className="form-textarea"
                        style={{width: '92%'}}
                      />
                    </div>
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div className="form-section">
                  <h3 className="form-section-title">Kết quả Học tập</h3>

                  <div className="form-content">
                    <div className="input-with-button">
                      <input
                        type="text"
                        placeholder="Thêm kết quả học tập..."
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
                  <h3 className="form-section-title">Thách thức Thường gặp</h3>

                  <div className="form-content">
                    <div className="input-with-button">
                      <input
                        type="text"
                        placeholder="Thêm thách thức thường gặp..."
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
                  <h3 className="preview-title">Xem trước</h3>

                  <div className="preview-content">
                    <div className="preview-item">
                      <label className="preview-label">Mã Môn học</label>
                      <p className="preview-value">PRF192</p>
                    </div>

                    <div className="preview-item">
                      <label className="preview-label">Chuyên ngành</label>
                      <span className="preview-badge">
                        {specialty}
                      </span>
                    </div>

                    <div className="preview-item">
                      <label className="preview-label">Học kỳ</label>
                      <p className="preview-value">Học kỳ {semester}</p>
                    </div>

                    <div className="preview-item">
                      <label className="preview-label">Trạng thái</label>
                      <p className="preview-value">Bản nháp</p>
                    </div>

                    <div className="preview-footer">
                      <p className="preview-note">
                        Đây là cách môn học của bạn sẽ xuất hiện trong danh sách
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
                Lưu Môn học
              </button>
              <button className="btn-publish">
                Xuất bản
              </button>
              <button className="btn-draft">
                Lưu Bản nháp
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}