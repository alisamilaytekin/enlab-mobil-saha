// ============================================================================
// ENLAB v2.7.90 FULL APPLICATION ENGINE (Part A: Core, Normalizers, Navigation, Lists & Work Orders)
// ============================================================================

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
    return Object.assign({}, i, {
        work_order_no: i.work_order_code || i.work_order_no || '',
        customer_name: i.company_name || i.customer_name || '',
        inspector_name: i.inspector || i.inspector_name || 'Ali Şamil Aytekin',
        result_status: i.result || i.result_status || 'UYGUN',
        form_data: formData
    });
}

// Initialize Application on Load
window.addEventListener('DOMContentLoaded', async () => {
    await loadInitData();
    await preloadInstruments();
    navigateTo('home');

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

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toastIcon.className = type === 'success'
        ? 'fa-solid fa-circle-check text-emerald-400 text-sm'
        : type === 'warning'
        ? 'fa-solid fa-triangle-exclamation text-amber-400 text-sm'
        : 'fa-solid fa-circle-info text-sky-400 text-sm';
    toast.classList.remove('translate-y-32', 'translate-y-24');
    setTimeout(() => toast.classList.add('translate-y-32'), 2800);
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
    openModal(
        '<i class="fa-solid fa-sliders mr-2 text-sky-400"></i>Kullanıcı ve Saha Ayarları',
        `<div class="space-y-3 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block font-semibold text-slate-600 mb-1">Ad Soyad</label>
                    <input type="text" value="Ali Şamil Aytekin" class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50" readonly>
                </div>
                <div>
                    <label class="block font-semibold text-slate-600 mb-1">Unvan / Oda Sicil No</label>
                    <input type="text" id="prefEngineerTitle" value="${localStorage.getItem('enlab_eng_title') || 'Elektrik Mühendisi (EMO: 64892)'}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
                </div>
            </div>
            <div>
                <label class="block font-semibold text-slate-600 mb-1">Varsayılan Çok Fonksiyonlu Test Cihazı</label>
                <input type="text" id="prefDefaultTester" value="${localStorage.getItem('enlab_def_tester') || 'C.121 - METREL MI 3102 BT (Seri: 21080512)'}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
            </div>
            <div>
                <label class="block font-semibold text-slate-600 mb-1">Varsayılan Termal Kamera</label>
                <input type="text" id="prefDefaultThermal" value="${localStorage.getItem('enlab_def_thermal') || 'C.105 - UNI-T UTi165A (Seri: 1120548)'}" class="w-full border border-slate-300 rounded-lg px-3 py-2">
            </div>
        </div>`,
        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">İptal</button>
         <button onclick="localStorage.setItem('enlab_eng_title', document.getElementById('prefEngineerTitle').value); localStorage.setItem('enlab_def_tester', document.getElementById('prefDefaultTester').value); localStorage.setItem('enlab_def_thermal', document.getElementById('prefDefaultThermal').value); closeModal(); showToast('Ayarlar kaydedildi');" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs">Kaydet</button>`
    );
}

async function exportLocalBackup() {
    try {
        const backupObj = window.OfflineDB
            ? window.OfflineDB.exportFullBackupObject()
            : await (await fetch('/api/inspections')).json();
        const jsonStr = JSON.stringify(backupObj, null, 2);
        const fileName = `ENLAB_Saha_Yedek_${new Date().toISOString().slice(0, 10)}.json`;

        if (window.AndroidBridge && typeof window.AndroidBridge.shareJsonBackup === 'function') {
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
            <p class="text-slate-600">Daha önce telefondan veya bilgisayardan aldığınız <strong>.json</strong> uzantılı ENLAB saha yedek dosyasını seçerek tüm işleri, notları ve raporları yükleyebilirsiniz:</p>
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
    AppState.currentRoute = route;
    AppState.currentParams = params;

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

async function renderHome() {
    const container = document.getElementById('pageContent');
    await loadInitData();

    const woRes = await fetch('/api/work-orders');
    const rawWOs = await woRes.json();
    const allJobs = (Array.isArray(rawWOs) ? rawWOs : []).map(normalizeWorkOrder);
    AppState.workOrdersCache = allJobs;

    container.innerHTML = `
        <div class="max-w-2xl mx-auto space-y-3 pb-8">
            <div class="flex items-center gap-2">
                <input type="text" id="homeSearchInput" oninput="filterHomeJobs(this.value)" placeholder="Başlık veya not ara..."
                    class="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-sky-500">
                <button onclick="openQuickFieldJobModal()" class="px-4 py-2.5 bg-slate-900 active:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shrink-0 flex items-center gap-1.5">
                    <i class="fa-solid fa-plus text-emerald-400"></i>
                    <span>Yeni Başlık</span>
                </button>
            </div>

            <div id="homeJobsList" class="space-y-2.5">
                ${renderMinimalJobCards(allJobs)}
            </div>
        </div>
    `;
}

function renderMinimalJobCards(jobs) {
    if (!jobs || !jobs.length) {
        return `<div class="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">Henüz başlık eklenmedi. Üstteki <strong>"Yeni Başlık"</strong> butonuna dokunun.</div>`;
    }
    return jobs.map(wo => {
        const notePreview = (wo.field_notes || '').trim();
        const count = wo.actual_inspection_count ?? wo.inspection_count ?? 0;
        return `
            <div onclick="navigateTo('work-order-details', {id: '${wo.id}'})"
                class="bg-white rounded-xl border border-slate-200 active:border-sky-500 p-3.5 shadow-2xs cursor-pointer transition flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                    <div class="font-bold text-slate-900 text-sm truncate">${wo.customer_name}</div>
                    ${wo.customer_branch ? `<div class="text-[11px] text-slate-500 truncate mt-0.5">${wo.customer_branch}</div>` : ''}
                    ${notePreview ? `<div class="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1 mt-2 truncate"><i class="fa-solid fa-note-sticky mr-1 text-amber-500"></i>${notePreview.replace(/\n/g, ' ')}</div>` : ''}
                </div>
                <div class="shrink-0 flex items-center gap-1.5">
                    <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                        ${count} Rapor
                    </span>
                    <button onclick="deleteWorkOrderHeading('${wo.id}', event)" class="p-2 text-slate-400 active:text-rose-600 rounded-lg" title="Başlığı Sil">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteWorkOrderHeading(woId, event) {
    if (event) event.stopPropagation();
    if (!confirm('Bu başlığı ve içindeki raporları silmek istediğinize emin misiniz?')) return;
    await fetch(`/api/work-orders/${woId}`, { method: 'DELETE' });
    showToast('Başlık silindi');
    navigateTo('home');
}

function filterHomeJobs(query) {
    const q = (query || '').toLowerCase();
    const filtered = (AppState.workOrdersCache || []).filter(w =>
        (w.customer_name || '').toLowerCase().includes(q) ||
        (w.customer_branch || '').toLowerCase().includes(q) ||
        (w.field_notes || '').toLowerCase().includes(q)
    );
    const listEl = document.getElementById('homeJobsList');
    if (listEl) listEl.innerHTML = renderMinimalJobCards(filtered);
}

// ============================================================================
// 1B. QUICK FIELD JOB & REPORT TEMPLATE CREATOR
// ============================================================================

function openQuickFieldJobModal() {
    const templates = window.ENLAB_REPORT_TEMPLATES || [];
    const tplCheckboxes = templates.map((t) => `
        <label class="quick-tpl-item flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-sky-500 cursor-pointer transition-all shadow-2xs">
            <div class="flex items-center gap-3 min-w-0">
                <input type="checkbox" name="quickJobTpl" value="${t.id}" checked class="w-5 h-5 accent-sky-600 rounded shrink-0">
                <div class="min-w-0">
                    <div class="font-bold text-slate-900 text-xs truncate">${t.name}</div>
                    <div class="text-[10px] text-slate-500 font-mono">${t.code}</div>
                </div>
            </div>
            <span class="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded shrink-0">
                ${t.code}
            </span>
        </label>
    `).join('');

    openModal(
        'Yeni İşyeri / Saha Klasörü Aç',
        `<div class="space-y-3 text-xs">
            <div>
                <label class="block font-bold text-slate-800 mb-1">İşyeri / Firma Adı *</label>
                <input type="text" id="qjCompanyName" placeholder="Örn: Teknosa Manisa Soma"
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:border-sky-500 focus:outline-none">
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Adres / Şube (İsteğe Bağlı)</label>
                <input type="text" id="qjAddress" placeholder="Örn: Kurtuluş Mah. Fatih Cad. No:3 Soma"
                    class="w-full border border-slate-300 rounded-lg px-3 py-2">
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Notlar (İsteğe Bağlı)</label>
                <textarea id="qjFieldNotes" rows="2" placeholder="Kısa saha notunuz..."
                    class="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:border-sky-500 focus:outline-none"></textarea>
            </div>
            <div>
                <div class="flex items-center justify-between gap-2 mb-1.5">
                    <label class="font-bold text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-bolt text-amber-500"></i>
                        <span>Oluşturulacak Elektrik Raporları</span>
                    </label>
                    <span class="text-[10px] text-slate-400">İstediğinizi seçin</span>
                </div>
                <div id="qjTemplatesGrid" class="space-y-2 p-2 border border-slate-200 rounded-xl bg-slate-50">
                    ${tplCheckboxes}
                </div>
            </div>
        </div>`,
        `<button onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">İptal</button>
         <button onclick="submitQuickFieldJob(false)" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-2xs">
            <i class="fa-solid fa-folder-plus"></i>
            <span>Klasörü ve Raporları Oluştur</span>
         </button>`
    );
    setTimeout(() => document.getElementById('qjCompanyName')?.focus(), 100);
}

function filterQuickJobTemplates(query) {
    const q = (query || '').toLowerCase();
    document.querySelectorAll('.quick-tpl-item').forEach(el => {
        const s = el.getAttribute('data-search') || '';
        el.style.display = s.includes(q) ? '' : 'none';
    });
}

async function submitQuickFieldJob(openFirstReportDirectly = false) {
    const nameInput = document.getElementById('qjCompanyName');
    const rawName = (nameInput?.value || '').trim();
    if (!rawName) {
        showToast('Lütfen başlık adını yazın', 'warning');
        nameInput?.focus();
        return;
    }

    const address = (document.getElementById('qjAddress')?.value || '').trim();
    const fieldNotes = (document.getElementById('qjFieldNotes')?.value || '').trim();
    const checkedTpls = Array.from(document.querySelectorAll('input[name="quickJobTpl"]:checked')).map(cb => cb.value);

    const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            company_name: rawName,
            company_branch: address,
            company_address: address,
            field_notes: fieldNotes,
            initial_templates: checkedTpls
        })
    });
    const data = await res.json();
    closeModal();
    await loadInitData();
    navigateTo('work-order-details', { id: data.id });
}

async function renderFieldNotebookPage() {
    const container = document.getElementById('pageContent');
    const [woRes, notesRes] = await Promise.all([
        fetch('/api/work-orders'),
        fetch('/api/quick-notes')
    ]);
    const wos = (await woRes.json()).map(normalizeWorkOrder);
    const quickNotes = await notesRes.json();

    const jobOptions = wos.map(w => `<option value="${w.id}" data-name="${w.customer_name}">${w.customer_name} (${w.work_order_no})</option>`).join('');

    const quickNotesHtml = (quickNotes || []).map(n => `
        <div class="bg-amber-50/70 rounded-xl border border-amber-200 p-4 space-y-2.5 shadow-2xs">
            <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 class="font-black text-slate-900 text-sm">${n.title || 'Saha Notu'}</h3>
                    <div class="text-[11px] text-amber-800 font-semibold">${n.job_name || 'Genel Saha Notu'} · <span class="font-mono">${n.updated_at || ''}</span></div>
                </div>
                <div class="flex items-center gap-1.5">
                    ${n.work_order_id ? `
                        <button onclick="navigateTo('work-order-details', {id: '${n.work_order_id}', tab: 'inspections'})" class="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold">
                            İşe Git →
                        </button>
                    ` : ''}
                    <button onclick="convertQuickNoteToJob(${n.id})" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold" title="Bu nottan yeni iş ve rapor taslağı oluştur">
                        <i class="fa-solid fa-file-circle-plus mr-1"></i>Rapor Taslağına Dönüştür
                    </button>
                    <button onclick="deleteQuickNote(${n.id})" class="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[11px] font-bold">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <textarea rows="4" oninput="updateExistingQuickNote(${n.id}, this.value)"
                class="w-full border border-amber-300 bg-white rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:border-sky-500 focus:outline-none">${n.content || ''}</textarea>
        </div>
    `).join('');

    const jobsWithNotesHtml = wos.slice(0, 10).map(w => `
        <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-2 shadow-2xs">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <span class="font-mono text-[11px] font-bold text-sky-700">${w.work_order_no}</span>
                    <h4 class="font-bold text-slate-900 text-xs sm:text-sm">${w.customer_name} ${w.customer_branch ? `- ${w.customer_branch}` : ''}</h4>
                </div>
                <button onclick="navigateTo('work-order-details', {id: '${w.id}', tab: 'inspections'})" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold">
                    İşi & Raporları Aç (${w.actual_inspection_count ?? 0}) →
                </button>
            </div>
            <textarea rows="3" placeholder="Bu işe ait saha notlarınızı buraya yazın (Otomatik kaydedilir)..."
                oninput="saveWorkOrderNotesRealtime('${w.id}', this.value)"
                class="w-full border border-slate-300 bg-amber-50/30 rounded-lg p-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none">${w.field_notes || ''}</textarea>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
                <div class="text-[11px] text-amber-600 font-bold uppercase tracking-wider">Çevrimdışı Saha Not Defteri (Offline)</div>
                <h1 class="text-lg font-black text-slate-900 flex items-center gap-2">
                    <i class="fa-solid fa-book-open text-amber-500"></i> Saha Not Defterim & Hızlı Tespitler
                </h1>
                <p class="text-xs text-slate-500 mt-0.5">İnternetin çekmediği yerlerde (Teknosa vb.) aldığınız tüm notlar anında cihaz hafızasına kaydedilir ve istediğiniz zaman resmi A4 rapora aktarılır.</p>
            </div>
            <button onclick="openQuickFieldJobModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> + Yeni İş & Rapor Taslağı Aç
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <!-- Left: Add New Standalone Note + Quick Notes List -->
            <div class="lg:col-span-6 space-y-4">
                <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div class="px-4 py-3 bg-slate-900 text-white font-bold text-xs uppercase flex items-center justify-between">
                        <span><i class="fa-solid fa-pen-clip text-amber-400 mr-2"></i>Yeni Hızlı Saha Notu Ekle</span>
                        <span class="text-[10px] text-emerald-400">Otomatik Cihaz Kaydı</span>
                    </div>
                    <div class="p-4 space-y-3 text-xs">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">Not Başlığı / Mahal</label>
                                <input type="text" id="newNoteTitle" placeholder="Örn: Teknosa Bodrum Ana Pano Ölçümleri"
                                    class="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">İlgili İş (Opsiyonel)</label>
                                <select id="newNoteWoSelect" class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">
                                    <option value="">-- Genel / Bağımsız Not --</option>
                                    ${jobOptions}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Saha Notu İçeriği</label>
                            <textarea id="newNoteContent" rows="4" placeholder="Panolar, kablo kesitleri, topraklama dirençleri, eksiklikler..."
                                class="w-full border border-slate-300 rounded-lg p-3 font-medium focus:border-sky-500 focus:outline-none"></textarea>
                        </div>
                        <div class="flex justify-end">
                            <button onclick="createNewQuickNote()" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow-xs flex items-center gap-1.5">
                                <i class="fa-solid fa-floppy-disk"></i> Notu Kaydet
                            </button>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <h2 class="font-bold text-xs uppercase text-slate-500 px-1">Kayıtlı Hızlı Notlarım (${quickNotes.length})</h2>
                    ${quickNotesHtml || '<div class="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">Henüz bağımsız hızlı not eklenmemiş.</div>'}
                </div>
            </div>

            <!-- Right: Per-Job Notebook Cards -->
            <div class="lg:col-span-6 space-y-3">
                <h2 class="font-bold text-xs uppercase text-slate-500 px-1">İşlere Ait Saha Not Defterleri</h2>
                ${jobsWithNotesHtml}
            </div>
        </div>
    `;
}

async function createNewQuickNote() {
    const title = (document.getElementById('newNoteTitle')?.value || '').trim() || 'Saha Tespit Notu';
    const content = (document.getElementById('newNoteContent')?.value || '').trim();
    const sel = document.getElementById('newNoteWoSelect');
    const woId = sel?.value || null;
    const jobName = woId ? sel.options[sel.selectedIndex].getAttribute('data-name') : 'Genel Saha Notu';

    if (!content) {
        showToast('Lütfen not içeriği yazınız', 'warning');
        return;
    }
    await fetch('/api/quick-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, work_order_id: woId, job_name: jobName })
    });
    showToast('Saha notu kaydedildi!');
    renderFieldNotebookPage();
}

let quickNoteTimer = null;
function updateExistingQuickNote(noteId, newContent) {
    clearTimeout(quickNoteTimer);
    quickNoteTimer = setTimeout(async () => {
        await fetch('/api/quick-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: noteId, content: newContent })
        });
    }, 350);
}

async function deleteQuickNote(noteId) {
    await fetch(`/api/quick-notes/${noteId}`, { method: 'DELETE' });
    showToast('Not silindi');
    renderFieldNotebookPage();
}

async function convertQuickNoteToJob(noteId) {
    const res = await fetch('/api/quick-notes');
    const notes = await res.json();
    const note = notes.find(n => String(n.id) === String(noteId));
    if (!note) return;
    openQuickFieldJobModal();
    setTimeout(() => {
        const compEl = document.getElementById('qjCompanyName');
        const notesEl = document.getElementById('qjFieldNotes');
        if (compEl) compEl.value = note.title || 'Yeni Saha İşi';
        if (notesEl) notesEl.value = note.content || '';
    }, 120);
}

let woNoteSaveTimer = null;
function saveWorkOrderNotesRealtime(woId, notesText) {
    if (AppState.currentWorkOrder && String(AppState.currentWorkOrder.id) === String(woId)) {
        AppState.currentWorkOrder.field_notes = notesText;
    }
    const statusEl = document.getElementById(`woNoteSaveStatus_${woId}`);
    if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-rotate fa-spin mr-1"></i>Kaydediliyor...`;
    clearTimeout(woNoteSaveTimer);
    woNoteSaveTimer = setTimeout(async () => {
        await fetch(`/api/work-orders/${woId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field_notes: notesText })
        });
        if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-check-double text-emerald-600 mr-1"></i>Not Defterine Kaydedildi`;
    }, 300);
}

function appendQuickSnippetToJobNotes(woId, snippet) {
    const ta = document.getElementById(`woFieldNotesTextarea_${woId}`);
    if (!ta) return;
    const prefix = ta.value && !ta.value.endsWith('\n') ? '\n' : '';
    ta.value = ta.value + prefix + snippet;
    saveWorkOrderNotesRealtime(woId, ta.value);
    ta.focus();
}

// ============================================================================
// 2. WORK ORDERS LIST PAGES (Tüm İş Emirleri & Benim İş Emirlerim)
//    Tabs: Açık İş Emirleri | Kapanmış İş Emirleri
// ============================================================================

async function renderWorkOrdersPage(scope = 'all', tab = 'open') {
    AppState.activeTab = tab;
    const container = document.getElementById('pageContent');
    const pageTitle = scope === 'my' ? 'Benim İş Emirlerim' : 'Tüm İş Emirleri';
    const routeName = scope === 'my' ? 'my-work-orders' : 'all-work-orders';

    const res = await fetch('/api/work-orders');
    const rawList = await res.json();
    const allNormalized = (Array.isArray(rawList) ? rawList : (rawList.workOrders || [])).map(normalizeWorkOrder);

    const openList = allNormalized.filter(w => (scope === 'my' ? w.is_mine == 1 : true) && w.is_open);
    const closedList = allNormalized.filter(w => (scope === 'my' ? w.is_mine == 1 : true) && !w.is_open);
    AppState.workOrdersCache = tab === 'open' ? openList : closedList;

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div class="text-[11px] text-slate-400 font-semibold uppercase">Muayene / ${pageTitle}</div>
                    <h1 class="text-lg font-bold text-slate-800">${pageTitle}</h1>
                </div>
                <div class="flex items-center gap-2">
                    <input type="text" id="woSearchInput" oninput="filterWorkOrdersTable()" placeholder="İş emri no, müşteri, şube veya teklif ara..."
                        class="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-sky-500">
                    <button onclick="openNewWorkOrderModal()" class="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5">
                        <i class="fa-solid fa-plus"></i> Yeni İş Emri Ekle
                    </button>
                </div>
            </div>

            <!-- Authentic ENLAB Tabs: Açık / Kapanmış -->
            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto">
                <button onclick="navigateTo('${routeName}', {tab: 'open'})" class="enlab-tab-btn ${tab === 'open' ? 'active' : ''}">
                    <i class="fa-solid fa-folder-open text-sky-600"></i>
                    <span>Açık İş Emirleri (${openList.length})</span>
                </button>
                <button onclick="navigateTo('${routeName}', {tab: 'closed'})" class="enlab-tab-btn ${tab === 'closed' ? 'active' : ''}">
                    <i class="fa-solid fa-folder-closed text-slate-500"></i>
                    <span>Kapanmış İş Emirleri (${closedList.length})</span>
                </button>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <th class="py-3 px-4">İş Emri Kodu</th>
                            <th class="py-3 px-4">Müşteri Firma</th>
                            <th class="py-3 px-4">Şube / Muayene Adresi</th>
                            <th class="py-3 px-4">Başlangıç Tarihi</th>
                            <th class="py-3 px-4">Görevli Uzmanlar</th>
                            <th class="py-3 px-4">Durum</th>
                            <th class="py-3 px-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody id="woTableBody" class="divide-y divide-slate-100 text-xs">
                        ${renderWorkOrderRows(AppState.workOrdersCache)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderWorkOrderRows(list) {
    if (!list.length) {
        return `<tr><td colspan="7" class="p-8 text-center text-slate-400">Bu sekmede kayıtlı iş emri bulunamadı.</td></tr>`;
    }
    return list.map(wo => `
        <tr class="hover:bg-sky-50/50 transition">
            <td class="py-3 px-4 font-mono font-bold text-sky-700">
                <a href="javascript:void(0)" onclick="navigateTo('work-order-details', {id: '${wo.id}', tab: 'inspections'})" class="hover:underline">
                    ${wo.work_order_no}
                </a>
            </td>
            <td class="py-3 px-4 font-bold text-slate-800">${wo.customer_name}</td>
            <td class="py-3 px-4 text-slate-600">${wo.customer_address || '-'}</td>
            <td class="py-3 px-4 font-mono text-slate-600">${wo.start_date || '-'}</td>
            <td class="py-3 px-4 text-slate-600">${wo.assigned_to || 'Ali Şamil Aytekin'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${wo.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
                    ${wo.is_open ? 'Açık' : 'Kapanmış'}
                </span>
            </td>
            <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                <button onclick="navigateTo('work-order-details', {id: '${wo.id}', tab: 'info'})" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold">
                    Detaylar
                </button>
                <button onclick="navigateTo('work-order-details', {id: '${wo.id}', tab: 'inspections'})" class="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-semibold">
                    <i class="fa-solid fa-list-check mr-1"></i>Muayeneler & Raporlar
                </button>
            </td>
        </tr>
    `).join('');
}

function filterWorkOrdersTable() {
    const q = (document.getElementById('woSearchInput')?.value || '').toLowerCase();
    const filtered = AppState.workOrdersCache.filter(w =>
        (w.work_order_no || '').toLowerCase().includes(q) ||
        (w.customer_name || '').toLowerCase().includes(q) ||
        (w.customer_address || '').toLowerCase().includes(q) ||
        (w.proposal_no || '').toLowerCase().includes(q)
    );
    const tbody = document.getElementById('woTableBody');
    if (tbody) tbody.innerHTML = renderWorkOrderRows(filtered);
}

function openNewWorkOrderModal() {
    openModal(
        '<i class="fa-solid fa-folder-plus mr-2 text-sky-400"></i>Yeni İş Emri Oluştur',
        `<div class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">İş Emri Kodu</label>
                    <input type="text" id="newWoNo" value="TKM-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100+Math.random()*900)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Teklif No</label>
                    <input type="text" id="newWoProposal" value="TKM-TKL-2026-${Math.floor(100+Math.random()*900)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono">
                </div>
            </div>
            <div>
                <label class="block font-semibold text-slate-700 mb-1">Müşteri Firma Ünvanı</label>
                <input type="text" id="newWoCustomer" placeholder="Örn: TEKNOSA İÇ VE DIŞ TİCARET A.Ş." class="w-full border border-slate-300 rounded-lg px-3 py-2">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Şube / Tesis Adı</label>
                    <input type="text" id="newWoBranch" placeholder="Örn: Manisa Soma Şubesi" class="w-full border border-slate-300 rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Muayene Adresi</label>
                    <input type="text" id="newWoAddress" placeholder="Kurtuluş Mah. Fatih Cad..." class="w-full border border-slate-300 rounded-lg px-3 py-2">
                </div>
            </div>
        </div>`,
        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">İptal</button>
         <button onclick="submitNewWorkOrder()" class="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs">İş Emrini Oluştur ve Aç</button>`
    );
}

async function submitNewWorkOrder() {
    const payload = {
        code: document.getElementById('newWoNo').value.trim(),
        proposal_no: document.getElementById('newWoProposal').value.trim(),
        company_name: document.getElementById('newWoCustomer').value.trim() || 'YENİ MÜŞTERİ FİRMA A.Ş.',
        company_branch: document.getElementById('newWoBranch').value.trim() || 'Merkez Tesis',
        company_address: document.getElementById('newWoAddress').value.trim() || 'Saha Adresi'
    };
    const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    closeModal();
    await loadInitData();
    showToast('Yeni İş Emri oluşturuldu!');
    navigateTo('work-order-details', { id: data.id, tab: 'inspections' });
}

// ============================================================================
// 3. WORK ORDER DETAILS (/Inspection/WorkOrder/Details/:id)
//    Tabs: 1. İş Emri Bilgileri | 2. Muayeneler | 3. Dosyalar
// ============================================================================

async function renderWorkOrderDetails(workOrderId) {
    const container = document.getElementById('pageContent');
    const res = await fetch(`/api/work-orders/${workOrderId}`);
    const data = await res.json();
    const wo = normalizeWorkOrder(data.workOrder || { id: workOrderId, code: `TKM-${workOrderId}` });
    let inspections = (data.inspections || []).map(normalizeInspection);

    if (String(workOrderId) === '43129') {
        const teknosaItems = inspections.filter(i => (i.customer_name || '').includes('TEKNOSA') || Number(i.id) >= 500000);
        if (teknosaItems.length > 0) inspections = teknosaItems;
    }

    AppState.currentWorkOrder = wo;
    AppState.inspectionsCache = inspections;

    container.innerHTML = `
        <div class="max-w-2xl mx-auto space-y-3 pb-8">
            <!-- HEADER -->
            <div class="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                    <button onclick="navigateTo('home')" class="px-2.5 py-1.5 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs shrink-0">
                        <i class="fa-solid fa-arrow-left mr-1"></i>Geri
                    </button>
                    <div class="min-w-0">
                        <h1 class="font-bold text-slate-900 text-sm sm:text-base truncate">${wo.customer_name}</h1>
                        ${wo.customer_branch ? `<div class="text-[11px] text-slate-500 truncate">${wo.customer_branch}</div>` : ''}
                    </div>
                </div>
                <button onclick="deleteWorkOrderHeading('${wo.id}', event)" class="px-2.5 py-1.5 bg-rose-50 active:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs shrink-0">
                    <i class="fa-solid fa-trash-can mr-1"></i>Sil
                </button>
            </div>

            <!-- NOT DEFTERİ -->
            <div class="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
                <div class="flex items-center justify-between">
                    <label class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-note-sticky text-amber-500"></i>
                        <span>Notlar</span>
                    </label>
                    <span id="woNoteSaveStatus_${wo.id}" class="text-[11px] text-slate-400">Otomatik kaydedilir</span>
                </div>
                <textarea id="woFieldNotesTextarea_${wo.id}" rows="4"
                    oninput="saveWorkOrderNotesRealtime('${wo.id}', this.value)"
                    placeholder="Saha notlarınızı buraya yazın..."
                    class="w-full border border-slate-200 bg-amber-50/30 rounded-lg p-2.5 text-xs sm:text-sm text-slate-900 focus:border-amber-400 focus:outline-none">${wo.field_notes || ''}</textarea>
            </div>

            <!-- RAPORLAR -->
            <div class="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3">
                <div class="flex items-center justify-between gap-2">
                    <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-file-lines text-sky-600"></i>
                        <span>Rapor Taslakları (${inspections.length})</span>
                    </div>
                    <button onclick="openAddInspectionModal('${wo.id}')" class="px-3 py-1.5 bg-emerald-500 active:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1">
                        <i class="fa-solid fa-plus"></i>
                        <span>Rapor Ekle</span>
                    </button>
                </div>

                <div id="woInspectionsTableBody" class="space-y-2">
                    ${renderWoInspectionRows(inspections, wo.id)}
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeForJs(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function renderWoInspectionRows(list, workOrderId) {
    if (!list.length) {
        return `<div class="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">Henüz rapor eklenmedi. <strong>"+ Rapor Ekle"</strong> butonuna dokunun.</div>`;
    }
    return list.map(item => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 hover:border-slate-300 transition">
            <div onclick="navigateTo('inspection-complete', {id: '${item.id}', templateId: '${item.template_id}'})" class="min-w-0 flex-1 cursor-pointer">
                <div class="flex items-center gap-1.5">
                    <span class="font-bold text-slate-900 text-xs sm:text-sm truncate">${escapeHtml(item.equipment_name || 'İsimsiz Rapor')}</span>
                    <button onclick="event.stopPropagation(); openRenameInspectionModal('${item.id}', '${escapeForJs(item.equipment_name || '')}', '${workOrderId}')"
                        class="p-1 text-slate-400 hover:text-sky-600 rounded shrink-0 transition" title="Rapor İsmini Değiştir">
                        <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                    </button>
                </div>
                <div class="text-[11px] text-slate-500 font-mono truncate mt-0.5">${item.template_code || 'TKM-FR.318'} · ${item.serial_no || 'Saha'}</div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="navigateTo('inspection-complete', {id: '${item.id}', templateId: '${item.template_id}'})"
                    class="px-3 py-2 bg-sky-600 active:bg-sky-700 text-white font-bold rounded-lg text-xs">
                    Doldur
                </button>
                <button onclick="quickPreviewReportFromList('${item.id}')"
                    class="px-3 py-2 bg-slate-900 active:bg-slate-800 text-amber-400 font-bold rounded-lg text-xs flex items-center gap-1">
                    <i class="fa-solid fa-file-pdf"></i>
                    <span>PDF</span>
                </button>
                <button onclick="deleteInspectionItem('${item.id}', '${workOrderId}')"
                    class="p-2 text-slate-400 hover:text-rose-600 text-xs" title="Sil">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openRenameInspectionModal(inspectionId, currentName, workOrderId) {
    openModal(
        '<i class="fa-solid fa-pen-to-square mr-2 text-sky-500"></i>Rapor Adını Düzenle',
        `<div class="space-y-3 text-xs">
            <div>
                <label class="block font-bold text-slate-700 mb-1">Rapor / Ekipman Adı</label>
                <input type="text" id="renameInspectionInput" value="${escapeHtml(currentName || '')}"
                    placeholder=""
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none">
                <p class="text-[11px] text-slate-500 mt-1">Bu isim iş emri listesinde ve resmi A4 PDF çıktısında rapor başlığı olarak yer alır.</p>
            </div>
        </div>`,
        `<button onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">İptal</button>
         <button onclick="submitRenameInspection('${inspectionId}', '${workOrderId}')" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-bold text-xs">Kaydet</button>`
    );
    setTimeout(() => {
        const inp = document.getElementById('renameInspectionInput');
        if (inp) { inp.focus(); inp.select(); }
    }, 120);
}

async function submitRenameInspection(inspectionId, workOrderId) {
    const input = document.getElementById('renameInspectionInput');
    const newName = (input?.value || '').trim();
    if (!newName) {
        showToast('Lütfen geçerli bir rapor adı yazın', 'warning');
        return;
    }

    const item = AppState.inspectionsCache.find(x => String(x.id) === String(inspectionId));
    if (item) item.equipment_name = newName;

    if (AppState.currentInspection && String(AppState.currentInspection.id) === String(inspectionId)) {
        AppState.currentInspection.equipment_name = newName;
        if (AppState.currentFormData) {
            if (!AppState.currentFormData.companyInfo) AppState.currentFormData.companyInfo = {};
            AppState.currentFormData.companyInfo.equipmentName = newName;
        }
    }

    try {
        await fetch(`/api/inspections/${inspectionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ equipment_name: newName })
        });
    } catch (e) {
        console.error(e);
    }

    closeModal();
    showToast(`Rapor adı "${newName}" olarak güncellendi`);
    await loadInitData();
    if (workOrderId && (AppState.currentPage === 'work-order-details' || AppState.currentRoute === 'work-order-details')) {
        renderWorkOrderDetails(workOrderId, 'inspections');
    } else if (AppState.currentPage === 'inspection-complete') {
        paintInspectionEditorUI();
    }
}

async function quickPreviewReportFromList(inspectionId) {
    await renderInspectionEditor(inspectionId);
    setTimeout(() => printOfficialReport(false), 80);
}

function filterWoInspections() {
    const q = (document.getElementById('woInspFilterInput')?.value || '').toLowerCase();
    const filtered = AppState.inspectionsCache.filter(i =>
        (i.equipment_name || '').toLowerCase().includes(q) ||
        (i.report_no || '').toLowerCase().includes(q)
    );
    const tbody = document.getElementById('woInspectionsTableBody');
    if (tbody && AppState.currentWorkOrder) {
        tbody.innerHTML = renderWoInspectionRows(filtered, AppState.currentWorkOrder.id);
    }
}

function openStartInspectionModal(inspectionId) {
    const item = AppState.inspectionsCache.find(x => String(x.id) === String(inspectionId)) || {
        id: inspectionId,
        equipment_name: 'Muayene Kalemi',
        template_id: '2201'
    };

    const optionsHtml = (window.ENLAB_REPORT_TEMPLATES || []).map(t => `
        <option value="${t.id}" ${String(t.id) === String(item.template_id) ? 'selected' : ''}>
            ${t.code} - ${t.name} (${t.category})
        </option>
    `).join('');

    openModal(
        '<i class="fa-solid fa-play-circle mr-2 text-amber-400"></i>Muayene İşlemine Başla',
        `<div class="space-y-4 text-xs">
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-slate-500">Seçili Ekipman / Muayene Kalemi:</div>
                <div class="font-bold text-slate-900 text-sm mt-0.5">${item.equipment_name}</div>
                <div class="text-slate-500 font-mono mt-0.5">Rapor No: ${item.report_no || 'Otomatik Atanacak'}</div>
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1.5">Rapor Şablonu Seçiniz (ENLAB / TKM Formu):</label>
                <select id="startModalTemplateSelect" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold bg-white focus:border-sky-500 focus:outline-none">
                    ${optionsHtml}
                </select>
                <p class="text-[11px] text-slate-500 mt-1.5">
                    <i class="fa-solid fa-circle-info text-sky-600 mr-1"></i>Seçtiğiniz şablona göre ilgili teknik ölçüm tabloları, gözle kontrol soruları ve mevzuat kriterleri yüklenecektir.
                </p>
            </div>
        </div>`,
        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">İptal</button>
         <button onclick="const tid = document.getElementById('startModalTemplateSelect').value; closeModal(); navigateTo('inspection-complete', {id: '${item.id}', templateId: tid});"
            class="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs">
            <i class="fa-solid fa-arrow-right mr-1"></i> Başla ve Raporu Aç
         </button>`
    );
}

function openAddInspectionModal(workOrderId) {
    const optionsHtml = (window.ENLAB_REPORT_TEMPLATES || []).map(t => `
        <option value="${t.id}" data-code="${t.code}" data-name="${t.name}">
            ${t.name} (${t.code})
        </option>
    `).join('');

    openModal(
        'Rapor Örneği Ekle',
        `<div class="space-y-3 text-xs">
            <div>
                <label class="block font-bold text-slate-700 mb-1">Rapor Taslağı Seçin</label>
                <select id="newInspTemplate" onchange="const sel=this.options[this.selectedIndex]; document.getElementById('newInspEqName').value = sel.getAttribute('data-name').replace(' Muayene Raporu','');"
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold bg-white">
                    ${optionsHtml}
                </select>
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Rapor / Ekipman Adı</label>
                <input type="text" id="newInspEqName" value="Elektrik İç Tesisatı" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold">
            </div>
            <div class="grid grid-cols-2 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Bölge / Mahal</label>
                    <input type="text" id="newInspLocation" value="" placeholder="Örn: Ana Pano Odası" class="w-full border border-slate-300 rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Seri No / Kod</label>
                    <input type="text" id="newInspSerial" value="" placeholder="Örn: ADP-01" class="w-full border border-slate-300 rounded-lg px-3 py-2">
                </div>
            </div>
        </div>`,
        `<button onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">İptal</button>
         <button onclick="submitNewInspection('${workOrderId}')" class="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs">Ekle ve Aç</button>`
    );
}

async function submitNewInspection(workOrderId) {
    const sel = document.getElementById('newInspTemplate');
    const templateId = sel.value;
    const templateCode = sel.options[sel.selectedIndex].getAttribute('data-code') || 'TKM-FR.318';
    const eqName = document.getElementById('newInspEqName').value.trim() || 'Elektrik İç Tesisatı';
    const loc = document.getElementById('newInspLocation').value.trim();
    const serial = document.getElementById('newInspSerial').value.trim();

    const wo = AppState.currentWorkOrder || {};
    const res = await fetch('/api/inspections/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            work_order_id: workOrderId,
            company_name: wo.customer_name || '',
            equipment_name: eqName,
            template_id: templateId,
            template_code: templateCode,
            location: loc,
            serial_no: serial
        })
    });
    const data = await res.json();
    closeModal();
    await loadInitData();
    showToast(`${eqName} muayenesi eklendi!`);
    navigateTo('inspection-complete', { id: data.id, templateId });
}

async function duplicateInspection(inspectionId, workOrderId) {
    const orig = AppState.inspectionsCache.find(x => String(x.id) === String(inspectionId));
    if (!orig) return;
    await fetch('/api/inspections/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            work_order_id: workOrderId || orig.work_order_id,
            company_name: orig.customer_name,
            equipment_name: orig.equipment_name + ' (Kopya)',
            template_id: orig.template_id,
            template_code: orig.template_code,
            location: orig.location,
            serial_no: orig.serial_no,
            copy_from_id: orig.id
        })
    });
    showToast('Muayene kaydı kopyalandı!');
    if (AppState.currentRoute === 'work-order-details') {
        renderWorkOrderDetails(workOrderId, 'inspections');
    } else {
        navigateTo(AppState.currentRoute, AppState.currentParams);
    }
}

async function deleteInspectionItem(inspectionId, workOrderId) {
    if (!confirm('Bu muayene kaydını silmek istediğinize emin misiniz?')) return;
    await fetch(`/api/inspections/${inspectionId}`, { method: 'DELETE' });
    showToast('Muayene silindi', 'warning');
    await loadInitData();
    if (workOrderId) renderWorkOrderDetails(workOrderId, 'inspections');
}

async function signAndApproveInspection(inspectionId, workOrderId) {
    await fetch(`/api/inspections/${inspectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rapor Gönderilmiş', result: 'Uygun' })
    });
    showToast('Rapor E-İmza ile onaylandı!');
    await loadInitData();
    if (workOrderId && AppState.currentRoute === 'work-order-details') {
        renderWorkOrderDetails(workOrderId, 'inspections');
    } else {
        navigateTo(AppState.currentRoute, AppState.currentParams);
    }
}

function openLabelModal(inspectionId, mode = 'label') {
    const item = AppState.inspectionsCache.find(x => String(x.id) === String(inspectionId)) || {};
    openModal(
        mode === 'qr' ? '<i class="fa-solid fa-qrcode mr-2 text-sky-400"></i>Ekipman Karekod (QR) Etiketi' : '<i class="fa-solid fa-tag mr-2 text-emerald-400"></i>Periyodik Kontrol Ekipman Etiketi',
        `<div class="p-5 border-2 border-slate-800 rounded-xl bg-white max-w-md mx-auto text-center space-y-2.5">
            <div class="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <img src="/assets/tekkomer_logo.png" class="w-12 h-12 object-contain" alt="TEKKOMER">
                <div class="text-center flex-1 px-2">
                    <div class="text-[11px] font-black tracking-tight text-slate-900">TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.</div>
                    <div class="text-[10px] font-bold text-red-700">PERİYODİK KONTROL ETİKETİ</div>
                </div>
                <img src="/assets/turkak_logo.jpg" class="w-10 h-14 object-contain" alt="TÜRKAK">
            </div>
            <div class="text-sm font-black text-slate-900 pt-1">${item.equipment_name || 'Ekipman'}</div>
            <div class="text-xs font-semibold text-slate-600">${item.customer_name || ''}</div>
            <div class="py-2 flex justify-center">
                <img src="/assets/qr_default.jpg" class="w-28 h-28 border border-slate-300 p-1 bg-white object-contain" alt="QR Code">
            </div>
            <div class="grid grid-cols-2 text-left text-[11px] bg-slate-100 p-2.5 rounded border border-slate-200 gap-1.5">
                <div><strong>Rapor No:</strong> <span class="font-mono">${item.report_no || '-'}</span></div>
                <div><strong>Tarih:</strong> <span class="font-mono">${item.inspection_date || '-'}</span></div>
                <div><strong>Seri No:</strong> <span class="font-mono">${item.serial_no || '-'}</span></div>
                <div><strong>Sonuç:</strong> <span class="text-emerald-700 font-black">${item.result_status || 'UYGUN'}</span></div>
            </div>
        </div>`,
        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">Kapat</button>
         <button onclick="window.print()" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs"><i class="fa-solid fa-print mr-1"></i>Etiketi Yazdır</button>`
    );
}

function openUploadWoFileModal(workOrderId) {
    openModal(
        '<i class="fa-solid fa-cloud-arrow-up mr-2 text-sky-400"></i>İş Emrine Dosya Ekle',
        `<div class="space-y-3 text-xs">
            <div>
                <label class="block font-bold text-slate-700 mb-1">Dosya Adı / Açıklaması</label>
                <input type="text" id="woFileNameInput" placeholder="Örn: Tek_Hat_Semasi_ve_Croki.pdf" class="w-full border border-slate-300 rounded-lg px-3 py-2">
            </div>
            <div>
                <label class="block font-bold text-slate-700 mb-1">Dosya Seçin</label>
                <input type="file" onchange="if(this.files[0]) document.getElementById('woFileNameInput').value = this.files[0].name" class="w-full border border-slate-300 rounded-lg p-2 bg-slate-50">
            </div>
        </div>`,
        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">İptal</button>
         <button onclick="submitWoFile('${workOrderId}')" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs">Yükle</button>`
    );
}

async function submitWoFile(workOrderId) {
    const fileName = document.getElementById('woFileNameInput').value.trim() || 'Saha_Ek_Dosyasi.pdf';
    await fetch(`/api/work-orders/${workOrderId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fileName })
    });
    closeModal();
    showToast('Dosya iş emrine eklendi!');
    renderWorkOrderDetails(workOrderId, 'files');
}

// ============================================================================
// 4. INSPECTIONS LIST PAGES (Tüm Muayeneler, Benim Muayenelerim, Onaylayacağım)
// ============================================================================

async function renderInspectionsPage(scope = 'all', tab = 'current') {
    const container = document.getElementById('pageContent');
    let pageTitle = 'Tüm Muayeneler';
    let routeName = 'all-inspections';
    let tabs = [
        { id: 'current', label: 'Güncel Muayeneler', icon: 'fa-bolt text-sky-600' },
        { id: 'planned', label: 'Planlanmış Muayeneler', icon: 'fa-calendar text-amber-600' }
    ];

    if (scope === 'my') {
        pageTitle = 'Benim Muayenelerim';
        routeName = 'my-inspections';
        tabs = [
            { id: 'current', label: 'Güncel Muayeneler', icon: 'fa-clipboard-check text-sky-600' },
            { id: 'revision', label: 'Düzenleme Yapılacaklar', icon: 'fa-rotate-left text-rose-600' },
            { id: 'planned', label: 'Planlanmış Muayeneler', icon: 'fa-calendar-day text-amber-600' },
            { id: 'sent', label: 'Raporları Gönderilmiş', icon: 'fa-paper-plane text-emerald-600' }
        ];
    } else if (scope === 'approve') {
        pageTitle = 'Onaylayacağım Muayeneler';
        routeName = 'inspections-to-approve';
        tabs = [
            { id: 'pending_approval', label: 'Onay Bekleyenler', icon: 'fa-hourglass-half text-amber-600' },
            { id: 'approved', label: 'Onaylananlar', icon: 'fa-circle-check text-emerald-600' }
        ];
    }

    const res = await fetch('/api/inspections');
    const rawList = await res.json();
    const allNormalized = (Array.isArray(rawList) ? rawList : (rawList.inspections || [])).map(normalizeInspection);

    const filteredByTab = allNormalized.filter(i => {
        if (scope === 'my' && i.is_mine != 1) return false;
        const st = (i.status || '').toLowerCase();
        if (tab === 'sent' || tab === 'approved') return st.includes('gönderil') || st.includes('onaylan') || st === 'approved';
        if (tab === 'revision') return st.includes('düzenle') || st === 'revision' || (i.result_status || '').toLowerCase().includes('uygunsuz');
        if (tab === 'planned') return st.includes('başlayacak') || st.includes('plan');
        if (tab === 'pending_approval') return st.includes('imza') || st.includes('onay') || st.includes('tamamlan');
        return !st.includes('gönderil');
    });

    AppState.inspectionsCache = filteredByTab.length ? filteredByTab : allNormalized;

    const tabsHtml = tabs.map(t => `
        <button onclick="navigateTo('${routeName}', {tab: '${t.id}'})" class="enlab-tab-btn ${tab === t.id ? 'active' : ''}">
            <i class="fa-solid ${t.icon}"></i>
            <span>${t.label}</span>
        </button>
    `).join('');

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div class="text-[11px] text-slate-400 font-semibold uppercase">Muayene / ${pageTitle}</div>
                    <h1 class="text-lg font-bold text-slate-800">${pageTitle}</h1>
                </div>
                <div class="flex items-center gap-2">
                    <input type="text" id="inspListSearch" oninput="filterGlobalInspectionsTable()" placeholder="Ekipman, müşteri, iş emri veya rapor no ara..."
                        class="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-72 focus:outline-none focus:border-sky-500">
                </div>
            </div>

            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto">
                ${tabsHtml}
            </div>

            <div class="overflow-x-auto pb-24">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <th class="py-3 px-3">Ekipman / Tesisat Adı</th>
                            <th class="py-3 px-3">Müşteri Firma</th>
                            <th class="py-3 px-3">İş Emri Kodu</th>
                            <th class="py-3 px-3">Rapor No</th>
                            <th class="py-3 px-3">Muayene Tarihi</th>
                            <th class="py-3 px-3">Şablon</th>
                            <th class="py-3 px-3">Sonuç / Durum</th>
                            <th class="py-3 px-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody id="globalInspTableBody" class="divide-y divide-slate-100 text-xs">
                        ${renderGlobalInspectionRows(AppState.inspectionsCache)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderGlobalInspectionRows(list) {
    if (!list.length) {
        return `<tr><td colspan="8" class="p-8 text-center text-slate-400">Bu sekmede muayene kaydı bulunamadı.</td></tr>`;
    }
    return list.map(item => `
        <tr class="hover:bg-sky-50/50 transition">
            <td class="py-3 px-3 font-bold text-slate-800">
                <a href="javascript:void(0)" onclick="navigateTo('inspection-complete', {id: '${item.id}', templateId: '${item.template_id}'})" class="hover:text-sky-600">
                    ${item.equipment_name}
                </a>
                ${item.serial_no ? `<div class="text-[11px] text-slate-500 font-normal">${item.serial_no}</div>` : ''}
            </td>
            <td class="py-3 px-3 font-semibold text-slate-700">${item.customer_name || '-'}</td>
            <td class="py-3 px-3 font-mono text-sky-700">
                <a href="javascript:void(0)" onclick="navigateTo('work-order-details', {id: '${item.work_order_id || 43129}', tab: 'inspections'})" class="hover:underline">
                    ${item.work_order_no || '-'}
                </a>
            </td>
            <td class="py-3 px-3 font-mono text-slate-700">${item.report_no || '-'}</td>
            <td class="py-3 px-3 font-mono text-slate-600">${item.inspection_date || '-'}</td>
            <td class="py-3 px-3"><span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px]">${item.template_code || 'TKM-FR.318'}</span></td>
            <td class="py-3 px-3">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    (item.result_status || '').toLowerCase().includes('uygunsuz') || item.result_status === 'UYGUN DEĞİL' ? 'bg-rose-100 text-rose-800' :
                    item.result_status === 'KISMEN UYGUN' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                }">${item.result_status || 'Uygun'}</span>
            </td>
            <td class="py-3 px-3 text-right whitespace-nowrap space-x-1">
                <button onclick="openStartInspectionModal('${item.id}')" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px]">
                    <i class="fa-solid fa-play mr-1"></i>Başla
                </button>
                <button onclick="navigateTo('inspection-complete', {id: '${item.id}', templateId: '${item.template_id}'})" class="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded text-[11px]">
                    Raporu Aç
                </button>
                <button onclick="signAndApproveInspection('${item.id}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px]" title="Onayla">
                    <i class="fa-solid fa-check"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterGlobalInspectionsTable() {
    const q = (document.getElementById('inspListSearch')?.value || '').toLowerCase();
    const filtered = AppState.inspectionsCache.filter(i =>
        (i.equipment_name || '').toLowerCase().includes(q) ||
        (i.customer_name || '').toLowerCase().includes(q) ||
        (i.work_order_no || '').toLowerCase().includes(q) ||
        (i.report_no || '').toLowerCase().includes(q) ||
        (i.serial_no || '').toLowerCase().includes(q)
    );
    const tbody = document.getElementById('globalInspTableBody');
    if (tbody) tbody.innerHTML = renderGlobalInspectionRows(filtered);
}

// ============================================================================
// 5. DOCUMENTATION PAGES (Dokümanlar & Dış Kaynaklı Dokümanlar)
// ============================================================================

async function renderDocumentsPage(docType = 'internal', tab = 'active') {
    const container = document.getElementById('pageContent');
    const isExternal = docType === 'external';
    const pageTitle = isExternal ? 'Dış Kaynaklı Dokümanlar (Standart & Yönetmelikler)' : 'Kalite ve Muayene Dokümanları (Talimat & Formlar)';
    const routeName = isExternal ? 'outsource-documents' : 'documents';

    const res = await fetch('/api/documents');
    const rawDocs = await res.json();
    const allDocs = Array.isArray(rawDocs) ? rawDocs : (rawDocs.documents || []);
    const docs = allDocs.filter(d => d.doc_type === docType && (tab === 'active' ? (d.status === 'Aktif' || d.status === 'active') : (d.status !== 'Aktif' && d.status !== 'active')));

    const rowsHtml = docs.map(d => `
        <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
            <td class="py-3 px-4 font-mono font-bold text-sky-700">${d.code}</td>
            <td class="py-3 px-4 font-semibold text-slate-800">${d.name}</td>
            <td class="py-3 px-4 text-slate-600">${d.category || '-'}</td>
            <td class="py-3 px-4 font-mono text-slate-600">${d.rev_no || '00'}</td>
            <td class="py-3 px-4 font-mono text-slate-600">${d.pub_date || '-'}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    ${d.status || 'Yürürlükte'}
                </span>
            </td>
            <td class="py-3 px-4 text-right">
                <button onclick="openDocumentPreviewModal('${d.code}', '${(d.name || '').replace(/'/g, '')}')" class="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded font-semibold">
                    <i class="fa-solid fa-eye mr-1"></i>Görüntüle
                </button>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <div class="text-[11px] text-slate-400 font-semibold uppercase">Dokümantasyon / ${pageTitle}</div>
                    <h1 class="text-lg font-bold text-slate-800">${pageTitle}</h1>
                </div>
            </div>
            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
                <button onclick="navigateTo('${routeName}', {tab: 'active'})" class="enlab-tab-btn ${tab === 'active' ? 'active' : ''}">
                    <i class="fa-solid fa-book-open text-emerald-600"></i>
                    <span>Güncel Dokümanlar</span>
                </button>
                <button onclick="navigateTo('${routeName}', {tab: 'cancelled'})" class="enlab-tab-btn ${tab === 'cancelled' ? 'active' : ''}">
                    <i class="fa-solid fa-ban text-rose-500"></i>
                    <span>İptal Edilenler</span>
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <th class="py-3 px-4">Doküman Kodu</th>
                            <th class="py-3 px-4">Doküman / Standart Adı</th>
                            <th class="py-3 px-4">Kategori / Yayınlayan</th>
                            <th class="py-3 px-4">Rev. No</th>
                            <th class="py-3 px-4">Yayın Tarihi</th>
                            <th class="py-3 px-4">Durum</th>
                            <th class="py-3 px-4 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="7" class="p-8 text-center text-slate-400 text-xs">Bu sekmede doküman bulunmuyor.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openDocumentPreviewModal(code, name) {
    openModal(
        `<i class="fa-solid fa-file-pdf mr-2 text-amber-400"></i>${code} - ${name}`,
        `<div class="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
            <div class="font-bold text-slate-800 text-sm">${name}</div>
            <div class="text-slate-600">Doküman Kodu: <strong class="font-mono">${code}</strong> · TÜRKAK TS EN ISO/IEC 17020 A Tipi Muayene Kuruluşu Kalite Yönetim Sistemi Dokümanı.</div>
            <p class="text-slate-600 pt-2">Bu standart/talimat ENLAB saha muayene şablonlarına (TKM-FR.318, TKM-FR.319, TKM-FR.320, TKM-FR.321, TKM-FR.322 vb.) otomatik referans olarak bağlanmıştır.</p>
        </div>`
    );
}

// ============================================================================
// 6. QUALITY RECORD MANAGEMENT (Kayıt Yönetimi -> Yeni Kayıt & Kayıt Listesi)
// ============================================================================

async function renderQualityRecordsPage(tab = 'create') {
    const container = document.getElementById('pageContent');
    const res = await fetch('/api/quality-records');
    const raw = await res.json();
    const records = Array.isArray(raw) ? raw : (raw.records || []);

    let bodyHtml = '';
    if (tab === 'create') {
        bodyHtml = `
            <div class="p-6 max-w-2xl space-y-4 text-xs">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Kayıt / Form Türü</label>
                        <select id="qrType" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold">
                            <option value="Saha Denetim Kaydı">Saha Denetim / Gözlem Kaydı</option>
                            <option value="DÖF (Düzeltici Önleyici Faaliyet)">DÖF (Düzeltici Önleyici Faaliyet)</option>
                            <option value="Cihaz Doğrulama Kaydı">Cihaz Ara Doğrulama Kaydı</option>
                            <option value="Müşteri Geri Bildirimi">Müşteri Geri Bildirimi / Şikayet</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">İlgili Birim</label>
                        <input type="text" id="qrDept" value="Elektriksel Kontroller" class="w-full border border-slate-300 rounded-lg px-3 py-2">
                    </div>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Kayıt Konusu / Başlığı</label>
                    <input type="text" id="qrTitle" placeholder="Örn: C.121 Metrel MI 3102 BT Saha Öncesi Doğrulama Kontrolü" class="w-full border border-slate-300 rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Detaylı Açıklama ve Aksiyon Planı</label>
                    <textarea id="qrDesc" rows="4" placeholder="Kayıt detaylarını buraya giriniz..." class="w-full border border-slate-300 rounded-lg p-3"></textarea>
                </div>
                <div class="pt-2">
                    <button onclick="submitQualityRecord()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs">
                        <i class="fa-solid fa-floppy-disk mr-1.5"></i>Kaydı Oluştur ve Sakla
                    </button>
                </div>
            </div>
        `;
    } else {
        const rows = records.map(r => `
            <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
                <td class="py-3 px-4 font-semibold text-sky-700">${r.record_type}</td>
                <td class="py-3 px-4 font-bold text-slate-800">${r.subject || r.title || '-'}</td>
                <td class="py-3 px-4 text-slate-600">${r.description || '-'}</td>
                <td class="py-3 px-4 text-slate-600">${r.owner || r.created_by || 'Ali Şamil Aytekin'}</td>
                <td class="py-3 px-4 font-mono text-slate-500">${r.created_at || '-'}</td>
            </tr>
        `).join('');
        bodyHtml = `
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <th class="py-3 px-4">Kayıt Türü</th>
                            <th class="py-3 px-4">Konu / Başlık</th>
                            <th class="py-3 px-4">Açıklama</th>
                            <th class="py-3 px-4">Sorumlu</th>
                            <th class="py-3 px-4">Tarih</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || '<tr><td colspan="5" class="p-6 text-center text-slate-400 text-xs">Henüz kalite kaydı oluşturulmadı.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200">
                <div class="text-[11px] text-slate-400 font-semibold uppercase">Kayıt Yönetimi / Kalite Kayıtları</div>
                <h1 class="text-lg font-bold text-slate-800">Kalite ve Saha Kayıt Yönetimi</h1>
            </div>
            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
                <button onclick="navigateTo('quality-record-create', {tab: 'create'})" class="enlab-tab-btn ${tab === 'create' ? 'active' : ''}">
                    <i class="fa-solid fa-file-circle-plus text-emerald-600"></i>
                    <span>Yeni Kayıt Oluştur</span>
                </button>
                <button onclick="navigateTo('quality-record-create', {tab: 'list'})" class="enlab-tab-btn ${tab === 'list' ? 'active' : ''}">
                    <i class="fa-solid fa-list text-sky-600"></i>
                    <span>Kayıt Listesi (${records.length})</span>
                </button>
            </div>
            ${bodyHtml}
        </div>
    `;
}

async function submitQualityRecord() {
    const payload = {
        record_type: document.getElementById('qrType').value,
        department: document.getElementById('qrDept').value.trim(),
        subject: document.getElementById('qrTitle').value.trim() || 'Saha Kalite Kaydı',
        description: document.getElementById('qrDesc').value.trim()
    };
    await fetch('/api/quality-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    showToast('Kalite kaydı başarıyla eklendi!');
    navigateTo('quality-record-create', { tab: 'list' });
}

// ============================================================================
// 7. STAFF PAGE (Personel -> Benim Sayfam: Personel & Dosyalar Tabs)
// ============================================================================

async function renderStaffPage(tab = 'profile') {
    const container = document.getElementById('pageContent');
    let contentHtml = '';

    if (tab === 'profile') {
        contentHtml = `
            <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                    <div class="bg-slate-800 text-white px-4 py-2.5 font-bold uppercase tracking-wider">Personel Kimlik & Yetki Bilgileri</div>
                    <div class="divide-y divide-slate-100">
                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">Ad Soyad:</span><span class="col-span-2 font-bold text-slate-900">Ali Şamil Aytekin</span></div>
                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">Meslek / Unvan:</span><span class="col-span-2 font-semibold text-sky-700">Elektrik Mühendisi / Muayene Uzmanı</span></div>
                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">Birim:</span><span class="col-span-2">Periyodik Kontrol ve Elektriksel Ölçümler</span></div>
                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">EKİPNET / Oda No:</span><span class="col-span-2 font-mono">EMO-64892 / EKİPNET Kayıtlı</span></div>
                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">Yetki Kapsamı:</span><span class="col-span-2">Elektrik İç Tesisatı, Topraklama, Paratoner, Jeneratör, Kompanzasyon, Termal Kamera, Yangın Algılama, Mekanik Tesisat</span></div>
                    </div>
                </div>
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                    <div class="bg-slate-800 text-white px-4 py-2.5 font-bold uppercase tracking-wider">Zimmetli Referans Cihazlarım</div>
                    <div class="p-4 space-y-2.5">
                        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                            <div>
                                <div class="font-bold text-slate-800">C.121 - METREL MI 3102 BT EurotestXE</div>
                                <div class="text-slate-500">Çok Fonksiyonlu Elektrik Tesisat Test Cihazı</div>
                            </div>
                            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Aktif Zimmetli</span>
                        </div>
                        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                            <div>
                                <div class="font-bold text-slate-800">C.105 - UNI-T UTi165A Termal Kamera</div>
                                <div class="text-slate-500">Termal Görüntüleme ve Sıcaklık Ölçüm Cihazı</div>
                            </div>
                            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Aktif Zimmetli</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        contentHtml = `
            <div class="p-5">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <th class="py-3 px-4">Belge / Sertifika Adı</th>
                            <th class="py-3 px-4">Geçerlilik Durumu</th>
                            <th class="py-3 px-4 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr><td class="py-3 px-4 font-semibold">Elektrik Mühendisliği Lisans Diploması & EMO Yetki Belgesi</td><td class="py-3 px-4"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">Geçerli</span></td><td class="py-3 px-4 text-right"><button onclick="showToast('Belge görüntülendi')" class="text-sky-600 font-semibold">Görüntüle</button></td></tr>
                        <tr><td class="py-3 px-4 font-semibold">Elektrik İç Tesisleri ve Topraklama Ölçüm Yetki Sertifikası</td><td class="py-3 px-4"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">Geçerli</span></td><td class="py-3 px-4 text-right"><button onclick="showToast('Belge görüntülendi')" class="text-sky-600 font-semibold">Görüntüle</button></td></tr>
                        <tr><td class="py-3 px-4 font-semibold">TS EN ISO/IEC 17020 Muayene Personeli Atama Yazısı</td><td class="py-3 px-4"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">Geçerli</span></td><td class="py-3 px-4 text-right"><button onclick="showToast('Belge görüntülendi')" class="text-sky-600 font-semibold">Görüntüle</button></td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200">
                <div class="text-[11px] text-slate-400 font-semibold uppercase">Personel / Benim Sayfam</div>
                <h1 class="text-lg font-bold text-slate-800">Ali Şamil Aytekin - Personel Dosyası</h1>
            </div>
            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
                <button onclick="navigateTo('staff-my-details', {tab: 'profile'})" class="enlab-tab-btn ${tab === 'profile' ? 'active' : ''}">
                    <i class="fa-solid fa-user-check text-sky-600"></i>
                    <span>Personel Bilgileri</span>
                </button>
                <button onclick="navigateTo('staff-my-details', {tab: 'files'})" class="enlab-tab-btn ${tab === 'files' ? 'active' : ''}">
                    <i class="fa-solid fa-folder-open text-amber-600"></i>
                    <span>Personel Dosyaları & Sertifikalar</span>
                </button>
            </div>
            ${contentHtml}
        </div>
    `;
}

// ============================================================================
// 8. INSTRUMENT MANAGEMENT (Cihazlar, Cihaz Kullanıcıları, Kalibrasyonlar)
// ============================================================================

async function renderInstrumentsPage(tab = 'active') {
    const container = document.getElementById('pageContent');
    const res = await fetch('/api/instruments');
    const data = await res.json();
    const allInst = data.instruments || [];
    const filtered = allInst.filter(i => tab === 'active' ? (i.status === 'Aktif' || i.status === 'active') : (i.status !== 'Aktif' && i.status !== 'active'));

    const rowsHtml = filtered.map(inst => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
            <td class="py-3 px-4 font-mono font-bold text-sky-700">${inst.code}</td>
            <td class="py-3 px-4 font-bold text-slate-800">${inst.name}</td>
            <td class="py-3 px-4 text-slate-700">${inst.brand || '-'} / ${inst.model || '-'}</td>
            <td class="py-3 px-4 font-mono text-slate-600">${inst.serial_no || '-'}</td>
            <td class="py-3 px-4 text-slate-700 font-medium">${inst.responsible || 'Ali Şamil Aytekin'}</td>
            <td class="py-3 px-4 text-slate-600">${inst.department || 'Muayene'} (${inst.branch || 'Merkez'})</td>
            <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">${inst.status || 'Aktif'}</span>
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200">
                <div class="text-[11px] text-slate-400 font-semibold uppercase">Cihaz Yönetimi / Referans Cihazlar</div>
                <h1 class="text-lg font-bold text-slate-800">Test ve Ölçüm Cihazları Listesi</h1>
            </div>
            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
                <button onclick="navigateTo('reference-products', {tab: 'active'})" class="enlab-tab-btn ${tab === 'active' ? 'active' : ''}">
                    <i class="fa-solid fa-gauge-high text-emerald-600"></i>
                    <span>Aktif Cihazlar (${allInst.filter(x=>x.status==='Aktif'||x.status==='active').length})</span>
                </button>
                <button onclick="navigateTo('reference-products', {tab: 'passive'})" class="enlab-tab-btn ${tab === 'passive' ? 'active' : ''}">
                    <i class="fa-solid fa-box-archive text-slate-500"></i>
                    <span>Pasif / Bakımdaki Cihazlar</span>
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <th class="py-3 px-4">Cihaz Kodu</th>
                            <th class="py-3 px-4">Cihaz Tanımı</th>
                            <th class="py-3 px-4">Marka / Model</th>
                            <th class="py-3 px-4">Seri No</th>
                            <th class="py-3 px-4">Sorumlu Personel</th>
                            <th class="py-3 px-4">Birim / Şube</th>
                            <th class="py-3 px-4">Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="7" class="p-8 text-center text-slate-400 text-xs">Bu sekmede cihaz bulunmamaktadır.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function renderInstrumentUsersPage() {
    const container = document.getElementById('pageContent');
    const res = await fetch('/api/instruments');
    const data = await res.json();
    const allInst = data.instruments || [];

    const rows = allInst.map(i => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
            <td class="py-3 px-4 font-bold text-slate-800">${i.responsible || 'Ali Şamil Aytekin'}</td>
            <td class="py-3 px-4 font-mono font-bold text-sky-700">${i.code}</td>
            <td class="py-3 px-4 font-semibold text-slate-700">${i.brand} ${i.model} (${i.name})</td>
            <td class="py-3 px-4 font-mono text-slate-600">${i.serial_no}</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold text-[11px]">Saha Zimmetinde</span></td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200">
                <div class="text-[11px] text-slate-400 font-semibold uppercase">Cihaz Yönetimi / Cihaz Kullanıcıları</div>
                <h1 class="text-lg font-bold text-slate-800">Personel Cihaz Zimmet Listesi</h1>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <th class="py-3 px-4">Personel Adı</th>
                            <th class="py-3 px-4">Cihaz Kodu</th>
                            <th class="py-3 px-4">Cihaz Bilgisi</th>
                            <th class="py-3 px-4">Seri No</th>
                            <th class="py-3 px-4">Zimmet Durumu</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    `;
}

async function renderCalibrationsPage(tab = 'current') {
    const container = document.getElementById('pageContent');
    const res = await fetch('/api/instruments');
    const data = await res.json();
    const allCals = data.calibrations || [];
    const cals = allCals.filter(c => tab === 'current' ? c.is_current == 1 : c.is_current != 1);

    const rows = (cals.length ? cals : allCals).map(c => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
            <td class="py-3 px-4 font-mono font-bold text-sky-700">${c.device_code || c.instrument_code || '-'}</td>
            <td class="py-3 px-4 font-semibold text-slate-800">${c.device_name || c.instrument_name || '-'} (${c.brand || ''} ${c.model || ''})</td>
            <td class="py-3 px-4 font-mono text-slate-700">${c.cert_no || c.certificate_no || '-'}</td>
            <td class="py-3 px-4 font-mono text-slate-600">${c.cal_date || c.calibration_date || '-'}</td>
            <td class="py-3 px-4 font-semibold text-emerald-700">${c.remaining_text || c.due_date || 'Güncel'}</td>
            <td class="py-3 px-4 text-slate-600">${c.company || c.provider || '-'}</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-[11px]">Geçerli</span></td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200">
                <div class="text-[11px] text-slate-400 font-semibold uppercase">Cihaz Yönetimi / Kalibrasyonlar</div>
                <h1 class="text-lg font-bold text-slate-800">Cihaz Kalibrasyon Sertifikaları ve Takibi</h1>
            </div>
            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
                <button onclick="navigateTo('calibrations', {tab: 'current'})" class="enlab-tab-btn ${tab === 'current' ? 'active' : ''}">
                    <i class="fa-solid fa-certificate text-emerald-600"></i>
                    <span>Güncel Kalibrasyonlar (${allCals.length})</span>
                </button>
                <button onclick="navigateTo('calibrations', {tab: 'history'})" class="enlab-tab-btn ${tab === 'history' ? 'active' : ''}">
                    <i class="fa-solid fa-clock-rotate-left text-slate-500"></i>
                    <span>Geçmiş Kalibrasyon Kayıtları</span>
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <th class="py-3 px-4">Cihaz Kodu</th>
                            <th class="py-3 px-4">Cihaz Adı</th>
                            <th class="py-3 px-4">Sertifika No</th>
                            <th class="py-3 px-4">Kalibrasyon Tarihi</th>
                            <th class="py-3 px-4">Kalan Süre / Geçerlilik</th>
                            <th class="py-3 px-4">Kalibrasyon Kuruluşu</th>
                            <th class="py-3 px-4">Durum</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    `;
}

// ============================================================================
// 9. CALENDAR PAGE (Takvim -> Etkinlikler & Yeni Etkinlik)
// ============================================================================

async function renderCalendarPage(tab = 'calendar') {
    const container = document.getElementById('pageContent');
    const res = await fetch('/api/calendar');
    const raw = await res.json();
    const events = Array.isArray(raw) ? raw : (raw.events || []);

    let bodyHtml = '';
    if (tab === 'create') {
        bodyHtml = `
            <div class="p-6 max-w-xl space-y-4 text-xs">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Etkinlik / Saha Muayene Başlığı</label>
                    <input type="text" id="calTitle" placeholder="Örn: TEKNOSA Manisa Soma Periyodik Muayene Planı" class="w-full border border-slate-300 rounded-lg px-3 py-2">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Başlangıç Tarihi</label>
                        <input type="date" id="calStart" value="${new Date().toISOString().slice(0,10)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Lokasyon / Şube</label>
                        <input type="text" id="calLoc" value="Manisa Soma" class="w-full border border-slate-300 rounded-lg px-3 py-2">
                    </div>
                </div>
                <button onclick="submitCalendarEvent()" class="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg">
                    <i class="fa-solid fa-calendar-plus mr-1.5"></i>Takvime Ekle
                </button>
            </div>
        `;
    } else {
        const rows = events.map(ev => `
            <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
                <td class="py-3 px-4 font-bold text-slate-800">${ev.title}</td>
                <td class="py-3 px-4 font-mono text-slate-600">${(ev.start_date || '').replace('T', ' ').slice(0, 16)}</td>
                <td class="py-3 px-4 text-slate-600">${ev.location || 'Müşteri Sahası'}</td>
                <td class="py-3 px-4 text-slate-600">${ev.inspector || 'Ali Şamil Aytekin'}</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="navigateTo('work-order-details', {id: '43129'})" class="px-2.5 py-1 bg-sky-50 text-sky-700 rounded font-semibold">İş Emrini Aç</button>
                </td>
            </tr>
        `).join('');
        bodyHtml = `
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                            <th class="py-3 px-4">Saha Muayene / Etkinlik Başlığı</th>
                            <th class="py-3 px-4">Tarih</th>
                            <th class="py-3 px-4">Lokasyon</th>
                            <th class="py-3 px-4">Uzman</th>
                            <th class="py-3 px-4 text-right">Bağlantı</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-200">
                <div class="text-[11px] text-slate-400 font-semibold uppercase">Takvim / Saha Muayene Programı</div>
                <h1 class="text-lg font-bold text-slate-800">Muayene ve Denetim Takvimi</h1>
            </div>
            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">
                <button onclick="navigateTo('calendar', {tab: 'calendar'})" class="enlab-tab-btn ${tab !== 'create' ? 'active' : ''}">
                    <i class="fa-solid fa-calendar-week text-sky-600"></i>
                    <span>Planlanan Etkinlikler (${events.length})</span>
                </button>
                <button onclick="navigateTo('calendar-create')" class="enlab-tab-btn ${tab === 'create' ? 'active' : ''}">
                    <i class="fa-solid fa-calendar-plus text-emerald-600"></i>
                    <span>Yeni Etkinlik Ekle</span>
                </button>
            </div>
            ${bodyHtml}
        </div>
    `;
}

async function submitCalendarEvent() {
    const title = document.getElementById('calTitle').value.trim() || 'Saha Muayene Planı';
    const start_date = document.getElementById('calStart').value;
    const location = document.getElementById('calLoc').value.trim();
    await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, start_date, end_date: start_date, location })
    });
    await loadInitData();
    showToast('Yeni takvim etkinliği kaydedildi!');
    navigateTo('calendar');
}

// ============================================================================
// 10. DYNAMIC INSPECTION REPORT EDITOR (/Inspection/Inspection/Complete/:id)
// ============================================================================

async function renderInspectionEditor(inspectionId, overrideTemplateId = null) {
    let insp = null;
    try {
        const res = await fetch(`/api/inspections/${inspectionId}`);
        if (res.ok) {
            const raw = await res.json();
            insp = normalizeInspection(raw.inspection || raw);
        }
    } catch (e) {}

    if (!insp || !insp.id) {
        insp = normalizeInspection({
            id: inspectionId || String(Date.now()),
            work_order_id: '',
            work_order_code: '',
            company_name: '',
            equipment_name: 'Elektrik İç Tesisatı',
            report_no: '',
            inspection_date: '',
            inspector: 'Ali Şamil Aytekin',
            serial_no: '',
            location: '',
            template_id: overrideTemplateId || '2201',
            template_code: 'TKM-FR.318',
            status: 'Tamamlanacak',
            result: 'UYGUN',
            data_json: '{}'
        });
    }

    if (overrideTemplateId && String(overrideTemplateId) !== String(insp.template_id)) {
        insp.template_id = String(overrideTemplateId);
        const tplMeta = (window.ENLAB_REPORT_TEMPLATES || []).find(t => String(t.id) === String(overrideTemplateId));
        if (tplMeta) insp.template_code = tplMeta.code;
    }

    const localRaw = localStorage.getItem(`enlab_insp_${insp.id}`);
    let localData = null;
    if (localRaw) {
        try { localData = JSON.parse(localRaw); } catch (e) {}
    }

    const formData = Object.assign({}, insp.form_data || {}, localData || {});
    if (!formData.answers) formData.answers = {};
    if (!formData.tableRows) formData.tableRows = {};
    if (!formData.specializedFields) formData.specializedFields = {};
    if (!formData.specializedChecks) formData.specializedChecks = {};
    if (!formData.specializedRows) formData.specializedRows = [];
    if (!formData.photos) formData.photos = [];
    if (formData.defectNotes === undefined) formData.defectNotes = '';
    if (formData.generalNotes === undefined) formData.generalNotes = '';
    if (!formData.overallResult) formData.overallResult = 'UYGUN';
    if (formData.nextInspectionDate === undefined) formData.nextInspectionDate = '';
    if (!formData.grounding) formData.grounding = { details: {}, detected: {}, method: 'Çevrim empedansı', points: [], selectivity: [] };
    if (!formData.generator) formData.generator = { info: {}, equipment: {}, checks: {}, potential: {}, measurements: {}, battery: {}, devices: [] };


    AppState.currentInspection = insp;
    AppState.currentFormData = formData;
    AppState.activeAreaIndex = 0;

    paintInspectionEditorUI();
}

function paintInspectionEditorUI() {
    const container = document.getElementById('pageContent');
    const insp = AppState.currentInspection;
    
    // Activate bottom thumb action dock & add padding
    const dock = document.getElementById('bottomActionDock');
    if (dock) dock.classList.remove('hidden');
    if (container) container.classList.add('pb-24');
    const isElectrical2201 = String(insp.template_id) === '2201' && AppState.electricalTemplate && AppState.electricalTemplate.areas;
    const isGrounding2202 = String(insp.template_id) === '2202';
    const isGenerator2205 = String(insp.template_id) === '2205';

    const templateOptions = (window.ENLAB_REPORT_TEMPLATES || []).map(t => `
        <option value="${t.id}" ${String(t.id) === String(insp.template_id) ? 'selected' : ''}>
            ${t.code} - ${t.name}
        </option>
    `).join('');

    const wo = (window.OfflineDB?.state?.workOrders || []).find(w => String(w.id) === String(insp.work_order_id)) || AppState.currentWorkOrder || {};
    const jobNotes = wo.field_notes || '';

    let editorBodyHtml = '';
    if (isElectrical2201) {
        editorBodyHtml = renderElectrical2201Editor();
    } else if (isGrounding2202) {
        editorBodyHtml = renderGrounding2202Editor();
    } else if (isGenerator2205) {
        editorBodyHtml = renderGenerator2205Editor();
    } else {
        editorBodyHtml = renderSpecializedTemplateEditor();
    }

    container.innerHTML = `
        <div class="max-w-2xl mx-auto space-y-3 pb-8">
            <!-- MINIMAL EDITOR HEADER -->
            <div class="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
                <div class="flex items-center justify-between gap-2">
                    <button onclick="navigateTo('work-order-details', {id: '${insp.work_order_id || 43129}'})" class="px-2.5 py-1.5 bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg shrink-0">
                        <i class="fa-solid fa-arrow-left mr-1"></i>Geri
                    </button>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button onclick="document.getElementById('editorNotebookDrawer')?.classList.toggle('hidden')" class="px-2.5 py-1.5 bg-amber-100 text-amber-900 font-bold text-xs rounded-lg">
                            <i class="fa-solid fa-note-sticky mr-1"></i>Notlar
                        </button>
                        <button onclick="saveCurrentInspection(true)" class="px-3 py-1.5 bg-sky-600 text-white font-bold text-xs rounded-lg">
                            Kaydet
                        </button>
                        <button onclick="printOfficialReport()" class="px-3 py-1.5 bg-slate-900 text-amber-400 font-black text-xs rounded-lg flex items-center gap-1">
                            <i class="fa-solid fa-file-pdf"></i>
                            <span>PDF Çıktı</span>
                        </button>
                    </div>
                </div>

                <div class="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                    <div class="min-w-0 flex-1 flex items-center gap-1.5">
                        <i class="fa-solid fa-building text-slate-400 text-xs shrink-0"></i>
                        <span class="font-bold text-slate-900 text-xs sm:text-sm truncate">${escapeHtml(insp.customer_name || 'Firma')}</span>
                    </div>
                    <select onchange="switchEditorTemplate(this.value)" class="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold bg-slate-50 text-slate-800 max-w-[190px] truncate">
                        ${templateOptions}
                    </select>
                </div>

                <!-- RAPOR / EKİPMAN ADI DÜZENLEME -->
                <div class="flex items-center gap-2 p-1.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                    <label class="text-[11px] font-black text-amber-900 shrink-0 flex items-center gap-1">
                        <i class="fa-solid fa-file-pen text-amber-600"></i>
                        <span>Rapor Adı:</span>
                    </label>
                    <input type="text"
                        value="${escapeHtml(insp.equipment_name || '')}"
                        placeholder=""
                        oninput="updateInspectionName(this.value)"
                        class="flex-1 min-w-0 bg-white border border-amber-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500">
                </div>
            </div>

            <!-- COLLAPSIBLE NOTEBOOK DRAWER -->
            <div id="editorNotebookDrawer" class="hidden bg-amber-50 rounded-xl border border-amber-300 p-3 space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <span class="font-bold text-xs text-amber-950">Başlık Notları</span>
                    <div class="flex items-center gap-1">
                        <button onclick="transferJobNotesToReport('general')" class="px-2 py-1 bg-sky-600 text-white font-bold text-[11px] rounded">
                            Notlara Aktar
                        </button>
                        <button onclick="transferJobNotesToReport('defect')" class="px-2 py-1 bg-rose-600 text-white font-bold text-[11px] rounded">
                            Kusurlara Aktar
                        </button>
                    </div>
                </div>
                <textarea id="editorJobNotesArea" rows="3"
                    oninput="saveWorkOrderNotesRealtime('${insp.work_order_id || 43129}', this.value)"
                    placeholder=""
                    class="w-full border border-amber-300 bg-white rounded-lg p-2 text-xs text-slate-900 focus:outline-none">${jobNotes}</textarea>
            </div>

            <div id="editorDynamicBody" class="space-y-3">
                ${editorBodyHtml}
            </div>
        </div>
    `;
}

function updateInspectionName(newName) {
    if (!AppState.currentInspection) return;
    AppState.currentInspection.equipment_name = newName;
    if (AppState.currentFormData) {
        if (!AppState.currentFormData.companyInfo) AppState.currentFormData.companyInfo = {};
        AppState.currentFormData.companyInfo.equipmentName = newName;
    }
    const item = AppState.inspectionsCache.find(x => String(x.id) === String(AppState.currentInspection.id));
    if (item) item.equipment_name = newName;
    triggerAutoSave();
}

function ensureCompanyInfo() {
    const insp = AppState.currentInspection || {};
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.companyInfo) fd.companyInfo = {};
    if (fd.companyInfo.firmName === undefined) fd.companyInfo.firmName = insp.customer_name || '';
    if (fd.companyInfo.address === undefined) fd.companyInfo.address = insp.address || '';
    if (fd.companyInfo.equipmentName === undefined) fd.companyInfo.equipmentName = insp.equipment_name || '';
    if (fd.companyInfo.serialCode === undefined) fd.companyInfo.serialCode = insp.serial_no || '';
    if (fd.companyInfo.startEndTime === undefined) fd.companyInfo.startEndTime = '';
    if (fd.companyInfo.isgKatipNo === undefined) fd.companyInfo.isgKatipNo = '';
    if (fd.companyInfo.sgkSicilNo === undefined) fd.companyInfo.sgkSicilNo = '';
    if (fd.companyInfo.reportNo === undefined) fd.companyInfo.reportNo = insp.report_no || '';
    if (fd.companyInfo.reportDate === undefined) fd.companyInfo.reportDate = insp.inspection_date || '';
    if (fd.companyInfo.nextControlDate === undefined) fd.companyInfo.nextControlDate = fd.nextInspectionDate || '';
}

function renderSharedCompanyInfoSection() {
    ensureCompanyInfo();
    const insp = AppState.currentInspection || {};
    const ci = AppState.currentFormData.companyInfo;

    return `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between">
                <span>1. Firma ve Rapor Bilgileri</span>
                <span class="text-[11px] text-slate-300 font-mono">${escapeHtml(ci.reportNo || insp.report_no || '')}</span>
            </div>
            <div class="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div class="sm:col-span-2">
                    <label class="block font-bold text-slate-700 mb-1">Firma Adı</label>
                    <input type="text" value="${escapeHtml(ci.firmName || '')}" placeholder=""
                        oninput="AppState.currentFormData.companyInfo.firmName=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold bg-white">
                </div>
                <div class="sm:col-span-2">
                    <label class="block font-bold text-slate-700 mb-1">Periyodik Kontrol Adresi</label>
                    <input type="text" value="${escapeHtml(ci.address || '')}" placeholder=""
                        oninput="AppState.currentFormData.companyInfo.address=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Rapor / Ekipman Adı</label>
                    <input type="text" value="${escapeHtml(insp.equipment_name || ci.equipmentName || '')}"
                        placeholder=""
                        oninput="updateInspectionName(this.value);"
                        class="w-full border border-amber-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 bg-amber-50/50 focus:bg-white focus:border-sky-500 focus:outline-none">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Seri No / Pano Kodu</label>
                    <input type="text" value="${escapeHtml(ci.serialCode || '')}" placeholder=""
                        oninput="AppState.currentFormData.companyInfo.serialCode=this.value; AppState.currentInspection.serial_no=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Kontrol Saati</label>
                    <input type="text" value="${escapeHtml(ci.startEndTime || '')}" placeholder=""
                        oninput="AppState.currentFormData.companyInfo.startEndTime=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">İSG-KATİP No</label>
                    <input type="text" value="${escapeHtml(ci.isgKatipNo || '')}" placeholder=""
                        oninput="AppState.currentFormData.companyInfo.isgKatipNo=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">SGK Sicil No</label>
                    <input type="text" value="${escapeHtml(ci.sgkSicilNo || '')}" placeholder=""
                        oninput="AppState.currentFormData.companyInfo.sgkSicilNo=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Rapor No</label>
                    <input type="text" value="${escapeHtml(ci.reportNo || insp.report_no || '')}" placeholder=""
                        oninput="AppState.currentFormData.companyInfo.reportNo=this.value; AppState.currentInspection.report_no=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">
                </div>
            </div>
        </div>
    `;
}

function ensureMeasuringDevices() {
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.measuringDevices || !Array.isArray(fd.measuringDevices) || fd.measuringDevices.length === 0) {
        fd.measuringDevices = [
            { name: '', serial: '', calDate: '', validDate: '', certNo: '' }
        ];
    }
}

function renderSharedMeasuringDevicesSection(title = 'Ölçüm Aletleri Bilgileri') {
    ensureMeasuringDevices();
    const fd = AppState.currentFormData;
    const devices = fd.measuringDevices;

    return `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between">
                <span>${title} (${devices.length})</span>
                <button onclick="AppState.currentFormData.measuringDevices.push({name:'',serial:'',calDate:'',validDate:'',certNo:''}); triggerAutoSave(); paintInspectionEditorUI();"
                    class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1">
                    <i class="fa-solid fa-plus"></i>
                    <span>Cihaz Ekle</span>
                </button>
            </div>
            <div class="p-3 space-y-2.5 text-xs">
                ${devices.map((dev, dIdx) => `
                    <div class="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                        <div class="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span class="font-bold text-slate-700">Cihaz #${dIdx + 1}</span>
                            ${devices.length > 1 ? `
                                <button onclick="AppState.currentFormData.measuringDevices.splice(${dIdx},1); triggerAutoSave(); paintInspectionEditorUI();"
                                    class="text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center gap-1">
                                    <i class="fa-solid fa-trash-can"></i> Sil
                                </button>
                            ` : ''}
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="col-span-2">
                                <label class="block text-[10px] font-bold text-slate-500">Cihaz Adı</label>
                                <input type="text" value="${escapeHtml(dev.name || '')}" placeholder=""
                                    oninput="AppState.currentFormData.measuringDevices[${dIdx}].name=this.value; triggerAutoSave();"
                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-500">Seri No</label>
                                <input type="text" value="${escapeHtml(dev.serial || '')}" placeholder=""
                                    oninput="AppState.currentFormData.measuringDevices[${dIdx}].serial=this.value; triggerAutoSave();"
                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-500">Sertifika No</label>
                                <input type="text" value="${escapeHtml(dev.certNo || '')}" placeholder=""
                                    oninput="AppState.currentFormData.measuringDevices[${dIdx}].certNo=this.value; triggerAutoSave();"
                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-500">Kalibrasyon Tarihi</label>
                                <input type="text" value="${escapeHtml(dev.calDate || '')}" placeholder=""
                                    oninput="AppState.currentFormData.measuringDevices[${dIdx}].calDate=this.value; triggerAutoSave();"
                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-500">Geçerlilik Tarihi</label>
                                <input type="text" value="${escapeHtml(dev.validDate || '')}" placeholder=""
                                    oninput="AppState.currentFormData.measuringDevices[${dIdx}].validDate=this.value; triggerAutoSave();"
                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function transferJobNotesToReport(target) {
    const notes = (document.getElementById('editorJobNotesArea')?.value || '').trim();
    if (!notes) {
        showToast('Aktarılacak saha notu bulunamadı', 'warning');
        return;
    }
    const fd = AppState.currentFormData;
    if (target === 'defect') {
        fd.defectNotes = (fd.defectNotes ? fd.defectNotes + '\n' : '') + notes;
        showToast('Kusur açıklamalarına aktarıldı');
    } else {
        fd.generalNotes = (fd.generalNotes ? fd.generalNotes + '\n' : '') + notes;
        showToast('Notlar bölümüne aktarıldı');
    }
    triggerAutoSave();
    paintInspectionEditorUI();
}

function switchEditorTemplate(newTemplateId) {
    const insp = AppState.currentInspection;
    if (!insp) return;
    insp.template_id = String(newTemplateId);
    const tplMeta = (window.ENLAB_REPORT_TEMPLATES || []).find(t => String(t.id) === String(newTemplateId));
    if (tplMeta) insp.template_code = tplMeta.code;
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`Şablon: ${insp.template_code}`);
}

function renderElectrical2201Editor() {
    const tpl = AppState.electricalTemplate;
    if (!tpl || !tpl.areas) return '<div class="p-4 bg-white rounded-xl text-xs">Şablon yüklenemedi.</div>';

    ensureCompanyInfo();
    ensureMeasuringDevices();

    const fd = AppState.currentFormData;
    const areas = tpl.areas.filter(a => a.topics && a.topics.length > 0);

    if (AppState.activeAreaIndex === undefined) AppState.activeAreaIndex = 0;
    const activeIdx = AppState.showAllAreas ? -1 : AppState.activeAreaIndex;

    const tabs = [
        { label: '1. Firma & Tesisat', id: 0 },
        { label: '2. Cihazlar', id: 1 },
        { label: '3. Gözle Kontrol', id: 2 },
        { label: '4. Fonksiyon & Ölçüm', id: 3 },
        { label: `5. Fotoğraflar (${(fd.photos || []).length})`, id: 4 },
        { label: '6. Sonuç & Onay', id: 5 },
        { label: 'Tümü', id: -1 }
    ];

    const tabsHtml = `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            ${tabs.map(t => {
                const isActive = activeIdx === t.id;
                return `
                    <button onclick="if (${t.id} === -1) { AppState.showAllAreas = true; } else { AppState.showAllAreas = false; AppState.activeAreaIndex = ${t.id}; } paintInspectionEditorUI();"
                        class="py-2 px-2.5 rounded-lg text-xs font-bold text-center truncate transition ${
                            isActive ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                        } ${t.id === -1 ? 'col-span-2 sm:col-span-1' : ''}">
                        ${t.label}
                    </button>
                `;
            }).join('')}
        </div>
    `;

    const showTab0 = (activeIdx === 0 || activeIdx === -1);
    const showTab1 = (activeIdx === 1 || activeIdx === -1);
    const showTab2 = (activeIdx === 2 || activeIdx === -1);
    const showTab3 = (activeIdx === 3 || activeIdx === -1);
    const showTab4 = (activeIdx === 4 || activeIdx === -1);
    const showTab5 = (activeIdx === 5 || activeIdx === -1);

    const section1Html = showTab0 ? renderSharedCompanyInfoSection() : '';
    const section4Html = showTab1 ? renderSharedMeasuringDevicesSection('4. Ölçüm Aletleri Bilgileri') : '';
    const photosHtml = showTab4 ? renderPhotoSectionUI() : '';
    const evaluationHtml = showTab5 ? renderEvaluationAndFooterSection() : '';

    const area0Html = (showTab0 && areas[0]) ? renderElectrical2201AreaBlock(areas[0], '2') : '';
    const area1Html = (showTab1 && areas[1]) ? renderElectrical2201AreaBlock(areas[1], '3') : '';
    const area2Html = (showTab2 && areas[2]) ? renderElectrical2201AreaBlock(areas[2], '5') : '';
    const area3Html = (showTab3 && areas[3]) ? renderElectrical2201AreaBlock(areas[3], '6') : '';

    return `
        <div class="space-y-3">
            ${tabsHtml}
            ${section1Html}
            ${area0Html}
            ${section4Html}
            ${area1Html}
            ${area2Html}
            ${area3Html}
            ${photosHtml}
            ${evaluationHtml}
        </div>
    `;
}

function renderElectrical2201AreaBlock(area, secNum) {
    return `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between gap-2">
                <span class="truncate">${secNum}. ${area.name}</span>
                ${area.index === 2 ? `<button onclick="markAllVisualChecksSuitable()" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-[11px] shrink-0">Tümünü Uygun Seç</button>` : ''}
            </div>
            <div class="p-3 space-y-4">
                ${area.topics.map(topic => renderElectrical2201Topic(area, topic, secNum)).join('')}
            </div>
        </div>
    `;
}

function renderElectrical2201Topic(area, topic, secNum) {
    const subNum = `${secNum}.${topic.index + 1}`;
    const tKey = `topic_${area.index}_${topic.index}`;

    if (topic.topicType === 'Table' && topic.tableType === 'FirstRow') {
        return renderDynamicTableTopic(area, topic, subNum, tKey);
    }

    if (topic.topicType === 'Table' && topic.tableType === 'FirstColumn') {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const rowsHtml = topic.questions.map((q, qIdx) => {
            const qKey = `q_${q.guid}`;
            if (AppState.currentFormData.answers[qKey] === undefined) {
                AppState.currentFormData.answers[qKey] = '';
            }
            const val = AppState.currentFormData.answers[qKey];
            const badgeCls = val === 'Uygun'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                : val === 'Uygun Değil'
                ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold'
                : 'border-slate-300 bg-slate-50 text-slate-700 font-semibold';

            const isDefect = (val === 'Uygun Değil' || val === 'Kısmen Uygun');
            const selectedDefect = AppState.currentFormData.itemDefectSelections && AppState.currentFormData.itemDefectSelections[qKey]?.sentence;

            return `
                <div class="border-b border-slate-100 last:border-b-0">
                    <div class="p-2.5 flex items-center justify-between gap-2 text-xs">
                        <div class="min-w-0 flex-1 text-slate-800 leading-snug">
                            <strong class="text-slate-900 mr-1">${letters[qIdx] || (qIdx + 1)}.</strong>${q.question}
                        </div>
                        <select onchange="handleAnswerChange('${qKey}', this.value, '${q.question.replace(/'/g, "\\'")}')"
                            class="w-32 shrink-0 border rounded-lg px-2 py-1.5 text-xs ${badgeCls}">
                            <option value="" ${val === '' ? 'selected' : ''}>Seçiniz...</option>
                            <option value="Uygun" ${val === 'Uygun' ? 'selected' : ''}>✓ Uygun</option>
                            <option value="Uygun Değil" ${val === 'Uygun Değil' ? 'selected' : ''}>✕ Uygun Değil</option>
                            <option value="Uygulaması Yok" ${val === 'Uygulaması Yok' ? 'selected' : ''}>N Uyg. Yok</option>
                            <option value="Görülemedi" ${val === 'Görülemedi' ? 'selected' : ''}>G Görülemedi</option>
                        </select>
                    </div>
                    ${isDefect ? `
                        <div class="mx-2.5 mb-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                            <div class="flex items-start gap-1.5 min-w-0">
                                <i class="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 shrink-0 text-xs"></i>
                                <div class="min-w-0">
                                    <span class="text-[9px] font-bold text-rose-700 uppercase tracking-wide block">Tespit Edilen Uygunsuzluk Cümlesi:</span>
                                    <span class="font-medium text-slate-800 text-[11px] leading-snug block">${selectedDefect || 'Henüz uygunsuzluk cümlesi seçilmedi (seçmek için butona dokunun)'}</span>
                                </div>
                            </div>
                            <button type="button" onclick="openItemDefectPickerModal('${qKey}', '${q.question.replace(/'/g, "\\'")}', 'answer')"
                                class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg font-bold text-[11px] shrink-0 flex items-center gap-1 shadow-2xs transition-all">
                                <i class="fa-solid fa-list-check"></i>
                                <span>${selectedDefect ? 'Değiştir' : 'Cümle Seç'}</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div class="px-3 py-2 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-800">
                    ${subNum}. ${topic.name}
                </div>
                <div>${rowsHtml}</div>
            </div>
        `;
    }

    const colCount = Number(topic.columnCount) || 3;
    const gridCls = colCount === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';
    const questionsHtml = topic.questions.map(q => renderElectrical2201QuestionInput(q, area.index, topic.index)).join('');

    return `
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div class="px-3 py-2 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-800">
                ${subNum}. ${topic.name}
            </div>
            <div class="p-3 grid ${gridCls} gap-2.5">
                ${questionsHtml}
            </div>
        </div>
    `;
}

// Empty defaults so reports start completely blank
const SAMPLE_PDF_DEFAULTS = {};

function renderElectrical2201QuestionInput(q, areaIdx, topicIdx) {
    const fd = AppState.currentFormData;
    const qKey = `q_${q.guid}`;
    const qTitle = q.question || '';
    let val = fd.answers[qKey];

    if (val === undefined) {
        val = '';
        fd.answers[qKey] = val;
    }

    if (q.type === 'YesNo') {
        const opts = ['Uygun', 'Uygun Değil', 'Uygulaması Yok', 'Görülemedi'];
        const optLabels = { 'Uygun': '✓ Uygun', 'Uygun Değil': '✕ Uygun Değil', 'Uygulaması Yok': 'N Uyg. Yok', 'Görülemedi': 'G Görülemedi' };
        const isDefect = (val === 'Uygun Değil' || val === 'Kısmen Uygun');
        const selectedDefect = fd.itemDefectSelections && fd.itemDefectSelections[qKey]?.sentence;

        return `
            <div class="p-2.5 rounded-xl border ${isDefect ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-slate-50/50'} flex flex-col justify-between gap-2 transition-all">
                <div class="flex items-start justify-between gap-2">
                    <label class="text-xs font-semibold text-slate-700 leading-snug">${qTitle}</label>
                    <select onchange="handleAnswerChange('${qKey}', this.value, '${qTitle.replace(/'/g, "\\'")}')"
                        class="border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold bg-white shrink-0 ${isDefect ? 'text-rose-700 border-rose-400' : ''}">
                        <option value="">Seçiniz...</option>
                        ${opts.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${optLabels[o]}</option>`).join('')}
                    </select>
                </div>
                ${isDefect ? `
                    <div class="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                        <div class="flex items-start gap-1.5 min-w-0">
                            <i class="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 shrink-0 text-xs"></i>
                            <div class="min-w-0">
                                <span class="text-[9px] font-bold text-rose-700 uppercase tracking-wide block">Uygunsuzluk Cümlesi:</span>
                                <span class="font-medium text-slate-800 text-[11px] leading-snug block">${selectedDefect || 'Henüz cümle seçilmedi'}</span>
                            </div>
                        </div>
                        <button type="button" onclick="openItemDefectPickerModal('${qKey}', '${qTitle.replace(/'/g, "\\'")}', 'answer')"
                            class="px-2 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg font-bold text-[10px] shrink-0 flex items-center gap-1 shadow-2xs transition-all">
                            <i class="fa-solid fa-list-check"></i>
                            <span>${selectedDefect ? 'Değiştir' : 'Cümle Seç'}</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    if (q.type === 'MultipleChoice' && Array.isArray(q.options) && q.options.length > 0) {
        const opts = q.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
        return `
            <div class="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40 flex flex-col justify-between">
                <label class="block text-[11px] font-bold text-slate-700 mb-1 leading-snug">${qTitle}</label>
                <select onchange="handleAnswerChange('${qKey}', this.value, '${qTitle.replace(/'/g, "\\'")}')"
                    class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-semibold text-slate-900">
                    <option value="">Seçiniz...</option>
                    ${opts}
                </select>
            </div>
        `;
    }

    return `
        <div class="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40 flex flex-col justify-between">
            <label class="block text-[11px] font-bold text-slate-700 mb-1 leading-snug">${qTitle}</label>
            <input type="text" value="${String(val || '').replace(/"/g, '&quot;')}"
                oninput="handleAnswerChange('${qKey}', this.value)"
                placeholder=""
                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium focus:border-sky-500 focus:outline-none">
        </div>
    `;
}

// Short, compact abbreviations for Section 6.4 (Aşırı Akım Koruma Elemanı İle İletken Uyumu ve RCD)
function getShortTopicQuestionLabel(areaIdx, topicIdx, questionText) {
    const q = questionText || '';
    if (areaIdx === 3 && topicIdx === 3) {
        if (q.includes('Pano/Tablo')) return 'Pano / Linye';
        if (q.includes('Açma eğrisi')) return 'Eğri';
        if (q.includes('Kutup sayısı')) return 'Kutup';
        if (q.includes('Nominal akımı In')) return 'In (A)';
        if (q.includes('Icu')) return 'Icu (kA)';
        if (q.includes('Faz kesiti')) return 'Faz (mm²)';
        if (q.includes('N/PEN')) return 'N/PEN (mm²)';
        if (q.includes('PE Koruma')) return 'PE (mm²)';
        if (q.includes('Ib')) return 'Ib (A)';
        if (q.includes('Iz')) return 'Iz (A)';
        if (q.includes('IΔ')) return 'IΔ (mA)';
        if (q.includes('TΔ')) return 'TΔ (ms)';
        if (q.includes('Değerlendirme')) return 'Sonuç';
    }
    return q;
}

function renderDynamicTableTopic(area, topic, subNum, tKey) {
    const fd = AppState.currentFormData;
    if (!fd.tableRows[tKey] || !fd.tableRows[tKey].length) {
        fd.tableRows[tKey] = [createDefaultTopicRow(area, topic, 1)];
    }
    const rows = fd.tableRows[tKey];
    const isSection64 = area.index === 3 && topic.index === 3;
    const gridClass = isSection64 ? 'grid-cols-3 sm:grid-cols-4 gap-1.5' : 'grid-cols-2 gap-2';

    const cardsHtml = rows.map((rowObj, rIdx) => {
        const fieldsHtml = topic.questions.map((q, qIdx) => {
            const cellVal = rowObj[q.guid] ?? '';
            const shortLabel = getShortTopicQuestionLabel(area.index, topic.index, q.question);
            if (q.type === 'YesNo') {
                return `
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5 truncate" title="${q.question}">${shortLabel}</label>
                        <select onchange="handleTopicTableCell('${tKey}', ${rIdx}, '${q.guid}', this.value)"
                            class="w-full border border-slate-300 rounded-lg px-1.5 py-1.5 text-xs bg-white font-bold text-slate-900">
                            <option value="" ${cellVal === '' ? 'selected' : ''}>Seç</option>
                            <option value="Uygun" ${cellVal === 'Uygun' || cellVal === '✓' ? 'selected' : ''}>✓ Uygun</option>
                            <option value="Uygun Değil" ${cellVal === 'Uygun Değil' || cellVal === 'X' ? 'selected' : ''}>X Uygun Değil</option>
                            <option value="Uygulaması Yok" ${cellVal === 'Uygulaması Yok' || cellVal === 'N' ? 'selected' : ''}>N Uyg. Yok</option>
                            <option value="Görülemedi" ${cellVal === 'Görülemedi' || cellVal === 'G' ? 'selected' : ''}>G Görülemedi</option>
                        </select>
                    </div>
                `;
            }
            const spanClass = isSection64 ? (qIdx === 0 ? 'col-span-2' : '') : (qIdx === 0 ? 'col-span-2' : '');
            return `
                <div class="${spanClass}">
                    <label class="block text-[10px] font-bold text-slate-600 mb-0.5 truncate" title="${q.question}">${shortLabel}</label>
                    <input type="text" value="${String(cellVal).replace(/"/g, '&quot;')}"
                        oninput="handleTopicTableCell('${tKey}', ${rIdx}, '${q.guid}', this.value)"
                        class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white focus:border-sky-500 focus:outline-none">
                </div>
            `;
        }).join('');

        return `
            <div class="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">
                    <span class="font-bold text-xs text-slate-800">Satır #${rIdx + 1}</span>
                    <div class="flex items-center gap-1.5">
                        <button onclick="duplicateSpecificTopicRow('${tKey}', ${rIdx})" class="px-2.5 py-1 bg-sky-100 active:bg-sky-200 text-sky-800 rounded-lg text-xs font-bold flex items-center gap-1">
                            <i class="fa-solid fa-copy"></i>
                            <span>Kopyala</span>
                        </button>
                        <button onclick="removeTopicTableRow('${tKey}', ${rIdx})" class="px-2 py-1 bg-rose-50 active:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold">
                            <i class="fa-solid fa-trash-can mr-1"></i>Sil
                        </button>
                    </div>
                </div>
                <div class="grid ${gridClass}">
                    ${fieldsHtml}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div class="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2">
                <span class="font-bold text-xs text-slate-800 truncate">${subNum}. ${topic.name}</span>
                <button onclick="addTopicTableRow('${tKey}', ${area.index}, ${topic.index})" class="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs shrink-0">
                    + Satır Ekle
                </button>
            </div>
            <div class="p-2.5 space-y-2.5">
                ${cardsHtml}
            </div>
        </div>
    `;
}

function createDefaultTopicRow(area, topic, rowNum) {
    const obj = {};
    topic.questions.forEach((q) => {
        obj[q.guid] = '';
    });
    return obj;
}

function duplicateSpecificTopicRow(tKey, rowIndex) {
    const rows = AppState.currentFormData.tableRows[tKey] || [];
    if (!rows[rowIndex]) return;
    const copy = JSON.parse(JSON.stringify(rows[rowIndex]));
    rows.push(copy);
    AppState.currentFormData.tableRows[tKey] = rows;
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`Satır #${rowIndex + 1} kopyalanıp sona eklendi`);
}

