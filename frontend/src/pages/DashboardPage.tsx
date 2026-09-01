import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  IndianRupee,
  RefreshCw,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getDashboard,
  type DashboardData,
} from "../services/dashboard.service";

const statusLabels: Record<string, string> = {
  REPORTED: "Reported",
  TRIAGED: "Triaged",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const statusColors: Record<string, string> = {
  REPORTED: "#f59e0b",
  TRIAGED: "#8b5cf6",
  SCHEDULED: "#3b82f6",
  IN_PROGRESS: "#f97316",
  RESOLVED: "#22c55e",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWeekLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboard();

      setDashboard(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboard) {
    return (
      <div className="dashboard-error">
        <div className="dashboard-error-icon">
          <AlertCircle size={24} />
        </div>

        <div>
          <h2>Couldn't load dashboard</h2>
          <p>{error || "Something went wrong."}</p>
        </div>

        <button
          type="button"
          className="dashboard-retry"
          onClick={loadDashboard}
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  const { headline } = dashboard;

  const statusData = Object.entries(
    dashboard.maintenanceByStatus
  ).map(([status, count]) => ({
    status,
    label: statusLabels[status] ?? status,
    count,
  }));

  const totalMaintenance = statusData.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <div className="dashboard-page">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Overview</p>

          <h2>Good to see you, Manager.</h2>

          <p>
            Here's what's happening across your rental
            portfolio.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadDashboard}
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </section>

      <section className="kpi-grid">
        <KpiCard
          title="Open maintenance"
          value={headline.openMaintenanceRequests}
          description="Requests currently open"
          icon={<Wrench size={20} />}
          variant="blue"
        />

        <KpiCard
          title="Rent overdue"
          value={formatCurrency(
            headline.rentOverdueThisMonth
          )}
          description="Outstanding this month"
          icon={<AlertCircle size={20} />}
          variant="red"
        />

        <KpiCard
          title="Resolved this week"
          value={headline.requestsResolvedThisWeek}
          description="Maintenance requests resolved"
          icon={<CheckCircle2 size={20} />}
          variant="green"
        />

        <KpiCard
          title="Rent collected"
          value={formatCurrency(
            headline.rentCollectedThisMonth
          )}
          description="Collected this month"
          icon={<IndianRupee size={20} />}
          variant="purple"
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card maintenance-status-card">
          <div className="card-header">
            <div>
              <h3>Maintenance overview</h3>
              <p>Current requests by status</p>
            </div>

            <span className="card-count">
              {totalMaintenance} total
            </span>
          </div>

          {statusData.length === 0 ? (
            <EmptyChartState message="No maintenance requests yet." />
          ) : (
            <div className="status-chart">
              <ResponsiveContainer
                width="100%"
                height={220}
              >
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={64}
                    outerRadius={86}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={
                          statusColors[entry.status] ??
                          "#64748b"
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      value,
                      "Requests",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="status-legend">
                {statusData.map((item) => (
                  <div
                    className="legend-item"
                    key={item.status}
                  >
                    <span
                      className="legend-dot"
                      style={{
                        background:
                          statusColors[item.status] ??
                          "#64748b",
                      }}
                    />

                    <span>{item.label}</span>

                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-card contractor-card">
          <div className="card-header">
            <div>
              <h3>Maintenance by contractor</h3>
              <p>Assigned request distribution</p>
            </div>
          </div>

          {dashboard.maintenanceByContractor.length ===
          0 ? (
            <EmptyChartState message="No contractor assignments yet." />
          ) : (
            <div className="contractor-list">
              {dashboard.maintenanceByContractor.map(
                (contractor) => (
                  <div
                    className="contractor-row"
                    key={contractor.contractorId}
                  >
                    <div className="contractor-avatar">
                      {contractor.contractorName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="contractor-info">
                      <strong>
                        {contractor.contractorName}
                      </strong>

                      <span>
                        {contractor.count === 1
                          ? "1 request"
                          : `${contractor.count} requests`}
                      </span>
                    </div>

                    <div className="contractor-bar">
                      <div
                        style={{
                          width: `${Math.min(
                            contractor.count * 20,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <strong className="contractor-count">
                      {contractor.count}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-card weekly-card">
        <div className="card-header">
          <div>
            <h3>Resolved requests</h3>
            <p>Maintenance requests resolved over the last 8 weeks</p>
          </div>

          <div className="weekly-indicator">
            <Clock3 size={16} />
            8 weeks
          </div>
        </div>

        {dashboard.resolvedPerWeek.length === 0 ? (
          <EmptyChartState message="No resolution data available." />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={dashboard.resolvedPerWeek}
              margin={{
                top: 10,
                right: 10,
                left: -15,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="week"
                tickFormatter={formatWeekLabel}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                labelFormatter={(label) =>
                  `Week of ${formatWeekLabel(
                    String(label)
                  )}`
                }
                formatter={(value) => [
                  value,
                  "Resolved",
                ]}
              />

              <Bar
                dataKey="count"
                name="Resolved"
                radius={[5, 5, 0, 0]}
                fill="#2563eb"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  variant: "blue" | "red" | "green" | "purple";
}

function KpiCard({
  title,
  value,
  description,
  icon,
  variant,
}: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${variant}`}>
        {icon}
      </div>

      <div className="kpi-content">
        <p>{title}</p>

        <strong>{value}</strong>

        <span>{description}</span>
      </div>
    </div>
  );
}

function EmptyChartState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="chart-empty">
      <div>
        <Wrench size={20} />
      </div>
      <p>{message}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-intro skeleton-intro">
        <div>
          <div className="skeleton skeleton-small" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
        </div>
      </div>

      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="kpi-card skeleton-card"
            key={index}
          >
            <div className="skeleton skeleton-icon" />

            <div className="kpi-content">
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-value" />
              <div className="skeleton skeleton-line" />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card skeleton-chart" />
        <div className="dashboard-card skeleton-chart" />
      </div>

      <div className="dashboard-card skeleton-chart-large" />
    </div>
  );
}

export default DashboardPage;