import {
  LayoutDashboard,
  Home,
  Wrench,
  IndianRupee,
  Bell,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";
import { useEffect, useState } from "react";
import { getRentAlerts } from "../services/rent.service";

const navigation: {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["MANAGER"],
  },
  {
    label: "Units",
    path: "/units",
    icon: Home,
    roles: ["MANAGER"],
  },
  {
    label: "Maintenance",
    path: "/maintenance",
    icon: Wrench,
    roles: ["MANAGER", "CONTRACTOR"],
  },
  {
    label: "Rent",
    path: "/rent",
    icon: IndianRupee,
    roles: ["MANAGER"],
  },
  {
    label: "Rent Alerts",
    path: "/rent/alerts",
    icon: Bell,
    roles: ["MANAGER"],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const [rentAlertCount, setRentAlertCount] =
    useState(0);

  useEffect(() => {
    if (user?.role !== "MANAGER") {
      setRentAlertCount(0);
      return;
    }

    const loadRentAlertCount = async () => {
      try {
        const response = await getRentAlerts();
        setRentAlertCount(response.data.length);
      } catch {
        setRentAlertCount(0);
      }
    };

    loadRentAlertCount();

    window.addEventListener(
      "rent-alerts-updated",
      loadRentAlertCount
    );

    return () => {
      window.removeEventListener(
        "rent-alerts-updated",
        loadRentAlertCount
      );
    };
  }, [user?.role]);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img
          src="/logo.jpg"
          alt="PropertyHub"
          className="brand-logo"
        />

        <div>
          <strong>PropertyHub</strong>
          <span>Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-title">
          Workspace
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;

          if (
            !user ||
            !item.roles.includes(user.role)
          ) {
            return null;
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon
                size={19}
                strokeWidth={1.8}
              />

              <span>{item.label}</span>

              {item.path === "/rent/alerts" &&
                rentAlertCount > 0 && (
                  <span className="nav-alert-count">
                    {rentAlertCount > 99
                      ? "99+"
                      : rentAlertCount}
                  </span>
                )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name
              ?.charAt(0)
              .toUpperCase()}
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