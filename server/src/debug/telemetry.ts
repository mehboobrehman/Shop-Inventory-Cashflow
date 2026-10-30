import { telemetry } from '@shop/shared';
import { Request, Response, NextFunction } from 'express';

const isDebug = process.env.BUILD_TYPE === 'debug' || process.env.NODE_ENV === 'development';

if (isDebug) {
  telemetry.setEnabled(true);
  console.log('[DEBUG BUILD] Telemetry & Verbose Logging enabled.');
} else {
  telemetry.setEnabled(false);
}

export function debugTelemetryMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isDebug) {
    return next();
  }

  telemetry.incrementRequests();
  const start = Date.now();
  
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      telemetry.incrementErrors();
      telemetry.track('HTTP_ERROR', `${req.method} ${req.baseUrl || ''}${req.path}`, {
        status: res.statusCode,
        durationMs: duration,
        error: body?.error || body,
      });
    } else {
      telemetry.track('HTTP_REQUEST', `${req.method} ${req.baseUrl || ''}${req.path}`, {
        status: res.statusCode,
        durationMs: duration,
      });
    }
    return originalJson.call(this, body);
  };

  next();
}

export function registerDebugRoutes(app: any) {
  if (!isDebug) return;

  app.get('/api/v1/debug/telemetry', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        metrics: telemetry.getMetrics(),
        events: telemetry.getEvents(),
      },
    });
  });

  app.post('/api/v1/debug/telemetry/clear', (_req: Request, res: Response) => {
    telemetry.clear();
    res.json({ success: true, message: 'Telemetry data cleared' });
  });

  console.log('[DEBUG BUILD] Registered debug telemetry endpoints (/api/v1/debug/telemetry).');
}
