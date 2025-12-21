import React from 'react'
import { Wand2, PanelRight, PanelRightClose, Pencil, Loader2, MoreVertical, Trash2, GitBranch, FileText, StickyNote, ClipboardCheck, Flag, Map, History } from 'lucide-react'
import type { StudioItem, StudioFeature } from '../types'
import { getLabels, type SupportedLanguage } from '../../../utils/translations'

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
    onViewHistory?: (itemId: string) => void  // 🆕 View quiz attempt history
    openMenuId: string | null
    onToggleMenu: (itemId: string) => void
    language?: SupportedLanguage | string | null
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
    onViewHistory,
    openMenuId,
    onToggleMenu,
    language = 'vi'
}) => {
    // Get labels based on detected language
    const t = getLabels(language)

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

    // Map feature type to translated title
    const getFeatureTitle = (type: string) => {
        switch (type) {
            case 'mindmap': return t.mindMap
            case 'report': return t.report
            case 'notecard': return t.noteCards
            case 'quiz': return t.test
            case 'roadmap': return t.roadmap
            default: return type
        }
    }

    return (
        <aside className={`studio-sidebar ${isOpen ? 'open' : 'closed'}`} style={{ order: 1, width: isOpen ? '356px' : '64px', padding: '0 0 0 24px', flexShrink: 0 }}>
            <div className="studio-content">
                <div className="studio-header">
                    <Wand2 size={20} color="#5f6368" />
                    <h3 className="studio-title">{t.studio}</h3>
                    {/* Studio Toggle Button */}
                    <button
                        className="studio-toggle-btn"
                        onClick={onToggle}
                        aria-label={t.studio}
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
                                    onClick={() => onFeatureClick(feature.type, getFeatureTitle(feature.type))}
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
                                    <span className="feature-title">{getFeatureTitle(feature.type)}</span>
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
                                            aria-label="More options"
                                            onClick={() => onToggleMenu(item.id)}
                                        >
                                            <MoreVertical size={20} color="#5f6368" />
                                        </button>
                                        {openMenuId === item.id && (
                                            <div className="studio-item-dropdown">
                                                {item.type === 'quiz' && (
                                                    <>
                                                        <button
                                                            className="dropdown-item flag-item"
                                                            onClick={() => onFlagItem(item.id)}
                                                        >
                                                            <Flag size={16} />
                                                            <span>{t.report}</span>
                                                        </button>
                                                        {onViewHistory && (
                                                            <button
                                                                className="dropdown-item history-item"
                                                                onClick={() => onViewHistory(item.id)}
                                                            >
                                                                <History size={16} />
                                                                <span>{language === 'en' ? 'History' : 'Lịch sử'}</span>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                <button
                                                    className="dropdown-item delete-item"
                                                    onClick={() => onDeleteItem(item.id)}
                                                >
                                                    <Trash2 size={16} />
                                                    <span>{language === 'en' ? 'Delete' : 'Xóa'}</span>
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
                        <p className="studio-subtitle">{t.studioEmpty}</p>
                        <p className="studio-text">
                            {t.studioEmptyHint}
                        </p>
                    </div>
                )}
            </div>
        </aside>
    )
}
