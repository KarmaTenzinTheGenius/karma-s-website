'use client';

import { useState } from 'react';
import Link from 'next/link';

const accountModes = ['Sign in', 'Create account', 'Forgot password', 'OTP login'];

export function AccountPanel() {
  const [mode, setMode] = useState(accountModes[0]);
  const [message, setMessage] = useState('');
  return <div className="account-panel"><div className="tab-list account-tabs" role="tablist">{accountModes.map((item) => <button type="button" role="tab" aria-selected={mode === item} className={mode === item ? 'active' : ''} key={item} onClick={() => { setMode(item); setMessage(''); }}>{item}</button>)}</div><form className="account-form" onSubmit={(event) => { event.preventDefault(); setMessage('Account services are in preview. Authentication requires a configured identity provider before customer accounts can be enabled.'); }}><h2>{mode}</h2>{mode === 'Create account' && <label>Full name<input required autoComplete="name" /></label>}<label>Email address<input type="email" required autoComplete="email" /></label>{mode === 'Sign in' || mode === 'Create account' ? <label>Password<input type="password" required minLength={8} autoComplete={mode === 'Sign in' ? 'current-password' : 'new-password'} /></label> : mode === 'OTP login' ? <label>Mobile number<input type="tel" required autoComplete="tel" /></label> : null}<button className="button button-dark" type="submit">{mode === 'Forgot password' ? 'Send reset link' : mode === 'OTP login' ? 'Send OTP' : mode}</button>{message && <p className="form-feedback" aria-live="polite">{message}</p>}</form><div className="account-quick-links"><Link href="/track-order">Track an order</Link><Link href="/wishlist">View wishlist</Link></div></div>;
}