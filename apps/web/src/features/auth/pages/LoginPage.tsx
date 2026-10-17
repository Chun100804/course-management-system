import { useState, type FormEvent } from 'react';
import { USER_ROLES } from '@cms/shared';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../../../lib/errors';

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === USER_ROLES.ADMIN ? '/admin' : '/'} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = new FormData(event.currentTarget);
    try {
      const loggedUser = await signIn(String(values.get('email')), String(values.get('password')));
      navigate(loggedUser.role === USER_ROLES.ADMIN ? '/admin' : '/', { replace: true });
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="form-card" onSubmit={submit}>
        <p className="eyebrow">Chào mừng trở lại</p>
        <h1>Đăng nhập</h1>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-wide" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        <p className="form-note">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
      </form>
    </main>
  );
}
