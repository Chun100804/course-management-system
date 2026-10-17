import { connectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { USER_ROLES } from '../common/constants/roles.js';
import { hashPassword } from '../common/utils/password.js';
import { UserModel } from '../modules/users/user.model.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password || password.length < 12) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) before running the seed script.');
}

await connectDatabase(env.MONGODB_URI);
try {
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    if (existingUser.role !== USER_ROLES.ADMIN) {
      throw new Error('The configured admin email already belongs to a non-admin account.');
    }
    console.info('Admin account already exists; no changes made.');
  } else {
    await UserModel.create({
      name: process.env.ADMIN_NAME?.trim() || 'Course Admin',
      email,
      password: await hashPassword(password),
      role: USER_ROLES.ADMIN,
    });
    console.info('Admin account created.');
  }
} finally {
  await UserModel.db.close();
}