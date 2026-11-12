// ============================================================================
// HIZLI RAPOR - 01-CORE.JS
// Açıklama: Çekirdek Sistem, AppState, Auth, Navigasyon, Modal ve Toastlar
// Satır Aralığı: 1 - 1685 (1685 satır)
// ============================================================================



function calculateInspectionProgress(insp, fd) {

    let total = 0;

    let answered = 0;

    let defects = 0;



    if (String(insp.template_id) === '2201' && AppState.electricalTemplate) {

        (AppState.electricalTemplate.areas || []).forEach(a => {

            (a.topics || []).forEach(t => {

                (t.questions || []).forEach(q => {

                    if (q.type === 'YesNo') {

                        total++;

                        const ans = fd.answers?.[`q_${q.guid}`];

                        if (ans) answered++;

                        if (ans === 'Uygun Değil' || ans === 'Kısmen Uygun') defects++;

                    }

                });

            });

        });

    } else if (String(insp.template_id) === '2202' && fd.grounding) {

        total = (fd.grounding.points || []).length || 1;

        (fd.grounding.points || []).forEach(p => {

            if (p.point && p.zxRx) answered++;

            if (p.result && p.result !== 'Not-1' && p.result !== 'Not-4') defects++;

        });

    } else if (String(insp.template_id) === '2205' && fd.generator) {

        const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);

        total = (schema.visualChecks || []).length || 10;

        (schema.visualChecks || []).forEach((_, idx) => {

            const c = fd.specializedChecks?.[`chk_${idx}`];

            if (c) answered++;

            if (c === 'Uygun Değil') defects++;

        });

    } else {

        total = 10;

        answered = 5;

    }



    const percent = total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 100;

    const unanswered = Math.max(0, total - answered);

    return { total, answered, unanswered, defects, percent };

}



// ============================================================================

// ENLAB v2.7.90 FULL APPLICATION ENGINE (Part A: Core, Normalizers, Navigation, Lists & Work Orders)

// ============================================================================



// ============================================================================

// COMPANY BRANDING & WHITE-LABEL CUSTOMIZATION ENGINE

// ============================================================================

const DEFAULT_COMPANY_BRANDING = {

    companyFullName: 'Mühendislik Muayene ve Periyodik Kontrol Hizmetleri',

    companyShortName: 'Hızlı Rapor',

    companyAddress: 'İstanbul / Türkiye',

    companyPhone: '',

    companyEmail: '',

    companyWeb: '',

    customCompanyLogo: null,

    customTurkakLogo: null,

    showTurkakLogo: true,

    accreditationNo: 'AB-0227-M',

    accreditationStandard: 'TS EN ISO/IEC 17020',

    reportNoPrefix: 'HZL-',

    defaultRevisionInfo: 'REV.00',

    footerDisclaimer: 'Muayene sonuçları sadece talep edilen hizmet veya muayene edilen ürün/parti veya proses ile ilgili olup, başka hizmet veya muayene edilmeyen ürün/ parti veya proses için geçerli değildir. Muayene raporları {COMPANY_NAME} ve müşterinin onayı olmaksızın kısmi olarak veya tamamen kopya edilip çoğaltılamaz. İmzasız raporlar geçersizdir. Bu rapor elektronik ortamda bir nüsha olarak hazırlanmıştır.'

};



