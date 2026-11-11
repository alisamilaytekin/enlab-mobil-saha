import crypto from 'node:crypto';
import {
  handlePreflight,
  sendJson,
  readJsonBody,
  verifyAdminKey,
  getOrigin,
  randomSlug,
  randomVerifyCode,
  hashPin,
  dbSelect,
  dbInsert,
  dbUpdate,
  createSignedUploadUrl
} from './_lib/store.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Yalnızca POST desteklenir' });
  }
  if (!verifyAdminKey(req)) {
    return sendJson(res, 401, { ok: false, error: 'Geçersiz yönetici anahtarı' });
  }

  try {
    const body = await readJsonBody(req, 512 * 1024);
    const fIn = body.folder || {};
    const rIn = body.report || {};

    const companyName = String(fIn.company_name || 'Müşteri Firma').trim().slice(0, 200);
    const localWoId = fIn.local_wo_id ? String(fIn.local_wo_id).trim().slice(0, 120) : '';
    const requestedFolderSlug = fIn.slug ? String(fIn.slug).trim() : '';

    // 1. Find or create folder
    let folderRow = null;
    if (requestedFolderSlug) {
      const found = await dbSelect(
        'portal_folders',
        `share_slug=eq.${encodeURIComponent(requestedFolderSlug)}&limit=1`
      );
      folderRow = found[0] || null;
    } else if (localWoId) {
      const found = await dbSelect(
        'portal_folders',
        `local_wo_id=eq.${encodeURIComponent(localWoId)}&limit=1`
      );
      folderRow = found[0] || null;
    }

    const pinMode = fIn.pin_mode || (fIn.pin ? 'set' : 'keep');
    const cleanPin = String(fIn.pin || '').trim();

    if (folderRow) {
      const patch = {
        company_name: companyName || folderRow.company_name,
        company_branch: fIn.company_branch !== undefined ? String(fIn.company_branch || '') : folderRow.company_branch,
        company_address: fIn.company_address !== undefined ? String(fIn.company_address || '') : folderRow.company_address,
        contact_email: fIn.contact_email !== undefined ? String(fIn.contact_email || '') : folderRow.contact_email,
        work_order_code: fIn.work_order_code !== undefined ? String(fIn.work_order_code || '') : folderRow.work_order_code,
        branding_json: fIn.branding_json || folderRow.branding_json || {},
        updated_at: new Date().toISOString()
      };
      if (pinMode === 'set' && cleanPin) {
        patch.pin_hash = hashPin(cleanPin);
        patch.has_pin = true;
      } else if (pinMode === 'clear') {
        patch.pin_hash = null;
        patch.has_pin = false;
      }
      const updated = await dbUpdate('portal_folders', `id=eq.${folderRow.id}`, patch);
      folderRow = updated[0] || Object.assign({}, folderRow, patch);
    } else {
      const folderId = crypto.randomUUID();
      const shareSlug = randomSlug(8);
      const hasPin = pinMode === 'set' && Boolean(cleanPin);
      folderRow = await dbInsert('portal_folders', {
        id: folderId,
        share_slug: shareSlug,
        work_order_code: String(fIn.work_order_code || ''),
        local_wo_id: localWoId,
        company_name: companyName,
        company_branch: String(fIn.company_branch || ''),
        company_address: String(fIn.company_address || ''),
        contact_email: String(fIn.contact_email || ''),
        pin_hash: hasPin ? hashPin(cleanPin) : null,
        has_pin: hasPin,
        branding_json: fIn.branding_json || {}
      });
    }

    // 2. Find or create report
    const sourceType = rIn.source_type === 'uploaded_pdf' ? 'uploaded_pdf' : 'app_html';
    const ext = sourceType === 'uploaded_pdf' ? 'pdf' : 'html';
    const mimeType = sourceType === 'uploaded_pdf' ? 'application/pdf' : 'text/html';
    const localInspId = rIn.local_inspection_id ? String(rIn.local_inspection_id).trim().slice(0, 120) : '';

    let reportRow = null;
    if (localInspId && sourceType === 'app_html') {
      const existing = await dbSelect(
        'portal_reports',
        `folder_id=eq.${folderRow.id}&local_inspection_id=eq.${encodeURIComponent(localInspId)}&limit=1`
      );
      reportRow = existing[0] || null;
    }

    if (reportRow) {
      const storagePath = reportRow.storage_path || `folders/${folderRow.id}/${reportRow.id}.${ext}`;
      const patch = {
        report_no: String(rIn.report_no || reportRow.report_no || 'RAPOR').slice(0, 120),
        equipment_name: String(rIn.equipment_name || reportRow.equipment_name || 'Ekipman').slice(0, 200),
        template_code: String(rIn.template_code || reportRow.template_code || '').slice(0, 80),
        inspection_date: String(rIn.inspection_date || reportRow.inspection_date || '').slice(0, 40),
        next_inspection_date: String(rIn.next_inspection_date || reportRow.next_inspection_date || '').slice(0, 40),
        inspector_name: String(rIn.inspector_name || reportRow.inspector_name || '').slice(0, 120),
        result_status: String(rIn.result_status || reportRow.result_status || 'UYGUN').slice(0, 60),
        source_type: sourceType,
        mime_type: sourceType === 'uploaded_pdf' ? 'application/pdf' : 'text/html',
        storage_path: storagePath,
        updated_at: new Date().toISOString()
      };
      const updated = await dbUpdate('portal_reports', `id=eq.${reportRow.id}`, patch);
      reportRow = updated[0] || Object.assign({}, reportRow, patch);
    } else {
      const reportId = crypto.randomUUID();
      const storagePath = `folders/${folderRow.id}/${reportId}.${ext}`;
      reportRow = await dbInsert('portal_reports', {
        id: reportId,
        folder_id: folderRow.id,
        share_slug: randomSlug(8),
        verify_code: randomVerifyCode(),
        local_inspection_id: localInspId,
        report_no: String(rIn.report_no || `RPR-${Date.now().toString().slice(-6)}`).slice(0, 120),
        equipment_name: String(rIn.equipment_name || 'Periyodik Kontrol Raporu').slice(0, 200),
        template_code: String(rIn.template_code || '').slice(0, 80),
        inspection_date: String(rIn.inspection_date || '').slice(0, 40),
        next_inspection_date: String(rIn.next_inspection_date || '').slice(0, 40),
        inspector_name: String(rIn.inspector_name || '').slice(0, 120),
        result_status: String(rIn.result_status || 'UYGUN').slice(0, 60),
        source_type: sourceType,
        storage_path: storagePath,
        mime_type: sourceType === 'uploaded_pdf' ? 'application/pdf' : 'text/html',
        file_size_bytes: 0,
        upload_ready: false
      });
    }

    // 3. Create Supabase Signed Upload URL
    const uploadUrl = await createSignedUploadUrl(reportRow.storage_path);
    const origin = getOrigin(req);

    return sendJson(res, 200, {
      ok: true,
      folder: {
        id: folderRow.id,
        share_slug: folderRow.share_slug,
        has_pin: Boolean(folderRow.has_pin),
        url: `${origin}/p/${folderRow.share_slug}`
      },
      report: {
        id: reportRow.id,
        share_slug: reportRow.share_slug,
        verify_code: reportRow.verify_code,
        url: `${origin}/r/${reportRow.share_slug}`
      },
      uploadUrl,
      uploadMethod: 'PUT',
      contentType: mimeType,
      storagePath: reportRow.storage_path
    });
  } catch (err) {
    console.error('upload-init error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
