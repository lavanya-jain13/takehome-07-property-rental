import { api } from "./api";

export type PaymentStatus =
  | "MATCHED"
  | "UNDERPAID"
  | "OVERPAID"
  | "UNMATCHED";

export interface RentPayment {
  id: string;
  unitId: string;
  unitNumber: string;
  address: string;
  paymentMonth: string;
  amount: number;
  recordedBy: string;
  recordedByName: string;
  recordedAt: string;
}

export interface RentPaymentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RentPaymentsResponse {
  data: RentPayment[];
  pagination: RentPaymentPagination;
}

export interface RentRollRow {
  unitId: string;
  unitNumber: string;
  address: string;
  tenantName: string;
  monthlyRent: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  paymentMonth: string;
  recordedAt: string | null;
}

export interface RentRollResponse {
  data: RentRollRow[];
}

export interface CreatePaymentPayload {
  unitId: string;
  paymentMonth: string;
  amount: number;
}

export interface BulkPayment {
  unitId: string;
  amount: number;
}

export interface BulkPaymentPayload {
  paymentMonth: string;
  payments: BulkPayment[];
}

export interface BulkPaymentResult {
  unitId: string;
  unitNumber?: string;
  status:
    | PaymentStatus
    | "ALREADY_RECORDED";
  expectedAmount?: number;
  amount: number;
}

export interface BulkPaymentResponse {
  paymentMonth: string;
  results: BulkPaymentResult[];
}

export interface RentAlert {
  unitId: string;
  unitNumber: string;
  address: string;
  tenantName: string;
  rentMonth: string;
  monthlyRent: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string;
  gracePeriodEndsAt: string;
  status: "OVERDUE";
}

export interface RentAlertsResponse {
  data: RentAlert[];
}

export async function getRentPayments(params?: {
  paymentMonth?: string;
  unitId?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.paymentMonth) {
    searchParams.set(
      "paymentMonth",
      params.paymentMonth
    );
  }

  if (params?.unitId) {
    searchParams.set(
      "unitId",
      params.unitId
    );
  }

  if (params?.page !== undefined) {
    searchParams.set(
      "page",
      String(params.page)
    );
  }

  if (params?.limit !== undefined) {
    searchParams.set(
      "limit",
      String(params.limit)
    );
  }

  const query = searchParams.toString();

  return api<RentPaymentsResponse>(
    `/rent/payments${query ? `?${query}` : ""}`
  );
}

export async function createRentPayment(
  payload: CreatePaymentPayload
) {
  return api<{ data: RentPayment }>(
    "/rent/payments",
    {
      method: "POST",
      body: payload,
    }
  );
}

export async function createBulkRentPayments(
  payload: BulkPaymentPayload
) {
  return api<BulkPaymentResponse>(
    "/rent/payments/bulk",
    {
      method: "POST",
      body: payload,
    }
  );
}

export async function getRentRoll(
  paymentMonth: string
) {
  return api<RentRollResponse>(
    `/rent/roll?paymentMonth=${encodeURIComponent(
      paymentMonth
    )}`
  );
}

export async function getRentAlerts() {
  return api<RentAlertsResponse>(
    "/rent/alerts"
  );
}

export async function dismissRentAlert(
  unitId: string,
  rentMonth: string
) {
  return api<{ data: unknown }>(
    `/rent/alerts/${unitId}/dismiss`,
    {
      method: "POST",
      body: {
        rentMonth,
      },
    }
  );
}