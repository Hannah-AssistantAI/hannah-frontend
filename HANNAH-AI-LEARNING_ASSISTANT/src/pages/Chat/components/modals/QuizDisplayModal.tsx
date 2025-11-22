import React from 'react'
import { Minimize2, ThumbsUp, ThumbsDown } from 'lucide-react'

interface QuizDisplayModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
    currentQuestionIndex: number
    selectedAnswers: { [key: number]: string }
    onAnswerSelect: (index: number, answer: string) => void
    onNext: () => void
    onMinimize: () => void
}

export const QuizDisplayModal: React.FC<QuizDisplayModalProps> = ({
    isOpen,
    onClose,
    content,
    currentQuestionIndex,
    selectedAnswers,
    onAnswerSelect,
    onNext,
    onMinimize
}) => {
    if (!isOpen) return null

    return (
        <div className="quiz-modal-overlay" onClick={onClose}>
            <div className="quiz-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="quiz-modal-header">
                    <h2 className="quiz-modal-title">{content?.title || 'Bài kiểm tra'}</h2>
                    <p className="quiz-modal-subtitle">Dựa trên 1 nguồn</p>
                    <div className="quiz-modal-header-actions">
                        <button
                            className="quiz-modal-minimize"
                            onClick={onMinimize}
                            aria-label="Thu nhỏ"
                            title="Thu nhỏ"
                        >
                            <Minimize2 size={20} />
                        </button>
                    </div>
                </div>

                <div className="quiz-progress-bar">
                    <div className="quiz-progress-indicator">
                        {currentQuestionIndex + 1} / {content?.questions?.length || 0}
                    </div>
                </div>

                <div className="quiz-container">
                    <div className="quiz-question">
                        <p className="quiz-question-text">
                            {content?.questions?.[currentQuestionIndex]?.question || 'Đang tải câu hỏi...'}
                        </p>
                    </div>

                    <div className="quiz-answers">
                        {content?.questions?.[currentQuestionIndex]?.options?.map((option: string, idx: number) => {
                            const label = String.fromCharCode(65 + idx); // A, B, C, D...
                            return (
                                <button
                                    key={idx}
                                    className={`quiz-answer-option ${selectedAnswers[currentQuestionIndex] === label ? 'selected' : ''}`}
                                    onClick={() => onAnswerSelect(currentQuestionIndex, label)}
                                >
                                    <span className="quiz-answer-label">{label}.</span>
                                    <span className="quiz-answer-text">
                                        {option}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="quiz-navigation">
                    <button className="quiz-nav-btn quiz-hint-btn">
                        Gợi ý
                    </button>
                    <button
                        className="quiz-nav-btn quiz-next-btn"
                        onClick={onNext}
                    >
                        Tiếp theo
                    </button>
                </div>

                <div className="quiz-modal-footer">
                    <button className="quiz-feedback-btn">
                        <ThumbsUp size={18} />
                        Nội dung hữu ích
                    </button>
                    <button className="quiz-feedback-btn">
                        <ThumbsDown size={18} />
                        Nội dung không phù hợp
                    </button>
                </div>
            </div>
        </div>
    )
}
