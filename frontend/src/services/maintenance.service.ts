import { api } from "./api";

export type MaintenancePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type MaintenanceStatus =
  | "REPORTED"
  | "TRIAGED"
  | "SCHEDULED"
  | "RESOLVED";

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  unitNumber: string;
  createdBy: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequestDetails
  extends MaintenanceRequest {
  address: string;
  createdByName: string;
  contractors: Contractor[];
  timeline: TimelineEvent[];
}

export interface Contractor {
  id: string;
  name: string;
  email: string;
}

export interface TimelineEvent {
  id: string;
  maintenance_request_id: string;
  performed_by: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
  performed_by_name?: string;
}

export interface MaintenanceListResponse {
  data: MaintenanceRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getMaintenanceRequests(params?: {
  unitId?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  contractorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
  sortOrder?: "asc" | "desc";
}) {
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== ""
      ) {
        query.set(key, String(value));
      }
    }
  );

  const queryString = query.toString();

  return api<MaintenanceListResponse>(
    `/maintenance-requests${
      queryString ? `?${queryString}` : ""
    }`
  );
}

export async function getMaintenanceRequest(
  requestId: string
) {
  return api<{
    data: MaintenanceRequestDetails;
  }>(`/maintenance-requests/${requestId}`);
}

export async function createMaintenanceRequest(
  payload: {
    unitId: string;
    title?: string;
    description: string;
    priority: MaintenancePriority;
  }
) {
  return api<{
    data: MaintenanceRequest;
  }>("/maintenance-requests", {
    method: "POST",
    body: payload,
  });
}

export async function updateMaintenanceRequest(
  requestId: string,
  payload: {
    description?: string;
    priority?: MaintenancePriority;
  }
) {
  return api<{
    data: MaintenanceRequest;
  }>(`/maintenance-requests/${requestId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function changeMaintenanceStatus(
  requestId: string,
  status: MaintenanceStatus
) {
  return api<{
    data: MaintenanceRequest;
  }>(
    `/maintenance-requests/${requestId}/status`,
    {
      method: "PATCH",
      body: { status },
    }
  );
}

export async function assignContractor(
  requestId: string,
  contractorId: string
) {
  return api<{
    data: {
      id: string;
      maintenance_request_id: string;
      contractor_id: string;
    };
  }>(
    `/maintenance-requests/${requestId}/contractors`,
    {
      method: "POST",
      body: { contractorId },
    }
  );
}

export async function removeContractor(
  requestId: string,
  contractorId: string
) {
  return api<void>(
    `/maintenance-requests/${requestId}/contractors/${contractorId}`,
    {
      method: "DELETE",
    }
  );
}

export async function addTimelineNote(
  requestId: string,
  note: string
) {
  return api<{
    data: TimelineEvent;
  }>(
    `/maintenance-requests/${requestId}/timeline`,
    {
      method: "POST",
      body: { note },
    }
  );
}

export type MaintenanceContractor = {
  id: string;
  name: string;
  email: string;
};

export type MaintenanceTimelineEvent = {
  id: string;
  maintenance_request_id: string;
  performed_by: string;
  performed_by_name: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
};

