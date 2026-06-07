import type { BaseEntity } from "./common.js";

export type UserRole = "admin" | "dispatcher" | "manager" | "driver";

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}
