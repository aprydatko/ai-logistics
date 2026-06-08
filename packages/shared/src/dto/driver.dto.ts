import type { BaseEntity } from "../types/common.js";
import type { Driver } from "../types/driver.js";

export type CreateDriverDto = Omit<
  Driver,
  keyof BaseEntity | "user" | "currentLocation" | "rating"
>;

export type UpdateDriverDto = Partial<CreateDriverDto>;
