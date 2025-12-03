import { X } from 'lucide-react';
import { QuizQuestion } from './QuizQuestion';
import { QuizNavigation } from './QuizNavigation';
import { QuizResults } from './QuizResults';
import './QuizModal.css';

interface QuizModalProps {
    show: boolean;
    quizId: string | null;
    quizContent: any;
    currentQuestionIndex: number;
    selectedAnswers: { [key: number]: string };
    showResults: boolean;
    results: any;
    isSubmitting: boolean;
    onClose: () => void;
    onAnswerSelect: (questionIndex: number, answer: string) => void;
    onNext: () => void;
    onPrevious: () => void;
    onSubmit: () => void;
    onRetry: () => void;
}

export function QuizModal({
    show,
    quizId,
    quizContent,
    currentQuestionIndex,
    selectedAnswers,
    showResults,
    results,
    isSubmitting,
    onClose,
    onAnswerSelect,
    onNext,
    onPrevious,
    onSubmit,
    onRetry
}: QuizModalProps) {
    if (!show) return null;

    return (
        <div className="quiz-modal-overlay" onClick={onClose}>
            <div className="quiz-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="quiz-modal-header">
                    <h2 className="quiz-modal-title">
                        {showResults ? 'Kết quả bài kiểm tra' : quizContent?.title || 'Bài kiểm tra'}
                    </h2>
                    <button className="quiz-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="quiz-modal-body">
                    {showResults ? (
                        <QuizResults
                            results={results}
                            onRetry={onRetry}
                        />
                    ) : (
                        <>
                            {quizContent?.questions && quizContent.questions.length > 0 ? (
                                <>
                                    <QuizQuestion
                                        question={quizContent.questions[currentQuestionIndex]}
                                        selectedAnswer={selectedAnswers[currentQuestionIndex]}
                                        onAnswerSelect={(answer) => onAnswerSelect(currentQuestionIndex, answer)}
                                    />
                                    <QuizNavigation
                                        currentIndex={currentQuestionIndex}
                                        totalQuestions={quizContent.questions.length}
                                        onNext={onNext}
                                        onPrevious={onPrevious}
                                        onSubmit={onSubmit}
                                        isSubmitting={isSubmitting}
                                        canSubmit={currentQuestionIndex === quizContent.questions.length - 1}
                                    />
                                </>
                            ) : (
                                <div className="quiz-loading">Đang tải...</div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
