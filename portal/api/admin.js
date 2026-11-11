import {
  handlePreflight,
  sendJson,
  readJsonBody,
  verifyAdminKey,
  getOrigin,
  hashPin,
  dbSelect,
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

      const folders = await dbSelect(
        'portal_folders',
        'select=id,share_slug,work_order_code,local_wo_id,company_name,company_branch,company_address,contact_email,has_pin,created_at,updated_at&order=updated_at.desc'
      );
      const reports = await dbSelect(
        'portal_reports',
        'upload_ready=eq.true&select=id,folder_id,share_slug,verify_code,report_no,equipment_name,template_code,inspection_date,inspector_name,result_status,source_type,file_size_bytes,created_at,updated_at&order=created_at.desc'
      );

      const reportsByFolder = new Map();
      for (const r of reports) {
        if (!reportsByFolder.has(r.folder_id)) reportsByFolder.set(r.folder_id, []);
        reportsByFolder.get(r.folder_id).push({
          ...r,
          url: `${origin}/r/${r.share_slug}`
        });
      }

      let items = folders.map(f => ({
        ...f,
        url: `${origin}/p/${f.share_slug}`,
        reports: reportsByFolder.get(f.id) || []
      }));

      if (q) {
        items = items.filter(f =>
          (f.company_name || '').toLowerCase().includes(q) ||
          (f.company_branch || '').toLowerCase().includes(q) ||
          (f.work_order_code || '').toLowerCase().includes(q) ||
          f.reports.some(r =>
            (r.equipment_name || '').toLowerCase().includes(q) ||
            (r.report_no || '').toLowerCase().includes(q) ||
            (r.verify_code || '').toLowerCase().includes(q)
          )
        );
      }

      return sendJson(res, 200, {
        ok: true,
        totals: {
          folders: folders.length,
          reports: reports.length
        },
        folders: items
      });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req, 64 * 1024);
      const action = String(body.action || '').trim();

      if (action === 'update-folder') {
        const folderId = String(body.folder_id || '').trim();
        if (!folderId) return sendJson(res, 400, { ok: false, error: 'folder_id gerekli' });
        const patch = { updated_at: new Date().toISOString() };
        if (body.company_name !== undefined) patch.company_name = String(body.company_name).trim();
        if (body.company_branch !== undefined) patch.company_branch = String(body.company_branch).trim();
        if (body.company_address !== undefined) patch.company_address = String(body.company_address).trim();
        if (body.contact_email !== undefined) patch.contact_email = String(body.contact_email).trim();
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
