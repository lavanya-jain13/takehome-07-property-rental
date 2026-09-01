import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  IndianRupee,
  Loader2,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createRentPayment,
  createBulkRentPayments,
  getRentPayments,
  getRentRoll,
  type BulkPaymentResult,
  type PaymentStatus,
  type RentPayment,
  type RentRollRow,
} from "../services/rent.service";
import {
  getUnits,
  type Unit,
} from "../services/units.service";

type Tab = "roll" | "payments";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string | null) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const getCurrentMonth = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-01`;
};

const getErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "data" in error
  ) {
    const data = (
      error as {
        data?: {
          error?: {
            message?: string;
          };
        };
      }
    ).data;

    if (data?.error?.message) {
      return data.error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong.";
};

export default function RentPage() {
  const [tab, setTab] = useState<Tab>("roll");

  const [paymentMonth, setPaymentMonth] =
    useState(getCurrentMonth());

  const [roll, setRoll] = useState<RentRollRow[]>(
    []
  );

  const [payments, setPayments] = useState<
    RentPayment[]
  >([]);

  const [units, setUnits] = useState<Unit[]>([]);

  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] =
    useState(0);

  const [modal, setModal] = useState<
  "payment" | "bulk" | null
>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [bulkAmounts, setBulkAmounts] = useState<
  Record<string, string>
>({});

const [bulkResults, setBulkResults] = useState<
  BulkPaymentResult[]
>([]);

  const [form, setForm] = useState({
    unitId: "",
    amount: "",
  });

  const loadRentRoll = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getRentRoll(
        paymentMonth
      );

      setRoll(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getRentPayments({
        paymentMonth,
        page,
        limit: 10,
      });

      setPayments(response.data);
      setTotalPayments(
        response.pagination.total
      );
      setTotalPages(
        response.pagination.totalPages
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      setUnitsLoading(true);

      const response = await getUnits({
        status: "ACTIVE",
        page: 1,
        limit: 100,
      });

      setUnits(response.data);
    } catch {
      // Payment page can still render without
      // the unit list.
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [paymentMonth, tab]);

  useEffect(() => {
    if (tab === "roll") {
      loadRentRoll();
    } else {
      loadPayments();
    }
  }, [paymentMonth, tab, page]);

  useEffect(() => {
    loadUnits();
  }, []);

  const filteredRoll = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return roll;
    }

    return roll.filter((row) =>
      [
        row.unitNumber,
        row.address,
        row.tenantName,
      ].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [roll, search]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return payments;
    }

    return payments.filter((payment) =>
      [
        payment.unitNumber,
        payment.address,
        payment.recordedByName,
      ].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [payments, search]);

  const summary = useMemo(() => {
    const expected = roll.reduce(
      (sum, row) => sum + row.monthlyRent,
      0
    );

    const collected = roll.reduce(
      (sum, row) => sum + row.amountPaid,
      0
    );

    const outstanding = roll.reduce(
      (sum, row) =>
        sum +
        Math.max(
          row.monthlyRent - row.amountPaid,
          0
        ),
      0
    );

    const collectionRate =
      expected > 0
        ? Math.round(
            (collected / expected) * 100
          )
        : 0;

    return {
      expected,
      collected,
      outstanding,
      collectionRate,
    };
  }, [roll]);

  const openPaymentModal = () => {
    setForm({
      unitId: "",
      amount: "",
    });
    setFormError("");
    setModal("payment");
  };

  const openBulkModal = () => {
  const initialAmounts: Record<string, string> = {};

  units.forEach((unit) => {
    initialAmounts[unit.id] = "";
  });

  setBulkAmounts(initialAmounts);
  setBulkResults([]);
  setFormError("");
  setModal("bulk");
};

  const selectedUnit = units.find(
    (unit) => unit.id === form.unitId
  );

  const handleUnitChange = (
    unitId: string
  ) => {
    const unit = units.find(
      (item) => item.id === unitId
    );

    setForm({
      unitId,
      amount: unit
        ? String(unit.monthlyRent)
        : "",
    });

    setFormError("");
  };

  const handlePaymentSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!form.unitId) {
      setFormError("Please select a unit.");
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setFormError(
        "Amount must be a non-negative number."
      );
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await createRentPayment({
        unitId: form.unitId,
        paymentMonth,
        amount,
      });

      setModal(null);

      if (tab === "roll") {
        await loadRentRoll();
      } else {
        await loadPayments();
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPaymentSubmit = async (
  event: React.FormEvent
) => {
  event.preventDefault();

  const payments = Object.entries(bulkAmounts)
    .filter(([, amount]) => amount.trim() !== "")
    .map(([unitId, amount]) => ({
      unitId,
      amount: Number(amount),
    }));

  if (payments.length === 0) {
    setFormError(
      "Enter an amount for at least one unit."
    );
    return;
  }

  const invalidPayment = payments.find(
    (payment) =>
      !Number.isFinite(payment.amount) ||
      payment.amount < 0
  );

  if (invalidPayment) {
    setFormError(
      "All amounts must be non-negative numbers."
    );
    return;
  }

  try {
    setSaving(true);
    setFormError("");

    const response =
      await createBulkRentPayments({
        paymentMonth,
        payments,
      });

    setBulkResults(response.results);

    if (tab === "roll") {
      await loadRentRoll();
    } else {
      await loadPayments();
    }
  } catch (err) {
    setFormError(getErrorMessage(err));
  } finally {
    setSaving(false);
  }
};

  const handleExport = async () => {
    try {
      setError("");

      const base =
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:3000/api";

      const response = await fetch(
        `${base}/rent/roll/export?paymentMonth=${encodeURIComponent(
          paymentMonth
        )}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to export rent roll."
        );
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download = `rent-roll-${paymentMonth}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="rent-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Finance</p>

          <h2>Rent</h2>

          <p>
            Track rent collection and payment
            performance across your portfolio.
          </p>
        </div>

        <div className="rent-heading-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={handleExport}
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            type="button"
            className="secondary-action"
            onClick={openBulkModal}
            >
            <Upload size={16} />
            Bulk payments
            </button>

          <button
            type="button"
            className="primary-action"
            onClick={openPaymentModal}
          >
            <Plus size={17} />
            Record payment
          </button>
        </div>
      </section>

      <section className="rent-summary-grid">
        <SummaryCard
          label="Expected rent"
          value={formatCurrency(summary.expected)}
          icon={<IndianRupee size={18} />}
        />

        <SummaryCard
          label="Collected"
          value={formatCurrency(summary.collected)}
          icon={<CheckCircle2 size={18} />}
        />

        <SummaryCard
          label="Outstanding"
          value={formatCurrency(summary.outstanding)}
          icon={<AlertCircle size={18} />}
        />

        <SummaryCard
          label="Collection rate"
          value={`${summary.collectionRate}%`}
          icon={<IndianRupee size={18} />}
        />
      </section>

      <section className="rent-card">
        <div className="rent-card-header">
          <div className="rent-tabs">
            <button
              type="button"
              className={
                tab === "roll"
                  ? "rent-tab active"
                  : "rent-tab"
              }
              onClick={() => {
                setTab("roll");
                setSearch("");
              }}
            >
              Rent roll
            </button>

            <button
              type="button"
              className={
                tab === "payments"
                  ? "rent-tab active"
                  : "rent-tab"
              }
              onClick={() => {
                setTab("payments");
                setSearch("");
              }}
            >
              Payment history
            </button>
          </div>

          <label className="rent-month-picker">
            <span>Month</span>

            <input
              type="month"
              value={paymentMonth.slice(0, 7)}
              onChange={(event) =>
                setPaymentMonth(
                  `${event.target.value}-01`
                )
              }
            />
          </label>
        </div>

        <div className="rent-toolbar">
          <div className="rent-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={
                tab === "roll"
                  ? "Search units, tenants or addresses..."
                  : "Search units, addresses or recorded by..."
              }
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rent-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={
                tab === "roll"
                  ? loadRentRoll
                  : loadPayments
              }
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <RentSkeleton />
        ) : tab === "roll" ? (
          filteredRoll.length === 0 ? (
            <RentEmpty
              message={
                search
                  ? "No matching rent records"
                  : "No rent records for this month"
              }
            />
          ) : (
            <RentRollTable rows={filteredRoll} />
          )
        ) : filteredPayments.length === 0 ? (
          <RentEmpty
            message={
              search
                ? "No matching payments"
                : "No payments recorded for this month"
            }
          />
        ) : (
          <PaymentTable payments={filteredPayments} />
        )}

        {!loading &&
          tab === "payments" &&
          filteredPayments.length > 0 && (
            <div className="pagination">
              <span>
                Page {page} of {totalPages}
                {" · "}
                {totalPayments} payments
              </span>

              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(current - 1, 1)
                    )
                  }
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  disabled={
                    page >= totalPages
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        current + 1,
                        totalPages
                      )
                    )
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
      </section>

      {modal === "payment" && (
        <PaymentModal
          paymentMonth={paymentMonth}
          units={units}
          unitsLoading={unitsLoading}
          selectedUnit={selectedUnit}
          form={form}
          saving={saving}
          error={formError}
          onUnitChange={handleUnitChange}
          onAmountChange={(amount) =>
            setForm((current) => ({
              ...current,
              amount,
            }))
          }
          onClose={() => setModal(null)}
          onSubmit={handlePaymentSubmit}
        />
      )}
      {modal === "bulk" && (
  <BulkPaymentModal
    paymentMonth={paymentMonth}
    units={units}
    unitsLoading={unitsLoading}
    amounts={bulkAmounts}
    results={bulkResults}
    saving={saving}
    error={formError}
    onAmountChange={(unitId, amount) =>
      setBulkAmounts((current) => ({
        ...current,
        [unitId]: amount,
      }))
    }
    onClose={() => setModal(null)}
    onSubmit={handleBulkPaymentSubmit}
  />
)}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rent-summary-card">
      <div className="rent-summary-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const labels: Record<
    PaymentStatus,
    string
  > = {
    MATCHED: "Matched",
    UNDERPAID: "Underpaid",
    OVERPAID: "Overpaid",
    UNMATCHED: "Unmatched",
  };

  return (
    <span
      className={`rent-status-badge ${status.toLowerCase()}`}
    >
      <span />
      {labels[status]}
    </span>
  );
}

function RentRollTable({
  rows,
}: {
  rows: RentRollRow[];
}) {
  return (
    <div className="rent-table-wrapper">
      <table className="rent-table">
        <thead>
          <tr>
            <th>Unit</th>
            <th>Tenant</th>
            <th>Monthly rent</th>
            <th>Paid</th>
            <th>Outstanding</th>
            <th>Status</th>
            <th>Recorded</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.unitId}>
              <td>
                <strong className="rent-unit-number">
                  {row.unitNumber}
                </strong>

                <span className="rent-address">
                  {row.address}
                </span>
              </td>

              <td>
                <span className="rent-tenant">
                  {row.tenantName}
                </span>
              </td>

              <td>
                <strong>
                  {formatCurrency(
                    row.monthlyRent
                  )}
                </strong>
              </td>

              <td>
                <strong>
                  {formatCurrency(
                    row.amountPaid
                  )}
                </strong>
              </td>

              <td>
                <strong
                  className={
                    row.monthlyRent -
                      row.amountPaid >
                    0
                      ? "rent-outstanding"
                      : "rent-paid"
                  }
                >
                  {formatCurrency(
                    Math.max(
                      row.monthlyRent -
                        row.amountPaid,
                      0
                    )
                  )}
                </strong>
              </td>

              <td>
                <PaymentStatusBadge
                  status={row.paymentStatus}
                />
              </td>

              <td>
                <span className="rent-recorded">
                  {formatDate(row.recordedAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentTable({
  payments,
}: {
  payments: RentPayment[];
}) {
  return (
    <div className="rent-table-wrapper">
      <table className="rent-table">
        <thead>
          <tr>
            <th>Unit</th>
            <th>Address</th>
            <th>Payment month</th>
            <th>Amount</th>
            <th>Recorded by</th>
            <th>Recorded</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>
                <strong className="rent-unit-number">
                  {payment.unitNumber}
                </strong>
              </td>

              <td>
                <span className="rent-address">
                  {payment.address}
                </span>
              </td>

              <td>
                {formatDate(payment.paymentMonth)}
              </td>

              <td>
                <strong>
                  {formatCurrency(
                    payment.amount
                  )}
                </strong>
              </td>

              <td>
                <span className="rent-recorded-by">
                  {payment.recordedByName}
                </span>
              </td>

              <td>
                {formatDate(
                  payment.recordedAt
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulkPaymentModal({
  paymentMonth,
  units,
  unitsLoading,
  amounts,
  results,
  saving,
  error,
  onAmountChange,
  onClose,
  onSubmit,
}: {
  paymentMonth: string;
  units: Unit[];
  unitsLoading: boolean;
  amounts: Record<string, string>;
  results: BulkPaymentResult[];
  saving: boolean;
  error: string;
  onAmountChange: (
    unitId: string,
    amount: string
  ) => void;
  onClose: () => void;
  onSubmit: (
    event: React.FormEvent
  ) => void;
}) {
  return (
  <div className="modal-backdrop">
    <div className="modal bulk-payment-modal">
      <div className="modal-header">
        <div>
          <p className="modal-eyebrow">
            Rent collection
          </p>

          <h3>Bulk payments</h3>

          <p>
            Record rent payments for multiple units
            at once.
          </p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="bulk-payment-month">
        <div>
          <span>Payment month</span>
          <strong>
            {formatDate(paymentMonth)}
          </strong>
        </div>
      </div>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      {unitsLoading ? (
        <div className="bulk-payment-loading">
          Loading units...
        </div>
      ) : units.length === 0 ? (
        <div className="rent-empty">
          <div className="rent-empty-icon">
            <IndianRupee size={21} />
          </div>

          <h3>No active units</h3>

          <p>
            Add an active unit before recording
            rent payments.
          </p>
        </div>
      ) : (
        <div className="bulk-payment-table-wrapper">
          <table className="rent-table bulk-payment-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Tenant</th>
                <th>Expected</th>
                <th>Amount paid</th>
              </tr>
            </thead>

            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td>
                    <strong className="rent-unit-number">
                      {unit.unitNumber}
                    </strong>

                    <span className="rent-address">
                      {unit.address}
                    </span>
                  </td>

                  <td>
                    <span className="rent-tenant">
                      {unit.tenantName}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {formatCurrency(
                        unit.monthlyRent
                      )}
                    </strong>
                  </td>

                  <td>
                    <div className="currency-input bulk-amount-input">
                      <span>₹</span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amounts[unit.id] ?? ""}
                        onChange={(event) =>
                          onAmountChange(
                            unit.id,
                            event.target.value
                          )
                        }
                        placeholder={String(
                          unit.monthlyRent
                        )}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.length > 0 && (
        <div className="bulk-payment-results">
          <div className="bulk-results-header">
            <div>
              <span>Submission results</span>
              <strong>
                {results.length} payment
                {results.length !== 1 ? "s" : ""}
              </strong>
            </div>
          </div>

          <div className="bulk-results-list">
     {results.map((result) => {
  const unit = units.find(
    (item) => item.id === result.unitId
  );

  return (
    <div
      className="bulk-result-row"
      key={result.unitId}
    >
      <div>
        <strong>
          {result.unitNumber ??
            unit?.unitNumber ??
            result.unitId}
        </strong>

        <span>
          {formatCurrency(result.amount)}
        </span>
      </div>

      {result.status === "ALREADY_RECORDED" ? (
        <span className="rent-status-badge already-recorded">
          <span />
          Already recorded
        </span>
      ) : (
        <PaymentStatusBadge
          status={result.status}
        />
      )}
    </div>
  );
})}
          </div>
        </div>
      )}

      <div className="modal-actions">
        <button
          type="button"
          className="secondary-action"
          onClick={onClose}
          disabled={saving}
        >
          Close
        </button>

        <button
          type="button"
          className="primary-action"
          onClick={(event) => {
            onSubmit(
              event as unknown as React.FormEvent
            );
          }}
          disabled={
            saving ||
            unitsLoading ||
            units.length === 0
          }
        >
          {saving ? (
            <>
              <Loader2
                size={16}
                className="spin"
              />
              Saving...
            </>
          ) : (
            <>
              <Upload size={16} />
              Record bulk payments
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);
}

function PaymentModal({
  paymentMonth,
  units,
  unitsLoading,
  selectedUnit,
  form,
  saving,
  error,
  onUnitChange,
  onAmountChange,
  onClose,
  onSubmit,
}: {
  paymentMonth: string;
  units: Unit[];
  unitsLoading: boolean;
  selectedUnit?: Unit;
  form: {
    unitId: string;
    amount: string;
  };
  saving: boolean;
  error: string;
  onUnitChange: (unitId: string) => void;
  onAmountChange: (amount: string) => void;
  onClose: () => void;
  onSubmit: (
    event: React.FormEvent
  ) => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal rent-payment-modal">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">
              Rent collection
            </p>

            <h3>Record payment</h3>

            <p>
              Record a payment for{" "}
              {formatDate(paymentMonth)}.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="unit-form"
          onSubmit={onSubmit}
        >
          <label>
            Unit
            <select
              value={form.unitId}
              onChange={(event) =>
                onUnitChange(
                  event.target.value
                )
              }
              disabled={unitsLoading}
            >
              <option value="">
                {unitsLoading
                  ? "Loading units..."
                  : "Select a unit"}
              </option>

              {units.map((unit) => (
                <option
                  key={unit.id}
                  value={unit.id}
                >
                  {unit.unitNumber} —{" "}
                  {unit.tenantName}
                </option>
              ))}
            </select>
          </label>

          {selectedUnit && (
            <div className="rent-payment-preview">
              <div>
                <span>Tenant</span>
                <strong>
                  {selectedUnit.tenantName}
                </strong>
              </div>

              <div>
                <span>Expected monthly rent</span>
                <strong>
                  {formatCurrency(
                    selectedUnit.monthlyRent
                  )}
                </strong>
              </div>
            </div>
          )}

          <label>
            Amount paid
            <div className="currency-input">
              <span>₹</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  onAmountChange(
                    event.target.value
                  )
                }
                placeholder="15000"
              />
            </div>
          </label>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-action"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-action"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Record payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RentEmpty({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rent-empty">
      <div className="rent-empty-icon">
        <IndianRupee size={21} />
      </div>

      <h3>{message}</h3>

      <p>
        Try another month or record a new payment.
      </p>
    </div>
  );
}

function RentSkeleton() {
  return (
    <div className="rent-skeleton">
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            className="rent-skeleton-row"
            key={index}
          >
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        )
      )}
    </div>
  );
}