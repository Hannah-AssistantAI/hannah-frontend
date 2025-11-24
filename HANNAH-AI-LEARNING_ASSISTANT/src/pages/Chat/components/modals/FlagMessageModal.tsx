import { useState } from 'react'
import { X, Flag, AlertCircle } from 'lucide-react'
import './FlagMessageModal.css'

interface FlagMessageModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (reason: string) => void
    isSubmitting: boolean
}

const PREDEFINED_REASONS = [
    'Thông tin không chính xác',
    'Nội dung không phù hợp',
    'Câu trả lời không hữu ích',
    'Khác'
]

export function FlagMessageModal({ isOpen, onClose, onSubmit, isSubmitting }: FlagMessageModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>('')
    const [customReason, setCustomReason] = useState<string>('')
    const [error, setError] = useState<string>('')

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const finalReason = selectedReason === 'Khác' ? customReason : selectedReason

        if (!finalReason.trim()) {
            setError('Vui lòng chọn hoặc nhập lý do báo cáo')
            return
        }

        setError('')
        onSubmit(finalReason)
    }

    const handleClose = () => {
        if (!isSubmitting) {
            setSelectedReason('')
            setCustomReason('')
            setError('')
            onClose()
        }
    }

    return (
        <div className="flag-modal-overlay" onClick={handleClose}>
            <div className="flag-modal" onClick={(e) => e.stopPropagation()}>
                <div className="flag-modal-header">
                    <div className="flag-modal-title">
                        <Flag size={24} />
                        <h2>Báo cáo tin nhắn</h2>
                    </div>
                    <button
                        className="flag-modal-close"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        aria-label="Đóng"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flag-modal-content">
                    <p className="flag-modal-description">
                        Vui lòng cho chúng tôi biết lý do tại sao bạn muốn báo cáo tin nhắn này:
                    </p>

                    <div className="flag-reasons">
                        {PREDEFINED_REASONS.map((reason) => (
                            <label key={reason} className="flag-reason-option">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={(e) => {
                                        setSelectedReason(e.target.value)
                                        setError('')
                                    }}
                                    disabled={isSubmitting}
                                />
                                <span>{reason}</span>
                            </label>
                        ))}
                    </div>

                    {selectedReason === 'Khác' && (
                        <textarea
                            className="flag-custom-reason"
                            placeholder="Nhập lý do của bạn..."
                            value={customReason}
                            onChange={(e) => {
                                setCustomReason(e.target.value)
                                setError('')
                            }}
                            disabled={isSubmitting}
                            rows={4}
                            maxLength={500}
                        />
                    )}

                    {error && (
                        <div className="flag-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flag-modal-actions">
                        <button
                            type="button"
                            className="flag-btn flag-btn-secondary"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flag-btn flag-btn-primary"
                            disabled={isSubmitting || !selectedReason}
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
