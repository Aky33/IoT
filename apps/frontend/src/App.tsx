import { useEffect, useMemo, useState } from "react";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useSSE } from "./hooks/useSSE";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthPage } from "./components/auth/AuthPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoadingState } from "./components/common/LoadingState";
import { CreateDeviceModal } from "./components/devices/CreateDeviceModal";
import { DeleteDeviceConfirmDialog } from "./components/devices/DeleteDeviceConfirmDialog";
import { EditDeviceModal } from "./components/devices/EditDeviceModal";
import { NotificationDetailModal } from "./components/notifications/NotificationDetailModal";
import { CreateUserModal } from "./components/users/CreateUserModal";
import { EditUserModal } from "./components/users/EditUserModal";
import { DeleteUserConfirmDialog } from "./components/users/DeleteUserConfirmDialog";
import { DashboardPage } from "./pages/DashboardPage";
import { NotificationHistoryPage } from "./pages/NotificationHistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminDevicesPage } from "./pages/admin/AdminDevicesPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { DeviceDetailPage } from "./pages/DeviceDetailPage";
import {
  type Caregiver,
  type CreatedDevice,
  createDevice,
  deleteDevice,
  getDevice,
  listCaregivers,
  listDevices,
  listNotifications,
  listUsers,
  type SessionUser,
  createUser,
  updateUser,
  deleteUser,
  updateDevice,
} from "./lib/api";
import { getErrorMessage } from "./lib/error";
import { useAuth } from "./hooks/useAuth";
import { useCrud } from "./hooks/useCrud";
import type { Device, DeviceFormValues } from "./types/device";
import type { NotificationFilters } from "./types/notification";
import type { Notification } from "./types/notification";
import type { UserRole } from "./types/common";
import type { User, UserFormValues } from "./types/user";

type DeviceDetailRouteProps = {
  device: Device | null;
  isLoading?: boolean;
  error?: string | null;
  userRole: UserRole;
  notifications: Notification[];
  onEdit?: (deviceId: string) => void;
  onDelete?: (deviceId: string) => void;
};

