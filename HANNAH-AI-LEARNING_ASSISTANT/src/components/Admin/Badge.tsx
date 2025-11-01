import React from 'react';

interface BadgeProps {
  type: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ type, children }) => {
  return <span className={`badge ${type}`}>{children}</span>;
};
