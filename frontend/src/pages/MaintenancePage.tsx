import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Plus,
  Search,
  Wrench,
  X,
} from "lucide-react";

import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceRequest,
  getContractors,
  assignContractor,
  removeContractor,
  updateMaintenanceRequest,
  changeMaintenanceStatus,
  addTimelineNote,
  type Contractor,
  type MaintenancePriority,
  type MaintenanceRequest,
  type MaintenanceRequestDetails,
  type MaintenanceStatus,
} from "../services/maintenance.service";
import { useAuth } from "../context/AuthContext";

import {
  getUnits,
  type Unit,
} from "../services/units.service";
import type { User } from "../types/auth";

const statuses: {
  value: MaintenanceStatus | "";
  label: string;
}[] = [
  { value: "", label: "All statuses" },
  { value: "REPORTED", label: "Reported" },
  { value: "TRIAGED", label: "Triaged" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "RESOLVED", label: "Resolved" },
];

const priorities: {
  value: MaintenancePriority | "";
  label: string;
}[] = [
  { value: "", label: "All priorities" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const statusTransitions: Record<
  MaintenanceStatus,
  MaintenanceStatus[]
> = {
  REPORTED: ["TRIAGED"],
  TRIAGED: ["SCHEDULED"],
  SCHEDULED: ["RESOLVED"],
  RESOLVED: ["TRIAGED"],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusActionLabel(
  currentStatus: MaintenanceStatus,
  nextStatus: MaintenanceStatus
) {
  const transitionLabels: Partial<
    Record<
      MaintenanceStatus,
      Partial<Record<MaintenanceStatus, string>>
    >
  > = {
    REPORTED: {
      TRIAGED: "Move to Triaged",
    },
    RESOLVED: {
      TRIAGED: "Reopen to Triaged",
    },
  };

  return (
    transitionLabels[currentStatus]?.[nextStatus] ??
    `Move to ${
      nextStatus.charAt(0) +
      nextStatus.slice(1).toLowerCase()
    }`
  );
}

function getErrorMessage(error: unknown) {
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
}

function PriorityBadge({
  priority,
}: {
  priority: MaintenancePriority;
}) {
  return (
    <span
      className={`maintenance-priority ${priority.toLowerCase()}`}
    >
      <span />
      {priority.charAt(0) +
        priority.slice(1).toLowerCase()}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: MaintenanceStatus;
}) {
  return (
    <span
      className={`maintenance-status ${status.toLowerCase()}`}
    >
      <span />
      {status
        .charAt(0)
        .toUpperCase() +
        status.slice(1).toLowerCase()}
    </span>
  );
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";

  const [requests, setRequests] = useState<
    MaintenanceRequest[]
  >([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] =
    useState(false);
  const [loading, setLoading] =
    useState(true);
  
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorsLoading, setContractorsLoading] = useState(false);

  const [error, setError] = useState("");

  const [selectedRequest, setSelectedRequest] =
  useState<MaintenanceRequestDetails | null>(null);

  const [detailsLoading, setDetailsLoading] =
  useState(false);

  const [detailsError, setDetailsError] =
  useState("");

  const [assigningContractor, setAssigningContractor] =
  useState(false);
  const [updatingRequest, setUpdatingRequest] =
    useState(false);
  const [updatingStatus, setUpdatingStatus] =
    useState(false);
  const [addingNote, setAddingNote] =
    useState(false);

  const [showCreateModal, setShowCreateModal] =
  useState(false);

  const [createSaving, setCreateSaving] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [createForm, setCreateForm] = useState({
    unitId: "",
    title: "",
    description: "",
    priority: "MEDIUM" as MaintenancePriority,
  });

  const [search, setSearch] = useState("");

  const [unitId, setUnitId] = useState("");

  const [status, setStatus] =
    useState<MaintenanceStatus | "">("");

  const [priority, setPriority] =
    useState<MaintenancePriority | "">("");

  const [contractorId, setContractorId] =
    useState("");

  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =
    useState(1);

  const [sortBy, setSortBy] = useState<
    "createdAt" | "priority" | "status"
  >("createdAt");

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc");

  const loadUnits = async () => {
  try {
    setUnitsLoading(true);

    const response = await getUnits({
      status: "ACTIVE",
      page: 1,
      limit: 100,
    });

    setUnits(response.data);
  } catch (err) {
    setCreateError(getErrorMessage(err));
  } finally {
    setUnitsLoading(false);
  }
};

const loadContractors = async () => {
  if (!isManager) {
    return;
  }

  try {
    setContractorsLoading(true);

    const response = await getContractors();

    setContractors(response.data);
  } catch (err) {
    setCreateError(getErrorMessage(err));
  } finally {
    setContractorsLoading(false);
  }
};

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getMaintenanceRequests({
          search: search.trim() || undefined,
          unitId: unitId || undefined,
          status: status || undefined,
          priority: priority || undefined,
          contractorId:
            isManager && contractorId
              ? contractorId
              : undefined,
          page,
          limit: 10,
          sortBy,
          sortOrder,
        });

      setRequests(response.data);
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
    const timeout = setTimeout(() => {
      loadRequests();
    }, 250);

    return () => clearTimeout(timeout);
  }, [
    search,
    unitId,
    status,
    priority,
    contractorId,
    page,
    sortBy,
    sortOrder,
    isManager,
  ]);

  useEffect(() => {
  loadUnits();
  loadContractors();
}, [isManager]);

  const openCreateModal = () => {
  setCreateForm({
    unitId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  setCreateError("");
  setShowCreateModal(true);
};

  const clearFilters = () => {
    setSearch("");
    setUnitId("");
    setStatus("");
    setPriority("");
    setContractorId("");
    setPage(1);
  };

  const handleSort = (
    field:
      | "createdAt"
      | "priority"
      | "status"
  ) => {
    if (sortBy === field) {
      setSortOrder((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }

    setPage(1);
  };
const handleViewRequest = async (
  requestId: string
) => {
  try {
    setDetailsLoading(true);
    setDetailsError("");

    const response =
      await getMaintenanceRequest(requestId);

    setSelectedRequest(response.data);
  } catch (err) {
    setDetailsError(getErrorMessage(err));
  } finally {
    setDetailsLoading(false);
  }
};
const handleAssignContractor = async (
  contractorId: string
) => {
  if (
    !isManager ||
    !selectedRequest ||
    !contractorId
  ) {
    return;
  }

  try {
    setAssigningContractor(true);
    setDetailsError("");

    await assignContractor(
      selectedRequest.id,
      contractorId
    );

    const response =
      await getMaintenanceRequest(
        selectedRequest.id
      );

    setSelectedRequest(response.data);
  } catch (err) {
    setDetailsError(
      getErrorMessage(err)
    );
  } finally {
    setAssigningContractor(false);
  }
};
const handleRemoveContractor = async (
  contractorId: string
) => {
  if (!isManager || !selectedRequest) {
    return;
  }

  try {
    setAssigningContractor(true);
    setDetailsError("");

    await removeContractor(
      selectedRequest.id,
      contractorId
    );

    const response =
      await getMaintenanceRequest(
        selectedRequest.id
      );

    setSelectedRequest(response.data);
  } catch (err) {
    setDetailsError(
      getErrorMessage(err)
    );
  } finally {
    setAssigningContractor(false);
  }
};
const refreshSelectedRequest = async (
  requestId: string
) => {
  const response =
    await getMaintenanceRequest(requestId);

  setSelectedRequest(response.data);
};

const handleUpdateRequest = async (payload: {
  description: string;
  priority: MaintenancePriority;
}) => {
  if (!selectedRequest) {
    return;
  }

  if (!payload.description.trim()) {
    setDetailsError("Description is required.");
    return;
  }

  try {
    setUpdatingRequest(true);
    setDetailsError("");

    await updateMaintenanceRequest(
      selectedRequest.id,
      {
        description: payload.description.trim(),
        priority: payload.priority,
      }
    );

    await refreshSelectedRequest(selectedRequest.id);
    await loadRequests();
  } catch (err) {
    setDetailsError(getErrorMessage(err));
  } finally {
    setUpdatingRequest(false);
  }
};

const handleChangeStatus = async (
  nextStatus: MaintenanceStatus
) => {
  if (!selectedRequest) {
    return;
  }

  try {
    setUpdatingStatus(true);
    setDetailsError("");

    await changeMaintenanceStatus(
      selectedRequest.id,
      nextStatus
    );

    await refreshSelectedRequest(selectedRequest.id);
    await loadRequests();
  } catch (err) {
    setDetailsError(getErrorMessage(err));
  } finally {
    setUpdatingStatus(false);
  }
};

const handleAddNote = async (note: string) => {
  if (!selectedRequest || !note.trim()) {
    setDetailsError("Note cannot be empty.");
    return;
  }

  try {
    setAddingNote(true);
    setDetailsError("");

    await addTimelineNote(
      selectedRequest.id,
      note.trim()
    );

    await refreshSelectedRequest(selectedRequest.id);
  } catch (err) {
    setDetailsError(getErrorMessage(err));
  } finally {
    setAddingNote(false);
  }
};

const handleCreateRequest = async (
  event: React.FormEvent
) => {
  event.preventDefault();

  if (!createForm.unitId) {
    setCreateError("Please select a unit.");
    return;
  }

  if (!createForm.description.trim()) {
    setCreateError("Description is required.");
    return;
  }

  try {
    setCreateSaving(true);
    setCreateError("");

    await createMaintenanceRequest({
      unitId: createForm.unitId,
      title:
        createForm.title.trim() || undefined,
      description:
        createForm.description.trim(),
      priority: createForm.priority,
    });

    setShowCreateModal(false);

    await loadRequests();
  } catch (err) {
    setCreateError(
      getErrorMessage(err)
    );
  } finally {
    setCreateSaving(false);
  }
};
  return (
    <div className="maintenance-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            Operations
          </p>

          <h2>Maintenance</h2>

          <p>
            Track, assign and resolve property
            maintenance requests.
          </p>
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={openCreateModal}
        >
          <Plus size={17} />
          New request
        </button>
      </section>

      <section className="maintenance-stats">
        <StatCard
          label="Total requests"
          value={total}
          icon={<Wrench size={18} />}
        />

        <StatCard
          label="Reported"
          value={requests.filter(
            (request) =>
              request.status === "REPORTED"
          ).length}
        />

        <StatCard
          label="Scheduled"
          value={requests.filter(
            (request) =>
              request.status === "SCHEDULED"
          ).length}
        />

        <StatCard
          label="Resolved"
          value={requests.filter(
            (request) =>
              request.status === "RESOLVED"
          ).length}
        />
      </section>

      <section className="maintenance-card">
        <div className="maintenance-toolbar">
          <div className="maintenance-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search descriptions..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="maintenance-filters">
            <div className="select-wrapper">
              <select
                value={unitId}
                onChange={(event) => {
                  setUnitId(event.target.value);
                  setPage(1);
                }}
                disabled={unitsLoading}
              >
                <option value="">
                  {unitsLoading
                    ? "Loading units..."
                    : "All units"}
                </option>

                {units.map((unit) => (
                  <option
                    key={unit.id}
                    value={unit.id}
                  >
                    {unit.unitNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrapper">
              <Filter size={14} />

              <select
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target
                      .value as MaintenanceStatus | ""
                  );
                  setPage(1);
                }}
              >
                {statuses.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrapper">
              <select
                value={priority}
                onChange={(event) => {
                  setPriority(
                    event.target
                      .value as MaintenancePriority | ""
                  );
                  setPage(1);
                }}
              >
                {priorities.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {isManager && (
              <div className="select-wrapper">
                <select
                  value={contractorId}
                  onChange={(event) => {
                    setContractorId(event.target.value);
                    setPage(1);
                  }}
                  disabled={contractorsLoading}
                >
                  <option value="">
                    {contractorsLoading
                      ? "Loading contractors..."
                      : "All contractors"}
                  </option>

                  {contractors.map((contractor) => (
                    <option
                      key={contractor.id}
                      value={contractor.id}
                    >
                      {contractor.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(search ||
              unitId ||
              status ||
              priority ||
              contractorId) && (
              <button
                type="button"
                className="clear-filter-button"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="maintenance-error">
            <AlertCircle size={16} />

            <span>{error}</span>

            <button
              type="button"
              onClick={loadRequests}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <MaintenanceSkeleton />
        ) : requests.length === 0 ? (
          <MaintenanceEmpty
            hasFilters={
              !!(
                search ||
                unitId ||
                status ||
                priority ||
                contractorId
              )
            }
            onClear={clearFilters}
          />
        ) : (
          <>
            <div className="maintenance-table-wrapper">
              <table className="maintenance-table">
                <thead>
                  <tr>
                    <th>Request</th>

                    <th>Unit</th>

                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() =>
                          handleSort(
                            "priority"
                          )
                        }
                      >
                        Priority
                        <ArrowDownUp
                          size={12}
                        />
                      </button>
                    </th>

                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() =>
                          handleSort(
                            "status"
                          )
                        }
                      >
                        Status
                        <ArrowDownUp
                          size={12}
                        />
                      </button>
                    </th>

                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() =>
                          handleSort(
                            "createdAt"
                          )
                        }
                      >
                        Created
                        <ArrowDownUp
                          size={12}
                        />
                      </button>
                    </th>

                    <th className="actions-column">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="maintenance-request-title">
                          <strong>
                            {request.title}
                          </strong>

                          <span>
                            {request.description}
                          </span>
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="maintenance-unit"
                        >
                          {request.unitNumber}
                        </button>
                      </td>

                      <td>
                        <PriorityBadge
                          priority={
                            request.priority
                          }
                        />
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            request.status
                          }
                        />
                      </td>

                      <td>
                        <span className="maintenance-date">
                          {formatDate(
                            request.createdAt
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="maintenance-row-action">
                          <button
                            type="button"
                            title="View request"
                            onClick={() =>
                              handleViewRequest(request.id)
                            }
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>
                {total}{" "}
                {total === 1
                  ? "request"
                  : "requests"}{" "}
                · Page {page} of {totalPages}
              </span>

              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        current - 1,
                        1
                      )
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
          </>
        )}
      </section>
        {selectedRequest && (
     <MaintenanceDetailsModal
  request={selectedRequest}
  contractors={contractors}
  contractorsLoading={contractorsLoading}
  assigningContractor={assigningContractor}
  updatingRequest={updatingRequest}
  updatingStatus={updatingStatus}
  addingNote={addingNote}
  error={detailsError}
  user={user}
  canManageAssignments={isManager}
  onAssignContractor={handleAssignContractor}
  onRemoveContractor={handleRemoveContractor}
  onUpdateRequest={handleUpdateRequest}
  onChangeStatus={handleChangeStatus}
  onAddNote={handleAddNote}
  onClose={() => setSelectedRequest(null)}
/>
    )}
    {showCreateModal && (
  <CreateMaintenanceModal
    units={units}
    unitsLoading={unitsLoading}
    form={createForm}
    saving={createSaving}
    error={createError}
    onChange={(field, value) =>
      setCreateForm((current) => ({
        ...current,
        [field]: value,
      }))
    }
    onClose={() =>
      setShowCreateModal(false)
    }
    onSubmit={handleCreateRequest}
  />
)}
    </div>
  );
}

function CreateMaintenanceModal({
  units,
  unitsLoading,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  units: Unit[];
  unitsLoading: boolean;
  form: {
    unitId: string;
    title: string;
    description: string;
    priority: MaintenancePriority;
  };
  saving: boolean;
  error: string;
  onChange: (
    field:
      | "unitId"
      | "title"
      | "description"
      | "priority",
    value: string
  ) => void;
  onClose: () => void;
  onSubmit: (
    event: React.FormEvent
  ) => void;
}) {
  return (
    <div
      className="maintenance-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="maintenance-modal maintenance-create-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="maintenance-modal-header">
          <div>
            <p className="eyebrow">
              Maintenance request
            </p>

            <h3>New request</h3>

            <p>
              Create a maintenance request for a
              property unit.
            </p>
          </div>

          <button
            type="button"
            className="maintenance-modal-close"
            onClick={onClose}
            title="Close"
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
                onChange(
                  "unitId",
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

          <label>
            Title

            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                onChange(
                  "title",
                  event.target.value
                )
              }
              placeholder="e.g. Leaking kitchen faucet"
            />
          </label>

          <label>
            Description

            <textarea
              value={form.description}
              onChange={(event) =>
                onChange(
                  "description",
                  event.target.value
                )
              }
              placeholder="Describe the maintenance issue..."
              rows={5}
            />
          </label>

          <label>
            Priority

            <select
              value={form.priority}
              onChange={(event) =>
                onChange(
                  "priority",
                  event.target.value
                )
              }
            >
              <option value="LOW">
                Low
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="HIGH">
                High
              </option>
            </select>
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
              disabled={
                saving || unitsLoading
              }
            >
              {saving
                ? "Creating..."
                : "Create request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="maintenance-stat">
      <div className="maintenance-stat-top">
        <span>{label}</span>

        {icon && (
          <div className="maintenance-stat-icon">
            {icon}
          </div>
        )}
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function MaintenanceSkeleton() {
  return (
    <div className="maintenance-skeleton">
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            className="maintenance-skeleton-row"
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

function MaintenanceDetailsModal({
  request,
  contractors,
  contractorsLoading,
  assigningContractor,
  updatingRequest,
  updatingStatus,
  addingNote,
  error,
  user,
  canManageAssignments,
  onAssignContractor,
  onRemoveContractor,
  onUpdateRequest,
  onChangeStatus,
  onAddNote,
  onClose,
}: {
  request: MaintenanceRequestDetails;
  contractors: Contractor[];
  contractorsLoading: boolean;
  assigningContractor: boolean;
  updatingRequest: boolean;
  updatingStatus: boolean;
  addingNote: boolean;
  error: string;
  user: User | null;
  canManageAssignments: boolean;
  onAssignContractor: (
    contractorId: string
  ) => void;
  onRemoveContractor: (
    contractorId: string
  ) => void;
  onUpdateRequest: (payload: {
    description: string;
    priority: MaintenancePriority;
  }) => void;
  onChangeStatus: (
    status: MaintenanceStatus
  ) => void;
  onAddNote: (note: string) => void;
  onClose: () => void;
}) {
  const [isEditing, setIsEditing] =
    useState(false);
  const [editForm, setEditForm] = useState({
    description: request.description,
    priority: request.priority,
  });
  const [note, setNote] = useState("");

  useEffect(() => {
    setEditForm({
      description: request.description,
      priority: request.priority,
    });
    setNote("");
    setIsEditing(false);
  }, [
    request.id,
    request.description,
    request.priority,
    request.status,
  ]);

  const canChangeStatus =
    user?.role === "MANAGER" ||
    (user?.role === "CONTRACTOR" &&
      request.contractors.some(
        (contractor) => contractor.id === user.id
      ));

  const availableStatuses = canChangeStatus
    ? statusTransitions[request.status].filter(
        (status) =>
          status !== "SCHEDULED" ||
          request.contractors.length > 0
      )
    : [];

  const saveDisabled =
    updatingRequest ||
    !editForm.description.trim() ||
    (editForm.description.trim() ===
      request.description &&
      editForm.priority === request.priority);

  return (
    <div
      className="maintenance-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="maintenance-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="maintenance-modal-header">
          <div>
            <p className="eyebrow">
              Maintenance request
            </p>

            <h3>{request.title}</h3>

            <p>
              Unit {request.unitNumber}
            </p>
          </div>

          <button
            type="button"
            className="maintenance-modal-close"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="maintenance-modal-body">
          {error && (
            <div className="maintenance-error maintenance-modal-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="maintenance-detail-badges">
            <PriorityBadge
              priority={request.priority}
            />

            <StatusBadge
              status={request.status}
            />
          </div>

          <div className="maintenance-detail-grid">
            <div>
              <span>Unit</span>
              <strong>
                {request.unitNumber}
              </strong>
            </div>

            <div>
              <span>Address</span>
              <strong>
                {request.address}
              </strong>
            </div>

            <div>
              <span>Created by</span>
              <strong>
                {request.createdByName}
              </strong>
            </div>

            <div>
              <span>Created</span>
              <strong>
                {formatDate(request.createdAt)}
              </strong>
            </div>
          </div>

          <div className="maintenance-detail-section">
            <div className="maintenance-section-heading">
              <h4>Description</h4>

              <button
                type="button"
                className="secondary-action maintenance-inline-action"
                onClick={() => {
                  setIsEditing((current) => !current);
                  setEditForm({
                    description: request.description,
                    priority: request.priority,
                  });
                }}
                disabled={updatingRequest}
              >
                {isEditing ? "Cancel" : "Edit request"}
              </button>
            </div>

            {isEditing ? (
              <form
                className="maintenance-edit-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  onUpdateRequest(editForm);
                }}
              >
                <label>
                  Description

                  <textarea
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }))
                    }
                    rows={5}
                    disabled={updatingRequest}
                  />
                </label>

                <label>
                  Priority

                  <select
                    value={editForm.priority}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        priority: event.target
                          .value as MaintenancePriority,
                      }))
                    }
                    disabled={updatingRequest}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        description:
                          request.description,
                        priority: request.priority,
                      });
                    }}
                    disabled={updatingRequest}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-action"
                    disabled={saveDisabled}
                  >
                    {updatingRequest
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="maintenance-description">
                {request.description}
              </p>
            )}
          </div>

          {canChangeStatus && (
          <div className="maintenance-detail-section">
            <div className="maintenance-section-heading">
              <h4>Status</h4>

              <span className="maintenance-section-hint">
                Current status is{" "}
                {request.status.toLowerCase()}
              </span>
            </div>

            <div className="maintenance-status-row">
              {availableStatuses.length === 0 ? (
                <span className="maintenance-section-hint">
                  {request.status === "TRIAGED" &&
                  request.contractors.length === 0
                    ? "Assign a contractor before scheduling."
                    : "No status transitions available."}
                </span>
              ) : (
                availableStatuses.map((status) => (
                  <button
                    type="button"
                    className="primary-action"
                    key={status}
                    onClick={() => onChangeStatus(status)}
                    disabled={updatingStatus}
                  >
                    {updatingStatus
                      ? "Updating..."
                      : getStatusActionLabel(
                          request.status,
                          status
                        )}
                  </button>
                ))
              )}
            </div>
          </div>
          )}

          <div className="maintenance-detail-section">
  <div className="maintenance-section-heading">
    <h4>
      Contractors
      <span>
        {request.contractors.length}
      </span>
    </h4>

    <span className="maintenance-section-hint">
      {request.contractors.length === 0
        ? "No one assigned yet"
        : `${request.contractors.length} assigned`}
    </span>
  </div>

  {request.contractors.length > 0 && (
    <div className="maintenance-contractors">
      {request.contractors.map((contractor) => (
        <div
          className="maintenance-contractor"
          key={contractor.id}
        >
          <div className="maintenance-avatar">
            {contractor.name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="maintenance-contractor-info">
            <strong>{contractor.name}</strong>

            <span>{contractor.email}</span>
          </div>

          {canManageAssignments && (
            <button
              type="button"
              className="maintenance-contractor-remove"
              onClick={() =>
                onRemoveContractor(contractor.id)
              }
              disabled={assigningContractor}
              title="Remove contractor"
            >
              <X size={15} />
            </button>
          )}
        </div>
      ))}
    </div>
  )}

  {canManageAssignments && (
  <div className="maintenance-assign-row">
    <select
      defaultValue=""
      disabled={
        contractorsLoading ||
        assigningContractor
      }
      onChange={(event) => {
        if (event.target.value) {
          onAssignContractor(
            event.target.value
          );

          event.target.value = "";
        }
      }}
    >
      <option value="">
        {contractorsLoading
          ? "Loading contractors..."
          : "Select contractor to assign"}
      </option>

      {contractors
        .filter(
          (contractor) =>
            !request.contractors.some(
              (assigned) =>
                assigned.id === contractor.id
            )
        )
        .map((contractor) => (
          <option
            key={contractor.id}
            value={contractor.id}
          >
            {contractor.name} —{" "}
            {contractor.email}
          </option>
        ))}
    </select>

    {assigningContractor && (
      <span className="maintenance-assign-loading">
        Updating...
      </span>
    )}
  </div>
  )}
</div>

          <div className="maintenance-detail-section">
            <div className="maintenance-section-heading">
              <h4>Timeline</h4>
            </div>

            <form
              className="maintenance-note-form"
              onSubmit={(event) => {
                event.preventDefault();
                onAddNote(note);
                setNote("");
              }}
            >
              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                placeholder="Add a timeline note..."
                rows={3}
                disabled={addingNote}
              />

              <button
                type="submit"
                className="secondary-action"
                disabled={
                  addingNote || !note.trim()
                }
              >
                {addingNote
                  ? "Adding..."
                  : "Add note"}
              </button>
            </form>

            {request.timeline.length === 0 ? (
              <p className="maintenance-muted">
                No timeline events.
              </p>
            ) : (
              <div className="maintenance-timeline">
                {request.timeline.map(
                  (event) => (
                    <div
                      className="maintenance-timeline-item"
                      key={event.id}
                    >
                      <div className="timeline-dot" />

                      <div>
                        <strong>
                          {event.event_type
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(
                              /\b\w/g,
                              (char: string) => char.toUpperCase()
                            )}
                        </strong>

                        <p>
                          {event.note ||
                            (event.new_status
                              ? `Status changed to ${event.new_status
                                  .toLowerCase()
                                  .replace(
                                    /\b\w/g,
                                    (char) =>
                                      char.toUpperCase()
                                  )}.`
                              : "No additional details.")}
                        </p>

                        <span>
                          {event.performed_by_name}
                          {" · "}
                          {formatDate(
                            event.created_at
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MaintenanceEmpty({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="maintenance-empty">
      <div className="maintenance-empty-icon">
        <Wrench size={21} />
      </div>

      <h3>
        {hasFilters
          ? "No matching requests"
          : "No maintenance requests"}
      </h3>

      <p>
        {hasFilters
          ? "Try changing your filters or search term."
          : "Maintenance requests will appear here."}
      </p>

      {hasFilters && (
        <button
          type="button"
          className="secondary-action"
          onClick={onClear}
        >
          Clear filters
        </button>
      )}
    </div>
  );

}
