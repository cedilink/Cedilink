"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import {
  api,
  ApiError,
  type Account,
  type Notifications,
} from "@/lib/api/client";
import {
  useChangeEmail,
  useChangePassword,
  useRevokeOtherSessions,
  useSaveNotifications,
  useSaveProfile,
  useStellarSettings,
} from "@/lib/dashboard/queries";
import { formatDate, truncateAddress } from "@/lib/format";
import { Mascot } from "../motion/mascot";
import { CopyButton } from "../ui/copy-button";
import { Card, Field, inputClass, PillButton, PillLink, Toggle } from "./ui";

// The page's sections, in order. The side list and the cards are both built from this.
const SECTIONS = [
  { id: "business", label: "Business profile", Icon: Building2 },
  { id: "email", label: "Sign-in email", Icon: Mail },
  { id: "password", label: "Password", Icon: KeyRound },
  { id: "notifications", label: "Email notifications", Icon: Bell },
  { id: "payments", label: "Payment method", Icon: Wallet },
  { id: "security", label: "Sessions and security", Icon: ShieldCheck },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

/** Highlights the section currently in view, so the side list shows where you are. */
function useSectionInView(): SectionId {
  const [active, setActive] = useState<SectionId>("business");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (visible) setActive(visible.target.id as SectionId);
      },
      // A band across the upper part of the screen: the section crossing it is the one being read.
      { rootMargin: "-15% 0px -65% 0px" },
    );
    for (const { id } of SECTIONS) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);
  return active;
}

