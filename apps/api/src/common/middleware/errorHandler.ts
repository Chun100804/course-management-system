import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const databaseError = error as { code?: number; name?: string };
  const statusCode = error instanceof AppError
    ? error.statusCode
    : databaseError.code === 11000
      ? 409
      : databaseError.name === 'ValidationError' || databaseError.name === 'CastError'
        ? 400
        : error instanceof SyntaxError
          ? 400
          : 500;
  const message = error instanceof AppError
    ? error.message
    : databaseError.code === 11000
      ? 'A record with this value already exists'
      : databaseError.name === 'ValidationError' || databaseError.name === 'CastError'
        ? error.message
        : error instanceof SyntaxError
          ? 'Invalid JSON request body'
          : 'Internal server error';

  response.status(statusCode).json({ error: { message } });
};
