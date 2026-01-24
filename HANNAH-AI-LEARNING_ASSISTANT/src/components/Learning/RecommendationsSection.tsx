import { useState, useEffect } from 'react';
import {
    AlertTriangle,
    BookOpen,
    Flame,
    ClipboardCheck,
    Target,
    ChevronRight,
    Loader2,
    RefreshCw,
    Play,
    Zap,
    Brain,
    Sparkles
} from 'lucide-react';
import './RecommendationsSection.css';

interface Recommendation {
    type: string;
    priority: number;
    title: string;
    message: string;
    icon: string;
    action_type: string;
    action_data: Record<string, unknown>;
}

interface RecommendationsSectionProps {
    userId: number;
    onActionClick?: (recommendation: Recommendation) => void;
    onGenerateFlashcard?: (topicName: string, subjectCode: string) => Promise<void>;  // 🆕
}

const API_BASE = import.meta.env.VITE_PYTHON_API_URL || 'https://hannahai.online/py-api';

/**
 * 🆕 Phase 3: AI-Powered Recommendations Section
 * 
 * Displays personalized learning recommendations:
 * - Behind on sessions
 * - Weak topics to practice
 * - Learning streaks
 * - Upcoming exams
 * - Knowledge gaps with remedial actions
 */
const RecommendationsSection = ({ userId, onActionClick, onGenerateFlashcard }: RecommendationsSectionProps) => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generatingFor, setGeneratingFor] = useState<string | null>(null);

    const loadRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get token from localStorage - use correct key 'access_token'
            const token = localStorage.getItem('access_token');

            const response = await fetch(
                `${API_BASE}/api/v1/personalization/recommendations?user_id=${userId}&limit=5`,
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch recommendations');
            }

            const data = await response.json();
            setRecommendations(data.recommendations || []);
        } catch (err) {
            console.error('Failed to load recommendations:', err);
            setError('Không thể tải gợi ý');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            loadRecommendations();
        }
    }, [userId]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SESSION_BEHIND':
            case 'WEAK_SESSION':
                return <AlertTriangle className="rec-icon rec-icon--warning" size={18} />;
            case 'WEAK_TOPIC':
                return <BookOpen className="rec-icon rec-icon--info" size={18} />;
            case 'KNOWLEDGE_GAP':  // 🆕
                return <Brain className="rec-icon rec-icon--danger" size={18} />;
            case 'STREAK_BOOST':
                return <Flame className="rec-icon rec-icon--success" size={18} />;
            case 'QUIZ_PRACTICE':
                return <ClipboardCheck className="rec-icon rec-icon--primary" size={18} />;
            case 'NEXT_SESSION':
                return <Play className="rec-icon rec-icon--next" size={18} />;
            case 'CLO_FOCUS':
            case 'DOCUMENT_REVIEW':
                return <Target className="rec-icon rec-icon--secondary" size={18} />;
            default:
                return <Target className="rec-icon" size={18} />;
        }
    };

    const getTypeClass = (type: string): string => {
        switch (type) {
            case 'SESSION_BEHIND':
            case 'WEAK_SESSION':
                return 'rec-card--warning';
            case 'WEAK_TOPIC':
                return 'rec-card--info';
            case 'KNOWLEDGE_GAP':  // 🆕
                return 'rec-card--danger';
            case 'STREAK_BOOST':
                return 'rec-card--success';
            case 'QUIZ_PRACTICE':
                return 'rec-card--primary';
            case 'NEXT_SESSION':
                return 'rec-card--next';
            default:
                return '';
        }
    };

    // 🆕 Check if this recommendation type should show action buttons
    const shouldShowActionButton = (type: string): boolean => {
        return ['WEAK_TOPIC', 'KNOWLEDGE_GAP', 'WEAK_SESSION', 'DOCUMENT_REVIEW'].includes(type);
    };

    const handleClick = (rec: Recommendation) => {
        if (onActionClick) {
            onActionClick(rec);
        }
    };

    // 🆕 Handle flashcard generation for weak topics
    const handleGenerateFlashcard = async (e: React.MouseEvent, rec: Recommendation) => {
        e.stopPropagation();  // Don't trigger card click

        const topicName = rec.action_data?.topic_name as string || rec.title;
        const subjectCode = rec.action_data?.subject_code as string || '';

        if (onGenerateFlashcard) {
            setGeneratingFor(topicName);
            try {
                await onGenerateFlashcard(topicName, subjectCode);
            } finally {
                setGeneratingFor(null);
            }
        }
    };

    if (loading) {
        return (
            <div className="recommendations-section recommendations-section--loading">
                <Loader2 className="rec-loader" size={20} />
                <span>Đang tải gợi ý AI...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="recommendations-section recommendations-section--error">
                <span>{error}</span>
                <button onClick={loadRecommendations} className="rec-retry-btn">
                    <RefreshCw size={14} /> Thử lại
                </button>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null; // Don't show section if no recommendations
    }

    return (
        <div className="recommendations-section">
            <div className="recommendations-header">
                <h3 className="recommendations-title">
                    <Sparkles size={18} className="rec-ai-icon" />
                    AI Gợi ý học tập
                </h3>
                <button onClick={loadRecommendations} className="rec-refresh-btn" title="Làm mới">
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="recommendations-list">
                {recommendations.map((rec, index) => (
                    <div
                        key={index}
                        className={`rec-card ${getTypeClass(rec.type)}`}
                        onClick={() => handleClick(rec)}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="rec-card__icon">
                            {getTypeIcon(rec.type)}
                        </div>
                        <div className="rec-card__content">
                            <div className="rec-card__title">{rec.title}</div>
                            <div className="rec-card__message">{rec.message}</div>

                            {/* 🆕 Action buttons for weak topics */}
                            {shouldShowActionButton(rec.type) && onGenerateFlashcard && (
                                <div className="rec-card__actions">
                                    <button
                                        className="rec-action-btn rec-action-btn--flashcard"
                                        onClick={(e) => handleGenerateFlashcard(e, rec)}
                                        disabled={generatingFor !== null}
                                    >
                                        {generatingFor === (rec.action_data?.topic_name || rec.title) ? (
                                            <>
                                                <Loader2 size={12} className="rec-action-spinner" />
                                                Đang tạo...
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={12} />
                                                Tạo Flashcard ôn tập
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                        {rec.action_type !== 'none' && !shouldShowActionButton(rec.type) && (
                            <ChevronRight className="rec-card__arrow" size={16} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendationsSection;

