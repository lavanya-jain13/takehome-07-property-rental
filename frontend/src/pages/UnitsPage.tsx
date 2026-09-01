import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  archiveUnit,
  createUnit,
  getUnit,
  getUnits,
  restoreUnit,
  updateUnit,
  type Unit,
  type UnitDetails,
} from "../services/units.service";

type StatusFilter = "ALL" | "ACTIVE" | "ARCHIVED";

interface FormState {
  unitNumber: string;
  address: string;
  tenantName: string;
  monthlyRent: string;
}

const emptyForm: FormState = {
  unitNumber: "",
  address: "",
  tenantName: "",
  monthlyRent: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "data" in error
  ) {
    const data = (error as { data?: unknown }).data;

    if (
      data &&
      typeof data === "object" &&
      "error" in data
    ) {
      const apiError = (
        data as {
          error?: {
            message?: string;
          };
        }
      ).error;

      if (apiError?.message) {
        return apiError.message;
      }
    }
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] =
    useState<StatusFilter>("ACTIVE");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState<
    "create" | "edit" | "view" | null
  >(null);

  const [selectedUnit, setSelectedUnit] =
    useState<UnitDetails | null>(null);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [actionUnit, setActionUnit] =
    useState<Unit | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getUnits({
        status:
          status === "ALL"
            ? undefined
            : status,
        page,
        limit: 10,
      });

      setUnits(response.data);
      setTotal(response.pagination.total);
      setTotalPages(
        response.pagination.totalPages
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [status, page]);

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return units;
    }

    return units.filter((unit) =>
      [
        unit.unitNumber,
        unit.address,
        unit.tenantName,
      ].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [units, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setModal("create");
  };

  const openEdit = (unit: Unit) => {
    setForm({
      unitNumber: unit.unitNumber,
      address: unit.address,
      tenantName: unit.tenantName,
      monthlyRent: String(unit.monthlyRent),
    });

    setSelectedUnit(unit as UnitDetails);
    setFormError("");
    setModal("edit");
  };

  const openView = async (unit: Unit) => {
    try {
      setFormError("");

      const response = await getUnit(unit.id);

      setSelectedUnit(response.data);
      setModal("view");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const monthlyRent = Number(
      form.monthlyRent
    );

    if (
      !form.unitNumber.trim() ||
      !form.address.trim() ||
      !form.tenantName.trim()
    ) {
      setFormError(
        "Please complete all required fields."
      );
      return;
    }

    if (
      !Number.isFinite(monthlyRent) ||
      monthlyRent <= 0
    ) {
      setFormError(
        "Monthly rent must be greater than zero."
      );
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      if (modal === "create") {
        await createUnit({
          unitNumber: form.unitNumber.trim(),
          address: form.address.trim(),
          tenantName: form.tenantName.trim(),
          monthlyRent,
        });
      } else if (
        modal === "edit" &&
        selectedUnit
      ) {
        await updateUnit(selectedUnit.id, {
          unitNumber: form.unitNumber.trim(),
          address: form.address.trim(),
          tenantName: form.tenantName.trim(),
          monthlyRent,
        });
      }

      setModal(null);
      setSelectedUnit(null);

      await loadUnits();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveRestore = async () => {
    if (!actionUnit) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      if (actionUnit.status === "ACTIVE") {
        await archiveUnit(actionUnit.id);
      } else {
        await restoreUnit(actionUnit.id);
      }

      setActionUnit(null);

      if (
        status === "ACTIVE" &&
        actionUnit.status === "ACTIVE"
      ) {
        if (units.length === 1 && page > 1) {
          setPage((current) => current - 1);
        } else {
          await loadUnits();
        }
      } else {
        await loadUnits();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="units-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Portfolio</p>

          <h2>Units</h2>

          <p>
            Manage rental units, tenants and monthly
            rent.
          </p>
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={openCreate}
        >
          <Plus size={17} />
          Add unit
        </button>
      </section>

      <section className="units-toolbar">
        <div className="unit-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search units, tenants or addresses..."
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

        <div className="status-tabs">
          {(
            [
              ["ACTIVE", "Active"],
              ["ARCHIVED", "Archived"],
              ["ALL", "All"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={
                status === value
                  ? "status-tab active"
                  : "status-tab"
              }
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="units-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadUnits}
          >
            Retry
          </button>
        </div>
      )}

      <section className="units-card">
        <div className="units-card-header">
          <div>
            <h3>
              {status === "ACTIVE"
                ? "Active units"
                : status === "ARCHIVED"
                  ? "Archived units"
                  : "All units"}
            </h3>

            <span>
              {total}{" "}
              {total === 1 ? "unit" : "units"}
            </span>
          </div>
        </div>

        {loading ? (
          <UnitsSkeleton />
        ) : filteredUnits.length === 0 ? (
          <EmptyUnits
            search={search}
            status={status}
            onCreate={openCreate}
          />
        ) : (
          <>
            <div className="units-table-wrapper">
              <table className="units-table">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Tenant</th>
                    <th>Address</th>
                    <th>Monthly rent</th>
                    <th>Status</th>
                    <th className="actions-column">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUnits.map((unit) => (
                    <tr key={unit.id}>
                      <td>
                        <button
                          type="button"
                          className="unit-number"
                          onClick={() =>
                            openView(unit)
                          }
                        >
                          {unit.unitNumber}
                        </button>

                        <span className="unit-created">
                          Added{" "}
                          {formatDate(
                            unit.createdAt
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="tenant-cell">
                          <div className="tenant-avatar">
                            {unit.tenantName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <span>
                            {unit.tenantName}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="address-cell">
                          {unit.address}
                        </span>
                      </td>

                      <td>
                        <strong className="rent-value">
                          {formatCurrency(
                            unit.monthlyRent
                          )}
                        </strong>
                        <span className="rent-period">
                          / month
                        </span>
                      </td>

                      <td>
                        <StatusBadge
                          status={unit.status}
                        />
                      </td>

                      <td>
                        <div className="unit-actions">
                          <button
                            type="button"
                            className="table-icon-button"
                            title="View unit"
                            onClick={() =>
                              openView(unit)
                            }
                          >
                            <Eye size={16} />
                          </button>

                          {unit.status ===
                            "ACTIVE" && (
                            <>
                              <button
                                type="button"
                                className="table-icon-button"
                                title="Edit unit"
                                onClick={() =>
                                  openEdit(unit)
                                }
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                className="table-icon-button danger"
                                title="Archive unit"
                                onClick={() =>
                                  setActionUnit(
                                    unit
                                  )
                                }
                              >
                                <Archive size={16} />
                              </button>
                            </>
                          )}

                          {unit.status ===
                            "ARCHIVED" && (
                            <button
                              type="button"
                              className="table-icon-button success"
                              title="Restore unit"
                              onClick={() =>
                                setActionUnit(
                                  unit
                                )
                              }
                            >
                              <ArchiveRestore
                                size={16}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>
                Page {page} of {totalPages}
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
                  disabled={page >= totalPages}
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
          </>
        )}
      </section>

      {(modal === "create" ||
        modal === "edit") && (
        <UnitFormModal
          mode={modal}
          form={form}
          setForm={setForm}
          error={formError}
          saving={saving}
          onClose={() => {
            setModal(null);
            setSelectedUnit(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {modal === "view" &&
        selectedUnit && (
          <UnitDetailsModal
            unit={selectedUnit}
            onClose={() => {
              setModal(null);
              setSelectedUnit(null);
            }}
            onEdit={() => openEdit(selectedUnit)}
          />
        )}

      {actionUnit && (
        <ConfirmationModal
          unit={actionUnit}
          loading={actionLoading}
          onClose={() => setActionUnit(null)}
          onConfirm={handleArchiveRestore}
        />
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Unit["status"];
}) {
  return (
    <span
      className={`unit-status-badge ${status.toLowerCase()}`}
    >
      <span />
      {status === "ACTIVE"
        ? "Active"
        : "Archived"}
    </span>
  );
}

function UnitFormModal({
  mode,
  form,
  setForm,
  error,
  saving,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: FormState;
  setForm: React.Dispatch<
    React.SetStateAction<FormState>
  >;
  error: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (
    event: React.FormEvent
  ) => void;
}) {
  const updateField = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3>
              {mode === "create"
                ? "Add unit"
                : "Edit unit"}
            </h3>

            <p>
              {mode === "create"
                ? "Add a new rental unit to your portfolio."
                : "Update the unit information below."}
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
            Unit number
            <input
              value={form.unitNumber}
              onChange={(event) =>
                updateField(
                  "unitNumber",
                  event.target.value
                )
              }
              placeholder="e.g. A-101"
              autoFocus
            />
          </label>

          <label>
            Address
            <input
              value={form.address}
              onChange={(event) =>
                updateField(
                  "address",
                  event.target.value
                )
              }
              placeholder="e.g. 124 Main Street"
            />
          </label>

          <label>
            Tenant name
            <input
              value={form.tenantName}
              onChange={(event) =>
                updateField(
                  "tenantName",
                  event.target.value
                )
              }
              placeholder="e.g. Jane Doe"
            />
          </label>

          <label>
            Monthly rent
            <div className="currency-input">
              <span>₹</span>

              <input
                type="number"
                min="1"
                step="0.01"
                value={form.monthlyRent}
                onChange={(event) =>
                  updateField(
                    "monthlyRent",
                    event.target.value
                  )
                }
                placeholder="1500"
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
              {saving
                ? "Saving..."
                : mode === "create"
                  ? "Create unit"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UnitDetailsModal({
  unit,
  onClose,
  onEdit,
}: {
  unit: UnitDetails;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal unit-details-modal">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">
              Unit details
            </p>

            <h3>{unit.unitNumber}</h3>

            <p>{unit.address}</p>
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

        <div className="unit-detail-summary">
          <div>
            <span>Tenant</span>
            <strong>{unit.tenantName}</strong>
          </div>

          <div>
            <span>Monthly rent</span>
            <strong>
              {formatCurrency(unit.monthlyRent)}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <StatusBadge status={unit.status} />
          </div>
        </div>

        <div className="unit-detail-section">
          <div className="detail-section-heading">
            <div>
              <h4>Maintenance history</h4>
              <p>
                Requests associated with this unit
              </p>
            </div>

            <span>
              {unit.maintenanceRequests.length}
            </span>
          </div>

          {unit.maintenanceRequests.length ===
          0 ? (
            <div className="detail-empty">
              <Users size={18} />
              <span>
                No maintenance requests for this
                unit.
              </span>
            </div>
          ) : (
            <div className="maintenance-mini-list">
              {unit.maintenanceRequests.map(
                (request) => (
                  <div
                    className="maintenance-mini-row"
                    key={request.id}
                  >
                    <div>
                      <strong>
                        {request.title}
                      </strong>

                      <span>
                        {formatDate(
                          request.createdAt
                        )}
                      </span>
                    </div>

                    <span
                      className={`mini-status ${request.status.toLowerCase()}`}
                    >
                      {request.status.replace(
                        "_",
                        " "
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          {unit.status === "ACTIVE" && (
            <button
              type="button"
              className="secondary-action"
              onClick={onEdit}
            >
              <Pencil size={16} />
              Edit unit
            </button>
          )}

          <button
            type="button"
            className="primary-action"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({
  unit,
  loading,
  onClose,
  onConfirm,
}: {
  unit: Unit;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const archive = unit.status === "ACTIVE";

  return (
    <div className="modal-backdrop">
      <div className="modal confirmation-modal">
        <div className="confirmation-icon">
          {archive ? (
            <Archive size={22} />
          ) : (
            <ArchiveRestore size={22} />
          )}
        </div>

        <h3>
          {archive
            ? "Archive this unit?"
            : "Restore this unit?"}
        </h3>

        <p>
          {archive
            ? `${unit.unitNumber} will be removed from the active portfolio. Its history will be preserved.`
            : `${unit.unitNumber} will become active and appear in the active portfolio again.`}
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className={
              archive
                ? "danger-action"
                : "primary-action"
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : archive
                ? "Archive unit"
                : "Restore unit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyUnits({
  search,
  status,
  onCreate,
}: {
  search: string;
  status: StatusFilter;
  onCreate: () => void;
}) {
  return (
    <div className="units-empty">
      <div className="empty-icon">
        <MoreHorizontal size={22} />
      </div>

      <h3>
        {search
          ? "No matching units"
          : status === "ARCHIVED"
            ? "No archived units"
            : "No units yet"}
      </h3>

      <p>
        {search
          ? "Try a different search term."
          : status === "ARCHIVED"
            ? "Archived units will appear here."
            : "Add your first rental unit to get started."}
      </p>

      {!search && status !== "ARCHIVED" && (
        <button
          type="button"
          className="primary-action"
          onClick={onCreate}
        >
          <Plus size={16} />
          Add unit
        </button>
      )}
    </div>
  );
}

function UnitsSkeleton() {
  return (
    <div className="units-skeleton">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          className="unit-skeleton-row"
          key={index}
        >
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}