import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface AuditLogOptions {
  action: string;
  entityType: string;
}

/**
 * Express middleware that records financial transactions (deposits, withdrawals, sales, refunds)
 * into the AuditLog table using Prisma upon successful completion of the request.
 */
export function auditLogMiddleware(action: string, entityType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    let responseBody: any = null;

    res.json = function (body) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    res.on('finish', async () => {
      // Only log successful transactions (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.user?.id || null;
          let entityId = req.params.id || req.params.saleId || null;

          if (!entityId && responseBody && responseBody.data) {
            if (typeof responseBody.data === 'object' && responseBody.data.id) {
              entityId = responseBody.data.id;
            }
          }

          const detailsObj = {
            method: req.method,
            path: req.originalUrl,
            amount: req.body?.amount || req.body?.totalAmount || responseBody?.data?.totalAmount || null,
            description: req.body?.description || null,
            params: req.params,
            query: req.query,
            summary: `${action} executed successfully on ${entityType}`,
          };

          await prisma.auditLog.create({
            data: {
              action,
              entityType,
              entityId: entityId ? String(entityId) : null,
              userId,
              details: JSON.stringify(detailsObj),
            },
          });
        } catch (err) {
          console.error('AuditLog middleware error:', err);
        }
      }
    });

    next();
  };
}

/**
 * Direct helper function to record an audit log entry.
 */
export async function recordAuditLog(data: {
  action: string;
  entityType: string;
  entityId?: string | null;
  userId?: string | null;
  details?: string | object | null;
}) {
  try {
    const detailsStr =
      typeof data.details === 'object' && data.details !== null
        ? JSON.stringify(data.details)
        : data.details || null;

    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ? String(data.entityId) : null,
        userId: data.userId || null,
        details: detailsStr,
      },
    });
  } catch (err) {
    console.error('recordAuditLog error:', err);
  }
}
