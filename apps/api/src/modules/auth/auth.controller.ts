import type { RequestHandler } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { authService } from './auth.service.js';

export const register: RequestHandler = asyncHandler(async (request, response) => {
  response.status(201).json({ data: await authService.register(request.body) });
});

export const login: RequestHandler = asyncHandler(async (request, response) => {
  response.status(200).json({ data: await authService.login(request.body) });
});