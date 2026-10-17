import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CourseModel } from '../courses/course.model.js';
import { enrollmentRepository } from './enrollment.repository.js';
import { enrollmentService } from './enrollment.service.js';

function queryResult<T>(value: T): never {
  return Promise.resolve(value) as never;
}

describe('enrollmentService.enroll', () => {
  const studentId = '67a000000000000000000001';
  const courseId = '67a000000000000000000002';

  beforeEach(() => vi.restoreAllMocks());

  it('rejects an existing student-course enrollment before reserving capacity', async () => {
    vi.spyOn(CourseModel, 'exists').mockReturnValue(queryResult({ _id: courseId }));
    vi.spyOn(enrollmentRepository, 'findDuplicate').mockReturnValue(queryResult({ _id: 'existing' }));
    const reserveSeat = vi.spyOn(CourseModel, 'updateOne');

    await expect(enrollmentService.enroll(studentId, courseId)).rejects.toMatchObject({
      statusCode: 409,
      message: 'You are already enrolled in this course',
    });
    expect(reserveSeat).not.toHaveBeenCalled();
  });

  it('rejects a full course without creating an enrollment', async () => {
    vi.spyOn(CourseModel, 'exists').mockReturnValue(queryResult({ _id: courseId }));
    vi.spyOn(enrollmentRepository, 'findDuplicate').mockReturnValue(queryResult(null));
    vi.spyOn(CourseModel, 'updateOne').mockReturnValue(queryResult({ modifiedCount: 0 }));
    const create = vi.spyOn(enrollmentRepository, 'create');

    await expect(enrollmentService.enroll(studentId, courseId)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Course capacity has been reached',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('creates an enrollment after reserving a seat', async () => {
    vi.spyOn(CourseModel, 'exists').mockReturnValue(queryResult({ _id: courseId }));
    vi.spyOn(enrollmentRepository, 'findDuplicate').mockReturnValue(queryResult(null));
    vi.spyOn(CourseModel, 'updateOne').mockReturnValue(queryResult({ modifiedCount: 1 }));
    const enrollment = { _id: 'new-enrollment' };
    vi.spyOn(enrollmentRepository, 'create').mockReturnValue(queryResult(enrollment));

    await expect(enrollmentService.enroll(studentId, courseId)).resolves.toBe(enrollment);
  });

  it('rejects enrollment when the course does not exist without reserving a seat', async () => {
    vi.spyOn(CourseModel, 'exists').mockReturnValue(queryResult(null));
    const findDuplicate = vi.spyOn(enrollmentRepository, 'findDuplicate');
    const updateCourse = vi.spyOn(CourseModel, 'updateOne');
    const createEnrollment = vi.spyOn(enrollmentRepository, 'create');

    await expect(enrollmentService.enroll(studentId, courseId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Course not found',
    });
    expect(findDuplicate).not.toHaveBeenCalled();
    expect(updateCourse).not.toHaveBeenCalled();
    expect(createEnrollment).not.toHaveBeenCalled();
  });

  it('reports a racing duplicate as a duplicate rather than a capacity error', async () => {
    vi.spyOn(CourseModel, 'exists').mockReturnValue(queryResult({ _id: courseId }));
    vi.spyOn(enrollmentRepository, 'findDuplicate')
      .mockReturnValueOnce(queryResult(null))
      .mockReturnValueOnce(queryResult({ _id: 'racing-enrollment' }));
    vi.spyOn(CourseModel, 'updateOne').mockReturnValue(queryResult({ modifiedCount: 0 }));

    await expect(enrollmentService.enroll(studentId, courseId)).rejects.toMatchObject({
      statusCode: 409,
      message: 'You are already enrolled in this course',
    });
  });

  it('releases the reserved seat and reports a duplicate-key enrollment race', async () => {
    let enrolledCount = 0;
    vi.spyOn(CourseModel, 'exists').mockReturnValue(queryResult({ _id: courseId }));
    vi.spyOn(enrollmentRepository, 'findDuplicate').mockReturnValue(queryResult(null));
    const updateCourse = vi.spyOn(CourseModel, 'updateOne')
      .mockImplementationOnce(() => {
        enrolledCount += 1;
        return queryResult({ modifiedCount: 1 });
      })
      .mockImplementationOnce(() => {
        enrolledCount -= 1;
        return queryResult({ modifiedCount: 1 });
      });
    vi.spyOn(enrollmentRepository, 'create').mockRejectedValue({ code: 11000 });

    await expect(enrollmentService.enroll(studentId, courseId)).rejects.toMatchObject({
      statusCode: 409,
      message: 'You are already enrolled in this course',
    });
    expect(enrolledCount).toBe(0);
    expect(updateCourse).toHaveBeenNthCalledWith(
      2,
      { _id: courseId, enrolledCount: { $gt: 0 } },
      { $inc: { enrolledCount: -1 } },
    );
  });

  it('releases the reserved seat and rethrows an unexpected enrollment creation error', async () => {
    let enrolledCount = 0;
    vi.spyOn(CourseModel, 'exists').mockReturnValue(queryResult({ _id: courseId }));
    vi.spyOn(enrollmentRepository, 'findDuplicate').mockReturnValue(queryResult(null));
    const updateCourse = vi.spyOn(CourseModel, 'updateOne')
      .mockImplementationOnce(() => {
        enrolledCount += 1;
        return queryResult({ modifiedCount: 1 });
      })
      .mockImplementationOnce(() => {
        enrolledCount -= 1;
        return queryResult({ modifiedCount: 1 });
      });
    const creationError = new Error('Enrollment storage unavailable');
    vi.spyOn(enrollmentRepository, 'create').mockRejectedValue(creationError);

    await expect(enrollmentService.enroll(studentId, courseId)).rejects.toBe(creationError);
    expect(enrolledCount).toBe(0);
    expect(updateCourse).toHaveBeenNthCalledWith(
      2,
      { _id: courseId, enrolledCount: { $gt: 0 } },
      { $inc: { enrolledCount: -1 } },
    );
  });
});
