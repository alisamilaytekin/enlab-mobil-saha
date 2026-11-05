// ============================================================================
// HIZLI RAPOR - 03-INSPECTIONS.JS
// Açıklama: Ekipman Ekleme, Akıllı Öneri Algoritması ve Muayene İşlemleri
// Satır Aralığı: 3275 - 5202 (1928 satır)
// ============================================================================

function normalizeEquipmentSearchText(str) {
    if (!str) return '';
    return str
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'I')
        .replace(/i/g, 'I')
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/ü/g, 'U')
        .replace(/Ş/g, 'S')
        .replace(/ş/g, 'S')
        .replace(/Ö/g, 'O')
        .replace(/ö/g, 'O')
        .replace(/Ç/g, 'C')
        .replace(/ç/g, 'C')
        .toUpperCase();
}

function getEquipmentSuggestions(query, limit = 10) {
    const qRaw = (query || '').trimStart();
    if (!qRaw.trim()) return [];

    const normQ = normalizeEquipmentSearchText(qRaw);
    const counts = {};

    let list = [];
    try {
        if (window.OfflineDB && window.OfflineDB.state && Array.isArray(window.OfflineDB.state.inspections)) {
            list = list.concat(window.OfflineDB.state.inspections);
        }
    } catch (e) {}

    if (window.AppState && Array.isArray(AppState.inspectionsCache)) {
        list = list.concat(AppState.inspectionsCache);
    }

    ['enlab_offline_db_v3_clean', 'enlab_offline_db_v2'].forEach(key => {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed.inspections)) {
                    list = list.concat(parsed.inspections);
                }
            }
        } catch (e) {}
    });

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('enlab_insp_')) {
                const val = JSON.parse(localStorage.getItem(k));
                if (val && val.equipment_name) {
                    list.push({ equipment_name: val.equipment_name });
                }
            }
        }
    } catch (e) {}

    list.forEach(i => {
        if (!i) return;
        const name = (i.equipment_name || '').trim();
        if (name && !name.toLowerCase().includes('isimsiz') && !name.toLowerCase().includes('rapor tasla')) {
            counts[name] = (counts[name] || 0) + 1;
        }
    });

    // Sadece kullanıcının daha önce girdiği veriler taranır (varsayılan statik liste yok)
    // Sadece aranan harfle BAŞLAYANLAR listelenir (içinde geçenler hariç)
    const matching = [];
    Object.keys(counts).forEach(name => {
        const normName = normalizeEquipmentSearchText(name);
        if (normName.startsWith(normQ)) {
            matching.push(name);
        }
    });

    matching.sort((a, b) => (counts[b] || 0) - (counts[a] || 0));

    return matching.slice(0, limit);
}

