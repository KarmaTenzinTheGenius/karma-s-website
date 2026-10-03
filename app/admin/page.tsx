import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin-login-form';
import { getAdminSession } from '@/lib/auth-server';
import { demoOrders } from '@/lib/demo-orders';
import { products } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

async function signOut() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('karma_admin_session');
  redirect('/admin');
}

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    return (
      <section className="admin-page">
        <span className="eyebrow">Restricted area</span>
        <h1>Store administration</h1>
        <AdminLoginForm />
      </section>
    );
  }

  const orders = [...demoOrders.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div><span className="eyebrow">Restricted area</span><h1>Store administration</h1></div>
        <form action={signOut}><button className="button button-outline" type="submit">Sign out</button></form>
      </div>
      <div className="admin-summary">
        <article><span>Catalog products</span><strong>{products.length}</strong></article>
        <article><span>Demo orders in this instance</span><strong>{orders.length}</strong></article>
      </div>
      <div className="admin-section-heading"><h2>Recent demo orders</h2><span>Temporary preview data</span></div>
      {orders.length === 0 ? (
        <p className="admin-empty">No demo orders have been placed in this running instance.</p>
      ) : (
        <div className="admin-order-list">
          {orders.map((order) => (
            <article className="admin-order" key={order.orderId}>
              <div><strong>{order.orderId}</strong><span>{new Date(order.timestamp).toLocaleString()}</span></div>
              <div><strong>{order.customer.name || order.customer.email || 'Customer'}</strong><span>{order.items.length} item type(s)</span></div>
              <div><strong>${order.total.toFixed(2)}</strong><span>{order.status}</span></div>
            </article>
          ))}
        </div>
      )}
      <p className="admin-warning">Orders are stored in temporary memory and may disappear when the app restarts. This dashboard does not change products or fulfil orders.</p>
    </section>
  );
}
