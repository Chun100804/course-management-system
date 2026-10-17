import type { RequestHandler } from 'express';
import type { UserRole } from '../constants/roles.js';
import { AppError } from '../errors/AppError.js';

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }
    next();
  };
}