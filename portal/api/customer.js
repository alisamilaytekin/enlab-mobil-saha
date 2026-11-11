import {
  handlePreflight,
  sendJson,
  readJsonBody,
  getOrigin,
  normalizeUsername,
  sanitizeCustomerPublic,
  verifyPin,
  signCustomerSessionToken,
  setCustomerSessionCookie,
  clearCustomerSessionCookie,
  resolveAuthenticatedCustomer,
  dbSelect,
  dbUpdate
} from './_lib/store.js';

const DUMMY_HASH = '0123456789abcdef0123456789abcdef:' + '0'.repeat(64);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const origin = getOrigin(req);

    if (req.method === 'GET') {
      const customer = await resolveAuthenticatedCustomer(req, urlObj);
      if (!customer) {
        return sendJson(res, 401, { ok: false, error: 'Oturum açılmamış' });
      }

      const folders = await dbSelect(
        'portal_folders',
        `customer_account_id=eq.${encodeURIComponent(customer.id)}&select=id,share_slug,work_order_code,owner_company_slug,owner_company_name,company_name,company_branch,company_address,has_pin,branding_json,created_at,updated_at&order=updated_at.desc`
      );

      const folderIds = folders.map(f => String(f.id || '')).filter(id => UUID_RE.test(id));
      let reports = [];
      if (folderIds.length > 0) {
        reports = await dbSelect(
          'portal_reports',
          `folder_id=in.(${folderIds.join(',')})&upload_ready=eq.true&select=id,folder_id,share_slug,verify_code,report_no,equipment_name,template_code,inspection_date,next_inspection_date,inspector_name,result_status,source_type,mime_type,file_size_bytes,created_at,updated_at&order=created_at.desc`
        );
      }

      const reportsByFolder = new Map();
      for (const r of reports) {
        if (!reportsByFolder.has(r.folder_id)) reportsByFolder.set(r.folder_id, []);
        reportsByFolder.get(r.folder_id).push({
          ...r,
          url: `${origin}/r/${r.share_slug}`
        });
      }

      const enrichedFolders = folders.map(f => ({
        ...f,
        url: `${origin}/p/${f.share_slug}`,
        reports: reportsByFolder.get(f.id) || []
      }));

      return sendJson(res, 200, {
        ok: true,
        customer: sanitizeCustomerPublic(customer),
        totals: {
          folders: enrichedFolders.length,
          reports: reports.length
        },
        folders: enrichedFolders
      });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req, 32 * 1024);
      const action = String(body.action || 'login').trim();

      if (action === 'logout') {
        clearCustomerSessionCookie(res, req);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'login') {
        const username = normalizeUsername(body.username || '');
        const password = String(body.password || '').trim();
        if (!username || !password) {
          return sendJson(res, 400, { ok: false, error: 'Kullanıcı adı ve şifre gereklidir.' });
        }

        const rows = await dbSelect(
          'portal_customer_accounts',
          `username=eq.${encodeURIComponent(username)}&limit=1`
        );
        const acct = rows[0] || null;
        const hashToCheck = acct ? acct.password_hash : DUMMY_HASH;
        const passwordOk = verifyPin(password, hashToCheck);

        if (!acct || !passwordOk) {
          return sendJson(res, 401, { ok: false, error: 'Kullanıcı adı veya şifre hatalı!' });
        }
        if (acct.is_active === false) {
          return sendJson(res, 403, { ok: false, error: 'Bu firma hesabı pasif durumdadır. Lütfen kontrol kuruluşuyla iletişime geçin.' });
        }

        const nowIso = new Date().toISOString();
        await dbUpdate('portal_customer_accounts', `id=eq.${encodeURIComponent(acct.id)}`, {
          last_login_at: nowIso,
          updated_at: nowIso
        });
        acct.last_login_at = nowIso;

        const token = signCustomerSessionToken(acct);
        setCustomerSessionCookie(res, token, req);

        return sendJson(res, 200, {
          ok: true,
          token,
          customer: sanitizeCustomerPublic(acct)
        });
      }

      return sendJson(res, 400, { ok: false, error: 'Bilinmeyen işlem' });
    }

    return sendJson(res, 405, { ok: false, error: 'Desteklenmeyen HTTP metodu' });
  } catch (err) {
    console.error('customer error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
