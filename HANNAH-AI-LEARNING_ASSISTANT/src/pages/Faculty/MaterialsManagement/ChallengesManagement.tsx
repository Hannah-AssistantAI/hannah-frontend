import React, { useState, useMemo } from 'react';
import { AlertCircle, Plus, Edit2, Trash2, Save, X, ChevronRight } from 'lucide-react';

interface Challenge {
    id: number;
    title: string;
    description: string;
    solution: string;
    frequency: 'Cao' | 'Trung bình' | 'Thấp';
    materialId: number;
    materialName: string;
}

interface Material {
    id: number;
    name: string;
    type: string;
    size: string;
    date: string;
    challenges: Omit<Challenge, 'materialId' | 'materialName'>[];
}

interface Course {
    id: number;
    name: string;
    code: string;
    semester: string;
    materials: Material[];
}

const ChallengesManagement: React.FC = () => {
    const [selectedSemester, setSelectedSemester] = useState<string>('Kỳ 1');
    const [showSemesterDropdown, setShowSemesterDropdown] = useState<boolean>(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
    const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
    const [newChallenge, setNewChallenge] = useState<{
        title: string;
        description: string;
        solution: string;
        frequency: 'Cao' | 'Trung bình' | 'Thấp';
    }>({
        title: '',
        description: '',
        solution: '',
        frequency: 'Trung bình'
    });

    const semesters = ['Kỳ 1', 'Kỳ 2', 'Kỳ 3', 'Kỳ 4', 'Kỳ 5', 'Kỳ 6', 'Kỳ 7', 'Kỳ 8', 'Kỳ 9'];

    const [courses, setCourses] = useState<Course[]>([
        {
            id: 1,
            name: 'Programming Fundamentals - Cơ sở lập trình',
            code: 'PRF192',
            semester: 'Kỳ 1',
            materials: [
                {
                    id: 1,
                    name: 'PRF192_Programming_Basics.pdf',
                    type: 'PDF',
                    size: '2.5 MB',
                    date: '01/09/2024',
                    challenges: [
                        {
                            id: 1,
                            title: 'Khó hiểu cú pháp ngôn ngữ C',
                            description: 'Sinh viên gặp khó khăn với cú pháp pointer và memory management',
                            solution: 'Sử dụng diagram và debug step-by-step để minh họa',
                            frequency: 'Cao'
                        },
                        {
                            id: 2,
                            title: 'Logic lập trình chưa rõ ràng',
                            description: 'Sinh viên khó chuyển từ tư duy thường ngày sang tư duy lập trình',
                            solution: 'Luyện tập với flowchart và pseudocode trước khi code',
                            frequency: 'Cao'
                        }
                    ]
                },
                {
                    id: 2,
                    name: 'PRF192_Control_Structures.pptx',
                    type: 'PPTX',
                    size: '1.8 MB',
                    date: '05/09/2024',
                    challenges: [
                        {
                            id: 3,
                            title: 'Nhầm lẫn giữa các vòng lặp',
                            description: 'Sinh viên không biết khi nào dùng for, while, do-while',
                            solution: 'Tạo bảng so sánh và bài tập thực hành cho từng loại',
                            frequency: 'Trung bình'
                        }
                    ]
                }
            ]
        },
        {
            id: 2,
            name: 'Mathematics for Engineering - Toán cho ngành kỹ thuật',
            code: 'MAE101',
            semester: 'Kỳ 1',
            materials: [
                {
                    id: 3,
                    name: 'MAE101_Calculus_Basics.pdf',
                    type: 'PDF',
                    size: '3.1 MB',
                    date: '02/09/2024',
                    challenges: [
                        {
                            id: 4,
                            title: 'Khó hiểu khái niệm giới hạn',
                            description: 'Sinh viên gặp khó khăn với định nghĩa epsilon-delta và ứng dụng',
                            solution: 'Sử dụng đồ thị và ví dụ thực tế để minh họa',
                            frequency: 'Cao'
                        }
                    ]
                }
            ]
        },
        {
            id: 3,
            name: 'Introduction to Computer - Nhập môn khoa học máy tính',
            code: 'CSI104',
            semester: 'Kỳ 1',
            materials: [
                {
                    id: 4,
                    name: 'CSI104_Computer_Architecture.pdf',
                    type: 'PDF',
                    size: '2.2 MB',
                    date: '03/09/2024',
                    challenges: [
                        {
                            id: 5,
                            title: 'Khó hiểu kiến trúc máy tính',
                            description: 'Sinh viên khó hình dung cách CPU, RAM, và các thành phần hoạt động',
                            solution: 'Sử dụng mô hình 3D và simulation để minh họa',
                            frequency: 'Cao'
                        }
                    ]
                }
            ]
        },
        {
            id: 4,
            name: 'Computer Organization and Architecture - Tổ chức và Kiến trúc máy tính',
            code: 'CEA201',
            semester: 'Kỳ 1',
            materials: [
                {
                    id: 5,
                    name: 'CEA201_Digital_Logic.pptx',
                    type: 'PPTX',
                    size: '1.9 MB',
                    date: '04/09/2024',
                    challenges: [
                        {
                            id: 6,
                            title: 'Logic số khó hiểu',
                            description: 'Sinh viên gặp khó khăn với bảng chân lý và thiết kế mạch',
                            solution: 'Thực hành với phần mềm mô phỏng mạch điện tử',
                            frequency: 'Trung bình'
                        }
                    ]
                }
            ]
        },
        {
            id: 5,
            name: 'Object-Oriented Programming - Lập trình hướng đối tượng',
            code: 'PRO192',
            semester: 'Kỳ 2',
            materials: [
                {
                    id: 6,
                    name: 'PRO192_OOP_Concepts.pdf',
                    type: 'PDF',
                    size: '2.8 MB',
                    date: '15/01/2025',
                    challenges: [
                        {
                            id: 7,
                            title: 'Khó hiểu khái niệm OOP',
                            description: 'Sinh viên gặp khó khăn với Class, Object, Inheritance, Polymorphism',
                            solution: 'Sử dụng ví dụ thực tế và UML diagram để minh họa',
                            frequency: 'Cao'
                        }
                    ]
                },
                {
                    id: 7,
                    name: 'PRO192_Java_Basics.pptx',
                    type: 'PPTX',
                    size: '4.2 MB',
                    date: '20/01/2025',
                    challenges: [
                        {
                            id: 8,
                            title: 'Cú pháp Java phức tạp',
                            description: 'Sinh viên nhầm lẫn giữa cú pháp Java và C/C++',
                            solution: 'Tạo bảng so sánh cú pháp và coding convention',
                            frequency: 'Trung bình'
                        }
                    ]
                }
            ]
        }
    ]);

    const coursesForSemester = useMemo(
        () => courses.filter((course) => course.semester === selectedSemester),
        [courses, selectedSemester]
    );

    const handleSemesterChange = (semester: string) => {
        setSelectedSemester(semester);
        setShowSemesterDropdown(false);
        setSelectedCourse(null);
    };

    const handleCourseSelect = (course: Course) => {
        setSelectedCourse(course);
    };

    // Get all challenges from all materials in the selected course
    const getAllChallengesForCourse = (): Challenge[] => {
        if (!selectedCourse) return [];
        
        const allChallenges: Challenge[] = [];
        selectedCourse.materials.forEach(material => {
            material.challenges.forEach(challenge => {
                allChallenges.push({
                    ...challenge,
                    materialId: material.id,
                    materialName: material.name
                });
            });
        });
        return allChallenges;
    };

    const getTotalChallengesCount = (): number => {
        if (!selectedCourse) return 0;
        return selectedCourse.materials.reduce((sum, material) => sum + material.challenges.length, 0);
    };

    const handleAddChallenge = () => {
        if (!newChallenge.title.trim() || !selectedCourse || !selectedMaterialId) return;

        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedMaterials = course.materials.map(material => {
                    if (material.id === selectedMaterialId) {
                        const updatedChallenges = editingChallenge
                            ? material.challenges.map(c => c.id === editingChallenge.id ? { ...newChallenge, id: editingChallenge.id } : c)
                            : [...material.challenges, { ...newChallenge, id: Date.now() }];
                        return { ...material, challenges: updatedChallenges };
                    }
                    return material;
                });
                return { ...course, materials: updatedMaterials };
            }
            return course;
        });

        setCourses(updatedCourses);

        // Update selected course
        const updatedCourse = updatedCourses.find(c => c.id === selectedCourse.id);
        if (updatedCourse) {
            setSelectedCourse(updatedCourse);
        }

        setNewChallenge({ title: '', description: '', solution: '', frequency: 'Trung bình' });
        setEditingChallenge(null);
        setSelectedMaterialId(null);
        setShowAddForm(false);
    };

    const handleEditChallenge = (challenge: Challenge) => {
        setEditingChallenge(challenge);
        setSelectedMaterialId(challenge.materialId);
        setShowAddForm(true);
        setNewChallenge({
            title: challenge.title,
            description: challenge.description,
            solution: challenge.solution,
            frequency: challenge.frequency
        });
    };

    const handleDeleteChallenge = (challengeId: number, materialId: number) => {
        if (!selectedCourse) return;

        if (!window.confirm('Bạn có chắc chắn muốn xóa thách thức này?')) return;

        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedMaterials = course.materials.map(material => {
                    if (material.id === materialId) {
                        return {
                            ...material,
                            challenges: material.challenges.filter(c => c.id !== challengeId)
                        };
                    }
                    return material;
                });
                return { ...course, materials: updatedMaterials };
            }
            return course;
        });

        setCourses(updatedCourses);

        // Update selected course
        const updatedCourse = updatedCourses.find(c => c.id === selectedCourse.id);
        if (updatedCourse) {
            setSelectedCourse(updatedCourse);
        }
    };

    const getFrequencyColor = (frequency: string) => {
        switch (frequency) {
            case 'Cao': return 'bg-red-100 text-red-700 border-red-200';
            case 'Trung bình': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Thấp': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const allChallenges = getAllChallengesForCourse();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <AlertCircle className="w-7 h-7 text-orange-600" />
                        Thách Thức Thường Gặp
                    </h1>
                    <p className="text-slate-600 mt-1">Quản lý các thách thức học tập của sinh viên theo môn học</p>
                </div>
            </div>

            {/* Semester Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Chọn Kỳ Học
                    </label>
                    <button
                        onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl hover:shadow-md transition-all duration-200 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {selectedSemester.replace('Kỳ ', '')}
                            </div>
                            <div className="text-left">
                                <div className="text-sm text-slate-600 font-medium">Đang chọn</div>
                                <div className="text-lg font-bold text-slate-800">{selectedSemester}</div>
                            </div>
                        </div>
                        <ChevronRight
                            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${showSemesterDropdown ? 'rotate-90' : ''}`}
                        />
                    </button>

                    {showSemesterDropdown && (
                        <div className="absolute z-10 mt-2 w-full bg-white border-2 border-orange-200 rounded-xl shadow-xl overflow-hidden">
                            <div className="max-h-96 overflow-y-auto">
                                {semesters.map((semester) => (
                                    <button
                                        key={semester}
                                        onClick={() => handleSemesterChange(semester)}
                                        className={`w-full px-5 py-4 flex items-center gap-4 transition-all duration-150 ${
                                            selectedSemester === semester
                                                ? 'bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-600'
                                                : 'hover:bg-orange-50 border-l-4 border-transparent'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                                            selectedSemester === semester ? 'bg-orange-600' : 'bg-slate-400'
                                        }`}>
                                            {semester.replace('Kỳ ', '')}
                                        </div>
                                        <span className={`font-semibold ${
                                            selectedSemester === semester ? 'text-orange-600' : 'text-slate-600'
                                        }`}>
                                            {semester}
                                        </span>
                                        {selectedSemester === semester && (
                                            <div className="ml-auto flex items-center gap-2 text-orange-600">
                                                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                                                <span className="text-sm font-medium">Đang chọn</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Course Grid */}
                {coursesForSemester.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">
                            Chọn Môn Học ({coursesForSemester.length} môn)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {coursesForSemester.map((course) => {
                                const totalChallenges = course.materials.reduce((sum, m) => sum + m.challenges.length, 0);
                                return (
                                    <button
                                        key={course.id}
                                        onClick={() => handleCourseSelect(course)}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                            selectedCourse?.id === course.id
                                                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg scale-105'
                                                : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md hover:scale-105 hover:-translate-y-1'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <AlertCircle className={`w-5 h-5 ${
                                                selectedCourse?.id === course.id ? 'text-orange-600' : 'text-slate-400'
                                            }`} />
                                            {selectedCourse?.id === course.id && (
                                                <div className="flex items-center gap-1 text-orange-600 text-xs font-semibold">
                                                    <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                                                    Đang chọn
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-slate-800 mb-1">{course.name}</h4>
                                        <p className="text-sm text-slate-600 mb-2">{course.code}</p>
                                        <div className="flex items-center gap-2 text-xs flex-wrap">
                                            <span className={`px-2 py-1 rounded-full font-medium ${
                                                selectedCourse?.id === course.id
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {totalChallenges} thách thức
                                            </span>
                                            {/* <span className="text-slate-400">•</span> */}
                                            {/* <span className="text-slate-600">{course.materials.length} tài liệu</span> */}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {coursesForSemester.length === 0 && (
                    <div className="mt-6 text-center py-8 text-slate-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>Không có môn học nào trong {selectedSemester}</p>
                    </div>
                )}
            </div>

            {/* Challenges List by Course - Show when course is selected */}
            {selectedCourse && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-orange-600" />
                                    Thách Thức - {selectedCourse.name}
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">{selectedCourse.code}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold">
                                    {getTotalChallengesCount()} thách thức
                                </span>
                                {!showAddForm && (
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm Thách Thức
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Add/Edit Challenge Form */}
                    {showAddForm && (
                        <div className="mb-6 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-orange-600" />
                                {editingChallenge ? 'Chỉnh Sửa Thách Thức' : 'Thêm Thách Thức Mới'}
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Chọn tài liệu *
                                    </label>
                                    <select
                                        value={selectedMaterialId || ''}
                                        onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                                        className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                                        disabled={!!editingChallenge}
                                    >
                                        <option value="">-- Chọn tài liệu --</option>
                                        {selectedCourse.materials.map(material => (
                                            <option key={material.id} value={material.id}>
                                                {material.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Tiêu đề thách thức *
                                    </label>
                                    <input
                                        type="text"
                                        value={newChallenge.title}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                                        placeholder="Ví dụ: Khó hiểu khái niệm..."
                                        className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Mô tả chi tiết *
                                    </label>
                                    <textarea
                                        value={newChallenge.description}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                                        placeholder="Mô tả chi tiết về thách thức..."
                                        rows={3}
                                        className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Giải pháp đề xuất *
                                    </label>
                                    <textarea
                                        value={newChallenge.solution}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, solution: e.target.value })}
                                        placeholder="Các giải pháp và phương pháp giải quyết..."
                                        rows={3}
                                        className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Tần suất gặp phải
                                    </label>
                                    <select
                                        value={newChallenge.frequency}
                                        onChange={(e) => setNewChallenge({ ...newChallenge, frequency: e.target.value as typeof newChallenge.frequency })}
                                        className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"
                                    >
                                        <option value="Cao">Cao</option>
                                        <option value="Trung bình">Trung bình</option>
                                        <option value="Thấp">Thấp</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleAddChallenge}
                                        disabled={!newChallenge.title.trim() || !selectedMaterialId}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold"
                                    >
                                        <Save className="w-4 h-4" />
                                        {editingChallenge ? 'Lưu Thay Đổi' : 'Thêm Thách Thức'}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingChallenge(null);
                                            setSelectedMaterialId(null);
                                            setNewChallenge({ title: '', description: '', solution: '', frequency: 'Trung bình' });
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                                    >
                                        <X className="w-4 h-4" />
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Challenges List */}
                    <div>
                        {allChallenges.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg">
                                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                <p className="text-lg font-semibold">Chưa có thách thức nào</p>
                                <p className="text-sm mt-1">Nhấn nút "Thêm Thách Thức" để bắt đầu</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {allChallenges.map((challenge, index) => (
                                    <div
                                        key={`${challenge.materialId}-${challenge.id}`}
                                        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all bg-white group"
                                    >
                                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                                            <span className="font-bold text-orange-600">{index + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-slate-800 truncate">{challenge.title}</h4>
                                        </div>
                                        {/* <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getFrequencyColor(challenge.frequency)}`}>
                                            {challenge.frequency}
                                        </span>
                                        <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded flex-shrink-0">
                                            📄 {challenge.materialName}
                                        </span> */}
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => handleEditChallenge(challenge)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteChallenge(challenge.id, challenge.materialId)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallengesManagement;
