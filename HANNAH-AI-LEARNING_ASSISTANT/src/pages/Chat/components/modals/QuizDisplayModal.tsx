import React from 'react'
import { Minimize2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { QuizResults } from '../QuizModal/QuizResults'

interface QuizDisplayModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
    currentQuestionIndex: number
    selectedAnswers: { [key: number]: string }
    onAnswerSelect: (index: number, answer: string) => void
    onNext: () => void
    onMinimize: () => void
    onSubmit: () => void
    showResults: boolean
    results: any
    isSubmitting: boolean
}

export const QuizDisplayModal: React.FC<QuizDisplayModalProps> = ({
    isOpen,
    onClose,
    content,
    currentQuestionIndex,
    selectedAnswers,
    onAnswerSelect,
    onNext,
    onMinimize,
    onSubmit,
    showResults,
    results,
    isSubmitting
}) => {
    if (!isOpen) return null

    const isLastQuestion = currentQuestionIndex === (content?.questions?.length || 0) - 1

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

                {!showResults && (
                    <div className="quiz-progress-bar">
                        <div className="quiz-progress-indicator">
                            {currentQuestionIndex + 1} / {content?.questions?.length || 0}
                        </div>
                    </div>
                )}

                <div className="quiz-container">
                    {showResults ? (
                        <QuizResults
                            results={results}
                            onRetry={onClose}
                        />
                    ) : (
                        <>
                            <div className="quiz-question">
                                <p className="quiz-question-text">
                                    {content?.questions?.[currentQuestionIndex]?.questionText ||
                                        content?.questions?.[currentQuestionIndex]?.question ||
                                        'Đang tải câu hỏi...'}
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
                        </>
                    )}
                </div>

                {!showResults && (
                    <div className="quiz-navigation">
                        <button className="quiz-nav-btn quiz-hint-btn">
                            Gợi ý
                        </button>
                        {isLastQuestion ? (
                            <button
                                className="quiz-nav-btn quiz-submit-btn"
                                onClick={onSubmit}
                                disabled={isSubmitting || !selectedAnswers[currentQuestionIndex]}
                            >
                                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                            </button>
                        ) : (
                            <button
                                className="quiz-nav-btn quiz-next-btn"
                                onClick={onNext}
                            >
                                Tiếp theo
                            </button>
                        )}
                    </div>
                )}

                {!showResults && (
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
                )}
            </div>
        </div>
    )
}
