import React from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface NotecardModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
    currentCardIndex: number
    isCardFlipped: boolean
    onFlip: () => void
    onNext: () => void
    onPrev: () => void
    onShuffle: () => void
}

export const NotecardModal: React.FC<NotecardModalProps> = ({
    isOpen,
    onClose,
    content,
    currentCardIndex,
    isCardFlipped,
    onFlip,
    onNext,
    onPrev,
    onShuffle
}) => {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="notecard-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="notecard-modal-header">
                    <h2 className="notecard-modal-title">{content?.title || 'Thẻ ghi nhớ'}</h2>
                    <p className="notecard-modal-subtitle">Dựa trên {content?.cardCount || 0} thẻ</p>
                    <button
                        className="notecard-modal-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="notecard-instruction">
                    Nhấn phím cách để lật thẻ, nhấn phím mũi tên ←/→ để đi chuyển
                </div>

                <div className="notecard-container">
                    <button
                        className="notecard-nav-btn notecard-nav-prev"
                        onClick={onPrev}
                        disabled={currentCardIndex === 0}
                    >
                        ←
                    </button>

                    <div
                        className={`notecard ${isCardFlipped ? 'flipped' : ''}`}
                        onClick={onFlip}
                    >
                        <div className="notecard-inner">
                            <div className="notecard-front">
                                <p className="notecard-text">
                                    {content?.cards?.[currentCardIndex]?.front || 'Đang tải...'}
                                </p>
                                <button className="notecard-flip-hint">Xem câu trả lời</button>
                            </div>
                            <div className="notecard-back">
                                <p className="notecard-text">
                                    {content?.cards?.[currentCardIndex]?.back || ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        className="notecard-nav-btn notecard-nav-next"
                        onClick={onNext}
                        disabled={currentCardIndex === (content?.cards?.length || 1) - 1}
                    >
                        →
                    </button>
                </div>

                <div className="notecard-progress">
                    <button className="notecard-shuffle-btn" onClick={onShuffle}>
                        <span>🔄</span>
                        Bắt đầu lại
                    </button>
                    <span className="notecard-counter">{currentCardIndex + 1} / {content?.cards?.length || 0} thẻ</span>
                </div>

                <p className="notecard-modal-notice">
                    Hannah-AI có thể đưa ra thông tin không chính xác; hãy kiểm tra kỹ câu trả lời mà bạn nhận được
                </p>
            </div>
        </div>
    )
}
