export interface TelemetryEvent {
  timestamp: string;
  category: string;
  action: string;
  metadata?: Record<string, any>;
}

export interface DebugMetrics {
  requestsCount: number;
  errorsCount: number;
  uptimeSeconds: number;
  memoryUsageMB: number;
}

export class TelemetryCollector {
  private static instance: TelemetryCollector;
  private events: TelemetryEvent[] = [];
  private startTime: number = Date.now();
  private requestsCount: number = 0;
  private errorsCount: number = 0;
  private enabled: boolean = false;

  private constructor() {
    // Enabled by default if configured
  }

  public static getInstance(): TelemetryCollector {
    if (!TelemetryCollector.instance) {
      TelemetryCollector.instance = new TelemetryCollector();
    }
    return TelemetryCollector.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public track(category: string, action: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;
    const event: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      category,
      action,
      metadata,
    };
    this.events.push(event);
    if (this.events.length > 500) {
      this.events.shift(); // keep last 500
    }
    console.debug(`[TELEMETRY] [${event.timestamp}] [${category}] ${action}`, metadata || '');
  }

  public incrementRequests(): void {
    if (!this.enabled) return;
    this.requestsCount++;
  }

  public incrementErrors(): void {
    if (!this.enabled) return;
    this.errorsCount++;
  }

  public getMetrics(): DebugMetrics {
    const mem = process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0;
    return {
      requestsCount: this.requestsCount,
      errorsCount: this.errorsCount,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      memoryUsageMB: Math.round(mem * 100) / 100,
    };
  }

  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  public clear(): void {
    this.events = [];
    this.requestsCount = 0;
    this.errorsCount = 0;
  }
}

export const telemetry = TelemetryCollector.getInstance();
