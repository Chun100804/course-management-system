import { useState } from 'react';
import { USER_ROLES } from '@cms/shared';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/axios';
import { getErrorMessage } from '../../../lib/errors';
import { useAuth } from '../../auth/context/AuthContext';
import type { Course } from '../types';

export function CourseDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => (await apiClient.get<{ data: Course }>(`/courses/${id}`)).data.data,
  });
  const enroll = useMutation({
    mutationFn: () => apiClient.post('/enrollments', { courseId: id }),
    onSuccess: async () => {
      setMessage('Đăng ký khóa học thành công!');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['course', id] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['my-enrollments'] }),
      ]);
    },
    onError: (cause) => setMessage(getErrorMessage(cause)),
  });
  if (isLoading) return <main className="page notice">Đang tải khóa học…</main>;
  if (error || !course) return <main className="page"><p className="form-error">{error ? getErrorMessage(error) : 'Không tìm thấy khóa học.'}</p><Link to="/">Quay lại</Link></main>;

  return (
    <main className="page detail-page">
      <Link to="/" className="back-link">← Tất cả khóa học</Link>
      <div className="detail-layout">
        <section>
          <p className="eyebrow">CHI TIẾT KHÓA HỌC</p>
          <h1>{course.title}</h1>
          <p className="detail-instructor">Giảng viên <strong>{course.instructor}</strong></p>
          <div className="detail-description">{course.description}</div>
          <div className="detail-facts"><div><span>Học phí</span><strong>{course.fee === 0 ? 'Miễn phí' : `${course.fee.toLocaleString('vi-VN')} đ`}</strong></div><div><span>Sĩ số</span><strong>{course.enrolledCount} / {course.capacity}</strong></div></div>
        </section>
        <aside className="enroll-panel">
          <div className="panel-icon">✳</div><h2>Sẵn sàng bắt đầu?</h2>
          <p>Đăng ký ngay để giữ chỗ và tham gia khóa học.</p>
          {message && <p className={enroll.isError ? 'form-error' : 'success-message'} role="status">{message}</p>}
          {user?.role === 'STUDENT' ? (
            <button className="button button-primary button-wide" disabled={enroll.isPending || course.enrolledCount >= course.capacity} onClick={() => enroll.mutate()}>
              {enroll.isPending ? 'Đang đăng ký…' : course.enrolledCount >= course.capacity ? 'Đã đủ sĩ số' : 'Đăng ký khóa học'}
            </button>
          ) : user?.role === USER_ROLES.ADMIN ? <p className="notice">Tài khoản quản trị không thể ghi danh.</p>
            : <button className="button button-primary button-wide" onClick={() => navigate('/login')}>Đăng nhập để ghi danh</button>}
        </aside>
      </div>
    </main>
  );
}
