import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '../constants/roles.js';
import { AppError } from '../errors/AppError.js';
import { authorize } from './authorize.js';

function createNext() {
  const calls: unknown[] = [];
  const next: NextFunction = (error?: unknown) => {
    calls.push(error);
  };
  return { next, calls };
}

describe('authorize middleware', () => {
  it('allows a user with the ADMIN role', () => {
    const { next, calls } = createNext();
    const handler = authorize(USER_ROLES.ADMIN);

    handler(
      { user: { id: 'admin-id', role: USER_ROLES.ADMIN } } as Request,
      {} as Response,
      next,
    );

    expect(calls).toEqual([undefined]);
  });

  it('rejects a STUDENT where ADMIN is required', () => {
    const { next, calls } = createNext();
    const handler = authorize(USER_ROLES.ADMIN);

    handler(
      { user: { id: 'student-id', role: USER_ROLES.STUDENT } } as Request,
      {} as Response,
      next,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]).toBeInstanceOf(AppError);
    expect(calls[0]).toMatchObject({ statusCode: 403 });
  });
});
