import React, { useState, useEffect, useRef } from 'react';
import { Bell, Loader2, CheckCircle } from 'lucide-react';
import notificationService from '../../service/notificationService';
import type { FlagNotification } from '../../service/notificationService';
import NotificationDetailModal from './NotificationDetailModal';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<FlagNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<FlagNotification | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside (including profile icon)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    useEffect(() => {
        loadNotifications();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications();
            setNotifications(data);
            // Count unread notifications
            const unread = data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: FlagNotification) => {
        // Mark as read
        await notificationService.markAsRead(notification.id);
        // Reload notifications to update unread count
        await loadNotifications();
        // Close dropdown and show detail modal
        setShowDropdown(false);
        setSelectedNotification(notification);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const formatDate = (dateString: string) => {
        // Server returns UTC time - ensure it's parsed as UTC
        // If no timezone indicator, append 'Z' to treat as UTC
        const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcDateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // Handle negative diff (future dates or clock skew)
        if (diff < 0) return 'Just now';

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    return (
        <div className="notification-bell-container" ref={containerRef}>
            <button className="notification-bell" onClick={toggleDropdown}>
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div className="notification-overlay" onClick={() => setShowDropdown(false)} />
                    <div className="notification-dropdown">
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            {loading && <Loader2 size={16} className="animate-spin" style={{ color: '#6b7280' }} />}
                        </div>

                        <div className="notification-list">
                            {notifications.length === 0 ? (
                                <div className="empty-notifications">
                                    <p>No new notifications</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="notification-icon"><CheckCircle size={20} style={{ color: '#22c55e' }} /></div>
                                        <div className="notification-content">
                                            <p className="notification-message">{notification.message}</p>
                                            <p className="notification-meta">
                                                <span className="resolver-name">{notification.resolvedByName}</span>
                                                <span className="notification-time"> · {formatDate(notification.resolvedAt)}</span>
                                            </p>
                                        </div>
                                        {!notification.isRead && <div className="unread-dot" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Detail Modal */}
            {selectedNotification && (
                <NotificationDetailModal
                    notification={selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                />
            )}
        </div>
    );
};

export default NotificationBell;