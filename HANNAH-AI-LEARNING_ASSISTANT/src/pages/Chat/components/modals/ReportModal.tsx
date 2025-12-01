import React, { useState } from 'react'
import { FileText, Download, Copy, Check } from 'lucide-react'

interface ReportModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, content }) => {
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
        element.download = `${content.title || 'report'}.md`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="report-modal-header">
                    <div className="report-modal-title-wrapper">
                        <FileText size={24} color="#5f6368" />
                        <h3 className="report-modal-title">{content?.title || 'Báo cáo'}</h3>
                    </div>
                    <div className="report-modal-actions">
                        <button
                            className="report-action-btn"
                            title={isCopied ? "Đã sao chép" : "Sao chép"}
                            onClick={handleCopy}
                        >
                            {isCopied ? <Check size={18} color="#1e8e3e" /> : <Copy size={18} />}
                        </button>
                        <button
                            className="report-action-btn"
                            title="Tải xuống"
                            onClick={handleDownload}
                        >
                            <Download size={18} />
                        </button>
                        <button
                            className="report-modal-close"
                            onClick={onClose}
                            aria-label="Đóng"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className="report-modal-body">
                    <div className="report-content-text">
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
                                        // Handle bold in list items
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
                            <p>Đang tải nội dung báo cáo...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
