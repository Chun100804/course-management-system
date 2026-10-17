import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../errors/AppError.js';

export function validate(schema: ZodSchema): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      next(new AppError(result.error.issues.map((issue) => issue.message).join(', '), 400));
      return;
    }
    request.body = result.data;
    next();
  };
}