import React, { useState, useEffect } from 'react';
import flaggingService, { type FlaggedItem, type MessageContext } from '../../../service/flaggingService';
import ResolveModal from './ResolveModal';
import { getStatusDisplay, getStatusClass, canResolve } from '../../../utils/statusHelpers';
import './MessageDetailModal.css';

interface MessageDetailModalProps {
    item: FlaggedItem;
    onClose: () => void;
    onUpdate: () => void;
}

const MessageDetailModal: React.FC<MessageDetailModalProps> = ({ item, onClose, onUpdate }) => {
    const [messageContext, setMessageContext] = useState<MessageContext | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showResolveModal, setShowResolveModal] = useState(false);

    useEffect(() => {
        if (item.type === 'message' && item.conversationId && item.messageId) {
            loadMessageContext();
        }
    }, [item]);

    const loadMessageContext = async () => {
        if (!item.conversationId || !item.messageId) return;

        try {
            setLoading(true);
            setError(null);

            const context = await flaggingService.getMessageContext(
                item.conversationId,
                String(item.messageId),
                5
            );
            setMessageContext(context);
        } catch (err) {
            if (err instanceof Error && err.message.includes('Not Found')) {
                setError('⚠️ Không tìm thấy nội dung hội thoại.');
            } else {
                setError(err instanceof Error ? err.message : 'Không thể tải message context');
            }
            console.error('Error loading message context:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveClick = () => {
        setShowResolveModal(true);
    };

    const handleResolveClose = () => {
        setShowResolveModal(false);
    };

    const handleResolveSuccess = () => {
        setShowResolveModal(false);
        onUpdate();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            message: 'Tin nhắn',
            quiz: 'Quiz',
            flashcard: 'Flashcard',
            report: 'Báo cáo',
            mindmap: 'Sơ đồ tư duy'
        };
        return labels[type] || type;
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            user: 'Học sinh',
            student: 'Học sinh',
            assistant: 'AI Assistant',
            faculty: 'Giảng viên'
        };
        return labels[role] || role;
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Chi Tiết Báo Cáo</h2>
                        <button className="close-button" onClick={onClose}>✕</button>
                    </div>

                    <div className="modal-body">
                        <div className="info-section">
                            <h3 className="section-title">Thông Tin Báo Cáo</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Loại:</span>
                                    <span className="info-value">{getTypeLabel(item.type)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Trạng thái:</span>
                                    <span className={`status-badge ${getStatusClass(item.status)}`}>
                                        {getStatusDisplay(item.status)}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Ưu tiên:</span>
                                    <span className={`priority-badge priority-${item.priority?.toLowerCase() || 'medium'}`}>
                                        {item.priority || 'Medium'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Người báo cáo:</span>
                                    <span className="info-value">{item.flaggedByName}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Thời gian:</span>
                                    <span className="info-value">{formatDate(item.flaggedAt)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="info-section">
                            <h3 className="section-title">Lý Do Báo Cáo</h3>
                            <div className="reason-box">{item.reason}</div>
                        </div>

                        {item.type === 'message' && (
                            <div className="info-section">
                                <h3 className="section-title">Nội Dung Hội Thoại</h3>
                                {loading && (
                                    <div className="loading-indicator">
                                        <div className="spinner-small"></div>
                                        <span>Đang tải...</span>
                                    </div>
                                )}
                                {error && (
                                    <div className="error-message">
                                        <span>{error}</span>
                                        <button onClick={loadMessageContext} className="retry-btn-small">
                                            Thử lại
                                        </button>
                                    </div>
                                )}
                                {messageContext && (
                                    <div className="message-context">
                                        {messageContext.messages.map((msg, index) => {
                                            const isStudent = msg.role === 'user' || msg.role === 'student';
                                            const isFlagged = msg.messageId === messageContext.flaggedMessageId;

                                            return (
                                                <React.Fragment key={index}>
                                                    {/* Regular message */}
                                                    <div
                                                        className={`message-bubble ${isStudent ? 'student-message' : 'assistant-message'} ${isFlagged ? 'flagged' : ''}`}
                                                    >
                                                        <div className="message-header">
                                                            <div className="message-sender-info">
                                                                <span className="message-role">{getRoleLabel(msg.role)}</span>
                                                                <span className="role-label">{isStudent ? '(Học sinh)' : '(AI Assistant)'}</span>
                                                            </div>
                                                            <span className="message-time">{formatDate(msg.timestamp)}</span>
                                                        </div>
                                                        <div className="message-content">{msg.content}</div>
                                                        {isFlagged && (
                                                            <div className="flagged-indicator">
                                                                🚩 Tin nhắn được báo cáo
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Show resolution right after flagged message */}
                                                    {isFlagged && item.status?.toLowerCase() === 'resolved' && (item.resolvedByName || item.resolutionNotes) && (
                                                        <div className="message-bubble resolution-message">
                                                            <div className="message-header">
                                                                <div className="resolution-header-left">
                                                                    <span className="message-role">{item.resolvedByName || 'Faculty'}</span>
                                                                    <span className="role-label">(Giảng viên)</span>
                                                                    <span className="resolution-badge-inline">đã xử lý</span>
                                                                </div>
                                                                {item.resolvedAt && (
                                                                    <span className="message-time">{formatDate(item.resolvedAt)}</span>
                                                                )}
                                                            </div>
                                                            {item.resolutionNotes && (
                                                                <div className="message-content">{item.resolutionNotes}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        {canResolve(item.status) && (
                            <button className="btn-resolve" onClick={handleResolveClick}>
                                ✅ Giải Quyết
                            </button>
                        )}
                        <button className="btn-close" onClick={onClose}>Đóng</button>
                    </div>
                </div>
            </div>

            {showResolveModal && (
                <ResolveModal
                    flagId={item.id}
                    onClose={handleResolveClose}
                    onSuccess={handleResolveSuccess}
                />
            )}
        </>
    );
};

export default MessageDetailModal;
