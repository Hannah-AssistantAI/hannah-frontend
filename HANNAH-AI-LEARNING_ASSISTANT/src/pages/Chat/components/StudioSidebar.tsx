import React from 'react'
import { Wand2, PanelRight, PanelRightClose, Pencil, Loader2, MoreVertical, Trash2, GitBranch, FileText, StickyNote, ClipboardCheck, Flag, Map } from 'lucide-react'
import type { StudioItem, StudioFeature } from '../types'

interface StudioSidebarProps {
    isOpen: boolean
    onToggle: () => void
    items: StudioItem[]
    features: StudioFeature[]
    onFeatureClick: (type: 'mindmap' | 'report' | 'notecard' | 'quiz' | 'roadmap', title: string) => void
    onEditFeature: (type: 'mindmap' | 'notecard' | 'quiz' | 'roadmap') => void
    onItemClick: (item: StudioItem) => void
    onDeleteItem: (itemId: string) => void
    onFlagItem: (itemId: string) => void
    openMenuId: string | null
    onToggleMenu: (itemId: string) => void
}

export const StudioSidebar: React.FC<StudioSidebarProps> = ({
    isOpen,
    onToggle,
    items,
    features,
    onFeatureClick,
    onEditFeature,
    onItemClick,
    onDeleteItem,
    onFlagItem,
    openMenuId,
    onToggleMenu
}) => {
    const getIconForType = (type: string) => {
        switch (type) {
            case 'mindmap': return GitBranch
            case 'report': return FileText
            case 'notecard': return StickyNote
            case 'quiz': return ClipboardCheck
            case 'roadmap': return Map
            default: return FileText
        }
    }

    return (
        <aside className={`studio-sidebar ${isOpen ? 'open' : 'closed'}`} style={{ order: 1, width: isOpen ? '356px' : '64px', padding: '0 0 0 24px', flexShrink: 0 }}>
            <div className="studio-content">
                <div className="studio-header">
                    <Wand2 size={20} color="#5f6368" />
                    <h3 className="studio-title">Studio</h3>
                    {/* Studio Toggle Button */}
                    <button
                        className="studio-toggle-btn"
                        onClick={onToggle}
                        aria-label={isOpen ? 'Ẩn studio' : 'Hiện studio'}
                    >
                        {isOpen ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
                    </button>
                </div>

                <div className="studio-features">
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon
                        return (
                            <div key={index} className="studio-feature-card-wrapper">
                                <button
                                    className="studio-feature-card"
                                    onClick={() => onFeatureClick(feature.type, feature.title)}
                                    title={feature.note}
                                >
                                    {feature.type !== 'report' && feature.type !== 'roadmap' && (
                                        <div
                                            className="studio-feature-edit-btn"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onEditFeature(feature.type as 'mindmap' | 'notecard' | 'quiz')
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    onEditFeature(feature.type as 'mindmap' | 'notecard' | 'quiz' | 'roadmap')
                                                }
                                            }}
                                            aria-label="Edit feature"
                                        >
                                            <Pencil size={14} />
                                        </div>
                                    )}
                                    <IconComponent size={24} color="#5f6368" />
                                    <span className="feature-title">{feature.title}</span>
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Studio Items List or Empty State */}
                {items.length > 0 ? (
                    <div className="studio-items-list">
                        {items.map((item) => {
                            const IconComponent = getIconForType(item.type)
                            return (
                                <div key={item.id} className="studio-item">
                                    <div
                                        className="studio-item-clickable"
                                        onClick={() => onItemClick(item)}
                                        style={{ cursor: item.status === 'completed' && (item.type === 'mindmap' || item.type === 'notecard' || item.type === 'quiz' || item.type === 'report') ? 'pointer' : 'default' }}
                                    >
                                        <div className="studio-item-icon">
                                            {item.status === 'loading' ? (
                                                <Loader2 size={20} color="#5f6368" className="spinning" />
                                            ) : (
                                                <IconComponent size={20} color="#5f6368" />
                                            )}
                                        </div>
                                        <div className="studio-item-content">
                                            <h4 className="studio-item-title">{item.title}</h4>
                                            <p className="studio-item-subtitle">
                                                {item.subtitle} • {item.timestamp}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="studio-item-menu-container">
                                        <button
                                            className="studio-item-menu"
                                            aria-label="Thêm tùy chọn"
                                            onClick={() => onToggleMenu(item.id)}
                                        >
                                            <MoreVertical size={20} color="#5f6368" />
                                        </button>
                                        {openMenuId === item.id && (
                                            <div className="studio-item-dropdown">
                                                {item.type === 'quiz' && (
                                                    <button
                                                        className="dropdown-item flag-item"
                                                        onClick={() => onFlagItem(item.id)}
                                                    >
                                                        <Flag size={16} />
                                                        <span>Báo cáo</span>
                                                    </button>
                                                )}
                                                <button
                                                    className="dropdown-item delete-item"
                                                    onClick={() => onDeleteItem(item.id)}
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Xóa</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="studio-description">
                        <Wand2 size={40} color="#9aa0a6" className="studio-icon" />
                        <p className="studio-subtitle">Đầu ra của Studio sẽ được lưu ở đây.</p>
                        <p className="studio-text">
                            Sau khi thêm nguồn, hãy nhập để thêm Tổng quan bảng âm thanh, Hướng dẫn học tập, Bản đồ tư duy và nhiều thông tin khác!
                        </p>
                    </div>
                )}
            </div>
        </aside>
    )
}
