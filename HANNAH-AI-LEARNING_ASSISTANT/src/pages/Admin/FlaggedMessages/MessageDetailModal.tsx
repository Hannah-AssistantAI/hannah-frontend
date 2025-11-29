import React, { useState, useEffect } from 'react';
import flaggingService, { type FlaggedItem, type MessageContext } from '../../../service/flaggingService';
import AssignFacultyModal from './AssignFacultyModal';
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
    const [showAssignModal, setShowAssignModal] = useState(false);

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

            console.log('[DEBUG] Loading context for:', {
                conversationId: item.conversationId,
                messageId: item.messageId,
                messageIdType: typeof item.messageId
            });

            const context = await flaggingService.getMessageContext(
                item.conversationId,
                String(item.messageId),
                5
            );
            setMessageContext(context);
        } catch (err) {
            // Handle 404 gracefully - message might not exist in MongoDB
            if (err instanceof Error && err.message.includes('Not Found')) {
                setError('⚠️ Không tìm thấy nội dung hội thoại. Message có thể đã bị xóa hoặc chưa được đồng bộ.');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to load message context');
            }
            console.error('Error loading message context:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignClick = () => {
        setShowAssignModal(true);
    };

    const handleAssignClose = () => {
        setShowAssignModal(false);
    };

    const handleAssignSuccess = () => {
        setShowAssignModal(false);
        onUpdate(); // Refresh parent list
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
                        <button className="close-button" onClick={onClose}>
                            ✕
                        </button>
                    </div>

                    <div className="modal-body">
                        {/* Flag Info Section */}
                        <div className="info-section">
                            <h3 className="section-title">Thông Tin Báo Cáo</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Loại:</span>
                                    <span className="info-value">{getTypeLabel(item.type)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Trạng thái:</span>
                                    <span className={`status-badge status-${item.status.toLowerCase()}`}>
                                        {item.status}
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
                                {item.assignedToName && (
                                    <div className="info-item">
                                        <span className="info-label">Được giao cho:</span>
                                        <span className="info-value">{item.assignedToName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reason Section */}
                        <div className="info-section">
                            <h3 className="section-title">Lý Do Báo Cáo</h3>
                            <div className="reason-box">
                                {item.reason}
                            </div>
                        </div>

                        {/* Message Context Section */}
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
                                        <span>⚠️ {error}</span>
                                        <button onClick={loadMessageContext} className="retry-btn-small">
                                            Thử lại
                                        </button>
                                    </div>
                                )}
                                {messageContext && (
                                    <div className="message-context">
                                        {messageContext.messages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`message-bubble ${msg.role} ${msg.messageId === messageContext.flaggedMessageId ? 'flagged' : ''
                                                    }`}
                                            >
                                                <div className="message-header">
                                                    <span className="message-role">{getRoleLabel(msg.role)}</span>
                                                    <span className="message-time">
                                                        {formatDate(msg.timestamp)}
                                                    </span>
                                                </div>
                                                <div className="message-content">{msg.content}</div>
                                                {msg.messageId === messageContext.flaggedMessageId && (
                                                    <div className="flagged-indicator">
                                                        🚩 Tin nhắn được báo cáo
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content Details for non-message types */}
                        {item.type !== 'message' && (
                            <div className="info-section">
                                <h3 className="section-title">Thông Tin Nội Dung</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">{getTypeLabel(item.type)} ID:</span>
                                        <span className="info-value">{item.contentId}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Conversation ID:</span>
                                        <span className="info-value">{item.conversationId}</span>
                                    </div>
                                </div>
                                {item.metadata && Object.keys(item.metadata).length > 0 && (
                                    <div className="metadata-section">
                                        <h4>Metadata:</h4>
                                        <pre className="metadata-box">
                                            {JSON.stringify(item.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        {item.status === 'Pending' && (
                            <button
                                className="btn-assign"
                                onClick={handleAssignClick}
                            >
                                📋 Giao Cho Giảng Viên
                            </button>
                        )}
                        <button className="btn-close" onClick={onClose}>
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            {showAssignModal && (
                <AssignFacultyModal
                    flagId={item.id}
                    onClose={handleAssignClose}
                    onSuccess={handleAssignSuccess}
                />
            )}
        </>
    );
};

export default MessageDetailModal;
