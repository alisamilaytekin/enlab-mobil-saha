import crypto from 'node:crypto';
import {
  handlePreflight,
  sendJson,
  readJsonBody,
  hashPin,
  verifyPin,
  normalizeUsername,
  sanitizeTenantPublic,
  sanitizeSaasUserPublic,
  signSaasSessionToken,
  setManagerSessionCookie,
  clearManagerSessionCookie,
  resolveAuthenticatedSaasUser,
  dbSelect,
  dbInsert,
  dbUpdate,
  dbDelete
} from './_lib/store.js';

const DUMMY_HASH = '0123456789abcdef0123456789abcdef:' + '0'.repeat(64);

function formatDevicePublic(row) {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    category: row.category || 'Diğer',
    code: row.code || '',
    brand: row.brand || '',
    model: row.model || '',
    reportName: row.report_name || '',
    thermalReportName: row.thermal_report_name || '',
    isThermal: Boolean(row.is_thermal),
    serial: row.serial || '',
    calDate: row.cal_date || '',
    validDate: row.valid_date || '',
    certNo: row.cert_no || '',
    is_active: row.is_active !== false,
    updated_at: row.updated_at || null
  };
}

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  try {
    const urlObj = new URL(req.url, 'http://localhost');

    if (req.method === 'POST') {
      const body = await readJsonBody(req, 128 * 1024);
      const action = String(body.action || '').trim();

      if (action === 'logout') {
        clearManagerSessionCookie(res, req);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'login') {
        const username = normalizeUsername(body.username || '');
        const password = String(body.password || '').trim();
        if (!username || !password) {
          return sendJson(res, 400, { ok: false, error: 'Kullanıcı adı ve şifre gereklidir.' });
        }

        const rows = await dbSelect('saas_users', `username=eq.${encodeURIComponent(username)}&limit=1`);
        const user = rows[0] || null;
        const passwordOk = verifyPin(password, user ? user.password_hash : DUMMY_HASH);
        if (!user || !passwordOk) {
          return sendJson(res, 401, { ok: false, error: 'Kullanıcı adı veya şifre hatalı!' });
        }
        if (user.is_active === false) {
          return sendJson(res, 403, { ok: false, error: 'Hesabınız pasif durumdadır.' });
        }
        if (user.role !== 'manager') {
          return sendJson(res, 403, { ok: false, error: 'Bu panele yalnızca firma yöneticileri giriş yapabilir.' });
        }

        const tenants = await dbSelect('saas_tenants', `id=eq.${encodeURIComponent(user.tenant_id)}&limit=1`);
        const tenant = tenants[0] || null;
        if (!tenant || tenant.is_active === false) {
          return sendJson(res, 403, { ok: false, error: 'Firmanız şu anda pasif durumdadır.' });
        }

        const nowIso = new Date().toISOString();
        await dbUpdate('saas_users', `id=eq.${encodeURIComponent(user.id)}`, {
          last_login_at: nowIso,
          updated_at: nowIso
        });
        user.last_login_at = nowIso;

        const token = signSaasSessionToken(user, 'manager');
        setManagerSessionCookie(res, token, req);

        return sendJson(res, 200, {
          ok: true,
          token,
          manager: sanitizeSaasUserPublic(user),
          tenant: sanitizeTenantPublic(tenant)
        });
      }

      const auth = await resolveAuthenticatedSaasUser(req, urlObj, 'manager');
      if (!auth) {
        return sendJson(res, 401, { ok: false, error: 'Yönetici oturumu geçersiz veya süresi dolmuş.' });
      }
      const { user: manager, tenant } = auth;
      const tenantId = tenant.id;

      // ---- 1. PERSONEL YÖNETİMİ ----
      if (action === 'create-user') {
        const username = normalizeUsername(body.username || '');
        const password = String(body.password || '').trim();
        const fullName = String(body.full_name || '').trim().slice(0, 120);
        const role = body.role === 'manager' ? 'manager' : 'inspector';

        if (!username || username.length < 3) {
          return sendJson(res, 400, { ok: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
        }
        if (password.length < 4) {
          return sendJson(res, 400, { ok: false, error: 'Şifre en az 4 karakter olmalıdır.' });
        }
        if (!fullName) {
          return sendJson(res, 400, { ok: false, error: 'Personel ad soyad gereklidir.' });
        }

        const dup = await dbSelect('saas_users', `username=eq.${encodeURIComponent(username)}&select=id&limit=1`);
        if (dup.length) {
          return sendJson(res, 409, { ok: false, error: 'Bu kullanıcı adı sistemde zaten kayıtlı!' });
        }

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

      if (action === 'update-user') {
        const userId = String(body.user_id || '').trim();
        if (!userId) return sendJson(res, 400, { ok: false, error: 'user_id gerekli' });
        const rows = await dbSelect(
          'saas_users',
          `id=eq.${encodeURIComponent(userId)}&tenant_id=eq.${encodeURIComponent(tenantId)}&limit=1`
        );
        const existing = rows[0];
        if (!existing) return sendJson(res, 404, { ok: false, error: 'Personel bulunamadı' });

        const patch = { updated_at: new Date().toISOString() };
        let revoke = false;

        if (body.full_name !== undefined && String(body.full_name).trim()) {
          patch.full_name = String(body.full_name).trim().slice(0, 120);
        }
        if (body.title !== undefined) patch.title = String(body.title).trim().slice(0, 120);
        if (body.ministry_reg_no !== undefined) patch.ministry_reg_no = String(body.ministry_reg_no).trim().slice(0, 80);
        if (body.diploma_no_date !== undefined) patch.diploma_no_date = String(body.diploma_no_date).trim().slice(0, 80);
        if (body.emo_no !== undefined) patch.emo_no = String(body.emo_no).trim().slice(0, 80);
        if (body.role === 'manager' || body.role === 'inspector') {
          if (existing.id === manager.id && body.role !== 'manager') {
            return sendJson(res, 400, { ok: false, error: 'Kendi yönetici yetkinizi kaldıramazsınız.' });
          }
          patch.role = body.role;
        }
        if (body.is_active !== undefined) {
          if (existing.id === manager.id && body.is_active === false) {
            return sendJson(res, 400, { ok: false, error: 'Kendi hesabınızı pasife alamazsınız.' });
          }
          patch.is_active = Boolean(body.is_active);
          if (!patch.is_active) revoke = true;
        }
        if (body.password !== undefined && String(body.password).trim()) {
          const pwd = String(body.password).trim();
          if (pwd.length < 4) {
            return sendJson(res, 400, { ok: false, error: 'Yeni şifre en az 4 karakter olmalıdır.' });
          }
          patch.password_hash = hashPin(pwd);
          revoke = true;
        }
        if (revoke) patch.token_version = Number(existing.token_version || 1) + 1;

        const updated = await dbUpdate('saas_users', `id=eq.${encodeURIComponent(userId)}&tenant_id=eq.${encodeURIComponent(tenantId)}`, patch);
        return sendJson(res, 200, { ok: true, user: sanitizeSaasUserPublic(updated[0] || existing) });
      }

      if (action === 'delete-user') {
        const userId = String(body.user_id || '').trim();
        if (!userId) return sendJson(res, 400, { ok: false, error: 'user_id gerekli' });
        if (userId === manager.id) {
          return sendJson(res, 400, { ok: false, error: 'Kendi hesabınızı silemezsiniz.' });
        }
        await dbDelete('saas_users', `id=eq.${encodeURIComponent(userId)}&tenant_id=eq.${encodeURIComponent(tenantId)}`);
        return sendJson(res, 200, { ok: true });
      }

      // ---- 2. ÖLÇÜM CİHAZI HAVUZU ----
      if (action === 'create-device' || action === 'update-device') {
        const isEdit = action === 'update-device';
        const deviceId = String(body.device_id || '').trim();
        if (isEdit && !deviceId) return sendJson(res, 400, { ok: false, error: 'device_id gerekli' });

        const category = String(body.category || 'Diğer').trim() || 'Diğer';
        const brand = String(body.brand || '').trim().slice(0, 80);
        const model = String(body.model || '').trim().slice(0, 80);
        const isThermal = body.is_thermal !== undefined
          ? Boolean(body.is_thermal)
          : category.toLowerCase().includes('termal');
        const defaultRepName = category === 'Diğer'
          ? ([brand, model].filter(Boolean).join(' ') || 'Ölçüm Cihazı')
          : category;
        const reportName = String(body.report_name || '').trim().slice(0, 120) || defaultRepName;
        const thermalReportName = isThermal
          ? (String(body.thermal_report_name || '').trim().slice(0, 120) || [brand, model].filter(Boolean).join(' ') || reportName)
          : '';

        const payload = {
          category,
          code: String(body.code || '').trim().slice(0, 40),
          brand,
          model,
          report_name: reportName,
          thermal_report_name: thermalReportName,
          is_thermal: isThermal,
          serial: String(body.serial || '').trim().slice(0, 80),
          cal_date: String(body.cal_date || '').trim().slice(0, 30),
          valid_date: String(body.valid_date || '').trim().slice(0, 30),
          cert_no: String(body.cert_no || '').trim().slice(0, 80),
          is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
          updated_at: new Date().toISOString()
        };

        if (isEdit) {
          const updated = await dbUpdate(
            'saas_devices',
            `id=eq.${encodeURIComponent(deviceId)}&tenant_id=eq.${encodeURIComponent(tenantId)}`,
            payload
          );
          if (!updated.length) return sendJson(res, 404, { ok: false, error: 'Cihaz bulunamadı' });
          return sendJson(res, 200, { ok: true, device: formatDevicePublic(updated[0]) });
        }

        const created = await dbInsert('saas_devices', {
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          ...payload
        });
        return sendJson(res, 200, { ok: true, device: formatDevicePublic(created) });
      }

      if (action === 'delete-device') {
        const deviceId = String(body.device_id || '').trim();
        if (!deviceId) return sendJson(res, 400, { ok: false, error: 'device_id gerekli' });
        await dbDelete('saas_devices', `id=eq.${encodeURIComponent(deviceId)}&tenant_id=eq.${encodeURIComponent(tenantId)}`);
        return sendJson(res, 200, { ok: true });
      }

      // ---- 3. ELEMANA CİHAZ ZİMMETİ ----
      if (action === 'set-user-devices') {
        const userId = String(body.user_id || '').trim();
        const deviceIds = Array.isArray(body.device_ids) ? body.device_ids.map(String) : [];
        if (!userId) return sendJson(res, 400, { ok: false, error: 'user_id gerekli' });

        const uRows = await dbSelect(
          'saas_users',
          `id=eq.${encodeURIComponent(userId)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=id&limit=1`
        );
        if (!uRows.length) return sendJson(res, 404, { ok: false, error: 'Personel bulunamadı' });

        const tenantDevs = await dbSelect(
          'saas_devices',
          `tenant_id=eq.${encodeURIComponent(tenantId)}&select=id`
        );
        const validDevSet = new Set(tenantDevs.map(d => String(d.id)));
        const cleanIds = [];
        for (const did of deviceIds) {
          if (validDevSet.has(did) && !cleanIds.includes(did)) cleanIds.push(did);
        }

        await dbDelete('saas_user_devices', `user_id=eq.${encodeURIComponent(userId)}`);
        for (let i = 0; i < cleanIds.length; i++) {
          await dbInsert('saas_user_devices', {
            user_id: userId,
            device_id: cleanIds[i],
            sort_order: i
          });
        }
        return sendJson(res, 200, { ok: true, user_id: userId, device_ids: cleanIds });
      }

      // ---- 4. İŞ KLASÖRÜ AÇMA & ELEMANA ATAMA ----
      if (action === 'create-work-order') {
        const assignedUserId = String(body.assigned_user_id || '').trim();
        const companyName = String(body.company_name || '').trim().slice(0, 200);
        if (!assignedUserId) return sendJson(res, 400, { ok: false, error: 'Görevli saha elemanı seçilmelidir.' });
        if (!companyName) return sendJson(res, 400, { ok: false, error: 'Müşteri / İşyeri adı gereklidir.' });

        const uRows = await dbSelect(
          'saas_users',
          `id=eq.${encodeURIComponent(assignedUserId)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=id&limit=1`
        );
        if (!uRows.length) return sendJson(res, 404, { ok: false, error: 'Seçilen personel firmanızda bulunamadı.' });

        const tplIds = Array.isArray(body.template_ids)
          ? body.template_ids.map(x => String(x).trim()).filter(Boolean)
          : [];

        const rawCode = String(body.work_order_code || '').trim().slice(0, 60);
        const prefix = (tenant.branding_json && tenant.branding_json.reportNoPrefix) || 'HZL-';
        const autoCode = rawCode || `${prefix}${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

        const created = await dbInsert('saas_work_orders', {
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          assigned_user_id: assignedUserId,
          work_order_code: autoCode,
          company_name: companyName,
          company_branch: String(body.company_branch || '').trim().slice(0, 200),
          company_address: String(body.company_address || '').trim().slice(0, 300),
          isg_katip_no: String(body.isg_katip_no || '').trim().slice(0, 80),
          sgk_sicil_no: String(body.sgk_sicil_no || '').trim().slice(0, 80),
          contact_email: String(body.contact_email || '').trim().slice(0, 160),
          field_notes: String(body.field_notes || '').trim().slice(0, 2000),
          template_ids: tplIds,
          status: 'open',
          created_by: manager.id
        });
        return sendJson(res, 200, { ok: true, work_order: created });
      }

      if (action === 'update-work-order') {
        const woId = String(body.work_order_id || '').trim();
        if (!woId) return sendJson(res, 400, { ok: false, error: 'work_order_id gerekli' });
        const patch = { updated_at: new Date().toISOString() };
        if (body.assigned_user_id) {
          const uRows = await dbSelect(
            'saas_users',
            `id=eq.${encodeURIComponent(String(body.assigned_user_id))}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=id&limit=1`
          );
          if (!uRows.length) return sendJson(res, 404, { ok: false, error: 'Personel bulunamadı' });
          patch.assigned_user_id = String(body.assigned_user_id);
        }
        if (body.work_order_code !== undefined) patch.work_order_code = String(body.work_order_code).trim().slice(0, 60);
        if (body.company_name !== undefined && String(body.company_name).trim()) patch.company_name = String(body.company_name).trim().slice(0, 200);
        if (body.company_branch !== undefined) patch.company_branch = String(body.company_branch).trim().slice(0, 200);
        if (body.company_address !== undefined) patch.company_address = String(body.company_address).trim().slice(0, 300);
        if (body.isg_katip_no !== undefined) patch.isg_katip_no = String(body.isg_katip_no).trim().slice(0, 80);
        if (body.sgk_sicil_no !== undefined) patch.sgk_sicil_no = String(body.sgk_sicil_no).trim().slice(0, 80);
        if (body.contact_email !== undefined) patch.contact_email = String(body.contact_email).trim().slice(0, 160);
        if (body.field_notes !== undefined) patch.field_notes = String(body.field_notes).trim().slice(0, 2000);
        if (Array.isArray(body.template_ids)) patch.template_ids = body.template_ids.map(x => String(x).trim()).filter(Boolean);
        if (['open', 'in_progress', 'completed', 'cancelled'].includes(body.status)) patch.status = body.status;

        const updated = await dbUpdate(
          'saas_work_orders',
          `id=eq.${encodeURIComponent(woId)}&tenant_id=eq.${encodeURIComponent(tenantId)}`,
          patch
        );
        return sendJson(res, 200, { ok: true, work_order: updated[0] || null });
      }

      if (action === 'delete-work-order') {
        const woId = String(body.work_order_id || '').trim();
        if (!woId) return sendJson(res, 400, { ok: false, error: 'work_order_id gerekli' });
        await dbDelete('saas_work_orders', `id=eq.${encodeURIComponent(woId)}&tenant_id=eq.${encodeURIComponent(tenantId)}`);
        return sendJson(res, 200, { ok: true });
      }

      if (action === 'update-tenant-branding') {
        const currentBranding = tenant.branding_json && typeof tenant.branding_json === 'object' ? tenant.branding_json : {};
        const nextBranding = {
          ...currentBranding,
          companyFullName: body.companyFullName !== undefined ? String(body.companyFullName).trim().slice(0, 200) : (currentBranding.companyFullName || tenant.name),
          companyShortName: body.companyShortName !== undefined ? String(body.companyShortName).trim().slice(0, 80) : (currentBranding.companyShortName || tenant.name),
          companyAddress: body.companyAddress !== undefined ? String(body.companyAddress).trim().slice(0, 240) : (currentBranding.companyAddress || ''),
          companyPhone: body.companyPhone !== undefined ? String(body.companyPhone).trim().slice(0, 60) : (currentBranding.companyPhone || ''),
          companyEmail: body.companyEmail !== undefined ? String(body.companyEmail).trim().slice(0, 120) : (currentBranding.companyEmail || ''),
          reportNoPrefix: body.reportNoPrefix !== undefined ? String(body.reportNoPrefix).trim().slice(0, 20) : (currentBranding.reportNoPrefix || 'HZL-'),
          accreditationNo: body.accreditationNo !== undefined ? String(body.accreditationNo).trim().slice(0, 60) : (currentBranding.accreditationNo || '')
        };
        const updated = await dbUpdate(
          'saas_tenants',
          `id=eq.${encodeURIComponent(tenantId)}`,
          { branding_json: nextBranding, updated_at: new Date().toISOString() }
        );
        return sendJson(res, 200, { ok: true, tenant: sanitizeTenantPublic(updated[0] || tenant) });
      }

      return sendJson(res, 400, { ok: false, error: 'Bilinmeyen işlem' });
    }

    if (req.method === 'GET') {
      const auth = await resolveAuthenticatedSaasUser(req, urlObj, 'manager');
      if (!auth) {
        return sendJson(res, 401, { ok: false, error: 'Oturum açılmamış' });
      }
      const { user: manager, tenant } = auth;
      const tenantId = tenant.id;

      const [users, devices, workOrders] = await Promise.all([
        dbSelect(
          'saas_users',
          `tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,tenant_id,username,role,full_name,title,ministry_reg_no,diploma_no_date,emo_no,is_active,last_login_at,created_at,updated_at&order=created_at.asc`
        ),
        dbSelect(
          'saas_devices',
          `tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc`
        ),
        dbSelect(
          'saas_work_orders',
          `tenant_id=eq.${encodeURIComponent(tenantId)}&order=updated_at.desc`
        )
      ]);

      const userIds = users.map(u => u.id);
      let assignments = [];
      if (userIds.length > 0) {
        assignments = await dbSelect(
          'saas_user_devices',
          `user_id=in.(${userIds.join(',')})&order=sort_order.asc`
        );
      }

      const assignedMap = {};
      for (const u of users) assignedMap[u.id] = [];
      for (const a of assignments) {
        if (!assignedMap[a.user_id]) assignedMap[a.user_id] = [];
        assignedMap[a.user_id].push(a.device_id);
      }

      return sendJson(res, 200, {
        ok: true,
        manager: sanitizeSaasUserPublic(manager),
        tenant: sanitizeTenantPublic(tenant),
        users: users.map(sanitizeSaasUserPublic),
        devices: devices.map(formatDevicePublic),
        assignments: assignedMap,
        work_orders: workOrders
      });
    }

    return sendJson(res, 405, { ok: false, error: 'Desteklenmeyen HTTP metodu' });
  } catch (err) {
    console.error('manager error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
