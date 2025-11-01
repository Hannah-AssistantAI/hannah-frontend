import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, BarChart2, Settings, Book, ChevronDown, ChevronRight, Activity, Key, Monitor, Calendar } from 'lucide-react';
import ReusableSidebar from '../../../components/Sidebar/Sidebar';
import '../style.css';

interface AdminSidebarContentProps {
  isCollapsed?: boolean;
}

const AdminSidebarContent: React.FC<AdminSidebarContentProps> = ({ isCollapsed = false }) => {
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(false);

  const toggleMonitoring = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isCollapsed) {
      setIsMonitoringOpen(!isMonitoringOpen);
    }
  };

  return (
    <div className="nav-section">
      {!isCollapsed && <span className="nav-section-title">MENU</span>}
      {/* <NavLink to="/admin/dashboard" className="sidebar-link" title={isCollapsed ? "Tổng quan" : ""}>
        <Users size={20} />
        {!isCollapsed && <span className="sidebar-label">Tổng quan</span>}
      </NavLink> */}
      <NavLink to="/admin/user-management" className="sidebar-link" title={isCollapsed ? "Quản lý Người dùng" : ""}>
        <Users size={20} />
        {!isCollapsed && <span className="sidebar-label">Quản lý Người dùng</span>}
      </NavLink>
            <NavLink to="/admin/system-monitoring/api-keys" className="sidebar-link" title={isCollapsed ? "Cấu hình Tích hợp" : ""}>
        <Activity size={20} />
        {!isCollapsed && <span className="sidebar-label">Cấu hình Tích hợp</span>}
      </NavLink>
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
      <NavLink to="/admin/configuration" className="sidebar-link" title={isCollapsed ? "Cấu hình Hệ thống" : ""}>
        <Settings size={20} />
        {!isCollapsed && <span className="sidebar-label">Cấu hình Hệ thống</span>}
      </NavLink>
      <NavLink to="/admin/system-settings" className="sidebar-link" title={isCollapsed ? "Giám sát Hệ thống" : ""}>
        <Monitor size={20} />
        {!isCollapsed && <span className="sidebar-label">Giám sát Hệ thống</span>}
      </NavLink>
      <NavLink to="/admin/semester-management" className="sidebar-link" title={isCollapsed ? "Quản lý Kỳ học" : ""}>
        <Calendar size={20} />
        {!isCollapsed && <span className="sidebar-label">Quản lý Kỳ học</span>}
      </NavLink>
      <NavLink to="/admin/course-management" className="sidebar-link" title={isCollapsed ? "Quản lý Lộ trình" : ""}>
        <Book size={20} />
        {!isCollapsed && <span className="sidebar-label">Quản lý Lộ trình</span>}
      </NavLink>
    </div>
  );
};

const AdminSidebar: React.FC = () => {
  return (
    <ReusableSidebar title="Hannah" subtitle="Trang quản trị">
      <AdminSidebarContent />
    </ReusableSidebar>
  );
};

export default AdminSidebar;
