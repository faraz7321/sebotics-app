export type Robot = {
  robotId: string;
  businessId: string;
  areaId: string;
  isTask: boolean;
  isManualMode: boolean;
  isCharging: boolean;
  isRemoteMode: boolean;
  battery: number;
  mac: string;
  yaw: number;
  isError: boolean;
  activeStatus: number;
  isOnLine: boolean;
  name: string;
  x: number;
  y: number;
  isEmergencyStop: boolean;
  model: string;
  errors: string[];
};

export interface RobotState {
  error: string | null;
  loading: boolean;

  robots: Robot[];
};