import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, Plus, Search, Filter, Edit, Trash2, Eye, Clock, Loader, X, Save } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import subjectService, { type Subject } from '../../../service/subjectService';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import SyllabusImportButton from './SyllabusImportButton';
import './CourseManagement.css';

const initialFormState: Partial<Subject> = {
  code: '', name: '', semester: 1, credits: 3, description: '',
  minAvgMarkToPass: 5.0, degreeLevel: 'Undergraduate', scoringScale: '10-point Scale',
  estimatedHours: 45, prerequisites: [], learningOutcomes: [], commonChallenges: [],
  timeAllocation: '', tools: '', decisionNo: '',
};

export default function CourseManagement() {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Subject>>(initialFormState);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState<{ [key: string]: boolean }>({});
  const [inputValue, setInputValue] = useState<{ [key: string]: string }>({});
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [expandedSyllabus, setExpandedSyllabus] = useState<{ [key: string]: boolean }>({});

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    subjectId: number | null;
    subjectName: string;
  }>({
    isOpen: false,
    subjectId: null,
    subjectName: '',
  });

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

  const handleEditClick = async (subject: Subject) => {
    try {
      console.log('=== EDIT CLICK - Fetching Subject Details ===');
      console.log('Subject ID:', subject.subjectId);

      // Fetch full subject details from API
      const fullSubject = await subjectService.getSubjectById(subject.subjectId);

      console.log('Full subject from API:', fullSubject);
      console.log('Prerequisites:', fullSubject.prerequisites);
      console.log('Learning Outcomes:', fullSubject.learningOutcomes);
      console.log('Common Challenges:', fullSubject.commonChallenges);

      // Coalesce nullish values to their empty state to prevent uncontrolled component warnings
      const populatedData = {
        ...initialFormState,
        ...fullSubject,
        description: fullSubject.description ?? '',
        timeAllocation: fullSubject.timeAllocation ?? '',
        tools: fullSubject.tools ?? '',
        decisionNo: fullSubject.decisionNo ?? '',
        prerequisites: fullSubject.prerequisites ?? [],
        learningOutcomes: fullSubject.learningOutcomes ?? [],
        commonChallenges: fullSubject.commonChallenges ?? [],
      };

      console.log('Populated form data:', populatedData);
      console.log('=================================');

      setFormData(populatedData);
      setEditingSubjectId(fullSubject.subjectId);
      setView('edit');
    } catch (error) {
      console.error('Error fetching subject details:', error);
      toast.error('Failed to load subject details');
    }
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

  /**
   * Handle syllabus import from HTML file
   * Auto-fills the form with parsed data from FLM syllabus
   * Note: Semester is NOT imported - admin already selected it before creating subject
   */
  const handleSyllabusImport = (importedData: {
    code: string;
    name: string;
    credits: number;
    description: string;
    prerequisites: string[];
    learningOutcomes?: string; // JSON string with full CLO data [{number, name, details}]
    degreeLevel: string;
    timeAllocation: string;
    tools: string;
    scoringScale: string;
    decisionNo: string;
    minAvgMarkToPass: number;
    // Syllabus JSON fields
    assessments?: string;
    sessions?: string;
    syllabusMaterials?: string;
    studentTasks?: string;
  }) => {
    console.log('📥 Syllabus data imported:', importedData);

    // Parse learningOutcomes JSON to create display-friendly array
    let parsedLOs: string[] = [];
    if (importedData.learningOutcomes) {
      try {
        const cloData = JSON.parse(importedData.learningOutcomes) as Array<{ number: string; name: string; details: string }>;
        // Create display format: "CLO1: Full description"
        parsedLOs = cloData.map(clo => `${clo.name}: ${clo.details || clo.name}`);
        console.log('📚 Parsed Learning Outcomes:', parsedLOs);
      } catch (e) {
        console.warn('Failed to parse learningOutcomes JSON:', e);
      }
    }

    setFormData(prev => ({
      ...prev,
      code: importedData.code || prev.code,
      name: importedData.name || prev.name,
      credits: importedData.credits || prev.credits,
      description: importedData.description || prev.description,
      degreeLevel: importedData.degreeLevel || prev.degreeLevel,
      timeAllocation: importedData.timeAllocation || prev.timeAllocation,
      tools: importedData.tools || prev.tools,
      scoringScale: importedData.scoringScale || prev.scoringScale,
      decisionNo: importedData.decisionNo || prev.decisionNo,
      minAvgMarkToPass: importedData.minAvgMarkToPass || prev.minAvgMarkToPass,
      // Note: Keep existing semester - admin already selected it
      prerequisites: importedData.prerequisites?.length ? importedData.prerequisites : prev.prerequisites,
      learningOutcomes: parsedLOs.length ? parsedLOs : prev.learningOutcomes,
      // Syllabus JSON data (store raw JSON for backend)
      assessments: importedData.assessments || prev.assessments,
      sessions: importedData.sessions || prev.sessions,
      syllabusMaterials: importedData.syllabusMaterials || prev.syllabusMaterials,
      studentTasks: importedData.studentTasks || prev.studentTasks,
    }));

    // Clear any previous validation errors since we have new data
    setFieldErrors({});
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
      // Syllabus import fields (JSON strings from HTML import)
      assessments: formData.assessments,
      sessions: formData.sessions,
      syllabusMaterials: formData.syllabusMaterials,
      studentTasks: formData.studentTasks,
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

        // Check if subject was updated (already existed) or created new
        if (result?.isUpdated) {
          toast.success(`Course "${formData.code}" already exists and has been updated with new data!`, {
            duration: 5000,
            icon: '🔄'
          });
        } else {
          toast.success('Course created successfully!');
        }
      }

      // Fetch updated data
      await fetchSubjects();

      setView('list');
      setFieldErrors({});
      setFormData(initialFormState);
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
      } else if (error.response?.data?.message) {
        // Show backend validation message (e.g., duplicate subject)
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save course. Check fields and try again.');
      }
      console.error('Error saving subject:', error);
    } finally {
      setIsSubmitting(false);
      setEditingSubjectId(null);
    }
  };

  const handleDeleteClick = (subject: Subject) => {
    setDeleteModal({
      isOpen: true,
      subjectId: subject.subjectId,
      subjectName: subject.name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.subjectId) return;

    try {
      await subjectService.deleteSubject(deleteModal.subjectId);
      toast.success('Course deleted successfully!');
      await fetchSubjects(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete course.');
      console.error('Error deleting subject:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      subjectId: null,
      subjectName: '',
    });
  };

  // Convert semester (can be number or enum string like 'First', 'Second') to number
  const semesterEnumToNumber: { [key: string]: number } = {
    'First': 1, 'Second': 2, 'Third': 3, 'Fourth': 4, 'Fifth': 5,
    'Sixth': 6, 'Seventh': 7, 'Eighth': 8, 'Ninth': 9
  };

  const getSemesterNumber = (semester: number | string | undefined): number => {
    if (typeof semester === 'number') return semester;
    if (typeof semester === 'string') {
      return semesterEnumToNumber[semester] || parseInt(semester) || 1;
    }
    return 1;
  };

  const filteredSubjects = subjects.filter(subject => {
    const subjectSemesterNum = getSemesterNumber(subject.semester);
    const matchSemester = selectedSemester === 'all' || subjectSemesterNum === parseInt(selectedSemester);
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
        <div className="cm-filters">
          <div className="cm-search-wrapper">
            <Search className="cm-search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cm-search-input"
            />
          </div>
          <div className="cm-filter-wrapper">
            <Filter className="cm-filter-icon" size={18} />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="cm-filter-select"
            >
              <option value="all">All Semesters</option>
              {Array.from({ length: 9 }, (_, i) => i + 1).map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="loading-state"><Loader className="animate-spin" size={48} /><p>Loading Courses...</p></div>
      ) : (
        <>
          <div className="courses-grid">
            {filteredSubjects.map(subject => (
              <div
                key={subject.subjectId}
                className="course-card"
                onClick={() => navigate(`/admin/course-management/${subject.subjectId}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="course-card-content">
                  <div className="course-card-header">
                    <h3 className="course-card-title">{subject.name}</h3>
                    <div className="course-card-actions" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/admin/course-management/${subject.subjectId}`} className="btn-view"><Eye size={20} /></Link>
                      <button onClick={() => handleEditClick(subject)} className="btn-edit"><Edit size={20} /></button>
                      <button onClick={() => handleDeleteClick(subject)} className="btn-delete"><Trash2 size={20} /></button>
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
        <div>
          <h1 className="create-title"><Map size={32} />{view === 'create' ? 'Create New Course' : 'Edit Course'}</h1>
          <p className="create-subtitle">Define course information and learning outcomes</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Import from HTML - available in both create and edit modes */}
          <SyllabusImportButton onImport={handleSyllabusImport} disabled={isSubmitting} />
          <button onClick={handleCancel} className="btn-cancel"><X size={16} />Cancel</button>
        </div>
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

              {/* Syllabus Import Summary - show only if data was imported */}
              {(formData.sessions || formData.assessments || formData.syllabusMaterials || formData.studentTasks) && (
                <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <label className="form-label" style={{ color: '#6366f1', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📚 Imported Syllabus Data (Click to expand)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: expandedSyllabus.sessions || expandedSyllabus.assessments || expandedSyllabus.materials || expandedSyllabus.studentTasks ? '1rem' : 0 }}>
                    {formData.sessions && (() => {
                      try {
                        const sessions = JSON.parse(formData.sessions);
                        return (
                          <button type="button" onClick={() => setExpandedSyllabus(prev => ({ ...prev, sessions: !prev.sessions }))}
                            style={{ padding: '0.5rem 1rem', background: expandedSyllabus.sessions ? '#059669' : '#10b981', color: 'white', borderRadius: '20px', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}>
                            {expandedSyllabus.sessions ? '▼' : '▶'} {sessions.length} Sessions
                          </button>
                        );
                      } catch { return null; }
                    })()}
                    {formData.assessments && (() => {
                      try {
                        const assessments = JSON.parse(formData.assessments);
                        return (
                          <button type="button" onClick={() => setExpandedSyllabus(prev => ({ ...prev, assessments: !prev.assessments }))}
                            style={{ padding: '0.5rem 1rem', background: expandedSyllabus.assessments ? '#d97706' : '#f59e0b', color: 'white', borderRadius: '20px', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}>
                            {expandedSyllabus.assessments ? '▼' : '▶'} {assessments.length} Assessments
                          </button>
                        );
                      } catch { return null; }
                    })()}
                    {formData.syllabusMaterials && (() => {
                      try {
                        const materials = JSON.parse(formData.syllabusMaterials);
                        return (
                          <button type="button" onClick={() => setExpandedSyllabus(prev => ({ ...prev, materials: !prev.materials }))}
                            style={{ padding: '0.5rem 1rem', background: expandedSyllabus.materials ? '#2563eb' : '#3b82f6', color: 'white', borderRadius: '20px', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}>
                            {expandedSyllabus.materials ? '▼' : '▶'} {materials.length} Materials
                          </button>
                        );
                      } catch { return null; }
                    })()}
                    {formData.studentTasks && (
                      <button type="button" onClick={() => setExpandedSyllabus(prev => ({ ...prev, studentTasks: !prev.studentTasks }))}
                        style={{ padding: '0.5rem 1rem', background: expandedSyllabus.studentTasks ? '#7c3aed' : '#8b5cf6', color: 'white', borderRadius: '20px', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}>
                        {expandedSyllabus.studentTasks ? '▼' : '▶'} Student Tasks
                      </button>
                    )}
                  </div>

                  {/* Expanded Sessions Table */}
                  {expandedSyllabus.sessions && formData.sessions && (() => {
                    try {
                      const sessions = JSON.parse(formData.sessions) as Array<{ session?: string; topic?: string; type?: string; lo?: string; materials?: string; studentTasks?: string }>;
                      return (
                        <div style={{ marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead style={{ background: '#10b981', color: 'white', position: 'sticky', top: 0 }}>
                              <tr>
                                <th style={{ padding: '0.5rem', textAlign: 'left', width: '50px' }}>#</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Topic</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left', width: '80px' }}>Type</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left', width: '80px' }}>LO</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sessions.map((s, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <td style={{ padding: '0.5rem', color: '#6b7280' }}>{s.session || i + 1}</td>
                                  <td style={{ padding: '0.5rem' }}>{s.topic || '-'}</td>
                                  <td style={{ padding: '0.5rem', color: '#6b7280' }}>{s.type || '-'}</td>
                                  <td style={{ padding: '0.5rem', color: '#6b7280' }}>{s.lo || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    } catch { return null; }
                  })()}

                  {/* Expanded Assessments Table */}
                  {expandedSyllabus.assessments && formData.assessments && (() => {
                    try {
                      const assessments = JSON.parse(formData.assessments) as Array<{ type?: string; category?: string; weight?: string; duration?: string; clo?: string; passCondition?: string }>;
                      return (
                        <div style={{ marginBottom: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead style={{ background: '#f59e0b', color: 'white' }}>
                              <tr>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Type</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Weight</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Duration</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>CLO</th>
                              </tr>
                            </thead>
                            <tbody>
                              {assessments.map((a, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <td style={{ padding: '0.5rem', fontWeight: 500 }}>{a.type || '-'}</td>
                                  <td style={{ padding: '0.5rem' }}>{a.category || '-'}</td>
                                  <td style={{ padding: '0.5rem', color: '#10b981', fontWeight: 600 }}>{a.weight || '-'}</td>
                                  <td style={{ padding: '0.5rem', color: '#6b7280' }}>{a.duration || '-'}</td>
                                  <td style={{ padding: '0.5rem', color: '#6366f1' }}>{a.clo || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    } catch { return null; }
                  })()}

                  {/* Expanded Materials List */}
                  {expandedSyllabus.materials && formData.syllabusMaterials && (() => {
                    try {
                      const materials = JSON.parse(formData.syllabusMaterials) as Array<{ description?: string; author?: string; isMain?: boolean }>;
                      return (
                        <div style={{ marginBottom: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '0.75rem' }}>
                          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                            {materials.map((m, i) => (
                              <li key={i} style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                <a href={m.description} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                  {m.description}
                                </a>
                                {m.author && <span style={{ color: '#6b7280' }}> - {m.author}</span>}
                                {m.isMain && <span style={{ background: '#3b82f6', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', marginLeft: '0.5rem' }}>Main</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    } catch { return null; }
                  })()}

                  {/* Expanded Student Tasks */}
                  {expandedSyllabus.studentTasks && formData.studentTasks && (
                    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '0.75rem', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                      {formData.studentTasks}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {['prerequisites', 'learningOutcomes', 'commonChallenges'].map(field => {
            const fieldData = formData[field as keyof typeof formData] as string[];
            console.log(`🔍 Rendering ${field}:`, fieldData);

            return (
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
                    {fieldData?.map((item, idx) => (
                      <div key={idx} className="tag-item">
                        <span>{item}</span>
                        <button type="button" onClick={() => handleRemoveFromArray(idx, field as any)} className="btn-remove-tag"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteModal.subjectName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </AdminPageWrapper>
  );
}
