import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { USER_ROLES } from '../common/constants/roles.js';
import { hashPassword } from '../common/utils/password.js';
import { CourseModel } from '../modules/courses/course.model.js';
import { EnrollmentModel } from '../modules/enrollments/enrollment.model.js';
import { UserModel } from '../modules/users/user.model.js';

const password = 'StrongPassword123!';
const courseBody = {
  title: 'Integration Testing',
  description: 'A course used by API integration tests.',
  instructor: 'Test Instructor',
  fee: 125000,
  capacity: 10,
};

let mongoServer: MongoMemoryServer;
let adminToken: string;
let emailSequence = 0;
let adminPasswordHash: string;

function uniqueEmail(prefix: string): string {
  emailSequence += 1;
  return `${prefix}-${emailSequence}@example.test`;
}

async function registerStudent(email = uniqueEmail('student')) {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Integration Student',
    email,
    password,
  });
  return { response, email };
}

async function login(email: string, userPassword = password) {
  return request(app).post('/api/auth/login').send({ email, password: userPassword });
}

async function createCourse(token: string, overrides: Partial<typeof courseBody> = {}) {
  return request(app)
    .post('/api/courses')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...courseBody, ...overrides });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([UserModel.init(), CourseModel.init(), EnrollmentModel.init()]);
  adminPasswordHash = await hashPassword(password);
}, 60_000);

beforeEach(async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    CourseModel.deleteMany({}),
    EnrollmentModel.deleteMany({}),
  ]);
  await UserModel.create({
    name: 'Integration Admin',
    email: 'admin@example.test',
    password: adminPasswordHash,
    role: USER_ROLES.ADMIN,
  });
  const response = await login('admin@example.test');
  expect(response.status).toBe(200);
  adminToken = response.body.data.token as string;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Course management API integration', () => {
  it('registers a student, rejects duplicate email, and validates password length', async () => {
    const email = uniqueEmail('register');
    const created = await registerStudent(email);
    expect(created.response.status).toBe(201);
    expect(created.response.body.data.user).toMatchObject({ email, role: USER_ROLES.STUDENT });
    expect(created.response.body.data.token).toEqual(expect.any(String));

    const duplicate = await registerStudent(email);
    expect(duplicate.response.status).toBe(409);

    const shortPassword = await request(app).post('/api/auth/register').send({
      name: 'Short Password',
      email: uniqueEmail('short-password'),
      password: '1234567',
    });
    expect(shortPassword.status).toBe(400);
  });

  it('logs in with a valid password and rejects an invalid password', async () => {
    const { response, email } = await registerStudent();
    expect(response.status).toBe(201);

    const validLogin = await login(email);
    expect(validLogin.status).toBe(200);
    expect(validLogin.body.data.token).toEqual(expect.any(String));

    const invalidLogin = await login(email, 'WrongPassword123!');
    expect(invalidLogin.status).toBe(401);
  });

  it('requires a token to read the current user', async () => {
    const response = await request(app).get('/api/users/me');
    expect(response.status).toBe(401);
  });

  it('rejects Student course mutations and allows Admin course CRUD', async () => {
    const student = await registerStudent();
    expect(student.response.status).toBe(201);
    const studentToken = student.response.body.data.token as string;
    const existingCourse = await createCourse(adminToken);
    expect(existingCourse.status).toBe(201);
    const courseId = existingCourse.body.data._id as string;

    const studentCreate = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(courseBody);
    expect(studentCreate.status).toBe(403);

    const studentUpdate = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Student cannot edit' });
    expect(studentUpdate.status).toBe(403);

    const studentDelete = await request(app)
      .delete(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentDelete.status).toBe(403);

    const adminCreate = await createCourse(adminToken, { title: 'Admin-created course' });
    expect(adminCreate.status).toBe(201);

    const adminUpdate = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin-updated course' });
    expect(adminUpdate.status).toBe(200);
    expect(adminUpdate.body.data.title).toBe('Admin-updated course');

    const adminDelete = await request(app)
      .delete(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDelete.status).toBe(204);
  });

  it('rejects Admin enrollment attempts', async () => {
    const course = await createCourse(adminToken);
    expect(course.status).toBe(201);

    const response = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ courseId: course.body.data._id });
    expect(response.status).toBe(403);
  });

  it('allows a Student to enroll once and rejects a duplicate enrollment', async () => {
    const student = await registerStudent();
    expect(student.response.status).toBe(201);
    const token = student.response.body.data.token as string;
    const course = await createCourse(adminToken);
    expect(course.status).toBe(201);

    const enrollmentBody = { courseId: course.body.data._id };
    const firstEnrollment = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send(enrollmentBody);
    expect(firstEnrollment.status).toBe(201);

    const duplicateEnrollment = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send(enrollmentBody);
    expect(duplicateEnrollment.status).toBe(409);
  });

  it('allows only one of two concurrent Students into a capacity-one course', async () => {
    const firstStudent = await registerStudent();
    const secondStudent = await registerStudent();
    expect(firstStudent.response.status).toBe(201);
    expect(secondStudent.response.status).toBe(201);
    const course = await createCourse(adminToken, { capacity: 1 });
    expect(course.status).toBe(201);
    const courseId = course.body.data._id as string;

    const responses = await Promise.all([
      request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${firstStudent.response.body.data.token as string}`)
        .send({ courseId }),
      request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${secondStudent.response.body.data.token as string}`)
        .send({ courseId }),
    ]);

    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
    const storedCourse = await CourseModel.findById(courseId);
    expect(storedCourse?.enrolledCount).toBe(1);
    expect(await EnrollmentModel.countDocuments({ courseId })).toBe(1);
  });

  it('rejects deleting an enrolled course and lowering capacity below enrollment count', async () => {
    const student = await registerStudent();
    const secondStudent = await registerStudent();
    expect(student.response.status).toBe(201);
    expect(secondStudent.response.status).toBe(201);
    const course = await createCourse(adminToken, { capacity: 2 });
    expect(course.status).toBe(201);
    const courseId = course.body.data._id as string;

    const enrollment = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${student.response.body.data.token as string}`)
      .send({ courseId });
    expect(enrollment.status).toBe(201);
    const secondEnrollment = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${secondStudent.response.body.data.token as string}`)
      .send({ courseId });
    expect(secondEnrollment.status).toBe(201);

    const deletion = await request(app)
      .delete(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deletion.status).toBe(409);

    const capacityReduction = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ capacity: 1 });
    expect(capacityReduction.status).toBe(409);
  });
});
