import React, { useState, useEffect } from 'react';
import { careerPathService } from '../../../service/careerPathService';
import type {
    SpecializationsOverview,
    SpecializationPreview,
    LearningRoadmap
} from '../../../service/careerPathService';
import './CareerPathExplorer.css';

// ============ Sub Components ============

interface SpecializationCardProps {
    spec: SpecializationPreview;
    isSuggested: boolean;
    isSelected: boolean;
    onClick: () => void;
}

const SpecializationCard: React.FC<SpecializationCardProps> = ({
    spec, isSuggested, isSelected, onClick
}) => {
    const totalSubjects = spec.subjectsBySemester.reduce(
        (sum, s) => sum + s.subjects.length, 0
    );

    return (
        <div
            className={`spec-card ${isSelected ? 'selected' : ''} ${isSuggested ? 'suggested' : ''}`}
            onClick={onClick}
        >
            {isSuggested && <div className="suggested-badge">✨ Gợi ý cho bạn</div>}
            <h3 className="spec-name">{spec.name}</h3>
            {spec.nameEn && <p className="spec-name-en">{spec.nameEn}</p>}
            <div className="spec-stats">
                <span className="stat">📚 {totalSubjects} môn</span>
                <span className="stat">🎓 {spec.requiredCredits} tín chỉ</span>
            </div>
            {spec.careerOutlook && (
                <div className="career-outlook">
                    <div className="jobs">
                        {spec.careerOutlook.jobTitles.slice(0, 2).join(' • ')}
                    </div>
                    <div className="salary">{spec.careerOutlook.salaryRange}</div>
                </div>
            )}
        </div>
    );
};

interface SpecializationDetailProps {
    spec: SpecializationPreview;
    suggestionReason: string | null;
}

