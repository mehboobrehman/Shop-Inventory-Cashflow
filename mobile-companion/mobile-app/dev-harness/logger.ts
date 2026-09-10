/**
 * Standalone Mobile Development Telemetry Logger
 * High-performance, non-invasive, memory-safe telemetry transport.
 * 
 * Features:
 * - Bounded queue (capacity = 500, drop oldest on overflow)
 * - PII and secret redaction (Authorization, passwords, tokens, SSNs, credit cards)
 * - AsyncStorage IP caching with subnet probing & LAN autodiscovery fallback
 * - Auto-reconnect with exponential backoff (1s - 30s)
 * - Silent 2s timeout to never block UI thread or crash the host app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type LogLevel = 'VERBOSE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type LogCategory = 'LOG' | 'NETWORK' | 'LIFECYCLE' | 'GESTURE' | 'JANK' | 'METRICS' | 'SYSTEM';

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  level: LogLevel;
  tag: string;
  category: LogCategory;
  message: string;
  data?: any;
  platform?: string;
  device?: {
    platform: string;
    osVersion?: string | number;
  };
}

export interface TelemetryStatus {
  connected: boolean;
  connecting: boolean;
  serverUrl: string | null;
  serverIp: string;
  serverPort: number;
  queueLength: number;
  droppedCount: number;
  sentCount: number;
  lastConnectedAt?: string;
}

const STORAGE_KEY_SERVER_IP = '@dev_harness_server_ip';
const STORAGE_KEY_SERVER_PORT = '@dev_harness_server_port';

const MAX_BUFFER_CAPACITY = 500;
const PROBE_TIMEOUT_MS = 2000;
const MAX_BACKOFF_MS = 30000;
const INITIAL_BACKOFF_MS = 1000;

// Sensitive keys pattern for deep object sanitization
const SENSITIVE_KEY_REGEX = /^(authorization|bearer|password|pass|secret|token|api_?key|access_?token|refresh_?token|cookie|set-cookie|ssn|credit_?card|card_?number|cvv|cvc|pin|private_?key)$/i;

// Regex patterns for scrubbing PII / secrets from text/payloads
const BEARER_TOKEN_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/g;
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const SENSITIVE_QUERY_PARAM_REGEX = /([?&](?:password|token|secret|api_?key|auth)=)[^&]+/gi;

/**
 * Scrub sensitive strings (tokens, SSNs, credit cards, passwords)
 */
export function sanitizeString(val: string): string {
  if (!val || typeof val !== 'string') return val;
  return val
    .replace(BEARER_TOKEN_REGEX, 'Bearer [REDACTED]')
    .replace(JWT_REGEX, '[REDACTED_JWT]')
    .replace(CREDIT_CARD_REGEX, '[REDACTED_CC]')
    .replace(SSN_REGEX, '[REDACTED_SSN]')
    .replace(SENSITIVE_QUERY_PARAM_REGEX, '$1[REDACTED]');
}

/**
 * Deep sanitization of objects and arrays to scrub PII & credentials
 */
export function sanitizeData(data: any, depth = 0): any {
  if (data === null || data === undefined) return data;
  if (depth > 6) return '[MAX_DEPTH_REACHED]';

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  if (typeof data === 'object') {
    // Handle Error objects
    if (data instanceof Error) {
      return {
        name: data.name,
        message: sanitizeString(data.message),
        stack: sanitizeString(data.stack || '')
      };
    }

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(data[key], depth + 1);
      }
    }
    return sanitized;
  }

  return String(data);
}

class TelemetryManager {
  private ws: WebSocket | null = null;
  private queue: TelemetryEvent[] = [];
  private serverIp: string = '127.0.0.1';
  private serverPort: number = 8088;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: any = null;
  private droppedCount: number = 0;
  private sentCount: number = 0;
  private lastConnectedAt?: string;
  private listeners: Set<() => void> = new Set();
  private isProbing: boolean = false;

