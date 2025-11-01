import React, { useState, useMemo } from 'react';
import { Upload, File, Trash2, Edit2, FileText, BookOpen, ChevronDown } from 'lucide-react';

// Define types
interface Material {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
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
  const [courses] = useState<Course[]>([
    {
      id: 1,
      name: 'Programming Fundamentals - Cơ sở lập trình',
      code: 'PRF192',
      semester: 'Kỳ 1',
      materials: [
        { id: 1, name: 'PRF192_Syllabus.pdf', type: 'PDF', size: '1.1 MB', date: '01/09/2024' },
        { id: 2, name: 'PRF192_Chapter1.docx', type: 'DOCX', size: '2.3 MB', date: '05/09/2024' },
      ]
    },
    {
      id: 2,
      name: 'Mathematics for Engineering - Toán cho ngành kỹ thuật',
      code: 'MAE101',
      semester: 'Kỳ 1',
      materials: [
        { id: 3, name: 'MAE101_Lecture1.pptx', type: 'PPTX', size: '3.1 MB', date: '02/09/2024' },
      ]
    },
    {
      id: 3,
      name: 'Introduction to Computer - Nhập môn khoa học máy tính',
      code: 'CSI104',
      semester: 'Kỳ 1',
      materials: []
    },
    {
      id: 4,
      name: 'Computer Organization and Architecture - Tổ chức và Kiến trúc máy tính',
      code: 'CEA201',
      semester: 'Kỳ 1',
      materials: []
    },
    {
      id: 5,
      name: 'Object-Oriented Programming - Lập trình hướng đối tượng',
      code: 'PRO192',
      semester: 'Kỳ 2',
      materials: [
        { id: 5, name: 'PRO192_OOP_Concepts.pdf', type: 'PDF', size: '2.8 MB', date: '15/01/2025' },
        { id: 6, name: 'PRO192_Java_Basics.pptx', type: 'PPTX', size: '4.2 MB', date: '20/01/2025' },
      ]
    },
    {
      id: 6,
      name: 'Data Structures and Algorithms - Cấu trúc dữ liệu và giải thuật',
      code: 'CSD201',
      semester: 'Kỳ 3',
      materials: []
    }
  ]);

  const semesters = ['Kỳ 1', 'Kỳ 2', 'Kỳ 3', 'Kỳ 4', 'Kỳ 5', 'Kỳ 6', 'Kỳ 7', 'Kỳ 8', 'Kỳ 9'];

  const [selectedSemester, setSelectedSemester] = useState<string>('Kỳ 1');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);

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
    
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      const updatedCourses = courses.map(course => {
        if (course.id === selectedCourse.id) {
          return {
            ...course,
            materials: course.materials.filter(mat => mat.id !== materialId)
          };
        }
        return course;
      });
      const updatedCourse = updatedCourses.find(c => c.id === selectedCourse.id);
      if (updatedCourse) {
        setSelectedCourse(updatedCourse);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Tài liệu</h1>
          <p className="text-slate-600">Quản lý tài liệu học tập cho các môn học</p>
        </div>

        {/* Main Container */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="p-6">
            {/* Semester Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Chọn kỳ học
                </label>
                <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {coursesForSemester.length} môn học
                </span>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                      {selectedSemester.replace('Kỳ ', '')}
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-slate-800 text-lg block">{selectedSemester}</span>
                      <span className="text-xs text-slate-600">Năm học 2024-2025</span>
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
                                  {courses.filter(c => c.semester === semester).length} môn học
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
                <h3 className="text-base font-bold text-slate-800">Danh sách môn học</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4"></div>
              </div>
              
              {coursesForSemester.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coursesForSemester.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
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
                            {course.materials.length} tài liệu
                          </span>
                        </div>
                        {selectedCourse?.id === course.id && (
                          <div className="flex items-center gap-1 text-blue-600 text-xs font-semibold">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            Đang chọn
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-semibold">Không có môn học nào trong kỳ này</p>
                  <p className="text-sm mt-1">Vui lòng chọn kỳ học khác</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Materials Content */}
        {selectedCourse && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 mt-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Tài liệu - {selectedCourse.name}</h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition">
                  <Upload className="w-5 h-5" />
                  Tải lên File
                  <input type="file" className="hidden" multiple />
                </label>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">Kéo thả file vào đây hoặc click để chọn</p>
                <p className="text-sm text-slate-500">Hỗ trợ: PDF, DOCX, PPTX, TXT (Max: 50MB)</p>
              </div>

              {selectedCourse.materials.length > 0 ? (
                <div className="space-y-3">
                  {selectedCourse.materials.map(mat => (
                    <div key={mat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-slate-800">{mat.name}</p>
                          <p className="text-sm text-slate-500">{mat.type} • {mat.size} • {mat.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Chưa có tài liệu nào cho môn học này</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsManagement;
