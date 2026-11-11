// ============================================================================
// HIZLI RAPOR - 10-PDF-ENGINE.JS
// Açıklama: TÜRKAK & Bakanlık Resmi A4 PDF Çıktı ve Rapor Yazdırma Motoru
// Satır Aralığı: 13007 - 15980 (2974 satır)
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

    return `
        <div class="tkm-header">
            <div style="display:flex;justify-content:center;align-items:center;">
                <img src="${logoSrc}" alt="TEKKOMER Logo" style="width:82px;height:82px;object-fit:contain;display:block;">
            </div>
            <div style="text-align:center;padding:0 6px;">
                <div style="font-size:11.8pt;font-weight:700;color:#222222;letter-spacing:0.2px;margin-bottom:2px;line-height:1.2;">
                    ${escapeHtml(branding.companyFullName || 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.')}
                </div>
                <div style="font-size:7.8pt;color:#222222;line-height:1.25;">
                    T: +90 (216) 526 61 41 &nbsp;&nbsp; F: +90 (216) 526 61 40
                </div>
                <div style="font-size:7.8pt;color:#222222;line-height:1.25;margin-bottom:3px;">
                    info@tkmkontrol.com &nbsp;&nbsp; www.tkmkontrol.com
                </div>
                <div style="font-size:11pt;font-weight:700;color:#222222;line-height:1.15;text-transform:uppercase;">
                    ${reportMainTitle}
                </div>
                <div style="font-size:9.5pt;font-weight:400;color:#333333;margin-top:2px;letter-spacing:0.3px;">
                    PERİYODİK KONTROL RAPORU
                </div>
            </div>
            <div style="display:flex;justify-content:center;align-items:center;">
                ${showTurkak ? `<img src="${turkakLogoSrc}" alt="Akreditasyon ${escapeHtml(accNo)}" style="width:72px;height:105px;object-fit:contain;display:block;">` : `<div style="width:72px;"></div>`}
            </div>
        </div>
    `;
}



