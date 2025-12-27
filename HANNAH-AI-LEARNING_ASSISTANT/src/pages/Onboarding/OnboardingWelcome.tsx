import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, FileText, ArrowRight, Sparkles } from 'lucide-react';
import onboardingService from '../../service/onboardingService';
import type { OnboardingStatus } from '../../service/onboardingService';
import './Onboarding.css';

export default function OnboardingWelcome() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<OnboardingStatus | null>(null);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const s = await onboardingService.getStatus();
            setStatus(s);

            // If already complete, go to chat
            if (s.isOnboardingComplete) {
                navigate('/chat');
                return;
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        if (status) {
            const nextUrl = onboardingService.getNextStepUrl(status);
            navigate(nextUrl);
        } else {
            navigate('/onboarding/profile');
        }
    };

    if (loading) {
        return (
            <div className="onboarding-loading">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="onboarding-container">
            <div className="onboarding-card welcome-card">
                <div className="welcome-header">
                    <div className="welcome-icon">
                        <Sparkles size={48} />
                    </div>
                    <h1>Chào mừng đến với Hannah AI!</h1>
                    <p className="welcome-subtitle">
                        Trợ lý học tập AI cá nhân hóa cho sinh viên FPT
                    </p>
                </div>

                <div className="welcome-steps">
                    <div className="step-item">
                        <div className="step-icon">
                            <GraduationCap size={24} />
                        </div>
                        <div className="step-content">
                            <h3>Bước 1: Thông tin cá nhân</h3>
                            <p>Điền họ tên, MSSV, chuyên ngành và kỳ học</p>
                        </div>
                        {status?.profileCompleted && <span className="step-done">✓</span>}
                    </div>

                    <div className="step-item">
                        <div className="step-icon">
                            <FileText size={24} />
                        </div>
                        <div className="step-content">
                            <h3>Bước 2: Upload bảng điểm</h3>
                            <p>Tải lên bảng điểm để AI hiểu tiến độ học tập</p>
                        </div>
                        {status?.transcriptUploaded && <span className="step-done">✓</span>}
                    </div>

                    <div className="step-item">
                        <div className="step-icon">
                            <BookOpen size={24} />
                        </div>
                        <div className="step-content">
                            <h3>Bắt đầu học tập</h3>
                            <p>AI sẽ cá nhân hóa nội dung theo profile của bạn</p>
                        </div>
                    </div>
                </div>

                <button className="onboarding-btn primary" onClick={handleStart}>
                    Bắt đầu ngay
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
