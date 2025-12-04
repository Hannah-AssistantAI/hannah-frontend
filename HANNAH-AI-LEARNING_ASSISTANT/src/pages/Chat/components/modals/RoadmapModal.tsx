import React, { useState } from 'react'
import { Map, Download, Copy, Check } from 'lucide-react'

interface RoadmapModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose, content }) => {
    const [isCopied, setIsCopied] = useState(false)

    if (!isOpen) return null

    const handleCopy = async () => {
        if (!content?.content) return
        try {
            await navigator.clipboard.writeText(content.content)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const handleDownload = () => {
        if (!content?.content) return

        const element = document.createElement("a");
        const file = new Blob([content.content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${content.title || 'roadmap'}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="roadmap-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="roadmap-modal-header">
                    <div className="roadmap-modal-title-wrapper">
                        <Map size={24} color="#5f6368" />
                        <h3 className="roadmap-modal-title">{content?.title || 'Lộ trình học tập'}</h3>
                    </div>
                    <div className="roadmap-modal-actions">
                        <button
                            className="roadmap-action-btn"
                            title={isCopied ? "Đã sao chép" : "Sao chép"}
                            onClick={handleCopy}
                        >
                            {isCopied ? <Check size={18} color="#1e8e3e" /> : <Copy size={18} />}
                        </button>
                        <button
                            className="roadmap-action-btn"
                            title="Tải xuống"
                            onClick={handleDownload}
                        >
                            <Download size={18} />
                        </button>
                        <button
                            className="roadmap-modal-close"
                            onClick={onClose}
                            aria-label="Đóng"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className="roadmap-modal-body">
                    <div className="roadmap-content-text">
                        {content?.content ? (
                            <div className="markdown-content">
                                {content.content.split('\n').map((line: string, i: number) => {
                                    // Handle headings
                                    if (line.startsWith('## ')) {
                                        return <h2 key={i} style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '1rem', color: '#202124' }}>{line.replace('## ', '')}</h2>;
                                    }
                                    if (line.startsWith('### ')) {
                                        return <h3 key={i} style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1.25rem', marginBottom: '0.75rem', color: '#202124' }}>{line.replace('### ', '')}</h3>;
                                    }
                                    if (line.startsWith('#### ')) {
                                        return <h4 key={i} style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem', color: '#202124' }}>{line.replace('#### ', '')}</h4>;
                                    }

                                    // Handle list items
                                    if (line.trim().startsWith('- ')) {
                                        const content = line.trim().replace('- ', '');
                                        const parts = content.split('**');
                                        return (
                                            <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', listStyleType: 'disc' }}>
                                                {parts.map((part, j) =>
                                                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                                )}
                                            </li>
                                        );
                                    }

                                    // Handle numeric list items
                                    if (/^\d+\.\s/.test(line.trim())) {
                                        const content = line.trim().replace(/^\d+\.\s/, '');
                                        const parts = content.split('**');
                                        return (
                                            <div key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', display: 'flex' }}>
                                                <span style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>{line.match(/^\d+\./)?.[0]}</span>
                                                <span>
                                                    {parts.map((part, j) =>
                                                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    }

                                    // Handle regular paragraphs with bold support
                                    if (line.trim()) {
                                        const parts = line.split('**');
                                        return (
                                            <p key={i} style={{ marginBottom: '0.75rem', lineHeight: '1.6', color: '#3c4043' }}>
                                                {parts.map((part, j) =>
                                                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                                )}
                                            </p>
                                        );
                                    }

                                    // Preserve empty lines for spacing
                                    return <div key={i} style={{ height: '0.5rem' }} />;
                                })}
                            </div>
                        ) : (
                            <p>Đang tải lộ trình học tập...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
