import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { verifyAuthToken } from '../utils/jwt.js';

export const authenticate: RequestHandler = (request, _response, next) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    request.user = verifyAuthToken(authorization.slice(7));
    next();
  } catch {
    next(new AppError('Invalid or expired authentication token', 401));
  }
};