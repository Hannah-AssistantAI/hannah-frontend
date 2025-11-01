import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max = 100, 
  color = 'primary',
  showLabel = false 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div style={{ width: '100%' }}>
      <div className="progress-bar">
        <div 
          className={`progress-fill ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {showLabel && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {value} / {max}
        </div>
      )}
    </div>
  );
};