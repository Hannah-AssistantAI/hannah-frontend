import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Share2 } from 'lucide-react';
import ProfileIcon from './ProfileIcon';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell/NotificationBell';
import './Header.css';

interface HeaderProps {
    onToggleHistory: () => void;
    showShareButton?: boolean;
    onShareClick?: () => void;
    showNotifications?: boolean;
    className?: string;
}

export const Header: React.FC<HeaderProps> = ({
    onToggleHistory,
    showShareButton = false,
    onShareClick,
    showNotifications = false,
    className = ''
}) => {
    const navigate = useNavigate();

    return (
        <header className={`app-header ${className}`}>
            <div className="app-header-left">
                <button
                    className="history-toggle-btn"
                    onClick={onToggleHistory}
                    aria-label="Lịch sử cuộc trò chuyện"
                    title="Lịch sử cuộc trò chuyện"
                >
                    <Menu size={20} />
                </button>
                <div className="app-logo" onClick={() => navigate('/learn')}>
                    <span className="app-logo-text">Hannah Assistant</span>
                </div>
                <img
                    src="/images/header/2021-FPTU-Logo.png"
                    alt="FPT University Logo"
                    className="header-logo-image"
                    onError={(e) => {
                        console.error('Logo failed to load:', e);
                        e.currentTarget.style.display = 'none';
                    }}
                />
            </div>
            <div className="app-header-right">
                {showShareButton && (
                    <button className="share-btn" onClick={onShareClick}>
                        <Share2 size={20} />
                        <span>Chia sẻ</span>
                    </button>
                )}
                {showNotifications && <NotificationBell />}
                <ThemeToggle />
                <ProfileIcon />
            </div>
        </header>
    );
};