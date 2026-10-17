import { createBrowserRouter } from 'react-router-dom';
import { USER_ROLES } from '@cms/shared';
import { RequireRole } from './RequireRole';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { CourseListPage } from '../features/courses/pages/CourseListPage';
import { CourseDetailPage } from '../features/courses/pages/CourseDetailPage';
import { MyCoursesPage } from '../features/enrollments/pages/MyCoursesPage';
import { AdminCoursesPage } from '../features/courses/pages/AdminCoursesPage';
import { AdminEnrollmentsPage } from '../features/enrollments/pages/AdminEnrollmentsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <CourseListPage /> },
      { path: 'courses/:id', element: <CourseDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        element: <RequireRole allowedRoles={[USER_ROLES.STUDENT]} />,
        children: [{ path: 'my-courses', element: <MyCoursesPage /> }],
      },
      { path: 'forbidden', element: <main className="page content-page"><h1>Không có quyền truy cập</h1><p className="page-lead">Tài khoản của bạn không được phép xem trang này.</p></main> },
    ],
  },
  {
    path: 'admin',
    element: <RequireRole allowedRoles={[USER_ROLES.ADMIN]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminCoursesPage /> },
          { path: 'courses', element: <AdminCoursesPage /> },
          { path: 'courses/:courseId/enrollments', element: <AdminEnrollmentsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <main className="page"><h1>Không tìm thấy trang</h1><a href="/">Về trang chủ</a></main> },
]);
