'use client';

import { useState } from 'react';

export function TrackOrderForm() {
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  async function track(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Looking up this order…');
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId.trim())}`);
    const result = await response.json();
    setMessage(result.success ? `Placed ${new Date(result.data.timestamp).toLocaleDateString()}. This demo order is stored temporarily.` : result.message);
    setStatus(result.success ? result.data.status : '');
  }
  return <><form className="track-form" onSubmit={track}><label htmlFor="track-order-id">Order ID</label><div><input id="track-order-id" required value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="e.g. KLT-1234ABCD" /><button className="button button-dark" type="submit">Track order</button></div></form>{message && <p className="track-message" aria-live="polite">{message}</p>}{status && <ol className="order-timeline"><li className="done">Order received</li><li className={status === 'shipped' || status === 'delivered' ? 'done' : ''}>Shipped</li><li className={status === 'delivered' ? 'done' : ''}>Out for delivery</li><li className={status === 'delivered' ? 'done' : ''}>Delivered</li></ol>}</>;
}