import React, { useState, useMemo } from 'react';
import { Target, Trash2, Edit2, ChevronDown, Plus, X, Check, Undo, ChevronRight } from 'lucide-react';

// Define types
interface Outcome {
  id: number;
  text: string;
  materialId: number;
  materialName: string;
  status: 'pending' | 'approved' | 'pending_delete';
  originalText?: string; // Store original text for undo
}

interface Material {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  outcomes: Omit<Outcome, 'materialId' | 'materialName'>[];
}

interface Course {
  id: number;
  name: string;
  code: string;
  semester: string;
  materials: Material[];
}

const OutcomesManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      name: 'Programming Fundamentals',
      code: 'PRF192',
      semester: 'Semester 1',
      materials: [
        {
          id: 1,
          name: 'PRF192_Programming_Basics.pdf',
          type: 'PDF',
          size: '2.5 MB',
          date: '01/09/2024',
          outcomes: [
            { id: 1, text: 'Students understand and apply basic programming concepts', status: 'approved' },
            { id: 2, text: 'Students can write simple programs in C', status: 'approved' },
          ]
        },
        {
          id: 2,
          name: 'PRF192_Control_Structures.pptx',
          type: 'PPTX',
          size: '1.8 MB',
          date: '05/09/2024',
          outcomes: [
            { id: 3, text: 'Students use control structures proficiently', status: 'approved' },
            { id: 4, text: 'Students can design algorithms for simple problems', status: 'approved' },
          ]
        },
      ]
    },
    {
      id: 2,
      name: 'Mathematics for Engineering',
      code: 'MAE101',
      semester: 'Semester 1',
      materials: [
        {
          id: 3,
          name: 'MAE101_Calculus_Basics.pdf',
          type: 'PDF',
          size: '3.1 MB',
          date: '02/09/2024',
          outcomes: [
            { id: 5, text: 'Master concepts of limits and derivatives', status: 'approved' },
            { id: 6, text: 'Apply mathematics to solve engineering problems', status: 'approved' },
          ]
        },
      ]
    },
    {
      id: 3,
      name: 'Introduction to Computer Science',
      code: 'CSI104',
      semester: 'Semester 1',
      materials: [
        {
          id: 4,
          name: 'CSI104_Computer_Architecture.pdf',
          type: 'PDF',
          size: '2.2 MB',
          date: '03/09/2024',
          outcomes: [
            { id: 7, text: 'Understand basic computer system architecture', status: 'approved' },
            { id: 8, text: 'Understand how the CPU and memory operate', status: 'approved' },
          ]
        },
      ]
    },
    {
      id: 4,
      name: 'Computer Organization and Architecture',
      code: 'CEA201',
      semester: 'Semester 1',
      materials: [
        {
          id: 5,
          name: 'CEA201_Digital_Logic.pptx',
          type: 'PPTX',
          size: '1.9 MB',
          date: '04/09/2024',
          outcomes: [
            { id: 9, text: 'Understand digital logic and basic logic gates', status: 'approved' },
            { id: 10, text: 'Design simple digital circuits', status: 'approved' },
          ]
        },
      ]
    },
    {
      id: 5,
      name: 'Object-Oriented Programming',
      code: 'PRO192',
      semester: 'Semester 2',
      materials: [
        {
          id: 6,
          name: 'PRO192_OOP_Concepts.pdf',
          type: 'PDF',
          size: '2.8 MB',
          date: '15/01/2025',
          outcomes: [
            { id: 11, text: 'Understand and apply OOP concepts: Class, Object, Inheritance', status: 'approved' },
            { id: 12, text: 'Design and implement Java applications using OOP', status: 'approved' },
          ]
        },
        {
          id: 7,
          name: 'PRO192_Java_Basics.pptx',
          type: 'PPTX',
          size: '4.2 MB',
          date: '20/01/2025',
          outcomes: [
            { id: 13, text: 'Master Java syntax and basic structures', status: 'approved' },
            { id: 14, text: 'Use Java standard libraries proficiently', status: 'approved' },
          ]
        },
      ]
    }
  ]);

  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'];

  // View state
  const [view, setView] = useState<'courses' | 'outcomes'>('courses');

  const [selectedSemester, setSelectedSemester] = useState<string>('Semester 1');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ text: '' });
  const [editingItem, setEditingItem] = useState<Outcome | null>(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOutcome, setDeletingOutcome] = useState<{ outcomeId: number; materialId: number } | null>(null);

  // Get courses for selected semester
  const coursesForSemester = useMemo(() => {
    return courses.filter(course => course.semester === selectedSemester);
  }, [courses, selectedSemester]);

  // Auto-select first course when semester changes
  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setShowSemesterDropdown(false);
    const semesterCourses = courses.filter(c => c.semester === semester);
    setSelectedCourse(semesterCourses.length > 0 ? semesterCourses[0] : null);
  };

  // Get all outcomes from all materials in the selected course
  const getAllOutcomesForCourse = (): Outcome[] => {
    if (!selectedCourse) return [];

    const allOutcomes: Outcome[] = [];
    selectedCourse.materials.forEach(material => {
      material.outcomes.forEach(outcome => {
        allOutcomes.push({
          ...outcome,
          materialId: material.id,
          materialName: material.name
        });
      });
    });
    return allOutcomes;
  };

  const getTotalOutcomesCount = (): number => {
    if (!selectedCourse) return 0;
    return selectedCourse.materials.reduce((sum, material) => sum + material.outcomes.length, 0);
  };

  const handleAddOutcome = () => {
    if (!selectedCourse) return;

    if (!formData.text.trim()) {
      alert('Please enter the learning outcome content');
      return;
    }

    // Add to first material or create a default material entry
    const updatedCourses = courses.map(course => {
      if (course.id === selectedCourse.id) {
        // If course has materials, add to first one, otherwise we'll need to handle this differently
        if (course.materials.length > 0) {
          const updatedMaterials = course.materials.map((material, index) => {
            if (index === 0) { // Add to first material
              if (editingItem) {
                // Find and update existing outcome across all materials
                const hasOutcome = material.outcomes.some(o => o.id === editingItem.id);
                if (hasOutcome) {
                  return {
                    ...material,
                    outcomes: material.outcomes.map(outcome =>
                      outcome.id === editingItem.id ? { ...outcome, text: formData.text, status: 'pending' as const } : outcome
                    )
                  };
                }
                return material;
              } else {
                // Add new outcome
                const newOutcome = {
                  id: Date.now(),
                  text: formData.text,
                  status: 'pending' as const
                };
                return {
                  ...material,
                  outcomes: [...material.outcomes, newOutcome]
                };
              }
            }

            // Check other materials for editing
            if (editingItem) {
              const hasOutcome = material.outcomes.some(o => o.id === editingItem.id);
              if (hasOutcome) {
                return {
                  ...material,
                  outcomes: material.outcomes.map(outcome =>
                    outcome.id === editingItem.id ? { ...outcome, text: formData.text, status: 'pending' as const } : outcome
                  )
                };
              }
            }
            return material;
          });
          return { ...course, materials: updatedMaterials };
        }
        return course;
      }
      return course;
    });

    setCourses(updatedCourses);
    const updatedCourse = updatedCourses.find(c => c.id === selectedCourse.id);
    if (updatedCourse) {
      setSelectedCourse(updatedCourse);
    }
    cancelForm();
  };

  const handleDeleteOutcome = (outcomeId: number, materialId: number) => {
    if (!selectedCourse) return;
    setDeletingOutcome({ outcomeId, materialId });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedCourse || !deletingOutcome) return;

    const updatedCourses = courses.map(course => {
      if (course.id === selectedCourse.id) {
        const updatedMaterials = course.materials.map(material => {
          if (material.id === deletingOutcome.materialId) {
            return {
              ...material,
              outcomes: material.outcomes.map(outcome =>
                outcome.id === deletingOutcome.outcomeId
                  ? { ...outcome, status: 'pending_delete' as const, originalText: outcome.text }
                  : outcome
              )
            };
          }
          return material;
        });
        return { ...course, materials: updatedMaterials };
      }
      return course;
    });

    setCourses(updatedCourses);
    const updatedCourse = updatedCourses.find(c => c.id === selectedCourse.id);
    if (updatedCourse) {
      setSelectedCourse(updatedCourse);
    }
    setShowDeleteModal(false);
    setDeletingOutcome(null);
  };

  const handleEdit = (outcome: Outcome) => {
    setEditingItem(outcome);
    setFormData({ text: outcome.text });
    setShowEditModal(true);
  };

  const confirmEdit = () => {
    if (!selectedCourse || !editingItem) return;

    if (!formData.text.trim() || formData.text === editingItem.text) {
      setShowEditModal(false);
      return;
    }

    const updatedCourses = courses.map(course => {
      if (course.id === selectedCourse.id) {
        const updatedMaterials = course.materials.map(material => {
          const hasOutcome = material.outcomes.some(o => o.id === editingItem.id);
          if (hasOutcome) {
            return {
              ...material,
              outcomes: material.outcomes.map(outcome =>
                outcome.id === editingItem.id
                  ? { ...outcome, text: formData.text, status: 'pending' as const, originalText: editingItem.text }
                  : outcome
              )
            };
          }
          return material;
        });
        return { ...course, materials: updatedMaterials };
      }
      return course;
    });

    setCourses(updatedCourses);
    const updatedCourse = updatedCourses.find(c => c.id === selectedCourse.id);
    if (updatedCourse) {
      setSelectedCourse(updatedCourse);
    }
    setShowEditModal(false);
    setEditingItem(null);
    setFormData({ text: '' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormData({ text: '' });
    setEditingItem(null);
  };

  const handleUndoChange = (outcomeId: number, materialId: number) => {
    if (!selectedCourse) return;

    const updatedCourses = courses.map(course => {
      if (course.id === selectedCourse.id) {
        const updatedMaterials = course.materials.map(material => {
          if (material.id === materialId) {
            return {
              ...material,
              outcomes: material.outcomes.map(outcome => {
                if (outcome.id === outcomeId) {
                  if (outcome.status === 'pending_delete') {
                    // Undo delete - restore to approved
                    const { originalText, ...rest } = outcome;
                    return { ...rest, status: 'approved' as const };
                  } else if (outcome.status === 'pending' && outcome.originalText) {
                    // Undo edit - restore original text and set to approved
                    const { originalText, ...rest } = outcome;
                    return { ...rest, text: originalText, status: 'approved' as const };
                  } else if (outcome.status === 'pending' && !outcome.originalText) {
                    // This is a newly added item - mark for removal
                    return null as any;
                  }
                }
                return outcome;
              }).filter((o): o is Omit<Outcome, 'materialId' | 'materialName'> => o !== null)
            };
          }
          return material;
        });
        return { ...course, materials: updatedMaterials };
      }
      return course;
    });

    setCourses(updatedCourses);
    const updatedCourse = updatedCourses.find(c => c.id === selectedCourse.id);
    if (updatedCourse) {
      setSelectedCourse(updatedCourse);
    }
  };

  const allOutcomes = getAllOutcomesForCourse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Learning Outcomes</h1>
          <p className="text-slate-600">Manage expected learning outcomes for courses</p>
        </div>

        {/* Main Container */}
        {view === 'courses' && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="p-6">
              {/* Semester Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Target className="w-5 h-5 text-purple-600" />
                    Select semester
                  </label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {coursesForSemester.length} courses
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                        {selectedSemester.replace('Semester ', '')}
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-slate-800 text-lg block">{selectedSemester}</span>
                        <span className="text-xs text-slate-600">Academic Year 2024-2025</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${showSemesterDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showSemesterDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowSemesterDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                        <div className="max-h-80 overflow-y-auto">
                          {semesters.map((semester, index) => (
                            <button
                              key={semester}
                              onClick={() => handleSemesterChange(semester)}
                              className={`w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-150 border-b border-slate-100 last:border-b-0 ${selectedSemester === semester
                                ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-l-purple-600'
                                : ''
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${selectedSemester === semester
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                                  }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800">{semester}</div>
                                  <div className="text-xs text-slate-500">
                                    {courses.filter(c => c.semester === semester).length} courses
                                  </div>
                                </div>
                                {selectedSemester === semester && (
                                  <div className="ml-auto">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Course Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-800">Course list</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4"></div>
                </div>

                {coursesForSemester.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coursesForSemester.map((course) => {
                      const totalOutcomes = course.materials.reduce((sum, m) => sum + m.outcomes.length, 0);
                      return (
                        <button
                          key={course.id}
                          onClick={() => { setSelectedCourse(course); setView('outcomes'); }}
                          className={`group text-left p-5 rounded-xl border-2 transition-all duration-200 ${selectedCourse?.id === course.id
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-105'
                            : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md hover:-translate-y-1'
                            }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${selectedCourse?.id === course.id
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                              }`}>
                              <Target className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-bold mb-1 line-clamp-2 ${selectedCourse?.id === course.id ? 'text-purple-900' : 'text-slate-800'
                                }`}>
                                {course.name}
                              </h4>
                              <p className="text-sm text-slate-500 font-medium">{course.code}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <span className={`px-2 py-1 rounded-lg font-semibold ${selectedCourse?.id === course.id
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-600'
                                }`}>
                                {totalOutcomes} outcomes
                              </span>
                            </div>
                            {selectedCourse?.id === course.id && (
                              <div className="flex items-center gap-1 text-purple-600 text-xs font-semibold">
                                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Target className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                    <p className="text-lg font-semibold">No courses in this semester</p>
                    <p className="text-sm mt-1">Please select another semester</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Outcomes List by Course */}
        {view === 'outcomes' && selectedCourse && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 mt-6">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className='max-w-9/12'>
                    <button
                      onClick={() => { setView('courses'); setSelectedCourse(null); }}
                      className="mb-3 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to course list
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <Target className="w-6 h-6 text-purple-600" />
                      Learning Outcomes - {selectedCourse.name}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">{selectedCourse.code}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold">
                      {getTotalOutcomesCount()} outcomes
                    </span>
                    {!showForm && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-sm hover:shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        Add Outcome
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add/Edit Form */}
              {showForm && (
                <div className="mb-6 p-5 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">
                    ➕ Add new learning outcome for the course
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Outcome content *
                      </label>
                      <textarea
                        value={formData.text}
                        onChange={(e) => setFormData({ text: e.target.value })}
                        placeholder="Enter expected outcome content..."
                        rows={4}
                        className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleAddOutcome}
                        disabled={!formData.text.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm hover:shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        Add outcome
                      </button>
                      <button
                        onClick={cancelForm}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Outcomes List */}
              <div>
                {allOutcomes.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-xl">
                    <Target className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-semibold mb-1">No learning outcomes yet</p>
                    <p className="text-sm">Click "Add Outcome" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pending Delete */}
                    {allOutcomes.some(o => o.status === 'pending_delete') && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-800">Outcomes pending deletion</h4>
                          <span className="text-xs text-slate-500">{allOutcomes.filter(o => o.status === 'pending_delete').length} items</span>
                        </div>
                        <div className="space-y-2">
                          {allOutcomes.filter(o => o.status === 'pending_delete').map((outcome, index) => (
                            <div
                              key={`${outcome.materialId}-${outcome.id}`}
                              className="flex items-center gap-3 p-3 border border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all bg-red-50 group"
                            >
                              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                                <span className="font-bold text-red-600">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800">
                                  <span className="line-through">{outcome.text}</span>
                                  <span className="text-xs text-red-700 font-medium"> (Pending deletion)</span>
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleUndoChange(outcome.id, outcome.materialId)}
                                  className="flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm font-medium"
                                  title="Undo"
                                >
                                  <Undo className="w-4 h-4" />
                                  Undo
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending */}
                    {allOutcomes.some(o => o.status === 'pending') && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-800">Outcomes pending approval</h4>
                          <span className="text-xs text-slate-500">{allOutcomes.filter(o => o.status === 'pending').length} items</span>
                        </div>
                        <div className="space-y-2">
                          {allOutcomes.filter(o => o.status === 'pending').map((outcome, index) => (
                            <div
                              key={`${outcome.materialId}-${outcome.id}`}
                              className="flex items-center gap-3 p-3 border border-yellow-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-all bg-yellow-50 group"
                            >
                              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-200 transition-colors">
                                <span className="font-bold text-yellow-600">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800">
                                  {outcome.text}
                                  <span className="text-xs text-yellow-700 font-medium"> (Pending approval)</span>
                                  {outcome.originalText && (
                                    <span className="block text-xs text-slate-500 mt-1 line-through">
                                      Before: {outcome.originalText}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleUndoChange(outcome.id, outcome.materialId)}
                                  className="flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm font-medium"
                                  title="Undo"
                                >
                                  <Undo className="w-4 h-4" />
                                  Undo
                                </button>
                                <button
                                  onClick={() => handleEdit(outcome)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {outcome.originalText && (
                                  <button
                                    onClick={() => handleDeleteOutcome(outcome.id, outcome.materialId)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approved */}
                    {allOutcomes.some(o => o.status === 'approved') && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-800">Approved outcomes</h4>
                          <span className="text-xs text-slate-500">{allOutcomes.filter(o => o.status === 'approved').length} items</span>
                        </div>
                        <div className="space-y-2">
                          {allOutcomes.filter(o => o.status === 'approved').map((outcome, index) => (
                            <div
                              key={`${outcome.materialId}-${outcome.id}`}
                              className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all bg-white group"
                            >
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                                <span className="font-bold text-purple-600">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800">{outcome.text}</p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleEdit(outcome)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOutcome(outcome.id, outcome.materialId)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Edit learning outcome</h3>
              <button
                onClick={() => { setShowEditModal(false); setEditingItem(null); setFormData({ text: '' }); }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Outcome content
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ text: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:outline-none transition resize-none"
                placeholder="Enter outcome content..."
                rows={4}
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                After editing, the outcome will require admin approval again.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowEditModal(false); setEditingItem(null); setFormData({ text: '' }); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmEdit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingOutcome && (
        <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Confirm deletion</h3>
              <button
                onClick={() => { setShowDeleteModal(false); setDeletingOutcome(null); }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-slate-800 font-semibold">
                    {allOutcomes.find(o => o.id === deletingOutcome.outcomeId && o.materialId === deletingOutcome.materialId)?.text}
                  </p>
                  <p className="text-sm text-slate-500">
                    The learning outcome will be marked as pending deletion
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                The learning outcome will be marked as "Pending deletion" and requires admin approval before permanent removal.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletingOutcome(null); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Mark as pending deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutcomesManagement;