function SectionNav() {
  const active = useSectionInView();
  return (
    <nav
      aria-label="Settings sections"
      className="-mx-4 overflow-x-auto px-4 lg:sticky lg:top-6 lg:mx-0 lg:self-start lg:overflow-visible lg:px-0"
    >
      <ul className="flex gap-1.5 lg:flex-col lg:gap-0.5">
        {SECTIONS.map(({ id, label, Icon }) => (
          <li key={id} className="shrink-0">
            <a
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              className={`flex h-10 items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 text-sm transition-colors ${active === id ? "bg-white text-ink" : "text-ink/70 hover:text-ink max-lg:bg-white/60"}`}
            >
              <Icon className="size-4" strokeWidth={1.8} />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: SectionId;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { Icon } = SECTIONS.find((section) => section.id === id)!;
  return (
    // The offset keeps the heading clear of the top edge when the side list jumps here.
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink">
            <Icon className="size-4" strokeWidth={1.8} />
          </span>
          <div>
            <h2 id={`${id}-title`} className="text-base text-ink">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          </div>
        </div>
        <div className="mt-5 border-t border-line pt-5">{children}</div>
      </Card>
    </section>
  );
}

/** The save button of a section, with what happened next to it. */
function Actions({
  label,
  pendingLabel,
  pending,
  disabled,
  saved,
  error,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
  disabled?: boolean;
  saved?: string | false;
  error?: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <PillButton type="submit" disabled={pending || disabled}>
        {pending ? pendingLabel : label}
      </PillButton>
      {error ? (
        <span className="text-sm text-failed" role="alert">
          {error}
        </span>
      ) : saved ? (
        <span
          className="inline-flex items-center gap-1.5 text-sm text-paid"
          role="status"
        >
          <Check className="size-4" /> {saved}
        </span>
      ) : null}
    </div>
  );
}

/** Splits a failed save into messages for individual fields and one for the form as a whole. */
function problems(
  error: unknown,
  fallback: string,
): { fields: Record<string, string>; form?: string } {
  if (!error) return { fields: {} };
  const fields =
    error instanceof ApiError
      ? ((error.details.fields ?? {}) as Record<string, string>)
      : {};
  if (Object.keys(fields).length > 0) return { fields };
  return { fields, form: error instanceof ApiError ? error.message : fallback };
}

function PasswordInput({
  id,
  name,
  value,
  onChange,
  autoComplete,
  invalid,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  invalid?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <span className="relative block">
      <input
        id={id}
        className={`${inputClass} pr-12`}
        type={shown ? "text" : "password"}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        required
      />
      <button
        type="button"
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        onClick={() => setShown((value) => !value)}
        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </span>
  );
}

function BusinessProfile({ account }: { account: Account }) {
  const save = useSaveProfile();
  const [name, setName] = useState(account.merchant.name);
  const [businessName, setBusinessName] = useState(
    account.merchant.businessName,
  );
  const changed =
    name.trim() !== account.merchant.name ||
    businessName.trim() !== account.merchant.businessName;
  const { fields, form } = problems(
    save.error,
    "We couldn't save your profile. Please try again.",
  );
  const edit =
    (set: (value: string) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      set(event.target.value);
      save.reset();
    };

  return (
    <Section
      id="business"
      title="Business profile"
      description="Who your customers are paying. Changes show on checkouts and emails straight away, including ones already sent."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate({ name: name.trim(), businessName: businessName.trim() });
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Field
              label="Business name"
              error={fields.businessName}
              hint="Shown to customers as who is being paid."
            >
              <input
                className={inputClass}
                name="businessName"
                value={businessName}
                onChange={edit(setBusinessName)}
                maxLength={80}
                autoComplete="organization"
                aria-invalid={Boolean(fields.businessName)}
                required
              />
            </Field>
            <Field
              label="Your name"
              error={fields.name}
              hint="Used when we write to you. Customers do not see it."
            >
              <input
                className={inputClass}
                name="name"
                value={name}
                onChange={edit(setName)}
                maxLength={80}
                autoComplete="name"
                aria-invalid={Boolean(fields.name)}
                required
              />
            </Field>
          </div>
          <div aria-hidden className="flex flex-col rounded-2xl bg-surface p-4">
            <p className="text-xs text-muted">What customers see</p>
            <div className="mt-3 rounded-2xl bg-white p-4">
              <p className="flex items-center gap-2.5 text-sm text-ink">
                <Mascot size={32} />
                <span className="min-w-0 truncate">
                  {businessName.trim() || "Your business name"}
                </span>
              </p>
              <p className="mt-4 text-xs text-muted">Amount due</p>
              <p className="text-2xl tracking-tight text-ink">$25.00</p>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Also used in payment request and receipt emails, and in the
              preview shown when a checkout link is shared.
            </p>
          </div>
        </div>
        <Actions
          label="Save profile"
          pendingLabel="Saving…"
          pending={save.isPending}
          disabled={!changed || !name.trim() || !businessName.trim()}
          saved={save.isSuccess && !changed && "Saved"}
          error={form}
        />
      </form>
    </Section>
  );
}

function SignInEmail({ account }: { account: Account }) {
  const change = useChangeEmail();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordId = useId();
  const { fields, form } = problems(
    change.error,
    "We couldn't change your email. Please try again.",
  );

  return (
    <Section
      id="email"
      title="Sign-in email"
      description="The address you sign in with, and where payment notifications are sent."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          change.mutate(
            { email: email.trim(), currentPassword: password },
            {
              onSuccess: () => {
                setEmail("");
                setPassword("");
              },
            },
          );
        }}
      >
        <p className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl bg-surface px-4 py-3 text-sm">
          <span className="text-muted">Current email</span>
          <span className="min-w-0 break-all text-ink">
            {account.merchant.email}
          </span>
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="New email address" error={fields.email}>
            <input
              className={inputClass}
              type="email"
              name="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                change.reset();
              }}
              autoComplete="email"
              aria-invalid={Boolean(fields.email)}
              required
            />
          </Field>
          <Field
            label="Current password"
            htmlFor={passwordId}
            error={fields.currentPassword}
            hint="To confirm it is you."
          >
            <PasswordInput
              id={passwordId}
              name="currentPassword"
              value={password}
              onChange={(value) => {
                setPassword(value);
                change.reset();
              }}
              autoComplete="current-password"
              invalid={Boolean(fields.currentPassword)}
            />
          </Field>
        </div>
        <Actions
          label="Change email"
          pendingLabel="Changing…"
          pending={change.isPending}
          disabled={!email.trim() || !password}
          saved={
            change.isSuccess &&
            "Email changed. Use the new address next time you sign in."
          }
          error={form}
        />
      </form>
    </Section>
  );
}

const MIN_PASSWORD = 8;

