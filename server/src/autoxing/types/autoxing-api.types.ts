export type AutoxingEnvelope<T = unknown> = {
  status: number;
  message: string;
  data?: T;
};

export type AutoxingRequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};