function DeviceDetailRoute({
  device,
  isLoading = false,
  error = null,
  userRole,
  notifications,
  onEdit,
  onDelete,
}: DeviceDetailRouteProps) {
  const { id } = useParams();

  return (
    <DeviceDetailPage
      deviceId={id ?? ""}
      device={device}
      userRole={userRole}
      notificationHistory={notifications.filter((notification) => notification.deviceId === id)}
      isLoading={isLoading}
      error={error}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [devices, setDevices] = useState<Device[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [notificationFilters, setNotificationFilters] = useState<NotificationFilters>({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [deviceDetail, setDeviceDetail] = useState<Device | null>(null);
  const [isLoadingDeviceDetail, setIsLoadingDeviceDetail] = useState(false);
  const [deviceDetailError, setDeviceDetailError] = useState<string | null>(null);

  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
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
    [notificationFilters, notifications]
  );

  const editingDevice = useMemo(
    () => devices.find((device) => device.id === editingDeviceId) ?? (deviceDetail?.id === editingDeviceId ? deviceDetail : null),
    [deviceDetail, devices, editingDeviceId],
  );

  const deletingDevice = useMemo(
    () => devices.find((device) => device.id === deletingDeviceId) ?? (deviceDetail?.id === deletingDeviceId ? deviceDetail : null),
    [deletingDeviceId, deviceDetail, devices],
  );

  const editingUser = useMemo(
    () => users.find((u) => u.id === editingUserId) ?? null,
    [users, editingUserId],
  );

  const deletingUser = useMemo(
    () => users.find((u) => u.id === deletingUserId) ?? null,
    [users, deletingUserId],
  );

  const selectedNotification = useMemo(
    () => notifications.find((notification) => notification.id === selectedNotificationId) ?? null,
    [notifications, selectedNotificationId],
  );

  const summary = useMemo(
    () => ({
      activeDevicesCount: devices.filter((device) => device.status === "online").length,
      offlineDevicesCount: devices.filter((device) => device.status !== "online").length,
      pendingNotificationsCount: notifications.filter((notification) => notification.status === "pending").length,
      urgentNotificationsCount: notifications.filter((notification) => notification.type === "urgent" && notification.status === "pending").length,
    }),
    [devices, notifications],
  );

  const latestNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);
  const urgentNotifications = useMemo(
    () => notifications.filter((notification) => notification.type === "urgent" && notification.status === "pending"),
    [notifications],
  );

  async function loadAppData(sessionUser: SessionUser) {
    setIsLoadingData(true);
    setDevicesError(null);
    setNotificationsError(null);
    setUsersError(null);

    const [devicesResult, notificationsResult, usersResult, caregiversResult] = await Promise.allSettled([
      listDevices(),
      listNotifications(),
      sessionUser.role === "admin" ? listUsers() : Promise.resolve([]),
      sessionUser.role === "admin" ? listCaregivers() : Promise.resolve([]),
    ]);

    if (devicesResult.status === "fulfilled") {
      setDevices(devicesResult.value);
    } else {
      setDevices([]);
      setDevicesError(getErrorMessage(devicesResult.reason, "Unable to load devices."));
    }

    if (notificationsResult.status === "fulfilled") {
      setNotifications(notificationsResult.value.data);
    } else {
      setNotifications([]);
      setNotificationsError(getErrorMessage(notificationsResult.reason, "Unable to load notifications."));
    }

    if (usersResult.status === "fulfilled") {
      setUsers(usersResult.value);
    } else {
      setUsers([]);
      setUsersError(getErrorMessage(usersResult.reason, "Unable to load users."));
    }

    if (caregiversResult.status === "fulfilled") {
      setCaregivers(caregiversResult.value);
    } else {
      setCaregivers([]);
    }

    setIsLoadingData(false);
  }

  const {
    authStatus,
    currentUser,
    authError,
    isAuthenticating,
    login: handleLogin,
    register: handleRegister,
    logout: triggerLogout,
  } = useAuth({
    onAuthenticated: async (session) => {
      await loadAppData(session);
      navigate("/", { replace: true });
    },
    onLogout: () => {
      setDevices([]);
      setNotifications([]);
      setUsers([]);
      setCaregivers([]);
      setNotificationFilters({});
      setSelectedNotificationId(null);
      setDeviceDetail(null);
      navigate("/", { replace: true });
    },
  });

  const deviceCrud = useCrud(async () => { if (currentUser) await loadAppData(currentUser); });
  const userCrud = useCrud(async () => { if (currentUser) await loadAppData(currentUser); });

  const { pushEnabled, pushPermission, pushError, togglePush } = usePushNotifications(authStatus);

  useSSE(authStatus, currentUser?.role, (notification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
  });

  useEffect(() => {
    const match = location.pathname.match(/^\/devices\/([^/]+)$/);

    if (!match || authStatus !== "authenticated") {
      setDeviceDetail(null);
      setDeviceDetailError(null);
      setIsLoadingDeviceDetail(false);
      return;
    }

    const deviceId = match[1];
    const cachedDevice = devices.find((device) => device.id === deviceId) ?? null;
    let isCancelled = false;

    setDeviceDetail(cachedDevice);
    setDeviceDetailError(null);
    setIsLoadingDeviceDetail(true);

    (async () => {
      try {
        const loadedDevice = await getDevice(deviceId);

        if (!isCancelled) {
          setDeviceDetail(loadedDevice);
        }
      } catch (error) {
        if (!isCancelled) {
          setDeviceDetail(null);
          setDeviceDetailError(getErrorMessage(error, "Unable to load device detail."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDeviceDetail(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [authStatus, devices, location.pathname]);

  if (authStatus === "loading") {
    return <LoadingState label="Restoring session..." />;
  }

  if (authStatus !== "authenticated" || !currentUser) {
    return (
      <AuthPage
        isSubmitting={isAuthenticating}
        error={authError}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  const notificationCount = summary.pendingNotificationsCount;
  const urgentCount = summary.urgentNotificationsCount;

  return (
    <>
      <AppLayout
        userRole={currentUser.role}
        activeRoute={location.pathname}
        onNavigate={navigate}
        sessionLabel={currentUser.email ? `${currentUser.email} (${currentUser.role})` : currentUser.role}
        onLogout={triggerLogout}
        notificationCount={notificationCount}
        urgentNotificationCount={urgentCount}
      >
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["admin", "caregiver"]} userRole={currentUser.role}>
                <DashboardPage
                  userRole={currentUser.role}
                  summary={summary}
                  latestNotifications={latestNotifications}
                  urgentNotifications={urgentNotifications}
                  devices={devices}
                  isLoading={isLoadingData}
                  error={devicesError ?? notificationsError}
                  pushPermission={pushPermission}
                  pushEnabled={pushEnabled}
                  onEnablePush={() => togglePush(true)}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["admin", "caregiver"]} userRole={currentUser.role}>
                <NotificationHistoryPage
                  userRole={currentUser.role}
                  notifications={filteredNotifications}
                  filters={notificationFilters}
                  devices={devices}
                  isLoading={isLoadingData}
                  error={notificationsError ?? devicesError}
                  onFilterChange={setNotificationFilters}
                  onOpenDetail={setSelectedNotificationId}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/devices/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "caregiver"]} userRole={currentUser.role}>
                <DeviceDetailRoute
                  device={deviceDetail}
                  isLoading={isLoadingDeviceDetail}
                  error={deviceDetailError}
                  userRole={currentUser.role}
                  notifications={notifications}
                  onEdit={currentUser.role === "admin" ? (deviceId) => {
                    deviceCrud.clearError();
                    setEditingDeviceId(deviceId);
                  } : undefined}
                  onDelete={currentUser.role === "admin" ? (deviceId) => {
                    deviceCrud.clearError();
                    setDeletingDeviceId(deviceId);
                  } : undefined}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["admin", "caregiver"]} userRole={currentUser.role}>
                <section className="page">
                  <SettingsPage
                    userRole={currentUser.role}
                    pushEnabled={pushEnabled}
                    pushPermission={pushPermission}
                    onTogglePush={togglePush}
                  />
                  {pushError ? <p role="alert" style={{ color: "var(--color-danger-border)" }}>{pushError}</p> : null}
                </section>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/devices"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                userRole={currentUser.role}
                fallback={<Navigate to="/" replace />}
              >
                <AdminDevicesPage
                  userRole={currentUser.role}
                  devices={devices}
                  isLoading={isLoadingData}
                  error={devicesError ?? usersError}
                  onCreateDevice={() => {
                    deviceCrud.clearError();
                    setIsCreateModalOpen(true);
                  }}
                  onEditDevice={(deviceId) => {
                    deviceCrud.clearError();
                    setEditingDeviceId(deviceId);
                  }}
                  onDeleteDevice={(deviceId) => {
                    deviceCrud.clearError();
                    setDeletingDeviceId(deviceId);
                  }}
                  onOpenDeviceDetail={(id) => navigate(`/devices/${id}`)}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                userRole={currentUser.role}
              >
                <AdminUsersPage
                  userRole={currentUser.role}
                  users={users}
                  isLoading={isLoadingData}
                  error={usersError}
                  onCreateUser={() => {
                    userCrud.clearError();
                    setIsCreateUserModalOpen(true);
                  }}
                  onEditUser={(userId) => {
                    userCrud.clearError();
                    setEditingUserId(userId);
                  }}
                  onDeleteUser={(userId) => {
                    userCrud.clearError();
                    setDeletingUserId(userId);
                  }}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>

      <CreateDeviceModal
        isOpen={isCreateModalOpen}
        users={users}
        caregivers={caregivers}
        onClose={() => {
          setIsCreateModalOpen(false);
          deviceCrud.clearError();
        }}
        onCreate={(values) => deviceCrud.run(() => createDevice(values), "Unable to create device.")}
        isSubmitting={deviceCrud.isMutating}
        error={deviceCrud.error}
      />

      <EditDeviceModal
        device={editingDevice}
        isOpen={Boolean(editingDeviceId)}
        users={users}
        caregivers={caregivers}
        onClose={() => {
          setEditingDeviceId(null);
          deviceCrud.clearError();
        }}
        onUpdate={(id, values) => {
          deviceCrud.run(() => updateDevice(id, values), "Unable to update device.").then((r) => {
            if (r) setEditingDeviceId(null);
          });
        }}
        isSubmitting={deviceCrud.isMutating}
        error={deviceCrud.error}
      />

      <DeleteDeviceConfirmDialog
        device={deletingDevice}
        isOpen={Boolean(deletingDeviceId)}
        onClose={() => {
          setDeletingDeviceId(null);
          deviceCrud.clearError();
        }}
        onConfirm={(id) => deviceCrud.run(async () => { await deleteDevice(id); if (location.pathname === `/devices/${id}`) navigate("/admin/devices"); }, "Unable to delete device.").then((r) => {
          if (r !== undefined) setDeletingDeviceId(null);
        })}
        isDeleting={deviceCrud.isMutating}
        error={deviceCrud.error}
      />

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => {
          setIsCreateUserModalOpen(false);
          userCrud.clearError();
        }}
        onCreate={(values) => userCrud.run(() => createUser(values), "Unable to create patient.").then((r) => {
          if (r !== undefined) setIsCreateUserModalOpen(false);
        })}
        isSubmitting={userCrud.isMutating}
        error={userCrud.error}
      />

      <EditUserModal
        user={editingUser}
        isOpen={Boolean(editingUserId)}
        onClose={() => {
          setEditingUserId(null);
          userCrud.clearError();
        }}
        onUpdate={(id, values) => {
          userCrud.run(() => updateUser(id, values), "Unable to update patient.").then((r) => {
            if (r !== undefined) setEditingUserId(null);
          });
        }}
        isSubmitting={userCrud.isMutating}
        error={userCrud.error}
      />

      <DeleteUserConfirmDialog
        user={deletingUser}
        isOpen={Boolean(deletingUserId)}
        onClose={() => {
          setDeletingUserId(null);
          userCrud.clearError();
        }}
        onConfirm={(id) => userCrud.run(() => deleteUser(id), "Unable to delete patient.").then((r) => {
          if (r !== undefined) setDeletingUserId(null);
        })}
        isDeleting={userCrud.isMutating}
        error={userCrud.error}
      />

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotificationId)}
        userRole={currentUser.role}
        onClose={() => setSelectedNotificationId(null)}
        onOpenDeviceDetail={(deviceId) => navigate(`/devices/${deviceId}`)}
      />
    </>
  );
}
