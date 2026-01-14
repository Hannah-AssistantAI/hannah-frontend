import React from 'react';
import './QuizScoreTrend.css';

interface QuizAttempt {
    attemptId: number;
    quizTitle: string;
    score: number;
    completedAt: string;
    sessionNumbers?: number[];
}

interface QuizScoreTrendProps {
    attempts: QuizAttempt[];
    width?: number;
    height?: number;
}

/**
 * Pure SVG Line Chart for Quiz Score Trend visualization
 * Senior-level implementation with no external dependencies
 */
const QuizScoreTrend: React.FC<QuizScoreTrendProps> = ({
    attempts,
    width = 400,
    height = 200
}) => {
    if (!attempts || attempts.length === 0) {
        return (
            <div className="quiz-score-trend quiz-score-trend--empty">
                <div className="quiz-score-trend__empty-icon">📝</div>
                <p>Chưa có lịch sử quiz</p>
                <span>Làm quiz để xem tiến độ của bạn</span>
            </div>
        );
    }

    // Chart dimensions
    const padding = { top: 20, right: 30, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Sort by date and take last 10
    const sortedAttempts = [...attempts]
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
        .slice(-10);

    // Calculate positions
    const xStep = chartWidth / Math.max(sortedAttempts.length - 1, 1);
    const yScale = (score: number) => chartHeight - (score / 100) * chartHeight;

    // Create path
    const linePath = sortedAttempts.map((attempt, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + yScale(attempt.score);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Area path (for gradient fill)
    const areaPath = linePath +
        ` L ${padding.left + (sortedAttempts.length - 1) * xStep} ${padding.top + chartHeight}` +
        ` L ${padding.left} ${padding.top + chartHeight} Z`;

    // Calculate average
    const avgScore = sortedAttempts.reduce((acc, a) => acc + a.score, 0) / sortedAttempts.length;

    // Get color based on score
    const getScoreColor = (score: number): string => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#eab308';
        if (score >= 40) return '#f97316';
        return '#ef4444';
    };

    // Format date
    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    return (
        <div className="quiz-score-trend">
            <div className="quiz-score-trend__header">
                <h3 className="quiz-score-trend__title">📈 Xu hướng điểm Quiz</h3>
                <div className="quiz-score-trend__stats">
                    <span className="quiz-score-trend__stat">
                        🎯 TB: <strong style={{ color: getScoreColor(avgScore) }}>{avgScore.toFixed(0)}%</strong>
                    </span>
                    <span className="quiz-score-trend__stat">
                        📝 {sortedAttempts.length} quiz
                    </span>
                </div>
            </div>

            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="quiz-score-trend__svg"
                style={{ width: '100%', height: 'auto', maxHeight: height }}
            >
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
                    </linearGradient>
                </defs>

                {/* Y-axis grid lines and labels */}
                {[0, 25, 50, 75, 100].map(score => {
                    const y = padding.top + yScale(score);
                    return (
                        <g key={score}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                className="quiz-score-trend__grid-line"
                                strokeDasharray={score === 50 ? "none" : "4,4"}
                                stroke={score === 50 ? "rgba(234, 179, 8, 0.5)" : undefined}
                            />
                            <text
                                x={padding.left - 8}
                                y={y}
                                className="quiz-score-trend__axis-label"
                                textAnchor="end"
                                dominantBaseline="middle"
                            >
                                {score}%
                            </text>
                        </g>
                    );
                })}

                {/* Area fill */}
                <path
                    d={areaPath}
                    fill="url(#scoreGradient)"
                />

                {/* Line */}
                <path
                    d={linePath}
                    className="quiz-score-trend__line"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data points */}
                {sortedAttempts.map((attempt, i) => {
                    const x = padding.left + i * xStep;
                    const y = padding.top + yScale(attempt.score);
                    return (
                        <g key={attempt.attemptId} className="quiz-score-trend__point-group">
                            <circle
                                cx={x}
                                cy={y}
                                r="6"
                                fill={getScoreColor(attempt.score)}
                                stroke="#fff"
                                strokeWidth="2"
                                className="quiz-score-trend__point"
                            />
                            {/* X-axis label */}
                            <text
                                x={x}
                                y={height - 10}
                                className="quiz-score-trend__x-label"
                                textAnchor="middle"
                            >
                                {formatDate(attempt.completedAt)}
                            </text>
                            {/* Tooltip on hover */}
                            <title>{attempt.quizTitle}: {attempt.score}%</title>
                        </g>
                    );
                })}

                {/* Average line */}
                <line
                    x1={padding.left}
                    y1={padding.top + yScale(avgScore)}
                    x2={width - padding.right}
                    y2={padding.top + yScale(avgScore)}
                    stroke={getScoreColor(avgScore)}
                    strokeWidth="2"
                    strokeDasharray="8,4"
                    opacity="0.7"
                />
            </svg>

            {/* Legend */}
            <div className="quiz-score-trend__legend">
                <span className="quiz-score-trend__legend-item">
                    <span style={{ color: '#22c55e' }}>●</span> ≥80% Xuất sắc
                </span>
                <span className="quiz-score-trend__legend-item">
                    <span style={{ color: '#eab308' }}>●</span> ≥60% Đạt
                </span>
                <span className="quiz-score-trend__legend-item">
                    <span style={{ color: '#ef4444' }}>●</span> &lt;60% Cần cải thiện
                </span>
            </div>
        </div>
    );
};

export default QuizScoreTrend;
