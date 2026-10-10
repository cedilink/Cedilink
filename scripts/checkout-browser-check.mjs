// Drives the checkout in a real browser against a running frontend and backend.
// A stand-in wallet (signing with the Testnet customer key) replaces the Freighter
// extension, which cannot be automated. The frontend must run with NEXT_PUBLIC_TEST_WALLET=true.
//
//   FRONTEND_URL=http://localhost:3000 API_URL=http://localhost:4000 node scripts/checkout-browser-check.mjs
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";

const backend = new URL("../../cedlink-backend/", import.meta.url);
const require = createRequire(new URL("package.json", backend));
const { Keypair, TransactionBuilder } = require("@stellar/stellar-sdk");
for (const file of [".env.testnet", ".env.local"]) {
  try {
    process.loadEnvFile(new URL(file, backend));
  } catch {
    // optional
  }
}

const FRONTEND = process.env.FRONTEND_URL ?? "http://localhost:3000";
const API = `${process.env.API_URL ?? "http://localhost:4000"}/v1`;
const SHOTS = process.env.SHOTS_DIR ?? new URL("../.checks/", import.meta.url).pathname;
const TESTNET = "Test SDF Network ; September 2015";
const customer = Keypair.fromSecret(process.env.CUSTOMER_SECRET);
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${ok || !detail ? "" : `  -> ${detail}`}`);
};

// Merchant side, over the API.
let cookie = "";
async function merchant(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = response.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  return response.json();
}
await merchant("POST", "/auth/login", { email: process.env.SEED_MERCHANT_EMAIL, password: process.env.SEED_MERCHANT_PASSWORD });
const createPayment = async (amount, productName = "Ghana Web3 Conference Ticket") =>
  (await merchant("POST", "/payments", { productName, amount, currency: "USDC", method: "stellar_usdc", returnUrl: "https://example.com/orders/124" })).paymentId;

const browser = await chromium.launch({ channel: "chrome" });

/** Opens a checkout with a stand-in wallet behaving as `mode` says. */
async function open(paymentId, { mode = "ok", mobile = false, passphrase = TESTNET } = {}) {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.exposeFunction("__sign", (xdr, networkPassphrase) => {
    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    tx.sign(customer);
    return tx.toXDR();
  });
  await page.addInitScript(
    ({ address, mode, passphrase }) => {
      window.__credlinkTestWallet = {
        isAvailable: async () => mode !== "missing",
        connect: async () => {
          if (mode === "reject") throw new Error("declined");
          return { address };
        },
        getAddress: async () => address,
        getNetworkPassphrase: async () => passphrase,
        signTransaction: (xdr, opts) => window.__sign(xdr, opts.networkPassphrase),
      };
    },
    { address: customer.publicKey(), mode, passphrase },
  );
  await page.goto(`${FRONTEND}/c/${paymentId}`, { waitUntil: "networkidle" });
  return { page, errors, close: () => context.close() };
}

const shot = (page, name) => page.screenshot({ path: `${SHOTS}${name}.png` });
const sees = (page, text, timeout = 15_000) =>
  page.getByText(text, { exact: false }).first().waitFor({ timeout }).then(() => true, () => false);
const settle = (page) => page.waitForTimeout(700);

async function connectFreighter(page) {
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Connect Stellar Wallet" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Freighter/ }).click();
}

console.log("\nHappy path (desktop)");
{
  const id = await createPayment("25.00");
  const { page, errors, close } = await open(id);
  check("01 shows the method list and total", (await sees(page, "Choose payment method")) && (await sees(page, "$25.00")));
  await settle(page); await shot(page, "01-select-method");
  await page.getByRole("button", { name: "Continue" }).click();
  check("02 shows the order summary", (await sees(page, "Amount due")) && (await sees(page, id)));
  await settle(page); await shot(page, "02-summary");
  await page.getByRole("button", { name: "Connect Stellar Wallet" }).click();
  check("03 opens the wallet picker", await sees(page, "Connect your Stellar wallet"));
  await settle(page); await shot(page, "03-wallet-picker");
  await page.getByRole("dialog").getByRole("button", { name: /Freighter/ }).click();
  check("04 shows wallet, balance and fee", (await sees(page, "Available balance")) && (await sees(page, "Network fee")));
  await settle(page); await shot(page, "04-review");
  await page.getByRole("button", { name: /^Pay \$25 USDC$/ }).click();
  check("06 shows processing steps", await sees(page, "Processing payment"));
  await settle(page); await shot(page, "06-processing");
  check("07 reaches success only after verification", await sees(page, "Payment successful", 60_000));
  await page.waitForTimeout(1600); await shot(page, "07-success");
  check("07 links to the transaction", (await page.getByRole("link", { name: "View Transaction" }).getAttribute("href"))?.includes("stellar.expert/explorer/testnet/tx/") ?? false);
  const paid = await merchant("GET", `/payments/${id}`);
  check("backend agrees the payment is PAID", paid.status === "PAID", paid.status);
  check("no browser errors", errors.length === 0, errors.join(" | "));
  await close();

  console.log("\nReturning to a paid link");
  const again = await open(id);
  check("14 shows already paid", await sees(again.page, "Already paid"));
  await settle(again.page); await shot(again.page, "14-already-paid");
  await again.close();
}

console.log("\nProblems");
{
  const big = await createPayment("500000.00", "Too expensive");
  const a = await open(big);
  await connectFreighter(a.page);
  check("08 not enough USDC, with balance and amount needed", (await sees(a.page, "Not enough USDC")) && (await sees(a.page, "Needed 500000.00 USDC")));
  await settle(a.page); await shot(a.page, "08-insufficient-usdc");
  await a.close();

  const id = await createPayment("3.00", "Problem cases");
  const missing = await open(id, { mode: "missing" });
  await connectFreighter(missing.page);
  check("16 Freighter not found", await sees(missing.page, "Freighter not found"));
  await settle(missing.page); await shot(missing.page, "16-freighter-not-found");
  await missing.close();

  const rejected = await open(id, { mode: "reject" });
  await connectFreighter(rejected.page);
  check("16 connection rejected", await sees(rejected.page, "Connection rejected"));
  await rejected.close();

  const wrong = await open(id, { passphrase: "Public Global Stellar Network ; September 2015" });
  await connectFreighter(wrong.page);
  check("12 wrong network", await sees(wrong.page, "Wrong network or asset"));
  await settle(wrong.page); await shot(wrong.page, "12-wrong-network");
  await wrong.close();

  const none = await open("SP-99999");
  check("unknown payment shows not found", await sees(none.page, "Checkout not found"));
  await none.close();
}

console.log("\nMobile");
{
  const id = await createPayment("12.50", "Mobile checkout");
  const { page, errors, close } = await open(id, { mobile: true });
  await settle(page); await shot(page, "m-01-select-method");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Connect Stellar Wallet" }).click();
  check("03 bottom sheet opens", await sees(page, "Open in wallet app"));
  await settle(page); await shot(page, "m-03-wallet-sheet");
  await page.getByRole("dialog").getByRole("button", { name: /Freighter/ }).click();
  check("04 review", await sees(page, "Review Payment"));
  await settle(page); await shot(page, "m-04-review");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  check("no horizontal scroll", !overflow);
  await page.getByRole("button", { name: /^Pay \$12\.50 USDC$/ }).click();
  check("07 success on mobile", await sees(page, "Payment successful", 60_000));
  await page.waitForTimeout(1600); await shot(page, "m-07-success");
  check("no browser errors", errors.length === 0, errors.join(" | "));
  await close();
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`}  (screenshots in ${SHOTS})`);
process.exit(failures === 0 ? 0 : 1);
