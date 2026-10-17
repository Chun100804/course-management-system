import { UserModel } from './user.model.js';

export const userRepository = {
  findByEmail(email: string, includePassword = false) {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    return includePassword ? query.select('+password') : query;
  },

  create(input: { name: string; email: string; password: string }) {
    return UserModel.create(input);
  },

  findById(id: string) {
    return UserModel.findById(id).select('-password');
  },
};