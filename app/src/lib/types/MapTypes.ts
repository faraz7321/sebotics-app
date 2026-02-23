export type FeatureProperties = {
  endType: string;

  iconYaw: number;
  startType: string;
}

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