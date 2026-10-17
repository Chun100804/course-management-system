import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '../../common/constants/roles.js';
import { comparePassword, hashPassword } from '../../common/utils/password.js';
import { userRepository } from '../users/user.repository.js';
import { registerSchema } from './auth.schema.js';
import { authService } from './auth.service.js';

function queryResult<T>(value: T): never {
  return Promise.resolve(value) as never;
}

describe('authService', () => {
  const password = 'StudentPassword123!';
  const student = {
    id: 'student-id',
    name: 'Test Student',
    email: 'student@example.test',
    role: USER_ROLES.STUDENT,
  };

  beforeEach(() => vi.restoreAllMocks());

  it('registers a Student and stores a password hash', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockReturnValue(queryResult(null));
    const create = vi.spyOn(userRepository, 'create').mockImplementation((input) =>
      queryResult({ ...student, password: input.password }),
    );

    const result = await authService.register({
      name: student.name,
      email: student.email,
      password,
    });

    const createdUser = create.mock.calls[0]?.[0];
    expect(result.user).toEqual(student);
    expect(result.token).toEqual(expect.any(String));
    expect(createdUser?.password).not.toBe(password);
    if (!createdUser) throw new Error('Expected the user repository to be called');
    await expect(comparePassword(password, createdUser.password)).resolves.toBe(true);
  });

  it('rejects registration when the normalized email already exists', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockReturnValue(queryResult(student));
    const create = vi.spyOn(userRepository, 'create');

    await expect(authService.register({
      name: student.name,
      email: 'STUDENT@example.test',
      password,
    })).rejects.toMatchObject({
      statusCode: 409,
      message: 'An account with this email already exists',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('does not accept a client-supplied ADMIN role during public registration', async () => {
    const input = registerSchema.parse({
      name: student.name,
      email: student.email,
      password,
      role: USER_ROLES.ADMIN,
    });
    vi.spyOn(userRepository, 'findByEmail').mockReturnValue(queryResult(null));
    const create = vi.spyOn(userRepository, 'create').mockImplementation((userInput) =>
      queryResult({ ...student, password: userInput.password }),
    );

    const result = await authService.register(input);

    expect(create).toHaveBeenCalledWith(expect.not.objectContaining({ role: USER_ROLES.ADMIN }));
    expect(result.user.role).toBe(USER_ROLES.STUDENT);
  });

  it('rejects login when the password is incorrect', async () => {
    const passwordHash = await hashPassword(password);
    vi.spyOn(userRepository, 'findByEmail').mockReturnValue(queryResult({
      ...student,
      password: passwordHash,
    }));

    await expect(authService.login({
      email: student.email,
      password: 'IncorrectPassword123!',
    })).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });
});