const CompanySettingsManager = {

    STORAGE_KEY: 'enlab_company_branding_v3',



    getSettings() {

        try {

            let raw = localStorage.getItem(this.STORAGE_KEY);

            if (!raw) {

                // Check legacy v2 storage and migrate

                const legacy = localStorage.getItem('enlab_company_branding_v2');

                if (legacy) {

                    const parsed = JSON.parse(legacy);

                    if (parsed.companyShortName === 'TEKKOMER' || parsed.companyShortName === 'ENLAB') parsed.companyShortName = 'Hızlı Rapor';

                    if (parsed.companyFullName && parsed.companyFullName.includes('TEKNİK KONTROL MERKEZİ')) {

                        parsed.companyFullName = DEFAULT_COMPANY_BRANDING.companyFullName;

                    }

                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));

                    return { ...DEFAULT_COMPANY_BRANDING, ...parsed };

                }

            } else {

                const parsed = JSON.parse(raw);

                if (parsed.companyShortName === 'TEKKOMER' || parsed.companyShortName === 'ENLAB') parsed.companyShortName = 'Hızlı Rapor';

                return { ...DEFAULT_COMPANY_BRANDING, ...parsed };

            }

        } catch (e) {

            console.error('CompanySettingsManager load error:', e);

        }

        return { ...DEFAULT_COMPANY_BRANDING };

    },



    saveSettings(newSettings) {

        try {

            const current = this.getSettings();

            const merged = { ...current, ...newSettings };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));

            this.syncHeaderTitle();

            return { success: true, message: 'Şirket ve rapor ayarları başarıyla kaydedildi.' };

        } catch (e) {

            console.error('CompanySettingsManager save error:', e);

            return { success: false, message: 'Ayarlar kaydedilemedi: ' + e.message };

        }

    },



    resetToDefault() {

        try {

            localStorage.removeItem(this.STORAGE_KEY);

            localStorage.removeItem('enlab_company_branding_v2');

            this.syncHeaderTitle();

            return { success: true, message: 'Varsayılan şirket ve rapor ayarlarına sıfırlandı.' };

        } catch (e) {

            return { success: false, message: e.message };

        }

    },



    getLogoSrc() {

        const s = this.getSettings();

        if (s.customCompanyLogo) return s.customCompanyLogo;

        return (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.tekkomerLogo) || 'assets/tekkomer_logo.png';

    },



    getTurkakLogoSrc() {

        const s = this.getSettings();

        if (s.customTurkakLogo) return s.customTurkakLogo;

        return (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.turkakLogo) || 'assets/turkak_logo.jpg';

    },



    getCompanyFullName() {

        return this.getSettings().companyFullName || DEFAULT_COMPANY_BRANDING.companyFullName;

    },



    getCompanyShortName() {

        return this.getSettings().companyShortName || DEFAULT_COMPANY_BRANDING.companyShortName;

    },



    getFooterDisclaimer() {

        const s = this.getSettings();

        const base = s.footerDisclaimer || DEFAULT_COMPANY_BRANDING.footerDisclaimer;

        return base.replace(/\{COMPANY_NAME\}/g, s.companyFullName || 'ŞİRKET');

    },



    syncHeaderTitle() {
        const s = this.getSettings();
        const isCustom = s.companyShortName && s.companyShortName !== 'TEKKOMER' && s.companyShortName !== 'ENLAB' && s.companyShortName !== 'Hızlı Rapor';
        const brandName = isCustom ? s.companyShortName : 'Hızlı Rapor';

        // 1. Header Metinleri
        const titleEl = document.getElementById('appHeaderBrandTitle');
        if (titleEl) {
            titleEl.innerText = brandName;
        }
        const subEl = document.getElementById('appHeaderBrandSub');
        if (subEl) {
            subEl.innerText = isCustom ? 'Hızlı Rapor' : 'Saha Kontrol';
        }
        document.title = isCustom ? `${brandName} - Hızlı Rapor` : 'Hızlı Rapor - Saha Muayene & Test';

        // 2. Header Logosu: Şirketin yüklediği logo varsa doğrudan onu göster
        const logoWrapper = document.getElementById('appHeaderLogoWrapper');
        if (logoWrapper) {
            if (s.customCompanyLogo) {
                logoWrapper.innerHTML = `<img src="${s.customCompanyLogo}" alt="${escapeHtml(brandName)}" class="h-full w-full object-contain p-0.5 bg-white rounded-md">`;
                logoWrapper.className = 'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-white border border-slate-600 shadow-2xs';
            } else {
                logoWrapper.innerHTML = `<i class="fa-solid fa-bolt-lightning text-slate-950 text-xs"></i>`;
                logoWrapper.className = 'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-br from-amber-400 to-amber-500 border border-amber-300 text-slate-950 font-black shadow-2xs';
            }
        }

        // 3. Favicon Senkronizasyonu
        try {
            let link = document.querySelector("link[rel*='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            if (s.customCompanyLogo) {
                link.href = s.customCompanyLogo;
            }
        } catch (e) {}

        // 4. Ana Sayfadaki Dinamik Logo ve İsim Alanı
        const homeBrandNameEl = document.getElementById('homeBrandTitleText');
        if (homeBrandNameEl) {
            homeBrandNameEl.innerText = brandName;
        }
        const homeLogoWrapper = document.getElementById('homeBrandLogoWrapper');
        if (homeLogoWrapper) {
            if (s.customCompanyLogo) {
                homeLogoWrapper.innerHTML = `<img src="${s.customCompanyLogo}" alt="${escapeHtml(brandName)}" class="h-10 w-10 object-contain p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">`;
            } else {
                homeLogoWrapper.innerHTML = `<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-2xs border border-amber-300">
                    <i class="fa-solid fa-bolt-lightning text-slate-950"></i>
                </div>`;
            }
        }

    }

};



function compressLogoImage(file, maxDim = 320, callback) {

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        const img = new Image();

        img.onload = function() {

            let w = img.width;

            let h = img.height;

            if (w > maxDim || h > maxDim) {

                if (w > h) {

                    h = Math.round((h * maxDim) / w);

                    w = maxDim;

                } else {

                    w = Math.round((w * maxDim) / h);

                    h = maxDim;

                }

            }

            const canvas = document.createElement('canvas');

            canvas.width = w;

            canvas.height = h;

            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0, w, h);

            const dataUrl = canvas.toDataURL('image/png', 0.92);

            canvas.width = 0;

            canvas.height = 0;

            callback(dataUrl);

        };

        img.src = e.target.result;

    };

    reader.readAsDataURL(file);

}



const AppState = {

    currentRoute: 'home',

    currentParams: {},

    activeTab: '',

    counts: {},

    electricalTemplate: null,

    instruments: [],

    calibrations: [],

    calendarEvents: [],

    workOrdersCache: [],

    inspectionsCache: [],

    currentWorkOrder: null,

    currentInspection: null,

    currentFormData: {},

    activeAreaIndex: 0,

    showAllAreas: false,

    saveTimer: null

};

window.AppState = AppState;



// Normalize DB Work Order row from server.js

function normalizeWorkOrder(w) {

    if (!w) return {};

    let files = [];

    try { files = typeof w.files_json === 'string' ? JSON.parse(w.files_json || '[]') : (w.files || []); } catch (e) {}

    return Object.assign({}, w, {

        work_order_no: w.code || w.work_order_no || `TKM-${w.id}`,

        customer_name: w.company_name || w.customer_name || '',

        customer_branch: w.company_branch || '',

        customer_address: [w.company_branch, w.company_address || w.customer_address].filter(Boolean).join(' - ') || '',

        isg_katip_no: w.isg_katip_no || '',

        sgk_sicil_no: w.sgk_sicil_no || '',

        contact_email: w.contact_email || w.customer_email || '',

        assigned_to: w.inspectors || w.assigned_to || 'Ali Şamil Aytekin',

        planner_name: w.planner || '',

        is_open: w.status === 'Açık' || w.status === 'open',

        files

    });

}



