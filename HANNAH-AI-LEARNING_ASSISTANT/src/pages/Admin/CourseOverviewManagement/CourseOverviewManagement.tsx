import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Lock, Save, Edit3, Eye, Map, Clock, User, Check, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import orientationService from '../../../service/orientationService';
import type { OrientationContent } from '../../../service/orientationService';
import authService from '../../../service/authService';
import AdminPageWrapper from '../components/AdminPageWrapper';
import { formatDateTimeVN } from '../../../utils/dateUtils';

// Password Verification Modal Component
interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (password: string) => Promise<boolean>;
}

const PasswordVerifyModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onVerify }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await onVerify(password);
            if (success) {
                setPassword('');
                onClose();
            } else {
                setError('Incorrect password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Lock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Password Verification</h2>
                        <p className="text-sm text-slate-500">Enter your password to continue editing</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Admin Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                            placeholder="Enter your password"
                            autoFocus
                            required
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setPassword('');
                                setError('');
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Confirm
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Custom Markdown Components
const MarkdownComponents: any = {
    h1: ({ node, ...props }: any) => (
        <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4" {...props} />
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
        </div>
    ),
    h2: ({ node, ...props }: any) => (
        <div className="flex items-center gap-4 mt-12 mb-6 group">
            <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <div className="font-bold text-xl">#</div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 border-b-2 border-slate-100 pb-2 w-full" {...props} />
        </div>
    ),
    h3: ({ node, ...props }: any) => (
        <h3 className="text-lg font-bold text-purple-700 mt-6 mb-3 flex items-center gap-2 uppercase tracking-wide text-sm" {...props} />
    ),
    p: ({ node, ...props }: any) => {
        const text = String(props.children);
        // Check if this paragraph contains checkmarks ( Goals section )
        if (text.includes("✅")) {
            const parts = text.split("✅").filter(part => part.trim().length > 0);
            return (
                <div className="flex flex-wrap gap-2 mb-4">
                    {parts.map((part, index) => (
                        <span key={index} className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-slate-700 font-medium shadow-sm hover:bg-green-100 transition-colors">
                            <span className="text-green-600 font-bold">✓</span>
                            {part.trim()}
                        </span>
                    ))}
                </div>
            );
        }
        return <p className="text-slate-600 leading-7 mb-4 text-[16px]" {...props} />;
    },
    ul: ({ node, ...props }: any) => (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8" {...props} />
    ),
    li: ({ node, ...props }: any) => {
        // Convert children to string to check for checkmarks
        const childText = React.Children.toArray(props.children).map(child => String(child)).join('');
        const isChecklist = childText.includes("✅");

        if (isChecklist) {
            return (
                <li className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl mb-2 col-span-2">
                    <div className="flex-shrink-0 text-green-600 bg-white p-1 rounded-full border border-green-200">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-slate-700 font-medium text-sm">{props.children}</span>
                </li>
            )
        }

        return (
            <li className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-md hover:border-blue-200 transition-all duration-300 h-full" {...props}>
                <span className="text-slate-700 font-medium">{props.children}</span>
            </li>
        )
    },
    strong: ({ node, ...props }: any) => {
        const text = String(props.children);
        if (text.includes("Mục tiêu")) {
            return (
                <div className="flex items-center gap-2 mt-6 mb-3 p-2 bg-blue-50/50 rounded-lg border-l-4 border-blue-500 w-full col-span-2">
                    <span className="text-blue-600 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                        <span>🎯</span>
                        {props.children}
                    </span>
                </div>
            );
        }
        return <strong className="block text-blue-900 font-bold mb-1" {...props} />;
    },
    blockquote: ({ node, ...props }: any) => (
        <div className="my-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg overflow-hidden relative">
            <div className="relative z-10">
                <blockquote className="font-medium text-lg opacity-95 italic" {...props} />
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-purple-500 opacity-20 rounded-full blur-xl"></div>
        </div>
    ),
    hr: ({ node, ...props }: any) => (
        <hr className="my-12 border-slate-200" {...props} />
    ),
};

const SAMPLE_ROADMAP_CONTENT = `# LỘ TRÌNH NGÀNH KỸ THUẬT PHẦN MỀM - TỔNG QUAN
*(Đại học FPT - Tổng quan Chương trình Kỹ thuật Phần mềm)*

## 🎯 GIỚI THIỆU LỘ TRÌNH
Chào mừng bạn đến với chương trình Kỹ thuật Phần mềm tại Đại học FPT! Tài liệu này cung cấp tổng quan toàn diện về hành trình 9 kỳ học từ sinh viên năm nhất đến kỹ sư phần mềm chuyên nghiệp.

## 📊 CẤU TRÚC CHƯƠNG TRÌNH

### 🔹 Giai đoạn 1: Nền tảng (KỲ 1-4)
**Trọng tâm:** Lập trình cơ bản & Nền tảng Khoa học Máy tính
**Mục tiêu:** Xây dựng kỹ năng code, hiểu thuật toán

### 🔹 Giai đoạn 2: Chuyên ngành hẹp (KỲ 5-8)
**Trọng tâm:** Chọn hướng đi + Kỹ năng chuyên sâu
**Mục tiêu:** Chọn 1 trong 5 chuyên ngành hẹp

### 🔹 Thực tập (KỲ 6)
**Trọng tâm:** On-the-Job Training (OJT)
**Mục tiêu:** Kinh nghiệm thực tế

### 🔹 Đồ án tốt nghiệp (KỲ 9)
**Trọng tâm:** Capstone Project
**Mục tiêu:** Thể hiện mọi thứ đã học

---

## 📅 KỲ 1 - LẬP TRÌNH CƠ BẢN
*Mọi người đều bắt đầu từ đây. Chưa chọn chuyên ngành - tập trung xây dựng nền tảng lập trình.*

**Các môn chính:**
- **PRF192 - Programming Fundamentals:** Giới thiệu tư duy lập trình với ngôn ngữ C
- **MAE101 - Mathematics for Engineering:** Nền tảng Giải tích
- **CEA201 - Computer Organization & Architecture:** Cách máy tính hoạt động
- **SSG104 - Communication & Soft Skills:** Kỹ năng thuyết trình và làm việc nhóm

> **Mục tiêu KỲ 1:**
> ✅ Hiểu tư duy lập trình cơ bản
> ✅ Làm quen với môi trường học đại học
> ✅ Xây dựng thói quen code hàng ngày

## 📅 KỲ 2 - LẬP TRÌNH HƯỚNG ĐỐI TƯỢNG
*Chuyển từ C sang Java, học OOP - nền tảng cho mọi ngôn ngữ hiện đại.*

**Các môn chính:**
- **PRO192 - Object-Oriented Programming:** Lập trình Java, khái niệm OOP (Classes, Objects, Inheritance, Polymorphism)
- **MAD101 - Discrete Mathematics:** Logic, tập hợp, đồ thị - nền tảng cho thuật toán
- **NWC203 - Computer Networking:** Internet hoạt động như thế nào
- **JPD113/116 - Japanese/English:** Kỹ năng ngôn ngữ

> **Mục tiêu KỲ 2:**
> ✅ Thành thạo Java cơ bản
> ✅ Hiểu OOP (Class, Object, Inheritance, Polymorphism)
> ✅ Tư duy về cấu trúc chương trình

## 📅 KỲ 3 - CẤU TRÚC DỮ LIỆU & THUẬT TOÁN
*KỲ quan trọng nhất cho phỏng vấn technical sau này.*

**Các môn chính:**
- **CSD201 - Data Structures & Algorithms:** Arrays, Linked Lists, Trees, Sorting, Searching
- **DBI202 - Database Systems:** SQL, cơ sở dữ liệu quan hệ, ER diagrams
- **WED201c - Web Development:** HTML, CSS, JavaScript cơ bản
- **OSG202 - Operating Systems:** Quản lý tiến trình, bộ nhớ, file systems

> **Mục tiêu KỲ 3:**
> ✅ Giải được các bài toán thuật toán cơ bản
> ✅ Thiết kế database và viết SQL
> ✅ Làm được website tĩnh đơn giản

## 📅 KỲ 4 - QUY TRÌNH PHẦN MỀM
*Học cách làm việc theo team, quy trình Agile/Scrum.*

**Các môn chính:**
- **SWE201c - Introduction to Software Engineering:** SDLC, Agile, Scrum, Waterfall
- **IOT102 - Internet of Things:** Cơ bản hệ thống nhúng
- **MAS291 - Statistics & Probability:** Nền tảng phân tích dữ liệu
- **Electives:** Bắt đầu khám phá các lĩnh vực quan tâm

> **Mục tiêu KỲ 4:**
> ✅ Hiểu quy trình phát triển phần mềm
> ✅ Sẵn sàng chọn chuyên ngành hẹp!
> ✅ Chuẩn bị GitHub, portfolio cá nhân`;

// Main Component
const CourseOverviewManagement: React.FC = () => {
    const [content, setContent] = useState<OrientationContent | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isContentVisible, setIsContentVisible] = useState(true);

    const fetchContent = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await orientationService.getContent();
            setContent(data);
            setEditedContent(data.content);
        } catch (err: any) {
            console.error('Error fetching orientation content:', err);
            if (err.response?.status === 404) {
                setError('"Orientation" subject has not been created. Please run the SQL script to create subject with ID 999.');
            } else {
                setError(err.message || 'Failed to load orientation content');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleEditClick = () => {
        setIsPasswordModalOpen(true);
    };

    const handlePasswordVerify = async (password: string): Promise<boolean> => {
        const success = await authService.verifyPassword(password);
        if (success) {
            setIsEditing(true);
        }
        return success;
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updatedContent = await orientationService.updateContent(editedContent);
            setContent(updatedContent);
            setIsEditing(false);
            setIsPreviewMode(false);
        } catch (err: any) {
            console.error('Error saving orientation content:', err);
            alert(err.message || 'Failed to save content');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedContent(content?.content || '');
        setIsEditing(false);
        setIsPreviewMode(false);
    };

    return (
        <AdminPageWrapper title="Orientation Document">
            <div className="orientation-management">
                <div className="mb-4">
                    <p className="text-slate-600 text-sm">
                        Manage orientation documents for students. This content will be displayed in the Student Roadmap.
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-slate-600">Loading content...</span>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-red-900">Failed to Load Data</h3>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchContent}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Main Content */}
                {!loading && !error && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <Map className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">
                                            {content?.subjectName || 'Định hướng'}
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            Subject Code: {content?.subjectCode || 'ORIENTATION'} • Semester 1
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {!isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleEditClick}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setIsContentVisible(!isContentVisible)}
                                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title={isContentVisible ? "Thu gọn" : "Mở rộng"}
                                        >
                                            {isContentVisible ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-medium ${isPreviewMode
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            <Eye className="w-4 h-4" />
                                            {isPreviewMode ? 'Preview' : 'Preview'}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-md disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Save
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Last Updated Info */}
                            {content?.lastUpdatedAt && (
                                <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        Updated: {formatDateTimeVN(content.lastUpdatedAt)}
                                    </span>
                                    {content.lastUpdatedBy && (
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            By: {content.lastUpdatedBy}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="p-6">
                            {isEditing ? (
                                isPreviewMode ? (
                                    <div className="prose prose-slate max-w-none p-6 bg-slate-50 rounded-xl border-2 border-slate-200 min-h-[500px]">
                                        <ReactMarkdown components={MarkdownComponents}>{editedContent}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Content (Supports Markdown)
                                        </label>
                                        <textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="w-full h-[500px] px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition font-mono text-sm resize-none"
                                            placeholder="Enter orientation content for students (supports Markdown)..."
                                        />
                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-xs text-slate-500">
                                                💡 Tip: You can use Markdown syntax like **bold**, *italic*, # heading, - list...
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setEditedContent(SAMPLE_ROADMAP_CONTENT)}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                                            >
                                                Insert Sample Template
                                            </button>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isContentVisible ? 'max-h-[200vh] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
                                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl overflow-hidden border border-blue-100">
                                        <div className="h-[calc(100vh-24rem)] min-h-[300px] overflow-y-auto px-4 py-8 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent custom-markdown-content font-sans">
                                            <div className="max-w-4xl mx-auto bg-white p-12 shadow-2xl rounded-2xl min-h-full border-t-8 border-blue-600 relative">
                                                {content?.content ? (
                                                    <ReactMarkdown components={MarkdownComponents}>
                                                        {content.content}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <div className="text-center py-16 text-slate-400">
                                                        <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                        <p className="text-lg">No content yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Password Modal */}
            <PasswordVerifyModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onVerify={handlePasswordVerify}
            />
        </AdminPageWrapper >
    );
};

export default CourseOverviewManagement;
