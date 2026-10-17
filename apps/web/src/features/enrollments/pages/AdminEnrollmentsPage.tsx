import { BookOpen, LoaderCircle, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/axios';
import { getErrorMessage } from '../../../lib/errors';

interface Student { name: string; email: string }
interface Course { _id: string; title: string; enrolledCount: number; capacity: number }
interface Enrollment { _id: string; createdAt: string; studentId: Student | null }

export function AdminEnrollmentsPage() {
  const { courseId = '' } = useParams();
  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => (await apiClient.get<{ data: Course }>(`/courses/${courseId}`)).data.data,
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ['course-enrollments', courseId],
    queryFn: async () => (await apiClient.get<{ data: Enrollment[] }>(`/enrollments/course/${courseId}`)).data.data,
  });

  return (
    <main className="admin-page">
      <div className="admin-roster-back"><Link to="/admin/courses">← Quay lại danh sách khóa học</Link></div>
      <section className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">QUẢN LÝ LỚP HỌC</p>
          <h1>{course?.title ?? 'Danh sách học viên'}</h1>
          <p className="admin-page-description">Theo dõi những học viên đã ghi danh vào khóa học này.</p>
        </div>
        <div className="admin-roster-total"><UsersRound size={18} /><strong>{course?.enrolledCount ?? data?.length ?? 0}</strong><span>/ {course?.capacity ?? '—'} học viên</span></div>
      </section>

      {error && <div className="admin-alert admin-alert-error" role="alert">{getErrorMessage(error)}</div>}
      {isLoading ? (
        <div className="admin-loading"><LoaderCircle className="spin" size={22} />Đang tải danh sách học viên…</div>
      ) : data?.length ? (
        <section className="admin-catalog admin-roster-table">
          <div className="admin-catalog-heading">
            <div><p className="admin-eyebrow">DANH SÁCH LỚP</p><h2>Học viên đã ghi danh <span>{data.length}</span></h2></div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-course-table">
              <thead><tr><th>HỌC VIÊN</th><th>EMAIL</th><th>NGÀY GHI DANH</th></tr></thead>
              <tbody>{data.map((enrollment) => (
                <tr key={enrollment._id}>
                  <td><div className="admin-student-cell"><span className="admin-student-avatar">{enrollment.studentId?.name.trim().charAt(0).toUpperCase() || '?'}</span><strong>{enrollment.studentId?.name ?? 'Tài khoản không còn tồn tại'}</strong></div></td>
                  <td className="admin-student-email">{enrollment.studentId?.email ?? '—'}</td>
                  <td>{new Date(enrollment.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}</tbody>
            </table>
            <div className="admin-table-footer">Tổng cộng <strong>{data.length}</strong> học viên</div>
          </div>
        </section>
      ) : (
        <div className="admin-empty-state admin-roster-empty">
          <span><BookOpen size={23} /></span>
          <h3>Chưa có học viên ghi danh</h3>
          <p>Danh sách học viên sẽ xuất hiện tại đây sau khi có người đăng ký khóa học.</p>
        </div>
      )}
    </main>
  );
}
