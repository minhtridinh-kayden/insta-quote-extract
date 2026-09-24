export type RequestLog = {
  requestId: string;
  status: number;
  durationMs: number;
  pageCount?: number;
  refusalCodes?: string[];
  detail?: string;
};

export type Logger = {
  request(entry: RequestLog): void;
  failure(requestId: string, error: unknown): void;
};

function quietly(write: () => void): void {
  try {
    write();
  } catch {
    // a broken logger must never replace the real response
  }
}

export function safeLogger(logger: Logger): Logger {
  return {
    request: (entry) => quietly(() => logger.request(entry)),
    failure: (requestId, error) => quietly(() => logger.failure(requestId, error)),
  };
}

export const consoleLogger: Logger = {
  request: (entry) => console.info(JSON.stringify({ event: "extract", ...entry })),
  failure: (requestId, error) => console.error(JSON.stringify({ event: "extract_failed", requestId }), error),
};
