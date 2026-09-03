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
import RentPage from "./pages/RentPage";
import RentAlertsPage from "./pages/RentAlertsPage";

function App() {
  const { isAuthenticated, user } = useAuth();
  const authorizedHome =
    user?.role === "CONTRACTOR"
      ? "/maintenance"
      : "/dashboard";

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate
              to={authorizedHome}
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["MANAGER"]}
                redirectTo="/maintenance"
              />
            }
          >
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
              path="/rent"
              element={<RentPage />}
            />

            <Route
              path="/rent/alerts"
              element={<RentAlertsPage />}
            />

            <Route
              path="/rent-alerts"
              element={
                <Navigate
                  to="/rent/alerts"
                  replace
                />
              }
            />
          </Route>

          <Route
            path="/maintenance"
            element={<MaintenancePage />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? authorizedHome
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
