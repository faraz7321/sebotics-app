export type AutoxingEnvelope<T = unknown> = {
  status: number;
  message: string;
  data?: T;
};

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