function buildTkmPageFooter(formCode, reportNo, pageNum, totalPages) {

    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;

    const disclaimer = ((branding.footerDisclaimer || DEFAULT_COMPANY_BRANDING.footerDisclaimer)).replace(/\{COMPANY_NAME\}/g, branding.companyFullName || 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.');

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

    const qrSrc = (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.qrDefault) || 'assets/qr_default.jpg';

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

                        <img src="${qrSrc}" alt="QR Code" style="width:76px;height:76px;object-fit:contain;display:inline-block;">

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
    const wo = AppState.currentWorkOrder || {};

    const checkedIds = Array.from(document.querySelectorAll('input[name="emailReportItemCb"]:checked')).map(cb => String(cb.value));
    let selectedReports = _emailModalReportsPool.filter(r => checkedIds.includes(String(r.id)));

    if (selectedReports.length === 0 && _emailModalReportsPool.length > 0) {
        selectedReports = [_emailModalReportsPool[0]];
    }

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

    if (selectedReports.length <= 1) {
        const r = selectedReports[0] || insp;
        const reportNo = r.report_no || ci.reportNo || 'TKM-RAPOR';
        const equipment = r.equipment_name || ci.equipmentName || 'Periyodik Kontrol';
        const safeCust = customer.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 25);
        const pdfFileName = `${reportNo}_${safeCust}.pdf`;

        subjectInput.value = `Periyodik Kontrol Raporu - ${customer} (${equipment})`;
        bodyInput.value =
`Sayın Yetkili,

${customer} firmasında gerçekleştirilen periyodik kontrol çalışmasına ait ${equipment} (${reportNo}) raporu hazırlanmış olup ekte (${pdfFileName}) bilgilerinize sunulmuştur.

İyi çalışmalar dileriz.
ENLAB / TEKKOMER Periyodik Kontrol Muayene Kuruluşu`;
    } else {
        const listLines = selectedReports.map((r, i) => {
            const eq = r.equipment_name || 'Periyodik Kontrol Raporu';
            const rNo = r.report_no ? ` (${r.report_no})` : '';
            return `${i + 1}. ${eq}${rNo}`;
        }).join('\n');
        const safeCust = customer.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 25);
        const pdfFileName = `Periyodik_Kontrol_Raporlari_${selectedReports.length}_Adet_${safeCust}.pdf`;

        subjectInput.value = `Periyodik Kontrol Raporları (${selectedReports.length} Adet) - ${customer}`;
        bodyInput.value =
`Sayın Yetkili,

${customer} firmasında gerçekleştirilen periyodik kontrol çalışmalarına ait aşağıdaki raporlar hazırlanmış olup ekte (${pdfFileName}) bilgilerinize sunulmuştur:

${listLines}

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
            printOfficialReport(false);
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
            if (data.workOrder) wo = normalizeWorkOrder(data.workOrder);
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

function printOfficialReport(directPrint = false) {

    const insp = AppState.currentInspection;

    const fd = AppState.currentFormData;

    const printArea = document.getElementById('printableReportArea');

    if (!insp || !printArea) return;

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





        const reportMainTitle = 'ELEKTRİK İÇ TESİSATI GÖZLE KONTROL VE FONKSİYON<br>TESTLERİ';

        const areas = AppState.electricalTemplate.areas.filter(a => a.topics && a.topics.length > 0);

        const area0 = areas[0]; // 2. EKİPMAN BİLGİLERİ

        const area1 = areas[1]; // 3. TERMAL KAMERA BİLGİLERİ

        const area2 = areas[2]; // 5. GÖZLE KONTROL KRİTERLERİ

        const area3 = areas[3]; // 6. FONKSİYON KONTROL KRİTERLERİ



        const renderOrderedGridTable = (questions, colsPerRow = 3) => {

            let colgroup = '';

            if (colsPerRow === 3) {

                colgroup = `

                    <colgroup>

                        <col style="width:19%;"><col style="width:14.3%;">

                        <col style="width:19%;"><col style="width:14.3%;">

                        <col style="width:19%;"><col style="width:14.4%;">

                    </colgroup>

                `;

            } else if (colsPerRow === 4) {

                colgroup = `

                    <colgroup>

                        <col style="width:14.5%;"><col style="width:10.5%;">

                        <col style="width:14.5%;"><col style="width:10.5%;">

                        <col style="width:14.5%;"><col style="width:10.5%;">

                        <col style="width:14.5%;"><col style="width:10.5%;">

                    </colgroup>

                `;

            } else {

                colgroup = `<colgroup><col style="width:50%;"><col style="width:50%;"></colgroup>`;

            }



            let html = `<table class="tkm-table">${colgroup}<tbody>`;

            for (let i = 0; i < questions.length; i += colsPerRow) {

                html += '<tr>';

                for (let c = 0; c < colsPerRow; c++) {

                    const q = questions[i + c];

                    if (q) {

                        const ans = fd.answers[`q_${q.guid}`] ?? SAMPLE_PDF_DEFAULTS[q.question] ?? '';

                        html += `

                            <td style="text-align:center;vertical-align:middle;font-weight:400;color:#111;">${q.question}</td>

                            <td style="text-align:left;vertical-align:middle;font-weight:400;padding-left:5px;color:#111;">${ans}</td>

                        `;

                    } else {

                        html += `<td></td><td></td>`;

                    }

                }

                html += '</tr>';

            }

            html += '</tbody></table>';

            return html;

        };



        // 3. Termal Kamera Table

        const tCamRows = fd.tableRows['topic_1_0'] || [];

        const tCamTopic = area1.topics[0];

        const tCamBody = tCamRows.length

            ? tCamRows.map(r => `

                <tr>${tCamTopic.questions.map((q, idx) => `<td style="text-align:${idx === 0 && (r[q.guid] || '').includes('Uygulaması Yok') ? 'left' : 'center'};">${r[q.guid] || ''}</td>`).join('')}</tr>

            `).join('')

            : `<tr><td style="text-align:left;">Uygulaması Yok</td><td></td><td></td><td></td><td></td></tr>`;



        // 4. Ölçüm Aletleri Table

        const devList = (fd.measuringDevices && fd.measuringDevices.length) ? fd.measuringDevices : [

            { name: '', serial: '', calDate: '', validDate: '', certNo: '' }

        ];

        const devRowsHtml = devList.map(d => `

            <tr>

                <td style="text-align:center;">${d.name || ''}</td>

                <td style="text-align:center;">${d.serial || ''}</td>

                <td style="text-align:center;">${d.calDate || ''}</td>

                <td style="text-align:center;">${d.validDate || ''}</td>

                <td style="text-align:center;">${d.certNo || ''}</td>

            </tr>

        `).join('');



        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        const renderCompleteVisualTopicBlock = (subNumberTitle, questions) => {
            const currentTheme = activePdfTheme;
            if (isRamsTheme(currentTheme)) {
                // Dual column (2-sütun) layout matching Ministry format!
                const mid = Math.ceil(questions.length / 2);
                let rowsHtml = '';
                for (let i = 0; i < mid; i++) {
                    const qL = questions[i];
                    const letterL = letters[i] || (i + 1);
                    const symL = formatSymbolForPrint(fd.answers[`q_${qL.guid}`] || '');
                    const badgeL = formatSymbolBadge(symL);

                    const rightIdx = i + mid;
                    const qR = rightIdx < questions.length ? questions[rightIdx] : null;
                    const letterR = qR ? (letters[rightIdx] || (rightIdx + 1)) : '';
                    const symR = qR ? formatSymbolForPrint(fd.answers[`q_${qR.guid}`] || '') : '';
                    const badgeR = qR ? formatSymbolBadge(symR) : '';

                    rowsHtml += `
                        <tr>
                            <td style="text-align:center;font-weight:700;width:24px;">${letterL}</td>
                            <td style="text-align:left;padding-left:4px;font-size:6.9pt;">${qL.question}</td>
                            <td style="text-align:center;width:34px;">${badgeL}</td>
                            ${qR ? `
                                <td style="text-align:center;font-weight:700;width:24px;border-left:1.5px solid #cbd5e1;">${letterR}</td>
                                <td style="text-align:left;padding-left:4px;font-size:6.9pt;">${qR.question}</td>
                                <td style="text-align:center;width:34px;">${badgeR}</td>
                            ` : `
                                <td style="border-left:1.5px solid #cbd5e1;"></td>
                                <td></td>
                                <td></td>
                            `}
                        </tr>
                    `;
                }

                return `
                    <div class="tkm-sub-bar">${subNumberTitle}</div>
                    <table class="tkm-table tkm-table-twocol">
                        <colgroup>
                            <col style="width:24px;">
                            <col style="width:42%;">
                            <col style="width:34px;">
                            <col style="width:24px;">
                            <col style="width:42%;">
                            <col style="width:34px;">
                        </colgroup>
                        <thead>
                            <tr>
                                <th></th>
                                <th style="text-align:left;padding-left:4px;font-weight:700;">Soru / Kriter</th>
                                <th style="text-align:center;font-weight:700;">1</th>
                                <th style="border-left:1.5px solid #cbd5e1;"></th>
                                <th style="text-align:left;padding-left:4px;font-weight:700;">Soru / Kriter</th>
                                <th style="text-align:center;font-weight:700;">1</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                    <div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>
                `;
            }

            // CLASSIC THEME (100% UNCHANGED)
            const rowsHtml = questions.map((q, idx) => {
                const letter = letters[idx] || (idx + 1);
                const sym = formatSymbolForPrint(fd.answers[`q_${q.guid}`] || '');
                return `
                    <tr>
                        <td style="text-align:center;font-weight:700;">${letter}</td>
                        <td style="text-align:left;padding-left:6px;">${q.question}</td>
                        <td style="text-align:center;">${sym}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="tkm-sub-bar">${subNumberTitle}</div>
                <table class="tkm-table">
                    <colgroup>
                        <col style="width:28px;">
                        <col>
                        <col style="width:42px;">
                    </colgroup>
                    <thead>
                        <tr>
                            <th></th>
                            <th style="text-align:left;padding-left:6px;font-weight:700;">Soru / Kriter</th>
                            <th style="text-align:center;font-weight:700;">1</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>
            `;
        };



        // Build atomic, indivisible blocks so NO heading or table is EVER cut in half or orphaned!

        const blocks = [];



        // Block 1: 1. FİRMA BİLGİLERİ
        blocks.push(`
            <div style="display:flex;justify-content:flex-end;margin-bottom:3px;">
                <table style="border:1px solid #000000;font-size:6.7pt;border-collapse:collapse;background:#ffffff;">
                    <tr>
                        <td style="padding:1.5px 6px;font-weight:700;border:1px solid #000000;background:#f4f4f4;">Doküman Kodu</td>
                        <td style="padding:1.5px 6px;border:1px solid #000000;font-weight:600;">ZPKR02</td>
                        <td style="padding:1.5px 6px;font-weight:700;border:1px solid #000000;background:#f4f4f4;">Yürürlük Tarihi</td>
                        <td style="padding:1.5px 6px;border:1px solid #000000;">01.09.2025</td>
                    </tr>
                </table>
            </div>
            <div class="tkm-sec-title">1. FİRMA BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:19%;">

                    <col style="width:36%;">

                    <col style="width:17%;">

                    <col style="width:28%;">

                </colgroup>

                <tbody>

                    <tr>

                        <td style="font-weight:700;">Firma Adı</td>

                        <td colspan="3">${ci.firmName}</td>

                    </tr>

                    <tr>

                        <td style="font-weight:700;">Periyodik Kontrol Adresi</td>

                        <td colspan="3">${ci.address}</td>

                    </tr>

                    <tr>

                        <td style="font-weight:700;">İSG-KATİP Sözleşme ID</td>

                        <td>${ci.isgKatipNo}</td>

                        <td style="font-weight:700;">SGK Sicil Numarası</td>

                        <td>${ci.sgkSicilNo}</td>

                    </tr>

                    <tr>

                        <td style="font-weight:700;">Rapor Numarası</td>

                        <td>${reportNo}</td>

                        <td style="font-weight:700;">Rapor Tarihi</td>

                        <td>${insp.inspection_date || ci.reportDate}</td>

                    </tr>

                    <tr>

                        <td style="font-weight:700;">Periyodik Kontrol Başlangıç ve<br>Bitiş Tarih ve Saati</td>

                        <td>${ci.startEndTime}</td>

                        <td style="font-weight:700;">Bir Sonraki Periyodik<br>Kontrol Tarihi</td>

                        <td>${fd.nextInspectionDate || ci.nextControlDate}</td>

                    </tr>

                    <tr>

                        <td style="font-weight:700;">Rapor / Ekipman Adı</td>

                        <td>${insp.equipment_name || ci.equipmentName || 'Elektrik İç Tesisatı'}</td>

                        <td style="font-weight:700;">Ekipman Seri No / Kod</td>

                        <td>${ci.serialCode || insp.serial_no || ''}</td>

                    </tr>

                    <tr>

                        <td style="font-weight:700;">Periyodik Kontrol Metodu ve<br>Kapsamı</td>

                        <td colspan="3" style="line-height:1.22;">

                            • TS HD 60364-4-43 Alçak Gerilim Elektrik Tesisatları- Bölüm 4: Güvenlik İçin Koruma Grup 43 - Aşırı Akıma Karşı Koruma<br>
                            • TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama<br>
                            • İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği<br>
                            • Elektrik İç Tesisleri Yönetmeliği<br>
                            • Elektrik Tesislerinde Topraklamalar Yönetmeliği

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 2: 2. EKİPMAN BİLGİLERİ + 2.1. DETAY BİLGİLERİ

        blocks.push(`

            <div class="tkm-sec-title">2. EKİPMAN BİLGİLERİ</div>

            <div class="tkm-sub-bar">2.1. DETAY BİLGİLER</div>

            ${renderOrderedGridTable(area0.topics[0].questions, 3)}

        `);



        // Block 3: 2.2. TESPİT EDİLEN BİLGİLER

        blocks.push(`

            <div class="tkm-sub-bar">2.2. TESPİT EDİLEN BİLGİLER</div>

            ${renderOrderedGridTable(area0.topics[1].questions, 3)}

        `);



        // Block 4: 3. TERMAL KAMERA BİLGİLERİ

        blocks.push(`

            <div class="tkm-sec-title">3. TERMAL KAMERA BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:20%;"><col style="width:18%;"><col style="width:20%;"><col style="width:22%;"><col style="width:20%;">

                </colgroup>

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Cihaz Adı</th>

                        <th style="text-align:center;font-weight:700;">Seri Numarası</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Numarası</th>

                    </tr>

                </thead>

                <tbody>${tCamBody}</tbody>

            </table>

        `);



        // Block 5: 4. ÖLÇÜM ALETLERİ BİLGİLERİ

        blocks.push(`

            <div class="tkm-sec-title">4. ÖLÇÜM ALETLERİ BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:24%;"><col style="width:17%;"><col style="width:19%;"><col style="width:21%;"><col style="width:19%;">

                </colgroup>

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Cihaz Adı</th>

                        <th style="text-align:center;font-weight:700;">Seri Numarası</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Numarası</th>

                    </tr>

                </thead>

                <tbody>${devRowsHtml}</tbody>

            </table>

        `);



        // Block 6: 5. TEST VE KONTROLLER Title + 5.1. PANO ADI/EKİPMAN TANIMLAMASI

        blocks.push(`
            <div class="tkm-force-page-break" style="display:none;"></div>
            <div class="tkm-sec-title" style="text-align:left;font-size:8.4pt;color:#111111;font-weight:700;letter-spacing:0.2px;padding:2px 0;margin:2px 0;">TEST VE KONTROLLER</div>
            <div class="tkm-sec-title">5. KONTROL KRİTERLERİ VE TESTLER</div>

            <div class="tkm-sub-bar">5.1. ${area2.topics[0].name}</div>

            ${renderOrderedGridTable(area2.topics[0].questions, 1)}

        `);



        // Blocks for 5.2 through 5.8 (Each has its COMPLETE gray title bar + Soru/Kriter header + all rows + legend!)

        const visualTopics = area2.topics.slice(1);
        visualTopics.forEach((t, idx) => {
            let blockHtml = renderCompleteVisualTopicBlock(`5.${idx + 2}. ${t.name}`, t.questions);
            if (idx === visualTopics.length - 1) {
                blockHtml += `
                    <div style="font-size:6.8pt;color:#333333;font-style:italic;margin-top:2px;padding:2px 4px;">
                        Pano/Ekipman sayısı fazla olan tesislerde birden fazla form kullanılmalıdır.
                    </div>
                `;
            }
            blocks.push(blockHtml);
        });



        // Block for 6. FONKSİYON KONTROL KRİTERLERİ VE TESTLER
        // Rams formatında 6. Başlık 3. sayfadan başlar!
        const sec6Break = isRamsTheme(activePdfTheme) ? '<div class="tkm-force-page-break" style="display:none;"></div>' : '';

        blocks.push(`
            ${sec6Break}
            <div class="tkm-sec-title">6. FONKSİYON KONTROL KRİTERLERİ VE TESTLER</div>
            <div class="tkm-sub-bar">Ölçüm ve Doğrulama Metodu</div>
            ${renderOrderedGridTable(area3.topics[0].questions, 1)}
            <div class="tkm-sub-bar">6.1. ${area3.topics[2].name}</div>
            <div style="margin-bottom:2px;">
                ${renderOrderedGridTable(area3.topics[1].questions, 1)}
            </div>
            ${renderOrderedGridTable(area3.topics[2].questions, 4)}
        `);

        // Helper to push multi-row tables (6.1 Linye, 6.2 Potansiyel Dengeleme, 6.3 Zemin İzolasyonu)
        const pushMultiRowTopicBlocks = (topic, tKey, subTitle, isLastSec6Topic = false) => {
            const allRows = (fd.tableRows[tKey] && fd.tableRows[tKey].length)
                ? fd.tableRows[tKey]
                : [createDefaultTopicRow(area3, topic, 1)];
            const chunkSize = 8;
            const ths = topic.questions.map(q => {
                const hdr = getShortTopicQuestionLabel(3, topic.index, q.question);
                return `<th style="text-align:center;font-weight:700;font-size:6.8pt;line-height:1.12;padding:2px;">${hdr}</th>`;
            }).join('');

            for (let start = 0; start < allRows.length; start += chunkSize) {
                const slice = allRows.slice(start, start + chunkSize);
                const trs = slice.map((r, idx) => `
                    <tr>
                        <td style="text-align:center;">${start + idx + 1}</td>
                        ${topic.questions.map(q => `<td style="text-align:center;font-size:7.1pt;">${q.type === 'YesNo' ? formatSymbolForPrint(r[q.guid] || '') : (r[q.guid] ?? '')}</td>`).join('')}
                    </tr>
                `).join('');
                const chunkTitle = start === 0 ? subTitle : `${subTitle} (Devamı)`;
                const isFinalChunk = (start + chunkSize >= allRows.length);
                const footNoteHtml = (isLastSec6Topic && isFinalChunk) ? `
                    <div style="font-size:6.8pt;color:#333333;font-style:italic;margin-top:2px;padding:2px 4px;">
                        Nokta sayısı fazla olan tesislerde birden fazla form kullanılabilir. Ya da formun sadece 6. Bölümü çoğaltılabilir.
                    </div>
                ` : '';

                blocks.push(`
                    <div class="tkm-sub-bar">${chunkTitle}</div>
                    <table class="tkm-table">
                        <thead>
                            <tr>
                                <th style="width:24px;text-align:center;font-weight:700;font-size:7pt;">No</th>
                                ${ths}
                            </tr>
                        </thead>
                        <tbody>${trs}</tbody>
                    </table>
                    <div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>
                    ${footNoteHtml}
                `);
            }
        };

        // 6.1 Linye Ölçüm ve Test Tablosu
        pushMultiRowTopicBlocks(area3.topics[3], 'topic_3_3', '6.1. Linye Ölçüm ve Test Tablosu');

        // 6.2 Potansiyel Dengeleme İletkenleri Kontrolü (Bakanlık 6.2)
        pushMultiRowTopicBlocks(area3.topics[4], 'topic_3_4', '6.2. ' + area3.topics[4].name);

        // 6.3 Zemin İzolasyonunun Kontrolü (Bakanlık 6.3)
        pushMultiRowTopicBlocks(area3.topics[5], 'topic_3_5', '6.3. ' + area3.topics[5].name, true);

        // Block for 7. KUSUR AÇIKLAMALARI
        blocks.push(`
            <div class="tkm-sec-title">7. KUSUR AÇIKLAMALARI</div>
            <table class="tkm-table">
                <tbody>
                    <tr>
                        <td style="min-height:22px;height:24px;vertical-align:top;text-align:left;padding:3.5px 6px;">
                            ${(fd.defectNotes || 'Kusur tespiti bulunmamaktadır.').replace(/\n/g, '<br>')}
                        </td>
                    </tr>
                </tbody>
            </table>
            <div style="font-size:6.8pt;color:#222222;font-weight:600;padding:2.5px 6px;margin-top:2px;background:#ffffff;border:1px solid #000000;border-radius:2px;line-height:1.25;">
                Kusur derecesi “*” hafif kusurlu ve “**” ağır kusurlu anlamında kullanılmaktadır. Değerlendirme “Uygun”, “Uygun Değil” ve “Uygulanamaz” olarak yapılmıştır.
            </div>
        `);

        // Block 8: 8. EKİPMAN FOTOĞRAFLARI (Bakanlık Formatı: SABİT 8. BÖLÜM - Asla silinmez / kaydırılmaz)
        const validPhotos = (fd.photos || []).filter(p => {
            if (!p) return false;
            if (typeof p === 'string') return p.length > 10;
            return Boolean(p.dataUrl || p.data || p.url);
        });

        if (validPhotos.length > 0) {
            let photoRowsHtml = '';

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

            const renderPhotoCell = (src, photoNum, caption, widthPct) => `
                <td style="${widthPct ? `width:${widthPct};` : ''}text-align:center;padding:5px 6px;vertical-align:top;background:#ffffff;">
                    <!-- Fotoğraf Üstü: Sadece Fotoğraf 1, 2, 3... -->
                    <div style="font-weight:700;font-size:7.5pt;margin-bottom:4px;color:#111;">Fotoğraf ${photoNum}</div>
                    <!-- Fotoğraf Görseli -->
                    <div style="display:flex;align-items:center;justify-content:center;height:145px;overflow:hidden;background:#ffffff;border:1px solid #e2e8f0;">
                        <img src="${src}" alt="Fotoğraf ${photoNum}" style="max-height:145px;max-width:100%;object-fit:contain;display:block;margin:0 auto;">
                    </div>
                    <!-- Fotoğraf Altı: Kullanıcı Açıklaması / Tespit (Varsa) -->
                    ${caption ? `
                        <div style="font-size:7pt;color:#222222;margin-top:3px;padding:2px 4px;text-align:center;font-style:italic;line-height:1.25;background:#ffffff;border-top:1px solid #e2e8f0;">
                            ${escapeHtml(caption)}
                        </div>
                    ` : ''}
                </td>
            `;

            for (let i = 0; i < validPhotos.length; i += 2) {
                const p1 = validPhotos[i];
                const p2 = validPhotos[i + 1] || null;

                const photoNum1 = i + 1;
                const src1 = getSrc(p1);
                const caption1 = getCaption(p1, photoNum1);

                if (p2) {
                    const photoNum2 = i + 2;
                    const src2 = getSrc(p2);
                    const caption2 = getCaption(p2, photoNum2);

                    photoRowsHtml += `
                        <tr>
                            ${renderPhotoCell(src1, photoNum1, caption1, '50%')}
                            ${renderPhotoCell(src2, photoNum2, caption2, '50%')}
                        </tr>
                    `;
                } else {
                    photoRowsHtml += `
                        <tr>
                            ${renderPhotoCell(src1, photoNum1, caption1, null)}
                        </tr>
                    `;
                }
            }

            blocks.push(`
                <div class="tkm-sec-title">8. EKİPMAN FOTOĞRAFLARI</div>
                <table class="tkm-table" style="table-layout:fixed;background:#ffffff;">
                    <tbody>
                        ${photoRowsHtml}
                    </tbody>
                </table>
            `);
        } else {
            blocks.push(`
                <div class="tkm-sec-title">8. EKİPMAN FOTOĞRAFLARI</div>
                <table class="tkm-table" style="table-layout:fixed;background:#ffffff;">
                    <tbody>
                        <tr>
                            <td style="min-height:24px;height:24px;vertical-align:middle;text-align:center;color:#333333;font-style:italic;font-size:7.2pt;">
                                
                            </td>
                        </tr>
                    </tbody>
                </table>
            `);
        }

        // Block 9: 9. NOTLAR (Bakanlık Formatı: SABİT 9. BÖLÜM)
        blocks.push(`
            <div class="tkm-sec-title">9. NOTLAR</div>
            <table class="tkm-table">
                <tbody>
                    <tr>
                        <td style="min-height:22px;height:22px;vertical-align:top;text-align:left;padding:3.5px 6px;font-size:7.2pt;line-height:1.2;">
                            ${escapeHtml(fd.generalNotes || "Proje Bilgileri: Tesisin elektrik tesisat projeleri ve tek hat şeması yerinde incelenmiş olup kontroller bu doğrultuda gerçekleştirilmiştir.").replace(/\n/g, '<br>')}
                        </td>
                    </tr>
                </tbody>
            </table>
        `);

        // Block 10: 10. SONUÇ VE KANAAT (Bakanlık Formatı: SABİT 10. BÖLÜM)
        const isSuitable = fd.overallResult !== 'UYGUN DEĞİL';
        const conclusionText = isSuitable 
            ? 'KULLANILMASI UYGUNDUR.' 
            : 'KULLANILMASI UYGUN DEĞİLDİR. C1 – Tehlike mevcut. Yaralanma riski. Derhal düzeltici eylem gerekli.';

        blocks.push(`
            <div class="tkm-sec-title">10. SONUÇ VE KANAAT</div>
            <table class="tkm-table">
                <tbody>
                    <tr>
                        <td style="font-size:6.6pt;line-height:1.15;padding:3.5px 6px;text-align:left;">
                            <div style="font-weight:700;">Ağır kusur tanımları:</div>
                            <div style="font-weight:700;margin-top:1px;">Gözle Kontrol Bölümü</div>
                            <div>1. Faza erişim engeli IP2X koruma sınıfını sağlamıyorsa,</div>
                            <div>2. Kablo ek noktaları yalıtımlı değilse, pano içinde ucu açıkta iletken varsa,</div>
                            <div>3. Pano elemanları bağlantı noktalarında kontak gevşekliği (seri ark) tespit edilmişse,</div>
                            <div>4. PVC izoleli kablolarda ve pano elemanlarının dokunulabilen metal olmayan yüzeylerinde aşırı ısınma tespit edilmişse.</div>

                            <div style="font-weight:700;margin-top:2px;">Fonksiyon Testleri Bölümü</div>
                            <div>1. Hesaplanan 3 fazlı kısa devre akımı, pano içinde bulunan herhangi bir aşırı akım koruma cihazı etiketinde yazan kısa devre kesme kapasitesinden (Icu) fazla ise,</div>
                            <div>2. Aşırı akım koruma elemanı değerleri linye kesiti ile uyumsuz ise,</div>
                            <div>3. El ulaşma mesafesindeki metal bölümler, ekipmanın toprak barası veya toprak ucuyla eş potansiyel değilse,</div>
                            <div>4. RCD performans testi sonuçları yetersiz ise,</div>
                            <div>5. Kablo şalter koordinasyonunun aşağıdaki uygunsuzluğu;<br>Devre Tasarım Akımı (Ib), Devre Kesici Akımı (In) ve Kablo Akım Taşıma Kapasitesi (Iz) için Ib&lt;In&lt;Iz sağlanmadıysa,</div>
                            <div>6. Zemin yalıtımının aşağıdaki uygunsuzlukları;<br>b) El ulaşma mesafesinde bulunan zemin izolasyonu uygun boyutta değilse, (EİTY Md. 33d)<br>c) Zemin izolasyon direnci 50 kΩ’dan büyük değilse, (EİTY Md. 48)</div>
                            <div>7. N/PEN iletkeni kesitinin ve kullanım yerinin aşağıdaki uygunsuzlukları;<br>a) N/PEN kesiti ile faz iletkeni kesiti eşit değilse. (EİTY Md 57b3-ii-1)<br>İstisna: N/PEN kesitinin faz iletkeninin kesitinden küçük olması durumunda (örneğin 3x70+35 mm2 gibi) faz iletkenlerini koruyan devre kesici anma akımının, N/PEN iletkeni kesitine göre (örnekteki 35mm2’ye göre) belirlenmesi kuralı ihlal edildiyse (EİTY Md 57b3-ii-2)<br>b) PEN iletkeni kesiti &gt;10 mm2 değilse (EİTY Md 36)<br>c) PEN iletkeni yangın tehlikesi olan yerlerden geçirilmemesi kuralı ihlal edildiyse (EİTY Md 64)<br>d) PEN iletkeni Exproof tehlikeli bölge sınırları içinden geçirilmemesi kuralı ihlal edildiyse (IEC 60079-14)</div>
                            <div>8. PE koruma iletkeni kesitinin aşağıdaki uygunsuzluğu;<br>Koruma iletkeni kesiti ETTY Md. 9e1i’de verilen formülle yapılan hesap sonucuna ve ETTY Çizelge 8’de verilen tabloya uygun değilse,</div>
                            <div>9. PD potansiyel dengeleme iletkeni kesitinin aşağıdaki uygunsuzluğu;<br>6 mm2 &lt; PD &lt; 25 mm2 değilse,</div>
                            <div>10. Tamamlayıcı potansiyel dengeleme: PD &gt; 4mm² değilse.</div>
                            <div style="font-weight:700;margin-top:1px;">Ağır kusur olarak değerlendirilir.</div>

                            <div style="margin-top:2px;">
                                Bu rapor “Alçak Gerilim Topraklama Tesisatı Kontrol Raporu” ile birlikte geçerlidir.<br>
                                TS HD 60364 standardına göre kullanımı uygun olmayan tesisatlar aşağıdaki şekilde işaretlenir:<br>
                                C1 – Tehlike mevcut. Yaralanma riski. Derhal düzeltici eylem gerekli.<br>
                                C2 – Potansiyel olarak tehlikeli – acil düzeltici eylem gerekli.<br>
                                C3 – İyileştirme önerilir.
                            </div>

                            <div class="tkm-conclusion-box ${isSuitable ? 'tkm-result-box-ok' : 'tkm-result-box-bad'}" style="margin-top:2.5px;font-size:7.4pt;font-weight:700;color:${isSuitable ? '#047857' : '#c00000'};line-height:1.25;">
                                Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen Elektrik Tesisatının fonksiyon testleri muayenesi sonrasında mevcut şartlar altında<br>
                                <span style="font-size:8.5pt;">
                                    ${conclusionText}
                                </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        `);

        // Block 11: 11. PERİYODİK KONTROLLERİ YAPMAYA YETKİLİ KİŞİ BİLGİLERİ ve ONAY (Bakanlık Resmi Başlığı)
        blocks.push(buildTkmOnaySection(insp, '11', '11. PERİYODİK KONTROLLERİ YAPMAYA YETKİLİ KİŞİ BİLGİLERİ ve ONAY'));

        // Dynamically pack blocks into A4 pages using real DOM measurement!

        pagesArray = paginateBlocksIntoA4Pages(blocks, reportMainTitle, formCode, reportNo);

    } else if (isGrounding2202) {

        // ====================================================================

        // ALÇAK GERİLİM TOPRAKLAMA TESİSATI (TKM-FR.317, REV.00 / YT: 01.09.2025)

        // ====================================================================

        const reportMainTitle = 'ALÇAK GERİLİM TOPRAKLAMA TESİSATI<br>PERİYODİK KONTROL RAPORU';

        const docFormCode = 'TKM-FR.317, REV.00 / YT: 01.09.2025';

        const gd = fd.grounding || { details: {}, detected: {}, method: 'Çevrim empedansı', points: [], selectivity: [] };

        const d = gd.details || {};

        const det = gd.detected || {};

        const points = gd.points || [];

        const selectivity = gd.selectivity || [];



        const blocks = [];



        // Block 1: 1. FİRMA BİLGİLERİ

        blocks.push(`

            <div class="tkm-sec-title">1. FİRMA BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:20%;"><col style="width:30%;"><col style="width:20%;"><col style="width:30%;">

                </colgroup>

                <tbody>

                    <tr><td style="font-weight:700;">Firma Adı</td><td colspan="3">${ci.firmName}</td></tr>

                    <tr><td style="font-weight:700;">Periyodik Kontrol Adresi</td><td colspan="3">${ci.address}</td></tr>

                    <tr><td style="font-weight:700;">İSG-KATİP Sözleşme ID</td><td>${ci.isgKatipNo}</td><td style="font-weight:700;">SGK Sicil No</td><td>${ci.sgkSicilNo}</td></tr>

                    <tr><td style="font-weight:700;">Rapor Numarası</td><td>${reportNo}</td><td style="font-weight:700;">Rapor Tarihi</td><td>${insp.inspection_date || ci.reportDate}</td></tr>

                    <tr><td style="font-weight:700;">Periyodik Kontrol Başlangıç ve Bitiş Tarih ve Saati</td><td>${ci.startEndTime || ''}</td><td style="font-weight:700;">Bir Sonraki Periyodik Kontrol Tarihi</td><td>${fd.nextInspectionDate || ci.nextControlDate}</td></tr>

                    <tr><td style="font-weight:700;">Rapor / Ekipman Adı</td><td>${insp.equipment_name || ci.equipmentName || 'Alçak Gerilim Topraklama'}</td><td style="font-weight:700;">Ekipman Seri No / Kod</td><td>${ci.serialCode || insp.serial_no || ''}</td></tr>

                    <tr>

                        <td style="font-weight:700;vertical-align:top;">Periyodik Kontrol Metodu ve Kapsamı</td>

                        <td colspan="3" style="line-height:1.2;font-size:7pt;">

                            • RG, 04.11.1984 - 18565 Elektrik İç Tesisleri Yönetmeliği<br>

                            • RG, 21.08.2001 - 24500 Elektrik Tesislerinde Topraklamalar Yönetmeliği<br>

                            • RG, 25.04.2013 - 28628 İş Ekipmanları Kullanımında Sağlık Güvenlik Şartları Yönetmeliği<br>

                            • TS HD 60364-4-41 Alçak Gerilim Elektrik Tesisleri – Bölüm 4: Güvenlik İçin Koruma – Bölüm 41: Elektrik Çarpmasına Karşı Koruma<br>

                            • TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 2: 2. EKİPMAN BİLGİLERİ (2.1 & 2.2)

        blocks.push(`

            <div class="tkm-sec-title">2. EKİPMAN BİLGİLERİ</div>

            <div class="tkm-sub-bar">2.1. ETİKET VE DETAY BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:19%;"><col style="width:14.3%;">

                    <col style="width:19%;"><col style="width:14.3%;">

                    <col style="width:19%;"><col style="width:14.4%;">

                </colgroup>

                <tbody>

                    <tr>

                        <td style="text-align:center;">Enerji sağlayan kuruluş</td><td style="text-align:left;padding-left:4px;">${d.supplier || ''}</td>

                        <td style="text-align:center;">Şebeke tipi</td><td style="text-align:left;padding-left:4px;font-weight:700;">${d.networkType || ''}</td>

                        <td style="text-align:center;">Şebeke gerilimi (V)</td><td style="text-align:left;padding-left:4px;">${d.voltage || ''}</td>

                    </tr>

                    <tr>

                        <td style="text-align:center;">Tesise ait proje var mı?</td><td style="text-align:left;padding-left:4px;">${d.hasProject || ''}</td>

                        <td style="text-align:center;">Tek hat şeması var mı?</td><td style="text-align:left;padding-left:4px;">${d.hasSingleLine || ''}</td>

                        <td style="text-align:center;">Kontrol nedeni</td><td style="text-align:left;padding-left:4px;">${d.reason || ''}</td>

                    </tr>

                    <tr>

                        <td style="text-align:center;">Proje bilgileri</td><td style="text-align:left;padding-left:4px;">${d.projectInfo || ''}</td>

                        <td style="text-align:center;">Topraklayıcı tipi</td><td style="text-align:left;padding-left:4px;">${d.grounderType || ''}</td>

                        <td style="text-align:center;">Yapı cinsi</td><td style="text-align:left;padding-left:4px;">${d.buildingType || ''}</td>

                    </tr>

                    <tr>

                        <td style="text-align:center;">Ekipmanın kullanım amacı</td><td style="text-align:left;padding-left:4px;">${d.usagePurpose || ''}</td>

                        <td style="text-align:center;">Son kontrol tarihi</td><td style="text-align:left;padding-left:4px;">${d.lastControlDate || ''}</td>

                        <td style="text-align:center;">Hava durumu</td><td style="text-align:left;padding-left:4px;">${d.weather || ''}</td>

                    </tr>

                    <tr>

                        <td style="text-align:center;">Hava sıcaklığı (°C)</td><td style="text-align:left;padding-left:4px;">${d.temperature || ''}</td>

                        <td style="text-align:center;">Zemin nem durumu</td><td style="text-align:left;padding-left:4px;">${d.soilMoisture || ''}</td>

                        <td style="text-align:center;">Dolaylı dokunmaya karşı koruma önlemi</td><td style="text-align:left;padding-left:4px;font-size:6.6pt;">${d.protectionMeasure || ''}</td>

                    </tr>

                </tbody>

            </table>



            <div class="tkm-sub-bar" style="margin-top:3px;">2.2. TESPİT EDİLEN BİLGİLER</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:24%;"><col style="width:9.3%;">

                    <col style="width:24%;"><col style="width:9.3%;">

                    <col style="width:19%;"><col style="width:14.4%;">

                </colgroup>

                <tbody>

                    <tr>

                        <td style="text-align:center;">Tesisatta kapsamlı değişiklik var mı?</td><td style="text-align:left;padding-left:4px;">${det.majorChange || ''}</td>

                        <td style="text-align:center;">Bir önceki periyodik kontrole ait ek var mı?</td><td style="text-align:left;padding-left:4px;">${det.prevReportAttached || ''}</td>

                        <td style="text-align:center;">Pano/Ekipman tanımlaması</td><td style="text-align:left;padding-left:4px;">${det.panelIdent || ''}</td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 3: 3. TEST DEĞERLERİ

        blocks.push(`

            <div class="tkm-sec-title">3. TEST DEĞERLERİ</div>

            <table class="tkm-table">

                <tbody>

                    <tr>

                        <td style="font-size:6.8pt;line-height:1.2;padding:3.5px 6px;text-align:left;">

                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 14px;">

                                <div><strong>Zx:</strong> Ölçülen çevrim empedansı.</div>

                                <div><strong>Zs:</strong> Aşırı akım koruma cihazının açma akımına göre hesaplanan sınır çevrim empedansı.</div>

                                <div><strong>Rx:</strong> Ölçülen topraklama direnci.</div>

                                <div><strong>RA:</strong> Aşırı akım koruma cihazının açma akımına göre hesaplanan sınır topraklama direnci.</div>

                                <div><strong>Ik:</strong> Devredeki toprak çevrim empedansına göre hesaplanan ya da ölçülen faz- toprak hata akımı.</div>

                                <div><strong>Ia:</strong> Aşırı akım koruma cihazının açma eğrisi tipine göre hesaplanan ani açma ya da otomatik açma akımı-RCD’ler için etikette yazılı beyan açma akımı (IΔn)</div>

                                <div><strong>IΔn:</strong> RCD (Artık akım anahtarı) için beyan açma akımı</div>

                                <div><strong>IΔ:</strong> RCD için test açma akımı</div>

                                <div><strong>TΔ:</strong> RCD için test açma zamanı-max: 200 ms.</div>

                                <div><strong>50V:</strong> Dokunma gerilimi sınır değeri (AG tesisat a.a da, normal, ya da kuru yerler)</div>

                                <div><strong>25V:</strong> Dokunma gerilimi sınır değeri (AG tesisat a.a da, tehlikenin yüksek olduğu yerler, ıslak hacimler, tarımsal alanlar vb.)</div>

                                <div><strong>230V:</strong> (Uo) Hesaplamalar için kullanılacak faz-toprak veya faz-nötr gerilimi</div>

                                <div><strong>Zs&lt;230V/Ia:</strong> TN şebekeler için hesaplanan çevrim empedansı sınır değeri. (TN şebekeler için dolaylı dokunmaya karşı güvenlik şartı.)</div>

                                <div><strong>RA&lt;50V/Ia:</strong> TT şebekeler için hesaplanan topraklama direnci sınır değeri. (TT Şebekeler için dolaylı dokunmaya karşı güvenlik şartı.)</div>

                            </div>

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 4: 4. KONTROL KRİTERLERİ VE TESTLER (4.1 & 4.2)

        const pointRowsToRender = points.length ? points : [

            { point: '', inAmp: '', curve: '', iaAmp: '', ik1Amp: '', zxRx: '', zsRa: '', rcdSpec: '', rcdId: '', rcdTd: '', result: '' }

        ];



        // Split points into chunks if there are multiple rows so pagination never breaks cleanly

        const chunkSize = 14;

        for (let pIdx = 0; pIdx < pointRowsToRender.length; pIdx += chunkSize) {

            const chunk = pointRowsToRender.slice(pIdx, pIdx + chunkSize);

            const isFirstChunk = (pIdx === 0);

            const isLastChunk = (pIdx + chunkSize >= pointRowsToRender.length);



            let chunkHtml = '';

            if (isFirstChunk) {

                chunkHtml += `

                    <div class="tkm-sec-title">4. KONTROL KRİTERLERİ VE TESTLER</div>

                    <div class="tkm-sub-bar">4.1. ÖLÇÜM METODU</div>

                    <table class="tkm-table" style="margin-bottom:3px;">

                        <colgroup><col style="width:25%;"><col style="width:75%;"></colgroup>

                        <tbody>

                            <tr><td style="font-weight:700;">Ölçüm ve doğrulama metodu</td><td style="padding-left:6px;">${gd.method || ''}</td></tr>

                        </tbody>

                    </table>

                    <div class="tkm-sub-bar">4.2. SON TÜKETİM NOKTALARINDA DOLAYLI DOKUNMAYA KARŞI KORUMA YETERLİLİĞİ KONTROLÜ</div>

                `;

            } else {

                chunkHtml += `

                    <div class="tkm-sub-bar">4.2. SON TÜKETİM NOKTALARINDA DOLAYLI DOKUNMAYA KARŞI KORUMA YETERLİLİĞİ KONTROLÜ (Devam)</div>

                `;

            }



            chunkHtml += `

                <table class="tkm-table" style="font-size:6.8pt;">

                    <thead>

                        <tr>

                            <th style="width:22px;text-align:center;">No</th>

                            <th style="text-align:center;">Ölçüm noktası / Etiket veya kodu</th>

                            <th style="width:40px;text-align:center;">Koruma elemanının In (A)</th>

                            <th style="width:40px;text-align:center;">Koruma elemanının açma eğrisi tipi</th>

                            <th style="width:42px;text-align:center;">Koruma elemanının açma akımı Ia (A)</th>

                            <th style="width:50px;text-align:center;">Koruma elemanının toprak kısa devre akımı Ik1 (A)</th>

                            <th style="width:46px;text-align:center;">Ölçüm ölçülen değer Zx / Rx (Ω)</th>

                            <th style="width:46px;text-align:center;">Ölçüm sınır değer Zs / RA (Ω)</th>

                            <th style="width:70px;text-align:center;">RCD tipi, dayanma akımı ve açma akımı In (A) / I∆n (mA)</th>

                            <th style="width:44px;text-align:center;">RCD test açma akımı I∆ (mA)</th>

                            <th style="width:44px;text-align:center;">RCD test açma zamanı T∆ (ms)</th>

                            <th style="width:48px;text-align:center;">Sonuç (Uygunluk notu)</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${chunk.map((pt, idx) => `

                            <tr>

                                <td style="text-align:center;">${pIdx + idx + 1}</td>

                                <td style="text-align:left;padding-left:4px;">${pt.point || ''}</td>

                                <td style="text-align:center;">${pt.inAmp || ''}</td>

                                <td style="text-align:center;">${pt.curve || ''}</td>

                                <td style="text-align:center;">${pt.iaAmp || ''}</td>

                                <td style="text-align:center;">${pt.ik1Amp || ''}</td>

                                <td style="text-align:center;">${pt.zxRx || ''}</td>

                                <td style="text-align:center;">${pt.zsRa || ''}</td>

                                <td style="text-align:center;">${pt.rcdSpec || ''}</td>

                                <td style="text-align:center;">${pt.rcdId || ''}</td>

                                <td style="text-align:center;">${pt.rcdTd || ''}</td>

                                <td style="text-align:center;font-weight:700;">${pt.result || ''}</td>

                            </tr>

                        `).join('')}

                    </tbody>

                </table>

            `;



            if (isLastChunk) {

                // Also append 4.3 RCD Selektivite Kontrolü

                const selRowsHtml = selectivity.length ? selectivity.map((s, idx) => `

                    <tr>

                        <td style="text-align:center;">${idx + 1}</td>

                        <td style="text-align:left;padding-left:3px;">${s.priorPanel || ''}</td>

                        <td style="text-align:center;">${s.priorRcdType || ''}</td>

                        <td style="text-align:center;">${s.priorRcdIn || ''}</td>

                        <td style="text-align:center;">${s.priorRcdIdn || ''}</td>

                        <td style="text-align:center;">${s.priorRcdTd || ''}</td>

                        <td style="text-align:left;padding-left:3px;">${s.destPanel || ''}</td>

                        <td style="text-align:center;">${s.destRcdType || ''}</td>

                        <td style="text-align:center;">${s.destRcdIdn || ''}</td>

                        <td style="text-align:center;">${s.destRcdTd || ''}</td>

                        <td style="text-align:center;font-weight:700;">${s.result || ''}</td>

                    </tr>

                `).join('') : `

                    <tr><td colspan="11" style="text-align:center;padding:3px;font-style:italic;">Uygulaması Yok</td></tr>

                `;



                chunkHtml += `

                    <div class="tkm-sub-bar" style="margin-top:3px;">4.3. ARTIK AKIM ANAHTARLARI (RCD) SELEKTİVİTE KONTROLÜ</div>

                    <table class="tkm-table" style="font-size:6.7pt;">

                        <thead>

                            <tr>

                                <th style="width:20px;text-align:center;">No</th>

                                <th style="text-align:center;">Son tüketim noktasını besleyen panodan N önceki panonun adı</th>

                                <th style="width:50px;text-align:center;">Kullanılan RCD etiket bilgileri RCD tipi</th>

                                <th style="width:48px;text-align:center;">Kullanılan RCD dayanma akımı In (A)</th>

                                <th style="width:48px;text-align:center;">Kullanılan RCD açma akım I∆n (mA)</th>

                                <th style="width:50px;text-align:center;">Kullanılan RCD açma zamanı gecikmesi T∆ (ms)</th>

                                <th style="text-align:center;">Son tüketim noktasını besleyen pano adı</th>

                                <th style="width:50px;text-align:center;">Kullanılan RCD tipi</th>

                                <th style="width:48px;text-align:center;">Kullanılan RCD açma akımı I∆n (mA)</th>

                                <th style="width:48px;text-align:center;">Kullanılan RCD açma zamanı T∆ (ms)</th>

                                <th style="width:48px;text-align:center;">Sonuç (Uygunluk notu)</th>

                            </tr>

                        </thead>

                        <tbody>${selRowsHtml}</tbody>

                    </table>

                `;

            }



            blocks.push(chunkHtml);

        }



        // Block 5: 5. KUSUR AÇIKLAMALARI & 6. NOTLAR

        blocks.push(`

            <div class="tkm-sec-title">5. KUSUR AÇIKLAMALARI</div>

            <table class="tkm-table">

                <tbody>

                    <tr><td style="min-height:18px;height:18px;vertical-align:top;text-align:left;">${(fd.defectNotes || '').replace(/\n/g, '<br>')}</td></tr>

                </tbody>

            </table>

            <div class="tkm-sec-title">6. NOTLAR</div>

            <table class="tkm-table">

                <tbody>

                    <tr><td style="min-height:18px;height:18px;vertical-align:top;text-align:left;">${(fd.generalNotes || '').replace(/\n/g, '<br>')}</td></tr>

                </tbody>

            </table>

        `);



        // Photos Block (if attached)

        if (fd.photos && fd.photos.length) {

            blocks.push(...renderPdfPhotoBlocks(fd.photos, 'FOTOĞRAFLAR'));

        }



        // Block 6: 7. SONUÇ VE KANAAT

        const isGroundingSuitable = fd.overallResult !== 'UYGUN DEĞİL';

        blocks.push(`

            <div class="tkm-sec-title">7. SONUÇ VE KANAAT</div>

            <table class="tkm-table">

                <tbody>

                    <tr>

                        <td style="font-size:6.7pt;line-height:1.2;padding:3.5px 6px;text-align:left;">

                            <div style="font-weight:700;margin-bottom:2px;">Uygunluk notu ve ağır kusur açıklamaları:</div>

                            <div><strong>Not-1:</strong> Uygun.</div>

                            <div><strong>Not-2:</strong> Güvenlik şartı sağlanamadığından uygun değildir. (Ağır kusur)</div>

                            <div><strong>Not-3:</strong> Topraklama bağlantısı yok kontrol edilmelidir. (Ağır kusur)</div>

                            <div><strong>Not-4:</strong> Artık akım anahtarı kullanıldığı ve faal olduğu için uygundur.</div>

                            <div><strong>Not-5:</strong> TT veya TN (TN-S veya TN-CS’nin S bölümü) şebeke sistemlerinde 32 A’e kadar genel kullanım priz tesisatlarında, 32 A’e kadar seyyar cihaz prizlerinde 30 mA artık akım cihazı RCD kullanımı zorunludur. 32 A’in üzerindeki devrelerde ise, doğal kaçak akımların kaçınılmaz olduğu durumlarda, uygun seçilmiş kaçak akım koruma cihazları (RCD), diğer elektrik çarpmasına karşı koruma önlemleriyle birlikte kullanılmalıdır. Doğal kaçakların bulunduğu bölümlere ilişkin teknik detay ve sebepler periyodik kontrol raporunun ilgili bölümlerinde belirtilmelidir. (Ağır kusur)</div>

                            <div><strong>Not-6:</strong> 32 A üzerindeki devrelerde dolaylı dokunmaya karşı önlemler yanında doğal kaçak akım tahkiki yapılmadığından yetersizdir. (Ağır kusur)</div>

                            <div><strong>Not-7:</strong> Son tüketim noktasını besleyen panodan bir önceki panoda kullanılan RCD gecikmeli tip (selektif veya gecikme ayarlı) olmadığından yetersizdir.</div>

                            <div><strong>Not-8:</strong> Nötr-toprak geriliminin yüksek olması nedeniyle ölçüm yapılamamıştır. (Ağır kusur)</div>

                            <div><strong>Not-9:</strong> TN-S ve TN-CS topraklama sistem tipini belirleyen PEN köprüsü dışında PE ve N iletkenlerinin birleştirilmesi uygun değildir. (Ağır kusur)</div>

                            <div><strong>Not-10:</strong> Priz üzerinde Nötr-Toprak birleşikliği (sıfırlama yapıldığı) tespit edildiğinden yetersiz. Tesis topraklama tipi TT ise sıfırlama yapılamaz. TN ise PEN iletken kesiti &lt;10 mm2 olamayacağından 2,5 mm2 prizde sıfırlama yapılamaz. (Ağır kusur)</div>

                            <div><strong>Not-11:</strong> Pano gövde–kapak köprüsü olmadığından yetersizdir. (Ağır kusur)</div>

                            <div style="margin-top:4px;font-size:7.4pt;font-weight:700;color:${isGroundingSuitable ? '#047857' : '#c00000'};line-height:1.25;">
                                Periyodik kontrol tarihi itibariyle yukarıda teknik özellikleri belirtilen AG Topraklama Tesisatı muayenesi sonrasında mevcut şartlar altında kullanımı 1 yıl süreyle;<br>
                                <span style="font-size:8.4pt;">${isGroundingSuitable ? 'UYGUNDUR.' : 'UYGUN DEĞİLDİR.'}</span>
                            </div>

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 7: 8. ONAY

        blocks.push(buildTkmOnaySection(insp, '8'));



        pagesArray = paginateBlocksIntoA4Pages(blocks, reportMainTitle, docFormCode, reportNo);



    } else if (isGenerator2205) {

        // ====================================================================

        // JENERATÖR PERİYODİK KONTROL RAPORU (TKM-FR.164, REV.07 / RT: 09.12.2024)

        // ====================================================================

        const reportMainTitle = 'JENERATÖR<br>PERİYODİK KONTROL RAPORU';

        const docFormCode = 'TKM-FR.164, REV.07 / RT: 09.12.2024';

        const gen = fd.generator || { info: {}, equipment: {}, checks: {}, potential: {}, measurements: {}, battery: {}, devices: [] };

        const gInfo = gen.info || {};

        const gEq = gen.equipment || {};

        const gChecks = gen.checks || {};

        const gPot = gen.potential || {};

        const gMeas = gen.measurements || {};

        const gBat = gen.battery || {};



        const blocks = [];



        // Block 1: 1. FİRMA BİLGİLERİ

        blocks.push(`

            <div class="tkm-sec-title">1. FİRMA BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:20%;"><col style="width:30%;"><col style="width:20%;"><col style="width:30%;">

                </colgroup>

                <tbody>

                    <tr><td style="font-weight:700;">Firma Adı</td><td colspan="3">${ci.firmName}</td></tr>

                    <tr><td style="font-weight:700;">Periyodik Kontrol Adresi</td><td colspan="3">${ci.address}</td></tr>

                    <tr><td style="font-weight:700;">İSG-KATİP Sözleşme ID</td><td>${ci.isgKatipNo}</td><td style="font-weight:700;">SGK Sicil No</td><td>${ci.sgkSicilNo}</td></tr>

                    <tr><td style="font-weight:700;">Rapor Numarası</td><td>${reportNo}</td><td style="font-weight:700;">Rapor Tarihi</td><td>${insp.inspection_date || ci.reportDate}</td></tr>

                    <tr><td style="font-weight:700;">Periyodik Kontrol Başlangıç ve Bitiş Tarih ve Saati</td><td>${ci.startEndTime || ''}</td><td style="font-weight:700;">Bir Sonraki Periyodik Kontrol Tarihi</td><td>${fd.nextInspectionDate || ci.nextControlDate}</td></tr>

                    <tr><td style="font-weight:700;">Rapor / Ekipman Adı</td><td>${insp.equipment_name || ci.equipmentName || 'Alçak Gerilim Topraklama'}</td><td style="font-weight:700;">Ekipman Seri No / Kod</td><td>${ci.serialCode || insp.serial_no || ''}</td></tr>

                    <tr>

                        <td style="font-weight:700;vertical-align:top;">Periyodik Kontrol Metodu ve Kapsamı</td>

                        <td colspan="3" style="line-height:1.2;font-size:7pt;">

                            • RG, 04.11.1984 - 18565 Elektrik İç Tesisleri Yönetmeliği<br>

                            • RG, 21.08.2001 - 24500 Elektrik Tesislerinde Topraklamalar Yönetmeliği<br>

                            • RG, 25.04.2013 - 28628 İş Ekipmanları Kullanımında Sağlık Güvenlik Şartları Yönetmeliği<br>

                            • RG, 30.11.2000 - 24246 Elektrik Kuvvetli Akım Tesisleri Yönetmeliği<br>

                            • TS ISO 8528-1 Pistonlu içten yanmalı motorla tahrik edilen alternatif akım jeneratör grupları - Bölüm 1: Uygulama, beyan değerleri ve performans

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 2: 2. ÖLÇÜM ALETLERİ BİLGİLERİ

        const genDeviceRows = (gen.devices && gen.devices.length) ? gen.devices : [];



        blocks.push(`

            <div class="tkm-sec-title">2. ÖLÇÜM ALETLERİ BİLGİLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Cihaz Adı</th>

                        <th style="text-align:center;font-weight:700;">Seri Numarası</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Numarası</th>

                    </tr>

                </thead>

                <tbody>

                    ${genDeviceRows.length ? genDeviceRows.map(d => `

                        <tr>

                            <td style="text-align:center;">${d.name || ''}</td>

                            <td style="text-align:center;">${d.serial || ''}</td>

                            <td style="text-align:center;">${d.calDate || ''}</td>

                            <td style="text-align:center;">${d.validDate || ''}</td>

                            <td style="text-align:center;">${d.certNo || ''}</td>

                        </tr>

                    `).join('') : `

                        <tr><td colspan="5" style="text-align:center;padding:4px;font-style:italic;">Ölçüm cihazı kaydedilmedi</td></tr>

                    `}

                </tbody>

            </table>

        `);



        // Block 3: 3. MUAYENEYE AİT GENEL BİLGİLER

        blocks.push(`

            <div class="tkm-sec-title">3. MUAYENEYE AİT GENEL BİLGİLER</div>

            <div class="tkm-sub-bar">MUAYENE BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:16.6%;"><col style="width:16.6%;">

                    <col style="width:16.6%;"><col style="width:16.6%;">

                    <col style="width:16.6%;"><col style="width:17%;">

                </colgroup>

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Muayene Nedeni</th>

                        <th style="text-align:center;font-weight:700;">Hava Durumu</th>

                        <th style="text-align:center;font-weight:700;">Toprak Durumu</th>

                        <th style="text-align:center;font-weight:700;">Şebeke Tipi</th>

                        <th style="text-align:center;font-weight:700;">Topraklama Tipi</th>

                        <th style="text-align:center;font-weight:700;">Eşpotansiyel Bara</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gInfo.reason || ''}</td>

                        <td style="text-align:center;">${gInfo.weather || ''}</td>

                        <td style="text-align:center;">${gInfo.soilStatus || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gInfo.networkType || ''}</td>

                        <td style="text-align:center;">${gInfo.groundingType || ''}</td>

                        <td style="text-align:center;">${gInfo.equipotentialBar || ''}</td>

                    </tr>

                </tbody>

            </table>



            <div class="tkm-sub-bar" style="margin-top:3px;">3.1. EKİPMAN BİLGİLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Marka</th>

                        <th style="text-align:center;font-weight:700;">Model</th>

                        <th style="text-align:center;font-weight:700;">Seri No</th>

                        <th style="text-align:center;font-weight:700;">İmal Yılı</th>

                        <th style="text-align:center;font-weight:700;">Yakıt</th>

                        <th style="text-align:center;font-weight:700;">Ses İzolasyon</th>

                        <th style="text-align:center;font-weight:700;">Tip</th>

                        <th style="text-align:center;font-weight:700;">Gerilim</th>

                        <th style="text-align:center;font-weight:700;">Güç</th>

                        <th style="text-align:center;font-weight:700;">Frekans</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gEq.brand || ''}</td>

                        <td style="text-align:center;">${gEq.model || ''}</td>

                        <td style="text-align:center;">${gEq.serialNo || ''}</td>

                        <td style="text-align:center;">${gEq.mfgYear || ''}</td>

                        <td style="text-align:center;">${gEq.fuel || ''}</td>

                        <td style="text-align:center;">${gEq.soundInsulation || ''}</td>

                        <td style="text-align:center;">${gEq.type || ''}</td>

                        <td style="text-align:center;">${gEq.voltage || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gEq.power || ''}</td>

                        <td style="text-align:center;">${gEq.frequency || ''}</td>

                    </tr>

                </tbody>

            </table>

        `);



        // Helper to render 2-column checklist items matching sample PDF 1:1

        const renderChecklistCategoryRows = (itemsList) => {

            let trs = '';

            for (let i = 0; i < itemsList.length; i += 2) {

                const item1 = itemsList[i];

                const item2 = itemsList[i + 1];

                const val1 = formatSymbolForPrint(gChecks[item1.code] || '');

                const val2 = item2 ? formatSymbolForPrint(gChecks[item2.code] || '') : '';



                trs += `

                    <tr>

                        <td style="font-weight:700;width:30px;text-align:center;">${item1.code}</td>

                        <td style="text-align:left;padding-left:4px;font-size:6.7pt;line-height:1.15;">${item1.text}</td>

                        <td style="text-align:center;font-weight:700;width:24px;">${val1}</td>

                        ${item2 ? `

                            <td style="font-weight:700;width:30px;text-align:center;">${item2.code}</td>

                            <td style="text-align:left;padding-left:4px;font-size:6.7pt;line-height:1.15;">${item2.text}</td>

                            <td style="text-align:center;font-weight:700;width:24px;">${val2}</td>

                        ` : `

                            <td colspan="3"></td>

                        `}

                    </tr>

                `;

            }

            return trs;

        };



        // Block 4A: 4. GENEL KONTROLLER - Part 1 (Cat A, B, C and D.1 - D.8) -> Fits Page 1

        const itemsA = GENERATOR_CHECKLIST.filter(c => c.cat === 'A');

        const itemsB = GENERATOR_CHECKLIST.filter(c => c.cat === 'B');

        const itemsC = GENERATOR_CHECKLIST.filter(c => c.cat === 'C');

        const itemsD_part1 = GENERATOR_CHECKLIST.filter(c => c.cat === 'D').slice(0, 8);

        const itemsD_part2 = GENERATOR_CHECKLIST.filter(c => c.cat === 'D').slice(8);



        blocks.push(`

            <div class="tkm-sec-title">4. GENEL KONTROLLER</div>

            <table class="tkm-table" style="font-size:6.8pt;">

                <colgroup>

                    <col style="width:30px;"><col style="width:42.5%;"><col style="width:24px;">

                    <col style="width:30px;"><col style="width:42.5%;"><col style="width:24px;">

                </colgroup>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsA)}

                </tbody>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">B JENERATÖR ODASI KONTROLLERİ</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">B JENERATÖR ODASI KONTROLLERİ</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsB)}

                </tbody>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">C GÖRSEL KONTROLLER</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">C GÖRSEL KONTROLLER</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsC)}

                </tbody>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">D FONKSİYONEL KONTROLLER</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">D FONKSİYONEL KONTROLLER</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsD_part1)}

                </tbody>

            </table>

        `);



        // Block 4B: Part 2 (D.9 to D.16) + Section 5 (Ölçüm Sonuçları) -> Fits Page 2

        blocks.push(`

            <table class="tkm-table" style="font-size:6.8pt;margin-top:2px;">

                <colgroup>

                    <col style="width:30px;"><col style="width:42.5%;"><col style="width:24px;">

                    <col style="width:30px;"><col style="width:42.5%;"><col style="width:24px;">

                </colgroup>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">D FONKSİYONEL KONTROLLER (Devam)</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">D FONKSİYONEL KONTROLLER (Devam)</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsD_part2)}

                </tbody>

            </table>



            <div class="tkm-sec-title">5. ÖLÇÜM SONUÇLARI</div>

            <div class="tkm-sub-bar">5.1. POTANSİYEL ÖLÇÜMLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">L1 – N (V)</th>

                        <th style="text-align:center;font-weight:700;">L2 – N (V)</th>

                        <th style="text-align:center;font-weight:700;">L3 – N (V)</th>

                        <th style="text-align:center;font-weight:700;">L1 – L2 (V)</th>

                        <th style="text-align:center;font-weight:700;">L1 – L3 (V)</th>

                        <th style="text-align:center;font-weight:700;">L2 – L3 (V)</th>

                        <th style="text-align:center;font-weight:700;">N – Pe (V)</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gPot.l1_n || ''}</td>

                        <td style="text-align:center;">${gPot.l2_n || ''}</td>

                        <td style="text-align:center;">${gPot.l3_n || ''}</td>

                        <td style="text-align:center;">${gPot.l1_l2 || ''}</td>

                        <td style="text-align:center;">${gPot.l1_l3 || ''}</td>

                        <td style="text-align:center;">${gPot.l2_l3 || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gPot.n_pe || ''}</td>

                    </tr>

                </tbody>

            </table>



            <div class="tkm-sub-bar" style="margin-top:3px;">5.2. AYDINLATMA, SES, TOPRAKLAMA, ISI VE FREKANS ÖLÇÜMLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Aydınlatma Şiddeti (lux)</th>

                        <th style="text-align:center;font-weight:700;">1 mt' de Ses Seviyesi (dB)</th>

                        <th style="text-align:center;font-weight:700;">7 mt' de Ses Seviyesi (dB)</th>

                        <th style="text-align:center;font-weight:700;">L1 – Frekans (Hz)</th>

                        <th style="text-align:center;font-weight:700;">L2 – Frekans (Hz)</th>

                        <th style="text-align:center;font-weight:700;">L3 – Frekans (Hz)</th>

                        <th style="text-align:center;font-weight:700;">Gövde Topraklaması (Ω)</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gMeas.lux || ''}</td>

                        <td style="text-align:center;">${gMeas.db_1m || ''}</td>

                        <td style="text-align:center;">${gMeas.db_7m || ''}</td>

                        <td style="text-align:center;">${gMeas.hz_l1 || ''}</td>

                        <td style="text-align:center;">${gMeas.hz_l2 || ''}</td>

                        <td style="text-align:center;">${gMeas.hz_l3 || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gMeas.ground_r || ''}</td>

                    </tr>

                </tbody>

            </table>



            <div class="tkm-sub-bar" style="margin-top:3px;">5.3. AKÜ BİLGİLERİ VE ÖLÇÜMLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Marka</th>

                        <th style="text-align:center;font-weight:700;">Model</th>

                        <th style="text-align:center;font-weight:700;">Seri No</th>

                        <th style="text-align:center;font-weight:700;">İmal Yılı</th>

                        <th style="text-align:center;font-weight:700;">Redresör Devredeyken (V)</th>

                        <th style="text-align:center;font-weight:700;">Redresör Devre Dışıyken (V)</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gBat.brand || ''}</td>

                        <td style="text-align:center;">${gBat.model || ''}</td>

                        <td style="text-align:center;">${gBat.serialNo || ''}</td>

                        <td style="text-align:center;">${gBat.mfgYear || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gBat.v_on || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gBat.v_off || ''}</td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 5: 6. KUSUR AÇIKLAMALARI

        blocks.push(`

            <div class="tkm-sec-title">6. KUSUR AÇIKLAMALARI</div>

            <table class="tkm-table">

                <tbody>

                    <tr>

                        <td style="min-height:18px;height:18px;vertical-align:top;text-align:left;">

                            ${(fd.defectNotes || '').replace(/\n/g, '<br>')}

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Photos Block (if attached) - exactly between Section 6 and Section 7 as in official sample report!

        if (fd.photos && fd.photos.length) {

            blocks.push(...renderPdfPhotoBlocks(fd.photos, 'FOTOĞRAFLAR'));

        }



        // Block 6: 7. SONUÇ VE KANAAT

        const isGenSuitable = fd.overallResult !== 'UYGUN DEĞİL';

        blocks.push(`

            <div class="tkm-sec-title">7. SONUÇ VE KANAAT</div>

            <table class="tkm-table">

                <tbody>

                    <tr>

                        <td style="padding:6px 8px;text-align:left;font-size:7.4pt;font-weight:700;color:${isGenSuitable ? '#047857' : '#c00000'};line-height:1.25;">
                            Periyodik kontrol tarihi itibariyle yukarıda teknik özellikleri belirtilen jeneratör muayenesi sonrasında mevcut şartlar altında<br>
                            <span style="font-size:8.4pt;">
                                ${isGenSuitable ? 'KULLANILMASI UYGUNDUR.' : 'KULLANILMASI UYGUN DEĞİLDİR.'}
                            </span>
                        </td>

                    </tr>

                </tbody>

            </table>

            <div class="tkm-legend">✓ : Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>

        `);



        // Block 7: 8. ONAY

        blocks.push(buildTkmOnaySection(insp, '8'));



        pagesArray = paginateBlocksIntoA4Pages(blocks, reportMainTitle, docFormCode, reportNo);



    } else {

        // Specialized Templates (Paratoner, Yangın, Kapı, Raf, Klima vb.)

        const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);

        const reportMainTitle = (insp.equipment_name || schema.title || 'İŞ EKİPMANI').toUpperCase();

        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];



        const fields = schema.generalFields || schema.fields || [];

        let fieldsGridHtml = '<table class="tkm-table"><colgroup><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.4%;"></colgroup><tbody>';

        for (let i = 0; i < fields.length; i += 3) {

            fieldsGridHtml += '<tr>';

            for (let c = 0; c < 3; c++) {

                const f = fields[i + c];

                if (f) {

                    const fKey = f.key || f.id;

                    const val = fd.specializedFields?.[fKey] ?? '';

                    fieldsGridHtml += `

                        <td style="text-align:center;">${f.label}</td>

                        <td style="text-align:left;padding-left:5px;">${val}</td>

                    `;

                } else {

                    fieldsGridHtml += '<td></td><td></td>';

                }

            }

            fieldsGridHtml += '</tr>';

        }

        fieldsGridHtml += '</tbody></table>';



        const cHtml = (schema.visualChecks || []).map((c, idx) => `

            <tr>

                <td style="text-align:center;font-weight:700;">${letters[idx] || (idx + 1)}</td>

                <td style="text-align:left;padding-left:6px;">${c}</td>

                <td style="text-align:center;">${formatSymbolForPrint(fd.specializedChecks?.[`chk_${idx}`] || '')}</td>

            </tr>

        `).join('');



        const tableCols = schema.tableColumns || [];

        const normalizedRows = normalizeSpecializedRowsArray(fd.specializedRows || [], tableCols);

        const ths = tableCols.map(c => `<th style="text-align:center;font-weight:700;">${c.label}</th>`).join('');

        const trs = normalizedRows.map(r => `

            <tr>${r.map(cell => `<td style="text-align:center;">${cell}</td>`).join('')}</tr>

        `).join('');



        const devRowsHtml = ((fd.measuringDevices && fd.measuringDevices.length) ? fd.measuringDevices : [

            { name: '', serial: '', calDate: '', validDate: '', certNo: '' }

        ]).map(d => `

            <tr>

                <td style="text-align:center;">${d.name || ''}</td>

                <td style="text-align:center;">${d.serial || ''}</td>

                <td style="text-align:center;">${d.calDate || ''}</td>

                <td style="text-align:center;">${d.validDate || ''}</td>

                <td style="text-align:center;">${d.certNo || ''}</td>

            </tr>

        `).join('');



        const methodsHtml = (schema.methods && schema.methods.length)

            ? schema.methods.map(m => `• ${m}`).join('<br>')

            : '• RG, 25.04.2013 - 28628 İş Ekipmanları Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği';



        const specBlocks = [

            `

                <div class="tkm-sec-title">1. FİRMA BİLGİLERİ</div>

                <table class="tkm-table">

                    <colgroup><col style="width:19%;"><col style="width:36%;"><col style="width:17%;"><col style="width:28%;"></colgroup>

                    <tbody>

                        <tr><td style="font-weight:700;">Firma Adı</td><td colspan="3">${ci.firmName}</td></tr>

                        <tr><td style="font-weight:700;">Periyodik Kontrol Adresi</td><td colspan="3">${ci.address}</td></tr>

                        <tr><td style="font-weight:700;">İSG-KATİP Sözleşme ID</td><td>${ci.isgKatipNo}</td><td style="font-weight:700;">SGK Sicil No</td><td>${ci.sgkSicilNo}</td></tr>

                        <tr><td style="font-weight:700;">Rapor Numarası</td><td>${reportNo}</td><td style="font-weight:700;">Rapor Tarihi</td><td>${insp.inspection_date || ci.reportDate}</td></tr>

                        <tr><td style="font-weight:700;">Periyodik Kontrol Başlangıç ve Bitiş Saati</td><td>${ci.startEndTime}</td><td style="font-weight:700;">Bir Sonraki Periyodik Kontrol Tarihi</td><td>${fd.nextInspectionDate || ci.nextControlDate}</td></tr>

                        <tr><td style="font-weight:700;">Ekipman Seri No / Kod</td><td colspan="3">${ci.serialCode}</td></tr>

                        <tr><td style="font-weight:700;">Periyodik Kontrol Metodu ve Kapsamı</td><td colspan="3" style="line-height:1.22;">${methodsHtml}</td></tr>

                    </tbody>

                </table>

            `,

            `

                <div class="tkm-sec-title">2. EKİPMAN TEKNİK BİLGİLERİ</div>

                <div class="tkm-sub-bar">2.1. DETAY VE TESİS BİLGİLERİ</div>

                ${fieldsGridHtml}

            `,

            `

                <div class="tkm-sec-title">3. ÖLÇÜM ALETLERİ BİLGİLERİ</div>

                <table class="tkm-table">

                    <thead>

                        <tr>

                            <th style="text-align:center;font-weight:700;">Cihaz Adı</th>

                            <th style="text-align:center;font-weight:700;">Seri No</th>

                            <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>

                            <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>

                            <th style="text-align:center;font-weight:700;">Sertifika No</th>

                        </tr>

                    </thead>

                    <tbody>${devRowsHtml}</tbody>

                </table>

            `,

            `

                <div class="tkm-sec-title">4. GÖZLE KONTROL KRİTERLERİ VE FONKSİYON TESTLERİ</div>

                <div class="tkm-sub-bar">4.1. KONTROL KRİTERLERİ</div>

                <table class="tkm-table">

                    <colgroup><col style="width:28px;"><col><col style="width:42px;"></colgroup>

                    <thead><tr><th></th><th style="text-align:left;padding-left:6px;font-weight:700;">Soru / Kriter</th><th style="text-align:center;font-weight:700;">1</th></tr></thead>

                    <tbody>${cHtml}</tbody>

                </table>

                <div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>

            `,

            `

                <div class="tkm-sec-title">5. ÖLÇÜM VE TEST SONUÇLARI TABLOSU</div>

                <table class="tkm-table">

                    <thead><tr>${ths}</tr></thead>

                    <tbody>${trs}</tbody>

                </table>

            `,

            `

                <div class="tkm-sec-title">6. KUSUR AÇIKLAMALARI & 7. NOTLAR</div>

                <table class="tkm-table">

                    <tbody>

                        <tr><td style="font-weight:700;width:19%;">Kusur Açıklamaları</td><td>${(fd.defectNotes || '').replace(/\n/g, '<br>')}</td></tr>

                        <tr><td style="font-weight:700;">Notlar</td><td>${(fd.generalNotes || '').replace(/\n/g, '<br>')}</td></tr>

                    </tbody>

                </table>

            `,

            ...(fd.photos && fd.photos.length ? renderPdfPhotoBlocks(fd.photos, 'FOTOĞRAFLAR') : []),

            `

                <div class="tkm-sec-title">8. SONUÇ VE KANAAT</div>

                <table class="tkm-table">

                    <tbody>

                        <tr>

                            <td style="padding:5px 6px;font-weight:700;font-size:7.4pt;color:${fd.overallResult === 'UYGUN DEĞİL' ? '#c00000' : '#047857'};line-height:1.25;">
                                Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen ekipmanın muayenesi sonrasında mevcut şartlar altında<br>
                                <span style="font-size:8.4pt;">
                                    KULLANIMI ${fd.overallResult === 'UYGUN DEĞİL' ? 'UYGUN DEĞİLDİR.' : 'UYGUNDUR.'}
                                </span>
                            </td>

                        </tr>

                    </tbody>

                </table>

            `,

            buildTkmOnaySection(insp, '9')

        ];



        const specDocCode = ((schema.docNo || schema.code || formCode).split(',')[0] || formCode).trim();

        pagesArray = paginateBlocksIntoA4Pages(specBlocks, reportMainTitle, specDocCode, reportNo);

    }



    updateThemeSelectorUI(activePdfTheme);

    const themeSelect = document.getElementById('pdfThemeSelect');
    if (themeSelect) themeSelect.value = activePdfTheme;

    // Populate Printable Container (for @media print)
    printArea.setAttribute('data-pdf-theme', activePdfTheme);
    printArea.innerHTML = pagesArray.map(p => `<div class="tkm-a4-page" data-pdf-theme="${activePdfTheme}">${p}</div>`).join('');

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





// ============================================================================

// ACİL DURUM YEDEKLEME, VERİ KURTARMA & GÜVENLİK KALKANI (v0.5)

// ============================================================================



