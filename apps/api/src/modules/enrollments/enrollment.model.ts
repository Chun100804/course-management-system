import mongoose, { Types } from 'mongoose';

const { Schema } = mongoose;

export interface Enrollment {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
}

const enrollmentSchema = new Schema<Enrollment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'enrollments',
  },
);

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ courseId: 1 });

export const EnrollmentModel =
  mongoose.models.Enrollment ?? mongoose.model<Enrollment>('Enrollment', enrollmentSchema);
