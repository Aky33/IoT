import { useEffect, useMemo, useRef, useState } from "react";
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
  ApiError,
  type Caregiver,
  type CreatedDevice,
  createDevice,
  deleteDevice,
  disablePushNotifications,
  enablePushNotifications,
  getAccessToken,
  getDevice,
  getPushState,
  type PushPermissionState,
  listCaregivers,
  listDevices,
  listNotifications,
  listUsers,
  login,
  logout,
  onTokenChange,
  refreshSession,
  register,
  type SessionUser,
  syncPushSubscription,
  createUser,
  updateUser,
  deleteUser,
  updateDevice,
} from "./lib/api";
import type { Device, DeviceFormValues } from "./types/device";
import type { NotificationFilters } from "./types/notification";
import type { Notification } from "./types/notification";
import type { UserRole } from "./types/common";
import type { User, UserFormValues } from "./types/user";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return fallback;
}

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

  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const sseRef = useRef<EventSource | null>(null);
  const didRestoreSession = useRef(false);

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
  const [deviceMutationError, setDeviceMutationError] = useState<string | null>(null);
  const [isMutatingDevice, setIsMutatingDevice] = useState(false);

  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userMutationError, setUserMutationError] = useState<string | null>(null);
  const [isMutatingUser, setIsMutatingUser] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<PushPermissionState>("default");
  const [pushError, setPushError] = useState<string | null>(null);

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

  useEffect(() => {
    if (didRestoreSession.current) return;
    didRestoreSession.current = true;

    (async () => {
      try {
        const session = await refreshSession();

        if (!session) {
          setAuthStatus("unauthenticated");
          return;
        }

        setCurrentUser(session);
        setAuthStatus("authenticated");
        await loadAppData(session);
      } catch (error) {
        setAuthError(getErrorMessage(error, "Unable to restore the current session."));
        setAuthStatus("unauthenticated");
      }
    })();
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setPushEnabled(false);
      setPushPermission("default");
      return;
    }

    (async () => {
      try {
        const state = await getPushState();
        setPushPermission(state.permission);

        if (state.permission === "granted" && state.subscribed) {
          // Prohlížeč povolil + subscription existuje → sync s backendem
          await syncPushSubscription();
          setPushEnabled(true);
        } else if (state.permission === "granted" && !state.subscribed) {
          // Prohlížeč povolil, ale subscription chybí → vytvořit
          await enablePushNotifications();
          setPushEnabled(true);
        } else if (state.permission === "denied") {
          // Prohlížeč blokuje → vyčistit stale subscription z DB
          await disablePushNotifications().catch(() => undefined);
          setPushEnabled(false);
        } else {
          setPushEnabled(false);
        }
      } catch {
        setPushEnabled(false);
      }
    })();
  }, [authStatus]);

  const [tokenVersion, setTokenVersion] = useState(0);

  useEffect(() => {
    return onTokenChange(() => setTokenVersion((v) => v + 1));
  }, []);

  // SSE stream — open for caregivers only, reconnect on token refresh
  useEffect(() => {
    if (authStatus !== "authenticated" || currentUser?.role !== "caregiver") {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const url = `/notifications/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);
    sseRef.current = source;

    source.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data as string) as {
          id: string;
          type: "standard" | "urgent";
          deviceName?: string;
          createdAt: string;
        };
        setNotifications((previous) => {
          if (previous.some((n) => n.id === incoming.id)) return previous;
          return [
            {
              id: incoming.id,
              type: incoming.type,
              status: "pending" as const,
              deviceId: "",
              deviceName: incoming.deviceName ?? "Unknown device",
              createdAt: incoming.createdAt,
            },
            ...previous,
          ];
        });
      } catch {
        // Ignore malformed SSE events
      }
    };

    return () => {
      source.close();
      sseRef.current = null;
    };
  }, [authStatus, currentUser?.role, tokenVersion]);

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

  async function handleLogin(payload: { email: string; password: string }) {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const session = await login(payload.email, payload.password);
      setCurrentUser(session);
      setAuthStatus("authenticated");
      await loadAppData(session);
      navigate("/", { replace: true });
    } catch (error) {
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
      setAuthError(getErrorMessage(error, "Unable to sign in."));
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleRegister(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    invitationCode: string;
  }) {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const session = await register(payload);
      setCurrentUser(session);
      setAuthStatus("authenticated");
      await loadAppData(session);
      navigate("/", { replace: true });
    } catch (error) {
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
      setAuthError(getErrorMessage(error, "Unable to create the account."));
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleLogout() {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    await logout();
    setCurrentUser(null);
    setAuthStatus("unauthenticated");
    setDevices([]);
    setNotifications([]);
    setUsers([]);
    setNotificationFilters({});
    setSelectedNotificationId(null);
    setDeviceDetail(null);
    setPushEnabled(false);
    setPushError(null);
    navigate("/", { replace: true });
  }

  async function handleCreateDevice(values: DeviceFormValues): Promise<CreatedDevice | undefined> {
    if (!currentUser) {
      return undefined;
    }

    setIsMutatingDevice(true);
    setDeviceMutationError(null);

    try {
      const created = await createDevice(values);
      await loadAppData(currentUser);
      return created;
    } catch (error) {
      setDeviceMutationError(getErrorMessage(error, "Unable to create the device."));
    } finally {
      setIsMutatingDevice(false);
    }
  }

  async function handleUpdateDevice(deviceId: string, values: DeviceFormValues) {
    if (!currentUser) {
      return;
    }

    setIsMutatingDevice(true);
    setDeviceMutationError(null);

    try {
      await updateDevice(deviceId, values);
      setEditingDeviceId(null);
      await loadAppData(currentUser);
    } catch (error) {
      setDeviceMutationError(getErrorMessage(error, "Unable to update the device."));
    } finally {
      setIsMutatingDevice(false);
    }
  }

  async function handleDeleteDevice(deviceId: string) {
    if (!currentUser) {
      return;
    }

    setIsMutatingDevice(true);
    setDeviceMutationError(null);

    try {
      await deleteDevice(deviceId);
      setDeletingDeviceId(null);

      if (location.pathname === `/devices/${deviceId}`) {
        navigate("/admin/devices");
      }

      await loadAppData(currentUser);
    } catch (error) {
      setDeviceMutationError(getErrorMessage(error, "Unable to delete the device."));
    } finally {
      setIsMutatingDevice(false);
    }
  }

  async function handleCreateUser(values: UserFormValues) {
    if (!currentUser) return;
    setIsMutatingUser(true);
    setUserMutationError(null);
    try {
      await createUser(values);
      setIsCreateUserModalOpen(false);
      await loadAppData(currentUser);
    } catch (error) {
      setUserMutationError(getErrorMessage(error, "Unable to create patient."));
    } finally {
      setIsMutatingUser(false);
    }
  }

  async function handleUpdateUser(userId: string, values: UserFormValues) {
    if (!currentUser) return;
    setIsMutatingUser(true);
    setUserMutationError(null);
    try {
      await updateUser(userId, values);
      setEditingUserId(null);
      await loadAppData(currentUser);
    } catch (error) {
      setUserMutationError(getErrorMessage(error, "Unable to update patient."));
    } finally {
      setIsMutatingUser(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!currentUser) return;
    setIsMutatingUser(true);
    setUserMutationError(null);
    try {
      await deleteUser(userId);
      setDeletingUserId(null);
      await loadAppData(currentUser);
    } catch (error) {
      setUserMutationError(getErrorMessage(error, "Unable to delete patient."));
    } finally {
      setIsMutatingUser(false);
    }
  }

  async function handleTogglePush(nextEnabled: boolean) {
    setPushError(null);

    try {
      if (nextEnabled) {
        await enablePushNotifications();
        setPushPermission("granted");
      } else {
        await disablePushNotifications();
      }

      setPushEnabled(nextEnabled);
    } catch (error) {
      const state = await getPushState().catch(() => null);
      if (state) {
        setPushPermission(state.permission);
        setPushEnabled(state.subscribed);
      }
      setPushError(getErrorMessage(error, "Unable to update push notifications."));
    }
  }

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

  const notificationCount = notifications.filter((item) => item.status === "pending").length;
  const urgentCount = notifications.filter((item) => item.type === "urgent" && item.status === "pending").length;

  return (
    <>
      <AppLayout
        userRole={currentUser.role}
        activeRoute={location.pathname}
        onNavigate={navigate}
        sessionLabel={currentUser.email ? `${currentUser.email} (${currentUser.role})` : currentUser.role}
        onLogout={handleLogout}
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
                  onEnablePush={() => handleTogglePush(true)}
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
                    setDeviceMutationError(null);
                    setEditingDeviceId(deviceId);
                  } : undefined}
                  onDelete={currentUser.role === "admin" ? (deviceId) => {
                    setDeviceMutationError(null);
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
                    onTogglePush={handleTogglePush}
                  />
                  {pushError ? <p role="alert" style={{ color: "#b91c1c" }}>{pushError}</p> : null}
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
                    setDeviceMutationError(null);
                    setIsCreateModalOpen(true);
                  }}
                  onEditDevice={(deviceId) => {
                    setDeviceMutationError(null);
                    setEditingDeviceId(deviceId);
                  }}
                  onDeleteDevice={(deviceId) => {
                    setDeviceMutationError(null);
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
                    setUserMutationError(null);
                    setIsCreateUserModalOpen(true);
                  }}
                  onEditUser={(userId) => {
                    setUserMutationError(null);
                    setEditingUserId(userId);
                  }}
                  onDeleteUser={(userId) => {
                    setUserMutationError(null);
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
          setDeviceMutationError(null);
        }}
        onCreate={handleCreateDevice}
        isSubmitting={isMutatingDevice}
        error={deviceMutationError}
      />

      <EditDeviceModal
        device={editingDevice}
        isOpen={Boolean(editingDeviceId)}
        users={users}
        caregivers={caregivers}
        onClose={() => {
          setEditingDeviceId(null);
          setDeviceMutationError(null);
        }}
        onUpdate={handleUpdateDevice}
        isSubmitting={isMutatingDevice}
        error={deviceMutationError}
      />

      <DeleteDeviceConfirmDialog
        device={deletingDevice}
        isOpen={Boolean(deletingDeviceId)}
        onClose={() => {
          setDeletingDeviceId(null);
          setDeviceMutationError(null);
        }}
        onConfirm={handleDeleteDevice}
        isDeleting={isMutatingDevice}
        error={deviceMutationError}
      />

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => {
          setIsCreateUserModalOpen(false);
          setUserMutationError(null);
        }}
        onCreate={handleCreateUser}
        isSubmitting={isMutatingUser}
        error={userMutationError}
      />

      <EditUserModal
        user={editingUser}
        isOpen={Boolean(editingUserId)}
        onClose={() => {
          setEditingUserId(null);
          setUserMutationError(null);
        }}
        onUpdate={handleUpdateUser}
        isSubmitting={isMutatingUser}
        error={userMutationError}
      />

      <DeleteUserConfirmDialog
        user={deletingUser}
        isOpen={Boolean(deletingUserId)}
        onClose={() => {
          setDeletingUserId(null);
          setUserMutationError(null);
        }}
        onConfirm={handleDeleteUser}
        isDeleting={isMutatingUser}
        error={userMutationError}
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
