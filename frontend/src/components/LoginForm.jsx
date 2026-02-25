import { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value) return;
    setError(false);
    onLogin(value);
  };

  return (
    <div className="login-overlay">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Cinemango Backup</h2>
        <input
          type="password"
          placeholder="Password"
          value={value}
          autoFocus
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          className={error ? 'input-error' : ''}
        />
        {error && <p className="login-error">Wrong password</p>}
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}
