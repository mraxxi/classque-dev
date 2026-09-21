export async function fetchJwks(teamDomain: string): Promise<JsonWebKey[]> {
  const url = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch JWKS');
  }
  const data = await response.json() as { keys: JsonWebKey[] };
  return data.keys;
}

let jwksCache: JsonWebKey[] | null = null;
let lastFetch = 0;

export async function getJwks(teamDomain: string): Promise<JsonWebKey[]> {
  const now = Date.now();
  // Cache for 1 hour
  if (jwksCache && (now - lastFetch) < 3600000) {
    return jwksCache;
  }
  
  jwksCache = await fetchJwks(teamDomain);
  lastFetch = now;
  return jwksCache;
}

export async function verifyAccessJwt(token: string, teamDomain: string, audience: string): Promise<string> {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid token format');
  }

  // Base64Url decode payload to check expiry, aud, email
  const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadStr);

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }
  if (!payload.aud || !payload.aud.includes(audience)) {
    throw new Error('Invalid audience');
  }
  
  // Signature verification (using WebCrypto)
  // Extract kid from header
  const headerStr = atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'));
  const header = JSON.parse(headerStr);
  
  const jwks = await getJwks(teamDomain);
  const jwk = jwks.find(k => (k as { kid?: string }).kid === header.kid);
  if (!jwk) {
    throw new Error('Key not found');
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  // Decode base64url signature
  const sigBytes = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    sigBytes,
    data
  );

  if (!valid) {
    throw new Error('Invalid signature');
  }

  if (!payload.email) {
    throw new Error('No email claim in token');
  }
  
  return payload.email as string;
}
