import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, FileText, ArrowRight, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './Onboarding.css';

export default function OnboardingTranscript() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = async (file: File) => {
        // Validate file type
        const validTypes = ['application/pdf', 'text/html', 'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

        if (!validTypes.includes(file.type) && !file.name.endsWith('.html')) {
            toast.error('Định dạng không hỗ trợ. Vui lòng dùng PDF, HTML hoặc Excel');
            return;
        }

        setLoading(true);
        try {
            // Use existing transcript upload API - correct endpoint
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/students/me/transcript/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                setUploaded(true);
                toast.success('Upload bảng điểm thành công!');
                // Wait a bit then navigate
                setTimeout(() => navigate('/onboarding/complete'), 1500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.error(errorData.message || 'Upload thất bại');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi upload');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="onboarding-header">
                    <div className="step-indicator">
                        <span className="step done">✓</span>
                        <span className="step-line" />
                        <span className="step active">2</span>
                        <span className="step-line" />
                        <span className="step">3</span>
                    </div>
                    <h2>Upload bảng điểm</h2>
                    <p>Giúp AI hiểu tiến độ và điểm mạnh/yếu của bạn</p>
                </div>

                {uploaded ? (
                    <div className="upload-success">
                        <CheckCircle size={64} color="#22c55e" />
                        <h3>Upload thành công!</h3>
                        <p>Đang chuyển hướng...</p>
                    </div>
                ) : (
                    <>
                        <label
                            className={`upload-area ${dragOver ? 'dragover' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                accept=".pdf,.html,.xls,.xlsx"
                                onChange={handleInputChange}
                                hidden
                            />
                            <div className="upload-icon">
                                {loading ? <Loader2 size={32} className="spin" /> : <Upload size={32} />}
                            </div>
                            <div className="upload-text">
                                <h3>{loading ? 'Đang xử lý...' : 'Kéo thả file hoặc click để chọn'}</h3>
                                <p>Hỗ trợ: PDF, HTML (FAP), Excel</p>
                            </div>
                        </label>

                        <div className="skip-hint">
                            <p>Bạn có thể bỏ qua bước này và upload sau</p>
                            <Link to="/onboarding/complete" className="skip-link">
                                Bỏ qua, tôi sẽ upload sau →
                            </Link>
                        </div>
                    </>
                )}

                <div className="form-actions" style={{ marginTop: 24 }}>
                    <button
                        className="onboarding-btn secondary"
                        onClick={() => navigate('/onboarding/profile')}
                        disabled={loading}
                    >
                        <ArrowLeft size={18} />
                        Quay lại
                    </button>
                    {!uploaded && (
                        <button
                            className="onboarding-btn primary"
                            onClick={() => navigate('/onboarding/complete')}
                            disabled={loading}
                        >
                            Bỏ qua
                            <ArrowRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
