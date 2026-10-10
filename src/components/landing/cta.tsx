import Link from "next/link";

export const DEMO_HREF = "/signup";

/** Primary call to action. The label rolls up and is replaced by a copy of itself on hover. */
export function Cta({ children = "Try the Testnet demo", className = "" }: { children?: string; className?: string }) {
  return (
    <Link
      href={DEMO_HREF}
      className={`inline-flex h-12 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover ${className}`}
    >
      <span className="cta-roll">
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
    </Link>
  );
}
