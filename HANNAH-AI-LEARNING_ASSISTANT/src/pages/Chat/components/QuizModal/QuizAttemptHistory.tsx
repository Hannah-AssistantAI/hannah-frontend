import React from 'react';
import { Clock, Trophy, CheckCircle, XCircle, History, Eye } from 'lucide-react';
import { QuizAttemptSummary } from '../../../../service/studioService';
import './QuizAttemptHistory.css';

interface QuizAttemptHistoryProps {
    quizTitle: string;
    totalAttempts: number;
    bestScore: number;
    attempts: QuizAttemptSummary[];
    onViewAttempt: (attemptId: number) => void;
    onRetakeQuiz: () => void;
    onClose: () => void;
}

export function QuizAttemptHistory({
    quizTitle,
    totalAttempts,
    bestScore,
    attempts,
    onViewAttempt,
    onRetakeQuiz,
    onClose
}: QuizAttemptHistoryProps) {

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (seconds: number | null) => {
        if (!seconds) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="quiz-history-container">
            {/* Summary Header */}
            <div className="history-summary">
                <div className="summary-stat">
                    <History className="stat-icon" size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{totalAttempts}</span>
                        <span className="stat-label">Lần làm</span>
                    </div>
                </div>
                <div className="summary-stat best-score">
                    <Trophy className="stat-icon trophy" size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{bestScore}%</span>
                        <span className="stat-label">Điểm cao nhất</span>
                    </div>
                </div>
            </div>

            {/* Attempts List */}
            <div className="history-list">
                <h4 className="history-list-title">Lịch sử làm bài</h4>

                {attempts.length === 0 ? (
                    <div className="no-attempts">
                        <p>Bạn chưa làm bài quiz này.</p>
                        <button className="retake-btn primary" onClick={onRetakeQuiz}>
                            🎯 Bắt đầu làm
                        </button>
                    </div>
                ) : (
                    <div className="attempts-grid">
                        {attempts.map((attempt, index) => (
                            <div
                                key={attempt.attempt_id}
                                className={`attempt-card ${attempt.passed ? 'passed' : 'failed'}`}
                            >
                                <div className="attempt-header">
                                    <span className="attempt-number">
                                        Lần {attempt.attempt_number}
                                    </span>
                                    <span className={`attempt-status ${attempt.passed ? 'pass' : 'fail'}`}>
                                        {attempt.passed ? (
                                            <><CheckCircle size={14} /> Đạt</>
                                        ) : (
                                            <><XCircle size={14} /> Chưa đạt</>
                                        )}
                                    </span>
                                </div>

                                <div className="attempt-score">
                                    <span className="score-value">{attempt.percentage}%</span>
                                    <span className="score-detail">
                                        {attempt.correct_answers}/{attempt.total_questions} câu đúng
                                    </span>
                                </div>

                                <div className="attempt-meta">
                                    <div className="meta-item">
                                        <Clock size={14} />
                                        <span>{formatTime(attempt.time_taken_seconds)}</span>
                                    </div>
                                    <div className="meta-item date">
                                        <span>{formatDate(attempt.completed_at)}</span>
                                    </div>
                                </div>

                                <button
                                    className="view-attempt-btn"
                                    onClick={() => onViewAttempt(attempt.attempt_id)}
                                >
                                    <Eye size={14} /> Xem chi tiết
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="history-footer">
                <button className="retake-btn" onClick={onRetakeQuiz}>
                    🔄 Làm lại quiz
                </button>
                <button className="close-btn" onClick={onClose}>
                    Đóng
                </button>
            </div>
        </div>
    );
}
