import { Badge } from "@/components/motion/badge";

export default function CheckoutNotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="flex w-full max-w-[400px] flex-col items-center rounded-3xl bg-white p-8 text-center">
        <Badge tone="alert" />
        <h1 className="mt-5 text-[22px] tracking-tight text-ink">Checkout not found</h1>
        <p className="mt-1.5 text-sm text-muted">This payment link is not valid. Check the link with the merchant who sent it.</p>
      </div>
    </main>
  );
}
