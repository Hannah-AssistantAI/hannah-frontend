import React from 'react'
import { Maximize2, ThumbsUp, ThumbsDown } from 'lucide-react'

interface QuizSideModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
    currentQuestionIndex: number
    selectedAnswers: { [key: number]: string }
    onAnswerSelect: (index: number, answer: string) => void
    onNext: () => void
    onExpand: () => void
}

export const QuizSideModal: React.FC<QuizSideModalProps> = ({
    isOpen,
    onClose,
    content,
    currentQuestionIndex,
    selectedAnswers,
    onAnswerSelect,
    onNext,
    onExpand
}) => {
    if (!isOpen) return null

    return (
        <div className="quiz-side-modal-overlay">
            <div className="quiz-side-modal-content">
                <div className="quiz-side-modal-header">
                    <h2 className="quiz-side-modal-title">Bài kiểm tra</h2>
                    <div className="quiz-side-modal-actions">
                        <button
                            className="quiz-side-expand-btn"
                            onClick={onExpand}
                            aria-label="Mở rộng"
                        >
                            <Maximize2 size={18} />
                        </button>
                        <button
                            className="quiz-side-modal-close"
                            onClick={onClose}
                            aria-label="Đóng"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="quiz-side-progress-bar">
                    <div className="quiz-side-progress-text">
                        Câu {currentQuestionIndex + 1} / {content?.questions?.length || 0}
                    </div>
                </div>

                <div className="quiz-side-container">
                    <div className="quiz-side-question">
                        <p className="quiz-side-question-text">
                            {content?.questions?.[currentQuestionIndex]?.question || 'Đang tải câu hỏi...'}
                        </p>
                    </div>

                    <div className="quiz-side-answers">
                        {content?.questions?.[currentQuestionIndex]?.options?.map((option: string, idx: number) => {
                            const label = String.fromCharCode(65 + idx); // A, B, C, D...
                            return (
                                <button
                                    key={idx}
                                    className={`quiz-side-answer-option ${selectedAnswers[currentQuestionIndex] === label ? 'selected' : ''}`}
                                    onClick={() => onAnswerSelect(currentQuestionIndex, label)}
                                >
                                    <span className="quiz-side-answer-label">{label}.</span>
                                    <span className="quiz-side-answer-text">
                                        {option}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="quiz-side-navigation">
                    <button className="quiz-side-nav-btn quiz-side-hint-btn">
                        Gợi ý
                    </button>
                    <button
                        className="quiz-side-nav-btn quiz-side-next-btn"
                        onClick={onNext}
                    >
                        Tiếp theo
                    </button>
                </div>

                <div className="quiz-side-modal-footer">
                    <button className="quiz-side-feedback-btn">
                        <ThumbsUp size={18} />
                        Hữu ích
                    </button>
                    <button className="quiz-side-feedback-btn">
                        <ThumbsDown size={18} />
                        Không phù hợp
                    </button>
                </div>
            </div>
        </div>
    )
}
