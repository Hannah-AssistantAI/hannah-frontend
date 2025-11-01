import { useState } from 'react';
import { Upload, File, Trash2, Edit2, FileText, BookOpen, ChevronDown, Target, AlertCircle, Plus, X, Check } from 'lucide-react';


export default function KnowledgeManagement() {
  const [courses, setCourses] = useState([
    { 
      id: 1, 
      name: 'Software Engineering', 
      code: 'SWE201',
      semester: 'Fall 2024',
      materials: [
        { id: 1, name: 'Syllabus.pdf', type: 'PDF', size: '2.4 MB', date: '2024-10-15' },
        { id: 2, name: 'Lecture_01.pptx', type: 'PPTX', size: '5.1 MB', date: '2024-10-14' }
      ],
      outcomes: [
        { id: 1, text: 'Understand fundamental programming concepts' },
        { id: 2, text: 'Apply problem-solving techniques to real-world scenarios' }
      ],
      challenges: [
        { id: 1, text: 'Difficulty understanding recursion' },
        { id: 2, text: 'Time management with assignments' }
      ]
    },
    { 
      id: 2, 
      name: 'Database Systems', 
      code: 'DBI202',
      semester: 'Fall 2024',
      materials: [],
      outcomes: [],
      challenges: []
    }
  ]);

  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'outcomes' | 'challenges'>('materials');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ text: '' });

  const handleDeleteMaterial = (id: number) => {
    const updatedCourses = courses.map(course => {
      if (course.id === selectedCourse.id) {
        return {
          ...course,
          materials: course.materials.filter(m => m.id !== id)
        };
      }
      return course;
    });
    setCourses(updatedCourses);
    const updated = updatedCourses.find(c => c.id === selectedCourse.id);
    if (updated) setSelectedCourse(updated);
  };

  const handleAddOutcome = () => {
    if (formData.text) {
      const updatedCourses = courses.map(course => {
        if (course.id === selectedCourse.id) {
          if (editingItem) {
            return {
              ...course,
              outcomes: course.outcomes.map(o => o.id === editingItem.id 
                ? { ...o, text: formData.text }
                : o
              )
            };
          } else {
            return {
              ...course,
              outcomes: [...course.outcomes, { id: Date.now(), text: formData.text }]
            };
          }
        }
        return course;
      });
      setCourses(updatedCourses);
      const updated = updatedCourses.find(c => c.id === selectedCourse.id);
      if (updated) setSelectedCourse(updated);
      setFormData({ text: '' });
      setShowForm(false);
      setEditingItem(null);
    }
  };

  const handleDeleteOutcome = (id: number) => {
    const updatedCourses = courses.map(course => {
      if (course.id === selectedCourse.id) {
        return {
          ...course,
          outcomes: course.outcomes.filter(o => o.id !== id)
        };
      }
      return course;
    });
    setCourses(updatedCourses);
    const updated = updatedCourses.find(c => c.id === selectedCourse.id);
    if (updated) setSelectedCourse(updated);
  };

  const handleAddChallenge = () => {
    if (formData.text) {
      const updatedCourses = courses.map(course => {
        if (course.id === selectedCourse.id) {
          if (editingItem) {
            return {
              ...course,
              challenges: course.challenges.map(c => c.id === editingItem.id 
                ? { ...c, text: formData.text }
                : c
              )
            };
          } else {
            return {
              ...course,
              challenges: [...course.challenges, { id: Date.now(), text: formData.text }]
            };
          }
        }
        return course;
      });
      setCourses(updatedCourses);
      const updated = updatedCourses.find(c => c.id === selectedCourse.id);
      if (updated) setSelectedCourse(updated);
      setFormData({ text: '' });
      setShowForm(false);
      setEditingItem(null);
    }
  };

  const handleDeleteChallenge = (id: number) => {
    const updatedCourses = courses.map(course => {
      if (course.id === selectedCourse.id) {
        return {
          ...course,
          challenges: course.challenges.filter(c => c.id !== id)
        };
      }
      return course;
    });
    setCourses(updatedCourses);
    const updated = updatedCourses.find(c => c.id === selectedCourse.id);
    if (updated) setSelectedCourse(updated);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ text: item.text });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ text: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Quản lý tài liệu</h1>
          <p className="text-slate-600">Quản lý tài liệu và nội dung theo môn học</p>
        </div>


        {/* Course Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div className="relative flex-1 max-w-md">
                <button
                  onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition border-2 border-slate-200"
                >
                  <div className="text-left">
                    <p className="font-bold text-slate-800">{selectedCourse.name}</p>
                    <p className="text-sm text-slate-600">{selectedCourse.code} - {selectedCourse.semester}</p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                </button>
                
                {showCourseDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border-2 border-slate-200 z-10 max-h-64 overflow-y-auto">
                    {courses.map(course => (
                      <button
                        key={course.id}
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowCourseDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition ${
                          course.id === selectedCourse.id ? 'bg-blue-100' : ''
                        }`}
                      >
                        <p className="font-semibold text-slate-800">{course.name}</p>
                        <p className="text-sm text-slate-600">{course.code} - {course.semester}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition ${
                activeTab === 'materials' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <FileText className="w-5 h-5" />
              Tài liệu
            </button>
            <button
              onClick={() => setActiveTab('outcomes')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition ${
                activeTab === 'outcomes' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Target className="w-5 h-5" />
              Kết quả Học tập
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition ${
                activeTab === 'challenges' 
                  ? 'text-orange-600 border-b-2 border-orange-600' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
              Thách thức Thường gặp
            </button>
          </div>

          <div className="p-6">
            {/* Materials Tab Content */}
            {activeTab === 'materials' && (
              <>
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
              </>
            )}

            {/* Outcomes Tab Content */}
            {activeTab === 'outcomes' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Kết quả Học tập - {selectedCourse.name}</h2>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm Kết quả
                  </button>
                </div>

                {showForm && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <h3 className="font-semibold text-slate-800 mb-3">
                      {editingItem ? 'Chỉnh sửa Kết quả Học tập' : 'Thêm Kết quả Học tập mới'}
                    </h3>
                    <textarea
                      placeholder="Kết quả học tập mong đợi"
                      value={formData.text}
                      onChange={(e) => setFormData({ text: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3 h-20 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleAddOutcome}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        <Check className="w-4 h-4" />
                        {editingItem ? 'Cập nhật' : 'Lưu'}
                      </button>
                      <button 
                        onClick={cancelForm}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                      >
                        <X className="w-4 h-4" />
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {selectedCourse.outcomes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCourse.outcomes.map((outcome, idx) => (
                      <div key={outcome.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <p className="flex-1 text-slate-700">{outcome.text}</p>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEdit(outcome)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteOutcome(outcome.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Target className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>Chưa có Kết quả Học tập cho môn này</p>
                  </div>
                )}
              </>
            )}

            {/* Challenges Tab Content */}
            {activeTab === 'challenges' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Thách thức Thường gặp - {selectedCourse.name}</h2>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm Thách thức
                  </button>
                </div>

                {showForm && (
                  <div className="mb-6 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <h3 className="font-semibold text-slate-800 mb-3">
                      {editingItem ? 'Chỉnh sửa Thách thức' : 'Thêm Thách thức mới'}
                    </h3>
                    <textarea
                      placeholder="Thách thức phổ biến của sinh viên"
                      value={formData.text}
                      onChange={(e) => setFormData({ text: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3 h-20 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleAddChallenge}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                      >
                        <Check className="w-4 h-4" />
                        {editingItem ? 'Cập nhật' : 'Lưu'}
                      </button>
                      <button 
                        onClick={cancelForm}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                      >
                        <X className="w-4 h-4" />
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {selectedCourse.challenges.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCourse.challenges.map(challenge => (
                      <div key={challenge.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <p className="flex-1 text-slate-700">{challenge.text}</p>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEdit(challenge)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>Chưa có Thách thức Thường gặp cho môn này</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}