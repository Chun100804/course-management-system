import type { RequestHandler } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { userService } from './user.service.js';

export const getCurrentUser: RequestHandler = asyncHandler(async (request, response) => {
  const user = await userService.getById(request.user!.id);
  response.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role } });
});