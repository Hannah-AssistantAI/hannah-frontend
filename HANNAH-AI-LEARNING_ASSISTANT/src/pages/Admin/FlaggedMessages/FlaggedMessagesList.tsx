import React, { useState, useEffect } from 'react';
import flaggingService, { type FlaggedItem } from '../../../service/flaggingService';
import MessageDetailModal from './MessageDetailModal';
import './FlaggedMessagesList.css';

type FilterStatus = 'all' | 'Pending' | 'Assigned' | 'Resolved';

const FlaggedMessagesList: React.FC = () => {
    const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [selectedItem, setSelectedItem] = useState<FlaggedItem | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        loadFlaggedItems();
    }, [filterStatus]);

    const loadFlaggedItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const status = filterStatus === 'all' ? undefined : filterStatus;
            const items = await flaggingService.getFlaggedItems(status);
            setFlaggedItems(items);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load flagged items');
            console.error('Error loading flagged items:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (item: FlaggedItem) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowDetailModal(false);
        setSelectedItem(null);
    };

    const handleItemUpdated = () => {
        loadFlaggedItems(); // Refresh list after update
        handleCloseModal();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'message':
                return '💬';
            case 'quiz':
                return '📝';
            case 'flashcard':
                return '🃏';
            case 'report':
                return '📊';
            case 'mindmap':
                return '🗺️';
            default:
                return '📄';
        }
    };

    const getStatusBadge = (status: string) => {
        const classMap: Record<string, string> = {
            Pending: 'status-pending',
            Assigned: 'status-assigned',
            Resolved: 'status-resolved'
        };
        return <span className={`status-badge ${classMap[status] || ''}`}>{status}</span>;
    };

    const getPriorityBadge = (priority?: string) => {
        if (!priority) return null;
        const classMap: Record<string, string> = {
            Low: 'priority-low',
            Medium: 'priority-medium',
            High: 'priority-high'
        };
        return <span className={`priority-badge ${classMap[priority] || ''}`}>{priority}</span>;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading && flaggedItems.length === 0) {
        return (
            <div className="flagged-messages-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flagged-messages-container">
            <div className="page-header">
                <h1>Quản Lý Nội Dung Được Báo Cáo</h1>
                <p className="page-description">
                    Xem và quản lý các tin nhắn, quiz, flashcard và nội dung khác được báo cáo bởi học sinh
                </p>
            </div>

            {error && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                    <button onClick={loadFlaggedItems} className="retry-button">
                        Thử lại
                    </button>
                </div>
            )}

            <div className="filters-section">
                <div className="filter-group">
                    <label>Lọc theo trạng thái:</label>
                    <div className="filter-buttons">
                        {(['all', 'Pending', 'Assigned', 'Resolved'] as FilterStatus[]).map((status) => (
                            <button
                                key={status}
                                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                                onClick={() => setFilterStatus(status)}
                            >
                                {status === 'all' ? 'Tất cả' : status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="stats-summary">
                    <div className="stat-item">
                        <span className="stat-value">{flaggedItems.length}</span>
                        <span className="stat-label">Tổng số</span>
                    </div>
                </div>
            </div>

            {flaggedItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>Không có báo cáo nào</h3>
                    <p>
                        {filterStatus === 'all'
                            ? 'Chưa có nội dung nào được báo cáo'
                            : `Không có báo cáo nào ở trạng thái "${filterStatus}"`}
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="flagged-items-table">
                        <thead>
                            <tr>
                                <th>Loại</th>
                                <th>Lý do</th>
                                <th>Người báo cáo</th>
                                <th>Thời gian</th>
                                <th>Trạng thái</th>
                                <th>Ưu tiên</th>
                                <th>Được giao cho</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flaggedItems.map((item) => (
                                <tr key={item.id} className="table-row">
                                    <td>
                                        <div className="type-cell">
                                            <span className="type-icon">{getTypeIcon(item.type)}</span>
                                            <span className="type-text">{item.type}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="reason-cell" title={item.reason}>
                                            {item.reason.length > 60
                                                ? `${item.reason.substring(0, 60)}...`
                                                : item.reason}
                                        </div>
                                    </td>
                                    <td>{item.flaggedByName}</td>
                                    <td>{formatDate(item.flaggedAt)}</td>
                                    <td>{getStatusBadge(item.status)}</td>
                                    <td>{getPriorityBadge(item.priority)}</td>
                                    <td>{item.assignedToName || <span className="text-muted">—</span>}</td>
                                    <td>
                                        <button
                                            className="btn-view-details"
                                            onClick={() => handleViewDetails(item)}
                                            title="Xem chi tiết"
                                        >
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showDetailModal && selectedItem && (
                <MessageDetailModal
                    item={selectedItem}
                    onClose={handleCloseModal}
                    onUpdate={handleItemUpdated}
                />
            )}
        </div>
    );
};

export default FlaggedMessagesList;
