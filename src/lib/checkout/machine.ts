import type { Checkout, PaymentStatus, Preflight } from "@/lib/api/client";
import type { WalletId } from "@/lib/wallets";

// Each screen corresponds to one design in ui-assets/customer-ui.
export type Screen =
  | "selectMethod" // 01
  | "summary" // 02 (03 is the wallet picker shown over it)
  | "review" // 04
  | "awaitingApproval" // 05
  | "processing" // 06
  | "success" // 07
  | "insufficientUsdc" // 08
  | "insufficientXlm" // 09
  | "failed" // 10
  | "pending" // 11
  | "wrongNetwork" // 12
  | "expired" // 13
  | "alreadyPaid" // 14
  | "walletDisconnected" // 15
  | "connectionRejected" // 16
  | "walletNotInstalled" // 16
  | "walletApp"; // paying from a wallet app, e.g. on a phone; not in the numbered designs

export interface CheckoutState {
  screen: Screen;
  walletPickerOpen: boolean;
  wallet: { id: WalletId; address: string } | null;
  /** Wallet the customer last tried, kept so "Try again" can repeat the attempt. */
  lastWalletId: WalletId | null;
  preflight: Preflight | null;
  status: PaymentStatus;
  transactionHash: string | null;
  paidAt: string | null;
  /** True once this browser session has a transaction in flight or the page loaded with one. */
  submitted: boolean;
  /** The customer chose to pay from a wallet app, outside this page. */
  external: boolean;
  /** A connect or preflight request is running. */
  connecting: boolean;
  /** A Testnet top-up (add USDC and swap XLM for it) is being approved or submitted. */
  toppingUp: boolean;
  /** Code of the last problem, so a screen shared by several causes can say which one it was. */
  problemCode: string | null;
}

export type CheckoutEvent =
  | { type: "CONTINUE" }
  | { type: "BACK" }
  | { type: "OPEN_WALLETS" }
  | { type: "CLOSE_WALLETS" }
  | { type: "OPEN_WALLET_APP" }
  | { type: "CONNECTING"; walletId: WalletId }
  | { type: "WALLET_MISSING" }
  | { type: "WALLET_REJECTED" }
  | { type: "CONNECTED"; wallet: { id: WalletId; address: string }; preflight: Preflight }
  | { type: "DISCONNECT" }
  | { type: "WALLET_LOST" }
  | { type: "PAY_STARTED" }
  | { type: "SIGN_CANCELLED" }
  | { type: "SUBMITTED"; status: PaymentStatus; transactionHash: string | null }
  | { type: "STATUS"; status: PaymentStatus; transactionHash: string | null; paidAt?: string | null }
  | { type: "PROBLEM"; code: string; preflight?: Preflight }
  | { type: "STILL_PENDING" }
  | { type: "TOP_UP"; running: boolean };

const IN_FLIGHT: PaymentStatus[] = ["TRANSACTION_SUBMITTED", "CONFIRMING"];

/** Maps an API or preflight problem code to the screen that explains it. */
export function screenForProblem(code: string): Screen {
  switch (code) {
    case "INSUFFICIENT_USDC":
      return "insufficientUsdc";
    case "INSUFFICIENT_XLM":
      return "insufficientXlm";
    case "ACCOUNT_NOT_FOUND":
    case "NO_USDC_TRUSTLINE":
    case "WRONG_NETWORK":
      return "wrongNetwork";
    case "PAYMENT_EXPIRED":
      return "expired";
    case "ALREADY_PAID":
      return "alreadyPaid";
    case "PAYMENT_IN_PROGRESS":
      return "pending";
    default:
      return "failed";
  }
}