function handleTopicTableCell(tKey, rowIndex, qGuid, value) {
    const rows = AppState.currentFormData.tableRows[tKey];
    if (!rows || !rows[rowIndex]) return;
    rows[rowIndex][qGuid] = value;
    triggerAutoSave();
}

function addTopicTableRow(tKey, areaIdx, topicIdx) {
    const tpl = AppState.electricalTemplate;
    const area = tpl?.areas?.[areaIdx];
    const targetTopic = area?.topics?.[topicIdx];
    if (!targetTopic) return;
    const rows = AppState.currentFormData.tableRows[tKey] || [];
    rows.push(createDefaultTopicRow(area, targetTopic, rows.length + 1));
    AppState.currentFormData.tableRows[tKey] = rows;
    triggerAutoSave();
    paintInspectionEditorUI();
}

function cloneLastTopicTableRow(tKey, areaIdx, topicIdx) {
    const rows = AppState.currentFormData.tableRows[tKey] || [];
    if (!rows.length) return addTopicTableRow(tKey, areaIdx, topicIdx);
    const copy = JSON.parse(JSON.stringify(rows[rows.length - 1]));
    rows.push(copy);
    triggerAutoSave();
    paintInspectionEditorUI();
}

function removeTopicTableRow(tKey, rowIndex) {
    const rows = AppState.currentFormData.tableRows[tKey] || [];
    if (rows.length <= 1) return showToast('En az 1 ölçüm satırı kalmalıdır', 'warning');
    rows.splice(rowIndex, 1);
    triggerAutoSave();
    paintInspectionEditorUI();
}

