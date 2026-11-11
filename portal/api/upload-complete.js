import {
  handlePreflight,
  sendJson,
  readJsonBody,
  extractAdminKey,
  verifyAdminKey,
  extractFolderWriteToken,
  verifyFolderWriteToken,
  getOrigin,
  dbSelect,
  dbUpdate
} from './_lib/store.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Yalnızca POST desteklenir' });
  }

  const providedAdminKey = extractAdminKey(req);
  const isAdmin = Boolean(providedAdminKey && verifyAdminKey(req));
  if (providedAdminKey && !isAdmin) {
    return sendJson(res, 401, { ok: false, error: 'Geçersiz yönetici anahtarı' });
  }

  try {
    const body = await readJsonBody(req, 64 * 1024);
    const reportId = String(body.report_id || '').trim();
    if (!reportId) {
      return sendJson(res, 400, { ok: false, error: 'report_id gerekli' });
    }

    const found = await dbSelect('portal_reports', `id=eq.${encodeURIComponent(reportId)}&limit=1`);
    const report = found[0];
    if (!report) {
      return sendJson(res, 404, { ok: false, error: 'Rapor kaydı bulunamadı' });
    }

    const writeToken = extractFolderWriteToken(req, body);
    const hasWriteAccess = isAdmin || verifyFolderWriteToken(writeToken, report.folder_id);
    if (!hasWriteAccess) {
      return sendJson(res, 401, { ok: false, error: 'Yükleme doğrulama anahtarı geçersiz' });
    }

    const folders = await dbSelect('portal_folders', `id=eq.${encodeURIComponent(report.folder_id)}&limit=1`);
    const folder = folders[0];

    const updatedRows = await dbUpdate('portal_reports', `id=eq.${encodeURIComponent(reportId)}`, {
      upload_ready: true,
      file_size_bytes: Number(body.file_size_bytes || report.file_size_bytes || 0),
      updated_at: new Date().toISOString()
    });
    const finalReport = updatedRows[0] || report;
    const origin = getOrigin(req);

    return sendJson(res, 200, {
      ok: true,
      folderUrl: folder ? `${origin}/p/${folder.share_slug}` : '',
      folderSlug: folder ? folder.share_slug : '',
      reportUrl: `${origin}/r/${finalReport.share_slug}`,
      reportSlug: finalReport.share_slug,
      verifyCode: finalReport.verify_code
    });
  } catch (err) {
    console.error('upload-complete error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
