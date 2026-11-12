import crypto from 'node:crypto';
import {
  handlePreflight,
  sendJson,
  readJsonBody,
  verifyPin,
  normalizeUsername,
  sanitizeCompanySlug,
  sanitizeTenantPublic,
  sanitizeSaasUserPublic,
  signSaasSessionToken,
  signFolderWriteToken,
  getOrigin,
  resolveAuthenticatedSaasUser,
  dbSelect,
  dbInsert,
  dbUpdate,
  dbDelete
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

function formatSavedReportForApp(row) {
  return {
    id: row.id,
    work_order_id: row.work_order_id,
    client_report_key: row.client_report_key || '',
    template_id: String(row.template_id || '2201'),
    template_code: row.template_code || 'TKM-FR.318',
    report_no: row.report_no || '',
    equipment_name: row.equipment_name || '',
    serial_no: row.serial_no || '',
    location: row.location || '',
    status: row.status || 'Tamamlanacak',
    result: row.result || 'UYGUN',
    inspection_date: row.inspection_date || '',
    portal_report_slug: row.portal_report_slug || '',
    portal_report_url: row.portal_report_url || '',
    portal_verify_code: row.portal_verify_code || '',
    portal_folder_slug: row.portal_folder_slug || '',
    portal_folder_url: row.portal_folder_url || '',
    form_data_json: row.form_data_json && typeof row.form_data_json === 'object' ? row.form_data_json : {},
    client_updated_at: row.client_updated_at || row.updated_at,
    updated_at: row.updated_at
  };
}

async function buildSyncPayload(user, tenant, origin = '') {
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

  let savedReports = [];
  const folderByWoCode = new Map();
  const portalReportsByFolderId = new Map();

  if (workOrdersRows.length > 0) {
    const woIds = workOrdersRows.map(w => w.id).filter(Boolean);
    if (woIds.length > 0) {
      try {
        const savedRows = await dbSelect(
          'saas_saved_reports',
          `tenant_id=eq.${encodeURIComponent(tenant.id)}&work_order_id=in.(${woIds.join(',')})&order=updated_at.asc`
        );
        savedReports = savedRows.map(formatSavedReportForApp);
      } catch (e) {
        console.warn('saas_saved_reports select warning:', e?.message || e);
      }
    }

    const woCodes = Array.from(
      new Set(workOrdersRows.map(w => String(w.work_order_code || '').trim()).filter(Boolean))
    );
    if (woCodes.length > 0) {
      try {
        const tenantBranding = tenant.branding_json && typeof tenant.branding_json === 'object' ? tenant.branding_json : {};
        const expectedOwnerSlug = sanitizeCompanySlug(
          tenantBranding.companyShortName || tenantBranding.companyFullName || tenant.name || tenant.slug || ''
        );
        const encodedCodes = woCodes.map(c => `"${c.replace(/"/g, '')}"`).join(',');
        const folders = await dbSelect(
          'portal_folders',
          `work_order_code=in.(${encodedCodes})&order=updated_at.desc`
        );
        for (const f of folders) {
          if (expectedOwnerSlug && f.owner_company_slug && f.owner_company_slug !== expectedOwnerSlug) {
            continue;
          }
          if (!folderByWoCode.has(f.work_order_code)) {
            folderByWoCode.set(f.work_order_code, f);
          }
        }
        const matchedFolderIds = Array.from(folderByWoCode.values()).map(f => f.id).filter(Boolean);
        if (matchedFolderIds.length > 0) {
          const pReports = await dbSelect(
            'portal_reports',
            `folder_id=in.(${matchedFolderIds.join(',')})&upload_ready=eq.true&select=id,folder_id,share_slug,verify_code,report_no,equipment_name,template_code,inspection_date,inspector_name,result_status,updated_at&order=updated_at.desc`
          );
          for (const pr of pReports) {
            const arr = portalReportsByFolderId.get(pr.folder_id) || [];
            arr.push({
              share_slug: pr.share_slug,
              report_url: origin ? `${origin}/r/${pr.share_slug}` : '',
              verify_code: pr.verify_code || '',
              report_no: pr.report_no || '',
              equipment_name: pr.equipment_name || '',
              template_code: pr.template_code || '',
              inspection_date: pr.inspection_date || '',
              result_status: pr.result_status || 'UYGUN',
              updated_at: pr.updated_at
            });
            portalReportsByFolderId.set(pr.folder_id, arr);
          }
        }
      } catch (e) {
        console.warn('portal_folders/portal_reports link warning:', e?.message || e);
      }
    }
  }

  return {
    user: sanitizeSaasUserPublic(user),
    tenant: sanitizeTenantPublic(tenant),
    devices: assignedDevices,
    work_orders: workOrdersRows.map(wo => {
      const pf = folderByWoCode.get(wo.work_order_code || '') || null;
      return {
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
        portal_folder_slug: pf ? pf.share_slug : '',
        portal_folder_url: pf && origin ? `${origin}/p/${pf.share_slug}` : '',
        portal_write_token: pf ? signFolderWriteToken(pf.id) : '',
        portal_reports: pf ? (portalReportsByFolderId.get(pf.id) || []) : [],
        created_at: wo.created_at,
        updated_at: wo.updated_at
      };
    }),
    saved_reports: savedReports,
    synced_at: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const origin = getOrigin(req);

    if (req.method === 'GET') {
      const auth = await resolveAuthenticatedSaasUser(req, urlObj, 'app');
      if (!auth) {
        return sendJson(res, 401, { ok: false, error: 'Uygulama oturumu geçersiz veya süresi dolmuş.' });
      }
      const syncData = await buildSyncPayload(auth.user, auth.tenant, origin);
      return sendJson(res, 200, { ok: true, ...syncData });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req, 4 * 1024 * 1024);
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
        const syncData = await buildSyncPayload(user, tenant, origin);
        return sendJson(res, 200, { ok: true, token, ...syncData });
      }

      if (action === 'save-report') {
        const auth = await resolveAuthenticatedSaasUser(req, urlObj, 'app');
        if (!auth) {
          return sendJson(res, 401, { ok: false, error: 'Oturum geçersiz.' });
        }
        const woId = String(body.work_order_id || '').trim();
        const clientReportKey = String(body.client_report_key || '').trim().slice(0, 120);
        if (!woId || !clientReportKey) {
          return sendJson(res, 400, { ok: false, error: 'work_order_id ve client_report_key gereklidir.' });
        }

        const woRows = await dbSelect(
          'saas_work_orders',
          `id=eq.${encodeURIComponent(woId)}&tenant_id=eq.${encodeURIComponent(auth.tenant.id)}&assigned_user_id=eq.${encodeURIComponent(auth.user.id)}&limit=1`
        );
        const wo = woRows[0];
        if (!wo) {
          return sendJson(res, 404, { ok: false, error: 'İş emri bulunamadı veya yetkiniz yok.' });
        }

        let formDataJson = {};
        if (body.form_data_json && typeof body.form_data_json === 'object') {
          formDataJson = body.form_data_json;
        } else if (typeof body.form_data_json === 'string' && body.form_data_json.trim()) {
          try {
            formDataJson = JSON.parse(body.form_data_json);
          } catch {
            formDataJson = {};
          }
        }

        const nowIso = new Date().toISOString();
        const clientUpdatedAt = body.client_updated_at && !Number.isNaN(Date.parse(body.client_updated_at))
          ? new Date(body.client_updated_at).toISOString()
          : nowIso;

        const reportPayload = {
          tenant_id: auth.tenant.id,
          work_order_id: wo.id,
          user_id: auth.user.id,
          client_report_key: clientReportKey,
          template_id: String(body.template_id || '2201').slice(0, 40),
          template_code: String(body.template_code || 'TKM-FR.318').slice(0, 80),
          report_no: String(body.report_no || '').slice(0, 120),
          equipment_name: String(body.equipment_name || '').slice(0, 240),
          serial_no: String(body.serial_no || '').slice(0, 120),
          location: String(body.location || '').slice(0, 240),
          status: String(body.status || 'Tamamlanacak').slice(0, 60),
          result: String(body.result || 'UYGUN').slice(0, 60),
          inspection_date: String(body.inspection_date || '').slice(0, 40),
          portal_report_slug: String(body.portal_report_slug || '').slice(0, 120),
          portal_report_url: String(body.portal_report_url || '').slice(0, 500),
          portal_verify_code: String(body.portal_verify_code || '').slice(0, 40),
          portal_folder_slug: String(body.portal_folder_slug || '').slice(0, 120),
          portal_folder_url: String(body.portal_folder_url || '').slice(0, 500),
          form_data_json: formDataJson,
          client_updated_at: clientUpdatedAt,
          updated_at: nowIso
        };

        const existingRows = await dbSelect(
          'saas_saved_reports',
          `work_order_id=eq.${encodeURIComponent(wo.id)}&client_report_key=eq.${encodeURIComponent(clientReportKey)}&limit=1`
        );
        let savedRow = null;
        if (existingRows[0]) {
          const updated = await dbUpdate(
            'saas_saved_reports',
            `id=eq.${encodeURIComponent(existingRows[0].id)}`,
            reportPayload
          );
          savedRow = updated[0] || existingRows[0];
        } else {
          savedRow = await dbInsert('saas_saved_reports', {
            id: crypto.randomUUID(),
            ...reportPayload
          });
        }

        if (wo.status === 'open') {
          await dbUpdate('saas_work_orders', `id=eq.${encodeURIComponent(wo.id)}`, {
            status: 'in_progress',
            updated_at: nowIso
          });
        }

        return sendJson(res, 200, { ok: true, report: formatSavedReportForApp(savedRow) });
      }

      if (action === 'delete-report') {
        const auth = await resolveAuthenticatedSaasUser(req, urlObj, 'app');
        if (!auth) {
          return sendJson(res, 401, { ok: false, error: 'Oturum geçersiz.' });
        }
        const woId = String(body.work_order_id || '').trim();
        const clientReportKey = String(body.client_report_key || '').trim();
        if (!woId || !clientReportKey) {
          return sendJson(res, 400, { ok: false, error: 'work_order_id ve client_report_key gereklidir.' });
        }
        await dbDelete(
          'saas_saved_reports',
          `tenant_id=eq.${encodeURIComponent(auth.tenant.id)}&user_id=eq.${encodeURIComponent(auth.user.id)}&work_order_id=eq.${encodeURIComponent(woId)}&client_report_key=eq.${encodeURIComponent(clientReportKey)}`
        );
        return sendJson(res, 200, { ok: true });
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
