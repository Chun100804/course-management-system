import { BookOpen, ExternalLink, GraduationCap, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isRoster = location.pathname.includes('/enrollments');

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin/courses" aria-label="CourseHub Admin">
          <span className="admin-brand-mark"><GraduationCap size={21} /></span>
          <span>course<span className="admin-brand-accent">hub</span><small>ADMIN CONSOLE</small></span>
        </Link>

        <div className="admin-sidebar-label">KHÔNG GIAN QUẢN TRỊ</div>
        <nav className="admin-sidebar-nav" aria-label="Điều hướng quản trị">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link${isActive && !isRoster ? ' is-active' : ''}`}>
            <LayoutDashboard size={18} /><span>Tổng quan</span>
          </NavLink>
          <NavLink to="/admin/courses" className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}>
            <BookOpen size={18} /><span>Quản lý khóa học</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <Link className="admin-public-link" to="/"><ExternalLink size={16} /><span>Xem trang học viên</span></Link>
          <div className="admin-account">
            <span className="admin-avatar">{user?.name?.trim().charAt(0).toUpperCase() || 'A'}</span>
            <span className="admin-account-copy"><strong>{user?.name ?? 'Quản trị viên'}</strong><small>Quản trị viên</small></span>
            <button className="admin-logout" type="button" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Quản trị</span><span className="breadcrumb-divider">/</span><strong>{isRoster ? 'Danh sách học viên' : 'Khóa học'}</strong></div>
          <div className="admin-topbar-status"><span className="status-dot" />Hệ thống đang hoạt động</div>
        </header>
        <div className="admin-content"><Outlet /></div>
      </div>
    </div>
  );
}
