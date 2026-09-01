import {
  LayoutDashboard,
//   Building2,
  Home,
  Wrench,
  IndianRupee,
  Bell,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
//   {
//     label: "Properties",
//     path: "/properties",
//     icon: Building2,
//   },
  {
    label: "Units",
    path: "/units",
    icon: Home,
  },
  {
    label: "Maintenance",
    path: "/maintenance",
    icon: Wrench,
  },
  {
    label: "Rent",
    path: "/rent",
    icon: IndianRupee,
  },
  {
    label: "Rent Alerts",
    path: "/rent/alerts",
    icon: Bell,
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">P</div>

        <div>
          <strong>PropertyHub</strong>
          <span>Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-title">Workspace</p>

        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="user-info">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={logout}
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}