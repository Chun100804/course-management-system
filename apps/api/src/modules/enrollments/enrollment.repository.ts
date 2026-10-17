import { EnrollmentModel } from './enrollment.model.js';

export const enrollmentRepository = {
  findDuplicate(studentId: string, courseId: string) {
    return EnrollmentModel.exists({ studentId, courseId });
  },

  create(studentId: string, courseId: string) {
    return EnrollmentModel.create({ studentId, courseId });
  },

  listForStudent(studentId: string) {
    return EnrollmentModel.find({ studentId }).populate('courseId').sort({ createdAt: -1 }).lean();
  },

  listForCourse(courseId: string) {
    return EnrollmentModel.find({ courseId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  },
};