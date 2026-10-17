import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate.js';
import { getCurrentUser } from './user.controller.js';

export const userRouter = Router();
userRouter.get('/me', authenticate, getCurrentUser);