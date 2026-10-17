import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/axios';
import { getErrorMessage } from '../../../lib/errors';
import type { Course } from '../../courses/types';

interface Enrollment {
  _id: string;
  createdAt: string;
  courseId: Course | null;
}

export function MyCoursesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => (await apiClient.get<{ data: Enrollment[] }>('/enrollments/mine')).data.data,
  });
  return (
    <main className="page content-page">
      <p className="eyebrow">KHÔNG GIAN HỌC VIÊN</p><h1>Khóa học của tôi</h1>
      <p className="page-lead">Theo dõi những khóa học bạn đã đăng ký.</p>
      {isLoading && <p className="notice">Đang tải danh sách…</p>}
      {error && <p className="form-error" role="alert">{getErrorMessage(error)}</p>}
      {!isLoading && data?.length === 0 && <div className="empty-state"><div>✳</div><h2>Chưa có khóa học nào</h2><p>Khám phá danh mục và tìm khóa học phù hợp với bạn.</p><Link className="button button-primary" to="/">Tìm khóa học</Link></div>}
      <div className="course-grid">
        {data?.map((enrollment) => enrollment.courseId && (
          <article className="course-card enrolled-card" key={enrollment._id}>
            <div className="course-cover cover-2"><span>ĐÃ GHI DANH</span><span className="cover-mark">✓</span></div>
            <div className="course-card-body"><p className="card-meta">Giảng viên · {enrollment.courseId.instructor}</p><h3>{enrollment.courseId.title}</h3><p className="card-description">{enrollment.courseId.description}</p><div className="card-bottom"><span>Đăng ký ngày {new Date(enrollment.createdAt).toLocaleDateString('vi-VN')}</span><Link to={`/courses/${enrollment.courseId._id}`}>Chi tiết ↗</Link></div></div>
          </article>
        ))}
      </div>
    </main>
  );
}
