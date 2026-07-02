export class AtlassianError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "AtlassianError";
  }
}

export function assertOk(status: number, body: unknown, context: string): void {
  if (status >= 200 && status < 300) return;
  throw new AtlassianError(`${context} failed: HTTP ${status}`, status, body);
}
