import { AppError } from '../../common/errors/AppError.js';
import { createAuthToken } from '../../common/utils/jwt.js';
import { comparePassword, hashPassword } from '../../common/utils/password.js';
import { userRepository } from '../users/user.repository.js';

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    const email = input.email.toLowerCase();
    if (await userRepository.findByEmail(email)) {
      throw new AppError('An account with this email already exists', 409);
    }

    const user = await userRepository.create({
      name: input.name,
      email,
      password: await hashPassword(input.password),
    });
    const token = createAuthToken({ id: user.id, role: user.role });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },

  async login(input: { email: string; password: string }) {
    const user = await userRepository.findByEmail(input.email, true);
    if (!user || !(await comparePassword(input.password, user.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    return {
      token: createAuthToken({ id: user.id, role: user.role }),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },
};