function setThermalCameraNotApplicable(tKey) {
    const tpl = AppState.electricalTemplate;
    const area = tpl?.areas?.[1];
    const topic = area?.topics?.[0];
    if (!topic) return;
    const obj = {};
    topic.questions.forEach((q, idx) => {
        obj[q.guid] = idx === 0 ? 'Uygulaması Yok' : '';
    });
    AppState.currentFormData.tableRows[tKey] = [obj];
    triggerAutoSave();
    paintInspectionEditorUI();
}

function autofillThermalCamera(tKey) {
    const tpl = AppState.electricalTemplate;
    const area = tpl?.areas?.[1];
    const topic = area?.topics?.[0];
    if (!topic) return;
    AppState.currentFormData.tableRows[tKey] = [createDefaultTopicRow(area, topic, 1)];
    triggerAutoSave();
    paintInspectionEditorUI();
}

// ============================================================================
// B) SPECIALIZED TEMPLATES EDITOR (Topraklama, Paratoner, Jeneratör, Yangın, Kapı, Raf, Klima...)
// ============================================================================

function normalizeSpecializedRowsArray(rows, cols) {
    if (!Array.isArray(rows) || !rows.length) return [];
    return rows.map((r, rIdx) => {
        if (Array.isArray(r)) return r;
        if (r && typeof r === 'object') {
            return (cols || []).map((col, cIdx) => {
                const k = col.key || col.id;
                if (k && r[k] !== undefined) return r[k];
                if (cIdx === 0) return String(rIdx + 1);
                return col.default || '';
            });
        }
        return [];
    });
}

