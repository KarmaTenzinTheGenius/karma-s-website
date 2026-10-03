export const CUSTOMER_SESSION_COOKIE = 'karma_session';
export const ADMIN_SESSION_COOKIE = 'karma_admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type CustomerSession = {
  kind: 'customer';
  userId: string;
  exp: number;
};

export type AdminSession = {
  kind: 'admin';
  exp: number;
};

export type AuthSession = CustomerSession | AdminSession;

function encodeBase64Url(value: string | Uint8Array) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getSigningKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createSessionToken(session: AuthSession) {
  const payload = encodeBase64Url(JSON.stringify(session));
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<AuthSession | null> {
  if (!token) return null;
  const [payload, signature, ...extra] = token.split('.');
  if (!payload || !signature || extra.length > 0) return null;

  try {
    const key = await getSigningKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;

    const session = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as AuthSession;
    if (typeof session.exp !== 'number' || session.exp <= Math.floor(Date.now() / 1000)) return null;
    if (session.kind === 'customer' && typeof session.userId === 'string' && session.userId.length > 0) return session;
    if (session.kind === 'admin') return session;
  } catch {
    return null;
  }
  return null;
}
