import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, MessageSquare, FileText } from 'lucide-react';
import type { FlagNotification } from '../../service/notificationService';
import notificationService from '../../service/notificationService';
import './NotificationDetailModal.css';

interface NotificationDetailModalProps {
    notification: FlagNotification;
    onClose: () => void;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({ notification, onClose }) => {
    const [flagDetail, setFlagDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFlagDetail();
    }, [notification.flagId]);

    const loadFlagDetail = async () => {
        try {
            setLoading(true);
            const detail = await notificationService.getFlagDetail(notification.flagId);
            setFlagDetail(detail);
        } catch (error) {
            console.error('Error loading flag detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const navigateToConversation = () => {
        if (flagDetail?.conversationId) {
            window.location.href = `/chat?conversation=${flagDetail.conversationId}`;
        }
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
                            {/* Resolution Info */}
                            <div className="notification-section">
                                <h3 className="notification-section-title">Thông Tin Giải Quyết</h3>
                                <div className="notification-info-grid">
                                    <div className="notification-info-item">
                                        <span className="notification-info-label">Giải quyết bởi:</span>
                                        <span className="notification-info-value">{notification.resolvedByName}</span>
                                    </div>
                                    <div className="notification-info-item">
                                        <span className="notification-info-label">
                                            <Clock size={16} />
                                            Thời gian:
                                        </span>
                                        <span className="notification-info-value">
                                            {formatDateTime(notification.resolvedAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Resolution Message */}
                            {flagDetail?.resolutionNotes && (
                                <div className="notification-section">
                                    <h3 className="notification-section-title">
                                        <FileText size={18} />
                                        Nội Dung Giải Quyết Từ Giảng Viên
                                    </h3>
                                    <div className="notification-resolution-content">
                                        <p>{flagDetail.resolutionNotes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Original Flagged Content */}
                            {flagDetail?.messageContext && (
                                <div className="notification-section">
                                    <h3 className="notification-section-title">
                                        <MessageSquare size={18} />
                                        Nội Dung Tin Nhắn Đã Flag
                                    </h3>
                                    <div className="notification-message-context">
                                        {flagDetail.messageContext.context?.map((msg: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`context-message ${msg.sender === 'user' ? 'user-msg' : 'assistant-msg'} ${msg.messageId === flagDetail.messageId ? 'flagged-msg' : ''}`}
                                            >
                                                <div className="context-sender">
                                                    {msg.sender === 'user' ? 'Bạn' : 'AI Assistant'}
                                                    {msg.messageId === flagDetail.messageId && (
                                                        <span className="flagged-badge">🚩 Đã Flag</span>
                                                    )}
                                                </div>
                                                <div className="context-content">{msg.content}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Flag Reason */}
                            {flagDetail?.reason && (
                                <div className="notification-section">
                                    <h3 className="notification-section-title">Lý Do Flag</h3>
                                    <div className="notification-reason">
                                        <p>{flagDetail.reason}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="notification-modal-actions">
                                {flagDetail?.conversationId && (
                                    <button
                                        className="notification-btn notification-btn-secondary"
                                        onClick={navigateToConversation}
                                    >
                                        Xem Cuộc Trò Chuyện
                                    </button>
                                )}
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
