import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  type AdminSession,
  type CustomerSession,
  verifySessionToken,
} from '@/lib/session-token';

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const value = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(value);
  return session?.kind === 'customer' ? session : null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const value = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(value);
  return session?.kind === 'admin' ? session : null;
}
