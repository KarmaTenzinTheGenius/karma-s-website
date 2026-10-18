import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin-login-form';
import { AdminDashboard } from '@/components/admin-dashboard';
import { getAdminSession } from '@/lib/auth-server';

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

  return <AdminDashboard signOut={signOut} />;
}
