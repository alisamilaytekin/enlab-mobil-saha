// ============================================================================
// HIZLI RAPOR - 10E-PDF-UNIVERSAL.JS
// Açıklama: Evrensel Blok Tabanlı A4 PDF Motoru (AST Builder, Satır Bazlı
//           Akıllı Tablo Bölme, Otomatik Tek Sayfa Sığdırma, Çoklu Antet /
//           Altbilgi / 1-2-3'lü İmza Düzeni ve Snapshot Uyumluluğu - v1.0)
// ============================================================================

(function () {

    function resolveEffectiveBranding(formData) {
        const live = (typeof CompanySettingsManager !== 'undefined')
            ? CompanySettingsManager.getSettings()
            : (typeof DEFAULT_COMPANY_BRANDING !== 'undefined' ? DEFAULT_COMPANY_BRANDING : {});
        if (formData && formData.universalSnapshot && formData.universalSnapshot.isSealed && formData.universalSnapshot.branding) {
            return Object.assign({}, live, formData.universalSnapshot.branding);
        }
        return live;
    }

    function buildContactLines(branding) {
        const phone = String(branding.companyPhone || '').trim();
        const web = String(branding.companyWeb || '').trim();
        const email = String(branding.companyEmail || '').trim();
        const addr = String(branding.companyAddress || '').trim();

        const hasCustomContact = Boolean(phone || web || email);
        if (!hasCustomContact) {
            return {
                line1: 'T: +90 (216) 526 61 41 &nbsp;&nbsp; F: +90 (216) 526 61 40',
                line2: 'info@tkmkontrol.com &nbsp;&nbsp; www.tkmkontrol.com'
            };
        }

        const line1Parts = [];
        if (phone) line1Parts.push(escapeHtml(phone));
        if (addr && addr !== 'İstanbul / Türkiye') line1Parts.push(escapeHtml(addr));

        const line2Parts = [];
        if (email) line2Parts.push(escapeHtml(email));
        if (web) line2Parts.push(escapeHtml(web));

        return {
            line1: line1Parts.join(' &nbsp;&middot;&nbsp; ') || escapeHtml(addr || ''),
            line2: line2Parts.join(' &nbsp;&nbsp; ')
        };
    }

    function buildUniversalPageHeader(ctx) {
        const { reportMainTitle, branding, designTokens, isRams, formCode, reportNo } = ctx;
        const logoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getLogoSrc() : 'assets/tekkomer_logo.png';
        const showTurkak = branding.showTurkakLogo !== false;
        const turkakLogoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getTurkakLogoSrc() : 'assets/turkak_logo.jpg';
        const accNo = branding.accreditationNo || 'AB-0227-M';
        const safeCompanyFullName = String(branding.companyFullName || 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.').replace(/KOMTROL/gi, 'KONTROL');
        const contact = buildContactLines(branding);

        const variant = (designTokens.headerVariant && designTokens.headerVariant !== 'auto')
            ? designTokens.headerVariant
            : 'three_col_logos';

        if (variant === 'corporate_compact') {
            return `
                <div class="tkm-header" style="grid-template-columns:72px 1fr 72px;min-height:66px;padding:3px 6px;">
                    <div style="display:flex;justify-content:center;align-items:center;">
                        <img src="${logoSrc}" alt="Logo" style="width:66px;height:56px;object-fit:contain;display:block;">
                    </div>
                    <div style="text-align:center;padding:0 6px;">
                        <div style="font-size:10pt;font-weight:700;color:#1e293b;line-height:1.15;">${escapeHtml(safeCompanyFullName)}</div>
                        ${contact.line1 || contact.line2 ? `<div style="font-size:7pt;color:#475569;line-height:1.15;">${[contact.line1, contact.line2].filter(Boolean).join(' &nbsp;|&nbsp; ')}</div>` : ''}
                        <div class="tkm-header-title" style="font-size:9.8pt;font-weight:800;color:#0f172a;margin-top:2px;line-height:1.12;text-transform:uppercase;">${escapeHtml(reportMainTitle)}</div>
                    </div>
                    <div style="display:flex;justify-content:center;align-items:center;">
                        ${showTurkak ? `<img src="${turkakLogoSrc}" alt="Akreditasyon ${escapeHtml(accNo)}" style="width:58px;height:64px;object-fit:contain;display:block;">` : `<div style="width:58px;"></div>`}
                    </div>
                </div>
            `;
        }

        if (variant === 'rams_banner') {
            return `
                <div class="tkm-header" style="grid-template-columns:82px 1fr 78px;">
                    <div style="display:flex;justify-content:center;align-items:center;padding-left:2px;">
                        <img src="${logoSrc}" alt="Logo" style="width:76px;height:66px;object-fit:contain;display:block;">
                    </div>
                    <div style="text-align:center;padding:0 8px;">
                        <div style="font-size:10.6pt;font-weight:800;color:#0f172a;letter-spacing:0.15px;line-height:1.15;">
                            ${escapeHtml(safeCompanyFullName)}
                        </div>
                        ${contact.line1 ? `<div style="font-size:7.3pt;color:#334155;line-height:1.18;">${contact.line1}</div>` : ''}
                        ${contact.line2 ? `<div style="font-size:7.3pt;color:#334155;line-height:1.18;margin-bottom:2px;">${contact.line2}</div>` : ''}
                        <div class="tkm-header-title" style="font-size:10.2pt;font-weight:800;color:#0f172a;line-height:1.14;text-transform:uppercase;">
                            ${escapeHtml(reportMainTitle)}
                        </div>
                        <div class="tkm-header-acc" style="font-size:8.2pt;font-weight:600;color:#475569;margin-top:1px;letter-spacing:0.3px;">
                            PERİYODİK KONTROL VE MUAYENE RAPORU ${formCode ? `&middot; ${escapeHtml(formCode)}` : ''}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:center;align-items:center;">
                        ${showTurkak ? `<img src="${turkakLogoSrc}" alt="Akreditasyon ${escapeHtml(accNo)}" style="width:66px;height:80px;object-fit:contain;display:block;">` : `<div style="width:66px;"></div>`}
                    </div>
                </div>
            `;
        }

        // Default: Klasik 3 Sütunlu TÜRKAK Antet (buildTkmPageHeader ile %100 uyumlu, dinamik iletişim destekli)
        return `
            <div class="tkm-header">
                <div style="display:flex;justify-content:center;align-items:center;padding-left:2px;overflow:visible;">
                    <img src="${logoSrc}" alt="Logo" style="width:78px;height:70px;object-fit:contain;object-position:center;display:block;">
                </div>
                <div style="text-align:center;padding:0 6px;">
                    <div style="font-size:11.2pt;font-weight:700;color:#222222;letter-spacing:0.2px;margin-bottom:1px;line-height:1.15;">
                        ${escapeHtml(safeCompanyFullName)}
                    </div>
                    ${contact.line1 ? `<div style="font-size:7.6pt;color:#222222;line-height:1.2;">${contact.line1}</div>` : ''}
                    ${contact.line2 ? `<div style="font-size:7.6pt;color:#222222;line-height:1.2;margin-bottom:2px;">${contact.line2}</div>` : ''}
                    <div class="tkm-header-title" style="font-size:10.5pt;font-weight:700;color:#222222;line-height:1.12;text-transform:uppercase;">
                        ${escapeHtml(reportMainTitle)}
                    </div>
                    <div class="tkm-header-acc" style="font-size:9pt;font-weight:400;color:#333333;margin-top:1px;letter-spacing:0.3px;">
                        PERİYODİK KONTROL RAPORU
                    </div>
                </div>
                <div style="display:flex;justify-content:center;align-items:center;">
                    ${showTurkak ? `<img src="${turkakLogoSrc}" alt="Akreditasyon ${escapeHtml(accNo)}" style="width:68px;height:84px;object-fit:contain;display:block;">` : `<div style="width:68px;"></div>`}
                </div>
            </div>
        `;
    }

    function buildUniversalPageFooter(ctx, pageNum, totalPages) {
        const { formCode, docNo, reportNo, branding, designTokens, isRams } = ctx;
        const safeCompanyFullName = String(branding.companyFullName || 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.').replace(/KOMTROL/gi, 'KONTROL');
        const rawDisclaimer = branding.footerDisclaimer || (typeof DEFAULT_COMPANY_BRANDING !== 'undefined' ? DEFAULT_COMPANY_BRANDING.footerDisclaimer : '');
        const disclaimer = String(rawDisclaimer)
            .replace(/\{COMPANY_NAME\}/g, safeCompanyFullName)
            .replace(/KOMTROL/gi, 'KONTROL');

        const variant = (designTokens.footerVariant && designTokens.footerVariant !== 'auto')
            ? designTokens.footerVariant
            : (isRams ? 'rams_strip' : 'boxed_table');

        const baseFormCode = String(formCode || docNo || 'FR.01').split(',')[0].trim() || 'FR.01';
        const revDefault = branding.defaultRevisionInfo || 'REV.00 / YT: 01.09.2025';

        if (variant === 'rams_strip') {
            return `
                <div class="tkm-footer">
                    <div class="tkm-footer-disclaimer">${escapeHtml(disclaimer)}</div>
                    <div class="tkm-footer-doc-line">
                        <span>Doküman Kodu: <strong>${escapeHtml(baseFormCode)}</strong></span>
                        <span class="tkm-fdoc-sep">&middot;</span>
                        <span>Yayım Tarihi: <strong>18.07.2025</strong></span>
                        <span class="tkm-fdoc-sep">&middot;</span>
                        <span>Revizyon: <strong>${escapeHtml(revDefault)}</strong></span>
                    </div>
                    <div class="tkm-footer-meta">
                        <span style="width:33%;text-align:left;"></span>
                        <span style="width:34%;text-align:center;">${escapeHtml(reportNo)}</span>
                        <span style="width:33%;text-align:right;">${pageNum} / ${totalPages}</span>
                    </div>
                </div>
            `;
        }

        if (variant === 'minimal_line') {
            return `
                <div class="tkm-footer">
                    <div class="tkm-footer-disclaimer" style="font-size:5.8pt;">${escapeHtml(disclaimer)}</div>
                    <div class="tkm-footer-meta" style="border-top:1px solid #cbd5e1;padding-top:2px;">
                        <span style="width:38%;text-align:left;">${escapeHtml(baseFormCode)} (${escapeHtml(revDefault)})</span>
                        <span style="width:34%;text-align:center;font-weight:700;">${escapeHtml(reportNo)}</span>
                        <span style="width:28%;text-align:right;font-weight:700;">Sayfa ${pageNum} / ${totalPages}</span>
                    </div>
                </div>
            `;
        }

        let displayFormCode = docNo || formCode || 'FR.01';
        if (!displayFormCode.includes('REV') && !displayFormCode.includes('RT:')) {
            displayFormCode = `${displayFormCode}, ${revDefault}`;
        }

        return `
            <div class="tkm-footer">
                <div class="tkm-footer-disclaimer">${escapeHtml(disclaimer)}</div>
                <div class="tkm-footer-meta">
                    <span style="width:38%;text-align:left;">${escapeHtml(displayFormCode)}</span>
                    <span style="width:34%;text-align:center;">${escapeHtml(reportNo)}</span>
                    <span style="width:28%;text-align:right;">${pageNum} / ${totalPages}</span>
                </div>
            </div>
        `;
    }

    function buildUniversalSignatureBlock(ctx, sectionNumber = '9') {
        const { insp, designTokens } = ctx;
        const signCols = Number(designTokens.signatureColumns) || 1;
        if (signCols === 1 && typeof buildTkmOnaySection === 'function') {
            return buildTkmOnaySection(insp, sectionNumber);
        }

        const hasPortalQr = Boolean(insp && insp.portal_report_url && typeof window.generateQrDataUrl === 'function');
        const qrSrc = hasPortalQr
            ? window.generateQrDataUrl(insp.portal_report_url)
            : ((window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.qrDefault) || 'assets/qr_default.jpg');
        const verifyCodeHtml = (insp && insp.portal_verify_code)
            ? `<div style="font-size:5.8pt;font-family:monospace;font-weight:700;color:#111;margin-top:2px;">Doğrulama: ${escapeHtml(insp.portal_verify_code)}</div>`
            : '';

        const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || {
            fullName: 'Ali Şamil Aytekin',
            title: 'Elektrik Mühendisi',
            ministryRegNo: 'K2023224376',
            diplomaNoDate: '249538 / 28.09.2022'
        };

        const inspectorName = (insp && insp.inspector_name) || curUser.fullName || 'Ali Şamil Aytekin';
        const inspectorTitle = (insp && insp.inspector_title) || curUser.title || 'Elektrik Mühendisi';
        const ministryNo = (insp && insp.ministry_reg_no) || curUser.ministryRegNo || 'K2023224376';
        const diplomaNo = (insp && insp.diploma_no) || curUser.diplomaNoDate || '249538 / 28.09.2022';
        const eimzaSrc = curUser.signatureImage || (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.eimza) || 'assets/eimza.jpg';

        const techManagerName = designTokens.techManagerName || 'Teknik Yönetici';
        const techManagerTitle = designTokens.techManagerTitle || 'Teknik Yönetici / Onaylayan';

        if (signCols === 2) {
            return `
                <div class="tkm-sec-title">${sectionNumber}. ONAY VE İMZA</div>
                <table class="tkm-table">
                    <colgroup>
                        <col style="width:18%;">
                        <col style="width:31%;">
                        <col style="width:31%;">
                        <col style="width:20%;">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Bilgi</th>
                            <th style="text-align:center;font-weight:700;">Kontrolü Yapan Muayene Personeli</th>
                            <th style="text-align:center;font-weight:700;">Onaylayan Teknik Yönetici</th>
                            <th style="text-align:center;font-weight:700;">Kare Kod</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:700;">Adı Soyadı / Unvanı</td>
                            <td style="text-align:center;font-weight:700;">${escapeHtml(inspectorName)}<br><span style="font-weight:400;font-size:6.5pt;">${escapeHtml(inspectorTitle)}</span></td>
                            <td style="text-align:center;font-weight:700;">${escapeHtml(techManagerName)}<br><span style="font-weight:400;font-size:6.5pt;">${escapeHtml(techManagerTitle)}</span></td>
                            <td rowspan="4" style="text-align:center;vertical-align:middle;padding:4px;">
                                <img src="${qrSrc}" alt="QR Code" style="width:68px;height:68px;object-fit:contain;display:inline-block;">${verifyCodeHtml}
                            </td>
                        </tr>
                        <tr>
                            <td style="font-weight:700;">Bakanlık Kayıt No</td>
                            <td style="text-align:center;">${escapeHtml(ministryNo)}</td>
                            <td style="text-align:center;">${escapeHtml(designTokens.techManagerRegNo || '-')}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700;">Diploma No / Tarih</td>
                            <td style="text-align:center;">${escapeHtml(diplomaNo)}</td>
                            <td style="text-align:center;">Onaylı</td>
                        </tr>
                        <tr>
                            <td style="font-weight:700;">İmza</td>
                            <td style="text-align:center;padding:3px;">
                                <img src="${eimzaSrc}" alt="E-İmza" style="height:28px;object-fit:contain;display:inline-block;">
                            </td>
                            <td style="text-align:center;padding:3px;">
                                <img src="${eimzaSrc}" alt="Onay İmza" style="height:28px;object-fit:contain;display:inline-block;opacity:0.9;">
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        }

        // 3 İmzalı: Muayene Personeli + Teknik Yönetici + İşletme / Müşteri Yetkilisi + QR
        return `
            <div class="tkm-sec-title">${sectionNumber}. ONAY VE İMZA</div>
            <table class="tkm-table">
                <colgroup>
                    <col style="width:28%;">
                    <col style="width:26%;">
                    <col style="width:26%;">
                    <col style="width:20%;">
                </colgroup>
                <thead>
                    <tr>
                        <th style="text-align:center;font-weight:700;">Muayene Personeli</th>
                        <th style="text-align:center;font-weight:700;">Onaylayan Teknik Yönetici</th>
                        <th style="text-align:center;font-weight:700;">${escapeHtml(designTokens.customerRepTitle || 'İşletme / Firma Yetkilisi')}</th>
                        <th style="text-align:center;font-weight:700;">Kare Kod</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="text-align:center;padding:4px;">
                            <div style="font-weight:700;">${escapeHtml(inspectorName)}</div>
                            <div style="font-size:6.4pt;color:#334155;">${escapeHtml(inspectorTitle)}</div>
                            <div style="font-size:6.2pt;">Bakanlık No: ${escapeHtml(ministryNo)}</div>
                            <div style="font-size:6.2pt;">Diploma: ${escapeHtml(diplomaNo)}</div>
                            <div style="margin-top:3px;"><img src="${eimzaSrc}" alt="E-İmza" style="height:25px;object-fit:contain;display:inline-block;"></div>
                        </td>
                        <td style="text-align:center;padding:4px;vertical-align:top;">
                            <div style="font-weight:700;">${escapeHtml(techManagerName)}</div>
                            <div style="font-size:6.4pt;color:#334155;">${escapeHtml(techManagerTitle)}</div>
                            <div style="margin-top:12px;"><img src="${eimzaSrc}" alt="Onay" style="height:25px;object-fit:contain;display:inline-block;"></div>
                        </td>
                        <td style="text-align:center;padding:4px;vertical-align:top;">
                            <div style="font-weight:700;">${escapeHtml(insp.customer_name || 'Firma Yetkilisi')}</div>
                            <div style="font-size:6.4pt;color:#334155;">Bilgi / Teslim İmza</div>
                            <div style="height:28px;"></div>
                        </td>
                        <td style="text-align:center;vertical-align:middle;padding:4px;">
                            <img src="${qrSrc}" alt="QR Code" style="width:66px;height:66px;object-fit:contain;display:inline-block;">${verifyCodeHtml}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    // ========================================================================
    // 2. DOKÜMAN BLOK AĞACI (AST) OLUŞTURUCU
    // ========================================================================
    function buildDocumentAST(insp, fd, ci, reportNo, formCode, activePdfTheme) {
        const schema = window.UniversalSchemaRegistry
            ? window.UniversalSchemaRegistry.ensureUniversalFormData(fd, insp.template_id, insp.equipment_name)
            : window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);

        const designTokens = window.UniversalTenantOverlay
            ? window.UniversalTenantOverlay.getDesignTokens(fd)
            : {};

        const branding = resolveEffectiveBranding(fd);
        const isRams = (typeof isRamsTheme === 'function') && isRamsTheme(activePdfTheme);
        const reportMainTitle = (schema.title || `${(insp.equipment_name || 'İŞ EKİPMANI').toUpperCase()} PERİYODİK KONTROL RAPORU`).toUpperCase();
        const specDocCode = ((schema.docNo || schema.code || formCode).split(',')[0] || formCode).trim();

        const ctx = {
            insp,
            fd,
            ci,
            schema,
            reportNo,
            formCode: specDocCode,
            docNo: schema.docNo || specDocCode,
            reportMainTitle,
            activePdfTheme,
            isRams,
            designTokens,
            branding
        };

        const blocks = [];
        let secNo = 1;

        // BLOK 1: FİRMA VE KONTROL BİLGİLERİ (meta_info)
        const methodsHtml = (schema.methods && schema.methods.length)
            ? schema.methods.map(m => `&bull; ${escapeHtml(m)}`).join('<br>')
            : '&bull; RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği';

        blocks.push({
            type: 'meta_info',
            splittable: false,
            html: `
                <div class="tkm-sec-title">${secNo++}. FİRMA BİLGİLERİ</div>
                <table class="tkm-table">
                    <colgroup><col style="width:20%;"><col style="width:35%;"><col style="width:18%;"><col style="width:27%;"></colgroup>
                    <tbody>
                        <tr><td class="tkm-label-cell" style="font-weight:700;">Firma Adı</td><td class="tkm-val-cell" colspan="3">${escapeHtml(ci.firmName || insp.customer_name || '')}</td></tr>
                        <tr><td class="tkm-label-cell" style="font-weight:700;">Periyodik Kontrol Adresi</td><td class="tkm-val-cell" colspan="3">${escapeHtml(ci.address || insp.address || '')}</td></tr>
                        <tr><td class="tkm-label-cell" style="font-weight:700;">İSG-KATİP Sözleşme ID</td><td class="tkm-val-cell">${escapeHtml(ci.isgKatipNo || '')}</td><td class="tkm-label-cell" style="font-weight:700;">SGK Sicil No</td><td class="tkm-val-cell">${escapeHtml(ci.sgkSicilNo || '')}</td></tr>
                        <tr><td class="tkm-label-cell" style="font-weight:700;">Rapor Numarası</td><td class="tkm-val-cell" style="font-weight:700;">${escapeHtml(reportNo)}</td><td class="tkm-label-cell" style="font-weight:700;">Rapor Tarihi</td><td class="tkm-val-cell">${escapeHtml(insp.inspection_date || ci.reportDate || '')}</td></tr>
                        <tr><td class="tkm-label-cell" style="font-weight:700;">Kontrol Başlangıç / Bitiş Saati</td><td class="tkm-val-cell">${escapeHtml(ci.startEndTime || '')}</td><td class="tkm-label-cell" style="font-weight:700;">Sonraki Kontrol Tarihi</td><td class="tkm-val-cell">${escapeHtml(fd.nextInspectionDate || ci.nextControlDate || '')}</td></tr>
                        <tr><td class="tkm-label-cell" style="font-weight:700;">Ekipman Adı / Bölge / Kod</td><td class="tkm-val-cell" colspan="3">${escapeHtml(insp.equipment_name || '')}${insp.location ? ` &middot; ${escapeHtml(insp.location)}` : ''}${(ci.serialCode || insp.serial_no) ? ` (${escapeHtml(ci.serialCode || insp.serial_no)})` : ''}</td></tr>
                        <tr><td class="tkm-label-cell" style="font-weight:700;">Periyodik Kontrol Metodu ve Kapsamı</td><td class="tkm-val-cell" colspan="3" style="line-height:1.22;">${methodsHtml}</td></tr>
                    </tbody>
                </table>
            `
        });

        // BLOK 2: EKİPMAN TEKNİK BİLGİLERİ (field_grid - 2 veya 3 sütunlu esnek yapı)
        const fields = schema.generalFields || [];
        if (fields.length > 0) {
            const gridCols = (designTokens.fieldGridColumns && designTokens.fieldGridColumns !== 'auto')
                ? Number(designTokens.fieldGridColumns)
                : (Number(schema.layoutHints?.fieldGridColumns) || 2);

            const colgroupHtml = gridCols === 3
                ? '<colgroup><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.4%;"></colgroup>'
                : '<colgroup><col style="width:24%;"><col style="width:26%;"><col style="width:24%;"><col style="width:26%;"></colgroup>';

            let rowsHtml = '';
            for (let i = 0; i < fields.length; i += gridCols) {
                rowsHtml += '<tr>';
                for (let c = 0; c < gridCols; c++) {
                    const f = fields[i + c];
                    if (f) {
                        const fKey = f.key || f.id;
                        let val = String(fd.specializedFields?.[fKey] ?? '').trim();
                        if (val && f.unit && !val.toLowerCase().includes(f.unit.toLowerCase())) {
                            val = `${val} ${f.unit}`;
                        }
                        rowsHtml += `
                            <td class="tkm-label-cell" style="font-weight:700;">${escapeHtml(f.label)}</td>
                            <td class="tkm-val-cell" style="text-align:left;padding-left:6px;">${escapeHtml(val || '-')}</td>
                        `;
                    } else {
                        rowsHtml += '<td class="tkm-label-cell"></td><td class="tkm-val-cell"></td>';
                    }
                }
                rowsHtml += '</tr>';
            }

            const techSecNo = secNo++;
            blocks.push({
                type: 'field_grid',
                splittable: false,
                html: `
                    <div class="tkm-sec-title">${techSecNo}. EKİPMAN TEKNİK BİLGİLERİ</div>
                    <div class="tkm-sub-bar">${techSecNo}.1. TEKNİK ÖZELLİKLER VE TESİS BİLGİLERİ</div>
                    <table class="tkm-table">${colgroupHtml}<tbody>${rowsHtml}</tbody></table>
                `
            });
        }

        // BLOK 3: ÖLÇÜM ALETLERİ BİLGİLERİ (device_list)
        const hasMeasuringDevices = Array.isArray(fd.measuringDevices) && fd.measuringDevices.some(d => d && (d.name || d.serial));
        const showDevices = schema.layoutHints?.showDevices !== false || hasMeasuringDevices;
        if (showDevices) {
            const devList = (Array.isArray(fd.measuringDevices) && fd.measuringDevices.length)
                ? fd.measuringDevices
                : [{ name: '-', serial: '-', calDate: '-', validDate: '-', certNo: '-' }];
            const devRowsHtml = devList.map(d => `
                <tr>
                    <td style="text-align:center;">${escapeHtml(d.name || '')}</td>
                    <td style="text-align:center;">${escapeHtml(d.serial || '')}</td>
                    <td style="text-align:center;">${escapeHtml(d.calDate || '')}</td>
                    <td style="text-align:center;">${escapeHtml(d.validDate || '')}</td>
                    <td style="text-align:center;">${escapeHtml(d.certNo || '')}</td>
                </tr>
            `).join('');

            blocks.push({
                type: 'device_list',
                splittable: false,
                html: `
                    <div class="tkm-sec-title">${secNo++}. ÖLÇÜM ALETLERİ BİLGİLERİ</div>
                    <table class="tkm-table">
                        <thead>
                            <tr>
                                <th style="text-align:center;font-weight:700;">Cihaz Adı / Marka-Model</th>
                                <th style="text-align:center;font-weight:700;">Seri No</th>
                                <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                                <th style="text-align:center;font-weight:700;">Geçerlilik Tarihi</th>
                                <th style="text-align:center;font-weight:700;">Sertifika No</th>
                            </tr>
                        </thead>
                        <tbody>${devRowsHtml}</tbody>
                    </table>
                `
            });
        }

        // BLOK 3B: TEST DEĞERLERİ VE SEMBOL AÇIKLAMALARI KUTUSU (info_box - Topraklama vb.)
        if (schema.infoBoxHtml) {
            blocks.push({
                type: 'info_box',
                splittable: false,
                html: `
                    <div class="tkm-sec-title">${escapeHtml(schema.infoBoxTitle || `${secNo++}. TEST DEĞERLERİ`)}</div>
                    <table class="tkm-table">
                        <tbody>
                            <tr>
                                <td style="padding:3.5px 6px;text-align:left;">${schema.infoBoxHtml}</td>
                            </tr>
                        </tbody>
                    </table>
                `
            });
        }

        // BLOK 4: GÖZLE KONTROL KRİTERLERİ (checklist - Alt Gruplu 5.2..5.8 / A..D, 1 veya 2 Sütun + Satır Bölünebilir!)
        const checks = schema.visualChecks || [];
        if (checks.length > 0) {
            const chkSecNo = secNo++;
            const chkCols = (designTokens.checklistColumns && designTokens.checklistColumns !== 'auto')
                ? Number(designTokens.checklistColumns)
                : (Number(schema.layoutHints?.checklistColumns) || 1);

            const renderSym = (rawVal) => {
                const sym = formatSymbolForPrint(rawVal || '');
                if ((isRams || activePdfTheme === 'modern') && typeof formatSymbolBadge === 'function' && sym) {
                    return formatSymbolBadge(sym);
                }
                return escapeHtml(sym);
            };

            const getChkVal = (chk, idx) => {
                if (fd.universalChecksById && chk.id && fd.universalChecksById[chk.id] !== undefined && fd.universalChecksById[chk.id] !== '') {
                    return fd.universalChecksById[chk.id];
                }
                return fd.specializedChecks?.[`chk_${idx}`] || '';
            };

            const hasGroups = checks.some(c => c.group);
            if (hasGroups) {
                const groupedMap = [];
                checks.forEach((chk, idx) => {
                    const gName = chk.group || 'KONTROL KRİTERLERİ';
                    let gObj = groupedMap.find(g => g.name === gName);
                    if (!gObj) {
                        gObj = { name: gName, items: [] };
                        groupedMap.push(gObj);
                    }
                    gObj.items.push({ chk, globalIdx: idx });
                });

                groupedMap.forEach((grp, gIdx) => {
                    const isFirstGrp = gIdx === 0;
                    const isLastGrp = gIdx === groupedMap.length - 1;
                    let colgroup = '';
                    let thead = '';
                    let rowsHtml = '';

                    if (chkCols === 2 && grp.items.length >= 2) {
                        colgroup = '<colgroup><col style="width:26px;"><col style="width:42.5%;"><col style="width:30px;"><col style="width:26px;"><col style="width:42.5%;"><col style="width:30px;"></colgroup>';
                        thead = isFirstGrp
                            ? '<thead><tr><th>No</th><th style="text-align:left;padding-left:5px;">Soru / Kriter</th><th style="text-align:center;">Drm</th><th>No</th><th style="text-align:left;padding-left:5px;">Soru / Kriter</th><th style="text-align:center;">Drm</th></tr></thead>'
                            : '';
                        const half = Math.ceil(grp.items.length / 2);
                        for (let i = 0; i < half; i++) {
                            const left = grp.items[i];
                            const right = grp.items[i + half];
                            const leftSym = renderSym(getChkVal(left.chk, left.globalIdx));
                            const rightCells = right
                                ? `<td style="text-align:center;font-weight:700;">${escapeHtml(right.chk.code || String(i + half + 1))}</td>
                                   <td style="text-align:left;padding-left:5px;">${escapeHtml(right.chk.text)}</td>
                                   <td style="text-align:center;">${renderSym(getChkVal(right.chk, right.globalIdx))}</td>`
                                : '<td></td><td></td><td></td>';
                            rowsHtml += `
                                <tr>
                                    <td style="text-align:center;font-weight:700;">${escapeHtml(left.chk.code || String(i + 1))}</td>
                                    <td style="text-align:left;padding-left:5px;">${escapeHtml(left.chk.text)}</td>
                                    <td style="text-align:center;">${leftSym}</td>
                                    ${rightCells}
                                </tr>
                            `;
                        }
                    } else {
                        colgroup = '<colgroup><col style="width:28px;"><col><col style="width:44px;"></colgroup>';
                        thead = isFirstGrp
                            ? '<thead><tr><th>No</th><th style="text-align:left;padding-left:6px;font-weight:700;">Soru / Kontrol Kriteri</th><th style="text-align:center;font-weight:700;">Sonuç</th></tr></thead>'
                            : '';
                        rowsHtml = grp.items.map(it => `
                            <tr>
                                <td style="text-align:center;font-weight:700;">${escapeHtml(it.chk.code || String(it.globalIdx + 1))}</td>
                                <td style="text-align:left;padding-left:6px;">${escapeHtml(it.chk.text)}</td>
                                <td style="text-align:center;">${renderSym(getChkVal(it.chk, it.globalIdx))}</td>
                            </tr>
                        `).join('');
                    }

                    blocks.push({
                        type: 'checklist_group',
                        splittable: false,
                        html: `
                            ${isFirstGrp ? `<div class="tkm-sec-title">${chkSecNo}. GÖZLE KONTROL KRİTERLERİ VE FONKSİYON TESTLERİ</div>` : ''}
                            <div class="tkm-sub-bar">${escapeHtml(grp.name)}</div>
                            <table class="tkm-table">${colgroup}${thead}<tbody>${rowsHtml}</tbody></table>
                            ${isLastGrp ? `<div class="tkm-legend">✓: Uygun &nbsp;|&nbsp; X: Uygun Değil &nbsp;|&nbsp; N: Uygulaması Yok &nbsp;|&nbsp; G: Görülemedi</div>` : ''}
                        `
                    });
                });
            } else {
                let trList = [];
                let colgroup = '';
                let thead = '';

                if (chkCols === 2 && checks.length >= 4) {
                    colgroup = '<colgroup><col style="width:24px;"><col style="width:43%;"><col style="width:32px;"><col style="width:24px;"><col style="width:43%;"><col style="width:32px;"></colgroup>';
                    thead = '<thead><tr><th>No</th><th style="text-align:left;padding-left:5px;">Kontrol Kriteri</th><th style="text-align:center;">Drm</th><th>No</th><th style="text-align:left;padding-left:5px;">Kontrol Kriteri</th><th style="text-align:center;">Drm</th></tr></thead>';
                    const half = Math.ceil(checks.length / 2);
                    for (let i = 0; i < half; i++) {
                        const left = checks[i];
                        const right = checks[i + half];
                        const leftSym = renderSym(getChkVal(left, i));
                        const rightCells = right
                            ? `<td style="text-align:center;font-weight:700;">${escapeHtml(right.code || String(i + half + 1))}</td>
                               <td style="text-align:left;padding-left:5px;">${escapeHtml(right.text)}</td>
                               <td style="text-align:center;">${renderSym(getChkVal(right, i + half))}</td>`
                            : '<td></td><td></td><td></td>';
                        trList.push(`
                            <tr>
                                <td style="text-align:center;font-weight:700;">${escapeHtml(left.code || String(i + 1))}</td>
                                <td style="text-align:left;padding-left:5px;">${escapeHtml(left.text)}</td>
                                <td style="text-align:center;">${leftSym}</td>
                                ${rightCells}
                            </tr>
                        `);
                    }
                } else {
                    colgroup = '<colgroup><col style="width:28px;"><col><col style="width:44px;"></colgroup>';
                    thead = '<thead><tr><th>No</th><th style="text-align:left;padding-left:6px;font-weight:700;">Soru / Kontrol Kriteri</th><th style="text-align:center;font-weight:700;">Sonuç</th></tr></thead>';
                    trList = checks.map((chk, idx) => `
                        <tr>
                            <td style="text-align:center;font-weight:700;">${escapeHtml(chk.code || String(idx + 1))}</td>
                            <td style="text-align:left;padding-left:6px;">${escapeHtml(chk.text)}</td>
                            <td style="text-align:center;">${renderSym(getChkVal(chk, idx))}</td>
                        </tr>
                    `);
                }

                const buildChecklistTableHtml = (rowsSlice, isCont = false) => `
                    <div class="tkm-sec-title">${chkSecNo}. GÖZLE KONTROL KRİTERLERİ VE FONKSİYON TESTLERİ${isCont ? ' (DEVAMI)' : ''}</div>
                    ${isCont ? '' : `<div class="tkm-sub-bar">${chkSecNo}.1. KONTROL KRİTERLERİ</div>`}
                    <table class="tkm-table">${colgroup}${thead}<tbody>${rowsSlice.join('')}</tbody></table>
                    <div class="tkm-legend">✓: Uygun &nbsp;|&nbsp; X: Uygun Değil &nbsp;|&nbsp; N: Uygulaması Yok &nbsp;|&nbsp; G: Görülemedi</div>
                `;

                blocks.push({
                    type: 'checklist',
                    splittable: true,
                    rows: trList,
                    buildSliceHtml: buildChecklistTableHtml,
                    html: buildChecklistTableHtml(trList, false)
                });
            }
        }

        // BLOK 5: ÖLÇÜM VE TEST SONUÇLARI TABLOSU (measurement_table - 2 Katlı Bakanlık Başlığı + Satır Bazlı Otomatik Bölünebilir!)
        const tableCols = schema.tableColumns || [];
        if (tableCols.length > 0) {
            const tblSecNo = secNo++;
            const tblTitle = (schema.tableTitle || 'ÖLÇÜM VE TEST SONUÇLARI TABLOSU').toUpperCase();
            const isMinistryLinye = schema.groupedHeaderType === 'ministry_linye_2201';

            const colgroupHtml = isMinistryLinye
                ? '<colgroup><col style="width:3.8%;"><col style="width:21.4%;"><col style="width:5.8%;"><col style="width:5.2%;"><col style="width:5.8%;"><col style="width:6.2%;"><col style="width:5.8%;"><col style="width:6.0%;"><col style="width:6.4%;"><col style="width:6.2%;"><col style="width:6.2%;"><col style="width:5.6%;"><col style="width:5.6%;"><col style="width:10.0%;"></colgroup>'
                : (tableCols.some(c => c.width)
                    ? `<colgroup>${tableCols.map(c => `<col style="${c.width ? `width:${c.width};` : ''}">`).join('')}</colgroup>`
                    : '');

            const theadFullHtml = isMinistryLinye ? `
                <thead>
                    <tr>
                        <th rowspan="2" style="text-align:center;vertical-align:middle;font-weight:700;">No</th>
                        <th rowspan="2" style="text-align:center;vertical-align:middle;font-weight:700;">Pano/Tablo No -<br>Linye Adı-Etiketi</th>
                        <th colspan="4" class="tkm-linye-group-th" style="text-align:center;font-weight:700;">Aşırı Akım Koruma Cihazının</th>
                        <th colspan="5" class="tkm-linye-group-th" style="text-align:center;font-weight:700;">İletkenin</th>
                        <th colspan="2" class="tkm-linye-group-th" style="text-align:center;font-weight:700;">RCD Testi</th>
                        <th rowspan="2" style="text-align:center;vertical-align:middle;font-weight:700;">Sonuç</th>
                    </tr>
                    <tr>
                        <th style="text-align:center;font-weight:700;">Eğri</th>
                        <th style="text-align:center;font-weight:700;">Kutup</th>
                        <th style="text-align:center;font-weight:700;">In (A)</th>
                        <th style="text-align:center;font-weight:700;">Icu (kA)</th>
                        <th style="text-align:center;font-weight:700;">Faz (mm²)</th>
                        <th style="text-align:center;font-weight:700;">N/PEN</th>
                        <th style="text-align:center;font-weight:700;">PE (mm²)</th>
                        <th style="text-align:center;font-weight:700;">Ib (A)</th>
                        <th style="text-align:center;font-weight:700;">Iz (A)</th>
                        <th style="text-align:center;font-weight:700;">IΔ (mA)</th>
                        <th style="text-align:center;font-weight:700;">TΔ (ms)</th>
                    </tr>
                </thead>
            ` : `<thead><tr>${tableCols.map(c => `<th style="text-align:center;font-weight:700;">${escapeHtml(c.label)}</th>`).join('')}</tr></thead>`;

            const rawRows = (Array.isArray(fd.universalTableRows) && fd.universalTableRows.length)
                ? fd.universalTableRows
                : [];

            const trRows = rawRows.map((rowObj, rIdx) => {
                const noCell = isMinistryLinye ? `<td style="text-align:center;">${rIdx + 1}</td>` : '';
                const cellsHtml = tableCols.map((col, cIdx) => {
                    const cellVal = (rowObj && rowObj[col.key] !== undefined) ? String(rowObj[col.key]) : '';
                    const isBad = cellVal === 'Uygun Değil' || cellVal.includes('Uygun Değil') || cellVal.includes('Kırmızı');
                    const align = (isMinistryLinye && cIdx === 0) ? 'left;padding-left:4px' : 'center';
                    const style = isBad ? `text-align:${align};color:#b91c1c;font-weight:700;background:#fef2f2;` : `text-align:${align};`;
                    return `<td style="${style}">${escapeHtml(cellVal)}</td>`;
                }).join('');
                return `<tr>${noCell}${cellsHtml}</tr>`;
            });

            const tableCls = isMinistryLinye ? 'tkm-table tkm-linye-table' : 'tkm-table';
            const buildMeasurementTableHtml = (rowsSlice, isCont = false) => `
                <div class="tkm-sec-title">${tblSecNo}. ${escapeHtml(tblTitle)}${isCont ? ' (TABLO DEVAMI)' : ''}</div>
                <table class="${tableCls}">
                    ${colgroupHtml}
                    ${theadFullHtml}
                    <tbody>${rowsSlice.join('')}</tbody>
                </table>
            `;

            blocks.push({
                type: 'measurement_table',
                splittable: true,
                rows: trRows,
                buildSliceHtml: buildMeasurementTableHtml,
                html: buildMeasurementTableHtml(trRows, false)
            });
        }

        // BLOK 5B: ÇOKLU EK ÖLÇÜM TABLOLARI (6.2 Potansiyel Dengeleme, 6.3 Zemin İzolasyonu, 5.3 Selektivite, 5.2/5.3 Jeneratör)
        (schema.additionalTables || []).forEach(subTbl => {
            const subCols = subTbl.columns || [];
            const subRows = (fd.universalSubTables && Array.isArray(fd.universalSubTables[subTbl.id]))
                ? fd.universalSubTables[subTbl.id]
                : (subTbl.defaultRows || []);
            if (!subCols.length || !subRows.length) return;

            const subColgroup = subCols.some(c => c.width)
                ? `<colgroup>${subCols.map(c => `<col style="${c.width ? `width:${c.width};` : ''}">`).join('')}</colgroup>`
                : '';
            const subThs = subCols.map(c => `<th style="text-align:center;font-weight:700;">${escapeHtml(c.label)}</th>`).join('');
            const subTrs = subRows.map(sRow => {
                const tds = subCols.map(sc => {
                    const v = (sRow && sRow[sc.key] !== undefined) ? String(sRow[sc.key]) : '';
                    const isBad = v === 'Uygun Değil' || v.includes('Uygun Değil');
                    const style = isBad ? 'text-align:center;color:#b91c1c;font-weight:700;background:#fef2f2;' : 'text-align:center;';
                    return `<td style="${style}">${escapeHtml(v)}</td>`;
                }).join('');
                return `<tr>${tds}</tr>`;
            });

            const buildSubTableHtml = (rowsSlice, isCont = false) => `
                <div class="tkm-sub-bar">${escapeHtml(subTbl.title)}${isCont ? ' (DEVAMI)' : ''}</div>
                <table class="tkm-table">
                    ${subColgroup}
                    <thead><tr>${subThs}</tr></thead>
                    <tbody>${rowsSlice.join('')}</tbody>
                </table>
            `;

            blocks.push({
                type: 'sub_measurement_table',
                splittable: true,
                rows: subTrs,
                buildSliceHtml: buildSubTableHtml,
                html: buildSubTableHtml(subTrs, false)
            });
        });

        // BLOK 6: KUSUR AÇIKLAMALARI & NOTLAR
        const defSecNo = secNo++;
        const noteSecNo = secNo++;
        blocks.push({
            type: 'defect_and_notes',
            splittable: false,
            html: `
                <div class="tkm-sec-title">${defSecNo}. KUSUR AÇIKLAMALARI &amp; ${noteSecNo}. NOTLAR</div>
                <table class="tkm-table">
                    <colgroup><col style="width:20%;"><col style="width:80%;"></colgroup>
                    <tbody>
                        <tr>
                            <td class="tkm-label-cell" style="font-weight:700;">Kusur Açıklamaları</td>
                            <td class="tkm-val-cell" style="min-height:24px;">${escapeHtml(fd.defectNotes || 'Tespit edilen uygunsuzluk bulunmamaktadır.').replace(/\n/g, '<br>')}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="font-weight:700;">Notlar ve Açıklamalar</td>
                            <td class="tkm-val-cell" style="min-height:20px;">${escapeHtml(fd.generalNotes || '-').replace(/\n/g, '<br>')}</td>
                        </tr>
                    </tbody>
                </table>
            `
        });

        // BLOK 7: FOTOĞRAFLAR (photo_grid)
        if (fd.photos && fd.photos.length && typeof renderPdfPhotoBlocks === 'function') {
            const photoBlocks = renderPdfPhotoBlocks(fd.photos, 'FOTOĞRAFLAR');
            photoBlocks.forEach(pbHtml => {
                blocks.push({
                    type: 'photo_grid',
                    splittable: false,
                    html: pbHtml
                });
            });
        }

        // BLOK 8: SONUÇ VE KANAAT + İMZA / ONAY (conclusion_sign - birlikte tutulur veya akıllı bölünür)
        const resSecNo = secNo++;
        const signSecNo = secNo++;
        const isUnsuitable = fd.overallResult === 'UYGUN DEĞİL';
        const verdictColor = isUnsuitable ? '#c00000' : '#047857';
        const verdictBg = isUnsuitable ? '#fef2f2' : '#ecfdf5';

        const conclusionHtml = `
            <div class="tkm-sec-title">${resSecNo}. SONUÇ VE KANAAT</div>
            <table class="tkm-table">
                <tbody>
                    <tr>
                        <td style="padding:5px 7px;text-align:left;line-height:1.25;">
                            ${schema.conclusionNotesHtml || ''}
                            <div style="font-weight:700;font-size:7.4pt;color:${verdictColor};background:${verdictBg};padding:4px 6px;border-radius:3px;">
                                Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen ekipmanın muayenesi sonrasında mevcut şartlar altında<br>
                                <span style="font-size:8.5pt;font-weight:800;">
                                    KULLANIMI ${isUnsuitable ? 'UYGUN DEĞİLDİR.' : 'UYGUNDUR.'}
                                </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;

        const signHtml = buildUniversalSignatureBlock(ctx, String(signSecNo));

        // Sonuç ve İmza bloğunu tek grup olarak tutarak imza kutusunun tek başına kopmasını (orphan) önle
        blocks.push({
            type: 'conclusion_sign',
            splittable: false,
            html: `${conclusionHtml}<div style="height:4px;"></div>${signHtml}`
        });

        return { ctx, blocks };
    }

    // ========================================================================
    // 3. SATIR BÖLEN VE AKILLI TEK SAYFA SIĞDIRAN A4 SAYFALAMA MOTORU
    // ========================================================================
    function runPaginationPass(ast, compactMode = false) {
        const { ctx, blocks } = ast;
        const activeTheme = ctx.activePdfTheme || (typeof getPdfTheme === 'function' ? getPdfTheme() : 'classic');

        let sandbox = document.getElementById('tkmMeasureSandbox');
        if (sandbox) sandbox.remove();
        sandbox = document.createElement('div');
        sandbox.id = 'tkmMeasureSandbox';
        sandbox.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;visibility:hidden;pointer-events:none;z-index:-1;-webkit-text-size-adjust:100%;text-size-adjust:100%;';
        document.body.appendChild(sandbox);

        const compactStyle = compactMode
            ? '<style>#tkmProbeBody .tkm-sec-title{margin-top:3px !important;margin-bottom:1px !important;padding:2px 5px !important;} #tkmProbeBody .tkm-sub-bar{padding:1.5px 5px !important;} #tkmProbeBody .tkm-table td,#tkmProbeBody .tkm-table th{padding-top:1.5px !important;padding-bottom:1.5px !important;line-height:1.12 !important;}</style>'
            : '';

        const probePage = document.createElement('div');
        probePage.className = 'tkm-a4-page';
        probePage.setAttribute('data-pdf-theme', activeTheme);
        probePage.innerHTML = `
            ${compactStyle}
            ${buildUniversalPageHeader(ctx)}
            <div id="tkmProbeBody" style="flex:0 0 auto;display:block;width:100%;"></div>
            ${buildUniversalPageFooter(ctx, 1, 1)}
        `;
        sandbox.appendChild(probePage);

        const headerEl = probePage.querySelector('.tkm-header');
        const footerEl = probePage.querySelector('.tkm-footer');
        const bodyEl = probePage.querySelector('#tkmProbeBody');
        const cs = window.getComputedStyle(probePage);
        const padTop = parseFloat(cs.paddingTop) || 24;
        const padBottom = parseFloat(cs.paddingBottom) || 22;
        const pageInnerH = (probePage.clientHeight || 1120) - padTop - padBottom;
        const headerH = (headerEl ? headerEl.offsetHeight : 112) + 4;
        const footerH = (footerEl ? footerEl.offsetHeight : 44) + 6;
        const maxBodyHeight = pageInnerH - headerH - footerH - 6;

        const packedPages = [];
        let lastPageFillRatio = 1;

        const flushCurrentPage = () => {
            if (bodyEl.children.length > 0) {
                lastPageFillRatio = bodyEl.offsetHeight / Math.max(1, maxBodyHeight);
                packedPages.push(bodyEl.innerHTML);
                bodyEl.innerHTML = '';
            }
        };

        for (let i = 0; i < blocks.length; i++) {
            const blk = blocks[i];
            const blockEl = document.createElement('div');
            blockEl.className = 'tkm-block';
            blockEl.innerHTML = blk.html;
            bodyEl.appendChild(blockEl);

            if (bodyEl.offsetHeight <= maxBodyHeight) {
                continue;
            }

            // Sığmadı! Önce bu bloğu geri çıkaralım
            bodyEl.removeChild(blockEl);

            // Eğer blok satır bazlı bölünebilir bir tabloysa (measurement_table veya checklist)
            if (blk.splittable && Array.isArray(blk.rows) && blk.rows.length > 1 && typeof blk.buildSliceHtml === 'function') {
                let remainingRows = blk.rows.slice();
                let isContinuation = false;

                while (remainingRows.length > 0) {
                    // Mevcut sayfaya kaç satır sığıyor?
                    let fitCount = 0;
                    const probeSliceEl = document.createElement('div');
                    probeSliceEl.className = 'tkm-block';
                    bodyEl.appendChild(probeSliceEl);

                    for (let rCount = 1; rCount <= remainingRows.length; rCount++) {
                        probeSliceEl.innerHTML = blk.buildSliceHtml(remainingRows.slice(0, rCount), isContinuation);
                        if (bodyEl.offsetHeight <= maxBodyHeight) {
                            fitCount = rCount;
                        } else {
                            break;
                        }
                    }

                    bodyEl.removeChild(probeSliceEl);

                    // Eğer mevcut sayfada başka bloklar varken en az 2 satır bile sığmıyorsa yeni sayfaya geç
                    if (fitCount < 2 && bodyEl.children.length > 0) {
                        flushCurrentPage();
                        continue;
                    }

                    // Eğer boş sayfada bile tek satır sığmadıysa (aşırı uzun hücre) en az 1 satırı zorla koy ki sonsuz döngü olmasın
                    const takeCount = Math.max(1, fitCount);
                    const takenRows = remainingRows.slice(0, takeCount);
                    remainingRows = remainingRows.slice(takeCount);

                    const finalSliceEl = document.createElement('div');
                    finalSliceEl.className = 'tkm-block';
                    finalSliceEl.innerHTML = blk.buildSliceHtml(takenRows, isContinuation);
                    bodyEl.appendChild(finalSliceEl);

                    if (remainingRows.length > 0) {
                        flushCurrentPage();
                        isContinuation = true;
                    }
                }
                continue;
            }

            // Bölünemeyen normal blok: mevcut sayfada içerik varsa sayfayı kapatıp yeni sayfaya koy
            if (bodyEl.children.length > 0) {
                flushCurrentPage();
            }
            bodyEl.appendChild(blockEl);
        }

        if (bodyEl.children.length > 0) {
            lastPageFillRatio = bodyEl.offsetHeight / Math.max(1, maxBodyHeight);
            packedPages.push(bodyEl.innerHTML);
        }

        sandbox.remove();

        const totalPages = packedPages.length || 1;
        const pagesHtml = packedPages.map((pageContentHtml, idx) => `
            ${compactStyle}
            ${buildUniversalPageHeader(ctx)}
            <div class="tkm-page-body">${pageContentHtml}</div>
            ${buildUniversalPageFooter(ctx, idx + 1, totalPages)}
        `);

        return {
            pagesHtml,
            totalPages,
            lastPageFillRatio
        };
    }

    function paginateASTToA4Pages(ast) {
        const densityPref = ast.ctx.designTokens?.pageDensity || 'auto';
        if (densityPref === 'compact') {
            return runPaginationPass(ast, true).pagesHtml;
        }

        const normalPass = runPaginationPass(ast, false);

        // Akıllı 1-Sayfa Sığdırma: Eğer rapor 2 sayfaya sadece küçük bir taşma (%22'den az doluluk) ile geçtiyse
        // otomatik olarak compact modda dene; 1 sayfaya sığıyorsa tek sayfa olarak ver!
        if (densityPref === 'auto' && normalPass.totalPages === 2 && normalPass.lastPageFillRatio <= 0.24) {
            const compactPass = runPaginationPass(ast, true);
            if (compactPass.totalPages === 1) {
                return compactPass.pagesHtml;
            }
        }

        return normalPass.pagesHtml;
    }

    const UniversalPdfEngine = {
        version: '1.0.0',
        buildDocumentAST,
        paginateASTToA4Pages,
        buildPdfPages(insp, fd, ci, reportNo, formCode, activePdfTheme) {
            const ast = buildDocumentAST(insp, fd, ci, reportNo, formCode, activePdfTheme);
            return paginateASTToA4Pages(ast);
        }
    };

    window.UniversalPdfEngine = UniversalPdfEngine;
})();
