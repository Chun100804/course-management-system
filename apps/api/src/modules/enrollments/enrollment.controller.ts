import type { RequestHandler } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { enrollmentService } from './enrollment.service.js';

export const createEnrollment: RequestHandler = asyncHandler(async (request, response) => {
  response.status(201).json({ data: await enrollmentService.enroll(request.user!.id, request.body.courseId) });
});

export const listMyEnrollments: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ data: await enrollmentService.listMine(request.user!.id) });
});

export const listCourseEnrollments: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ data: await enrollmentService.listForCourse(String(request.params.courseId)) });
});