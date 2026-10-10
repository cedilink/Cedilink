"use client";

import { Globe, KeyRound, Puzzle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Field, inputClass } from "@/components/dashboard/ui";
import { Spinner } from "@/components/motion/badge";
import { Mascot } from "@/components/motion/mascot";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { api, ApiError, type Schemas } from "@/lib/api/client";
import { truncateAddress } from "@/lib/format";
import { getWallet, type WalletId } from "@/lib/wallets";

type Config = Schemas["Config"];
type WalletChoice = "managed" | "own";
const WALLET_ERRORS = ["INVALID_ADDRESS", "ACCOUNT_NOT_FOUND", "NO_USDC_TRUSTLINE"];

function Choice({ active, onSelect, icon, title, text }: { active: boolean; onSelect: () => void; icon: ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${active ? "border-brand bg-brand-wash" : "border-line bg-white hover:border-ink/30"}`}
    >
      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${active ? "bg-brand text-white" : "bg-surface text-ink"}`}>{icon}</span>
      <span>
        <span className="block text-sm text-ink">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
    </button>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>();
  const [choice, setChoice] = useState<WalletChoice>("managed");
  const [address, setAddress] = useState("");
  const [connecting, setConnecting] = useState<WalletId>();
  const [walletNote, setWalletNote] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [walletError, setWalletError] = useState<{ code: string; message: string }>();
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    api<Config>("/config")
      .then((loaded) => {
        setConfig(loaded);
        // Where the server cannot create wallets, bringing one is the only option.
        if (!loaded.managedWallets) setChoice("own");
      })
      .catch(() => {});
  }, []);

  const networkLabel = config?.network.label ?? "Stellar Testnet";

  async function connect(id: WalletId) {
    const name = id === "freighter" ? "Freighter" : "Albedo";
    setConnecting(id);
    setWalletNote(undefined);
    setWalletError(undefined);
    try {
      const wallet = getWallet(id);
      if (!(await wallet.isAvailable())) return setWalletNote(`${name} isn't installed in this browser.`);
      const connected = await wallet.connect();
      setAddress(connected.address);
      const passphrase = await wallet.getNetworkPassphrase();
      setWalletNote(
        passphrase !== null && config && passphrase !== config.network.passphrase
          ? `${name} is on a different network. Switch it to ${networkLabel}, or this account may not be found.`
          : `Connected ${name}: ${truncateAddress(connected.address, 6, 6)}`,
      );
    } catch {
      setWalletNote(`${name} didn't share an address. Try again, or paste your public key.`);
    } finally {
      setConnecting(undefined);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <form
        className="flex w-full max-w-[440px] flex-col gap-4 rounded-3xl bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const value = (name: string) => String(form.get(name) ?? "");
          setBusy(true);
          setError(undefined);
          setWalletError(undefined);
          setFields({});
          try {
            await api("/auth/signup", {
              method: "POST",
              body: {
                name: value("name").trim(),
                businessName: value("businessName").trim(),
                email: value("email").trim(),
                password: value("password"),
                ...(choice === "own" ? { receivingAddress: address.trim() } : {}),
              },
            });
            router.replace("/dashboard");
          } catch (cause) {
            const problem = cause instanceof ApiError ? cause : undefined;
            const invalid = (problem?.details.fields ?? {}) as Record<string, string>;
            if (problem?.code === "EMAIL_TAKEN") setFields({ email: problem.message });
            else if (problem && WALLET_ERRORS.includes(problem.code)) setWalletError({ code: problem.code, message: problem.message });
            else if (Object.keys(invalid).length > 0) setFields(invalid);
            else setError(problem?.message ?? "We couldn't create your account. Please try again.");
            setBusy(false);
          }
        }}
      >
        <div className="flex flex-col items-center gap-3 pb-2 pt-2 text-center">
          <Mascot size={56} />
          <div>
            <h1 className="text-[22px] tracking-tight text-ink">Create your merchant account</h1>
            <p className="mt-1 text-sm text-muted">Accept USDC on {networkLabel} with a checkout link.</p>
          </div>
        </div>

        <Field label="Your name" error={fields.name}>
          <input className={inputClass} name="name" autoComplete="name" maxLength={80} required aria-invalid={Boolean(fields.name)} />
        </Field>
        <Field label="Business name" error={fields.businessName} hint="Shown to your customers at checkout.">
          <input className={inputClass} name="businessName" autoComplete="organization" maxLength={80} required aria-invalid={Boolean(fields.businessName)} />
        </Field>
        <Field label="Email address" error={fields.email}>
          <input className={inputClass} type="email" name="email" autoComplete="username" required aria-invalid={Boolean(fields.email)} />
        </Field>
        <Field label="Password" error={fields.password} hint="At least 8 characters.">
          <input className={inputClass} type="password" name="password" autoComplete="new-password" minLength={8} required aria-invalid={Boolean(fields.password)} />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-xs text-muted">Wallet that receives your payments</legend>
          <div role="radiogroup" aria-label="Wallet choice" className="flex flex-col gap-2">
            {config?.managedWallets !== false ? (
              <Choice
                active={choice === "managed"}
                onSelect={() => setChoice("managed")}
                icon={<Sparkles className="size-4" />}
                title="Create a wallet for me"
                text={`A new ${networkLabel} wallet, funded and ready to receive USDC.`}
              />
            ) : null}
            <Choice
              active={choice === "own"}
              onSelect={() => setChoice("own")}
              icon={<KeyRound className="size-4" />}
              title="Use a wallet I already have"
              text="Connect Freighter or Albedo, or paste a public key."
            />
          </div>

          {choice === "own" ? (
            <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-surface p-3.5">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["freighter", "Freighter", <Puzzle key="i" className="size-4" />],
                    ["albedo", "Albedo", <Globe key="i" className="size-4" />],
                  ] as const
                ).map(([id, name, icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => connect(id)}
                    disabled={Boolean(connecting)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white text-sm text-ink transition-colors hover:bg-brand-wash disabled:opacity-60"
                  >
                    {connecting === id ? <Spinner className="size-4" /> : icon}
                    <span>
                      {/* Hidden visually on narrow screens to keep each button on one line. */}
                      <span className="max-sm:sr-only">Connect </span>
                      {name}
                    </span>
                  </button>
                ))}
              </div>
              <Field label="Public key" error={walletError?.message} hint={walletNote ?? "Starts with G. Only your public key is needed to be paid; never enter a secret key."}>
                <input
                  className={`${inputClass} font-mono text-[13px]`}
                  name="receivingAddress"
                  value={address}
                  onChange={(event) => {
                    setAddress(event.target.value);
                    setWalletError(undefined);
                    setWalletNote(undefined);
                  }}
                  placeholder="G…"
                  spellCheck={false}
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(walletError)}
                />
              </Field>
              {walletError?.code === "NO_USDC_TRUSTLINE" && config ? (
                <dl className="rounded-2xl bg-white p-3.5 text-sm">
                  <dt className="text-xs text-muted">Add this asset in your wallet, then try again</dt>
                  <dd className="mt-1.5 flex items-center gap-2.5 text-ink">
                    <span>
                      {config.asset.code} · {truncateAddress(config.asset.issuer, 6, 6)}
                    </span>
                    <CopyButton value={config.asset.issuer} label="issuer" />
                  </dd>
                </dl>
              ) : null}
            </div>
          ) : null}
        </fieldset>

        {error ? (
          <p className="text-sm text-failed" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="brand" disabled={busy}>
          {busy ? (
            <>
              <Spinner className="size-4" /> {choice === "managed" ? "Creating your account and wallet…" : "Creating your account…"}
            </>
          ) : (
            "Create account"
          )}
        </Button>
        {busy && choice === "managed" ? (
          <p className="text-center text-xs text-muted" role="status">
            Setting up your wallet on Stellar takes a few seconds.
          </p>
        ) : (
          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-brand underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </form>
    </main>
  );
}
