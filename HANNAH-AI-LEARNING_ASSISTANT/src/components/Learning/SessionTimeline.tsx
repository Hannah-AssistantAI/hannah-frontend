import React from 'react';
import { Calendar, Check, Circle, AlertTriangle, Target } from 'lucide-react';
import './SessionTimeline.css';

interface SessionProgress {
    sessionNumber: number;
    topic?: string | null;  // Changed to match service type
    status: string;  // 'completed' | 'in_progress' | 'not_started'
    materialsRead: boolean;
    tasksCompleted: boolean;
    quizCompleted?: boolean;
    quizScore?: number | null;
    needsReview?: boolean;
}

interface SessionTimelineProps {
    sessions: SessionProgress[];
    totalSessions: number;
    onSessionClick?: (sessionNumber: number) => void;
}

/**
 * Horizontal Session Timeline with progress indicators
 * Shows visual progress through course sessions
 */
const SessionTimeline: React.FC<SessionTimelineProps> = ({
    sessions,
    totalSessions,
    onSessionClick
}) => {
    if (!sessions || sessions.length === 0) {
        return (
            <div className="session-timeline session-timeline--empty">
                <p>Chưa có dữ liệu sessions</p>
            </div>
        );
    }

    // Get status info for a session
    const getSessionStatus = (session: SessionProgress) => {
        const isComplete = session.status === 'completed' ||
            (session.materialsRead && session.tasksCompleted);
        const isInProgress = session.status === 'in_progress' ||
            (session.materialsRead || session.tasksCompleted);

        if (isComplete) return 'completed';
        if (isInProgress) return 'in_progress';
        return 'not_started';
    };

    // Get icon for status
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <Check size={12} strokeWidth={3} />;
            case 'in_progress': return <Circle size={8} fill="currentColor" strokeWidth={0} />;
            default: return <Circle size={8} strokeWidth={2} />;
        }
    };

    // Calculate progress
    const completedCount = sessions.filter(s => getSessionStatus(s) === 'completed').length;
    const progressPercent = (completedCount / totalSessions) * 100;

    return (
        <div className="session-timeline">
            <div className="session-timeline__header">
                <h3 className="session-timeline__title">
                    <Calendar size={18} style={{ display: 'inline', marginRight: 8 }} />
                    Lộ trình học tập
                </h3>
                <div className="session-timeline__progress">
                    <span className="session-timeline__progress-text">
                        {completedCount}/{totalSessions} sessions
                    </span>
                    <div className="session-timeline__progress-bar">
                        <div
                            className="session-timeline__progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <span className="session-timeline__progress-percent">
                        {progressPercent.toFixed(0)}%
                    </span>
                </div>
            </div>

            <div className="session-timeline__scroll-container">
                <div className="session-timeline__track">
                    {/* Connection line */}
                    <div className="session-timeline__line">
                        <div
                            className="session-timeline__line-fill"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* Session nodes */}
                    {sessions.map((session, index) => {
                        const status = getSessionStatus(session);
                        const isLast = index === sessions.length - 1;

                        return (
                            <div
                                key={session.sessionNumber}
                                className={`session-timeline__node session-timeline__node--${status}`}
                                onClick={() => onSessionClick?.(session.sessionNumber)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="session-timeline__node-circle">
                                    {session.needsReview ? (
                                        <AlertTriangle size={12} />
                                    ) : (
                                        getStatusIcon(status)
                                    )}
                                </div>

                                <div className="session-timeline__node-info">
                                    <span className="session-timeline__node-number">
                                        S{session.sessionNumber}
                                    </span>
                                    {session.topic && (
                                        <span className="session-timeline__node-topic">
                                            {session.topic.length > 20
                                                ? session.topic.substring(0, 20) + '...'
                                                : session.topic}
                                        </span>
                                    )}
                                    {session.quizCompleted && session.quizScore != null && (
                                        <span className={`session-timeline__node-score ${session.quizScore >= 60 ? 'session-timeline__node-score--pass' : 'session-timeline__node-score--fail'
                                            }`}>
                                            <Target size={12} /> {session.quizScore}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="session-timeline__legend">
                <span className="session-timeline__legend-item">
                    <span className="session-timeline__legend-dot session-timeline__legend-dot--completed">
                        <Check size={10} strokeWidth={3} />
                    </span>
                    Hoàn thành
                </span>
                <span className="session-timeline__legend-item">
                    <span className="session-timeline__legend-dot session-timeline__legend-dot--in-progress">
                        <Circle size={6} fill="currentColor" strokeWidth={0} />
                    </span>
                    Đang học
                </span>
                <span className="session-timeline__legend-item">
                    <span className="session-timeline__legend-dot session-timeline__legend-dot--not-started">
                        <Circle size={6} strokeWidth={2} />
                    </span>
                    Chưa học
                </span>
                <span className="session-timeline__legend-item">
                    <span className="session-timeline__legend-dot session-timeline__legend-dot--warning">
                        <AlertTriangle size={10} />
                    </span>
                    Cần ôn lại
                </span>
            </div>
        </div>
    );
};

export default SessionTimeline;
