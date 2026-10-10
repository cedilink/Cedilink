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
const { Asset, BASE_FEE, Horizon, Keypair, Memo, Networks, Operation, TransactionBuilder } = require("@stellar/stellar-sdk");
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
// Set EXPIRY_ONLY=true (with a backend started with PAYMENT_TTL_MINUTES=1) to run just the expiry case.
const EXPIRY_ONLY = process.env.EXPIRY_ONLY === "true";

/**
 * Opens a checkout with a stand-in wallet. `mode` covers connection behaviour; once the
 * page is open, the wallet can be steered from the test through `window.__wallet`:
 *   sign: "ok" | "reject" | "hang"   how the next signature request behaves
 *   locked: true                     the wallet reports no address, as when locked
 */
async function open(paymentId, { mode = "ok", mobile = false, passphrase = TESTNET, signer = customer } = {}) {
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
    tx.sign(signer);
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
        getAddress: async () => (window.__wallet.locked ? null : address),
        getNetworkPassphrase: async () => passphrase,
        signTransaction: async (xdr, opts) => {
          // "hang" models a wallet prompt left open: wait until the test decides.
          while (window.__wallet.sign === "hang") await new Promise((resolve) => setTimeout(resolve, 100));
          if (window.__wallet.sign === "reject") throw new Error("declined");
          return window.__sign(xdr, opts.networkPassphrase);
        },
      };
      window.__wallet = { sign: "ok", locked: false };
    },
    { address: signer.publicKey(), mode, passphrase },
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

// The checks spend the customer's test USDC. When it runs low, buy more with its test XLM
// on Testnet's exchange, so a run never fails for lack of funds.
{
  const testnet = new Horizon.Server("https://horizon-testnet.stellar.org");
  const asset = new Asset("USDC", (await merchant("GET", "/payment-methods/stellar-usdc")).asset.issuer);
  const account = await testnet.loadAccount(customer.publicKey());
  const held = Number(account.balances.find((b) => b.asset_code === "USDC" && b.asset_issuer === asset.getIssuer())?.balance ?? 0);
  if (held < 150) {
    const amount = (300 - held).toFixed(2);
    console.log(`Customer holds ${held} test USDC; buying ${amount} more.`);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.pathPaymentStrictReceive({ sendAsset: Asset.native(), sendMax: String(Math.ceil(Number(amount) * 25)), destination: customer.publicKey(), destAsset: asset, destAmount: amount }))
      .setTimeout(60)
      .build();
    tx.sign(customer);
    await testnet.submitTransaction(tx);
  }
}

