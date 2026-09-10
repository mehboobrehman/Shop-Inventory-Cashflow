/**
 * Standalone Mobile Development Harness Barrel Export
 * Conditional initialization ensuring ZERO release footprint in production.
 */

import {
  logToAgent as devLogToAgent,
  logVerbose as devLogVerbose,
  logDebug as devLogDebug,
  logInfo as devLogInfo,
  logWarn as devLogWarn,
  logError as devLogError,
  logNetwork as devLogNetwork,
  getTelemetryStatus as devGetTelemetryStatus,
  setTelemetryServerIp as devSetTelemetryServerIp,
  autodiscoverServer as devAutodiscoverServer,
  clearTelemetryQueue as devClearTelemetryQueue,
  subscribeTelemetryStatus as devSubscribeTelemetryStatus,
  LogLevel,
  LogCategory,
  TelemetryStatus
} from './logger';
import { installErrorInterceptor } from './errorInterceptor';
import { DevMenuOverlay as DevMenuOverlayComponent } from './DevMenuOverlay';

declare const __DEV__: boolean;

export interface DevHarnessConfig {
  serverIp?: string;
  serverPort?: number;
  autoDiscoverOnStart?: boolean;
}

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

/**
 * Initialize Development Harness
 * No-op in production.
 */
export function initDevHarness(config?: DevHarnessConfig): void {
  if (!isDev) return;

  installErrorInterceptor();

  if (config?.serverIp) {
    devSetTelemetryServerIp(config.serverIp, config.serverPort || 8088);
  }

  if (config?.autoDiscoverOnStart) {
    devAutodiscoverServer().catch(() => {});
  }
}

// Production No-Op Stubs
const noopLog = (_level: LogLevel, _tag: string, _message: string, _data?: any, _category?: LogCategory) => {};
const noopLogHelper = (_tag: string, _message: string, _data?: any) => {};
const noopLogNetwork = (_method: string, _url: string, _status: number, _latencyMs: number, _headers?: any, _body?: any) => {};

const defaultStatus: TelemetryStatus = {
  connected: false,
  connecting: false,
  serverUrl: null,
  serverIp: '',
  serverPort: 8088,
  queueLength: 0,
  droppedCount: 0,
  sentCount: 0
};

// Exported Logger Functions
export const logToAgent = isDev ? devLogToAgent : noopLog;
export const logVerbose = isDev ? devLogVerbose : noopLogHelper;
export const logDebug = isDev ? devLogDebug : noopLogHelper;
export const logInfo = isDev ? devLogInfo : noopLogHelper;
export const logWarn = isDev ? devLogWarn : noopLogHelper;
export const logError = isDev ? devLogError : noopLogHelper;
export const logNetwork = isDev ? devLogNetwork : noopLogNetwork;

// Status & Configuration
export const getTelemetryStatus = isDev ? devGetTelemetryStatus : () => defaultStatus;
export const setTelemetryServerIp = isDev ? devSetTelemetryServerIp : async () => {};
export const autodiscoverServer = isDev ? devAutodiscoverServer : async () => false;
export const clearTelemetryQueue = isDev ? devClearTelemetryQueue : () => {};
export const subscribeTelemetryStatus = isDev ? devSubscribeTelemetryStatus : () => () => {};

// UI Overlay Component
export const DevMenuOverlay = isDev ? DevMenuOverlayComponent : () => null;

export type { LogLevel, LogCategory, TelemetryStatus, TelemetryEvent } from './logger';