// Normalize DB Inspection row from server.js

function normalizeInspection(i) {

    if (!i) return {};

    let formData = {};

    try {

        formData = typeof i.data_json === 'string' ? JSON.parse(i.data_json || '{}') : (i.form_data || {});

    } catch (e) {}

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    return Object.assign({}, i, {

        work_order_no: i.work_order_code || i.work_order_no || '',

        customer_name: i.company_name || i.customer_name || '',

        inspector_name: i.inspector || i.inspector_name || (curUser ? curUser.fullName : 'Ali Şamil Aytekin'),

        inspector_title: i.inspector_title || (curUser ? curUser.title : 'Elektrik Mühendisi'),

        ministry_reg_no: i.ministry_reg_no || (curUser ? curUser.ministryRegNo : 'K2023224376'),

        diploma_no: i.diploma_no || (curUser ? curUser.diplomaNoDate : '249538 / 28.09.2022'),

        result_status: i.result || i.result_status || 'UYGUN',

        form_data: formData

    });

}



// Initialize Application on Load

window.addEventListener('DOMContentLoaded', async () => {

    await loadInitData();

    await preloadInstruments();

    

    // Auth Check

    const curUser = AuthManager.getCurrentUser();

    updateHeaderUserWidget();

    if (typeof CompanySettingsManager !== 'undefined') {

        CompanySettingsManager.syncHeaderTitle();

    }

    if (!curUser) {

        renderAuthScreen();

    } else {

        navigateTo('home');

        if (curUser.isCloudManaged && navigator.onLine !== false && window.CloudAppSync && typeof window.CloudAppSync.syncNow === 'function') {

            window.CloudAppSync.syncNow({ silent: true });

        }

    }



    document.addEventListener('click', (e) => {

        if (!e.target.closest('#toolsDropdown') && !e.target.closest('[onclick*="toolsDropdown"]')) {

            document.getElementById('toolsDropdown')?.classList.add('hidden');

        }

        if (!e.target.closest('#userDropdown') && !e.target.closest('[onclick*="userDropdown"]')) {

            document.getElementById('userDropdown')?.classList.add('hidden');

        }

        if (!e.target.closest('.row-action-menu') && !e.target.closest('.row-action-btn')) {

            document.querySelectorAll('.row-action-menu').forEach(el => el.classList.add('hidden'));

        }

        if (!e.target.closest('[id^="linyeDropdown_"]') && !e.target.closest('[id^="pt_name_"]')) {

            document.querySelectorAll('[id^="linyeDropdown_"]').forEach(el => el.classList.add('hidden'));

        }

    });

});



async function loadInitData() {

    try {

        const res = await fetch('/api/init');

        const data = await res.json();

        const c = data.counts || {};

        AppState.counts = {

            allWorkOrdersOpen: c.allOpenWO ?? c.allWorkOrdersOpen ?? 52,

            allWorkOrdersClosed: c.allClosedWO ?? 6,

            myWorkOrdersOpen: c.myOpenWO ?? c.myWorkOrdersOpen ?? 31,

            allInspectionsCurrent: c.allActiveInsp ?? c.allInspectionsCurrent ?? 64,

            myInspectionsCurrent: c.myActiveInsp ?? c.myInspectionsCurrent ?? 48,

            toApprovePending: c.toApproveInsp ?? c.toApprovePending ?? 24,

            activeInstruments: c.activeInst ?? c.activeInstruments ?? 14

        };

        if (Array.isArray(data.electricalTemplate)) {

            AppState.electricalTemplate = { areas: data.electricalTemplate };

        } else if (data.electricalTemplate && data.electricalTemplate.areas) {

            AppState.electricalTemplate = data.electricalTemplate;

        }

        AppState.calendarEvents = data.events || data.calendar || [];

        updateSidebarBadges();

    } catch (err) {

        console.error('Init yükleme hatası:', err);

        setSyncStatus(false, 'Çevrimdışı Mod (Yerel Önbellek)');

    }

}



async function preloadInstruments() {

    try {

        const res = await fetch('/api/instruments');

        const data = await res.json();

        AppState.instruments = data.instruments || [];

        AppState.calibrations = data.calibrations || [];

    } catch (e) {}

}



function updateSidebarBadges() {

    const c = AppState.counts;

    const setBadge = (id, val) => {

        const el = document.getElementById(id);

        if (el) el.textContent = val !== undefined ? val : '';

    };

    setBadge('badge-all-wo', c.allWorkOrdersOpen);

    setBadge('badge-my-wo', c.myWorkOrdersOpen);

    setBadge('badge-all-insp', c.allInspectionsCurrent);

    setBadge('badge-my-insp', c.myInspectionsCurrent);

    setBadge('badge-approve-insp', c.toApprovePending);

}



function setSyncStatus(online, text) {

    const badge = document.getElementById('syncBadge');

    const txt = document.getElementById('syncText');

    if (!badge || !txt) return;

    txt.textContent = text;

    badge.className = online

        ? 'flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'

        : 'flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30';

}



// ============================================================================

// UI HELPERS (Sidebar, Dropdowns, Modals, Toast, Android Hardware Back)

// ============================================================================



function toggleSidebar() {

    const sb = document.getElementById('leftSidebar');

    const bd = document.getElementById('sidebarBackdrop');

    if (!sb) return;

    if (window.innerWidth < 1024) {

        const isHidden = sb.classList.contains('hidden');

        if (isHidden) {

            sb.classList.remove('hidden');

            sb.classList.add('flex');

            bd?.classList.remove('hidden');

        } else {

            sb.classList.add('hidden');

            sb.classList.remove('flex');

            bd?.classList.add('hidden');

        }

    } else {

        sb.classList.toggle('lg:flex');

        sb.classList.toggle('lg:hidden');

    }

}



