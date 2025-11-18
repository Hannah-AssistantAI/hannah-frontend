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
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState<{ [key: string]: boolean }>({});
  const [inputValue, setInputValue] = useState<{ [key: string]: string }>({});
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

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
    setEditingSubjectId(null);
    setFieldErrors({});
    setView('create');
  };

  const handleEditClick = (subject: Subject) => {
    // Coalesce nullish values to their empty state to prevent uncontrolled component warnings
    const populatedData = {
      ...initialFormState,
      ...subject,
      description: subject.description ?? '',
      timeAllocation: subject.timeAllocation ?? '',
      tools: subject.tools ?? '',
      decisionNo: subject.decisionNo ?? '',
      prerequisites: subject.prerequisites ?? [],
      learningOutcomes: subject.learningOutcomes ?? [],
      commonChallenges: subject.commonChallenges ?? [],
    };
    setFormData(populatedData);
    setEditingSubjectId(subject.subjectId);
    setView('edit');
  };

  const handleCancel = () => {
    setEditingSubjectId(null);
    setFieldErrors({});
    setFormData(initialFormState);
    setView('list');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: string | number = value;
    if (type === 'number' || name === 'semester') {
      val = value === '' ? '' : Number(value);
    }

    setFormData(currentFormData => ({
      ...currentFormData,
      [name]: val,
    }));

    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (field: 'learningOutcomes' | 'commonChallenges' | 'prerequisites') => {
    const value = inputValue[field];
    console.log(`🔵 Adding to ${field}:`, value);
    console.log(`🔵 Current inputValue:`, inputValue);
    console.log(`🔵 Current formData[${field}]:`, formData[field]);

    if (value && value.trim() !== '') {
      setFormData(prev => {
        const currentArray = (prev[field] as string[]) || [];
        const newArray = [...currentArray, value.trim()];
        console.log(`✅ Updated ${field}:`, newArray);
        console.log(`✅ Full formData after update:`, { ...prev, [field]: newArray });
        return { ...prev, [field]: newArray };
      });
      setInputValue(prev => ({ ...prev, [field]: '' }));
      setShowInput(prev => ({ ...prev, [field]: false }));
      toast.success(`Added to ${field}!`);
    } else {
      console.log(`❌ Empty value for ${field}`);
      toast.error('Please enter a value');
    }
  };

  const handleRemoveFromArray = (index: number, field: 'learningOutcomes' | 'commonChallenges' | 'prerequisites') => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      return { ...prev, [field]: currentArray.filter((_, i) => i !== index) };
    });
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Required fields validation
    if (!formData.code || formData.code.trim() === '') {
      errors.code = 'Course code is required';
    }
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Course name is required';
    }
    if (!formData.semester || formData.semester < 1) {
      errors.semester = 'Semester must be at least 1';
    }
    if (!formData.credits || formData.credits < 1) {
      errors.credits = 'Credits must be at least 1';
    }
    if (!formData.description || formData.description.trim() === '') {
      errors.description = 'Description is required';
    }
    if (!formData.estimatedHours || formData.estimatedHours < 1) {
      errors.estimatedHours = 'Estimated hours must be at least 1';
    }
    if (!formData.minAvgMarkToPass || formData.minAvgMarkToPass < 0 || formData.minAvgMarkToPass > 10) {
      errors.minAvgMarkToPass = 'Min average mark must be between 0 and 10';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    // Clean formData: only include fields with values, remove empty strings
    const cleanedData: any = {
      code: formData.code,
      name: formData.name,
      semester: formData.semester,
      credits: formData.credits,
      description: formData.description,
      estimatedHours: formData.estimatedHours,
      prerequisites: formData.prerequisites || [],
      learningOutcomes: formData.learningOutcomes || [],
      commonChallenges: formData.commonChallenges || [],
      degreeLevel: formData.degreeLevel,
      timeAllocation: formData.timeAllocation,
      tools: formData.tools,
      scoringScale: formData.scoringScale,
      decisionNo: formData.decisionNo,
      minAvgMarkToPass: formData.minAvgMarkToPass,
    };

    // Remove empty string fields (but keep empty arrays)
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });

    console.log('=== FORM DATA BEFORE SAVING ===');
    console.log('Full formData:', JSON.stringify(cleanedData, null, 2));
    console.log('Prerequisites:', cleanedData.prerequisites);
    console.log('Learning Outcomes:', cleanedData.learningOutcomes);
    console.log('Common Challenges:', cleanedData.commonChallenges);
    console.log('================================');

    try {
      if (view === 'edit' && editingSubjectId) {
        const result = await subjectService.updateSubject(editingSubjectId, cleanedData);
        console.log('Update result:', result);
        toast.success('Course updated successfully!');
      } else {
        const result = await subjectService.createSubject(cleanedData);
        console.log('Create result:', result);
        toast.success('Course created successfully!');
      }
      setView('list');
      setFieldErrors({});
    } catch (error: any) {
      // Parse API validation errors if available
      if (error.response?.data?.errors) {
        const apiErrors: { [key: string]: string } = {};
        const errorData = error.response.data.errors;

        // Handle different error formats
        Object.keys(errorData).forEach(key => {
          const fieldName = key.charAt(0).toLowerCase() + key.slice(1); // Convert to camelCase
          apiErrors[fieldName] = Array.isArray(errorData[key])
            ? errorData[key][0]
            : errorData[key];
        });

        setFieldErrors(apiErrors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error('Failed to save course. Check fields and try again.');
      }
      console.error('Error saving subject:', error);
    } finally {
      setIsSubmitting(false);
      setEditingSubjectId(null);
    }
  };

  const handleDelete = async (subjectId: number) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await subjectService.deleteSubject(subjectId);
        toast.success('Course deleted successfully!');
        await fetchSubjects(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete course.');
        console.error('Error deleting subject:', error);
      }
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
                      <button onClick={() => handleEditClick(subject)} className="btn-edit"><Edit size={20} /></button>
                      <button onClick={() => handleDelete(subject.subjectId)} className="btn-delete"><Trash2 size={20} /></button>
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
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., PRF192"
                    className={`form-input ${fieldErrors.code ? 'error' : ''}`}
                    required
                  />
                  {fieldErrors.code && <span className="error-message">{fieldErrors.code}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Introduction to Programming"
                    className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                    required
                  />
                  {fieldErrors.name && <span className="error-message">{fieldErrors.name}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.semester ? 'error' : ''}`}
                    required
                  >
                    {Array.from({ length: 9 }, (_, i) => i + 1).map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                  {fieldErrors.semester && <span className="error-message">{fieldErrors.semester}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Credits *</label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.credits ? 'error' : ''}`}
                    required
                    min="0"
                  />
                  {fieldErrors.credits && <span className="error-message">{fieldErrors.credits}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="A brief description of the course..."
                  className={`form-textarea ${fieldErrors.description ? 'error' : ''}`}
                />
                {fieldErrors.description && <span className="error-message">{fieldErrors.description}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Degree Level</label>
                  <input
                    type="text"
                    name="degreeLevel"
                    value={formData.degreeLevel}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.degreeLevel ? 'error' : ''}`}
                  />
                  {fieldErrors.degreeLevel && <span className="error-message">{fieldErrors.degreeLevel}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Scoring Scale</label>
                  <input
                    type="text"
                    name="scoringScale"
                    value={formData.scoringScale}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.scoringScale ? 'error' : ''}`}
                  />
                  {fieldErrors.scoringScale && <span className="error-message">{fieldErrors.scoringScale}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Min Mark to Pass *</label>
                  <input
                    type="number"
                    name="minAvgMarkToPass"
                    value={formData.minAvgMarkToPass}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.minAvgMarkToPass ? 'error' : ''}`}
                    min="0"
                    max="10"
                    step="0.1"
                  />
                  {fieldErrors.minAvgMarkToPass && <span className="error-message">{fieldErrors.minAvgMarkToPass}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Hours *</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    value={formData.estimatedHours}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.estimatedHours ? 'error' : ''}`}
                    min="0"
                  />
                  {fieldErrors.estimatedHours && <span className="error-message">{fieldErrors.estimatedHours}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Time Allocation</label>
                  <input
                    type="text"
                    name="timeAllocation"
                    value={formData.timeAllocation}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.timeAllocation ? 'error' : ''}`}
                  />
                  {fieldErrors.timeAllocation && <span className="error-message">{fieldErrors.timeAllocation}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Tools</label>
                  <input
                    type="text"
                    name="tools"
                    value={formData.tools}
                    onChange={handleChange}
                    className={`form-input ${fieldErrors.tools ? 'error' : ''}`}
                  />
                  {fieldErrors.tools && <span className="error-message">{fieldErrors.tools}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Decision No.</label>
                <input
                  type="text"
                  name="decisionNo"
                  value={formData.decisionNo}
                  onChange={handleChange}
                  className={`form-input ${fieldErrors.decisionNo ? 'error' : ''}`}
                />
                {fieldErrors.decisionNo && <span className="error-message">{fieldErrors.decisionNo}</span>}
              </div>
            </div>
          </div>
          {['prerequisites', 'learningOutcomes', 'commonChallenges'].map(field => (
            <div className="form-section" key={field}>
              <div className="form-section-header">
                <h3 className="form-section-title">{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
                <button type="button" onClick={() => setShowInput(prev => ({ ...prev, [field]: true }))} className="btn-add-item"><Plus size={16} /></button>
              </div>
              <div className="form-content">
                {showInput[field] && (
                  <div className="input-with-button">
                    <input
                      type="text"
                      placeholder={`Add a ${field.slice(0, -1)}...`}
                      className="form-input"
                      value={inputValue[field] || ''}
                      onChange={(e) => setInputValue(prev => ({ ...prev, [field]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleArrayChange(field as any);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleArrayChange(field as any)}
                      className="btn-add-confirm"
                      style={{ marginLeft: '8px' }}
                    >
                      Add
                    </button>
                  </div>
                )}
                <div className="tags-list">
                  {(formData[field as keyof typeof formData] as string[])?.map((item, idx) => (
                    <div key={idx} className="tag-item">
                      <span>{item}</span>
                      <button type="button" onClick={() => handleRemoveFromArray(idx, field as any)} className="btn-remove-tag"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
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
