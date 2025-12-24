import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../service/authService';

interface RegisterFormProps {
  onSuccess: () => void; // Callback for successful registration
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();



    const newErrors = {
      name: '',
      username: '',
      email: '',
      password: ''
    };

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên phải có ít nhất 2 ký tự';
    }

    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);

    // If no errors, submit form
    if (!newErrors.name && !newErrors.username && !newErrors.email && !newErrors.password) {
      setIsLoading(true);

      try {
        // Call register API
        await authService.register({
          email: formData.email,
          username: formData.username.trim(),
          password: formData.password,
          fullName: formData.name.trim(),
          role: 'student', // Default role
        });

        // Registration successful
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.', {
          duration: 3000,
        });
        onSuccess();
      } catch (error: any) {
        console.error('Registration error:', error);

        // Handle API errors
        let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage, {
          duration: 4000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>


      <div className="form-group">
        <label htmlFor="register-name" className="form-label">
          Họ và tên
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="Nhập họ và tên"
          disabled={isLoading}
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="register-username" className="form-label">
          Tên đăng nhập
        </label>
        <input
          id="register-username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          className={`form-input ${errors.username ? 'error' : ''}`}
          placeholder="Nhập tên đăng nhập"
          disabled={isLoading}
        />
        {errors.username && <span className="form-error">{errors.username}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="register-email" className="form-label">
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="Nhập email của bạn"
          disabled={isLoading}
        />
        {errors.email && <span className="form-error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="register-password" className="form-label">
          Mật khẩu
        </label>
        <div className="password-input-wrapper">
          <input
            id="register-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Nhập mật khẩu"
            disabled={isLoading}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <span className="form-error">{errors.password}</span>}
      </div>



      <button
        type="submit"
        className="auth-button"
        disabled={isLoading}
      >
        {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>
    </form>
  );
};

export default RegisterForm;
