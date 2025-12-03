import React from 'react';
import { X, Lock } from 'lucide-react';
import './LoginRequiredModal.css';

interface LoginRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ isOpen, onClose, onLogin }) => {
    if (!isOpen) return null;

    return (
        <div className="login-required-overlay" onClick={onClose}>
            <div className="login-required-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="login-modal-close" onClick={onClose} aria-label="Close">
                    <X size={24} />
                </button>

                {/* Icon */}
                <div className="login-modal-icon-wrapper">
                    <div className="login-modal-icon-bg">
                        <Lock className="login-modal-icon" size={48} />
                    </div>
                </div>

                {/* Content */}
                <div className="login-modal-content">
                    <h2 className="login-modal-title">Yêu cầu đăng nhập</h2>
                    <p className="login-modal-description">
                        Bạn cần đăng nhập để sử dụng tính năng này.
                        Hãy đăng nhập hoặc tạo tài khoản mới để tiếp tục khám phá Hannah!
                    </p>
                </div>

                {/* Actions */}
                <div className="login-modal-actions">
                    <button className="login-modal-button cancel" onClick={onClose}>
                        Để sau
                    </button>
                    <button className="login-modal-button primary" onClick={onLogin}>
                        Đăng nhập ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginRequiredModal;
