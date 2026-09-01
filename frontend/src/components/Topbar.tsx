import { Bell, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/properties": "Properties",
  "/units": "Units",
  "/maintenance": "Maintenance",
  "/rent": "Rent",
  "/rent/alerts": "Rent Alerts",
};

export default function Topbar() {
  const location = useLocation();
  const { user } = useAuth();

  const title =
    pageTitles[location.pathname] ?? "Property Management";

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        <p>Manage your rental portfolio</p>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-button"
          aria-label="Search"
        >
          <Search size={19} />
        </button>

        <button
          type="button"
          className="icon-button notification-button"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-user">
          <div className="user-avatar small">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}