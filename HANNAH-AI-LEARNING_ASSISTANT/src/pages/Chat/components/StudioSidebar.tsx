import React, { useState, useEffect, useCallback } from 'react'
import { Wand2, PanelRight, PanelRightClose, Pencil, Loader2, MoreVertical, Trash2, GitBranch, FileText, StickyNote, ClipboardCheck, Flag, Map, RefreshCw, AlertTriangle, X, BookOpen } from 'lucide-react'
import type { StudioItem, StudioFeature } from '../types'
import { getLabels, type SupportedLanguage } from '../../../utils/translations'
import { API_BASE_URL } from '../../../config/apiConfig'
import { useQuizEvents } from '../../../hooks/useRealtime'

interface WeakDocument {
    documentId: number
    title: string
    linkedSessions: string | null
    subjectId: number
    subjectCode: string
}

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
    onRetryQuiz?: (itemId: string) => void  // Retry quiz with same questions
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
    onRetryQuiz,
    openMenuId,
    onToggleMenu,
    language = 'vi'
}) => {
    // Get labels based on detected language
    const t = getLabels(language)

    // 🆕 State for weak documents reminder
    const [weakDocuments, setWeakDocuments] = useState<WeakDocument[]>([])
    const [showReminder, setShowReminder] = useState(true)
    const [isLoadingWeak, setIsLoadingWeak] = useState(false)

    // 🆕 Fetch weak documents function
    const fetchWeakDocuments = useCallback(async () => {
        try {
            setIsLoadingWeak(true)
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API_BASE_URL}/api/v1/learning/documents/weak`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setWeakDocuments(data.documents || [])
                setShowReminder(data.documents?.length > 0)
            }
        } catch (error) {
            console.error('Failed to fetch weak documents:', error)
        } finally {
            setIsLoadingWeak(false)
        }
    }, [])

    // Fetch on mount
    useEffect(() => {
        fetchWeakDocuments()
    }, [fetchWeakDocuments])

    // 🆕 Listen for quiz completion to refetch weak documents (realtime update)
    useQuizEvents({
        onQuizCompleted: () => {
            console.log('📊 Quiz completed, refetching weak documents...')
            // Re-show reminder and fetch updated data
            setShowReminder(true)
            fetchWeakDocuments()
        }
    })

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

                {/* 🆕 Weak Documents Reminder Banner */}
                {showReminder && weakDocuments.length > 0 && isOpen && (
                    <div className="weak-documents-banner" style={{
                        background: 'linear-gradient(135deg, #fff3e0, #ffecb3)',
                        border: '1px solid #ffb74d',
                        borderRadius: '12px',
                        padding: '12px',
                        marginBottom: '16px',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowReminder(false)}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                            title={language === 'en' ? 'Skip' : 'Bỏ qua'}
                        >
                            <X size={16} color="#f57c00" />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <AlertTriangle size={20} color="#f57c00" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#e65100' }}>
                                    {language === 'en'
                                        ? `⚠️ ${weakDocuments.length} document(s) need review:`
                                        : `⚠️ ${weakDocuments.length} tài liệu cần ôn lại:`}
                                </p>
                                <ul style={{ margin: '0 0 8px 0', paddingLeft: '16px', fontSize: '12px', color: '#bf360c' }}>
                                    {weakDocuments.slice(0, 3).map(doc => (
                                        <li key={doc.documentId} style={{ marginBottom: '4px' }}>
                                            {doc.title} {doc.linkedSessions && `(${doc.linkedSessions})`}
                                        </li>
                                    ))}
                                    {weakDocuments.length > 3 && (
                                        <li>+{weakDocuments.length - 3} {language === 'en' ? 'more' : 'tài liệu khác'}...</li>
                                    )}
                                </ul>
                                <a
                                    href="/student/learning-dashboard"
                                    target="_blank"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '12px',
                                        color: '#f57c00',
                                        textDecoration: 'none',
                                        fontWeight: 500
                                    }}
                                >
                                    <BookOpen size={14} />
                                    {language === 'en' ? 'View documents' : 'Xem tài liệu'}
                                </a>
                            </div>
                        </div>
                    </div>
                )}

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
                                                        {onRetryQuiz && (
                                                            <button
                                                                className="dropdown-item retry-item"
                                                                onClick={() => onRetryQuiz(item.id)}
                                                            >
                                                                <RefreshCw size={16} />
                                                                <span>{language === 'en' ? 'Retry' : 'Làm lại'}</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            className="dropdown-item flag-item"
                                                            onClick={() => onFlagItem(item.id)}
                                                        >
                                                            <Flag size={16} />
                                                            <span>{t.report}</span>
                                                        </button>
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
