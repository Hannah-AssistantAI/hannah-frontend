import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, User, Menu, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const Sidebar: React.FC<SidebarProps> = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getRoleInVietnamese = (role: string) => {
    switch (role.toLowerCase()) {
      case 'student':
        return 'Sinh viên';
      case 'faculty':
        return 'Giảng viên';
      case 'admin':
        return 'Quản trị viên';
      default:
        return role;
    }
  };

  const toggleSidebar = () => {
    console.log('🔵 Toggle clicked! Current state:', isCollapsed);
    setIsCollapsed(!isCollapsed);
    console.log('🟢 New state should be:', !isCollapsed);
  };

  // Add/remove class to body for layout adjustments (fallback for :has() selector)
  useEffect(() => {
    const body = document.body;
    if (isCollapsed) {
      body.classList.add('sidebar-collapsed');
    } else {
      body.classList.remove('sidebar-collapsed');
    }

    return () => {
      body.classList.remove('sidebar-collapsed');
    };
  }, [isCollapsed]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {isCollapsed ? (
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            title="Mở rộng sidebar"
            data-testid="sidebar-toggle-collapsed"
          >
            <Menu size={20} />
          </button>
        ) : (
          <>
            <div className="sidebar-logo">
              <GraduationCap size={28} className="logo-icon" />
              <div className="logo-text">
                <h2 className="sidebar-title">{title}</h2>
                <p className="sidebar-subtitle">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={toggleSidebar}
              title="Thu gọn sidebar"
              data-testid="sidebar-toggle-expanded"
            >
              <Menu size={20} />
            </button>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        {React.cloneElement(children as React.ReactElement, { isCollapsed } as any)}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <NavLink
            to={`/${user.role}/profile`}
            className={({ isActive }) => `sidebar-user${isActive ? ' active' : ''}`}
            title="Xem hồ sơ"
          >
            <div className="user-avatar">
              <User size={20} />
            </div>
            {!isCollapsed && (
              <div className="user-info">
                <p className="user-name">{user.fullName}</p>
                <p className="user-role">{getRoleInVietnamese(user.role)}</p>
              </div>
            )}
          </NavLink>
        )}
        <button
          className="logout-btn"
          onClick={handleLogout}
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
