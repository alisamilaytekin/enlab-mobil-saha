// ============================================================================
// HIZLI RAPOR - 04-EDITOR-COMMON.JS
// Açıklama: Rapor Editörü Ana Gövde, Ortak Firma ve Ölçüm Aletleri
// Satır Aralığı: 5203 - 5946 (744 satır)
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

    

    if (container) container.classList.add('pb-8');

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

            <!-- MINIMAL EDITOR HEADER (EMIL KOWALSKI CRAFT) -->

            <div class="card-craft-white p-3.5 space-y-2.5">

                <div class="flex items-center justify-between gap-2">

                    <button onclick="navigateTo('work-order-details', {id: '${insp.work_order_id || 43129}'})" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl shrink-0 transition border border-slate-200">

                        <i class="fa-solid fa-arrow-left mr-1"></i>Geri

                    </button>

                    <div class="flex items-center gap-1.5 shrink-0">

                        <button onclick="document.getElementById('editorNotebookDrawer')?.classList.toggle('hidden')" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 transition">

                            <i class="fa-solid fa-note-sticky mr-1 text-amber-600"></i>Notlar

                        </button>

                        <button onclick="saveCurrentInspection(true)" class="px-3.5 py-1.5 btn-craft-primary active:scale-95 text-white font-bold text-xs rounded-xl transition">

                            <i class="fa-solid fa-floppy-disk mr-1"></i>Kaydet

                        </button>

                        <button onclick="printOfficialReport()" class="px-3.5 py-1.5 btn-craft-dark active:scale-95 text-amber-400 font-black text-xs rounded-xl flex items-center gap-1.5 transition">

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

                    <span class="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shrink-0">
                        ${getCleanTemplateTypeLabel(insp.template_id, insp.template_code)}
                    </span>

                </div>



                <!-- RAPOR / EKİPMAN ADI DÜZENLEME -->

                <div class="flex items-center gap-2 p-1.5 bg-amber-50/70 border border-amber-200 rounded-lg">

                    <label class="text-[11px] font-black text-amber-900 shrink-0 flex items-center gap-1">

                        <i class="fa-solid fa-file-pen text-amber-600"></i>

                        <span>Ekipman Adı:</span>

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

    const wo = (window.OfflineDB?.state?.workOrders || []).find(w => String(w.id) === String(insp.work_order_id)) || AppState.currentWorkOrder || {};

    if (!fd.companyInfo.firmName) fd.companyInfo.firmName = insp.customer_name || insp.company_name || wo.company_name || '';

    if (!fd.companyInfo.address) fd.companyInfo.address = insp.address || wo.company_address || '';

    if (!fd.companyInfo.isgKatipNo) fd.companyInfo.isgKatipNo = insp.isg_katip_no || wo.isg_katip_no || '';

    if (!fd.companyInfo.sgkSicilNo) fd.companyInfo.sgkSicilNo = insp.sgk_sicil_no || wo.sgk_sicil_no || '';

    if (fd.companyInfo.equipmentName === undefined) fd.companyInfo.equipmentName = insp.equipment_name || '';

    if (fd.companyInfo.serialCode === undefined) fd.companyInfo.serialCode = insp.serial_no || '';

    if (fd.companyInfo.startEndTime === undefined) fd.companyInfo.startEndTime = '';

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

            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between gap-2">

                <span>1. Firma ve Rapor Bilgileri</span>

                <span class="text-[11px] text-slate-300 font-mono hidden sm:inline">${escapeHtml(ci.reportNo || insp.report_no || '')}</span>

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

                    <label class="block font-bold text-slate-700 mb-1">İSG-KATİP Sözleşme ID</label>

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

                                <label class="block text-xs font-bold text-slate-700">Cihaz Adı</label>

                                <input type="text" value="${escapeHtml(dev.name || '')}" placeholder=""

                                    oninput="AppState.currentFormData.measuringDevices[${dIdx}].name=this.value; triggerAutoSave();"

                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700">Seri No</label>

                                <input type="text" value="${escapeHtml(dev.serial || '')}" placeholder=""

                                    oninput="AppState.currentFormData.measuringDevices[${dIdx}].serial=this.value; triggerAutoSave();"

                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700">Sertifika No</label>

                                <input type="text" value="${escapeHtml(dev.certNo || '')}" placeholder=""

                                    oninput="AppState.currentFormData.measuringDevices[${dIdx}].certNo=this.value; triggerAutoSave();"

                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700">Kalibrasyon Tarihi</label>

                                <input type="text" value="${escapeHtml(dev.calDate || '')}" placeholder=""

                                    oninput="AppState.currentFormData.measuringDevices[${dIdx}].calDate=this.value; triggerAutoSave();"

                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700">Geçerlilik Tarihi</label>

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



