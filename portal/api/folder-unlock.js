import {
  handlePreflight,
  sendJson,
  readJsonBody,
  dbSelect,
  verifyPin,
  signFolderToken
} from './_lib/store.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Yalnızca POST desteklenir' });
  }

  try {
    const body = await readJsonBody(req, 16 * 1024);
    const slug = String(body.slug || '').trim();
    const pin = String(body.pin || '').trim();

    if (!slug || !pin) {
      return sendJson(res, 400, { ok: false, error: 'Klasör kodu ve erişim şifresi gerekli' });
    }

    const folders = await dbSelect(
      'portal_folders',
      `share_slug=eq.${encodeURIComponent(slug)}&select=id,share_slug,pin_hash,has_pin&limit=1`
    );
    const folder = folders[0];
    if (!folder) {
      return sendJson(res, 404, { ok: false, error: 'Klasör bulunamadı' });
    }

    if (!folder.has_pin) {
      return sendJson(res, 200, {
        ok: true,
        token: signFolderToken(folder.id, folder.share_slug)
      });
    }

    if (!verifyPin(pin, folder.pin_hash)) {
      return sendJson(res, 403, { ok: false, error: 'Erişim kodu (PIN) hatalı!' });
    }

    return sendJson(res, 200, {
      ok: true,
      token: signFolderToken(folder.id, folder.share_slug)
    });
  } catch (err) {
    console.error('folder-unlock error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
