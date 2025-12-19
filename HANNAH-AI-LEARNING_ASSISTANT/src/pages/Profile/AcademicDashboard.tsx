import { useState, useRef, useEffect, useCallback } from 'react';
import studentService from '../../service/studentService';
import type {
    TranscriptDetail,
    StudentGrade,
    Specialization,
    UploadTranscriptResponse
} from '../../service/studentService';
import toast from 'react-hot-toast';
import {
    GraduationCap,
    Upload,
    FileSpreadsheet,
    TrendingUp,
    TrendingDown,
    BookOpen,
    Award,
    Target,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    ChevronDown,
    AlertCircle,
    Calendar,
    RefreshCw,
    Edit3,
    Check
} from 'lucide-react';
import './AcademicDashboard.css';

interface AcademicDashboardProps {
    userId: number;
    profileSemester?: string; // Current semester from UserProfile
    onSemesterUpdate?: (newSemester: string) => void; // Callback when semester synced/updated
}

export default function AcademicDashboard({ userId, profileSemester, onSemesterUpdate }: AcademicDashboardProps) {
    const [transcript, setTranscript] = useState<TranscriptDetail | null>(null);
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [selectedSpecializationId, setSelectedSpecializationId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dropdown open state
    const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState(false);

    // Semester banner state
    const [isEditingSemester, setIsEditingSemester] = useState(false);
    const [editingSemesterValue, setEditingSemesterValue] = useState<string>('');
    const [isSyncingSemester, setIsSyncingSemester] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load transcript, specializations, and saved specialization in parallel
            const [transcriptData, specializationsData, mySpecialization] = await Promise.all([
                studentService.getTranscript().catch(() => null),
                studentService.getSpecializations().catch(() => []),
                studentService.getMySpecialization().catch(() => null)
            ]);

            setTranscript(transcriptData);
            setSpecializations(specializationsData);
            // Set saved specialization from backend
            if (mySpecialization?.id) {
                setSelectedSpecializationId(mySpecialization.id);
            }
        } catch (error) {
            console.error('Failed to load academic data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        // Validate file type
        const validExtensions = ['.xls', '.xlsx', '.html', '.htm'];
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        if (!validExtensions.includes(extension)) {
            toast.error('Vui lòng tải file .xls từ FAP');
            return;
        }

        setIsUploading(true);
        try {
            const result: UploadTranscriptResponse = await studentService.uploadTranscript(file);

            if (result.success) {
                toast.success(result.message);
                // Reload transcript data
                const newTranscript = await studentService.getTranscript();
                setTranscript(newTranscript);

                if (result.warnings && result.warnings.length > 0) {
                    result.warnings.forEach(w => toast(w, { icon: '⚠️' }));
                }
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(error.response?.data?.message || 'Tải lên thất bại');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleSpecializationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value);
        if (!id) return;

        try {
            const result = await studentService.setSpecialization(id);
            if (result.success) {
                setSelectedSpecializationId(id);
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    const getGradeClass = (grade?: number): string => {
        if (grade === undefined || grade === null) return 'studying';
        if (grade >= 8.5) return 'excellent';
        if (grade >= 7.0) return 'good';
        if (grade >= 5.0) return 'average';
        return 'poor';
    };

    const getStatusClass = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'passed': return 'passed';
            case 'failed': return 'failed';
            default: return 'studying';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'passed': return <CheckCircle2 size={14} />;
            case 'failed': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    // Get unique semesters for filter
    const semesters = transcript?.grades
        ? [...new Set(transcript.grades.map(g => g.semesterNumber))].sort((a, b) => a - b)
        : [];

    // Filter grades by semester
    const filteredGrades = transcript?.grades?.filter(g =>
        semesterFilter === 'all' || g.semesterNumber === semesterFilter
    ) || [];

    // Calculate strengths and weaknesses (only subjects that count for GPA)
    const isGpaCountedSubject = (grade: StudentGrade) => {
        // Exclude special courses (marked with *)
        if (grade.isSpecialCourse) return false;
        // Exclude OJT subjects
        const code = grade.subjectCode?.toUpperCase() || '';
        if (code.startsWith('OJT') || code.includes('_OJT')) return false;
        return true;
    };

    const gradesByScore = [...(transcript?.grades || [])]
        .filter(g => g.grade !== undefined && g.grade !== null && g.status === 'Passed' && isGpaCountedSubject(g))
        .sort((a, b) => (b.grade || 0) - (a.grade || 0));

    const strongSubjects = gradesByScore.slice(0, 3);
    const weakSubjects = gradesByScore.slice(-3).reverse();

    // Semester sync logic
    const transcriptSemester = transcript?.currentSemesterNumber;
    const profileSemesterNumber = profileSemester ? parseInt(profileSemester.replace(/\D/g, '')) || null : null;
    const hasSemesterMismatch = transcriptSemester && profileSemesterNumber && transcriptSemester !== profileSemesterNumber;
    const needsSemesterSetup = transcriptSemester && !profileSemesterNumber;

    // Debug logging - always log when component mounts or data changes
    useEffect(() => {
        console.log('========================================');
        console.log('[AcademicDashboard] MOUNTED');
        console.log('[AcademicDashboard] Props:', {
            userId,
            profileSemester,
            onSemesterUpdateExists: !!onSemesterUpdate
        });
        console.log('========================================');
    }, []);

    useEffect(() => {
        console.log('[AcademicDashboard] Transcript loaded:', transcript ? {
            id: transcript.id,
            currentSemesterNumber: transcript.currentSemesterNumber,
            importedAt: transcript.importedAt
        } : 'NULL - No transcript uploaded yet');
    }, [transcript]);

    useEffect(() => {
        console.log('[AcademicDashboard] Semester comparison:', {
            profileSemester,
            profileSemesterNumber,
            transcriptSemester,
            hasSemesterMismatch,
            needsSemesterSetup,
            onSemesterUpdateExists: !!onSemesterUpdate
        });
    }, [profileSemester, transcriptSemester, hasSemesterMismatch, needsSemesterSetup, onSemesterUpdate]);

    const handleSyncSemester = async () => {
        if (!transcriptSemester || !onSemesterUpdate) return;

        setIsSyncingSemester(true);
        try {
            const result = await studentService.setCurrentSemester(userId, transcriptSemester.toString());
            if (result.success) {
                onSemesterUpdate(result.currentSemester);
                toast.success(`Đã cập nhật kỳ học thành HK${transcriptSemester}`);
            } else {
                toast.error(result.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Failed to sync semester:', error);
            toast.error('Đồng bộ kỳ học thất bại');
        } finally {
            setIsSyncingSemester(false);
        }
    };

    const handleEditSemester = () => {
        setEditingSemesterValue(profileSemesterNumber?.toString() || transcriptSemester?.toString() || '');
        setIsEditingSemester(true);
    };

    const handleSaveSemester = async () => {
        if (!editingSemesterValue || !onSemesterUpdate) return;

        setIsSyncingSemester(true);
        try {
            const result = await studentService.setCurrentSemester(userId, editingSemesterValue);
            if (result.success) {
                onSemesterUpdate(result.currentSemester);
                toast.success(`Đã cập nhật kỳ học thành HK${editingSemesterValue}`);
                setIsEditingSemester(false);
            } else {
                toast.error(result.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Failed to save semester:', error);
            toast.error('Lưu kỳ học thất bại');
        } finally {
            setIsSyncingSemester(false);
        }
    };

    const formatImportDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="academic-section">
                <div className="academic-section-header">
                    <h3 className="academic-section-title">
                        <GraduationCap size={24} />
                        Kết quả học tập
                    </h3>
                </div>
                <div className="skeleton" style={{ height: 200 }} />
            </div>
        );
    }

    return (
        <div className="academic-section">
            <div className="academic-section-header">
                <h3 className="academic-section-title">
                    <GraduationCap size={24} />
                    Kết quả học tập
                </h3>
            </div>

            {/* Current Semester Banner - Only show when transcript exists */}
            {transcript && transcriptSemester && (
                <div className={`semester-banner ${hasSemesterMismatch || needsSemesterSetup ? 'warning' : ''}`}>
                    <div className="semester-banner-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="semester-banner-content">
                        {hasSemesterMismatch ? (
                            <>
                                <div className="semester-banner-title">
                                    <AlertCircle size={16} className="warning-icon" />
                                    Kỳ học trong hồ sơ khác với bảng điểm
                                </div>
                                <p className="semester-banner-subtitle">
                                    Hồ sơ: <strong>HK{profileSemesterNumber}</strong> • Bảng điểm: <strong>HK{transcriptSemester}</strong>
                                </p>
                            </>
                        ) : needsSemesterSetup ? (
                            <>
                                <div className="semester-banner-title">
                                    Phát hiện kỳ học từ bảng điểm
                                </div>
                                <p className="semester-banner-subtitle">
                                    Bạn đang học <strong>HK{transcriptSemester}</strong> • Chưa thiết lập trong hồ sơ
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="semester-banner-title">
                                    Kỳ học hiện tại: <strong>HK{transcriptSemester}</strong>
                                </div>
                                <p className="semester-banner-subtitle">
                                    Cập nhật từ bảng điểm • {formatImportDate(transcript.importedAt)}
                                </p>
                            </>
                        )}
                    </div>
                    <div className="semester-banner-actions">
                        {isEditingSemester ? (
                            <div className="semester-edit-group">
                                <select
                                    className="semester-select"
                                    value={editingSemesterValue}
                                    onChange={(e) => setEditingSemesterValue(e.target.value)}
                                    disabled={isSyncingSemester}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => (
                                        <option key={k} value={k.toString()}>Kỳ {k}</option>
                                    ))}
                                </select>
                                <button
                                    className="semester-action-btn save"
                                    onClick={handleSaveSemester}
                                    disabled={isSyncingSemester}
                                >
                                    {isSyncingSemester ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                </button>
                                <button
                                    className="semester-action-btn cancel"
                                    onClick={() => setIsEditingSemester(false)}
                                    disabled={isSyncingSemester}
                                >
                                    <XCircle size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                {(hasSemesterMismatch || needsSemesterSetup) && onSemesterUpdate && (
                                    <button
                                        className="semester-sync-btn"
                                        onClick={handleSyncSemester}
                                        disabled={isSyncingSemester}
                                    >
                                        {isSyncingSemester ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <RefreshCw size={14} />
                                        )}
                                        <span>Cập nhật thành HK{transcriptSemester}</span>
                                    </button>
                                )}
                                {onSemesterUpdate && (
                                    <button
                                        className="semester-edit-btn"
                                        onClick={handleEditSemester}
                                        disabled={isSyncingSemester}
                                    >
                                        <Edit3 size={14} />
                                        <span>Thay đổi</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* No transcript - Upload Section */}
            {!transcript ? (
                <div className="no-transcript">
                    <FileSpreadsheet className="no-transcript-icon" />
                    <h4 className="no-transcript-title">Chưa có bảng điểm</h4>
                    <p className="no-transcript-text">
                        Tải lên bảng điểm từ FAP để xem thống kê kết quả học tập
                    </p>

                    <div
                        className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <Loader2 className="upload-icon animate-spin" />
                        ) : (
                            <Upload className="upload-icon" />
                        )}
                        <p className="upload-text">
                            <strong>Kéo thả file</strong> hoặc nhấn để tải lên
                        </p>
                        <p className="upload-hint">
                            Hỗ trợ file .xls xuất từ FAP (FPT Academic Portal)
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xls,.xlsx,.html,.htm"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : (
                <>
                    {/* GPA Display with Actions */}
                    <div className="gpa-row">
                        {/* Left: GPA Card */}
                        <div className="gpa-card">
                            <div className="gpa-value">
                                {transcript.weightedGpa?.toFixed(2) || 'N/A'}
                            </div>
                            <div className="gpa-label">GPA tích lũy (hệ 10)</div>
                        </div>

                        {/* Right: Actions Column */}
                        <div className="gpa-actions-column">
                            <button
                                className="update-transcript-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                <span>Cập nhật bảng điểm</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xls,.xlsx,.html,.htm"
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                            />

                            {specializations.length > 0 ? (
                                <select
                                    className={`specialization-select-compact ${isSpecDropdownOpen ? 'open' : ''}`}
                                    value={selectedSpecializationId || ''}
                                    onChange={(e) => {
                                        handleSpecializationChange(e);
                                        setIsSpecDropdownOpen(false);
                                    }}
                                    onFocus={() => setIsSpecDropdownOpen(true)}
                                    onBlur={() => setIsSpecDropdownOpen(false)}
                                >
                                    <option value="">-- Chọn chuyên ngành --</option>
                                    {specializations.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.code} - {s.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="no-specialization">Chưa có chuyên ngành</div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value info">{transcript.totalCreditsEarned}</div>
                            <div className="stat-label">Tín chỉ đạt</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value success">{transcript.passedSubjects}</div>
                            <div className="stat-label">Môn đã qua</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value warning">{transcript.studyingSubjects}</div>
                            <div className="stat-label">Đang học</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value danger">{transcript.failedSubjects}</div>
                            <div className="stat-label">Chưa đạt</div>
                        </div>
                    </div>

                    {/* Strong/Weak Subjects */}
                    {strongSubjects.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                            <div className="stat-item" style={{ textAlign: 'left', padding: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#4ade80' }}>
                                    <TrendingUp size={18} />
                                    <strong>Điểm mạnh</strong>
                                </div>
                                {strongSubjects.map(s => (
                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(71,85,105,0.2)' }}>
                                        <span className="subject-name">{s.subjectName}</span>
                                        <span className={`grade-badge ${getGradeClass(s.grade)}`}>{s.grade}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="stat-item" style={{ textAlign: 'left', padding: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#f87171' }}>
                                    <TrendingDown size={18} />
                                    <strong>Cần cải thiện</strong>
                                </div>
                                {weakSubjects.map(s => (
                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(71,85,105,0.2)' }}>
                                        <span className="subject-name">{s.subjectName}</span>
                                        <span className={`grade-badge ${getGradeClass(s.grade)}`}>{s.grade}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Grades Table */}
                    <div className="grades-section">
                        <div className="grades-filter">
                            <button
                                className={`filter-btn ${semesterFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setSemesterFilter('all')}
                            >
                                Tất cả
                            </button>
                            {semesters.map(s => (
                                <button
                                    key={s}
                                    className={`filter-btn ${semesterFilter === s ? 'active' : ''}`}
                                    onClick={() => setSemesterFilter(s)}
                                >
                                    Kỳ {s}
                                </button>
                            ))}
                        </div>

                        <div className="grades-table-container">
                            <table className="grades-table">
                                <thead>
                                    <tr>
                                        <th>Mã môn</th>
                                        <th>Tên môn</th>
                                        <th>Kỳ</th>
                                        <th>TC</th>
                                        <th>Điểm</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGrades.map(grade => (
                                        <tr key={grade.id}>
                                            <td><code>{grade.subjectCode}</code></td>
                                            <td>{grade.subjectName}</td>
                                            <td>{grade.semesterNumber}</td>
                                            <td>{grade.credits}</td>
                                            <td>
                                                <span className={`grade-badge ${getGradeClass(grade.grade)}`}>
                                                    {grade.grade ?? '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(grade.status)}`}>
                                                    {getStatusIcon(grade.status)}
                                                    {grade.status === 'Passed' ? 'Đạt' :
                                                        grade.status === 'Failed' ? 'Chưa đạt' : 'Đang học'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
