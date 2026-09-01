import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UnitsPage from "./pages/UnitsPage";  
import MaintenancePage from "./pages/MaintenancePage";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />
{/* 
          <Route
            path="/properties"
            element={
              <div>Properties coming next.</div>
            }
          /> */}

          <Route
            path="/units"
            element={<UnitsPage />}
          />

          <Route
            path="/maintenance"
            element={<MaintenancePage />}
          />

          <Route
            path="/rent"
            element={
              <div>Rent coming next.</div>
            }
          />

          <Route
            path="/rent/alerts"
            element={
              <div>Rent alerts coming next.</div>
            }
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;