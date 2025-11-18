import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, Plus, Search, Filter, Edit, Trash2, Eye, Clock, Loader, X, Save } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import subjectService, { type Subject } from '../../../service/subjectService';
import { toast } from 'react-hot-toast';
import './CourseManagement.css';

const initialFormState: Partial<Subject> = {
  code: '', name: '', semester: 1, credits: 3, description: '',
  minAvgMarkToPass: 5.0, degreeLevel: 'Undergraduate', scoringScale: 'Thang điểm 10',
  estimatedHours: 45, prerequisites: [], learningOutcomes: [], commonChallenges: [],
  timeAllocation: '', tools: '', decisionNo: '',
};

export default function CourseManagement() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Subject>>(initialFormState);

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await subjectService.getAllSubjects();
      setSubjects(response.items || []);
    } catch (error) {
      toast.error('Failed to fetch subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchSubjects();
    }
  }, [view]);

  const handleCreateClick = () => {
    setFormData(initialFormState);
    setView('create');
  };

  const handleCancel = () => {
    setView('list');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? '' : Number(value)) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'learningOutcomes' | 'commonChallenges' | 'prerequisites') => {
    const currentInput = e.target;
    if (currentInput.value.trim() !== '') {
      setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), currentInput.value.trim()] }));
      currentInput.value = '';
    }
  };

  const handleRemoveFromArray = (index: number, field: 'learningOutcomes' | 'commonChallenges' | 'prerequisites') => {
    setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []).slice(0, index), ...(prev[field] || []).slice(index + 1)] }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await subjectService.createSubject(formData);
      toast.success('Course saved successfully!');
      setView('list');
    } catch (error) {
      toast.error('Failed to save course. Check fields and try again.');
      console.error('Error saving subject:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchSemester = selectedSemester === 'all' || subject.semester === parseInt(selectedSemester);
    const matchSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase()) || subject.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSemester && matchSearch;
  });

  const renderListView = () => (
    <>
      <div className="course-header">
        <div className="course-header-top">
          <div><p className="course-subtitle">Manage course information, prerequisites, and learning outcomes.</p></div>
          <div className="course-actions"><button onClick={handleCreateClick} className="btn-create-course"><Plus size={20} />Create New Course</button></div>
        </div>
        <div className="filters-container">
          <div className="filters-grid">
            <div className="search-wrapper">
              <Search className="search-icon" size={20} /><input type="text" placeholder="Search by name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
            </div>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="filter-select">
              <option value="all">All Semesters</option>
              {Array.from({ length: 9 }, (_, i) => i + 1).map(sem => (<option key={sem} value={sem}>Semester {sem}</option>))}
            </select>
            <button className="btn-more-filters"><Filter size={16} />More filters</button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="loading-state"><Loader className="animate-spin" size={48} /><p>Loading Courses...</p></div>
      ) : (
        <>
          <div className="courses-grid">
            {filteredSubjects.map(subject => (
              <div key={subject.subjectId} className="course-card">
                <div className="course-card-content">
                  <div className="course-card-header">
                    <h3 className="course-card-title">{subject.name}</h3>
                    <div className="course-card-actions">
                      <Link to={`/admin/course-management/${subject.subjectId}`} className="btn-view"><Eye size={20} /></Link>
                      <button className="btn-edit"><Edit size={20} /></button>
                      <button className="btn-delete"><Trash2 size={20} /></button>
                    </div>
                  </div>
                  <div className="course-badges">
                    <span className="course-code">{subject.code}</span>
                    <span className="semester-badge">Sem {subject.semester}</span>
                    <span className={`status-badge ${subject.isActive ? 'active' : 'inactive'}`}>{subject.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="course-description">Credits: {subject.credits}</p>
                  <div className="course-footer"><div className="course-footer-item"><Clock size={16} />Created: {new Date(subject.createdAt).toLocaleDateString()}</div></div>
                </div>
              </div>
            ))}
          </div>
          {filteredSubjects.length === 0 && (
            <div className="empty-state"><Map className="empty-icon" size={64} /><p className="empty-title">No courses found</p><p className="empty-description">Try adjusting your filters or create a new course.</p></div>
          )}
        </>
      )}
    </>
  );

  const renderCreateEditView = () => (
    <div className="create-view">
      <div className="create-header">
        <div><h1 className="create-title"><Map size={32} />{view === 'create' ? 'Create New Course' : 'Edit Course'}</h1><p className="create-subtitle">Define course information and learning outcomes</p></div>
        <button onClick={handleCancel} className="btn-cancel"><X size={16} />Cancel</button>
      </div>
      <div className="create-layout">
        <div className="create-main">
          <div className="form-section">
            <h3 className="form-section-title">Course Information</h3>
            <div className="form-content">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Course Code *</label><input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="e.g., PRF192" className="form-input" required /></div>
                <div className="form-group"><label className="form-label">Course Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Introduction to Programming" className="form-input" required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Semester *</label><select name="semester" value={formData.semester} onChange={handleChange} className="form-input" required>{Array.from({ length: 9 }, (_, i) => i + 1).map(sem => (<option key={sem} value={sem}>Semester {sem}</option>))}</select></div>
                <div className="form-group"><label className="form-label">Credits *</label><input type="number" name="credits" value={formData.credits} onChange={handleChange} className="form-input" required min="0" /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="A brief description of the course..." className="form-textarea" /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Degree Level</label><input type="text" name="degreeLevel" value={formData.degreeLevel} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Scoring Scale</label><input type="text" name="scoringScale" value={formData.scoringScale} onChange={handleChange} className="form-input" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Min Mark to Pass</label><input type="number" name="minAvgMarkToPass" value={formData.minAvgMarkToPass} onChange={handleChange} className="form-input" min="0" /></div>
                <div className="form-group"><label className="form-label">Estimated Hours</label><input type="number" name="estimatedHours" value={formData.estimatedHours} onChange={handleChange} className="form-input" min="0" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Time Allocation</label><input type="text" name="timeAllocation" value={formData.timeAllocation} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label className="form-label">Tools</label><input type="text" name="tools" value={formData.tools} onChange={handleChange} className="form-input" /></div>
              </div>
              <div className="form-group"><label className="form-label">Decision No.</label><input type="text" name="decisionNo" value={formData.decisionNo} onChange={handleChange} className="form-input" /></div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">Prerequisites</h3>
            <div className="form-content">
              <div className="input-with-button">
                <input type="text" placeholder="Add a prerequisite code and press Enter..." className="form-input" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleArrayChange(e as any, 'prerequisites'))} />
              </div>
              <div className="outcome-list">
                {formData.prerequisites?.map((item, idx) => (<div key={idx} className="outcome-item"><span className="outcome-text">{item}</span><button onClick={() => handleRemoveFromArray(idx, 'prerequisites')} className="btn-remove"><X size={16} /></button></div>))}
              </div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">Learning Outcomes</h3>
            <div className="form-content">
              <div className="input-with-button">
                <input type="text" placeholder="Add a learning outcome and press Enter..." className="form-input" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleArrayChange(e as any, 'learningOutcomes'))} />
              </div>
              <div className="outcome-list">
                {formData.learningOutcomes?.map((outcome, idx) => (<div key={idx} className="outcome-item"><span className="outcome-text">{outcome}</span><button onClick={() => handleRemoveFromArray(idx, 'learningOutcomes')} className="btn-remove"><X size={16} /></button></div>))}
              </div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">Common Challenges</h3>
            <div className="form-content">
              <div className="input-with-button">
                <input type="text" placeholder="Add a common challenge and press Enter..." className="form-input" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleArrayChange(e as any, 'commonChallenges'))} />
              </div>
              <div className="challenge-list">
                {formData.commonChallenges?.map((challenge, idx) => (<div key={idx} className="challenge-item"><span className="challenge-text">{challenge}</span><button onClick={() => handleRemoveFromArray(idx, 'commonChallenges')} className="btn-remove"><X size={16} /></button></div>))}
              </div>
            </div>
          </div>
        </div>
        <div className="create-sidebar">
          <div className="preview-card">
            <h3 className="preview-title">Preview</h3>
            <div className="preview-content">
              <div className="preview-item"><label className="preview-label">Course Code</label><p className="preview-value">{formData.code || '...'}</p></div>
              <div className="preview-item"><label className="preview-label">Semester</label><p className="preview-value">Semester {formData.semester || '...'}</p></div>
              <div className="preview-item"><label className="preview-label">Status</label><p className="preview-value">Draft</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="action-buttons">
        <button onClick={handleSave} className="btn-save" disabled={isSubmitting}>{isSubmitting ? <><Loader size={20} className="animate-spin" /> Saving...</> : <><Save size={20} /> Save Course</>}</button>
      </div>
    </div>
  );

  return (
    <AdminPageWrapper title="Course Management">
      <div className="course-container">
        {view === 'list' ? renderListView() : renderCreateEditView()}
      </div>
    </AdminPageWrapper>
  );
}
