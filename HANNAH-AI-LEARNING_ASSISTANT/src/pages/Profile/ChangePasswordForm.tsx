import React, { useState } from 'react';
import authService from '../../service/authService';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Shield, Key, CheckCircle, Loader2 } from 'lucide-react';
import './ChangePasswordForm.css';

const ChangePasswordForm: React.FC = () => {
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const toggleShowPassword = (name: string) => {
        setShowPasswords(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!passwords.currentPassword) newErrors.currentPassword = 'Mật khẩu hiện tại là bắt buộc.';
        if (!passwords.newPassword) {
            newErrors.newPassword = 'Mật khẩu mới là bắt buộc.';
        } else if (passwords.newPassword.length < 6) {
            newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await authService.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
                confirmPassword: passwords.confirmPassword
            });
            toast.success('Đổi mật khẩu thành công!');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            const errorMessage = error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getFieldLabel = (key: string) => {
        switch (key) {
            case 'currentPassword': return 'Mật khẩu hiện tại';
            case 'newPassword': return 'Mật khẩu mới';
            case 'confirmPassword': return 'Xác nhận mật khẩu mới';
            default: return key;
        }
    };

    const getFieldIcon = (key: string) => {
        switch (key) {
            case 'currentPassword': return <Lock size={18} />;
            case 'newPassword': return <Key size={18} />;
            case 'confirmPassword': return <CheckCircle size={18} />;
            default: return <Lock size={18} />;
        }
    };

    return (
        <div className="cpf-container">
            <div className="cpf-card">
                {/* Header with icon */}
                <div className="cpf-header">
                    <div className="cpf-header-icon">
                        <Shield size={28} />
                    </div>
                    <div className="cpf-header-text">
                        <h2 className="cpf-title">Đổi mật khẩu</h2>
                        <p className="cpf-subtitle">Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
                    </div>
                </div>

                {/* Form */}
                <form className="cpf-form" onSubmit={handleSubmit}>
                    <div className="cpf-fields">
                        {Object.keys(passwords).map((key) => (
                            <div className={`cpf-field ${errors[key] ? 'cpf-field-error' : ''}`} key={key}>
                                <label className="cpf-label">
                                    {getFieldIcon(key)}
                                    <span>{getFieldLabel(key)}</span>
                                </label>
                                <div className="cpf-input-wrapper">
                                    <input
                                        type={showPasswords[key] ? 'text' : 'password'}
                                        name={key}
                                        className="cpf-input"
                                        value={passwords[key as keyof typeof passwords]}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        placeholder={`Nhập ${getFieldLabel(key).toLowerCase()}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleShowPassword(key)}
                                        className="cpf-toggle-btn"
                                        tabIndex={-1}
                                    >
                                        {showPasswords[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors[key] && (
                                    <span className="cpf-error">{errors[key]}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Password requirements hint */}
                    <div className="cpf-hint">
                        <p>Mật khẩu phải có ít nhất 6 ký tự</p>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="cpf-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="cpf-spinner" />
                                <span>Đang xử lý...</span>
                            </>
                        ) : (
                            <>
                                <Lock size={18} />
                                <span>Cập nhật mật khẩu</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordForm;
