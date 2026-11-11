import {
  handlePreflight,
  sendJson,
  getConfig,
  extractAdminKey,
  verifyAdminKey,
  isServerReadyForAppUpload,
  dbSelect
} from './_lib/store.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  const cfg = getConfig();
  const hasAdminHeader = Boolean(extractAdminKey(req));
  const authValid = hasAdminHeader ? verifyAdminKey(req) : null;

  let dbConnected = false;
  let dbError = null;
  if (cfg.supabaseUrl && cfg.supabaseKey) {
    try {
      await dbSelect('portal_folders', 'select=id&limit=1');
      dbConnected = true;
    } catch (err) {
      dbError = err.message;
    }
  }

  return sendJson(res, 200, {
    ok: true,
    service: 'hizli-rapor-portal',
    mode: 'supabase',
    configured: Boolean(cfg.supabaseUrl && cfg.supabaseKey && cfg.adminKey),
    appUploadReady: isServerReadyForAppUpload(),
    dbConnected,
    dbError,
    authValid,
    timestamp: new Date().toISOString()
  });
}
