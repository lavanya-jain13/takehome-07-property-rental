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
  getMaintenanceRequests,
  getMaintenanceRequest,
  type MaintenancePriority,
  type MaintenanceRequest,
  type MaintenanceRequestDetails,
  type MaintenanceStatus,
} from "../services/maintenance.service";

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
  const [requests, setRequests] = useState<
    MaintenanceRequest[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [selectedRequest, setSelectedRequest] =
  useState<MaintenanceRequestDetails | null>(null);

  const [detailsLoading, setDetailsLoading] =
  useState(false);

  const [detailsError, setDetailsError] =
  useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] =
    useState<MaintenanceStatus | "">("");

  const [priority, setPriority] =
    useState<MaintenancePriority | "">("");

  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =
    useState(1);

  const [sortBy, setSortBy] = useState<
    "createdAt" | "updatedAt" | "priority" | "status"
  >("createdAt");

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getMaintenanceRequests({
          search: search.trim() || undefined,
          status: status || undefined,
          priority: priority || undefined,
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
    status,
    priority,
    page,
    sortBy,
    sortOrder,
  ]);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setPage(1);
  };

  const handleSort = (
    field:
      | "createdAt"
      | "updatedAt"
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
              placeholder="Search requests or units..."
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

            {(search ||
              status ||
              priority) && (
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
                status ||
                priority
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
        onClose={() => setSelectedRequest(null)}
      />
    )}
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
  onClose,
}: {
  request: MaintenanceRequestDetails;
  onClose: () => void;
}) {
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
            <h4>Description</h4>

            <p className="maintenance-description">
              {request.description}
            </p>
          </div>

          <div className="maintenance-detail-section">
            <h4>
              Contractors
              <span>
                {request.contractors.length}
              </span>
            </h4>

            {request.contractors.length === 0 ? (
              <p className="maintenance-muted">
                No contractors assigned.
              </p>
            ) : (
              <div className="maintenance-contractors">
                {request.contractors.map(
                  (contractor) => (
                    <div
                      className="maintenance-contractor"
                      key={contractor.id}
                    >
                      <div className="maintenance-avatar">
                        {contractor.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {contractor.name}
                        </strong>

                        <span>
                          {contractor.email}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="maintenance-detail-section">
            <h4>Timeline</h4>

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