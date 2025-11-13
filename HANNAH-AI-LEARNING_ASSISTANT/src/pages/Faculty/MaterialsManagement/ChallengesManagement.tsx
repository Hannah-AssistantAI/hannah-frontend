import React, { useState, useMemo } from 'react';
import { AlertCircle, Plus, Edit2, Trash2, Save, X, ChevronRight, Undo } from 'lucide-react';

interface Challenge {
    id: number;
    title: string;
    description: string;
    solution: string;
    frequency: 'Cao' | 'Trung bình' | 'Thấp';
    materialId: number;
    materialName: string;
    status: 'pending' | 'approved' | 'pending_delete';
    originalTitle?: string;
    originalDescription?: string;
    originalSolution?: string;
    originalFrequency?: 'Cao' | 'Trung bình' | 'Thấp';
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
    // View state
    const [view, setView] = useState<'courses' | 'challenges'>('courses');
    
    const [selectedSemester, setSelectedSemester] = useState<string>('Kỳ 1');
    const [showSemesterDropdown, setShowSemesterDropdown] = useState<boolean>(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [newChallenge, setNewChallenge] = useState<{
        title: string;
    }>({
        title: ''
    });
    const [editingItem, setEditingItem] = useState<Challenge | null>(null);
    const [formData, setFormData] = useState<{ title: string }>({ title: '' });

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingChallenge, setDeletingChallenge] = useState<{ challengeId: number; materialId: number } | null>(null);

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
                            frequency: 'Cao',
                            status: 'approved'
                        },
                        {
                            id: 2,
                            title: 'Logic lập trình chưa rõ ràng',
                            description: 'Sinh viên khó chuyển từ tư duy thường ngày sang tư duy lập trình',
                            solution: 'Luyện tập với flowchart và pseudocode trước khi code',
                            frequency: 'Cao',
                            status: 'approved'
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
                            frequency: 'Trung bình',
                            status: 'approved'
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
                            frequency: 'Cao',
                            status: 'approved'
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
                            frequency: 'Cao',
                            status: 'approved'
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
                            frequency: 'Trung bình',
                            status: 'approved'
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
                            frequency: 'Cao',
                            status: 'approved'
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
                            frequency: 'Trung bình',
                            status: 'approved'
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
        if (!newChallenge.title.trim() || !selectedCourse) return;

        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                // Add to the first material
                const updatedMaterials = course.materials.length > 0 
                    ? course.materials.map((material, index) => {
                        if (index === 0) {
                            // Add new challenge to first material
                            return {
                                ...material,
                                challenges: [...material.challenges, { 
                                    title: newChallenge.title,
                                    description: '',
                                    solution: '',
                                    frequency: 'Trung bình' as const,
                                    id: Date.now(), 
                                    status: 'pending' as const 
                                }]
                            };
                        }
                        return material;
                    })
                    : course.materials;
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

        setNewChallenge({ title: '' });
        setShowAddForm(false);
    };

    const handleEditChallenge = (challenge: Challenge) => {
        setEditingItem(challenge);
        setFormData({ title: challenge.title });
        setShowEditModal(true);
    };

    const confirmEdit = () => {
        if (!formData.title.trim() || !selectedCourse || !editingItem) return;

        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedMaterials = course.materials.map(material => {
                    if (material.id === editingItem.materialId) {
                        return {
                            ...material,
                            challenges: material.challenges.map(c =>
                                c.id === editingItem.id
                                    ? {
                                        ...c,
                                        title: formData.title,
                                        status: 'pending' as const,
                                        originalTitle: editingItem.title,
                                        originalDescription: editingItem.description,
                                        originalSolution: editingItem.solution,
                                        originalFrequency: editingItem.frequency
                                    }
                                    : c
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

        // Update selected course
        const updatedCourse = updatedCourses.find(c => c.id === selectedCourse.id);
        if (updatedCourse) {
            setSelectedCourse(updatedCourse);
        }

        setShowEditModal(false);
        setEditingItem(null);
        setFormData({ title: '' });
    };

    const handleDeleteChallenge = (challengeId: number, materialId: number) => {
        if (!selectedCourse) return;
        setDeletingChallenge({ challengeId, materialId });
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedCourse || !deletingChallenge) return;

        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedMaterials = course.materials.map(material => {
                    if (material.id === deletingChallenge.materialId) {
                        return {
                            ...material,
                            challenges: material.challenges.map(c =>
                              c.id === deletingChallenge.challengeId
                                ? {
                                    ...c,
                                    status: 'pending_delete' as const,
                                    originalTitle: c.title,
                                    originalDescription: c.description,
                                    originalSolution: c.solution,
                                    originalFrequency: c.frequency
                                  }
                                : c
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

        // Update selected course
        const updatedCourse = updatedCourses.find(c => c.id === selectedCourse.id);
        if (updatedCourse) {
            setSelectedCourse(updatedCourse);
        }

        setShowDeleteModal(false);
        setDeletingChallenge(null);
    };

    const handleUndoChange = (challengeId: number, materialId: number) => {
        if (!selectedCourse) return;

        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedMaterials = course.materials.map(material => {
                    if (material.id === materialId) {
                        return {
                            ...material,
                            challenges: material.challenges.map(challenge => {
                                if (challenge.id === challengeId) {
                                    if (challenge.status === 'pending_delete') {
                                        // Undo delete - restore to approved
                                        const { originalTitle, originalDescription, originalSolution, originalFrequency, ...rest } = challenge;
                                        return { ...rest, status: 'approved' as const };
                                    } else if (challenge.status === 'pending' && challenge.originalTitle) {
                                        // Undo edit - restore original and set to approved
                                        const { originalTitle, originalDescription, originalSolution, originalFrequency, ...rest } = challenge;
                                        return {
                                            ...rest,
                                            title: originalTitle,
                                            description: originalDescription || '',
                                            solution: originalSolution || '',
                                            frequency: originalFrequency || 'Trung bình',
                                            status: 'approved' as const
                                        };
                                    } else if (challenge.status === 'pending' && !challenge.originalTitle) {
                                        // Newly added - remove it
                                        return null as any;
                                    }
                                }
                                return challenge;
                            }).filter((c): c is Omit<Challenge, 'materialId' | 'materialName'> => c !== null)
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

                {/* Course Grid - Hide when a course is selected */}
                {!selectedCourse && coursesForSemester.length > 0 && (
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
                                        className="p-4 rounded-xl border-2 transition-all duration-200 text-left border-slate-200 bg-white hover:border-orange-300 hover:shadow-md hover:scale-105 hover:-translate-y-1"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <AlertCircle className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <h4 className="font-bold text-slate-800 mb-1">{course.name}</h4>
                                        <p className="text-sm text-slate-600 mb-2">{course.code}</p>
                                        <div className="flex items-center gap-2 text-xs flex-wrap">
                                            <span className="px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
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
                            <div style={{maxWidth: '70%'}}>
                                <button
                                    onClick={() => setSelectedCourse(null)}
                                    className="mb-3 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                    Quay lại danh sách môn học
                                </button>
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

                    {/* Add Challenge Form */}
                    {showAddForm && (
                        <div className="mb-6 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-orange-600" />
                                Thêm Thách Thức Mới
                            </h3>

                            <div className="space-y-3">
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

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleAddChallenge}
                                        disabled={!newChallenge.title.trim()}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold"
                                    >
                                        <Save className="w-4 h-4" />
                                        Thêm Thách Thức
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setNewChallenge({ title: '' });
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
                    {allChallenges.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p className="text-lg font-semibold">Chưa có thách thức nào</p>
                            <p className="text-sm mt-1">Nhấn nút "Thêm Thách Thức" để bắt đầu</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Pending Delete */}
                            {allChallenges.some(c => c.status === 'pending_delete') && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-slate-800">Thách thức chờ xóa</h4>
                                        <span className="text-xs text-slate-500">{allChallenges.filter(c => c.status === 'pending_delete').length} mục</span>
                                    </div>
                                    <div className="space-y-2">
                                        {allChallenges.filter(c => c.status === 'pending_delete').map((challenge, index) => (
                                            <div
                                                key={`${challenge.materialId}-${challenge.id}`}
                                                className="flex items-center gap-3 p-3 border border-red-200 rounded-lg bg-red-50 group"
                                            >
                                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                                                    <span className="font-bold text-red-600">{index + 1}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-800">
                                                        <span className="line-through">{challenge.title}</span>
                                                        <span className="text-xs text-red-700 font-medium ml-2">(Chờ xóa)</span>
                                                    </h4>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleUndoChange(challenge.id, challenge.materialId)}
                                                        className="flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm font-medium"
                                                        title="Hoàn tác"
                                                    >
                                                        <Undo className="w-4 h-4" />
                                                        Hoàn tác
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pending */}
                            {allChallenges.some(c => c.status === 'pending') && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-slate-800">Thách thức chờ duyệt</h4>
                                        <span className="text-xs text-slate-500">{allChallenges.filter(c => c.status === 'pending').length} mục</span>
                                    </div>
                                    <div className="space-y-2">
                                        {allChallenges.filter(c => c.status === 'pending').map((challenge, index) => (
                                            <div
                                                key={`${challenge.materialId}-${challenge.id}`}
                                                className="flex items-center gap-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50 group"
                                            >
                                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-200 transition-colors">
                                                    <span className="font-bold text-yellow-600">{index + 1}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-800">
                                                        {challenge.title}
                                                        <span className="text-xs text-yellow-700 font-medium ml-2">(Chờ duyệt)</span>
                                                    </h4>
                                                    {challenge.originalTitle && (
                                                        <p className="text-xs text-slate-500 mt-1 line-through">
                                                            Trước: {challenge.originalTitle}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleUndoChange(challenge.id, challenge.materialId)}
                                                        className="flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm font-medium"
                                                        title="Hoàn tác"
                                                    >
                                                        <Undo className="w-4 h-4" />
                                                        Hoàn tác
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditChallenge(challenge)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Approved */}
                            {allChallenges.some(c => c.status === 'approved') && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-slate-800">Thách thức đã được duyệt</h4>
                                        <span className="text-xs text-slate-500">{allChallenges.filter(c => c.status === 'approved').length} mục</span>
                                    </div>
                                    <div className="space-y-2">
                                        {allChallenges.filter(c => c.status === 'approved').map((challenge, index) => (
                                            <div
                                                key={`${challenge.materialId}-${challenge.id}`}
                                                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all bg-white group"
                                            >
                                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                                                    <span className="font-bold text-orange-600">{index + 1}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-800">{challenge.title}</h4>
                                                </div>
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
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingItem && (
                <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-800">Chỉnh sửa thách thức</h3>
                            <button
                                onClick={() => { setShowEditModal(false); setEditingItem(null); setFormData({ title: '' }); }}
                                className="text-slate-400 hover:text-slate-600 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Tiêu đề thách thức
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ title: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none transition"
                                placeholder="Nhập tiêu đề thách thức..."
                                autoFocus
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Sau khi chỉnh sửa, thách thức sẽ cần được admin duyệt lại
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowEditModal(false); setEditingItem(null); setFormData({ title: '' }); }}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmEdit}
                                disabled={!formData.title.trim()}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition font-medium"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && deletingChallenge && selectedCourse && (
                <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-800">Xác nhận xóa</h3>
                            <button 
                                onClick={() => { setShowDeleteModal(false); setDeletingChallenge(null); }}
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
                                        {selectedCourse.materials
                                            .find(m => m.id === deletingChallenge.materialId)?.challenges
                                            .find(c => c.id === deletingChallenge.challengeId)?.title}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Thách thức sẽ được đánh dấu chờ xóa
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                Thách thức sẽ được đánh dấu là "Chờ xóa" và cần admin duyệt trước khi xóa hoàn toàn.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeletingChallenge(null); }}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                            >
                                Đánh dấu chờ xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallengesManagement;
