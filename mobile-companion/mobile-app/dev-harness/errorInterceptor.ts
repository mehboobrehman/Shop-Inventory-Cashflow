/**
 * Global Development Error & Console Interceptor
 * Intercepts unhandled JS errors, promise rejections, and console logging,
 * routing them seamlessly into the dev telemetry pipeline.
 * Active ONLY in development mode.
 */

import { logToAgent, logError, logWarn, logInfo, logDebug } from './logger';

declare const __DEV__: boolean;
declare const global: any;

let isInstalled = false;
let isLoggingInternal = false;

export function installErrorInterceptor(): void {
  if (isInstalled) return;
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return;

  isInstalled = true;

  // 1. Hook React Native global ErrorUtils handler
  if (typeof global !== 'undefined' && global.ErrorUtils && typeof global.ErrorUtils.getGlobalHandler === 'function') {
    const defaultHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      try {
        logToAgent(
          'ERROR',
          'UnhandledException',
          `Global uncaught error: ${error?.message || 'Unknown error'}`,
          {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            isFatal: !!isFatal
          },
          'SYSTEM'
        );
      } catch {
        // Prevent telemetry failures from interrupting error handling
      }

      // Chain back to original handler so Expo/React Native redbox still works in dev
      if (defaultHandler) {
        defaultHandler(error, isFatal);
      }
    });
  }

  // 2. Hook global unhandled promise rejections if available
  if (typeof global !== 'undefined') {
    const originalPromiseRejectionHandler = global.onunhandledrejection;
    global.onunhandledrejection = (event: any) => {
      try {
        const reason = event?.reason || event;
        logToAgent(
          'ERROR',
          'UnhandledPromise',
          `Unhandled Promise Rejection: ${reason?.message || String(reason)}`,
          {
            reason: reason instanceof Error ? { name: reason.name, message: reason.message, stack: reason.stack } : reason
          },
          'SYSTEM'
        );
      } catch {
        // Safe
      }
      if (typeof originalPromiseRejectionHandler === 'function') {
        originalPromiseRejectionHandler(event);
      }
    };
  }

  // 3. Wrap Console Logging safely
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  function safeFormatArgs(args: any[]): { message: string; data?: any } {
    if (args.length === 0) return { message: '' };
    const first = args[0];
    const rest = args.slice(1);

    let message = typeof first === 'string' ? first : (typeof first === 'object' ? JSON.stringify(first) : String(first));
    let data: any = undefined;

    if (rest.length === 1) {
      data = rest[0];
    } else if (rest.length > 1) {
      data = rest;
    }

    return { message, data };
  }

  console.log = (...args: any[]) => {
    originalConsole.log.apply(console, args);
    if (isLoggingInternal) return;
    try {
      isLoggingInternal = true;
      const { message, data } = safeFormatArgs(args);
      logInfo('Console', message, data);
    } catch {
      // Ignore
    } finally {
      isLoggingInternal = false;
    }
  };

  console.info = (...args: any[]) => {
    originalConsole.info.apply(console, args);
    if (isLoggingInternal) return;
    try {
      isLoggingInternal = true;
      const { message, data } = safeFormatArgs(args);
      logInfo('Console', message, data);
    } catch {
      // Ignore
    } finally {
      isLoggingInternal = false;
    }
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn.apply(console, args);
    if (isLoggingInternal) return;
    try {
      isLoggingInternal = true;
      const { message, data } = safeFormatArgs(args);
      logWarn('Console', message, data);
    } catch {
      // Ignore
    } finally {
      isLoggingInternal = false;
    }
  };

  console.error = (...args: any[]) => {
    originalConsole.error.apply(console, args);
    if (isLoggingInternal) return;
    try {
      isLoggingInternal = true;
      const { message, data } = safeFormatArgs(args);
      logError('Console', message, data);
    } catch {
      // Ignore
    } finally {
      isLoggingInternal = false;
    }
  };

  console.debug = (...args: any[]) => {
    if (originalConsole.debug) {
      originalConsole.debug.apply(console, args);
    }
    if (isLoggingInternal) return;
    try {
      isLoggingInternal = true;
      const { message, data } = safeFormatArgs(args);
      logDebug('Console', message, data);
    } catch {
      // Ignore
    } finally {
      isLoggingInternal = false;
    }
  };
}
