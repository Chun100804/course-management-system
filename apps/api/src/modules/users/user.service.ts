import { Types } from 'mongoose';
import { AppError } from '../../common/errors/AppError.js';
import { userRepository } from './user.repository.js';

export const userService = {
  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid user id', 400);
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },
};