function Password() {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const id = useId();
  const { fields, form } = problems(
    change.error,
    "We couldn't change your password. Please try again.",
  );
  // Shown once something has been typed, not on an untouched form.
  const tooShort = next.length > 0 && next.length < MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== next;
  const edit = (set: (value: string) => void) => (value: string) => {
    set(value);
    change.reset();
  };

  return (
    <Section
      id="password"
      title="Password"
      description="Changing it signs you out on every other device."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          change.mutate(
            { currentPassword: current, newPassword: next },
            {
              onSuccess: () => {
                setCurrent("");
                setNext("");
                setConfirm("");
              },
            },
          );
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2 md:max-w-[calc(50%-0.625rem)]">
            <Field
              label="Current password"
              htmlFor={`${id}-current`}
              error={fields.currentPassword}
            >
              <PasswordInput
                id={`${id}-current`}
                name="currentPassword"
                value={current}
                onChange={edit(setCurrent)}
                autoComplete="current-password"
                invalid={Boolean(fields.currentPassword)}
              />
            </Field>
          </div>
          <Field
            label="New password"
            error={
              tooShort
                ? `Use at least ${MIN_PASSWORD} characters.`
                : fields.newPassword
            }
            hint={`At least ${MIN_PASSWORD} characters.`}
            htmlFor={`${id}-new`}
          >
            <PasswordInput
              id={`${id}-new`}
              name="newPassword"
              value={next}
              onChange={edit(setNext)}
              autoComplete="new-password"
              invalid={tooShort || Boolean(fields.newPassword)}
            />
          </Field>
          <Field
            label="Confirm new password"
            htmlFor={`${id}-confirm`}
            error={mismatch ? "The two passwords do not match." : undefined}
          >
            <PasswordInput
              id={`${id}-confirm`}
              name="confirmPassword"
              value={confirm}
              onChange={edit(setConfirm)}
              autoComplete="new-password"
              invalid={mismatch}
            />
          </Field>
        </div>
        <Actions
          label="Change password"
          pendingLabel="Changing…"
          pending={change.isPending}
          disabled={!current || next.length < MIN_PASSWORD || confirm !== next}
          saved={
            change.isSuccess &&
            "Password changed. Other devices were signed out."
          }
          error={form}
        />
      </form>
    </Section>
  );
}

const NOTIFICATIONS: {
  key: keyof Notifications;
  title: string;
  text: string;
  to: string;
}[] = [
  {
    key: "paymentReceived",
    title: "Payment received",
    text: "Tells you when a payment has been verified on Stellar and marked paid.",
    to: "Sent to you",
  },
  {
    key: "customerRequest",
    title: "Payment request",
    text: "Sends your customer the checkout link when you create a payment with their email address.",
    to: "Sent to your customer",
  },
  {
    key: "customerReceipt",
    title: "Receipt",
    text: "Sends your customer a receipt with the Stellar transaction once their payment is verified.",
    to: "Sent to your customer",
  },
];

function EmailNotifications({ account }: { account: Account }) {
  const save = useSaveNotifications();
  // While a change is being saved the switch already shows it; a failed save falls back to what is stored.
  const shown =
    save.isPending && save.variables ? save.variables : account.notifications;
  return (
    <Section
      id="notifications"
      title="Email notifications"
      description="Choose which emails Cedilink sends for your payments. Changes are saved as you make them."
    >
      <ul>
        {NOTIFICATIONS.map(({ key, title, text, to }) => (
          <li
            key={key}
            className="flex items-start justify-between gap-4 border-b border-line py-4 first:pt-0 last:border-0 last:pb-0"
          >
            <div>
              <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
                {title}
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">
                  {to}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
            <Toggle
              checked={shown[key]}
              label={title}
              disabled={save.isPending}
              onChange={(next) =>
                save.mutate({ ...account.notifications, [key]: next })
              }
            />
          </li>
        ))}
      </ul>
      {save.error ? (
        <p className="mt-4 text-sm text-failed" role="alert">
          We couldn&apos;t save that change. Please try again.
        </p>
      ) : null}
      <p className="mt-4 rounded-2xl bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
        Security emails, such as a notice that your password or sign-in email
        changed, are always sent.
      </p>
    </Section>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-line py-3.5 text-sm last:border-0 max-sm:flex-col max-sm:gap-1">
      <dt className="w-40 shrink-0 text-xs text-muted sm:pt-0.5">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2.5 text-ink">{children}</dd>
    </div>
  );
}

