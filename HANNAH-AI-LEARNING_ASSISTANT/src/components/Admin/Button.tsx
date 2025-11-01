import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'success' | 'danger' | 'outline';
  icon?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  icon, 
  children, 
  onClick,
  type = 'button',
  disabled = false,
  style
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={style}
    >
      {icon && <i className={icon}></i>}
      {children}
    </button>
  );
};