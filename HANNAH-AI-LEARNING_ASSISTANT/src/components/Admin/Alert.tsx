import React from 'react';
import type { Alert as AlertType } from '../../types/index';

interface AlertProps {
  alert: AlertType;
}

export const Alert: React.FC<AlertProps> = ({ alert }) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'error':
        return 'fas fa-times-circle';
      case 'success':
        return 'fas fa-check-circle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-bell';
    }
  };

  return (
    <div className={`alert ${alert.type}`}>
      <div className="alert-icon">
        <i className={getAlertIcon()}></i>
      </div>
      <div className="alert-content">
        <div className="alert-message">
          <strong>{alert.message}</strong>
        </div>
        <div className="alert-time">
          <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
          {alert.time}
          {alert.details && (
            <>
              <span style={{ margin: '0 6px' }}>•</span>
              {alert.details}
            </>
          )}
        </div>
      </div>
    </div>
  );
};