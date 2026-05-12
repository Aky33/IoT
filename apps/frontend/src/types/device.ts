export type Device = {
  id: string;
  name: string;
  assignedUserId?: string;
  caregiverId?: string;
  createdAt: string;
};

export type DeviceFormValues = {
  name: string;
  assignedUserId?: string;
  caregiverId?: string;
};
