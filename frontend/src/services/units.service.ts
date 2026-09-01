import { api } from "./api";

export interface Unit {
  id: string;
  unitNumber: string;
  address: string;
  tenantName: string;
  monthlyRent: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequestSummary {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnitDetails extends Unit {
  maintenanceRequests: MaintenanceRequestSummary[];
}

export interface UnitsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UnitsListResponse {
  data: Unit[];
  pagination: UnitsPagination;
}

export interface UnitResponse {
  data: Unit;
}

export interface UnitDetailsResponse {
  data: UnitDetails;
}

export interface CreateUnitPayload {
  unitNumber: string;
  address: string;
  tenantName: string;
  monthlyRent: number;
}

export type UpdateUnitPayload =
  Partial<CreateUnitPayload>;

export async function getUnits(params?: {
  status?: "ACTIVE" | "ARCHIVED";
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.set("status", params.status);
  }

  if (params?.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  return api<UnitsListResponse>(
    `/units${query ? `?${query}` : ""}`
  );
}

export async function getUnit(unitId: string) {
  return api<UnitDetailsResponse>(
    `/units/${unitId}`
  );
}

export async function createUnit(
  payload: CreateUnitPayload
) {
  return api<UnitResponse>("/units", {
    method: "POST",
    body: payload,
  });
}

export async function updateUnit(
  unitId: string,
  payload: UpdateUnitPayload
) {
  return api<UnitResponse>(
    `/units/${unitId}`,
    {
      method: "PATCH",
      body: payload,
    }
  );
}

export async function archiveUnit(unitId: string) {
  return api<UnitResponse>(
    `/units/${unitId}/archive`,
    {
      method: "POST",
    }
  );
}

export async function restoreUnit(unitId: string) {
  return api<UnitResponse>(
    `/units/${unitId}/restore`,
    {
      method: "POST",
    }
  );
}