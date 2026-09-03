import {
  Building2,
  ShieldCheck,
  Wrench,
  IndianRupee,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError(
        "Email and password are required."
      );
      return;
    }

    try {
      await login({
        email: email.trim(),
        password,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in."
      );
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-showcase">
          <div className="login-brand">
            <img
              src="/logo.jpg"
              alt="PropertyHub"
              className="login-brand-logo"
            />

            <span>PropertyHub</span>
          </div>

          <div className="login-showcase-content">
            <span className="login-eyebrow">
              PROPERTY MANAGEMENT
            </span>

            <h1>
              Everything you need to
              <span>
                {" "}
                manage your properties.
              </span>
            </h1>

            <p>
              Manage units, maintenance requests,
              contractors and rent payments from
              one simple workspace.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-icon">
  <Building2 size={18} />
</div>

                <div>
                  <strong>
                    Property Management
                  </strong>

                  <span>
                    Keep your units and tenants
                    organized.
                  </span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon">
                  <Wrench size={18} />
                </div>

                <div>
                  <strong>
                    Maintenance Tracking
                  </strong>

                  <span>
                    Track requests from report
                    to resolution.
                  </span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon">
                  <IndianRupee size={18} />
                </div>

                <div>
                  <strong>
                    Rent & Payments
                  </strong>

                  <span>
                    Monitor rent collection and
                    outstanding dues.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-showcase-footer">
            <ShieldCheck size={15} />

            <span>
              Secure role-based access
            </span>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-mobile-brand">
            <img
              src="/logo.jpg"
              alt="PropertyHub"
              className="login-mobile-logo"
            />

            <span>PropertyHub</span>
          </div>

          <div className="login-card">
            <div className="login-header">
              <span className="login-welcome">
                Welcome back
              </span>

              <h2>
                Sign in to your account
              </h2>

              <p>
                Enter your credentials to access
                the management dashboard.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >
              <div className="login-field">
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="manager@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="form-error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
              >
                {isLoading
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            <p className="login-security-note">
              <ShieldCheck size={14} />

              <span>
                Your session is securely protected.
              </span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
