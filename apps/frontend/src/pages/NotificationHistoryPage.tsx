import type { UserRole } from "../types/common";
import type { Notification, NotificationFilters as NotificationFiltersType } from "../types/notification";
import type { Device } from "../types/device";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { EmptyState } from "../components/common/EmptyState";
import { NotificationFilters } from "../components/notifications/NotificationFilters";
import { NotificationList } from "../components/notifications/NotificationList";

type NotificationHistoryPageProps = {
  userRole: UserRole;
  notifications?: Notification[];
  filters: NotificationFiltersType;
  devices?: Device[];
  isLoading?: boolean;
  error?: string | null;
  onFilterChange: (filters: NotificationFiltersType) => void;
  onOpenDetail?: (notificationId: string) => void;
};

export function NotificationHistoryPage({
  userRole,
  notifications = [],
  filters,
  devices = [],
  isLoading = false,
  error = null,
  onFilterChange,
  onOpenDetail
}: NotificationHistoryPageProps) {
  return (
    <section className="page">
      <h2>Notification history</h2>
      {isLoading ? <LoadingState label="Loading history..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      <NotificationFilters
        filters={filters}
        devices={devices}
        userRole={userRole}
        onChange={onFilterChange}
        onReset={() => onFilterChange({})}
        isDisabled={isLoading}
      />
      {!isLoading && !error && notifications.length === 0 ? (
        <EmptyState title="No history" description="No notification matches the selected filters." />
      ) : null}
      {!isLoading && !error && notifications.length > 0 ? (
        <NotificationList
          notifications={notifications}
          userRole={userRole}
          onOpenDetail={onOpenDetail}
        />
      ) : null}
    </section>
  );
}
