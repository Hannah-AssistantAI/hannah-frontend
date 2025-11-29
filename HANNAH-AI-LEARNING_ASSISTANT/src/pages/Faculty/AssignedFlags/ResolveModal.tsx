import React, { useState } from 'react';
import flaggingService from '../../../service/flaggingService';
import './ResolveModal.css';

interface ResolveModalProps {
    flagId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const ResolveModal: React.FC<ResolveModalProps> = ({ flagId, onClose, onSuccess }) => {
    const [resolutionMessage, setResolutionMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!resolutionMessage.trim()) {
            setError('Vui lòng nhập giải pháp và thông báo cho học sinh');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Gửi cùng message cho cả 2 fields
            await flaggingService.resolveFlag(flagId, {
                knowledgeGapFix: resolutionMessage.trim(),
                studentNotification: resolutionMessage.trim()
            });

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể giải quyết báo cáo');
            console.error('Error resolving flag:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="resolve-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>✅ Giải Quyết Flagged Message</h2>
                    <button className="close-button" onClick={onClose} disabled={loading}>✕</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            <span>⚠️ {error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label>
                            💬 Giải pháp & Thông báo cho học sinh <span className="required">*</span>
                        </label>
                        <textarea
                            value={resolutionMessage}
                            onChange={(e) => setResolutionMessage(e.target.value)}
                            className="form-textarea"
                            placeholder="Nhập giải pháp và thông báo cho học sinh. Ví dụ: Cảm ơn bạn đã báo cáo! Tôi đã bổ sung thêm tài liệu về chủ đề này. Bạn có thể tham khảo trong phần Resources..."
                            rows={6}
                            disabled={loading}
                        />
                        <small className="form-hint">
                            ℹ️ Message này sẽ được lưu lại làm ghi chú nội bộ <strong>VÀ</strong> gửi trực tiếp cho học sinh qua notification
                        </small>
                        <small className="form-hint" style={{ color: resolutionMessage.length > 500 ? '#f44336' : '#666' }}>
                            {resolutionMessage.length} / 1000 ký tự
                        </small>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={loading || !resolutionMessage.trim()}
                    >
                        {loading ? '⏳ Đang xử lý...' : '✅ Giải Quyết & Gửi Thông Báo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResolveModal;
