import type { UserRole } from "./common";

export type User = {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
};