const SpecializationDetail: React.FC<SpecializationDetailProps> = ({ spec, suggestionReason }) => {
    const getDemandLabel = (demand: string | null) => {
        if (!demand) return '';
        if (demand === 'high') return 'Cao';
        if (demand === 'medium') return 'Trung bình';
        return 'Thấp';
    };

    return (
        <div className="spec-detail">
            <div className="detail-header">
                <h2>{spec.name}</h2>
                {spec.nameEn && <span className="name-en">({spec.nameEn})</span>}
            </div>

            {spec.description && (
                <p className="description">{spec.description}</p>
            )}

            {suggestionReason && (
                <div className="suggestion-reason">💡 {suggestionReason}</div>
            )}

            {spec.careerOutlook && (
                <div className="career-section">
                    <h4>Triển vọng nghề nghiệp</h4>
                    <div className="career-info">
                        <div className="jobs-list">
                            {spec.careerOutlook.jobTitles.map((job, i) => (
                                <span key={i} className="job-tag">{job}</span>
                            ))}
                        </div>
                        <div className="salary-range">
                            <strong>Mức lương:</strong> {spec.careerOutlook.salaryRange}
                        </div>
                        {spec.careerOutlook.marketDemand && (
                            <div className={`demand demand-${spec.careerOutlook.marketDemand}`}>
                                Nhu cầu: {getDemandLabel(spec.careerOutlook.marketDemand)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="curriculum-section">
                <h4>Lộ trình môn học</h4>
                <div className="semester-timeline">
                    {spec.subjectsBySemester.map(sem => (
                        <div key={sem.semester} className="semester-block">
                            <div className="semester-header">
                                <span className="semester-num">Kỳ {sem.semester}</span>
                                <span className="subject-count">{sem.subjects.length} môn</span>
                            </div>
                            <div className="subjects-list">
                                {sem.subjects.map(subj => (
                                    <div key={subj.id} className={`subject-item ${subj.subjectType}`}>
                                        <span className="subject-code">{subj.code}</span>
                                        <span className="subject-name">{subj.name}</span>
                                        <span className="subject-credits">{subj.credits} TC</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface RoadmapViewProps {
    roadmap: LearningRoadmap;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap }) => {
    const getStatusLabel = (status: string) => {
        if (status === 'completed') return '✅ Hoàn thành';
        if (status === 'current') return '🔵 Đang học';
        return '⬜ Sắp tới';
    };

    return (
        <div className="roadmap-view">
            <div className="roadmap-header">
                <h2>Lộ trình của bạn</h2>
                {roadmap.hasSpecialization ? (
                    <div className="spec-info">
                        {roadmap.specializationName} | Kỳ {roadmap.currentSemester}
                    </div>
                ) : (
                    <div className="spec-info no-spec">
                        Chưa chọn chuyên ngành | Kỳ {roadmap.currentSemester}
                    </div>
                )}
            </div>

            <div className="progress-section">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${roadmap.progressPercent}%` }}
                    />
                </div>
                <div className="progress-stats">
                    <span>{roadmap.creditsCompleted}/{roadmap.totalCreditsRequired} tín chỉ</span>
                    <span className="percent">{roadmap.progressPercent}%</span>
                </div>
            </div>

            {roadmap.weakSubjects && roadmap.weakSubjects.length > 0 && (
                <div className="weak-subjects-alert">
                    <h4>⚠️ Môn cần cải thiện</h4>
                    <div className="weak-list">
                        {roadmap.weakSubjects.map(ws => (
                            <div key={ws.code} className="weak-item">
                                <span className="code">{ws.code}</span>
                                <span className="name">{ws.name}</span>
                                {ws.grade && <span className="grade">{ws.grade}</span>}
                                <span className="reason">{ws.reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="milestones">
                {roadmap.milestones && roadmap.milestones.length > 0 ? (
                    roadmap.milestones.map(milestone => (
                        <div key={milestone.semester} className={`milestone ${milestone.status}`}>
                            <div className="milestone-header">
                                <span className="semester">Kỳ {milestone.semester}</span>
                                <span className={`status-badge ${milestone.status}`}>
                                    {getStatusLabel(milestone.status)}
                                </span>
                            </div>
                            <div className="milestone-progress">
                                {milestone.completedCredits}/{milestone.totalCredits} TC
                            </div>
                            <div className="milestone-subjects">
                                {milestone.subjects.map(subj => (
                                    <div
                                        key={subj.id || subj.code}
                                        className={`subject-chip ${subj.status} ${subj.isWeak ? 'weak' : ''}`}
                                    >
                                        {subj.code}
                                        {subj.grade && <span className="grade">({subj.grade})</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-milestones">
                        <div className="empty-icon">📋</div>
                        <h4>Chưa có lộ trình học tập</h4>
                        <p>Hãy upload bảng điểm để xem lộ trình của bạn.</p>
                        <button onClick={() => window.location.href = '/profile'}>
                            📄 Cập nhật bảng điểm
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============ Main Component ============

const CareerPathExplorer: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overview, setOverview] = useState<SpecializationsOverview | null>(null);
    const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
    const [selectedSpec, setSelectedSpec] = useState<SpecializationPreview | null>(null);
    const [activeTab, setActiveTab] = useState<'explore' | 'roadmap'>('explore');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [overviewData, roadmapData] = await Promise.all([
                    careerPathService.getSpecializationsOverview(),
                    careerPathService.getLearningRoadmap()
                ]);

                console.log('CareerPath DEBUG - overviewData:', JSON.stringify(overviewData, null, 2));
                console.log('CareerPath DEBUG - roadmapData:', JSON.stringify(roadmapData, null, 2));
                console.log('CareerPath DEBUG - milestones count:', roadmapData?.milestones?.length || 0);

                setOverview(overviewData);
                setRoadmap(roadmapData);

                if (overviewData.suggestedCode) {
                    const suggested = overviewData.specializations.find(
                        s => s.code === overviewData.suggestedCode
                    );
                    if (suggested) setSelectedSpec(suggested);
                } else if (overviewData.specializations.length > 0) {
                    setSelectedSpec(overviewData.specializations[0]);
                }
            } catch (err: unknown) {
                console.error('Failed to load career path data:', err);
                const errorMessage = err instanceof Error ? err.message : 'Không thể tải dữ liệu lộ trình';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="career-path-page loading">
                <div className="loader">
                    <div className="spinner"></div>
                    <p>Đang tải lộ trình học tập...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="career-path-page error">
                <div className="error-box">
                    <div className="error-icon">📚</div>
                    <h3>Chưa có dữ liệu lộ trình</h3>
                    <p className="error-description">
                        {error.includes('401') || error.includes('Unauthorized') ? (
                            <>Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</>
                        ) : (
                            <>
                                Bạn có thể chưa hoàn thành các bước onboarding hoặc chưa upload bảng điểm.
                                <br />
                                Hãy kiểm tra lại thông tin cá nhân và bảng điểm của bạn.
                            </>
                        )}
                    </p>
                    <div className="error-actions">
                        <button
                            className="btn-home"
                            onClick={() => window.location.href = '/'}
                        >
                            🏠 Quay lại trang chủ
                        </button>
                        <button
                            className="btn-retry"
                            onClick={() => window.location.reload()}
                        >
                            🔄 Thử lại
                        </button>
                    </div>
                    <p className="error-help">
                        Nếu vẫn gặp lỗi, hãy liên hệ hỗ trợ kỹ thuật.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="career-path-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>🧭 Khám Phá Lộ Trình Nghề Nghiệp</h1>
                    <p className="subtitle">
                        Tìm hiểu các chuyên ngành và lập kế hoạch học tập của bạn
                    </p>
                </div>
                <div className="tab-switcher">
                    <button
                        className={activeTab === 'explore' ? 'active' : ''}
                        onClick={() => setActiveTab('explore')}
                    >
                        🔍 Khám phá
                    </button>
                    <button
                        className={activeTab === 'roadmap' ? 'active' : ''}
                        onClick={() => setActiveTab('roadmap')}
                    >
                        📊 Lộ trình của tôi
                    </button>
                </div>
            </header>

            <main className="career-content">
                {activeTab === 'explore' && overview && (
                    <div className="explore-layout">
                        <aside className="spec-list">
                            <h3>Chuyên ngành</h3>
                            {overview.specializations && overview.specializations.length > 0 ? (
                                overview.specializations.map(spec => (
                                    <SpecializationCard
                                        key={spec.id}
                                        spec={spec}
                                        isSuggested={spec.code === overview.suggestedCode}
                                        isSelected={selectedSpec?.id === spec.id}
                                        onClick={() => setSelectedSpec(spec)}
                                    />
                                ))
                            ) : (
                                <div className="empty-specs">
                                    <p>Chưa có chuyên ngành nào được thiết lập.</p>
                                </div>
                            )}
                        </aside>
                        <section className="spec-content">
                            {selectedSpec ? (
                                <SpecializationDetail
                                    spec={selectedSpec}
                                    suggestionReason={
                                        selectedSpec.code === overview.suggestedCode
                                            ? overview.suggestionReason
                                            : null
                                    }
                                />
                            ) : (
                                <div className="no-selection">
                                    Chọn một chuyên ngành để xem chi tiết
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === 'roadmap' && roadmap && (
                    <RoadmapView roadmap={roadmap} />
                )}
            </main>
        </div>
    );
};

export default CareerPathExplorer;
