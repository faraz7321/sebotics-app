import type { TFunction } from "i18next";

export const ActType = {
  TaskStarted: 1000,
  TaskFinished: 1001,
  Reserved: 1005,

  CallElevator: 1,
  SwitchMap: 4,
  PlayAudio: 5,
  OpenCompartment: 6,
  CallAutomaticDoor: 8,
  CallTurnstile: 9,
  DetectDoorOrTurnstileArea: 10,
  EnterElevator: 11,
  ExitElevator: 12,
  GoToDestination: 14,
  ArrivedAtDestination: 16,
  DockToPile: 17,
  TaskPaused: 18,
  CallPhoneBox: 24,
  CloseCompartment: 28,
  SetSprayLevel: 32,
  ReserveElevator: 34,
  SetLedStrip: 37,
  SetSpeed: 39,
  WaitForInteraction: 40,
  JackingLift: 47,
  JackingLower: 48,
} as const;

export type ActType = typeof ActType[keyof typeof ActType];


export const getActLabel = (t: TFunction, actType?: ActType) => {
  if (!actType) return t('common.none');

  const actMap: Record<number, string> = {
    [ActType.TaskStarted]: t('tasks.acts.taskStarted'),
    [ActType.TaskFinished]: t('tasks.acts.taskFinished'),
    [ActType.Reserved]: t('tasks.acts.reserved'),
    [ActType.CallElevator]: t('tasks.acts.callElevator'),
    [ActType.SwitchMap]: t('tasks.acts.switchMap'),
    [ActType.PlayAudio]: t('tasks.acts.playAudio'),
    [ActType.OpenCompartment]: t('tasks.acts.openCompartment'),
    [ActType.CallAutomaticDoor]: t('tasks.acts.callAutomaticDoor'),
    [ActType.CallTurnstile]: t('tasks.acts.callTurnstile'),
    [ActType.DetectDoorOrTurnstileArea]: t('tasks.acts.detectDoorArea'),
    [ActType.EnterElevator]: t('tasks.acts.enterElevator'),
    [ActType.ExitElevator]: t('tasks.acts.exitElevator'),
    [ActType.GoToDestination]: t('tasks.acts.goToDestination'),
    [ActType.ArrivedAtDestination]: t('tasks.acts.arrivedAtDestination'),
    [ActType.DockToPile]: t('tasks.acts.dockToPile'),
    [ActType.TaskPaused]: t('tasks.acts.taskPaused'),
    [ActType.CallPhoneBox]: t('tasks.acts.callPhoneBox'),
    [ActType.CloseCompartment]: t('tasks.acts.closeCompartment'),
    [ActType.SetSprayLevel]: t('tasks.acts.setSprayLevel'),
    [ActType.ReserveElevator]: t('tasks.acts.reserveElevator'),
    [ActType.SetLedStrip]: t('tasks.acts.setLedStrip'),
    [ActType.SetSpeed]: t('tasks.acts.setSpeed'),
    [ActType.WaitForInteraction]: t('tasks.acts.waitForInteraction'),
    [ActType.JackingLift]: t('tasks.acts.jackingLift'),
    [ActType.JackingLower]: t('tasks.acts.jackingLower'),
  };

  return actMap[actType] ?? `Act ${actType}`;
};


export type Task = {
  taskId: string;
  name?: string;
  businessId: string;
  buildingId: string;
  robotId: string;
  createTime: string;
  actType?: ActType;
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

export const DispatchType = {
  Ordinary: 0,
  Queue: 2,
} as const;

export type DispatchType = typeof DispatchType[keyof typeof DispatchType];

export const RunMode = {
  FlexibleObstacleAvoidance: 1,
  TrajectoryLimitedAvoidance: 2,
  TrajectoryNoAvoidance: 3,
  TrajectoryNoDockReplenish: 4,
} as const;

export type RunMode = typeof RunMode[keyof typeof RunMode];

type JsonObject = Record<string, unknown>;

export type Ext = {
  name: string;
  id: string;
  idx?: number[];
};

export type TaskPoint = {
  areaId: string;
  poiId?: string; // when poiId is provided, the system automatically populates x, y, yaw, type, and the name/id values from the ext field
  x?: number;
  y?: number;
  yaw?: number;
  type?: number;
  stopRadius?: number;
  ext?: Ext;
  stepActs?: JsonObject[];
};

export interface CreateTaskRequest {
  name: string;
  robotId: string;
  businessId?: string;
  routeMode: number;
  runMode?: RunMode;
  runNum?: number;
  taskType: TaskType;
  runType: RunType;
  dispatchType?: DispatchType;
  sourceType?: number;
  ignorePublicSite?: boolean;
  speed?: number;
  detourRadius?: number;
  curPt?: TaskPoint[];
  taskPts: TaskPoint[];
  backPt?: TaskPoint[];
  returnDest?: number;
  returnTime?: number;
};

export interface TaskState {
  loading: boolean;
  error: string | null;

  tasks: Task[];
};
