import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Loader2,
  IndianRupee,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  dismissRentAlert,
  getRentAlerts,
  type RentAlert,
} from "../services/rent.service";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function RentAlertsPage() {
  const [alerts, setAlerts] = useState<RentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dismissingUnitId, setDismissingUnitId] =
    useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getRentAlerts();
      setAlerts(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load rent alerts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleDismiss = async (alert: RentAlert) => {
    try {
      setDismissingUnitId(alert.unitId);
      setError("");

      await dismissRentAlert(
        alert.unitId,
        alert.rentMonth
      );

      setAlerts((current) =>
        current.filter(
          (item) => item.unitId !== alert.unitId
        )
      );
      window.dispatchEvent(
  new Event("rent-alerts-updated")
);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to dismiss this alert."
      );
    } finally {
      setDismissingUnitId(null);
    }
  };

  return (
    <div className="rent-alerts-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Finance</p>

          <h2>Rent Alerts</h2>

          <p>
            Review overdue rent that needs your
            attention.
          </p>
        </div>
      </section>

      {error && (
        <div className="rent-alerts-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadAlerts}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <AlertsSkeleton />
      ) : alerts.length === 0 ? (
        <EmptyAlerts />
      ) : (
        <>
          <section className="alerts-summary">
            <div className="alerts-summary-icon">
              <Bell size={20} />
            </div>

            <div>
              <span>Active alerts</span>

              <strong>{alerts.length}</strong>
            </div>
          </section>

          <section className="rent-alerts-list">
            {alerts.map((alert) => (
              <RentAlertCard
                key={`${alert.unitId}-${alert.rentMonth}`}
                alert={alert}
                dismissing={
                  dismissingUnitId === alert.unitId
                }
                onDismiss={handleDismiss}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function RentAlertCard({
  alert,
  dismissing,
  onDismiss,
}: {
  alert: RentAlert;
  dismissing: boolean;
  onDismiss: (alert: RentAlert) => void;
}) {
  return (
    <article className="rent-alert-card">
      <div className="rent-alert-card-header">
        <div>
          <div className="rent-alert-unit">
            <strong>{alert.unitNumber}</strong>

            <span className="rent-alert-badge">
              <span />
              Overdue
            </span>
          </div>

          <p className="rent-alert-tenant">
            {alert.tenantName}
          </p>

          <p className="rent-alert-address">
            {alert.address}
          </p>
        </div>

        <div className="rent-alert-month">
          <span>Rent month</span>
          <strong>
            {formatDate(alert.rentMonth)}
          </strong>
        </div>
      </div>

      <div className="rent-alert-financials">
        <div>
          <span>Monthly rent</span>
          <strong>
            {formatCurrency(alert.monthlyRent)}
          </strong>
        </div>

        <div>
          <span>Amount paid</span>
          <strong>
            {formatCurrency(alert.amountPaid)}
          </strong>
        </div>

        <div>
          <span>Outstanding</span>
          <strong className="rent-alert-outstanding">
            {formatCurrency(alert.amountDue)}
          </strong>
        </div>
      </div>

      <div className="rent-alert-meta">
        <div>
          <span>Due date</span>
          <strong>
            {formatDate(alert.dueDate)}
          </strong>
        </div>

        <div>
          <span>Grace period ended</span>
          <strong>
            {formatDate(alert.gracePeriodEndsAt)}
          </strong>
        </div>
      </div>

      <div className="rent-alert-card-footer">
        <div className="rent-alert-warning">
          <AlertCircle size={17} />

          <span>
            Rent is still outstanding after the
            grace period.
          </span>
        </div>

        <button
          type="button"
          className="secondary-action"
          onClick={() => onDismiss(alert)}
          disabled={dismissing}
        >
          {dismissing ? (
            <>
              <Loader2
                size={16}
                className="spin"
              />
              Dismissing...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Dismiss alert
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function EmptyAlerts() {
  return (
    <section className="rent-alerts-empty">
      <div className="rent-alerts-empty-icon">
        <CheckCircle2 size={24} />
      </div>

      <h3>No active rent alerts</h3>

      <p>
        All active units are currently up to date
        with their rent.
      </p>
    </section>
  );
}

function AlertsSkeleton() {
  return (
    <section className="rent-alerts-skeleton">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="rent-alert-skeleton-card"
          key={index}
        >
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </section>
  );
}