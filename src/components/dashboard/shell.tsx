"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChevronsUpDown,
  CircleHelp,
  CreditCard,
  LayoutGrid,
  ListChecks,
  LogOut,
  Menu,
  Search,
  Settings,
  SquareArrowOutUpRight,
  Wallet,
  X,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api/client";
import { looksLikeHash } from "@/lib/dashboard/filters";
import { useMerchant, useOverview } from "@/lib/dashboard/queries";
import { Mascot } from "../motion/mascot";
import { InstallButton } from "../pwa/install-button";
import { FeedbackButton } from "./feedback";
import { NotificationsBell } from "./notifications";
import { LiveUpdates } from "./toasts";
import { Loading } from "./ui";

const TITLES: [prefix: string, title: string][] = [
  ["/dashboard/links/new", "Create payment link"],
  ["/dashboard/links/", "Payment details"],
  ["/dashboard/links", "Link management"],
  ["/dashboard/transactions/", "Transaction details"],
  ["/dashboard/transactions", "Transaction history"],
  ["/dashboard/reconciliation", "Reconciliation"],
  ["/dashboard/notifications", "Notifications"],
  ["/dashboard/payment-methods/stellar-usdc", "Stellar USDC"],
  ["/dashboard/settings", "Settings"],
  ["/dashboard", "Dashboard"],
];

function NavItem({
  href,
  icon,
  label,
  badge,
  alert,
  active,
  soon,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  /** Red badge: something needs the merchant's attention. */
  alert?: boolean;
  active?: boolean;
  soon?: boolean;
}) {
  const content = (
    <>
      <span className="grid size-4 place-items-center">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span
          className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] ${alert ? "bg-failed-tint text-failed" : "bg-line text-ink"}`}
        >
          {badge}
          {alert ? <span className="sr-only"> need review</span> : null}
        </span>
      ) : null}
      {soon ? <span className="text-[11px] text-subtle">Soon</span> : null}
    </>
  );
  const className = `relative flex h-10 items-center gap-2.5 rounded-full px-3 text-sm ${active ? "text-ink" : soon ? "text-subtle" : "text-ink/80 hover:text-ink"}`;
  if (!href)
    return (
      <span className={className} aria-disabled>
        {content}
      </span>
    );
  return (
    <Link
      href={href}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {active ? (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 -z-10 rounded-full bg-brand-tint"
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        />
      ) : null}
      {content}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  const merchant = useMerchant().data;
  const overview = useOverview().data;
  const search = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        search.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const icon = "size-4";
  const group = "mt-5 mb-1 px-3 text-xs text-muted";
  return (
    <div
      className="isolate flex h-full flex-col p-4"
      onClick={(event) =>
        (event.target as HTMLElement).closest("a") && onNavigate?.()
      }
    >
      <Link href="/dashboard" className="flex items-center gap-2.5 px-1">
        <Mascot size={36} />
        <span className="text-sm leading-tight text-ink">
          Cedilink
          <br />
          Smartpay
        </span>
      </Link>

      <form
        className="relative mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          const q = search.current?.value.trim() ?? "";
          // A transaction hash finds the transaction; anything else searches payment links.
          const base = looksLikeHash(q) ? "/dashboard/transactions" : "/dashboard/links";
          router.push(q ? `${base}?q=${encodeURIComponent(q)}` : base);
          onNavigate?.();
        }}
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink" />
        <input
          ref={search}
          name="q"
          aria-label="Search payment links, references or transaction hashes"
          placeholder="Search.."
          className="h-10 w-full rounded-full bg-surface pl-10 pr-10 text-sm outline-none placeholder:text-ink/70 focus:ring-1 focus:ring-brand"
        />
        <kbd className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-[11px] text-muted">
          ⌘/
        </kbd>
      </form>

      <nav className="flex-1">
        <p className={group}>Workspace</p>
        <NavItem
          href="/dashboard"
          icon={<LayoutGrid className={icon} />}
          label="Dashboard"
          active={pathname === "/dashboard"}
        />
        <NavItem
          href="/dashboard/transactions"
          icon={<CreditCard className={icon} />}
          label="Transaction history"
          badge={overview?.linksCreated}
          active={pathname.startsWith("/dashboard/transactions")}
        />
        <NavItem
          href="/dashboard/links"
          icon={<SquareArrowOutUpRight className={icon} />}
          label="Link management"
          active={pathname.startsWith("/dashboard/links")}
        />
        <p className={group}>Payment operations</p>
        <NavItem
          href="/dashboard/reconciliation"
          icon={<ListChecks className={icon} />}
          label="Reconciliation"
          badge={overview?.unmatched}
          alert
          active={pathname.startsWith("/dashboard/reconciliation")}
        />
        <NavItem
          href="/dashboard/payment-methods/stellar-usdc"
          icon={<Wallet className={icon} />}
          label="Stellar USDC"
          active={pathname.startsWith(
            "/dashboard/payment-methods/stellar-usdc",
          )}
        />
        <p className={group}>Other</p>
        <NavItem
          href="/dashboard/settings"
          icon={<Settings className={icon} />}
          label="Settings"
          active={pathname.startsWith("/dashboard/settings")}
        />
        <NavItem
          icon={<CircleHelp className={icon} />}
          label="Help & Support"
          soon
        />
        <InstallButton />
      </nav>

      <div className="relative">
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              className="absolute inset-x-0 bottom-full mb-2 rounded-2xl bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                href="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm text-ink hover:bg-surface"
              >
                <Settings className="size-4" /> Account settings
              </Link>
              <button
                type="button"
                className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm text-ink hover:bg-surface"
                onClick={async () => {
                  await api("/auth/logout", { method: "POST" }).catch(() => {});
                  client.clear();
                  router.replace("/login");
                }}
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <button
          type="button"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex w-full items-center gap-2.5 rounded-2xl p-1 text-left hover:bg-surface"
        >
          <Mascot size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-ink">
              {merchant?.name ?? " "}
            </span>
            <span className="block truncate text-xs text-muted">
              {merchant?.businessName ?? "Merchant"}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 text-muted" />
        </button>
      </div>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: merchant, error, isPending } = useMerchant();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title =
    TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Overview";

  const signedOut = error instanceof ApiError && error.status === 401;
  useEffect(() => {
    if (signedOut)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [signedOut, router, pathname]);

  if (isPending || signedOut) return <Loading label="Checking your session" />;
  if (!merchant) {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface p-6 text-center text-sm text-muted">
        We couldn&apos;t reach Cedilink Smartpay. Check your connection and
        reload the page.
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-white">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <button
                type="button"
                aria-label="Close menu"
                className="absolute right-3 top-4 grid size-9 place-items-center rounded-full hover:bg-surface"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="size-4" />
              </button>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 px-4 lg:h-16 lg:px-6">
          <button
            type="button"
            aria-label="Open menu"
            className="-ml-2 grid size-9 place-items-center rounded-full hover:bg-surface lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-4" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm">
            <span className="hidden text-muted lg:inline">
              Workspace&nbsp;&nbsp;/&nbsp;&nbsp;
            </span>
            <span className="text-ink">{title}</span>
          </p>
          <NotificationsBell />
        </header>
        <main className="flex-1 bg-white px-4 py-5 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
      <LiveUpdates />
      <FeedbackButton />
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, refetchOnWindowFocus: true },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user">
        {/* The frame reads the current URL, which is only known per request. */}
        <Suspense fallback={<Loading label="Loading dashboard" />}>
          <Frame>{children}</Frame>
        </Suspense>
      </MotionConfig>
    </QueryClientProvider>
  );
}