function PaymentMethod() {
  const { data, error } = useStellarSettings();
  return (
    <Section
      id="payments"
      title="Payment method"
      description="How you are paid. The receiving wallet is managed on the Stellar USDC page."
    >
      {error ? (
        <p className="text-sm text-muted">
          We couldn&apos;t load your payment method just now.
        </p>
      ) : !data ? (
        <div
          className="h-36 animate-pulse rounded-2xl bg-surface"
          aria-busy="true"
          aria-label="Loading payment method"
        />
      ) : (
        <dl className="rounded-2xl border border-line px-4">
          <Detail label="Stellar USDC">
            <span
              className={`rounded-full px-2.5 py-1 text-xs ${data.enabled ? "bg-paid-tint text-paid" : "bg-awaiting-tint text-awaiting"}`}
            >
              {data.enabled ? "Accepting payments" : "Switched off"}
            </span>
          </Detail>
          <Detail label="Network">{data.network.label}</Detail>
          <Detail label="Receiving wallet">
            {data.receivingAddress ? (
              <>
                <span className="font-mono text-[13px]">
                  {truncateAddress(data.receivingAddress, 6, 6)}
                </span>
                <CopyButton
                  value={data.receivingAddress}
                  label="receiving wallet"
                />
              </>
            ) : (
              <span className="text-muted">Not set yet</span>
            )}
          </Detail>
          {data.receivingAddress ? (
            <Detail label="Wallet type">
              {data.managed ? "Created for you by Cedilink" : "Your own wallet"}
            </Detail>
          ) : null}
        </dl>
      )}
      <div className="mt-5">
        <PillLink href="/dashboard/payment-methods/stellar-usdc" variant="soft">
          Manage Stellar USDC
        </PillLink>
      </div>
    </Section>
  );
}

function Security({ account }: { account: Account }) {
  const revoke = useRevokeOtherSessions();
  const router = useRouter();
  const client = useQueryClient();
  const [leaving, setLeaving] = useState(false);
  const others = account.otherSessions;
  const descriptionId = useId();

  return (
    <Section
      id="security"
      title="Sessions and security"
      description="Where your account is signed in."
    >
      <dl className="rounded-2xl border border-line px-4">
        <Detail label="Member since">{formatDate(account.memberSince)}</Detail>
        <Detail label="This device">
          <span className="rounded-full bg-paid-tint px-2.5 py-1 text-xs text-paid">
            Signed in
          </span>
        </Detail>
        <Detail label="Other devices">
          <span id={descriptionId}>
            {others === 0
              ? "Not signed in anywhere else"
              : `Signed in on ${others} other ${others === 1 ? "device" : "devices"}`}
          </span>
        </Detail>
      </dl>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <PillButton
          variant="soft"
          disabled={others === 0 || revoke.isPending}
          aria-describedby={descriptionId}
          onClick={() => revoke.mutate()}
        >
          <MonitorSmartphone className="size-4" />{" "}
          {revoke.isPending ? "Signing out…" : "Sign out other devices"}
        </PillButton>
        <PillButton
          variant="soft"
          disabled={leaving}
          onClick={async () => {
            setLeaving(true);
            await api("/auth/logout", { method: "POST" }).catch(() => {});
            client.clear();
            router.replace("/login");
          }}
        >
          <LogOut className="size-4" />{" "}
          {leaving ? "Signing out…" : "Sign out of this device"}
        </PillButton>
        {revoke.isSuccess && others === 0 ? (
          <span
            className="inline-flex items-center gap-1.5 text-sm text-paid"
            role="status"
          >
            <Check className="size-4" /> Other devices signed out
          </span>
        ) : revoke.error ? (
          <span className="text-sm text-failed" role="alert">
            We couldn&apos;t do that. Please try again.
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        A sign-in lasts 7 days. If you see devices you do not recognise, sign
        them out and change your password.
      </p>
    </Section>
  );
}

export function Settings({ account }: { account: Account }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-6">
      <SectionNav />
      <div className="flex min-w-0 max-w-3xl flex-col gap-4">
        <BusinessProfile account={account} />
        <SignInEmail account={account} />
        <Password />
        <EmailNotifications account={account} />
        <PaymentMethod />
        <Security account={account} />
      </div>
    </div>
  );
}
