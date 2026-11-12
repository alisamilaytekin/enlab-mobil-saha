import {
  handlePreflight,
  sendJson,
  readJsonBody,
  verifyPin,
  normalizeUsername,
  sanitizeTenantPublic,
  sanitizeSaasUserPublic,
  signSaasSessionToken,
  resolveAuthenticatedSaasUser,
  dbSelect,
  dbUpdate
} from './_lib/store.js';

const DUMMY_HASH = '0123456789abcdef0123456789abcdef:' + '0'.repeat(64);

function formatDeviceForApp(row) {
  return {
    id: `cloud_${row.id}`,
    cloudId: row.id,
    category: row.category || 'Diğer',
    code: row.code || '',
    brand: row.brand || '',
    model: row.model || '',
    reportName: row.report_name || row.category || 'Ölçüm Cihazı',
    thermalReportName: row.thermal_report_name || '',
    isThermal: Boolean(row.is_thermal),
    serial: row.serial || '',
    calDate: row.cal_date || '',
    validDate: row.valid_date || '',
    certNo: row.cert_no || '',
    isCustom: false,
    lockedByManager: true
  };
}

async function buildSyncPayload(user, tenant) {
  const [userDevicesRows, workOrdersRows] = await Promise.all([
    dbSelect(
      'saas_user_devices',
      `user_id=eq.${encodeURIComponent(user.id)}&select=device_id,sort_order&order=sort_order.asc`
    ),
    dbSelect(
      'saas_work_orders',
      `tenant_id=eq.${encodeURIComponent(tenant.id)}&assigned_user_id=eq.${encodeURIComponent(user.id)}&status=neq.cancelled&order=updated_at.desc`
    )
  ]);

  let assignedDevices = [];
  if (userDevicesRows.length > 0) {
    const devIds = userDevicesRows.map(r => r.device_id).filter(Boolean);
    if (devIds.length > 0) {
      const devices = await dbSelect(
        'saas_devices',
        `tenant_id=eq.${encodeURIComponent(tenant.id)}&id=in.(${devIds.join(',')})&is_active=eq.true`
      );
      const devById = new Map(devices.map(d => [String(d.id), d]));
      for (const link of userDevicesRows) {
        const d = devById.get(String(link.device_id));
        if (d) assignedDevices.push(formatDeviceForApp(d));
      }
    }
  }

  return {
    user: sanitizeSaasUserPublic(user),
    tenant: sanitizeTenantPublic(tenant),
    devices: assignedDevices,
    work_orders: workOrdersRows.map(wo => ({
      id: wo.id,
      work_order_code: wo.work_order_code || '',
      company_name: wo.company_name || '',
      company_branch: wo.company_branch || '',
      company_address: wo.company_address || '',
      isg_katip_no: wo.isg_katip_no || '',
      sgk_sicil_no: wo.sgk_sicil_no || '',
      contact_email: wo.contact_email || '',
      field_notes: wo.field_notes || '',
      template_ids: Array.isArray(wo.template_ids) ? wo.template_ids : [],
      status: wo.status || 'open',
      created_at: wo.created_at,
      updated_at: wo.updated_at
    })),
    synced_at: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  try {
    const urlObj = new URL(req.url, 'http://localhost');

    if (req.method === 'GET') {
      const auth = await resolveAuthenticatedSaasUser(req, urlObj, 'app');
      if (!auth) {
        return sendJson(res, 401, { ok: false, error: 'Uygulama oturumu geçersiz veya süresi dolmuş.' });
      }
      const syncData = await buildSyncPayload(auth.user, auth.tenant);
      return sendJson(res, 200, { ok: true, ...syncData });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req, 64 * 1024);
      const action = String(body.action || 'login').trim();

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
          return sendJson(res, 403, { ok: false, error: 'Hesabınız yöneticiniz tarafından pasife alınmış.' });
        }

        const tenants = await dbSelect('saas_tenants', `id=eq.${encodeURIComponent(user.tenant_id)}&limit=1`);
        const tenant = tenants[0] || null;
        if (!tenant || tenant.is_active === false) {
          return sendJson(res, 403, { ok: false, error: 'Firmanız şu anda aktif değil.' });
        }

        const nowIso = new Date().toISOString();
        await dbUpdate('saas_users', `id=eq.${encodeURIComponent(user.id)}`, {
          last_login_at: nowIso,
          updated_at: nowIso
        });
        user.last_login_at = nowIso;

        const token = signSaasSessionToken(user, 'app');
        const syncData = await buildSyncPayload(user, tenant);
        return sendJson(res, 200, { ok: true, token, ...syncData });
      }

      if (action === 'update-work-order-status') {
        const auth = await resolveAuthenticatedSaasUser(req, urlObj, 'app');
        if (!auth) {
          return sendJson(res, 401, { ok: false, error: 'Oturum geçersiz.' });
        }
        const woId = String(body.work_order_id || '').trim();
        if (!woId) return sendJson(res, 400, { ok: false, error: 'work_order_id gerekli' });

        const patch = { updated_at: new Date().toISOString() };
        if (['open', 'in_progress', 'completed'].includes(body.status)) {
          patch.status = body.status;
        }
        if (body.field_notes !== undefined) {
          patch.field_notes = String(body.field_notes || '').trim().slice(0, 2000);
        }

        const updated = await dbUpdate(
          'saas_work_orders',
          `id=eq.${encodeURIComponent(woId)}&tenant_id=eq.${encodeURIComponent(auth.tenant.id)}&assigned_user_id=eq.${encodeURIComponent(auth.user.id)}`,
          patch
        );
        return sendJson(res, 200, { ok: true, work_order: updated[0] || null });
      }

      return sendJson(res, 400, { ok: false, error: 'Bilinmeyen işlem' });
    }

    return sendJson(res, 405, { ok: false, error: 'Desteklenmeyen HTTP metodu' });
  } catch (err) {
    console.error('app-sync error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