  constructor() {
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    try {
      const cachedIp = await AsyncStorage.getItem(STORAGE_KEY_SERVER_IP);
      const cachedPort = await AsyncStorage.getItem(STORAGE_KEY_SERVER_PORT);
      if (cachedIp) {
        this.serverIp = cachedIp;
      }
      if (cachedPort) {
        this.serverPort = parseInt(cachedPort, 10) || 8088;
      }
    } catch {
      // Storage unavailable or errored; use defaults safely
    }

    // Attempt initial connection or autodiscovery
    this.connect();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {
        // Safe notification
      }
    });
  }

  public getStatus(): TelemetryStatus {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      serverUrl: this.isConnected ? `ws://${this.serverIp}:${this.serverPort}/telemetry` : null,
      serverIp: this.serverIp,
      serverPort: this.serverPort,
      queueLength: this.queue.length,
      droppedCount: this.droppedCount,
      sentCount: this.sentCount,
      lastConnectedAt: this.lastConnectedAt
    };
  }

  public async setServer(ip: string, port = 8088): Promise<void> {
    this.serverIp = ip.trim();
    this.serverPort = port;
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SERVER_IP, this.serverIp);
      await AsyncStorage.setItem(STORAGE_KEY_SERVER_PORT, String(this.serverPort));
    } catch {
      // Ignore storage errors
    }
    this.reconnectAttempts = 0;
    this.connect();
  }

  public connect(): void {
    if (this.isConnecting || this.isConnected) {
      if (this.ws) {
        try {
          this.ws.close();
        } catch {
          // Ignore
        }
      }
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isConnecting = true;
    this.notify();

    const targetUrl = `ws://${this.serverIp}:${this.serverPort}/telemetry`;

    try {
      const socket = new WebSocket(targetUrl);
      this.ws = socket;

      // Silent connection timeout (2 seconds)
      const connectTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          try {
            socket.close();
          } catch {
            // Ignore
          }
        }
      }, PROBE_TIMEOUT_MS);

      socket.onopen = () => {
        clearTimeout(connectTimeout);
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastConnectedAt = new Date().toISOString();
        this.notify();
        this.flushQueue();
      };

      socket.onclose = () => {
        clearTimeout(connectTimeout);
        this.isConnected = false;
        this.isConnecting = false;
        this.ws = null;
        this.notify();
        this.scheduleReconnect();
      };

      socket.onerror = () => {
        clearTimeout(connectTimeout);
        this.isConnected = false;
        this.isConnecting = false;
        this.notify();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PING') {
            socket.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          }
        } catch {
          // Non-JSON message, ignore
        }
      };
    } catch {
      this.isConnected = false;
      this.isConnecting = false;
      this.notify();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    // Exponential backoff
    const delay = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, this.reconnectAttempts), MAX_BACKOFF_MS);
    this.reconnectAttempts++;

    // If consecutive failures >= 3, trigger background subnet probe
    if (this.reconnectAttempts === 3 && !this.isProbing) {
      this.autodiscoverServer().catch(() => {});
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Probe common LAN candidates to discover the telemetry server
   */
  public async autodiscoverServer(): Promise<boolean> {
    if (this.isProbing) return false;
    this.isProbing = true;

    const candidateHosts: string[] = [
      this.serverIp,
      '127.0.0.1',
      '10.0.2.2', // Android emulator host loopback
      'localhost'
    ];

    // Add local subnet common gateway / host addresses if applicable
    if (this.serverIp && this.serverIp.includes('.')) {
      const parts = this.serverIp.split('.');
      if (parts.length === 4) {
        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
        candidateHosts.push(`${subnet}.1`, `${subnet}.2`, `${subnet}.100`, `${subnet}.101`);
      }
    }

    const ports = [this.serverPort, 8088, 5000, 5001];
    const uniqueCandidates: { host: string; port: number }[] = [];

    for (const host of candidateHosts) {
      for (const port of ports) {
        if (!uniqueCandidates.some(c => c.host === host && c.port === port)) {
          uniqueCandidates.push({ host, port });
        }
      }
    }

    for (const candidate of uniqueCandidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
        const res = await fetch(`http://${candidate.host}:${candidate.port}/api/config`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const config = await res.json();
          const validHost = config.host || candidate.host;
          const validPort = config.port || candidate.port;
          await this.setServer(validHost, validPort);
          this.isProbing = false;
          return true;
        }
      } catch {
        // Probe failed, continue next
      }
    }

    this.isProbing = false;
    return false;
  }

  /**
   * Push a sanitized event to the bounded queue & flush if connected
   */
  public log(level: LogLevel, tag: string, message: string, data?: any, category: LogCategory = 'LOG'): void {
    const sanitizedData = data !== undefined ? sanitizeData(data) : undefined;
    const sanitizedMsg = sanitizeString(message || '');

    const event: TelemetryEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      tag: tag || 'APP',
      category,
      message: sanitizedMsg,
      data: sanitizedData,
      platform: Platform.OS,
      device: {
        platform: Platform.OS,
        osVersion: Platform.Version
      }
    };

    // Bounded buffer with DROP_OLDEST policy
    if (this.queue.length >= MAX_BUFFER_CAPACITY) {
      this.queue.shift(); // Drop oldest
      this.droppedCount++;
    }

    this.queue.push(event);

    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.flushQueue();
    } else {
      // Fallback: silent HTTP dispatch in the background
      this.dispatchHttpFallback(event);
    }
  }

  private flushQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (!event) break;

      try {
        this.ws.send(JSON.stringify(event));
        this.sentCount++;
      } catch {
        // If send fails, push back and break
        this.queue.unshift(event);
        break;
      }
    }
    this.notify();
  }

  private async dispatchHttpFallback(event: TelemetryEvent): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
      await fetch(`http://${this.serverIp}:${this.serverPort}/api/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch {
      // Silent failover; event remains safely bounded
    }
  }

  public clearQueue(): void {
    this.queue = [];
    this.notify();
  }
}

// Global Singleton Instance
const manager = new TelemetryManager();

export function logToAgent(level: LogLevel, tag: string, message: string, data?: any, category: LogCategory = 'LOG'): void {
  manager.log(level, tag, message, data, category);
}

export const logVerbose = (tag: string, message: string, data?: any) => logToAgent('VERBOSE', tag, message, data, 'LOG');
export const logDebug = (tag: string, message: string, data?: any) => logToAgent('DEBUG', tag, message, data, 'LOG');
export const logInfo = (tag: string, message: string, data?: any) => logToAgent('INFO', tag, message, data, 'LOG');
export const logWarn = (tag: string, message: string, data?: any) => logToAgent('WARN', tag, message, data, 'LOG');
export const logError = (tag: string, message: string, data?: any) => logToAgent('ERROR', tag, message, data, 'LOG');

export const logNetwork = (
  method: string,
  url: string,
  status: number,
  latencyMs: number,
  headers?: Record<string, any>,
  body?: any
) => {
  logToAgent(
    status >= 400 ? 'ERROR' : 'INFO',
    'OkHttp/Network',
    `${method.toUpperCase()} ${url} -> ${status} (${latencyMs}ms)`,
    {
      method,
      url,
      status,
      latencyMs,
      headers,
      body
    },
    'NETWORK'
  );
};

export function getTelemetryStatus(): TelemetryStatus {
  return manager.getStatus();
}

export async function setTelemetryServerIp(ip: string, port?: number): Promise<void> {
  await manager.setServer(ip, port || 8088);
}

export async function autodiscoverServer(): Promise<boolean> {
  return manager.autodiscoverServer();
}

export function subscribeTelemetryStatus(listener: () => void): () => void {
  return manager.subscribe(listener);
}

export function clearTelemetryQueue(): void {
  manager.clearQueue();
}
