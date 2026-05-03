import { isHttpError } from "@akashnetwork/http-sdk";
import type { LoggerService } from "@akashnetwork/logging";

export class ErrorHandlerService {
  constructor(private readonly logger: LoggerService) {}

  getTraceData(): TraceData {
    return {};
  }

  reportError({ severity, error, tags, ...extra }: ErrorContext): void {
    if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
      return;
    }

    const finalTags: Record<string, string> = { ...tags };

    if (isHttpError(error) && error.response && error.response.status !== 400) {
      finalTags.status = error.response.status.toString();
      finalTags.method = error.response.config.method?.toUpperCase() || "UNKNOWN";
      finalTags.url = error.response.config.url || "UNKNOWN";
      extra.headers = error.response.headers;
    }

    this.logger.error({ ...extra, ...finalTags, error });
  }

  wrapCallback<T extends (...args: any[]) => any>(fn: T, options?: WrapCallbackOptions<ReturnType<T>>): T {
    return ((...args) => {
      try {
        const result = fn(...args);
        if (result && typeof result.catch === "function") {
          return result.catch((error: unknown) => {
            this.reportError({ error, tags: options?.tags });
            if (options?.fallbackValue) return options.fallbackValue();
          });
        }
        return result;
      } catch (error) {
        this.reportError({ error, tags: options?.tags });
        if (options?.fallbackValue) return options.fallbackValue();
      }
    }) as T;
  }
}

export type SeverityLevel = "fatal" | "error" | "warning" | "log" | "info" | "debug";

export interface ErrorContext {
  [key: string]: unknown;
  severity?: SeverityLevel;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export interface WrapCallbackOptions<TValue> {
  tags?: Record<string, string>;
  fallbackValue?: () => TValue;
}

export interface TraceData {
  traceId?: string;
  traceIdW3C?: string;
  baggage?: string;
}

export function sentryTraceToW3C(sentryTrace?: string): string | undefined {
  const value = sentryTrace?.trim();
  if (!value) return;

  const [traceId, spanId, sampled] = value.split("-", 3);
  if (!traceId || !spanId || Number(traceId) === 0 || Number(spanId) === 0) return;

  const flags = Number(sampled) === 1 ? "01" : "00";
  return `00-${traceId}-${spanId}-${flags}`;
}
