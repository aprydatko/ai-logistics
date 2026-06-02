import type { BaseEntity } from '../types/common.js';
import type { Load } from '../types/load.js';

export type CreateLoadDto = Omit<Load, keyof BaseEntity | 'broker'> & {
  brokerId: string;
};

export type UpdateLoadDto = Partial<CreateLoadDto>;
