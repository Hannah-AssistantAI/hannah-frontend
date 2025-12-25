import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { flaggingApiService } from '../service/flaggingApi';
import { formatDateTimeVN } from '../utils/dateUtils';
import './NotificationBell.css';

interface Notification {
    id: number;
    flagId: number;
    message: string;
    documentTitle?: string;
    resolvedAt: string;
    resolvedByName?: string;
    isRead: boolean;
}

export const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            console.log('🔔 Loading notifications...');

            // Call API using service
            const data = await flaggingApiService.getMyNotifications();

            console.log('✅ Notifications data:', data);
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('💥 Error loading notifications:', error);
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            // TODO: Call API to mark notification as read
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            // TODO: Call API to mark all notifications as read
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div className="notification-bell-container">
            <button
                className="notification-bell-button"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {showDropdown && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                className="mark-all-read-btn"
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <Bell size={40} className="no-notifications-icon" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="notification-content">
                                        <p className="notification-message">
                                            {notification.message}
                                        </p>
                                        {notification.resolvedByName && (
                                            <p className="notification-faculty">
                                                ✅ Resolved by: <strong>{notification.resolvedByName}</strong>
                                            </p>
                                        )}
                                        {notification.documentTitle && (
                                            <p className="notification-document">
                                                📄 Attached: {notification.documentTitle}
                                            </p>
                                        )}
                                        <span className="notification-time">
                                            {formatDateTimeVN(notification.resolvedAt)}
                                        </span>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="unread-indicator"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
