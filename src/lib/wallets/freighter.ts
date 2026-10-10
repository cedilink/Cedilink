import { WalletError, type WalletAdapter } from "./types";

// Loaded on demand: the library talks to the browser extension and has no use on the server.
const load = () => import("@stellar/freighter-api");

export const freighter: WalletAdapter = {
  id: "freighter",

  async isAvailable() {
    const { isConnected } = await load();
    const result = await isConnected();
    return !result.error && result.isConnected;
  },

  async connect() {
    const { requestAccess } = await load();
    const result = await requestAccess();
    if (result.error || !result.address) throw new WalletError("rejected");
    return { address: result.address };
  },

  async getAddress() {
    const { getAddress } = await load();
    const result = await getAddress();
    return result.error || !result.address ? null : result.address;
  },

  async getNetworkPassphrase() {
    const { getNetworkDetails } = await load();
    const result = await getNetworkDetails();
    return result.error ? null : result.networkPassphrase;
  },

  async signTransaction(xdr, opts) {
    const { signTransaction } = await load();
    const result = await signTransaction(xdr, opts);
    if (result.error || !result.signedTxXdr) throw new WalletError("rejected");
    return result.signedTxXdr;
  },
};
