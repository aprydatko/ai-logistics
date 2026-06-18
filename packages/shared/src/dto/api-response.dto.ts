import type { Driver } from "../types/driver.js";
import type { Load } from "../types/load.js";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiError = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type DriversResponse = ApiResponse<Driver[]>;

export type LoadResponse = ApiResponse<Load>;

export type CreateDriverResponse = ApiResponse<Driver>;

export type CursorPageInfo = {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
};

export type CursorListResponse<T> = {
  success: true;
  data: T[];
  pageInfo: CursorPageInfo;
};
