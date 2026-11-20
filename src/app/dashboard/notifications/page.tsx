"use client";

import { NotificationItem } from "@/components/dashboard/notifications";
import { Card, Empty, LoadError, PageHeader, PillButton, SkeletonRows } from "@/components/dashboard/ui";
import { useMarkRead, useNotifications } from "@/lib/dashboard/queries";

export default function NotificationsPage() {
  const { data, error, refetch } = useNotifications();
  const markRead = useMarkRead();
  return (
    <>
      <PageHeader title="Notifications" subtitle="Payments received, pending, failed, unmatched, expired and verified">
        {data?.unreadCount ? (
          <PillButton variant="tint" onClick={() => markRead.mutate(undefined)}>
            Mark all as read
          </PillButton>
        ) : null}
      </PageHeader>
      {error ? (
        <LoadError what="your notifications" onRetry={() => refetch()} />
      ) : !data ? (
        <SkeletonRows label="Loading notifications" />
      ) : data.notifications.length === 0 ? (
        <Empty title="No notifications yet" message="Payments and checks will show up here." />
      ) : (
        <Card className="max-w-2xl overflow-hidden divide-y divide-line">
          {data.notifications.map((n) => (
            <NotificationItem key={n.id} n={n} />
          ))}
        </Card>
      )}
    </>
  );
}