function closeSidebarOnMobile() {

    if (window.innerWidth < 1024) {

        const sb = document.getElementById('leftSidebar');

        const bd = document.getElementById('sidebarBackdrop');

        sb?.classList.add('hidden');

        sb?.classList.remove('flex');

        bd?.classList.add('hidden');

    }

}



// Called by Android Native MainActivity.onBackPressed() / onKeyDown()

let lastHomeBackPressTime = 0;

window.handleAndroidBackButton = function () {

    const emailModal = document.getElementById('reportEmailModal');

    if (emailModal && !emailModal.classList.contains('hidden')) {

        if (typeof closeReportEmailModal === 'function') closeReportEmailModal();
        else emailModal.classList.add('hidden');

        return 'HANDLED';

    }

    const a4Modal = document.getElementById('a4PreviewModal');

    if (a4Modal && !a4Modal.classList.contains('hidden')) {

        closeA4PreviewModal();

        return 'HANDLED';

    }

    const appModal = document.getElementById('appModal');

    if (appModal && !appModal.classList.contains('hidden')) {

        closeModal();

        return 'HANDLED';

    }

    if (AppState.currentRoute === 'inspection-complete') {

        const woId = AppState.currentInspection?.work_order_id || AppState.currentWorkOrder?.id;

        if (woId) {

            navigateTo('work-order-details', { id: woId, tab: 'inspections' });

        } else {

            navigateTo('home');

        }

        return 'HANDLED';

    }

    if (AppState.currentRoute !== 'home') {

        navigateTo('home');

        return 'HANDLED';

    }

    const now = Date.now();

    if (now - lastHomeBackPressTime < 2000) {

        return 'EXIT';

    }

    lastHomeBackPressTime = now;

    showToast('Uygulamadan çıkmak için tekrar geri tuşuna basın', 'info');

    return 'HANDLED';

};



window.addEventListener('popstate', () => {

    window.handleAndroidBackButton();

    try { history.pushState({ enlab: true }, ''); } catch (e) {}

});

try { history.pushState({ enlab: true }, ''); } catch (e) {}



function toggleSubmenu(id) {

    document.getElementById(id)?.classList.toggle('hidden');

}



function toggleDropdown(id) {

    document.getElementById(id)?.classList.toggle('hidden');

}



function toggleRowActionMenu(menuId, event) {

    if (event) event.stopPropagation();

    document.querySelectorAll('.row-action-menu').forEach(el => {

        if (el.id !== menuId) el.classList.add('hidden');

    });

    document.getElementById(menuId)?.classList.toggle('hidden');

}



let toastTimeoutId = null;

function showToast(msg, type = 'success') {

    const toast = document.getElementById('toast');

    const toastMsg = document.getElementById('toastMsg');

    const toastIcon = document.getElementById('toastIcon');

    const toastIconWrapper = document.getElementById('toastIconWrapper');

    if (!toast || !toastMsg) return;



    if (toastTimeoutId) {

        clearTimeout(toastTimeoutId);

        toastTimeoutId = null;

    }



    toastMsg.textContent = msg;



    if (type === 'success') {

        if (toastIconWrapper) toastIconWrapper.className = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-400';

        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-check text-xs sonner-toast-icon-bounce';

    } else if (type === 'warning') {

        if (toastIconWrapper) toastIconWrapper.className = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-400';

        if (toastIcon) toastIcon.className = 'fa-solid fa-triangle-exclamation text-xs sonner-toast-icon-bounce';

    } else if (type === 'error') {

        if (toastIconWrapper) toastIconWrapper.className = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-rose-500/20 text-rose-400';

        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-exclamation text-xs sonner-toast-icon-bounce';

    } else {

        if (toastIconWrapper) toastIconWrapper.className = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-sky-500/20 text-sky-400';

        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-info text-xs sonner-toast-icon-bounce';

    }



    toast.classList.remove('translate-y-32', 'translate-y-24');

    toast.classList.add('sonner-visible');



    toastTimeoutId = setTimeout(() => {

        toast.classList.remove('sonner-visible');

    }, 2800);

}



function openModal(title, bodyHtml, footerHtml = '') {

    document.getElementById('modalTitle').innerHTML = title;

    document.getElementById('modalBody').innerHTML = bodyHtml;

    document.getElementById('modalFooter').innerHTML = footerHtml || `

        <button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs">Kapat</button>

    `;

    document.getElementById('appModal').classList.remove('hidden');

}



function closeModal() {

    document.getElementById('appModal').classList.add('hidden');

}



function openCharPickerModal() {

    const chars = ['Ω', 'kΩ', 'MΩ', 'Δ', 'ΔI', 'IΔn', 'φ', 'cosφ', 'mm²', '≤', '≥', '±', '°C', 'µF', 'mV', 'kA', '√3', '∞'];

    const btns = chars.map(c => `

        <button onclick="navigator.clipboard?.writeText('${c}'); showToast('${c} panoya kopyalandı!')"

            class="p-3 bg-slate-100 hover:bg-sky-100 hover:text-sky-700 border border-slate-300 rounded-lg font-mono font-bold text-base transition">

            ${c}

        </button>

    `).join('');

    openModal(

        '<i class="fa-solid fa-omega mr-2 text-sky-400"></i>Mühendislik Karakter Seçici',

        `<p class="text-xs text-slate-500 mb-3">Rapor yazarken kullanmak istediğiniz sembole tıklayın; otomatik olarak panoya kopyalanır:</p>

         <div class="grid grid-cols-6 gap-2">${btns}</div>`

    );

}



