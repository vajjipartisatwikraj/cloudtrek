import { useState } from 'react';
import { api, setToken } from './api';

/**
 * Login and signup form. The mode controls both the API endpoint and the
 * labels, while successful authentication stores the returned JWT and informs
 * the root component that the notes view can be rendered.
 */
export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  /** Submit credentials and translate API failures into visible form errors. */
  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: { email, password } });
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Log in' : 'Sign up'}</h2>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <p role="alert" className="error">{error}</p>}

      <button type="submit">{mode === 'login' ? 'Log in' : 'Create account'}</button>

      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
      </button>
    </form>
  );
}
