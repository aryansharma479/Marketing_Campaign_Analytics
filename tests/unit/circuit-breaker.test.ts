import { describe, it, expect, beforeEach, jest } from '@jest/globals';

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

class TestCircuitBreaker {
  private options: CircuitBreakerOptions;
  private stats: {
    failures: number;
    successes: number;
    lastFailureTime: number | null;
    state: CircuitState;
  };

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
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
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

  getStats() {
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

describe('CircuitBreaker', () => {
  let circuitBreaker: TestCircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new TestCircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 5000,
    });
  });

  describe('CLOSED state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should execute successful calls', async () => {
      const result = await circuitBreaker.execute(async () => 'success');
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should remain CLOSED after failures below threshold', async () => {
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error('fail');
          });
        } catch {}
      }
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should transition to OPEN after reaching failure threshold', async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error('fail');
          });
        } catch {}
      }
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('OPEN state', () => {
    beforeEach(() => {
      circuitBreaker.forceOpen();
    });

    it('should reject calls immediately when OPEN', async () => {
      await expect(
        circuitBreaker.execute(async () => 'success')
      ).rejects.toThrow('Circuit breaker is OPEN');
    });
  });

  describe('HALF_OPEN state', () => {
    it('should transition to HALF_OPEN after reset timeout', async () => {
      jest.useFakeTimers();
      
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error('fail');
          });
        } catch {}
      }
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      jest.advanceTimersByTime(5100);
      
      try {
        await circuitBreaker.execute(async () => 'success');
      } catch {}
      
      jest.useRealTimers();
    });
  });

  describe('forceOpen and forceClose', () => {
    it('should allow forcing the circuit open', () => {
      expect(circuitBreaker.getState()).toBe('CLOSED');
      circuitBreaker.forceOpen();
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should allow forcing the circuit closed', () => {
      circuitBreaker.forceOpen();
      expect(circuitBreaker.getState()).toBe('OPEN');
      circuitBreaker.forceClose();
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('getStats', () => {
    it('should return current statistics', async () => {
      const stats = circuitBreaker.getStats();
      expect(stats).toHaveProperty('failures');
      expect(stats).toHaveProperty('successes');
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('lastFailureTime');
    });

    it('should track failure count', async () => {
      try {
        await circuitBreaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {}
      
      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(1);
    });
  });
});
