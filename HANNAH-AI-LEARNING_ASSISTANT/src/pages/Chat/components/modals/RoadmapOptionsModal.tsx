import React from 'react';
import { Map, Calendar, BookOpen, X } from 'lucide-react';
import '../../styles/modals/roadmap.css';

interface RoadmapOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectOption: (option: 'all' | 'current') => void;
    currentSemester?: string;
}

export const RoadmapOptionsModal: React.FC<RoadmapOptionsModalProps> = ({
    isOpen,
    onClose,
    onSelectOption,
    currentSemester
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="roadmap-options-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '480px',
                    width: '90%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Map size={24} color="white" />
                        </div>
                        <div>
                            <h3 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 600,
                                color: '#1f2937'
                            }}>
                                Lộ trình học tập
                            </h3>
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#6b7280'
                            }}>
                                Chọn chế độ xem
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            color: '#9ca3af'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Option 1: All Semesters */}
                    <button
                        onClick={() => onSelectOption('all')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            background: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.background = '#eff6ff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = 'white';
                        }}
                    >
                        <div style={{
                            width: '44px',
                            height: '44px',
                            background: '#dbeafe',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <BookOpen size={22} color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{
                                fontWeight: 600,
                                fontSize: '15px',
                                color: '#1f2937',
                                marginBottom: '4px'
                            }}>
                                Xem tổng quan tất cả kỳ học
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: '#6b7280'
                            }}>
                                Tài liệu định hướng toàn bộ chương trình học
                            </div>
                        </div>
                    </button>

                    {/* Option 2: Current Semester */}
                    <button
                        onClick={() => onSelectOption('current')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            background: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#10b981';
                            e.currentTarget.style.background = '#ecfdf5';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = 'white';
                        }}
                    >
                        <div style={{
                            width: '44px',
                            height: '44px',
                            background: '#d1fae5',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Calendar size={22} color="#10b981" />
                        </div>
                        <div>
                            <div style={{
                                fontWeight: 600,
                                fontSize: '15px',
                                color: '#1f2937',
                                marginBottom: '4px'
                            }}>
                                Xem kỳ hiện tại
                                {currentSemester && (
                                    <span style={{
                                        marginLeft: '8px',
                                        padding: '2px 8px',
                                        background: '#10b981',
                                        color: 'white',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 500
                                    }}>
                                        Kỳ {currentSemester}
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: '#6b7280'
                            }}>
                                Các môn học và lộ trình kỳ hiện tại của bạn
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoadmapOptionsModal;
