import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin-login-form';
import { getAdminSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/currency';

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

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

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

  let orders: Awaited<ReturnType<typeof loadOrders>> = [];
  let productCount = 0;
  let revenue = 0;
  let loadError = '';

  try {
    [orders, productCount] = await Promise.all([
      loadOrders(),
      prisma.product.count({ where: { isActive: true } }),
    ]);
    revenue = orders
      .filter((order) => order.status !== 'CANCELLED' && order.status !== 'REFUNDED')
      .reduce((sum, order) => sum + Number(order.total), 0);
  } catch (error) {
    console.error('Admin dashboard failed to load.', error);
    loadError = 'The database could not be reached. Check DATABASE_URL and try again.';
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div><span className="eyebrow">Restricted area</span><h1>Store administration</h1></div>
        <form action={signOut}><button className="button button-outline" type="submit">Sign out</button></form>
      </div>

      {loadError ? (
        <p className="admin-warning">{loadError}</p>
      ) : (
        <>
          <div className="admin-summary">
            <article><span>Active products</span><strong>{productCount}</strong></article>
            <article><span>Orders</span><strong>{orders.length}</strong></article>
            <article><span>Order value</span><strong>{formatMoney(revenue)}</strong></article>
          </div>
          <div className="admin-section-heading"><h2>Recent orders</h2><span>Latest 100</span></div>
          {orders.length === 0 ? (
            <p className="admin-empty">No orders yet. Orders placed at checkout will appear here.</p>
          ) : (
            <div className="admin-order-list">
              {orders.map((order) => (
                <article className="admin-order" key={order.orderNumber}>
                  <div><strong>{order.orderNumber}</strong><span>{new Date(order.createdAt).toLocaleString()}</span></div>
                  <div><strong>{order.email}</strong><span>{order._count.items} item type(s)</span></div>
                  <div><strong>{formatMoney(Number(order.total))}</strong><span>{STATUS_LABELS[order.status] ?? order.status} · {order.paymentMethod === 'cod' ? 'COD' : 'mBoB'}</span></div>
                </article>
              ))}
            </div>
          )}
          <p className="admin-warning">Orders are stored in PostgreSQL. To confirm an mBoB order, check the transfer and update the order status directly in the database until a payment reconciliation screen is added.</p>
        </>
      )}
    </section>
  );
}

function loadOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { _count: { select: { items: true } } },
  });
}