function openUserSettingsModal() {

    const curUser = (typeof AuthManager !== 'undefined' && typeof AuthManager.getCurrentUser === 'function')
        ? AuthManager.getCurrentUser()
        : null;
    const locked = typeof MeasuringDevicesManager !== 'undefined'
        && typeof MeasuringDevicesManager.isCloudManaged === 'function'
        && MeasuringDevicesManager.isCloudManaged();
    const assigned = (typeof MeasuringDevicesManager !== 'undefined' && typeof MeasuringDevicesManager.getAssignedDevices === 'function')
        ? MeasuringDevicesManager.getAssignedDevices()
        : [];
    const defaultTitle = curUser
        ? `${curUser.title || 'Elektrik Mühendisi'}${curUser.emoNo ? ` (EMO: ${curUser.emoNo})` : ''}`
        : 'Elektrik Mühendisi';
    const savedTitle = localStorage.getItem('enlab_eng_title') || defaultTitle;
    const escapeVal = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const assignedSummaryHtml = assigned.length
        ? assigned.map((d, i) => `
            <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <div class="min-w-0 truncate">
                    <span class="font-bold text-slate-800">${i + 1}. ${escapeVal([d.brand, d.model].filter(Boolean).join(' ') || d.reportName || d.category)}</span>
                    ${d.serial ? `<span class="text-[10px] font-mono text-slate-500 ml-1">(${escapeVal(d.serial)})</span>` : ''}
                </div>
                <span class="text-[10px] font-semibold text-emerald-700 shrink-0">${escapeVal(d.category || '')}</span>
            </div>
        `).join('')
        : `<div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">${locked ? 'Yöneticiniz tarafından henüz size ölçüm cihazı atanmadı.' : 'Henüz üzerinize alınmış ölçüm cihazı yok. Havuzdan seçerek raporlara otomatik eklenmesini sağlayabilirsiniz.'}</div>`;

    openModal(

        '<i class="fa-solid fa-sliders mr-2 text-sky-400"></i>Kullanıcı ve Ölçüm Cihazı Ayarları',

        `<div class="space-y-3 text-xs">

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div>

                    <label class="block font-semibold text-slate-600 mb-1">Ad Soyad</label>

                    <input type="text" value="${escapeVal(curUser ? curUser.fullName : 'Aktif Personel')}" class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-semibold" readonly>

                </div>

                <div>

                    <label class="block font-semibold text-slate-600 mb-1">Unvan / Oda Sicil No</label>

                    <input type="text" id="prefEngineerTitle" value="${escapeVal(savedTitle)}" class="w-full border border-slate-300 rounded-lg px-3 py-2">

                </div>

            </div>

            <div class="space-y-2 pt-1 border-t border-slate-100">

                <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-800">Üzerinizdeki Ölçüm Cihazları (${assigned.length})</span>
                    ${locked
                        ? `<span class="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">Yönetici Ataması</span>`
                        : `<button type="button" onclick="closeModal(); openDeviceEditModal(null, { assignByDefault: true, refreshSettings: true });" class="text-[11px] font-bold text-emerald-700 hover:underline">+ Yeni Cihaz Tanımla</button>`
                    }
                </div>

                <div class="space-y-1.5 max-h-40 overflow-y-auto">
                    ${assignedSummaryHtml}
                </div>

                ${locked ? `
                    <button type="button" onclick="window.CloudAppSync && window.CloudAppSync.syncNow();"
                        class="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition">
                        <i class="fa-solid fa-arrows-rotate"></i>
                        <span>Buluttan Cihazları Güncelle</span>
                    </button>
                ` : `
                    <button type="button" onclick="closeModal(); openDeviceCatalogPickerModal('settings_assign');"
                        class="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition">
                        <i class="fa-solid fa-right-left"></i>
                        <span>Ölçüm Cihazlarımı Seç / Değiştir (Havuz)</span>
                    </button>
                `}

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">İptal</button>

         <button onclick="localStorage.setItem('enlab_eng_title', document.getElementById('prefEngineerTitle').value); closeModal(); showToast('Ayarlar kaydedildi');" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs">Kaydet</button>`

    );

}



async function exportLocalBackup() {

    try {

        const backupObj = window.OfflineDB

            ? window.OfflineDB.exportFullBackupObject()

            : await (await fetch('/api/inspections')).json();

        const jsonStr = JSON.stringify(backupObj, null, 2);

        const fileName = `Hizli_Rapor_Yedek_${new Date().toISOString().slice(0, 10)}.json`;



        if (window.AndroidBridge && typeof window.AndroidBridge.shareJsonBackup === 'function') {

            if (typeof window.AndroidBridge.saveDatabase === 'function') {
                window.AndroidBridge.saveDatabase(jsonStr);
            }
            window.AndroidBridge.shareJsonBackup(fileName, jsonStr);

            showToast('Saha yedeği hazırlandı!');

            return;

        }



        const blob = new Blob([jsonStr], { type: 'application/json' });

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;

        a.download = fileName;

        a.click();

        showToast('Tüm saha işleri, notlar ve raporlar JSON olarak indirildi!');

    } catch (e) {

        showToast('Yedekleme sırasında hata oluştu', 'warning');

    }

}



function openImportBackupModal() {

    openModal(

        '<i class="fa-solid fa-upload mr-2 text-amber-400"></i>Saha Yedek Dosyası Geri Yükle (JSON)',

        `<div class="space-y-3 text-xs">

            <p class="text-slate-600">Daha önce telefondan veya bilgisayardan aldığınız <strong>.json</strong> uzantılı Hızlı Rapor saha yedek dosyasını seçerek tüm işleri, notları ve raporları yükleyebilirsiniz:</p>

            <input type="file" accept=".json,application/json" onchange="handleBackupFileImport(this)" class="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50">

        </div>`

    );

}



