import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/axios';
import { getErrorMessage } from '../../../lib/errors';
import type { Course } from '../types';

export function CourseListPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['courses', search],
    queryFn: async () => (await apiClient.get<{ data: Course[] }>('/courses', { params: { search } })).data.data,
  });

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Nâng tầm kỹ năng của bạn</p>
          <h1>Học điều mới.<br /><span>Mở lối tương lai.</span></h1>
          <p>Khám phá các khóa học thực tiễn, được hướng dẫn bởi những giảng viên giàu kinh nghiệm.</p>
          <a className="button button-primary" href="#courses">Khám phá khóa học <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="art-card"><span>✦</span><strong>Learn<br />something<br />new.</strong><small>KIẾN THỨC · KỸ NĂNG · TƯƠNG LAI</small></div></div>
      </section>
      <section className="page courses-section" id="courses">
        <div className="section-heading">
          <div><p className="eyebrow">Danh mục học tập</p><h2>Khóa học nổi bật</h2></div>
          <label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Tìm khóa học" placeholder="Tìm khóa học, giảng viên..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div>
        {isLoading && <p className="notice">Đang tải danh sách khóa học…</p>}
        {error && <p className="form-error" role="alert">{getErrorMessage(error)}</p>}
        {!isLoading && data?.length === 0 && <p className="notice">Chưa tìm thấy khóa học phù hợp.</p>}
        <div className="course-grid">
          {data?.map((course, index) => (
            <article className="course-card" key={course._id}>
              <div className={`course-cover cover-${index % 4}`}><span>{['01', '02', '03', '04'][index % 4]}</span><span className="cover-mark">✳</span></div>
              <div className="course-card-body">
                <p className="card-meta">{course.instructor} <span>·</span> {course.enrolledCount}/{course.capacity} học viên</p>
                <h3>{course.title}</h3>
                <p className="card-description">{course.description}</p>
                <div className="card-bottom"><strong>{course.fee === 0 ? 'Miễn phí' : `${course.fee.toLocaleString('vi-VN')} đ`}</strong><Link to={`/courses/${course._id}`}>Chi tiết <span aria-hidden="true">↗</span></Link></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
