import React from 'react';
import './QuizNavigation.css';

interface QuizNavigationProps {
    currentIndex: number;
    totalQuestions: number;
    onNext: () => void;
    onPrevious: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    canSubmit: boolean;
}

export function QuizNavigation({
    currentIndex,
    totalQuestions,
    onNext,
    onPrevious,
    onSubmit,
    isSubmitting,
    canSubmit
}: QuizNavigationProps) {
    const isFirstQuestion = currentIndex === 0;
    const isLastQuestion = currentIndex === totalQuestions - 1;

    return (
        <div className="quiz-navigation">
            <div className="quiz-progress">
                <span className="progress-text">
                    Câu {currentIndex + 1} / {totalQuestions}
                </span>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                    />
                </div>
            </div>

            <div className="nav-buttons">
                <button
                    className="nav-btn prev-btn"
                    onClick={onPrevious}
                    disabled={isFirstQuestion}
                >
                    ← Câu trước
                </button>

                {!isLastQuestion ? (
                    <button
                        className="nav-btn next-btn"
                        onClick={onNext}
                    >
                        Câu sau →
                    </button>
                ) : (
                    <button
                        className="nav-btn submit-btn"
                        onClick={onSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                    </button>
                )}
            </div>
        </div>
    );
}