function handleBackupFileImport(input) {

    const file = input.files && input.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {

        try {

            const parsed = JSON.parse(e.target.result);

            if (window.OfflineDB && window.OfflineDB.importFullBackupObject(parsed)) {

                closeModal();

                await loadInitData();

                navigateTo('home');

                showToast('Saha yedeği başarıyla geri yüklendi!');

            } else {

                showToast('Geçersiz yedek dosyası formatı', 'warning');

            }

        } catch (err) {

            showToast('Dosya okunamadı', 'warning');

        }

    };

    reader.readAsText(file);

}



// ============================================================================

// ROUTER & NAVIGATION

// ============================================================================



async function navigateTo(route, params = {}) {

    // If not logged in and not auth, redirect to auth

    if (!AuthManager.getCurrentUser() && route !== 'auth') {

        return renderAuthScreen();

    }



    AppState.currentRoute = route;

    AppState.currentParams = params;

    updateHeaderUserWidget();



    document.querySelectorAll('.enlab-nav-link, .enlab-subnav-link').forEach(el => el.classList.remove('active'));

    const activeNav = document.getElementById(`nav-${route}`);

    if (activeNav) activeNav.classList.add('active');



    const container = document.getElementById('pageContent');

    if (container) container.scrollTop = 0;

    container.innerHTML = `<div class="flex items-center justify-center py-12 text-slate-400 text-xs"><i class="fa-solid fa-circle-notch fa-spin mr-2 text-sky-600"></i> Yükleniyor...</div>`;



    const dock = document.getElementById('bottomActionDock');

    if (dock && route !== 'inspection-edit') dock.classList.add('hidden');

    if (container && route !== 'inspection-edit') container.classList.remove('pb-24');



    switch (route) {

        case 'home': return renderHome();

        case 'settings': return renderSettingsPage();

        case 'field-notebook': return renderFieldNotebookPage();

        case 'all-work-orders': return renderWorkOrdersPage('all', params.tab || 'open');

        case 'my-work-orders': return renderWorkOrdersPage('my', params.tab || 'open');

        case 'work-order-details': return renderWorkOrderDetails(params.id || '43129', params.tab || 'inspections');

        case 'all-inspections': return renderInspectionsPage('all', params.tab || 'current');

        case 'my-inspections': return renderInspectionsPage('my', params.tab || 'current');

        case 'inspections-to-approve': return renderInspectionsPage('approve', params.tab || 'pending_approval');

        case 'inspection-complete': return renderInspectionEditor(params.id, params.templateId);

        case 'documents': return renderDocumentsPage('internal', params.tab || 'active');

        case 'outsource-documents': return renderDocumentsPage('external', params.tab || 'active');

        case 'quality-record-create': return renderQualityRecordsPage(params.tab || 'create');

        case 'staff-my-details': return renderStaffPage(params.tab || 'profile');

        case 'reference-products': return renderInstrumentsPage(params.tab || 'active');

        case 'instrument-users': return renderInstrumentUsersPage();

        case 'calibrations': return renderCalibrationsPage(params.tab || 'current');

        case 'calendar': return renderCalendarPage(params.tab || 'calendar');

        case 'calendar-create': return renderCalendarPage('create');

        default: return renderHome();

    }

}



// ============================================================================

// 1. HOME PAGE (Çevrimdışı Saha İşleri, Hızlı Rapor Taslağı & Not Defteri)

// ============================================================================



function renderGrayOfflineNotesFolderHtml() {

    let noteCount = 0;

    try {

        if (window.OfflineDB) {

            window.OfflineDB.init();

            noteCount = Array.isArray(window.OfflineDB.state?.quickNotes) ? window.OfflineDB.state.quickNotes.length : 0;

        }

    } catch (e) {}

    return `

        <div onclick="navigateTo('field-notebook')"

            class="p-2.5 rounded-xl bg-slate-200/95 hover:bg-slate-300/80 active:scale-[0.99] border border-slate-300 cursor-pointer flex items-center justify-between gap-2.5 transition shadow-2xs">

            <div class="flex items-center gap-2.5 min-w-0 flex-1">

                <div class="w-9 h-9 rounded-lg bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-2xs">

                    <i class="fa-solid fa-folder text-sm"></i>

                </div>

                <div class="min-w-0 flex-1">

                    <div class="font-bold text-slate-900 text-xs sm:text-sm truncate flex items-center gap-1.5">

                        <span>Offline Not Alma Klasörü</span>

                    </div>

                    <div class="text-[10px] text-slate-600 truncate mt-0.5 font-medium">

                        <i class="fa-solid fa-pen-to-square mr-1 text-slate-500"></i>İnternetsiz saha notları ve tespitler

                    </div>

                </div>

            </div>

            <div class="shrink-0 flex items-center gap-1.5">

                <span class="px-2 py-0.5 rounded-md bg-slate-700 text-white font-bold text-[10px]">

                    ${noteCount} Not · Offline

                </span>

                <i class="fa-solid fa-chevron-right text-slate-500 text-[11px]"></i>

            </div>

        </div>

    `;

}



