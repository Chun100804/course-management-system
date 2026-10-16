import { model, models, Schema } from 'mongoose';

export interface Course {
  title: string;
  description: string;
  instructor: string;
  fee: number;
  capacity: number;
  enrolledCount: number;
}

const courseSchema = new Schema<Course>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0 },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'Capacity must be an integer' },
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Enrolled count must be an integer' },
    },
  },
  { timestamps: true, collection: 'courses' },
);

export const CourseModel = models.Course ?? model<Course>('Course', courseSchema);
