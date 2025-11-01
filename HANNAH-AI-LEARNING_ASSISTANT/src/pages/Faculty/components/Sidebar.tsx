import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { MessageSquare, FileText, BarChart3, HelpCircle, TrendingDown, ChevronDown, ChevronRight } from "lucide-react";
import { useFacultyContext } from "../../../contexts/FacultyContext";
import ReusableSidebar from "../../../components/Sidebar/Sidebar";

interface SubMenuItem {
  path: string;
  label: string;
}

interface MenuItem {
  path: string;
  label: string;
  badge: number | null;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  subItems?: SubMenuItem[];
}

interface FacultySidebarContentProps {
  isCollapsed?: boolean;
}

const FacultySidebarContent: React.FC<FacultySidebarContentProps> = ({
  isCollapsed = false,
}) => {
  const { flaggedConversationsCount } = useFacultyContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const menuItems: MenuItem[] = [
    {
      path: '/faculty/faq',
      label: 'Quản lý câu hỏi thường gặp',
      badge: null,
      description: 'Quản lý FAQ và câu hỏi thường gặp',
      icon: HelpCircle
    },
    {
      path: "/faculty/conversations",
      label: "Giám sát hội thoại",
      badge: flaggedConversationsCount > 0 ? flaggedConversationsCount : null,
      description: "Các hội thoại cần xem xét",
      icon: MessageSquare,
    },
    {
      path: "/faculty/materials",
      label: "Tài liệu học tập",
      badge: null,
      description: "Quản lý tài liệu, kết quả học tập và thách thức",
      icon: FileText,
      subItems: [
        { path: "/faculty/materials/documents", label: "Tài liệu" },
        { path: "/faculty/materials/outcomes", label: "Kết quả học tập" },
        { path: "/faculty/materials/challenges", label: "Thách thức thường gặp" }
      ]
    },
    {
      path: "/faculty/analytics",
      label: "Lỗ hổng kiến thức",
      badge: null,
      description: "Phân tích lỗ hổng kiến thức từ quiz",
      icon: TrendingDown,
    },
    // {
    //   path: "/faculty/questions",
    //   label: "Thống kê câu hỏi",
    //   badge: null,
    //   description: "Thống kê và xu hướng câu hỏi",
    //   icon: BarChart3,
    // },
  ];

  return (
    <div className="nav-section">
      {!isCollapsed && <span className="nav-section-title">MENU</span>}
      {menuItems.map((item) => {
        const IconComponent = item.icon;
        const isExpanded = expandedItems.includes(item.path);
        const hasSubItems = item.subItems && item.subItems.length > 0;

        return (
          <div key={item.path}>
            {/* Main menu item */}
            {hasSubItems ? (
              <div
                className="sidebar-link"
                onClick={() => toggleExpand(item.path)}
                style={{ cursor: 'pointer' }}
                title={isCollapsed ? item.label : item.description}
              >
                <IconComponent size={20} />
                {!isCollapsed && (
                  <>
                    <span className="sidebar-label">{item.label}</span>
                    <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                      {item.badge !== null && (
                        <span className="sidebar-badge">{item.badge}</span>
                      )}
                      {isExpanded ? (
                        <ChevronDown size={16} style={{ marginLeft: "8px" }} />
                      ) : (
                        <ChevronRight size={16} style={{ marginLeft: "8px" }} />
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <NavLink
                to={item.path}
                className="sidebar-link"
                title={isCollapsed ? item.label : item.description}
              >
                <IconComponent size={20} />
                {!isCollapsed && (
                  <>
                    <span className="sidebar-label">{item.label}</span>
                    {item.badge !== null && (
                      <div style={{ display: "flex", justifyContent: "right" }}>
                        <span className="sidebar-badge">{item.badge}</span>
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            )}

            {/* Sub menu items */}
            {hasSubItems && isExpanded && !isCollapsed && (
              <div style={{ paddingLeft: "40px" }}>
                {item.subItems!.map((subItem) => (
                  <NavLink
                    key={subItem.path}
                    to={subItem.path}
                    className="sidebar-link"
                    style={{ 
                      fontSize: "0.9em",
                      paddingTop: "8px",
                      paddingBottom: "8px"
                    }}
                  >
                    <span className="sidebar-label">{subItem.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const FacultySidebar: React.FC = () => {
  return (
    <ReusableSidebar title="Hannah" subtitle="Trang giảng viên">
      <FacultySidebarContent />
    </ReusableSidebar>
  );
};

export default FacultySidebar;
