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
    if (!slug) {
      return sendJson(res, 400, { ok: false, error: 'Klasör kodu (slug) gerekli' });
    }

    const folders = await dbSelect(
      'portal_folders',
      `share_slug=eq.${encodeURIComponent(slug)}&select=id,share_slug,work_order_code,company_name,company_branch,company_address,has_pin,branding_json,created_at,updated_at&limit=1`
    );
    const folder = folders[0];
    if (!folder) {
      return sendJson(res, 404, { ok: false, error: 'Müşteri rapor klasörü bulunamadı' });
    }

    if (folder.has_pin) {
      const token = extractFolderToken(req, urlObj);
      const verified = verifyFolderToken(token, folder.share_slug);
      if (!verified) {
        return sendJson(res, 200, {
          ok: true,
          requiresPin: true,
          folder: {
            share_slug: folder.share_slug,
            company_name: folder.company_name,
            company_branch: folder.company_branch,
            has_pin: true,
            branding_json: folder.branding_json || {}
          },
          reports: []
        });
      }
    }

    const reports = await dbSelect(
      'portal_reports',
      `folder_id=eq.${folder.id}&upload_ready=eq.true&order=created_at.desc&select=id,share_slug,verify_code,report_no,equipment_name,template_code,inspection_date,next_inspection_date,inspector_name,result_status,source_type,mime_type,file_size_bytes,created_at,updated_at`
    );

    return sendJson(res, 200, {
      ok: true,
      requiresPin: false,
      folder,
      reports
    });
  } catch (err) {
    console.error('folder error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
