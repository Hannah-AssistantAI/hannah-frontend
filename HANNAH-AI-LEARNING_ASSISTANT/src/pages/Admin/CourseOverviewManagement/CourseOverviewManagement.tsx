import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Lock, Save, Edit3, Eye, Map, Clock, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import orientationService from '../../../service/orientationService';
import type { OrientationContent } from '../../../service/orientationService';
import authService from '../../../service/authService';
import AdminPageWrapper from '../components/AdminPageWrapper';

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
                setError('Mật khẩu không chính xác');
            }
        } catch (err) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
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
                        <h2 className="text-xl font-bold text-slate-800">Xác thực mật khẩu</h2>
                        <p className="text-sm text-slate-500">Nhập mật khẩu để tiếp tục chỉnh sửa</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mật khẩu Admin
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                            placeholder="Nhập mật khẩu của bạn"
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
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xác thực...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Xác nhận
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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
                setError('Môn "Định hướng" chưa được tạo. Vui lòng chạy SQL script để tạo subject với ID 999.');
            } else {
                setError(err.message || 'Không thể tải nội dung định hướng');
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
            alert(err.message || 'Không thể lưu nội dung');
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
        <AdminPageWrapper title="Tài liệu Định hướng">
            <div className="orientation-management">
                <div className="mb-4">
                    <p className="text-slate-600 text-sm">
                        Quản lý tài liệu định hướng cho sinh viên. Nội dung này sẽ hiển thị trong Student Roadmap.
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-slate-600">Đang tải nội dung...</span>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-red-900">Lỗi tải dữ liệu</h3>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchContent}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            Thử lại
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
                                            Mã môn: {content?.subjectCode || 'ORIENTATION'} • Học kỳ 1
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {!isEditing ? (
                                    <button
                                        onClick={handleEditClick}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Chỉnh sửa
                                    </button>
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
                                            {isPreviewMode ? 'Xem trước' : 'Xem trước'}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 px-4 py-2.5 border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-md disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Đang lưu...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Lưu
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
                                        Cập nhật: {new Date(content.lastUpdatedAt).toLocaleString('vi-VN')}
                                    </span>
                                    {content.lastUpdatedBy && (
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            Bởi: {content.lastUpdatedBy}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="p-6">
                            {isEditing ? (
                                isPreviewMode ? (
                                    <div className="prose prose-slate max-w-none p-6 bg-slate-50 rounded-xl border-2 border-slate-200 min-h-[400px]">
                                        <ReactMarkdown>{editedContent}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Nội dung (Hỗ trợ Markdown)
                                        </label>
                                        <textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="w-full h-[400px] px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition font-mono text-sm resize-none"
                                            placeholder="Nhập nội dung định hướng cho sinh viên (hỗ trợ Markdown)..."
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                            💡 Mẹo: Bạn có thể sử dụng cú pháp Markdown như **in đậm**, *in nghiêng*, # tiêu đề, - danh sách...
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="prose prose-slate max-w-none">
                                    {content?.content ? (
                                        <ReactMarkdown>{content.content}</ReactMarkdown>
                                    ) : (
                                        <div className="text-center py-16 text-slate-400">
                                            <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg">Chưa có nội dung</p>
                                            <p className="text-sm mt-1">Nhấn "Chỉnh sửa" để thêm nội dung định hướng</p>
                                        </div>
                                    )}
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
        </AdminPageWrapper>
    );
};

export default CourseOverviewManagement;
