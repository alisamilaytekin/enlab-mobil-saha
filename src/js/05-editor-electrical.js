// ============================================================================
// HIZLI RAPOR - 05-EDITOR-ELECTRICAL.JS
// Açıklama: Elektrik İç Tesisat (TKM-FR.318) Muayene Editörü ve Tabloları
// Satır Aralığı: 5947 - 6872 (926 satır)
// ============================================================================

function ensureThermalCameraDevice() {

    const fd = AppState.currentFormData;
    const tpl = AppState.electricalTemplate;
    if (!fd || !tpl || !tpl.areas) return;

    if (!fd.tableRows || typeof fd.tableRows !== 'object') {
        fd.tableRows = {};
    }

    const curRows = fd.tableRows.topic_1_0;
    const isBlank = !Array.isArray(curRows) || curRows.length === 0 || curRows.every(r =>
        !r || typeof r !== 'object' || Object.values(r).every(v => !String(v || '').trim())
    );

    if (!isBlank && !fd._thermalInitialized) {
        fd._thermalInitialized = true;
    }

    if (!fd._thermalInitialized && isBlank && window.MeasuringDevicesManager) {
        const mgr = window.MeasuringDevicesManager;
        if (mgr.isAutoApplyEnabled() && mgr.getAssignedThermalCamera()) {
            mgr.applyDefaultsToFormData(fd, '2201', false);
        }
    }

}

