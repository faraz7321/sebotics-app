import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';
const logger = new Logger('HttpLogger');

type RequestWithMeta = Request & {
  requestId?: string;
};

function resolveRequestId(request: Request): string {
  const header = request.header(REQUEST_ID_HEADER);
  if (header && header.trim().length > 0) {
    return header.trim();
  }
  return randomUUID();
}

export function requestLoggingMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const startedAt = process.hrtime.bigint();
  const req = request as RequestWithMeta;
  req.requestId = resolveRequestId(request);
  response.setHeader(REQUEST_ID_HEADER, req.requestId);

  let logged = false;
  const logRequest = (event: 'finish' | 'close') => {
    if (logged) {
      return;
    }
    logged = true;

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = response.statusCode;
    const payload = JSON.stringify({
      event: 'request.completed',
      transportEvent: event,
      requestId: req.requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userAgent: request.get('user-agent'),
      ip: request.ip,
      userId: (request as Request & { user?: { userId?: string } }).user?.userId,
    });

    if (statusCode >= 500) {
      logger.error(payload);
      return;
    }
    if (statusCode >= 400) {
      logger.warn(payload);
      return;
    }
    logger.log(payload);
  };

  response.on('finish', () => logRequest('finish'));
  response.on('close', () => logRequest('close'));
  next();
}
