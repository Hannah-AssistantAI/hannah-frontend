import React, { useState, useEffect } from 'react';
import { X, CheckCircle, User, Flag, MessageSquare, UserCheck, FileText, CheckCheck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { FlagNotification } from '../../service/notificationService';
import flaggingService, { type FlaggedItem, type MessageContext } from '../../service/flaggingService';
import quizApiService, { type QuizAttemptDetailDto } from '../../service/quizApi';
import './NotificationDetailModal.css';

interface NotificationDetailModalProps {
    notification: FlagNotification;
    onClose: () => void;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({ notification, onClose }) => {
    const [flagDetail, setFlagDetail] = useState<FlaggedItem | null>(null);
    const [messageContext, setMessageContext] = useState<MessageContext | null>(null);
    const [quizAttempt, setQuizAttempt] = useState<QuizAttemptDetailDto | null>(null);
    const [loading, setLoading] = useState(true);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        loadFlagDetail();
    }, [notification.flagId]);

    const loadFlagDetail = async () => {
        try {
            setLoading(true);
            const detail = await flaggingService.getFlagById(notification.flagId);
            setFlagDetail(detail);

            if (notification.isQuiz) {
                // Load quiz attempt data
                const quizId = detail.contentId || detail.metadata?.quizId;
                const attemptId = detail.metadata?.attemptId;

                if (quizId) {
                    try {
                        if (attemptId) {
                            const attemptData = await quizApiService.getQuizAttemptDetail(
                                Number(quizId),
                                Number(attemptId)
                            );
                            setQuizAttempt(attemptData);
                            console.log('✅ Loaded quiz attempt by attemptId:', attemptData);
                        } else {
                            // Fallback: find attempt from the flagging user
                            console.log('⚠️ No attemptId in metadata, fetching attempts list...');
                            const attempts = await quizApiService.getQuizAttempts(Number(quizId));
                            const userAttempt = attempts.find(a => a.userId === detail.flaggedByUserId);

                            if (userAttempt) {
                                const attemptData = await quizApiService.getQuizAttemptDetail(
                                    Number(quizId),
                                    userAttempt.attemptId
                                );
                                setQuizAttempt(attemptData);
                                console.log('✅ Loaded quiz attempt by userId fallback:', attemptData);
                            }
                        }
                    } catch (err) {
                        console.error('❌ Error loading quiz attempt:', err);
                    }
                }
            } else {
                if (detail.type === 'message' && detail.conversationId && detail.messageId) {
                    try {
                        const context = await flaggingService.getMessageContext(
                            detail.conversationId,
                            String(detail.messageId),
                            5
                        );
                        setMessageContext(context);
                    } catch (err) {
                        console.error('❌ Error loading message context:', err);
                        toast.error('Không thể tải nội dung hội thoại. Vui lòng thử lại!');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error loading flag detail:', error);
            toast.error('Không thể tải thông tin flag. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRoleLabel = (role: string) => {
        if (role === 'user' || role === 'student') return 'Bạn';
        return 'AI Assistant';
    };

    // Calculate percentage safely
    const getPercentage = (): number => {
        if (!quizAttempt) return 0;
        if (quizAttempt.percentage !== undefined && quizAttempt.percentage !== null) {
            return quizAttempt.percentage;
        }
        // Fallback: calculate from score/maxScore
        if (quizAttempt.maxScore && quizAttempt.maxScore > 0) {
            return (quizAttempt.score / quizAttempt.maxScore) * 100;
        }
        return 0;
    };

    const getScoreBgColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-100 text-green-700';
        if (percentage >= 60) return 'bg-blue-100 text-blue-700';
        if (percentage >= 40) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    const percentage = getPercentage();

    return (
        <>
            <div className="notification-modal-overlay" onClick={onClose} />
            <div className="notification-modal">
                <div className="notification-modal-header">
                    <div className="notification-modal-title">
                        <CheckCircle className="notification-modal-icon" />
                        <h2>Thông Báo Giải Quyết Flag</h2>
                    </div>
                    <button className="notification-modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="notification-modal-content">
                    {loading ? (
                        <div className="notification-loading">
                            <div className="loading-spinner-large">⟳</div>
                            <p>Đang tải thông tin...</p>
                        </div>
                    ) : (
                        <>
                            {/* Lý Do Báo Cáo */}
                            {flagDetail?.reason && (
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 ring-4 ring-red-100">
                                                <Flag className="w-7 h-7 text-white" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                            Lý Do Bạn Đã Flag
                                        </h3>
                                    </div>
                                    <div className="bg-gradient-to-br from-red-50 via-rose-50/50 to-red-50 border-2 border-red-200/60 rounded-2xl p-7 shadow-lg">
                                        <p className="text-gray-800 leading-relaxed text-[15px] font-medium whitespace-pre-wrap">{flagDetail.reason}</p>
                                    </div>
                                </div>
                            )}

                            {/* Quiz Notification Detail */}
                            {notification.isQuiz && (
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-orange-100">
                                            <FileText className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                            Chi Tiết Quiz Đã Flag
                                        </h3>
                                    </div>

                                    {/* Quiz Info Card */}
                                    <div className="bg-gradient-to-br from-orange-50 via-amber-50/50 to-yellow-50 border-2 border-orange-200/60 rounded-2xl p-6 shadow-lg mb-6">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Quiz ID:</span>
                                                <span className="ml-2 font-semibold text-gray-800">#{flagDetail?.contentId || notification.flagId}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Trạng thái:</span>
                                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                    Đã giải quyết
                                                </span>
                                            </div>
                                        </div>
                                        {(quizAttempt?.quizTitle || flagDetail?.metadata?.title) && (
                                            <div className="mt-4">
                                                <span className="text-gray-500 text-sm">Tiêu đề Quiz:</span>
                                                <p className="font-semibold text-gray-800 mt-1">
                                                    {quizAttempt?.quizTitle || String(flagDetail?.metadata?.title)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Score Section */}
                                    {quizAttempt && (
                                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg mb-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-bold text-gray-800">Kết Quả Bài Làm</h4>
                                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getScoreBgColor(percentage)}`}>
                                                    {percentage >= 50 ? 'ĐẠT' : 'CHƯA ĐẠT'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                {/* Score Circle */}
                                                <div className="relative w-24 h-24">
                                                    <svg className="w-24 h-24 transform -rotate-90">
                                                        <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                                        <circle
                                                            cx="48" cy="48" r="40"
                                                            stroke={percentage >= 50 ? '#10b981' : '#ef4444'}
                                                            strokeWidth="8"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeDasharray={`${percentage * 2.51} 251`}
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-gray-800">{percentage.toFixed(0)}%</span>
                                                    </div>
                                                </div>

                                                {/* Score Details */}
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Điểm:</span>
                                                        <span className="font-bold text-gray-800">{quizAttempt.score} / {quizAttempt.maxScore}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Số câu đúng:</span>
                                                        <span className="font-bold text-green-600">
                                                            {quizAttempt.questions?.filter(q => q.isCorrect).length || 0} / {quizAttempt.totalQuestions}
                                                        </span>
                                                    </div>
                                                    {quizAttempt.timeTaken && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500">Thời gian:</span>
                                                            <span className="font-bold text-gray-800">
                                                                {Math.floor(quizAttempt.timeTaken / 60)}m {quizAttempt.timeTaken % 60}s
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Questions List */}
                                    {quizAttempt?.questions && quizAttempt.questions.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5" />
                                                Chi Tiết Câu Hỏi
                                            </h4>

                                            {quizAttempt.questions.map((question, index) => (
                                                <div
                                                    key={question.questionId}
                                                    className={`border-2 rounded-xl p-5 ${question.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <span className="text-sm font-bold text-gray-600">Câu {index + 1}</span>
                                                        {question.isCorrect ? (
                                                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                                <CheckCheck className="w-3 h-3" /> Đúng
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                                <XCircle className="w-3 h-3" /> Sai
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-gray-800 font-medium mb-4">{question.content}</p>

                                                    <div className="space-y-2">
                                                        {question.options?.map((option, optIndex) => {
                                                            const isSelected = optIndex === question.selectedOptionIndex;
                                                            const isCorrect = optIndex === question.correctOptionIndex;

                                                            let optionClass = 'border-gray-200 bg-white';
                                                            if (isSelected && isCorrect) {
                                                                optionClass = 'border-green-400 bg-green-100';
                                                            } else if (isSelected && !isCorrect) {
                                                                optionClass = 'border-red-400 bg-red-100';
                                                            } else if (isCorrect) {
                                                                optionClass = 'border-green-400 bg-green-50';
                                                            }

                                                            return (
                                                                <div key={optIndex} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${optionClass}`}>
                                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected
                                                                            ? isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                                            : isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                                                        }`}>
                                                                        {String.fromCharCode(65 + optIndex)}
                                                                    </span>
                                                                    <span className={`flex-1 text-sm ${isCorrect ? 'font-semibold text-green-700' : 'text-gray-700'}`}>
                                                                        {option}
                                                                    </span>
                                                                    {isSelected && <span className="text-xs text-gray-500">(Bạn chọn)</span>}
                                                                    {isCorrect && !isSelected && <span className="text-xs text-green-600 font-medium">(Đáp án đúng)</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {question.explanation && (
                                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                            <span className="text-xs font-bold text-blue-600">Giải thích:</span>
                                                            <p className="text-sm text-blue-800 mt-1">{question.explanation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Faculty Resolution for Quiz */}
                                    {(notification.resolutionNotes || flagDetail?.resolutionNotes) && (
                                        <div className="mt-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg ring-4 ring-emerald-100">
                                                    <UserCheck className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-gray-900">{flagDetail?.resolvedByName || notification.resolvedByName}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full">
                                                            Giảng viên
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full">
                                                            ĐÃ XỬ LÝ
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 border-2 border-emerald-300/60 rounded-2xl p-6 shadow-lg">
                                                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px] font-medium">
                                                    {notification.resolutionNotes || flagDetail?.resolutionNotes}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Message Context - Only for Message flags */}
                            {!notification.isQuiz && messageContext?.messages && messageContext.messages.length > 0 && (
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-purple-100">
                                            <MessageSquare className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                            Nội Dung Hội Thoại
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        {messageContext.messages
                                            .filter(msg => {
                                                const flaggedId = flagDetail?.messageId;
                                                if (!flaggedId) return false;
                                                const msgId = Number(msg.messageId);
                                                return msgId === flaggedId || msgId === flaggedId - 1;
                                            })
                                            .map((msg, index) => {
                                                const isStudent = msg.role === 'user' || msg.role === 'student';
                                                const isFlagged = Number(msg.messageId) === flagDetail?.messageId;

                                                return (
                                                    <React.Fragment key={index}>
                                                        <div className="group">
                                                            <div className={`flex items-start gap-4 ${isStudent ? 'flex-row-reverse' : ''}`}>
                                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ${isStudent
                                                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-blue-100'
                                                                        : 'bg-gradient-to-br from-slate-500 to-slate-700 ring-slate-100'
                                                                    }`}>
                                                                    <User className="w-6 h-6 text-white" />
                                                                </div>
                                                                <div className={`flex-1 ${isStudent ? 'text-right' : ''}`}>
                                                                    <div className={`flex items-center gap-3 mb-2 ${isStudent ? 'justify-end' : ''}`}>
                                                                        <span className="font-bold text-sm text-gray-900">{getRoleLabel(msg.role)}</span>
                                                                        <span className={`px-3 py-1 text-white text-xs font-bold rounded-full shadow-md ${isStudent
                                                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                                                : 'bg-gradient-to-r from-slate-500 to-slate-600'
                                                                            }`}>
                                                                            {isStudent ? 'Học sinh' : 'AI'}
                                                                        </span>
                                                                    </div>
                                                                    <div className={`rounded-2xl p-6 shadow-md ${isFlagged
                                                                            ? 'bg-white border-2 border-red-400 ring-4 ring-red-100'
                                                                            : isStudent
                                                                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-2 border-blue-200/60'
                                                                                : 'bg-white border-2 border-gray-200'
                                                                        }`}>
                                                                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">{msg.content}</p>
                                                                        {isFlagged && (
                                                                            <div className="mt-4 pt-4 border-t-2 border-red-200 flex items-center gap-2 text-red-700 font-bold">
                                                                                <Flag className="w-5 h-5" />
                                                                                Tin nhắn được báo cáo
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-2 font-medium">{formatDate(msg.timestamp)}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Resolution message */}
                                                        {isFlagged && flagDetail?.status?.toLowerCase() === 'resolved' && flagDetail.resolutionNotes && (
                                                            <div className="group">
                                                                <div className="flex items-start gap-4">
                                                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-emerald-100">
                                                                        <UserCheck className="w-6 h-6 text-white" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <span className="font-bold text-sm text-gray-900">{flagDetail.resolvedByName || notification.resolvedByName}</span>
                                                                            <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full shadow-md">
                                                                                Giảng viên
                                                                            </span>
                                                                            <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-md">
                                                                                ĐÃ XỬ LÝ
                                                                            </span>
                                                                        </div>
                                                                        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 border-2 border-emerald-300/60 rounded-2xl p-6 shadow-lg">
                                                                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px] font-medium">{flagDetail.resolutionNotes}</p>
                                                                        </div>
                                                                        {flagDetail.resolvedAt && (
                                                                            <p className="text-xs text-gray-500 mt-2 font-medium">{formatDate(flagDetail.resolvedAt)}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Fallback for Message flags without context */}
                            {!notification.isQuiz && (!messageContext?.messages || messageContext.messages.length === 0) && (
                                <div className="mb-10 text-center text-gray-500">
                                    <p>Không tải được nội dung hội thoại</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="notification-modal-actions">
                                <button className="notification-btn notification-btn-primary" onClick={onClose}>
                                    Đóng
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationDetailModal;