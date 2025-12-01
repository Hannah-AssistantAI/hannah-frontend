import React, { useState, useEffect } from 'react';
import flaggingService, { type FlaggedItem, type MessageContext } from '../../../service/flaggingService';
import userService, { type User } from '../../../service/userService';
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

    // Inline assignment states
    const [showAssignSection, setShowAssignSection] = useState(false);
    const [facultyList, setFacultyList] = useState<User[]>([]);
    const [facultySearch, setFacultySearch] = useState('');
    const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);

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
                setError('⚠️ Không tìm thấy nội dung hội thoại. Message có thể đã bị xóa hoặc chưa được đồng bộ.');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to load message context');
            }
            console.error('Error loading message context:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadFacultyList = async () => {
        try {
            const faculty = await userService.getFacultyList();
            setFacultyList(faculty);
        } catch (err) {
            console.error('[ERROR] Failed to load faculty:', err);
            setAssignError(err instanceof Error ? err.message : 'Failed to load faculty');
        }
    };

    const handleAssignClick = () => {
        setShowAssignSection(true);
        setFacultySearch('');
        loadFacultyList();
    };

    const handleCancelAssign = () => {
        setShowAssignSection(false);
        setSelectedFacultyId(null);
        setFacultySearch('');
        setAssignError(null);
    };

    const handleConfirmAssign = async () => {
        if (!selectedFacultyId) {
            setAssignError('Vui lòng chọn giảng viên');
            return;
        }

        try {
            setAssignLoading(true);
            setAssignError(null);

            await flaggingService.assignToFaculty(item.id, selectedFacultyId);

            onUpdate();
            onClose();
        } catch (err) {
            setAssignError(err instanceof Error ? err.message : 'Assignment failed');
        } finally {
            setAssignLoading(false);
        }
    };

    // Filter faculty list by search term
    const filteredFacultyList = facultyList.filter(faculty =>
        faculty.fullName.toLowerCase().includes(facultySearch.toLowerCase()) ||
        faculty.email.toLowerCase().includes(facultySearch.toLowerCase())
    );

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

    const getRoleLabel = (role: string, senderName?: string) => {
        if (role === 'user' || role === 'student') {
            // Use student name from message context or fallback to flaggedByName
            return senderName || item.flaggedByName || 'Học sinh';
        }
        const labels: Record<string, string> = {
            assistant: 'AI Assistant',
            faculty: 'Giảng viên'
        };
        return labels[role] || role;
    };

    return (
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
                                    <span>⚠️ {error}</span>
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
                                                            <span className="message-role">{getRoleLabel(msg.role, item.flaggedByName)}</span>
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
                    {!showAssignSection ? (
                        <>
                            {item.status?.toLowerCase() === 'pending' && (
                                <button className="btn-assign" onClick={handleAssignClick}>
                                    📋 Giao Cho Giảng Viên
                                </button>
                            )}
                            <button className="btn-close" onClick={onClose}>Đóng</button>
                        </>
                    ) : (
                        <div className="assign-section">
                            <div className="assign-header">
                                <h4>Giao cho giảng viên</h4>
                            </div>

                            {assignError && (
                                <div className="error-message">
                                    <span>⚠️ {assignError}</span>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Tìm kiếm giảng viên:</label>
                                <input
                                    type="text"
                                    value={facultySearch}
                                    onChange={(e) => setFacultySearch(e.target.value)}
                                    placeholder="Nhập tên hoặc email..."
                                    className="faculty-search"
                                    disabled={assignLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label>Chọn giảng viên:</label>
                                <select
                                    value={selectedFacultyId || ''}
                                    onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                                    className="faculty-select"
                                    disabled={assignLoading}
                                    size={5}
                                >
                                    <option value="">-- Chọn giảng viên --</option>
                                    {filteredFacultyList.map((faculty) => (
                                        <option key={faculty.userId} value={faculty.userId}>
                                            {faculty.fullName} ({faculty.email})
                                        </option>
                                    ))}
                                </select>
                                {filteredFacultyList.length === 0 && facultySearch && (
                                    <small className="text-muted">Không tìm thấy giảng viên</small>
                                )}
                            </div>

                            <div className="assign-actions">
                                <button
                                    className="btn-confirm"
                                    onClick={handleConfirmAssign}
                                    disabled={assignLoading || !selectedFacultyId}
                                >
                                    {assignLoading ? 'Đang giao...' : 'Xác nhận'}
                                </button>
                                <button
                                    className="btn-cancel"
                                    onClick={handleCancelAssign}
                                    disabled={assignLoading}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageDetailModal;
