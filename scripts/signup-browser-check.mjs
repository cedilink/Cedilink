// Drives merchant sign-up in a real browser: with a wallet created for the merchant, and with
// a wallet the merchant already has. Then pays the new merchant's first checkout end to end.
// The frontend must run with NEXT_PUBLIC_TEST_WALLET=true (a stand-in replaces Freighter).
//
//   FRONTEND_URL=http://localhost:3000 API_URL=http://localhost:4000 node scripts/signup-browser-check.mjs
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
const SHOTS = process.env.SHOTS_DIR ?? new URL("../.checks/", import.meta.url).pathname;
const TESTNET = "Test SDF Network ; September 2015";
const customer = Keypair.fromSecret(process.env.CUSTOMER_SECRET);
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${ok || !detail ? "" : `  -> ${detail}`}`);
};

const browser = await chromium.launch({ channel: "chrome" });

/** A fresh browser profile whose stand-in wallet holds `signer` and reports `address`. */
async function session({ signer = customer, address = signer.publicKey(), mobile = false } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await context.exposeFunction("__sign", (xdr, passphrase) => {
    const tx = TransactionBuilder.fromXDR(xdr, passphrase);
    tx.sign(signer);
    return tx.toXDR();
  });
  await context.addInitScript(
    ({ address, passphrase }) => {
      window.__credlinkTestWallet = {
        isAvailable: async () => true,
        connect: async () => ({ address }),
        getAddress: async () => address,
        getNetworkPassphrase: async () => passphrase,
        signTransaction: (xdr, opts) => window.__sign(xdr, opts.networkPassphrase),
      };
    },
    { address, passphrase: TESTNET },
  );
  const errors = [];
  context.on("weberror", (e) => errors.push(e.error().message));
  context.on("console", (m) => m.type() === "error" && !/status of (401|409|422)/.test(m.text()) && errors.push(m.text()));
  return { context, errors };
}

const sees = (page, text, timeout = 15_000) => page.getByText(text, { exact: false }).first().waitFor({ timeout }).then(() => true, () => false);
const shot = (page, name) => page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: true });

async function fillAccount(page, business) {
  await page.getByLabel("Your name").fill("Kofi Mensah");
  await page.getByLabel("Business name").fill(business);
  await page.getByLabel("Email address").fill(`${business.toLowerCase().replace(/\W+/g, "-")}-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("a-long-password");
}

