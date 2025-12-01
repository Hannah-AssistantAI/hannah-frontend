import React, { useState, useEffect } from 'react';
import { X, CheckCircle, User, Flag, MessageSquare, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { FlagNotification } from '../../service/notificationService';
import flaggingService, { type FlaggedItem, type MessageContext } from '../../service/flaggingService';
import './NotificationDetailModal.css';

interface NotificationDetailModalProps {
    notification: FlagNotification;
    onClose: () => void;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({ notification, onClose }) => {
    const [flagDetail, setFlagDetail] = useState<FlaggedItem | null>(null);
    const [messageContext, setMessageContext] = useState<MessageContext | null>(null);
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
                    toast.error('Không thể tải nội dung hội thoại. Vui lòng thử lại!'); // ← THÊM
                }
            }
        } catch (error) {
            console.error('❌ Error loading flag detail:', error);
            toast.error('Không thể tải thông tin flag. Vui lòng thử lại!'); // ← THÊM
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
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                                        </div>
                                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                            Lý Do Bạn Đã Flag
                                        </h3>
                                    </div>
                                    <div className="bg-gradient-to-br from-red-50 via-rose-50/50 to-red-50 border-2 border-red-200/60 rounded-2xl p-7 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-red-300 backdrop-blur-sm">
                                        <p className="text-gray-800 leading-relaxed text-[15px] font-medium whitespace-pre-wrap">{flagDetail.reason}</p>
                                    </div>
                                </div>
                            )}

                            {/* Nội Dung Hội Thoại */}
                            {messageContext && messageContext.messages && messageContext.messages.length > 0 ? (
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 ring-4 ring-purple-100">
                                                <MessageSquare className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping opacity-75"></div>
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
                                                // Lấy message bị flag VÀ message trước đó (messageId - 1)
                                                return msgId === flaggedId || msgId === flaggedId - 1;
                                            })
                                            .map((msg, index) => {
                                                const isStudent = msg.role === 'user' || msg.role === 'student';
                                                // CHỈ highlight message từ notification này, KHÔNG highlight các flags khác
                                                const isFlagged = Number(msg.messageId) === flagDetail?.messageId;
                                                console.log(`Message ${msg.messageId}: isFlagged = ${isFlagged}, Number(${msg.messageId}) = ${Number(msg.messageId)}, flagDetail.messageId = ${flagDetail?.messageId}`);

                                                return (
                                                    <React.Fragment key={index}>
                                                        <div className="group">
                                                            <div className={`flex items-start gap-4 ${isStudent ? 'flex-row-reverse' : ''}`}>
                                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ring-4 group-hover:scale-110 transition-transform duration-300 ${isStudent
                                                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 ring-blue-100'
                                                                    : 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-500/20 ring-slate-100'
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
                                                                    <div className={`rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${isFlagged
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
                                                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-100 group-hover:scale-110 transition-transform duration-300">
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
                                                                        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 border-2 border-emerald-300/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-emerald-400 backdrop-blur-sm">
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
                            ) : (
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