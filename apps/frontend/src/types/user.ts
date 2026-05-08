import type { UserRole } from "./common";

export type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email?: string;
  role?: UserRole;
};