function renderSpecializedTemplateEditor() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);
    const cols = schema.tableColumns || [];

    ensureCompanyInfo();
    ensureMeasuringDevices();

    if (AppState.activeSpecTab === undefined) AppState.activeSpecTab = 0;
    const activeTab = AppState.activeSpecTab;

    if (!fd.specializedRows || !fd.specializedRows.length) {
        fd.specializedRows = [new Array(cols.length).fill('')];
    } else {
        fd.specializedRows = normalizeSpecializedRowsArray(fd.specializedRows, cols);
    }

    const tabs = [
        { label: '1. Firma & Cihaz', id: 0 },
        { label: '2. Teknik Bilgiler', id: 1 },
        { label: '3. Kontrol Kriterleri', id: 2 },
        { label: `4. Ölçüm (${fd.specializedRows.length})`, id: 3 },
        { label: `5. Fotoğraflar (${(fd.photos || []).length})`, id: 4 },
        { label: '6. Sonuç & Onay', id: 5 },
        { label: 'Tümü', id: -1 }
    ];

    const tabsHtml = `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            ${tabs.map(t => {
                const isActive = activeTab === t.id;
                return `
                    <button onclick="AppState.activeSpecTab=${t.id}; paintInspectionEditorUI();"
                        class="py-2 px-2.5 rounded-lg text-xs font-bold text-center truncate transition ${
                            isActive ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                        } ${t.id === -1 ? 'col-span-2 sm:col-span-1' : ''}">
                        ${t.label}
                    </button>
                `;
            }).join('')}
        </div>
    `;

    const rawFields = schema.generalFields || schema.fields || [];
    const fieldsHtml = rawFields.map(f => {
        const fId = f.key || f.id;
        if (fd.specializedFields[fId] === undefined) fd.specializedFields[fId] = '';
        const val = fd.specializedFields[fId];
        if (f.type === 'select' || (Array.isArray(f.options) && f.options.length > 0)) {
            const opts = (f.options || []).map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
            return `
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">${f.label}</label>
                    <select onchange="AppState.currentFormData.specializedFields['${fId}']=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-semibold">
                        <option value="">Seçiniz...</option>
                        ${opts}
                    </select>
                </div>
            `;
        }
        return `
            <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">${f.label}</label>
                <input type="text" value="${String(val).replace(/"/g, '&quot;')}"
                    oninput="AppState.currentFormData.specializedFields['${fId}']=this.value; triggerAutoSave();"
                    class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
            </div>
        `;
    }).join('');

    const checksHtml = (schema.visualChecks || []).map((chkText, idx) => {
        const cKey = `chk_${idx}`;
        if (fd.specializedChecks[cKey] === undefined) fd.specializedChecks[cKey] = '';
        const val = fd.specializedChecks[cKey];
        const isDefect = (val === 'Uygun Değil' || val === 'Kısmen Uygun');
        const selectedDefect = fd.itemDefectSelections && fd.itemDefectSelections[cKey]?.sentence;
        const colorCls = val === 'Uygun'
            ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold'
            : isDefect
            ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold'
            : 'border-slate-300 bg-slate-50 text-slate-700';

        return `
            <div class="rounded-xl border ${isDefect ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-slate-50/60'} overflow-hidden transition-all">
                <div class="p-2.5 flex items-center justify-between gap-2">
                    <span class="text-xs font-medium text-slate-800 min-w-0 flex-1"><strong class="text-slate-900 mr-1">${idx + 1}.</strong>${chkText}</span>
                    <select onchange="handleSpecializedCheckChange('${cKey}', this.value, '${chkText.replace(/'/g, "\\'")}')"
                        class="w-32 shrink-0 border rounded-lg px-2 py-1.5 text-xs ${colorCls}">
                        <option value="" ${val === '' ? 'selected' : ''}>Seçiniz...</option>
                        <option value="Uygun" ${val === 'Uygun' ? 'selected' : ''}>✓ Uygun</option>
                        <option value="Uygun Değil" ${val === 'Uygun Değil' ? 'selected' : ''}>✕ Uygun Değil</option>
                        <option value="Uygulaması Yok" ${val === 'Uygulaması Yok' ? 'selected' : ''}>N Uyg. Yok</option>
                        <option value="Görülemedi" ${val === 'Görülemedi' ? 'selected' : ''}>G Görülemedi</option>
                    </select>
                </div>
                ${isDefect ? `
                    <div class="mx-2.5 mb-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                        <div class="flex items-start gap-1.5 min-w-0">
                            <i class="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 shrink-0 text-xs"></i>
                            <div class="min-w-0">
                                <span class="text-[9px] font-bold text-rose-700 uppercase tracking-wide block">Tespit Edilen Uygunsuzluk:</span>
                                <span class="font-medium text-slate-800 text-[11px] leading-snug block">${selectedDefect || 'Henüz uygunsuzluk cümlesi seçilmedi'}</span>
                            </div>
                        </div>
                        <button type="button" onclick="openItemDefectPickerModal('${cKey}', '${chkText.replace(/'/g, "\\'")}', 'specialized')"
                            class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg font-bold text-[10px] shrink-0 flex items-center gap-1 shadow-2xs transition-all">
                            <i class="fa-solid fa-list-check"></i>
                            <span>${selectedDefect ? 'Değiştir' : 'Cümle Seç'}</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    const cardsHtml = fd.specializedRows.map((row, rIdx) => {
        const inputs = cols.map((col, cIdx) => `
            <div class="${cIdx === 1 ? 'col-span-2' : ''}">
                <label class="block text-[10px] font-bold text-slate-500 mb-0.5 truncate">${col.label}</label>
                <input type="text" value="${String(row[cIdx] ?? '').replace(/"/g, '&quot;')}"
                    oninput="AppState.currentFormData.specializedRows[${rIdx}][${cIdx}]=this.value; triggerAutoSave();"
                    class="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-sky-500 focus:outline-none">
            </div>
        `).join('');
        return `
            <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">
                    <span class="font-bold text-xs text-slate-800">Satır #${rIdx + 1}</span>
                    <div class="flex items-center gap-1.5">
                        <button onclick="duplicateSpecificSpecializedRow(${rIdx})" class="px-2.5 py-1 bg-sky-100 active:bg-sky-200 text-sky-800 rounded-lg text-xs font-bold flex items-center gap-1">
                            <i class="fa-solid fa-copy"></i>
                            <span>Kopyala</span>
                        </button>
                        <button onclick="AppState.currentFormData.specializedRows.splice(${rIdx},1); triggerAutoSave(); paintInspectionEditorUI();"
                            class="px-2 py-1 bg-rose-50 active:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold">
                            <i class="fa-solid fa-trash-can mr-1"></i>Sil
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    ${inputs}
                </div>
            </div>
        `;
    }).join('');

    const showCompany = (activeTab === 0 || activeTab === -1);
    const companyHtml = !showCompany ? '' : `
        ${renderSharedCompanyInfoSection()}
        ${renderSharedMeasuringDevicesSection('Ölçüm Aletleri Bilgileri')}
    `;

    const showTech = (activeTab === 1 || activeTab === -1);
    const techHtml = !showTech ? '' : `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs">
                2. Teknik Bilgiler
            </div>
            <div class="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${fieldsHtml}
            </div>
        </div>
    `;

    const showChecks = (activeTab === 2 || activeTab === -1);
    const checksBlockHtml = !showChecks ? '' : `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between">
                <span>3. Kontrol Kriterleri</span>
                <button onclick="markAllVisualChecksSuitable()" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs">
                    <i class="fa-solid fa-check-double"></i>
                    <span>Tümünü Uygun Seç</span>
                </button>
            </div>
            <div class="p-3 space-y-2">
                ${checksHtml}
            </div>
        </div>
    `;

    const showRows = (activeTab === 3 || activeTab === -1);
    const rowsBlockHtml = !showRows ? '' : `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white flex items-center justify-between gap-2">
                <span class="font-bold text-xs">4. Ölçüm Sonuçları (${fd.specializedRows.length})</span>
                <button onclick="addSpecializedRow(${cols.length})" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs">
                    <i class="fa-solid fa-plus"></i>
                    <span>Satır Ekle</span>
                </button>
            </div>
            <div class="p-3 space-y-2.5">
                ${cardsHtml}
            </div>
        </div>
    `;

    const showPhotos = (activeTab === 4 || activeTab === -1);
    const photosHtml = !showPhotos ? '' : renderPhotoSectionUI();

    const showEval = (activeTab === 5 || activeTab === -1);
    const evalHtml = !showEval ? '' : renderEvaluationAndFooterSection();

    return `
        <div class="space-y-3">
            ${tabsHtml}
            ${companyHtml}
            ${techHtml}
            ${checksBlockHtml}
            ${rowsBlockHtml}
            ${photosHtml}
            ${evalHtml}
        </div>
    `;
}

function addSpecializedRow(colCount) {
    const rows = AppState.currentFormData.specializedRows || [];
    const newRow = new Array(colCount).fill('');
    rows.push(newRow);
    AppState.currentFormData.specializedRows = rows;
    triggerAutoSave();
    paintInspectionEditorUI();
}

function duplicateSpecificSpecializedRow(rowIndex) {
    const rows = AppState.currentFormData.specializedRows || [];
    if (!rows[rowIndex]) return;
    const copy = JSON.parse(JSON.stringify(rows[rowIndex]));
    rows.push(copy);
    AppState.currentFormData.specializedRows = rows;
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`Satır #${rowIndex + 1} kopyalanıp sona eklendi`);
}

function cloneSpecializedRow() {
    const rows = AppState.currentFormData.specializedRows || [];
    if (!rows.length) return addSpecializedRow(6);
    const copy = [...rows[rows.length - 1]];
    rows.push(copy);
    triggerAutoSave();
    paintInspectionEditorUI();
}

// ============================================================================
// PHOTO MANAGEMENT & GALLERY EXPORT HELPERS
// ============================================================================

function compressImage(file, maxDimension = 1280, quality = 0.78) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Dosya okunamadı'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Resim yüklenemedi'));
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium';
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);

                // RAM Koruması: Canvas ve Image hafızasını GPU/RAM'den anında boşalt
                canvas.width = 0;
                canvas.height = 0;
                img.src = '';

                resolve(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function handlePhotoUpload(input) {
    const files = input.files;
    if (!files || files.length === 0) return;
    const fd = AppState.currentFormData;
    if (!fd.photos) fd.photos = [];
    
    showToast(`${files.length} fotoğraf güvenle optimize ediliyor...`);
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (files.length > 1) {
                showToast(`Fotoğraf optimize ediliyor (${i + 1}/${files.length})...`);
            }
            const dataUrl = await compressImage(file, 1280, 0.78);
            const photoNum = fd.photos.length + 1;
            fd.photos.push({
                id: 'ph_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                dataUrl: dataUrl,
                caption: `Fotoğraf ${photoNum}`,
                date: new Date().toLocaleDateString('tr-TR')
            });
        }
        triggerAutoSave();
        paintInspectionEditorUI();
        showToast(`${files.length} fotoğraf hafıza korumasıyla rapora eklendi!`);
    } catch (err) {
        console.error('Fotoğraf yükleme hatası:', err);
        showToast('Fotoğraf işlenirken hata oluştu: ' + (err.message || ''), 'error');
    } finally {
        input.value = '';
    }
}

function removeReportPhoto(idx) {
    const fd = AppState.currentFormData;
    if (!fd.photos || !fd.photos[idx]) return;
    if (confirm('Bu fotoğrafı rapordan silmek istediğinizden emin misiniz?')) {
        fd.photos.splice(idx, 1);
        triggerAutoSave();
        paintInspectionEditorUI();
        showToast('Fotoğraf silindi');
    }
}

function updatePhotoCaption(idx, caption) {
    const fd = AppState.currentFormData;
    if (!fd.photos || !fd.photos[idx]) return;
    fd.photos[idx].caption = caption;
    triggerAutoSave();
}

