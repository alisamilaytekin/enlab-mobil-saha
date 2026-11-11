import crypto from 'node:crypto';
import {
  handlePreflight,
  sendJson,
  readJsonBody,
  verifyAdminKey,
  getOrigin,
  hashPin,
  normalizeUsername,
  sanitizeCompanySlug,
  sanitizeCustomerPublic,
  dbSelect,
  dbInsert,
  dbUpdate,
  dbDelete,
  deleteStorageObjects
} from './_lib/store.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (!verifyAdminKey(req)) {
    return sendJson(res, 401, { ok: false, error: 'Geçersiz yönetici anahtarı' });
  }

  try {
    const origin = getOrigin(req);

    if (req.method === 'GET') {
      const urlObj = new URL(req.url, 'http://localhost');
      const q = (urlObj.searchParams.get('q') || '').trim().toLowerCase();

      const accounts = await dbSelect(
        'portal_customer_accounts',
        'select=id,username,company_name,company_key,owner_company_slug,owner_company_name,is_active,last_login_at,created_at,updated_at&order=created_at.desc'
      );
      const folders = await dbSelect(
        'portal_folders',
        'select=id,share_slug,work_order_code,local_wo_id,owner_company_slug,owner_company_name,customer_account_id,require_auth,company_name,company_branch,company_address,contact_email,has_pin,branding_json,created_at,updated_at&order=updated_at.desc'
      );
      const reports = await dbSelect(
        'portal_reports',
        'upload_ready=eq.true&select=id,folder_id,share_slug,verify_code,report_no,equipment_name,template_code,inspection_date,inspector_name,result_status,source_type,file_size_bytes,created_at,updated_at&order=created_at.desc'
      );

      const accountById = new Map();
      const folderCountByAccount = new Map();
      const reportCountByAccount = new Map();
      for (const a of accounts) {
        accountById.set(a.id, a);
        folderCountByAccount.set(a.id, 0);
        reportCountByAccount.set(a.id, 0);
      }

      const reportsByFolder = new Map();
      for (const r of reports) {
        if (!reportsByFolder.has(r.folder_id)) reportsByFolder.set(r.folder_id, []);
        reportsByFolder.get(r.folder_id).push({
          ...r,
          url: `${origin}/r/${r.share_slug}`
        });
      }

      let items = folders.map(f => {
        const cust = f.customer_account_id ? accountById.get(f.customer_account_id) || null : null;
        const folderReports = reportsByFolder.get(f.id) || [];
        if (cust) {
          folderCountByAccount.set(cust.id, (folderCountByAccount.get(cust.id) || 0) + 1);
          reportCountByAccount.set(cust.id, (reportCountByAccount.get(cust.id) || 0) + folderReports.length);
        }
        return {
          ...f,
          require_auth: Boolean(f.require_auth || f.customer_account_id),
          customer_username: cust ? cust.username : '',
          customer_company_name: cust ? cust.company_name : '',
          customer_is_active: cust ? cust.is_active !== false : null,
          url: `${origin}/p/${f.share_slug}`,
          reports: folderReports
        };
      });

      let enrichedAccounts = accounts.map(a => ({
        ...sanitizeCustomerPublic(a),
        folder_count: folderCountByAccount.get(a.id) || 0,
        report_count: reportCountByAccount.get(a.id) || 0
      }));

      if (q) {
        items = items.filter(f =>
          (f.company_name || '').toLowerCase().includes(q) ||
          (f.company_branch || '').toLowerCase().includes(q) ||
          (f.work_order_code || '').toLowerCase().includes(q) ||
          (f.owner_company_name || '').toLowerCase().includes(q) ||
          (f.owner_company_slug || '').toLowerCase().includes(q) ||
          (f.customer_username || '').toLowerCase().includes(q) ||
          f.reports.some(r =>
            (r.equipment_name || '').toLowerCase().includes(q) ||
            (r.report_no || '').toLowerCase().includes(q) ||
            (r.verify_code || '').toLowerCase().includes(q)
          )
        );
        enrichedAccounts = enrichedAccounts.filter(a =>
          (a.username || '').toLowerCase().includes(q) ||
          (a.company_name || '').toLowerCase().includes(q) ||
          (a.owner_company_name || '').toLowerCase().includes(q) ||
          (a.owner_company_slug || '').toLowerCase().includes(q)
        );
      }

      return sendJson(res, 200, {
        ok: true,
        totals: {
          folders: folders.length,
          reports: reports.length,
          customers: accounts.length
        },
        folders: items,
        customer_accounts: enrichedAccounts
      });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req, 64 * 1024);
      const action = String(body.action || '').trim();

      if (action === 'create-customer') {
        const username = normalizeUsername(body.username || '');
        const companyName = String(body.company_name || '').trim().slice(0, 200);
        const password = String(body.password || '').trim();
        const ownerSlug = sanitizeCompanySlug(body.owner_company_slug || '');
        const ownerName = String(body.owner_company_name || '').trim().slice(0, 120);

        if (!username || username.length < 3) {
          return sendJson(res, 400, { ok: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
        }
        if (!companyName) {
          return sendJson(res, 400, { ok: false, error: 'Firma adı gereklidir.' });
        }
        if (password.length < 4) {
          return sendJson(res, 400, { ok: false, error: 'Şifre en az 4 karakter olmalıdır.' });
        }

        const dup = await dbSelect(
          'portal_customer_accounts',
          `username=eq.${encodeURIComponent(username)}&select=id&limit=1`
        );
        if (dup.length) {
          return sendJson(res, 409, { ok: false, error: 'Bu kullanıcı adı zaten kayıtlı!' });
        }

        const created = await dbInsert('portal_customer_accounts', {
          id: crypto.randomUUID(),
          username,
          company_name: companyName,
          company_key: sanitizeCompanySlug(companyName),
          owner_company_slug: ownerSlug,
          owner_company_name: ownerName,
          password_hash: hashPin(password),
          is_active: true,
          token_version: 1
        });
        return sendJson(res, 200, { ok: true, customer: sanitizeCustomerPublic(created) });
      }

      if (action === 'update-customer') {
        const customerId = String(body.customer_id || '').trim();
        if (!customerId) return sendJson(res, 400, { ok: false, error: 'customer_id gerekli' });
        const rows = await dbSelect(
          'portal_customer_accounts',
          `id=eq.${encodeURIComponent(customerId)}&limit=1`
        );
        const existing = rows[0];
        if (!existing) return sendJson(res, 404, { ok: false, error: 'Müşteri hesabı bulunamadı' });

        const patch = { updated_at: new Date().toISOString() };
        let shouldRevoke = false;

        if (body.username !== undefined) {
          const nextUser = normalizeUsername(body.username);
          if (!nextUser || nextUser.length < 3) {
            return sendJson(res, 400, { ok: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
          }
          if (nextUser !== existing.username) {
            const dup = await dbSelect(
              'portal_customer_accounts',
              `username=eq.${encodeURIComponent(nextUser)}&select=id&limit=1`
            );
            if (dup.length && dup[0].id !== customerId) {
              return sendJson(res, 409, { ok: false, error: 'Bu kullanıcı adı başka bir firmada kullanılıyor!' });
            }
            patch.username = nextUser;
            shouldRevoke = true;
          }
        }
        if (body.company_name !== undefined && String(body.company_name).trim()) {
          const cn = String(body.company_name).trim().slice(0, 200);
          patch.company_name = cn;
          patch.company_key = sanitizeCompanySlug(cn);
        }
        if (body.password !== undefined && String(body.password).trim()) {
          const pwd = String(body.password).trim();
          if (pwd.length < 4) {
            return sendJson(res, 400, { ok: false, error: 'Yeni şifre en az 4 karakter olmalıdır.' });
          }
          patch.password_hash = hashPin(pwd);
          shouldRevoke = true;
        }
        if (body.is_active !== undefined) {
          patch.is_active = Boolean(body.is_active);
          if (!patch.is_active) shouldRevoke = true;
        }
        if (shouldRevoke) {
          patch.token_version = Number(existing.token_version || 1) + 1;
        }

        const updated = await dbUpdate('portal_customer_accounts', `id=eq.${encodeURIComponent(customerId)}`, patch);
        return sendJson(res, 200, { ok: true, customer: sanitizeCustomerPublic(updated[0] || existing) });
      }

      if (action === 'assign-folder-customer') {
        const folderId = String(body.folder_id || '').trim();
        const customerId = body.customer_id ? String(body.customer_id).trim() : '';
        if (!folderId) return sendJson(res, 400, { ok: false, error: 'folder_id gerekli' });

        const patch = { updated_at: new Date().toISOString() };
        if (customerId) {
          const rows = await dbSelect(
            'portal_customer_accounts',
            `id=eq.${encodeURIComponent(customerId)}&select=id&limit=1`
          );
          if (!rows[0]) return sendJson(res, 404, { ok: false, error: 'Müşteri hesabı bulunamadı' });
          patch.customer_account_id = customerId;
          patch.require_auth = true;
        } else {
          patch.customer_account_id = null;
          if (body.require_auth !== undefined) {
            patch.require_auth = Boolean(body.require_auth);
          }
        }
        await dbUpdate('portal_folders', `id=eq.${encodeURIComponent(folderId)}`, patch);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'delete-customer') {
        const customerId = String(body.customer_id || '').trim();
        if (!customerId) return sendJson(res, 400, { ok: false, error: 'customer_id gerekli' });
        await dbUpdate(
          'portal_folders',
          `customer_account_id=eq.${encodeURIComponent(customerId)}`,
          { require_auth: true, customer_account_id: null, updated_at: new Date().toISOString() }
        );
        await dbDelete('portal_customer_accounts', `id=eq.${encodeURIComponent(customerId)}`);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'update-folder') {
        const folderId = String(body.folder_id || '').trim();
        if (!folderId) return sendJson(res, 400, { ok: false, error: 'folder_id gerekli' });
        const patch = { updated_at: new Date().toISOString() };
        if (body.company_name !== undefined) patch.company_name = String(body.company_name).trim();
        if (body.company_branch !== undefined) patch.company_branch = String(body.company_branch).trim();
        if (body.company_address !== undefined) patch.company_address = String(body.company_address).trim();
        if (body.contact_email !== undefined) patch.contact_email = String(body.contact_email).trim();
        if (body.require_auth !== undefined) patch.require_auth = Boolean(body.require_auth);
        if (body.clear_pin) {
          patch.pin_hash = null;
          patch.has_pin = false;
        } else if (body.pin && String(body.pin).trim()) {
          patch.pin_hash = hashPin(body.pin);
          patch.has_pin = true;
        }
        await dbUpdate('portal_folders', `id=eq.${encodeURIComponent(folderId)}`, patch);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'delete-report') {
        const reportId = String(body.report_id || '').trim();
        if (!reportId) return sendJson(res, 400, { ok: false, error: 'report_id gerekli' });
        const rows = await dbSelect('portal_reports', `id=eq.${encodeURIComponent(reportId)}&limit=1`);
        if (rows[0] && rows[0].storage_path) {
          await deleteStorageObjects([rows[0].storage_path]);
        }
        await dbDelete('portal_reports', `id=eq.${encodeURIComponent(reportId)}`);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'delete-folder') {
        const folderId = String(body.folder_id || '').trim();
        if (!folderId) return sendJson(res, 400, { ok: false, error: 'folder_id gerekli' });
        const reps = await dbSelect('portal_reports', `folder_id=eq.${encodeURIComponent(folderId)}&select=storage_path`);
        await deleteStorageObjects(reps.map(r => r.storage_path));
        await dbDelete('portal_folders', `id=eq.${encodeURIComponent(folderId)}`);
        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 400, { ok: false, error: 'Bilinmeyen işlem' });
    }

    return sendJson(res, 405, { ok: false, error: 'Desteklenmeyen HTTP metodu' });
  } catch (err) {
    console.error('admin error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
