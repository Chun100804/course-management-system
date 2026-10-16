import { model, models, Schema } from 'mongoose';
import { USER_ROLES, type UserRole } from '../../common/constants/roles.js';

export interface User {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.STUDENT,
      required: true,
    },
  },
  { timestamps: true, collection: 'users' },
);

export const UserModel = models.User ?? model<User>('User', userSchema);
