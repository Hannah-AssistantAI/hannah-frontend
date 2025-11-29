import React, { useState, useEffect } from 'react';
import type { FlaggedItem } from '../../../service/flaggingService';
import flaggingService from '../../../service/flaggingService';
import './AssignedFlagsList.css';

const AssignedFlagsList: React.FC = () => {
    const [assignedFlags, setAssignedFlags] = useState<FlaggedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAssignedFlags();
    }, []);

    const loadAssignedFlags = async () => {
        try {
            const flags = await flaggingService.getAssignedFlags();
            setAssignedFlags(flags);
        } catch (error) {
            console.error('Error loading assigned flags:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Đang tải...</div>;
    }

    return (
        <div className="assigned-flags-container">
            <h1>Báo Cáo Được Giao Cho Tôi</h1>
            <p>Có {assignedFlags.length} báo cáo cần xử lý</p>

            {assignedFlags.length === 0 ? (
                <div className="empty-state">
                    <p>Không có báo cáo nào được giao cho bạn</p>
                </div>
            ) : (
                <div className="flags-list">
                    {assignedFlags.map((flag) => (
                        <div key={flag.id} className="flag-card">
                            <div className="flag-header">
                                <span className="flag-type">{flag.type}</span>
                                <span className="flag-status">{flag.status}</span>
                            </div>
                            <p className="flag-reason">{flag.reason}</p>
                            <div className="flag-footer">
                                <small>Báo cáo bởi: {flag.flaggedByName}</small>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssignedFlagsList;
