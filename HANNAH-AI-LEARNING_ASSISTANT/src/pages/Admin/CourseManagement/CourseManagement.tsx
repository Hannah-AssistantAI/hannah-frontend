import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Plus, Search, Filter, Edit, Trash2, Eye, Clock, Loader } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';

import subjectService, { type Subject } from '../../../service/subjectService';
import { toast } from 'react-hot-toast';
import './CourseManagement.css';

export default function CourseManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await subjectService.getAllSubjects();
        setSubjects(response.items || []);
      } catch (error) {
        toast.error('Failed to fetch subjects.');
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleCreate = () => {
    // This would navigate to a create form or open a modal
    toast.success('Navigating to create page...');
    // setView('create');
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchSemester = selectedSemester === 'all' || subject.semester === parseInt(selectedSemester);
    const matchSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        subject.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSemester && matchSearch;
  });

  const renderListView = () => (
    <>
      {/* Header */}
      <div className="course-header">
        <div className="course-header-top">
          <div>
            <p className="course-subtitle">Manage course information, prerequisites, and learning outcomes.</p>
          </div>
          <div className="course-actions">
            <button onClick={handleCreate} className="btn-create-course">
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
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Semesters</option>
              {Array.from({ length: 9 }, (_, i) => i + 1).map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>

            <button className="btn-more-filters">
              <Filter size={16} />
              More filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <Loader className="animate-spin" size={48} />
          <p>Loading Courses...</p>
        </div>
      )}

      {/* Course Cards */}
      {!loading && (
        <div className="courses-grid">
          {filteredSubjects.map(subject => (
            <div key={subject.subjectId} className="course-card">
              <div className="course-card-content">
                <div className="course-card-header">
                  <h3 className="course-card-title">{subject.name}</h3>
                  <div className="course-card-actions">
                    <Link to={`/admin/course-management/${subject.subjectId}`} className="btn-view">
                      <Eye size={20} />
                    </Link>
                    <button className="btn-edit">
                      <Edit size={20} />
                    </button>
                    <button className="btn-delete">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="course-badges">
                  <span className="course-code">{subject.code}</span>
                  <span className="semester-badge">Sem {subject.semester}</span>
                  <span className={`status-badge ${subject.isActive ? 'active' : 'inactive'}`}>
                    {subject.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="course-description">Credits: {subject.credits}</p>

                <div className="course-footer">
                  <div className="course-footer-item">
                    <Clock size={16} />
                    Created: {new Date(subject.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredSubjects.length === 0 && (
        <div className="empty-state">
          <Map className="empty-icon" size={64} />
          <p className="empty-title">No courses found</p>
          <p className="empty-description">Try adjusting your filters or create a new course.</p>
        </div>
      )}
    </>
  );

  return (
    <AdminPageWrapper title="Course Management">
      <div className="course-container">
        {renderListView()}
      </div>
    </AdminPageWrapper>
  );
}
