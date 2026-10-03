'use client';

import { useState } from 'react';

export function AdminLoginForm() {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    const password = new FormData(event.currentTarget).get('password');

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result: { success?: boolean; message?: string } = await response.json();
      if (!response.ok || !result.success) {
        setMessage(result.message || 'Admin sign-in failed. Please try again.');
        return;
      }
      window.location.reload();
    } catch {
      setMessage('We could not reach the admin sign-in service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="account-form admin-login-form" onSubmit={submit}>
      <h2>Admin sign in</h2>
      <label>
        Admin password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      <button className="button button-dark" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : 'Sign in'}
      </button>
      {message && <p className="form-feedback" role="alert">{message}</p>}
    </form>
  );
}
