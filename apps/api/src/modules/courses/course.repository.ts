import { CourseModel } from './course.model.js';

export const courseRepository = {
  list(search?: string) {
    const filter = search
      ? { $or: [{ title: new RegExp(escapeRegex(search), 'i') }, { instructor: new RegExp(escapeRegex(search), 'i') }] }
      : {};
    return CourseModel.find(filter).sort({ createdAt: -1 }).lean();
  },

  findById(id: string) {
    return CourseModel.findById(id);
  },

  create(input: { title: string; description: string; instructor: string; fee: number; capacity: number }) {
    return CourseModel.create(input);
  },

  update(id: string, input: Partial<{ title: string; description: string; instructor: string; fee: number; capacity: number }>) {
    const filter = input.capacity === undefined
      ? { _id: id }
      : { _id: id, $expr: { $lte: ['$enrolledCount', input.capacity] } };
    return CourseModel.findOneAndUpdate(filter, input, { new: true, runValidators: true });
  },

  delete(id: string) {
    return CourseModel.findOneAndDelete({ _id: id, enrolledCount: 0 });
  },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}