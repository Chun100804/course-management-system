import { useMemo, useState, type FormEvent } from 'react';
import { ArrowUpRight, BookOpen, Check, CircleDollarSign, LoaderCircle, Pencil, Plus, Search, Trash2, UsersRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/axios';
import { getErrorMessage } from '../../../lib/errors';
import type { Course } from '../types';

type CourseFormValues = {
  title: string;
  description: string;
  instructor: string;
  fee: string;
  capacity: string;
};

const emptyForm: CourseFormValues = { title: '', description: '', instructor: '', fee: '', capacity: '' };

export function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Course | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CourseFormValues>(emptyForm);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const { data: courses, isLoading, error: loadError } = useQuery({
    queryKey: ['courses', ''],
    queryFn: async () => (await apiClient.get<{ data: Course[] }>('/courses')).data.data,
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...form, fee: Number(form.fee), capacity: Number(form.capacity) };
      return editing
        ? apiClient.put(`/courses/${editing._id}`, payload)
        : apiClient.post('/courses', payload);
    },
    onSuccess: async () => {
      setFeedback(editing ? 'Đã cập nhật khóa học.' : 'Đã tạo khóa học mới.');
      setError('');
      setEditing(null);
      setForm(emptyForm);
      setFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (cause) => setError(getErrorMessage(cause)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/courses/${id}`),
    onSuccess: async () => {
      setFeedback('Đã xóa khóa học.');
      setError('');
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (cause) => setError(getErrorMessage(cause)),
  });

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');
    if (!normalizedSearch) return courses ?? [];
    return (courses ?? []).filter((course) =>
      `${course.title} ${course.instructor}`.toLocaleLowerCase('vi').includes(normalizedSearch),
    );
  }, [courses, search]);

  const courseCount = courses?.length ?? 0;
  const enrolledCount = (courses ?? []).reduce((sum, course) => sum + course.enrolledCount, 0);
  const seatCount = (courses ?? []).reduce((sum, course) => sum + course.capacity, 0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback('');
    setError('');
    save.mutate();
  }

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setFeedback('');
    setFormOpen(true);
  }

  function startEdit(course: Course) {
    setEditing(course);
    setForm({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      fee: String(course.fee),
      capacity: String(course.capacity),
    });
    setError('');
    setFeedback('');
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(false);
    setError('');
  }

  return (
    <main className="admin-page">
      <section className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">TỔNG QUAN ĐÀO TẠO</p>
          <h1>Quản lý khóa học</h1>
          <p className="admin-page-description">Theo dõi danh mục, học phí và tình hình ghi danh của các lớp học.</p>
        </div>
        <button className="button admin-add-button" type="button" onClick={startCreate}>
          <Plus size={18} /> Thêm khóa học
        </button>
      </section>

      <section className="admin-stat-grid" aria-label="Thống kê khóa học">
        <article className="admin-stat-card">
          <span className="admin-stat-icon stat-icon-courses"><BookOpen size={19} /></span>
          <span className="admin-stat-label">Tổng khóa học</span>
          <strong>{courseCount}</strong>
          <small>khóa học trong danh mục</small>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon stat-icon-students"><UsersRound size={19} /></span>
          <span className="admin-stat-label">Học viên đã ghi danh</span>
          <strong>{enrolledCount}</strong>
          <small>trên {seatCount} chỗ hiện có</small>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-icon stat-icon-seats"><CircleDollarSign size={19} /></span>
          <span className="admin-stat-label">Tỷ lệ lấp đầy</span>
          <strong>{seatCount ? `${Math.round((enrolledCount / seatCount) * 100)}%` : '0%'}</strong>
          <small>tổng số chỗ đã đăng ký</small>
        </article>
      </section>

      {feedback && <div className="admin-alert admin-alert-success" role="status"><Check size={17} />{feedback}<button type="button" onClick={() => setFeedback('')} aria-label="Đóng thông báo"><X size={16} /></button></div>}
      {(loadError || remove.isError) && <div className="admin-alert admin-alert-error" role="alert">{getErrorMessage(loadError ?? remove.error)}</div>}

      {formOpen && (
        <form className="admin-form-panel" onSubmit={submit}>
          <div className="admin-form-heading">
            <div>
              <p className="admin-eyebrow">{editing ? 'CHỈNH SỬA THÔNG TIN' : 'THÊM MỚI VÀO DANH MỤC'}</p>
              <h2>{editing ? 'Cập nhật khóa học' : 'Tạo khóa học mới'}</h2>
            </div>
            <button className="admin-icon-button" type="button" onClick={closeForm} aria-label="Đóng biểu mẫu"><X size={19} /></button>
          </div>
          <div className="admin-form-grid">
            <label>Tên khóa học <span>*</span>
              <input autoFocus required minLength={2} placeholder="Ví dụ: Lập trình Web với React" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label>Giảng viên <span>*</span>
              <input required minLength={2} placeholder="Tên giảng viên" value={form.instructor} onChange={(event) => setForm({ ...form, instructor: event.target.value })} />
            </label>
            <label>Học phí (VNĐ) <span>*</span>
              <input type="number" min="0" step="1000" required placeholder="Nhập học phí, ví dụ: 1500000" value={form.fee} onChange={(event) => setForm({ ...form, fee: event.target.value })} />
              <small>Nhập 0 nếu khóa học miễn phí.</small>
            </label>
            <label>Sĩ số tối đa <span>*</span>
              <input type="number" min={editing?.enrolledCount ?? 1} step="1" required placeholder="Ví dụ: 20" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} />
            </label>
            <label className="admin-form-full">Mô tả khóa học <span>*</span>
              <textarea required minLength={2} rows={4} placeholder="Mô tả nội dung và mục tiêu của khóa học..." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
          </div>
          {error && <p className="admin-inline-error" role="alert">{error}</p>}
          <div className="admin-form-footer">
            <span><span className="admin-required-mark">*</span> Trường bắt buộc</span>
            <div>
              <button className="button admin-cancel-button" type="button" onClick={closeForm}>Hủy</button>
              <button className="button admin-add-button" type="submit" disabled={save.isPending}>
                {save.isPending ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}
                {save.isPending ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo khóa học'}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="admin-catalog">
        <div className="admin-catalog-heading">
          <div>
            <p className="admin-eyebrow">DANH MỤC ĐÀO TẠO</p>
            <h2>Danh sách khóa học <span>{courseCount}</span></h2>
          </div>
          <label className="admin-search">
            <Search size={17} />
            <input aria-label="Tìm khóa học" placeholder="Tìm theo tên hoặc giảng viên..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </div>

        {isLoading ? (
          <div className="admin-loading"><LoaderCircle className="spin" size={22} />Đang tải danh sách khóa học…</div>
        ) : filteredCourses.length === 0 ? (
          <div className="admin-empty-state">
            <span><BookOpen size={23} /></span>
            <h3>{search ? 'Không tìm thấy khóa học' : 'Chưa có khóa học nào'}</h3>
            <p>{search ? 'Thử từ khóa khác hoặc xóa nội dung tìm kiếm.' : 'Tạo khóa học đầu tiên để bắt đầu quản lý danh mục.'}</p>
            {!search && <button className="button admin-add-button" type="button" onClick={startCreate}><Plus size={17} />Tạo khóa học</button>}
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-course-table">
              <thead><tr><th>KHÓA HỌC</th><th>HỌC PHÍ</th><th>GHI DANH</th><th className="admin-actions-heading">THAO TÁC</th></tr></thead>
              <tbody>
                {filteredCourses.map((course, index) => {
                  const fillPercent = course.capacity ? Math.min(100, Math.round((course.enrolledCount / course.capacity) * 100)) : 0;
                  return (
                    <tr key={course._id}>
                      <td>
                        <div className="admin-course-cell">
                          <span className={`admin-course-icon course-tone-${index % 4}`}><BookOpen size={19} /></span>
                          <span className="admin-course-copy"><strong>{course.title}</strong><small>Giảng viên: {course.instructor}</small></span>
                        </div>
                      </td>
                      <td><strong className="admin-course-fee">{course.fee === 0 ? 'Miễn phí' : `${course.fee.toLocaleString('vi-VN')} đ`}</strong></td>
                      <td>
                        <div className="admin-enrollment-cell"><span>{course.enrolledCount} <span className="admin-count-divider">/</span> {course.capacity} học viên</span><div className="admin-progress"><span style={{ width: `${fillPercent}%` }} /></div></div>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <Link className="admin-roster-action" to={`/admin/courses/${course._id}/enrollments`}><UsersRound size={15} />Học viên <ArrowUpRight size={14} /></Link>
                          <button className="admin-icon-button" type="button" onClick={() => startEdit(course)} aria-label={`Sửa ${course.title}`} title="Chỉnh sửa"><Pencil size={16} /></button>
                          <button className="admin-icon-button admin-delete-icon" type="button" disabled={remove.isPending} onClick={() => { if (window.confirm(`Xóa khóa học “${course.title}”?`)) { setFeedback(''); setError(''); remove.mutate(course._id); } }} aria-label={`Xóa ${course.title}`} title="Xóa"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="admin-table-footer">Đang hiển thị <strong>{filteredCourses.length}</strong> trong tổng số <strong>{courseCount}</strong> khóa học</div>
          </div>
        )}
      </section>
    </main>
  );
}
