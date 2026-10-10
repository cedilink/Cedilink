import { albedo } from "./albedo";
import { freighter } from "./freighter";
import type { WalletAdapter, WalletId } from "./types";

export { WalletError } from "./types";
export type { WalletAdapter, WalletId } from "./types";

export const ALBEDO_ENABLED = process.env.NEXT_PUBLIC_ALBEDO_ENABLED === "true";

declare global {
  interface Window {
    /** Injected by automated browser tests in place of the Freighter extension. */
    __credlinkTestWallet?: Omit<WalletAdapter, "id">;
  }
}

export function getWallet(id: WalletId): WalletAdapter {
  // Only honoured in builds made for testing; production builds ignore the injected object.
  if (process.env.NEXT_PUBLIC_TEST_WALLET === "true" && typeof window !== "undefined" && window.__credlinkTestWallet) {
    return { id, ...window.__credlinkTestWallet };
  }
  return id === "albedo" ? albedo : freighter;
}
