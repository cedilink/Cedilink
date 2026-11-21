"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Field, inputClass } from "@/components/dashboard/ui";
import { Mascot } from "@/components/motion/mascot";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api/client";

const linkClass = "text-brand underline-offset-4 hover:underline";

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const send = async (email: string) => {
    setBusy(true);
    setError(undefined);
    try {
      await api("/auth/password/forgot", { method: "POST", body: { email } });
      setSentTo(email);
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 429
          ? "Too many requests. Wait a few minutes, then try again."
          : cause instanceof ApiError && cause.code === "VALIDATION_ERROR"
            ? "Enter a valid email address."
            : "We couldn't send the link. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-3xl bg-white p-6">
        {sentTo ? (
          <>
            <div className="flex flex-col items-center gap-3 pb-2 pt-2 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-brand-tint text-brand">
                <MailCheck className="size-6" aria-hidden />
              </span>
              <div>
                <h1 className="text-[22px] tracking-tight text-ink">Check your email</h1>
                <p className="mt-1 text-sm text-muted" role="status">
                  If <span className="text-ink">{sentTo}</span> has a Cedilink Smartpay account, we&apos;ve sent it a link to choose a new
                  password. The link works once and expires in 1 hour.
                </p>
              </div>
            </div>
            <p className="rounded-2xl bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
              Nothing after a few minutes? Check your spam folder, and make sure this is the email you signed up with.
            </p>
            {error ? (
              <p role="alert" className="text-center text-sm text-failed">
                {error}
              </p>
            ) : null}
            <Button type="button" variant="brand" disabled={busy} onClick={() => send(sentTo)}>
              {busy ? "Sending…" : "Send the link again"}
            </Button>
            <p className="text-center text-sm text-muted">
              <button type="button" className={linkClass} onClick={() => setSentTo(undefined)}>
                Use a different email
              </button>
            </p>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
              void send(email);
            }}
          >
            <div className="flex flex-col items-center gap-3 pb-2 pt-2 text-center">
              <Mascot size={56} />
              <div>
                <h1 className="text-[22px] tracking-tight text-ink">Forgot your password?</h1>
                <p className="mt-1 text-sm text-muted">Enter the email you sign in with and we&apos;ll send you a link to choose a new one.</p>
              </div>
            </div>
            <Field label="Email address" error={error}>
              <input className={inputClass} type="email" name="email" autoComplete="username" required autoFocus aria-invalid={Boolean(error)} />
            </Field>
            <Button type="submit" variant="brand" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <Link href="/login" className={`inline-flex items-center justify-center gap-1.5 text-sm ${linkClass}`}>
          <ArrowLeft className="size-3.5" aria-hidden /> Back to sign in
        </Link>
      </div>
    </main>
  );
}
