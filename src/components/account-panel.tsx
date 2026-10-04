'use client';

import { useState } from 'react';
import Link from 'next/link';

export function AccountPanel() {
  const [mode, setMode] = useState<'Sign in' | 'Create account'>('Sign in');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(mode === 'Create account' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });
      const result: { success?: boolean; message?: string } = await response.json();
      if (!response.ok || !result.success) {
        setMessage(result.message || 'We could not sign you in. Please try again.');
        return;
      }

      const requestedPath = new URLSearchParams(window.location.search).get('next');
      const requestedUrl = requestedPath ? new URL(requestedPath, window.location.origin) : null;
      const destination = requestedUrl?.origin === window.location.origin
        ? `${requestedUrl.pathname}${requestedUrl.search}${requestedUrl.hash}`
        : '/';
      window.location.assign(destination);
    } catch {
      setMessage('We could not reach the sign-in service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="account-panel">
      <div className="tab-list account-tabs" role="tablist" aria-label="Account access">
        {(['Sign in', 'Create account'] as const).map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={mode === item}
            className={mode === item ? 'active' : ''}
            key={item}
            onClick={() => { setMode(item); setMessage(''); }}
          >
            {item}
          </button>
        ))}
      </div>
      <form className="account-form" onSubmit={submit}>
        <h2>{mode}</h2>
        {mode === 'Create account' && <label>Full name<input name="name" required autoComplete="name" maxLength={100} /></label>}
        <label>Email address<input name="email" type="email" required autoComplete="email" maxLength={254} /></label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={mode === 'Create account' ? 10 : 1}
            maxLength={256}
            autoComplete={mode === 'Sign in' ? 'current-password' : 'new-password'}
          />
        </label>
        {mode === 'Create account' && <p className="account-hint">Use at least 10 characters for your password.</p>}
        <button className="button button-dark" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait…' : mode}
        </button>
        {message && <p className="form-feedback form-feedback-error" role="alert">{message}</p>}
      </form>
      <div className="account-quick-links"><Link href="/admin">Admin sign in</Link></div>
    </div>
  );
}