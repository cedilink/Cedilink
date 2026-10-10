"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Merchant, type Overview, type Payment, type PaymentList, type StellarSettings } from "@/lib/api/client";

export const keys = {
  me: ["me"] as const,
  overview: ["overview"] as const,
  settings: ["settings"] as const,
  payments: (status: string, q: string) => ["payments", status, q] as const,
  payment: (id: string) => ["payment", id] as const,
};

export const useMerchant = () =>
  useQuery({ queryKey: keys.me, queryFn: () => api<{ merchant: Merchant }>("/auth/me").then((r) => r.merchant), retry: false });

export const useOverview = () => useQuery({ queryKey: keys.overview, queryFn: () => api<Overview>("/overview") });

export const useStellarSettings = () =>
  useQuery({ queryKey: keys.settings, queryFn: () => api<StellarSettings>("/payment-methods/stellar-usdc") });

export const usePayments = (status: string, q: string) =>
  useQuery({
    queryKey: keys.payments(status, q),
    queryFn: () => api<PaymentList>(`/payments?${new URLSearchParams({ status, limit: "50", ...(q ? { q } : {}) })}`),
    // Keep the previous page on screen while a new filter or search loads.
    placeholderData: (previous) => previous,
  });

export const usePayment = (id: string) => useQuery({ queryKey: keys.payment(id), queryFn: () => api<Payment>(`/payments/${id}`) });

export function useSaveStellarSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { enabled: boolean; receivingAddress: string }) =>
      api<StellarSettings>("/payment-methods/stellar-usdc", { method: "PUT", body }),
    onSuccess: (settings) => {
      client.setQueryData(keys.settings, settings);
      void client.invalidateQueries({ queryKey: keys.overview });
    },
  });
}

export interface NewPayment {
  productName: string;
  amount: string;
  orderId?: string;
  customer?: { name?: string; email?: string };
}

export function useCreatePayment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: NewPayment; idempotencyKey: string }) =>
      api<Payment>("/payments", {
        method: "POST",
        headers: { "idempotency-key": idempotencyKey },
        body: { ...input, currency: "USDC", method: "stellar_usdc" },
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["payments"] });
      void client.invalidateQueries({ queryKey: keys.overview });
    },
  });
}
