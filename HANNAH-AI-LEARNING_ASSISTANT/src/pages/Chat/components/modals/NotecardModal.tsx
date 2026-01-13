import React, { useState } from 'react'
import { ThumbsUp, ThumbsDown, CheckCircle, Loader2 } from 'lucide-react'

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
    onMastered?: (flashcardSetId: string) => Promise<void>  // 🆕 Mark as mastered
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
    onShuffle,
    onMastered
}) => {
    // 🆕 State for mastered button
    const [isMastered, setIsMastered] = useState(false)
    const [isMarkingMastered, setIsMarkingMastered] = useState(false)

    if (!isOpen) return null

    // 🆕 Handle mark as mastered
    const handleMarkMastered = async () => {
        if (!content?.flashcardSetId || !onMastered) return

        setIsMarkingMastered(true)
        try {
            await onMastered(content.flashcardSetId)
            setIsMastered(true)
        } catch (error) {
            console.error('Failed to mark as mastered:', error)
        } finally {
            setIsMarkingMastered(false)
        }
    }

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

                    {/* 🆕 Mark as Mastered Button */}
                    {onMastered && (
                        <button
                            className={`notecard-mastered-btn ${isMastered ? 'mastered' : ''}`}
                            onClick={handleMarkMastered}
                            disabled={isMarkingMastered || isMastered}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: isMastered ? '#4caf50' : '#e3f2fd',
                                color: isMastered ? '#fff' : '#1976d2',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: isMastered ? 'default' : 'pointer',
                                fontWeight: 500,
                                transition: 'all 0.3s ease'
                            }}
                            title={isMastered ? 'Đã đánh dấu nắm vững!' : 'Đánh dấu đã nắm vững tất cả thẻ'}
                        >
                            {isMarkingMastered ? (
                                <Loader2 size={16} className="spinning" />
                            ) : (
                                <CheckCircle size={16} />
                            )}
                            {isMastered ? 'Đã nắm vững!' : 'Đã nắm vững'}
                        </button>
                    )}
                </div>

                <p className="notecard-modal-notice">
                    Hannah-AI có thể đưa ra thông tin không chính xác; hãy kiểm tra kỹ câu trả lời mà bạn nhận được
                </p>
            </div>
        </div>
    )
}
