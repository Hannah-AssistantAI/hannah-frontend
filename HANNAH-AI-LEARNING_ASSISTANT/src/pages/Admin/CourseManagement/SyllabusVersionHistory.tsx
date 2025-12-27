import { useState, useEffect } from 'react';
import { History, Clock, CheckCircle, Archive, RotateCcw, Eye, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import syllabusVersionService from '../../../service/syllabusVersionService';
import type { SyllabusVersionSummary, SyllabusVersionDetail } from '../../../service/syllabusVersionService';
import { formatDateTimeVN } from '../../../utils/dateUtils';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import './SyllabusVersionHistory.css';

interface SyllabusVersionHistoryProps {
    subjectId: number;
    subjectCode: string;
    onRollback?: () => void;  // Callback to refresh subject data after rollback
}

export default function SyllabusVersionHistory({ subjectId, subjectCode, onRollback }: SyllabusVersionHistoryProps) {
    const [versions, setVersions] = useState<SyllabusVersionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
    const [versionDetails, setVersionDetails] = useState<Record<number, SyllabusVersionDetail>>({});
    const [loadingDetails, setLoadingDetails] = useState<number | null>(null);

    // Rollback modal state
    const [showRollbackModal, setShowRollbackModal] = useState(false);
    const [rollbackTarget, setRollbackTarget] = useState<SyllabusVersionSummary | null>(null);
    const [rollbackLoading, setRollbackLoading] = useState(false);

    useEffect(() => {
        fetchVersionHistory();
    }, [subjectId]);

    const fetchVersionHistory = async () => {
        try {
            setLoading(true);
            const data = await syllabusVersionService.getVersionHistory(subjectId);
            setVersions(data);
        } catch (error: any) {
            console.error('Error fetching version history:', error);
            // Don't show error if 404 - just means no versions yet
            if (error.response?.status !== 404) {
                toast.error('Failed to load version history');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleVersionDetails = async (version: SyllabusVersionSummary) => {
        if (expandedVersion === version.versionNumber) {
            setExpandedVersion(null);
            return;
        }

        setExpandedVersion(version.versionNumber);

        // Fetch details if not cached
        if (!versionDetails[version.versionNumber]) {
            try {
                setLoadingDetails(version.versionNumber);
                const details = await syllabusVersionService.getVersion(subjectId, version.versionNumber);
                setVersionDetails(prev => ({
                    ...prev,
                    [version.versionNumber]: details
                }));
            } catch (error) {
                console.error('Error fetching version details:', error);
                toast.error('Failed to load version details');
            } finally {
                setLoadingDetails(null);
            }
        }
    };

    const openRollbackModal = (version: SyllabusVersionSummary) => {
        setRollbackTarget(version);
        setShowRollbackModal(true);
    };

    const handleRollback = async () => {
        if (!rollbackTarget) return;

        try {
            setRollbackLoading(true);
            const result = await syllabusVersionService.rollbackToVersion({
                subjectId,
                targetVersionNumber: rollbackTarget.versionNumber,
                reactivateDocuments: true
            });

            toast.success(`Rolled back to version ${rollbackTarget.versionNumber}`);
            setShowRollbackModal(false);
            fetchVersionHistory(); // Refresh list
            onRollback?.(); // Refresh subject data
        } catch (error: any) {
            console.error('Error rolling back:', error);
            toast.error(error.response?.data?.message || 'Failed to rollback');
        } finally {
            setRollbackLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="version-history-loading">
                <Loader className="animate-spin" size={24} />
                <span>Loading version history...</span>
            </div>
        );
    }

    if (versions.length === 0) {
        return (
            <div className="version-history-empty">
                <History size={48} className="empty-icon" />
                <h4>No Version History</h4>
                <p>Version history will appear here after you update the syllabus.</p>
            </div>
        );
    }

    return (
        <div className="version-history-container">
            <div className="version-history-header">
                <History size={20} />
                <h4>Syllabus Version History</h4>
                <span className="version-count">{versions.length} versions</span>
            </div>

            <div className="version-list">
                {versions.map((version) => (
                    <div
                        key={version.id}
                        className={`version-item ${version.isActive ? 'active' : 'archived'}`}
                    >
                        {/* Version Header */}
                        <div
                            className="version-header"
                            onClick={() => toggleVersionDetails(version)}
                        >
                            <div className="version-info">
                                <span className="version-number">v{version.versionNumber}</span>
                                {version.isActive ? (
                                    <span className="version-badge active">
                                        <CheckCircle size={12} /> Active
                                    </span>
                                ) : (
                                    <span className="version-badge archived">
                                        <Archive size={12} /> Archived
                                    </span>
                                )}
                            </div>

                            <div className="version-meta">
                                <span className="version-date">
                                    <Clock size={12} />
                                    {formatDateTimeVN(version.createdAt)}
                                </span>
                                {version.decisionNo && (
                                    <span className="version-decision">
                                        {version.decisionNo}
                                    </span>
                                )}
                            </div>

                            <div className="version-actions">
                                {!version.isActive && (
                                    <button
                                        className="btn-rollback"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openRollbackModal(version);
                                        }}
                                        title="Rollback to this version"
                                    >
                                        <RotateCcw size={14} />
                                        Rollback
                                    </button>
                                )}
                                <button className="btn-expand">
                                    {expandedVersion === version.versionNumber ? (
                                        <ChevronUp size={16} />
                                    ) : (
                                        <ChevronDown size={16} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Version Details (Expandable) */}
                        {expandedVersion === version.versionNumber && (
                            <div className="version-details">
                                {loadingDetails === version.versionNumber ? (
                                    <div className="details-loading">
                                        <Loader className="animate-spin" size={16} />
                                        Loading details...
                                    </div>
                                ) : versionDetails[version.versionNumber] ? (
                                    <div className="details-content">
                                        {version.versionNotes && (
                                            <div className="detail-row">
                                                <label>Notes:</label>
                                                <span>{version.versionNotes}</span>
                                            </div>
                                        )}

                                        <div className="detail-row">
                                            <label>Description:</label>
                                            <span>{versionDetails[version.versionNumber].description || 'N/A'}</span>
                                        </div>

                                        <div className="detail-row">
                                            <label>Learning Outcomes:</label>
                                            <span>
                                                {(() => {
                                                    try {
                                                        const los = JSON.parse(versionDetails[version.versionNumber].learningOutcomes || '[]');
                                                        return Array.isArray(los) ? `${los.length} items` : 'N/A';
                                                    } catch {
                                                        return 'N/A';
                                                    }
                                                })()}
                                            </span>
                                        </div>

                                        <div className="detail-row">
                                            <label>Sessions:</label>
                                            <span>
                                                {(() => {
                                                    try {
                                                        const sessions = JSON.parse(versionDetails[version.versionNumber].sessions || '[]');
                                                        return Array.isArray(sessions) ? `${sessions.length} sessions` : 'N/A';
                                                    } catch {
                                                        return 'N/A';
                                                    }
                                                })()}
                                            </span>
                                        </div>

                                        <div className="detail-row">
                                            <label>Assessments:</label>
                                            <span>
                                                {(() => {
                                                    try {
                                                        const assessments = JSON.parse(versionDetails[version.versionNumber].assessments || '[]');
                                                        return Array.isArray(assessments) ? `${assessments.length} items` : 'N/A';
                                                    } catch {
                                                        return 'N/A';
                                                    }
                                                })()}
                                            </span>
                                        </div>

                                        <div className="detail-row">
                                            <label>Documents:</label>
                                            <span>
                                                {version.activeDocumentCount} active / {version.documentCount} total
                                            </span>
                                        </div>

                                        {version.deactivatedAt && (
                                            <div className="detail-row">
                                                <label>Archived At:</label>
                                                <span>{formatDateTimeVN(version.deactivatedAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <ConfirmModal
                isOpen={showRollbackModal}
                onClose={() => setShowRollbackModal(false)}
                onConfirm={handleRollback}
                title="Rollback Syllabus?"
                message={`This will revert ${subjectCode} to version ${rollbackTarget?.versionNumber}. The current syllabus data will be archived. Documents from the target version will be reactivated.`}
                confirmText={rollbackLoading ? "Rolling back..." : "Rollback"}
                cancelText="Cancel"
                type="warning"
            />
        </div>
    );
}
