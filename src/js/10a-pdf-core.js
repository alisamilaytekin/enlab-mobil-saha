// ============================================================================
// HIZLI RAPOR - 10A-PDF-CORE.JS
// Açıklama: PDF Önizleme/Panzoom, Ortak Antet/Altbilgi, Sayfalama ve E-Posta Motoru
// ============================================================================

function formatSymbolForPrint(val) {

    if (val === 'Uygun' || val === '✓') return '✓';

    if (val === 'Uygun Değil' || val === 'X') return 'X';

    if (val === 'Uygulaması Yok' || val === 'N') return 'N';

    if (val === 'Görülemedi' || val === 'G') return 'G';

    return val ?? '';

}

function formatSymbolBadge(sym) {
    if (!sym) return '';
    let cls = 'tkm-badge-default';
    if (sym === '✓') cls = 'tkm-badge-ok';
    else if (sym === 'X' || sym === '✕') cls = 'tkm-badge-bad';
    else if (sym === 'N' || sym === 'G') cls = 'tkm-badge-neutral';
    return `<span class="tkm-sym-badge ${cls}">${sym}</span>`;
}




function buildTkmPageHeader(reportMainTitle) {
    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;
    const logoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getLogoSrc() : 'assets/tekkomer_logo.png';
    const showTurkak = branding.showTurkakLogo !== false;
    const turkakLogoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getTurkakLogoSrc() : 'assets/turkak_logo.jpg';
    const accNo = branding.accreditationNo || 'AB-0227-M';
    const safeCompanyFullName = String(branding.companyFullName || 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.').replace(/KOMTROL/gi, 'KONTROL');

    return `
        <div class="tkm-header">
            <div style="display:flex;justify-content:center;align-items:center;padding-left:2px;overflow:visible;">
                <img src="${logoSrc}" alt="TEKKOMER Logo" style="width:78px;height:70px;object-fit:contain;object-position:center;display:block;">
            </div>
            <div style="text-align:center;padding:0 6px;">
                <div style="font-size:11.2pt;font-weight:700;color:#222222;letter-spacing:0.2px;margin-bottom:1px;line-height:1.15;">
                    ${escapeHtml(safeCompanyFullName)}
                </div>
                <div style="font-size:7.6pt;color:#222222;line-height:1.2;">
                    T: +90 (216) 526 61 41 &nbsp;&nbsp; F: +90 (216) 526 61 40
                </div>
                <div style="font-size:7.6pt;color:#222222;line-height:1.2;margin-bottom:2px;">
                    info@tkmkontrol.com &nbsp;&nbsp; www.tkmkontrol.com
                </div>
                <div class="tkm-header-title" style="font-size:10.5pt;font-weight:700;color:#222222;line-height:1.12;text-transform:uppercase;">
                    ${reportMainTitle}
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



function buildTkmPageFooter(formCode, reportNo, pageNum, totalPages) {

    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;
    const safeCompanyFullName = String(branding.companyFullName || 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.').replace(/KOMTROL/gi, 'KONTROL');

    const disclaimer = ((branding.footerDisclaimer || DEFAULT_COMPANY_BRANDING.footerDisclaimer))
        .replace(/\{COMPANY_NAME\}/g, safeCompanyFullName)
        .replace(/KOMTROL/gi, 'KONTROL');

    const isRams = (typeof isRamsTheme === 'function') && isRamsTheme(getPdfTheme());

    if (isRams) {
        const baseFormCode = String(formCode || 'FR.01').split(',')[0].trim() || 'FR.01';
        const docCode = (baseFormCode.includes('318') || baseFormCode.includes('ZPKR02'))
            ? 'ZPKR02'
            : baseFormCode;

        return `

        <div class="tkm-footer">

            <div class="tkm-footer-disclaimer">

                ${escapeHtml(disclaimer)}

            </div>

            <table class="tkm-footer-doc-table">
                <tbody>
                    <tr>
                        <td class="tkm-fdoc-lbl">Doküman Kodu</td>
                        <td class="tkm-fdoc-val">${escapeHtml(docCode)}</td>
                        <td class="tkm-fdoc-lbl">Yayım Tarihi</td>
                        <td class="tkm-fdoc-val">18.07.2025</td>
                        <td class="tkm-fdoc-lbl">Revizyon No / Tarihi</td>
                        <td class="tkm-fdoc-val">- / -</td>
                        <td class="tkm-fdoc-lbl">Yürürlük Tarihi</td>
                        <td class="tkm-fdoc-val">01.09.2025</td>
                    </tr>
                </tbody>
            </table>

            <div class="tkm-footer-meta">

                <span style="width:33%;text-align:left;"></span>

                <span style="width:34%;text-align:center;">${escapeHtml(reportNo)}</span>

                <span style="width:33%;text-align:right;">${pageNum} / ${totalPages}</span>

            </div>

        </div>

    `;
    }

    const revDefault = branding.defaultRevisionInfo || 'REV.00 / YT: 01.09.2025';

    let displayFormCode = formCode || 'FR.01';

    if (!displayFormCode.includes('REV') && !displayFormCode.includes('RT:')) {

        displayFormCode = `${displayFormCode}, ${revDefault}`;

    }

    return `

        <div class="tkm-footer">

            <div class="tkm-footer-disclaimer">

                ${escapeHtml(disclaimer)}

            </div>

            <div class="tkm-footer-meta">

                <span style="width:38%;text-align:left;">${escapeHtml(displayFormCode)}</span>

                <span style="width:34%;text-align:center;">${escapeHtml(reportNo)}</span>

                <span style="width:28%;text-align:right;">${pageNum} / ${totalPages}</span>

            </div>

        </div>

    `;

}



function buildTkmOnaySection(insp, sectionNumber = '10', customTitle = null) {

    const hasPortalQr = Boolean(insp && insp.portal_report_url && typeof window.generateQrDataUrl === 'function');

    const qrSrc = hasPortalQr
        ? window.generateQrDataUrl(insp.portal_report_url)
        : ((window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.qrDefault) || 'assets/qr_default.jpg');

    const verifyCodeHtml = (insp && insp.portal_verify_code)
        ? `<div style="font-size:6pt;font-family:monospace;font-weight:700;color:#111;margin-top:2px;letter-spacing:0.3px;">Doğrulama: ${escapeHtml(insp.portal_verify_code)}</div>`
        : '';

    const qrImgSize = verifyCodeHtml ? '70px' : '76px';

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



    return `

        <div class="tkm-sec-title">${customTitle || `${sectionNumber}. ONAY`}</div>

        <table class="tkm-table">

            <colgroup>

                <col style="width:19%;">

                <col style="width:48%;">

                <col style="width:33%;">

            </colgroup>

            <thead>

                <tr>

                    <th style="border:1px solid #000;"></th>

                    <th style="border:1px solid #000;text-align:center;font-weight:700;">Muayene Personeli</th>

                    <th style="border:1px solid #000;text-align:center;font-weight:700;">Kare Kod</th>

                </tr>

            </thead>

            <tbody>

                <tr>

                    <td style="font-weight:700;text-align:left;">Adı Soyadı / Mesleği</td>

                    <td style="text-align:center;font-weight:bold;">${inspectorName} / ${inspectorTitle}</td>

                    <td rowspan="4" style="text-align:center;vertical-align:middle;padding:4px;">

                        <img src="${qrSrc}" alt="QR Code" style="width:${qrImgSize};height:${qrImgSize};object-fit:contain;display:inline-block;">${verifyCodeHtml}

                    </td>

                </tr>

                <tr>

                    <td style="font-weight:700;text-align:left;">Bakanlık Kayıt No</td>

                    <td style="text-align:center;font-weight:bold;">${ministryNo}</td>

                </tr>

                <tr>

                    <td style="font-weight:700;text-align:left;">Diploma No / Tarih</td>

                    <td style="text-align:center;font-weight:bold;">${diplomaNo}</td>

                </tr>

                <tr style="height:44px;">

                    <td style="font-weight:700;text-align:left;vertical-align:middle;">İmza</td>

                    <td style="text-align:center;vertical-align:middle;padding:3px;">

                        <img src="${eimzaSrc}" alt="e-imzalıdır" style="height:34px;object-fit:contain;display:inline-block;">

                    </td>

                </tr>

            </tbody>

        </table>
        <div style="font-size:6.8pt;color:#333333;margin-top:2px;text-align:left;font-style:italic;">
            Bu rapor elektronik ortamda 1 (bir) nüsha olarak hazırlanmıştır.
        </div>
    `;
}



function triggerBrowserPrint() {

    const insp = AppState.currentInspection;

    const reportNo = (insp && insp.report_no) ? insp.report_no : 'TKM_A4_Rapor';

    const customer = (insp && insp.customer_name) ? insp.customer_name.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 28) : 'Rapor';

    const jobTitle = `${reportNo}_${customer}`;

    if (typeof showToast === 'function') {
        showToast('PDF Yazdırma / Kaydetme ekranı açılıyor... Açılan ekranda üstten "PDF Olarak Kaydet"i seçebilirsiniz.', 4500);
    }

    // Native Android WebView PrintManager support (100% Offline A4 PDF export)

    if (window.AndroidBridge && typeof window.AndroidBridge.printA4Report === 'function') {

        try {

            window.AndroidBridge.printA4Report(jobTitle);

            return;

        } catch (err) {

            console.warn('AndroidBridge.printA4Report fallback to window.print:', err);

        }

    }

    window.print();

}

let _emailModalReportsPool = [];

function getResolvedRecipientEmail(wo, insp, ci) {
    return (
        (ci && ci.contactEmail) ||
        (insp && (insp.contact_email || insp.customer_email)) ||
        (wo && (wo.contact_email || wo.customer_email)) ||
        (function() { try { return localStorage.getItem('enlab_last_recipient_email') || ''; } catch (e) { return ''; } })() ||
        ''
    ).trim();
}

function onReportEmailRecipientChange(val) {
    const clean = (val || '').trim();
    try {
        if (clean) localStorage.setItem('enlab_last_recipient_email', clean);
    } catch (e) {}
    if (AppState.currentFormData && AppState.currentFormData.companyInfo) {
        AppState.currentFormData.companyInfo.contactEmail = clean;
    }
    if (AppState.currentInspection) {
        AppState.currentInspection.contact_email = clean;
    }
    const woId = (AppState.currentWorkOrder && AppState.currentWorkOrder.id) || (AppState.currentInspection && AppState.currentInspection.work_order_id);
    if (woId && typeof saveWorkOrderEmailRealtime === 'function') {
        saveWorkOrderEmailRealtime(woId, clean);
    }
}

function renderEmailModalMultiList(reports, preselectedIds) {
    const sec = document.getElementById('reportEmailMultiSection');
    const listEl = document.getElementById('reportEmailMultiList');
    if (!sec || !listEl) return;

    _emailModalReportsPool = Array.isArray(reports) ? reports : [];
    if (_emailModalReportsPool.length <= 1) {
        sec.classList.add('hidden');
        listEl.innerHTML = '';
        return;
    }

    sec.classList.remove('hidden');
    const selectedSet = new Set((preselectedIds || []).map(x => String(x)));
    listEl.innerHTML = _emailModalReportsPool.map((item, idx) => {
        const isChecked = selectedSet.has(String(item.id));
        const eqName = item.equipment_name || 'Periyodik Kontrol Raporu';
        const rNo = item.report_no || `Rapor-${idx + 1}`;
        return `
            <label class="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition">
                <div class="flex items-center gap-2 min-w-0">
                    <input type="checkbox" name="emailReportItemCb" value="${item.id}" ${isChecked ? 'checked' : ''}
                        onchange="rebuildEmailTextFromSelection()"
                        class="w-4 h-4 accent-sky-500 rounded shrink-0">
                    <span class="font-bold text-slate-100 text-xs truncate">${escapeHtml(eqName)}</span>
                </div>
                <span class="text-[10px] font-mono text-slate-400 shrink-0">${escapeHtml(rNo)}</span>
            </label>
        `;
    }).join('');
}

function toggleAllEmailReports(selectAll = true) {
    const boxes = document.querySelectorAll('input[name="emailReportItemCb"]');
    const allChecked = Array.from(boxes).every(cb => cb.checked);
    const targetState = selectAll ? !allChecked : false;
    boxes.forEach(cb => { cb.checked = targetState; });
    rebuildEmailTextFromSelection();
}

function rebuildEmailTextFromSelection() {
    const subjectInput = document.getElementById('reportEmailSubject');
    const bodyInput = document.getElementById('reportEmailBody');
    if (!subjectInput || !bodyInput) return;

    const insp = AppState.currentInspection || {};
    const fd = AppState.currentFormData || {};
    const ci = fd.companyInfo || {};
    const woId = insp.work_order_id || (AppState.currentWorkOrder && AppState.currentWorkOrder.id) || (_emailModalReportsPool[0] && _emailModalReportsPool[0].work_order_id);
    const dbWo = woId && window.OfflineDB?.state?.workOrders
        ? window.OfflineDB.state.workOrders.find(w => String(w.id) === String(woId))
        : null;
    const wo = dbWo || AppState.currentWorkOrder || {};

    const checkedIds = Array.from(document.querySelectorAll('input[name="emailReportItemCb"]:checked')).map(cb => String(cb.value));
    let selectedReports = _emailModalReportsPool.filter(r => checkedIds.includes(String(r.id)));

    if (selectedReports.length === 0 && _emailModalReportsPool.length > 0) {
        selectedReports = [_emailModalReportsPool[0]];
    }

    // Refresh selected report objects from OfflineDB if available so freshly uploaded portal URLs are included
    selectedReports = selectedReports.map(r => {
        const fresh = (r && r.id && window.OfflineDB?.state?.inspections)
            ? window.OfflineDB.state.inspections.find(x => String(x.id) === String(r.id))
            : null;
        return fresh ? Object.assign({}, r, fresh) : r;
    });

    const customer = (
        (selectedReports[0] && (selectedReports[0].customer_name || selectedReports[0].company_name)) ||
        wo.customer_name ||
        wo.company_name ||
        insp.customer_name ||
        ci.firmName ||
        'Firmanız'
    ).trim();

    const pdfBtnLabel = document.getElementById('btnDownloadSelectedPdfLabel');
    if (pdfBtnLabel) {
        pdfBtnLabel.textContent = selectedReports.length > 1
            ? `Seçili ${selectedReports.length} Raporu Tek PDF Olarak Kaydet / İndir`
            : 'Seçili Raporu PDF Olarak Kaydet / İndir';
    }

    const portalFolderUrl = wo.portal_folder_url || (selectedReports.find(r => r && r.portal_folder_url) || {}).portal_folder_url || '';
    const portalPin = wo.portal_pin || '';
    const portalUsername = wo.portal_customer_username || '';
    const portalPassword = wo.portal_customer_password || '';
    const portalSiteUrl = (typeof CloudPortal !== 'undefined' && CloudPortal.getConfig) ? CloudPortal.getConfig().portalUrl : 'https://hizli-rapor-portal.vercel.app';

    if (selectedReports.length <= 1) {
        const r = selectedReports[0] || insp;
        const reportNo = r.report_no || ci.reportNo || 'TKM-RAPOR';
        const equipment = r.equipment_name || ci.equipmentName || 'Periyodik Kontrol';
        const safeCust = customer.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 25);
        const pdfFileName = `${reportNo}_${safeCust}.pdf`;

        const portalBlockLines = [];
        if (portalFolderUrl || r.portal_report_url || portalUsername) {
            portalBlockLines.push('İNTERNET ÜZERİNDEN RAPOR GÖRÜNTÜLEME (Yalnızca firmanıza özeldir):');
            if (portalUsername) {
                portalBlockLines.push(`- Portal Giriş Adresi: ${portalSiteUrl}`);
                portalBlockLines.push(`- Müşteri Kullanıcı Adı: ${portalUsername}`);
                if (portalPassword) portalBlockLines.push(`- Müşteri Şifresi: ${portalPassword}`);
            }
            if (portalFolderUrl) portalBlockLines.push(`- Müşteri Klasörü: ${portalFolderUrl}`);
            if (portalPin) portalBlockLines.push(`- Ek Erişim PIN Şifresi: ${portalPin}`);
            if (r.portal_report_url) {
                portalBlockLines.push(`- Doğrudan Rapor Linki: ${r.portal_report_url}${r.portal_verify_code ? ` (Doğrulama Kodu: ${r.portal_verify_code})` : ''}`);
            }
        }
        const portalSection = portalBlockLines.length ? `\n\n${portalBlockLines.join('\n')}` : '';

        subjectInput.value = `Periyodik Kontrol Raporu - ${customer} (${equipment})`;
        bodyInput.value =
`Sayın Yetkili,

${customer} firmasında gerçekleştirilen periyodik kontrol çalışmasına ait ${equipment} (${reportNo}) raporu hazırlanmış olup ekte (${pdfFileName}) bilgilerinize sunulmuştur.${portalSection}

İyi çalışmalar dileriz.
ENLAB / TEKKOMER Periyodik Kontrol Muayene Kuruluşu`;
    } else {
        const listLines = selectedReports.map((r, i) => {
            const eq = r.equipment_name || 'Periyodik Kontrol Raporu';
            const rNo = r.report_no ? ` (${r.report_no})` : '';
            const rLink = r.portal_report_url ? `\n   Link: ${r.portal_report_url}${r.portal_verify_code ? ` · Kod: ${r.portal_verify_code}` : ''}` : '';
            return `${i + 1}. ${eq}${rNo}${rLink}`;
        }).join('\n');
        const safeCust = customer.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 25);
        const pdfFileName = `Periyodik_Kontrol_Raporlari_${selectedReports.length}_Adet_${safeCust}.pdf`;

        const portalHeaderLines = [];
        if (portalFolderUrl || portalUsername) {
            portalHeaderLines.push('İNTERNET ÜZERİNDEN RAPOR KLASÖRÜ (Yalnızca firmanıza özeldir):');
            if (portalUsername) {
                portalHeaderLines.push(`- Portal Giriş Adresi: ${portalSiteUrl}`);
                portalHeaderLines.push(`- Müşteri Kullanıcı Adı: ${portalUsername}`);
                if (portalPassword) portalHeaderLines.push(`- Müşteri Şifresi: ${portalPassword}`);
            }
            if (portalFolderUrl) portalHeaderLines.push(`- Müşteri Klasörü: ${portalFolderUrl}`);
            if (portalPin) portalHeaderLines.push(`- Ek Erişim PIN Şifresi: ${portalPin}`);
        }
        const portalSection = portalHeaderLines.length ? `\n\n${portalHeaderLines.join('\n')}` : '';

        subjectInput.value = `Periyodik Kontrol Raporları (${selectedReports.length} Adet) - ${customer}`;
        bodyInput.value =
`Sayın Yetkili,

${customer} firmasında gerçekleştirilen periyodik kontrol çalışmalarına ait aşağıdaki raporlar hazırlanmış olup ekte (${pdfFileName}) bilgilerinize sunulmuştur:

${listLines}${portalSection}

İyi çalışmalar dileriz.
ENLAB / TEKKOMER Periyodik Kontrol Muayene Kuruluşu`;
    }
}

function getSelectedEmailReportsList() {
    const checkedIds = Array.from(document.querySelectorAll('input[name="emailReportItemCb"]:checked')).map(cb => String(cb.value));
    let selectedReports = _emailModalReportsPool.filter(r => checkedIds.includes(String(r.id)));
    if (selectedReports.length === 0) {
        if (_emailModalReportsPool.length > 0) selectedReports = [_emailModalReportsPool[0]];
        else if (AppState.currentInspection) selectedReports = [AppState.currentInspection];
    }
    return selectedReports;
}

function loadInspectionFormDataObject(inspObj) {
    if (!inspObj) return {};
    let baseData = {};
    try {
        baseData = typeof inspObj.data_json === 'string' ? JSON.parse(inspObj.data_json || '{}') : (inspObj.form_data || {});
    } catch (e) {}
    let localData = null;
    try {
        const localRaw = localStorage.getItem(`enlab_insp_${inspObj.id}`);
        if (localRaw) localData = JSON.parse(localRaw);
    } catch (e) {}
    const formData = Object.assign({}, baseData || {}, localData || {});
    if (!formData.answers) formData.answers = {};
    if (!formData.tableRows) formData.tableRows = {};
    if (!formData.specializedFields) formData.specializedFields = {};
    if (!formData.specializedChecks) formData.specializedChecks = {};
    if (!formData.specializedRows) formData.specializedRows = [];
    if (!formData.photos) formData.photos = [];
    if (formData.defectNotes === undefined) formData.defectNotes = '';
    if (formData.generalNotes === undefined) formData.generalNotes = '';
    if (!formData.overallResult) formData.overallResult = 'UYGUN';
    if (!formData.grounding) formData.grounding = { details: {}, detected: {}, method: 'Çevrim empedansı', points: [], selectivity: [] };
    if (!formData.generator) formData.generator = { info: {}, equipment: {}, checks: {}, potential: {}, measurements: {}, battery: {}, devices: [] };
    if (window.MeasuringDevicesManager && typeof window.MeasuringDevicesManager.applyDefaultsToFormData === 'function') {
        window.MeasuringDevicesManager.applyDefaultsToFormData(formData, inspObj.template_id, false);
    }
    if (String(inspObj.template_id) === '2205' && Array.isArray(formData.measuringDevices) && formData.measuringDevices.length && (!formData.generator.devices || !formData.generator.devices.length)) {
        formData.generator.devices = formData.measuringDevices;
    }
    return formData;
}

function downloadSelectedEmailReportsAsPdf() {
    const selectedReports = getSelectedEmailReportsList();
    if (!selectedReports.length) {
        if (typeof showToast === 'function') showToast('Lütfen en az bir rapor seçin.', 'warning');
        return;
    }

    const printArea = document.getElementById('printableReportArea');
    const activePdfTheme = getPdfTheme();

    // Save current editor state so we don't disturb the user's open report
    const savedInsp = AppState.currentInspection;
    const savedFd = AppState.currentFormData;

    const allPagesHtml = [];

    try {
        for (let i = 0; i < selectedReports.length; i++) {
            const r = normalizeInspection(selectedReports[i]);
            let fd = loadInspectionFormDataObject(r);
            if (savedInsp && String(savedInsp.id) === String(r.id) && savedFd) {
                fd = savedFd;
            }
            AppState.currentInspection = r;
            AppState.currentFormData = fd;
            printOfficialReport(false, null, true);
            if (printArea && printArea.innerHTML) {
                allPagesHtml.push(printArea.innerHTML);
            }
        }
    } finally {
        AppState.currentInspection = savedInsp;
        AppState.currentFormData = savedFd;
    }

    if (printArea && allPagesHtml.length > 0) {
        printArea.setAttribute('data-pdf-theme', activePdfTheme);
        printArea.innerHTML = allPagesHtml.join('');
    }

    const first = selectedReports[0];
    const customer = ((first && (first.customer_name || first.company_name)) || 'Rapor').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 25);
    const jobTitle = selectedReports.length > 1
        ? `Periyodik_Kontrol_Raporlari_${selectedReports.length}_Adet_${customer}`
        : `${first.report_no || 'TKM_Rapor'}_${customer}`;

    if (typeof showToast === 'function') {
        showToast('Açılan ekranda üstten "PDF Olarak Kaydet"i seçip telefonunuza kaydedin, ardından E-posta uygulamasında ataç (📎) ikonundan ekleyin.', 5000);
    }

    if (window.AndroidBridge && typeof window.AndroidBridge.printA4Report === 'function') {
        try {
            window.AndroidBridge.printA4Report(jobTitle);
            return;
        } catch (err) {
            console.warn('AndroidBridge.printA4Report error:', err);
        }
    }
    window.print();
}

function openReportEmailModal() {
    const insp = AppState.currentInspection || {};
    const fd = AppState.currentFormData || {};
    const ci = fd.companyInfo || {};
    const woId = insp.work_order_id || (AppState.currentWorkOrder && AppState.currentWorkOrder.id);
    const wo = (window.OfflineDB?.state?.workOrders || []).find(w => String(w.id) === String(woId)) || AppState.currentWorkOrder || {};

    let folderReports = [];
    if (woId && window.OfflineDB?.state?.inspections) {
        folderReports = window.OfflineDB.state.inspections.filter(i => String(i.work_order_id) === String(woId));
    } else if (Array.isArray(AppState.inspectionsCache) && AppState.inspectionsCache.length > 0) {
        folderReports = AppState.inspectionsCache;
    }
    if (folderReports.length === 0 && insp.id) {
        folderReports = [insp];
    }

    const modal = document.getElementById('reportEmailModal');
    if (!modal) return;

    const recipientInput = document.getElementById('reportEmailRecipient');
    if (recipientInput) {
        recipientInput.value = getResolvedRecipientEmail(wo, insp, ci);
    }

    renderEmailModalMultiList(folderReports, [insp.id || (folderReports[0] && folderReports[0].id)]);
    rebuildEmailTextFromSelection();

    modal.classList.remove('hidden');
}

async function openMultiReportEmailModal(workOrderId) {
    const woId = workOrderId || (AppState.currentWorkOrder && AppState.currentWorkOrder.id);
    let wo = AppState.currentWorkOrder || {};
    let reports = Array.isArray(AppState.inspectionsCache) ? AppState.inspectionsCache : [];

    if (woId) {
        try {
            const res = await fetch(`/api/work-orders/${woId}`);
            const data = await res.json();
            if (data.workOrder) {
                wo = normalizeWorkOrder(data.workOrder);
                AppState.currentWorkOrder = wo;
            }
            if (Array.isArray(data.inspections)) reports = data.inspections.map(normalizeInspection);
        } catch (e) {}
    }

    if (!reports.length) {
        if (typeof showToast === 'function') showToast('Bu klasörde gönderilecek rapor bulunamadı.', 'warning');
        return;
    }

    const modal = document.getElementById('reportEmailModal');
    if (!modal) return;

    const recipientInput = document.getElementById('reportEmailRecipient');
    if (recipientInput) {
        recipientInput.value = getResolvedRecipientEmail(wo, reports[0], null);
    }

    renderEmailModalMultiList(reports, reports.map(r => r.id));
    rebuildEmailTextFromSelection();

    modal.classList.remove('hidden');
}

function closeReportEmailModal() {
    const modal = document.getElementById('reportEmailModal');
    if (modal) modal.classList.add('hidden');
}

function restoreNativeDatabaseImmediately() {
    try {
        if (window.OfflineDB) {
            window.OfflineDB.init();
            window.OfflineDB.save();
        }
    } catch (e) {
        console.warn('Database restore warning:', e);
    }
}

function sendReportEmailDirect() {
    const recipient = (document.getElementById('reportEmailRecipient')?.value || '').trim();
    const subject = (document.getElementById('reportEmailSubject')?.value || 'Periyodik Kontrol Raporu').trim();
    const body = document.getElementById('reportEmailBody')?.value || '';

    if (recipient) {
        onReportEmailRecipientChange(recipient);
        // Copy recipient email to clipboard so user can paste with 1 tap if needed
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(recipient);
            }
        } catch (e) {}
    }

    const fullEmailText = recipient ? `Alıcı: ${recipient}\n\n${body}` : body;

    // 1. Native Android Share / Email Chooser via AndroidBridge
    if (window.AndroidBridge && typeof window.AndroidBridge.shareJsonBackup === 'function') {
        try {
            window.AndroidBridge.shareJsonBackup(subject, fullEmailText);
            // Restore actual offline DB immediately on both JS and UI threads
            restoreNativeDatabaseImmediately();
            setTimeout(restoreNativeDatabaseImmediately, 80);
            setTimeout(restoreNativeDatabaseImmediately, 350);
            setTimeout(restoreNativeDatabaseImmediately, 1000);
            if (typeof showToast === 'function') {
                showToast(recipient ? `E-posta ekranı açılıyor (Alıcı: ${recipient} panoya kopyalandı)` : 'E-posta / Paylaşım ekranı açılıyor...');
            }
            setTimeout(() => closeReportEmailModal(), 400);
            return;
        } catch (err) {
            console.warn('AndroidBridge email launch error:', err);
        }
    }

    // 2. Web Share API fallback
    if (navigator.share) {
        navigator.share({
            title: subject,
            text: fullEmailText
        }).then(() => {
            closeReportEmailModal();
        }).catch(() => {});
        return;
    }

    // 3. Desktop Browser Fallback via mailto:
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
        const a = document.createElement('a');
        a.href = mailtoUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { if (a.parentNode) document.body.removeChild(a); }, 300);
        if (typeof showToast === 'function') {
            showToast('E-posta uygulaması açılıyor...');
        }
        setTimeout(() => closeReportEmailModal(), 500);
    } catch (err) {
        console.error('Mailto link error:', err);
        copyReportEmailText();
    }
}

function shareReportViaWebShare() {
    sendReportEmailDirect();
}

function copyReportEmailText() {
    const body = document.getElementById('reportEmailBody')?.value || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(body).then(() => {
            if (typeof showToast === 'function') {
                showToast('Rapor metni panoya kopyalandı! Dilediğiniz uygulamaya yapıştırabilirsiniz.', 3500);
            }
        }).catch(() => {
            fallbackCopyText(body);
        });
    } else {
        fallbackCopyText(body);
    }
}

function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        if (typeof showToast === 'function') {
            showToast('Rapor metni panoya kopyalandı!', 3000);
        }
    } catch (e) {
        if (typeof showToast === 'function') {
            showToast('Lütfen metni seçip kopyalayınız.', 3000);
        }
    }
    if (ta.parentNode) document.body.removeChild(ta);
}

window.openReportEmailModal = openReportEmailModal;
window.openMultiReportEmailModal = openMultiReportEmailModal;
window.closeReportEmailModal = closeReportEmailModal;
window.sendReportEmailDirect = sendReportEmailDirect;
window.shareReportViaWebShare = shareReportViaWebShare;
window.copyReportEmailText = copyReportEmailText;
window.onReportEmailRecipientChange = onReportEmailRecipientChange;
window.toggleAllEmailReports = toggleAllEmailReports;
window.rebuildEmailTextFromSelection = rebuildEmailTextFromSelection;
window.downloadSelectedEmailReportsAsPdf = downloadSelectedEmailReportsAsPdf;



AppState.a4Zoom = 1;



// --- AKROBAT / STANDART PDF PANZOOM MOTORU (TİTREMESİZ / SILKY SMOOTH) ---
let pdfViewerState = {
    zoom: 1,
    panX: 16,
    panY: 16,
    minZoom: 0.35,
    maxZoom: 3.2
};

let _rafId = null;

function clampPdfBounds() {
    const scrollContainer = document.getElementById('a4PreviewScrollContainer');
    const pagesContainer = document.getElementById('a4PreviewPagesContainer');
    if (!scrollContainer || !pagesContainer) return;

    const viewportW = scrollContainer.clientWidth || window.innerWidth;
    const viewportH = scrollContainer.clientHeight || window.innerHeight;
    const baseW = 794;
    const pages = pagesContainer.querySelectorAll('.tkm-a4-page');
    const pageCount = pages.length || 1;
    const baseH = pageCount * 1142;

    const scaledW = baseW * pdfViewerState.zoom;
    const scaledH = baseH * pdfViewerState.zoom;

    // YATAY SINIRLAR (SOL VE SAĞ LİMİTLER)
    if (scaledW <= viewportW) {
        // Ekrana tam sığıyorsa ortala
        pdfViewerState.panX = (viewportW - scaledW) / 2;
    } else {
        // En sola gidildiğinde sol kenar 16px payla durur
        // En sağa gidildiğinde sağ kenar 16px payla durur
        const maxPanX = 16;
        const minPanX = viewportW - scaledW - 16;
        pdfViewerState.panX = Math.min(maxPanX, Math.max(minPanX, pdfViewerState.panX));
    }

    // DÜŞEY SINIRLAR (YUKARI VE AŞAĞI LİMİTLER)
    if (scaledH <= viewportH) {
        pdfViewerState.panY = Math.max(16, (viewportH - scaledH) / 2);
    } else {
        // En yukarı gidildiğinde 1. sayfanın üstü 16px payla durur
        // En aşağı gidildiğinde son sayfanın altı 16px payla durur
        const maxPanY = 16;
        const minPanY = viewportH - scaledH - 16;
        pdfViewerState.panY = Math.min(maxPanY, Math.max(minPanY, pdfViewerState.panY));
    }
}

function renderPdfTransform(animate = false) {
    const pagesContainer = document.getElementById('a4PreviewPagesContainer');
    if (!pagesContainer) return;
    clampPdfBounds();
    if (animate) {
        pagesContainer.style.transition = 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)';
    } else {
        pagesContainer.style.transition = 'none';
    }
    // Sub-pixel floating precision avoids pixel snapping jitter
    pagesContainer.style.transform = `translate3d(${pdfViewerState.panX.toFixed(2)}px, ${pdfViewerState.panY.toFixed(2)}px, 0) scale(${pdfViewerState.zoom.toFixed(4)})`;
}

function scheduleRender(animate = false) {
    if (_rafId) return;
    _rafId = requestAnimationFrame(() => {
        _rafId = null;
        renderPdfTransform(animate);
    });
}

function applyA4PreviewZoom() {
    renderPdfTransform(false);
}

function adjustA4PreviewZoom(delta) {
    const scrollContainer = document.getElementById('a4PreviewScrollContainer');
    const vw = (scrollContainer && scrollContainer.clientWidth) || window.innerWidth;
    const vh = (scrollContainer && scrollContainer.clientHeight) || window.innerHeight;
    const focalX = vw / 2;
    const focalY = vh / 2;

    const oldZ = pdfViewerState.zoom;
    const newZ = Math.max(pdfViewerState.minZoom, Math.min(pdfViewerState.maxZoom, oldZ + delta));
    const factor = newZ / oldZ;

    pdfViewerState.panX = focalX - (focalX - pdfViewerState.panX) * factor;
    pdfViewerState.panY = focalY - (focalY - pdfViewerState.panY) * factor;
    pdfViewerState.zoom = newZ;
    AppState.a4Zoom = newZ;

    renderPdfTransform(true);
}

let _touchState = {
    mode: 'none',
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    lastDist: 0,
    lastFocalX: 0,
    lastFocalY: 0,
    lastTapTime: 0
};

function initA4PinchZoom() {
    const scrollContainer = document.getElementById('a4PreviewScrollContainer');
    if (!scrollContainer || scrollContainer._pinchInitialized) return;
    scrollContainer._pinchInitialized = true;

    scrollContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            _touchState.mode = 'pan';
            _touchState.startX = e.touches[0].clientX;
            _touchState.startY = e.touches[0].clientY;
            _touchState.startPanX = pdfViewerState.panX;
            _touchState.startPanY = pdfViewerState.panY;

            // Çift Dokunma (Double Tap) ile Yakınlaştırma / Sığdırma
            const now = Date.now();
            if (now - _touchState.lastTapTime < 320) {
                const rect = scrollContainer.getBoundingClientRect();
                const tapX = e.touches[0].clientX - rect.left;
                const tapY = e.touches[0].clientY - rect.top;
                const vw = scrollContainer.clientWidth || window.innerWidth;
                const fitZoom = Math.max(0.35, Math.min(1.0, (vw - 32) / 794));

                if (pdfViewerState.zoom > fitZoom * 1.25) {
                    resetA4PreviewZoom();
                } else {
                    const targetZoom = 1.65;
                    const factor = targetZoom / pdfViewerState.zoom;
                    pdfViewerState.panX = tapX - (tapX - pdfViewerState.panX) * factor;
                    pdfViewerState.panY = tapY - (tapY - pdfViewerState.panY) * factor;
                    pdfViewerState.zoom = targetZoom;
                    AppState.a4Zoom = targetZoom;
                    renderPdfTransform(true);
                }
                _touchState.mode = 'none';
            }
            _touchState.lastTapTime = now;

        } else if (e.touches.length === 2) {
            _touchState.mode = 'pinch';
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const rect = scrollContainer.getBoundingClientRect();
            _touchState.lastDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            _touchState.lastFocalX = ((t1.clientX + t2.clientX) / 2) - rect.left;
            _touchState.lastFocalY = ((t1.clientY + t2.clientY) / 2) - rect.top;
        }
    }, { passive: false });

    scrollContainer.addEventListener('touchmove', (e) => {
        if (_touchState.mode === 'pan' && e.touches.length === 1) {
            e.preventDefault();
            const dx = e.touches[0].clientX - _touchState.startX;
            const dy = e.touches[0].clientY - _touchState.startY;
            pdfViewerState.panX = _touchState.startPanX + dx;
            pdfViewerState.panY = _touchState.startPanY + dy;
            scheduleRender(false);

        } else if (_touchState.mode === 'pinch' && e.touches.length === 2) {
            e.preventDefault();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const rect = scrollContainer.getBoundingClientRect();
            const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const currentFocalX = ((t1.clientX + t2.clientX) / 2) - rect.left;
            const currentFocalY = ((t1.clientY + t2.clientY) / 2) - rect.top;

            if (_touchState.lastDist > 10) {
                const scaleDelta = currentDist / _touchState.lastDist;
                const newZoom = Math.max(pdfViewerState.minZoom, Math.min(pdfViewerState.maxZoom, pdfViewerState.zoom * scaleDelta));
                const actualFactor = newZoom / pdfViewerState.zoom;

                // Odak noktasına göre pürüzsüz ölçekleme
                pdfViewerState.panX = currentFocalX - (currentFocalX - pdfViewerState.panX) * actualFactor;
                pdfViewerState.panY = currentFocalY - (currentFocalY - pdfViewerState.panY) * actualFactor;
                
                // İki parmağın merkezindeki kaymayı da birebir takip et (titremeyi yok eden formül)
                pdfViewerState.panX += (currentFocalX - _touchState.lastFocalX);
                pdfViewerState.panY += (currentFocalY - _touchState.lastFocalY);
                
                pdfViewerState.zoom = newZoom;
                AppState.a4Zoom = newZoom;

                _touchState.lastDist = currentDist;
                _touchState.lastFocalX = currentFocalX;
                _touchState.lastFocalY = currentFocalY;

                scheduleRender(false);
            }
        }
    }, { passive: false });

    scrollContainer.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            _touchState.mode = 'none';
            renderPdfTransform(true);
        } else if (e.touches.length === 1) {
            _touchState.mode = 'pan';
            _touchState.startX = e.touches[0].clientX;
            _touchState.startY = e.touches[0].clientY;
            _touchState.startPanX = pdfViewerState.panX;
            _touchState.startPanY = pdfViewerState.panY;
        }
    }, { passive: true });

    scrollContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.ctrlKey) {
            adjustA4PreviewZoom(e.deltaY < 0 ? 0.15 : -0.15);
        } else {
            pdfViewerState.panY -= e.deltaY;
            pdfViewerState.panX -= (e.deltaX || 0);
            scheduleRender(false);
        }
    }, { passive: false });
}

function resetA4PreviewZoom() {
    const scrollContainer = document.getElementById('a4PreviewScrollContainer');
    const vw = (scrollContainer && scrollContainer.clientWidth) || window.innerWidth || 1024;
    const fitZoom = Math.max(0.35, Math.min(1.0, (vw - 32) / 794));
    pdfViewerState.zoom = fitZoom;
    pdfViewerState.panX = 16;
    pdfViewerState.panY = 16;
    AppState.a4Zoom = fitZoom;
    renderPdfTransform(true);
}

function closeA4PreviewModal() {

    const modal = document.getElementById('a4PreviewModal');

    if (modal) modal.classList.add('hidden');

}

function isRamsTheme(theme) {
    if (!theme) return false;
    return theme === 'modern' || theme.startsWith('rams_');
}
window.isRamsTheme = isRamsTheme;

function getPdfTheme() {
    try {
        const saved = localStorage.getItem('tkm_pdf_theme') || 'classic';
        const aliasMap = {
            'modern': 'rams_navy',
            'bureau_veritas': 'rams_navy',
            'isg_emerald': 'rams_emerald',
            'nordic_tech': 'rams_nordic',
            'tuv_modern': 'rams_tuv'
        };
        return aliasMap[saved] || saved;
    } catch (e) {
        return 'classic';
    }
}

function updateThemeSelectorUI(theme) {
    const sel = document.getElementById('pdfThemeSelect');
    if (sel && sel.value !== theme) {
        sel.value = theme;
    }
}
window.updateThemeSelectorUI = updateThemeSelectorUI;
window.updateThemeToggleUI = updateThemeSelectorUI;

function setPdfTheme(themeName) {
    const validThemes = ['classic', 'rams_navy', 'rams_emerald', 'rams_nordic', 'rams_tuv'];
    const aliasMap = {
        'modern': 'rams_navy',
        'bureau_veritas': 'rams_navy',
        'isg_emerald': 'rams_emerald',
        'nordic_tech': 'rams_nordic',
        'tuv_modern': 'rams_tuv'
    };
    const resolvedTheme = aliasMap[themeName] || themeName;
    const theme = validThemes.includes(resolvedTheme) ? resolvedTheme : 'classic';
    try {
        localStorage.setItem('tkm_pdf_theme', theme);
    } catch (e) {}

    updateThemeSelectorUI(theme);

    const previewContainer = document.getElementById('a4PreviewPagesContainer');
    if (previewContainer) {
        previewContainer.setAttribute('data-pdf-theme', theme);
        previewContainer.querySelectorAll('.tkm-a4-page').forEach(el => {
            el.setAttribute('data-pdf-theme', theme);
        });
    }

    const printArea = document.getElementById('printableReportArea');
    if (printArea) {
        printArea.setAttribute('data-pdf-theme', theme);
        printArea.querySelectorAll('.tkm-a4-page').forEach(el => {
            el.setAttribute('data-pdf-theme', theme);
        });
    }

    // Re-render report so pagination and layout (like 2-column visual checks vs 1-column) re-calculate cleanly!
    if (typeof printOfficialReport === 'function') {
        printOfficialReport(false);
    }
}
window.getPdfTheme = getPdfTheme;
window.setPdfTheme = setPdfTheme;
function paginateBlocksIntoA4Pages(blocksHtmlArray, reportMainTitle, formCode, reportNo) {

    // Create an off-screen A4 measurement sandbox so browser layout engine measures exact pixel heights

    let sandbox = document.getElementById('tkmMeasureSandbox');

    if (sandbox) sandbox.remove();

    sandbox = document.createElement('div');

    sandbox.id = 'tkmMeasureSandbox';

    sandbox.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;visibility:hidden;pointer-events:none;z-index:-1;';

    document.body.appendChild(sandbox);



    const activeTheme = getPdfTheme();
    const probePage = document.createElement('div');
    probePage.className = 'tkm-a4-page';
    probePage.setAttribute('data-pdf-theme', activeTheme);

    probePage.innerHTML = `

        ${buildTkmPageHeader(reportMainTitle)}

        <div id="tkmProbeBody" style="flex:0 0 auto;display:block;width:100%;"></div>

        ${buildTkmPageFooter(formCode, reportNo, 1, 1)}

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

    for (let i = 0; i < blocksHtmlArray.length; i++) {
        const blockHtml = blocksHtmlArray[i];
        const isForceBreak = typeof blockHtml === 'string' && blockHtml.includes('tkm-force-page-break');
        if (isForceBreak && bodyEl.children.length > 0) {
            packedPages.push(bodyEl.innerHTML);
            bodyEl.innerHTML = '';
        }

        const blockEl = document.createElement('div');

        blockEl.className = 'tkm-block';

        blockEl.innerHTML = blockHtml;

        bodyEl.appendChild(blockEl);



        if (bodyEl.children.length > 1 && bodyEl.offsetHeight > maxBodyHeight) {

            // Current block doesn't fit completely on this A4 page — move entire block (title + table) to next page!

            bodyEl.removeChild(blockEl);

            packedPages.push(bodyEl.innerHTML);

            bodyEl.innerHTML = '';

            bodyEl.appendChild(blockEl);

        }

    }

    if (bodyEl.children.length > 0) {

        packedPages.push(bodyEl.innerHTML);

    }



    sandbox.remove();



    const totalPages = packedPages.length || 1;

    return packedPages.map((pageContentHtml, idx) => `

        ${buildTkmPageHeader(reportMainTitle)}

        <div class="tkm-page-body">${pageContentHtml}</div>

        ${buildTkmPageFooter(formCode, reportNo, idx + 1, totalPages)}

    `);

}



function renderPdfPhotoBlocks(photosList, secTitle = 'FOTOĞRAFLAR') {
    if (!photosList || photosList.length === 0) return [];
    const validPhotos = photosList.filter(p => {
        if (!p) return false;
        if (typeof p === 'string') return p.length > 10;
        return Boolean(p.dataUrl || p.data || p.url);
    });
    if (validPhotos.length === 0) return [];

    const photoBlocks = [];
    const chunkSize = 2;

    const getSrc = (item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        return item.dataUrl || item.data || item.url || '';
    };

    const getCaption = (item, photoNum) => {
        if (!item) return '';
        let text = (item.description || item.caption || '').trim();
        if (!text) return '';
        const lower = text.toLowerCase();
        if (lower === `fotoğraf ${photoNum}`.toLowerCase() ||
            lower.includes('ana dağıtım') ||
            lower === 'adp' ||
            lower.includes('termal kamera')) {
            return '';
        }
        return text;
    };

    for (let i = 0; i < validPhotos.length; i += chunkSize) {
        const pair = validPhotos.slice(i, i + chunkSize);
        const isFirst = (i === 0);
        let blockHtml = '';
        if (isFirst) {
            blockHtml += `<div class="tkm-sec-title">${secTitle}</div>`;
        }

        blockHtml += `
            <div style="display:flex;gap:8px;margin-bottom:6px;width:100%;box-sizing:border-box;">
                ${pair.map((ph, pIdx) => {
                    const src = getSrc(ph);
                    const photoNum = i + pIdx + 1;
                    const caption = getCaption(ph, photoNum);

                    return `
                        <div style="flex:1;border:1px solid #111;padding:5px 6px;text-align:center;box-sizing:border-box;background:#fff;">
                            <!-- Fotoğraf Üstü: Sadece Fotoğraf 1, 2, 3... -->
                            <div style="font-weight:700;font-size:7.5pt;margin-bottom:4px;color:#111;">Fotoğraf ${photoNum}</div>
                            <!-- Fotoğraf Görseli -->
                            <div style="height:155px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">
                                <img src="${src}" alt="Fotoğraf ${photoNum}" style="max-height:150px;max-width:100%;object-fit:contain;display:block;margin:0 auto;">
                            </div>
                            <!-- Fotoğraf Altı: Açıklama / Not -->
                            ${caption ? `
                                <div style="font-size:7pt;color:#222222;border-top:1px solid #eee;padding-top:3px;margin-top:3px;min-height:14px;line-height:1.2;font-style:italic;">
                                    ${escapeHtml(caption)}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
                ${pair.length === 1 ? `<div style="flex:1;visibility:hidden;"></div>` : ''}
            </div>
        `;
        photoBlocks.push(blockHtml);
    }
    return photoBlocks;
}

function printOfficialReport(directPrint = false, customTarget = null, silentRender = false) {

    const insp = AppState.currentInspection;

    const fd = AppState.currentFormData;

    const printArea = document.getElementById('printableReportArea');

    if (!insp || !printArea) return;

    if (fd && window.MeasuringDevicesManager && typeof window.MeasuringDevicesManager.applyDefaultsToFormData === 'function') {
        window.MeasuringDevicesManager.applyDefaultsToFormData(fd, insp.template_id, false);
    }

    const activePdfTheme = getPdfTheme();



    const is2201 = String(insp.template_id) === '2201' && AppState.electricalTemplate && AppState.electricalTemplate.areas;

    const ci = fd.companyInfo || {

        firmName: insp.customer_name || '',

        address: insp.address || '',

        isgKatipNo: '',

        sgkSicilNo: '',

        reportNo: insp.report_no || '',

        reportDate: insp.inspection_date || '',

        startEndTime: '',

        nextControlDate: fd.nextInspectionDate || '',

        serialCode: insp.serial_no || ''

    };



    const reportNo = insp.report_no || ci.reportNo || '';

    const formCode = insp.template_code || 'TKM-FR.318';

    let pagesArray = [];





    const isGrounding2202 = String(insp.template_id) === '2202';

    const isGenerator2205 = String(insp.template_id) === '2205';



    if (is2201) {
        pagesArray = buildPdfPages2201(insp, fd, ci, reportNo, formCode, activePdfTheme);
    } else if (isGrounding2202) {
        pagesArray = buildPdfPages2202(insp, fd, ci, reportNo, activePdfTheme);
    } else if (isGenerator2205) {
        pagesArray = buildPdfPages2205(insp, fd, ci, reportNo, activePdfTheme);
    } else {
        pagesArray = buildPdfPagesSpecialized(insp, fd, ci, reportNo, formCode, activePdfTheme);
    }


    updateThemeSelectorUI(activePdfTheme);

    const themeSelect = document.getElementById('pdfThemeSelect');
    if (themeSelect) themeSelect.value = activePdfTheme;

    // Populate Printable Container (for @media print)
    printArea.setAttribute('data-pdf-theme', activePdfTheme);
    printArea.innerHTML = pagesArray.map(p => `<div class="tkm-a4-page" data-pdf-theme="${activePdfTheme}">${p}</div>`).join('');

    if (customTarget && typeof Element !== 'undefined' && customTarget instanceof Element) {
        customTarget.setAttribute('data-pdf-theme', activePdfTheme);
        customTarget.innerHTML = printArea.innerHTML;
    }

    if (silentRender) {
        return;
    }

    // Populate On-Screen A4 Preview Modal
    const previewContainer = document.getElementById('a4PreviewPagesContainer');
    const previewModal = document.getElementById('a4PreviewModal');
    const previewTitle = document.getElementById('a4PreviewTitle');
    const previewSubtitle = document.getElementById('a4PreviewSubtitle');
    if (previewTitle) {
        previewTitle.textContent = `${reportNo || 'Rapor'} · ${insp.customer_name || 'Müşteri'}`;
    }
    if (previewSubtitle) {
        previewSubtitle.textContent = `${insp.equipment_name || 'Periyodik Kontrol'} (${pagesArray.length} Sayfa A4)`;
    }
    if (previewContainer) {
        previewContainer.setAttribute('data-pdf-theme', activePdfTheme);
        previewContainer.innerHTML = pagesArray.map(p => `<div class="tkm-a4-page tkm-preview-sheet" data-pdf-theme="${activePdfTheme}">${p}</div>`).join('');
    }

    if (previewModal && !directPrint) {

        previewModal.classList.remove('hidden');

        resetA4PreviewZoom();
    initA4PinchZoom();

    } else {

        triggerBrowserPrint();

    }

}
