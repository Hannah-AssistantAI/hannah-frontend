import './QuizResults.css';

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
}

export function QuizResults({ results, onRetry }: QuizResultsProps) {
    if (!results) return null;

    const getOptionLabel = (index: number) => String.fromCharCode(65 + index); // A, B, C, D...

    console.log('QuizResults data:', results); // Debug log

    return (
        <div className="quiz-results-container">
            <div className="quiz-score-header">
                <div className="score-circle">
                    <span className="score-number">{results.score.toFixed(0)}%</span>
                </div>
                <h3 className="score-title">
                    {results.score >= 80 ? 'Xuất sắc! 🎉' :
                        results.score >= 60 ? 'Tốt! 👍' :
                            results.score >= 40 ? 'Khá! 📚' : 'Cần cố gắng thêm! 💪'}
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
                                                        📌 Bạn chọn
                                                    </span>
                                                )}
                                                {isCorrect && (
                                                    <span className="indicator indicator-correct">
                                                        ✓ Đáp án đúng
                                                    </span>
                                                )}
                                                {isSelected && !isCorrect && (
                                                    <span className="indicator indicator-wrong">
                                                        ✗ Sai
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
                                    <span className="explanation-icon">💡</span>
                                    <strong>Giải thích:</strong>
                                </div>
                                <p className="explanation-text">{answer.explanation}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="quiz-results-footer">
                <button className="quiz-retry-btn" onClick={onRetry}>
                    🔄 Làm lại
                </button>
            </div>
        </div>
    );
}
