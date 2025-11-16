import React, { useState } from 'react';
import authService from '../../service/authService';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';

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

    return (
        <div className="profile-card">
            <div className="profile-card-header">
                <h2 className="profile-card-title">Đổi mật khẩu</h2>
            </div>
            <form className="profile-card-body" onSubmit={handleSubmit}>
                <div className="profile-details">
                    {Object.keys(passwords).map((key) => (
                        <div className="profile-detail-item" key={key}>
                            <label className="profile-detail-label">
                                <Lock size={18} />
                                {key === 'currentPassword' ? 'Mật khẩu hiện tại' : key === 'newPassword' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu mới'}
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPasswords[key] ? 'text' : 'password'}
                                    name={key}
                                    className={`profile-detail-input ${errors[key] ? 'error' : ''}`}
                                    value={passwords[key as keyof typeof passwords]}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                                <button type="button" onClick={() => toggleShowPassword(key)} className="password-toggle-btn">
                                    {showPasswords[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors[key] && <span className="form-error">{errors[key]}</span>}
                        </div>
                    ))}
                </div>
                <div className="profile-card-footer">
                    <button type="submit" className="profile-save-btn" disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordForm;

