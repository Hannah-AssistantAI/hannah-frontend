import React, { type ReactNode } from 'react';

interface InfoBoxProps {
  children: ReactNode;
  icon?: string;
  style?: React.CSSProperties;
}

export const InfoBox: React.FC<InfoBoxProps> = ({ children, icon = 'fas fa-info-circle', style }) => {
  return (
    <div className="info-box" style={style}>
      <i className={icon}></i>
      {children}
    </div>
  );
};