import { useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { NotificationHistoryPage } from "./pages/NotificationHistoryPage";
import { PairDevicePage } from "./pages/PairDevicePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminDevicesPage } from "./pages/admin/AdminDevicesPage";
import { DeviceDetailPage } from "./pages/DeviceDetailPage";
import { mockDevices, mockNotifications, mockSummary } from "./mocks/data";
import type { NotificationFilters } from "./types/notification";
import type { PairingStatusType, UserRole } from "./types/common";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userRole] = useState<UserRole>("admin");
  const [notificationFilters, setNotificationFilters] = useState<NotificationFilters>({});
  const [pairingCode, setPairingCode] = useState("");
  const [pairingStatus, setPairingStatus] = useState<PairingStatusType>("idle");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [doNotDisturb, setDoNotDisturb] = useState(false);

  const filteredNotifications = useMemo(
    () =>
      mockNotifications.filter((notification) => {
        if (notificationFilters.type && notification.type !== notificationFilters.type) {
          return false;
        }
        if (notificationFilters.status && notification.status !== notificationFilters.status) {
          return false;
        }
        if (notificationFilters.deviceId && notification.deviceId !== notificationFilters.deviceId) {
          return false;
        }
        return true;
      }),
    [notificationFilters]
  );

  const notificationCount = mockNotifications.filter((item) => item.status === "pending").length;
  const urgentCount = mockNotifications.filter((item) => item.type === "urgent" && item.status === "pending").length;

  return (
    <AppLayout
      userRole={userRole}
      activeRoute={location.pathname}
      onNavigate={navigate}
      notificationCount={notificationCount}
      urgentNotificationCount={urgentCount}
    >
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]} userRole={userRole}>
              <DashboardPage
                userRole={userRole}
                summary={mockSummary}
                latestNotifications={mockNotifications}
                urgentNotifications={mockNotifications.filter((item) => item.type === "urgent" && item.status === "pending")}
                devices={mockDevices}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]} userRole={userRole}>
              <NotificationHistoryPage
                userRole={userRole}
                notifications={filteredNotifications}
                filters={notificationFilters}
                devices={mockDevices}
                onFilterChange={setNotificationFilters}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/devices/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]} userRole={userRole}>
              <DeviceDetailPage
                deviceId={mockDevices[0].id}
                device={mockDevices[0]}
                userRole={userRole}
                notificationHistory={mockNotifications}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pair"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]} userRole={userRole}>
              <PairDevicePage
                userRole={userRole}
                pairingCode={pairingCode}
                pairingStatus={pairingStatus}
                pairingMessage={pairingStatus === "success" ? "Device paired" : undefined}
                onPairingCodeChange={setPairingCode}
                onPair={() => {
                  setPairingStatus("pending");
                  setTimeout(() => setPairingStatus("success"), 400);
                }}
                onRetry={() => setPairingStatus("pending")}
                onCancel={() => setPairingStatus("idle")}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]} userRole={userRole}>
              <SettingsPage
                userRole={userRole}
                pushEnabled={pushEnabled}
                doNotDisturb={doNotDisturb}
                onTogglePush={setPushEnabled}
                onToggleDoNotDisturb={setDoNotDisturb}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/devices"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              userRole={userRole}
              fallback={<Navigate to="/" replace />}
            >
              <AdminDevicesPage
                userRole={userRole}
                devices={mockDevices}
                onCreateDevice={() => undefined}
                onEditDevice={() => undefined}
                onDeleteDevice={() => undefined}
                onPairDevice={() => undefined}
                onOpenDeviceDetail={(id) => navigate(`/devices/${id}`)}
              />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
