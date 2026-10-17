import { Router } from 'express';
import { USER_ROLES } from '../../common/constants/roles.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { authorize } from '../../common/middleware/authorize.js';
import { validate } from '../../common/middleware/validate.js';
import { createEnrollment, listCourseEnrollments, listMyEnrollments } from './enrollment.controller.js';
import { enrollmentSchema } from './enrollment.schema.js';

export const enrollmentRouter = Router();
enrollmentRouter.use(authenticate);
enrollmentRouter.get('/mine', authorize(USER_ROLES.STUDENT), listMyEnrollments);
enrollmentRouter.post('/', authorize(USER_ROLES.STUDENT), validate(enrollmentSchema), createEnrollment);
enrollmentRouter.get('/course/:courseId', authorize(USER_ROLES.ADMIN), listCourseEnrollments);