async function renderHome(opts = {}) {

    const container = document.getElementById('pageContent');

    await loadInitData();



    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    const isManaged = Boolean(curUser && curUser.isCloudManaged);

    const userCloudId = curUser && curUser.cloudId ? String(curUser.cloudId) : '';



    const woRes = await fetch('/api/work-orders');

    const rawWOs = await woRes.json();

    const allJobs = (Array.isArray(rawWOs) ? rawWOs : []).map(normalizeWorkOrder).filter(wo => {

        if (userCloudId && wo.assigned_user_cloud_id) {

            return String(wo.assigned_user_cloud_id) === userCloudId;

        }

        return true;

    });

    AppState.workOrdersCache = allJobs;



    container.innerHTML = `

        <div class="max-w-2xl mx-auto space-y-2 pb-6">
            <!-- 0. UYGULAMA KİMLİĞİ VE DİNAMİK ŞİRKET LOGOSU (HIZLI RAPOR) -->
            <div class="card-craft-white p-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div id="homeBrandLogoWrapper" class="shrink-0">
                        ${(function(){
                            const s = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;
                            const isCust = s.companyShortName && s.companyShortName !== 'TEKKOMER' && s.companyShortName !== 'ENLAB' && s.companyShortName !== 'Hızlı Rapor';
                            const title = isCust ? s.companyShortName : 'Hızlı Rapor';
                            return s.customCompanyLogo ? 
                                `<img src="${s.customCompanyLogo}" alt="${escapeHtml(title)}" class="h-10 w-10 object-contain p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">` : 
                                `<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-2xs border border-amber-300">
                                    <i class="fa-solid fa-bolt-lightning text-slate-950"></i>
                                </div>`;
                        })()}
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <h1 id="homeBrandTitleText" class="font-black text-slate-900 text-sm sm:text-base tracking-tight truncate">${(function(){
                                const s = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;
                                const isCust = s.companyShortName && s.companyShortName !== 'TEKKOMER' && s.companyShortName !== 'ENLAB' && s.companyShortName !== 'Hızlı Rapor';
                                return isCust ? s.companyShortName : 'Hızlı Rapor';
                            })()}</h1>
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">Hızlı Rapor</span>
                        </div>
                        <div class="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span class="truncate">${escapeHtml(((typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings().companyFullName : '') || 'Saha Muayene & Periyodik Kontrol')}</span>
                        </div>
                    </div>
                </div>
                <button onclick="navigateTo('settings')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition border border-slate-200 shrink-0" title="Ayarlar ve Ölçüm Cihazlarım">
                    <i class="fa-solid fa-sliders text-sky-600 text-[11px]"></i>
                    <span class="hidden sm:inline">${isManaged ? 'Ayarlarım' : 'Şirket Ayarları'}</span>
                </button>
            </div>


            <!-- 1. İŞYERİ ARAMA VE YENİLE / YENİ KLASÖR -->

            <div class="flex items-center gap-2 pt-0.5">

                <input type="text" id="homeSearchInput" oninput="filterHomeJobs(this.value)" placeholder="Firma adı, şube veya not ara..."

                    class="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 shadow-2xs">

                ${isManaged ? `
                    <button onclick="window.CloudAppSync && window.CloudAppSync.syncNow()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-300 font-bold text-xs rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm transition" title="Yöneticinin açtığı işleri ve atadığı cihazları internetten çek">

                        <i class="fa-solid fa-arrows-rotate"></i>

                        <span>Yenile</span>

                    </button>
                ` : `
                    <button onclick="openQuickFieldJobModal()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm transition">

                        <i class="fa-solid fa-plus text-emerald-400"></i>

                        <span>Yeni Klasör</span>

                    </button>
                `}

            </div>



            <!-- 2. OFFLINE NOT KLASÖRÜ (GRİ) + İŞ KLASÖRLERİ LİSTESİ -->

            <div id="homeJobsList" class="space-y-2 pt-0.5">

                ${renderGrayOfflineNotesFolderHtml()}

                ${renderMinimalJobCards(allJobs)}

            </div>

        </div>

    `;



    if (typeof CompanySettingsManager !== 'undefined') {

        CompanySettingsManager.syncHeaderTitle();

    }

    updateHeaderUserWidget();

}



