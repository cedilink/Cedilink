import type { components } from "./schema";

export type Schemas = components["schemas"];
export type Payment = Schemas["Payment"];
export type PaymentList = Schemas["PaymentList"];
export type PaymentStatus = Schemas["PaymentStatus"];
export type Overview = Schemas["Overview"];
export type Checkout = Schemas["Checkout"];
export type Preflight = Schemas["Preflight"];
export type CheckoutStatus = Schemas["CheckoutStatus"];
export type StellarSettings = Schemas["StellarSettings"];
export type Merchant = Schemas["Merchant"];
export type Account = Schemas["Account"];
export type Notifications = Schemas["Notifications"];

/** An error answered by the API, carrying its machine-readable code. */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

// In the browser, requests go to this origin's /api proxy (see next.config.ts).
// On the server there is no origin to be relative to, so the backend is called directly.
const baseUrl =
  typeof window === "undefined"
    ? `${(process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "")}/v1`
    : "/api";

export async function api<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = init;
  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    credentials: "include",
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(
      error?.code ?? "NETWORK_ERROR",
      error?.message ?? "Something went wrong. Please try again.",
      response.status,
      error?.details ?? {},
    );
  }
  return payload as T;
}
