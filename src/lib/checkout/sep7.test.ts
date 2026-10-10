import { describe, expect, it } from "vitest";
import { walletAppLink } from "./sep7";

const checkout = {
  recipientAddress: "GDOR5DW7P4JXAO7SIKWR62CFNKC22W4IZALSHM56AANGASVM2SISZYFQ",
  amount: "25.00",
  asset: "USDC",
  assetIssuer: "GDKA6OJ7FCP2JOMETKD2NRSZNBGY2CDYBI4Q2HE6AJRKXNOZ2KSVYGDF",
  paymentId: "SP-00124",
  network: { id: "testnet", label: "Stellar Testnet", passphrase: "Test SDF Network ; September 2015" },
};

describe("walletAppLink", () => {
  it("builds a SEP-7 pay link carrying everything needed to match the payment", () => {
    const link = walletAppLink(checkout);
    expect(link.startsWith("web+stellar:pay?")).toBe(true);
    const params = new URLSearchParams(link.slice("web+stellar:pay?".length));
    expect(Object.fromEntries(params)).toEqual({
      destination: checkout.recipientAddress,
      amount: "25.00",
      asset_code: "USDC",
      asset_issuer: checkout.assetIssuer,
      memo: "SP-00124",
      memo_type: "MEMO_TEXT",
      network_passphrase: "Test SDF Network ; September 2015",
    });
  });

  it("encodes spaces as %20, not +", () => {
    expect(walletAppLink(checkout)).toContain("network_passphrase=Test%20SDF%20Network%20%3B%20September%202015");
    // The scheme itself contains a "+"; the query must not.
    expect(walletAppLink(checkout).split("?")[1]).not.toContain("+");
  });
});
