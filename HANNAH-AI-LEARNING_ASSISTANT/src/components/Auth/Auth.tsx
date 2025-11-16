import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Auth: React.FC<AuthProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const navigate = useNavigate();
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
    setLoginError(null); // Keep this to clear previous errors from the form
    try {
      const user = await login(email, password);
      toast.success('Đăng nhập thành công!', {
        duration: 3000,
        icon: '🎉',
      });

      // Close modal first
      onClose();

      // Redirect based on user role (case-insensitive comparison)
      const userRole = user.role.toLowerCase();
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'faculty') {
        navigate('/faculty');
      }
      // For students or other roles, just close the modal and stay on current page
    } catch (error: any) {
      const errorMessage = error.message || 'Email hoặc mật khẩu không đúng.';
      toast.error(errorMessage, {
        duration: 4000,
        icon: '❌',
      });
      setLoginError(errorMessage); // Also set local error for inline display
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSuccess = () => {
    // Switch to login tab after successful registration
    setActiveTab('login');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="450px">
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
