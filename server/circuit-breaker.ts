type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  state: CircuitState;
}

export class CircuitBreaker {
  private options: CircuitBreakerOptions;
  private stats: CircuitStats;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 30000,
      resetTimeout: options.resetTimeout || 60000,
    };

    this.stats = {
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      state: "CLOSED",
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.stats.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.stats.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN - service unavailable");
      }
    }

    try {
      const result = await this.withTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async withTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Circuit breaker timeout"));
      }, this.options.timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private shouldAttemptReset(): boolean {
    if (!this.stats.lastFailureTime) return true;
    return Date.now() - this.stats.lastFailureTime >= this.options.resetTimeout;
  }

  private onSuccess(): void {
    if (this.stats.state === "HALF_OPEN") {
      this.stats.successes++;
      if (this.stats.successes >= this.options.successThreshold) {
        this.reset();
      }
    } else {
      this.stats.failures = 0;
    }
  }

  private onFailure(): void {
    this.stats.failures++;
    this.stats.lastFailureTime = Date.now();

    if (this.stats.state === "HALF_OPEN") {
      this.stats.state = "OPEN";
      this.stats.successes = 0;
    } else if (this.stats.failures >= this.options.failureThreshold) {
      this.stats.state = "OPEN";
    }
  }

  private reset(): void {
    this.stats = {
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      state: "CLOSED",
    };
  }

  getState(): CircuitState {
    return this.stats.state;
  }

  getStats(): CircuitStats {
    return { ...this.stats };
  }

  forceOpen(): void {
    this.stats.state = "OPEN";
    this.stats.lastFailureTime = Date.now();
  }

  forceClose(): void {
    this.reset();
  }
}

export const modelApiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 30000,
});

export async function callExternalModelApi<T>(
  apiCall: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await modelApiCircuitBreaker.execute(apiCall);
  } catch (error) {
    console.error("[CircuitBreaker] External API call failed:", error);
    return fallback;
  }
}
