import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnrollmentModel } from '../enrollments/enrollment.model.js';
import { courseRepository } from './course.repository.js';
import { courseSchema } from './course.schema.js';
import { courseService } from './course.service.js';

function queryResult<T>(value: T): never {
  return Promise.resolve(value) as never;
}

describe('courseService', () => {
  const courseId = '67a000000000000000000002';
  const validCourse = {
    title: 'Backend Fundamentals',
    description: 'Learn backend development.',
    instructor: 'Test Instructor',
    fee: 125000,
    capacity: 10,
  };

  beforeEach(() => vi.restoreAllMocks());

  it('creates a course with the supplied values', async () => {
    const createdCourse = { _id: courseId, ...validCourse, enrolledCount: 0 };
    const create = vi.spyOn(courseRepository, 'create').mockReturnValue(queryResult(createdCourse));

    await expect(courseService.create(validCourse)).resolves.toBe(createdCourse);
    expect(create).toHaveBeenCalledWith(validCourse);
  });

  it.each([
    { field: 'fee', value: -1 },
    { field: 'capacity', value: 0 },
    { field: 'capacity', value: -1 },
  ])('rejects a course with invalid $field value $value at the request schema', ({ field, value }) => {
    const input = { ...validCourse, [field]: value };

    expect(courseSchema.safeParse(input).success).toBe(false);
  });

  it('returns the updated course', async () => {
    const updatedCourse = { _id: courseId, ...validCourse, title: 'Updated Course' };
    const update = vi.spyOn(courseRepository, 'update').mockReturnValue(queryResult(updatedCourse));

    await expect(courseService.update(courseId, { title: 'Updated Course' })).resolves.toBe(updatedCourse);
    expect(update).toHaveBeenCalledWith(courseId, { title: 'Updated Course' });
  });

  it('rejects reducing capacity below the current enrollment count', async () => {
    vi.spyOn(courseRepository, 'update').mockReturnValue(queryResult(null));
    vi.spyOn(courseRepository, 'findById').mockReturnValue(queryResult({ _id: courseId }));

    await expect(courseService.update(courseId, { capacity: 2 })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Capacity cannot be lower than the number of enrolled students',
    });
  });

  it('deletes a course with no enrollments', async () => {
    const deletedCourse = { _id: courseId, ...validCourse };
    vi.spyOn(EnrollmentModel, 'exists').mockReturnValue(queryResult(null));
    const deleteCourse = vi.spyOn(courseRepository, 'delete').mockReturnValue(queryResult(deletedCourse));

    await expect(courseService.delete(courseId)).resolves.toBe(deletedCourse);
    expect(deleteCourse).toHaveBeenCalledWith(courseId);
  });

  it('rejects deleting a course that has enrollments', async () => {
    vi.spyOn(EnrollmentModel, 'exists').mockReturnValue(queryResult({ _id: 'existing-enrollment' }));
    const deleteCourse = vi.spyOn(courseRepository, 'delete');

    await expect(courseService.delete(courseId)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Courses with enrollments cannot be deleted',
    });
    expect(deleteCourse).not.toHaveBeenCalled();
  });
});
