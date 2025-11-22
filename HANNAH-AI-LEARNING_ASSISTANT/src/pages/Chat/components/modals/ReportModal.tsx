import React from 'react'
import { FileText, Download, Copy } from 'lucide-react'

interface ReportModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, content }) => {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="report-modal-header">
                    <div className="report-modal-title-wrapper">
                        <FileText size={24} color="#5f6368" />
                        <h3 className="report-modal-title">{content?.title || 'Báo cáo'}</h3>
                    </div>
                    <div className="report-modal-actions">
                        <button className="report-action-btn" title="Sao chép">
                            <Copy size={18} />
                        </button>
                        <button className="report-action-btn" title="Tải xuống">
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
                            <div dangerouslySetInnerHTML={{ __html: content.content }} />
                        ) : (
                            <p>Đang tải nội dung báo cáo...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
