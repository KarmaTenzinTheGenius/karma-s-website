import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin-login-form';
import { AdminDashboard } from '@/components/admin-dashboard';
import { getAdminSession } from '@/lib/auth-server';

// Keep the admin page out of public search results.
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

// The session must be checked on each request, not read from a cached page.
export const dynamic = 'force-dynamic';

// Server actions run on the server, so the session cookie is removed securely.
async function signOut() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('karma_admin_session');
  redirect('/admin');
}

export default async function AdminPage() {
  // Only show the dashboard after the server confirms the admin session.
  const session = await getAdminSession();
  if (!session) {
    // Visitors without a session are sent through the admin login form.
    return (
      <section className="admin-page">
        <span className="eyebrow">Restricted area</span>
        <h1>Store administration</h1>
        <AdminLoginForm />
      </section>
    );
  }

  // The dashboard handles the interactive tools after sign-in.
  return <AdminDashboard signOut={signOut} />;
}
