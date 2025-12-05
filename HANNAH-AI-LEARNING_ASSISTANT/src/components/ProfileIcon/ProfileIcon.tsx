import React, { useState, useRef, useCallback } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './ProfileIcon.css';
import { useNavigate } from 'react-router-dom';

interface ProfileIconProps {
  className?: string;
}

const ProfileIcon: React.FC<ProfileIconProps> = React.memo(({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('ProfileIcon rendered, dropdown state:', isDropdownOpen);

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Profile clicked, current state:', isDropdownOpen);
    setIsDropdownOpen(prev => !prev);
  }, [isDropdownOpen]);

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    logout();
    setIsDropdownOpen(false);
    navigate("/");
  };

  const handleProfileView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    console.log('Checking user role for navigation:', user?.role); // For debugging
    if (user?.role === 'student') { // Corrected to lowercase 'student'
      navigate('/profile');
    } else {
      // For Admin/Faculty, profile is in their layout, so no global navigation needed here.
      console.log('Not a student, role:', user?.role);
    }
  };

  if (!user) {
    return null;
  }

  // Get first letters of name for avatar
  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') {
      return 'U'; // Default fallback
    }
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`profile-icon-container ${className}`} ref={dropdownRef}>
      {/* Profile Avatar */}
      <div
        className="profile-avatar"
        onMouseDown={handleProfileClick}
        role="button"
        tabIndex={0}
        aria-label="User profile menu"
      >
        <div className="avatar-circle">
          {getInitials(user.fullName)}
        </div>
      </div>

      {/* Dropdown Menu */}
      <div
        className="profile-dropdown"
        style={{
          display: isDropdownOpen ? 'block' : 'none',
          opacity: isDropdownOpen ? 1 : 0,
          pointerEvents: isDropdownOpen ? 'auto' : 'none'
        }}
      >

        <div className="dropdown-divider"></div>

        <div className="dropdown-menu">
          <button
            className="dropdown-item"
            onClick={handleProfileView}
          >
            <User size={16} />
            <span>Profile</span>
          </button>

          <div className="dropdown-divider"></div>

          <button
            className="dropdown-item logout-item"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProfileIcon;
