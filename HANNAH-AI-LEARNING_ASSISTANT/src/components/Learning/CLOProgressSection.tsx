import { useState, useEffect } from 'react';
import { Target, BookOpen, Check, ChevronDown, ChevronUp } from 'lucide-react';
import learningDashboardService from '../../service/learningDashboardService';
import type { CLOProgress, CLOProgressResponse } from '../../service/learningDashboardService';
import './CLOProgressSection.css';

interface CLOProgressSectionProps {
    subjectId: number;
    subjectCode?: string;
}

/**
 * 🆕 Phase 2: CLO Progress Visualization Component
 * 
 * Displays Course Learning Outcome progress with:
 * - Overall CLO completion percentage
 * - Individual CLO progress bars
 * - Session mapping for each CLO
 */
const CLOProgressSection = ({ subjectId, subjectCode }: CLOProgressSectionProps) => {
    const [cloData, setCloData] = useState<CLOProgressResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const loadCLOProgress = async () => {
            try {
                setLoading(true);
                const data = await learningDashboardService.getCLOProgress(subjectId);
                setCloData(data);
                setError(null);
            } catch (err) {
                console.error('Failed to load CLO progress:', err);
                setError('Không thể tải tiến độ CLO');
            } finally {
                setLoading(false);
            }
        };

        if (subjectId) {
            loadCLOProgress();
        }
    }, [subjectId]);

    if (loading) {
        return (
            <div className="clo-progress-section loading">
                <div className="clo-skeleton" />
            </div>
        );
    }

    if (error || !cloData || cloData.clos.length === 0) {
        return null; // Don't show section if no CLO data
    }

    const getProgressColor = (percentage: number): string => {
        if (percentage >= 80) return 'var(--clo-progress-high)';
        if (percentage >= 50) return 'var(--clo-progress-medium)';
        if (percentage >= 20) return 'var(--clo-progress-low)';
        return 'var(--clo-progress-none)';
    };

    return (
        <div className="clo-progress-section">
            <div className="clo-header" onClick={() => setExpanded(!expanded)}>
                <div className="clo-title">
                    <Target className="clo-icon" size={18} />
                    <span>Tiến độ CLO</span>
                    <span className="clo-badge">{cloData.totalCLOs} CLOs</span>
                </div>
                <div className="clo-header-right">
                    <div className="clo-overall-progress">
                        <span className="clo-percentage">{cloData.overallProgress}%</span>
                        <div className="clo-progress-bar-mini">
                            <div
                                className="clo-progress-fill-mini"
                                style={{
                                    width: `${cloData.overallProgress}%`,
                                    backgroundColor: getProgressColor(cloData.overallProgress)
                                }}
                            />
                        </div>
                    </div>
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </div>

            {expanded && (
                <div className="clo-content">
                    {cloData.clos.map((clo: CLOProgress) => (
                        <div key={clo.cloName} className="clo-item">
                            <div className="clo-item-header">
                                <div className="clo-name">
                                    {clo.completedSessions === clo.totalSessions ? (
                                        <Check className="clo-check" size={14} />
                                    ) : (
                                        <BookOpen className="clo-book" size={14} />
                                    )}
                                    <span className="clo-name-text">{clo.cloName}</span>
                                </div>
                                <span className="clo-stats">
                                    {clo.completedSessions}/{clo.totalSessions} sessions
                                </span>
                            </div>

                            {clo.description && (
                                <p className="clo-description">{clo.description}</p>
                            )}

                            <div className="clo-progress-bar">
                                <div
                                    className="clo-progress-fill"
                                    style={{
                                        width: `${clo.progressPercentage}%`,
                                        backgroundColor: getProgressColor(clo.progressPercentage)
                                    }}
                                />
                            </div>

                            {clo.sessionNumbers.length > 0 && (
                                <div className="clo-sessions">
                                    <span className="clo-sessions-label">Sessions:</span>
                                    <div className="clo-session-tags">
                                        {clo.sessionNumbers.map(num => (
                                            <span key={num} className="clo-session-tag">
                                                W{num}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CLOProgressSection;
