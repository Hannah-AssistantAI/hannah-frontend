import './QuizResults.css';
import { RefreshCw, Trophy, ThumbsUp, BookOpen, TrendingUp, Pin, CheckCircle, XCircle, Lightbulb, X } from 'lucide-react';

interface QuizAnswer {
    questionId: number;
    questionText: string;
    options: string[];
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
    topic?: string;
}

interface QuizResultsProps {
    results: {
        score: number;
        correctAnswers: number;
        totalQuestions: number;
        answers: QuizAnswer[];
    };
    onRetry: () => void;
    onFlag?: () => void;
    onClose?: () => void;  // 🆕 Close button handler
}

export function QuizResults({ results, onRetry, onFlag, onClose }: QuizResultsProps) {
    if (!results) return null;

    const getOptionLabel = (index: number) => String.fromCharCode(65 + index); // A, B, C, D...

    console.log('QuizResults data:', results); // Debug log

    // Get score icon and message based on score
    const getScoreInfo = () => {
        if (results.score >= 80) {
            return { icon: <Trophy size={20} className="score-icon" />, text: 'Xuất sắc!' };
        } else if (results.score >= 60) {
            return { icon: <ThumbsUp size={20} className="score-icon" />, text: 'Tốt!' };
        } else if (results.score >= 40) {
            return { icon: <BookOpen size={20} className="score-icon" />, text: 'Khá!' };
        } else {
            return { icon: <TrendingUp size={20} className="score-icon" />, text: 'Cần cố gắng thêm!' };
        }
    };

    const scoreInfo = getScoreInfo();

    return (
        <div className="quiz-results-container">
            <div className="quiz-score-header">
                <div className="score-circle">
                    <span className="score-number">{results.score.toFixed(0)}%</span>
                </div>
                <h3 className="score-title">
                    {scoreInfo.icon}
                    <span>{scoreInfo.text}</span>
                </h3>
                <p className="score-details">
                    {results.correctAnswers} / {results.totalQuestions} câu đúng
                </p>
            </div>

            <div className="quiz-results-list">
                {results.answers?.map((answer, idx) => {
                    console.log(`Question ${idx + 1}:`, {
                        selectedAnswer: answer.selectedAnswer,
                        correctAnswer: answer.correctAnswer,
                        isCorrect: answer.isCorrect
                    });

                    // Helper function to determine if an option is correct
                    // Handles both letter format (A, B, C, D) and full-text format
                    const getCorrectOptionLetter = (): string => {
                        const correctAns = answer.correctAnswer?.trim().toUpperCase();

                        // Case 1: correctAnswer is already a letter
                        if (correctAns && ['A', 'B', 'C', 'D'].includes(correctAns)) {
                            return correctAns;
                        }

                        // Case 2: correctAnswer is full text - find matching option
                        if (correctAns && answer.options) {
                            for (let i = 0; i < answer.options.length; i++) {
                                if (answer.options[i].trim().toUpperCase() === correctAns) {
                                    return getOptionLabel(i);
                                }
                            }
                        }

                        // Fallback
                        console.warn(`Could not determine correct option for question ${idx + 1}`);
                        return 'A';
                    };

                    const correctOptionLetter = getCorrectOptionLetter();

                    return (
                        <div key={`result-${idx}`} className="quiz-result-item">
                            <div className="result-question-header">
                                <span className="question-number">Câu {idx + 1}</span>
                                {answer.topic && (
                                    <span className="result-topic-tag">{answer.topic}</span>
                                )}
                            </div>

                            <h4 className="result-question">{answer.questionText}</h4>

                            {/* Display all options */}
                            <div className="result-options-list">
                                {answer.options?.map((option, optIdx) => {
                                    const optionLabel = getOptionLabel(optIdx);
                                    const isSelected = optionLabel.toUpperCase() === answer.selectedAnswer?.toUpperCase();
                                    const isCorrect = optionLabel.toUpperCase() === correctOptionLetter.toUpperCase();

                                    let optionClass = 'result-option';
                                    if (isCorrect) {
                                        optionClass += ' option-correct';
                                    }
                                    if (isSelected && !isCorrect) {
                                        optionClass += ' option-incorrect';
                                    }
                                    if (isSelected) {
                                        optionClass += ' option-selected';
                                    }

                                    return (
                                        <div key={`option-${optIdx}`} className={optionClass}>
                                            <div className="option-label-wrapper">
                                                <span className="option-label">{optionLabel}.</span>
                                                <span className="option-text">{option}</span>
                                            </div>
                                            <div className="option-indicators">
                                                {isSelected && (
                                                    <span className="indicator indicator-selected">
                                                        <Pin size={12} /> Bạn chọn
                                                    </span>
                                                )}
                                                {isCorrect && (
                                                    <span className="indicator indicator-correct">
                                                        <CheckCircle size={12} /> Đáp án đúng
                                                    </span>
                                                )}
                                                {isSelected && !isCorrect && (
                                                    <span className="indicator indicator-wrong">
                                                        <XCircle size={12} /> Sai
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Removed duplicate correct answer box - now only highlighted in options above */}

                            {/* Explanation */}
                            <div className="result-explanation">
                                <div className="explanation-header">
                                    <Lightbulb size={16} className="explanation-icon" />
                                    <strong>Giải thích:</strong>
                                </div>
                                <p className="explanation-text">{answer.explanation}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="quiz-results-footer">
                <button
                    className="quiz-retry-btn"
                    onClick={onRetry}
                >
                    <RefreshCw size={14} />
                    Làm lại
                </button>
                {onClose && (
                    <button
                        className="quiz-close-btn"
                        onClick={onClose}
                    >
                        <X size={14} />
                        Đóng
                    </button>
                )}
            </div>
        </div>
    );
}

