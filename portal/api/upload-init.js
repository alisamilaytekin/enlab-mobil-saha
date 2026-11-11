import crypto from 'node:crypto';
import {
  handlePreflight,
  sendJson,
  readJsonBody,
  extractAdminKey,
  verifyAdminKey,
  extractFolderWriteToken,
  signFolderWriteToken,
  verifyFolderWriteToken,
  extractAccountWriteToken,
  signAccountWriteToken,
  verifyAccountWriteToken,
  isServerReadyForAppUpload,
  getOrigin,
  sanitizeCompanySlug,
  normalizeUsername,
  prefixedRandomSlug,
  randomSlug,
  randomVerifyCode,
  hashPin,
  verifyPin,
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

  const providedAdminKey = extractAdminKey(req);
  const isAdmin = Boolean(providedAdminKey && verifyAdminKey(req));
  if (providedAdminKey && !isAdmin) {
    return sendJson(res, 401, { ok: false, error: 'Geçersiz yönetici anahtarı' });
  }
  if (!isServerReadyForAppUpload()) {
    return sendJson(res, 500, { ok: false, error: 'Portal sunucusu yapılandırılmamış' });
  }

  try {
    const body = await readJsonBody(req, 512 * 1024);
    const fIn = body.folder || {};
    const rIn = body.report || {};
    const cIn = body.customer && typeof body.customer === 'object' ? body.customer : null;

    const companyName = String(fIn.company_name || 'Müşteri Firma').trim().slice(0, 200);
    const localWoId = fIn.local_wo_id ? String(fIn.local_wo_id).trim().slice(0, 120) : '';
    const requestedFolderSlug = fIn.slug ? String(fIn.slug).trim() : '';
    const writeToken = extractFolderWriteToken(req, fIn) || extractFolderWriteToken(req, body);

    const brandingJson = fIn.branding_json || {};
    const ownerCompanyName = String(
      fIn.owner_company_name || brandingJson.companyShortName || brandingJson.companyFullName || ''
    ).trim().slice(0, 120);
    const ownerCompanySlug = sanitizeCompanySlug(
      fIn.owner_company_slug || ownerCompanyName || brandingJson.companyShortName || ''
    );

    // 0. Resolve or provision customer firm login account (multi-tenant isolation)
    let customerRow = null;
    let customerCreated = false;
    if (cIn && (cIn.id || cIn.username)) {
      if (isAdmin && cIn.id) {
        const foundById = await dbSelect(
          'portal_customer_accounts',
          `id=eq.${encodeURIComponent(String(cIn.id).trim())}&limit=1`
        );
        if (!foundById[0]) {
          return sendJson(res, 404, { ok: false, error: 'Seçilen müşteri hesabı bulunamadı' });
        }
        customerRow = foundById[0];
      } else if (cIn.username) {
        const reqUsername = normalizeUsername(cIn.username);
        if (!reqUsername || reqUsername.length < 3) {
          return sendJson(res, 400, {
            ok: false,
            error: 'Müşteri kullanıcı adı en az 3 karakter olmalıdır (harf, rakam, tire).'
          });
        }

        const reqPassword = String(cIn.password || '').trim();
        const reqCompanyName = String(cIn.company_name || companyName || 'Müşteri Firma').trim().slice(0, 200);
        const autoUsername = Boolean(cIn.auto_username);
        const updatePassword = Boolean(cIn.update_password);
        const acctWriteToken = extractAccountWriteToken(req, cIn) || extractAccountWriteToken(req, body);

        const existingRows = await dbSelect(
          'portal_customer_accounts',
          `username=eq.${encodeURIComponent(reqUsername)}&limit=1`
        );
        const existingAcct = existingRows[0] || null;

        if (existingAcct) {
          const hasAcctToken = verifyAccountWriteToken(acctWriteToken, existingAcct.id);
          const matchesPwd = Boolean(reqPassword && verifyPin(reqPassword, existingAcct.password_hash));

          if (isAdmin || hasAcctToken || matchesPwd) {
            if (existingAcct.is_active === false && !isAdmin) {
              return sendJson(res, 403, {
                ok: false,
                error: 'Bu müşteri hesabı pasif durumda olduğu için yükleme yapılamaz.'
              });
            }
            if ((isAdmin || hasAcctToken) && updatePassword && reqPassword) {
              if (reqPassword.length < 4) {
                return sendJson(res, 400, {
                  ok: false,
                  error: 'Müşteri şifresi en az 4 karakter olmalıdır.'
                });
              }
              const nextVer = Number(existingAcct.token_version || 1) + 1;
              const updatedAcct = await dbUpdate(
                'portal_customer_accounts',
                `id=eq.${encodeURIComponent(existingAcct.id)}`,
                {
                  password_hash: hashPin(reqPassword),
                  token_version: nextVer,
                  updated_at: new Date().toISOString()
                }
              );
              customerRow = updatedAcct[0] || existingAcct;
            } else {
              customerRow = existingAcct;
            }
          } else if (autoUsername) {
            if (reqPassword.length < 4) {
              return sendJson(res, 400, {
                ok: false,
                error: 'Yeni müşteri hesabı için en az 4 karakterli şifre gereklidir.'
              });
            }
            let freeUsername = '';
            for (let attempt = 0; attempt < 6; attempt++) {
              const candidate = normalizeUsername(`${reqUsername.slice(0, 24)}-${randomSlug(4)}`);
              if (candidate.length < 3) continue;
              const check = await dbSelect(
                'portal_customer_accounts',
                `username=eq.${encodeURIComponent(candidate)}&select=id&limit=1`
              );
              if (!check.length) {
                freeUsername = candidate;
                break;
              }
            }
            if (!freeUsername) {
              return sendJson(res, 409, {
                ok: false,
                error: 'Benzersiz müşteri kullanıcı adı üretilemedi, lütfen farklı bir kullanıcı adı yazın.'
              });
            }
            customerRow = await dbInsert('portal_customer_accounts', {
              id: crypto.randomUUID(),
              username: freeUsername,
              company_name: reqCompanyName,
              company_key: sanitizeCompanySlug(reqCompanyName),
              owner_company_slug: ownerCompanySlug,
              owner_company_name: ownerCompanyName,
              password_hash: hashPin(reqPassword),
              is_active: true,
              token_version: 1
            });
            customerCreated = true;
          } else {
            return sendJson(res, 409, {
              ok: false,
              error:
                'Bu müşteri kullanıcı adı zaten başka bir firmada kayıtlı. Mevcut firmaya eklemek için doğru şifreyi girin ya da farklı bir kullanıcı adı belirleyin.'
            });
          }
        } else {
          if (reqPassword.length < 4) {
            return sendJson(res, 400, {
              ok: false,
              error: 'Yeni müşteri hesabı için en az 4 karakterli şifre gereklidir.'
            });
          }
          customerRow = await dbInsert('portal_customer_accounts', {
            id: crypto.randomUUID(),
            username: reqUsername,
            company_name: reqCompanyName,
            company_key: sanitizeCompanySlug(reqCompanyName),
            owner_company_slug: ownerCompanySlug,
            owner_company_name: ownerCompanyName,
            password_hash: hashPin(reqPassword),
            is_active: true,
            token_version: 1
          });
          customerCreated = true;
        }
      }
    }

    // 1. Find (with ownership check) or create folder
    let folderRow = null;
    if (requestedFolderSlug) {
      const found = await dbSelect(
        'portal_folders',
        `share_slug=eq.${encodeURIComponent(requestedFolderSlug)}&limit=1`
      );
      const candidate = found[0] || null;
      if (candidate && (isAdmin || verifyFolderWriteToken(writeToken, candidate.id))) {
        folderRow = candidate;
      }
    } else if (localWoId) {
      const filter = isAdmin
        ? `local_wo_id=eq.${encodeURIComponent(localWoId)}&limit=1`
        : `local_wo_id=eq.${encodeURIComponent(localWoId)}&owner_company_slug=eq.${encodeURIComponent(ownerCompanySlug)}&limit=1`;
      const found = await dbSelect('portal_folders', filter);
      const candidate = found[0] || null;
      if (candidate && (isAdmin || verifyFolderWriteToken(writeToken, candidate.id))) {
        folderRow = candidate;
      }
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
        owner_company_slug: ownerCompanySlug || folderRow.owner_company_slug || '',
        owner_company_name: ownerCompanyName || folderRow.owner_company_name || '',
        branding_json: Object.keys(brandingJson).length ? brandingJson : (folderRow.branding_json || {}),
        updated_at: new Date().toISOString()
      };
      if (customerRow) {
        patch.customer_account_id = customerRow.id;
        patch.require_auth = true;
      }
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
      const shareSlug = prefixedRandomSlug(ownerCompanySlug, 8);
      const hasPin = pinMode === 'set' && Boolean(cleanPin);
      folderRow = await dbInsert('portal_folders', {
        id: folderId,
        share_slug: shareSlug,
        work_order_code: String(fIn.work_order_code || ''),
        local_wo_id: localWoId,
        owner_company_slug: ownerCompanySlug,
        owner_company_name: ownerCompanyName,
        customer_account_id: customerRow ? customerRow.id : null,
        require_auth: Boolean(customerRow),
        company_name: companyName,
        company_branch: String(fIn.company_branch || ''),
        company_address: String(fIn.company_address || ''),
        contact_email: String(fIn.contact_email || ''),
        pin_hash: hasPin ? hashPin(cleanPin) : null,
        has_pin: hasPin,
        branding_json: brandingJson
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
        share_slug: prefixedRandomSlug(ownerCompanySlug, 8),
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
    const folderWriteToken = signFolderWriteToken(folderRow.id);

    return sendJson(res, 200, {
      ok: true,
      folder: {
        id: folderRow.id,
        share_slug: folderRow.share_slug,
        owner_company_slug: folderRow.owner_company_slug || '',
        owner_company_name: folderRow.owner_company_name || '',
        customer_account_id: folderRow.customer_account_id || null,
        require_auth: Boolean(folderRow.require_auth),
        has_pin: Boolean(folderRow.has_pin),
        write_token: folderWriteToken,
        url: `${origin}/p/${folderRow.share_slug}`
      },
      customer: customerRow
        ? {
            id: customerRow.id,
            username: customerRow.username,
            company_name: customerRow.company_name,
            write_token: signAccountWriteToken(customerRow.id),
            created: customerCreated
          }
        : null,
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
