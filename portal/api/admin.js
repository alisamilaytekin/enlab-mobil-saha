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
  sanitizeTenantPublic,
  sanitizeSaasUserPublic,
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
      const tenants = await dbSelect(
        'saas_tenants',
        'select=id,name,slug,branding_json,is_active,created_at,updated_at&order=created_at.desc'
      );
      const saasUsers = await dbSelect(
        'saas_users',
        'select=id,tenant_id,username,role,full_name,title,ministry_reg_no,diploma_no_date,emo_no,is_active,last_login_at,created_at,updated_at&order=created_at.desc'
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
          customers: accounts.length,
          tenants: tenants.length,
          saas_users: saasUsers.length
        },
        folders: items,
        customer_accounts: enrichedAccounts,
        tenants: tenants.map(sanitizeTenantPublic),
        saas_users: saasUsers.map(sanitizeSaasUserPublic)
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

      if (action === 'create-tenant') {
        const name = String(body.name || '').trim().slice(0, 180);
        if (!name) return sendJson(res, 400, { ok: false, error: 'Firma adı gereklidir.' });
        const rawSlug = sanitizeCompanySlug(body.slug || name);
        let slug = rawSlug || `firma-${Date.now().toString(36)}`;
        const dupTenant = await dbSelect('saas_tenants', `slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`);
        if (dupTenant.length) {
          slug = `${slug}-${Math.floor(100 + Math.random() * 899)}`;
        }

        const managerUsername = normalizeUsername(body.manager_username || '');
        const managerPassword = String(body.manager_password || '').trim();
        const managerFullName = String(body.manager_full_name || '').trim().slice(0, 120);
        if (managerUsername) {
          if (managerUsername.length < 3) {
            return sendJson(res, 400, { ok: false, error: 'Yönetici kullanıcı adı en az 3 karakter olmalıdır.' });
          }
          if (managerPassword.length < 4) {
            return sendJson(res, 400, { ok: false, error: 'Yönetici şifresi en az 4 karakter olmalıdır.' });
          }
          const dupUser = await dbSelect('saas_users', `username=eq.${encodeURIComponent(managerUsername)}&select=id&limit=1`);
          if (dupUser.length) {
            return sendJson(res, 409, { ok: false, error: 'Bu yönetici kullanıcı adı zaten kullanılıyor!' });
          }
        }

        const tenant = await dbInsert('saas_tenants', {
          id: crypto.randomUUID(),
          name,
          slug,
          branding_json: body.branding_json && typeof body.branding_json === 'object' ? body.branding_json : { companyShortName: name, companyFullName: name },
          is_active: true
        });

        let manager = null;
        if (managerUsername) {
          manager = await dbInsert('saas_users', {
            id: crypto.randomUUID(),
            tenant_id: tenant.id,
            username: managerUsername,
            password_hash: hashPin(managerPassword),
            role: 'manager',
            full_name: managerFullName || `${name} Yöneticisi`,
            title: String(body.manager_title || 'Firma Yöneticisi').trim().slice(0, 120),
            is_active: true,
            token_version: 1
          });
        }

        return sendJson(res, 200, {
          ok: true,
          tenant: sanitizeTenantPublic(tenant),
          manager: manager ? sanitizeSaasUserPublic(manager) : null
        });
      }

      if (action === 'update-tenant') {
        const tenantId = String(body.tenant_id || '').trim();
        if (!tenantId) return sendJson(res, 400, { ok: false, error: 'tenant_id gerekli' });
        const patch = { updated_at: new Date().toISOString() };
        if (body.name !== undefined && String(body.name).trim()) {
          patch.name = String(body.name).trim().slice(0, 180);
        }
        if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);
        if (body.branding_json && typeof body.branding_json === 'object') patch.branding_json = body.branding_json;
        const updated = await dbUpdate('saas_tenants', `id=eq.${encodeURIComponent(tenantId)}`, patch);
        return sendJson(res, 200, { ok: true, tenant: sanitizeTenantPublic(updated[0] || null) });
      }

      if (action === 'delete-tenant') {
        const tenantId = String(body.tenant_id || '').trim();
        if (!tenantId) return sendJson(res, 400, { ok: false, error: 'tenant_id gerekli' });
        await dbDelete('saas_tenants', `id=eq.${encodeURIComponent(tenantId)}`);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'create-saas-user') {
        const tenantId = String(body.tenant_id || '').trim();
        const username = normalizeUsername(body.username || '');
        const password = String(body.password || '').trim();
        const fullName = String(body.full_name || '').trim().slice(0, 120);
        const role = body.role === 'manager' ? 'manager' : 'inspector';
        if (!tenantId) return sendJson(res, 400, { ok: false, error: 'tenant_id gerekli' });
        if (!username || username.length < 3) return sendJson(res, 400, { ok: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
        if (password.length < 4) return sendJson(res, 400, { ok: false, error: 'Şifre en az 4 karakter olmalıdır.' });
        if (!fullName) return sendJson(res, 400, { ok: false, error: 'Ad soyad gereklidir.' });

        const dup = await dbSelect('saas_users', `username=eq.${encodeURIComponent(username)}&select=id&limit=1`);
        if (dup.length) return sendJson(res, 409, { ok: false, error: 'Bu kullanıcı adı zaten kayıtlı!' });

        const created = await dbInsert('saas_users', {
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          username,
          password_hash: hashPin(password),
          role,
          full_name: fullName,
          title: String(body.title || (role === 'manager' ? 'Firma Yöneticisi' : 'Elektrik Mühendisi')).trim().slice(0, 120),
          ministry_reg_no: String(body.ministry_reg_no || '').trim().slice(0, 80),
          diploma_no_date: String(body.diploma_no_date || '').trim().slice(0, 80),
          emo_no: String(body.emo_no || '').trim().slice(0, 80),
          is_active: true,
          token_version: 1
        });
        return sendJson(res, 200, { ok: true, user: sanitizeSaasUserPublic(created) });
      }

      if (action === 'update-saas-user') {
        const userId = String(body.user_id || '').trim();
        if (!userId) return sendJson(res, 400, { ok: false, error: 'user_id gerekli' });
        const rows = await dbSelect('saas_users', `id=eq.${encodeURIComponent(userId)}&limit=1`);
        const existing = rows[0];
        if (!existing) return sendJson(res, 404, { ok: false, error: 'Kullanıcı bulunamadı' });

        const patch = { updated_at: new Date().toISOString() };
        let revoke = false;
        if (body.full_name !== undefined && String(body.full_name).trim()) patch.full_name = String(body.full_name).trim().slice(0, 120);
        if (body.role === 'manager' || body.role === 'inspector') patch.role = body.role;
        if (body.title !== undefined) patch.title = String(body.title).trim().slice(0, 120);
        if (body.is_active !== undefined) {
          patch.is_active = Boolean(body.is_active);
          if (!patch.is_active) revoke = true;
        }
        if (body.password !== undefined && String(body.password).trim()) {
          const pwd = String(body.password).trim();
          if (pwd.length < 4) return sendJson(res, 400, { ok: false, error: 'Şifre en az 4 karakter olmalıdır.' });
          patch.password_hash = hashPin(pwd);
          revoke = true;
        }
        if (revoke) patch.token_version = Number(existing.token_version || 1) + 1;
        const updated = await dbUpdate('saas_users', `id=eq.${encodeURIComponent(userId)}`, patch);
        return sendJson(res, 200, { ok: true, user: sanitizeSaasUserPublic(updated[0] || existing) });
      }

      if (action === 'delete-saas-user') {
        const userId = String(body.user_id || '').trim();
        if (!userId) return sendJson(res, 400, { ok: false, error: 'user_id gerekli' });
        await dbDelete('saas_users', `id=eq.${encodeURIComponent(userId)}`);
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
