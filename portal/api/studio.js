import {
  handlePreflight,
  sendJson,
  readJsonBody,
  sanitizeTenantPublic,
  sanitizeSaasUserPublic,
  resolveAuthenticatedSaasUser,
  dbSelect,
  dbInsert,
  dbUpdate
} from './_lib/store.js';

function sanitizeTemplateKey(raw) {
  const trMap = {
    ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u',
    Ç: 'c', Ğ: 'g', I: 'i', Ö: 'o', Ş: 's', Ü: 'u'
  };
  const replaced = String(raw || '').trim().replace(/[çğıİöşüÇĞIÖŞÜ]/g, ch => trMap[ch] || ch);
  const cleaned = replaced
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 64);
  return cleaned || `sablon-${Date.now().toString(36)}`;
}

function formatVersionPublic(row) {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    template_key: row.template_key,
    version_number: Number(row.version_number || 1),
    version_label: row.version_label || `v${row.version_number || 1}`,
    title: row.title || 'Adsız Şablon',
    category: row.category || 'Elektrik',
    form_code: row.form_code || 'FR.100',
    changelog: row.changelog || '',
    is_published: Boolean(row.is_published),
    is_archived: Boolean(row.is_archived),
    schema_json: row.schema_json && typeof row.schema_json === 'object' ? row.schema_json : {},
    created_by: row.created_by || null,
    created_by_name: row.created_by_name || '',
    created_at: row.created_at || null
  };
}

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;

  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const auth = await resolveAuthenticatedSaasUser(req, urlObj, 'manager');
    if (!auth) {
      return sendJson(res, 401, {
        ok: false,
        error: 'Bulut kayıt için firma yöneticisi oturumu gereklidir.'
      });
    }

    const { user, tenant } = auth;

    if (req.method === 'GET') {
      const includeArchived = urlObj.searchParams.get('archived') === '1';
      const filter = includeArchived
        ? `tenant_id=eq.${encodeURIComponent(tenant.id)}&order=template_key.asc,version_number.desc`
        : `tenant_id=eq.${encodeURIComponent(tenant.id)}&is_archived=eq.false&order=template_key.asc,version_number.desc`;

      const rows = await dbSelect('saas_template_versions', filter);
      return sendJson(res, 200, {
        ok: true,
        manager: sanitizeSaasUserPublic(user),
        tenant: sanitizeTenantPublic(tenant),
        versions: rows.map(formatVersionPublic)
      });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req, 2 * 1024 * 1024);
      const action = String(body.action || '').trim();

      // 1) YENİ VERSİYON KAYDET (ASLA ÜSTÜNE YAZMAZ: v1 -> v2 -> v3...)
      if (action === 'save_version') {
        const schema = body.schema_json && typeof body.schema_json === 'object' ? body.schema_json : null;
        if (!schema) {
          return sendJson(res, 400, { ok: false, error: 'Geçerli bir şablon şeması (schema_json) gereklidir.' });
        }

        const title = String(body.title || schema.title || '').trim();
        if (!title) {
          return sendJson(res, 400, { ok: false, error: 'Şablon başlığı boş olamaz.' });
        }

        const templateKey = sanitizeTemplateKey(body.template_key || schema.template_key || title);
        const category = String(body.category || schema.category || 'Elektrik').trim().slice(0, 64);
        const formCode = String(body.form_code || schema.form_code || 'FR.100').trim().slice(0, 48);
        const changelog = String(body.changelog || '').trim().slice(0, 500);
        const publish = Boolean(body.publish);

        const existingRows = await dbSelect(
          'saas_template_versions',
          `tenant_id=eq.${encodeURIComponent(tenant.id)}&template_key=eq.${encodeURIComponent(templateKey)}&select=id,version_number&order=version_number.desc&limit=1`
        );
        const maxVersion = existingRows.length > 0 ? Number(existingRows[0].version_number || 0) : 0;
        const nextVersion = maxVersion + 1;
        const versionLabel = `v${nextVersion}`;

        if (publish && maxVersion > 0) {
          await dbUpdate(
            'saas_template_versions',
            `tenant_id=eq.${encodeURIComponent(tenant.id)}&template_key=eq.${encodeURIComponent(templateKey)}&is_published=eq.true`,
            { is_published: false }
          );
        }

        const schemaToStore = Object.assign({}, schema, {
          template_key: templateKey,
          version_number: nextVersion,
          version_label: versionLabel,
          title,
          category,
          form_code: formCode
        });

        const inserted = await dbInsert('saas_template_versions', {
          tenant_id: tenant.id,
          template_key: templateKey,
          version_number: nextVersion,
          version_label: versionLabel,
          title,
          category,
          form_code: formCode,
          changelog: changelog || (nextVersion === 1 ? 'İlk sürüm oluşturuldu' : `${versionLabel} güncellemesi`),
          is_published: publish || nextVersion === 1,
          is_archived: false,
          schema_json: schemaToStore,
          created_by: user.id,
          created_by_name: user.full_name || user.username || 'Yönetici'
        });

        const created = Array.isArray(inserted) ? inserted[0] : inserted;
        return sendJson(res, 200, {
          ok: true,
          version: formatVersionPublic(created)
        });
      }

      // 2) SEÇİLİ VERSİYONU YAYINA AL (ESKİLERİ SİLMEZ)
      if (action === 'publish_version') {
        const versionId = String(body.version_id || '').trim();
        if (!versionId) {
          return sendJson(res, 400, { ok: false, error: 'version_id gereklidir.' });
        }

        const rows = await dbSelect(
          'saas_template_versions',
          `id=eq.${encodeURIComponent(versionId)}&tenant_id=eq.${encodeURIComponent(tenant.id)}&limit=1`
        );
        const target = rows[0];
        if (!target) {
          return sendJson(res, 404, { ok: false, error: 'Şablon versiyonu bulunamadı.' });
        }

        await dbUpdate(
          'saas_template_versions',
          `tenant_id=eq.${encodeURIComponent(tenant.id)}&template_key=eq.${encodeURIComponent(target.template_key)}&is_published=eq.true`,
          { is_published: false }
        );
        const updated = await dbUpdate(
          'saas_template_versions',
          `id=eq.${encodeURIComponent(target.id)}&tenant_id=eq.${encodeURIComponent(tenant.id)}`,
          { is_published: true, is_archived: false }
        );

        const row = Array.isArray(updated) ? updated[0] : target;
        return sendJson(res, 200, {
          ok: true,
          version: formatVersionPublic(row)
        });
      }

      // 3) VERSİYONU ARŞİVLE (SİLMEZ)
      if (action === 'archive_version') {
        const versionId = String(body.version_id || '').trim();
        if (!versionId) {
          return sendJson(res, 400, { ok: false, error: 'version_id gereklidir.' });
        }

        await dbUpdate(
          'saas_template_versions',
          `id=eq.${encodeURIComponent(versionId)}&tenant_id=eq.${encodeURIComponent(tenant.id)}`,
          { is_archived: true, is_published: false }
        );

        return sendJson(res, 200, { ok: true });
      }

      return sendJson(res, 400, { ok: false, error: 'Bilinmeyen işlem (action).' });
    }

    return sendJson(res, 405, { ok: false, error: 'Yalnızca GET ve POST desteklenir.' });
  } catch (err) {
    console.error('[api/studio] error:', err);
    return sendJson(res, 500, { ok: false, error: err.message || 'Sunucu hatası.' });
  }
}