if (!EXPIRY_ONLY) {
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
  check("08 offers test USDC on Testnet", (await a.page.getByRole("button", { name: "Get test USDC" }).count()) === 1);
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

console.log("\nWallet prompt: cancel, decline, disconnect");
{
  const id = await createPayment("4.00", "Prompt cases");
  const { page, errors, close } = await open(id);
  await connectFreighter(page);
  await sees(page, "Available balance");

  await page.evaluate(() => (window.__wallet.sign = "hang"));
  await page.getByRole("button", { name: /^Pay \$4 USDC$/ }).click();
  check("05 waits for approval while the wallet prompt is open", await sees(page, "Waiting for approval"));
  await settle(page); await shot(page, "05-waiting-for-approval");
  check("05 the payment is marked as started", (await merchant("GET", `/payments/${id}`)).status === "PAYMENT_INITIATED");
  await page.getByRole("button", { name: "Cancel" }).click();
  check("05 cancel returns to review", await sees(page, "Available balance"));
  check("05 cancel releases the payment", (await merchant("GET", `/payments/${id}`)).status === "AWAITING_PAYMENT");
  // The abandoned prompt is approved late; its signature must be ignored.
  await page.evaluate(() => (window.__wallet.sign = "ok"));
  await page.waitForTimeout(2500);
  check("05 a late signature from a cancelled prompt is not submitted", (await merchant("GET", `/payments/${id}`)).status === "AWAITING_PAYMENT");

  await page.evaluate(() => (window.__wallet.sign = "reject"));
  await page.getByRole("button", { name: /^Pay \$4 USDC$/ }).click();
  check("declining in the wallet returns to review", (await sees(page, "Available balance")) && (await merchant("GET", `/payments/${id}`)).status === "AWAITING_PAYMENT");

  await page.evaluate(() => (window.__wallet.locked = true));
  check("15 a locked wallet is noticed on the review screen", await sees(page, "Wallet disconnected", 10_000));
  await settle(page); await shot(page, "15-wallet-disconnected");
  await page.evaluate(() => ((window.__wallet.locked = false), (window.__wallet.sign = "ok")));
  await page.getByRole("button", { name: "Reconnect wallet" }).click();
  check("15 reconnecting returns to review", await sees(page, "Available balance"));
  await page.getByRole("button", { name: /^Pay \$4 USDC$/ }).click();
  check("the payment still completes afterwards", await sees(page, "Payment successful", 60_000));
  check("no browser errors", errors.length === 0, errors.join(" | "));
  await close();
}

const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
// The asset the server accepts, as the server reports it.
const usdc = new Asset("USDC", (await merchant("GET", "/payment-methods/stellar-usdc")).asset.issuer);
async function send(source, ...operations) {
  const builder = new TransactionBuilder(await horizon.loadAccount(source.publicKey()), { fee: BASE_FEE, networkPassphrase: Networks.TESTNET }).setTimeout(60);
  for (const operation of operations) builder.addOperation(operation);
  const tx = builder.build();
  tx.sign(source);
  return horizon.submitTransaction(tx);
}

console.log("\nNot enough XLM for the fee");
{
  // A wallet holding USDC but only its minimum XLM reserve.
  const broke = Keypair.random();
  const funded = await fetch(`https://friendbot.stellar.org?addr=${broke.publicKey()}`);
  check("test account funded", funded.ok);
  await send(broke, Operation.changeTrust({ asset: usdc }));
  await send(customer, Operation.payment({ destination: broke.publicKey(), asset: usdc, amount: "10" }));
  const xlm = (await horizon.loadAccount(broke.publicKey())).balances.find((b) => b.asset_type === "native").balance;
  // Reserve for the account plus one trustline is 1.5 XLM; send away everything else.
  await send(broke, Operation.payment({ destination: customer.publicKey(), asset: Asset.native(), amount: (Number(xlm) - 1.5 - 0.00001).toFixed(7) }));

  const id = await createPayment("2.00", "Fee case");
  const { page, close } = await open(id, { signer: broke });
  await connectFreighter(page);
  check("09 explains that XLM is needed for the fee", (await sees(page, "Not enough XLM for the fee")) && (await sees(page, "XLM is the fee token")));
  await settle(page); await shot(page, "09-insufficient-xlm");
  await close();
}

console.log("\nA Testnet wallet that has not added this USDC");
{
  // Exists on Testnet and has XLM, but no trustline: what a tester's own account looks like.
  const stranger = Keypair.random();
  check("test account funded", (await fetch(`https://friendbot.stellar.org?addr=${stranger.publicKey()}`)).ok);
  const id = await createPayment("2.00", "Trustline case");
  let { page, close } = await open(id, { signer: stranger });
  await connectFreighter(page);
  check("12 says the wallet is on the right network but lacks the asset", (await sees(page, "hasn't added the USDC this merchant accepts")) && (await sees(page, "Issuer")));
  check("12 does not blame the network", !(await sees(page, "Switch your wallet", 1_000)));
  await close();

  // The same wallet after acquiring a token called USDC from some other issuer.
  const impostor = Keypair.random();
  await fetch(`https://friendbot.stellar.org?addr=${impostor.publicKey()}`);
  const fake = new Asset("USDC", impostor.publicKey());
  await send(stranger, Operation.changeTrust({ asset: fake }));
  await send(impostor, Operation.payment({ destination: stranger.publicKey(), asset: fake, amount: "9300" }));
  ({ page, close } = await open(id, { signer: stranger }));
  await connectFreighter(page);
  check("12 names the look-alike token the wallet holds", (await sees(page, "holds 9300.00 USDC, but from a different issuer")) && (await sees(page, "Yours is issued by")));
  await settle(page); await shot(page, "12-lookalike-with-top-up");

  // On Testnet that same screen can fix the wallet in one approval.
  await page.getByRole("button", { name: "Get test USDC" }).click();
  check("12 Get test USDC leads straight to the review screen", await sees(page, "Available balance", 60_000));
  check("the wallet now holds exactly what the payment needs", await sees(page, "2.00 USDC"));
  await page.getByRole("button", { name: /^Pay \$2 USDC$/ }).click();
  check("and the payment succeeds", await sees(page, "Payment successful", 60_000));
  await close();

  // A wallet whose account does not exist on Testnet at all, as with a fresh Albedo account.
  const nobody = Keypair.random();
  const id2 = await createPayment("3.00", "New account case");
  ({ page, close } = await open(id2, { signer: nobody }));
  await connectFreighter(page);
  check("12 says the account does not exist on Testnet", await sees(page, "doesn't exist on Stellar Testnet yet"));
  await page.getByRole("button", { name: "Get test USDC" }).click();
  check("12 Get test USDC creates and funds the account", await sees(page, "Available balance", 90_000));
  await page.getByRole("button", { name: /^Pay \$3 USDC$/ }).click();
  check("and that payment succeeds too", await sees(page, "Payment successful", 60_000));
  await settle(page); await shot(page, "12-missing-trustline");
  await close();
}

console.log("\nA transaction that fails on Stellar, then a retry");
{
  const merchantKey = Keypair.fromSecret(process.env.MERCHANT_SECRET);
  const balance = (await horizon.loadAccount(merchantKey.publicKey())).balances.find((b) => b.asset_code === "USDC" && b.asset_issuer === usdc.getIssuer()).balance;
  const id = await createPayment("6.00", "Failure case");
  const { page, errors, close } = await open(id);
  await connectFreighter(page);
  await sees(page, "Available balance");
  // Cap the merchant's USDC trustline at its current balance, so the incoming payment
  // is accepted by the network but fails when applied.
  await send(merchantKey, Operation.changeTrust({ asset: usdc, limit: balance }));
  try {
    await page.getByRole("button", { name: /^Pay \$6 USDC$/ }).click();
    check("10 shows payment failed", await sees(page, "Payment failed", 60_000));
    await settle(page); await shot(page, "10-payment-failed");
    const failed = await merchant("GET", `/payments/${id}`);
    check("the backend recorded the failure and did not mark it paid", failed.status === "FAILED" && failed.verification?.transactionSuccessful === false, `${failed.status} ${failed.failureReason}`);
    console.log(`        reason: ${failed.failureReason}`);
  } finally {
    await send(merchantKey, Operation.changeTrust({ asset: usdc }));
  }
  await page.getByRole("button", { name: "Try again" }).click();
  check("10 try again returns to review", await sees(page, "Available balance"));
  await page.getByRole("button", { name: /^Pay \$6 USDC$/ }).click();
  check("the retry succeeds", await sees(page, "Payment successful", 60_000));
  check("the backend marks the retried payment paid", (await merchant("GET", `/payments/${id}`)).status === "PAID");
  check("no browser errors", errors.length === 0, errors.join(" | "));
  await close();
}

console.log("\nPaying from a wallet app (the route for phones)");
{
  const id = await createPayment("9.00", "Wallet app case");
  const { page, errors, close } = await open(id, { mobile: true });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Connect Stellar Wallet" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /Open in wallet app/ }).click();
  check("shows what to send and waits", (await sees(page, "Pay from your wallet app")) && (await sees(page, "Waiting for your payment")));
  await settle(page); await shot(page, "m-17-wallet-app");
  check("no horizontal scroll", !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));

  // Act as the wallet app: read the payment link the page offers and send exactly that.
  const link = await page.getByRole("link", { name: "Open wallet app" }).getAttribute("href");
  const request = Object.fromEntries(new URLSearchParams(link.slice(link.indexOf("?") + 1)));
  check("the link is a SEP-7 payment request for this checkout", link.startsWith("web+stellar:pay?") && request.memo === id && request.amount === "9.00" && request.memo_type === "MEMO_TEXT", link);
  const fromWallet = async (amount) => {
    const tx = new TransactionBuilder(await horizon.loadAccount(customer.publicKey()), { fee: BASE_FEE, networkPassphrase: request.network_passphrase })
      .addOperation(Operation.payment({ destination: request.destination, asset: new Asset(request.asset_code, request.asset_issuer), amount }))
      .addMemo(Memo.text(request.memo))
      .setTimeout(60)
      .build();
    tx.sign(customer);
    return horizon.submitTransaction(tx);
  };
  await fromWallet("8.50");
  await page.waitForTimeout(12_000);
  check("an underpayment does not complete the checkout", (await sees(page, "Waiting for your payment", 2_000)) && (await merchant("GET", `/payments/${id}`)).status === "AWAITING_PAYMENT");
  await fromWallet(request.amount);
  check("the exact payment turns the page to success", await sees(page, "Payment successful", 60_000));
  await page.waitForTimeout(1600); await shot(page, "m-17-wallet-app-success");
  const paid = await merchant("GET", `/payments/${id}`);
  check("the backend verified it and recorded the paying wallet", paid.status === "PAID" && paid.customerWallet === customer.publicKey());
  check("no browser errors", errors.length === 0, errors.join(" | "));
  await close();
}

