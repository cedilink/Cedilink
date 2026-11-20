"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type Account,
  type Merchant,
  type NotificationList,
  type Notifications,
  type Overview,
  type Payment,
  type PaymentList,
  type Reconciliation,
  type StellarSettings,
  type TransactionList,
  type Transfer,
} from "@/lib/api/client";

export const keys = {
  me: ["me"] as const,
  account: ["account"] as const,
  overview: ["overview"] as const,
  settings: ["settings"] as const,
  payments: (query: string) => ["payments", query] as const,
  payment: (id: string) => ["payment", id] as const,
  transactions: (query: string) => ["transactions", query] as const,
  transfer: (id: string) => ["transfer", id] as const,
  reconciliation: (state: string) => ["reconciliation", state] as const,
  notifications: ["notifications"] as const,
};

/** Query keys every payment or transfer change makes stale. */
export const PAYMENT_DATA = [["payments"], ["payment"], ["transactions"], ["transfer"], ["reconciliation"], keys.overview];

export const useMerchant = () =>
  useQuery({ queryKey: keys.me, queryFn: () => api<{ merchant: Merchant }>("/auth/me").then((r) => r.merchant), retry: false });

export const useOverview = () => useQuery({ queryKey: keys.overview, queryFn: () => api<Overview>("/overview") });

export const useStellarSettings = () =>
  useQuery({ queryKey: keys.settings, queryFn: () => api<StellarSettings>("/payment-methods/stellar-usdc") });

/** Payment links. `query` is a URLSearchParams string (status, q, …). */
export const usePayments = (query: string) =>
  useQuery({
    queryKey: keys.payments(query),
    queryFn: () => api<PaymentList>(`/payments?${new URLSearchParams(query + "&limit=50")}`),
    // Keep the previous page on screen while a new filter or search loads.
    placeholderData: (previous) => previous,
  });

export const usePayment = (id: string) =>
  useQuery({ queryKey: keys.payment(id), queryFn: () => api<Payment>(`/payments/${id}`), enabled: Boolean(id) });

/** Transaction history, paged with a cursor. `query` holds the filters. */
export const useTransactions = (query: string) =>
  useInfiniteQuery({
    queryKey: keys.transactions(query),
    initialPageParam: "",
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams(query);
      params.set("limit", "25");
      if (pageParam) params.set("cursor", pageParam);
      return api<TransactionList>(`/transactions?${params}`);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: (previous) => previous,
  });

export const useTransfer = (id: string) => useQuery({ queryKey: keys.transfer(id), queryFn: () => api<Transfer>(`/transfers/${id}`) });

export const useReconciliation = (state: "matched" | "unmatched" | "resolved") =>
  useInfiniteQuery({
    queryKey: keys.reconciliation(state),
    initialPageParam: "",
    queryFn: ({ pageParam }) =>
      api<Reconciliation>(`/reconciliation?${new URLSearchParams({ state, limit: "25", ...(pageParam ? { cursor: pageParam } : {}) })}`),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

function useInvalidatePaymentData() {
  const client = useQueryClient();
  return () => PAYMENT_DATA.forEach((queryKey) => void client.invalidateQueries({ queryKey }));
}

export function useResolveTransfer() {
  const client = useQueryClient();
  const invalidate = useInvalidatePaymentData();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: "accept" | "dismiss"; note?: string }) =>
      api<Transfer>(`/transfers/${id}/resolve`, { method: "POST", body: { action, ...(note ? { note } : {}) } }),
    onSuccess: (transfer) => {
      client.setQueryData(keys.transfer(transfer.id), transfer);
      invalidate();
      void client.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

export function useCancelPayment() {
  const client = useQueryClient();
  const invalidate = useInvalidatePaymentData();
  return useMutation({
    mutationFn: (paymentId: string) => api<Payment>(`/payments/${paymentId}/cancel`, { method: "POST" }),
    onSuccess: (payment) => {
      client.setQueryData(keys.payment(payment.paymentId), payment);
      invalidate();
    },
  });
}

export function useCheckTransaction(paymentId: string) {
  const invalidate = useInvalidatePaymentData();
  return useMutation({
    mutationFn: (transactionHash: string) =>
      api<Transfer>(`/payments/${paymentId}/check-transaction`, { method: "POST", body: { transactionHash } }),
    onSuccess: invalidate,
  });
}

export const useNotifications = () =>
  useQuery({ queryKey: keys.notifications, queryFn: () => api<NotificationList>("/notifications?limit=20") });

export function useMarkRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => api<{ unreadCount: number }>("/notifications/read", { method: "POST", body: ids ? { ids } : {} }),
    onMutate: (ids) => {
      // Optimistic: the dot and the unread rows clear at once.
      client.setQueryData<NotificationList>(keys.notifications, (list) =>
        list
          ? {
              ...list,
              notifications: list.notifications.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)),
              unreadCount: ids ? Math.max(0, list.unreadCount - list.notifications.filter((n) => ids.includes(n.id) && !n.read).length) : 0,
            }
          : list,
      );
    },
    onSettled: () => void client.invalidateQueries({ queryKey: keys.notifications }),
  });
}

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
  customer?: { name?: string; email?: string; reference?: string };
}

export function useCreatePayment() {
  const invalidate = useInvalidatePaymentData();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: NewPayment; idempotencyKey: string }) =>
      api<Payment>("/payments", {
        method: "POST",
        headers: { "idempotency-key": idempotencyKey },
        body: { ...input, currency: "USDC", asset: "USDC", method: "stellar_usdc" },
      }),
    onSuccess: invalidate,
  });
}

export const useAccount = () => useQuery({ queryKey: keys.account, queryFn: () => api<Account>("/account") });

/**
 * One mutation per settings section. Each answers with the whole account, which replaces
 * what is cached; the sidebar reads the merchant from its own query, so that is updated too.
 */
function useAccountMutation<Body>(method: "PUT" | "POST", path: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Body) => api<Account>(path, { method, body: body ?? undefined }),
    onSuccess: (account) => {
      client.setQueryData(keys.account, account);
      client.setQueryData(keys.me, account.merchant);
    },
  });
}

export const useSaveProfile = () => useAccountMutation<{ name: string; businessName: string }>("PUT", "/account/profile");
export const useChangeEmail = () => useAccountMutation<{ email: string; currentPassword: string }>("PUT", "/account/email");
export const useChangePassword = () => useAccountMutation<{ currentPassword: string; newPassword: string }>("PUT", "/account/password");
export const useSaveNotifications = () => useAccountMutation<Notifications>("PUT", "/account/notifications");
export const useRevokeOtherSessions = () => useAccountMutation<void>("POST", "/account/sessions/revoke-others");
