export type AutoxingEnvelope<T = unknown> = {
  status: number;
  message: string;
  data?: T;
};

export type AutoxingListPayload<TItem> = {
  list?: TItem[];
  count?: number;
  total?: number;
  [key: string]: unknown;
};

export type AutoxingBusinessItem = {
  id?: string;
  name?: string;
  type?: number | string;
  address?: string;
  customerId?: string | number;
  businessId?: string;
  buildingId?: string;
  createdTime?: number;
  updateTime?: number;
  [key: string]: unknown;
};

export type AutoxingBuildingItem = {
  id?: string;
  name?: string;
  type?: number | string;
  country?: string;
  province?: number | string;
  city?: number | string;
  area?: number | string;
  address?: string;
  customerId?: string | number;
  manager?: AutoxingBuildingManager;
  businessId?: string;
  buildingId?: string;
  floors?: AutoxingBuildingFloorItem[];
  coordinates?: number[];
  editable?: boolean;
  createdTime?: number;
  updateTime?: number;
  [key: string]: unknown;
};

export type AutoxingBuildingFloorItem = {
  serialNumber?: number;
  name?: string;
};

export type AutoxingBuildingManager = {
  phoneNumber?: string;
  avatarUrl?: string;
  openid?: string;
  nickName?: string;
  [key: string]: unknown;
};

export type AutoxingRobotItem = {
  id?: string;
  robotId?: string;
  sn?: string;
  serialNumber?: string;
  areaId?: string;
  x?: number;
  y?: number;
  yaw?: number;
  battery?: number;
  isOnLine?: boolean;
  isTask?: boolean;
  isManualMode?: boolean;
  isRemoteMode?: boolean;
  isEmergencyStop?: boolean;
  isCharging?: boolean;
  isError?: boolean;
  mac?: string;
  name?: string;
  model?: string;
  errors?: number[];
  activeStatus?: number;
  businessId?: string;
  buildingId?: string;
  createdTime?: number;
  updateTime?: number;
  [key: string]: unknown;
};

export type AutoxingBusinessGroupBusItem = {
  busId?: string;
  busName?: string;
};

export type AutoxingBusinessGroupItem = {
  id?: string;
  name?: string;
  ownerCode?: string;
  createTime?: number;
  updateTime?: number;
  busList?: AutoxingBusinessGroupBusItem[];
};

export type AutoxingTaskItem = {
  taskId?: string;
  businessId?: string;
  buildingId?: string;
  robotId?: string;
  name?: string;
  createTime?: number;
  sourceType?: number;
  busiType?: number;
  isExcute?: boolean;
  [key: string]: unknown;
};

export type AutoxingBusinessListData = AutoxingListPayload<AutoxingBusinessItem> & {
  groupCount?: number;
  groups?: AutoxingBusinessGroupItem[];
};

export type AutoxingBuildingListData = AutoxingListPayload<AutoxingBuildingItem>;
export type AutoxingRobotListData = AutoxingListPayload<AutoxingRobotItem>;
export type AutoxingTaskListData = AutoxingListPayload<AutoxingTaskItem>;

export function getAutoxingItems<TItem>(
  payload?: AutoxingListPayload<TItem>,
): TItem[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.list)) {
    return payload.list;
  }

  const legacyLists = (payload as { lists?: TItem[] }).lists;
  if (Array.isArray(legacyLists)) {
    return legacyLists;
  }

  return [];
}

export function replaceAutoxingItems<TItem>(
  payload: AutoxingListPayload<TItem>,
  items: TItem[],
) {
  if (Array.isArray(payload.list)) {
    payload.list = items;
  } else {
    const legacyLists = (payload as { lists?: TItem[] }).lists;
    if (Array.isArray(legacyLists)) {
      (payload as { lists?: TItem[] }).lists = items;
    } else {
      payload.list = items;
    }
  }

  if (typeof payload.count === 'number') {
    payload.count = items.length;
  }

  if (typeof payload.total === 'number') {
    payload.total = items.length;
  }
}

export type AutoxingRequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export type AutoxingTokenResponse = {
  status: number;
  message: string;
  data?: {
    key: string;
    token: string;
    expireTime: number;
  };
};

export type AutoxingTokenRequestSchema = {
  appId: string;
  timestamp: number;
  sign: string;
};

export type AutoxingAccessToken = {
  token: string;
  key: string;
  expiresAt: number;
};
