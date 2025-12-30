import React, { useState, useEffect, useCallback } from 'react';
import {
    learningDashboardService
} from '../../../service/learningDashboardService';
import type {
    LearningDashboard as LearningDashboardType,
    SubjectProgressSummary,
    SubjectSessions,
    WeakTopic
} from '../../../service/learningDashboardService';
import { useAuth } from '../../../contexts/AuthContext';
import CLOProgressSection from '../../../components/Learning/CLOProgressSection';
import RecommendationsSection from '../../../components/Learning/RecommendationsSection';
import './LearningDashboard.css';

// Simple toast replacement for EC2 compatibility
const toast = {
    error: (msg: string) => console.error('[LearningDashboard]', msg),
    success: (msg: string) => console.log('[LearningDashboard]', msg)
};

// ============ Helper Functions ============

const getProgressClass = (percentage: number): string => {
    if (percentage >= 70) return 'progress-bar__fill--high';
    if (percentage >= 40) return 'progress-bar__fill--medium';
    return 'progress-bar__fill--low';
};

const getSessionStatusClass = (status: string): string => {
    switch (status) {
        case 'completed': return 'session-item--completed';
        case 'in_progress': return 'session-item--in-progress';
        default: return '';
    }
};

// ============ Sub-Components ============

interface SubjectCardProps {
    subject: SubjectProgressSummary;
    onSelect: (subjectId: number) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onSelect }) => {
    const progressClass = getProgressClass(subject.completionPercentage);

    return (
        <div
            className="subject-card"
            onClick={() => onSelect(subject.subjectId)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onSelect(subject.subjectId)}
        >
            <div className="subject-card__header">
                <span className="subject-card__code">{subject.subjectCode}</span>
                <span className="subject-card__week">Tuần {subject.currentWeek}</span>
            </div>

            <h3 className="subject-card__name">{subject.subjectName}</h3>

            <div className="progress-bar">
                <div
                    className={`progress-bar__fill ${progressClass}`}
                    style={{ width: `${subject.completionPercentage}%` }}
                />
            </div>

            <div className="subject-card__progress-text">
                <span>{subject.completedSessions}/{subject.totalSessions} sessions</span>
                <span>{subject.completionPercentage.toFixed(0)}%</span>
            </div>

            <div className="subject-card__stats">
                <div className="subject-card__stat">
                    <span>📝</span>
                    <span>{subject.quizzesTaken} quizzes</span>
                </div>
                {subject.averageQuizScore !== null && (
                    <div className="subject-card__stat">
                        <span>📊</span>
                        <span>{subject.averageQuizScore.toFixed(0)}% avg</span>
                    </div>
                )}
            </div>
        </div>
    );
};

interface WeakTopicsSectionProps {
    topics: WeakTopic[];
}

