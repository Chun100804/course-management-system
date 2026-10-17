import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { courseRouter } from '../modules/courses/course.routes.js';
import { enrollmentRouter } from '../modules/enrollments/enrollment.routes.js';
import { userRouter } from '../modules/users/user.routes.js';

export const apiRouter = Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/courses', courseRouter);
apiRouter.use('/enrollments', enrollmentRouter);
apiRouter.use('/users', userRouter);
