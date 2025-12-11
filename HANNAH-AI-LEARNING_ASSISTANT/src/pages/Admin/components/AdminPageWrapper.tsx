import React, { useEffect } from 'react';
import './AdminPageWrapper.css';

interface AdminPageWrapperProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'classic' | 'modern'; // classic = white bg, modern = gradient
}

const AdminPageWrapper: React.FC<AdminPageWrapperProps> = ({
  children,
  title,
  className = '',
  variant = 'classic'
}) => {
  // Force light theme for Admin pages
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);
  // For classic variant, render title outside content
  if (variant === 'classic') {
    return (
      <div className={`admin-page-wrapper admin-page-wrapper--${variant} ${className}`}>
        {title && (
          <h2 className={`admin-page-title admin-page-title--${variant}`}>
            {title}
          </h2>
        )}
        <div className="admin-page-content">
          {children}
        </div>
      </div>
    );
  }

  // For modern variant, render title inside content with custom styling
  return (
    <div className={`admin-page-wrapper admin-page-wrapper--${variant} ${className}`}>
      <div className="admin-page-content">
        {title && (
          <div className="max-w-[1800px] mx-auto px-6 pt-6 pb-3 border-b-2 border-gray-200">
            <h2 className={`admin-page-title admin-page-title--${variant}`}>
              {title}
            </h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default AdminPageWrapper;
