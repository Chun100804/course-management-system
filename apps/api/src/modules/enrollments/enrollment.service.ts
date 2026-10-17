import { Types } from 'mongoose';
import { AppError } from '../../common/errors/AppError.js';
import { CourseModel } from '../courses/course.model.js';
import { enrollmentRepository } from './enrollment.repository.js';

export const enrollmentService = {
  async enroll(studentId: string, courseId: string) {
    if (!Types.ObjectId.isValid(courseId)) throw new AppError('Invalid course id', 400);
    if (!(await CourseModel.exists({ _id: courseId }))) throw new AppError('Course not found', 404);
    if (await enrollmentRepository.findDuplicate(studentId, courseId)) {
      throw new AppError('You are already enrolled in this course', 409);
    }

    const capacityReserved = await CourseModel.updateOne(
      { _id: courseId, $expr: { $lt: ['$enrolledCount', '$capacity'] } },
      { $inc: { enrolledCount: 1 } },
    );
    if (capacityReserved.modifiedCount !== 1) {
      if (await enrollmentRepository.findDuplicate(studentId, courseId)) {
        throw new AppError('You are already enrolled in this course', 409);
      }
      throw new AppError('Course capacity has been reached', 409);
    }

    try {
      return await enrollmentRepository.create(studentId, courseId);
    } catch (error) {
      await CourseModel.updateOne({ _id: courseId, enrolledCount: { $gt: 0 } }, { $inc: { enrolledCount: -1 } });
      if (isDuplicateKeyError(error)) {
        throw new AppError('You are already enrolled in this course', 409);
      }
      throw error;
    }
  },

  listMine(studentId: string) {
    return enrollmentRepository.listForStudent(studentId);
  },

  async listForCourse(courseId: string) {
    if (!Types.ObjectId.isValid(courseId)) throw new AppError('Invalid course id', 400);
    if (!(await CourseModel.exists({ _id: courseId }))) throw new AppError('Course not found', 404);
    return enrollmentRepository.listForCourse(courseId);
  },
};

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}