export function initialState(checkout: Pick<Checkout, "status" | "transactionHash" | "paidAt">): CheckoutState {
  const base: CheckoutState = {
    screen: "selectMethod",
    walletPickerOpen: false,
    wallet: null,
    lastWalletId: null,
    preflight: null,
    status: checkout.status,
    transactionHash: checkout.transactionHash,
    paidAt: checkout.paidAt,
    submitted: IN_FLIGHT.includes(checkout.status),
    external: false,
    connecting: false,
    problemCode: null,
    toppingUp: false,
  };
  // Opening or reloading the link lands on the screen that matches the payment's real state.
  if (checkout.status === "PAID") return { ...base, screen: "alreadyPaid" };
  if (checkout.status === "EXPIRED") return { ...base, screen: "expired" };
  if (checkout.status === "FAILED") return { ...base, screen: "failed" };
  if (base.submitted) return { ...base, screen: "pending" };
  return base;
}

export function reduce(state: CheckoutState, event: CheckoutEvent): CheckoutState {
  switch (event.type) {
    case "CONTINUE":
      return { ...state, screen: "summary" };

    case "BACK":
      if (state.screen === "summary") return { ...state, screen: "selectMethod", walletPickerOpen: false };
      if (state.screen === "review") return { ...state, screen: "summary", wallet: null, preflight: null };
      if (state.screen === "walletApp") return { ...state, screen: "summary", external: false };
      return state;

    case "OPEN_WALLETS":
      return { ...state, screen: "summary", walletPickerOpen: true, external: false };
    case "OPEN_WALLET_APP":
      return { ...state, screen: "walletApp", walletPickerOpen: false, external: true };
    case "CLOSE_WALLETS":
      return { ...state, walletPickerOpen: false };

    case "CONNECTING":
      return { ...state, connecting: true, lastWalletId: event.walletId };
    case "WALLET_MISSING":
      return { ...state, connecting: false, walletPickerOpen: false, screen: "walletNotInstalled" };
    case "WALLET_REJECTED":
      return { ...state, connecting: false, walletPickerOpen: false, screen: "connectionRejected" };
    case "CONNECTED":
      return {
        ...state,
        connecting: false,
        walletPickerOpen: false,
        wallet: event.wallet,
        preflight: event.preflight,
        screen: "review",
      };

    case "DISCONNECT":
      return { ...state, wallet: null, preflight: null, screen: "summary" };
    case "WALLET_LOST":
      // Only matters while the customer is about to pay; later screens no longer need the wallet.
      return state.screen === "review" ? { ...state, wallet: null, screen: "walletDisconnected" } : state;

    case "PAY_STARTED":
      return { ...state, screen: "awaitingApproval" };
    case "SIGN_CANCELLED":
      return state.screen === "awaitingApproval" ? { ...state, screen: "review" } : state;
    case "SUBMITTED":
      return {
        ...state,
        screen: "processing",
        submitted: true,
        status: event.status,
        transactionHash: event.transactionHash,
      };

    case "STATUS": {
      const next = {
        ...state,
        status: event.status,
        transactionHash: event.transactionHash ?? state.transactionHash,
        paidAt: event.paidAt ?? state.paidAt,
      };
      // The backend's verdict is the only route to the success screen.
      // A payment this customer made (here, or from their wallet app) is a success; one that
      // simply turned out to be paid already is reported as such.
      if (event.status === "PAID") return { ...next, screen: state.submitted || state.external ? "success" : "alreadyPaid", walletPickerOpen: false };
      if (event.status === "EXPIRED") return { ...next, screen: "expired", walletPickerOpen: false };
      if (event.status === "FAILED") return state.submitted ? { ...next, screen: "failed", submitted: false } : next;
      if (IN_FLIGHT.includes(event.status) && !state.submitted) return { ...next, screen: "pending", submitted: true };
      return next;
    }

    case "PROBLEM":
      return {
        ...state,
        connecting: false,
        walletPickerOpen: false,
        preflight: event.preflight ?? state.preflight,
        problemCode: event.code,
        screen: screenForProblem(event.code),
      };

    case "TOP_UP":
      return { ...state, toppingUp: event.running };

    case "STILL_PENDING":
      return state.screen === "processing" ? { ...state, screen: "pending" } : state;
  }
}
