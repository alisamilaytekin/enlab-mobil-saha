import {
  handlePreflight,
  sendJson,
  dbSelect,
  extractFolderToken,
  verifyFolderToken
} from './_lib/store.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Yalnızca GET desteklenir' });
  }

  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const slug = (urlObj.searchParams.get('slug') || '').trim();
    const reportNo = (urlObj.searchParams.get('report_no') || '').trim();
    const verifyCode = (urlObj.searchParams.get('verify_code') || '').trim().toUpperCase();

    let reports = [];
    if (slug) {
      reports = await dbSelect(
        'portal_reports',
        `share_slug=eq.${encodeURIComponent(slug)}&upload_ready=eq.true&limit=1`
      );
    } else if (reportNo && verifyCode) {
      reports = await dbSelect(
        'portal_reports',
        `report_no=ilike.${encodeURIComponent(reportNo)}&verify_code=eq.${encodeURIComponent(verifyCode)}&upload_ready=eq.true&limit=1`
      );
    } else {
      return sendJson(res, 400, { ok: false, error: 'Rapor kodu (slug) veya Rapor No + Doğrulama Kodu gerekli' });
    }

    const report = reports[0];
    if (!report) {
      return sendJson(res, 404, { ok: false, error: 'Rapor bulunamadı veya doğrulanamadı' });
    }

    const folders = await dbSelect(
      'portal_folders',
      `id=eq.${encodeURIComponent(report.folder_id)}&select=id,share_slug,work_order_code,company_name,company_branch,company_address,has_pin,branding_json&limit=1`
    );
    const folder = folders[0];
    if (!folder) {
      return sendJson(res, 404, { ok: false, error: 'İlişkili firma klasörü bulunamadı' });
    }

    const token = extractFolderToken(req, urlObj);
    const unlocked = !folder.has_pin || Boolean(verifyFolderToken(token, folder.share_slug));

    return sendJson(res, 200, {
      ok: true,
      verified: true,
      requiresPin: !unlocked,
      folder: {
        share_slug: folder.share_slug,
        work_order_code: folder.work_order_code,
        company_name: folder.company_name,
        company_branch: folder.company_branch,
        company_address: unlocked ? folder.company_address : '',
        has_pin: Boolean(folder.has_pin),
        branding_json: folder.branding_json || {}
      },
      report: {
        id: report.id,
        share_slug: report.share_slug,
        verify_code: report.verify_code,
        report_no: report.report_no,
        equipment_name: report.equipment_name,
        template_code: report.template_code,
        inspection_date: report.inspection_date,
        next_inspection_date: report.next_inspection_date,
        inspector_name: report.inspector_name,
        result_status: report.result_status,
        source_type: report.source_type,
        mime_type: report.mime_type,
        file_size_bytes: report.file_size_bytes,
        created_at: report.created_at,
        updated_at: report.updated_at
      }
    });
  } catch (err) {
    console.error('report error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
