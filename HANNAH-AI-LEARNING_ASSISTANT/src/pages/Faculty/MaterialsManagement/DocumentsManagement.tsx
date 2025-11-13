import React, { useState, useMemo } from 'react';
import { Upload, File, Trash2, Edit2, FileText, BookOpen, ChevronDown, Undo, ChevronRight } from 'lucide-react';

// Define types
interface Material {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  status: 'pending' | 'approved' | 'pending_delete';
  originalName?: string; // Store original name for undo
}

interface Course {
  id: number;
  name: string;
  code: string;
  semester: string;
  materials: Material[];
}

const DocumentsManagement: React.FC = () => {
  // Mock data with more courses across semesters
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      name: 'Programming Fundamentals',
      code: 'PRF192',
      semester: 'Semester 1',
      materials: [
        { id: 1, name: 'PRF192_Syllabus.pdf', type: 'PDF', size: '1.1 MB', date: '01/09/2024', status: 'approved' },
        { id: 2, name: 'PRF192_Chapter1.docx', type: 'DOCX', size: '2.3 MB', date: '05/09/2024', status: 'approved' },
      ]
    },
    {
      id: 2,
      name: 'Mathematics for Engineering',
      code: 'MAE101',
      semester: 'Semester 1',
      materials: [
        { id: 3, name: 'MAE101_Lecture1.pptx', type: 'PPTX', size: '3.1 MB', date: '02/09/2024', status: 'approved' },
      ]
    },
    {
      id: 3,
      name: 'Introduction to Computer Science',
      code: 'CSI104',
      semester: 'Semester 1',
      materials: []
    },
    {
      id: 4,
      name: 'Computer Organization and Architecture',
      code: 'CEA201',
      semester: 'Semester 1',
      materials: []
    },
    {
      id: 5,
      name: 'Object-Oriented Programming',
      code: 'PRO192',
      semester: 'Semester 2',
      materials: [
        { id: 5, name: 'PRO192_OOP_Concepts.pdf', type: 'PDF', size: '2.8 MB', date: '15/01/2025', status: 'approved' },
        { id: 6, name: 'PRO192_Java_Basics.pptx', type: 'PPTX', size: '4.2 MB', date: '20/01/2025', status: 'approved' },
      ]
    },
    {
      id: 6,
      name: 'Data Structures and Algorithms',
      code: 'CSD201',
      semester: 'Semester 3',
      materials: []
    }
  ]);

  // View state: show course grid or materials screen
  const [view, setView] = useState<'courses' | 'materials'>('courses');

  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'];

  const [selectedSemester, setSelectedSemester] = useState<string>('Semester 1');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

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

  const handleDeleteMaterial = (materialId: number) => {
    if (!selectedCourse) return;
    setDeletingMaterialId(materialId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedCourse || deletingMaterialId === null) return;
    setCourses(prev => {
      const updated = prev.map(course => {
        if (course.id === selectedCourse.id) {
          return {
            ...course,
            materials: course.materials.map(mat => 
              mat.id === deletingMaterialId 
                ? { ...mat, status: 'pending_delete' as const, originalName: mat.name }
                : mat
            )
          };
        }
        return course;
      });
      const updatedCourse = updated.find(c => c.id === selectedCourse.id) || null;
      setSelectedCourse(updatedCourse);
      return updated;
    });
    setShowDeleteModal(false);
    setDeletingMaterialId(null);
  };

  const getNextMaterialId = () => {
    const all = courses.flatMap(c => c.materials.map(m => m.id));
    return (all.length ? Math.max(...all) : 0) + 1;
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCourse) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setCourses(prev => {
      const updated = prev.map(course => {
        if (course.id !== selectedCourse.id) return course;
        const startId = getNextMaterialId();
        const newMats = files.map((file, i) => ({
          id: startId + i,
          name: file.name,
          type: (file.name.split('.').pop() || 'FILE').toUpperCase(),
          size: `${Math.round((file.size || 0) / 1024)} KB`,
          date: new Date().toLocaleDateString('en-US'),
          status: 'pending' as const,
        }));
        return { ...course, materials: [...newMats, ...course.materials] };
      });
      const updatedCourse = updated.find(c => c.id === selectedCourse.id) || null;
      setSelectedCourse(updatedCourse);
      return updated;
    });
    // Clear input value so same file can be uploaded again if needed
    e.currentTarget.value = '';
  };

  const handleEditMaterial = (materialId: number) => {
    if (!selectedCourse) return;
    const mat = selectedCourse.materials.find(m => m.id === materialId);
    if (!mat) return;
    setEditingMaterial(mat);
    setEditName(mat.name);
    setShowEditModal(true);
  };

  const confirmEdit = () => {
    if (!selectedCourse || !editingMaterial) return;
    if (!editName || editName.trim() === '' || editName === editingMaterial.name) {
      setShowEditModal(false);
      return;
    }

    setCourses(prev => {
      const updated = prev.map(course => {
        if (course.id !== selectedCourse.id) return course;
        return {
          ...course,
          materials: course.materials.map(m => 
            m.id === editingMaterial.id 
              ? { ...m, name: editName, status: 'pending' as const, originalName: editingMaterial.name } 
              : m
          )
        };
      });
      const updatedCourse = updated.find(c => c.id === selectedCourse.id) || null;
      setSelectedCourse(updatedCourse);
      return updated;
    });
    setShowEditModal(false);
    setEditingMaterial(null);
    setEditName('');
  };

  const handleUndoChange = (materialId: number) => {
    if (!selectedCourse) return;
    
    setCourses(prev => {
      const updated = prev.map(course => {
        if (course.id === selectedCourse.id) {
          return {
            ...course,
            materials: course.materials.map(material => {
              if (material.id === materialId) {
                if (material.status === 'pending_delete') {
                  // Undo delete - restore to approved
                  const { originalName, ...rest } = material;
                  return { ...rest, status: 'approved' as const };
                } else if (material.status === 'pending' && material.originalName) {
                  // Undo edit - restore original name and set to approved
                  const { originalName, ...rest } = material;
                  return { ...rest, name: originalName, status: 'approved' as const };
                } else if (material.status === 'pending' && !material.originalName) {
                  // This is a newly added item - remove it completely
                  return null as any; // Mark for removal
                }
              }
              return material;
            }).filter(m => m !== null) // Remove null items (newly added ones)
          };
        }
        return course;
      });
      const updatedCourse = updated.find(c => c.id === selectedCourse.id) || null;
      setSelectedCourse(updatedCourse);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Documents</h1>
          <p className="text-slate-600">Manage learning materials for courses</p>
        </div>

        {/* Main Container */}
        {view === 'courses' && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="p-6">
              {/* Semester Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Select semester
                  </label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {coursesForSemester.length} courses
                  </span>
                </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
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
                            className={`w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-150 border-b border-slate-100 last:border-b-0 ${
                              selectedSemester === semester 
                                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-l-blue-600' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${
                                selectedSemester === semester
                                  ? 'bg-blue-600 text-white'
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
                                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
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
                  {coursesForSemester.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => { setSelectedCourse(course); setView('materials'); }}
                      className={`group text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                        selectedCourse?.id === course.id
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-1'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                          selectedCourse?.id === course.id
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold mb-1 line-clamp-2 ${
                            selectedCourse?.id === course.id ? 'text-blue-900' : 'text-slate-800'
                          }`}>
                            {course.name}
                          </h4>
                          <p className="text-sm text-slate-500 font-medium">{course.code}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-sm">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedCourse?.id === course.id
                              ? 'bg-blue-100'
                              : 'bg-slate-100 group-hover:bg-blue-50'
                          }`}>
                            <File className={`w-4 h-4 ${
                              selectedCourse?.id === course.id ? 'text-blue-600' : 'text-slate-600'
                            }`} />
                          </div>
                          <span className={`font-semibold ${
                            selectedCourse?.id === course.id ? 'text-blue-700' : 'text-slate-600'
                          }`}>
                            {course.materials.length} materials
                          </span>
                        </div>
                        {selectedCourse?.id === course.id && (
                          <div className="flex items-center gap-1 text-blue-600 text-xs font-semibold">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            Selected
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-semibold">No courses in this semester</p>
                  <p className="text-sm mt-1">Please select another semester</p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Materials Content */}
        {view === 'materials' && selectedCourse && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 mt-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                      onClick={() => { setView('courses'); setSelectedCourse(null); }}
                      className="mb-3 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to course list
                    </button>
                  <h2 className="text-2xl font-bold text-slate-800">Materials - {selectedCourse.name}</h2>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition">
                  <Upload className="w-5 h-5" />
                  Upload files
                  <input type="file" className="hidden" multiple onChange={handleFileInput} />
                </label>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">Drag and drop files here or click to select</p>
                <p className="text-sm text-slate-500">Supported: PDF, DOCX, PPTX, TXT (Max: 50MB)</p>
              </div>

              <div className="space-y-6">
                {/* Pending Delete */}
                {selectedCourse.materials.some(m => m.status === 'pending_delete') && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">Materials pending deletion</h4>
                      <span className="text-xs text-slate-500">{selectedCourse.materials.filter(m => m.status === 'pending_delete').length} items</span>
                    </div>
                    <div className="space-y-3">
                      {selectedCourse.materials.filter(m => m.status === 'pending_delete').map(mat => (
                        <div key={mat.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition border border-red-200">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800">
                                <span className="line-through">{mat.name}</span> 
                                <span className="text-xs text-red-700 font-medium"> (Pending deletion)</span>
                              </p>
                              <p className="text-sm text-slate-500">{mat.type} • {mat.size} • {mat.date}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleUndoChange(mat.id)}
                            className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium flex-shrink-0 ml-2"
                            title="Undo"
                          >
                            <Undo className="w-4 h-4" />
                            Undo
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending */}
                {selectedCourse.materials.some(m => m.status === 'pending') && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">Materials pending approval</h4>
                      <span className="text-xs text-slate-500">{selectedCourse.materials.filter(m => m.status === 'pending').length} items</span>
                    </div>
                    <div className="space-y-3">
                      {selectedCourse.materials.filter(m => m.status === 'pending').map(mat => (
                        <div key={mat.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800">
                                {mat.name} 
                                <span className="text-xs text-yellow-700 font-medium"> (Pending approval)</span>
                              </p>
                              {mat.originalName && (
                                <p className="text-xs text-slate-500 line-through mt-1">
                                  Before: {mat.originalName}
                                </p>
                              )}
                              <p className="text-sm text-slate-500">{mat.type} • {mat.size} • {mat.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button 
                              onClick={() => handleUndoChange(mat.id)}
                              className="flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition text-sm font-medium"
                              title="Undo"
                            >
                              <Undo className="w-4 h-4" />
                              Undo
                            </button>
                            <button onClick={() => handleEditMaterial(mat.id)} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {mat.originalName && (
                              <button onClick={() => handleDeleteMaterial(mat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
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
                {selectedCourse.materials.some(m => m.status === 'approved') ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">Approved materials</h4>
                      <span className="text-xs text-slate-500">{selectedCourse.materials.filter(m => m.status === 'approved').length} items</span>
                    </div>
                    <div className="space-y-3">
                      {selectedCourse.materials.filter(m => m.status === 'approved').map(mat => (
                        <div key={mat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-semibold text-slate-800">{mat.name}</p>
                              <p className="text-sm text-slate-500">{mat.type} • {mat.size} • {mat.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditMaterial(mat.id)} className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteMaterial(mat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  !selectedCourse.materials.some(m => m.status === 'pending') && (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p>No materials for this course yet</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Edit material</h3>
              <button 
                onClick={() => { setShowEditModal(false); setEditingMaterial(null); setEditName(''); }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Material name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                placeholder="Enter material name..."
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && confirmEdit()}
              />
              <p className="text-xs text-slate-500 mt-2">
                After editing, the material will require admin approval again.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowEditModal(false); setEditingMaterial(null); setEditName(''); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingMaterialId !== null && (
        <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Confirm deletion</h3>
              <button 
                onClick={() => { setShowDeleteModal(false); setDeletingMaterialId(null); }}
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
                    {selectedCourse?.materials.find(m => m.id === deletingMaterialId)?.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    The material will be marked as pending deletion
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                The material will be marked as "Pending deletion" and requires admin approval before permanent removal.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletingMaterialId(null); }}
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

export default DocumentsManagement;
