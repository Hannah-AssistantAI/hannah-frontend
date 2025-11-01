import React from 'react';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  sublabel?: string;
  color: 'purple' | 'pink' | 'blue' | 'green';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  sublabel,
  color,
  onClick,
}) => {
  return (
    <div 
      className={`stat-card ${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-icon">
        <i className={icon}></i>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sublabel && <div className="stat-sublabel">{sublabel}</div>}
    </div>
  );
};