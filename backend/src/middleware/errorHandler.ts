import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  if ('type' in err && err.type === 'entity.too.large')
    return res.status(413).json({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds the size limit' },
    });
  if (err instanceof SyntaxError && 'status' in err && err.status === 400)
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request body' },
    });
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.flatten().fieldErrors,
      },
    });
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: getErrorCodeForStatus(err.statusCode),
        details: err.details,
      },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const status =
      err.code === 'P2002' || err.code === 'P2034'
        ? 409
        : err.code === 'P2025'
          ? 404
          : err.code === 'P2003'
            ? 409
            : undefined;
    if (status)
      return res.status(status).json({
        success: false,
        error: {
          code: getErrorCodeForStatus(status),
          message: status === 404 ? 'Record not found' : 'This change conflicts with existing data',
        },
      });
  }

  // Log unhandled exceptions
  const code = 'code' in err && typeof err.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(err.code)
    ? err.code
    : undefined;
  console.error('[UNHANDLED_EXCEPTION]', { name: err.name, code });

  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    error: {
      message: isProduction ? 'Internal Server Error' : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      details: isProduction ? undefined : err.stack,
    },
  });
};

function getErrorCodeForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    case 429:
      return 'RATE_LIMITED';
    case 409:
      return 'CONFLICT';
    default:
      return 'APP_ERROR';
  }
}
