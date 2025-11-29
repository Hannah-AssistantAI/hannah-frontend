import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, Settings, Book, ChevronDown, ChevronRight, Key, Monitor, MessageSquare, Flag } from 'lucide-react';
import ReusableSidebar from '../../../components/Sidebar/Sidebar';
import '../style.css';

interface AdminSidebarContentProps {
  isCollapsed?: boolean;
}

const AdminSidebarContent: React.FC<AdminSidebarContentProps> = ({ isCollapsed = false }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const location = useLocation();

  // Auto-toggle Configuration submenu based on current route
  useEffect(() => {
    const isConfigRoute = location.pathname.startsWith('/admin/configuration')
      || location.pathname.startsWith('/admin/system-monitoring/api-keys');
    setIsConfigOpen(isConfigRoute);
  }, [location.pathname]);

  const toggleConfig = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isCollapsed) setIsConfigOpen(!isConfigOpen);
  };

  return (
    <div className="nav-section">
      {!isCollapsed && <span className="nav-section-title">MENU</span>}
      <NavLink
        to="/admin/course-management"
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        title={isCollapsed ? "Course Management" : ""}
      >
        <Book size={20} />
        {!isCollapsed && <span className="sidebar-label">Course Management</span>}
      </NavLink>

      {/* <NavLink to="/admin/dashboard" className="sidebar-link" title={isCollapsed ? "Tổng quan" : ""}>
        <Users size={20} />
        {!isCollapsed && <span className="sidebar-label">Tổng quan</span>}
      </NavLink> */}
      <NavLink
        to="/admin/user-management"
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        title={isCollapsed ? "User Management" : ""}
      >
        <Users size={20} />
        {!isCollapsed && <span className="sidebar-label">User Management</span>}
      </NavLink>
      <NavLink
        to="/admin/custom-messages"
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        title={isCollapsed ? "Custom Messages" : ""}
      >
        <MessageSquare size={20} />
        {!isCollapsed && <span className="sidebar-label">Custom Messages</span>}
      </NavLink>
      <NavLink
        to="/admin/flagged-quizzes"
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        title={isCollapsed ? "Flagged Quizzes" : ""}
      >
        <Flag size={20} />
        {!isCollapsed && <span className="sidebar-label">Flagged Quizzes</span>}
      </NavLink>
      <NavLink
        to="/admin/flagged-items"
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        title={isCollapsed ? "Flagged Items" : ""}
      >
        <Flag size={20} />
        {!isCollapsed && <span className="sidebar-label">Flagged Items</span>}
      </NavLink>
      <div>
        <a
          href="#"
          className={`sidebar-link sidebar-toggle ${isConfigOpen ? 'active' : ''}`}
          onClick={toggleConfig}
          title={isCollapsed ? "Configuration" : ""}
        >
          <Settings size={20} />
          {!isCollapsed && <span className="sidebar-label">Configuration</span>}
          {!isCollapsed && (isConfigOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
        </a>

        {!isCollapsed && (
          <div className={`sidebar-submenu ${isConfigOpen ? 'open' : ''}`}>
            <NavLink
              to="/admin/system-monitoring/api-keys"
              className={({ isActive }) => `sidebar-sublink${isActive ? ' active' : ''}`}
            >
              <Key size={18} />
              <span>Integration Settings</span>
            </NavLink>
            <NavLink
              to="/admin/configuration"
              className={({ isActive }) => `sidebar-sublink${isActive ? ' active' : ''}`}
            >
              <Settings size={18} />
              <span>System Configuration</span>
            </NavLink>
          </div>
        )}
      </div>
      {/* <div className="sidebar-group">
        <a
          href="#"
          className={`sidebar-link sidebar-toggle ${isMonitoringOpen ? 'active' : ''}`}
          onClick={toggleMonitoring}
          title={isCollapsed ? "Giám sát Hệ thống" : ""}
        >
          <BarChart2 size={20} />
          {!isCollapsed && <span className="sidebar-label">Giám sát Hệ thống</span>}
          {!isCollapsed && (isMonitoringOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
        </a>

        {!isCollapsed && (
          <div className={`sidebar-submenu ${isMonitoringOpen ? 'open' : ''}`}>
            <NavLink to="/admin/system-monitoring/api-keys" className="sidebar-sublink">
              <Key size={18} />
              <span>Khóa API</span>
            </NavLink>
            <NavLink to="/admin/system-monitoring/usage" className="sidebar-sublink">
              <Activity size={18} />
              <span>Mức Sử Dụng</span>
            </NavLink>
          </div>
        )}
      </div> */}
      <NavLink
        to="/admin/system-settings"
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        title={isCollapsed ? "System Monitoring" : ""}
      >
        <Monitor size={20} />
        {!isCollapsed && <span className="sidebar-label">System Monitoring</span>}
      </NavLink>


      {/* <NavLink to="/admin/semester-management" className="sidebar-link" title={isCollapsed ? "Quản lý Kỳ học" : ""}>
        <Calendar size={20} />
        {!isCollapsed && <span className="sidebar-label">Quản lý Kỳ học</span>}
      </NavLink> */}
    </div>
  );
};

const AdminSidebar: React.FC<any> = (props) => {
  return (
    <ReusableSidebar title="Hannah" subtitle="Admin Panel">
      <AdminSidebarContent {...props} />
    </ReusableSidebar>
  );
};

export default AdminSidebar;
