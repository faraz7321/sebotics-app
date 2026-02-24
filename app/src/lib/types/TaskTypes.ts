export type Task = {
  taskId: string;
  businessId: string;
  buildingId: string;
  robotId: string;
  createTime: string;
  sourceType: string;
  busiType: string;
  isExcute: boolean;
};

export const TaskType = {
  Disinfection: 0,
  ReturnToChargingStation: 1,
  Restaurant: 2,
  Hotel: 3,
  Delivery: 4,          // five-in-one
  Factory: 5,
  ChassisMiniProgram: 6,
  ChargeScheduling: 7,
} as const;

export type TaskType = typeof TaskType[keyof typeof TaskType];

export const RunType = {
  ScheduledDisinfection: 0,
  TemporaryDisinfection: 1,

  QuickMealDelivery: 20,
  MultiPointMealDelivery: 21,
  DirectDelivery: 22,
  Roaming: 23,
  Return: 24,
  ChargingStation: 25,
  Summon: 26,
  BirthdayMode: 27,
  Guiding: 28,
  Lifting: 29,
  LiftingCruise: 30,
  FlexibleCarry: 31,
  Roll: 32,
  FullyChargedAndUnplugged: 33,
} as const;

export type RunType = typeof RunType[keyof typeof RunType];

export const RouteMode = {
  SequentialRouting: 1,
  ShortestDistanceRouting: 2,
} as const;

export type RouteMode = typeof RouteMode[keyof typeof RouteMode];

export const RunMode = {
  FlexibleObstacleAvoidance: 1,
  TrajectoryLimitedAvoidance: 2,
  TrajectoryNoAvoidance: 3,
  TrajectoryNoDockReplenish: 4,
} as const;

export type RunMode = typeof RunMode[keyof typeof RunMode];

type JsonObject = Record<string, unknown>;

export type TaskPoint = {
  areaId: string;
  poiId?: string; // when poiId is provided, the system automatically populates x, y, yaw, type, and the name/id values from the ext field
  x?: number;
  y?: number;
  yaw?: number;
  type?: number;
  stopRadius?: number;
  ext?: JsonObject;
  stepActs?: JsonObject[];
};

export interface CreateTaskRequest {
  name: string;
  robotId: string;
  routeMode: number;
  runMode?: RunMode;
  runNum?: number;
  taskType: TaskType;
  runType: RunType;
  sourceType?: number;
  ignorePublicSite?: boolean;
  speed?: number;
  detourRadius?: number;
  curPt?: JsonObject; // Represents {}
  taskPts: TaskPoint[];
  backPt?: JsonObject; // Represents {}
  returnDest?: number;
  returnTime?: number;
};

export interface TaskState {
  loading: boolean;
  error: string | null;

  tasks: Task[];
};
