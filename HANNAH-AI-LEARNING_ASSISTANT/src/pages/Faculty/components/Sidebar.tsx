import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { MessageSquare, FileText, BarChart3, HelpCircle, TrendingDown, ChevronDown, ChevronRight, User, Flag } from "lucide-react";
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
      label: 'Manage FAQs',
      badge: null,
      description: 'Manage FAQs and frequently asked questions',
      icon: HelpCircle
    },
    {
      path: "/faculty/materials",
      label: "Learning Materials",
      badge: null,
      description: "Manage materials, learning outcomes and challenges",
      icon: FileText,
      subItems: [
        { path: "/faculty/materials/documents", label: "Documents" },
        { path: "/faculty/materials/outcomes", label: "Learning Outcomes" },
        { path: "/faculty/materials/challenges", label: "Common Challenges" }
      ]
    },
    {
      path: "/faculty/analytics",
      label: "Knowledge Gaps",
      badge: null,
      description: "Analyze knowledge gaps from quizzes",
      icon: TrendingDown,
    },
    {
      path: "/faculty/assigned-flags",
      label: "Assigned Flags",
      badge: null,
      description: "Review flagged content assigned to you",
      icon: Flag,
      subItems: [
        { path: "/faculty/assigned-flags/messages", label: "Flagged Messages" },
        { path: "/faculty/assigned-flags/quizzes", label: "Flagged Quizzes" }
      ]
    },
    // {
    //   path: "/faculty/questions",
    //   label: "Question Statistics",
    //   badge: null,
    //   description: "Question statistics and trends",
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

const FacultySidebar: React.FC<any> = (props) => {
  return (
    <ReusableSidebar title="Hannah" subtitle="Lecturer page">
      <FacultySidebarContent {...props} />
    </ReusableSidebar>
  );
};

export default FacultySidebar;
