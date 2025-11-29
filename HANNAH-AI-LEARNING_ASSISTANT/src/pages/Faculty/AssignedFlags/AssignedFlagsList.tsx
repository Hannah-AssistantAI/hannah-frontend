import React, { useState, useEffect } from 'react';
import type { FlaggedItem } from '../../../service/flaggingService';
import flaggingService from '../../../service/flaggingService';
import MessageDetailModal from './MessageDetailModal';
import { getStatusDisplay, getStatusClass, isResolved } from '../../../utils/statusHelpers';
import './AssignedFlagsList.css';

type FilterStatus = 'processing' | 'resolved';

const AssignedFlagsList: React.FC = () => {
    const [assignedFlags, setAssignedFlags] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('processing');
    const [selectedItem, setSelectedItem] = useState<FlaggedItem | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        loadAssignedFlags();
    }, []);

    const loadAssignedFlags = async () => {
        try {
            setLoading(true);
            setError(null);
            const flags = await flaggingService.getAssignedFlags();
            setAssignedFlags(flags);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách báo cáo');
            console.error('Error loading assigned flags:', err);
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
        loadAssignedFlags();
        handleCloseModal();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'message': return '💬';
            case 'quiz': return '📝';
            case 'flashcard': return '🃏';
            case 'report': return '📊';
            case 'mindmap': return '🗺️';
            default: return '📄';
        }
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

    // Filter using status helpers
    const filteredFlags = assignedFlags.filter(flag => {
        if (filterStatus === 'resolved') return isResolved(flag.status);
        if (filterStatus === 'processing') return !isResolved(flag.status);
        return true;
    });

    // Count for each filter
    const getStatusCount = (status: FilterStatus): number => {
        if (status === 'resolved') return assignedFlags.filter(f => isResolved(f.status)).length;
        if (status === 'processing') return assignedFlags.filter(f => !isResolved(f.status)).length;
        return 0;
    };


    if (loading && assignedFlags.length === 0) {
        return (
            <div className="assigned-flags-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="assigned-flags-container">
            <div className="page-header">
                <h1>📋 Báo Cáo Được Giao Cho Tôi</h1>
                <p className="page-description">
                    Quản lý và xử lý các báo cáo được giao cho bạn
                </p>
            </div>

            {error && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                    <button onClick={loadAssignedFlags} className="retry-button">
                        Thử lại
                    </button>
                </div>
            )}

            <div className="filters-section">
                <div className="filter-group">
                    <label>Lọc theo trạng thái:</label>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filterStatus === 'processing' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('processing')}
                        >
                            Đang xử lý
                            <span className="filter-count">{getStatusCount('processing')}</span>
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'resolved' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('resolved')}
                        >
                            Đã giải quyết
                            <span className="filter-count">{getStatusCount('resolved')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {filteredFlags.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>Không có báo cáo nào</h3>
                    <p>
                        {filterStatus === 'processing'
                            ? 'Không có báo cáo nào đang xử lý'
                            : 'Không có báo cáo nào đã giải quyết'}
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="assigned-flags-table">
                        <thead>
                            <tr>
                                <th>Loại</th>
                                <th>Lý do</th>
                                <th>Người báo cáo</th>
                                <th>Thời gian</th>
                                <th>Trạng thái</th>
                                <th>Ưu tiên</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFlags.map((item) => (
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
                                    <td>
                                        <span className={`status-badge ${getStatusClass(item.status)}`}>
                                            {getStatusDisplay(item.status)}
                                        </span>
                                    </td>
                                    <td>{getPriorityBadge(item.priority)}</td>
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

export default AssignedFlagsList;