function renderElectrical2201Editor() {

    const tpl = AppState.electricalTemplate;

    if (!tpl || !tpl.areas) return '<div class="p-4 bg-white rounded-xl text-xs">Şablon yüklenemedi.</div>';



    ensureCompanyInfo();

    ensureMeasuringDevices();

    ensureThermalCameraDevice();



    const fd = AppState.currentFormData;

    const areas = tpl.areas.filter(a => a.topics && a.topics.length > 0);



    if (AppState.activeAreaIndex === undefined) AppState.activeAreaIndex = 0;

    const activeIdx = AppState.showAllAreas ? -1 : AppState.activeAreaIndex;



    const tabs = [
        { label: '1-2. Firma & Ekipman', id: 0 },
        { label: '3-4. Cihazlar & Aletler', id: 1 },
        { label: '5. Gözle Kontrol', id: 2 },
        { label: '6. Fonksiyon Testleri', id: 3 },
        { label: `8. Fotoğraflar (${(fd.photos || []).length})`, id: 4 },
        { label: '7-11. Kusur, Not & Onay', id: 5 },
        { label: 'Tüm Bölümler (1-11)', id: -1 }
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

            ${area1Html}
            ${section4Html}

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

                ${area.index === 2 ? `<button onclick="markAllVisualChecksSuitable()" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-[11px] shrink-0">Boş Kalanları Uygun Yap</button>` : ''}

            </div>

            ${area.index === 2 ? `

                <div class="p-2.5 bg-slate-100 border-b border-slate-200">

                    <div class="relative">

                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>

                        <input type="text" id="visualCheckSearchInput" value="${escapeHtml(AppState.visualSearchQuery || '')}"

                            oninput="AppState.visualSearchQuery=this.value; filterVisualCheckQuestionsLive(this.value);"

                            placeholder="🔍 Maddelerde ara (Örn: klemens, kablo, etiket, yangın, priz)..."

                            class="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold focus:border-sky-500 focus:outline-none">

                    </div>

                </div>

            ` : ''}

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

                oninput="handleAnswerInput('${qKey}', this.value)"

                placeholder=""

                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium focus:border-sky-500 focus:outline-none">

        </div>

    `;

}



// Short, compact abbreviations for Section 6.4 (Aşırı Akım Koruma Elemanı İle İletken Uyumu ve RCD)

function getShortTopicQuestionLabel(areaIdx, topicIdx, questionText) {

    const q = questionText || '';

    if (areaIdx === 3 && topicIdx === 3) {

        if (q.includes('Pano/Tablo')) return 'Pano / Linye Tanımı';

        if (q.includes('Açma eğrisi')) return 'Açma Eğrisi (B / C / D)';

        if (q.includes('Kutup sayısı')) return 'Kutup Sayısı';

        if (q.includes('Nominal akımı In')) return 'Nominal Akım In (A)';

        if (q.includes('Icu')) return 'Kesme Kapasitesi Icu (kA)';

        if (q.includes('Faz kesiti')) return 'Faz Kesiti (mm²)';

        if (q.includes('N/PEN')) return 'N / PEN Kesiti (mm²)';

        if (q.includes('PE Koruma')) return 'PE Koruma Kesiti (mm²)';

        if (q.includes('Ib')) return 'İşletme Akımı Ib (A)';

        if (q.includes('Iz')) return 'İletken Akımı Iz (A)';

        if (q.includes('IΔ')) return 'RCD Açma Akımı IΔ (mA)';

        if (q.includes('TΔ')) return 'RCD Açma Süresi TΔ (ms)';

        if (q.includes('Değerlendirme')) return 'Sonuç / Değerlendirme';

    }

    return q;

}



function renderDynamicTableTopic(area, topic, subNum, tKey) {

    const fd = AppState.currentFormData;

    if (!fd.tableRows[tKey] || !fd.tableRows[tKey].length) {

        fd.tableRows[tKey] = [createDefaultTopicRow(area, topic, 1)];

    }

    const rows = fd.tableRows[tKey];

    const isThermalSection = (area.index === 1 && topic.index === 0);

    const mgr = window.MeasuringDevicesManager || null;

    const isLockedThermal = Boolean(isThermalSection && mgr && typeof mgr.isCloudManaged === 'function' && mgr.isCloudManaged());

    const isSection64 = area.index === 3 && topic.index === 3;

    const isSection65 = area.index === 3 && topic.index === 4;



    // Geniş ve ferah grid düzeni:

    // 6.4: Mobilde 2 sütun, tablette 4 sütun

    // 6.5: Mobilde tek sütun (tam genişlik), tablette 2 sütun

    let gridClass = 'grid-cols-1 sm:grid-cols-2 gap-3';

    if (isSection64) {

        gridClass = 'grid-cols-2 sm:grid-cols-4 gap-2.5';

    } else if (!isSection65) {

        gridClass = 'grid-cols-1 sm:grid-cols-2 gap-2.5';

    }



    const cardsHtml = rows.map((rowObj, rIdx) => {

        const fieldsHtml = topic.questions.map((q, qIdx) => {

            const cellVal = rowObj[q.guid] ?? '';

            const labelText = getShortTopicQuestionLabel(area.index, topic.index, q.question);

            if (q.type === 'YesNo') {

                return `

                    <div class="${isSection65 ? 'col-span-full sm:col-span-1' : ''}">

                        <label class="block text-[11px] font-bold text-slate-700 mb-1 leading-snug break-words">${labelText}</label>

                        <select onchange="handleTopicTableCell('${tKey}', ${rIdx}, '${q.guid}', this.value)"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white font-bold text-slate-900 shadow-2xs">

                            <option value="" ${cellVal === '' ? 'selected' : ''}>Seçiniz...</option>

                            <option value="Uygun" ${cellVal === 'Uygun' || cellVal === '✓' ? 'selected' : ''}>✓ Uygun</option>

                            <option value="Uygun Değil" ${cellVal === 'Uygun Değil' || cellVal === 'X' ? 'selected' : ''}>X Uygun Değil</option>

                            <option value="Uygulaması Yok" ${cellVal === 'Uygulaması Yok' || cellVal === 'N' ? 'selected' : ''}>N Uyg. Yok</option>

                            <option value="Görülemedi" ${cellVal === 'Görülemedi' || cellVal === 'G' ? 'selected' : ''}>G Görülemedi</option>

                        </select>

                    </div>

                `;

            }

            // Section 6.4 Pano Adı or Section 6.5 long questions take full width

            const spanClass = (qIdx === 0 || isSection65) ? 'col-span-full' : '';

            return `

                <div class="${spanClass}">

                    <label class="block text-[11px] font-bold text-slate-700 mb-1 leading-snug break-words">${labelText}</label>

                    <input type="text" value="${String(cellVal).replace(/"/g, '&quot;')}" ${isLockedThermal ? 'readonly' : ''}

                        oninput="handleTopicTableCell('${tKey}', ${rIdx}, '${q.guid}', this.value)"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs ${isLockedThermal ? 'bg-slate-100 text-slate-700' : 'bg-white'} focus:border-sky-500 focus:outline-none shadow-2xs font-medium">

                </div>

            `;

        }).join('');



        return `

            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-200 pb-2 gap-2">

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



    let thermalToolbarHtml = '';
    if (isThermalSection) {
        const firstGuid = topic.questions?.[0]?.guid;
        const serialGuid = topic.questions?.[1]?.guid;
        const firstVal = String((rows[0] && firstGuid && rows[0][firstGuid]) || '').trim();
        const serialVal = String((rows[0] && serialGuid && rows[0][serialGuid]) || '').trim();
        const isNotApp = firstVal.includes('Uygulaması Yok');
        const activeLabelHtml = isNotApp
            ? `<span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">Uygulaması Yok</span>`
            : firstVal
                ? `<span class="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300 font-bold text-[10px] truncate max-w-[200px]"><i class="fa-solid fa-temperature-half mr-1"></i>${escapeHtml(firstVal)}${serialVal ? ` (${escapeHtml(serialVal)})` : ''}</span>`
                : `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px]">Termal kamera seçilmedi</span>`;

        thermalToolbarHtml = `
            <div class="px-3.5 py-2 bg-orange-50/80 border-b border-orange-200 flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-1.5 min-w-0">
                    ${activeLabelHtml}
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                    ${mgr ? `
                        <button type="button" onclick="openReportThermalSwapModal()"
                            class="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition">
                            <i class="fa-solid fa-right-left"></i>
                            <span>Termal Kamera Değiştir</span>
                        </button>
                        <button type="button" onclick="applyAssignedThermalCameraToReport()"
                            class="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition"
                            title="Ayarlarda üzerinizde seçili termal kamerayı getir">
                            <i class="fa-solid fa-arrows-rotate"></i>
                            <span>Üzerimdekini Getir</span>
                        </button>
                    ` : ''}
                    <button type="button" onclick="setThermalCameraNotApplicable('${tKey}')"
                        class="px-2 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-300 font-bold rounded-lg text-[11px] flex items-center gap-1 transition">
                        <i class="fa-solid fa-ban text-slate-500"></i>
                        <span>Uyg. Yok</span>
                    </button>
                </div>
            </div>
        `;
    }

    return `

        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">

            <div class="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2">

                <div class="font-bold text-xs text-slate-900 leading-snug flex-1">${subNum}. ${topic.name}</div>

                ${isLockedThermal ? '' : `

                    <button onclick="addTopicTableRow('${tKey}', ${area.index}, ${topic.index})" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs shrink-0 shadow-2xs">

                        + Satır Ekle

                    </button>

                `}

            </div>

            ${thermalToolbarHtml}

            <div class="p-3 space-y-3">

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

    if (tKey === 'topic_1_0') {
        AppState.currentFormData._thermalInitialized = true;
    }

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
    AppState.currentFormData._thermalInitialized = true;
    AppState.currentFormData._thermalSourceId = '';

    triggerAutoSave();

    paintInspectionEditorUI();

}



function autofillThermalCamera(tKey) {

    if (window.MeasuringDevicesManager) {
        const thermalDev = window.MeasuringDevicesManager.getAssignedThermalCamera();
        if (thermalDev) {
            window.MeasuringDevicesManager.swapReportThermalCamera(thermalDev.id);
            return;
        }
        if (typeof window.openReportThermalSwapModal === 'function') {
            window.openReportThermalSwapModal();
            return;
        }
    }

    const tpl = AppState.electricalTemplate;

    const area = tpl?.areas?.[1];

    const topic = area?.topics?.[0];

    if (!topic) return;

    AppState.currentFormData.tableRows[tKey] = [createDefaultTopicRow(area, topic, 1)];
    AppState.currentFormData._thermalInitialized = true;

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



