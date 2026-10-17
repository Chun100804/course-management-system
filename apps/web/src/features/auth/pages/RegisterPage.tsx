import { useState, type FormEvent } from 'react';
import { USER_ROLES } from '@cms/shared';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../../../lib/errors';

export function RegisterPage() {
  const { user, signUp } = useAuth();
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
      await signUp(String(values.get('name')), String(values.get('email')), String(values.get('password')));
      navigate('/', { replace: true });
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="form-card" onSubmit={submit}>
        <p className="eyebrow">Bắt đầu hành trình học tập</p>
        <h1>Tạo tài khoản</h1>
        <label>Họ và tên<input name="name" autoComplete="name" minLength={2} required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Mật khẩu<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-wide" disabled={busy}>{busy ? 'Đang tạo tài khoản…' : 'Đăng ký'}</button>
        <p className="form-note">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </form>
    </main>
  );
}
