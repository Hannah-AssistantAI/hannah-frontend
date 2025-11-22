import React from 'react';
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

    return (
        <div className="quiz-results-container">
            <div className="quiz-score-header">
                <h3>Kết quả: {results.score.toFixed(1)}%</h3>
                <p className="score-details">
                    {results.correctAnswers} / {results.totalQuestions} câu đúng
                </p>
            </div>

            <div className="quiz-results-list">
                {results.answers?.map((answer, idx) => (
                    <div key={`result-${idx}`} className="quiz-result-item">
                        <h4 className="result-question">{answer.questionText}</h4>

                        <div className="result-answer-section">
                            <p className={answer.isCorrect ? 'answer-correct' : 'answer-incorrect'}>
                                Bạn chọn: <strong>{answer.selectedAnswer}</strong>
                                {answer.isCorrect ? ' ✓' : ' ✗'}
                            </p>

                            {!answer.isCorrect && (
                                <p className="correct-answer-display">
                                    Đáp án đúng: <strong>{answer.correctAnswer}</strong>
                                </p>
                            )}
                        </div>

                        <div className="result-explanation">
                            <strong>Giải thích:</strong>
                            <p>{answer.explanation}</p>
                        </div>

                        {answer.topic && (
                            <span className="result-topic-tag">{answer.topic}</span>
                        )}
                    </div>
                ))}
            </div>

            <button className="quiz-retry-btn" onClick={onRetry}>
                Làm lại
            </button>
        </div>
    );
}
