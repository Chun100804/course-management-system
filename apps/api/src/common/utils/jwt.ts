import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { USER_ROLES, type UserRole } from '../constants/roles.js';

export interface AuthTokenPayload {
  id: string;
  role: UserRole;
}

function isUserRole(role: unknown): role is UserRole {
  return Object.values(USER_ROLES).some((validRole) => validRole === role);
}

export function createAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof payload === 'string' ||
    typeof payload.id !== 'string' ||
    !isUserRole(payload.role)
  ) {
    throw new Error('Invalid authentication token');
  }
  return { id: payload.id, role: payload.role };
}