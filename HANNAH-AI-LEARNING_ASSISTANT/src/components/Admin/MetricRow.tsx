import React, { type ReactNode } from 'react';
import { ProgressBar } from './ProgressBar';

interface MetricRowProps {
  label: string;
  value: string | number | ReactNode;
  progress?: {
    value: number;
    max: number;
    color?: 'primary' | 'success' | 'warning' | 'danger';
  };
}

export const MetricRow: React.FC<MetricRowProps> = ({ label, value, progress }) => {
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      {progress && (
        <div style={{ flex: 1, margin: '0 20px' }}>
          <ProgressBar value={progress.value} max={progress.max} color={progress.color} />
        </div>
      )}
      <span className="metric-value">{value}</span>
    </div>
  );
};