console.log("\nSign up with a wallet created for the merchant");
{
  const { context, errors } = await session();
  const page = await context.newPage();
  await page.goto(FRONTEND, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Try the Testnet demo" }).first().click();
  await page.waitForURL(/\/signup/, { timeout: 15_000 }).catch(() => {});
  check("the landing page leads to sign-up", page.url().includes("/signup"));
  check("creating a wallet is the default choice", (await page.getByRole("radio", { name: /Create a wallet for me/ }).getAttribute("aria-checked")) === "true");
  await fillAccount(page, "Accra Design Studio");
  await page.waitForTimeout(400); await shot(page, "s-01-signup");
  await page.getByRole("button", { name: "Create account" }).click();
  check("explains the wait while the wallet is set up", await sees(page, "Setting up your wallet on Stellar"));
  await page.waitForURL(/\/dashboard$/, { timeout: 60_000 }).catch(() => {});
  check("lands on the dashboard, signed in", page.url().endsWith("/dashboard") && (await sees(page, "Kofi Mensah")));
  check("Stellar USDC is already connected", await sees(page, "Stellar Testnet connected"));

  await page.getByRole("link", { name: "Stellar USDC" }).click();
  check("settings show the wallet was created for them", await sees(page, "Created and funded for you"));
  const wallet = await page.getByRole("textbox", { name: /Receiving wallet/ }).inputValue();
  check("the wallet is a new one", /^G[A-Z2-7]{55}$/.test(wallet) && wallet !== process.env.MERCHANT_PUBLIC_KEY, wallet);
  await page.waitForTimeout(400); await shot(page, "s-02-managed-settings");

  await page.goto(`${FRONTEND}/dashboard/payments/new`);
  await page.getByLabel("Product or service").fill("Logo design deposit");
  await page.getByLabel("Amount").fill("6.00");
  await page.getByRole("button", { name: "Generate checkout" }).click();
  check("creates a first payment straight away", await sees(page, "Checkout created"));
  const link = await page.locator("text=/\\/c\\/SP-\\d+/").first().textContent();

  // The customer, in the same browser, opens the link and pays.
  const checkout = await context.newPage();
  await checkout.goto(link, { waitUntil: "networkidle" });
  check("the checkout names the new business", await sees(checkout, "Logo design deposit"));
  await checkout.getByRole("button", { name: "Continue" }).click();
  check("and shows it as the merchant", await sees(checkout, "Accra Design Studio"));
  await checkout.getByRole("button", { name: "Connect Stellar Wallet" }).click();
  await checkout.getByRole("dialog").getByRole("button", { name: /Freighter/ }).click();
  await sees(checkout, "Available balance");
  await checkout.getByRole("button", { name: /^Pay \$6 USDC$/ }).click();
  check("the customer's payment succeeds", await sees(checkout, "Payment successful", 60_000));
  check("the merchant is told as it happens", await sees(page, "Payment successful", 15_000));
  check("no browser errors", errors.length === 0, errors.join(" | "));
  await context.close();
}

console.log("\nSign up with a wallet the merchant already has");
{
  // The stand-in "Freighter" holds an existing account that can receive the asset.
  const { context, errors } = await session({ address: process.env.MERCHANT_PUBLIC_KEY });
  const page = await context.newPage();
  await page.goto(`${FRONTEND}/signup`, { waitUntil: "networkidle" });
  await fillAccount(page, "Owusu Consulting");
  await page.getByRole("radio", { name: /Use a wallet I already have/ }).click();
  await page.getByRole("button", { name: "Connect Freighter" }).click();
  check("connecting fills in the public key", (await sees(page, "Connected Freighter")) && (await page.getByLabel("Public key").inputValue()) === process.env.MERCHANT_PUBLIC_KEY);
  await page.waitForTimeout(400); await shot(page, "s-03-own-wallet");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 30_000 }).catch(() => {});
  check("signs up without creating a wallet", page.url().endsWith("/dashboard"));
  await page.getByRole("link", { name: "Stellar USDC" }).click();
  check("settings show their own wallet", (await page.getByRole("textbox", { name: /Receiving wallet/ }).inputValue()) === process.env.MERCHANT_PUBLIC_KEY);
  check("and do not claim it was created for them", !(await sees(page, "Created and funded for you", 1_500)));
  check("no browser errors", errors.length === 0, errors.join(" | "));
  await context.close();
}

console.log("\nWallets that cannot be used");
{
  const stranger = Keypair.random();
  await fetch(`https://friendbot.stellar.org?addr=${stranger.publicKey()}`);
  const { context } = await session({ mobile: true });
  const page = await context.newPage();
  await page.goto(`${FRONTEND}/signup`, { waitUntil: "networkidle" });
  await fillAccount(page, "Pasted Key Ltd");
  await page.getByRole("radio", { name: /Use a wallet I already have/ }).click();
  await page.getByLabel("Public key").fill("not-a-key");
  await page.getByRole("button", { name: "Create account" }).click();
  check("refuses text that is not a public key", await sees(page, "valid Stellar public key"));
  await page.getByLabel("Public key").fill(stranger.publicKey());
  await page.getByRole("button", { name: "Create account" }).click();
  check("a wallet without the asset is refused, with the asset to add", (await sees(page, "has not added the USDC")) && (await sees(page, "Add this asset in your wallet")));
  check("stays on sign-up", page.url().includes("/signup"));
  check("fits a phone", !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
  await page.waitForTimeout(400); await shot(page, "s-04-missing-asset-mobile");
  await context.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`}  (screenshots in ${SHOTS})`);
process.exit(failures === 0 ? 0 : 1);
