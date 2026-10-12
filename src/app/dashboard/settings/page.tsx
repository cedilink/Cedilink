"use client";

import { LoadError, Loading, PageHeader } from "@/components/dashboard/ui";
import { Settings } from "@/components/dashboard/settings";
import { useAccount } from "@/lib/dashboard/queries";

export default function SettingsPage() {
  const { data, error, refetch } = useAccount();
  return (
    <>
      <PageHeader title="Settings" />
      {error ? <LoadError what="your settings" onRetry={() => refetch()} /> : !data ? <Loading /> : <Settings account={data} />}
    </>
  );
}
