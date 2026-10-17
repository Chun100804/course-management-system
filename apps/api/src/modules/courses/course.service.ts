import { Types } from 'mongoose';
import { AppError } from '../../common/errors/AppError.js';
import { EnrollmentModel } from '../enrollments/enrollment.model.js';
import { courseRepository } from './course.repository.js';

function ensureValidId(id: string): void {
  if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid course id', 400);
}

export const courseService = {
  list(search?: string) {
    return courseRepository.list(search?.trim());
  },

  async get(id: string) {
    ensureValidId(id);
    const course = await courseRepository.findById(id);
    if (!course) throw new AppError('Course not found', 404);
    return course;
  },

  create(input: Parameters<typeof courseRepository.create>[0]) {
    return courseRepository.create(input);
  },

  async update(id: string, input: Partial<Parameters<typeof courseRepository.create>[0]>) {
    ensureValidId(id);
    const updated = await courseRepository.update(id, input);
    if (!updated) {
      if (input.capacity !== undefined && await courseRepository.findById(id)) {
        throw new AppError('Capacity cannot be lower than the number of enrolled students', 409);
      }
      throw new AppError('Course not found', 404);
    }
    return updated;
  },

  async delete(id: string) {
    ensureValidId(id);
    if (await EnrollmentModel.exists({ courseId: id })) {
      throw new AppError('Courses with enrollments cannot be deleted', 409);
    }
    const deleted = await courseRepository.delete(id);
    if (!deleted) {
      if (await courseRepository.findById(id)) {
        throw new AppError('Courses with enrollments cannot be deleted', 409);
      }
      throw new AppError('Course not found', 404);
    }
    return deleted;
  },
};