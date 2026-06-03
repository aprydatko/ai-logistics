import { SetMetadata } from "@nestjs/common";

import type { UserRecord } from "../../db/schema";

export const ROLES_KEY = "roles";

export const Roles = (...roles: UserRecord["role"][]): MethodDecorator &
  ClassDecorator => SetMetadata(ROLES_KEY, roles);
