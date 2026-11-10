// ============================================================================
// HIZLI RAPOR - 02-WORK-ORDERS.JS
// Açıklama: İşyeri / Saha Klasörleri, İş Listesi ve Klasör Detayları
// Satır Aralığı: 1686 - 3274 (1589 satır)
// ============================================================================

function openQuickFieldJobModal() {

    const templates = window.ENLAB_REPORT_TEMPLATES || [];

    const tplCheckboxes = templates.map((t) => {

        const cleanName = typeof getCleanTemplateTypeLabel === 'function' ? getCleanTemplateTypeLabel(t.id, t.code) : t.name;

        return `

        <label class="quick-tpl-item flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-sky-500 cursor-pointer transition-all shadow-2xs">

            <div class="flex items-center gap-2.5 min-w-0">

                <input type="checkbox" name="quickJobTpl" value="${t.id}" class="w-4 h-4 accent-sky-600 rounded shrink-0">

                <div class="min-w-0">

                    <div class="font-bold text-slate-800 text-xs truncate">${cleanName}</div>

                </div>

            </div>

            <span class="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">

                Seç

            </span>

        </label>

    `;}).join('');



    openModal(

        'Yeni İşyeri / Saha Klasörü Aç',

        `<div class="space-y-2.5 text-xs">

            <div>

                <label class="block font-bold text-slate-800 mb-1">İşyeri / Firma Adı <span class="text-rose-500">*</span></label>

                <input type="text" id="qjCompanyName" placeholder=""

                    class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none">

            </div>

            <div>

                <label class="block font-bold text-slate-700 mb-1">Periyodik Kontrol Adresi</label>

                <input type="text" id="qjAddress" placeholder=""

                    class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-3 py-2 text-xs">

            </div>

            <div class="grid grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-1">İSG-KATİP Sözleşme ID</label>

                    <input type="text" id="qjIsgKatipNo" placeholder=""

                        class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs font-medium">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-1">SGK Sicil No</label>

                    <input type="text" id="qjSgkSicilNo" placeholder=""

                        class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs font-medium">

                </div>

            </div>

            <div>

                <label class="block font-bold text-slate-700 mb-1"><i class="fa-solid fa-envelope text-sky-600 mr-1"></i>Yetkili E-posta Adresi <span class="text-[10px] text-slate-400 font-normal">(Rapor Gönderimi İçin)</span></label>

                <input type="email" id="qjContactEmail" placeholder="yetkili@firma.com"

                    class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs">

            </div>

            <div>

                <div class="flex items-center justify-between gap-2 mb-1.5">

                    <label class="font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-bolt text-amber-500"></i>

                        <span>Oluşturulacak Elektrik Raporları</span>

                    </label>

                    <span class="text-[10px] text-slate-400">İstediğinizi seçin</span>

                </div>

                <div id="qjTemplatesGrid" class="space-y-1.5 p-2 border border-slate-200 rounded-xl bg-slate-50 max-h-44 overflow-y-auto">

                    ${tplCheckboxes}

                </div>

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">İptal</button>

         <button onclick="submitQuickFieldJob(false)" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-2xs">

            <i class="fa-solid fa-folder-plus"></i>

            <span>Klasörü Aç</span>

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
    const isgKatipNo = (document.getElementById('qjIsgKatipNo')?.value || '').trim();
    const sgkSicilNo = (document.getElementById('qjSgkSicilNo')?.value || '').trim();
    const contactEmail = (document.getElementById('qjContactEmail')?.value || '').trim();
    if (contactEmail) { try { localStorage.setItem('enlab_last_recipient_email', contactEmail); } catch (e) {} }
    const fieldNotes = (document.getElementById('qjFieldNotes')?.value || '').trim();

    const checkedTpls = Array.from(document.querySelectorAll('input[name="quickJobTpl"]:checked')).map(cb => cb.value);



    const res = await fetch('/api/work-orders', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

            company_name: rawName,

            company_branch: address,

            company_address: address,

            isg_katip_no: isgKatipNo,

            sgk_sicil_no: sgkSicilNo,

            contact_email: contactEmail,

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



let woEmailSaveTimer = null;
function saveWorkOrderEmailRealtime(woId, emailText) {
    const clean = (emailText || '').trim();
    if (AppState.currentWorkOrder && String(AppState.currentWorkOrder.id) === String(woId)) {
        AppState.currentWorkOrder.contact_email = clean;
    }
    if (clean) {
        try { localStorage.setItem('enlab_last_recipient_email', clean); } catch (e) {}
    }
    const statusEl = document.getElementById(`woEmailSaveStatus_${woId}`);
    if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i>`;
    }
    clearTimeout(woEmailSaveTimer);
    woEmailSaveTimer = setTimeout(async () => {
        await fetch(`/api/work-orders/${woId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_email: clean })
        });
        if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-check text-emerald-600"></i> Kaydedildi`;
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

                    <input type="text" id="newWoNo" value="${(typeof CompanySettingsManager !== 'undefined' ? CompanySettingsManager.getSettings().reportNoPrefix : 'ENL-') || 'ENL-'}${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100+Math.random()*900)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono">

                </div>

                <div>

                    <label class="block font-semibold text-slate-700 mb-1">Teklif No</label>

                    <input type="text" id="newWoProposal" value="${(typeof CompanySettingsManager !== 'undefined' ? CompanySettingsManager.getSettings().reportNoPrefix : 'ENL-') || 'ENL-'}TKL-2026-${Math.floor(100+Math.random()*900)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono">

                </div>

            </div>

            <div>

                <label class="block font-semibold text-slate-700 mb-1">Müşteri Firma Ünvanı</label>

                <input type="text" id="newWoCustomer" placeholder="" class="w-full border border-slate-300 rounded-lg px-3 py-2">

            </div>

            <div class="grid grid-cols-2 gap-3">

                <div>

                    <label class="block font-semibold text-slate-700 mb-1">Şube / Tesis Adı</label>

                    <input type="text" id="newWoBranch" placeholder="" class="w-full border border-slate-300 rounded-lg px-3 py-2">

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

            <!-- HEADER (EMIL KOWALSKI CRAFT) -->

            <div class="card-craft-white p-2.5 flex items-center justify-between gap-2">

                <div class="flex items-center gap-2.5 min-w-0">

                    <button onclick="navigateTo('home')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl font-bold text-xs shrink-0 transition border border-slate-200">

                        <i class="fa-solid fa-arrow-left mr-1"></i>Geri

                    </button>

                    <div class="min-w-0">

                        <h1 class="font-bold text-slate-900 text-sm sm:text-base truncate">${wo.customer_name}</h1>

                        ${wo.customer_branch ? `<div class="text-[11px] text-slate-500 truncate">${wo.customer_branch}</div>` : ''}

                    </div>

                </div>

            </div>



            <!-- YÖNETİCİ & SAHA İSTATİSTİKLERİ (KOMPAKT METRİK ŞERİDİ) -->

            <div class="card-craft-white p-2 px-3 flex items-center justify-between text-xs font-semibold">

                <div class="flex items-center gap-1.5 text-slate-700">

                    <span class="w-2 h-2 rounded-full bg-slate-400"></span>

                    <span>Toplam: <strong class="text-slate-900 font-bold">${inspections.length}</strong></span>

                </div>

                <div class="flex items-center gap-1.5 text-emerald-700">

                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>

                    <span>Uygun: <strong class="font-bold">${inspections.filter(i => (i.result_status || 'UYGUN') === 'UYGUN').length}</strong></span>

                </div>

                <div class="flex items-center gap-1.5 text-rose-700">

                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>

                    <span>Kusurlu: <strong class="font-bold">${inspections.filter(i => i.result_status === 'UYGUN DEĞİL').length}</strong></span>

                </div>

            </div>



            <!-- YETKİLİ E-POSTA ADRESİ (HIZLI RAPOR GÖNDERİMİ İÇİN) -->

            <div class="card-craft-white p-2.5 flex items-center gap-2">

                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">

                    <i class="fa-solid fa-envelope text-sky-600"></i>

                    <span>Yetkili E-posta:</span>

                </div>

                <input type="email" id="woContactEmailInput_${wo.id}"

                    value="${escapeHtml(wo.contact_email || '')}"

                    oninput="saveWorkOrderEmailRealtime('${wo.id}', this.value)"

                    placeholder="yetkili@firma.com (Raporların gönderileceği adres)"

                    class="flex-1 min-w-0 border border-slate-200 bg-slate-50/70 focus:bg-white rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:border-sky-500 focus:outline-none">

                <span id="woEmailSaveStatus_${wo.id}" class="text-[10px] text-slate-400 shrink-0 hidden sm:inline">Otomatik</span>

            </div>



            <!-- NOT DEFTERİ (KOMPAKT) -->

            <div class="card-craft-white p-2.5 space-y-1.5">

                <div class="flex items-center justify-between">

                    <label class="font-bold text-xs text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-note-sticky text-amber-500"></i>

                        <span>Saha Notları</span>

                    </label>

                    <span id="woNoteSaveStatus_${wo.id}" class="text-[10px] text-slate-400">Otomatik kaydedilir</span>

                </div>

                <textarea id="woFieldNotesTextarea_${wo.id}" rows="2"

                    oninput="saveWorkOrderNotesRealtime('${wo.id}', this.value)"

                    placeholder="Saha notlarınızı buraya yazın..."

                    class="w-full border border-slate-200 bg-amber-50/20 rounded-lg p-2 text-xs text-slate-900 focus:border-amber-400 focus:outline-none">${wo.field_notes || ''}</textarea>

            </div>



            <!-- RAPORLAR (IMPECCABLE CRAFT) -->

            <div class="card-craft-white p-3.5 space-y-3">

                <div class="flex items-center justify-between gap-2">

                    <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-file-lines text-sky-600"></i>

                        <span>Rapor Taslakları (${inspections.length})</span>

                    </div>

                    <div class="flex items-center gap-1.5">

                        <button onclick="openMultiReportEmailModal('${wo.id}')" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition" title="Klasördeki Raporları E-posta ile Gönder">

                            <i class="fa-solid fa-envelope-open-text"></i>

                            <span>Çoklu Rapor Gönder</span>

                        </button>

                        <button onclick="openAddInspectionModal('${wo.id}')" class="px-3.5 py-1.5 btn-craft-emerald active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition">

                            <i class="fa-solid fa-plus"></i>

                            <span>Rapor Ekle</span>

                        </button>

                    </div>

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



function getCleanTemplateTypeLabel(templateId, templateCode) {

    const tid = String(templateId || '');

    const code = String(templateCode || '');

    if (tid === '2202' || code.includes('317')) {

        return 'Alçak Gerilim Topraklama';

    } else if (tid === '2205' || code.includes('164') || code.includes('322')) {

        return 'Jeneratör';

    } else if (tid === '2201' || code.includes('318')) {

        return 'Elektrik İç Tesisatı';

    }

    const tpl = (window.ENLAB_REPORT_TEMPLATES || []).find(t => String(t.id) === tid);

    if (tpl && tpl.name) {

        let n = tpl.name;

        n = n.replace(' GÖZLE KONTROL VE TESTLERİ', '')

             .replace(' GÖZLE KONTROL VE FONKSİYON TESTLERİ', '')

             .replace(' PERİYODİK KONTROLÜ', '')

             .replace(' TESİSATI', '')

             .replace(' Muayene Raporu', '');

        return n;

    }

    return 'Elektrik Muayenesi';

}



function renderWoInspectionRows(list, workOrderId) {

    if (!list.length) {

        return `<div class="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">

            <i class="fa-solid fa-folder-open text-slate-300 text-2xl mb-2 block"></i>

            Bu klasörde henüz rapor yok.<br>Üstteki <strong class="text-slate-800 font-bold">+ Rapor Ekle</strong> butonuna dokunarak panolarınızı (ADP, TDP-1 vb.) ekleyin.

        </div>`;

    }

    return list.map(item => {

        const isSuitable = (item.result_status || 'UYGUN') === 'UYGUN';

        const typeLabel = getCleanTemplateTypeLabel(item.template_id, item.template_code);

        return `

        <div class="card-craft-white p-2.5 transition space-y-1.5 hover:border-slate-300">

            <!-- TIER 1: REPORT TITLE & SUBTITLE -->

            <div onclick="navigateTo('inspection-complete', {id: '${item.id}', templateId: '${item.template_id}'})" class="cursor-pointer">

                <div class="flex items-start justify-between gap-2">

                    <!-- ANA YAZI: KULLANICININ GİRDİĞİ PANO / EKİPMAN ADI (ADP, TDP-1 vb.) -->

                    <div class="font-black text-slate-900 text-sm tracking-tight leading-snug flex-1 truncate">

                        ${escapeHtml(item.equipment_name || 'İsimsiz Pano / Ekipman')}

                    </div>

                    <span class="inline-flex items-center gap-1 text-[10px] font-semibold ${isSuitable ? 'text-emerald-700' : 'text-rose-700'} shrink-0 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">

                        <span class="w-1.5 h-1.5 rounded-full ${isSuitable ? 'bg-emerald-500' : 'bg-rose-500'}"></span>

                        ${item.result_status || 'UYGUN'}

                    </span>

                </div>

                <!-- ALT YAZI: KÜÇÜK FONTLA KATEGORİ (TKM-FR YAZILARI KALDIRILDI) -->

                <div class="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap font-medium">

                    <span class="text-sky-700 font-semibold">${typeLabel}</span>

                    ${item.location ? `<span class="text-slate-300">•</span><span class="text-slate-600">${escapeHtml(item.location)}</span>` : ''}

                    ${item.serial_no ? `<span class="text-slate-300">•</span><span class="text-slate-400 font-mono text-[10px]">${escapeHtml(item.serial_no)}</span>` : ''}

                </div>

            </div>



            <!-- TIER 2: ACTION BUTTONS (KOMPAKT & RAFİNE) -->

            <div class="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">

                <div class="flex items-center gap-1.5 flex-1 min-w-0">

                    <button onclick="navigateTo('inspection-complete', {id: '${item.id}', templateId: '${item.template_id}'})"

                        class="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition shadow-2xs">

                        <i class="fa-solid fa-pen-to-square text-[10px]"></i>

                        <span>Doldur</span>

                    </button>

                    <button onclick="quickPreviewReportFromList('${item.id}')"

                        class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition border border-slate-200">

                        <i class="fa-solid fa-file-pdf text-amber-600 text-[10px]"></i>

                        <span>PDF</span>

                    </button>

                </div>

                <div class="flex items-center gap-0.5 shrink-0">

                    <button onclick="cloneInspectionReport('${item.id}', '${workOrderId}')"

                        class="p-1 text-slate-400 hover:text-sky-600 active:scale-90 rounded-md transition" title="Raporu Klonla">

                        <i class="fa-solid fa-clone text-xs"></i>

                    </button>

                    <button onclick="event.stopPropagation(); openRenameInspectionModal('${item.id}', '${escapeForJs(item.equipment_name || '')}', '${workOrderId}')"

                        class="p-1 text-slate-400 hover:text-sky-600 active:scale-90 rounded-md transition" title="Pano İsmini Düzenle">

                        <i class="fa-solid fa-pen text-xs"></i>

                    </button>

                    <button onclick="event.stopPropagation(); deleteInspectionItem('${item.id}', '${workOrderId}', '${(item.equipment_name || 'Muayene Raporu').replace(/'/g, "\'")}')"

                        class="p-1 text-slate-400 hover:text-rose-600 active:scale-90 rounded-md transition" title="Raporu Sil">

                        <i class="fa-solid fa-trash-can text-xs text-rose-500"></i>

                    </button>

                </div>

            </div>

        </div>

        `;

    }).join('');

}



function openRenameInspectionModal(inspectionId, currentName, workOrderId) {

    openModal(

        '<i class="fa-solid fa-pen-to-square mr-2 text-sky-500"></i>Ekipman Adını Düzenle',

        `<div class="space-y-3 text-xs">

            <div>

                <label class="block font-bold text-slate-800 mb-1">Ekipman Adı <span class="text-rose-500">*</span></label>

                <input type="text" id="renameInspectionInput" value="${escapeHtml(currentName || '')}"

                    placeholder="Örn: ADP, TDP-1, Jeneratör-1..."

                    class="w-full border-2 border-slate-300 focus:border-sky-500 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none">

                <p class="text-[11px] text-slate-500 mt-1">Bu isim klasör listesinde ve resmi raporda ekipman adı olarak gösterilir.</p>

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

        showToast('Lütfen geçerli bir pano veya ekipman adı yazın (Örn: ADP, TDP-1)!', 'warning');

        if (input) input.focus();

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

    showToast(`Pano adı "${newName}" olarak güncellendi`);

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



window.setQuickInspEqName = function(val) {

    const inp = document.getElementById('newInspEqName');

    if (inp) {

        inp.value = val;

        inp.classList.remove('border-rose-500', 'ring-2', 'ring-rose-200');

        inp.focus();

        const box = document.getElementById('quickInspBox');
        if (box) box.style.display = 'none';

    }

};

