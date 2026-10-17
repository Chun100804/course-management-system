import { Link, NavLink, Outlet } from 'react-router-dom';
import { USER_ROLES } from '@cms/shared';
import { useAuth } from '../features/auth/context/AuthContext';

export function PublicLayout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">Course<span>Hub</span></Link>
        <nav>
          <NavLink to="/" end className={({ isActive }) => `site-nav-link${isActive ? ' is-active' : ''}`}>Khóa học</NavLink>
          {user ? (
            <>
              {user.role === USER_ROLES.ADMIN
                ? <NavLink to="/admin" className={({ isActive }) => `site-nav-link${isActive ? ' is-active' : ''}`}>Quản trị</NavLink>
                : <NavLink to="/my-courses" className={({ isActive }) => `site-nav-link${isActive ? ' is-active' : ''}`}>Khóa học của tôi</NavLink>}
              <button className="button button-ghost" onClick={logout}>Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login">Đăng nhập</Link>
              <Link className="button button-primary" to="/register">Tạo tài khoản</Link>
            </>
          )}
        </nav>
      </header>
      <Outlet />
      <footer className="site-footer">CourseHub · Học tập chủ động, phát triển bền vững.</footer>
    </>
  );
}
