import crypto from 'node:crypto';

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key, X-Folder-Token, X-Folder-Write-Token, X-App-Client');
  res.setHeader('Cache-Control', 'no-store');
}

export function handlePreflight(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

export function sendJson(res, statusCode, payload) {
  setCors(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export async function readJsonBody(req, maxBytes = 1024 * 1024) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      throw new Error('İstek boyutu sınırı aşıldı');
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

export function getOrigin(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'localhost:8090').split(',')[0].trim();
  return `${proto}://${host}`;
}

function sha256Buf(str) {
  return crypto.createHash('sha256').update(String(str || ''), 'utf8').digest();
}

export function getConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const adminKey = (process.env.PORTAL_ADMIN_KEY || '').trim();
  const tokenSecret = (process.env.PORTAL_TOKEN_SECRET || '').trim() || (adminKey ? `hrp:${adminKey}` : '');
  return { supabaseUrl, supabaseKey, adminKey, tokenSecret };
}

export function extractAdminKey(req) {
  const xKey = req.headers['x-admin-key'];
  if (typeof xKey === 'string' && xKey.trim()) return xKey.trim();
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
}

export function verifyAdminKey(req) {
  const { adminKey } = getConfig();
  if (!adminKey) return false;
  const provided = extractAdminKey(req);
  if (!provided) return false;
  return crypto.timingSafeEqual(sha256Buf(provided), sha256Buf(adminKey));
}

export function randomSlug(len = 8) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export function sanitizeCompanySlug(raw) {
  const trMap = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i',
    'İ': 'i', 'i': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u'
  };
  const replaced = String(raw || '').trim().replace(/[çÇğĞıIİiöÖşŞüÜ]/g, ch => trMap[ch] || ch);
  return replaced
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18)
    .replace(/-+$/g, '');
}

export function prefixedRandomSlug(companySlug, len = 8) {
  const prefix = sanitizeCompanySlug(companySlug);
  const rand = randomSlug(len);
  return prefix ? `${prefix}-${rand}` : rand;
}

export function signFolderWriteToken(folderId) {
  const { tokenSecret } = getConfig();
  if (!tokenSecret || !folderId) return '';
  return crypto.createHmac('sha256', tokenSecret).update(`write:${folderId}`).digest('base64url');
}