const WeakTopicsSection: React.FC<WeakTopicsSectionProps> = ({ topics }) => {
    if (topics.length === 0) return null;

    return (
        <div className="weak-topics-section">
            <h2 className="section-title">
                <span className="section-title__icon">⚠️</span>
                Chủ đề cần cải thiện
            </h2>
            <div className="weak-topics-list">
                {topics.map((topic, index) => (
                    <div key={index} className="weak-topic-badge">
                        <span>{topic.topicName}</span>
                        <span className="weak-topic-badge__score">{topic.masteryLevel.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface SessionModalProps {
    sessionsData: SubjectSessions | null;
    onClose: () => void;
    onUpdateSession: (sessionNumber: number, field: string, value: boolean) => void;
}

const SessionModal: React.FC<SessionModalProps> = ({ sessionsData, onClose, onUpdateSession }) => {
    if (!sessionsData) return null;

    return (
        <div className="session-modal-overlay" onClick={onClose}>
            <div className="session-modal" onClick={(e) => e.stopPropagation()}>
                <div className="session-modal__header">
                    <div>
                        <h2 className="session-modal__title">{sessionsData.subjectCode}</h2>
                        <span style={{ color: 'var(--text-muted)' }}>{sessionsData.subjectName}</span>
                    </div>
                    <button className="session-modal__close" onClick={onClose}>×</button>
                </div>

                <div className="session-modal__content">
                    {/* 🆕 CLO Progress Section */}
                    <CLOProgressSection
                        subjectId={sessionsData.subjectId}
                        subjectCode={sessionsData.subjectCode}
                    />

                    <div className="sessions-list">
                        {sessionsData.sessions.map((session) => (
                            <div
                                key={session.sessionNumber}
                                className={`session-item ${getSessionStatusClass(session.status)}`}
                            >
                                <div className="session-item__number">
                                    {session.status === 'completed' ? '✓' : session.sessionNumber}
                                </div>

                                <div className="session-item__content">
                                    <div className="session-item__topic">
                                        {session.topic || `Session ${session.sessionNumber}`}
                                    </div>
                                    <div className="session-item__type">
                                        {session.type || 'Lecture'}
                                    </div>
                                </div>

                                {/* 🆕 Phase 2: Warning badge for sessions needing review */}
                                {session.needsReview && (
                                    <div className="session-item__warning" title="Điểm quiz dưới 50% - cần ôn lại">
                                        ⚠️ Cần ôn lại
                                    </div>
                                )}

                                <div className="session-item__actions">
                                    <button
                                        className={`session-checkbox ${session.materialsRead ? 'session-checkbox--checked' : ''}`}
                                        onClick={() => onUpdateSession(session.sessionNumber, 'materialsRead', !session.materialsRead)}
                                    >
                                        📖 Đã đọc
                                    </button>
                                    <button
                                        className={`session-checkbox ${session.tasksCompleted ? 'session-checkbox--checked' : ''}`}
                                        onClick={() => onUpdateSession(session.sessionNumber, 'tasksCompleted', !session.tasksCompleted)}
                                    >
                                        ✅ Hoàn thành
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============ Main Component ============

const LearningDashboard: React.FC = () => {
    const { user } = useAuth();

    // State
    const [dashboard, setDashboard] = useState<LearningDashboardType | null>(null);
    const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<SubjectSessions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    // Fetch dashboard data
    const fetchDashboard = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await learningDashboardService.getDashboard();
            setDashboard(data);

            // Fetch weak topics
            if (data.userId) {
                const weakData = await learningDashboardService.getWeakTopics(data.userId);
                setWeakTopics(weakData.weakTopics || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            toast.error('Không thể tải dashboard học tập');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // Handle subject selection
    const handleSubjectSelect = async (subjectId: number) => {
        try {
            setIsLoadingSessions(true);
            const sessionsData = await learningDashboardService.getSubjectSessions(subjectId);
            setSelectedSubject(sessionsData);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Không thể tải thông tin sessions');
        } finally {
            setIsLoadingSessions(false);
        }
    };

    // Handle session progress update
    const handleUpdateSession = async (sessionNumber: number, field: string, value: boolean) => {
        if (!selectedSubject) return;

        try {
            await learningDashboardService.updateSessionProgress(
                selectedSubject.subjectId,
                sessionNumber,
                { [field]: value }
            );

            // Update local state for immediate UI feedback
            setSelectedSubject(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    sessions: prev.sessions.map(s =>
                        s.sessionNumber === sessionNumber
                            ? { ...s, [field]: value }
                            : s
                    )
                };
            });

            // 🆕 Real-time refresh: Re-fetch dashboard to update completion %
            await fetchDashboard();

            toast.success('Đã cập nhật tiến độ');
        } catch (error) {
            console.error('Error updating session:', error);
            toast.error('Không thể cập nhật tiến độ');
        }
    };

    // Computed values
    const totalCompleted = dashboard?.subjects.reduce((acc, s) => acc + s.completedSessions, 0) || 0;
    const totalSessions = dashboard?.subjects.reduce((acc, s) => acc + s.totalSessions, 0) || 0;
    const overallProgress = totalSessions > 0 ? (totalCompleted / totalSessions * 100) : 0;

    // Render loading
    if (isLoading) {
        return (
            <div className="learning-dashboard">
                <div className="loading-spinner">
                    <div className="loading-spinner__icon" />
                    <p>Đang tải dashboard...</p>
                </div>
            </div>
        );
    }

    // Render empty state
    if (!dashboard || dashboard.subjects.length === 0) {
        return (
            <div className="learning-dashboard">
                <div className="learning-dashboard__container">
                    <div className="empty-state">
                        <div className="empty-state__icon">📚</div>
                        <h2 className="empty-state__title">Chưa có môn học nào</h2>
                        <p className="empty-state__text">
                            Upload bảng điểm để xem tiến độ học tập của bạn
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="learning-dashboard">
            <div className="learning-dashboard__container">
                {/* Header */}
                <header className="learning-dashboard__header">
                    <div>
                        <h1 className="learning-dashboard__title">📊 Learning Dashboard</h1>
                        <p className="learning-dashboard__subtitle">
                            Học kỳ {dashboard.currentSemester}
                            {dashboard.specializationName && ` • ${dashboard.specializationName}`}
                        </p>
                    </div>

                    <div className="learning-dashboard__stats">
                        <div className="stat-item">
                            <div className="stat-item__value">{dashboard.totalSubjects}</div>
                            <div className="stat-item__label">Môn học</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-item__value">{overallProgress.toFixed(0)}%</div>
                            <div className="stat-item__label">Hoàn thành</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-item__value">{weakTopics.length}</div>
                            <div className="stat-item__label">Cần cải thiện</div>
                        </div>
                    </div>
                </header>

                {/* 🆕 AI Recommendations - prominent for daily focus */}
                {dashboard.userId && (
                    <RecommendationsSection userId={dashboard.userId} />
                )}

                {/* Weak Topics */}
                <WeakTopicsSection topics={weakTopics} />

                {/* Subjects Grid */}
                <div className="subjects-grid">
                    {dashboard.subjects.map(subject => (
                        <SubjectCard
                            key={subject.subjectId}
                            subject={subject}
                            onSelect={handleSubjectSelect}
                        />
                    ))}
                </div>

                {/* Session Modal */}
                {selectedSubject && (
                    <SessionModal
                        sessionsData={selectedSubject}
                        onClose={() => setSelectedSubject(null)}
                        onUpdateSession={handleUpdateSession}
                    />
                )}
            </div>
        </div>
    );
};

export default LearningDashboard;
