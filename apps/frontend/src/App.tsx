import { useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import { EditCaregiverModal } from "./components/caregivers/EditCaregiverModal";
import { DeleteCaregiverConfirmDialog } from "./components/caregivers/DeleteCaregiverConfirmDialog";
import { DashboardPage } from "./pages/DashboardPage";
import { NotificationHistoryPage } from "./pages/NotificationHistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminDevicesPage } from "./pages/admin/AdminDevicesPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminCaregiversPage } from "./pages/admin/AdminCaregiversPage";
import { AdminInvitationsPage } from "./pages/admin/AdminInvitationsPage";
import { DeviceDetailPage } from "./pages/DeviceDetailPage";
import { useAuth } from "./hooks/useAuth";
import { useDevicesQuery, useDeviceDetailQuery, useCreateDevice, useUpdateDevice, useDeleteDevice } from "./hooks/useDevicesQuery";
import { useNotificationsQuery } from "./hooks/useNotificationsQuery";
import { useUsersQuery, useCaregiversQuery, useCreateUser, useUpdateUser, useDeleteUser } from "./hooks/useUsersQuery";
import { useUpdateCaregiver, useDeleteCaregiver } from "./hooks/useCaregiversQuery";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useSSE } from "./hooks/useSSE";
import type { Device } from "./types/device";
import type { NotificationFilters } from "./types/notification";
import type { Notification } from "./types/notification";
import type { UserRole } from "./types/common";

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
  const qc = useQueryClient();

  const [notificationFilters, setNotificationFilters] = useState<NotificationFilters>({});
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingCaregiverId, setEditingCaregiverId] = useState<string | null>(null);
  const [deletingCaregiverId, setDeletingCaregiverId] = useState<string | null>(null);

  const {
    authStatus,
    currentUser,
    authError,
    isAuthenticating,
    login: handleLogin,
    register: handleRegister,
    logout: triggerLogout,
  } = useAuth({
    onAuthenticated: () => {
      navigate("/", { replace: true });
    },
    onLogout: () => {
      qc.clear();
      setNotificationFilters({});
      setSelectedNotificationId(null);
      navigate("/", { replace: true });
    },
  });

  const isAuthenticated = authStatus === "authenticated";
  const isAdmin = currentUser?.role === "admin";

  const { data: devices = [], isLoading: isLoadingDevices, error: devicesError } = useDevicesQuery(isAuthenticated);
  const { data: notifications = [], isLoading: isLoadingNotifications, error: notificationsError } = useNotificationsQuery(isAuthenticated);
  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useUsersQuery(isAuthenticated && isAdmin);
  const { data: caregivers = [] } = useCaregiversQuery(isAuthenticated && isAdmin);

  const deviceDetailMatch = location.pathname.match(/^\/devices\/([^/]+)$/);
  const { data: deviceDetail = null, isLoading: isLoadingDeviceDetail, error: deviceDetailError } = useDeviceDetailQuery(
    deviceDetailMatch?.[1],
    isAuthenticated,
  );

  const createDeviceMutation = useCreateDevice();
  const updateDeviceMutation = useUpdateDevice();
  const deleteDeviceMutation = useDeleteDevice();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const updateCaregiverMutation = useUpdateCaregiver();
  const deleteCaregiverMutation = useDeleteCaregiver();

  const { pushEnabled, pushPermission, pushError, togglePush } = usePushNotifications(authStatus);

  useSSE(authStatus, currentUser?.role);

  const isLoadingData = isLoadingDevices || isLoadingNotifications || isLoadingUsers;

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (notificationFilters.type && notification.type !== notificationFilters.type) return false;
        if (notificationFilters.status && notification.status !== notificationFilters.status) return false;
        if (notificationFilters.deviceId && notification.deviceId !== notificationFilters.deviceId) return false;
        return true;
      }),
    [notificationFilters, notifications],
  );

  const editingDevice = useMemo(
    () => devices.find((d) => d.id === editingDeviceId) ?? (deviceDetail?.id === editingDeviceId ? deviceDetail : null),
    [deviceDetail, devices, editingDeviceId],
  );
  const deletingDevice = useMemo(
    () => devices.find((d) => d.id === deletingDeviceId) ?? (deviceDetail?.id === deletingDeviceId ? deviceDetail : null),
    [deletingDeviceId, deviceDetail, devices],
  );
  const editingUser = useMemo(() => users.find((u) => u.id === editingUserId) ?? null, [users, editingUserId]);
  const deletingUser = useMemo(() => users.find((u) => u.id === deletingUserId) ?? null, [users, deletingUserId]);
  const editingCaregiver = useMemo(() => caregivers.find((c) => c.id === editingCaregiverId) ?? null, [caregivers, editingCaregiverId]);
  const deletingCaregiver = useMemo(() => caregivers.find((c) => c.id === deletingCaregiverId) ?? null, [caregivers, deletingCaregiverId]);
  const selectedNotification = useMemo(
    () => notifications.find((n) => n.id === selectedNotificationId) ?? null,
    [notifications, selectedNotificationId],
  );

  const summary = useMemo(() => ({
    activeDevicesCount: devices.filter((d) => d.status === "online").length,
    offlineDevicesCount: devices.filter((d) => d.status !== "online").length,
    pendingNotificationsCount: notifications.filter((n) => n.status === "pending").length,
    urgentNotificationsCount: notifications.filter((n) => n.type === "urgent" && n.status === "pending").length,
  }), [devices, notifications]);

  const latestNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);
  const urgentNotifications = useMemo(
    () => notifications.filter((n) => n.type === "urgent" && n.status === "pending"),
    [notifications],
  );

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
                  error={devicesError?.message ?? notificationsError?.message ?? null}
                  pushPermission={pushPermission}
                  pushEnabled={pushEnabled}
                  onEnablePush={() => togglePush(true)}
                  onOpenDeviceDetail={(id) => navigate(`/devices/${id}`)}
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
                  error={notificationsError?.message ?? devicesError?.message ?? null}
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
                  error={deviceDetailError?.message ?? null}
                  userRole={currentUser.role}
                  notifications={notifications}
                  onEdit={currentUser.role === "admin" ? (deviceId) => {
                    updateDeviceMutation.reset();
                    setEditingDeviceId(deviceId);
                  } : undefined}
                  onDelete={currentUser.role === "admin" ? (deviceId) => {
                    deleteDeviceMutation.reset();
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
                  error={devicesError?.message ?? usersError?.message ?? null}
                  onCreateDevice={() => {
                    createDeviceMutation.reset();
                    setIsCreateModalOpen(true);
                  }}
                  onEditDevice={(deviceId) => {
                    updateDeviceMutation.reset();
                    setEditingDeviceId(deviceId);
                  }}
                  onDeleteDevice={(deviceId) => {
                    deleteDeviceMutation.reset();
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
                  error={usersError?.message ?? null}
                  onCreateUser={() => {
                    createUserMutation.reset();
                    setIsCreateUserModalOpen(true);
                  }}
                  onEditUser={(userId) => {
                    updateUserMutation.reset();
                    setEditingUserId(userId);
                  }}
                  onDeleteUser={(userId) => {
                    deleteUserMutation.reset();
                    setDeletingUserId(userId);
                  }}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/caregivers"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                userRole={currentUser.role}
                fallback={<Navigate to="/" replace />}
              >
                <AdminCaregiversPage
                  userRole={currentUser.role}
                  caregivers={caregivers}
                  isLoading={isLoadingData}
                  error={null}
                  onEditCaregiver={(caregiverId) => {
                    updateCaregiverMutation.reset();
                    setEditingCaregiverId(caregiverId);
                  }}
                  onDeleteCaregiver={(caregiverId) => {
                    deleteCaregiverMutation.reset();
                    setDeletingCaregiverId(caregiverId);
                  }}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/invitations"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                userRole={currentUser.role}
                fallback={<Navigate to="/" replace />}
              >
                <AdminInvitationsPage userRole={currentUser.role} />
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
          createDeviceMutation.reset();
        }}
        onCreate={async (values) => {
          try {
            return await createDeviceMutation.mutateAsync(values);
          } catch {
            return undefined;
          }
        }}
        isSubmitting={createDeviceMutation.isPending}
        error={createDeviceMutation.error?.message ?? null}
      />

      <EditDeviceModal
        device={editingDevice}
        isOpen={Boolean(editingDeviceId)}
        users={users}
        caregivers={caregivers}
        onClose={() => {
          setEditingDeviceId(null);
          updateDeviceMutation.reset();
        }}
        onUpdate={(id, values) => {
          updateDeviceMutation.mutateAsync({ id, values }).then(() => {
            setEditingDeviceId(null);
          }).catch(() => {
            // error is captured by mutation state
          });
        }}
        isSubmitting={updateDeviceMutation.isPending}
        error={updateDeviceMutation.error?.message ?? null}
      />

      <DeleteDeviceConfirmDialog
        device={deletingDevice}
        isOpen={Boolean(deletingDeviceId)}
        onClose={() => {
          setDeletingDeviceId(null);
          deleteDeviceMutation.reset();
        }}
        onConfirm={(id) => {
          deleteDeviceMutation.mutateAsync(id).then(() => {
            if (location.pathname === `/devices/${id}`) navigate("/admin/devices");
            setDeletingDeviceId(null);
          }).catch(() => {
            // error is captured by mutation state
          });
        }}
        isDeleting={deleteDeviceMutation.isPending}
        error={deleteDeviceMutation.error?.message ?? null}
      />

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => {
          setIsCreateUserModalOpen(false);
          createUserMutation.reset();
        }}
        onCreate={(values) => {
          createUserMutation.mutateAsync(values).then(() => {
            setIsCreateUserModalOpen(false);
          }).catch(() => {
            // error is captured by mutation state
          });
        }}
        isSubmitting={createUserMutation.isPending}
        error={createUserMutation.error?.message ?? null}
      />

      <EditUserModal
        user={editingUser}
        isOpen={Boolean(editingUserId)}
        onClose={() => {
          setEditingUserId(null);
          updateUserMutation.reset();
        }}
        onUpdate={(id, values) => {
          updateUserMutation.mutateAsync({ id, values }).then(() => {
            setEditingUserId(null);
          }).catch(() => {
            // error is captured by mutation state
          });
        }}
        isSubmitting={updateUserMutation.isPending}
        error={updateUserMutation.error?.message ?? null}
      />

      <DeleteUserConfirmDialog
        user={deletingUser}
        isOpen={Boolean(deletingUserId)}
        onClose={() => {
          setDeletingUserId(null);
          deleteUserMutation.reset();
        }}
        onConfirm={(id) => {
          deleteUserMutation.mutateAsync(id).then(() => {
            setDeletingUserId(null);
          }).catch(() => {
            // error is captured by mutation state
          });
        }}
        isDeleting={deleteUserMutation.isPending}
        error={deleteUserMutation.error?.message ?? null}
      />

      <EditCaregiverModal
        caregiver={editingCaregiver}
        isOpen={Boolean(editingCaregiverId)}
        onClose={() => {
          setEditingCaregiverId(null);
          updateCaregiverMutation.reset();
        }}
        onUpdate={(id, values) => {
          updateCaregiverMutation.mutateAsync({ id, values }).then(() => {
            setEditingCaregiverId(null);
          }).catch(() => {
            // error is captured by mutation state
          });
        }}
        isSubmitting={updateCaregiverMutation.isPending}
        error={updateCaregiverMutation.error?.message ?? null}
      />

      <DeleteCaregiverConfirmDialog
        caregiver={deletingCaregiver}
        isOpen={Boolean(deletingCaregiverId)}
        onClose={() => {
          setDeletingCaregiverId(null);
          deleteCaregiverMutation.reset();
        }}
        onConfirm={(id) => {
          deleteCaregiverMutation.mutateAsync(id).then(() => {
            setDeletingCaregiverId(null);
          }).catch(() => {
            // error is captured by mutation state
          });
        }}
        isDeleting={deleteCaregiverMutation.isPending}
        error={deleteCaregiverMutation.error?.message ?? null}
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
