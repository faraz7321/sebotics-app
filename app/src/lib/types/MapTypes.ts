export type FeatureProperties = {
  endType: string;

  iconYaw: number;
  startType: string;
}

export const PoiType = {
  ChargingPile: 9,
  StandbyPoint: 10,
  TableNumber: 11,
  PrivateRoom: 12,
  Lobby: 16,
  ReceptionDesk: 19,
  RoomNumber: 21,
  WorkstationNumber: 22,
  Waypoint: 25,
  DisinfectionPoint: 26,
  ExchangePoint: 27,
  ElevatorWaitingPoint: 28,
  SchedulingPoint: 29,
  DistributionStation: 30,
  ShelfPoint: 34,
} as const;

export type PoiType = typeof PoiType[keyof typeof PoiType];

export type PointOfInterest = {
  areaId: string;
  buildingId: string;
  businessId: string;

  coordinate: [number, number];
  floor: number;
  floorName: string;
  id: string;
  name: string;
  oldFeatureId: string;
  properties: FeatureProperties;

  type: number;
  version: string;

  yaw: number;
}

export interface MapState {
  loading: boolean;
  error: string | null;

  pointsOfInterest: PointOfInterest[];
}