import React from 'react';
import './AdminPageWrapper.css';

interface AdminPageWrapperProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const AdminPageWrapper: React.FC<AdminPageWrapperProps> = ({ 
  children, 
  title, 
  className = '' 
}) => {
  return (
    <div className={`admin-page-wrapper ${className}`}>
      {title && (
        <h2 className="admin-page-title">
          {title}
        </h2>
      )}
      <div className="admin-page-content">
        {children}
      </div>
    </div>
  );
};

export default AdminPageWrapper;
