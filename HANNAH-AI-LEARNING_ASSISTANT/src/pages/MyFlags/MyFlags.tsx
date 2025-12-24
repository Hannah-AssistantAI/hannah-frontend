import React, { useState, useEffect } from 'react';
import { Flag, Clock, User, CheckCircle, AlertCircle, MessageSquare, FileQuestion } from 'lucide-react';
import apiClient from '../../service/apiClient';
import './MyFlags.css';

interface MyFlag {
    id: number;
    type: string;
    contentId: number | null;
    reason: string;
    status: string;
    priority: string | null;
    flaggedAt: string;
    assignedToName: string | null;
    assignedAt: string | null;
    resolvedByName: string | null;
    resolvedAt: string | null;
    resolutionNotes: string | null;
}

const MyFlags: React.FC = () => {
    const [flags, setFlags] = useState<MyFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        loadFlags();
    }, []);

    const loadFlags = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<MyFlag[]>('/api/flagging/my-flags');
            setFlags(response.data);
        } catch (error) {
            console.error('Error loading flags:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <span className="status-badge status-pending"><AlertCircle size={14} /> Pending</span>;
            case 'assigned':
                return <span className="status-badge status-assigned"><User size={14} /> Assigned</span>;
            case 'resolved':
                return <span className="status-badge status-resolved"><CheckCircle size={14} /> Resolved</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'quiz':
                return <FileQuestion size={18} className="type-icon quiz" />;
            case 'message':
                return <MessageSquare size={18} className="type-icon message" />;
            default:
                return <Flag size={18} className="type-icon" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredFlags = flags.filter(flag => {
        if (filter === 'all') return true;
        return flag.status.toLowerCase() === filter;
    });

    const stats = {
        total: flags.length,
        pending: flags.filter(f => f.status.toLowerCase() === 'pending').length,
        assigned: flags.filter(f => f.status.toLowerCase() === 'assigned').length,
        resolved: flags.filter(f => f.status.toLowerCase() === 'resolved').length
    };

    if (loading) {
        return (
            <div className="my-flags-loading">
                <div className="spinner"></div>
                <p>Loading your flags...</p>
            </div>
        );
    }

    return (
        <div className="my-flags-container">
            <div className="my-flags-header">
                <div className="header-content">
                    <h1><Flag size={28} /> My Flags</h1>
                    <p>Track the status of issues you've reported</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card" onClick={() => setFilter('all')}>
                    <div className="stat-number">{stats.total}</div>
                    <div className="stat-label">Total Flags</div>
                </div>
                <div className="stat-card pending" onClick={() => setFilter('pending')}>
                    <div className="stat-number">{stats.pending}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card assigned" onClick={() => setFilter('assigned')}>
                    <div className="stat-number">{stats.assigned}</div>
                    <div className="stat-label">Assigned</div>
                </div>
                <div className="stat-card resolved" onClick={() => setFilter('resolved')}>
                    <div className="stat-number">{stats.resolved}</div>
                    <div className="stat-label">Resolved</div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                    All ({stats.total})
                </button>
                <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
                    Pending ({stats.pending})
                </button>
                <button className={filter === 'assigned' ? 'active' : ''} onClick={() => setFilter('assigned')}>
                    Assigned ({stats.assigned})
                </button>
                <button className={filter === 'resolved' ? 'active' : ''} onClick={() => setFilter('resolved')}>
                    Resolved ({stats.resolved})
                </button>
            </div>

            {/* Flags List */}
            <div className="flags-list">
                {filteredFlags.length === 0 ? (
                    <div className="empty-state">
                        <Flag size={48} />
                        <h3>No flags found</h3>
                        <p>You haven't flagged any content yet.</p>
                    </div>
                ) : (
                    filteredFlags.map(flag => (
                        <div
                            key={flag.id}
                            className={`flag-card ${flag.status.toLowerCase()} ${expandedId === flag.id ? 'expanded' : ''}`}
                            onClick={() => setExpandedId(expandedId === flag.id ? null : flag.id)}
                        >
                            <div className="flag-main">
                                <div className="flag-type">
                                    {getTypeIcon(flag.type)}
                                    <span className="type-label">{flag.type.toUpperCase()}</span>
                                </div>

                                <div className="flag-content">
                                    <p className="flag-reason">{flag.reason}</p>
                                    <div className="flag-meta">
                                        <span><Clock size={14} /> {formatDate(flag.flaggedAt)}</span>
                                        {flag.priority && <span className={`priority ${flag.priority.toLowerCase()}`}>{flag.priority}</span>}
                                    </div>
                                </div>

                                <div className="flag-status">
                                    {getStatusBadge(flag.status)}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === flag.id && (
                                <div className="flag-details">
                                    <div className="timeline">
                                        <div className="timeline-item">
                                            <div className="timeline-dot flagged"></div>
                                            <div className="timeline-content">
                                                <strong>Flagged</strong>
                                                <span>{formatDate(flag.flaggedAt)}</span>
                                            </div>
                                        </div>

                                        {flag.assignedAt && (
                                            <div className="timeline-item">
                                                <div className="timeline-dot assigned"></div>
                                                <div className="timeline-content">
                                                    <strong>Assigned to {flag.assignedToName}</strong>
                                                    <span>{formatDate(flag.assignedAt)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {flag.resolvedAt && (
                                            <div className="timeline-item">
                                                <div className="timeline-dot resolved"></div>
                                                <div className="timeline-content">
                                                    <strong>Resolved by {flag.resolvedByName}</strong>
                                                    <span>{formatDate(flag.resolvedAt)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {flag.resolutionNotes && (
                                        <div className="resolution-notes">
                                            <h4>📝 Faculty Response</h4>
                                            <p>{flag.resolutionNotes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyFlags;