function savePhotoToGallery(idx) {
    const fd = AppState.currentFormData;
    if (!fd.photos || !fd.photos[idx]) return;
    const photo = fd.photos[idx];
    const insp = AppState.currentInspection;
    const reportNo = (insp?.report_no || 'TKM_RAPOR').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeCaption = (photo.caption || `foto_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${reportNo}_${safeCaption}_${Date.now()}.jpg`;

    // If running in Android App via native WebView bridge
    if (window.AndroidBridge && typeof window.AndroidBridge.savePhotoToGallery === 'function') {
        const success = window.AndroidBridge.savePhotoToGallery(photo.dataUrl, fileName);
        if (success) {
            showToast(`Fotoğraf cihaz galerisine kaydedildi: ${fileName}`);
        } else {
            showToast('Fotoğraf galeriye kaydedilemedi', 'error');
        }
        return;
    }

    // Web browser / desktop fallback
    try {
        const a = document.createElement('a');
        a.href = photo.dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Fotoğraf indirildi: ${fileName}`);
    } catch (err) {
        console.error(err);
        showToast('Fotoğraf indirilemedi', 'error');
    }
}

function saveAllPhotosToGallery() {
    const fd = AppState.currentFormData;
    if (!fd.photos || fd.photos.length === 0) {
        showToast('Raporda kayıtlı fotoğraf bulunmuyor', 'warning');
        return;
    }

    let savedCount = 0;
    const insp = AppState.currentInspection;
    const reportNo = (insp?.report_no || 'TKM_RAPOR').replace(/[^a-zA-Z0-9_-]/g, '_');

    fd.photos.forEach((photo, idx) => {
        const safeCaption = (photo.caption || `foto_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${reportNo}_${safeCaption}_${Date.now()}_${idx + 1}.jpg`;
        if (window.AndroidBridge && typeof window.AndroidBridge.savePhotoToGallery === 'function') {
            const ok = window.AndroidBridge.savePhotoToGallery(photo.dataUrl, fileName);
            if (ok) savedCount++;
        } else {
            const a = document.createElement('a');
            a.href = photo.dataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            setTimeout(() => {
                a.click();
                document.body.removeChild(a);
            }, idx * 250);
            savedCount++;
        }
    });

    showToast(`${savedCount} fotoğraf galeriye kaydedildi!`);
}

function openPhotoPreviewModal(idx) {
    const fd = AppState.currentFormData;
    if (!fd.photos || !fd.photos[idx]) return;
    const photo = fd.photos[idx];
    
    let modal = document.getElementById('photoPreviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photoPreviewModal';
        modal.className = 'fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-3';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="relative max-w-3xl w-full max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <div class="p-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
                <span class="font-bold text-xs truncate">${photo.caption || 'Fotoğraf Önizleme'}</span>
                <div class="flex items-center gap-2">
                    <button onclick="savePhotoToGallery(${idx})" class="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                        <i class="fa-solid fa-download"></i> Galeriye Kaydet
                    </button>
                    <button onclick="document.getElementById('photoPreviewModal').classList.add('hidden')" class="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-auto p-2 flex items-center justify-center bg-black">
                <img src="${photo.dataUrl}" class="max-w-full max-h-[75vh] object-contain rounded-lg">
            </div>
            <div class="p-2.5 bg-slate-950 text-slate-300 text-[11px] text-center border-t border-slate-800">
                Tarih: ${photo.date || '-'} | Cihaza / Galeriye indirmek için yukarıdaki butona basınız
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function renderPhotoSectionUI() {
    const fd = AppState.currentFormData;
    if (!fd.photos) fd.photos = [];
    const photos = fd.photos;

    return `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-3 p-3.5 text-xs">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-camera text-sky-600 text-sm"></i>
                    <span class="font-bold text-slate-900">Rapor Fotoğrafları (${photos.length})</span>
                </div>
                ${photos.length > 0 ? `
                    <button onclick="saveAllPhotosToGallery()" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-2xs">
                        <i class="fa-solid fa-cloud-arrow-down"></i>
                        <span>Tümünü Galeriye Kaydet</span>
                    </button>
                ` : ''}
            </div>

            <!-- Upload / Camera Buttons -->
            <div class="grid grid-cols-2 gap-2">
                <label class="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed border-sky-400 bg-sky-50 text-sky-800 font-bold text-xs cursor-pointer active:bg-sky-100 transition text-center">
                    <i class="fa-solid fa-camera text-base"></i>
                    <span>Kamera ile Çek</span>
                    <input type="file" accept="image/*" capture="environment" class="hidden" onchange="handlePhotoUpload(this)">
                </label>
                <label class="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer active:bg-slate-100 transition text-center">
                    <i class="fa-regular fa-images text-base"></i>
                    <span>Galeriden Seç</span>
                    <input type="file" accept="image/*" multiple class="hidden" onchange="handlePhotoUpload(this)">
                </label>
            </div>

            <!-- Photos Grid -->
            ${photos.length === 0 ? `
                <div class="py-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                    Henüz fotoğraf eklenmedi. Sahadan fotoğraf çekmek veya cihaz galerisinden yüklemek için yukarıdaki butonları kullanabilirsiniz. Eklenen fotoğraflar PDF raporunda yer alır ve daha sonra galeriye kaydedilebilir.
                </div>
            ` : `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    ${photos.map((ph, idx) => `
                        <div class="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs">
                            <div class="relative bg-black h-36 flex items-center justify-center cursor-pointer group" onclick="openPhotoPreviewModal(${idx})">
                                <img src="${ph.dataUrl}" class="max-h-full max-w-full object-contain">
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                    <i class="fa-solid fa-magnifying-glass-plus"></i> Büyüt
                                </div>
                                <span class="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-bold">
                                    #${idx + 1}
                                </span>
                            </div>
                            <div class="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Fotoğraf Açıklaması / Başlık</label>
                                    <div class="flex items-center gap-1.5">
                                        <input type="text" id="photoCaptionInput_${idx}" value="${ph.caption || ''}"
                                            placeholder="Fotoğraf açıklaması..."
                                            oninput="updatePhotoCaption(${idx}, this.value)"
                                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium bg-white">
                                        <button type="button" onclick="toggleVoiceDictation('photoCaptionInput_${idx}', 'btnVoiceCaption_${idx}')"
                                            id="btnVoiceCaption_${idx}"
                                            class="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shrink-0"
                                            title="Sesle Açıklama Söyle">
                                            <i class="fa-solid fa-microphone"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                                    <div class="flex items-center gap-2.5">
                                        <button onclick="openPhotoAnnotatorModal(${idx})" class="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 active:scale-95" title="Fotoğraf üzerine kırmızı ok veya halka çizin">
                                            <i class="fa-solid fa-pen-ruler"></i> Kusuru İşaretle
                                        </button>
                                        <button onclick="savePhotoToGallery(${idx})" class="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 active:scale-95">
                                            <i class="fa-solid fa-floppy-disk"></i> Galeri
                                        </button>
                                    </div>
                                    <button onclick="removeReportPhoto(${idx})" class="text-slate-400 hover:text-rose-600 font-bold flex items-center gap-1 active:scale-95">
                                        <i class="fa-solid fa-trash-can"></i> Sil
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

// ============================================================================
// ELEKTRİK UYGUNSUZLUK KÜTÜPHANESİ & AKILLI SEÇİCİ MODALİ
// ============================================================================

const DefectLibraryManager = {
    STORAGE_KEY: 'enlab_defects_library_v1',
    activeCategory: 'Tümü',
    searchQuery: '',

    getAll() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch (e) {
            console.warn('Defect library load error:', e);
        }
        const initial = window.DEFAULT_NON_CONFORMITY_LIBRARY || [];
        this.saveAll(initial);
        return initial;
    },

    saveAll(list) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.error('Defect library save error:', e);
        }
    },

    addItem(text, category = 'İç Tesisat') {
        const trimmed = (text || '').trim();
        if (!trimmed) return null;
        const all = this.getAll();
        const newId = 'custom_' + Date.now();
        all.unshift({ id: newId, category: category || 'İç Tesisat', text: trimmed, isCustom: true });
        this.saveAll(all);
        return newId;
    },

    deleteItem(id) {
        let all = this.getAll();
        all = all.filter(item => item.id !== id);
        this.saveAll(all);
    },

    resetToDefault() {
        const initial = window.DEFAULT_NON_CONFORMITY_LIBRARY || [];
        this.saveAll(initial);
        return initial;
    }
};

let currentPickerSelectedIds = new Set();

function openNonConformityPickerModal() {
    currentPickerSelectedIds = new Set();
    DefectLibraryManager.searchQuery = '';

    const tplId = String(AppState.currentInspection?.template_id || '');
    if (tplId === '2201') DefectLibraryManager.activeCategory = 'İç Tesisat';
    else if (tplId === '2202') DefectLibraryManager.activeCategory = 'Topraklama';
    else if (tplId === '2205') DefectLibraryManager.activeCategory = 'Jeneratör';
    else DefectLibraryManager.activeCategory = 'Tümü';

    renderNonConformityPickerModalUI();
}

function renderNonConformityPickerModalUI() {
    const all = DefectLibraryManager.getAll();
    const q = (DefectLibraryManager.searchQuery || '').toLowerCase();
    const cat = DefectLibraryManager.activeCategory;

    const filtered = all.filter(item => {
        const matchCat = (cat === 'Tümü' || item.category === cat);
        const matchQuery = !q || item.text.toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
        return matchCat && matchQuery;
    });

    const categories = ['Tümü', 'İç Tesisat', 'Topraklama', 'Jeneratör'];
    const catPills = categories.map(c => `
        <button type="button" onclick="setDefectCategory('${c}')"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cat === c ? 'bg-sky-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }">
            ${c}
        </button>
    `).join('');

    const itemsHtml = filtered.length ? filtered.map(item => {
        const isChecked = currentPickerSelectedIds.has(item.id);
        return `
            <div class="flex items-start gap-2.5 p-2.5 rounded-xl border ${
                isChecked ? 'border-sky-500 bg-sky-50/70' : 'border-slate-200 bg-white hover:border-slate-300'
            } transition-all">
                <input type="checkbox" id="chk_${item.id}"
                    onchange="togglePickerItemSelection('${item.id}', this.checked)"
                    ${isChecked ? 'checked' : ''}
                    class="w-4 h-4 accent-sky-600 rounded mt-0.5 shrink-0 cursor-pointer">
                <label for="chk_${item.id}" class="flex-1 text-xs text-slate-800 leading-relaxed cursor-pointer font-medium select-none">
                    <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1.5 ${
                        item.category === 'İç Tesisat' ? 'bg-amber-100 text-amber-800' :
                        item.category === 'Topraklama' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-violet-100 text-violet-800'
                    }">${item.category}</span>
                    ${item.text}
                </label>
                <button type="button" onclick="deleteDefectItemFromPicker('${item.id}', event)"
                    class="text-slate-400 hover:text-rose-600 p-1 shrink-0 rounded transition-all"
                    title="Bu uygunsuzluk maddesini kütüphaneden sil">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
    }).join('') : `
        <div class="p-6 text-center text-slate-400 text-xs">
            Aradığınız kritere uygun madde bulunamadı. Aşağıdaki kutudan yeni bir madde ekleyebilirsiniz.
        </div>
    `;

    const modalBody = `
        <div class="space-y-3 text-xs">
            <!-- ARAMA VE KATEGORİ -->
            <div class="space-y-2">
                <div class="relative">
                    <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400"></i>
                    <input type="text" value="${DefectLibraryManager.searchQuery}"
                        oninput="onDefectSearchInput(this.value)"
                        placeholder="Uygunsuzluk maddesi ara (örn: paspas, pleksi, etiket, kilit, direnç, jeneratör...)"
                        class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-sky-500 focus:outline-none">
                </div>
                <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
                    ${catPills}
                </div>
            </div>

            <!-- LİSTE -->
            <div id="defectsListScrollContainer" class="space-y-1.5 max-h-60 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                ${itemsHtml}
            </div>

            <!-- YENİ UYGUNSUZLUK EKLE ALANI -->
            <div class="bg-slate-100/90 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                        <i class="fa-solid fa-circle-plus text-sky-600"></i> Yeni Uygunsuzluk Tanımla & Listeye Kaydet
                    </span>
                    <button type="button" onclick="resetDefectsLibraryConfirm()" class="text-[10px] text-slate-400 hover:text-slate-700 underline">
                        Varsayılana Sıfırla
                    </button>
                </div>
                <div class="flex gap-1.5">
                    <input type="text" id="newDefectCustomText"
                        placeholder="Yeni uygunsuzluk açıklamasını yazın..."
                        class="flex-1 border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:border-sky-500 focus:outline-none">
                    <button type="button" onclick="submitNewDefectToLibrary()"
                        class="px-3 py-1.5 bg-slate-900 active:bg-slate-800 text-white font-bold rounded-lg text-xs shrink-0 flex items-center gap-1">
                        <span>+ Ekle</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    const selectedCount = currentPickerSelectedIds.size;
    const modalFooter = `
        <div class="flex items-center justify-between w-full">
            <span class="text-xs text-slate-500 font-semibold">
                Seçilen: <strong class="text-sky-600">${selectedCount}</strong> madde
            </span>
            <div class="flex items-center gap-2">
                <button type="button" onclick="closeModal()" class="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs">
                    Kapat
                </button>
                <button type="button" onclick="applySelectedDefectsToReport()"
                    class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all">
                    <i class="fa-solid fa-check"></i>
                    <span>Seçilenleri Rapora Ekle (${selectedCount})</span>
                </button>
            </div>
        </div>
    `;

    openModal('Uygunsuzluk Kütüphanesi & Seçici', modalBody, modalFooter);
}

function setDefectCategory(cat) {
    DefectLibraryManager.activeCategory = cat;
    renderNonConformityPickerModalUI();
}

function onDefectSearchInput(val) {
    DefectLibraryManager.searchQuery = val;
    renderNonConformityPickerModalUI();
}

function togglePickerItemSelection(id, isChecked) {
    if (isChecked) {
        currentPickerSelectedIds.add(id);
    } else {
        currentPickerSelectedIds.delete(id);
    }
    renderNonConformityPickerModalUI();
}

function submitNewDefectToLibrary() {
    const input = document.getElementById('newDefectCustomText');
    const val = (input?.value || '').trim();
    if (!val) {
        showToast('Lütfen uygunsuzluk metnini yazın', 'warning');
        input?.focus();
        return;
    }
    const cat = DefectLibraryManager.activeCategory === 'Tümü' ? 'İç Tesisat' : DefectLibraryManager.activeCategory;
    const newId = DefectLibraryManager.addItem(val, cat);
    if (newId) {
        currentPickerSelectedIds.add(newId);
        showToast('Yeni uygunsuzluk listeye kaydedildi ve seçildi');
        renderNonConformityPickerModalUI();
    }
}

function deleteDefectItemFromPicker(id, event) {
    if (event) event.stopPropagation();
    if (!confirm('Bu uygunsuzluk maddesini kütüphaneden silmek istediğinize emin misiniz?')) return;
    DefectLibraryManager.deleteItem(id);
    currentPickerSelectedIds.delete(id);
    showToast('Madde listeden silindi');
    renderNonConformityPickerModalUI();
}

function resetDefectsLibraryConfirm() {
    if (!confirm('Tüm uygunsuzluk listesi varsayılan standart listeye sıfırlansın mı?')) return;
    DefectLibraryManager.resetToDefault();
    currentPickerSelectedIds.clear();
    showToast('Uygunsuzluk listesi varsayılana sıfırlandı');
    renderNonConformityPickerModalUI();
}

function applySelectedDefectsToReport() {
    if (!currentPickerSelectedIds.size) {
        showToast('Lütfen listeden en az bir uygunsuzluk maddesi seçin', 'warning');
        return;
    }
    const all = DefectLibraryManager.getAll();
    const selectedItems = all.filter(item => currentPickerSelectedIds.has(item.id));
    if (!selectedItems.length) return;

    const fd = AppState.currentFormData;
    let currentText = (fd.defectNotes || '').trim();

    const linesToAdd = selectedItems.map(item => `• ${item.text}`);
    if (currentText) {
        currentText += '\n' + linesToAdd.join('\n');
    } else {
        currentText = linesToAdd.join('\n');
    }

    fd.defectNotes = currentText;
    fd.overallResult = 'UYGUN DEĞİL';
    if (AppState.currentInspection) {
        AppState.currentInspection.result_status = 'UYGUN DEĞİL';
    }

    triggerAutoSave();
    closeModal();

    const ta = document.getElementById('defectNotesTextarea');
    if (ta) ta.value = currentText;

    if (typeof paintInspectionEditorUI === 'function') {
        paintInspectionEditorUI();
    }

    showToast(`${selectedItems.length} adet uygunsuzluk rapora eklendi!`, 'success');
}

// ============================================================================
// EVALUATION, DEFECT NOTES & PHOTO SECTION (7. KUSUR, 8. NOTLAR, 9. SONUÇ, 10. ONAY)
// ============================================================================

function renderEvaluationAndFooterSection() {
    const fd = AppState.currentFormData;
    const isSuitable = fd.overallResult !== 'UYGUN DEĞİL';

    const concludingSentence = isSuitable
        ? '✓ Yapılan periyodik kontrol, muayene ve test sonuçlarına göre söz konusu ekipmanın / tesisatın mevcut şartlar altında İSG mevzuatı ve ilgili standartlar açısından KULLANIMI UYGUNDUR.'
        : '✕ Yapılan periyodik kontrol, muayene ve test sonuçlarına göre tespit edilen kusur ve uygunsuzluklar giderilinceye kadar söz konusu ekipmanın / tesisatın KULLANIMI UYGUN DEĞİLDİR.';

    const bannerCls = isSuitable
        ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-800'
        : 'bg-rose-50 border-2 border-rose-400 text-rose-800';

    return `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-3 p-3.5 text-xs">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="font-black text-xs text-slate-800 uppercase tracking-wide">6. Sonuç & Onay Değerlendirmesi</span>
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="openNonConformityPickerModal()"
                        class="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all">
                        <i class="fa-solid fa-list-check"></i>
                        <span>Uygunsuzluk Seç / Ekle</span>
                    </button>
                    <button type="button" onclick="autoCompileDefectNotes()"
                        class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-all"
                        title="Formdaki uygunsuzlukları otomatik derle">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                        <span>Otomatik Derle</span>
                    </button>
                </div>
            </div>

            <div>
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                        <label class="block font-bold text-slate-800">Kusur Açıklamaları / Uygunsuzluklar</label>
                        <button type="button" onclick="toggleVoiceDictation('defectNotesTextarea', 'btnVoiceDefectNotes')"
                            id="btnVoiceDefectNotes"
                            class="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold flex items-center gap-1 active:scale-95 transition">
                            <i class="fa-solid fa-microphone text-rose-600"></i>
                            <span>Sesle Dikte</span>
                        </button>
                    </div>
                    ${fd.defectNotes ? `
                        <button type="button" onclick="if(confirm('Kusur açıklamalarını temizlemek istediğinize emin misiniz?')){ AppState.currentFormData.defectNotes=''; triggerAutoSave(); paintInspectionEditorUI(); }"
                            class="text-[11px] text-rose-600 hover:underline font-semibold">
                            Temizle
                        </button>
                    ` : ''}
                </div>
                <textarea id="defectNotesTextarea" rows="4"
                    oninput="AppState.currentFormData.defectNotes=this.value; triggerAutoSave();"
                    placeholder="Uygunsuzluk maddeleri buraya eklenecektir veya yukarıdaki 'Uygunsuzluk Seç / Ekle' butonundan hazır seçebilirsiniz..."
                    class="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 leading-relaxed focus:border-sky-500 focus:outline-none font-medium">${fd.defectNotes || ''}</textarea>
            </div>

            <div>
                <label class="block font-bold text-slate-800 mb-1">Genel Notlar / Öneriler</label>
                <textarea rows="2"
                    oninput="AppState.currentFormData.generalNotes=this.value; triggerAutoSave();"
                    placeholder="İsteğe bağlı ek notlar..."
                    class="w-full border border-slate-300 rounded-xl p-2.5 text-slate-700 focus:border-sky-500 focus:outline-none">${fd.generalNotes || ''}</textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                    <label class="block font-bold text-slate-800 mb-1">Sonuç (Uygunluk Durumu)</label>
                    <select onchange="AppState.currentFormData.overallResult=this.value; if(AppState.currentInspection) AppState.currentInspection.result_status=this.value; triggerAutoSave(); paintInspectionEditorUI();"
                        class="w-full border-2 rounded-lg px-2.5 py-2 text-xs font-black ${
                            !isSuitable ? 'border-rose-500 bg-rose-50 text-rose-800' :
                            'border-emerald-500 bg-emerald-50 text-emerald-800'
                        }">
                        <option value="UYGUN" ${isSuitable ? 'selected' : ''}>✓ UYGUN</option>
                        <option value="UYGUN DEĞİL" ${!isSuitable ? 'selected' : ''}>✕ UYGUN DEĞİL</option>
                    </select>
                </div>
                <div>
                    <label class="block font-bold text-slate-800 mb-1">Rapor Tarihi</label>
                    <input type="text" value="${AppState.currentInspection?.inspection_date || ''}"
                        placeholder=""
                        oninput="AppState.currentInspection.inspection_date=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-2">
                </div>
                <div>
                    <label class="block font-bold text-slate-800 mb-1">Sonraki Kontrol Tarihi</label>
                    <input type="text" value="${fd.nextInspectionDate || ''}"
                        placeholder=""
                        oninput="AppState.currentFormData.nextInspectionDate=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-2">
                </div>
            </div>

            <!-- DYNAMIC COLOR CONCLUDING SENTENCE -->
            <div id="editorConcludingSentence" class="p-3 rounded-xl ${bannerCls} font-bold text-xs leading-relaxed transition-all">
                ${concludingSentence}
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button onclick="saveCurrentInspection(true)" class="px-4 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl shadow-2xs">
                    Kaydet
                </button>
                <button onclick="printOfficialReport()" class="px-4 py-2.5 bg-slate-900 text-amber-400 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-2xs">
                    <i class="fa-solid fa-file-pdf"></i>
                    <span>A4 PDF Çıktı Al</span>
                </button>
            </div>
        </div>
    `;
}

function autoCompileDefectNotes() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd) return;

    const detectedDefects = [];
    const notesMap = window.STANDARD_DEFECT_NOTES || {};

    // 1. Electrical 2201
    if (String(insp.template_id) === '2201' && AppState.electricalTemplate) {
        Object.keys(fd.answers || {}).forEach(k => {
            const val = fd.answers[k];
            if (val === 'Uygun Değil' || val === 'Kısmen Uygun') {
                const guid = k.replace(/^q_/, '');
                let qText = '';
                (AppState.electricalTemplate.areas || []).forEach(a => {
                    (a.topics || []).forEach(t => {
                        (t.questions || []).forEach(q => {
                            if (q.guid === guid) qText = q.question;
                        });
                    });
                });
                if (qText) {
                    const match = notesMap[qText] || Object.keys(notesMap).find(m => qText.toLowerCase().includes(m.toLowerCase().slice(0, 18)));
                    const defectLine = match ? (notesMap[match] || match) : `• [KUSUR] "${qText}" kriterinde ilgili yönetmelik ve TS HD 60364-6 standardına göre uygunsuzluk tespit edilmiştir.`;
                    detectedDefects.push(defectLine);
                }
            }
        });
        Object.keys(fd.tableRows || {}).forEach(tKey => {
            const rows = fd.tableRows[tKey] || [];
            rows.forEach((r, rIdx) => {
                Object.keys(r).forEach(qGuid => {
                    if (r[qGuid] === 'Uygun Değil' || r[qGuid] === 'X') {
                        detectedDefects.push(`• [ÖLÇÜM TABLOSU] Satır #${rIdx + 1} üzerinde standart sınır dışı uygunsuzluk tespit edilmiştir.`);
                    }
                });
            });
        });
    }

    // 2. Grounding 2202
    if (String(insp.template_id) === '2202' && fd.grounding) {
        const gd = fd.grounding;
        (gd.points || []).forEach((p, idx) => {
            if (p.result && p.result !== 'Not-1' && p.result !== 'Not-4') {
                const pName = p.point || `#${idx + 1} Ölçüm Noktası`;
                let desc = '';
                if (p.result === 'Not-2') desc = 'Güvenlik şartı sağlanamadığından uygun değildir. (Ağır kusur)';
                else if (p.result === 'Not-3') desc = 'Topraklama bağlantısı yok kontrol edilmelidir. (Ağır kusur)';
                else if (p.result === 'Not-5') desc = '32A priz tesisatında 30mA RCD zorunluluğuna uyulmamıştır. (Ağır kusur)';
                else if (p.result === 'Not-6') desc = 'Doğal kaçak akım tahkiki yapılmadığından yetersizdir. (Ağır kusur)';
                else if (p.result === 'Not-7') desc = 'Selektif/gecikmeli RCD kullanılmadığından yetersizdir.';
                else if (p.result === 'Not-8') desc = 'Nötr-toprak geriliminin yüksek olması nedeniyle ölçüm yapılamamıştır. (Ağır kusur)';
                else if (p.result === 'Not-9') desc = 'PEN köprüsü dışında PE ve N iletkenlerinin birleştirilmesi uygun değildir. (Ağır kusur)';
                else if (p.result === 'Not-10') desc = 'Priz üzerinde sıfırlama yapıldığı tespit edilmiştir. (Ağır kusur)';
                else if (p.result === 'Not-11') desc = 'Pano gövde-kapak köprüsü olmadığından yetersizdir. (Ağır kusur)';
                else desc = `${p.result} gereği uygunsuzluk tespit edilmiştir.`;
                detectedDefects.push(`• [TOPRAKLAMA - ${pName}] ${p.result}: ${desc}`);
            }
        });
        (gd.selectivity || []).forEach((s, idx) => {
            if (s.result && s.result !== 'Not-1') {
                detectedDefects.push(`• [RCD SELEKTİVİTE - Kademe #${idx + 1}] ${s.priorPanel || 'Pano'} selektivite kontrolünde uygunsuzluk (${s.result}).`);
            }
        });
    }

    // 3. Generator 2205
    if (String(insp.template_id) === '2205' && fd.generator) {
        const gen = fd.generator;
        Object.keys(gen.checks || {}).forEach(code => {
            const val = gen.checks[code];
            if (val === 'X' || val === 'Uygun Değil') {
                const chk = (typeof GENERATOR_CHECKLIST !== 'undefined' ? GENERATOR_CHECKLIST : []).find(c => c.code === code);
                const title = chk ? chk.text : code;
                detectedDefects.push(`• [JENERATÖR ${code}] ${title} kontrolünde standartlara aykırılık tespit edilmiştir.`);
            }
        });
        if (parseFloat(gen.potential?.n_pe) > 1.5) {
            detectedDefects.push(`• [JENERATÖR POTANSİYEL] N-PE gerilimi (${gen.potential.n_pe} V) 1.5 V sınır değerini aşmaktadır.`);
        }
        if (parseFloat(gen.measurements?.ground_r) > 1.0) {
            detectedDefects.push(`• [JENERATÖR TOPRAKLAMA] Gövde topraklama süreklilik direnci (${gen.measurements.ground_r} Ω) 1 Ω sınır değerini aşmaktadır.`);
        }
    }

    // 4. Specialized Templates
    if (fd.specializedChecks) {
        Object.keys(fd.specializedChecks).forEach(k => {
            const val = fd.specializedChecks[k];
            if (val === 'Uygun Değil' || val === 'Kısmen Uygun') {
                detectedDefects.push(`• [UYGUNSUZLUK] ${k.replace('chk_', 'Kriter #')} kontrolünde standart dışı durum tespit edilmiştir.`);
            }
        });
    }

    if (detectedDefects.length === 0) {
        showToast('Kayıtlı kontrollerde herhangi bir uygunsuzluk bulunamadı.', 'info');
        return;
    }

    let addedCount = 0;
    detectedDefects.forEach(d => {
        if (!(fd.defectNotes || '').includes(d)) {
            fd.defectNotes = (fd.defectNotes ? fd.defectNotes + '\n' : '') + d;
            addedCount++;
        }
    });

    if (addedCount > 0) {
        fd.overallResult = 'UYGUN DEĞİL';
        if (insp) insp.result_status = 'UYGUN DEĞİL';
        triggerAutoSave();
        paintInspectionEditorUI();
        showToast(`${addedCount} adet uygunsuzluk otomatik eklendi ve sonuç 'UYGUN DEĞİL' yapıldı!`, 'warning');
    } else {
        showToast('Tüm uygunsuzluklar zaten kusur açıklamalarında mevcut.', 'info');
    }
}

// ============================================================================


// ============================================================================
// ALÇAK GERİLİM TOPRAKLAMA TESİSATI (2202 / TKM-FR.317) EDITOR & HELPERS
// ============================================================================

function renderGrounding2202Editor() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!fd.grounding) {
        fd.grounding = { details: {}, detected: {}, method: 'Çevrim empedansı', points: [], selectivity: [] };
    }
    const gd = fd.grounding;
    if (!gd.details) gd.details = {};
    if (!gd.detected) gd.detected = {};
    if (!gd.points) gd.points = [];
    if (!gd.selectivity) gd.selectivity = [];
    if (!gd.method) gd.method = 'Çevrim empedansı';

    if (AppState.activeGroundingTab === undefined) AppState.activeGroundingTab = 0;
    const activeTab = AppState.activeGroundingTab;

    const tabs = [
        { label: '1. Firma & Cihaz', id: 0 },
        { label: '2. Tesisat Detayları', id: 1 },
        { label: `3. Ölçüm Noktaları (${gd.points.length})`, id: 2 },
        { label: `4. Selektivite (${gd.selectivity.length})`, id: 3 },
        { label: `5. Fotoğraflar (${(fd.photos || []).length})`, id: 4 },
        { label: '6. Sonuç & Onay', id: 5 },
        { label: 'Tümü', id: -1 }
    ];

    const tabsHtml = `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            ${tabs.map(t => {
                const isActive = activeTab === t.id;
                return `
                    <button onclick="AppState.activeGroundingTab=${t.id}; paintInspectionEditorUI();"
                        class="py-2 px-2.5 rounded-lg text-xs font-bold text-center truncate transition ${
                            isActive ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                        } ${t.id === -1 ? 'col-span-2 sm:col-span-1' : ''}">
                        ${t.label}
                    </button>
                `;
            }).join('')}
        </div>
    `;

    // 1. Firma ve Cihaz Bilgileri HTML
    const showCompany = (activeTab === 0 || activeTab === -1);
    const companyHtml = !showCompany ? '' : `
        ${renderSharedCompanyInfoSection()}
        ${renderSharedMeasuringDevicesSection('3. Ölçüm Aletleri Bilgileri')}
    `;

    // 2. Ekipman Bilgileri HTML
    const showDetails = (activeTab === 1 || activeTab === -1);
    const detailsHtml = !showDetails ? '' : `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between">
                <span>2. Ekipman ve Tesisat Bilgileri</span>
                <span class="text-[11px] text-slate-300 font-normal">2.1 Etiket & 2.2 Tespit</span>
            </div>
            <div class="p-3.5 space-y-3 text-xs">
            
            <div class="space-y-2">
                <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide">2.1. Etiket ve Detay Bilgileri</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Enerji Sağlayan Kuruluş</label>
                        <input type="text" value="${gd.details.supplier || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.details.supplier=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Şebeke Tipi</label>
                        <select onchange="AppState.currentFormData.grounding.details.networkType=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">
                            <option value="">Seçiniz...</option>
                            ${['TT', 'TN-S', 'TN-C-S', 'TN-C', 'IT'].map(opt => `<option value="${opt}" ${(gd.details.networkType || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Şebeke Gerilimi (V)</label>
                        <input type="text" value="${gd.details.voltage || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.details.voltage=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Tesise Ait Proje Var mı?</label>
                        <select onchange="AppState.currentFormData.grounding.details.hasProject=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                            <option value="">Seçiniz...</option>
                            <option value="Var" ${gd.details.hasProject === 'Var' ? 'selected' : ''}>Var</option>
                            <option value="Yok" ${gd.details.hasProject === 'Yok' ? 'selected' : ''}>Yok</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Tek Hat Şeması Var mı?</label>
                        <select onchange="AppState.currentFormData.grounding.details.hasSingleLine=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                            <option value="">Seçiniz...</option>
                            <option value="Var" ${gd.details.hasSingleLine === 'Var' ? 'selected' : ''}>Var</option>
                            <option value="Yok" ${gd.details.hasSingleLine === 'Yok' ? 'selected' : ''}>Yok</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Kontrol Nedeni</label>
                        <input type="text" value="${gd.details.reason || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.details.reason=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Proje Bilgileri</label>
                        <input type="text" value="${gd.details.projectInfo || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.details.projectInfo=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Topraklayıcı Tipi</label>
                        <select onchange="AppState.currentFormData.grounding.details.grounderType=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                            <option value="">Seçiniz...</option>
                            ${['Ring', 'Temel', 'Çubuk', 'Levha', 'Şerit'].map(opt => `<option value="${opt}" ${(gd.details.grounderType || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Yapı Cinsi</label>
                        <input type="text" value="${gd.details.buildingType || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.details.buildingType=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Kullanım Amacı</label>
                        <input type="text" value="${gd.details.usagePurpose || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.details.usagePurpose=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Son Kontrol Tarihi</label>
                        <input type="text" value="${gd.details.lastControlDate || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.details.lastControlDate=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Hava Durumu</label>
                        <select onchange="AppState.currentFormData.grounding.details.weather=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                            <option value="">Seçiniz...</option>
                            ${['Açık', 'Kapalı', 'Yağışlı'].map(opt => `<option value="${opt}" ${(gd.details.weather || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Hava Sıcaklığı (°C)</label>
                        <input type="text" value="${gd.details.temperature || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.details.temperature=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Zemin Nem Durumu</label>
                        <select onchange="AppState.currentFormData.grounding.details.soilMoisture=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                            <option value="">Seçiniz...</option>
                            ${['Kuru', 'Nemli', 'Islak'].map(opt => `<option value="${opt}" ${(gd.details.soilMoisture || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div class="sm:col-span-3">
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Dolaylı Dokunmaya Karşı Koruma Önlemi</label>
                        <input type="text" value="${gd.details.protectionMeasure || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.details.protectionMeasure=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                </div>
            </div>

            <div class="space-y-2 pt-2 border-t border-slate-100">
                <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide">2.2. Tespit Edilen Bilgiler</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Tesisatta Kapsamlı Değişiklik Var mı?</label>
                        <select onchange="AppState.currentFormData.grounding.detected.majorChange=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                            <option value="">Seçiniz...</option>
                            <option value="Var" ${gd.detected.majorChange === 'Var' ? 'selected' : ''}>Var</option>
                            <option value="Yok" ${gd.detected.majorChange === 'Yok' ? 'selected' : ''}>Yok</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Önceki Kontrol Eki Var mı?</label>
                        <select onchange="AppState.currentFormData.grounding.detected.prevReportAttached=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                            <option value="">Seçiniz...</option>
                            <option value="Var" ${gd.detected.prevReportAttached === 'Var' ? 'selected' : ''}>Var</option>
                            <option value="Yok" ${gd.detected.prevReportAttached === 'Yok' ? 'selected' : ''}>Yok</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Pano / Ekipman Tanımlaması</label>
                        <input type="text" value="${gd.detected.panelIdent || ''}" placeholder=""
                            oninput="AppState.currentFormData.grounding.detected.panelIdent=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                </div>
            </div>

            <div class="space-y-1.5 pt-2 border-t border-slate-100">
                <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide">4.1. Ölçüm Metodu</div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Ölçüm ve Doğrulama Metodu</label>
                    <input type="text" value="${gd.method || ''}" placeholder=""
                        oninput="AppState.currentFormData.grounding.method=this.value; triggerAutoSave();"
                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                </div>
            </div>
            </div>
        </div>
    `;

    // 4.2 Ölçüm Noktaları HTML
    const showPoints = (activeTab === 2 || activeTab === -1);
    const resultOptions = [
        'Not-1', 'Not-2', 'Not-3', 'Not-4', 'Not-5', 'Not-6', 'Not-7', 'Not-8', 'Not-9', 'Not-10', 'Not-11'
    ];
    const pointsHtml = !showPoints ? '' : `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between">
                <span>4.2. Son Tüketim Noktalarında Dolaylı Dokunmaya Karşı Koruma Yeterliliği (${gd.points.length})</span>
                <button onclick="addGroundingPointRow()" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1">
                    <i class="fa-solid fa-plus"></i>
                    <span>Nokta Ekle</span>
                </button>
            </div>
            <div class="p-3 space-y-3">
                ${gd.points.length === 0 ? `
                    <div class="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                        Henüz ölçüm noktası eklenmedi. Ölçülen priz, aydınlatma veya pano noktalarını eklemek için yukarıdaki <strong>+ Nokta Ekle</strong> butonuna basınız.
                    </div>
                ` : gd.points.map((p, pIdx) => `
                    <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs shadow-2xs">
                        <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span class="font-bold text-slate-800">#${pIdx + 1} Ölçüm Noktası</span>
                            <div class="flex items-center gap-1.5">
                                <button onclick="duplicateGroundingPointRow(${pIdx})" class="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-[11px] rounded flex items-center gap-1">
                                    <i class="fa-solid fa-copy"></i>
                                    <span>Kopyala</span>
                                </button>
                                <button onclick="removeGroundingPointRow(${pIdx})" class="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] rounded flex items-center gap-1">
                                    <i class="fa-solid fa-trash-can"></i>
                                    <span>Sil</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Ölçüm Noktası / Etiket veya Kodu</label>
                            <input type="text" value="${p.point || ''}" placeholder=""
                                oninput="AppState.currentFormData.grounding.points[${pIdx}].point=this.value; triggerAutoSave();"
                                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">In (A)</label>
                                <input type="text" value="${p.inAmp || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.points[${pIdx}].inAmp=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Açma Eğrisi</label>
                                <select onchange="AppState.currentFormData.grounding.points[${pIdx}].curve=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold">
                                    ${['B', 'C', 'D', 'K', 'Z'].map(c => `<option value="${c}" ${(p.curve || 'C') === c ? 'selected' : ''}>${c}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Ia (A)</label>
                                <input type="text" value="${p.iaAmp || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.points[${pIdx}].iaAmp=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Ik1 (A)</label>
                                <input type="text" value="${p.ik1Amp || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.points[${pIdx}].ik1Amp=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Zx / Rx (Ω)</label>
                                <input type="text" value="${p.zxRx || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.points[${pIdx}].zxRx=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Zs / RA (Ω)</label>
                                <input type="text" value="${p.zsRa || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.points[${pIdx}].zsRa=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">RCD In / IΔn</label>
                                <input type="text" value="${p.rcdSpec || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.points[${pIdx}].rcdSpec=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">IΔ (mA)</label>
                                <input type="text" value="${p.rcdId || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.points[${pIdx}].rcdId=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">TΔ (ms)</label>
                                <input type="text" value="${p.rcdTd || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.points[${pIdx}].rcdTd=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div class="col-span-2 sm:col-span-3">
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Sonuç (Uygunluk Notu)</label>
                                <select onchange="AppState.currentFormData.grounding.points[${pIdx}].result=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 bg-white">
                                    <option value="">Seçiniz...</option>
                                    ${resultOptions.map(opt => `<option value="${opt}" ${(p.result || '') === opt ? 'selected' : ''}>${opt} ${opt === 'Not-1' ? '(Uygun)' : opt === 'Not-4' ? '(RCD Faal, Uygun)' : '(Kusurlu)'}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // 4.3 RCD Selektivite HTML
    const showSelectivity = (activeTab === 3 || activeTab === -1);
    const selectivityHtml = !showSelectivity ? '' : `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between">
                <span>4.3. Artık Akım Anahtarları (RCD) Selektivite Kontrolü (${gd.selectivity.length})</span>
                <button onclick="addGroundingSelectivityRow()" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1">
                    <i class="fa-solid fa-plus"></i>
                    <span>Selektivite Ekle</span>
                </button>
            </div>
            <div class="p-3 space-y-3">
                ${gd.selectivity.length === 0 ? `
                    <div class="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                        RCD Selektivite satırı eklenmedi. Rapor PDF çıktısında standart olarak <strong>"Uygulaması Yok"</strong> görünecektir. Tesisinizde selektivite mevcut ise yukarıdaki <strong>+ Selektivite Ekle</strong> butonundan ekleyebilirsiniz.
                    </div>
                ` : gd.selectivity.map((s, sIdx) => `
                    <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                        <div class="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span class="font-bold text-slate-800">#${sIdx + 1} Selektivite Kademe</span>
                            <div class="flex items-center gap-1.5">
                                <button onclick="duplicateGroundingSelectivityRow(${sIdx})" class="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-[11px] rounded"><i class="fa-solid fa-copy mr-1"></i>Kopyala</button>
                                <button onclick="removeGroundingSelectivityRow(${sIdx})" class="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] rounded"><i class="fa-solid fa-trash-can mr-1"></i>Sil</button>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="col-span-2">
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">N Önceki Pano Adı</label>
                                <input type="text" value="${s.priorPanel || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.selectivity[${sIdx}].priorPanel=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Önceki RCD Tipi</label>
                                <input type="text" value="${s.priorRcdType || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.selectivity[${sIdx}].priorRcdType=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Önceki In (A) / IΔn (mA)</label>
                                <input type="text" value="${s.priorRcdIn || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.selectivity[${sIdx}].priorRcdIn=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Son Tüketim Pano Adı</label>
                                <input type="text" value="${s.destPanel || ''}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.selectivity[${sIdx}].destPanel=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Sonuç (Uygunluk Notu)</label>
                                <input type="text" value="${s.result || 'Not-1'}" placeholder=""
                                    oninput="AppState.currentFormData.grounding.selectivity[${sIdx}].result=this.value; triggerAutoSave();"
                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // 5. Fotoğraflar HTML
    const showPhotos = (activeTab === 4 || activeTab === -1);
    const photosHtml = !showPhotos ? '' : renderPhotoSectionUI();

    // 6. Sonuç & Onay HTML
    const showEval = (activeTab === 5 || activeTab === -1);
    const evalHtml = !showEval ? '' : renderEvaluationAndFooterSection();

    return `
        <div class="space-y-3">
            ${tabsHtml}
            ${companyHtml}
            ${detailsHtml}
            ${pointsHtml}
            ${selectivityHtml}
            ${photosHtml}
            ${evalHtml}
        </div>
    `;
}

function addGroundingPointRow() {
    const gd = AppState.currentFormData.grounding;
    if (!gd.points) gd.points = [];
    gd.points.push({
        point: '',
        inAmp: '',
        curve: 'C',
        iaAmp: '',
        ik1Amp: '',
        zxRx: '',
        zsRa: '',
        rcdSpec: '',
        rcdId: '',
        rcdTd: '',
        result: ''
    });
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast('Yeni ölçüm noktası eklendi');
}

function duplicateGroundingPointRow(idx) {
    const gd = AppState.currentFormData.grounding;
    if (!gd.points || !gd.points[idx]) return;
    const copy = JSON.parse(JSON.stringify(gd.points[idx]));
    gd.points.push(copy);
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`Ölçüm Noktası #${idx + 1} kopyalanıp sona eklendi`);
}

function removeGroundingPointRow(idx) {
    const gd = AppState.currentFormData.grounding;
    if (!gd.points || !gd.points[idx]) return;
    gd.points.splice(idx, 1);
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast('Ölçüm noktası silindi');
}

function addGroundingSelectivityRow() {
    const gd = AppState.currentFormData.grounding;
    if (!gd.selectivity) gd.selectivity = [];
    gd.selectivity.push({
        priorPanel: '',
        priorRcdType: 'Selektif (S)',
        priorRcdIn: '',
        priorRcdIdn: '',
        priorRcdTd: '',
        destPanel: '',
        destRcdType: 'Genel Tip',
        destRcdIdn: '',
        destRcdTd: '',
        result: 'Not-1'
    });
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast('Yeni selektivite satırı eklendi');
}

function duplicateGroundingSelectivityRow(idx) {
    const gd = AppState.currentFormData.grounding;
    if (!gd.selectivity || !gd.selectivity[idx]) return;
    const copy = JSON.parse(JSON.stringify(gd.selectivity[idx]));
    gd.selectivity.push(copy);
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`Selektivite #${idx + 1} kopyalandı`);
}

function removeGroundingSelectivityRow(idx) {
    const gd = AppState.currentFormData.grounding;
    if (!gd.selectivity || !gd.selectivity[idx]) return;
    gd.selectivity.splice(idx, 1);
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast('Selektivite satırı silindi');
}


// ============================================================================
// JENERATÖR (2205 / TKM-FR.164) CHECKLIST & EDITOR & HELPERS
// ============================================================================

const GENERATOR_CHECKLIST = [
    // A: 6 items
    { cat: 'A', catTitle: 'A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ', code: 'A.1.', text: 'Jeneratör bakımı ve kontrolü için sorumlu/yetkili personel bulunuyor mu?' },
    { cat: 'A', catTitle: 'A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ', code: 'A.2.', text: 'Jeneratör için işletme ve bakım talimatı oluşturulmuş mu?' },
    { cat: 'A', catTitle: 'A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ', code: 'A.3.', text: 'Bakım-onarım defteri, kontrol dosyaları mevcut mu?' },
    { cat: 'A', catTitle: 'A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ', code: 'A.4.', text: 'Önceki muayene raporu mevcut mu? Eksikler(varsa) giderilmiş mi?' },
    { cat: 'A', catTitle: 'A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ', code: 'A.5.', text: 'Jeneratör sistemine ait bağlantı şeması veya proje mevcut mu?' },
    { cat: 'A', catTitle: 'A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ', code: 'A.6.', text: 'Jeneratör sistemine ait tehlike, uyarı vb. etiketler mevcut mu?' },

    // B: 8 items
    { cat: 'B', catTitle: 'B JENERATÖR ODASI KONTROLLERİ', code: 'B.1.', text: 'Oda kapısı yetkili haricinde ki kimsenin giremeyeceği şekilde kilitlenebiliyor mu? Kapı yönü doğru tarafa açılıyor mu?' },
    { cat: 'B', catTitle: 'B JENERATÖR ODASI KONTROLLERİ', code: 'B.2.', text: 'Oda kapısında yetkili harici kimsenin girmemesi için uyarı levhası ve tehlike işaretleri var mı?' },
    { cat: 'B', catTitle: 'B JENERATÖR ODASI KONTROLLERİ', code: 'B.3.', text: 'Oda kapısı, tavanı, tabanı ve duvarları yangına en az 120 dakika dayanabilecek cinsten mi?' },
    { cat: 'B', catTitle: 'B JENERATÖR ODASI KONTROLLERİ', code: 'B.4.', text: 'Oda yanıcı ve parlayıcı maddelerden arındırılmış mı?' },
    { cat: 'B', catTitle: 'B JENERATÖR ODASI KONTROLLERİ', code: 'B.5.', text: 'Odaya temiz hava girişi sağlanıyor mu? Yeteri kadar havalandırma sağlanmış mı?' },
    { cat: 'B', catTitle: 'B JENERATÖR ODASI KONTROLLERİ', code: 'B.6.', text: 'Odada ısı/duman dedektörü tesis edilmiş mi?' },
    { cat: 'B', catTitle: 'B JENERATÖR ODASI KONTROLLERİ', code: 'B.7.', text: 'Odada uygun tipte portatif yangın söndürme tüpü tesis edilmiş mi?' },
    { cat: 'B', catTitle: 'B JENERATÖR ODASI KONTROLLERİ', code: 'B.8.', text: 'Odada genel aydınlatma seviyesi uygun mu? Acil aydınlatma sistemi tesis edilmiş mi?' },

    // C: 20 items
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.1.', text: 'Jeneratör düz bir zemine yerleştirilmiş mi? Konulduğu yer ve alan uygun mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.2.', text: 'Jeneratör çevresindeki çalışma mesafeleri ve erişim durumu uygun mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.3.', text: 'Jeneratörün genel yüzeyinin temizlik durumu(kir, pas, toz vb.) uygun mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.4.', text: 'Jeneratörün üzerinde sicil kartı(marka, model, güç, rpm vs.) levhası mevcut mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.5.', text: 'Jeneratör sistemi ve gövdesinde herhangi bir sorun var mı? (Kırık, çatlak vs.)' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.6.', text: 'Jeneratör vibrasyon durumu için uygun sabitleme yapılmış mı? (Takoz, vida, somun vb.)' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.7.', text: 'Jeneratörün egzoz dumanı için çevre kirliliği önlemleri alınarak, dış ortama uygun bir şekilde ulaştırılmış mı?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.8.', text: 'Yakıt tankının, yakıt kaçağının ve yakıt seviyesinin durumu normal mi?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.9.', text: 'Motor yağ seviyesi ve yağ kaçağı durumu uygun mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.10.', text: 'Akü sisteminde şişme, sızıntı, kutup başlarının sağlamlığı gibi durumlar uygun mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.11.', text: 'Motor soğutma sistemi su ise seviye ve kaçak durumu; hava ise fan çalışma ve hava kanallarının durumu uygun mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.12.', text: 'Jeneratör sistemine ait kayışta herhangi bir görsel deformasyon mevcut mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.13.', text: 'Hava emiş sisteminin görsel durumu normal mi?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.14.', text: 'Akü şarj redresörü devrede mi? Görsel durumu uygun mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.15.', text: 'Gövdeyi donmaya karşı koruyan ısıtıcı devrede mi? Görsel durumu uygun mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.16.', text: 'Koruma sınıfı tanımlı mı? Tanımlı ise koruma sınıfına uygun önlemler alınmış mı?(IPXX)' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.17.', text: 'Jeneratör üzerinde fiş ve priz mevcut ise bunların genel durumu uygun mu?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.18.', text: 'Jeneratör devresinde bulunan kablo giriş-çıkış durumları normal mi?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.19.', text: 'Transfer panosu veya kontrol panosu önünde izolasyon halısı var mı?' },
    { cat: 'C', catTitle: 'C GÖRSEL KONTROLLER', code: 'C.20.', text: 'Jeneratör transfer panosu veya kontrol panosunun görsel durumu uygun mu?' },

    // D: 16 items
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.1.', text: 'Jeneratör kontrol ünitesi ve çalışma fonksiyonlarının durumu normal mi?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.2.', text: 'Jeneratör, şebekeden kaynaklanan bir elektrik kesintisi esnasında istenilen sürede devreye giriyor mu?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.3.', text: 'Jeneratör transfer panosunda elektriksel/mekaniksel kilitleme yapılarak gerekli güvenlik tedbiri alınmış mı?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.4.', text: 'Jeneratör devrede iken sistemde herhangi bir kesinti yada mekanik bir aksama oluşuyor mu?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.5.', text: 'Jeneratör devredeyken kompanzasyon sistemine yönelik tedbir alınmış mı?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.6.', text: 'Jeneratör devrede iken faz-faz ve faz-nötr gerilimleri izin verilen sınır değerler içerisinde mi?(±%10)' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.7.', text: 'Jeneratör devrede iken nötr-toprak gerilimi izin verilen sınır değerler içerisinde mi?(<1,5V)' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.8.', text: 'Jeneratör devrede iken sistem frekansı izin verilen sınır değerler içerisinde mi?(±%1)' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.9.', text: 'Jeneratör devrede iken yük akımlarının durumu normal mi?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.10.', text: 'Transfer panosu, sayaç panosu ve jeneratör gövdesinde termal inceleme sonuçları uygun mu?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.11.', text: 'Jeneratör gürültü seviyesi ölçümü uygun mu? Değil ise herhangi bir tedbir(kulaklık vb.) alınmış mı?(<85 dBA)' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.12.', text: 'Jeneratör, şebeke beslemesi devreye girdiğinde otomatik olarak devreden çıkıyor mu?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.13.', text: 'Jeneratör şebeke beslemesi devreye girdikten sonra kendini soğutmak adına bir süre daha çalışıyor mu?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.14.', text: 'Jeneratör üzerinde, acil durumlar için Acil Stop Butonu bulunuyor mu? Aktif çalışıyor mu?' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.15.', text: 'Jeneratör gövdesinden ölçülen koruma topraklaması değeri uygun mu?(Süreklilik için Sınır 1 Ω’dur)' },
    { cat: 'D', catTitle: 'D FONKSİYONEL KONTROLLER', code: 'D.16.', text: 'Akü ölçüm sonuçları(redresör devredeyken ve redresör devre dışıyken) uygun mu?' }
];

function renderGenerator2205Editor() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!fd.generator) {
        fd.generator = {
            info: {},
            equipment: {},
            checks: {},
            potential: {},
            measurements: {},
            battery: {},
            devices: []
        };
    }
    const gen = fd.generator;
    gen.info = gen.info || {};
    gen.equipment = gen.equipment || {};
    gen.checks = gen.checks || {};
    gen.potential = gen.potential || {};
    gen.measurements = gen.measurements || {};
    gen.battery = gen.battery || {};
    gen.devices = gen.devices || [];

    ensureCompanyInfo();
    ensureMeasuringDevices();
    if (gen.devices && gen.devices.length && (!fd.measuringDevices || !fd.measuringDevices.length || !fd.measuringDevices[0].name)) {
        fd.measuringDevices = gen.devices;
    }
    gen.devices = fd.measuringDevices;

    if (AppState.activeGenTab === undefined) AppState.activeGenTab = 0;
    const activeTab = AppState.activeGenTab;

    const tabs = [
        { label: '1. Firma & Cihaz', id: 0 },
        { label: '2. Ekipman Detayı', id: 1 },
        { label: '3. Kontroller (50)', id: 2 },
        { label: '4. Ölçümler', id: 3 },
        { label: `5. Fotoğraflar (${(fd.photos || []).length})`, id: 4 },
        { label: '6. Sonuç & Onay', id: 5 },
        { label: 'Tümü', id: -1 }
    ];

    const tabsHtml = `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            ${tabs.map(t => {
                const isActive = activeTab === t.id;
                return `
                    <button onclick="AppState.activeGenTab=${t.id}; paintInspectionEditorUI();"
                        class="py-2 px-2.5 rounded-lg text-xs font-bold text-center truncate transition ${
                            isActive ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 active:bg-slate-200'
                        } ${t.id === -1 ? 'col-span-2 sm:col-span-1' : ''}">
                        ${t.label}
                    </button>
                `;
            }).join('')}
        </div>
    `;

    // 1. Firma ve Cihaz Bilgileri HTML
    const showGenCompany = (activeTab === 0 || activeTab === -1);
    const genCompanyHtml = !showGenCompany ? '' : `
        ${renderSharedCompanyInfoSection()}
        ${renderSharedMeasuringDevicesSection('2. Ölçüm Aletleri Bilgileri')}
    `;

    // 2. Ekipman Bilgileri HTML
    const showGenInfo = (activeTab === 1 || activeTab === -1);
    const genInfoHtml = !showGenInfo ? '' : `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between">
                <span>2. Ekipman ve Muayene Bilgileri</span>
                <span class="text-[11px] text-slate-300 font-normal">3. Muayene & 3.1 Ekipman</span>
            </div>
            <div class="p-3.5 space-y-3.5 text-xs">
                <div>
                    <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide mb-2">3. Muayeneye Ait Genel Bilgiler</div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Muayene Nedeni</label>
                            <select onchange="AppState.currentFormData.generator.info.reason=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                            <option value="">Seçiniz...</option>
                            ${['Periyodik', 'İlk Kontrol', 'Revizyon Sonrası'].map(opt => `<option value="${opt}" ${(gen.info.reason || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Hava Durumu</label>
                        <select onchange="AppState.currentFormData.generator.info.weather=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                            <option value="">Seçiniz...</option>
                            ${['Açık', 'Kapalı', 'Yağışlı'].map(opt => `<option value="${opt}" ${(gen.info.weather || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Toprak Durumu</label>
                        <select onchange="AppState.currentFormData.generator.info.soilStatus=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                            <option value="">Seçiniz...</option>
                            ${['Kuru', 'Nemli', 'Islak'].map(opt => `<option value="${opt}" ${(gen.info.soilStatus || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Şebeke Tipi</label>
                        <select onchange="AppState.currentFormData.generator.info.networkType=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">
                            <option value="">Seçiniz...</option>
                            ${['TT', 'TN-S', 'TN-C-S', 'IT'].map(opt => `<option value="${opt}" ${(gen.info.networkType || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Topraklama Tipi</label>
                        <select onchange="AppState.currentFormData.generator.info.groundingType=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                            <option value="">Seçiniz...</option>
                            ${['Temel', 'Ring', 'Çubuk', 'Levha'].map(opt => `<option value="${opt}" ${(gen.info.groundingType || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Eşpotansiyel Bara</label>
                        <select onchange="AppState.currentFormData.generator.info.equipotentialBar=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                            <option value="">Seçiniz...</option>
                            <option value="Mevcut" ${gen.info.equipotentialBar === 'Mevcut' ? 'selected' : ''}>Mevcut</option>
                            <option value="Mevcut Değil" ${gen.info.equipotentialBar === 'Mevcut Değil' ? 'selected' : ''}>Mevcut Değil</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="pt-2 border-t border-slate-100">
                <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide mb-2">3.1. Ekipman Bilgileri</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Marka</label>
                        <input type="text" value="${gen.equipment.brand || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.equipment.brand=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Model</label>
                        <input type="text" value="${gen.equipment.model || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.equipment.model=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Seri No</label>
                        <input type="text" value="${gen.equipment.serialNo || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.equipment.serialNo=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">İmal Yılı</label>
                        <input type="text" value="${gen.equipment.mfgYear || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.equipment.mfgYear=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Yakıt</label>
                        <select onchange="AppState.currentFormData.generator.equipment.fuel=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                            <option value="">Seçiniz...</option>
                            ${['Dizel', 'Benzin', 'Doğalgaz', 'LPG'].map(opt => `<option value="${opt}" ${(gen.equipment.fuel || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Ses İzolasyon</label>
                        <select onchange="AppState.currentFormData.generator.equipment.soundInsulation=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                            <option value="">Seçiniz...</option>
                            ${['Kabinli', 'Kabinsiz', 'Konteynerli'].map(opt => `<option value="${opt}" ${(gen.equipment.soundInsulation || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Tip</label>
                        <select onchange="AppState.currentFormData.generator.equipment.type=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                            <option value="">Seçiniz...</option>
                            ${['Dahili', 'Harici', 'Mobil'].map(opt => `<option value="${opt}" ${(gen.equipment.type || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Gerilim (V)</label>
                        <input type="text" value="${gen.equipment.voltage || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.equipment.voltage=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Güç (kVA)</label>
                        <input type="text" value="${gen.equipment.power || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.equipment.power=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Frekans (Hz)</label>
                        <input type="text" value="${gen.equipment.frequency || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.equipment.frequency=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                </div>
            </div>
            </div>
        </div>
    `;

    // 4. Genel Kontroller (50 Madde) HTML
    const showGenChecks = (activeTab === 2 || activeTab === -1);
    const cats = ['A', 'B', 'C', 'D'];
    const genChecksHtml = !showGenChecks ? '' : `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between gap-2">
                <span>3. Genel Kontroller (50 Kriter)</span>
                <button onclick="markAllGeneratorChecksSuitable()" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs">
                    <i class="fa-solid fa-check-double"></i>
                    <span>Tümünü Uygun Yap (✓)</span>
                </button>
            </div>
            <div class="p-3.5 space-y-3 text-xs">

            ${cats.map(catLetter => {
                const items = GENERATOR_CHECKLIST.filter(c => c.cat === catLetter);
                const title = items[0]?.catTitle || `Kategori ${catLetter}`;
                return `
                    <div class="space-y-2 pt-1">
                        <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide bg-rose-50 px-2.5 py-1 rounded-md border-l-4 border-rose-600">
                            ${title}
                        </div>
                        <div class="space-y-2">
                            ${items.map(item => {
                                const val = gen.checks[item.code] || '';
                                return `
                                    <div class="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                                        <div class="flex-1 pr-2">
                                            <span class="font-black text-slate-900 mr-1.5">${item.code}</span>
                                            <span class="text-slate-800 leading-snug">${item.text}</span>
                                        </div>
                                        <div class="flex items-center gap-1 shrink-0">
                                            ${['✓', 'X', 'N', 'G'].map(opt => {
                                                const isSel = val === opt || (opt === '✓' && val === 'Uygun') || (opt === 'X' && val === 'Uygun Değil');
                                                let btnColor = 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100';
                                                if (isSel) {
                                                    if (opt === '✓') btnColor = 'bg-emerald-600 text-white font-black border-emerald-600';
                                                    else if (opt === 'X') btnColor = 'bg-rose-600 text-white font-black border-rose-600';
                                                    else if (opt === 'N') btnColor = 'bg-amber-500 text-slate-950 font-black border-amber-500';
                                                    else btnColor = 'bg-slate-800 text-white font-black border-slate-800';
                                                }
                                                return `
                                                    <button onclick="handleGeneratorCheckChange('${item.code}', '${opt}', '${item.text.replace(/'/g, "\'")}')"
                                                        class="w-8 h-7 border rounded text-xs transition flex items-center justify-center ${btnColor}">
                                                        ${opt}
                                                    </button>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // 5. Ölçüm Sonuçları HTML
    const showGenMeasurements = (activeTab === 3 || activeTab === -1);
    const genMeasurementsHtml = !showGenMeasurements ? '' : `
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs">
                4. Ölçüm Sonuçları
            </div>
            <div class="p-3.5 space-y-4 text-xs">

            <!-- 5.1 Potansiyel Ölçümleri (V) -->
            <div class="space-y-2">
                <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide">5.1. Potansiyel Ölçümleri (V)</div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">L1 – N (V)</label>
                        <input type="text" value="${gen.potential.l1_n || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.potential.l1_n=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">L2 – N (V)</label>
                        <input type="text" value="${gen.potential.l2_n || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.potential.l2_n=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">L3 – N (V)</label>
                        <input type="text" value="${gen.potential.l3_n || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.potential.l3_n=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">L1 – L2 (V)</label>
                        <input type="text" value="${gen.potential.l1_l2 || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.potential.l1_l2=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">L1 – L3 (V)</label>
                        <input type="text" value="${gen.potential.l1_l3 || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.potential.l1_l3=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">L2 – L3 (V)</label>
                        <input type="text" value="${gen.potential.l2_l3 || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.potential.l2_l3=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">N – Pe (V)</label>
                        <input type="text" value="${gen.potential.n_pe || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.potential.n_pe=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-sky-800">
                    </div>
                </div>
            </div>

            <!-- 5.2 Aydınlatma, Ses, Topraklama, Isı ve Frekans -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
                <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide">5.2. Aydınlatma, Ses, Topraklama ve Frekans</div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Aydınlatma (lux)</label>
                        <input type="text" value="${gen.measurements.lux || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.measurements.lux=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">1 mt Ses Seviyesi (dB)</label>
                        <input type="text" value="${gen.measurements.db_1m || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.measurements.db_1m=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">7 mt Ses Seviyesi (dB)</label>
                        <input type="text" value="${gen.measurements.db_7m || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.measurements.db_7m=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Gövde Topraklaması (Ω)</label>
                        <input type="text" value="${gen.measurements.ground_r || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.measurements.ground_r=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-emerald-800">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">L1 Frekans (Hz)</label>
                        <input type="text" value="${gen.measurements.hz_l1 || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.measurements.hz_l1=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">L2 Frekans (Hz)</label>
                        <input type="text" value="${gen.measurements.hz_l2 || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.measurements.hz_l2=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">L3 Frekans (Hz)</label>
                        <input type="text" value="${gen.measurements.hz_l3 || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.measurements.hz_l3=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">
                    </div>
                </div>
            </div>

            <!-- 5.3 Akü Bilgileri ve Ölçümleri -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
                <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide">5.3. Akü Bilgileri ve Ölçümleri</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Akü Markası</label>
                        <input type="text" value="${gen.battery.brand || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.battery.brand=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Akü Modeli</label>
                        <input type="text" value="${gen.battery.model || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.battery.model=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Akü Seri No</label>
                        <input type="text" value="${gen.battery.serialNo || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.battery.serialNo=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">İmal Yılı</label>
                        <input type="text" value="${gen.battery.mfgYear || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.battery.mfgYear=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Redresör Devredeyken (V)</label>
                        <input type="text" value="${gen.battery.v_on || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.battery.v_on=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-700">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Redresör Devre Dışıyken (V)</label>
                        <input type="text" value="${gen.battery.v_off || ''}" placeholder=""
                            oninput="AppState.currentFormData.generator.battery.v_off=this.value; triggerAutoSave();"
                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-700">
                    </div>
                </div>
            </div>
            </div>
        </div>
    `;

    // 5. Fotoğraflar HTML
    const showPhotos = (activeTab === 4 || activeTab === -1);
    const photosHtml = !showPhotos ? '' : renderPhotoSectionUI();

    // 6. Sonuç & Onay HTML
    const showEval = (activeTab === 5 || activeTab === -1);
    const evalHtml = !showEval ? '' : renderEvaluationAndFooterSection();

    return `
        <div class="space-y-3">
            ${tabsHtml}
            ${genCompanyHtml}
            ${genInfoHtml}
            ${genChecksHtml}
            ${genMeasurementsHtml}
            ${photosHtml}
            ${evalHtml}
        </div>
    `;
}

function handleGeneratorCheckChange(code, val, title) {
    const fd = AppState.currentFormData;
    if (!fd.generator) fd.generator = {};
    if (!fd.generator.checks) fd.generator.checks = {};
    fd.generator.checks[code] = val;

    if (val === 'X') {
        const defectText = `• [JENERATÖR ${code}] ${title} kontrolünde ilgili standartlara göre uygunsuzluk tespit edilmiştir.`;
        if (!(fd.defectNotes || '').includes(code)) {
            fd.defectNotes = (fd.defectNotes ? fd.defectNotes + '\n' : '') + defectText;
            showToast(`${code} kusur açıklamalarına eklendi!`, 'warning');
        }
        fd.overallResult = 'UYGUN DEĞİL';
    }
    triggerAutoSave();
    paintInspectionEditorUI();
}

function markAllGeneratorChecksSuitable() {
    const fd = AppState.currentFormData;
    if (!fd.generator) fd.generator = {};
    if (!fd.generator.checks) fd.generator.checks = {};
    GENERATOR_CHECKLIST.forEach(item => {
        fd.generator.checks[item.code] = '✓';
    });
    fd.overallResult = 'UYGUN';
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast('Tüm 50 kontrol maddesi "✓ Uygun" olarak işaretlendi!');
}

function addGeneratorDeviceRow() {
    const fd = AppState.currentFormData;
    if (!fd.generator) fd.generator = {};
    if (!fd.generator.devices) fd.generator.devices = [];
    fd.generator.devices.push({
        name: '',
        serial: '',
        calDate: '',
        validDate: '',
        certNo: ''
    });
    triggerAutoSave();
    paintInspectionEditorUI();
}

function removeGeneratorDeviceRow(idx) {
    const fd = AppState.currentFormData;
    if (!fd.generator || !fd.generator.devices || !fd.generator.devices[idx]) return;
    fd.generator.devices.splice(idx, 1);
    triggerAutoSave();
    paintInspectionEditorUI();
}

function seedGeneratorDefaultDevices() {
    const fd = AppState.currentFormData;
    if (!fd.generator) fd.generator = {};
    fd.generator.devices = [
        { name: 'Multimetre', serial: '0793436', calDate: '19.06.2026', validDate: '19.06.2027', certNo: '0074K-0626-00956' },
        { name: 'Termal Kamera', serial: '201266702', calDate: '22.06.2026', validDate: '22.06.2027', certNo: '0074K-0626-01712' },
        { name: 'Çok Fonksiyonlu Test Cihazı', serial: '21050830', calDate: '20.10.2026', validDate: '20.10.2027', certNo: '0176K-1026-01697' },
        { name: 'Dijital Ses Seviyesi Ölçer', serial: 'C211213034', calDate: '07.11.2025', validDate: '07.11.2026', certNo: '0016K-1125-01098' },
        { name: 'Dijital Işık Ölçer', serial: 'C230285545', calDate: '14.07.2026', validDate: '14.07.2027', certNo: '0016K-0726-02235' }
    ];
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast('Örnek cihaz listesi eklendi');
}


// ============================================================================
// FIELD AUTOMATION & MADDEYE ÖZEL UYGUNSUZLUK SEÇİCİ / YÖNETİCİSİ
// ============================================================================

const ItemDefectManager = {
    STORAGE_KEY: 'enlab_item_custom_defects_v2',

    getCustomDefects() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('Item defects load error:', e);
        }
        return {};
    },

    saveCustomDefects(map) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(map));
        } catch (e) {
            console.error('Item defects save error:', e);
        }
    },

    getSentencesForQuestion(questionTitle) {
        const title = (questionTitle || '').trim();
        const catalog = window.ITEM_DEFECT_CATALOG || {};
        const customMap = this.getCustomDefects();

        let baseList = [];
        // 1. Doğrudan katalog eşleşmesi
        if (catalog[title] && Array.isArray(catalog[title])) {
            baseList = [...catalog[title]];
        } else {
            // 2. Kısmi eşleşme
            const matchKey = Object.keys(catalog).find(k =>
                title.toLowerCase().includes(k.toLowerCase().slice(0, 14)) ||
                k.toLowerCase().includes(title.toLowerCase().slice(0, 14))
            );
            if (matchKey && catalog[matchKey]) {
                baseList = [...catalog[matchKey]];
            } else {
                baseList = [
                    `"${title}" kriterinde ilgili mevzuat ve TS HD 60364-6 standardına göre uygunsuzluk tespit edilmiştir.`
                ];
            }
        }

        // 3. Kullanıcının bu soru için daha önce eklediği özel cümleler (en başta görünsün)
        const userAdded = customMap[title] || [];
        userAdded.forEach(sentence => {
            if (!baseList.includes(sentence)) {
                baseList.unshift(sentence);
            }
        });

        return baseList;
    },

    addSentenceForQuestion(questionTitle, sentence) {
        const title = (questionTitle || '').trim();
        const text = (sentence || '').trim();
        if (!title || !text) return false;

        const customMap = this.getCustomDefects();
        if (!customMap[title]) customMap[title] = [];
        if (!customMap[title].includes(text)) {
            customMap[title].unshift(text);
            this.saveCustomDefects(customMap);
        }
        return true;
    },

    deleteSentenceForQuestion(questionTitle, sentence) {
        const title = (questionTitle || '').trim();
        const customMap = this.getCustomDefects();
        if (customMap[title]) {
            customMap[title] = customMap[title].filter(s => s !== sentence);
            this.saveCustomDefects(customMap);
        }
    }
};

let currentPickerTarget = { qKey: '', questionTitle: '', contextType: 'answer' };

function openItemDefectPickerModal(qKey, questionTitle, contextType = 'answer') {
    currentPickerTarget = { qKey, questionTitle, contextType };
    renderItemDefectPickerModalUI();
}

function renderItemDefectPickerModalUI() {
    const { qKey, questionTitle, contextType } = currentPickerTarget;
    const fd = AppState.currentFormData;
    if (!fd.itemDefectSelections) fd.itemDefectSelections = {};

    const currentSelection = fd.itemDefectSelections[qKey]?.sentence || '';
    const sentences = ItemDefectManager.getSentencesForQuestion(questionTitle);

    const cardsHtml = sentences.map((sentence, idx) => {
        const isSelected = (currentSelection === sentence);
        const escaped = sentence.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `
            <div class="flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                isSelected ? 'border-rose-500 bg-rose-50/70 shadow-2xs' : 'border-slate-200 bg-white hover:border-slate-300'
            }">
                <div onclick="selectItemDefectSentence('${escaped}')" class="flex-1 flex items-start gap-2.5 cursor-pointer select-none">
                    <div class="w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-400 bg-white'
                    }">
                        ${isSelected ? '<i class="fa-solid fa-check text-[9px]"></i>' : ''}
                    </div>
                    <span class="text-xs ${isSelected ? 'font-bold text-rose-900' : 'text-slate-800 font-medium'} leading-relaxed">
                        ${sentence}
                    </span>
                </div>
                <button type="button" onclick="deleteItemDefectFromList('${escaped}', event)"
                    class="text-slate-300 hover:text-rose-600 p-1 shrink-0 rounded transition-all"
                    title="Bu cümleyi bu maddenin hafızasından sil">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
    }).join('');

    const modalBody = `
        <div class="space-y-3.5 text-xs">
            <!-- MADDE BAŞLIĞI BİLGİSİ -->
            <div class="p-3 bg-slate-900 text-white rounded-xl flex items-start gap-2.5">
                <i class="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0 text-sm"></i>
                <div class="min-w-0">
                    <span class="text-[10px] text-slate-400 uppercase font-mono block">Uygunsuzluk Maddesi</span>
                    <strong class="text-xs text-white leading-snug">${questionTitle}</strong>
                </div>
            </div>

            <!-- CÜMLE SEÇİM LİSTESİ -->
            <div>
                <label class="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Kayıtlı Uygunsuzluk Cümleleri (Birine Dokunun)</span>
                    <span class="text-[10px] text-slate-400 font-normal">Tek dokunuşla seçilir</span>
                </label>
                <div class="space-y-2 max-h-56 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                    ${cardsHtml}
                </div>
            </div>

            <!-- YENİ CÜMLE EKLEME ALANI -->
            <div class="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-amber-900 text-[11px] flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-plus text-amber-600"></i>
                        <span>Bu Maddeye Yeni Uygunsuzluk Cümlesi Ekle</span>
                    </span>
                    <span class="text-[10px] text-amber-700">Diğer işlerde de hazır çıkar</span>
                </div>
                <div class="space-y-2">
                    <div class="relative">
                        <textarea id="newItemDefectCustomInput" rows="2"
                            placeholder="Örn: Bu madde için sahada tespit edilen özel uygunsuzluk cümlesini yazın veya sesle söyleyin..."
                            class="w-full border border-amber-300 bg-white rounded-lg p-2 pr-24 text-xs focus:border-amber-500 focus:outline-none"></textarea>
                        <button type="button" onclick="toggleVoiceDictation('newItemDefectCustomInput', 'btnVoiceItemDefect')"
                            id="btnVoiceItemDefect"
                            class="absolute right-2 top-2 px-2 py-1 bg-rose-100 hover:bg-rose-200 active:scale-95 text-rose-800 font-bold rounded-md text-[11px] flex items-center gap-1 shadow-2xs transition">
                            <i class="fa-solid fa-microphone"></i>
                            <span>Sesle Söyle</span>
                        </button>
                    </div>
                    <div class="flex justify-end">
                        <button type="button" onclick="submitNewItemDefectSentence()"
                            class="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-all">
                            <i class="fa-solid fa-plus"></i>
                            <span>Bu Maddeye Kaydet & Rapora Uygula</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modalFooter = `
        <div class="flex items-center justify-between w-full">
            <button type="button" onclick="removeDefectFromItem('${qKey}')" class="text-rose-600 hover:underline font-bold text-xs">
                Uygunsuzluğu Kaldır
            </button>
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-900 active:bg-slate-800 text-white font-bold rounded-xl text-xs">
                Tamam / Kapat
            </button>
        </div>
    `;

    openModal('Uygunsuzluk Cümlesi Seçimi', modalBody, modalFooter);
}

function selectItemDefectSentence(sentence) {
    const { qKey, questionTitle, contextType } = currentPickerTarget;
    const fd = AppState.currentFormData;
    if (!fd.itemDefectSelections) fd.itemDefectSelections = {};

    fd.itemDefectSelections[qKey] = {
        title: questionTitle,
        sentence: sentence
    };

    if (contextType === 'specialized') {
        fd.specializedChecks[qKey] = 'Uygun Değil';
    } else {
        fd.answers[qKey] = 'Uygun Değil';
    }

    syncAllDefectsToDefectNotes();
    paintInspectionEditorUI();
    closeModal();
    showToast('Uygunsuzluk cümlesi rapora eklendi!');
}

function submitNewItemDefectSentence() {
    const input = document.getElementById('newItemDefectCustomInput');
    const val = (input?.value || '').trim();
    if (!val) {
        showToast('Lütfen uygunsuzluk cümlesini yazın', 'warning');
        input?.focus();
        return;
    }
    const { questionTitle } = currentPickerTarget;
    ItemDefectManager.addSentenceForQuestion(questionTitle, val);
    selectItemDefectSentence(val);
}

function deleteItemDefectFromList(sentence, event) {
    if (event) event.stopPropagation();
    if (!confirm('Bu cümleyi bu maddenin hafızasından silmek istediğinize emin misiniz?')) return;
    const { questionTitle } = currentPickerTarget;
    ItemDefectManager.deleteSentenceForQuestion(questionTitle, sentence);
    showToast('Cümle silindi');
    renderItemDefectPickerModalUI();
}

function removeDefectFromItem(qKey) {
    const fd = AppState.currentFormData;
    if (fd.itemDefectSelections && fd.itemDefectSelections[qKey]) {
        delete fd.itemDefectSelections[qKey];
    }
    syncAllDefectsToDefectNotes();
    paintInspectionEditorUI();
    closeModal();
    showToast('Uygunsuzluk kaldırıldı');
}

function syncAllDefectsToDefectNotes() {
    const fd = AppState.currentFormData;
    if (!fd.itemDefectSelections) fd.itemDefectSelections = {};

    const lines = [];
    Object.keys(fd.itemDefectSelections).forEach(k => {
        const item = fd.itemDefectSelections[k];
        if (item && item.sentence) {
            lines.push(`• [${item.title}]: ${item.sentence}`);
        }
    });

    const cur = (fd.defectNotes || '').trim();
    const existingManual = cur ? cur.split('\n').filter(l => l.trim() && !l.trim().startsWith('• [')) : [];

    if (lines.length) {
        fd.defectNotes = lines.join('\n') + (existingManual.length ? '\n\n' + existingManual.join('\n') : '');
        fd.overallResult = 'UYGUN DEĞİL';
        if (AppState.currentInspection) AppState.currentInspection.result_status = 'UYGUN DEĞİL';
    } else {
        fd.defectNotes = existingManual.join('\n');
    }

    triggerAutoSave();
}

function handleAnswerChange(qKey, value, questionTitle = '') {
    const fd = AppState.currentFormData;
    fd.answers[qKey] = value;

    if (value === 'Uygun Değil' || value === 'Kısmen Uygun') {
        fd.overallResult = 'UYGUN DEĞİL';
        triggerAutoSave();
        paintInspectionEditorUI();
        if (questionTitle) {
            setTimeout(() => openItemDefectPickerModal(qKey, questionTitle, 'answer'), 50);
        }
    } else {
        if (fd.itemDefectSelections && fd.itemDefectSelections[qKey]) {
            delete fd.itemDefectSelections[qKey];
            syncAllDefectsToDefectNotes();
        }
        triggerAutoSave();
        paintInspectionEditorUI();
    }
}

function handleSpecializedCheckChange(cKey, value, checkTitle = '') {
    const fd = AppState.currentFormData;
    fd.specializedChecks[cKey] = value;

    if (value === 'Uygun Değil' || value === 'Kısmen Uygun') {
        fd.overallResult = 'UYGUN DEĞİL';
        triggerAutoSave();
        paintInspectionEditorUI();
        if (checkTitle) {
            setTimeout(() => openItemDefectPickerModal(cKey, checkTitle, 'specialized'), 50);
        }
    } else {
        if (fd.itemDefectSelections && fd.itemDefectSelections[cKey]) {
            delete fd.itemDefectSelections[cKey];
            syncAllDefectsToDefectNotes();
        }
        triggerAutoSave();
        paintInspectionEditorUI();
    }
}

function appendStandardDefectNote(questionTitle) {
    syncAllDefectsToDefectNotes();
}

function markAllVisualChecksSuitable() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (String(insp.template_id) === '2201' && AppState.electricalTemplate) {
        AppState.electricalTemplate.areas.forEach(area => {
            (area.topics || []).forEach(topic => {
                (topic.questions || []).forEach(q => {
                    if (q.type === 'YesNo') {
                        fd.answers[`q_${q.guid}`] = 'Uygun';
                    }
                });
            });
        });
    } else {
        const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);
        (schema.visualChecks || []).forEach((_, idx) => {
            fd.specializedChecks[`chk_${idx}`] = 'Uygun';
        });
    }
    fd.overallResult = 'UYGUN';
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast('Tüm gözle kontrol maddeleri "✓ Uygun" olarak işaretlendi!');
}

// Duplicate handlePhotoUpload removed; primary optimized handler is active above.

function triggerAutoSave() {
    const insp = AppState.currentInspection;
    if (!insp) return;
    try {
        localStorage.setItem(`enlab_insp_${insp.id}`, JSON.stringify(AppState.currentFormData));
    } catch (e) {
        console.warn('LocalStorage kotası uyarısı:', e);
    }

    const badge = document.getElementById('lastSavedBadge');
    if (badge) {
        badge.classList.remove('hidden');
        badge.innerHTML = `<i class="fa-solid fa-rotate fa-spin text-amber-400 mr-1"></i> Kaydediliyor...`;
    }

    clearTimeout(AppState.saveTimer);
    AppState.saveTimer = setTimeout(() => saveCurrentInspection(false), 300);
}

async function saveCurrentInspection(manualToast = false) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp) return;

    // Keep cache synchronized
    const cached = AppState.inspectionsCache.find(x => String(x.id) === String(insp.id));
    if (cached) {
        cached.equipment_name = insp.equipment_name;
        cached.result_status = fd.overallResult || 'UYGUN';
        cached.template_id = insp.template_id;
        cached.template_code = insp.template_code;
    }

    try {
        localStorage.setItem(`enlab_insp_${insp.id}`, JSON.stringify(fd));
    } catch (e) {
        console.warn('LocalStorage kotası uyarısı:', e);
    }

    try {
        await fetch(`/api/inspections/${insp.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_id: insp.template_id,
                template_code: insp.template_code,
                equipment_name: insp.equipment_name || '',
                serial_no: insp.serial_no || '',
                report_no: insp.report_no || '',
                inspection_date: insp.inspection_date || '',
                result: fd.overallResult || 'UYGUN',
                form_data: fd
            })
        });
        const badge = document.getElementById('lastSavedBadge');
        if (badge) {
            badge.classList.remove('hidden');
            const nowStr = new Date().toLocaleTimeString('tr-TR');
            badge.innerHTML = `<i class="fa-solid fa-cloud-check text-emerald-400 mr-1"></i> Kaydedildi (${nowStr})`;
        }
        if (manualToast) showToast('Rapor veritabanına ve yerel hafızaya kaydedildi!');
    } catch (e) {
        setSyncStatus(false, 'Çevrimdışı Kaydedildi (Cihaz Hafızasında)');
        const badge = document.getElementById('lastSavedBadge');
        if (badge) {
            badge.classList.remove('hidden');
            const nowStr = new Date().toLocaleTimeString('tr-TR');
            badge.innerHTML = `<i class="fa-solid fa-floppy-disk text-sky-400 mr-1"></i> Kaydedildi (${nowStr})`;
        }
        if (manualToast) showToast('Çevrimdışı olarak cihaz hafızasına kaydedildi!');
    }
}

// ============================================================================
// 11. OFFICIAL A4 PRINTABLE REPORT GENERATOR & CORPORATE PREVIEW
//     Matches 1:1 the official TKM-FR.318 (TKM-26-02-54049) PDF & TÜRKAK AB-0227-M
// ============================================================================

function formatSymbolForPrint(val) {
    if (val === 'Uygun' || val === '✓') return '✓';
    if (val === 'Uygun Değil' || val === 'X') return 'X';
    if (val === 'Uygulaması Yok' || val === 'N') return 'N';
    if (val === 'Görülemedi' || val === 'G') return 'G';
    return val ?? '';
}

function buildTkmPageHeader(reportMainTitle) {
    const tekkomerLogoSrc = (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.tekkomerLogo) || 'assets/tekkomer_logo.png';
    const turkakLogoSrc = (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.turkakLogo) || 'assets/turkak_logo.jpg';
    return `
        <div class="tkm-header">
            <div style="display:flex;justify-content:center;align-items:center;">
                <img src="${tekkomerLogoSrc}" alt="TEKKOMER" style="width:82px;height:82px;object-fit:contain;display:block;">
            </div>
            <div style="text-align:center;padding:0 6px;">
                <div style="font-size:12.8pt;font-weight:700;color:#222222;letter-spacing:0.2px;margin-bottom:2px;">
                    TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.
                </div>
                <div style="font-size:8pt;color:#222222;line-height:1.25;">
                    <strong>T:</strong> +90 (216) 526 61 41 <strong>F:</strong> +90 (216) 526 61 40
                </div>
                <div style="font-size:8pt;color:#222222;line-height:1.25;margin-bottom:3px;">
                    info@tkmkontrol.com www.tkmkontrol.com
                </div>
                <div style="font-size:11.6pt;font-weight:700;color:#222222;line-height:1.15;text-transform:uppercase;">
                    ${reportMainTitle}
                </div>
                <div style="font-size:9.8pt;font-weight:400;color:#333333;margin-top:2px;letter-spacing:0.3px;">
                    PERİYODİK KONTROL RAPORU
                </div>
            </div>
            <div style="display:flex;justify-content:center;align-items:center;">
                <img src="${turkakLogoSrc}" alt="TÜRKAK AB-0227-M" style="width:72px;height:105px;object-fit:contain;display:block;">
            </div>
        </div>
    `;
}

function buildTkmPageFooter(formCode, reportNo, pageNum, totalPages) {
    return `
        <div class="tkm-footer">
            <div class="tkm-footer-disclaimer">
                Muayene sonuçları sadece talep edilen hizmet veya muayene edilen ürün/parti veya proses ile ilgili olup, başka hizmet veya muayene edilmeyen ürün/ parti veya proses için geçerli değildir. Muayene raporları TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş. ve müşterinin onayı olmaksızın kısmi olarak veya tamamen kopya edilip çoğaltılamaz. İmzasız raporlar geçersizdir. Bu rapor elektronik ortamda bir nüsha olarak hazırlanmıştır.
            </div>
            <div class="tkm-footer-meta">
                <span style="width:38%;text-align:left;">${formCode.includes('REV') ? formCode : (formCode + ', REV.00 / YT: 01.09.2025')}</span>
                <span style="width:34%;text-align:center;">${reportNo}</span>
                <span style="width:28%;text-align:right;">${pageNum} / ${totalPages}</span>
            </div>
        </div>
    `;
}

function buildTkmOnaySection(insp, sectionNumber = '10') {
    const qrSrc = (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.qrDefault) || 'assets/qr_default.jpg';
    const eimzaSrc = (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.eimza) || 'assets/eimza.jpg';
    return `
        <div class="tkm-sec-title">${sectionNumber}. ONAY</div>
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
                    <td style="text-align:center;">Ali Şamil Aytekin / Elektrik Mühendisi</td>
                    <td rowspan="4" style="text-align:center;vertical-align:middle;padding:4px;">
                        <img src="${qrSrc}" alt="QR Code" style="width:76px;height:76px;object-fit:contain;display:inline-block;">
                    </td>
                </tr>
                <tr>
                    <td style="font-weight:700;text-align:left;">Bakanlık Kayıt No</td>
                    <td style="text-align:center;">K2023224376</td>
                </tr>
                <tr>
                    <td style="font-weight:700;text-align:left;">Diploma No / Tarih</td>
                    <td style="text-align:center;">249538 / 28.09.2022</td>
                </tr>
                <tr style="height:44px;">
                    <td style="font-weight:700;text-align:left;vertical-align:middle;">İmza</td>
                    <td style="text-align:center;vertical-align:middle;padding:3px;">
                        <img src="${eimzaSrc}" alt="e-imzalıdır" style="height:34px;object-fit:contain;display:inline-block;">
                    </td>
                </tr>
            </tbody>
        </table>
    `;
}

function triggerBrowserPrint() {
    const insp = AppState.currentInspection;
    const reportNo = (insp && insp.report_no) ? insp.report_no : 'TKM_A4_Rapor';
    const customer = (insp && insp.customer_name) ? insp.customer_name.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 28) : 'Rapor';
    const jobTitle = `${reportNo}_${customer}`;

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

AppState.a4Zoom = 1;

function applyA4PreviewZoom() {
    const container = document.getElementById('a4PreviewPagesContainer');
    if (!container) return;
    const z = AppState.a4Zoom || 1;
    if (Math.abs(z - 1) < 0.02) {
        container.style.transform = 'none';
        container.style.marginBottom = '0';
    } else {
        container.style.transform = `scale(${z})`;
        container.style.transformOrigin = 'top center';
    }
}

function adjustA4PreviewZoom(delta) {
    AppState.a4Zoom = Math.max(0.35, Math.min(1.4, (AppState.a4Zoom || 1) + delta));
    applyA4PreviewZoom();
}

function resetA4PreviewZoom() {
    const vw = window.innerWidth || 1024;
    if (vw < 820) {
        // Fit 210mm (~794px) neatly into mobile viewport width
        AppState.a4Zoom = Math.max(0.42, Math.min(0.95, (vw - 20) / 800));
    } else {
        AppState.a4Zoom = 1;
    }
    applyA4PreviewZoom();
}

function closeA4PreviewModal() {
    const modal = document.getElementById('a4PreviewModal');
    if (modal) modal.classList.add('hidden');
}

function paginateBlocksIntoA4Pages(blocksHtmlArray, reportMainTitle, formCode, reportNo) {
    // Create an off-screen A4 measurement sandbox so browser layout engine measures exact pixel heights
    let sandbox = document.getElementById('tkmMeasureSandbox');
    if (sandbox) sandbox.remove();
    sandbox = document.createElement('div');
    sandbox.id = 'tkmMeasureSandbox';
    sandbox.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;visibility:hidden;pointer-events:none;z-index:-1;';
    document.body.appendChild(sandbox);

    const probePage = document.createElement('div');
    probePage.className = 'tkm-a4-page';
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
    const photoBlocks = [];
    const chunkSize = 2; // 2 photos side-by-side matching official TKM reports
    for (let i = 0; i < photosList.length; i += chunkSize) {
        const pair = photosList.slice(i, i + chunkSize);
        const isFirst = (i === 0);
        let blockHtml = '';
        if (isFirst) {
            blockHtml += `<div class="tkm-sec-title">${secTitle}</div>`;
        }
        blockHtml += `
            <div style="display:flex;gap:8px;margin-bottom:6px;width:100%;box-sizing:border-box;">
                ${pair.map((ph, pIdx) => `
                    <div style="flex:1;border:1px solid #111;padding:4px;text-align:center;box-sizing:border-box;background:#fff;">
                        <div style="height:175px;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:4px;">
                            <img src="${ph.dataUrl}" style="max-height:170px;max-width:100%;object-fit:contain;display:block;margin:0 auto;">
                        </div>
                        <div style="font-size:7pt;font-weight:700;color:#111;border-top:1px solid #eee;padding-top:3px;min-height:14px;line-height:1.2;">
                            Fotoğraf ${i + pIdx + 1} - ${ph.caption || 'Ekipman Görünümü'}
                        </div>
                    </div>
                `).join('')}
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
                            <th style="text-align:center;font-weight:700;">Soru / Kriter</th>
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
                        <td style="font-weight:700;">SGK Sicil No</td>
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
                            • RG, 04.11.1984 - 18565 Elektrik İç Tesisleri Yönetmeliği<br>
                            • RG, 21.08.2001 - 24500 Elektrik Tesislerinde Topraklamalar Yönetmeliği<br>
                            • RG, 25.04.2013 - 28628 İş Ekipmanları Kullanımında Sağlık Güvenlik Şartları Yönetmeliği<br>
                            • TS HD 60364-4-43 Alçak Gerilim Elektrik Tesisatları- Bölüm 4: Güvenlik İçin Koruma Grup 43 - Aşırı Akıma Karşı Koruma<br>
                            • TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama
                        </td>
                    </tr>
                </tbody>
            </table>
        `);

        // Block 2: 2. EKİPMAN BİLGİLERİ + 2.1. DETAY BİLGİLERİ
        blocks.push(`
            <div class="tkm-sec-title">2. EKİPMAN BİLGİLERİ</div>
            <div class="tkm-sub-bar">2.1. DETAY BİLGİLERİ</div>
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
                        <th style="text-align:center;font-weight:700;">Seri No</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Sertifika No</th>
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
                        <th style="text-align:center;font-weight:700;">Seri No</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Sertifika No</th>
                    </tr>
                </thead>
                <tbody>${devRowsHtml}</tbody>
            </table>
        `);

        // Block 6: 5. TEST VE KONTROLLER Title + 5.1. PANO ADI/EKİPMAN TANIMLAMASI
        blocks.push(`
            <div class="tkm-sec-title">5. TEST VE KONTROLLER - GÖZLE KONTROL KRİTERLERİ VE TESTLER</div>
            <div class="tkm-sub-bar">5.1. ${area2.topics[0].name}</div>
            ${renderOrderedGridTable(area2.topics[0].questions, 1)}
        `);

        // Blocks for 5.2 through 5.8 (Each has its COMPLETE gray title bar + Soru/Kriter header + all rows + legend!)
        area2.topics.slice(1).forEach((t, idx) => {
            blocks.push(renderCompleteVisualTopicBlock(`5.${idx + 2}. ${t.name}`, t.questions));
        });

        // Block for 6. TEST VE KONTROLLER Title + 6.1 + 6.2
        blocks.push(`
            <div class="tkm-sec-title">6. TEST VE KONTROLLER - FONKSİYON KONTROL KRİTERLERİ VE TESTLER</div>
            <div class="tkm-sub-bar">6.1. ${area3.topics[0].name}</div>
            ${renderOrderedGridTable(area3.topics[0].questions, 1)}
            <div class="tkm-sub-bar">6.2. ${area3.topics[1].name}</div>
            ${renderOrderedGridTable(area3.topics[1].questions, 1)}
        `);

        // Block for 6.3
        blocks.push(`
            <div class="tkm-sub-bar">6.3. ${area3.topics[2].name}</div>
            ${renderOrderedGridTable(area3.topics[2].questions, 4)}
        `);

        // Helper to push multi-row tables (6.4, 6.5, 6.6) in chunks of up to 8 rows with repeated full header if multi-chunk
        const pushMultiRowTopicBlocks = (topic, tKey, subTitle) => {
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
                `);
            }
        };

        pushMultiRowTopicBlocks(area3.topics[3], 'topic_3_3', '6.4. ' + area3.topics[3].name);
        pushMultiRowTopicBlocks(area3.topics[4], 'topic_3_4', '6.5. ' + area3.topics[4].name);
        pushMultiRowTopicBlocks(area3.topics[5], 'topic_3_5', '6.6. ' + area3.topics[5].name);

        // Block for 7. KUSUR AÇIKLAMALARI & 8. NOTLAR
        blocks.push(`
            <div class="tkm-sec-title">7. KUSUR AÇIKLAMALARI</div>
            <table class="tkm-table">
                <tbody>
                    <tr>
                        <td style="min-height:18px;height:18px;vertical-align:top;text-align:left;">${(fd.defectNotes || '').replace(/\n/g, '<br>')}</td>
                    </tr>
                </tbody>
            </table>
            <div class="tkm-sec-title">8. NOTLAR</div>
            <table class="tkm-table">
                <tbody>
                    <tr>
                        <td style="min-height:18px;height:18px;vertical-align:top;text-align:left;">${(fd.generalNotes || '').replace(/\n/g, '<br>')}</td>
                    </tr>
                </tbody>
            </table>
        `);

        // Block for 9. SONUÇ VE KANAAT
        const conclusionText = fd.overallResult === 'UYGUN DEĞİL' ? 'KULLANIMI UYGUN DEĞİLDİR.' : 'KULLANIMI UYGUNDUR.';
        blocks.push(`
            <div class="tkm-sec-title">9. SONUÇ VE KANAAT</div>
            <table class="tkm-table">
                <tbody>
                    <tr>
                        <td style="font-size:6.6pt;line-height:1.15;padding:3.5px 6px;text-align:left;">
                            <div>Ağır kusur tanımları:</div>
                            <div>Gözle Kontrol Bölümü</div>
                            <div>1. Faza erişim engeli IP2X koruma sınıfını sağlamıyorsa,</div>
                            <div>2. Kablo ek noktaları yalıtımlı değilse, pano içinde ucu açıkta iletken varsa,</div>
                            <div>3. Pano elemanları bağlantı noktalarında kontak gevşekliği (seri ark) tespit edilmişse,</div>
                            <div>4. PVC izoleli kablolarda ve pano elemanlarının dokunulabilen metal olmayan yüzeylerinde aşırı ısınma tespit edilmişse.</div>
                            <div style="margin-top:2px;">Fonksiyon Testleri Bölümü</div>
                            <div>1. Hesaplanan 3 fazlı kısa devre akımı, pano içinde bulunan herhangi bir aşırı akım koruma cihazı etiketinde yazan kısa devre kesme kapasitesinden (Icu) fazla ise,</div>
                            <div>2. Aşırı akım koruma elemanı değerleri linye kesiti ile uyumsuz ise,</div>
                            <div>3. El ulaşma mesafesindeki metal bölümler, ekipmanın toprak barası veya toprak ucuyla eş potansiyel değilse,</div>
                            <div>4. RCD performans testi sonuçları yetersiz ise,</div>
                            <div>5. Kablo şalter koordinasyonunun aşağıdaki uygunsuzluğu;<br>Devre Tasarım Akımı (Ib), Devre Kesici Akımı (In) ve Kablo Akım Taşıma Kapasitesi (Iz) için Ib&lt;In&lt;Iz sağlanmadıysa,</div>
                            <div>6. Zemin yalıtımının aşağıdaki uygunsuzlukları;<br>b) El ulaşma mesafesinde bulunan zemin izolasyonu uygun boyutta değilse, (EİTY Md. 33d)<br>c) Zemin izolasyon direnci 50 kΩ’dan büyük değilse, (EİTY Md. 48)</div>
                            <div>7. N/PEN iletkeni kesitinin ve kullanım yerinin aşağıdaki uygunsuzlukları;<br>a) N/PEN kesiti ile faz iletkeni kesiti eşit değilse. (EİTY Md 57b3-ii-1)<br>İstisna: N/PEN kesitinin faz iletkeninin kesitinden küçük olması durumunda (örneğin 3x70+35 mm2 gibi) faz iletkenlerini koruyan devre kesici anma akımının, N/PEN iletkeni kesitine göre (örnekteki 35mm2’ye göre) belirlenmesi kuralı ihlal edildiyse (EİTY Md 57b3-ii-2)<br>b) PEN iletkeni kesiti &gt;10 mm2 değilse (EİTY Md 36)<br>c) PEN iletkeni yangın tehlikesi olan yerlerden geçirilmemesi kuralı ihlal edildiyse (EİTY Md 64)<br>d) PEN iletkeni Exproof tehlikeli bölge sınırları içinden geçirilmemesi kuralı ihlal edildiyse (IEC 60079-14)</div>
                            <div>8. PE koruma iletkeni kesitinin aşağıdaki uygunsuzluğu;<br>Koruma iletkeni kesiti ETTY Md. 9e1i’de verilen formülle yapılan hesap sonucuna ve ETTY Çizelge 8’de verilen tabloya uygun değilse,</div>
                            <div>9. PD potansiyel dengeleme iletkeni kesitinin aşağıdaki uygunsuzluğu;<br>6 mm2 &lt; PD &lt; 25 mm2 değilse,</div>
                            <div>10. Tamamlayıcı potansiyel dengeleme: PD &gt; 4mm² değilse.<br>Ağır kusur olarak değerlendirilir.</div>
                            <div style="margin-top:2px;">
                                Bu rapor “Alçak Gerilim Topraklama Tesisatı Kontrol Raporu” ile birlikte geçerlidir.<br>
                                TS HD 60364 standardına göre kullanımı uygun olmayan tesisatlar aşağıdaki şekilde işaretlenir:<br>
                                C1 – Tehlike mevcut. Yaralanma riski. Derhal düzeltici eylem gerekli.<br>
                                C2 – Potansiyel olarak tehlikeli – acil düzeltici eylem gerekli.<br>
                                C3 – İyileştirme önerilir.
                            </div>
                            <div style="margin-top:2px;font-size:7.4pt;font-weight:700;">
                                Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen Elektrik Tesisatının fonksiyon testleri muayenesi sonrasında mevcut şartlar altında<br>
                                <span style="font-size:8.2pt;color:${fd.overallResult === 'UYGUN DEĞİL' ? '#b91c1c' : '#047857'};">${conclusionText}</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        `);

        // Photos Block (if attached)
        if (fd.photos && fd.photos.length) {
            blocks.push(...renderPdfPhotoBlocks(fd.photos, 'FOTOĞRAFLAR'));
        }

        // Block for 10. ONAY
        blocks.push(buildTkmOnaySection(insp, '10'));

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
                            <div style="margin-top:4px;font-size:7.4pt;font-weight:700;">
                                Periyodik kontrol tarihi itibariyle yukarıda teknik özellikleri belirtilen AG Topraklama Tesisatı muayenesi sonrasında mevcut şartlar altında kullanımı 1 yıl süreyle;<br>
                                <span style="font-size:8pt;color:${isGroundingSuitable ? '#047857' : '#b91c1c'};">${isGroundingSuitable ? 'UYGUNDUR.' : 'UYGUN DEĞİLDİR.'}</span>
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
                        <th style="text-align:center;font-weight:700;">Seri No</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Sertifika No</th>
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
                        <td style="padding:6px 8px;text-align:left;font-size:7.4pt;">
                            Periyodik kontrol tarihi itibariyle yukarıda teknik özellikleri belirtilen jeneratör muayenesi sonrasında mevcut şartlar altında<br>
                            <span style="font-weight:700;font-size:8.2pt;color:${isGenSuitable ? '#047857' : '#b91c1c'};">
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
                    <thead><tr><th></th><th style="text-align:center;font-weight:700;">Soru / Kriter</th><th style="text-align:center;font-weight:700;">1</th></tr></thead>
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
                            <td style="padding:5px 6px;font-weight:700;">
                                Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen ekipmanın muayenesi sonrasında mevcut şartlar altında<br>
                                <span style="font-size:8.2pt;color:${fd.overallResult === 'UYGUN DEĞİL' ? '#b91c1c' : '#047857'};">
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

    // Populate Printable Container (for @media print)
    printArea.innerHTML = pagesArray.map(p => `<div class="tkm-a4-page">${p}</div>`).join('');

    // Populate On-Screen A4 Preview Modal
    const previewContainer = document.getElementById('a4PreviewPagesContainer');
    const previewModal = document.getElementById('a4PreviewModal');
    const previewTitle = document.getElementById('a4PreviewTitle');
    if (previewTitle) {
        previewTitle.textContent = `${reportNo} · ${insp.equipment_name || 'Periyodik Kontrol Raporu'} (${pagesArray.length} Sayfa A4)`;
    }
    if (previewContainer) {
        previewContainer.innerHTML = pagesArray.map(p => `<div class="tkm-a4-page tkm-preview-sheet">${p}</div>`).join('');
    }
    if (previewModal && !directPrint) {
        previewModal.classList.remove('hidden');
        resetA4PreviewZoom();
    } else {
        triggerBrowserPrint();
    }
}


// ============================================================================
// ACİL DURUM YEDEKLEME, VERİ KURTARMA & GÜVENLİK KALKANI (v0.5)
// ============================================================================

function exportEmergencyBackup() {
    try {
        if (AppState.currentInspection && AppState.currentFormData) {
            try {
                localStorage.setItem(`enlab_insp_${AppState.currentInspection.id}`, JSON.stringify(AppState.currentFormData));
            } catch (e) {}
        }

        const backupData = OfflineDB.exportFullBackupObject();
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const timeStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
        const fileName = `ENLAB_Saha_Yedek_${timeStamp}.json`;

        if (window.AndroidBridge && typeof window.AndroidBridge.exportBackupFile === 'function') {
            window.AndroidBridge.exportBackupFile(jsonStr, fileName);
            showToast('Yedek Android cihazınıza kaydedildi: ' + fileName);
            return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);

        showToast('Acil durum yedeği başarıyla indirildi!');
    } catch (err) {
        console.error('Yedek alma hatası:', err);
        showToast('Yedek alınırken hata oluştu: ' + (err.message || ''), 'error');
    }
}

function openBackupManagerModal() {
    OfflineDB.init();
    const db = OfflineDB.state || {};
    const workOrderCount = (db.workOrders || []).length;
    const inspectionCount = (db.inspections || []).length;
    
    let customDefectCount = 0;
    try {
        const raw = localStorage.getItem('enlab_item_custom_defects_v2');
        if (raw) {
            const parsed = JSON.parse(raw);
            Object.values(parsed).forEach(arr => {
                if (Array.isArray(arr)) customDefectCount += arr.length;
            });
        }
    } catch (e) {}

    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    const footerEl = document.getElementById('modalFooter');

    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-shield-halved text-amber-400 mr-2"></i>Veri Yedekleme ve Kurtarma Merkezi`;
    }

    if (bodyEl) {
        bodyEl.innerHTML = `
            <div class="space-y-4">
                <div class="p-3.5 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl">
                    <div class="flex items-center gap-2.5 text-sky-950 font-bold text-xs mb-1">
                        <i class="fa-solid fa-circle-check text-sky-600 text-sm"></i>
                        <span>%100 Çevrimdışı & Yerel Koruma</span>
                    </div>
                    <p class="text-[11px] text-sky-900 leading-relaxed">
                        Tüm iş emirleriniz, elektrik muayene raporlarınız, ölçüm değerleriniz ve girdiğiniz özel uygunsuzluk cümleleri cihazınızın güvenli depolama alanında saklanmaktadır.
                    </p>
                </div>

                <!-- İstatistikler -->
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div class="text-base font-black text-slate-800">${workOrderCount}</div>
                        <div class="text-[10px] font-bold text-slate-500">Şirket / Klasör</div>
                    </div>
                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div class="text-base font-black text-sky-700">${inspectionCount}</div>
                        <div class="text-[10px] font-bold text-slate-500">Rapor</div>
                    </div>
                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div class="text-base font-black text-emerald-700">${customDefectCount}</div>
                        <div class="text-[10px] font-bold text-slate-500">Özel Cümle</div>
                    </div>
                </div>

                <!-- Aksiyonlar -->
                <div class="space-y-2.5 pt-1">
                    <button onclick="exportEmergencyBackup()" class="w-full p-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-between shadow-sm transition">
                        <div class="flex items-center gap-2.5">
                            <i class="fa-solid fa-file-arrow-down text-base"></i>
                            <div class="text-left">
                                <div>Tek Tıkla Tam Yedek İndir (JSON)</div>
                                <div class="text-[10px] font-normal text-emerald-100">Tüm raporları ve uygunsuzluk hafızasını tek dosyada indirir</div>
                            </div>
                        </div>
                        <i class="fa-solid fa-chevron-right text-xs opacity-70"></i>
                    </button>

                    <label class="w-full p-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-between shadow-sm transition cursor-pointer">
                        <div class="flex items-center gap-2.5">
                            <i class="fa-solid fa-file-arrow-up text-base text-sky-400"></i>
                            <div class="text-left">
                                <div>Yedekten Geri Yükle (JSON İçe Aktar)</div>
                                <div class="text-[10px] font-normal text-slate-300">Daha önce indirilmiş bir yedeği sisteme aktarır</div>
                            </div>
                        </div>
                        <i class="fa-solid fa-chevron-right text-xs opacity-70"></i>
                        <input type="file" accept=".json,application/json" class="hidden" onchange="importBackupFromFile(this)">
                    </label>
                </div>
            </div>
        `;
    }

    if (footerEl) {
        footerEl.innerHTML = `
            <button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg active:scale-95 transition">
                Kapat
            </button>
        `;
    }

    openModal();
}

function importBackupFromFile(fileInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            const success = OfflineDB.importFullBackupObject(parsed);
            if (success) {
                showToast('Yedek başarıyla geri yüklendi! Yenileniyor...');
                setTimeout(() => {
                    location.reload();
                }, 800);
            } else {
                showToast('Geçersiz yedek dosyası formatı!', 'error');
            }
        } catch (err) {
            console.error('Yedek okuma hatası:', err);
            showToast('Yedek dosyası okunamadı: ' + err.message, 'error');
        } finally {
            fileInput.value = '';
        }
    };
    reader.readAsText(file);
}

function showGlobalCrashShield(message, error) {
    const shieldEl = document.getElementById('globalCrashShield');
    const msgEl = document.getElementById('crashShieldErrorMessage');
    if (shieldEl) {
        shieldEl.classList.remove('hidden');
        if (msgEl) {
            const errStr = (message || 'Bilinmeyen Hata') + (error && error.stack ? '\n' + error.stack : '');
            msgEl.textContent = errStr;
        }
    }
}

function dismissCrashShield() {
    const shieldEl = document.getElementById('globalCrashShield');
    if (shieldEl) {
        shieldEl.classList.add('hidden');
    }
}
window.showGlobalCrashShield = showGlobalCrashShield;
window.dismissCrashShield = dismissCrashShield;
window.exportEmergencyBackup = exportEmergencyBackup;
window.openBackupManagerModal = openBackupManagerModal;
window.importBackupFromFile = importBackupFromFile;


// ============================================================================
// 12. SAHA UX FAZ-1: SESLE DİKTE, FOTOĞRAF KUSUR İŞARETLEME VE BAŞPARMAK BARI
// ============================================================================

// --- 12.1 SESLE DİKTE (VOICE-TO-TEXT) ---
let activeSpeechRecognition = null;

function toggleVoiceDictation(targetInputId, triggerBtnId = null) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast('Bu cihazda veya tarayıcıda sesli dikte desteklenmiyor. (Chrome/WebView gereklidir)', 'warning');
        return;
    }

    if (activeSpeechRecognition) {
        activeSpeechRecognition.stop();
        activeSpeechRecognition = null;
        return;
    }

    try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.continuous = false;
        recognition.interimResults = true;

        const targetEl = document.getElementById(targetInputId);
        const triggerBtn = triggerBtnId ? document.getElementById(triggerBtnId) : null;
        let initialVal = targetEl ? targetEl.value : '';

        if (triggerBtn) {
            triggerBtn.classList.add('bg-rose-600', 'text-white', 'animate-pulse');
            triggerBtn.innerHTML = '<i class="fa-solid fa-microphone-lines"></i> <span>Dinleniyor...</span>';
        }
        showToast('🎙️ Dinleniyor... Lütfen konuşun.', 'info');

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
            if (targetEl) {
                targetEl.value = (initialVal ? initialVal + ' ' : '') + transcript;
                targetEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };

        recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            showToast('Ses tanıma: ' + (event.error === 'not-allowed' ? 'Mikrofon izni verilmedi' : event.error), 'error');
        };

        recognition.onend = () => {
            activeSpeechRecognition = null;
            if (triggerBtn) {
                triggerBtn.classList.remove('bg-rose-600', 'text-white', 'animate-pulse');
                triggerBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> <span>Sesle Söyle</span>';
            }
            showToast('Ses kaydı tamamlandı.');
        };

        activeSpeechRecognition = recognition;
        recognition.start();
    } catch (e) {
        console.error('Ses tanıma başlatılamadı:', e);
        showToast('Sesli dikte başlatılamadı', 'error');
    }
}
window.toggleVoiceDictation = toggleVoiceDictation;

// --- 12.2 FOTOĞRAF KUSUR İŞARETLEYİCİ (PHOTO ANNOTATOR) ---
let currentAnnotatingPhotoIdx = -1;
let annotatorTool = 'arrow'; // 'arrow', 'circle', 'rect'
let annotatorHistory = [];
let annotatorBaseImg = null;
let isDrawingAnnotation = false;
let drawStartX = 0;
let drawStartY = 0;

function openPhotoAnnotatorModal(idx) {
    const fd = AppState.currentFormData;
    if (!fd.photos || !fd.photos[idx]) return;
    
    currentAnnotatingPhotoIdx = idx;
    annotatorHistory = [];
    annotatorTool = 'arrow';
    
    const modal = document.getElementById('photoAnnotatorModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    
    updateAnnotatorToolButtons();
    
    const photo = fd.photos[idx];
    const canvas = document.getElementById('annotatorCanvas');
    const ctx = canvas.getContext('2d');
    
    annotatorBaseImg = new Image();
    annotatorBaseImg.onload = () => {
        // Fit canvas to natural dimensions of image
        canvas.width = annotatorBaseImg.naturalWidth || 1280;
        canvas.height = annotatorBaseImg.naturalHeight || 960;
        ctx.drawImage(annotatorBaseImg, 0, 0, canvas.width, canvas.height);
        
        // Save initial state to history
        saveAnnotatorHistorySnapshot();
        initAnnotatorCanvasListeners();
    };
    annotatorBaseImg.src = photo.dataUrl;
}

function closePhotoAnnotatorModal() {
    const modal = document.getElementById('photoAnnotatorModal');
    if (modal) modal.classList.add('hidden');
    currentAnnotatingPhotoIdx = -1;
    annotatorBaseImg = null;
}

function setAnnotatorTool(tool) {
    annotatorTool = tool;
    updateAnnotatorToolButtons();
}

function updateAnnotatorToolButtons() {
    const tools = ['arrow', 'circle', 'rect'];
    tools.forEach(t => {
        const btn = document.getElementById('toolBtn' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) {
            if (t === annotatorTool) {
                btn.className = 'px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold flex items-center gap-1 text-[11px] border border-rose-400';
            } else {
                btn.className = 'px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 font-bold flex items-center gap-1 text-[11px] border border-slate-600';
            }
        }
    });
}

function saveAnnotatorHistorySnapshot() {
    const canvas = document.getElementById('annotatorCanvas');
    if (canvas && annotatorHistory.length < 15) {
        annotatorHistory.push(canvas.toDataURL('image/jpeg', 0.88));
    }
}

function undoPhotoAnnotation() {
    if (annotatorHistory.length <= 1) {
        showToast('Geri alınacak çizim bulunmuyor', 'warning');
        return;
    }
    annotatorHistory.pop(); // Remove current
    const prev = annotatorHistory[annotatorHistory.length - 1];
    const canvas = document.getElementById('annotatorCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
}

function clearPhotoAnnotation() {
    if (!annotatorBaseImg) return;
    const canvas = document.getElementById('annotatorCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(annotatorBaseImg, 0, 0, canvas.width, canvas.height);
    annotatorHistory = [canvas.toDataURL('image/jpeg', 0.88)];
    showToast('Tüm çizimler temizlendi');
}

function savePhotoAnnotation() {
    if (currentAnnotatingPhotoIdx < 0) return;
    const canvas = document.getElementById('annotatorCanvas');
    const fd = AppState.currentFormData;
    if (!fd.photos || !fd.photos[currentAnnotatingPhotoIdx]) return;
    
    // Save high quality compressed JPEG
    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.82);
    fd.photos[currentAnnotatingPhotoIdx].dataUrl = finalDataUrl;
    fd.photos[currentAnnotatingPhotoIdx].annotated = true;
    
    triggerAutoSave();
    paintInspectionEditorUI();
    closePhotoAnnotatorModal();
    showToast('Kusur işareti fotoğrafa uygulandı ve rapora kaydedildi!');
}

function getCanvasCoordinates(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

let annotatorListenersInitialized = false;
function initAnnotatorCanvasListeners() {
    if (annotatorListenersInitialized) return;
    annotatorListenersInitialized = true;
    
    const canvas = document.getElementById('annotatorCanvas');
    if (!canvas) return;
    
    let lastSnapshotImg = new Image();

    function startDraw(clientX, clientY) {
        isDrawingAnnotation = true;
        const coords = getCanvasCoordinates(canvas, clientX, clientY);
        drawStartX = coords.x;
        drawStartY = coords.y;
        lastSnapshotImg.src = canvas.toDataURL('image/jpeg', 0.88);
    }

    function moveDraw(clientX, clientY) {
        if (!isDrawingAnnotation) return;
        const coords = getCanvasCoordinates(canvas, clientX, clientY);
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(lastSnapshotImg, 0, 0);
        
        drawShape(ctx, annotatorTool, drawStartX, drawStartY, coords.x, coords.y);
    }

    function endDraw(clientX, clientY) {
        if (!isDrawingAnnotation) return;
        isDrawingAnnotation = false;
        saveAnnotatorHistorySnapshot();
    }

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) startDraw(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) moveDraw(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        endDraw();
    }, { passive: false });

    // Mouse events for desktop testing
    canvas.addEventListener('mousedown', (e) => startDraw(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => { if (isDrawingAnnotation) moveDraw(e.clientX, e.clientY); });
    window.addEventListener('mouseup', (e) => { if (isDrawingAnnotation) endDraw(e.clientX, e.clientY); });
}

function drawShape(ctx, tool, x1, y1, x2, y2) {
    ctx.strokeStyle = '#ef4444'; // High contrast red
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = Math.max(6, Math.round(ctx.canvas.width / 160));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'arrow') {
        // Draw main line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead at (x2, y2)
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = Math.max(24, Math.round(ctx.canvas.width / 40));
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    } else if (tool === 'circle') {
        const rx = Math.abs(x2 - x1) / 2;
        const ry = Math.abs(y2 - y1) / 2;
        const cx = Math.min(x1, x2) + rx;
        const cy = Math.min(y1, y2) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(rx, 10), Math.max(ry, 10), 0, 0, 2 * Math.PI);
        ctx.stroke();
    } else if (tool === 'rect') {
        const w = x2 - x1;
        const h = y2 - y1;
        ctx.beginPath();
        ctx.strokeRect(x1, y1, w, h);
    }
}

window.openPhotoAnnotatorModal = openPhotoAnnotatorModal;
window.closePhotoAnnotatorModal = closePhotoAnnotatorModal;
window.setAnnotatorTool = setAnnotatorTool;
window.undoPhotoAnnotation = undoPhotoAnnotation;
window.clearPhotoAnnotation = clearPhotoAnnotation;
window.savePhotoAnnotation = savePhotoAnnotation;

// --- 12.3 MOBİL BAŞPARMAK HIZLI EYLEM BARI (BOTTOM ACTION DOCK) ---
function triggerQuickCameraCapture() {
    const input = document.getElementById('quickCameraInput');
    if (input) {
        input.click();
    } else {
        showToast('Kamera açılıyor...');
    }
}

function openTabNavSheet() {
    const insp = AppState.currentInspection;
    if (!insp) return;

    let tabs = [];
    if (String(insp.template_id) === '2201') {
        tabs = [
            { label: '1. Firma & Rapor Bilgileri', id: 0 },
            { label: '2. Ölçüm Aletleri (4. Bölüm)', id: 1 },
            { label: '3. Gözle Kontrol (Kriterler)', id: 2 },
            { label: '4. Fonksiyon & Ölçüm Tabloları', id: 3 },
            { label: `5. Fotoğraflar (${(AppState.currentFormData.photos || []).length})`, id: 4 },
            { label: '6. Sonuç, Kanaat & Onay', id: 5 },
            { label: 'Tüm Sayfayı Göster', id: -1 }
        ];
    } else if (String(insp.template_id) === '2202') {
        tabs = [
            { label: '1. Firma & Rapor Bilgileri', id: 0 },
            { label: '2. Tesisat & Dağıtım Bilgileri', id: 1 },
            { label: '3. Ölçüm Noktaları Tablosu', id: 2 },
            { label: '4. Selektivite & Artık Akım', id: 3 },
            { label: `5. Fotoğraflar (${(AppState.currentFormData.photos || []).length})`, id: 4 },
            { label: '6. Sonuç & Onay', id: 5 },
            { label: 'Tüm Sayfayı Göster', id: -1 }
        ];
    } else if (String(insp.template_id) === '2205') {
        tabs = [
            { label: '1. Firma & Genel Bilgiler', id: 0 },
            { label: '2. Jeneratör Etiket & Karakteristik', id: 1 },
            { label: '3. Kontrol Kriterleri (Gözle)', id: 2 },
            { label: '4. Elektriksel Ölçümler', id: 3 },
            { label: `5. Fotoğraflar (${(AppState.currentFormData.photos || []).length})`, id: 4 },
            { label: '6. Sonuç & Onay', id: 5 },
            { label: 'Tüm Sayfayı Göster', id: -1 }
        ];
    } else {
        tabs = [
            { label: '1. Firma Bilgileri', id: 0 },
            { label: '2. Genel & Ölçüm Cihazı', id: 1 },
            { label: '3. Kontrol Kriterleri', id: 2 },
            { label: '4. Ölçüm Verileri', id: 3 },
            { label: '5. Fotoğraflar', id: 4 },
            { label: '6. Sonuç & Onay', id: 5 },
            { label: 'Tümü', id: -1 }
        ];
    }

    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    const footerEl = document.getElementById('modalFooter');

    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-layer-group text-amber-400 mr-2"></i>Rapor Bölümleri (Hızlı Geçiş)`;
    }

    if (bodyEl) {
        bodyEl.innerHTML = `
            <div class="space-y-2">
                ${tabs.map(t => `
                    <button onclick="setInspectionActiveTab(${t.id}); closeModal();"
                        class="w-full p-3 rounded-xl border text-left font-bold text-xs flex items-center justify-between transition active:scale-98 ${
                            AppState.currentActiveTab === t.id 
                                ? 'bg-sky-500 text-white border-sky-600 shadow-sm' 
                                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }">
                        <span>${t.label}</span>
                        <i class="fa-solid fa-chevron-right text-xs opacity-70"></i>
                    </button>
                `).join('')}
            </div>
        `;
    }

    if (footerEl) {
        footerEl.innerHTML = `
            <button onclick="closeModal()" class="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl active:scale-95 transition">
                Kapat
            </button>
        `;
    }

    openModal();
}

window.triggerQuickCameraCapture = triggerQuickCameraCapture;
window.openTabNavSheet = openTabNavSheet;

window.previewA4ReportModal = printOfficialReport;
