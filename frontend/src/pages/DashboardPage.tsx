import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>

      <p>
        Welcome, {user?.name}.
      </p>

      <p>
        Role: {user?.role}
      </p>

      <button onClick={logout}>
        Logout
      </button>
    </main>
  );
}