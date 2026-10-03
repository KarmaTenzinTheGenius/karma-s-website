'use client';

import { useState } from 'react';

export function ContactForm() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) }).catch(() => null);
    const result = response ? await response.json().catch(() => null) : null;
    setMessage(result?.message || 'The message could not be submitted. Please try again.');
    if (response?.ok) formElement.reset();
    setBusy(false);
  }
  return <form className="contact-form" onSubmit={submit}><label>Your name<input name="name" required maxLength={80} autoComplete="name" /></label><label>Email address<input name="email" required type="email" autoComplete="email" /></label><label>Order number (optional)<input name="orderId" /></label><label>How can we help?<textarea name="message" required minLength={10} maxLength={2000} rows={5} /></label><button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>{message && <p className="form-feedback" aria-live="polite">{message}</p>}</form>;
}