function renderMinimalJobCards(jobs) {

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    const isManaged = Boolean(curUser && curUser.isCloudManaged);

    if (!jobs || !jobs.length) {

        return `<div class="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-xs space-y-1.5">
            <div class="font-bold text-slate-700">${isManaged ? 'Size atanmış açık iş klasörü henüz yok' : 'Henüz iş klasörü eklenmedi'}</div>
            <div class="text-[11px] text-slate-400">${isManaged ? 'Firma yöneticiniz internet panelinden iş açtığında burada otomatik görünür. Kontrol etmek için yukarıdaki <strong>Yenile</strong> butonuna dokunun.' : 'Üstteki <strong>"Yeni Klasör"</strong> butonuna dokunabilirsiniz.'}</div>
        </div>`;

    }

    return jobs.map(wo => {

        const notePreview = (wo.field_notes || '').trim();

        const count = wo.actual_inspection_count ?? wo.inspection_count ?? 0;

        const lockedFolder = Boolean(wo.assigned_by_manager || isManaged);

        return `

            <div onclick="navigateTo('work-order-details', {id: '${wo.id}'})"

                class="card-craft-white p-2.5 cursor-pointer flex items-center justify-between gap-2 transition hover:border-slate-300">

                <div class="min-w-0 flex-1">

                    <div class="flex items-center gap-1.5 min-w-0">

                        <span class="font-bold text-slate-900 text-xs sm:text-sm truncate">${wo.customer_name}</span>

                        ${wo.assigned_by_manager ? `<span class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[9px] shrink-0">İş Emri</span>` : ''}

                    </div>

                    ${wo.customer_branch ? `<div class="text-[10px] text-slate-500 truncate mt-0.5">${wo.customer_branch}</div>` : ''}

                    ${notePreview ? `<div class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md px-2 py-0.5 mt-1 truncate"><i class="fa-solid fa-note-sticky mr-1 text-amber-500"></i>${notePreview.replace(/\n/g, ' ')}</div>` : ''}

                </div>

                <div class="shrink-0 flex items-center gap-1">

                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">

                        ${count} Rapor

                    </span>

                    ${lockedFolder ? '' : `
                        <button onclick="deleteWorkOrderHeading('${wo.id}', event, '${(wo.customer_name || 'İş Klasörü').replace(/'/g, "\\'")}')" class="p-1.5 text-slate-400 hover:text-rose-600 active:scale-90 rounded-md transition" title="Klasörü Sil">

                            <i class="fa-solid fa-trash-can text-[11px]"></i>

                        </button>
                    `}

                </div>

            </div>

        `;

    }).join('');

}



// ============================================================================

// GÜVENLİK & ŞİFRELİ SİLME DOĞRULAMA SİSTEMİ

// ============================================================================

function promptSecurityPasswordConfirmation({ title, entityName, message, onConfirmed }) {

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || { fullName: 'Yetkili Personel', password: '123' };

    const modalTitle = `<i class="fa-solid fa-triangle-exclamation text-rose-500 mr-2"></i>${title || 'Silme Onayı'}`;

    const modalBody = `

        <div class="space-y-3 text-xs">

            <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 leading-relaxed">

                <strong>DİKKAT:</strong> <strong>"${entityName || 'Kayıt'}"</strong> kalıcı olarak silinecektir. ${message || 'Bu işlem geri alınamaz.'}

            </div>

            <div class="space-y-1.5 pt-1">

                <label class="block font-bold text-slate-700">

                    Silme işlemini onaylamak için <strong>${curUser.fullName}</strong> hesap şifrenizi girin:

                </label>

                <div class="relative">

                    <input type="password" id="secConfirmPasswordInput" placeholder="Kullanıcı şifreniz"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono pr-10 focus:outline-none focus:border-rose-500 bg-white"

                        onkeydown="if(event.key==='Enter') executeSecurityPasswordCheck()">

                    <button type="button" onclick="togglePasswordVisibility('secConfirmPasswordInput')"

                        class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1">

                        <i class="fa-solid fa-eye text-xs"></i>

                    </button>

                </div>

                <div class="text-[10px] text-slate-400">Şifrenizi "Ayarlar > Profilimi Düzenle" menüsünden değiştirebilirsiniz.</div>

            </div>

        </div>

    `;

    const modalFooter = `

        <button onclick="closeModal()" class="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl active:scale-95 transition">İptal</button>

        <button onclick="executeSecurityPasswordCheck()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl active:scale-95 shadow-sm transition">

            <i class="fa-solid fa-trash-can mr-1.5"></i>Onayla ve Sil

        </button>

    `;

    window._pendingSecurityCallback = onConfirmed;

    window._pendingSecurityExpectedPass = String(curUser.password || '123').trim();

    openModal(modalTitle, modalBody, modalFooter);



    setTimeout(() => {

        const inp = document.getElementById('secConfirmPasswordInput');

        if (inp) inp.focus();

    }, 150);

}



function executeSecurityPasswordCheck() {

    const inp = document.getElementById('secConfirmPasswordInput');

    const entered = inp ? inp.value.trim() : '';

    const expected = window._pendingSecurityExpectedPass || '123';



    if (!entered) {

        showToast('Lütfen silme onay şifrenizi girin!', 'error');

        if (inp) inp.focus();

        return;

    }



    if (entered !== expected) {

        showToast('Hatalı şifre! Silme işlemi iptal edildi.', 'error');

        if (inp) {

            inp.classList.add('border-rose-500', 'bg-rose-50');

            inp.value = '';

            inp.focus();

        }

        return;

    }



    const callback = window._pendingSecurityCallback;

    window._pendingSecurityCallback = null;

    window._pendingSecurityExpectedPass = null;

    closeModal();



    if (typeof callback === 'function') {

        callback();

    }

}



async function deleteWorkOrderHeading(woId, event, folderName) {

    if (event) event.stopPropagation();

    const targetWo = (AppState.workOrdersCache || []).find(w => String(w.id) === String(woId));

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    if ((targetWo && targetWo.assigned_by_manager) || (curUser && curUser.isCloudManaged)) {

        showToast('Yöneticinin açtığı iş klasörü silinemez', 'warning');

        return;

    }

    promptSecurityPasswordConfirmation({

        title: 'İş Klasörünü Sil',

        entityName: folderName || 'İş Klasörü',

        message: 'Bu klasör ve içindeki tüm muayene raporları kalıcı olarak silinecektir.',

        onConfirmed: async () => {

            await fetch(`/api/work-orders/${woId}`, { method: 'DELETE' });

            showToast('İş klasörü ve raporlar silindi');

            await loadInitData();

            navigateTo('home');

        }

    });

}



function filterHomeJobs(query) {

    const q = (query || '').toLowerCase();

    const filtered = (AppState.workOrdersCache || []).filter(w =>

        (w.customer_name || '').toLowerCase().includes(q) ||

        (w.customer_branch || '').toLowerCase().includes(q) ||

        (w.field_notes || '').toLowerCase().includes(q)

    );

    const showOfflineCard = !q || 'offline not alma klasörü saha notları defter'.includes(q);

    const listEl = document.getElementById('homeJobsList');

    if (listEl) {

        listEl.innerHTML = (showOfflineCard ? renderGrayOfflineNotesFolderHtml() : '') + renderMinimalJobCards(filtered);

    }

}



// ============================================================================

// 1B. QUICK FIELD JOB & REPORT TEMPLATE CREATOR

// ============================================================================



