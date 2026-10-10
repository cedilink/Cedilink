export type WalletId = "freighter" | "albedo";

/** Why a wallet call did not produce a result. */
export class WalletError extends Error {
  constructor(public readonly reason: "rejected" | "unavailable") {
    super(reason);
  }
}

/** One Stellar wallet. Adding a wallet means adding an implementation of this. */
export interface WalletAdapter {
  id: WalletId;
  /** False when the wallet cannot be used in this browser (e.g. extension not installed). */
  isAvailable(): Promise<boolean>;
  /** Asks the user to share their address. Throws WalletError("rejected") if they decline. */
  connect(): Promise<{ address: string }>;
  /** The currently selected address, or null when locked or disconnected. */
  getAddress(): Promise<string | null>;
  /** Network passphrase the wallet is set to, or null when the wallet has no fixed network. */
  getNetworkPassphrase(): Promise<string | null>;
  /** Returns the signed transaction XDR. Throws WalletError("rejected") if the user declines. */
  signTransaction(xdr: string, opts: { networkPassphrase: string; address: string }): Promise<string>;
}