export function verifyFolderWriteToken(token, folderId) {
  const { tokenSecret } = getConfig();
  if (!tokenSecret || !folderId || !token || typeof token !== 'string') return false;
  const expected = signFolderWriteToken(folderId);
  const a = Buffer.from(token.trim(), 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function extractFolderWriteToken(req, body) {
  const hdr = req.headers['x-folder-write-token'];
  if (typeof hdr === 'string' && hdr.trim()) return hdr.trim();
  if (body && typeof body.write_token === 'string' && body.write_token.trim()) {
    return body.write_token.trim();
  }
  return '';
}

export function isServerReadyForAppUpload() {
  const { supabaseUrl, supabaseKey, tokenSecret } = getConfig();
  return Boolean(supabaseUrl && supabaseKey && tokenSecret);
}

export function randomVerifyCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export function hashPin(pin) {
  const clean = String(pin || '').trim();
  if (!clean) return null;
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPin(pin, storedHash) {
  if (!storedHash || !pin) return false;
  const parts = String(storedHash).split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const derived = crypto.scryptSync(String(pin).trim(), salt, 32);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function signFolderToken(folderId, slug) {
  const { tokenSecret } = getConfig();
  if (!tokenSecret) throw new Error('Sunucu token anahtarı yapılandırılmamış');
  const payloadObj = {
    f: String(folderId),
    s: String(slug),
    exp: Date.now() + 12 * 60 * 60 * 1000
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto.createHmac('sha256', tokenSecret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyFolderToken(token, expectedSlug) {
  const { tokenSecret } = getConfig();
  if (!tokenSecret || !token || typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const payloadB64 = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = crypto.createHmac('sha256', tokenSecret).update(payloadB64).digest('base64url');
  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed || !parsed.exp || parsed.exp < Date.now()) return null;
    if (expectedSlug && parsed.s !== expectedSlug) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function extractFolderToken(req, urlObj) {
  const headerToken = req.headers['x-folder-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) return headerToken.trim();
  if (urlObj && urlObj.searchParams.get('token')) {
    return urlObj.searchParams.get('token').trim();
  }
  return '';
}

export function sanitizeReportHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<(object|embed|applet|base)\b[^>]*>/gi, '')
    .replace(/<\/(object|embed|applet|base)>/gi, '')
    .replace(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1=$2#$2');
}

function buildSupabaseAuthHeaders(supabaseKey, extra = {}) {
  const headers = {
    apikey: supabaseKey,
    ...extra
  };
  // New opaque Supabase secret keys (sb_secret_...) should NOT be sent as JWT Bearer headers.
  if (!supabaseKey.startsWith('sb_')) {
    headers.Authorization = `Bearer ${supabaseKey}`;
  }
  return headers;
}

function getSupabaseHeaders(extra = {}) {
  const { supabaseUrl, supabaseKey } = getConfig();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlanmamış');
  }
  return {
    url: supabaseUrl,
    headers: buildSupabaseAuthHeaders(supabaseKey, {
      'Content-Type': 'application/json',
      ...extra
    })
  };
}

export async function dbSelect(table, queryString = '') {
  const { url, headers } = getSupabaseHeaders();
  const res = await fetch(`${url}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase select ${table} (${res.status}): ${txt}`);
  }
  return res.json();
}

export async function dbInsert(table, row) {
  const { url, headers } = getSupabaseHeaders({ Prefer: 'return=representation' });
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase insert ${table} (${res.status}): ${txt}`);
  }
  const rows = await res.json();
  return rows[0] || null;
}

export async function dbUpdate(table, queryString, patch) {
  const { url, headers } = getSupabaseHeaders({ Prefer: 'return=representation' });
  const res = await fetch(`${url}/rest/v1/${table}?${queryString}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patch)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase update ${table} (${res.status}): ${txt}`);
  }
  const rows = await res.json();
  return rows;
}

export async function dbDelete(table, queryString) {
  const { url, headers } = getSupabaseHeaders({ Prefer: 'return=representation' });
  const res = await fetch(`${url}/rest/v1/${table}?${queryString}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase delete ${table} (${res.status}): ${txt}`);
  }
  return res.json();
}

export async function createSignedUploadUrl(storagePath) {
  const { url, headers } = getSupabaseHeaders({ 'x-upsert': 'true' });
  const cleanPath = storagePath.replace(/^\/+/, '');
  const res = await fetch(`${url}/storage/v1/object/upload/sign/reports/${cleanPath}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Storage sign upload (${res.status}): ${txt}`);
  }
  const data = await res.json();
  const rel = data.url || '';
  if (rel.startsWith('http://') || rel.startsWith('https://')) return rel;
  if (rel.startsWith('/storage/v1')) return `${url}${rel}`;
  return `${url}/storage/v1${rel.startsWith('/') ? '' : '/'}${rel}`;
}

export async function downloadStorageObject(storagePath) {
  const { supabaseUrl, supabaseKey } = getConfig();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlanmamış');
  }
  const cleanPath = storagePath.replace(/^\/+/, '');
  const res = await fetch(`${supabaseUrl}/storage/v1/object/reports/${cleanPath}`, {
    method: 'GET',
    headers: buildSupabaseAuthHeaders(supabaseKey)
  });
  return res;
}

export async function deleteStorageObjects(paths) {
  const list = (paths || []).filter(Boolean).map(p => p.replace(/^\/+/, ''));
  if (!list.length) return;
  const { url, headers } = getSupabaseHeaders();
  await fetch(`${url}/storage/v1/object/reports`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ prefixes: list })
  }).catch(() => {});
}
