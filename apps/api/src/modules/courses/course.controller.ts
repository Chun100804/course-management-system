import type { RequestHandler } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { courseService } from './course.service.js';

export const listCourses: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ data: await courseService.list(String(request.query.search ?? '')) });
});

export const getCourse: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ data: await courseService.get(String(request.params.id)) });
});

export const createCourse: RequestHandler = asyncHandler(async (request, response) => {
  response.status(201).json({ data: await courseService.create(request.body) });
});

export const updateCourse: RequestHandler = asyncHandler(async (request, response) => {
  response.json({ data: await courseService.update(String(request.params.id), request.body) });
});

export const deleteCourse: RequestHandler = asyncHandler(async (request, response) => {
  await courseService.delete(String(request.params.id));
  response.status(204).send();
});