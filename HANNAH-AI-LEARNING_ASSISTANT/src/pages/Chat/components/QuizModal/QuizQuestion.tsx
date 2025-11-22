import React from 'react';
import './QuizQuestion.css';

interface Question {
    questionId: number;
    question: string;
    options: string[];
}

interface QuizQuestionProps {
    question: Question | null;
    selectedAnswer: string | undefined;
    onAnswerSelect: (answer: string) => void;
}

export function QuizQuestion({ question, selectedAnswer, onAnswerSelect }: QuizQuestionProps) {
    if (!question) {
        return <div className="quiz-loading">Đang tải câu hỏi...</div>;
    }

    return (
        <div className="quiz-question-container">
            <p className="question-text">{question.question}</p>
            <div className="quiz-options">
                {question.options?.map((option, idx) => {
                    const label = String.fromCharCode(65 + idx); // A, B, C, D
                    const isSelected = selectedAnswer === label;

                    return (
                        <button
                            key={`q${question.questionId}-opt${idx}`}
                            className={`option-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => onAnswerSelect(label)}
                        >
                            <span className="option-label">{label}.</span>
                            <span className="option-text">{option}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
