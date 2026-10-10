"use client";

import { Check, Wallet } from "lucide-react";
import { useState } from "react";
import { Card, Field, inputClass, LoadError, Loading, PageHeader, PillButton } from "@/components/dashboard/ui";
import { ApiError, type StellarSettings } from "@/lib/api/client";
import { useSaveStellarSettings, useStellarSettings } from "@/lib/dashboard/queries";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand" : "bg-line"}`}
    >
      <span className={`absolute top-1 size-4 rounded-full bg-white transition-[left] ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}

function SettingsForm({ settings }: { settings: StellarSettings }) {
  const save = useSaveStellarSettings();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [address, setAddress] = useState(settings.receivingAddress ?? "");
  const [saved, setSaved] = useState(false);

  const error = save.error instanceof ApiError ? save.error.message : save.error ? "We couldn't save your changes. Please try again." : undefined;

  return (
    <form
      className="max-w-xl"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        save.mutate({ enabled, receivingAddress: address.trim() }, { onSuccess: () => setSaved(true) });
      }}
    >
      <Card className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-ink">Accept Stellar USDC</p>
          <Toggle checked={enabled} onChange={setEnabled} label="Accept Stellar USDC" />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-muted">Network</p>
          <span className="inline-block rounded-full bg-paid-tint px-3 py-1.5 text-xs text-paid">{settings.network.label} connected</span>
        </div>
        <Field
          label="Receiving wallet"
          error={error}
          hint={
            settings.managed && address.trim() === settings.receivingAddress
              ? "Created and funded for you on Stellar Testnet. You can replace it with a wallet of your own."
              : "The Stellar public key that receives your payments. It must already hold a USDC trustline."
          }
        >
          <input
            className={`${inputClass} font-mono text-[13px]`}
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              setSaved(false);
              save.reset();
            }}
            placeholder="G…"
            spellCheck={false}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            required
          />
        </Field>
        <div>
          <p className="mb-2 text-sm text-ink">Accepted wallets</p>
          <div className="flex h-12 items-center gap-3 rounded-full bg-surface px-4 text-sm text-ink">
            <Wallet className="size-4" />
            <span className="flex-1">Freighter</span>
            <span className="rounded-full bg-paid-tint px-2.5 py-1 text-[11px] text-paid">Enabled</span>
          </div>
        </div>
      </Card>
      <div className="mt-4 flex items-center gap-3">
        <PillButton type="submit" disabled={save.isPending || !address.trim()}>
          {save.isPending ? "Checking wallet…" : "Save changes"}
        </PillButton>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-paid" role="status">
            <Check className="size-4" /> Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}

export default function StellarSettingsPage() {
  const { data, error, refetch } = useStellarSettings();
  return (
    <>
      <PageHeader title="Stellar USDC" />
      {error ? <LoadError what="your Stellar USDC settings" onRetry={() => refetch()} /> : !data ? <Loading /> : <SettingsForm settings={data} />}
    </>
  );
}
