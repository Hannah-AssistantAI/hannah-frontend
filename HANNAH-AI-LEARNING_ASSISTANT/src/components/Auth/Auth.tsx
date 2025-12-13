import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

// Error messages mapping for user-friendly feedback
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  ACCOUNT_INACTIVE: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
  EMAIL_NOT_VERIFIED: 'Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư của bạn.',
  TOO_MANY_REQUESTS: 'Bạn đã đăng nhập quá nhiều lần. Vui lòng đợi 5 phút.',
  NETWORK_ERROR: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau ít phút.',
  SERVICE_UNAVAILABLE: 'Hệ thống đang bảo trì. Vui lòng thử lại sau.',
  FORBIDDEN: 'Bạn không có quyền truy cập. Vui lòng liên hệ quản trị viên.',
  LOGIN_FAILED: 'Đăng nhập thất bại. Vui lòng thử lại.',
};

const Auth: React.FC<AuthProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleTabChange = (newTab: 'login' | 'register') => {
    if (newTab === activeTab || isLoading) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150);
  };

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      await login(email, password);
      toast.success('Đăng nhập thành công!');
      onClose(); // Close the modal. Home.tsx will handle the redirect.
    } catch (error: any) {
      // Map error code to user-friendly message
      const errorKey = error.message && error.message in ERROR_MESSAGES
        ? error.message
        : 'LOGIN_FAILED';
      const errorMessage = ERROR_MESSAGES[errorKey];

      toast.error(errorMessage);
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSuccess = () => {
    // Switch to login tab after successful registration
    setActiveTab('login');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="450px" closeOnOverlayClick={false}>
      <div className="auth-container">
        <div className={`auth-tabs ${activeTab === 'register' ? 'register-active' : ''}`}>
          <button
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
            disabled={isLoading || isTransitioning}
          >
            Đăng nhập
          </button>
          <button
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => handleTabChange('register')}
            disabled={isLoading || isTransitioning}
          >
            Đăng ký
          </button>
        </div>

        <div className="auth-content">
          <div
            className={`auth-form-container ${isTransitioning ? 'transitioning' : ''}`}
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateX(20px)' : 'translateX(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {activeTab === 'login' ? (
              <LoginForm onSubmit={handleLogin} isLoading={isLoading} apiError={loginError} />
            ) : (
              <RegisterForm onSuccess={handleRegisterSuccess} />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Auth;
