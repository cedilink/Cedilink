"use client";

import { ArrowLeft, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, Loading } from "@/components/dashboard/ui";
import { Mascot } from "@/components/motion/mascot";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { api, ApiError } from "@/lib/api/client";

const linkClass = "text-brand underline-offset-4 hover:underline";

type State = { step: "checking" } | { step: "invalid"; message: string } | { step: "form"; token: string; email: string };

const BROKEN = "This reset link is incomplete. Open the link from your email again, or ask for a new one.";

function Expired({ message }: { message: string }) {
  return (
    <>
      <div className="flex flex-col items-center gap-3 pb-2 pt-2 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-failed-tint text-failed">
          <LinkIcon className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-[22px] tracking-tight text-ink">This link can&apos;t be used</h1>
          <p className="mt-1 text-sm text-muted" role="alert">
            {message}
          </p>
        </div>
      </div>
      <Link href="/forgot-password" className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand/90">
        Send me a new link
      </Link>
    </>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "checking" });
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    (token ? api<{ email: string }>("/auth/password/reset/check", { method: "POST", body: { token } }) : Promise.reject(new ApiError("RESET_LINK_INVALID", BROKEN, 400)))
      .then(({ email }) => setState({ step: "form", token: token!, email }))
      .catch((cause) =>
        setState({
          step: "invalid",
          message: cause instanceof ApiError && cause.status < 500 && cause.code !== "NETWORK_ERROR" ? cause.message : "We couldn't check this link. Reload the page to try again.",
        }),
      );
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-3xl bg-white p-6">
        {state.step === "checking" ? (
          <Loading />
        ) : state.step === "invalid" ? (
          <Expired message={state.message} />
        ) : (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const password = String(form.get("password") ?? "");
              const confirm = String(form.get("confirm") ?? "");
              if (password.length < 8) return setErrors({ password: "Use at least 8 characters." });
              if (password !== confirm) return setErrors({ confirm: "The passwords don't match." });
              setBusy(true);
              setErrors({});
              try {
                await api("/auth/password/reset", { method: "POST", body: { token: state.token, newPassword: password } });
                router.replace("/dashboard");
              } catch (cause) {
                setBusy(false);
                if (cause instanceof ApiError && cause.code === "RESET_LINK_INVALID") {
                  setState({ step: "invalid", message: cause.message });
                } else if (cause instanceof ApiError && cause.code === "VALIDATION_ERROR") {
                  setErrors({ password: String((cause.details.fields as Record<string, string> | undefined)?.newPassword ?? "Check your new password.") });
                } else {
                  setErrors({ form: cause instanceof ApiError && cause.status === 429 ? "Too many attempts. Wait a minute, then try again." : "We couldn't save your new password. Please try again." });
                }
              }
            }}
          >
            <div className="flex flex-col items-center gap-3 pb-2 pt-2 text-center">
              <Mascot size={56} />
              <div>
                <h1 className="text-[22px] tracking-tight text-ink">Choose a new password</h1>
                <p className="mt-1 text-sm text-muted">
                  For <span className="text-ink">{state.email}</span>. Every device signed in to this account will be signed out.
                </p>
              </div>
            </div>
            {/* Lets password managers save the new password against the right account. */}
            <input type="email" name="username" autoComplete="username" value={state.email} readOnly hidden />
            <Field label="New password" error={errors.password} hint="At least 8 characters." htmlFor="new-password">
              <PasswordInput id="new-password" name="password" autoComplete="new-password" minLength={8} required autoFocus aria-invalid={Boolean(errors.password)} />
            </Field>
            <Field label="Confirm new password" error={errors.confirm} htmlFor="confirm-password">
              <PasswordInput id="confirm-password" name="confirm" autoComplete="new-password" required aria-invalid={Boolean(errors.confirm)} />
            </Field>
            {errors.form ? (
              <p role="alert" className="text-sm text-failed">
                {errors.form}
              </p>
            ) : null}
            <Button type="submit" variant="brand" disabled={busy}>
              {busy ? "Saving…" : "Save and sign in"}
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
