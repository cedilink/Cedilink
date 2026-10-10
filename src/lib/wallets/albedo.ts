import { WalletError, type WalletAdapter } from "./types";

const load = async () => (await import("@albedo-link/intent")).default;

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

// Albedo is a web wallet that opens in a pop-up, so it works without an extension,
// including in mobile browsers. It keeps no session: the address is remembered here.
let connectedAddress: string | null = null;

export const albedo: WalletAdapter = {
  id: "albedo",

  async isAvailable() {
    return true;
  },

  async connect() {
    const client = await load();
    try {
      const result = await client.publicKey({});
      connectedAddress = result.pubkey;
      return { address: result.pubkey };
    } catch {
      throw new WalletError("rejected");
    }
  },

  async getAddress() {
    return connectedAddress;
  },

  // Albedo signs for whichever network each request names.
  async getNetworkPassphrase() {
    return null;
  },

  async signTransaction(xdr, opts) {
    const client = await load();
    try {
      const result = await client.tx({
        xdr,
        pubkey: opts.address,
        network: opts.networkPassphrase === TESTNET_PASSPHRASE ? "testnet" : "public",
      });
      return result.signed_envelope_xdr;
    } catch {
      throw new WalletError("rejected");
    }
  },
};
