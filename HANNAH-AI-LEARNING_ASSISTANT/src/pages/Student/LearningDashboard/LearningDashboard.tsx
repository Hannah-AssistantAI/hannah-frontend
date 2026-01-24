import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    Eye,
    Calendar,
    ClipboardList,
    Layers,
    Brain,
    ArrowLeft,
    BookOpen,
    Target,
    Save,
    Check
} from 'lucide-react';
import {
    learningDashboardService
} from '../../../service/learningDashboardService';
import type {
    LearningDashboard as LearningDashboardType,
    SubjectProgressSummary,
    SubjectSessions,
    WeakTopic,
    DocumentProgress,
    QuizAttempt
} from '../../../service/learningDashboardService';
import { useAuth } from '../../../contexts/AuthContext';
import CLOProgressSection from '../../../components/Learning/CLOProgressSection';
import CLORadarChart from '../../../components/Learning/CLORadarChart';
import QuizScoreTrend from '../../../components/Learning/QuizScoreTrend';
import SessionTimeline from '../../../components/Learning/SessionTimeline';
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
                    <ClipboardList size={14} />
                    <span>{subject.quizzesTaken} quizzes</span>
                </div>
                {/* 🆕 Document tracking display */}
                {(subject.totalDocuments ?? 0) > 0 && (
                    <div className="subject-card__stat">
                        <FileText size={14} />
                        <span>{subject.viewedDocuments ?? 0}/{subject.totalDocuments} tài liệu</span>
                    </div>
                )}
                {subject.averageQuizScore !== null && (
                    <div className="subject-card__stat">
                        <BarChart3 size={14} />
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
                <AlertTriangle size={18} className="section-title__icon" />
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

// 🆕 Documents Section for Subject Modal
interface DocumentsSectionProps {
    subjectId: number;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ subjectId }) => {
    const [documents, setDocuments] = useState<DocumentProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingDocId, setUpdatingDocId] = useState<number | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setIsLoading(true);
                const response = await learningDashboardService.getSubjectDocuments(subjectId);
                setDocuments(response.documents || []);
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocuments();
    }, [subjectId]);

    const handleMarkViewed = async (docId: number) => {
        setUpdatingDocId(docId);
        try {
            await learningDashboardService.markDocumentViewed(docId);
            setDocuments(prev => prev.map(d =>
                d.documentId === docId ? { ...d, isViewed: true, viewedAt: new Date().toISOString() } : d
            ));
        } catch (error) {
            console.error('Error marking document viewed:', error);
        } finally {
            setUpdatingDocId(null);
        }
    };

    const handleMarkCompleted = async (docId: number) => {
        setUpdatingDocId(docId);
        try {
            await learningDashboardService.markDocumentCompleted(docId);
            setDocuments(prev => prev.map(d =>
                d.documentId === docId
                    ? { ...d, isViewed: true, isCompleted: true, completedAt: new Date().toISOString() }
                    : d
            ));
        } catch (error) {
            console.error('Error marking document completed:', error);
        } finally {
            setUpdatingDocId(null);
        }
    };

    const handleMarkAllCompleted = async () => {
        const uncompletedDocs = documents.filter(d => !d.isCompleted);
        if (uncompletedDocs.length === 0) return;

        setUpdatingDocId(-1); // Indicate all are updating
        try {
            // Mark all uncompleted documents as completed
            await Promise.all(
                uncompletedDocs.map(doc =>
                    learningDashboardService.markDocumentCompleted(doc.documentId)
                )
            );
            setDocuments(prev => prev.map(d => ({
                ...d,
                isViewed: true,
                isCompleted: true,
                completedAt: new Date().toISOString()
            })));
        } catch (error) {
            console.error('Error marking all documents completed:', error);
        } finally {
            setUpdatingDocId(null);
        }
    };

    if (isLoading) {
        return <div className="documents-section"><p><Loader2 size={14} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} />Đang tải tài liệu...</p></div>;
    }

    if (documents.length === 0) {
        return <div className="documents-section"><p style={{ color: 'var(--text-muted)' }}><FileText size={14} style={{ display: 'inline', marginRight: 6 }} />Chưa có tài liệu nào</p></div>;
    }

    const viewedCount = documents.filter(d => d.isViewed).length;
    const completedCount = documents.filter(d => d.isCompleted).length;
    const allCompleted = completedCount === documents.length;

    return (
        <div className="documents-section">
            <div className="documents-section__header">
                <h3 className="documents-section__title">
                    <FileText size={16} style={{ display: 'inline', marginRight: 6 }} />
                    Tài liệu ({viewedCount}/{documents.length} đã xem, {completedCount} hoàn thành)
                </h3>
                {!allCompleted && (
                    <button
                        className="mark-all-btn"
                        onClick={handleMarkAllCompleted}
                        disabled={updatingDocId === -1}
                    >
                        {updatingDocId === -1 ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</> : <><CheckCircle2 size={14} /> Đánh dấu tất cả hoàn thành</>}
                    </button>
                )}
            </div>
            <div className="documents-list">
                {documents.map((doc) => (
                    <div key={doc.documentId} className={`document-item ${doc.isCompleted ? 'document-item--completed' : doc.isViewed ? 'document-item--viewed' : ''}`}>
                        <div className="document-item__info">
                            <span className="document-item__title">
                                {doc.title}
                                {doc.needsReview && (
                                    <span className="document-item__warning" title="Cần ôn lại - điểm quiz thấp"><AlertTriangle size={14} /></span>
                                )}
                            </span>
                            {doc.linkedSessions && (
                                <span className="document-item__sessions"><Calendar size={12} /> Sessions: {doc.linkedSessions}</span>
                            )}
                            {(doc.quizzesCreated > 0 || doc.flashcardsCreated > 0 || doc.mindmapsCreated > 0) && (
                                <span className="document-item__stats">
                                    {doc.quizzesCreated > 0 && <><ClipboardList size={12} />{doc.quizzesCreated}</>}
                                    {doc.flashcardsCreated > 0 && <> <Layers size={12} />{doc.flashcardsCreated}</>}
                                    {doc.mindmapsCreated > 0 && <> <Brain size={12} />{doc.mindmapsCreated}</>}
                                </span>
                            )}
                        </div>
                        <div className="document-item__actions">
                            <button
                                className={`document-checkbox ${doc.isViewed ? 'document-checkbox--checked' : ''}`}
                                onClick={() => !doc.isViewed && handleMarkViewed(doc.documentId)}
                                disabled={doc.isViewed || updatingDocId === doc.documentId}
                            >
                                <Eye size={14} /> Đã xem
                            </button>
                            <button
                                className={`document-checkbox ${doc.isCompleted ? 'document-checkbox--checked' : ''}`}
                                onClick={() => !doc.isCompleted && handleMarkCompleted(doc.documentId)}
                                disabled={doc.isCompleted || updatingDocId === doc.documentId}
                            >
                                <CheckCircle2 size={14} /> Hoàn thành
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 🆕 Analytics Section with Charts
interface AnalyticsSectionProps {
    subjectId: number;
    sessions: SubjectSessions['sessions'];
    totalSessions: number;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ subjectId, sessions, totalSessions }) => {
    const [cloData, setCloData] = useState<any>(null);
    const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setIsLoading(true);
                // Fetch CLO progress and Quiz history in parallel
                const [cloResponse, quizResponse] = await Promise.all([
                    learningDashboardService.getCLOProgress(subjectId),
                    learningDashboardService.getQuizHistory(subjectId).catch(() => ({ attempts: [] }))
                ]);
                setCloData(cloResponse);
                setQuizHistory(quizResponse.attempts || []);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalyticsData();
    }, [subjectId]);

    if (isLoading) {
        return (
            <div className="analytics-section ld-analytics-section--loading">
                <div className="ld-page-loader__spinner" />
                <span className="ld-page-loader__text">Đang tải phân tích...</span>
            </div>
        );
    }

    return (
        <div className="analytics-section">
            <h3 className="analytics-section__title"><BarChart3 size={18} /> Phân tích tiến độ</h3>

            {/* Session Timeline */}
            <SessionTimeline
                sessions={sessions}
                totalSessions={totalSessions}
            />

            {/* Charts Grid */}
            <div className="analytics-section__charts">
                {/* CLO Radar Chart */}
                {cloData && cloData.clos && cloData.clos.length > 0 && (
                    <CLORadarChart
                        clos={cloData.clos}
                        size={260}
                    />
                )}

                {/* Quiz Score Trend */}
                <QuizScoreTrend
                    attempts={quizHistory}
                    width={380}
                    height={200}
                />
            </div>
        </div>
    );
};

interface SessionModalProps {
    sessionsData: SubjectSessions | null;
    onClose: () => void;
    onUpdateSession: (sessionNumber: number, field: string, value: boolean) => void;
    // 🆕 Batch save props
    hasUnsavedChanges?: boolean;
    onSaveAll?: () => void;
    isSaving?: boolean;
    userId?: number;  // 🆕 For AI Recommendations
}

const SessionModal: React.FC<SessionModalProps> = ({
    sessionsData,
    onClose,
    onUpdateSession,
    hasUnsavedChanges = false,
    onSaveAll,
    isSaving = false,
    userId  // 🆕
}) => {
    // 🆕 Handler for generating flashcards from weak topic recommendations
    const handleGenerateFlashcard = async (topicName: string, subjectCode: string) => {
        // For now, show a success message - can be connected to actual flashcard API later
        toast.success(`Tạo flashcard cho: ${topicName}`);
        // TODO: Connect to actual flashcard generation API
        // await flashcardService.generateForTopic(topicName, subjectCode);
    };
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
                    {/* 🆕 AI Recommendations - Top of modal */}
                    {userId && (
                        <RecommendationsSection
                            userId={userId}
                            onGenerateFlashcard={handleGenerateFlashcard}
                        />
                    )}

                    {/* 🆕 CLO Progress Section */}
                    <CLOProgressSection
                        subjectId={sessionsData.subjectId}
                        subjectCode={sessionsData.subjectCode}
                    />

                    {/* 🆕 Analytics Section with Charts */}
                    <AnalyticsSection
                        subjectId={sessionsData.subjectId}
                        sessions={sessionsData.sessions}
                        totalSessions={sessionsData.totalSessions}
                    />

                    {/* 🆕 Documents Section with checkboxes */}
                    <DocumentsSection subjectId={sessionsData.subjectId} />

                    {/* Sessions Section with Mark All button */}
                    <div className="sessions-section">
                        <div className="sessions-section__header">
                            <h3 className="sessions-section__title">
                                <BookOpen size={18} /> Sessions ({sessionsData.completedCount}/{sessionsData.totalSessions} hoàn thành)
                            </h3>
                            {sessionsData.completedCount < sessionsData.totalSessions && (
                                <button
                                    className="mark-all-btn"
                                    onClick={() => {
                                        // Mark all sessions as read + completed
                                        sessionsData.sessions.forEach(s => {
                                            if (!s.materialsRead) onUpdateSession(s.sessionNumber, 'materialsRead', true);
                                            if (!s.tasksCompleted) onUpdateSession(s.sessionNumber, 'tasksCompleted', true);
                                        });
                                    }}
                                >
                                    <CheckCircle2 size={14} /> Đánh dấu tất cả hoàn thành
                                </button>
                            )}
                        </div>
                        {sessionsData.sessions.map((session) => (
                            <div
                                key={session.sessionNumber}
                                className={`session-item ${getSessionStatusClass(session.status)}`}
                            >
                                <div className="session-item__number">
                                    {session.status === 'completed' ? <Check size={14} strokeWidth={3} /> : session.sessionNumber}
                                </div>

                                <div className="session-item__content">
                                    <div className="session-item__topic">
                                        {session.topic || `Session ${session.sessionNumber}`}
                                    </div>
                                    <div className="session-item__type">
                                        {session.type || 'Lecture'}
                                    </div>
                                    {/* 🆕 Phase 3: Quiz metrics display */}
                                    {(session.quizCount > 0 || session.quizCompleted) && (
                                        <div className="session-item__quiz-metrics">
                                            {session.quizCount > 0 && (
                                                <span className="quiz-badge"><ClipboardList size={12} /> {session.quizCount} quiz</span>
                                            )}
                                            {session.quizCompleted && session.quizScore !== null && (
                                                <span className={`quiz-score ${session.quizScore >= 60 ? 'quiz-score--pass' : 'quiz-score--fail'}`}>
                                                    <Target size={12} /> {session.quizScore}%
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 🆕 Phase 2: Warning badge for sessions needing review */}
                                {session.needsReview && (
                                    <div className="session-item__warning" title="Điểm quiz dưới 50% - cần ôn lại">
                                        <AlertTriangle size={14} /> Cần ôn lại
                                    </div>
                                )}

                                <div className="session-item__actions">
                                    <button
                                        className={`session-checkbox ${session.materialsRead ? 'session-checkbox--checked' : ''}`}
                                        onClick={() => onUpdateSession(session.sessionNumber, 'materialsRead', !session.materialsRead)}
                                    >
                                        <BookOpen size={14} /> Đã đọc
                                    </button>
                                    <button
                                        className={`session-checkbox ${session.tasksCompleted ? 'session-checkbox--checked' : ''}`}
                                        onClick={() => onUpdateSession(session.sessionNumber, 'tasksCompleted', !session.tasksCompleted)}
                                    >
                                        <CheckCircle2 size={14} /> Hoàn thành
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🆕 Batch Save Footer */}
                {hasUnsavedChanges && onSaveAll && (
                    <div className="session-modal__footer">
                        <span className="session-modal__unsaved-indicator">
                            ● Có thay đổi chưa lưu
                        </span>
                        <button
                            className="session-modal__save-btn"
                            onClick={onSaveAll}
                            disabled={isSaving}
                        >
                            {isSaving ? <><Loader2 size={14} className="animate-spin" /> Đang lưu...</> : <><Save size={14} /> Lưu thay đổi</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============ Main Component ============

// 🔧 DEV MODE: Set to true to use mock data for testing UI locally
const DEV_USE_MOCK_DATA = false;

const MOCK_DASHBOARD: LearningDashboardType = {
    userId: 1,
    totalSubjects: 3,
    currentSemester: 4,
    specializationName: 'Backend .NET Developer',
    lastUpdated: new Date().toISOString(),
    subjects: [
        { subjectId: 1, subjectCode: 'SSG104', subjectName: 'Communication and In-Group Working Skills_Kỹ năng giao tiếp và cộng tác', totalSessions: 3, completedSessions: 0, inProgressSessions: 0, completionPercentage: 0, currentWeek: 1, quizzesTaken: 0, averageQuizScore: null },
        { subjectId: 2, subjectCode: 'JPD123', subjectName: 'Elementary Japanese 1-A1.2_Tiếng Nhật sơ cấp 1-A1.2', totalSessions: 4, completedSessions: 0, inProgressSessions: 0, completionPercentage: 0, currentWeek: 1, quizzesTaken: 8, averageQuizScore: null },
        { subjectId: 3, subjectCode: 'PRJ301', subjectName: 'Java Web Application Development_Phát triển ứng dụng Java web', totalSessions: 56, completedSessions: 5, inProgressSessions: 1, completionPercentage: 9, currentWeek: 5, quizzesTaken: 16, averageQuizScore: 33 },
    ]
};

const LearningDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [dashboard, setDashboard] = useState<LearningDashboardType | null>(null);
    const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<SubjectSessions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    // 🆕 Batch save state
    const [pendingChanges, setPendingChanges] = useState<Map<number, { materialsRead?: boolean, tasksCompleted?: boolean }>>(new Map());
    const [isSaving, setIsSaving] = useState(false);

    // Computed: has unsaved changes
    const hasUnsavedChanges = pendingChanges.size > 0;

    // Fetch dashboard data
    const fetchDashboard = useCallback(async () => {
        try {
            setIsLoading(true);

            // 🔧 DEV: Use mock data for testing
            if (DEV_USE_MOCK_DATA) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
                setDashboard(MOCK_DASHBOARD);
                setWeakTopics([]);
                return;
            }

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
            // Clear pending changes when switching subjects
            setPendingChanges(new Map());
            const sessionsData = await learningDashboardService.getSubjectSessions(subjectId);
            setSelectedSubject(sessionsData);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Không thể tải thông tin sessions');
        } finally {
            setIsLoadingSessions(false);
        }
    };

    // 🆕 Handle session update - LOCAL ONLY (no API call)
    const handleUpdateSession = (sessionNumber: number, field: string, value: boolean) => {
        if (!selectedSubject) return;

        // Update local UI immediately
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

        // Track pending change (no API call yet)
        setPendingChanges(prev => {
            const updated = new Map(prev);
            const existing = updated.get(sessionNumber) || {};
            updated.set(sessionNumber, { ...existing, [field]: value });
            return updated;
        });
    };

    // 🆕 Handle batch save - SINGLE API call for all changes
    const handleSaveAll = async () => {
        if (!selectedSubject || pendingChanges.size === 0) return;

        setIsSaving(true);
        try {
            // Convert Map to array of updates
            const updates = Array.from(pendingChanges.entries()).map(([sessionNumber, changes]) => ({
                sessionNumber,
                ...changes
            }));

            // Batch API call
            await learningDashboardService.batchUpdateSessionProgress(
                selectedSubject.subjectId,
                updates
            );

            // Clear pending changes
            setPendingChanges(new Map());

            // Only ONE dashboard refresh
            await fetchDashboard();

            toast.success('Đã lưu tất cả thay đổi');
        } catch (error) {
            console.error('Error saving sessions:', error);
            toast.error('Không thể lưu thay đổi');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle modal close - warn if unsaved changes
    const handleCloseModal = () => {
        if (hasUnsavedChanges) {
            if (!confirm('Bạn có thay đổi chưa lưu. Bạn có muốn đóng không?')) {
                return;
            }
        }
        setPendingChanges(new Map());
        setSelectedSubject(null);
    };

    // Computed values
    const totalCompleted = dashboard?.subjects.reduce((acc, s) => acc + s.completedSessions, 0) || 0;
    const totalSessions = dashboard?.subjects.reduce((acc, s) => acc + s.totalSessions, 0) || 0;
    const overallProgress = totalSessions > 0 ? (totalCompleted / totalSessions * 100) : 0;

    // Render loading
    if (isLoading) {
        return (
            <div className="learning-dashboard learning-dashboard--loading">
                <div className="ld-page-loader">
                    <div className="ld-page-loader__spinner" />
                    <span className="ld-page-loader__text">Đang tải dashboard...</span>
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
                        <div className="empty-state__icon"><BookOpen size={48} /></div>
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
                {/* Top Bar: Back button + Stats */}
                <div className="learning-dashboard__topbar">
                    <button
                        className="learning-dashboard__back-btn"
                        onClick={() => navigate(-1)}
                        title="Quay lại"
                    >
                        <ArrowLeft size={16} /> Quay lại
                    </button>

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
                </div>

                {/* Title Block - riêng biệt, nằm dưới topbar */}
                <div className="learning-dashboard__title-block">
                    <h1 className="learning-dashboard__title">Learning Dashboard</h1>
                    <p className="learning-dashboard__subtitle">
                        Học kỳ {dashboard.currentSemester}
                        {dashboard.specializationName && ` • ${dashboard.specializationName}`}
                    </p>
                </div>

                {/* 🆕 AI Recommendations */}
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
                        onClose={handleCloseModal}
                        onUpdateSession={handleUpdateSession}
                        hasUnsavedChanges={hasUnsavedChanges}
                        onSaveAll={handleSaveAll}
                        isSaving={isSaving}
                        userId={dashboard?.userId}
                    />
                )}
            </div>
        </div>
    );
};

export default LearningDashboard;
