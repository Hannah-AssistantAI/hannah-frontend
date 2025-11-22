import React from 'react'
import { FileText } from 'lucide-react'

interface ReportFormatModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectFormat: (format: string) => void
}

export const ReportFormatModal: React.FC<ReportFormatModalProps> = ({ isOpen, onClose, onSelectFormat }) => {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="report-format-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="report-format-modal-header">
                    <h3 className="report-format-modal-title">Chọn định dạng báo cáo</h3>
                    <button
                        className="report-format-modal-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>
                <div className="report-format-options">
                    <button className="report-format-option" onClick={() => onSelectFormat('Tóm tắt')}>
                        <FileText size={24} color="#5f6368" />
                        <span className="report-format-name">Tóm tắt</span>
                        <span className="report-format-desc">Tạo bản tóm tắt ngắn gọn về nội dung</span>
                    </button>
                    <button className="report-format-option" onClick={() => onSelectFormat('Chi tiết')}>
                        <FileText size={24} color="#5f6368" />
                        <span className="report-format-name">Chi tiết</span>
                        <span className="report-format-desc">Báo cáo đầy đủ với tất cả các chi tiết</span>
                    </button>
                    <button className="report-format-option" onClick={() => onSelectFormat('Phân tích')}>
                        <FileText size={24} color="#5f6368" />
                        <span className="report-format-name">Phân tích</span>
                        <span className="report-format-desc">Phân tích sâu về các chủ đề chính</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
