import { useState, useEffect } from 'react';
import { Users, BookOpen, Plus, Trash2, X, Loader2, ChevronDown, ChevronRight, Search, Edit2 } from 'lucide-react';
import AdminPageWrapper from '../components/AdminPageWrapper';
import specializationService, { type Specialization, type SpecializationSubject } from '../../../service/specializationService';
import subjectService, { type Subject } from '../../../service/subjectService';
import { toast } from 'react-hot-toast';
import './SpecializationManagement.css';

export default function SpecializationManagement() {
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [specializationSubjects, setSpecializationSubjects] = useState<{ [key: number]: SpecializationSubject[] }>({});
    const [loadingSubjects, setLoadingSubjects] = useState<number | null>(null);

    // Add subject modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedSpecId, setSelectedSpecId] = useState<number | null>(null);
    const [addFormData, setAddFormData] = useState({
        subjectId: 0,
        subjectType: 'required',
        semesterRecommended: 5,
        notes: ''
    });
    const [subjectSearch, setSubjectSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Specialization CRUD modal state
    const [showSpecModal, setShowSpecModal] = useState(false);
    const [editingSpec, setEditingSpec] = useState<Specialization | null>(null);
    const [specFormData, setSpecFormData] = useState({
        code: '',
        name: '',
        nameEn: '',
        description: '',
        majorCode: 'SE',
        requiredCredits: 148,
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [specsData, subjectsData] = await Promise.all([
                specializationService.getAllSpecializations(false),
                subjectService.getAllSubjects(1000)
            ]);
            setSpecializations(specsData);
            setSubjects(subjectsData.items || []);
        } catch (error) {
            toast.error('Failed to load specializations.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExpand = async (specId: number) => {
        if (expandedId === specId) {
            setExpandedId(null);
            return;
        }

        setExpandedId(specId);

        // Fetch subjects if not already loaded
        if (!specializationSubjects[specId]) {
            setLoadingSubjects(specId);
            try {
                const subs = await specializationService.getSpecializationSubjects(specId);
                setSpecializationSubjects(prev => ({ ...prev, [specId]: subs }));
            } catch (error) {
                toast.error('Failed to load subjects for this specialization.');
                console.error(error);
            } finally {
                setLoadingSubjects(null);
            }
        }
    };

    const handleAddSubjectClick = (specId: number) => {
        setSelectedSpecId(specId);
        setAddFormData({
            subjectId: 0,
            subjectType: 'required',
            semesterRecommended: 5,
            notes: ''
        });
        setSubjectSearch('');
        setShowAddModal(true);
    };

    const handleAddSubject = async () => {
        if (!selectedSpecId || !addFormData.subjectId) {
            toast.error('Please select a subject.');
            return;
        }

        setIsSubmitting(true);
        try {
            await specializationService.addSubjectToSpecialization(selectedSpecId, {
                subjectId: addFormData.subjectId,
                subjectType: addFormData.subjectType,
                semesterRecommended: addFormData.semesterRecommended,
                notes: addFormData.notes || undefined
            });

            toast.success('Subject added to specialization!');
            setShowAddModal(false);

            // Refresh the subjects list for this specialization
            const subs = await specializationService.getSpecializationSubjects(selectedSpecId);
            setSpecializationSubjects(prev => ({ ...prev, [selectedSpecId]: subs }));

            // Refresh specializations to update counts
            const specsData = await specializationService.getAllSpecializations(false);
            setSpecializations(specsData);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add subject.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveSubject = async (specId: number, subjectId: number, subjectCode: string) => {
        if (!confirm(`Remove ${subjectCode} from this specialization?`)) return;

        try {
            await specializationService.removeSubjectFromSpecialization(specId, subjectId);
            toast.success('Subject removed from specialization.');

            // Update local state
            setSpecializationSubjects(prev => ({
                ...prev,
                [specId]: prev[specId].filter(s => s.subjectId !== subjectId)
            }));

            // Refresh specializations to update counts
            const specsData = await specializationService.getAllSpecializations(false);
            setSpecializations(specsData);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to remove subject.');
            console.error(error);
        }
    };

    // ==================== Specialization CRUD Handlers ====================

    const handleCreateSpec = () => {
        setEditingSpec(null);
        setSpecFormData({
            code: '',
            name: '',
            nameEn: '',
            description: '',
            majorCode: 'SE',
            requiredCredits: 148,
            isActive: true
        });
        setShowSpecModal(true);
    };

    const handleEditSpec = (spec: Specialization, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSpec(spec);
        setSpecFormData({
            code: spec.code,
            name: spec.name,
            nameEn: spec.nameEn || '',
            description: spec.description || '',
            majorCode: spec.majorCode,
            requiredCredits: spec.requiredCredits,
            isActive: spec.isActive
        });
        setShowSpecModal(true);
    };

    const handleSaveSpec = async () => {
        if (!specFormData.code || !specFormData.name) {
            toast.error('Code and Name are required.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingSpec) {
                // Update existing
                await specializationService.updateSpecialization(editingSpec.id, specFormData);
                toast.success('Specialization updated!');
            } else {
                // Create new
                await specializationService.createSpecialization(specFormData as any);
                toast.success('Specialization created!');
            }
            setShowSpecModal(false);
            await fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save specialization.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSpec = async (spec: Specialization, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Delete specialization "${spec.name}"? This will also remove all linked subjects and clear student associations.`)) return;

        try {
            await specializationService.deleteSpecialization(spec.id);
            toast.success('Specialization deleted!');
            await fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete specialization.');
            console.error(error);
        }
    };

    // Filter subjects for dropdown (exclude already added ones)
    const availableSubjects = subjects.filter(sub => {
        const alreadyAdded = selectedSpecId && specializationSubjects[selectedSpecId]?.some(
            ss => ss.subjectId === sub.subjectId
        );
        const matchesSearch = sub.code.toLowerCase().includes(subjectSearch.toLowerCase()) ||
            sub.name.toLowerCase().includes(subjectSearch.toLowerCase());
        return !alreadyAdded && matchesSearch;
    });

    const getSubjectTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'required': return 'bg-red-100 text-red-700';
            case 'elective': return 'bg-blue-100 text-blue-700';
            case 'recommended': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <AdminPageWrapper title="Specialization Management">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-slate-600">Loading specializations...</span>
                </div>
            </AdminPageWrapper>
        );
    }

    return (
        <AdminPageWrapper title="Specialization Management">
            <div className="spec-management">
                <div className="spec-header">
                    <p className="spec-subtitle">Manage which subjects belong to each specialization (chuyên ngành hẹp).</p>
                    <button className="btn-create-spec" onClick={handleCreateSpec}>
                        <Plus size={16} /> Create Specialization
                    </button>
                </div>

                <div className="spec-grid">
                    {specializations.map(spec => (
                        <div key={spec.id} className={`spec-card ${expandedId === spec.id ? 'expanded' : ''}`}>
                            <div className="spec-card-header" onClick={() => handleExpand(spec.id)}>
                                <div className="spec-icon">
                                    <Users size={24} />
                                </div>
                                <div className="spec-info">
                                    <h3 className="spec-name">{spec.name}</h3>
                                    <p className="spec-code">{spec.code} • {spec.majorCode}</p>
                                    <div className="spec-stats">
                                        <span className="stat required">{spec.requiredSubjects} required</span>
                                        <span className="stat elective">{spec.electiveSubjects} elective</span>
                                        <span className="stat total">{spec.totalSubjects} total</span>
                                    </div>
                                </div>
                                <div className="spec-actions">
                                    <button className="btn-edit" onClick={(e) => handleEditSpec(spec, e)} title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="btn-delete" onClick={(e) => handleDeleteSpec(spec, e)} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="spec-expand">
                                    {expandedId === spec.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                            </div>

                            {expandedId === spec.id && (
                                <div className="spec-subjects">
                                    <div className="spec-subjects-header">
                                        <h4>Linked Subjects</h4>
                                        <button
                                            className="btn-add-subject"
                                            onClick={(e) => { e.stopPropagation(); handleAddSubjectClick(spec.id); }}
                                        >
                                            <Plus size={16} /> Add Subject
                                        </button>
                                    </div>

                                    {loadingSubjects === spec.id ? (
                                        <div className="subjects-loading">
                                            <Loader2 className="w-5 h-5 animate-spin" /> Loading subjects...
                                        </div>
                                    ) : (
                                        <>
                                            {(!specializationSubjects[spec.id] || specializationSubjects[spec.id].length === 0) ? (
                                                <div className="no-subjects">
                                                    <BookOpen className="w-12 h-12 text-slate-300" />
                                                    <p>No subjects linked yet.</p>
                                                    <button
                                                        className="btn-add-first"
                                                        onClick={(e) => { e.stopPropagation(); handleAddSubjectClick(spec.id); }}
                                                    >
                                                        <Plus size={16} /> Add First Subject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="subjects-list">
                                                    {specializationSubjects[spec.id].map(sub => (
                                                        <div key={sub.subjectId} className="subject-item">
                                                            <div className="subject-info">
                                                                <span className="subject-code">{sub.subjectCode}</span>
                                                                <span className="subject-name">{sub.subjectName}</span>
                                                                <span className={`subject-type ${getSubjectTypeColor(sub.subjectType)}`}>
                                                                    {sub.subjectType}
                                                                </span>
                                                                {sub.semesterRecommended && (
                                                                    <span className="subject-semester">Sem {sub.semesterRecommended}</span>
                                                                )}
                                                            </div>
                                                            <button
                                                                className="btn-remove"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveSubject(spec.id, sub.subjectId, sub.subjectCode);
                                                                }}
                                                                title="Remove from specialization"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Subject Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Subject to Specialization</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Search Subject</label>
                                <div className="search-input-wrapper">
                                    <Search className="search-icon" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by code or name..."
                                        value={subjectSearch}
                                        onChange={(e) => setSubjectSearch(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Select Subject</label>
                                <select
                                    value={addFormData.subjectId}
                                    onChange={(e) => setAddFormData(prev => ({ ...prev, subjectId: Number(e.target.value) }))}
                                    className="form-select"
                                >
                                    <option value={0}>-- Select a subject --</option>
                                    {availableSubjects.slice(0, 50).map(sub => (
                                        <option key={sub.subjectId} value={sub.subjectId}>
                                            {sub.code} - {sub.name}
                                        </option>
                                    ))}
                                </select>
                                {availableSubjects.length > 50 && (
                                    <p className="form-hint">Showing first 50 results. Type to narrow down.</p>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Subject Type</label>
                                    <select
                                        value={addFormData.subjectType}
                                        onChange={(e) => setAddFormData(prev => ({ ...prev, subjectType: e.target.value }))}
                                        className="form-select"
                                    >
                                        <option value="required">Required</option>
                                        <option value="elective">Elective</option>
                                        <option value="recommended">Recommended</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Recommended Semester</label>
                                    <select
                                        value={addFormData.semesterRecommended}
                                        onChange={(e) => setAddFormData(prev => ({ ...prev, semesterRecommended: Number(e.target.value) }))}
                                        className="form-select"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(sem => (
                                            <option key={sem} value={sem}>Semester {sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notes (optional)</label>
                                <textarea
                                    value={addFormData.notes}
                                    onChange={(e) => setAddFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any additional notes..."
                                    className="form-textarea"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleAddSubject}
                                disabled={isSubmitting || !addFormData.subjectId}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} /> Add Subject
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Specialization Modal */}
            {showSpecModal && (
                <div className="modal-overlay" onClick={() => setShowSpecModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingSpec ? 'Edit Specialization' : 'Create Specialization'}</h3>
                            <button className="modal-close" onClick={() => setShowSpecModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Code *</label>
                                    <input
                                        type="text"
                                        value={specFormData.code}
                                        onChange={(e) => setSpecFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g. BE_NET"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Major Code</label>
                                    <select
                                        value={specFormData.majorCode}
                                        onChange={(e) => setSpecFormData(prev => ({ ...prev, majorCode: e.target.value }))}
                                        className="form-select"
                                    >
                                        <option value="SE">SE - Software Engineering</option>
                                        <option value="AI">AI - Artificial Intelligence</option>
                                        <option value="IS">IS - Information Systems</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Name (Vietnamese) *</label>
                                <input
                                    type="text"
                                    value={specFormData.name}
                                    onChange={(e) => setSpecFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Backend .NET Developer"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Name (English)</label>
                                <input
                                    type="text"
                                    value={specFormData.nameEn}
                                    onChange={(e) => setSpecFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                                    placeholder="e.g. Backend .NET Developer"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={specFormData.description}
                                    onChange={(e) => setSpecFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of the specialization..."
                                    className="form-textarea"
                                    rows={3}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Required Credits</label>
                                    <input
                                        type="number"
                                        value={specFormData.requiredCredits}
                                        onChange={(e) => setSpecFormData(prev => ({ ...prev, requiredCredits: Number(e.target.value) }))}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={specFormData.isActive ? 'active' : 'inactive'}
                                        onChange={(e) => setSpecFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                                        className="form-select"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowSpecModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleSaveSpec}
                                disabled={isSubmitting || !specFormData.code || !specFormData.name}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        {editingSpec ? 'Save Changes' : 'Create Specialization'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageWrapper>
    );
}
