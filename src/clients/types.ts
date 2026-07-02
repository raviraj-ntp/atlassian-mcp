export type AuthHeaders = Record<string, string>;

export type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  expectText?: boolean;
  dryRun?: boolean;
};

export type HttpResult = {
  status: number;
  data: unknown;
  headers: Headers;
};
