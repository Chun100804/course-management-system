import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '../common/constants/roles.js';
import { USER_ROLES as SHARED_USER_ROLES } from '@cms/shared';
import { CourseModel } from './courses/course.model.js';
import { EnrollmentModel } from './enrollments/enrollment.model.js';
import { UserModel } from './users/user.model.js';

describe('Mongoose models', () => {
  it('uses the shared role enum as the API role enum', () => {
    expect(USER_ROLES).toBe(SHARED_USER_ROLES);
    expect(USER_ROLES.ADMIN).toBe('ADMIN');
    expect(USER_ROLES.STUDENT).toBe('STUDENT');
  });

  it('defaults new users to STUDENT and normalizes their email', async () => {
    const user = new UserModel({
      name: 'Test Student',
      email: 'STUDENT@example.com',
      password: 'hashed-password',
    });

    await expect(user.validate()).resolves.toBeUndefined();
    expect(user.role).toBe(USER_ROLES.STUDENT);
    expect(user.email).toBe('student@example.com');
  });

  it('accepts ADMIN as the administrator role', async () => {
    const user = new UserModel({
      name: 'Test Admin',
      email: 'admin@example.com',
      password: 'hashed-password',
      role: USER_ROLES.ADMIN,
    });

    await expect(user.validate()).resolves.toBeUndefined();
    expect(user.role).toBe(USER_ROLES.ADMIN);
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
