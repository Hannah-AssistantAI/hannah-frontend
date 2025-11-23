import React from 'react'
import { Book, PanelLeft, PanelLeftClose } from 'lucide-react'
import type { BigPictureTopic } from '../types'

interface BigPictureSidebarProps {
    isOpen: boolean
    onToggle: () => void
    topics: BigPictureTopic[]
}

export const BigPictureSidebar: React.FC<BigPictureSidebarProps> = ({
    isOpen,
    onToggle,
    topics
}) => {
    return (
        <aside className={`big-picture-sidebar ${isOpen ? 'open' : 'closed'}`} style={{ order: 1, width: isOpen ? '356px' : '56px', padding: '0 24px 0 0', flexShrink: 0 }}>
            {/* Floating Toggle Button - Only show when sidebar is closed */}
            {!isOpen && (
                <button
                    className="big-picture-toggle-floating"
                    onClick={onToggle}
                    aria-label="Hiện bức tranh toàn cảnh"
                    style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        zIndex: 1000,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid #dadce0',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        const target = e.target as HTMLButtonElement
                        target.style.backgroundColor = '#f8f9fa'
                        target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                        const target = e.target as HTMLButtonElement
                        target.style.backgroundColor = 'white'
                        target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12)'
                    }}
                >
                    <PanelLeft size={16} color="#5f6368" />
                </button>
            )}

            <div className="big-picture-content">
                <div className="big-picture-header">
                    <Book size={20} color="#5f6368" />
                    <h3 className="big-picture-title">Bức tranh toàn cảnh</h3>
                    {/* Big Picture Toggle Button */}
                    <button
                        className="big-picture-toggle-btn"
                        onClick={onToggle}
                        aria-label={isOpen ? 'Ẩn bức tranh toàn cảnh' : 'Hiện bức tranh toàn cảnh'}
                    >
                        {isOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                    </button>
                </div>



                <div className="big-picture-topics">
                    {topics.map((topic, index) => (
                        <div key={index} className="big-picture-topic-item">
                            <button className="big-picture-topic-button">
                                <span className="big-picture-topic-title">{topic.title}</span>
                            </button>
                            <div className="big-picture-subtopics-list">
                                {topic.subtopics.map((subtopic, subIndex) => (
                                    <button key={subIndex} className="big-picture-subtopic-button">
                                        {subtopic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    )
}
