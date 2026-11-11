import {
  handlePreflight,
  setCors,
  sendJson,
  dbSelect,
  extractFolderToken,
  verifyFolderToken,
  downloadStorageObject,
  sanitizeReportHtml
} from './_lib/store.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Yalnızca GET desteklenir' });
  }

  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const slug = (urlObj.searchParams.get('slug') || '').trim();
    const download = urlObj.searchParams.get('download') === '1';
    const format = (urlObj.searchParams.get('format') || '').trim();

    if (!slug) {
      return sendJson(res, 400, { ok: false, error: 'Rapor kodu (slug) gerekli' });
    }

    const reports = await dbSelect(
      'portal_reports',
      `share_slug=eq.${encodeURIComponent(slug)}&upload_ready=eq.true&limit=1`
    );
    const report = reports[0];
    if (!report) {
      return sendJson(res, 404, { ok: false, error: 'Rapor bulunamadı' });
    }

    const folders = await dbSelect(
      'portal_folders',
      `id=eq.${encodeURIComponent(report.folder_id)}&select=id,share_slug,has_pin&limit=1`
    );
    const folder = folders[0];
    if (!folder) {
      return sendJson(res, 404, { ok: false, error: 'Klasör bulunamadı' });
    }

    if (folder.has_pin) {
      const token = extractFolderToken(req, urlObj);
      if (!verifyFolderToken(token, folder.share_slug)) {
        return sendJson(res, 403, { ok: false, error: 'Bu raporu görüntülemek için erişim şifresi (PIN) gereklidir' });
      }
    }

    const storageRes = await downloadStorageObject(report.storage_path);
    if (!storageRes.ok) {
      return sendJson(res, 404, { ok: false, error: 'Rapor dosyası depolama alanında bulunamadı' });
    }

    if (report.source_type === 'uploaded_pdf' || report.mime_type === 'application/pdf') {
      const buf = Buffer.from(await storageRes.arrayBuffer());
      const safeName = String(report.report_no || report.equipment_name || 'Rapor')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 60);
      setCors(res);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${safeName}.pdf"`);
      res.setHeader('Content-Length', String(buf.length));
      res.end(buf);
      return;
    }

    const rawHtml = await storageRes.text();
    const safeHtml = sanitizeReportHtml(rawHtml);

    if (format === 'json') {
      return sendJson(res, 200, { ok: true, html: safeHtml });
    }

    setCors(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:;"
    );
    res.end(safeHtml);
  } catch (err) {
    console.error('report-file error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası' });
  }
}
