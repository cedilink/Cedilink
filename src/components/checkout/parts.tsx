import { Info } from "lucide-react";
import type { ReactNode } from "react";

/** The grey rounded panel that groups label/value rows. */
export function Panel({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col gap-4 rounded-2xl bg-surface p-4">{children}</dl>;
}

export function Row({ label, children, note }: { label: string; children: ReactNode; note?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 flex items-center gap-2.5 text-sm text-ink">{children}</dd>
      {note ? <dd className="mt-1 text-xs text-muted">{note}</dd> : null}
    </div>
  );
}

/** A single-line note with an info icon. */
export function Note({ children, icon = true }: { children: ReactNode; icon?: boolean }) {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl bg-surface px-4 py-3.5 text-left text-sm text-ink">
      {icon ? <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} /> : null}
      <span>{children}</span>
    </p>
  );
}

/** Centred icon, title and message used by every status and error screen. */
export function StatusScreen({
  icon,
  title,
  message,
  children,
  actions,
}: {
  icon: ReactNode;
  title: string;
  message?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pt-3">
      <div className="flex flex-col items-center text-center">
        {icon}
        <h1 className="mt-5 text-[22px] leading-tight tracking-tight text-ink">{title}</h1>
        {message ? <p className="mt-1.5 max-w-[19rem] text-sm text-muted">{message}</p> : null}
      </div>
      {children}
      {actions ? <div className="flex flex-col gap-2.5 pt-1">{actions}</div> : null}
    </div>
  );
}
