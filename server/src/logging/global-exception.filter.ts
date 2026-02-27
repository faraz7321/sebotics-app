import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorResponse = Record<string, unknown> & {
  statusCode: number;
  message: unknown;
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const response = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = this.buildResponseBody(statusCode, exception);
    const logPayload = JSON.stringify({
      event: 'request.error',
      requestId: request?.requestId,
      method: request?.method,
      path: request?.originalUrl ?? request?.url,
      statusCode,
      message: responseBody.message,
      error: responseBody.error,
    });

    if (statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(logPayload, stack);
    } else {
      this.logger.warn(logPayload);
    }

    response.status(statusCode).json(responseBody);
  }

  private buildResponseBody(statusCode: number, exception: unknown): ErrorResponse {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          statusCode,
          message: exceptionResponse,
        };
      }

      if (isRecord(exceptionResponse)) {
        const body: ErrorResponse = {
          ...exceptionResponse,
          statusCode:
            typeof exceptionResponse.statusCode === 'number'
              ? exceptionResponse.statusCode
              : statusCode,
          message: exceptionResponse.message ?? exception.message,
        };

        if (typeof exceptionResponse.error === 'string') {
          body.error = exceptionResponse.error;
        }

        return body;
      }
    }

    return {
      statusCode,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }
}
