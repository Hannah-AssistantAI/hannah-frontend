import React from 'react';
import { X } from 'lucide-react';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onItemClick: (topic: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, onItemClick }) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="history-sidebar-overlay" onClick={onClose} />
            <aside className="history-sidebar">
                <div className="history-sidebar-header">
                    <h2 className="history-sidebar-title">Lịch sử cuộc trò chuyện</h2>
                    <button
                        className="history-sidebar-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="history-sidebar-content">
                    {/* Today */}
                    <div className="history-section">
                        <h3 className="history-section-title">Hôm nay</h3>
                        <div className="history-items">
                            <button
                                className="history-item"
                                onClick={() => onItemClick("Lập trình Hướng đối tượng (OOP)")}
                            >
                                <span className="history-item-icon">💬</span>
                                <span className="history-item-text">
                                    Lập trình Hướng đối tượng (OOP)
                                </span>
                            </button>
                            <button
                                className="history-item"
                                onClick={() => onItemClick("Data Structures và Algorithms")}
                            >
                                <span className="history-item-icon">💬</span>
                                <span className="history-item-text">
                                    Data Structures và Algorithms
                                </span>
                            </button>
                            <button
                                className="history-item"
                                onClick={() => onItemClick("React Hooks và State Management")}
                            >
                                <span className="history-item-icon">💬</span>
                                <span className="history-item-text">
                                    React Hooks và State Management
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Yesterday */}
                    <div className="history-section">
                        <h3 className="history-section-title">Hôm qua</h3>
                        <div className="history-items">
                            <button
                                className="history-item"
                                onClick={() => onItemClick("Database Design và SQL")}
                            >
                                <span className="history-item-icon">💬</span>
                                <span className="history-item-text">
                                    Database Design và SQL
                                </span>
                            </button>
                            <button
                                className="history-item"
                                onClick={() => onItemClick("Machine Learning cơ bản")}
                            >
                                <span className="history-item-icon">💬</span>
                                <span className="history-item-text">
                                    Machine Learning cơ bản
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Last 7 days */}
                    <div className="history-section">
                        <h3 className="history-section-title">7 ngày trước</h3>
                        <div className="history-items">
                            <button
                                className="history-item"
                                onClick={() => onItemClick("RESTful API Design")}
                            >
                                <span className="history-item-icon">💬</span>
                                <span className="history-item-text">
                                    RESTful API Design
                                </span>
                            </button>
                            <button
                                className="history-item"
                                onClick={() => onItemClick("Git và Version Control")}
                            >
                                <span className="history-item-icon">💬</span>
                                <span className="history-item-text">
                                    Git và Version Control
                                </span>
                            </button>
                            <button
                                className="history-item"
                                onClick={() => onItemClick("Docker và Containerization")}
                            >
                                <span className="history-item-icon">💬</span>
                                <span className="history-item-text">
                                    Docker và Containerization
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
