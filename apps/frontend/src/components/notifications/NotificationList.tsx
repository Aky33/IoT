import type { Notification } from "../../types/notification";
import type { UserRole } from "../../types/common";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { LoadingState } from "../common/LoadingState";
import { NotificationItem } from "./NotificationItem";

type NotificationListProps = {
  notifications: Notification[];
  userRole: UserRole;
  isLoading?: boolean;
  error?: string | null;
  onOpenDetail?: (notificationId: string) => void;
};

export function NotificationList({
  notifications,
  userRole,
  isLoading = false,
  error = null,
  onOpenDetail
}: NotificationListProps) {
  if (isLoading) {
    return <LoadingState label="Loading notifications..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (notifications.length === 0) {
    return <EmptyState title="No notifications" description="No notification matches current view." />;
  }

  return (
    <section className="stack">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          userRole={userRole}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </section>
  );
}
