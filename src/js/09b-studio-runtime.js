// ============================================================================
// HIZLI RAPOR - 09B-STUDIO-RUNTIME.JS
// Açıklama: Web Şablon Stüdyosu (Studio v2) Çift Yönlü Uygulama Köprüsü
//           - Yayınlanan Studio Şablonlarını Bulut & Yerel Sunucudan Senkronize Etme
//           - Rapor Bazlı Şema Mühürleme (Snapshot) + İsteğe Bağlı Yeni Sürüme Yükseltme
//           - Dinamik Saha Formu + Canlı A4 (Doğrudan Hücre Düzenleme) Çift Görünüm
//           - Birebir Studio A4/PDF Motoru (cellTextOverrides, cellStyles, cellMerges,
//             tableColWidths, Excel Formül Motoru, Koşullu Biçimlendirme & Grafikler)
// ============================================================================

(function () {
    'use strict';

    const STUDIO_TEMPLATES_STORAGE_KEY = 'enlab_studio_templates_v1';
    const STUDIO_LOCAL_BACKUP_KEY = 'hr_web_studio_versions_v2';

    const DEFAULT_LAYOUT_STYLES = {
        secMarginTop: 4,
        secMarginBottom: 2,
        secFontSize: 8.5,
        subMarginTop: 3,
        subMarginBottom: 2,
        subFontSize: 7.6,
        blockGap: 2,
        headerMarginBottom: 3,
        pagePadY: 6.5,
        pagePadX: 10.5,
        cellPadY: 2,
        cellPadX: 3.5,
        rowMinHeight: 0,
        tableFontSize: 7.2,
        tableLineHeight: 1.16,
        customBorderEnabled: false,
        borderColor: '#cbd5e1',
        borderWidth: 1,
        customColorsEnabled: false,
        secTitleColor: '#1f3a5f',
        subBg: '#eaeff5',
        subColor: '#1f3a5f',
        thBg: '#f1f5f9',
        thColor: '#1f3a5f'
    };

    const DEFAULT_DESIGN_SETTINGS = {
        docFont: '',
        watermarkText: '',
        watermarkColor: '#64748b',
        watermarkOpacity: 0.11,
        pageColor: '#ffffff',
        pageBorder: 'none',
        orientation: 'portrait',
        lineNumbers: false,
        hideHeader: false,
        hideFooter: false
    };

    const SAMPLE_COMPANY_VALUES = new Set([
        'siemens',
        'gemze osb',
        '213091827301928',
        '012938102937',
        'tkm-26-02-57801',
        '20.11.2026',
        '20.11.2026 00:07',
        '20.11.2027',
        'deneme'
    ]);

    function esc(str) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(str == null ? '' : String(str));
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escBr(str) {
        return esc(str).replace(/\r?\n/g, '<br>');
    }

    function deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            return {};
        }
    }

    function isRamsThemeVal(theme) {
        return String(theme || 'rams_navy').startsWith('rams_');
    }

    function ensureStyleDefaults(s) {
        if (!s || typeof s !== 'object') return;
        s.layoutStyles = Object.assign({}, DEFAULT_LAYOUT_STYLES, s.layoutStyles || {});
        s.designSettings = Object.assign({}, DEFAULT_DESIGN_SETTINGS, s.designSettings || {});
        if (!s.cellStyles || typeof s.cellStyles !== 'object') s.cellStyles = {};
        if (!s.cellTextOverrides || typeof s.cellTextOverrides !== 'object') s.cellTextOverrides = {};
        if (!s.cellMerges || typeof s.cellMerges !== 'object') s.cellMerges = {};
        if (!s.tableColWidths || typeof s.tableColWidths !== 'object') s.tableColWidths = {};
        if (!Array.isArray(s.conditionalRules)) s.conditionalRules = [];
        if (!Array.isArray(s.comments)) s.comments = [];
        if (!s.lockedCells || typeof s.lockedCells !== 'object') s.lockedCells = {};
        if (typeof s.sheetProtected !== 'boolean') s.sheetProtected = false;
        if (!Array.isArray(s.sections)) s.sections = [];
        s.sections.forEach(sec => {
            if (sec && (!sec.style || typeof sec.style !== 'object')) sec.style = {};
        });
    }

    function getRealFetch() {
        return window.__ENLAB_REAL_FETCH__ || window.fetch.bind(window);
    }

    function normalizeStudioTemplateRecord(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const schema = raw.schema_json && typeof raw.schema_json === 'object' ? raw.schema_json : null;
        if (!schema || !Array.isArray(schema.sections)) return null;
        const key = String(raw.template_key || schema.template_key || '').trim();
        if (!key) return null;
        const vNum = Number(raw.version_number || schema.version_number || 1);
        return {
            id: raw.id || `studio_${key}_v${vNum}`,
            template_key: key,
            template_id: `studio:${key}`,
            version_number: vNum,
            version_label: raw.version_label || schema.version_label || `v${vNum}`,
            title: String(raw.title || schema.title || 'Studio Şablonu').trim(),
            category: String(raw.category || schema.category || 'Studio').trim(),
            form_code: String(raw.form_code || schema.form_code || 'FR.100').trim(),
            changelog: String(raw.changelog || '').trim(),
            schema_json: schema,
            created_by_name: String(raw.created_by_name || '').trim(),
            created_at: raw.created_at || null
        };
    }

    // ========================================================================
    // 1. STUDIO ŞABLON YÖNETİCİSİ (OFFLINE + BULUT + YEREL PORTAL SENKRON)
    // ========================================================================
    const StudioTemplateManager = {
        isStudioTemplateId(tid) {
            return String(tid || '').startsWith('studio:');
        },

        getTemplateKey(tid) {
            const s = String(tid || '');
            return s.startsWith('studio:') ? s.slice(7) : s;
        },

        _loadStored() {
            try {
                const raw = localStorage.getItem(STUDIO_TEMPLATES_STORAGE_KEY);
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) return [];
                return parsed.map(normalizeStudioTemplateRecord).filter(Boolean);
            } catch (e) {
                return [];
            }
        },

        _loadSameOriginStudioLocalFallback() {
            try {
                const raw = localStorage.getItem(STUDIO_LOCAL_BACKUP_KEY);
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) return [];
                const byKey = new Map();
                parsed.forEach(item => {
                    if (!item || item.is_archived) return;
                    const norm = normalizeStudioTemplateRecord(item);
                    if (!norm) return;
                    const prev = byKey.get(norm.template_key);
                    const isPub = Boolean(item.is_published);
                    if (!prev || (isPub && !prev._pub) || (isPub === prev._pub && norm.version_number > prev.version_number)) {
                        norm._pub = isPub;
                        byKey.set(norm.template_key, norm);
                    }
                });
                return Array.from(byKey.values()).map(v => {
                    delete v._pub;
                    return v;
                });
            } catch (e) {
                return [];
            }
        },

        getAll() {
            const stored = this._loadStored();
            const map = new Map();
            stored.forEach(t => map.set(t.template_key, t));
            // Aynı origin'de yerel Studio kayıtları varsa (ör. localhost geliştirme) eksik olanları tamamla
            this._loadSameOriginStudioLocalFallback().forEach(t => {
                const existing = map.get(t.template_key);
                if (!existing || t.version_number > existing.version_number) {
                    map.set(t.template_key, t);
                }
            });
            return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        },

        getById(tid) {
            if (!tid) return null;
            const key = this.getTemplateKey(tid);
            return this.getAll().find(t => t.template_key === key || t.template_id === String(tid)) || null;
        },

        syncFromCloud(rawList) {
            const list = Array.isArray(rawList) ? rawList : [];
            const map = new Map();
            list.forEach(item => {
                const norm = normalizeStudioTemplateRecord(item);
                if (!norm) return;
                const prev = map.get(norm.template_key);
                if (!prev || norm.version_number > prev.version_number) {
                    map.set(norm.template_key, norm);
                }
            });
            const normalized = Array.from(map.values());
            try {
                localStorage.setItem(STUDIO_TEMPLATES_STORAGE_KEY, JSON.stringify(normalized));
            } catch (e) {
                console.warn('StudioTemplateManager save warning:', e);
            }
            return normalized;
        },

        async refreshFromPortal(silent = false) {
            try {
                // 1) Bulut oturumu varsa önce /api/app-sync üzerinden tazele
                if (window.CloudAppSync && typeof window.CloudAppSync.syncNow === 'function') {
                    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;
                    if (curUser && curUser.isCloudManaged && curUser.cloudToken) {
                        try {
                            const res = await window.CloudAppSync.syncNow({ silent: true });
                            if (res && res.ok) {
                                const list = this.getAll();
                                if (list.length > 0) {
                                    if (!silent && typeof showToast === 'function') {
                                        showToast(`${list.length} yayınlanmış Studio şablonu senkronize edildi.`, 'success');
                                    }
                                    return { ok: true, templates: list };
                                }
                            }
                        } catch (_) {}
                    }
                }

                // 2) Yapılandırılmış portalUrl + yerel geliştirme (localhost:8090) üzerinden /api/studio?published=1 çek
                const cfg = (window.CloudPortal && typeof window.CloudPortal.getConfig === 'function')
                    ? window.CloudPortal.getConfig()
                    : { portalUrl: 'https://hizli-rapor-portal.vercel.app' };
                const baseUrl = String(cfg.portalUrl || '').replace(/\/+$/, '');
                const isLocalHost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(String(window.location.hostname || ''));
                const candidateUrls = [];
                if (isLocalHost) {
                    candidateUrls.push('http://127.0.0.1:8090', 'http://localhost:8090');
                }
                if (baseUrl && !candidateUrls.includes(baseUrl)) {
                    candidateUrls.push(baseUrl);
                }

                for (const urlBase of candidateUrls) {
                    try {
                        const res = await getRealFetch()(`${urlBase}/api/studio?published=1`, {
                            method: 'GET',
                            headers: { 'Accept': 'application/json' }
                        });
                        if (!res.ok) continue;
                        const data = await res.json();
                        const incoming = Array.isArray(data.studio_templates)
                            ? data.studio_templates
                            : (Array.isArray(data.versions) ? data.versions.filter(v => v.is_published && !v.is_archived) : []);
                        const saved = this.syncFromCloud(incoming);
                        if (!silent && typeof showToast === 'function') {
                            showToast(
                                saved.length
                                    ? `${saved.length} Studio şablonu güncellendi.`
                                    : 'Sunucuda yayınlanmış Studio şablonu bulunamadı.',
                                saved.length ? 'success' : 'warning'
                            );
                        }
                        return { ok: true, templates: saved, sourceUrl: urlBase };
                    } catch (_) {
                        // Sonraki aday URL'yi dene
                    }
                }

                const fallback = this.getAll();
                if (!silent && typeof showToast === 'function') {
                    showToast(
                        fallback.length
                            ? `${fallback.length} Studio şablonu hazır.`
                            : 'Yayınlanmış Studio şablonu bulunamadı. Bulut hesabınızla giriş yapıp senkronize edin.',
                        fallback.length ? 'info' : 'warning'
                    );
                }
                return { ok: true, templates: fallback };
            } catch (err) {
                const fallback = this.getAll();
                if (!silent && typeof showToast === 'function') {
                    showToast('Studio şablonları çekilemedi: ' + (err.message || 'Bağlantı hatası'), 'warning');
                }
                return { ok: false, templates: fallback, error: err.message };
            }
        }
    };

    // ========================================================================
    // 2. ŞABLON MÜHÜRLEME (SNAPSHOT) & CANLI UYGULAMA VERİSİ BAĞLAMA
    // ========================================================================
    function buildPlaceholderContext(insp, fd, ci) {
        const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || {};
        const todayStr = new Date().toLocaleDateString('tr-TR');
        const nextYear = (() => {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            return d.toLocaleDateString('tr-TR');
        })();
        return {
            firma_adi: (ci && ci.firmName) || (insp && insp.customer_name) || (insp && insp.company_name) || '',
            adres: (ci && ci.address) || (insp && insp.address) || '',
            isg_katip: (ci && ci.isgKatipNo) || (insp && insp.isg_katip_no) || '',
            sgk_no: (ci && ci.sgkSicilNo) || (insp && insp.sgk_sicil_no) || '',
            rapor_no: (insp && insp.report_no) || (ci && ci.reportNo) || '',
            rapor_tarihi: (ci && ci.reportDate) || (insp && insp.inspection_date) || todayStr,
            kontrol_tarihi: (ci && ci.startEndTime) || (insp && insp.inspection_date) || todayStr,
            sonraki_tarih: (ci && ci.nextControlDate) || (fd && fd.nextInspectionDate) || nextYear,
            ekipman_adi: (insp && insp.equipment_name) || '',
            seri_no: (insp && insp.serial_no) || (ci && ci.serialCode) || '',
            lokasyon: (insp && insp.location) || '',
            muayene_personeli: (insp && insp.inspector_name) || (insp && insp.inspector) || curUser.fullName || '',
            unvan: (insp && insp.inspector_title) || curUser.title || '',
            bakanlik_no: (insp && insp.ministry_reg_no) || curUser.ministryRegNo || '',
            diploma_no: (insp && insp.diploma_no) || curUser.diplomaNoDate || '',
            sonuc: (fd && fd.overallResult) || (insp && insp.result) || 'UYGUN'
        };
    }

    function resolvePlaceholders(text, ctx) {
        const raw = String(text == null ? '' : text);
        if (!raw.includes('{{')) return raw;
        return raw.replace(/\{\{\s*([a-zA-Z0-9_ğüşöçıİĞÜŞÖÇ]+)\s*\}\}/g, (m, k) => {
            const norm = String(k || '').toLowerCase()
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
            return Object.prototype.hasOwnProperty.call(ctx, norm) ? String(ctx[norm] || '') : m;
        });
    }

    function isSampleOrBlank(val) {
        const norm = String(val == null ? '' : val).trim().toLowerCase();
        return !norm || SAMPLE_COMPANY_VALUES.has(norm);
    }

    function mapCompanyFieldByLabel(labelText, ctx) {
        const l = String(labelText || '').toLowerCase();
        if (l.includes('firma adı') || l.includes('firma adi')) return ctx.firma_adi;
        if (l.includes('adres')) return ctx.adres;
        if (l.includes('isg') || l.includes('katip')) return ctx.isg_katip;
        if (l.includes('sgk')) return ctx.sgk_no;
        if (l.includes('rapor numaras') || l.includes('rapor no')) return ctx.rapor_no;
        if (l.includes('sonraki') && l.includes('tarih')) return ctx.sonraki_tarih;
        if (l.includes('başlangıç') || l.includes('bitiş')) return ctx.kontrol_tarihi;
        if (l.includes('rapor tarihi')) return ctx.rapor_tarihi;
        if (l.includes('ekipman adı') || l.includes('ekipman adi') || l.includes('rapor / ekipman')) return ctx.ekipman_adi;
        if (l.includes('seri no')) return ctx.seri_no;
        return null;
    }

    function seedDevicesIntoStudioTable(sec, fd, isThermalOnly) {
        if (!sec || sec.type !== 'data_table' || !Array.isArray(sec.columns) || sec.columns.length === 0) return false;
        const allDevs = (fd && Array.isArray(fd.measuringDevices) && fd.measuringDevices.length > 0)
            ? fd.measuringDevices
            : (window.MeasuringDevicesManager && typeof window.MeasuringDevicesManager.getAssignedDevices === 'function'
                ? window.MeasuringDevicesManager.getAssignedDevices().map(d => ({
                    name: d.reportName || [d.brand, d.model].filter(Boolean).join(' ') || d.category || 'Ölçüm Cihazı',
                    thermalName: d.thermalReportName || [d.brand, d.model].filter(Boolean).join(' ') || d.reportName || '',
                    isThermal: Boolean(d.isThermal || String(d.category || '').toLowerCase().includes('termal')),
                    serial: d.serial || '',
                    calDate: d.calDate || '',
                    validDate: d.validDate || '',
                    certNo: d.certNo || ''
                }))
                : []);
        const filtered = isThermalOnly
            ? allDevs.filter(d => d.isThermal || String(d.category || '').toLowerCase().includes('termal') || String(d.name || '').toLowerCase().includes('termal'))
            : allDevs;
        if (!filtered.length) return false;

        const cols = sec.columns;
        const rows = filtered.map(d => {
            const row = {};
            cols.forEach((c, idx) => {
                const lbl = String(c.label || '').toLowerCase();
                if (lbl.includes('cihaz') || lbl.includes('ad') || idx === 0) {
                    row[c.id] = isThermalOnly ? (d.thermalName || d.name || '') : (d.name || '');
                } else if (lbl.includes('seri')) {
                    row[c.id] = d.serial || '';
                } else if (lbl.includes('geçerlilik') || lbl.includes('gecerlilik')) {
                    row[c.id] = d.validDate || '';
                } else if (lbl.includes('kalibrasyon tar') || lbl.includes('tarih')) {
                    row[c.id] = d.calDate || '';
                } else if (lbl.includes('numara') || lbl.includes('sertifika') || lbl.includes('no')) {
                    row[c.id] = d.certNo || '';
                } else {
                    row[c.id] = '';
                }
            });
            return row;
        });
        sec.rows = rows;
        return true;
    }

    function seedSchemaInitialValuesFromInspection(schema, insp, fd) {
        ensureStyleDefaults(schema);
        const ci = (fd && fd.companyInfo) || {};
        const ctx = buildPlaceholderContext(insp, fd, ci);
        const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || {};

        (schema.sections || []).forEach(sec => {
            if (!sec) return;
            if (sec.type === 'company_info' && Array.isArray(sec.rows)) {
                sec.rows.forEach(r => {
                    const m1 = mapCompanyFieldByLabel(r.label1, ctx);
                    if (m1 !== null && m1 !== '' && isSampleOrBlank(r.val1)) {
                        r.val1 = m1;
                    }
                    if (r.layout === 'pair') {
                        const m2 = mapCompanyFieldByLabel(r.label2, ctx);
                        if (m2 !== null && m2 !== '' && isSampleOrBlank(r.val2)) {
                            r.val2 = m2;
                        }
                    }
                });
            } else if (sec.type === 'visual_checklist_group') {
                if (ctx.ekipman_adi && isSampleOrBlank(sec.panoValue)) {
                    sec.panoValue = ctx.ekipman_adi;
                }
            } else if (sec.type === 'func_matrix') {
                if (ctx.ekipman_adi && isSampleOrBlank(sec.panoValue)) {
                    sec.panoValue = ctx.ekipman_adi;
                }
            } else if (sec.type === 'approval_box') {
                const fullNameTitle = [curUser.fullName || insp?.inspector || '', curUser.title || ''].filter(Boolean).join(' / ');
                if (fullNameTitle) sec.inspectorName = fullNameTitle;
                if (curUser.ministryRegNo) sec.ministryNo = curUser.ministryRegNo;
                if (curUser.diplomaNoDate) sec.diplomaNo = curUser.diplomaNoDate;
            }
        });
    }

    function ensureStudioFormData(insp, fd) {
        if (!insp || !fd) return null;
        if (!fd.studioSchema || !Array.isArray(fd.studioSchema.sections)) {
            const tpl = StudioTemplateManager.getById(insp.template_id);
            if (!tpl || !tpl.schema_json) return null;
            const cloned = deepClone(tpl.schema_json);
            ensureStyleDefaults(cloned);
            seedSchemaInitialValuesFromInspection(cloned, insp, fd);
            fd.studioSchema = cloned;
            fd.studioMeta = {
                template_key: tpl.template_key,
                template_id: tpl.template_id,
                version_number: tpl.version_number,
                version_label: tpl.version_label,
                title: tpl.title,
                form_code: tpl.form_code,
                sealedAt: new Date().toISOString()
            };
        } else {
            ensureStyleDefaults(fd.studioSchema);
        }
        return fd.studioSchema;
    }

    function syncEquipmentNameToStudioSchema(insp, fd, newName) {
        if (!fd || !fd.studioSchema || !Array.isArray(fd.studioSchema.sections)) return;
        const val = String(newName || '');
        fd.studioSchema.sections.forEach(sec => {
            if (sec.type === 'company_info' && Array.isArray(sec.rows)) {
                sec.rows.forEach(r => {
                    const l1 = String(r.label1 || '').toLowerCase();
                    if (l1.includes('ekipman adı') || l1.includes('ekipman adi') || l1.includes('rapor / ekipman')) {
                        r.val1 = val;
                    }
                    if (r.layout === 'pair') {
                        const l2 = String(r.label2 || '').toLowerCase();
                        if (l2.includes('ekipman adı') || l2.includes('ekipman adi') || l2.includes('rapor / ekipman')) {
                            r.val2 = val;
                        }
                    }
                });
            } else if (sec.type === 'visual_checklist_group' || sec.type === 'func_matrix') {
                if (sec.panoValue !== undefined) sec.panoValue = val;
            }
        });
    }

    // ========================================================================
    // 3. EXCEL FORMÜL MOTORU + KOŞULLU BİÇİMLENDİRME + SVG GRAFİK MOTORU
    //    (portal/studio-office.js ile %100 uyumlu)
    // ========================================================================
    function parseLocaleNumber(val) {
        if (typeof val === 'number') return isFinite(val) ? val : NaN;
        const raw = String(val == null ? '' : val).trim();
        if (!raw) return NaN;
        let cleaned = raw.replace(/[₺$€%ΩVAmska²³\s]/gi, '');
        if (!cleaned) return NaN;
        if (cleaned.includes(',') && cleaned.includes('.')) {
            if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else {
                cleaned = cleaned.replace(/,/g, '');
            }
        } else if (cleaned.includes(',')) {
            cleaned = cleaned.replace(',', '.');
        }
        if (!/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(cleaned)) return NaN;
        return parseFloat(cleaned);
    }

    function excelLetterToColIndex(letters) {
        let idx = 0;
        const up = String(letters || '').toUpperCase();
        for (let i = 0; i < up.length; i++) {
            idx = idx * 26 + (up.charCodeAt(i) - 64);
        }
        return idx - 1;
    }

    function colIndexToExcelLetter(idx) {
        let n = Number(idx) + 1;
        let out = '';
        while (n > 0) {
            const rem = (n - 1) % 26;
            out = String.fromCharCode(65 + rem) + out;
            n = Math.floor((n - 1) / 26);
        }
        return out || 'A';
    }

    function splitFormulaArgs(argStr) {
        let hasTopLevelSemi = false;
        {
            let d = 0, s = false;
            for (let i = 0; i < argStr.length; i++) {
                const ch = argStr[i];
                if (ch === '"') s = !s;
                else if (!s && ch === '(') d++;
                else if (!s && ch === ')') d--;
                else if (!s && d === 0 && ch === ';') { hasTopLevelSemi = true; break; }
            }
        }
        const sep = hasTopLevelSemi ? ';' : ',';
        const args = [];
        let cur = '', depth = 0, inStr = false;
        for (let i = 0; i < argStr.length; i++) {
            const ch = argStr[i];
            if (ch === '"') { inStr = !inStr; cur += ch; }
            else if (!inStr && ch === '(') { depth++; cur += ch; }
            else if (!inStr && ch === ')') { depth--; cur += ch; }
            else if (!inStr && depth === 0 && ch === sep) { args.push(cur.trim()); cur = ''; }
            else { cur += ch; }
        }
        if (cur.trim() !== '' || args.length > 0) args.push(cur.trim());
        return args;
    }

    function getCellEditableText(cell) {
        if (!cell) return '';
        const clone = cell.cloneNode(true);
        clone.querySelectorAll('.col-resize-handle, .row-resize-handle, .a4-fill-handle, .tbl-filter-btn, .cf-databar-fill, .cf-icon-prefix').forEach(n => n.remove());
        return String(clone.innerText || clone.textContent || '').replace(/\u00a0/g, ' ').trim();
    }

    function isCellTextEditable(cell) {
        if (!cell) return false;
        if (cell.querySelector('img, .a4-click-opt, .a4-click-sym, .tkm-sym-badge, .tkm-conclusion-box')) return false;
        return true;
    }

    function setCellTextClean(cell, text) {
        if (!cell) return;
        const lines = String(text == null ? '' : text).split(/\r?\n/);
        cell.innerHTML = lines.map(esc).join('<br>');
    }

    function evaluateTableFormulas(gridMatrix) {
        const rawValues = gridMatrix.map(row =>
            row.map(cell => (cell.dataset.rawValue !== undefined ? cell.dataset.rawValue : getCellEditableText(cell)))
        );
        const cache = new Map();
        const visiting = new Set();

        function getCellVal(r, c) {
            if (r < 0 || r >= rawValues.length || c < 0 || !rawValues[r] || c >= rawValues[r].length) return '';
            const id = `${r}:${c}`;
            if (cache.has(id)) return cache.get(id);
            const raw = String(rawValues[r][c] == null ? '' : rawValues[r][c]).trim();
            if (!raw.startsWith('=')) {
                const num = parseLocaleNumber(raw);
                const res = !isNaN(num) && /^-?[\d.,\s]+$/.test(raw) ? num : raw;
                cache.set(id, res);
                return res;
            }
            if (visiting.has(id)) return '#DÖNGÜ!';
            visiting.add(id);
            let out;
            try { out = evalExpr(raw.slice(1).trim()); } catch (_) { out = '#HATA!'; }
            visiting.delete(id);
            cache.set(id, out);
            return out;
        }

        function expandRangeMatrix(rangeExpr) {
            const m = String(rangeExpr || '').trim().match(/^\$?([A-Z]+)\$?(\d+)\s*:\s*\$?([A-Z]+)\$?(\d+)$/i);
            if (!m) return null;
            const c1 = excelLetterToColIndex(m[1]), r1 = parseInt(m[2], 10) - 1;
            const c2 = excelLetterToColIndex(m[3]), r2 = parseInt(m[4], 10) - 1;
            const rows = [];
            for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
                const row = [];
                for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) row.push(getCellVal(r, c));
                rows.push(row);
            }
            return rows;
        }

        function expandRangeValues(rangeExpr) {
            const mat = expandRangeMatrix(rangeExpr);
            return mat ? mat.flat() : null;
        }

        function collectNumbers(args) {
            const nums = [];
            args.forEach(a => {
                const rng = expandRangeValues(a);
                if (rng) {
                    rng.forEach(v => { const n = parseLocaleNumber(v); if (!isNaN(n)) nums.push(n); });
                } else {
                    const n = parseLocaleNumber(evalExpr(a));
                    if (!isNaN(n)) nums.push(n);
                }
            });
            return nums;
        }

        function collectAllValues(args) {
            const all = [];
            args.forEach(a => {
                const rng = expandRangeValues(a);
                if (rng) all.push(...rng);
                else all.push(evalExpr(a));
            });
            return all;
        }

        function matchCriteria(val, crit) {
            const cs = String(crit == null ? '' : crit).trim();
            const cmp = cs.match(/^(>=|<=|<>|!=|>|<|=)\s*(.+)$/);
            if (cmp) {
                const op = cmp[1];
                const rhsNum = parseLocaleNumber(cmp[2]);
                const lhsNum = parseLocaleNumber(val);
                if (!isNaN(lhsNum) && !isNaN(rhsNum)) {
                    if (op === '>') return lhsNum > rhsNum;
                    if (op === '>=') return lhsNum >= rhsNum;
                    if (op === '<') return lhsNum < rhsNum;
                    if (op === '<=') return lhsNum <= rhsNum;
                    if (op === '<>' || op === '!=') return lhsNum !== rhsNum;
                    if (op === '=') return lhsNum === rhsNum;
                }
            }
            return String(val == null ? '' : val).trim().toLowerCase() === cs.toLowerCase();
        }

        function evalFunction(nameRaw, argsRaw) {
            const fn = nameRaw.toUpperCase()
                .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
                .replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
            const args = argsRaw.trim() === '' ? [] : splitFormulaArgs(argsRaw);
            if (fn === 'TOPLA' || fn === 'SUM') return collectNumbers(args).reduce((a, b) => a + b, 0);
            if (fn === 'ORTALAMA' || fn === 'AVERAGE' || fn === 'ORT') {
                const nums = collectNumbers(args);
                return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
            }
            if (fn === 'SAY' || fn === 'COUNT') return collectNumbers(args).length;
            if (fn === 'BAG_DEG_DOLU_SAY' || fn === 'COUNTA' || fn === 'DOLUSAY') {
                return collectAllValues(args).filter(v => String(v == null ? '' : v).trim() !== '').length;
            }
            if (fn === 'MIN') { const n = collectNumbers(args); return n.length ? Math.min(...n) : 0; }
            if (fn === 'MAK' || fn === 'MAX') { const n = collectNumbers(args); return n.length ? Math.max(...n) : 0; }
            if (fn === 'MEDYAN' || fn === 'MEDIAN') {
                const nums = collectNumbers(args).sort((a, b) => a - b);
                if (!nums.length) return 0;
                const mid = Math.floor(nums.length / 2);
                return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
            }
            if (fn === 'CARPIM' || fn === 'PRODUCT') { const n = collectNumbers(args); return n.length ? n.reduce((a, b) => a * b, 1) : 0; }
            if (fn === 'EGER' || fn === 'IF') {
                const cond = evalExpr(args[0] || '0');
                const truthy = cond === true || (typeof cond === 'number' && cond !== 0) || (typeof cond === 'string' && cond.toLowerCase() === 'true');
                return truthy ? evalExpr(args[1] ?? '') : evalExpr(args[2] ?? '');
            }
            if (fn === 'EGERSAY' || fn === 'COUNTIF') {
                const vals = expandRangeValues(args[0] || '') || [evalExpr(args[0] || '')];
                const crit = evalExpr(args[1] || '');
                return vals.filter(v => matchCriteria(v, crit)).length;
            }
            if (fn === 'ETOPLA' || fn === 'SUMIF') {
                const vals = expandRangeValues(args[0] || '') || [];
                const crit = evalExpr(args[1] || '');
                const sumVals = args[2] ? (expandRangeValues(args[2]) || vals) : vals;
                let tot = 0;
                vals.forEach((v, idx) => { if (matchCriteria(v, crit)) { const n = parseLocaleNumber(sumVals[idx]); if (!isNaN(n)) tot += n; } });
                return tot;
            }
            if (fn === 'YUVARLA' || fn === 'ROUND') {
                const n = parseLocaleNumber(evalExpr(args[0] || '0'));
                const d = parseInt(evalExpr(args[1] || '0'), 10) || 0;
                const f = Math.pow(10, d);
                return isNaN(n) ? 0 : Math.round(n * f) / f;
            }
            if (fn === 'MUTLAK' || fn === 'ABS') { const n = parseLocaleNumber(evalExpr(args[0] || '0')); return isNaN(n) ? 0 : Math.abs(n); }
            if (fn === 'KAREKOK' || fn === 'SQRT') { const n = parseLocaleNumber(evalExpr(args[0] || '0')); return isNaN(n) || n < 0 ? '#SAYI!' : Math.sqrt(n); }
            if (fn === 'US' || fn === 'POWER') return Math.pow(parseLocaleNumber(evalExpr(args[0] || '0')), parseLocaleNumber(evalExpr(args[1] || '1')));
            if (fn === 'EGERHATA' || fn === 'IFERROR') {
                const v = evalExpr(args[0] || '');
                return (typeof v === 'string' && v.startsWith('#')) ? evalExpr(args[1] ?? '') : v;
            }
            if (fn === 'DUSEYARA' || fn === 'VLOOKUP') {
                const needle = evalExpr(args[0] || '');
                const mat = expandRangeMatrix(args[1] || '');
                const colNum = parseInt(evalExpr(args[2] || '1'), 10) - 1;
                if (!mat || colNum < 0) return '#YOK';
                const hit = mat.find(row => String(row[0] ?? '').trim().toLowerCase() === String(needle ?? '').trim().toLowerCase());
                return hit && hit[colNum] !== undefined ? hit[colNum] : '#YOK';
            }
            if (fn === 'BIRLESTIR' || fn === 'CONCAT' || fn === 'CONCATENATE') return collectAllValues(args).map(v => (v == null ? '' : String(v))).join('');
            if (fn === 'BUYUKHARF' || fn === 'UPPER') return String(evalExpr(args[0] || '')).toLocaleUpperCase('tr-TR');
            if (fn === 'KUCUKHARF' || fn === 'LOWER') return String(evalExpr(args[0] || '')).toLocaleLowerCase('tr-TR');
            if (fn === 'BUGUN' || fn === 'TODAY') return new Date().toLocaleDateString('tr-TR');
            if (fn === 'VE' || fn === 'AND') return args.every(a => Boolean(evalExpr(a)));
            if (fn === 'VEYA' || fn === 'OR') return args.some(a => Boolean(evalExpr(a)));
            if (fn === 'DEGIL' || fn === 'NOT') return !Boolean(evalExpr(args[0] || '0'));
            return '#AD?';
        }

        function findTopLevelOp(expr, ops) {
            let depth = 0, inStr = false;
            for (let i = expr.length - 1; i >= 0; i--) {
                const ch = expr[i];
                if (ch === '"') { inStr = !inStr; continue; }
                if (inStr) continue;
                if (ch === ')') depth++;
                else if (ch === '(') depth--;
                else if (depth === 0) {
                    for (const op of ops) {
                        const len = op.length;
                        if (i - len + 1 >= 0 && expr.slice(i - len + 1, i + 1) === op) {
                            const pos = i - len + 1;
                            if ((op === '-' || op === '+') && (pos === 0 || /[+\-*/^(=<>&]/.test(expr.slice(0, pos).trim().slice(-1)))) continue;
                            return { pos, op };
                        }
                    }
                }
            }
            return null;
        }

        function evalExpr(exprRaw) {
            let expr = String(exprRaw == null ? '' : exprRaw).trim();
            if (!expr) return '';
            while (expr.startsWith('(') && expr.endsWith(')')) {
                let depth = 0, wraps = true, inStr = false;
                for (let i = 0; i < expr.length; i++) {
                    if (expr[i] === '"') inStr = !inStr;
                    if (inStr) continue;
                    if (expr[i] === '(') depth++;
                    else if (expr[i] === ')') {
                        depth--;
                        if (depth === 0 && i < expr.length - 1) { wraps = false; break; }
                    }
                }
                if (wraps) expr = expr.slice(1, -1).trim();
                else break;
            }
            if (expr.startsWith('"') && expr.endsWith('"') && expr.indexOf('"', 1) === expr.length - 1) return expr.slice(1, -1);
            const cmpHit = findTopLevelOp(expr, ['>=', '<=', '<>', '!=', '=', '>', '<']);
            if (cmpHit) {
                const L = evalExpr(expr.slice(0, cmpHit.pos)), R = evalExpr(expr.slice(cmpHit.pos + cmpHit.op.length));
                const ln = parseLocaleNumber(L), rn = parseLocaleNumber(R);
                const bothNum = !isNaN(ln) && !isNaN(rn) && String(L).trim() !== '' && String(R).trim() !== '';
                const a = bothNum ? ln : String(L).toLowerCase(), b = bothNum ? rn : String(R).toLowerCase();
                if (cmpHit.op === '=') return a === b;
                if (cmpHit.op === '<>' || cmpHit.op === '!=') return a !== b;
                if (cmpHit.op === '>') return a > b;
                if (cmpHit.op === '>=') return a >= b;
                if (cmpHit.op === '<') return a < b;
                if (cmpHit.op === '<=') return a <= b;
            }
            const ampHit = findTopLevelOp(expr, ['&']);
            if (ampHit) return String(evalExpr(expr.slice(0, ampHit.pos))) + String(evalExpr(expr.slice(ampHit.pos + 1)));
            const addHit = findTopLevelOp(expr, ['+', '-']);
            if (addHit) {
                const L = parseLocaleNumber(evalExpr(expr.slice(0, addHit.pos))) || 0;
                const R = parseLocaleNumber(evalExpr(expr.slice(addHit.pos + 1))) || 0;
                return addHit.op === '+' ? L + R : L - R;
            }
            const mulHit = findTopLevelOp(expr, ['*', '/']);
            if (mulHit) {
                const L = parseLocaleNumber(evalExpr(expr.slice(0, mulHit.pos))) || 0;
                const R = parseLocaleNumber(evalExpr(expr.slice(mulHit.pos + 1))) || 0;
                if (mulHit.op === '/') return R === 0 ? '#SAYI/0!' : L / R;
                return L * R;
            }
            const powHit = findTopLevelOp(expr, ['^']);
            if (powHit) return Math.pow(parseLocaleNumber(evalExpr(expr.slice(0, powHit.pos))) || 0, parseLocaleNumber(evalExpr(expr.slice(powHit.pos + 1))) || 0);
            if (expr.startsWith('-')) return -(parseLocaleNumber(evalExpr(expr.slice(1))) || 0);
            const fnMatch = expr.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü_.]+)\(([\s\S]*)\)$/);
            if (fnMatch) return evalFunction(fnMatch[1], fnMatch[2]);
            const refMatch = expr.match(/^\$?([A-Z]+)\$?(\d+)$/i);
            if (refMatch) return getCellVal(parseInt(refMatch[2], 10) - 1, excelLetterToColIndex(refMatch[1]));
            if (expr.toUpperCase() === 'DOĞRU' || expr.toUpperCase() === 'TRUE') return true;
            if (expr.toUpperCase() === 'YANLIŞ' || expr.toUpperCase() === 'FALSE') return false;
            const num = parseLocaleNumber(expr);
            return !isNaN(num) ? num : expr;
        }

        return { getCellVal };
    }

    function formatDisplayValue(val, st) {
        if (val === '' || val == null) return '';
        if (typeof val === 'boolean') return val ? 'DOĞRU' : 'YANLIŞ';
        const fmt = st && st.numFmt ? st.numFmt : '';
        const dec = (st && st.decimals != null) ? Math.max(0, Math.min(6, Number(st.decimals))) : 2;
        const num = parseLocaleNumber(val);
        if (isNaN(num)) return String(val);
        if (!fmt) {
            if (typeof val === 'number') {
                const rounded = Math.round(val * 10000) / 10000;
                return String(rounded).replace('.', ',');
            }
            return String(val);
        }
        const nf = (d) => num.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
        if (fmt === 'number') return nf(dec);
        if (fmt === 'integer') return nf(0);
        if (fmt === 'currency') return `₺${nf(dec)}`;
        if (fmt === 'percent') return `%${nf(dec === 2 ? 1 : dec)}`;
        const unitMap = { ohm: ' Ω', amp: ' A', volt: ' V', ma: ' mA', ms: ' ms', ka: ' kA', mm2: ' mm²' };
        if (unitMap[fmt]) return `${nf(st.decimals != null ? dec : (Number.isInteger(num) ? 0 : 2))}${unitMap[fmt]}`;
        return String(val);
    }

    function evaluateTableVisuals(tbl, gridMatrix, secId, schema) {
        const { getCellVal } = evaluateTableFormulas(gridMatrix);
        const cellStyles = schema.cellStyles || {};
        const computedGrid = [];
        gridMatrix.forEach((rowCells, rIdx) => {
            computedGrid[rIdx] = [];
            rowCells.forEach((cell, cIdx) => {
                const key = cell.dataset.cellKey;
                const raw = cell.dataset.rawValue;
                const st = cellStyles[key] || {};
                if (!isCellTextEditable(cell) || raw === undefined) {
                    computedGrid[rIdx][cIdx] = raw || '';
                    return;
                }
                const isFormula = String(raw).trim().startsWith('=');
                const val = isFormula ? getCellVal(rIdx, cIdx) : raw;
                computedGrid[rIdx][cIdx] = val;
                if (isFormula || st.numFmt) {
                    setCellTextClean(cell, formatDisplayValue(val, st));
                    if (isFormula && String(val).startsWith('#')) {
                        cell.style.setProperty('color', '#dc2626', 'important');
                        cell.style.setProperty('font-weight', '800', 'important');
                    }
                }
            });
        });

        const rules = (schema.conditionalRules || []).filter(r => r.secId === secId);
        if (!rules.length) return;
        rules.forEach(rule => {
            const targetCells = [];
            gridMatrix.forEach((rowCells, rIdx) => {
                if (rIdx === 0 && tbl.querySelector('thead')) return;
                rowCells.forEach((cell, cIdx) => {
                    if (cell.tagName === 'TH') return;
                    if (rule.cIdx != null && Number(rule.cIdx) !== cIdx) return;
                    const v = computedGrid[rIdx]?.[cIdx];
                    targetCells.push({ cell, val: v, num: parseLocaleNumber(v) });
                });
            });
            const validNums = targetCells.map(t => t.num).filter(n => !isNaN(n));
            const minN = validNums.length ? Math.min(...validNums) : 0;
            const maxN = validNums.length ? Math.max(...validNums) : 1;
            const span = Math.max(0.0001, maxN - minN);
            targetCells.forEach(({ cell, val, num }) => {
                if (rule.kind === 'gt' && !isNaN(num) && num > Number(rule.threshold)) {
                    cell.style.setProperty('background-color', rule.bg || '#fee2e2', 'important');
                    cell.style.setProperty('color', rule.color || '#991b1b', 'important');
                    cell.style.setProperty('font-weight', '700', 'important');
                } else if (rule.kind === 'lt' && !isNaN(num) && num < Number(rule.threshold)) {
                    cell.style.setProperty('background-color', rule.bg || '#dcfce7', 'important');
                    cell.style.setProperty('color', rule.color || '#14573a', 'important');
                    cell.style.setProperty('font-weight', '700', 'important');
                } else if (rule.kind === 'contains' && rule.text && String(val).toLowerCase().includes(String(rule.text).toLowerCase())) {
                    cell.style.setProperty('background-color', rule.bg || '#fef3c7', 'important');
                    cell.style.setProperty('color', rule.color || '#92400e', 'important');
                    cell.style.setProperty('font-weight', '700', 'important');
                } else if (rule.kind === 'databar' && !isNaN(num) && maxN > 0) {
                    const pct = Math.max(4, Math.min(100, (Math.max(0, num) / maxN) * 100));
                    cell.classList.add('cf-databar-wrap');
                    const bar = document.createElement('span');
                    bar.className = 'cf-databar-fill';
                    bar.style.width = `${pct.toFixed(1)}%`;
                    bar.style.background = rule.param || '#3b82f6';
                    cell.prepend(bar);
                } else if (rule.kind === 'colorscale' && !isNaN(num)) {
                    const ratio = Math.max(0, Math.min(1, (num - minN) / span));
                    const hue = Math.round((1 - ratio) * 120);
                    cell.style.setProperty('background-color', `hsl(${hue}, 82%, 88%)`, 'important');
                    cell.style.setProperty('color', '#0f172a', 'important');
                } else if (rule.kind === 'iconset' && !isNaN(num)) {
                    const ratio = (num - minN) / span;
                    const ico = ratio >= 0.66 ? { t: '▲', c: '#16a34a' } : (ratio >= 0.33 ? { t: '▶', c: '#d97706' } : { t: '▼', c: '#dc2626' });
                    const sp = document.createElement('span');
                    sp.className = 'cf-icon-prefix';
                    sp.style.color = ico.c;
                    sp.textContent = ico.t;
                    cell.prepend(sp);
                }
            });
        });
    }

    function renderChartSvg(sec) {
        const pts = (sec.dataPoints || []).filter(p => p && !isNaN(Number(p.value)));
        if (!pts.length) return '<div style="padding:12px;font-size:7pt;color:#64748b;">Veri noktası yok</div>';
        const colors = ['#1b365d', '#107c41', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#0d9488'];
        const type = sec.chartType || 'column';
        const W = 540, H = 155;

        if (type === 'pie') {
            const total = pts.reduce((a, b) => a + Math.max(0, Number(b.value)), 0) || 1;
            let startA = -Math.PI / 2;
            const cx = 135, cy = 78, r = 62;
            let slices = '', legend = '';
            pts.forEach((p, idx) => {
                const val = Math.max(0, Number(p.value));
                const angle = (val / total) * Math.PI * 2;
                const endA = startA + angle;
                const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
                const x2 = cx + r * Math.cos(endA), y2 = cy + r * Math.sin(endA);
                const large = angle > Math.PI ? 1 : 0;
                const col = colors[idx % colors.length];
                slices += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${col}" stroke="#ffffff" stroke-width="1.2"/>`;
                const ly = 22 + idx * 18;
                const pct = ((val / total) * 100).toFixed(1);
                legend += `<rect x="240" y="${ly - 8}" width="10" height="10" rx="2" fill="${col}"/><text x="256" y="${ly}" font-size="9.5" fill="#1e293b">${esc(p.label)} (${val} · %${pct})</text>`;
                startA = endA;
            });
            return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:155px;display:block;">${slices}${legend}</svg>`;
        }

        const maxVal = Math.max(...pts.map(p => Number(p.value)), 1);
        if (type === 'bar') {
            const rowH = Math.min(24, (H - 18) / pts.length);
            const bars = pts.map((p, idx) => {
                const y = 10 + idx * rowH;
                const bw = Math.max(4, (Number(p.value) / maxVal) * 330);
                const col = colors[idx % colors.length];
                return `<text x="128" y="${y + rowH * 0.65}" text-anchor="end" font-size="9" fill="#334155">${esc(String(p.label).slice(0, 20))}</text>
                        <rect x="136" y="${y + 2}" width="${bw.toFixed(1)}" height="${Math.max(8, rowH - 6)}" rx="2" fill="${col}"/>
                        <text x="${(142 + bw).toFixed(1)}" y="${y + rowH * 0.65}" font-size="9" font-weight="700" fill="#0f172a">${p.value}</text>`;
            }).join('');
            return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:155px;display:block;">${bars}</svg>`;
        }

        if (type === 'line') {
            const stepX = pts.length > 1 ? 450 / (pts.length - 1) : 225;
            const coords = pts.map((p, i) => ({ x: 45 + i * stepX, y: 125 - (Number(p.value) / maxVal) * 98, p }));
            const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
            const dots = coords.map(c =>
                `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.5" fill="#107c41" stroke="#fff" stroke-width="1.5"/>
                 <text x="${c.x.toFixed(1)}" y="${(c.y - 7).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#0f172a">${c.p.value}</text>
                 <text x="${c.x.toFixed(1)}" y="143" text-anchor="middle" font-size="8.5" fill="#475569">${esc(String(c.p.label).slice(0, 12))}</text>`
            ).join('');
            return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:155px;display:block;"><line x1="35" y1="125" x2="510" y2="125" stroke="#cbd5e1" stroke-width="1"/><path d="${pathD}" fill="none" stroke="#185abd" stroke-width="2.2"/>${dots}</svg>`;
        }

        const slotW = 460 / pts.length;
        const barW = Math.min(46, slotW * 0.62);
        const cols = pts.map((p, idx) => {
            const x = 42 + idx * slotW + (slotW - barW) / 2;
            const bh = Math.max(3, (Number(p.value) / maxVal) * 98);
            const y = 125 - bh;
            const col = colors[idx % colors.length];
            return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${col}"/>
                    <text x="${(x + barW / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#0f172a">${p.value}</text>
                    <text x="${(x + barW / 2).toFixed(1)}" y="142" text-anchor="middle" font-size="8.5" fill="#475569">${esc(String(p.label).slice(0, 12))}</text>`;
        }).join('');
        return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:155px;display:block;"><line x1="35" y1="125" x2="510" y2="125" stroke="#cbd5e1" stroke-width="1"/>${cols}</svg>`;
    }

    // ========================================================================
    // 4. BİREBİR STUDIO A4 / PDF RENDER MOTORU
    // ========================================================================
    function renderRadioDot(selected) {
        const bg = selected ? '#0f172a' : '#ffffff';
        return `<span style="display:inline-block;width:6.5px;height:6.5px;border-radius:50%;border:1px solid #0f172a;background:${bg};margin-right:3px;vertical-align:middle;box-sizing:border-box;"></span>`;
    }

    function formatSymBadge(sym, isRams) {
        const v = String(sym || '').trim();
        if (!v) return '';
        if (!isRams) return `<span class="tkm-sym-badge">${esc(v)}</span>`;
        let cls = 'tkm-badge-neutral';
        if (v === '✓') cls = 'tkm-badge-ok';
        else if (v === 'X' || v === '✕') cls = 'tkm-badge-bad';
        return `<span class="tkm-sym-badge ${cls}">${esc(v)}</span>`;
    }

    function buildStudioLayoutStyleAttr(s) {
        ensureStyleDefaults(s);
        const ls = s.layoutStyles;
        const ds = s.designSettings || DEFAULT_DESIGN_SETTINGS;
        const vars = [
            `--st-sec-mt:${ls.secMarginTop}px`,
            `--st-sec-mb:${ls.secMarginBottom}px`,
            `--st-sec-fs:${ls.secFontSize}pt`,
            `--st-sub-mt:${ls.subMarginTop}px`,
            `--st-sub-mb:${ls.subMarginBottom}px`,
            `--st-sub-fs:${ls.subFontSize}pt`,
            `--st-block-gap:${ls.blockGap}px`,
            `--st-header-mb:${ls.headerMarginBottom}px`,
            `--st-page-py:${ls.pagePadY}mm`,
            `--st-page-px:${ls.pagePadX}mm`,
            `--st-cell-py:${ls.cellPadY}px`,
            `--st-cell-px:${ls.cellPadX}px`,
            `--st-row-min-h:${Number(ls.rowMinHeight) > 0 ? ls.rowMinHeight + 'px' : 'auto'}`,
            `--st-tbl-fs:${ls.tableFontSize}pt`,
            `--st-tbl-lh:${ls.tableLineHeight}`,
            `--st-page-bg:${ds.pageColor || '#ffffff'}`
        ];
        if (ds.docFont) vars.push(`--st-doc-font:${ds.docFont}`);
        if (ls.customBorderEnabled) {
            vars.push(`--st-border-color:${ls.borderColor || '#cbd5e1'}`);
            vars.push(`--st-border-w:${ls.borderWidth || 1}px`);
        }
        if (ls.customColorsEnabled) {
            vars.push(`--st-sec-title-color:${ls.secTitleColor || '#1f3a5f'}`);
            vars.push(`--st-sub-bg:${ls.subBg || '#eaeff5'}`);
            vars.push(`--st-sub-color:${ls.subColor || '#1f3a5f'}`);
            vars.push(`--st-th-bg:${ls.thBg || '#f1f5f9'}`);
            vars.push(`--st-th-color:${ls.thColor || '#1f3a5f'}`);
        }
        const cls = ['studio-a4-page'];
        if (ls.customBorderEnabled) cls.push('has-custom-border');
        if (ls.customColorsEnabled) cls.push('has-custom-sec-color', 'has-custom-sub-style', 'has-custom-th-style');
        return { styleText: vars.join(';') + ';', extraClasses: cls.join(' ') };
    }

    function applyLayoutCssVarsToEl(el, s) {
        const { styleText, extraClasses } = buildStudioLayoutStyleAttr(s);
        el.style.cssText += ';' + styleText;
        extraClasses.split(' ').forEach(c => { if (c) el.classList.add(c); });
    }

    function buildStudioPageHeaderHtml(s, ctx) {
        const b = s.branding || {};
        const appBranding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : {};
        const logoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getLogoSrc() : 'assets/tekkomer_logo.png';
        const turkakSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getTurkakLogoSrc() : 'assets/turkak_logo.jpg';
        const compName = resolvePlaceholders(b.companyFullName || appBranding.companyFullName || 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.', ctx);
        const phone = resolvePlaceholders(b.phone || appBranding.companyPhone || '', ctx);
        const email = resolvePlaceholders(b.email || appBranding.companyEmail || '', ctx);
        const titleHtml = esc(resolvePlaceholders(s.title || '', ctx)).replace('VE FONKSİYON TESTLERİ', 'VE FONKSİYON<br>TESTLERİ');
        const subTitle = esc(resolvePlaceholders(s.subtitle || 'PERİYODİK KONTROL RAPORU', ctx));
        return `
            <div class="tkm-header">
                <div style="display:flex;justify-content:center;align-items:center;padding-left:2px;">
                    ${b.showLogo !== false ? `<img src="${logoSrc}" alt="Logo" style="width:76px;height:68px;object-fit:contain;display:block;">` : `<div style="width:76px;"></div>`}
                </div>
                <div style="text-align:center;padding:0 6px;">
                    <div style="font-size:11pt;font-weight:700;color:#222222;letter-spacing:0.2px;margin-bottom:1px;line-height:1.15;">${esc(compName)}</div>
                    ${phone ? `<div style="font-size:7.6pt;color:#222222;line-height:1.2;">${esc(phone)}</div>` : ''}
                    ${email ? `<div style="font-size:7.6pt;color:#222222;line-height:1.2;margin-bottom:2px;">${esc(email)}</div>` : ''}
                    <div class="tkm-header-title" style="font-size:10.3pt;font-weight:700;color:#222222;line-height:1.12;text-transform:uppercase;">${titleHtml}</div>
                    <div class="tkm-header-acc" style="font-size:8.8pt;font-weight:400;color:#333333;margin-top:1px;letter-spacing:0.3px;">${subTitle}</div>
                </div>
                <div style="display:flex;justify-content:center;align-items:center;">
                    ${b.showTurkak !== false ? `<img src="${turkakSrc}" alt="TÜRKAK" style="width:66px;height:82px;object-fit:contain;display:block;">` : `<div style="width:66px;"></div>`}
                </div>
            </div>
        `;
    }

    function buildStudioPageFooterHtml(s, pageNum, totalPages, reportNo, ctx) {
        const rams = isRamsThemeVal(s.pdfTheme);
        const disc = esc(resolvePlaceholders(s.branding?.disclaimer || '', ctx));
        const repNo = esc(reportNo || ctx.rapor_no || s.report_no_sample || '');
        if (rams) {
            return `
                <div class="tkm-footer">
                    <div class="tkm-footer-disclaimer">${disc}</div>
                    <div class="tkm-footer-doc-line">
                        <span>Doküman Kodu: <strong>${esc(s.doc_code || 'ZPKR02')}</strong></span>
                        <span class="tkm-fdoc-sep">&middot;</span>
                        <span>Yayım Tarihi: <strong>${esc(s.publish_date || '18.07.2025')}</strong></span>
                        <span class="tkm-fdoc-sep">&middot;</span>
                        <span>Revizyon No / Tarihi: <strong>${esc(s.rev_info || '- / -')}</strong></span>
                        <span class="tkm-fdoc-sep">&middot;</span>
                        <span>Yürürlük Tarihi: <strong>${esc(s.effective_date || '01.09.2025')}</strong></span>
                    </div>
                    <div class="tkm-footer-meta">
                        <span style="width:33%;text-align:left;"></span>
                        <span style="width:34%;text-align:center;">${repNo}</span>
                        <span style="width:33%;text-align:right;">${pageNum} / ${totalPages}</span>
                    </div>
                </div>
            `;
        }
        return `
            <div class="tkm-footer">
                <div class="tkm-footer-disclaimer">${disc}</div>
                <div class="tkm-footer-meta">
                    <span style="width:38%;text-align:left;">${esc(s.form_code || 'TKM-FR.318, REV.00')}</span>
                    <span style="width:34%;text-align:center;">${repNo}</span>
                    <span style="width:28%;text-align:right;">${pageNum} / ${totalPages}</span>
                </div>
            </div>
        `;
    }

    function buildStudioBlocksForSchema(s, insp, ctx, interactive = false) {
        const rams = isRamsThemeVal(s.pdfTheme);
        const lblCls = rams ? ' class="tkm-label-cell"' : '';
        const valCls = rams ? ' class="tkm-val-cell"' : '';
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const blocks = [];
        const tx = (v) => resolvePlaceholders(v, ctx);

        const wrapBlock = (sec, innerHtml, forceBreak = false, allowSecBreak = true) => {
            const effectiveBreak = Boolean(forceBreak || (allowSecBreak && sec.style && sec.style.forceBreak));
            return {
                forceBreak: effectiveBreak,
                html: `<div class="a4-interactive-block" data-sec-id="${esc(sec.id)}" data-force-break="${effectiveBreak ? '1' : '0'}">${innerHtml}</div>`
            };
        };

        for (const sec of (s.sections || [])) {
            if (!sec || sec.visible === false) continue;

            // 1. COMPANY INFO
            if (sec.type === 'company_info') {
                const docBox = rams ? '' : `
                    <div style="display:flex;justify-content:flex-end;margin-bottom:3px;">
                        <table style="border:1px solid #000000;font-size:6.7pt;border-collapse:collapse;background:#ffffff;">
                            <tr>
                                <td style="padding:1.5px 6px;font-weight:700;border:1px solid #000000;background:#f4f4f4;">Doküman Kodu</td>
                                <td style="padding:1.5px 6px;border:1px solid #000000;font-weight:600;">${esc(s.doc_code || 'ZPKR02')}</td>
                                <td style="padding:1.5px 6px;font-weight:700;border:1px solid #000000;background:#f4f4f4;">Yürürlük Tarihi</td>
                                <td style="padding:1.5px 6px;border:1px solid #000000;">${esc(s.effective_date || '01.09.2025')}</td>
                            </tr>
                        </table>
                    </div>
                `;
                const rowsHtml = (sec.rows || []).map((r, rIdx) => r.layout === 'full'
                    ? `<tr><td${lblCls} data-bind="ci:${sec.id}:${rIdx}:label1" style="font-weight:700;">${escBr(tx(r.label1))}</td><td${valCls} data-bind="ci:${sec.id}:${rIdx}:val1" colspan="3">${escBr(tx(r.val1))}</td></tr>`
                    : `<tr><td${lblCls} data-bind="ci:${sec.id}:${rIdx}:label1" style="font-weight:700;">${escBr(tx(r.label1))}</td><td${valCls} data-bind="ci:${sec.id}:${rIdx}:val1">${escBr(tx(r.val1))}</td><td${lblCls} data-bind="ci:${sec.id}:${rIdx}:label2" style="font-weight:700;">${escBr(tx(r.label2))}</td><td${valCls} data-bind="ci:${sec.id}:${rIdx}:val2">${escBr(tx(r.val2))}</td></tr>`
                ).join('');
                const scopeHtml = (sec.scopeLines || []).length > 0 ? `
                    <tr>
                        <td${lblCls} data-bind="ci_scope_lbl:${sec.id}" style="font-weight:700;">${escBr(tx(sec.scopeLabel || 'Periyodik Kontrol Metodu ve Kapsamı'))}</td>
                        <td colspan="3" data-bind="ci_scope:${sec.id}" style="line-height:1.22;">${sec.scopeLines.map(l => {
                            const t = tx(l).trim();
                            if (!t) return '';
                            if (sec.scopeRawLines || /^([•●▪◦\-*]|\d+[.)]|[a-zA-Z][.)])\s/.test(t)) return esc(t);
                            return `• ${esc(t)}`;
                        }).filter(Boolean).join('<br>')}</td>
                    </tr>
                ` : '';
                blocks.push(wrapBlock(sec, `
                    ${docBox}
                    <div class="tkm-sec-title">${esc(tx(sec.title))}</div>
                    <table class="tkm-table">
                        <colgroup><col style="width:19%;"><col style="width:36%;"><col style="width:17%;"><col style="width:28%;"></colgroup>
                        <tbody>${rowsHtml}${scopeHtml}</tbody>
                    </table>
                `));
                continue;
            }

            // 2.1 DETAIL GRID
            if (sec.type === 'detail_21') {
                const f = sec.fields || [];
                const renderCellVal = (fieldIdx, gap = '6px') => {
                    const q = f[fieldIdx];
                    if (!q) return '';
                    if (q.type === 'radio' && Array.isArray(q.options) && q.options.length > 0) {
                        return `<div style="display:flex;flex-wrap:wrap;gap:2px ${gap};align-items:center;">
                            ${q.options.map(opt => {
                                const isSel = String(q.value || '').toLowerCase() === String(opt).toLowerCase();
                                const clickAttr = interactive ? ` onclick="studioAppPickDetail21('${esc(sec.id)}', ${fieldIdx}, '${esc(opt)}', event)"` : '';
                                return `<span class="${interactive ? 'a4-click-opt' : ''}"${clickAttr} style="display:inline-flex;align-items:center;font-weight:${isSel ? '700' : '400'};color:${isSel ? '#0f172a' : '#334155'};white-space:nowrap;">${renderRadioDot(isSel)}${esc(opt)}</span>`;
                            }).join('')}
                        </div>`;
                    }
                    return esc(tx(q.value || ''));
                };
                let tblHtml = '';
                if (rams && f.length >= 24) {
                    const qPhase = f[10];
                    const curP = String(qPhase.value || '');
                    const aaOpts = qPhase.aaOptions || ['AA(1 faz-2 tel)', 'AA(1 faz-3 tel)', 'AA(2 faz-3 tel)', 'AA(3 faz-3 tel)', 'AA(3 faz-4 tel)'];
                    const daOpts = qPhase.daOptions || ['DA(2 kutup)', 'DA(3 kutup)', 'DA(Diğer)'];
                    const renderPGroup = (gName, isG, opts) => `
                        <div style="display:flex;flex-wrap:wrap;gap:3px 6px;align-items:center;">
                            <span style="font-weight:700;color:#0f172a;font-size:7.2pt;margin-right:2px;">${renderRadioDot(isG)}${gName}:</span>
                            ${opts.map(opt => {
                                const sel = curP.toLowerCase() === opt.toLowerCase();
                                const clickAttr = interactive ? ` onclick="studioAppPickDetail21('${esc(sec.id)}', 10, '${esc(opt)}', event)"` : '';
                                return `<span class="${interactive ? 'a4-click-opt' : ''}"${clickAttr} style="display:inline-flex;align-items:center;font-size:7pt;font-weight:${sel ? '700' : '400'};color:${sel ? '#0f172a' : '#334155'};white-space:nowrap;">${renderRadioDot(sel)}${esc(opt)}</span>`;
                            }).join('')}
                        </div>
                    `;
                    const ls = 'text-align:left;padding:2px 4px;line-height:1.18;font-size:7.2pt;';
                    const vs = 'text-align:left;padding:2px 4px;line-height:1.18;font-size:7.4pt;';
                    const extraRows = [];
                    for (let i = 24; i < f.length; i += 2) {
                        const a = f[i], b = f[i + 1];
                        extraRows.push(`<tr>
                            <td class="tkm-label-cell" style="${ls}">${esc(tx(a.label))}</td>
                            <td class="tkm-val-cell" data-bind="d21:${sec.id}:${i}" style="${vs}">${renderCellVal(i)}</td>
                            <td class="tkm-label-cell" style="${ls}">${b ? esc(tx(b.label)) : ''}</td>
                            <td class="tkm-val-cell" ${b ? `data-bind="d21:${sec.id}:${i + 1}"` : ''} style="${vs}">${b ? renderCellVal(i + 1) : ''}</td>
                        </tr>`);
                    }
                    tblHtml = `
                        <table class="tkm-table">
                            <colgroup><col style="width:21%;"><col style="width:29%;"><col style="width:22%;"><col style="width:28%;"></colgroup>
                            <tbody>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[0].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:0" style="${vs}">${renderCellVal(0)}</td><td class="tkm-label-cell" style="${ls}">${esc(f[1].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(1)}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[2].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:2" style="${vs}">${renderCellVal(2)}</td><td class="tkm-label-cell" style="${ls}">${esc(f[5].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(5, '8px')}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[3].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(3, '10px')}</td><td class="tkm-label-cell" style="${ls}">${esc(f[4].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(4, '10px')}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[7].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(7)}</td><td class="tkm-label-cell" style="${ls}">${esc(f[6].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(6)}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[8].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:8" style="${vs}">${renderCellVal(8)}</td><td class="tkm-label-cell" style="${ls}">${esc(f[9].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:9" style="${vs}">${renderCellVal(9)}</td></tr>
                                <tr>
                                    <td class="tkm-label-cell" rowspan="5" style="${ls}">${esc(qPhase.label)}</td>
                                    <td class="tkm-val-cell" rowspan="5" style="${vs}">
                                        <div style="display:flex;flex-direction:column;gap:3px;">
                                            ${renderPGroup('AA', curP.toUpperCase().startsWith('AA'), aaOpts)}
                                            <div style="border-top:1px dashed #cbd5e1;padding-top:2px;">${renderPGroup('DA', curP.toUpperCase().startsWith('DA'), daOpts)}</div>
                                        </div>
                                    </td>
                                    <td class="tkm-label-cell" style="${ls}">${esc(f[11].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:11" style="${vs}">${renderCellVal(11)}</td>
                                </tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[12].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:12" style="${vs}">${renderCellVal(12)}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[13].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:13" style="${vs}">${renderCellVal(13)}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[14].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:14" style="${vs}">${renderCellVal(14)}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[19].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:19" style="${vs}">${renderCellVal(19)}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[15].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:15" style="${vs}">${renderCellVal(15)}</td><td class="tkm-label-cell" style="${ls}">${esc(f[20].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:20" style="${vs}">${renderCellVal(20)}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[16].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:16" style="${vs}">${renderCellVal(16)}</td><td class="tkm-label-cell" style="${ls}">${esc(f[21].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:21" style="${vs}">${renderCellVal(21)}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[17].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:17" style="${vs}">${renderCellVal(17)}</td><td class="tkm-label-cell" style="${ls}">${esc(f[22].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:22" style="${vs}">${renderCellVal(22)}</td></tr>
                                <tr><td class="tkm-label-cell" style="${ls}">${esc(f[18].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:18" style="${vs}">${renderCellVal(18)}</td><td class="tkm-label-cell" style="${ls}">${esc(f[23].label)}</td><td class="tkm-val-cell" data-bind="d21:${sec.id}:23" style="${vs}">${renderCellVal(23)}</td></tr>
                                ${extraRows.join('')}
                            </tbody>
                        </table>
                    `;
                } else {
                    let rows = '';
                    for (let i = 0; i < f.length; i += 3) {
                        rows += '<tr>';
                        for (let c = 0; c < 3; c++) {
                            const q = f[i + c];
                            rows += q
                                ? `<td style="text-align:center;">${esc(tx(q.label))}</td><td data-bind="d21:${sec.id}:${i + c}" style="text-align:left;padding-left:5px;">${esc(tx(q.value || ''))}</td>`
                                : `<td></td><td></td>`;
                        }
                        rows += '</tr>';
                    }
                    tblHtml = `<table class="tkm-table"><colgroup><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.4%;"></colgroup><tbody>${rows}</tbody></table>`;
                }
                blocks.push(wrapBlock(sec, `
                    ${sec.sectionTitle ? `<div class="tkm-sec-title">${esc(tx(sec.sectionTitle))}</div>` : ''}
                    <div class="tkm-sub-bar">${esc(tx(sec.subTitle || '2.1. DETAY BİLGİLER'))}</div>
                    ${tblHtml}
                `));
                continue;
            }

            // 2.2 DETECTED INFO
            if (sec.type === 'detail_22') {
                let tblHtml = '';
                const bq = sec.bottomQuestion || { label: '', options: ['Var', 'Yok'], value: 'Var' };
                if (rams) {
                    const optPair = (kind, idx, q) => (q.options || ['Var', 'Yok']).map(opt => {
                        const sel = q.value === opt;
                        const clickAttr = interactive ? ` onclick="studioAppPickDetail22('${esc(sec.id)}', '${kind}', ${idx}, '${esc(opt)}', event)"` : '';
                        return `<span class="${interactive ? 'a4-click-opt' : ''}"${clickAttr} style="display:inline-flex;align-items:center;margin-right:16px;font-weight:${sel ? '700' : '400'};">${renderRadioDot(sel)}${esc(opt)}</span>`;
                    }).join('');
                    const protHtml = (sec.protectionItems || []).map((p, idx) => {
                        const sel = p.value === 'Var';
                        const clickAttr = interactive ? ` onclick="studioAppPickDetail22('${esc(sec.id)}', 'prot', ${idx}, '', event)"` : '';
                        return `<div class="${interactive ? 'a4-click-opt' : ''}"${clickAttr} style="display:flex;align-items:flex-start;gap:4px;line-height:1.18;margin-bottom:1px;">
                            <span style="flex-shrink:0;margin-top:2px;">${renderRadioDot(sel)}</span>
                            <span style="font-weight:${sel ? '700' : '400'};">${esc(tx(p.label))}</span>
                        </div>`;
                    }).join('');
                    tblHtml = `
                        <table class="tkm-table">
                            <colgroup><col style="width:43%;"><col style="width:57%;"></colgroup>
                            <tbody>
                                ${(sec.topQuestions || []).map((q, i) => `
                                    <tr><td class="tkm-label-cell" style="text-align:left;padding:2px 4px;">${esc(tx(q.label))}</td><td class="tkm-val-cell" style="text-align:left;padding:2px 4px;">${optPair('top', i, q)}</td></tr>
                                `).join('')}
                                <tr>
                                    <td class="tkm-label-cell" data-bind="d22_prot_title:${sec.id}" style="text-align:left;padding:2px 4px;">${escBr(tx(sec.protectionTitle || ''))}</td>
                                    <td class="tkm-val-cell" style="text-align:left;padding:2px 4px;font-size:6.8pt;">${protHtml}</td>
                                </tr>
                                <tr>
                                    <td class="tkm-label-cell" style="text-align:left;padding:2px 4px;">${esc(tx(bq.label))}</td>
                                    <td class="tkm-val-cell" style="text-align:left;padding:2px 4px;">${optPair('bottom', 0, bq)}</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                } else {
                    const allFlat = [
                        ...(sec.topQuestions || []).map(q => ({ label: tx(q.label), val: q.value })),
                        { label: tx(bq.label), val: bq.value },
                        ...(sec.protectionItems || []).map(p => ({ label: `Tespit edilen bilgiler(Doğrudan dokunmaya karşı koruma önlemleri) - ${tx(p.label)}`, val: p.value }))
                    ];
                    let rows = '';
                    for (let i = 0; i < allFlat.length; i += 3) {
                        rows += '<tr>';
                        for (let c = 0; c < 3; c++) {
                            const q = allFlat[i + c];
                            rows += q ? `<td style="text-align:center;">${esc(q.label)}</td><td style="text-align:left;padding-left:5px;">${esc(q.val)}</td>` : `<td></td><td></td>`;
                        }
                        rows += '</tr>';
                    }
                    tblHtml = `<table class="tkm-table"><colgroup><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.4%;"></colgroup><tbody>${rows}</tbody></table>`;
                }
                blocks.push(wrapBlock(sec, `<div class="tkm-sub-bar">${esc(tx(sec.subTitle || '2.2. TESPİT EDİLEN BİLGİLER'))}</div>${tblHtml}`));
                continue;
            }

            // DATA TABLE
            if (sec.type === 'data_table') {
                const cols = sec.columns || [];
                const tblOpts = sec.tableOptions || {};
                const hasGroups = rams && cols.some(c => String(c.group || '').trim() !== '');
                const colgroup = `<colgroup>
                    ${sec.showNoCol ? `<col style="width:${Number(sec.noColWidth || 4)}%;">` : ''}
                    ${cols.map(c => `<col style="width:${Number(c.width || 10)}%;">`).join('')}
                </colgroup>`;
                let theadHtml = '';
                if (hasGroups) {
                    let row1 = sec.showNoCol ? `<th rowspan="2" style="text-align:center;">No</th>` : '';
                    let row2 = '';
                    let i = 0;
                    while (i < cols.length) {
                        const g = String(cols[i].group || '').trim();
                        if (!g) {
                            row1 += `<th rowspan="2" style="text-align:center;" data-bind="dt_col:${sec.id}:${i}">${esc(tx(cols[i].label))}</th>`;
                            i++;
                        } else {
                            let span = 1;
                            while (i + span < cols.length && String(cols[i + span].group || '').trim() === g) span++;
                            row1 += `<th colspan="${span}" class="tkm-linye-group-th" style="text-align:center;">${esc(tx(g))}</th>`;
                            for (let k = 0; k < span; k++) {
                                row2 += `<th style="text-align:center;" data-bind="dt_col:${sec.id}:${i + k}">${esc(tx(cols[i + k].label))}</th>`;
                            }
                            i += span;
                        }
                    }
                    theadHtml = `<thead><tr>${row1}</tr><tr>${row2}</tr></thead>`;
                } else {
                    theadHtml = `<thead><tr>
                        ${sec.showNoCol ? `<th style="text-align:center;">No</th>` : ''}
                        ${cols.map((c, cIdx) => `<th style="text-align:center;" data-bind="dt_col:${sec.id}:${cIdx}">${esc(tx(c.label))}</th>`).join('')}
                    </tr></thead>`;
                }

                const rowsArr = sec.rows || [];
                const tbodyHtml = rowsArr.map((r, rIdx) => {
                    const rhStyle = (r._height && Number(r._height) >= 12) ? ` style="height:${Number(r._height)}px;"` : '';
                    return `
                        <tr${rhStyle} data-dt-row="${rIdx}">
                            ${sec.showNoCol ? `<td style="text-align:center;">${rIdx + 1}</td>` : ''}
                            ${cols.map(c => {
                                const raw = tx(r[c.id] == null ? '' : String(r[c.id]));
                                if (c.type === 'symbol') {
                                    const badCls = (rams && raw === 'X') ? ' class="tkm-cell-bad a4-click-sym"' : ' class="a4-click-sym"';
                                    const clickAttr = interactive ? ` onclick="studioAppCycleTableSym('${esc(sec.id)}', ${rIdx}, '${esc(c.id)}', event)"` : '';
                                    return `<td${badCls}${clickAttr} data-dt-col="${esc(c.id)}" style="text-align:center;">${formatSymBadge(raw, rams)}</td>`;
                                }
                                return `<td data-bind="dt_cell:${sec.id}:${rIdx}:${c.id}" data-dt-col="${esc(c.id)}" style="text-align:${c.align || 'center'};">${escBr(raw)}</td>`;
                            }).join('')}
                        </tr>
                    `;
                }).join('');

                let totalRowHtml = '';
                if (sec.showTotalRow && rowsArr.length > 0) {
                    totalRowHtml = `<tr class="tkm-total-row">
                        ${sec.showNoCol ? `<td style="text-align:center;">Σ</td>` : ''}
                        ${cols.map((c, idx) => {
                            if (idx === 0) return `<td style="text-align:left;">TOPLAM (${rowsArr.length})</td>`;
                            if (c.type === 'symbol') {
                                const okCount = rowsArr.filter(r => r[c.id] === '✓').length;
                                const badCount = rowsArr.filter(r => r[c.id] === 'X').length;
                                return `<td style="text-align:center;">✓${okCount}${badCount ? ` / X${badCount}` : ''}</td>`;
                            }
                            const nums = rowsArr.map(r => parseLocaleNumber(r[c.id])).filter(n => !isNaN(n));
                            if (nums.length > 0) {
                                const sum = nums.reduce((a, b) => a + b, 0);
                                return `<td style="text-align:center;">${Number.isInteger(sum) ? String(sum) : sum.toFixed(2).replace('.', ',')}</td>`;
                            }
                            return `<td></td>`;
                        }).join('')}
                    </tr>`;
                }

                const extraCls = [
                    sec.isLinyeTable ? 'tkm-linye-table' : '',
                    tblOpts.bandedRows === false ? 'tkm-no-banded' : '',
                    tblOpts.bandedCols ? 'tkm-banded-cols' : '',
                    tblOpts.firstColBold ? 'tkm-first-col-bold' : '',
                    tblOpts.lastColBold ? 'tkm-last-col-bold' : '',
                    sec.tablePreset && sec.tablePreset !== 'default' ? `tbl-preset-${sec.tablePreset}` : ''
                ].filter(Boolean).join(' ');
                const tblCls = `tkm-table${extraCls ? ' ' + extraCls : ''}`;
                const forceBreak = Boolean((rams && sec.forceBreakInRams) || (!rams && sec.forceBreakInClassic));
                blocks.push(wrapBlock(sec, `
                    ${sec.title ? `<div class="tkm-sec-title">${esc(tx(sec.title))}</div>` : ''}
                    ${sec.subTitle ? `<div class="tkm-sub-bar">${esc(tx(sec.subTitle))}</div>` : ''}
                    <table class="${tblCls}" data-dt-sec="${esc(sec.id)}">${colgroup}${theadHtml}<tbody>${tbodyHtml}${totalRowHtml}</tbody></table>
                    ${sec.showLegend ? `<div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>` : ''}
                    ${sec.footnote ? `<div style="font-size:6.8pt;color:#333333;font-style:italic;margin-top:2px;">${esc(tx(sec.footnote))}</div>` : ''}
                `, forceBreak));
                continue;
            }

            // VISUAL CHECKLIST GROUP
            if (sec.type === 'visual_checklist_group') {
                const forceBreak = Boolean((rams && sec.forceBreakInRams) || (!rams && sec.forceBreakInClassic));
                let topHtml = `
                    ${sec.superTitle ? `<div class="tkm-sec-title" style="color:#111111;">${esc(tx(sec.superTitle))}</div>` : ''}
                    ${sec.title ? `<div class="tkm-sec-title">${esc(tx(sec.title))}</div>` : ''}
                `;
                if (sec.panoSubTitle) {
                    topHtml += `
                        <div class="tkm-sub-bar">${esc(tx(sec.panoSubTitle))}</div>
                        <table class="tkm-table">
                            <colgroup><col style="width:32%;"><col style="width:68%;"></colgroup>
                            <tbody><tr><td${lblCls} style="text-align:${rams ? 'left' : 'center'};">${esc(tx(sec.panoLabel || ''))}</td><td${valCls} data-bind="vc_pano:${sec.id}" style="text-align:left;padding-left:6px;">${esc(tx(sec.panoValue || ''))}</td></tr></tbody>
                        </table>
                    `;
                }
                blocks.push(wrapBlock(sec, topHtml, forceBreak));

                (sec.topics || []).forEach((t, tIdx) => {
                    const isFirst = tIdx === 0;
                    const isLast = tIdx === sec.topics.length - 1;
                    let topicTableHtml = '';
                    if (rams) {
                        const mid = Math.ceil((t.items || []).length / 2);
                        let rows = '';
                        for (let i = 0; i < mid; i++) {
                            const L = t.items[i];
                            const R = t.items[i + mid] || null;
                            const badL = L.sym === 'X' ? ' tkm-cell-bad' : '';
                            const badR = (R && R.sym === 'X') ? ' tkm-cell-bad' : '';
                            const clickL = interactive ? ` onclick="studioAppCycleVisual('${esc(sec.id)}', ${tIdx}, ${i}, event)"` : '';
                            const clickR = interactive ? ` onclick="studioAppCycleVisual('${esc(sec.id)}', ${tIdx}, ${i + mid}, event)"` : '';
                            rows += `<tr>
                                <td class="${badL}" style="text-align:center;font-weight:700;width:24px;">${letters[i] || (i + 1)}</td>
                                <td class="${badL}" style="text-align:left;padding-left:4px;font-size:6.9pt;">${esc(tx(L.text))}</td>
                                <td class="a4-click-sym${badL}"${clickL} style="text-align:center;width:34px;border-right:1.5px solid #333333 !important;">${formatSymBadge(L.sym, true)}</td>
                                ${R ? `
                                    <td class="${badR}" style="text-align:center;font-weight:700;width:24px;border-left:1.5px solid #333333 !important;">${letters[i + mid] || (i + mid + 1)}</td>
                                    <td class="${badR}" style="text-align:left;padding-left:4px;font-size:6.9pt;">${esc(tx(R.text))}</td>
                                    <td class="a4-click-sym${badR}"${clickR} style="text-align:center;width:34px;">${formatSymBadge(R.sym, true)}</td>
                                ` : `<td style="border-left:1.5px solid #333333 !important;"></td><td></td><td></td>`}
                            </tr>`;
                        }
                        const thead = isFirst ? `<thead><tr><th></th><th style="text-align:left;padding-left:4px;">Soru / Kriter</th><th style="text-align:center;border-right:1.5px solid #333333 !important;">1</th><th style="border-left:1.5px solid #333333 !important;"></th><th style="text-align:left;padding-left:4px;">Soru / Kriter</th><th style="text-align:center;">1</th></tr></thead>` : '';
                        topicTableHtml = `
                            <div class="tkm-sub-bar">${esc(tx(t.title))}</div>
                            <table class="tkm-table tkm-table-twocol">
                                <colgroup><col style="width:24px;"><col style="width:42%;"><col style="width:34px;"><col style="width:24px;"><col style="width:42%;"><col style="width:34px;"></colgroup>
                                ${thead}<tbody>${rows}</tbody>
                            </table>
                            ${isLast ? `<div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>` : ''}
                        `;
                    } else {
                        const rows = (t.items || []).map((it, i) => {
                            const clickAttr = interactive ? ` onclick="studioAppCycleVisual('${esc(sec.id)}', ${tIdx}, ${i}, event)"` : '';
                            return `<tr>
                                <td style="text-align:center;font-weight:700;">${letters[i] || (i + 1)}</td>
                                <td style="text-align:left;padding-left:6px;">${esc(tx(it.text))}</td>
                                <td class="a4-click-sym"${clickAttr} style="text-align:center;">${formatSymBadge(it.sym, false)}</td>
                            </tr>`;
                        }).join('');
                        topicTableHtml = `
                            <div class="tkm-sub-bar">${esc(tx(t.title))}</div>
                            <table class="tkm-table">
                                <colgroup><col style="width:28px;"><col><col style="width:42px;"></colgroup>
                                <thead><tr><th></th><th style="text-align:left;padding-left:6px;">Soru / Kriter</th><th style="text-align:center;">1</th></tr></thead>
                                <tbody>${rows}</tbody>
                            </table>
                            <div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>
                        `;
                    }
                    if (isLast && sec.footnote) {
                        topicTableHtml += `<div style="font-size:6.8pt;color:#333333;font-style:italic;margin-top:2px;">${esc(tx(sec.footnote))}</div>`;
                    }
                    blocks.push(wrapBlock(sec, topicTableHtml, false, false));
                });
                continue;
            }

            // FUNC MATRIX
            if (sec.type === 'func_matrix') {
                const forceBreak = Boolean((rams && sec.forceBreakInRams) || (!rams && sec.forceBreakInClassic));
                let inner = '';
                if (rams) {
                    const methodHtml = (sec.methodOptions || []).map(opt => {
                        const sel = sec.methodValue === opt;
                        const clickAttr = interactive ? ` onclick="studioAppPickFunc('${esc(sec.id)}', 'methodValue', '${esc(opt)}', event)"` : '';
                        return `<span class="${interactive ? 'a4-click-opt' : ''}"${clickAttr} style="display:inline-flex;align-items:center;margin-right:16px;font-weight:${sel ? '700' : '400'};">${renderRadioDot(sel)}${esc(opt)}</span>`;
                    }).join('');
                    const dkdHtml = (sec.dkdOptions || []).map(opt => {
                        const sel = sec.dkdTypeVal === opt;
                        const clickAttr = interactive ? ` onclick="studioAppPickFunc('${esc(sec.id)}', 'dkdTypeVal', '${esc(opt)}', event)"` : '';
                        return `<span class="${interactive ? 'a4-click-opt' : ''}"${clickAttr} style="display:inline-flex;align-items:center;margin-right:6px;font-weight:${sel ? '700' : '400'};">${renderRadioDot(sel)}${esc(opt)}</span>`;
                    }).join('');
                    inner = `
                        <div class="tkm-sec-title">${esc(tx(sec.title))}</div>
                        <div class="tkm-sub-bar">${esc(tx(sec.methodTitle))}</div>
                        <table class="tkm-table" style="margin-bottom:2px;"><tbody><tr><td class="tkm-val-cell" style="text-align:left;padding:2.5px 6px;">${methodHtml}</td></tr></tbody></table>
                        <div class="tkm-sub-bar">${esc(tx(sec.subTitle))}</div>
                        <table class="tkm-table">
                            <colgroup><col style="width:25%;"><col style="width:11%;"><col style="width:16%;"><col style="width:11%;"><col style="width:22%;"><col style="width:15%;"></colgroup>
                            <tbody>
                                <tr><td class="tkm-label-cell">${esc(tx(sec.panoLabel))}</td><td class="tkm-val-cell" data-bind="fm:${sec.id}:panoValue" colspan="5">${esc(tx(sec.panoValue))}</td></tr>
                                <tr>
                                    <td class="tkm-label-cell">${esc(tx(sec.zxLabel))}</td><td class="tkm-val-cell" data-bind="fm:${sec.id}:zxVal" style="text-align:center;">${esc(tx(sec.zxVal))}</td>
                                    <td class="tkm-label-cell">${esc(tx(sec.ffLabel))}</td><td class="tkm-val-cell" data-bind="fm:${sec.id}:ffVal" style="text-align:center;">${esc(tx(sec.ffVal))}</td>
                                    <td class="tkm-label-cell" rowspan="2">${esc(tx(sec.dkdTypeLabel))}</td><td class="tkm-val-cell" rowspan="2" style="font-size:6.8pt;line-height:1.3;">${dkdHtml}</td>
                                </tr>
                                <tr>
                                    <td class="tkm-label-cell">${esc(tx(sec.zlnLabel))}</td><td class="tkm-val-cell" data-bind="fm:${sec.id}:zlnVal" style="text-align:center;">${esc(tx(sec.zlnVal))}</td>
                                    <td class="tkm-label-cell">${esc(tx(sec.lnLabel))}</td><td class="tkm-val-cell" data-bind="fm:${sec.id}:lnVal" style="text-align:center;">${esc(tx(sec.lnVal))}</td>
                                </tr>
                                <tr>
                                    <td class="tkm-label-cell">${esc(tx(sec.ik3Label))}</td><td class="tkm-val-cell" data-bind="fm:${sec.id}:ik3Val" style="text-align:center;">${esc(tx(sec.ik3Val))}</td>
                                    <td class="tkm-label-cell">${esc(tx(sec.npeLabel))}</td><td class="tkm-val-cell" data-bind="fm:${sec.id}:npeVal" style="text-align:center;">${esc(tx(sec.npeVal))}</td>
                                    <td class="tkm-label-cell">${esc(tx(sec.dkdKaLabel))}</td><td class="tkm-val-cell" data-bind="fm:${sec.id}:dkdKaVal" style="text-align:center;">${esc(tx(sec.dkdKaVal))}</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                } else {
                    inner = `
                        <div class="tkm-sec-title">${esc(tx(sec.title))}</div>
                        <div class="tkm-sub-bar">${esc(tx(sec.methodTitle))}</div>
                        <table class="tkm-table"><colgroup><col style="width:50%;"><col style="width:50%;"></colgroup><tbody><tr><td style="text-align:center;">Ölçüm ve doğrulama metodu</td><td data-bind="fm:${sec.id}:methodValue">${esc(tx(sec.methodValue))}</td></tr></tbody></table>
                        <div class="tkm-sub-bar">${esc(tx(sec.subTitle))}</div>
                        <table class="tkm-table" style="margin-bottom:2px;"><colgroup><col style="width:50%;"><col style="width:50%;"></colgroup><tbody><tr><td style="text-align:center;">${esc(tx(sec.panoLabel))}</td><td data-bind="fm:${sec.id}:panoValue">${esc(tx(sec.panoValue))}</td></tr></tbody></table>
                        <table class="tkm-table">
                            <colgroup><col style="width:14.5%;"><col style="width:10.5%;"><col style="width:14.5%;"><col style="width:10.5%;"><col style="width:14.5%;"><col style="width:10.5%;"><col style="width:14.5%;"><col style="width:10.5%;"></colgroup>
                            <tbody>
                                <tr><td style="text-align:center;">${esc(tx(sec.zxLabel))}</td><td data-bind="fm:${sec.id}:zxVal">${esc(tx(sec.zxVal))}</td><td style="text-align:center;">${esc(tx(sec.zlnLabel))}</td><td data-bind="fm:${sec.id}:zlnVal">${esc(tx(sec.zlnVal))}</td><td style="text-align:center;">${esc(tx(sec.ik3Label))}</td><td data-bind="fm:${sec.id}:ik3Val">${esc(tx(sec.ik3Val))}</td><td style="text-align:center;">${esc(tx(sec.dkdTypeLabel))}</td><td data-bind="fm:${sec.id}:dkdTypeVal">${esc(tx(sec.dkdTypeVal))}</td></tr>
                                <tr><td style="text-align:center;">${esc(tx(sec.ffLabel))}</td><td data-bind="fm:${sec.id}:ffVal">${esc(tx(sec.ffVal))}</td><td style="text-align:center;">${esc(tx(sec.lnLabel))}</td><td data-bind="fm:${sec.id}:lnVal">${esc(tx(sec.lnVal))}</td><td style="text-align:center;">${esc(tx(sec.npeLabel))}</td><td data-bind="fm:${sec.id}:npeVal">${esc(tx(sec.npeVal))}</td><td style="text-align:center;">${esc(tx(sec.dkdKaLabel))}</td><td data-bind="fm:${sec.id}:dkdKaVal">${esc(tx(sec.dkdKaVal))}</td></tr>
                            </tbody>
                        </table>
                    `;
                }
                blocks.push(wrapBlock(sec, inner, forceBreak));
                continue;
            }

            // NOTES BOX
            if (sec.type === 'notes_box') {
                const contentTxt = tx(sec.content || '');
                const isCleanDefect = sec.isDefectBox && rams && contentTxt.toLowerCase().includes('bulunmamaktadır');
                const bodyContent = isCleanDefect
                    ? `<div style="color:#14573a;font-weight:700;font-size:7.3pt;">✓ ${esc(contentTxt)}</div>`
                    : escBr(contentTxt);
                blocks.push(wrapBlock(sec, `
                    <div class="tkm-sec-title">${esc(tx(sec.title))}</div>
                    <table class="tkm-table ${rams ? 'tkm-general-notes-box' : ''}">
                        <tbody><tr><td data-bind="note:${sec.id}" style="min-height:22px;height:24px;vertical-align:top;text-align:left;padding:3.5px 6px;">${bodyContent}</td></tr></tbody>
                    </table>
                    ${sec.bottomNote ? `<div style="font-size:6.8pt;color:#222;font-weight:600;padding:2.5px 6px;margin-top:2px;background:#fff;border:1px solid ${rams ? '#cbd5e1' : '#000'};border-radius:2px;">${esc(tx(sec.bottomNote))}</div>` : ''}
                `));
                continue;
            }

            // CONCLUSION BOX
            if (sec.type === 'conclusion_box') {
                const isOk = sec.overallResult !== 'UYGUN DEĞİL';
                const banner = `
                    <div class="tkm-conclusion-box ${isOk ? 'tkm-result-box-ok' : 'tkm-result-box-bad'}" style="margin:2px 0 4px 0;font-size:7.4pt;font-weight:700;color:${isOk ? '#047857' : '#c00000'};line-height:1.25;">
                        ${esc(tx(sec.leadSentence || ''))}<br>
                        <span style="font-size:8.4pt;">${esc(tx(isOk ? sec.okSentence : sec.badSentence))}</span>
                    </div>
                `;
                const heavyLines = String(sec.heavyDefectsText || '').split(/\r?\n/).map(line => {
                    const bold = /^(Gözle Kontrol Bölümü|Fonksiyon Testleri Bölümü|Ağır kusur olarak)/i.test(line.trim());
                    return `<div${bold ? ' style="font-weight:700;margin-top:2px;"' : ''}>${esc(line)}</div>`;
                }).join('');
                const heavyBlock = sec.heavyDefectsText ? (rams
                    ? `<div style="column-count:2;column-gap:12px;font-size:7pt;line-height:1.15;text-align:left;"><div style="font-weight:700;">Ağır kusur tanımları:</div>${heavyLines}</div>`
                    : `<div style="font-size:6.6pt;line-height:1.15;text-align:left;"><div style="font-weight:700;">Ağır kusur tanımları:</div>${heavyLines}</div>`) : '';
                const forceBreak = Boolean((rams && sec.forceBreakInRams) || (!rams && sec.forceBreakInClassic));
                blocks.push(wrapBlock(sec, `
                    <div class="tkm-sec-title">${esc(tx(sec.title))}</div>
                    <table class="tkm-table"><tbody><tr><td style="padding:4px 6px;text-align:left;">
                        ${rams ? `${banner}${heavyBlock}` : `${heavyBlock}${banner}`}
                    </td></tr></tbody></table>
                `, forceBreak));
                continue;
            }

            // APPROVAL BOX (Canlı Portal QR + Personel İmza)
            if (sec.type === 'approval_box') {
                const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || {};
                const hasPortalQr = Boolean(insp && insp.portal_report_url && typeof window.generateQrDataUrl === 'function');
                const qrSrc = hasPortalQr
                    ? window.generateQrDataUrl(insp.portal_report_url)
                    : ((window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.qrDefault) || 'assets/qr_default.jpg');
                const verifyCodeHtml = (insp && insp.portal_verify_code)
                    ? `<div style="font-size:6pt;font-family:monospace;font-weight:700;color:#111;margin-top:2px;letter-spacing:0.3px;">Doğrulama: ${esc(insp.portal_verify_code)}</div>`
                    : '';
                const eimzaSrc = curUser.signatureImage || (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.eimza) || 'assets/eimza.jpg';
                blocks.push(wrapBlock(sec, `
                    <div class="tkm-sec-title">${esc(tx(sec.title))}</div>
                    <table class="tkm-table">
                        <colgroup><col style="width:19%;"><col style="width:48%;"><col style="width:33%;"></colgroup>
                        <thead><tr><th></th><th style="text-align:center;">Muayene Personeli</th><th style="text-align:center;">Kare Kod</th></tr></thead>
                        <tbody>
                            <tr>
                                <td style="font-weight:700;">Adı Soyadı / Mesleği</td>
                                <td data-bind="appr:${sec.id}:inspectorName" style="text-align:center;font-weight:700;">${esc(tx(sec.inspectorName))}</td>
                                <td rowspan="4" style="text-align:center;vertical-align:middle;padding:4px;">
                                    ${sec.showQr !== false ? `<img src="${qrSrc}" alt="QR" style="width:${verifyCodeHtml ? '70px' : '76px'};height:${verifyCodeHtml ? '70px' : '76px'};object-fit:contain;display:inline-block;">${verifyCodeHtml}` : ''}
                                </td>
                            </tr>
                            <tr><td style="font-weight:700;">Bakanlık Kayıt No</td><td data-bind="appr:${sec.id}:ministryNo" style="text-align:center;font-weight:700;">${esc(tx(sec.ministryNo))}</td></tr>
                            <tr><td style="font-weight:700;">Diploma No / Tarih</td><td data-bind="appr:${sec.id}:diplomaNo" style="text-align:center;font-weight:700;">${esc(tx(sec.diplomaNo))}</td></tr>
                            <tr style="height:44px;">
                                <td style="font-weight:700;">İmza</td>
                                <td style="text-align:center;vertical-align:middle;padding:3px;">
                                    ${sec.showEimza !== false ? `<img src="${eimzaSrc}" alt="e-imzalıdır" style="height:34px;object-fit:contain;display:inline-block;">` : ''}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    ${sec.footnote ? `<div style="font-size:6.8pt;color:#333;margin-top:2px;font-style:italic;">${esc(tx(sec.footnote))}</div>` : ''}
                `));
                continue;
            }

            // CHART BLOCK
            if (sec.type === 'chart_block') {
                blocks.push(wrapBlock(sec, `
                    ${sec.title ? `<div class="tkm-sec-title">${esc(tx(sec.title))}</div>` : ''}
                    <div class="tkm-chart-box">
                        ${sec.chartTitle ? `<div class="tkm-chart-title">${esc(tx(sec.chartTitle))}</div>` : ''}
                        ${renderChartSvg(sec)}
                    </div>
                `));
                continue;
            }

            // IMAGE BLOCK
            if (sec.type === 'image_block') {
                const imgs = Array.isArray(sec.images) ? sec.images : [];
                const cols = Math.max(1, Math.min(3, Number(sec.cols || 2)));
                blocks.push(wrapBlock(sec, `
                    ${sec.title ? `<div class="tkm-sec-title">${esc(tx(sec.title))}</div>` : ''}
                    <div class="tkm-img-grid" style="grid-template-columns:repeat(${cols}, 1fr);">
                        ${imgs.length === 0 ? `<div style="grid-column:1/-1;text-align:center;color:#64748b;padding:10px;font-size:7.2pt;">Görsel eklenmemiş.</div>` : imgs.map(im => `
                            <div class="tkm-img-item">
                                <img src="${esc(im.src)}" alt="${esc(im.caption || 'Görsel')}">
                                ${im.caption ? `<div class="tkm-img-cap">${esc(tx(im.caption))}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `));
                continue;
            }

            // CALLOUT BLOCK
            if (sec.type === 'callout_block') {
                const variant = sec.variant || 'info';
                blocks.push(wrapBlock(sec, `
                    <div class="tkm-callout ${esc(variant)}">
                        ${sec.title ? `<div class="tkm-callout-title">${esc(tx(sec.title))}</div>` : ''}
                        <div>${escBr(tx(sec.body || ''))}</div>
                    </div>
                `));
                continue;
            }

            // SIGNATURE BLOCK
            if (sec.type === 'signature_block') {
                const signers = Array.isArray(sec.signers) && sec.signers.length > 0 ? sec.signers : [
                    { role: 'Muayene Mühendisi', name: 'Ad Soyad' },
                    { role: 'Firma Yetkilisi', name: 'Ad Soyad' }
                ];
                blocks.push(wrapBlock(sec, `
                    ${sec.title ? `<div class="tkm-sec-title">${esc(tx(sec.title))}</div>` : ''}
                    <table class="tkm-table tkm-sig-table">
                        <thead><tr>${signers.map(sg => `<th style="text-align:center;">${esc(tx(sg.role || 'Yetkili'))}</th>`).join('')}</tr></thead>
                        <tbody>
                            <tr>${signers.map((sg, sIdx) => `<td data-bind="sig:${sec.id}:${sIdx}:name" style="text-align:center;font-weight:700;">${esc(tx(sg.name || ''))}</td>`).join('')}</tr>
                            <tr style="height:36px;">${signers.map(() => `<td style="text-align:center;color:#94a3b8;font-size:6.5pt;vertical-align:bottom;">İmza / Kaşe</td>`).join('')}</tr>
                        </tbody>
                    </table>
                `));
                continue;
            }
        }
        return blocks;
    }

    function applySectionStylesToDom(root, s) {
        const secById = new Map((s.sections || []).map(sec => [sec.id, sec]));
        root.querySelectorAll('.a4-interactive-block[data-sec-id]').forEach(blk => {
            const sec = secById.get(blk.dataset.secId);
            const st = sec && sec.style ? sec.style : null;
            if (!st || Object.keys(st).length === 0) return;
            if (st.marginTop != null && Number(st.marginTop) > 0) blk.style.marginTop = `${st.marginTop}px`;
            if (st.marginBottom != null && Number(st.marginBottom) > 0) blk.style.marginBottom = `${st.marginBottom}px`;
            if (st.titleColor) {
                blk.querySelectorAll('.tkm-sec-title').forEach(el => {
                    el.style.setProperty('color', st.titleColor, 'important');
                    el.style.setProperty('border-left-color', st.titleColor, 'important');
                });
            }
            if (st.thBg) {
                blk.querySelectorAll('.tkm-table th').forEach(el => el.style.setProperty('background-color', st.thBg, 'important'));
            }
            if (st.borderColor) {
                blk.querySelectorAll('.tkm-table, .tkm-table th, .tkm-table td').forEach(el => el.style.setProperty('border-color', st.borderColor, 'important'));
            }
            if (st.fontSize && Number(st.fontSize) >= 5) {
                blk.querySelectorAll('.tkm-table, .tkm-table th, .tkm-table td').forEach(el => el.style.setProperty('font-size', `${st.fontSize}pt`, 'important'));
            }
            if ((st.padY != null && st.padY !== '') || (st.padX != null && st.padX !== '')) {
                blk.querySelectorAll('.tkm-table th, .tkm-table td').forEach(el => {
                    if (st.padY != null && st.padY !== '') {
                        el.style.setProperty('padding-top', `${st.padY}px`, 'important');
                        el.style.setProperty('padding-bottom', `${st.padY}px`, 'important');
                    }
                    if (st.padX != null && st.padX !== '') {
                        el.style.setProperty('padding-left', `${st.padX}px`, 'important');
                        el.style.setProperty('padding-right', `${st.padX}px`, 'important');
                    }
                });
            }
            if (st.rowMinHeight && Number(st.rowMinHeight) > 0) {
                blk.querySelectorAll('.tkm-table td').forEach(el => el.style.setProperty('height', `${st.rowMinHeight}px`, 'important'));
            }
        });
    }

    function applyCellKeysAndStyles(root, s, ctx, sharedCounter, interactive = false) {
        ensureStyleDefaults(s);
        const cellStyles = s.cellStyles || {};
        const overrides = s.cellTextOverrides || {};
        const cellMerges = s.cellMerges || {};
        const secTableCounter = sharedCounter || new Map();

        root.querySelectorAll('.a4-interactive-block[data-sec-id]').forEach(blk => {
            const secId = blk.dataset.secId;
            blk.querySelectorAll('table.tkm-table').forEach(tbl => {
                const tIdx = secTableCounter.get(secId) || 0;
                secTableCounter.set(secId, tIdx + 1);
                tbl.dataset.tblKey = `${secId}::t${tIdx}`;

                const savedColW = s.tableColWidths && s.tableColWidths[tbl.dataset.tblKey];
                if (Array.isArray(savedColW) && savedColW.length > 0) {
                    const colsDom = tbl.querySelectorAll('colgroup col');
                    savedColW.forEach((w, ci) => {
                        if (colsDom[ci] && w > 0) colsDom[ci].style.width = `${w}%`;
                    });
                }

                const rows = tbl.querySelectorAll('tr:not(.excel-col-letters)');
                const gridMatrix = [];

                rows.forEach((tr, rIdx) => {
                    const cells = Array.from(tr.querySelectorAll('th, td'));
                    gridMatrix[rIdx] = cells;
                    cells.forEach((cell, cIdx) => {
                        const key = `${secId}::t${tIdx}::r${rIdx}::c${cIdx}`;
                        cell.dataset.cellKey = key;
                        cell.dataset.rIdx = String(rIdx);
                        cell.dataset.cIdx = String(cIdx);

                        if (Object.prototype.hasOwnProperty.call(overrides, key) && isCellTextEditable(cell)) {
                            const resolved = resolvePlaceholders(overrides[key], ctx);
                            setCellTextClean(cell, resolved);
                            cell.dataset.rawValue = String(resolved);
                        } else if (isCellTextEditable(cell) && cell.dataset.rawValue === undefined) {
                            cell.dataset.rawValue = getCellEditableText(cell);
                        }

                        const st = cellStyles[key];
                        if (st) {
                            if (st.bg) cell.style.setProperty('background-color', st.bg, 'important');
                            if (st.color) cell.style.setProperty('color', st.color, 'important');
                            if (st.fontFamily) cell.style.setProperty('font-family', st.fontFamily, 'important');
                            if (st.fontSize) cell.style.setProperty('font-size', `${st.fontSize}pt`, 'important');
                            if (st.bold) cell.style.setProperty('font-weight', '800', 'important');
                            if (st.italic) cell.style.setProperty('font-style', 'italic', 'important');
                            if (st.underline || st.strike) {
                                const dec = [st.underline ? 'underline' : '', st.strike ? 'line-through' : ''].filter(Boolean).join(' ');
                                cell.style.setProperty('text-decoration', dec, 'important');
                            }
                            if (st.uppercase) cell.style.setProperty('text-transform', 'uppercase', 'important');
                            if (st.subscript) {
                                cell.style.setProperty('vertical-align', 'sub', 'important');
                                if (!st.fontSize) cell.style.setProperty('font-size', '5.8pt', 'important');
                            } else if (st.superscript) {
                                cell.style.setProperty('vertical-align', 'super', 'important');
                                if (!st.fontSize) cell.style.setProperty('font-size', '5.8pt', 'important');
                            }
                            if (st.align) cell.style.setProperty('text-align', st.align, 'important');
                            if (st.valign) cell.style.setProperty('vertical-align', st.valign, 'important');
                            if (st.wrapText === false) {
                                cell.style.setProperty('white-space', 'nowrap', 'important');
                                cell.style.setProperty('overflow', 'hidden', 'important');
                                cell.style.setProperty('text-overflow', 'ellipsis', 'important');
                            }
                            if (st.orientation === 'vertical') {
                                cell.style.setProperty('writing-mode', 'vertical-rl', 'important');
                                cell.style.setProperty('transform', 'rotate(180deg)', 'important');
                            }
                            if (st.minHeight) cell.style.setProperty('height', `${st.minHeight}px`, 'important');
                            if (st.padY != null && st.padY !== '') {
                                cell.style.setProperty('padding-top', `${st.padY}px`, 'important');
                                cell.style.setProperty('padding-bottom', `${st.padY}px`, 'important');
                            }
                            if (st.padLeft != null && st.padLeft !== '') {
                                cell.style.setProperty('padding-left', `${st.padLeft}px`, 'important');
                            }
                            if (st.lineHeight) cell.style.setProperty('line-height', `${st.lineHeight}`, 'important');
                            if (st.border) cell.style.setProperty('border', st.border, 'important');
                            if (st.borderTop) cell.style.setProperty('border-top', st.borderTop, 'important');
                            if (st.borderBottom) cell.style.setProperty('border-bottom', st.borderBottom, 'important');
                            if (st.borderLeft) cell.style.setProperty('border-left', st.borderLeft, 'important');
                            if (st.borderRight) cell.style.setProperty('border-right', st.borderRight, 'important');
                        }

                        if (interactive && isCellTextEditable(cell)) {
                            const bindAttr = cell.dataset.bind || '';
                            cell.setAttribute('onclick', `studioAppOpenCellEditModal('${esc(key)}', '${esc(bindAttr)}', event)`);
                            cell.title = 'Hücreyi düzenlemek için dokunun';
                        }
                    });
                });

                // Hücre Birleştirmeleri
                gridMatrix.forEach((rowCells, rIdx) => {
                    rowCells.forEach((cell, cIdx) => {
                        const key = cell.dataset.cellKey;
                        const mg = cellMerges[key];
                        if (!mg || (!mg.colspan && !mg.rowspan)) return;
                        const cs = Math.max(1, Number(mg.colspan || 1));
                        const rs = Math.max(1, Number(mg.rowspan || 1));
                        if (cs === 1 && rs === 1) return;
                        cell.colSpan = cs;
                        cell.rowSpan = rs;
                        for (let dr = 0; dr < rs; dr++) {
                            for (let dc = 0; dc < cs; dc++) {
                                if (dr === 0 && dc === 0) continue;
                                const covered = gridMatrix[rIdx + dr]?.[cIdx + dc];
                                if (covered) {
                                    covered.style.display = 'none';
                                    covered.dataset.mergedBy = key;
                                }
                            }
                        }
                    });
                });

                // Excel Formül Hesaplama & Koşullu Biçimlendirme
                evaluateTableVisuals(tbl, gridMatrix, secId, s);
            });
        });
    }

    function buildStudioA4Render(insp, fd, ci, reportNo, options = {}) {
        const s = ensureStudioFormData(insp, fd);
        if (!s) {
            return {
                pagesOuterHtml: `<div class="tkm-a4-page" data-pdf-theme="rams_navy"><div class="tkm-page-body"><div style="padding:20px;color:#b91c1c;font-weight:700;">Studio şablonu bulunamadı. Lütfen bulut senkronizasyonu yapın.</div></div></div>`,
                pageCount: 1,
                effectiveTheme: 'rams_navy',
                isLandscape: false
            };
        }

        ensureStyleDefaults(s);
        const interactive = Boolean(options.interactive);
        const isPreviewSheet = Boolean(options.previewSheet);
        const ds = s.designSettings || DEFAULT_DESIGN_SETTINGS;
        const isLandscape = ds.orientation === 'landscape';
        const theme = s.pdfTheme || 'rams_navy';
        const ctx = buildPlaceholderContext(insp, fd, ci);
        const blocks = buildStudioBlocksForSchema(s, insp, ctx, interactive);
        const { styleText, extraClasses } = buildStudioLayoutStyleAttr(s);

        let pagesBodyHtml = [];
        if (typeof document !== 'undefined' && document.body) {
            let sandbox = document.getElementById('studioAppMeasureSandbox');
            if (sandbox) sandbox.remove();
            sandbox = document.createElement('div');
            sandbox.id = 'studioAppMeasureSandbox';
            sandbox.style.cssText = `position:fixed;left:-10000px;top:0;width:${isLandscape ? '297mm' : '210mm'};visibility:hidden;pointer-events:none;z-index:-1;`;
            sandbox.setAttribute('data-pdf-theme', theme);
            document.body.appendChild(sandbox);

            const probePage = document.createElement('div');
            probePage.className = `tkm-a4-page ${extraClasses}${isLandscape ? ' tkm-a4-landscape' : ''}`;
            probePage.setAttribute('data-pdf-theme', theme);
            applyLayoutCssVarsToEl(probePage, s);
            probePage.innerHTML = `
                ${ds.hideHeader ? '' : buildStudioPageHeaderHtml(s, ctx)}
                <div id="stAppProbeBody" style="flex:0 0 auto;display:block;width:100%;"></div>
                ${ds.hideFooter ? '' : buildStudioPageFooterHtml(s, 1, 1, reportNo, ctx)}
            `;
            sandbox.appendChild(probePage);

            const cs = window.getComputedStyle(probePage);
            const padTop = parseFloat(cs.paddingTop) || 24;
            const padBottom = parseFloat(cs.paddingBottom) || 22;
            const pageInnerH = (probePage.clientHeight || (isLandscape ? 790 : 1120)) - padTop - padBottom;
            const headerH = ds.hideHeader ? 0 : ((probePage.querySelector('.tkm-header')?.offsetHeight || 105) + 4);
            const footerH = ds.hideFooter ? 0 : ((probePage.querySelector('.tkm-footer')?.offsetHeight || 48) + 6);
            const maxBodyH = Math.max(200, pageInnerH - headerH - footerH - 6);

            const bodyEl = probePage.querySelector('#stAppProbeBody');
            const sandboxCounter = new Map();

            for (const blk of blocks) {
                if (blk.forceBreak && bodyEl.children.length > 0) {
                    pagesBodyHtml.push(bodyEl.innerHTML);
                    bodyEl.innerHTML = '';
                }
                const el = document.createElement('div');
                el.className = 'tkm-block';
                el.innerHTML = blk.html;
                applySectionStylesToDom(el, s);
                applyCellKeysAndStyles(el, s, ctx, sandboxCounter, interactive);
                bodyEl.appendChild(el);

                if (bodyEl.children.length > 1 && bodyEl.offsetHeight > maxBodyH) {
                    bodyEl.removeChild(el);
                    pagesBodyHtml.push(bodyEl.innerHTML);
                    bodyEl.innerHTML = '';
                    bodyEl.appendChild(el);
                }
            }
            if (bodyEl.children.length > 0) pagesBodyHtml.push(bodyEl.innerHTML);
            sandbox.remove();
        } else {
            // Headless fallback
            pagesBodyHtml = [blocks.map(b => `<div class="tkm-block">${b.html}</div>`).join('')];
        }

        if (!pagesBodyHtml.length) pagesBodyHtml = [''];
        const totalPages = pagesBodyHtml.length;
        const pageBorderCls = (ds.pageBorder && ds.pageBorder !== 'none') ? ` page-border-${ds.pageBorder}` : '';
        const wmHtml = ds.watermarkText
            ? `<div class="tkm-watermark"><span style="color:${esc(ds.watermarkColor || '#64748b')};opacity:${Number(ds.watermarkOpacity || 0.11)};">${esc(resolvePlaceholders(ds.watermarkText, ctx))}</span></div>`
            : '';

        const pagesOuterHtml = pagesBodyHtml.map((bodyHtml, idx) => `
            <div class="tkm-a4-page ${extraClasses}${isPreviewSheet ? ' tkm-preview-sheet' : ''}${isLandscape ? ' tkm-a4-landscape' : ''}${pageBorderCls}" data-pdf-theme="${esc(theme)}" data-page-num="${idx + 1}" style="${esc(styleText)}">
                ${wmHtml}
                ${ds.hideHeader ? '' : buildStudioPageHeaderHtml(s, ctx)}
                <div class="tkm-page-body">${bodyHtml}</div>
                ${ds.hideFooter ? '' : buildStudioPageFooterHtml(s, idx + 1, totalPages, reportNo, ctx)}
            </div>
        `).join('');

        return {
            pagesOuterHtml,
            pageCount: totalPages,
            effectiveTheme: theme,
            isLandscape
        };
    }

    // ========================================================================
    // 5. SAHA EDİTÖRÜ (MOBİL FORM + CANLI A4 HÜCRE DÜZENLEME)
    // ========================================================================
    function findSectionById(secId) {
        const fd = window.AppState && window.AppState.currentFormData;
        if (!fd || !fd.studioSchema || !Array.isArray(fd.studioSchema.sections)) return null;
        return fd.studioSchema.sections.find(x => x.id === secId) || null;
    }

    function markStudioDirty(repaint = false) {
        if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
        if (repaint && typeof window.paintInspectionEditorUI === 'function') {
            window.paintInspectionEditorUI();
        }
    }

    function applyStudioCellEdit(key, bindAttr, newVal) {
        const fd = window.AppState && window.AppState.currentFormData;
        if (!fd || !fd.studioSchema) return;
        const s = fd.studioSchema;
        ensureStyleDefaults(s);

        let syncedNative = false;
        if (bindAttr) {
            const parts = String(bindAttr).split(':');
            const kind = parts[0];
            const sec = findSectionById(parts[1]);
            if (sec) {
                if (kind === 'ci' && sec.rows && sec.rows[Number(parts[2])]) {
                    sec.rows[Number(parts[2])][parts[3]] = newVal;
                    syncedNative = true;
                } else if (kind === 'ci_scope') {
                    sec.scopeLines = String(newVal || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                    sec.scopeRawLines = true;
                    syncedNative = true;
                } else if (kind === 'ci_scope_lbl') {
                    sec.scopeLabel = newVal;
                    syncedNative = true;
                } else if (kind === 'd21' && sec.fields && sec.fields[Number(parts[2])]) {
                    sec.fields[Number(parts[2])].value = newVal;
                    syncedNative = true;
                } else if (kind === 'd22_prot_title') {
                    sec.protectionTitle = newVal;
                    syncedNative = true;
                } else if (kind === 'dt_col' && sec.columns && sec.columns[Number(parts[2])]) {
                    sec.columns[Number(parts[2])].label = newVal;
                    syncedNative = true;
                } else if (kind === 'dt_cell' && sec.rows && sec.rows[Number(parts[2])]) {
                    sec.rows[Number(parts[2])][parts[3]] = newVal;
                    syncedNative = true;
                } else if (kind === 'vc_pano') {
                    sec.panoValue = newVal;
                    syncedNative = true;
                } else if (kind === 'fm') {
                    sec[parts[2]] = newVal;
                    syncedNative = true;
                } else if (kind === 'note') {
                    sec.content = String(newVal || '').replace(/^✓\s*/, '');
                    syncedNative = true;
                } else if (kind === 'appr') {
                    sec[parts[2]] = newVal;
                    syncedNative = true;
                } else if (kind === 'sig' && sec.signers && sec.signers[Number(parts[2])]) {
                    sec.signers[Number(parts[2])][parts[3]] = newVal;
                    syncedNative = true;
                }
            }
        }

        if (syncedNative) {
            delete s.cellTextOverrides[key];
        } else {
            s.cellTextOverrides[key] = newVal;
        }
        markStudioDirty(true);
    }

    function readStudioCellCurrentValue(key, bindAttr) {
        const fd = window.AppState && window.AppState.currentFormData;
        if (!fd || !fd.studioSchema) return '';
        const s = fd.studioSchema;
        ensureStyleDefaults(s);
        if (Object.prototype.hasOwnProperty.call(s.cellTextOverrides, key)) {
            return String(s.cellTextOverrides[key] ?? '');
        }
        if (bindAttr) {
            const parts = String(bindAttr).split(':');
            const kind = parts[0];
            const sec = findSectionById(parts[1]);
            if (sec) {
                if (kind === 'ci' && sec.rows && sec.rows[Number(parts[2])]) return String(sec.rows[Number(parts[2])][parts[3]] ?? '');
                if (kind === 'ci_scope') return (sec.scopeLines || []).join('\n');
                if (kind === 'ci_scope_lbl') return String(sec.scopeLabel ?? '');
                if (kind === 'd21' && sec.fields && sec.fields[Number(parts[2])]) return String(sec.fields[Number(parts[2])].value ?? '');
                if (kind === 'd22_prot_title') return String(sec.protectionTitle ?? '');
                if (kind === 'dt_col' && sec.columns && sec.columns[Number(parts[2])]) return String(sec.columns[Number(parts[2])].label ?? '');
                if (kind === 'dt_cell' && sec.rows && sec.rows[Number(parts[2])]) return String(sec.rows[Number(parts[2])][parts[3]] ?? '');
                if (kind === 'vc_pano') return String(sec.panoValue ?? '');
                if (kind === 'fm') return String(sec[parts[2]] ?? '');
                if (kind === 'note') return String(sec.content ?? '');
                if (kind === 'appr') return String(sec[parts[2]] ?? '');
                if (kind === 'sig' && sec.signers && sec.signers[Number(parts[2])]) return String(sec.signers[Number(parts[2])][parts[3]] ?? '');
            }
        }
        return '';
    }

    // Canlı A4 & Form etkileşim fonksiyonları
    window.studioAppSetViewMode = function (mode) {
        window.AppState.studioEditorViewMode = mode === 'a4' ? 'a4' : 'form';
        if (typeof window.paintInspectionEditorUI === 'function') window.paintInspectionEditorUI();
    };

    window.studioAppUpgradeToLatestTemplate = function () {
        const insp = window.AppState && window.AppState.currentInspection;
        const fd = window.AppState && window.AppState.currentFormData;
        if (!insp || !fd) return;
        const latest = StudioTemplateManager.getById(insp.template_id);
        if (!latest || !latest.schema_json) return;
        if (!confirm(`Bu raporu Studio şablonunun en son yayınlanan sürümüne (${latest.version_label}) güncellemek istiyor musunuz?\n\nMevcut şablon yapısı yenilenecek; firma ve ekipman bilgileri tekrar doldurulacaktır.`)) {
            return;
        }
        const cloned = deepClone(latest.schema_json);
        ensureStyleDefaults(cloned);
        seedSchemaInitialValuesFromInspection(cloned, insp, fd);
        fd.studioSchema = cloned;
        fd.studioMeta = {
            template_key: latest.template_key,
            template_id: latest.template_id,
            version_number: latest.version_number,
            version_label: latest.version_label,
            title: latest.title,
            form_code: latest.form_code,
            sealedAt: new Date().toISOString()
        };
        insp.template_code = latest.form_code || insp.template_code;
        markStudioDirty(true);
        if (typeof showToast === 'function') showToast(`Şablon ${latest.version_label} sürümüne güncellendi!`, 'success');
    };

    window.studioAppUpdateCompanyCell = function (secId, rIdx, prop, val) {
        const sec = findSectionById(secId);
        if (!sec || !sec.rows || !sec.rows[rIdx]) return;
        sec.rows[rIdx][prop] = val;
        markStudioDirty(false);
    };

    window.studioAppUpdateDetail21 = function (secId, fIdx, val, repaint = false) {
        const sec = findSectionById(secId);
        if (!sec || !sec.fields || !sec.fields[fIdx]) return;
        sec.fields[fIdx].value = val;
        markStudioDirty(repaint);
    };

    window.studioAppPickDetail21 = function (secId, fIdx, opt, ev) {
        if (ev) ev.stopPropagation();
        window.studioAppUpdateDetail21(secId, fIdx, opt, true);
    };

    window.studioAppPickDetail22 = function (secId, kind, idx, opt, ev) {
        if (ev) ev.stopPropagation();
        const sec = findSectionById(secId);
        if (!sec) return;
        if (kind === 'top' && sec.topQuestions && sec.topQuestions[idx]) sec.topQuestions[idx].value = opt;
        else if (kind === 'bottom' && sec.bottomQuestion) sec.bottomQuestion.value = opt;
        else if (kind === 'prot' && sec.protectionItems && sec.protectionItems[idx]) {
            sec.protectionItems[idx].value = opt || (sec.protectionItems[idx].value === 'Var' ? 'Yok' : 'Var');
        }
        markStudioDirty(true);
    };

    window.studioAppCycleVisual = function (secId, tIdx, iIdx, ev) {
        if (ev) ev.stopPropagation();
        const sec = findSectionById(secId);
        const item = sec && sec.topics && sec.topics[tIdx] && sec.topics[tIdx].items && sec.topics[tIdx].items[iIdx];
        if (!item) return;
        const order = ['✓', 'X', 'N', 'G'];
        const next = order[(order.indexOf(item.sym) + 1) % order.length];
        item.sym = next;
        markStudioDirty(true);
    };

    window.studioAppSetVisualSym = function (secId, tIdx, iIdx, sym) {
        const sec = findSectionById(secId);
        const item = sec && sec.topics && sec.topics[tIdx] && sec.topics[tIdx].items && sec.topics[tIdx].items[iIdx];
        if (!item) return;
        item.sym = sym;
        markStudioDirty(true);
    };

    window.studioAppMarkTopicAllOk = function (secId, tIdx) {
        const sec = findSectionById(secId);
        const topic = sec && sec.topics && sec.topics[tIdx];
        if (!topic || !Array.isArray(topic.items)) return;
        topic.items.forEach(it => { it.sym = '✓'; });
        markStudioDirty(true);
    };

    window.studioAppUpdateVisualPano = function (secId, val) {
        const sec = findSectionById(secId);
        if (!sec) return;
        sec.panoValue = val;
        markStudioDirty(false);
    };

    window.studioAppUpdateFuncField = function (secId, prop, val, repaint = false) {
        const sec = findSectionById(secId);
        if (!sec) return;
        sec[prop] = val;
        markStudioDirty(repaint);
    };

    window.studioAppPickFunc = function (secId, prop, opt, ev) {
        if (ev) ev.stopPropagation();
        window.studioAppUpdateFuncField(secId, prop, opt, true);
    };

    window.studioAppUpdateTableCell = function (secId, rIdx, colId, val) {
        const sec = findSectionById(secId);
        if (!sec || !sec.rows || !sec.rows[rIdx]) return;
        sec.rows[rIdx][colId] = val;
        markStudioDirty(false);
    };

    window.studioAppCycleTableSym = function (secId, rIdx, colId, ev) {
        if (ev) ev.stopPropagation();
        const sec = findSectionById(secId);
        if (!sec || !sec.rows || !sec.rows[rIdx]) return;
        const order = ['✓', 'X', 'N', 'G', ''];
        const cur = String(sec.rows[rIdx][colId] || '');
        sec.rows[rIdx][colId] = order[(order.indexOf(cur) + 1) % order.length];
        markStudioDirty(true);
    };

    window.studioAppAddTableRow = function (secId) {
        const sec = findSectionById(secId);
        if (!sec || !Array.isArray(sec.columns)) return;
        if (!Array.isArray(sec.rows)) sec.rows = [];
        const newRow = {};
        sec.columns.forEach(c => { newRow[c.id] = c.type === 'symbol' ? '✓' : ''; });
        sec.rows.push(newRow);
        markStudioDirty(true);
    };

    window.studioAppDeleteTableRow = function (secId, rIdx) {
        const sec = findSectionById(secId);
        if (!sec || !Array.isArray(sec.rows)) return;
        sec.rows.splice(rIdx, 1);
        markStudioDirty(true);
    };

    window.studioAppFillDevicesToTable = function (secId, isThermalOnly) {
        const sec = findSectionById(secId);
        const fd = window.AppState && window.AppState.currentFormData;
        if (!sec) return;
        const ok = seedDevicesIntoStudioTable(sec, fd, Boolean(isThermalOnly));
        if (ok) {
            markStudioDirty(true);
            if (typeof showToast === 'function') showToast('Zimmetli ölçüm cihazları tabloya aktarıldı.', 'success');
        } else {
            if (typeof showToast === 'function') showToast('Aktarılacak uygun ölçüm cihazı bulunamadı.', 'warning');
        }
    };

    window.studioAppUpdateNote = function (secId, val) {
        const sec = findSectionById(secId);
        if (!sec) return;
        sec.content = val;
        markStudioDirty(false);
    };

    window.studioAppSetConclusion = function (secId, resultVal) {
        const sec = findSectionById(secId);
        if (!sec) return;
        sec.overallResult = resultVal;
        if (window.AppState && window.AppState.currentFormData) {
            window.AppState.currentFormData.overallResult = resultVal;
        }
        if (window.AppState && window.AppState.currentInspection) {
            window.AppState.currentInspection.result = resultVal;
        }
        markStudioDirty(true);
    };

    window.studioAppUpdateApproval = function (secId, prop, val) {
        const sec = findSectionById(secId);
        if (!sec) return;
        sec[prop] = val;
        markStudioDirty(false);
    };

    window.studioAppUpdateSigner = function (secId, sIdx, prop, val) {
        const sec = findSectionById(secId);
        if (!sec || !sec.signers || !sec.signers[sIdx]) return;
        sec.signers[sIdx][prop] = val;
        markStudioDirty(false);
    };

    window.studioAppUpdateCallout = function (secId, prop, val) {
        const sec = findSectionById(secId);
        if (!sec) return;
        sec[prop] = val;
        markStudioDirty(false);
    };

    window.studioAppUpdateChartPoint = function (secId, pIdx, prop, val) {
        const sec = findSectionById(secId);
        if (!sec || !sec.dataPoints || !sec.dataPoints[pIdx]) return;
        sec.dataPoints[pIdx][prop] = prop === 'value' ? Number(val || 0) : val;
        markStudioDirty(false);
    };

    window.studioAppAddImageFile = function (secId, inputEl) {
        const sec = findSectionById(secId);
        const file = inputEl && inputEl.files && inputEl.files[0];
        if (!sec || !file) return;
        const reader = new FileReader();
        reader.onload = function () {
            if (!Array.isArray(sec.images)) sec.images = [];
            sec.images.push({ src: String(reader.result || ''), caption: file.name.replace(/\.[^.]+$/, '') });
            markStudioDirty(true);
        };
        reader.readAsDataURL(file);
        inputEl.value = '';
    };

    window.studioAppRemoveImage = function (secId, imgIdx) {
        const sec = findSectionById(secId);
        if (!sec || !Array.isArray(sec.images)) return;
        sec.images.splice(imgIdx, 1);
        markStudioDirty(true);
    };

    window.studioAppUpdateOverrideCell = function (key, val) {
        const fd = window.AppState && window.AppState.currentFormData;
        if (!fd || !fd.studioSchema) return;
        ensureStyleDefaults(fd.studioSchema);
        fd.studioSchema.cellTextOverrides[key] = val;
        markStudioDirty(false);
    };

    window.studioAppOpenCellEditModal = function (key, bindAttr, ev) {
        if (ev) ev.stopPropagation();
        const curVal = readStudioCellCurrentValue(key, bindAttr);
        const modalBody = `
            <div class="space-y-2 text-xs">
                <div class="text-[11px] text-slate-500 font-mono">Hücre: ${esc(key)}</div>
                <textarea id="studioInlineCellTextarea" rows="4"
                    placeholder="Metin veya =TOPLA(B1:B5) gibi formül yazabilirsiniz..."
                    class="w-full border-2 border-sky-400 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none">${esc(curVal)}</textarea>
                <div class="text-[10px] text-slate-500">İpucu: <code>{{firma_adi}}</code>, <code>{{rapor_no}}</code>, <code>{{ekipman_adi}}</code> veya Excel formülü (<code>=TOPLA(...)</code>) desteklenir.</div>
            </div>
        `;
        const modalFoot = `
            <button onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">İptal</button>
            <button onclick="studioAppSaveCellEditModal('${esc(key)}', '${esc(bindAttr)}')" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-bold text-xs">Hücreye Yaz</button>
        `;
        if (typeof openModal === 'function') {
            openModal('Hücre Düzenle', modalBody, modalFoot);
            setTimeout(() => {
                const ta = document.getElementById('studioInlineCellTextarea');
                if (ta) { ta.focus(); ta.select(); }
            }, 60);
        }
    };

    window.studioAppSaveCellEditModal = function (key, bindAttr) {
        const ta = document.getElementById('studioInlineCellTextarea');
        const val = ta ? ta.value : '';
        if (typeof closeModal === 'function') closeModal();
        applyStudioCellEdit(key, bindAttr, val);
    };

    function renderStudioSectionFormCard(sec, ctx) {
        if (!sec || sec.visible === false) return '';
        const tx = (v) => resolvePlaceholders(v, ctx);

        // 1. COMPANY INFO
        if (sec.type === 'company_info') {
            const rowsHtml = (sec.rows || []).map((r, rIdx) => r.layout === 'full' ? `
                <div>
                    <label class="block text-[11px] font-bold text-slate-600 mb-0.5">${esc(tx(r.label1))}</label>
                    <input type="text" value="${esc(tx(r.val1))}"
                        oninput="studioAppUpdateCompanyCell('${esc(sec.id)}', ${rIdx}, 'val1', this.value)"
                        class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none">
                </div>
            ` : `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-0.5">${esc(tx(r.label1))}</label>
                        <input type="text" value="${esc(tx(r.val1))}"
                            oninput="studioAppUpdateCompanyCell('${esc(sec.id)}', ${rIdx}, 'val1', this.value)"
                            class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-0.5">${esc(tx(r.label2))}</label>
                        <input type="text" value="${esc(tx(r.val2))}"
                            oninput="studioAppUpdateCompanyCell('${esc(sec.id)}', ${rIdx}, 'val2', this.value)"
                            class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none">
                    </div>
                </div>
            `).join('');
            return `
                <div class="card-craft-white p-3 space-y-2.5">
                    <div class="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        <i class="fa-solid fa-building text-sky-600"></i>
                        <span>${esc(tx(sec.title || '1. FİRMA BİLGİLERİ'))}</span>
                    </div>
                    <div class="space-y-2">${rowsHtml}</div>
                </div>
            `;
        }

        // 2.1 DETAIL GRID
        if (sec.type === 'detail_21') {
            const fieldsHtml = (sec.fields || []).map((f, fIdx) => {
                if (f.type === 'radio' && Array.isArray(f.options)) {
                    return `
                        <div class="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                            <div class="text-[11px] font-bold text-slate-700 mb-1.5">${esc(tx(f.label))}</div>
                            <div class="flex flex-wrap gap-1.5">
                                ${f.options.map(opt => {
                                    const active = String(f.value || '').toLowerCase() === String(opt).toLowerCase();
                                    return `<button type="button" onclick="studioAppPickDetail21('${esc(sec.id)}', ${fIdx}, '${esc(opt)}')"
                                        class="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${active ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}">${esc(opt)}</button>`;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }
                if (f.type === 'phase_group') {
                    const allOpts = [...(f.aaOptions || []), ...(f.daOptions || [])];
                    return `
                        <div class="p-2 bg-slate-50 rounded-lg border border-slate-200/80 sm:col-span-2">
                            <div class="text-[11px] font-bold text-slate-700 mb-1.5">${esc(tx(f.label))}</div>
                            <div class="flex flex-wrap gap-1.5">
                                ${allOpts.map(opt => {
                                    const active = String(f.value || '').toLowerCase() === String(opt).toLowerCase();
                                    return `<button type="button" onclick="studioAppPickDetail21('${esc(sec.id)}', ${fIdx}, '${esc(opt)}')"
                                        class="px-2 py-1 rounded-lg text-[10.5px] font-bold border transition ${active ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}">${esc(opt)}</button>`;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }
                return `
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-0.5">${esc(tx(f.label))}</label>
                        <input type="text" value="${esc(tx(f.value || ''))}"
                            oninput="studioAppUpdateDetail21('${esc(sec.id)}', ${fIdx}, this.value, false)"
                            class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none">
                    </div>
                `;
            }).join('');
            return `
                <div class="card-craft-white p-3 space-y-2.5">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">
                        ${esc(tx(sec.sectionTitle || sec.subTitle || '2.1. DETAY BİLGİLER'))}
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${fieldsHtml}</div>
                </div>
            `;
        }

        // 2.2 DETAIL 22
        if (sec.type === 'detail_22') {
            const topHtml = (sec.topQuestions || []).map((q, qIdx) => `
                <div class="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span class="text-[11px] font-bold text-slate-700">${esc(tx(q.label))}</span>
                    <div class="flex gap-1 shrink-0">
                        ${(q.options || ['Var', 'Yok']).map(opt => {
                            const active = q.value === opt;
                            return `<button type="button" onclick="studioAppPickDetail22('${esc(sec.id)}', 'top', ${qIdx}, '${esc(opt)}')"
                                class="px-2.5 py-1 rounded-lg text-[11px] font-bold border ${active ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-white text-slate-700 border-slate-300'}">${esc(opt)}</button>`;
                        }).join('')}
                    </div>
                </div>
            `).join('');
            const protHtml = (sec.protectionItems || []).map((p, pIdx) => {
                const isVar = p.value === 'Var';
                return `
                    <button type="button" onclick="studioAppPickDetail22('${esc(sec.id)}', 'prot', ${pIdx}, '')"
                        class="w-full flex items-center justify-between gap-2 p-2 rounded-lg border text-left transition ${isVar ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 text-slate-600'}">
                        <span class="text-[11px] font-semibold">${esc(tx(p.label))}</span>
                        <span class="px-2 py-0.5 rounded font-bold text-[10px] shrink-0 ${isVar ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">${isVar ? 'Var' : 'Yok'}</span>
                    </button>
                `;
            }).join('');
            const bq = sec.bottomQuestion;
            const botHtml = bq ? `
                <div class="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span class="text-[11px] font-bold text-slate-700">${esc(tx(bq.label))}</span>
                    <div class="flex gap-1 shrink-0">
                        ${(bq.options || ['Var', 'Yok']).map(opt => {
                            const active = bq.value === opt;
                            return `<button type="button" onclick="studioAppPickDetail22('${esc(sec.id)}', 'bottom', 0, '${esc(opt)}')"
                                class="px-2.5 py-1 rounded-lg text-[11px] font-bold border ${active ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-white text-slate-700 border-slate-300'}">${esc(opt)}</button>`;
                        }).join('')}
                    </div>
                </div>
            ` : '';
            return `
                <div class="card-craft-white p-3 space-y-2">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">${esc(tx(sec.subTitle || '2.2. TESPİT EDİLEN BİLGİLER'))}</div>
                    ${topHtml}
                    <div class="text-[11px] font-bold text-slate-500 pt-1">${esc(tx(sec.protectionTitle || 'Koruma Önlemleri'))}</div>
                    <div class="space-y-1.5">${protHtml}</div>
                    ${botHtml}
                </div>
            `;
        }

        // DATA TABLE
        if (sec.type === 'data_table') {
            const cols = sec.columns || [];
            const rows = sec.rows || [];
            const titleLow = String(sec.title || '').toLowerCase();
            const isThermalTbl = sec.id === 'sec_thermal' || titleLow.includes('termal');
            const isDeviceTbl = isThermalTbl || sec.id === 'sec_devices' || titleLow.includes('ölçüm alet') || titleLow.includes('cihaz');

            const rowsHtml = rows.map((r, rIdx) => `
                <tr class="border-b border-slate-200">
                    ${sec.showNoCol ? `<td class="px-1.5 py-1 text-center font-bold text-slate-500 text-[11px]">${rIdx + 1}</td>` : ''}
                    ${cols.map(c => {
                        const raw = r[c.id] == null ? '' : String(r[c.id]);
                        if (c.type === 'symbol') {
                            const cls = raw === '✓' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : (raw === 'X' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-slate-100 text-slate-700 border-slate-300');
                            return `<td class="p-1 text-center"><button type="button" onclick="studioAppCycleTableSym('${esc(sec.id)}', ${rIdx}, '${esc(c.id)}')" class="w-8 h-7 rounded-md border font-black text-xs ${cls}">${esc(raw || '—')}</button></td>`;
                        }
                        return `<td class="p-1"><input type="text" value="${esc(raw)}" oninput="studioAppUpdateTableCell('${esc(sec.id)}', ${rIdx}, '${esc(c.id)}', this.value)" class="w-full min-w-[74px] h-7 bg-slate-50 border border-slate-200 rounded px-1.5 text-[11px] font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none"></td>`;
                    }).join('')}
                    <td class="p-1 text-center">
                        <button type="button" onclick="studioAppDeleteTableRow('${esc(sec.id)}', ${rIdx})" class="w-7 h-7 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px]" title="Satırı Sil"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');

            return `
                <div class="card-craft-white p-3 space-y-2">
                    <div class="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-1.5">
                        <div class="font-extrabold text-xs text-slate-900">${esc(tx(sec.title || sec.subTitle || 'Tablo'))}</div>
                        <div class="flex items-center gap-1.5">
                            ${isDeviceTbl ? `<button type="button" onclick="studioAppFillDevicesToTable('${esc(sec.id)}', ${isThermalTbl ? 'true' : 'false'})" class="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[10.5px]"><i class="fa-solid fa-screwdriver-wrench mr-1"></i>Cihazları Aktar</button>` : ''}
                            <button type="button" onclick="studioAppAddTableRow('${esc(sec.id)}')" class="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[10.5px]"><i class="fa-solid fa-plus mr-1"></i>Satır Ekle</button>
                        </div>
                    </div>
                    <div class="overflow-x-auto border border-slate-200 rounded-lg">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-100 border-b border-slate-200">
                                    ${sec.showNoCol ? `<th class="px-1.5 py-1.5 text-[10px] font-extrabold text-slate-600 text-center">No</th>` : ''}
                                    ${cols.map(c => `<th class="px-1.5 py-1.5 text-[10px] font-extrabold text-slate-700 whitespace-nowrap">${esc(tx(c.label))}</th>`).join('')}
                                    <th class="px-1 py-1.5 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml || `<tr><td colspan="${cols.length + 2}" class="p-3 text-center text-[11px] text-slate-400">Satır eklemek için "+ Satır Ekle" butonuna basın.</td></tr>`}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // VISUAL CHECKLIST GROUP
        if (sec.type === 'visual_checklist_group') {
            const topicsHtml = (sec.topics || []).map((t, tIdx) => `
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                    <div class="bg-slate-100 px-2.5 py-1.5 flex items-center justify-between gap-2">
                        <span class="font-bold text-[11px] text-slate-800">${esc(tx(t.title))}</span>
                        <button type="button" onclick="studioAppMarkTopicAllOk('${esc(sec.id)}', ${tIdx})" class="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] shrink-0">Tümünü ✓</button>
                    </div>
                    <div class="divide-y divide-slate-100">
                        ${(t.items || []).map((it, iIdx) => `
                            <div class="p-2 flex items-center justify-between gap-2">
                                <span class="text-[11px] text-slate-800 font-medium leading-snug">${esc(tx(it.text))}</span>
                                <div class="flex gap-1 shrink-0">
                                    ${['✓', 'X', 'N', 'G'].map(sym => {
                                        const active = it.sym === sym;
                                        const cls = active
                                            ? (sym === '✓' ? 'bg-emerald-600 text-white border-emerald-600' : (sym === 'X' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-800 text-white border-slate-800'))
                                            : 'bg-white text-slate-600 border-slate-300';
                                        return `<button type="button" onclick="studioAppSetVisualSym('${esc(sec.id)}', ${tIdx}, ${iIdx}, '${sym}')" class="w-7 h-7 rounded-lg border font-black text-xs ${cls}">${sym}</button>`;
                                    }).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            return `
                <div class="card-craft-white p-3 space-y-2.5">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">${esc(tx(sec.title || 'Gözle Kontrol'))}</div>
                    ${sec.panoSubTitle ? `
                        <div>
                            <label class="block text-[11px] font-bold text-slate-600 mb-0.5">${esc(tx(sec.panoLabel || 'Pano Adı'))}</label>
                            <input type="text" value="${esc(tx(sec.panoValue || ''))}" oninput="studioAppUpdateVisualPano('${esc(sec.id)}', this.value)"
                                class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-xs font-bold text-slate-900">
                        </div>
                    ` : ''}
                    <div class="space-y-2">${topicsHtml}</div>
                </div>
            `;
        }

        // FUNC MATRIX
        if (sec.type === 'func_matrix') {
            const pairFields = [
                ['panoLabel', 'panoValue'], ['zxLabel', 'zxVal'], ['zlnLabel', 'zlnVal'], ['ik3Label', 'ik3Val'],
                ['ffLabel', 'ffVal'], ['lnLabel', 'lnVal'], ['npeLabel', 'npeVal'], ['dkdKaLabel', 'dkdKaVal']
            ];
            return `
                <div class="card-craft-white p-3 space-y-2.5">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">${esc(tx(sec.title || 'Fonksiyon Testleri'))}</div>
                    ${Array.isArray(sec.methodOptions) && sec.methodOptions.length ? `
                        <div>
                            <div class="text-[11px] font-bold text-slate-600 mb-1">${esc(tx(sec.methodTitle || 'Ölçüm Metodu'))}</div>
                            <div class="flex flex-wrap gap-1.5">
                                ${sec.methodOptions.map(opt => {
                                    const active = sec.methodValue === opt;
                                    return `<button type="button" onclick="studioAppPickFunc('${esc(sec.id)}', 'methodValue', '${esc(opt)}')"
                                        class="px-2.5 py-1 rounded-lg text-[11px] font-bold border ${active ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-white text-slate-700 border-slate-300'}">${esc(opt)}</button>`;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="grid grid-cols-2 gap-2">
                        ${pairFields.map(([lKey, vKey]) => `
                            <div>
                                <label class="block text-[10.5px] font-bold text-slate-600 mb-0.5">${esc(tx(sec[lKey] || vKey))}</label>
                                <input type="text" value="${esc(tx(sec[vKey] || ''))}" oninput="studioAppUpdateFuncField('${esc(sec.id)}', '${vKey}', this.value, false)"
                                    class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-xs font-semibold text-slate-900">
                            </div>
                        `).join('')}
                    </div>
                    ${Array.isArray(sec.dkdOptions) && sec.dkdOptions.length ? `
                        <div>
                            <div class="text-[11px] font-bold text-slate-600 mb-1">${esc(tx(sec.dkdTypeLabel || 'DKD Tipi'))}</div>
                            <div class="flex flex-wrap gap-1.5">
                                ${sec.dkdOptions.map(opt => {
                                    const active = sec.dkdTypeVal === opt;
                                    return `<button type="button" onclick="studioAppPickFunc('${esc(sec.id)}', 'dkdTypeVal', '${esc(opt)}')"
                                        class="px-2.5 py-1 rounded-lg text-[11px] font-bold border ${active ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-white text-slate-700 border-slate-300'}">${esc(opt)}</button>`;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // NOTES BOX
        if (sec.type === 'notes_box') {
            return `
                <div class="card-craft-white p-3 space-y-2">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">${esc(tx(sec.title || 'Notlar'))}</div>
                    <textarea rows="3" oninput="studioAppUpdateNote('${esc(sec.id)}', this.value)"
                        class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none">${esc(tx(sec.content || ''))}</textarea>
                    ${sec.bottomNote ? `<div class="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">${esc(tx(sec.bottomNote))}</div>` : ''}
                </div>
            `;
        }

        // CONCLUSION BOX
        if (sec.type === 'conclusion_box') {
            const isOk = sec.overallResult !== 'UYGUN DEĞİL';
            return `
                <div class="card-craft-white p-3 space-y-2">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">${esc(tx(sec.title || 'Sonuç ve Kanaat'))}</div>
                    <div class="grid grid-cols-2 gap-2">
                        <button type="button" onclick="studioAppSetConclusion('${esc(sec.id)}', 'UYGUN')"
                            class="h-10 rounded-xl font-black text-xs border-2 transition ${isOk ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200'}">✓ KULLANIMA UYGUNDUR</button>
                        <button type="button" onclick="studioAppSetConclusion('${esc(sec.id)}', 'UYGUN DEĞİL')"
                            class="h-10 rounded-xl font-black text-xs border-2 transition ${!isOk ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-600 border-slate-200'}">✕ UYGUN DEĞİLDİR</button>
                    </div>
                </div>
            `;
        }

        // APPROVAL BOX
        if (sec.type === 'approval_box') {
            return `
                <div class="card-craft-white p-3 space-y-2">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">${esc(tx(sec.title || 'Onay'))}</div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                            <label class="block text-[10.5px] font-bold text-slate-600 mb-0.5">Muayene Personeli</label>
                            <input type="text" value="${esc(tx(sec.inspectorName || ''))}" oninput="studioAppUpdateApproval('${esc(sec.id)}', 'inspectorName', this.value)" class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2 text-xs font-semibold">
                        </div>
                        <div>
                            <label class="block text-[10.5px] font-bold text-slate-600 mb-0.5">Bakanlık Kayıt No</label>
                            <input type="text" value="${esc(tx(sec.ministryNo || ''))}" oninput="studioAppUpdateApproval('${esc(sec.id)}', 'ministryNo', this.value)" class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2 text-xs font-semibold">
                        </div>
                        <div>
                            <label class="block text-[10.5px] font-bold text-slate-600 mb-0.5">Diploma No / Tarih</label>
                            <input type="text" value="${esc(tx(sec.diplomaNo || ''))}" oninput="studioAppUpdateApproval('${esc(sec.id)}', 'diplomaNo', this.value)" class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2 text-xs font-semibold">
                        </div>
                    </div>
                </div>
            `;
        }

        // CALLOUT BLOCK
        if (sec.type === 'callout_block') {
            return `
                <div class="card-craft-white p-3 space-y-2">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">${esc(tx(sec.title || 'Bilgi / Uyarı Kutusu'))}</div>
                    <textarea rows="2" oninput="studioAppUpdateCallout('${esc(sec.id)}', 'body', this.value)"
                        class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900">${esc(tx(sec.body || ''))}</textarea>
                </div>
            `;
        }

        // IMAGE BLOCK
        if (sec.type === 'image_block') {
            const imgs = Array.isArray(sec.images) ? sec.images : [];
            return `
                <div class="card-craft-white p-3 space-y-2">
                    <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                        <span class="font-extrabold text-xs text-slate-900">${esc(tx(sec.title || 'Fotoğraflar / Görseller'))}</span>
                        <label class="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[10.5px] cursor-pointer">
                            <i class="fa-solid fa-camera mr-1"></i>Görsel Ekle
                            <input type="file" accept="image/*" class="hidden" onchange="studioAppAddImageFile('${esc(sec.id)}', this)">
                        </label>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        ${imgs.map((im, idx) => `
                            <div class="relative border border-slate-200 rounded-lg p-1 bg-slate-50">
                                <img src="${esc(im.src)}" class="w-full h-24 object-contain rounded">
                                <button type="button" onclick="studioAppRemoveImage('${esc(sec.id)}', ${idx})" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white text-[10px]">✕</button>
                            </div>
                        `).join('') || `<div class="col-span-2 text-[11px] text-slate-400">Henüz görsel yok.</div>`}
                    </div>
                </div>
            `;
        }

        // CHART BLOCK
        if (sec.type === 'chart_block') {
            const pts = Array.isArray(sec.dataPoints) ? sec.dataPoints : [];
            return `
                <div class="card-craft-white p-3 space-y-2">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">${esc(tx(sec.title || sec.chartTitle || 'Grafik'))}</div>
                    <div class="space-y-1.5">
                        ${pts.map((p, pIdx) => `
                            <div class="grid grid-cols-3 gap-2">
                                <input type="text" value="${esc(p.label || '')}" oninput="studioAppUpdateChartPoint('${esc(sec.id)}', ${pIdx}, 'label', this.value)" class="col-span-2 h-8 bg-slate-50 border border-slate-300 rounded px-2 text-xs font-semibold">
                                <input type="number" step="any" value="${esc(p.value ?? 0)}" oninput="studioAppUpdateChartPoint('${esc(sec.id)}', ${pIdx}, 'value', this.value)" class="h-8 bg-slate-50 border border-slate-300 rounded px-2 text-xs font-bold">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // SIGNATURE BLOCK
        if (sec.type === 'signature_block') {
            const signers = Array.isArray(sec.signers) ? sec.signers : [];
            return `
                <div class="card-craft-white p-3 space-y-2">
                    <div class="font-extrabold text-xs text-slate-900 border-b border-slate-100 pb-1.5">${esc(tx(sec.title || 'İmza Satırı'))}</div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        ${signers.map((sg, sIdx) => `
                            <div>
                                <label class="block text-[10.5px] font-bold text-slate-600 mb-0.5">${esc(tx(sg.role || 'Yetkili'))}</label>
                                <input type="text" value="${esc(tx(sg.name || ''))}" oninput="studioAppUpdateSigner('${esc(sec.id)}', ${sIdx}, 'name', this.value)" class="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg px-2 text-xs font-semibold">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return '';
    }

    function renderStudioTemplateEditor(insp, fd) {
        const schema = ensureStudioFormData(insp, fd);
        if (!schema) {
            return `
                <div class="card-craft-white p-4 text-center space-y-2">
                    <div class="text-rose-600 font-extrabold text-sm"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Studio Şablonu Bulunamadı</div>
                    <p class="text-xs text-slate-600">Bu rapor <code>${esc(insp.template_id)}</code> Studio şablonuna bağlı ancak şablon cihazınızda henüz yüklü değil.</p>
                    <button type="button" onclick="StudioTemplateManager.refreshFromPortal(false).then(() => paintInspectionEditorUI())"
                        class="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs">Şablonları Buluttan Yenile</button>
                </div>
            `;
        }

        const meta = fd.studioMeta || {};
        const latest = StudioTemplateManager.getById(insp.template_id);
        const hasNewer = Boolean(latest && Number(latest.version_number || 1) > Number(meta.version_number || 1));
        const viewMode = (window.AppState && window.AppState.studioEditorViewMode) || 'form';
        const ci = fd.companyInfo || {};
        const ctx = buildPlaceholderContext(insp, fd, ci);

        const topBarHtml = `
            <div class="card-craft-white p-2.5 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-200 font-extrabold text-[11px]">
                        Studio · ${esc(meta.version_label || schema.version_label || 'v1')}
                    </span>
                    ${hasNewer ? `
                        <button type="button" onclick="studioAppUpgradeToLatestTemplate()"
                            class="px-2.5 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-[11px]">
                            <i class="fa-solid fa-arrows-rotate mr-1"></i>Yeni Sürüm (${esc(latest.version_label)}) — Uygula
                        </button>
                    ` : ''}
                </div>
                <div class="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button type="button" onclick="studioAppSetViewMode('form')"
                        class="px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition ${viewMode === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}">
                        <i class="fa-solid fa-list-check mr-1"></i>Saha Formu
                    </button>
                    <button type="button" onclick="studioAppSetViewMode('a4')"
                        class="px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition ${viewMode === 'a4' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}">
                        <i class="fa-solid fa-table-cells mr-1"></i>Canlı A4 (Hücre Düzenle)
                    </button>
                </div>
            </div>
        `;

        if (viewMode === 'a4') {
            const rendered = buildStudioA4Render(insp, fd, ci, insp.report_no || '', { interactive: true, previewSheet: true });
            const pageWpx = rendered.isLandscape ? 1122 : 794;
            const availW = Math.max(300, Math.min(640, (window.innerWidth || 420) - 36));
            const zoomRatio = Math.min(1, availW / pageWpx);
            return `
                ${topBarHtml}
                <div class="card-craft-white p-2.5 space-y-2">
                    <div class="text-[11px] text-slate-600 flex items-center justify-between gap-2">
                        <span><i class="fa-solid fa-hand-pointer text-sky-600 mr-1"></i>Hücreye dokunarak metin/formül düzenleyebilir, radyo ve ✓/X/N/G işaretlerini değiştirebilirsiniz.</span>
                        <span class="font-bold text-slate-800 shrink-0">${rendered.pageCount} Sayfa</span>
                    </div>
                    <div class="studio-inline-a4-wrap overflow-x-auto bg-slate-200/80 rounded-xl p-2 border border-slate-300">
                        <div style="zoom:${zoomRatio.toFixed(3)}; width:fit-content; margin:0 auto;" data-pdf-theme="${esc(rendered.effectiveTheme)}">
                            ${rendered.pagesOuterHtml}
                        </div>
                    </div>
                </div>
            `;
        }

        const sectionsHtml = (schema.sections || []).map(sec => renderStudioSectionFormCard(sec, ctx)).join('');
        const overrideKeys = Object.keys(schema.cellTextOverrides || {});
        const overridesCardHtml = overrideKeys.length > 0 ? `
            <div class="card-craft-white p-3 space-y-2">
                <div class="font-extrabold text-xs text-sky-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <i class="fa-solid fa-pen-to-square text-sky-600"></i>
                    <span>Studio Özel Hücre İçerikleri (${overrideKeys.length})</span>
                </div>
                <div class="space-y-1.5">
                    ${overrideKeys.map(k => `
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 items-center">
                            <span class="text-[10px] font-mono text-slate-500 truncate" title="${esc(k)}">${esc(k)}</span>
                            <input type="text" value="${esc(schema.cellTextOverrides[k] ?? '')}"
                                oninput="studioAppUpdateOverrideCell('${esc(k)}', this.value)"
                                class="sm:col-span-2 h-8 bg-slate-50 border border-slate-300 rounded-lg px-2 text-xs font-semibold text-slate-900">
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        return `${topBarHtml}${sectionsHtml}${overridesCardHtml}`;
    }

    // Export globals
    window.StudioTemplateManager = StudioTemplateManager;
    window.ensureStudioFormData = ensureStudioFormData;
    window.syncEquipmentNameToStudioSchema = syncEquipmentNameToStudioSchema;
    window.renderStudioTemplateEditor = renderStudioTemplateEditor;
    window.buildStudioA4Render = buildStudioA4Render;
})();
