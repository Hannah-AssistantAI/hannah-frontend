/**
 * 🆕 Phase 1: Subject Selection Modal for Content Generation
 * 
 * Shows student's current semester subjects with:
 * - Document availability
 * - Session progress
 * - Suggested session range based on completed sessions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { learningDashboardService } from '../../../service/learningDashboardService';
import './SubjectSelectionModal.css';

// Types
export interface SubjectForGeneration {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    hasDocuments: boolean;
    documentCount: number;
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    suggestedSessionRange: {
        from: number;
        to: number;
    } | null;
}

interface SubjectSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (subjectId: number, sessionFrom: number, sessionTo: number) => void;
    generationType: 'quiz' | 'flashcard' | 'mindmap';
}

export const SubjectSelectionModal: React.FC<SubjectSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    generationType
}) => {
    const [subjects, setSubjects] = useState<SubjectForGeneration[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<SubjectForGeneration | null>(null);
    const [sessionFrom, setSessionFrom] = useState<number>(1);
    const [sessionTo, setSessionTo] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [semester, setSemester] = useState<number>(1);

    // Fetch subjects on mount
    const fetchSubjects = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await learningDashboardService.getSubjectsForGeneration();
            setSubjects(data.subjects);
            setSemester(data.semester);

            // Auto-select first subject with documents
            const firstWithDocs = data.subjects.find(s => s.hasDocuments);
            if (firstWithDocs) {
                setSelectedSubject(firstWithDocs);
                setSessionFrom(firstWithDocs.suggestedSessionRange?.from ?? 1);
                setSessionTo(firstWithDocs.suggestedSessionRange?.to ?? 1);
            }
        } catch (err) {
            console.error('Error fetching subjects:', err);
            setError('Không thể tải danh sách môn học');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchSubjects();
        }
    }, [isOpen, fetchSubjects]);

    // Handle subject selection
    const handleSubjectSelect = (subject: SubjectForGeneration) => {
        if (!subject.hasDocuments) return; // Can't select subjects without documents

        setSelectedSubject(subject);
        setSessionFrom(subject.suggestedSessionRange?.from ?? 1);
        setSessionTo((subject.suggestedSessionRange?.to ?? subject.completedSessions) || 1);
    };

    // Handle generate
    const handleGenerate = () => {
        if (!selectedSubject) return;
        onSelect(selectedSubject.subjectId, sessionFrom, sessionTo);
        onClose();
    };

    // Get label for generation type
    const getTypeLabel = () => {
        switch (generationType) {
            case 'quiz': return 'Quiz';
            case 'flashcard': return 'Flashcard';
            case 'mindmap': return 'Mindmap';
            default: return 'Content';
        }
    };

    // Calculate progress percentage
    const getProgressPercent = (subject: SubjectForGeneration) => {
        if (subject.totalSessions === 0) return 0;
        return Math.round((subject.completedSessions / subject.totalSessions) * 100);
    };

    if (!isOpen) return null;

    return (
        <div className="subject-modal__overlay" onClick={onClose}>
            <div className="subject-modal__container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="subject-modal__header">
                    <div className="subject-modal__header-content">
                        <BookOpen className="subject-modal__header-icon" />
                        <div>
                            <h2 className="subject-modal__title">
                                Chọn Môn Học để Generate {getTypeLabel()}
                            </h2>
                            <span className="subject-modal__subtitle">
                                Học kỳ {semester}
                            </span>
                        </div>
                    </div>
                    <button className="subject-modal__close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="subject-modal__content">
                    {isLoading ? (
                        <div className="subject-modal__loading">
                            <div className="subject-modal__spinner" />
                            <p>Đang tải danh sách môn học...</p>
                        </div>
                    ) : error ? (
                        <div className="subject-modal__error">
                            <AlertCircle size={24} />
                            <p>{error}</p>
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="subject-modal__empty">
                            <p>Không có môn học nào trong học kỳ hiện tại</p>
                        </div>
                    ) : (
                        <>
                            {/* Subject List */}
                            <div className="subject-modal__list">
                                {subjects.map(subject => (
                                    <div
                                        key={subject.subjectId}
                                        className={`subject-modal__item ${selectedSubject?.subjectId === subject.subjectId ? 'subject-modal__item--selected' : ''
                                            } ${!subject.hasDocuments ? 'subject-modal__item--disabled' : ''}`}
                                        onClick={() => handleSubjectSelect(subject)}
                                    >
                                        <div className="subject-modal__item-header">
                                            <div className="subject-modal__item-info">
                                                <span className="subject-modal__item-code">{subject.subjectCode}</span>
                                                <span className="subject-modal__item-name">{subject.subjectName}</span>
                                            </div>
                                            {subject.hasDocuments ? (
                                                <CheckCircle2 className="subject-modal__item-check" size={20} />
                                            ) : (
                                                <span className="subject-modal__item-no-docs">Không có tài liệu</span>
                                            )}
                                        </div>

                                        {/* Progress bar */}
                                        <div className="subject-modal__progress">
                                            <div className="subject-modal__progress-bar">
                                                <div
                                                    className="subject-modal__progress-fill"
                                                    style={{ width: `${getProgressPercent(subject)}%` }}
                                                />
                                            </div>
                                            <span className="subject-modal__progress-text">
                                                {subject.completedSessions}/{subject.totalSessions} sessions done
                                            </span>
                                        </div>

                                        {/* Document count & suggestion */}
                                        {subject.hasDocuments && (
                                            <div className="subject-modal__item-footer">
                                                <span className="subject-modal__doc-count">
                                                    <FileText size={14} /> {subject.documentCount} tài liệu
                                                </span>
                                                {subject.suggestedSessionRange && (
                                                    <span className="subject-modal__suggestion">
                                                        👉 Gợi ý: Session {subject.suggestedSessionRange.from}-{subject.suggestedSessionRange.to}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Session Range Selector */}
                            {selectedSubject && (
                                <div className="subject-modal__range">
                                    <label className="subject-modal__range-label">
                                        Chọn phạm vi Session:
                                    </label>
                                    <div className="subject-modal__range-inputs">
                                        <div className="subject-modal__range-input">
                                            <span>Từ:</span>
                                            <select
                                                value={sessionFrom}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value);
                                                    setSessionFrom(val);
                                                    if (val > sessionTo) setSessionTo(val);
                                                }}
                                            >
                                                {Array.from({ length: selectedSubject.totalSessions }, (_, i) => i + 1).map(n => (
                                                    <option key={n} value={n}>Session {n}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="subject-modal__range-input">
                                            <span>Đến:</span>
                                            <select
                                                value={sessionTo}
                                                onChange={e => setSessionTo(parseInt(e.target.value))}
                                            >
                                                {Array.from({ length: selectedSubject.totalSessions }, (_, i) => i + 1)
                                                    .filter(n => n >= sessionFrom)
                                                    .map(n => (
                                                        <option key={n} value={n}>Session {n}</option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>
                                    <p className="subject-modal__range-hint">
                                        {getTypeLabel()} sẽ được tạo từ nội dung Session {sessionFrom} đến {sessionTo}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="subject-modal__footer">
                    <button className="subject-modal__btn subject-modal__btn--cancel" onClick={onClose}>
                        Hủy
                    </button>
                    <button
                        className="subject-modal__btn subject-modal__btn--generate"
                        onClick={handleGenerate}
                        disabled={!selectedSubject || isLoading}
                    >
                        Generate {getTypeLabel()}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubjectSelectionModal;
