"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { api, ApiError, type Checkout, type CheckoutStatus, type Preflight } from "@/lib/api/client";
import { getWallet, WalletError, type WalletId } from "@/lib/wallets";
import { initialState, reduce } from "./machine";

const TERMINAL = ["PAID", "EXPIRED"];
// How long the processing screen waits before switching to the calmer "pending" screen.
const PENDING_AFTER_MS = 30_000;
const POLL_EVERY_MS = 4_000;
const WALLET_CHECK_EVERY_MS = 3_000;

export function useCheckout(checkout: Checkout) {
  const [state, dispatch] = useReducer(reduce, checkout, initialState);
  const path = `/checkout/${checkout.paymentId}`;
  // Set when the customer cancels while the wallet prompt is still open, so a late
  // signature from that prompt is discarded.
  const attempt = useRef(0);

  const applyStatus = useCallback((s: Pick<CheckoutStatus, "status" | "transactionHash"> & { paidAt?: string | null }) => {
    dispatch({ type: "STATUS", status: s.status, transactionHash: s.transactionHash, paidAt: s.paidAt });
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      applyStatus(await api<CheckoutStatus>(`${path}/status`));
    } catch {
      // A failed refresh leaves the current screen in place; the next one will catch up.
    }
  }, [applyStatus, path]);

  // Live status: Server-Sent Events, with polling as the fallback and as a safety net.
  const terminal = TERMINAL.includes(state.status);
  useEffect(() => {
    if (terminal) return;
    const source = new EventSource(`/api${path}/events`);
    const onMessage = (event: MessageEvent) => {
      try {
        const update = JSON.parse(event.data);
        applyStatus(update);
        // Live updates carry only the status; fetch the rest (payment time) once it is paid.
        if (update.status === "PAID" && !update.paidAt) void refreshStatus();
      } catch {
        // Ignore a malformed event.
      }
    };
    source.addEventListener("snapshot", onMessage);
    source.addEventListener("payment.updated", onMessage);
    const poll = setInterval(refreshStatus, POLL_EVERY_MS * (source.readyState === EventSource.CLOSED ? 1 : 3));
    return () => {
      source.close();
      clearInterval(poll);
    };
  }, [terminal, path, applyStatus, refreshStatus]);

  useEffect(() => {
    if (state.screen !== "processing") return;
    const timer = setTimeout(() => dispatch({ type: "STILL_PENDING" }), PENDING_AFTER_MS);
    return () => clearTimeout(timer);
  }, [state.screen]);

  // While reviewing, notice if the wallet is locked or switched to another account.
  const wallet = state.wallet;
  const reviewing = state.screen === "review";
  useEffect(() => {
    if (!reviewing || !wallet) return;
    const timer = setInterval(async () => {
      try {
        const address = await getWallet(wallet.id).getAddress();
        if (address !== wallet.address) dispatch({ type: "WALLET_LOST" });
      } catch {
        dispatch({ type: "WALLET_LOST" });
      }
    }, WALLET_CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, [reviewing, wallet]);

  const reportProblem = useCallback((error: unknown) => {
    dispatch({ type: "PROBLEM", code: error instanceof ApiError ? error.code : "UNKNOWN" });
  }, []);

  const connect = useCallback(
    async (walletId: WalletId) => {
      dispatch({ type: "CONNECTING", walletId });
      const adapter = getWallet(walletId);
      try {
        if (!(await adapter.isAvailable())) return dispatch({ type: "WALLET_MISSING" });
        const { address } = await adapter.connect();
        const passphrase = await adapter.getNetworkPassphrase();
        if (passphrase !== null && passphrase !== checkout.network.passphrase) {
          return dispatch({ type: "PROBLEM", code: "WRONG_NETWORK" });
        }
        const preflight = await api<Preflight>(`${path}/preflight`, { method: "POST", body: { customerWallet: address } });
        if (!preflight.ok) return dispatch({ type: "PROBLEM", code: preflight.code ?? "UNKNOWN", preflight });
        dispatch({ type: "CONNECTED", wallet: { id: walletId, address }, preflight });
      } catch (error) {
        if (error instanceof ApiError) return reportProblem(error);
        // Anything else came from the wallet itself: the user declined, or it is not usable.
        const unavailable = error instanceof WalletError && error.reason === "unavailable";
        dispatch({ type: unavailable ? "WALLET_MISSING" : "WALLET_REJECTED" });
      }
    },
    [checkout.network.passphrase, path, reportProblem],
  );

  const pay = useCallback(async () => {
    if (!wallet) return;
    const mine = ++attempt.current;
    dispatch({ type: "PAY_STARTED" });
    const adapter = getWallet(wallet.id);
    try {
      // One silent retry covers a stale sequence number: the server asks for a rebuilt transaction.
      for (let round = 0; ; round++) {
        const built = await api<{ xdr: string; networkPassphrase: string }>(`${path}/transaction`, {
          method: "POST",
          body: { customerWallet: wallet.address },
        });
        let signedXdr: string;
        try {
          signedXdr = await adapter.signTransaction(built.xdr, {
            networkPassphrase: built.networkPassphrase,
            address: wallet.address,
          });
        } catch {
          if (mine === attempt.current) {
            await api(`${path}/cancel`, { method: "POST" }).catch(() => {});
            dispatch({ type: "SIGN_CANCELLED" });
          }
          return;
        }
        if (mine !== attempt.current) return;
        try {
          const result = await api<{ status: CheckoutStatus["status"]; transactionHash: string | null }>(`${path}/submit`, {
            method: "POST",
            body: { signedXdr },
          });
          return dispatch({ type: "SUBMITTED", ...result });
        } catch (error) {
          if (error instanceof ApiError && error.code === "REBUILD_REQUIRED" && round === 0) continue;
          throw error;
        }
      }
    } catch (error) {
      if (mine === attempt.current) reportProblem(error);
    }
  }, [wallet, path, reportProblem]);

  const cancelApproval = useCallback(async () => {
    attempt.current++;
    await api(`${path}/cancel`, { method: "POST" }).catch(() => {});
    dispatch({ type: "SIGN_CANCELLED" });
  }, [path]);

  /** "Try again": repeats the last sensible step for whichever screen the customer is on. */
  const retry = useCallback(() => {
    const walletId = state.wallet?.id ?? state.lastWalletId;
    if (walletId) void connect(walletId);
    else dispatch({ type: "OPEN_WALLETS" });
  }, [state.wallet, state.lastWalletId, connect]);

  return {
    state,
    connect,
    pay,
    cancelApproval,
    retry,
    refreshStatus,
    next: () => dispatch({ type: "CONTINUE" }),
    back: () => dispatch({ type: "BACK" }),
    openWallets: () => dispatch({ type: "OPEN_WALLETS" }),
    closeWallets: () => dispatch({ type: "CLOSE_WALLETS" }),
    payFromWalletApp: () => dispatch({ type: "OPEN_WALLET_APP" }),
    disconnect: () => dispatch({ type: "DISCONNECT" }),
  };
}

export type CheckoutController = ReturnType<typeof useCheckout>;
