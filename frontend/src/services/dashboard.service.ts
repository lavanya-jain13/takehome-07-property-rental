import { api } from "./api";

export interface DashboardHeadline {
  openMaintenanceRequests: number;
  rentOverdueThisMonth: number;
  requestsResolvedThisWeek: number;
  rentCollectedThisMonth: number;
}

export interface MaintenanceByContractor {
  contractorId: string;
  contractorName: string;
  count: number;
}

export interface ResolvedPerWeek {
  week: string;
  count: number;
}

export interface DashboardData {
  headline: DashboardHeadline;
  maintenanceByStatus: Record<string, number>;
  maintenanceByContractor: MaintenanceByContractor[];
  resolvedPerWeek: ResolvedPerWeek[];
}

export interface DashboardResponse {
  data: DashboardData;
}

export async function getDashboard(): Promise<DashboardData> {
  const response = await api<DashboardResponse>("/dashboard");

  return response.data;
}