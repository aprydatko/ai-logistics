export type ISODateString = string;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BaseEntity {
  id: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
