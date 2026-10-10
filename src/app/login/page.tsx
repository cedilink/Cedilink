"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, inputClass } from "@/components/dashboard/ui";
import { Mascot } from "@/components/motion/mascot";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <form
        className="flex w-full max-w-[400px] flex-col gap-4 rounded-3xl bg-white p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setBusy(true);
          setError(undefined);
          try {
            await api("/auth/login", { method: "POST", body: { email: form.get("email"), password: form.get("password") } });
            // Only follow a same-site path, never an absolute URL from the query string.
            const next = new URLSearchParams(window.location.search).get("next");
            router.replace(next?.startsWith("/dashboard") ? next : "/dashboard");
          } catch (cause) {
            setError(cause instanceof ApiError ? cause.message : "We couldn't sign you in. Please try again.");
            setBusy(false);
          }
        }}
      >
        <div className="flex flex-col items-center gap-3 pb-2 pt-2 text-center">
          <Mascot size={56} />
          <div>
            <h1 className="text-[22px] tracking-tight text-ink">Sign in to Credlink Smartpay</h1>
            <p className="mt-1 text-sm text-muted">Manage your payments and checkouts.</p>
          </div>
        </div>
        <Field label="Email address">
          <input className={inputClass} type="email" name="email" autoComplete="username" required />
        </Field>
        <Field label="Password" error={error}>
          <input className={inputClass} type="password" name="password" autoComplete="current-password" required aria-invalid={Boolean(error)} />
        </Field>
        <Button type="submit" variant="brand" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted">
          New to Credlink Smartpay?{" "}
          <Link href="/signup" className="text-brand underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
