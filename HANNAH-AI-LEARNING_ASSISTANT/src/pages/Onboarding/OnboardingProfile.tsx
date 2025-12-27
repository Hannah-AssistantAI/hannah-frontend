import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Calendar, Phone, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import onboardingService from '../../service/onboardingService';
import studentService from '../../service/studentService';
import './Onboarding.css';

interface Specialization {
    id: number;
    code: string;
    name: string;
}

export default function OnboardingProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [specializations, setSpecializations] = useState<Specialization[]>([]);

    const [formData, setFormData] = useState({
        fullName: '',
        studentId: '',
        specializationId: 0,
        currentSemester: 1,
        phone: '',
        learningStyle: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadSpecializations();
        loadExistingData();
    }, []);

    const loadSpecializations = async () => {
        try {
            const data = await studentService.getSpecializations();
            setSpecializations(data);
        } catch (error) {
            toast.error('Không thể tải danh sách chuyên ngành');
        }
    };

    const loadExistingData = async () => {
        try {
            const status = await onboardingService.getStatus();
            if (status.fullName) {
                setFormData(prev => ({
                    ...prev,
                    fullName: status.fullName || '',
                    studentId: status.studentId || '',
                    currentSemester: status.currentSemester || 1
                }));
            }
        } catch (error) {
            // Ignore - just use empty form
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ tên';
        }

        if (!formData.studentId.trim()) {
            newErrors.studentId = 'Vui lòng nhập MSSV';
        } else if (!/^[A-Z]{2}\d{4,6}$/i.test(formData.studentId.trim())) {
            newErrors.studentId = 'MSSV không đúng định dạng (VD: SE1234)';
        }

        if (!formData.specializationId) {
            newErrors.specializationId = 'Vui lòng chọn chuyên ngành';
        }

        if (formData.currentSemester < 1 || formData.currentSemester > 9) {
            newErrors.currentSemester = 'Kỳ học phải từ 1-9';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            const result = await onboardingService.completeProfile({
                fullName: formData.fullName.trim(),
                studentId: formData.studentId.trim().toUpperCase(),
                specializationId: formData.specializationId,
                currentSemester: formData.currentSemester,
                phone: formData.phone.trim() || undefined,
                learningStyle: formData.learningStyle || undefined
            });

            if (result.success) {
                toast.success('Đã lưu thông tin thành công!');
                navigate('/onboarding/transcript');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card profile-card">
                <div className="onboarding-header">
                    <div className="step-indicator">
                        <span className="step active">1</span>
                        <span className="step-line" />
                        <span className="step">2</span>
                        <span className="step-line" />
                        <span className="step">3</span>
                    </div>
                    <h2>Thông tin cá nhân</h2>
                    <p>Để AI cá nhân hóa nội dung học tập cho bạn</p>
                </div>

                <form onSubmit={handleSubmit} className="onboarding-form">
                    <div className="form-group">
                        <label>
                            <User size={18} />
                            Họ và tên
                        </label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Nguyễn Văn A"
                            className={errors.fullName ? 'error' : ''}
                        />
                        {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                    </div>

                    <div className="form-group">
                        <label>
                            <GraduationCap size={18} />
                            Mã số sinh viên (MSSV)
                        </label>
                        <input
                            type="text"
                            value={formData.studentId}
                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
                            placeholder="SE1234"
                            className={errors.studentId ? 'error' : ''}
                        />
                        {errors.studentId && <span className="error-text">{errors.studentId}</span>}
                    </div>

                    <div className="form-group">
                        <label>
                            <GraduationCap size={18} />
                            Chuyên ngành
                        </label>
                        <select
                            value={formData.specializationId}
                            onChange={(e) => setFormData({ ...formData, specializationId: Number(e.target.value) })}
                            className={errors.specializationId ? 'error' : ''}
                        >
                            <option value={0}>-- Chọn chuyên ngành --</option>
                            {specializations.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.code})
                                </option>
                            ))}
                        </select>
                        {errors.specializationId && <span className="error-text">{errors.specializationId}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>
                                <Calendar size={18} />
                                Kỳ học hiện tại
                            </label>
                            <select
                                value={formData.currentSemester}
                                onChange={(e) => setFormData({ ...formData, currentSemester: Number(e.target.value) })}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => (
                                    <option key={s} value={s}>Kỳ {s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                <Phone size={18} />
                                Số điện thoại (tùy chọn)
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="0912345678"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="onboarding-btn secondary"
                            onClick={() => navigate('/onboarding')}
                        >
                            <ArrowLeft size={18} />
                            Quay lại
                        </button>
                        <button type="submit" className="onboarding-btn primary" disabled={loading}>
                            {loading ? <Loader2 size={18} className="spin" /> : 'Tiếp tục'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