window.updateEquipmentQuickSuggestions = function(query) {
    const box = document.getElementById('quickInspBox');
    const container = document.getElementById('quickInspChips');
    if (!box || !container) return;

    const suggestions = getEquipmentSuggestions(query, 10);
    if (!suggestions || suggestions.length === 0) {
        box.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    container.innerHTML = suggestions.map(name => `
        <button type="button" onclick="setQuickInspEqName('${escapeForJs(name)}')"
            class="px-2 py-1 bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 rounded text-[11px] font-bold text-slate-700 transition active:scale-95 shadow-2xs">
            ${escapeHtml(name)}
        </button>
    `).join('');

    box.style.display = 'block';
};

function getMostUsedEquipmentNames(limit = 10) {
    return getEquipmentSuggestions('', limit);
}

function openAddInspectionModal(workOrderId) {

    const optionsHtml = (window.ENLAB_REPORT_TEMPLATES || []).map(t => {

        const cleanName = getCleanTemplateTypeLabel(t.id, t.code);

        return `<option value="${t.id}" data-code="${t.code}" data-name="${t.name}">

            ${cleanName}

        </option>`;

    }).join('');



    openModal(
        'Yeni Ekipman Ekle',

        `<div class="space-y-3 text-xs">

            <div>

                <label class="block font-bold text-slate-800 mb-1">Rapor Türü</label>

                <select id="newInspTemplate"

                    class="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold bg-white text-xs">

                    ${optionsHtml}

                </select>

            </div>

            <div>

                <div class="flex items-center justify-between mb-1">

                    <label class="block font-bold text-slate-800">Ekipman Adı <span class="text-rose-500">*</span></label>

                    <span class="text-[10px] text-rose-500 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">ZORUNLU</span>

                </div>

                <input type="text" id="newInspEqName" value="" placeholder="Örn: ADP, TDP-1, Jeneratör-1..."

                    oninput="updateEquipmentQuickSuggestions(this.value)"

                    class="w-full border-2 border-slate-300 focus:border-sky-500 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none transition">

                

                <!-- Hızlı Seçim Bölmesi (Başlangıçta kapalı, kullanıcı yazdıkça max 10 öneri gelir) -->
                <div id="quickInspBox" style="display: none;" class="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div class="text-[10px] text-slate-500 font-semibold mb-1 flex items-center justify-between">
                        <span class="flex items-center gap-1">
                            <i class="fa-solid fa-bolt text-amber-500"></i>
                            <span>Hızlı Seçim</span>
                        </span>
                    </div>
                    <div id="quickInspChips" class="flex flex-wrap gap-1"></div>
                </div>

            </div>

            <div class="grid grid-cols-2 gap-2.5">

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Bölge / Mahal (İsteğe Bağlı)</label>

                    <input type="text" id="newInspLocation" value="" placeholder="Örn: Ana Pano Odası" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Seri No / Kod (İsteğe Bağlı)</label>

                    <input type="text" id="newInspSerial" value="" placeholder="Örn: ADP-01" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs">

                </div>

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">İptal</button>

         <button onclick="submitNewInspection('${workOrderId}')" class="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-2xs active:scale-95">

            <i class="fa-solid fa-plus"></i>

            <span>Ekle ve Aç</span>

         </button>`

    );

    setTimeout(() => {

        const inp = document.getElementById('newInspEqName');

        if (inp) inp.focus();

    }, 120);

}



async function submitNewInspection(workOrderId) {

    const sel = document.getElementById('newInspTemplate');

    const templateId = sel.value;

    const templateCode = sel.options[sel.selectedIndex].getAttribute('data-code') || 'TKM-FR.318';

    const eqNameInput = document.getElementById('newInspEqName');

    const eqName = (eqNameInput?.value || '').trim();



    if (!eqName) {

        showToast('Lütfen ekipman adını giriniz (Örn: ADP, TDP-1)!', 'warning');

        if (eqNameInput) {

            eqNameInput.classList.add('border-rose-500', 'ring-2', 'ring-rose-200');

            eqNameInput.focus();

        }

        return;

    }



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



async function deleteInspectionItem(inspectionId, workOrderId, inspectionTitle) {

    promptSecurityPasswordConfirmation({

        title: 'Muayene Raporunu Sil',

        entityName: inspectionTitle || 'Muayene Raporu',

        message: 'Bu muayene kaydı ve bağlı tüm ölçüm verileri kalıcı olarak silinecektir.',

        onConfirmed: async () => {

            await fetch(`/api/inspections/${inspectionId}`, { method: 'DELETE' });

            showToast('Muayene silindi', 'warning');

            await loadInitData();

            if (workOrderId && AppState.currentRoute === 'work-order-details') {

                renderWorkOrderDetails(workOrderId, 'inspections');

            } else {

                navigateTo(AppState.currentRoute, AppState.currentParams);

            }

        }

    });

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

    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;

    const logoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getLogoSrc() : 'assets/tekkomer_logo.png';

    const turkakLogoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getTurkakLogoSrc() : 'assets/turkak_logo.jpg';

    const showTurkak = branding.showTurkakLogo !== false;



    openModal(

        mode === 'qr' ? '<i class="fa-solid fa-qrcode mr-2 text-sky-400"></i>Ekipman Karekod (QR) Etiketi' : '<i class="fa-solid fa-tag mr-2 text-emerald-400"></i>Periyodik Kontrol Ekipman Etiketi',

        `<div class="p-5 border-2 border-slate-800 rounded-xl bg-white max-w-md mx-auto text-center space-y-2.5">

            <div class="flex items-center justify-between border-b-2 border-slate-900 pb-2">

                <img src="${logoSrc}" class="w-12 h-12 object-contain" alt="Logo">

                <div class="text-center flex-1 px-2">

                    <div class="text-[11px] font-black tracking-tight text-slate-900">${escapeHtml(branding.companyFullName)}</div>

                    <div class="text-[10px] font-bold text-red-700">PERİYODİK KONTROL ETİKETİ</div>

                </div>

                ${showTurkak ? `<img src="${turkakLogoSrc}" class="w-10 h-14 object-contain" alt="Akreditasyon">` : `<div class="w-10"></div>`}

            </div>

            <div class="text-sm font-black text-slate-900 pt-1">${escapeHtml(item.equipment_name || 'Ekipman')}</div>

            <div class="text-xs font-semibold text-slate-600">${escapeHtml(item.customer_name || '')}</div>

            <div class="py-2 flex justify-center">

                <img src="/assets/qr_default.jpg" class="w-28 h-28 border border-slate-300 p-1 bg-white object-contain" alt="QR Code">

            </div>

            <div class="grid grid-cols-2 text-left text-[11px] bg-slate-100 p-2.5 rounded border border-slate-200 gap-1.5">

                <div><strong>Rapor No:</strong> <span class="font-mono">${escapeHtml(item.report_no || '-')}</span></div>

                <div><strong>Tarih:</strong> <span class="font-mono">${escapeHtml(item.inspection_date || '-')}</span></div>

                <div><strong>Seri No:</strong> <span class="font-mono">${escapeHtml(item.serial_no || '-')}</span></div>

                <div><strong>Sonuç:</strong> <span class="text-emerald-700 font-black">${escapeHtml(item.result_status || 'UYGUN')}</span></div>

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



