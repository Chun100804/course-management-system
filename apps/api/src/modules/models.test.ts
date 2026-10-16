import { describe, expect, it } from 'vitest';
import { CourseModel } from './courses/course.model.js';
import { EnrollmentModel } from './enrollments/enrollment.model.js';
import { UserModel } from './users/user.model.js';

describe('Mongoose models', () => {
  it('defaults new users to STUDENT and normalizes their email', async () => {
    const user = new UserModel({
      name: 'Test Student',
      email: 'STUDENT@example.com',
      password: 'hashed-password',
    });

    await expect(user.validate()).resolves.toBeUndefined();
    expect(user.role).toBe('STUDENT');
    expect(user.email).toBe('student@example.com');
  });

  it('defaults enrolledCount to zero and rejects negative fees', async () => {
    const course = new CourseModel({
      title: 'Course',
      description: 'Description',
      instructor: 'Instructor',
      fee: -1,
      capacity: 10,
    });

    expect(course.enrolledCount).toBe(0);
    await expect(course.validate()).rejects.toHaveProperty('errors.fee');
  });

  it('rejects a non-integer capacity', async () => {
    const course = new CourseModel({
      title: 'Course',
      description: 'Description',
      instructor: 'Instructor',
      fee: 0,
      capacity: 1.5,
    });

    await expect(course.validate()).rejects.toHaveProperty('errors.capacity');
  });

  it('defines a unique index for each student-course pair', () => {
    const enrollmentIndex = EnrollmentModel.schema
      .indexes()
      .find(([fields]) => fields.studentId === 1 && fields.courseId === 1);

    expect(enrollmentIndex?.[1].unique).toBe(true);
  });
});
