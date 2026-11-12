// ============================================================================
// HIZLI RAPOR - 08-EDITOR-GROUNDING.JS
// Açıklama: Alçak Gerilim Topraklama (TKM-FR.319) Ölçüm Noktaları ve Hesaplamaları
// Satır Aralığı: 9665 - 11120 (1456 satır)
// ============================================================================

function renderGrounding2202Editor() {

    const insp = AppState.currentInspection;

    const fd = AppState.currentFormData;

    if (!fd.grounding) {

        fd.grounding = { details: {}, detected: {}, method: 'Çevrim empedansı', points: [], selectivity: [] };

    }

    const gd = fd.grounding;

    const netType = (gd.details && gd.details.networkType) ? gd.details.networkType.trim().toUpperCase() : '';

    const isTN = netType.startsWith('TN');

    const zsFormulaLabel = isTN ? '230/Ia' : '50/Ia';

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

            </div>

            <div class="p-3.5 space-y-3 text-xs">

            

            <div class="space-y-2">

                <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide">2.1. Etiket ve Detay Bilgileri</div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Enerji Sağlayan Kuruluş</label>

                        <input type="text" value="${gd.details.supplier || ''}" placeholder=""

                            oninput="AppState.currentFormData.grounding.details.supplier=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">

                            <span>Şebeke Tipi</span>

                            <span class="text-[9px] font-mono font-bold ${(gd.details.networkType || '').startsWith('TN') ? 'text-amber-700' : 'text-sky-700'}">${(gd.details.networkType || '').startsWith('TN') ? 'TN (230/Ia)' : 'TT (50/Ia)'}</span>

                        </label>

                        <select onchange="updateGroundingNetworkType(this.value);"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white shadow-2xs">

                            <option value="">Seçiniz...</option>

                            ${['TT', 'TN-S', 'TN-C-S', 'TN-C', 'IT'].map(opt => `<option value="${opt}" ${(gd.details.networkType || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Şebeke Gerilimi (V)</label>

                        <input type="text" value="${gd.details.voltage || ''}" placeholder=""

                            oninput="AppState.currentFormData.grounding.details.voltage=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Tesise Ait Proje Var mı?</label>

                        <select onchange="AppState.currentFormData.grounding.details.hasProject=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                            <option value="">Seçiniz...</option>

                            <option value="Var" ${gd.details.hasProject === 'Var' ? 'selected' : ''}>Var</option>

                            <option value="Yok" ${gd.details.hasProject === 'Yok' ? 'selected' : ''}>Yok</option>

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Tek Hat Şeması Var mı?</label>

                        <select onchange="AppState.currentFormData.grounding.details.hasSingleLine=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                            <option value="">Seçiniz...</option>

                            <option value="Var" ${gd.details.hasSingleLine === 'Var' ? 'selected' : ''}>Var</option>

                            <option value="Yok" ${gd.details.hasSingleLine === 'Yok' ? 'selected' : ''}>Yok</option>

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Kontrol Nedeni</label>

                        <input type="text" value="${gd.details.reason || ''}" placeholder=""

                            oninput="AppState.currentFormData.grounding.details.reason=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Proje Bilgileri</label>

                        <input type="text" value="${gd.details.projectInfo || ''}" placeholder=""

                            oninput="AppState.currentFormData.grounding.details.projectInfo=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Topraklayıcı Tipi</label>

                        <select onchange="AppState.currentFormData.grounding.details.grounderType=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                            <option value="">Seçiniz...</option>

                            ${['Ring', 'Temel', 'Çubuk', 'Levha', 'Şerit'].map(opt => `<option value="${opt}" ${(gd.details.grounderType || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Yapı Cinsi</label>

                        <input type="text" value="${gd.details.buildingType || ''}" placeholder=""

                            oninput="AppState.currentFormData.grounding.details.buildingType=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Kullanım Amacı</label>

                        <input type="text" value="${gd.details.usagePurpose || ''}" placeholder=""

                            oninput="AppState.currentFormData.grounding.details.usagePurpose=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Son Kontrol Tarihi</label>

                        <input type="text" value="${gd.details.lastControlDate || ''}" placeholder=""

                            oninput="AppState.currentFormData.grounding.details.lastControlDate=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Hava Durumu</label>

                        <select onchange="AppState.currentFormData.grounding.details.weather=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                            <option value="">Seçiniz...</option>

                            ${['Açık', 'Kapalı', 'Yağışlı'].map(opt => `<option value="${opt}" ${(gd.details.weather || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Hava Sıcaklığı (°C)</label>

                        <input type="text" value="${gd.details.temperature || ''}" placeholder=""

                            oninput="AppState.currentFormData.grounding.details.temperature=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Zemin Nem Durumu</label>

                        <select onchange="AppState.currentFormData.grounding.details.soilMoisture=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                            <option value="">Seçiniz...</option>

                            ${['Kuru', 'Nemli', 'Islak'].map(opt => `<option value="${opt}" ${(gd.details.soilMoisture || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div class="sm:col-span-3">

                        <label class="block text-xs font-bold text-slate-700 mb-1">Dolaylı Dokunmaya Karşı Koruma Önlemi</label>

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

                        <label class="block text-xs font-bold text-slate-700 mb-1">Tesisatta Kapsamlı Değişiklik Var mı?</label>

                        <select onchange="AppState.currentFormData.grounding.detected.majorChange=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                            <option value="">Seçiniz...</option>

                            <option value="Var" ${gd.detected.majorChange === 'Var' ? 'selected' : ''}>Var</option>

                            <option value="Yok" ${gd.detected.majorChange === 'Yok' ? 'selected' : ''}>Yok</option>

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Önceki Kontrol Eki Var mı?</label>

                        <select onchange="AppState.currentFormData.grounding.detected.prevReportAttached=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                            <option value="">Seçiniz...</option>

                            <option value="Var" ${gd.detected.prevReportAttached === 'Var' ? 'selected' : ''}>Var</option>

                            <option value="Yok" ${gd.detected.prevReportAttached === 'Yok' ? 'selected' : ''}>Yok</option>

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Pano / Ekipman Tanımlaması</label>

                        <input type="text" value="${gd.detected.panelIdent || ''}" placeholder=""

                            oninput="AppState.currentFormData.grounding.detected.panelIdent=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                </div>

            </div>



            <div class="space-y-1.5 pt-2 border-t border-slate-100">

                <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide">4.1. Ölçüm Metodu</div>

                <div>

                    <label class="block text-xs font-bold text-slate-700 mb-1">Ölçüm ve Doğrulama Metodu</label>

                    <input type="text" value="${gd.method || ''}" placeholder=""

                        oninput="AppState.currentFormData.grounding.method=this.value; triggerAutoSave();"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">

                </div>

            </div>

            </div>

        </div>

    `;



    // 4.2 Ölçüm Noktaları HTML (KATLANABİLİR ACCORDION & 44PX ERGONOMİ)

    const showPoints = (activeTab === 2 || activeTab === -1);

    const resultOptions = [

        'Not-1', 'Not-2', 'Not-3', 'Not-4', 'Not-5', 'Not-6', 'Not-7', 'Not-8', 'Not-9', 'Not-10', 'Not-11'

    ];

    const pointsHtml = !showPoints ? '' : `

        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">

            <!-- SECTION HEADER & GLOBAL ACTIONS -->

            <div class="px-3.5 py-3 bg-slate-900 text-white font-bold text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">

                <div class="flex items-center gap-2">

                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>

                    <span>4.2. Son Tüketim Noktaları (${gd.points.length} Linye)</span>

                </div>

                <div class="flex items-center gap-1.5 flex-wrap">

                    <button onclick="setAllGroundingPointsExpanded(true)" class="py-1 px-2 text-[11px] px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition" title="Tüm linyeleri aç">

                        <i class="fa-solid fa-angles-down text-[11px] text-sky-400"></i>

                        <span class="hidden xs:inline">Tümünü Aç</span>

                    </button>

                    <button onclick="setAllGroundingPointsExpanded(false)" class="py-1 px-2 text-[11px] px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition" title="Tüm linyeleri özet satırına daralt">

                        <i class="fa-solid fa-angles-up text-[11px] text-amber-400"></i>

                        <span class="hidden xs:inline">Daralt</span>

                    </button>

                    <button onclick="openBatchRowGeneratorModal()" class="py-1 px-2 text-[11px] px-3 py-1.5 btn-craft-primary active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition">

                        <i class="fa-solid fa-layer-group"></i>

                        <span>+ Seri Üret</span>

                    </button>

                    <button onclick="addGroundingPointRow()" class="py-1 px-2 text-[11px] px-3 py-1.5 btn-craft-emerald active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition">

                        <i class="fa-solid fa-plus"></i>

                        <span>Nokta Ekle</span>

                    </button>

                </div>

            </div>



            <div class="p-3 space-y-2.5 bg-slate-100/60">

                ${gd.points.length === 0 ? `

                    <div class="p-6 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-xs sm:text-sm">

                        Henüz ölçüm noktası eklenmedi.

                    </div>

                ` : gd.points.map((p, pIdx) => {

                    const isExpanded = isGroundingPointExpanded(pIdx);

                    const isSuitable = p.result === 'Not-1' || p.result === 'Not-4';

                    const isDefect = p.result && !isSuitable;



                    const resultBadge = p.result === 'Not-1'

                        ? '<span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1"><i class="fa-solid fa-check text-[10px]"></i>Not-1 (Uygun)</span>'

                        : p.result === 'Not-4'

                        ? '<span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1"><i class="fa-solid fa-shield-halved text-[10px]"></i>Not-4 (RCD Faal)</span>'

                        : p.result

                        ? `<span class="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation text-[10px]"></i>${p.result}</span>`

                        : '<span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">Bekliyor</span>';



                    return `

                    <div class="card-craft-white overflow-hidden border border-slate-200 shadow-2xs transition-all">

                        <!-- HEADER / ACCORDION TOGGLE ROW (KOMPAKT) -->

                        <div onclick="toggleGroundingPointAccordion(${pIdx})"

                            class="p-2 px-2.5 cursor-pointer flex items-center justify-between gap-2 select-none hover:bg-slate-50/80 transition ${isExpanded ? 'bg-slate-50/70 border-b border-slate-200' : ''}">

                            <div class="flex items-center gap-2 min-w-0">

                                <div class="w-6 h-6 rounded-md font-mono font-bold text-[10px] flex items-center justify-center shrink-0 ${isSuitable ? 'bg-emerald-600 text-white' : isDefect ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'}">

                                    #${pIdx + 1}

                                </div>

                                <div class="min-w-0">

                                    <div class="font-bold text-xs text-slate-900 truncate leading-snug">

                                        ${escapeHtml(p.point || 'İsimsiz Ölçüm Noktası')}

                                    </div>

                                    <div class="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 flex-wrap">

                                        <span class="font-bold text-slate-800">${p.curve || 'C'}${p.inAmp || '16'}A</span>

                                        <span>·</span>

                                        <span>Zx: <strong class="text-sky-900 font-bold">${p.zxRx ? p.zxRx + ' Ω' : '-'}</strong></span>

                                        <span>·</span>

                                        <span>Zs: <strong class="text-slate-800 font-bold">${p.zsRa ? p.zsRa + ' Ω' : '-'}</strong></span>

                                        ${p.ik1Amp ? `<span>· Ik1: <strong class="text-amber-800 font-bold">${p.ik1Amp}A</strong></span>` : ''}

                                    </div>

                                </div>

                            </div>



                            <div class="flex items-center gap-1.5 shrink-0">

                                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold ${isSuitable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isDefect ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">

                                    ${p.result || 'Bekliyor'}

                                </span>

                                <div class="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 transition-transform ${isExpanded ? 'rotate-180 bg-slate-200 text-slate-800' : ''}">

                                    <i class="fa-solid fa-chevron-down text-[10px]"></i>

                                </div>

                            </div>

                        </div>



                        <!-- EXPANDED EDIT BODY -->

                        ${!isExpanded ? '' : `

                        <div class="p-3.5 sm:p-4 space-y-3.5 bg-white text-xs">

                            <!-- ACTIONS BAR: KOPYALA / SİL -->

                            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">

                                <span class="font-bold text-slate-700 text-xs flex items-center gap-1.5">

                                    <i class="fa-solid fa-pen-to-square text-sky-600"></i>

                                    <span>Ölçüm Değerlerini Düzenle</span>

                                </span>

                                <div class="flex items-center gap-2">

                                    <button onclick="duplicateGroundingPointRow(${pIdx})" class="py-1 px-2.5 text-xs px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 font-bold text-xs rounded-xl border border-sky-200 flex items-center gap-1.5 transition">

                                        <i class="fa-solid fa-copy"></i>

                                        <span>Kopyala</span>

                                    </button>

                                    <button onclick="removeGroundingPointRow(${pIdx})" class="py-1 px-2.5 text-xs px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition">

                                        <i class="fa-solid fa-trash-can"></i>

                                        <span>Sil</span>

                                    </button>

                                </div>

                            </div>



                            <!-- LİNYE & PANO ADI -->

                            <div class="relative space-y-1">

                                <label class="block text-xs font-bold text-slate-700 mb-0.5 flex items-center gap-1.5">

                                    <i class="fa-solid fa-tag text-sky-600"></i>

                                    <span>Ölçüm Noktası / Pano Adı</span>

                                </label>

                                <input type="text" id="pt_name_${pIdx}" autocomplete="off" value="${escapeHtml(p.point || '')}" placeholder="Örn: Ana Dağıtım Panosu (ADP)"

                                    onfocus="handleLinyeInputFocus(${pIdx}, this)"

                                    oninput="handleLinyeInputType(${pIdx}, this)"

                                    onblur="handleLinyeInputBlur(${pIdx})"

                                    class="w-full h-8 py-1 px-2 text-xs border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs">



                                <!-- 100% OPAK ÖNERİLER DROPDOWN -->

                                <div id="linyeDropdown_${pIdx}"

                                    onpointerdown="window.__linyeDropdownInteracting = true;"

                                    ontouchstart="window.__linyeDropdownInteracting = true;"

                                    onpointerup="setTimeout(() => { window.__linyeDropdownInteracting = false; }, 400);"

                                    ontouchend="setTimeout(() => { window.__linyeDropdownInteracting = false; }, 400);"

                                    class="hidden absolute left-0 right-0 top-full mt-1 bg-white border-2 border-sky-600 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto overscroll-contain touch-pan-y divide-y divide-slate-100 font-medium text-xs"></div>



                                <!-- HIZLI SEÇİM ÇİPLERİ -->

                                <div class="flex items-center gap-1.5 mt-2 overflow-x-auto py-1 no-scrollbar">

                                    ${LinyeMemoryManager.getQuickChips().map(preset => `

                                        <button type="button" onclick="selectLinyeSuggestion(${pIdx}, '${escapeForJs(preset)}')"

                                            class="py-1 px-2.5 text-xs px-3 py-1.5 bg-slate-100 hover:bg-sky-100 active:scale-95 text-slate-700 hover:text-sky-800 font-bold text-xs rounded-xl border border-slate-200 shrink-0 transition shadow-2xs">

                                            + ${escapeHtml(preset)}

                                        </button>

                                    `).join('')}

                                </div>

                            </div>



                            <!-- HIZLI SİGORTA VE EĞRİ SEÇİCİ (TEK DOKUNUŞ) -->

                            <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">

                                <label class="block text-xs font-bold text-slate-700 flex items-center justify-between">

                                    <span class="flex items-center gap-1">

                                        <i class="fa-solid fa-bolt text-amber-500"></i>

                                        <span>Hızlı Sigorta Seçimi (MCB)</span>

                                    </span>

                                    <span class="text-xs font-mono font-bold text-sky-700">Seçili: ${(p.curve || 'C')}${p.inAmp || '16'}A (Ia: ${p.iaAmp || '160'}A)</span>

                                </label>

                                <div class="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">

                                    ${[

                                        {c: 'B', a: '10'},

                                        {c: 'B', a: '16'},

                                        {c: 'C', a: '10'},

                                        {c: 'C', a: '16'},

                                        {c: 'C', a: '20'},

                                        {c: 'C', a: '25'},

                                        {c: 'C', a: '32'},

                                        {c: 'C', a: '40'},

                                        {c: 'C', a: '63'}

                                    ].map(item => {

                                        const isSel = (p.curve === item.c && String(p.inAmp) === item.a);

                                        return `

                                            <button type="button" onclick="setGroundingPointBreakerPreset(${pIdx}, '${item.c}', '${item.a}')"

                                                class="py-1 px-2.5 text-xs px-3 py-1.5 rounded-xl font-mono font-bold text-xs shrink-0 border transition active:scale-95 ${isSel ? 'bg-sky-600 text-white border-sky-700 shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'}">

                                                ${item.c}${item.a}

                                            </button>

                                        `;

                                    }).join('')}

                                </div>

                            </div>



                            <!-- PARAMETRELER & HESAPLAMALAR GRID -->

                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">

                                <div>

                                    <label class="block text-xs font-bold text-slate-700 mb-1">In (A)</label>

                                    <input type="text" id="pt_in_${pIdx}" inputmode="decimal" enterkeyhint="next" value="${p.inAmp || ''}" placeholder="16"

                                        oninput="updateGroundingPointField(${pIdx}, 'inAmp', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 tabular-nums">

                                </div>

                                <div>

                                    <label class="block text-xs font-bold text-slate-700 mb-1">Açma Eğrisi</label>

                                    <select id="pt_curve_${pIdx}" onchange="updateGroundingPointField(${pIdx}, 'curve', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 bg-white">

                                        ${['B', 'C', 'D', 'K', 'Z'].map(c => `<option value="${c}" ${(p.curve || 'C') === c ? 'selected' : ''}>${c} Eğrisi</option>`).join('')}

                                    </select>

                                </div>

                                <div>

                                    <label class="block text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">

                                        <span>Ia (A)</span>

                                        <span class="text-xs font-mono text-slate-500 font-bold bg-slate-200/80 px-1.5 py-0.2 rounded">ƒx Oto</span>

                                    </label>

                                    <input type="text" id="pt_ia_${pIdx}" inputmode="decimal" enterkeyhint="next" value="${p.iaAmp || ''}" placeholder=""

                                        oninput="updateGroundingPointField(${pIdx}, 'iaAmp', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border border-slate-200 bg-slate-100/90 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 tabular-nums">

                                </div>

                                <div>

                                    <label class="block text-xs font-bold text-sky-800 mb-1 flex items-center justify-between">

                                        <span>Ik1 (A)</span>

                                        <span class="text-xs font-mono font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">ƒx 230/Zx</span>

                                    </label>

                                    <input type="text" id="pt_ik1_${pIdx}" inputmode="decimal" enterkeyhint="next" value="${p.ik1Amp || ''}" placeholder="Oto"

                                        oninput="updateGroundingPointField(${pIdx}, 'ik1Amp', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border border-sky-300 bg-sky-50/70 rounded-xl px-3 py-2 text-xs font-mono font-bold text-sky-950 tabular-nums">

                                </div>



                                <!-- Zx / Rx ÖLÇÜLEN (BELİRGİN ODAK) -->

                                <div>

                                    <label class="block text-xs font-bold text-sky-900 mb-1 flex items-center justify-between">

                                        <span>Zx / Rx (Ω)</span>

                                        <span class="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">Ölçülen</span>

                                    </label>

                                    <input type="text" id="pt_zx_${pIdx}" inputmode="decimal" enterkeyhint="next" value="${p.zxRx || ''}" placeholder="Örn: 0.28"

                                        oninput="updateGroundingPointField(${pIdx}, 'zxRx', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border-2 border-sky-500 rounded-xl px-3 py-2 text-sm font-mono font-black text-sky-950 bg-white shadow-2xs tabular-nums">

                                </div>



                                <!-- Zs SINIR DEĞERİ -->

                                <div>

                                    <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">

                                        <span>Zs Sınır (Ω)</span>

                                        <span class="text-xs font-mono font-bold ${isTN ? 'text-amber-800 bg-amber-50 border border-amber-200' : 'text-sky-800 bg-sky-50 border border-sky-200'} px-1.5 py-0.2 rounded">ƒx ${zsFormulaLabel}</span>

                                    </label>

                                    <input type="text" id="pt_zs_${pIdx}" inputmode="decimal" enterkeyhint="next" value="${p.zsRa || ''}" placeholder=""

                                        oninput="updateGroundingPointField(${pIdx}, 'zsRa', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border border-slate-200 bg-slate-100/90 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 tabular-nums">

                                </div>



                                <div>

                                    <label class="block text-xs font-bold text-slate-700 mb-1">RCD In / IΔn</label>

                                    <input type="text" id="pt_rcdSpec_${pIdx}" value="${p.rcdSpec || ''}" placeholder="Örn: 30mA"

                                        oninput="updateGroundingPointField(${pIdx}, 'rcdSpec', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white">

                                    <div class="flex items-center gap-1.5 mt-1.5">

                                        <button type="button" onclick="updateGroundingPointField(${pIdx}, 'rcdSpec', '30mA');"

                                            class="py-1 px-2 text-[11px] px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-bold border border-sky-300 active:scale-95 transition">30mA</button>

                                        <button type="button" onclick="updateGroundingPointField(${pIdx}, 'rcdSpec', '300mA');"

                                            class="py-1 px-2 text-[11px] px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-300 active:scale-95 transition">300mA</button>

                                    </div>

                                </div>



                                <div>

                                    <label class="block text-xs font-bold text-slate-700 mb-1">IΔ (mA)</label>

                                    <input type="text" id="pt_rcdId_${pIdx}" inputmode="decimal" enterkeyhint="next" value="${p.rcdId || ''}" placeholder="Örn: 22"

                                        oninput="updateGroundingPointField(${pIdx}, 'rcdId', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white tabular-nums">

                                </div>

                                <div>

                                    <label class="block text-xs font-bold text-slate-700 mb-1">TΔ (ms)</label>

                                    <input type="text" id="pt_rcdTd_${pIdx}" inputmode="decimal" enterkeyhint="next" value="${p.rcdTd || ''}" placeholder="Örn: 18"

                                        oninput="updateGroundingPointField(${pIdx}, 'rcdTd', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white tabular-nums">

                                </div>



                                <div class="col-span-2 sm:col-span-3">

                                    <label class="block text-xs font-bold text-slate-700 mb-1">Sonuç (Uygunluk Notu)</label>

                                    <select id="pt_res_${pIdx}" onchange="updateGroundingPointField(${pIdx}, 'result', this.value);"

                                        class="w-full h-8 py-1 px-2 text-xs border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs">

                                        <option value="">Seçiniz...</option>

                                        ${resultOptions.map(opt => `<option value="${opt}" ${(p.result || '') === opt ? 'selected' : ''}>${opt} ${opt === 'Not-1' ? '(Uygun)' : opt === 'Not-4' ? '(RCD Faal, Uygun)' : '(Kusurlu)'}</option>`).join('')}

                                    </select>

                                </div>

                            </div>

                        </div>

                        `}

                    </div>

                    `;

                }).join('')}

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

                        RCD Selektivite satırı eklenmedi (Varsayılan: Uygulaması Yok).

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

                                <label class="block text-xs font-bold text-slate-700 mb-1">N Önceki Pano Adı</label>

                                <input type="text" value="${s.priorPanel || ''}" placeholder=""

                                    oninput="AppState.currentFormData.grounding.selectivity[${sIdx}].priorPanel=this.value; triggerAutoSave();"

                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700 mb-1">Önceki RCD Tipi</label>

                                <input type="text" value="${s.priorRcdType || ''}" placeholder=""

                                    oninput="AppState.currentFormData.grounding.selectivity[${sIdx}].priorRcdType=this.value; triggerAutoSave();"

                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700 mb-1">Önceki In (A) / IΔn (mA)</label>

                                <input type="text" value="${s.priorRcdIn || ''}" placeholder=""

                                    oninput="AppState.currentFormData.grounding.selectivity[${sIdx}].priorRcdIn=this.value; triggerAutoSave();"

                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700 mb-1">Son Tüketim Pano Adı</label>

                                <input type="text" value="${s.destPanel || ''}" placeholder=""

                                    oninput="AppState.currentFormData.grounding.selectivity[${sIdx}].destPanel=this.value; triggerAutoSave();"

                                    class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700 mb-1">Sonuç (Uygunluk Notu)</label>

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

        inAmp: '16',

        curve: 'C',

        iaAmp: '160',

        ik1Amp: '',

        zxRx: '',

        zsRa: (gd.details && (gd.details.networkType || '').startsWith('TN')) ? '1.44' : '0.31',

        rcdSpec: '',

        rcdId: '',

        rcdTd: '',

        result: ''

    });

    const newIdx = gd.points.length - 1;

    if (!AppState.expandedGroundingPoints) AppState.expandedGroundingPoints = {};

    AppState.expandedGroundingPoints[newIdx] = true;

    triggerAutoSave();

    paintInspectionEditorUI();

    showToast(`Yeni ölçüm noktası #${newIdx + 1} eklendi`);

}



function duplicateGroundingPointRow(idx) {

    const gd = AppState.currentFormData.grounding;

    if (!gd.points || !gd.points[idx]) return;

    const copy = JSON.parse(JSON.stringify(gd.points[idx]));

    gd.points.push(copy);

    const newIdx = gd.points.length - 1;

    if (!AppState.expandedGroundingPoints) AppState.expandedGroundingPoints = {};

    AppState.expandedGroundingPoints[newIdx] = true;

    triggerAutoSave();

    paintInspectionEditorUI();

    showToast(`Ölçüm Noktası #${idx + 1} kopyalandı ve açıldı`);

}



function removeGroundingPointRow(idx) {

    const gd = AppState.currentFormData.grounding;

    if (!gd.points || !gd.points[idx]) return;

    window.__lastDeletedGroundingPoint = {

        index: idx,

        point: JSON.parse(JSON.stringify(gd.points[idx]))

    };

    gd.points.splice(idx, 1);

    triggerAutoSave();

    paintInspectionEditorUI();

    showToast('Ölçüm noktası silindi', 'warning');

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