console.log("\nReloading while the payment is confirming");
{
  const id = await createPayment("1.00", "Reload case");
  const { page, close } = await open(id);
  await connectFreighter(page);
  await sees(page, "Available balance");
  await page.getByRole("button", { name: /^Pay \$1 USDC$/ }).click();
  await sees(page, "Processing payment");
  await page.reload({ waitUntil: "domcontentloaded" });
  const landed = (await sees(page, "Payment pending", 8_000)) ? "pending" : (await sees(page, "Already paid", 2_000)) ? "paid" : "other";
  // Confirmation normally takes a few seconds, so the reload lands on "pending"; if Stellar
  // was unusually fast it lands on "already paid". It must never land back at the start.
  check("11 a reload mid-payment does not restart the checkout", landed !== "other", landed);
  if (landed === "pending") {
    await settle(page); await shot(page, "11-payment-pending");
    check("11 pending turns into success on its own", await sees(page, "Payment successful", 60_000));
  }
  await close();
}
}

if (EXPIRY_ONLY) {
  console.log("\nExpiry while the customer is on the checkout (needs PAYMENT_TTL_MINUTES=1)");
  const id = await createPayment("7.00", "Expiry case");
  const { page, errors, close } = await open(id);
  await connectFreighter(page);
  check("review screen is open", await sees(page, "Available balance"));
  check("13 the checkout expires in front of the customer", await sees(page, "Payment expired", 130_000));
  await settle(page); await shot(page, "13-payment-expired");
  check("13 offers the way back to the merchant", (await page.getByRole("link", { name: "Return to Merchant" }).count()) === 1);
  check("the backend marked it expired", (await merchant("GET", `/payments/${id}`)).status === "EXPIRED");
  await page.reload({ waitUntil: "networkidle" });
  check("13 an expired link stays expired on reload", await sees(page, "Payment expired"));
  check("no browser errors", errors.length === 0, errors.join(" | "));
  await close();
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`}  (screenshots in ${SHOTS})`);
process.exit(failures === 0 ? 0 : 1);
