import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, File, Trash2, Edit2, FileText, BookOpen, ChevronDown, Undo, ChevronRight, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import subjectService from '../../../service/subjectService';
import type { Subject } from '../../../service/subjectService';
import documentService from '../../../service/documentService';


// Define types
interface Material {
  documentId: number;
  title: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  description?: string;
  filePath: string;
}

interface Course {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  semester: string;
  materials: Material[];
  materialsCount?: number;
}

const DocumentsManagement: React.FC = () => {
  // URL params for state persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');
  const semesterFromUrl = searchParams.get('semester');

  // State management

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // View state: show course grid or materials screen
  const [view, setView] = useState<'courses' | 'materials'>(courseIdFromUrl ? 'materials' : 'courses');

  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'];

  const [selectedSemester, setSelectedSemester] = useState<string>(semesterFromUrl || 'Semester 1');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Restore course selection from URL after courses are loaded
  useEffect(() => {
    if (courses.length > 0 && courseIdFromUrl) {
      const courseId = parseInt(courseIdFromUrl);
      const course = courses.find(c => c.subjectId === courseId);
      if (course && !selectedCourse) {
        setSelectedCourse(course);
        setSelectedSemester(course.semester);
        setView('materials');
        fetchDocuments(course.subjectId);
      }
    }
  }, [courses, courseIdFromUrl]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subjectService.getAllSubjects();


      // Transform subjects to courses format
      const transformedCourses: Course[] = response.items.map((subject: Subject) => ({
        subjectId: subject.subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        semester: `Semester ${subject.semester || 1}`,
        materials: [],
        materialsCount: 0
      }));

      setCourses(transformedCourses);

      // Fetch materials count for all courses after initial load
      fetchMaterialsCountForCourses(transformedCourses);
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  // Fetch materials count for all courses
  const fetchMaterialsCountForCourses = async (coursesToUpdate: Course[]) => {
    try {
      // Fetch document counts for each subject in parallel
      const countPromises = coursesToUpdate.map(async (course) => {
        try {
          const documents = await documentService.getAllDocuments({ subjectId: course.subjectId });
          return {
            subjectId: course.subjectId,
            count: documents.totalCount || documents.items.length
          };
        } catch {
          return { subjectId: course.subjectId, count: 0 };
        }
      });

      const counts = await Promise.all(countPromises);

      // Update courses with materials count
      setCourses(prev => prev.map(course => {
        const countInfo = counts.find(c => c.subjectId === course.subjectId);
        return countInfo ? { ...course, materialsCount: countInfo.count } : course;
      }));
    } catch (err) {
      console.error('Error fetching materials count:', err);
    }
  };

  // Fetch documents for a specific subject with pagination
  const fetchDocuments = async (subjectId: number, page: number = 1) => {
    try {
      setDocumentsLoading(true);
      const documents = await documentService.getAllDocuments({
        subjectId,
        pageNumber: page,
        pageSize: PAGE_SIZE
      });

      // Update pagination state
      setCurrentPage(documents.pageNumber);
      setTotalPages(documents.totalPages);
      setTotalCount(documents.totalCount);

      // Transform documents to materials format
      const materials: Material[] = documents.items.map(doc => {
        // Map processingStatus to Material status with proper capitalization
        let status: Material['status'] = 'Pending';
        if (doc.approvalStatus) {
          const statusLower = doc.approvalStatus.toLowerCase();
          if (statusLower === 'completed') status = 'Completed';
          else if (statusLower === 'processing') status = 'Processing';
          else if (statusLower === 'failed') status = 'Failed';
          else status = 'Pending';
        }

        return {
          documentId: doc.documentId,
          title: doc.title,
          fileType: doc.mimeType,
          fileSize: doc.fileSize,
          uploadedAt: doc.createdAt,
          status: status,
          approvalStatus: doc.approvalStatus as 'pending' | 'approved' | 'rejected' | undefined,
          rejectionReason: doc.rejectionReason,
          description: doc.description || undefined,
          filePath: doc.fileUrl
        };
      });

      // Update the selected course with materials
      setCourses(prev => prev.map(course =>
        course.subjectId === subjectId
          ? { ...course, materials, materialsCount: documents.totalCount }
          : course
      ));

      // Update selected course
      setSelectedCourse(prev =>
        prev ? { ...prev, materials, materialsCount: documents.totalCount } : null
      );
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

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

  // Handle course selection and fetch documents
  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    setView('materials');
    // Save to URL for persistence on reload
    setSearchParams({ courseId: course.subjectId.toString(), semester: course.semester });
    await fetchDocuments(course.subjectId);
  };

  const handleDeleteMaterial = (materialId: number) => {
    if (!selectedCourse) return;
    setDeletingMaterialId(materialId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedCourse || deletingMaterialId === null) return;

    try {
      await documentService.deleteDocument(deletingMaterialId.toString());
      toast.success('Document deleted successfully!');
      // Refresh documents
      await fetchDocuments(selectedCourse.subjectId, currentPage);
      setShowDeleteModal(false);
      setDeletingMaterialId(null);
    } catch (err: any) {
      console.error('Error deleting document:', err);

      // Handle 404 - document doesn't exist (stale data)
      if (err?.response?.status === 404 || err?.message?.includes('Not Found')) {
        toast.error('Document not found - it may have already been deleted. Refreshing list...');
        // Refresh to get current data
        await fetchDocuments(selectedCourse.subjectId, 1);
        setShowDeleteModal(false);
        setDeletingMaterialId(null);
      } else if (err?.message?.includes('approved')) {
        // Handle approved document restriction
        toast.error('Cannot delete approved documents. Only administrators can delete approved documents.');
      } else {
        toast.error(err?.message || 'Failed to delete document');
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCourse) return;
    const files = Array.from(e.target.files || []);
    const inputElement = e.currentTarget;
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadPromise = toast.promise(
      (async () => {
        // Upload each file
        for (const file of files) {
          await documentService.createDocument({
            title: file.name,
            description: `Uploaded file: ${file.name}`,
            subjectId: selectedCourse.subjectId,
            file: file
          });
        }
        // Refresh documents after all uploads complete
        await fetchDocuments(selectedCourse.subjectId);
        return files.length;
      })(),
      {
        loading: `Uploading ${files.length} file(s)...`,
        success: (count) => `Successfully uploaded ${count} file(s)!`,
        error: (err) => err?.message || 'Failed to upload files'
      }
    );

    try {
      await uploadPromise;
    } catch (err) {
      // Error already handled by toast.promise
      console.error('Error uploading documents:', err);
    } finally {
      setIsUploading(false);
      // Clear input
      if (inputElement) {
        inputElement.value = '';
      }
    }
  };

  const handleEditMaterial = (materialId: number) => {
    if (!selectedCourse) return;
    const mat = selectedCourse.materials.find(m => m.documentId === materialId);
    if (!mat) return;
    setEditingMaterial(mat);
    setEditName(mat.title);
    setEditDescription(mat.description || '');
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!selectedCourse || !editingMaterial) return;
    if (!editName || editName.trim() === '') {
      alert('Title is required');
      return;
    }

    try {
      await documentService.updateDocument(editingMaterial.documentId.toString(), {
        title: editName,
        description: editDescription || undefined,
      });

      // Refresh documents
      await fetchDocuments(selectedCourse.subjectId);

      setShowEditModal(false);
      setEditingMaterial(null);
      setEditName('');
      setEditDescription('');
    } catch (err: any) {
      console.error('Error updating document:', err);
      alert(err.message || 'Failed to update document');
    }
  };

  const handleReprocess = async (documentId: number) => {
    if (!selectedCourse) return;

    try {
      await documentService.reprocessDocument(documentId.toString());

      // Refresh documents
      await fetchDocuments(selectedCourse.subjectId);

      alert('Document reprocessing started');
    } catch (err: any) {
      console.error('Error reprocessing document:', err);
      alert(err.message || 'Failed to reprocess document');
    }
  };

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      const blob = await documentService.downloadDocument(documentId.toString());

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error downloading document:', err);
      alert(err.message || 'Failed to download document');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Documents</h1>
          <p className="text-slate-600">Manage learning materials for courses</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-slate-600">Loading subjects...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Error loading data</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchSubjects}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Container */}
        {!loading && !error && view === 'courses' && (
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
                              className={`w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-150 border-b border-slate-100 last:border-b-0 ${selectedSemester === semester
                                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-l-blue-600'
                                : ''
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${selectedSemester === semester
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
                        key={course.subjectId}
                        onClick={() => handleCourseSelect(course)}
                        className={`group text-left p-5 rounded-xl border-2 transition-all duration-200 ${selectedCourse?.subjectId === course.subjectId
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-1'
                          }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${selectedCourse?.subjectId === course.subjectId
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                            }`}>
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold mb-1 line-clamp-2 ${selectedCourse?.subjectId === course.subjectId ? 'text-blue-900' : 'text-slate-800'
                              }`}>
                              {course.subjectName}
                            </h4>
                            <p className="text-sm text-slate-500 font-medium">{course.subjectCode}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2 text-sm">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedCourse?.subjectId === course.subjectId
                              ? 'bg-blue-100'
                              : 'bg-slate-100 group-hover:bg-blue-50'
                              }`}>
                              <File className={`w-4 h-4 ${selectedCourse?.subjectId === course.subjectId ? 'text-blue-600' : 'text-slate-600'
                                }`} />
                            </div>
                            <span className={`font-semibold ${selectedCourse?.subjectId === course.subjectId ? 'text-blue-700' : 'text-slate-600'
                              }`}>
                              {course.materialsCount || 0} materials
                            </span>
                          </div>
                          {selectedCourse?.subjectId === course.subjectId && (
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
        {!loading && view === 'materials' && selectedCourse && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 mt-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <button
                    onClick={() => { setView('courses'); setSelectedCourse(null); setSearchParams({}); }}
                    className="mb-3 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to course list
                  </button>
                  <h2 className="text-2xl font-bold text-slate-800">Materials - {selectedCourse.subjectName}</h2>
                  <p className="text-slate-500 text-sm mt-1">{selectedCourse.subjectCode}</p>
                </div>
                <label className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition ${isUploading || documentsLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 cursor-pointer'}`}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload files
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileInput}
                    disabled={documentsLoading || isUploading}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  />
                </label>
              </div>

              {/* Documents Loading */}
              {documentsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="ml-3 text-slate-600">Loading documents...</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">Drag and drop files here or click to select</p>
                <p className="text-sm text-slate-500">Supported: PDF, DOCX, PPTX, TXT (Max: 50MB)</p>
              </div>

              {!documentsLoading && (
                <div className="space-y-6">
                  {/* Processing/Failed Documents */}
                  {selectedCourse.materials.some(m => (m.status === 'Processing' && m.approvalStatus !== 'approved') || m.status === 'Failed') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-800">Processing Status</h4>
                        <span className="text-xs text-slate-500">
                          {selectedCourse.materials.filter(m => (m.status === 'Processing' && m.approvalStatus !== 'approved') || m.status === 'Failed').length} items
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedCourse.materials.filter(m => (m.status === 'Processing' && m.approvalStatus !== 'approved') || m.status === 'Failed').map(mat => (
                          <div
                            key={mat.documentId}
                            className={`flex items-center justify-between p-4 rounded-lg border transition ${mat.status === 'Failed'
                              ? 'bg-red-50 border-red-200 hover:bg-red-100'
                              : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                              }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <File className={`w-5 h-5 flex-shrink-0 ${mat.status === 'Failed' ? 'text-red-600' : 'text-yellow-600'
                                }`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800">
                                  {mat.title}
                                  <span className={`text-xs font-medium ml-2 ${mat.status === 'Failed' ? 'text-red-700' : 'text-yellow-700'
                                    }`}>
                                    ({mat.status})
                                  </span>
                                </p>
                                {mat.description && (
                                  <p className="text-xs text-slate-500 mt-1">{mat.description}</p>
                                )}
                                <p className="text-sm text-slate-500">
                                  {mat.fileType} • {documentService.formatFileSize(mat.fileSize)} • {new Date(mat.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {mat.status === 'Failed' && (
                              <button
                                onClick={() => handleReprocess(mat.documentId)}
                                className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium flex-shrink-0 ml-2"
                                title="Reprocess"
                              >
                                <Undo className="w-4 h-4" />
                                Retry
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejected Documents */}
                  {selectedCourse.materials.some(m => m.approvalStatus === 'rejected') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-800">Rejected Documents</h4>
                        <span className="text-xs text-slate-500">
                          {selectedCourse.materials.filter(m => m.approvalStatus === 'rejected').length} items
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedCourse.materials.filter(m => m.approvalStatus === 'rejected').map(mat => (
                          <div key={mat.documentId} className="flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition border-2 border-red-200">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <File className="w-5 h-5 text-red-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-slate-800">{mat.title}</p>
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                    ✗ Rejected
                                  </span>
                                </div>
                                {mat.rejectionReason && (
                                  <div className="bg-white border border-red-300 rounded px-3 py-2 mt-2">
                                    <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</p>
                                    <p className="text-sm text-red-700">{mat.rejectionReason}</p>
                                  </div>
                                )}
                                {mat.description && (
                                  <p className="text-xs text-slate-500 mt-1">{mat.description}</p>
                                )}
                                <p className="text-sm text-slate-500 mt-1">
                                  {mat.fileType} • {documentService.formatFileSize(mat.fileSize)} • {new Date(mat.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleDeleteMaterial(mat.documentId)}
                                className="p-2 ml-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
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

                  {/* Pending Documents */}
                  {selectedCourse.materials.some(m => (m.status === 'Pending' || (m.status === 'Processing' && m.approvalStatus === 'approved')) && m.approvalStatus !== 'rejected') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-800">Pending Documents</h4>
                        <span className="text-xs text-slate-500">
                          {selectedCourse.materials.filter(m => (m.status === 'Pending' || (m.status === 'Processing' && m.approvalStatus === 'approved')) && m.approvalStatus !== 'rejected').length} items
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedCourse.materials.filter(m => (m.status === 'Pending' || (m.status === 'Processing' && m.approvalStatus === 'approved')) && m.approvalStatus !== 'rejected').map(mat => (
                          <div key={mat.documentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <File className="w-5 h-5 text-gray-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-slate-800">{mat.title}</p>
                                  {mat.status === 'Processing' && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Processing
                                    </span>
                                  )}
                                  {mat.approvalStatus === 'pending' && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                                      ⏳ Awaiting Approval
                                    </span>
                                  )}
                                  {mat.approvalStatus === 'approved' && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                      ✓ Approved
                                    </span>
                                  )}
                                </div>
                                {mat.description && (
                                  <p className="text-xs text-slate-500 mt-1">{mat.description}</p>
                                )}
                                <p className="text-sm text-slate-500 mt-1">
                                  {mat.fileType} • {documentService.formatFileSize(mat.fileSize)} • {new Date(mat.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleEditMaterial(mat.documentId)}
                                className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {/* Only show delete button for non-approved documents */}
                              {mat.approvalStatus !== 'approved' && (
                                <button
                                  onClick={() => handleDeleteMaterial(mat.documentId)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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

                  {/* Completed Documents */}
                  {selectedCourse.materials.some(m => m.status === 'Completed') ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-800">Completed Documents</h4>
                        <span className="text-xs text-slate-500">
                          {selectedCourse.materials.filter(m => m.status === 'Completed').length} items
                        </span>
                      </div>
                      <div className="space-y-3">
                        {selectedCourse.materials.filter(m => m.status === 'Completed').map(mat => (
                          <div key={mat.documentId} className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition border border-green-200">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <File className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800">
                                  {mat.title}
                                  <span className="text-xs text-green-700 font-medium ml-2">✓ Completed</span>
                                </p>
                                {mat.description && (
                                  <p className="text-xs text-slate-500 mt-1">{mat.description}</p>
                                )}
                                <p className="text-sm text-slate-500">
                                  {mat.fileType} • {documentService.formatFileSize(mat.fileSize)} • {new Date(mat.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleDownload(mat.documentId, mat.title)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Download"
                              >
                                <Upload className="w-4 h-4 rotate-180" />
                              </button>
                              <button
                                onClick={() => handleEditMaterial(mat.documentId)}
                                className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {/* Only show delete button for non-approved documents */}
                              {mat.approvalStatus !== 'approved' && (
                                <button
                                  onClick={() => handleDeleteMaterial(mat.documentId)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
                  ) : (
                    selectedCourse.materials.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No materials for this course yet</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Pagination Controls */}
              {!documentsLoading && totalPages > 1 && selectedCourse && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing page {currentPage} of {totalPages} ({totalCount} documents total)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selectedCourse && fetchDocuments(selectedCourse.subjectId, currentPage - 1)}
                      disabled={currentPage <= 1 || documentsLoading}
                      className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    {/* Page numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => selectedCourse && fetchDocuments(selectedCourse.subjectId, pageNum)}
                            disabled={documentsLoading}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition ${currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => selectedCourse && fetchDocuments(selectedCourse.subjectId, currentPage + 1)}
                      disabled={currentPage >= totalPages || documentsLoading}
                      className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress Overlay - Shows when uploading */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Animated rings */}
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-2 border-4 border-orange-200 rounded-full"></div>
              <div className="absolute inset-2 border-4 border-orange-500 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
              <Upload className="absolute inset-0 m-auto w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Uploading Documents</h3>
            <p className="text-slate-600 mb-4">Please wait while your files are being uploaded...</p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Do not close this page</p>
          </div>
        </div>
      )}      {/* Edit Modal */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Edit Document</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMaterial(null);
                  setEditName('');
                  setEditDescription('');
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="Enter document title..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition resize-none"
                  placeholder="Enter description (optional)..."
                  rows={3}
                />
              </div>

              <p className="text-xs text-slate-500">
                * Required field
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMaterial(null);
                  setEditName('');
                  setEditDescription('');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!editName.trim()}
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
              <h3 className="text-xl font-bold text-slate-800">Confirm Deletion</h3>
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
                    {selectedCourse?.materials.find(m => m.documentId === deletingMaterialId)?.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    This document will be permanently deleted
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 bg-red-50 p-3 rounded-lg border border-red-200">
                ⚠️ This action cannot be undone. The document and all its associated data will be permanently removed.
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
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsManagement;
