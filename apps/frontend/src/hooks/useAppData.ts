import { useEffect, useState } from "react";
import {
  type Caregiver,
  listDevices,
  listNotifications,
  listUsers,
  listCaregivers,
  getDevice,
  type SessionUser,
} from "../lib/api";
import { getErrorMessage } from "../lib/error";
import type { Device } from "../types/device";
import type { Notification } from "../types/notification";
import type { User } from "../types/user";

export function useAppData(authStatus: string, locationPathname: string) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [deviceDetail, setDeviceDetail] = useState<Device | null>(null);
  const [isLoadingDeviceDetail, setIsLoadingDeviceDetail] = useState(false);
  const [deviceDetailError, setDeviceDetailError] = useState<string | null>(null);

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
    const match = locationPathname.match(/^\/devices\/([^/]+)$/);

    if (!match || authStatus !== "authenticated") {
      setDeviceDetail(null);
      setDeviceDetailError(null);
      setIsLoadingDeviceDetail(false);
      return;
    }

    const deviceId = match[1];
    const cachedDevice = devices.find((d) => d.id === deviceId) ?? null;
    let isCancelled = false;

    setDeviceDetail(cachedDevice);
    setDeviceDetailError(null);
    setIsLoadingDeviceDetail(true);

    (async () => {
      try {
        const loadedDevice = await getDevice(deviceId);
        if (!isCancelled) setDeviceDetail(loadedDevice);
      } catch (error) {
        if (!isCancelled) {
          setDeviceDetail(null);
          setDeviceDetailError(getErrorMessage(error, "Unable to load device detail."));
        }
      } finally {
        if (!isCancelled) setIsLoadingDeviceDetail(false);
      }
    })();

    return () => { isCancelled = true; };
  }, [authStatus, devices, locationPathname]);

  function addNotification(notification: Notification) {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
  }

  function resetData() {
    setDevices([]);
    setNotifications([]);
    setUsers([]);
    setCaregivers([]);
    setDeviceDetail(null);
  }

  return {
    devices,
    notifications,
    users,
    caregivers,
    isLoadingData,
    devicesError,
    notificationsError,
    usersError,
    deviceDetail,
    isLoadingDeviceDetail,
    deviceDetailError,
    loadAppData,
    addNotification,
    resetData,
  };
}
