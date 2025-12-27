import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MessageCircle, Sparkles } from 'lucide-react';
import onboardingService from '../../service/onboardingService';
import type { OnboardingStatus } from '../../service/onboardingService';
import './Onboarding.css';

export default function OnboardingComplete() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<OnboardingStatus | null>(null);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const s = await onboardingService.getStatus();
            setStatus(s);
        } catch (error) {
            console.error('Error loading status:', error);
        }
    };

    const handleStartChat = () => {
        navigate('/chat');
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card complete-card">
                <div className="success-icon">
                    <CheckCircle size={48} />
                </div>

                <h1>Chào mừng, {status?.fullName || 'bạn'}! 🎉</h1>
                <p className="complete-subtitle">
                    Bạn đã sẵn sàng sử dụng Hannah AI
                </p>

                {status && (
                    <div className="profile-summary">
                        <h3>Thông tin của bạn</h3>
                        <div className="summary-row">
                            <span className="summary-label">MSSV</span>
                            <span className="summary-value">{status.studentId || '—'}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Chuyên ngành</span>
                            <span className="summary-value">{status.specialization || '—'}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Kỳ hiện tại</span>
                            <span className="summary-value">Kỳ {status.currentSemester || '—'}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Bảng điểm</span>
                            <span className="summary-value">
                                {status.transcriptUploaded ? '✅ Đã upload' : '⏳ Chưa upload'}
                            </span>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button className="onboarding-btn primary" onClick={handleStartChat}>
                        <MessageCircle size={20} />
                        Bắt đầu chat với AI
                    </button>

                    <button
                        className="onboarding-btn secondary"
                        onClick={() => navigate('/profile')}
                    >
                        <Sparkles size={18} />
                        Xem hồ sơ của tôi
                    </button>
                </div>
            </div>
        </div>
    );
}
