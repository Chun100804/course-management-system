import { Router } from 'express';
import { USER_ROLES } from '../../common/constants/roles.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { authorize } from '../../common/middleware/authorize.js';
import { validate } from '../../common/middleware/validate.js';
import { createCourse, deleteCourse, getCourse, listCourses, updateCourse } from './course.controller.js';
import { courseSchema } from './course.schema.js';

export const courseRouter = Router();
courseRouter.get('/', listCourses);
courseRouter.get('/:id', getCourse);
courseRouter.post('/', authenticate, authorize(USER_ROLES.ADMIN), validate(courseSchema), createCourse);
courseRouter.put(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(courseSchema.partial().refine((course) => Object.keys(course).length > 0, 'Provide at least one field to update')),
  updateCourse,
);
courseRouter.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteCourse);