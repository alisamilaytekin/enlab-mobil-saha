// ============================================================================
// HIZLI RAPOR - 06-EDITOR-SPECIALIZED.JS
// Açıklama: Evrensel Form & Şema Tabanlı 5 Adımlı Saha Editörü, Fotoğraf ve Galeri
// ============================================================================

function renderSpecializedTemplateEditor() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;

    const schema = (window.UniversalSchemaRegistry && typeof window.UniversalSchemaRegistry.ensureUniversalFormData === 'function')
        ? window.UniversalSchemaRegistry.ensureUniversalFormData(fd, insp.template_id, insp.equipment_name)
        : window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);

    const cols = schema.tableColumns || [];

    ensureCompanyInfo();
    ensureMeasuringDevices();

    if (AppState.activeSpecTab === undefined) AppState.activeSpecTab = 0;
    const activeTab = AppState.activeSpecTab;

    const tableRows = Array.isArray(fd.universalTableRows) ? fd.universalTableRows : [];
    const checksList = schema.visualChecks || [];
    const defectCount = checksList.reduce((acc, chk, idx) => {
        const val = (fd.universalChecksById && chk.id && fd.universalChecksById[chk.id]) || fd.specializedChecks?.[`chk_${idx}`] || '';
        return acc + ((val === 'Uygun Değil' || val === 'Kısmen Uygun') ? 1 : 0);
    }, 0);

    // 5 Adımlı Saha Sihirbazı (DESIGN.md 01-05 Stepper + Tümü)
    const steps = [
        { num: '01', label: 'Genel', id: 0 },
        { num: '02', label: 'Gözle', id: 1, badge: defectCount > 0 ? defectCount : '' },
        { num: '03', label: 'Ölçüm', id: 2, count: tableRows.length },
        { num: '04', label: 'Foto', id: 3, count: (fd.photos || []).length },
        { num: '05', label: 'Sonuç', id: 4 },
        { num: 'ALL', label: 'Tümü', id: -1 }
    ];

    const stepperHtml = `
        <div class="card-craft-white p-2">
            <!-- 01-05 STEPPER TABS -->
            <div class="grid grid-cols-6 gap-1">
                ${steps.map(s => {
                    const isActive = activeTab === s.id;
                    const hasDefectBadge = Boolean(s.badge);
                    return `
                        <button type="button" onclick="AppState.activeSpecTab=${s.id}; paintInspectionEditorUI();"
                            class="min-h-[38px] py-1 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition relative ${
                                isActive
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
                            }">
                            <span class="text-[9px] font-mono ${isActive ? 'text-amber-400' : 'text-slate-400'}">${s.num}</span>
                            <span class="truncate max-w-full leading-tight">${s.label}${s.count ? ` (${s.count})` : ''}</span>
                            ${hasDefectBadge ? `<span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">${s.badge}</span>` : ''}
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // ------------------------------------------------------------------------
    // ADIM 1: FİRMA, CİHAZ VE EKİPMAN TEKNİK BİLGİLERİ
    // ------------------------------------------------------------------------
    const rawFields = schema.generalFields || schema.fields || [];
    const fieldsHtml = rawFields.map(f => {
        const fId = f.key || f.id;
        if (fd.specializedFields[fId] === undefined) fd.specializedFields[fId] = f.default !== undefined ? f.default : '';
        const val = String(fd.specializedFields[fId] ?? '');
        const negList = Array.isArray(f.negativeValues) ? f.negativeValues : ['Yok', 'Uygun Değil', 'Uygunsuz', 'Arızalı'];

        // Seçenek sayısı <= 6 ise 1-Dokunuşlu Segmented Pill Butonlar (DESIGN.md standardı)
        const cleanOpts = Array.isArray(f.options) ? f.options.filter(o => String(o).trim() !== '') : [];
        if (cleanOpts.length > 0 && cleanOpts.length <= 6) {
            const pills = cleanOpts.map(opt => {
                const isSel = val === opt;
                const isNeg = negList.includes(opt);
                const activeCls = isNeg
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-emerald-600 text-white border-emerald-600 shadow-2xs';
                const idleCls = 'bg-white text-slate-700 border-slate-200 hover:border-slate-300';
                return `
                    <button type="button"
                        onclick="setUniversalFieldValue('${escapeForJs(fId)}', '${escapeForJs(opt)}', true)"
                        class="min-h-[36px] px-2.5 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 ${isSel ? activeCls : idleCls}">
                        ${escapeHtml(opt)}
                    </button>
                `;
            }).join('');

            return `
                <div class="sm:col-span-2 space-y-1">
                    <label class="block text-xs font-bold text-slate-700">${escapeHtml(f.label)}</label>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">${pills}</div>
                </div>
            `;
        }

        // Seçenek sayısı > 6 ise Select Dropdown
        if (cleanOpts.length > 6) {
            const opts = cleanOpts.map(o => `<option value="${escapeHtml(o)}" ${val === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
            return `
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">${escapeHtml(f.label)}</label>
                    <select onchange="setUniversalFieldValue('${escapeForJs(fId)}', this.value, false)"
                        class="w-full h-10 border border-slate-300 rounded-xl px-2.5 text-xs bg-white font-semibold">
                        <option value="">Seçiniz...</option>
                        ${opts}
                    </select>
                </div>
            `;
        }

        // Hızlı Preset Çipleri + Birimli Metin Girişi
        const presetsHtml = (Array.isArray(f.presets) && f.presets.length > 0)
            ? `<div class="flex flex-wrap gap-1 mb-1">
                ${f.presets.map(p => {
                    const isSel = val === p;
                    return `<button type="button" onclick="setUniversalFieldValue('${escapeForJs(fId)}', '${escapeForJs(p)}', true)"
                        class="px-2 py-0.5 rounded-md border text-[10px] font-bold transition ${
                            isSel ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }">${escapeHtml(p)}</button>`;
                }).join('')}
               </div>`
            : '';

        return `
            <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">
                    ${escapeHtml(f.label)}
                    ${f.isTenantCustom ? `<span class="ml-1 text-[10px] text-sky-600 font-semibold">(Firma Özel)</span>` : ''}
                </label>
                ${presetsHtml}
                <div class="relative flex items-center">
                    <input type="text" id="ufld_${escapeHtml(fId)}" value="${escapeHtml(val)}"
                        oninput="setUniversalFieldValue('${escapeForJs(fId)}', this.value, false)"
                        class="w-full h-10 border border-slate-300 rounded-xl px-3 ${f.unit ? 'pr-12' : ''} text-xs font-semibold text-slate-900 bg-white focus:border-sky-500 focus:outline-none">
                    ${f.unit ? `<span class="absolute right-2.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold text-[10px] pointer-events-none">${escapeHtml(f.unit)}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');

    const secCfg = schema.sectionConfig || {};
    const showStdDevices = secCfg.showDevices !== undefined ? secCfg.showDevices : (schema.layoutHints?.showDevices !== false);
    const showStdTech = secCfg.showTechFields !== false && rawFields.length > 0;
    const showStdChecks = secCfg.showChecklist !== false && checksList.length > 0;
    const showStdTable = secCfg.showMainTable !== false && (cols.length > 0 || (schema.additionalTables || []).length > 0);

    const showStep1 = (activeTab === 0 || activeTab === -1);
    const step1Html = !showStep1 ? '' : `
        ${renderSharedCompanyInfoSection()}
        ${renderCustomBlocksForPosition('after_company', schema, fd)}
        ${showStdDevices ? renderSharedMeasuringDevicesSection('Ölçüm Aletleri Bilgileri') : ''}
        ${renderCustomBlocksForPosition('after_devices', schema, fd)}
        ${showStdTech ? `
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between">
                    <span>2. Ekipman Teknik Özellikleri (${rawFields.length} Alan)</span>
                    <span class="text-[10px] text-slate-300 font-normal">${escapeHtml(schema.category || '')}</span>
                </div>
                <div class="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${fieldsHtml}
                </div>
            </div>
        ` : ''}
        ${renderCustomBlocksForPosition('after_tech', schema, fd)}
    `;

    // ------------------------------------------------------------------------
    // ADIM 2: GÖZLE KONTROL VE FONKSİYON KRİTERLERİ (KALICI SEMANTIC ID + GRUPLU)
    // ------------------------------------------------------------------------
    let lastCheckGroup = '';
    const checksHtml = checksList.map((chkObj, idx) => {
        const chkText = typeof chkObj === 'string' ? chkObj : chkObj.text;
        const semanticId = (typeof chkObj === 'object' && chkObj.id) ? chkObj.id : `chk_${idx}`;
        const legacyKey = `chk_${idx}`;
        const defaultDefect = (typeof chkObj === 'object' && chkObj.defect) ? chkObj.defect : '';
        const isCritical = (typeof chkObj === 'object') ? chkObj.isCritical !== false : true;
        const groupTitle = (typeof chkObj === 'object' && chkObj.group) ? String(chkObj.group).trim() : '';

        let groupHeaderHtml = '';
        if (groupTitle && groupTitle !== lastCheckGroup) {
            lastCheckGroup = groupTitle;
            groupHeaderHtml = `
                <div class="px-3 py-1.5 mt-2 first:mt-0 rounded-lg bg-slate-800 text-amber-300 font-extrabold text-[11px] tracking-wide flex items-center gap-1.5">
                    <i class="fa-solid fa-layer-group text-[10px]"></i>
                    <span>${escapeHtml(groupTitle)}</span>
                </div>
            `;
        }

        const val = (fd.universalChecksById && fd.universalChecksById[semanticId]) || fd.specializedChecks?.[legacyKey] || '';
        const isDefect = (val === 'Uygun Değil' || val === 'Kısmen Uygun');
        const selectedDefect = (fd.itemDefectSelections && (fd.itemDefectSelections[legacyKey]?.sentence || fd.itemDefectSelections[semanticId]?.sentence)) || '';

        const quickBtns = [
            { val: 'Uygun', short: '✓', title: 'Uygun', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-2xs', idleCls: 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50' },
            { val: 'Uygun Değil', short: '✕', title: 'Uygun Değil', activeCls: 'bg-rose-600 text-white border-rose-600 shadow-2xs', idleCls: 'bg-white text-rose-700 border-slate-200 hover:bg-rose-50' },
            { val: 'Uygulaması Yok', short: 'N', title: 'Uygulaması Yok', activeCls: 'bg-slate-700 text-white border-slate-700 shadow-2xs', idleCls: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' },
            { val: 'Görülemedi', short: 'G', title: 'Görülemedi', activeCls: 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs', idleCls: 'bg-white text-amber-700 border-slate-200 hover:bg-amber-50' }
        ].map(b => {
            const isSel = (val === b.val);
            return `
                <button type="button" title="${b.title}"
                    onclick="handleUniversalCheckChange('${escapeForJs(semanticId)}', '${escapeForJs(legacyKey)}', '${b.val}', '${escapeForJs(chkText)}', '${escapeForJs(defaultDefect)}')"
                    class="w-9 h-9 rounded-xl border text-xs font-black flex items-center justify-center transition-all active:scale-95 ${isSel ? b.activeCls : b.idleCls}">
                    ${b.short}
                </button>
            `;
        }).join('');

        return `
            ${groupHeaderHtml}
            <div class="rounded-xl border ${isDefect ? 'border-rose-300 bg-rose-50/40' : val === 'Uygun' ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/60'} overflow-hidden transition-all">
                <div class="p-2.5 flex items-center justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <span class="text-xs font-medium text-slate-800 leading-snug block">
                            <strong class="text-slate-900 mr-1">${escapeHtml(chkObj.code || String(idx + 1))}.</strong>${escapeHtml(chkText)}
                            ${isCritical ? `<span class="ml-1 px-1 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-bold">Kritik</span>` : ''}
                        </span>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        ${quickBtns}
                    </div>
                </div>
                ${isDefect ? `
                    <div class="mx-2.5 mb-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                        <div class="flex items-start gap-1.5 min-w-0">
                            <i class="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 shrink-0 text-xs"></i>
                            <div class="min-w-0">
                                <span class="font-medium text-slate-800 text-[11px] leading-snug block">${escapeHtml(selectedDefect || defaultDefect || 'Uygunsuzluk cümlesi seçilmedi')}</span>
                            </div>
                        </div>
                        <button type="button" onclick="openItemDefectPickerModal('${escapeForJs(legacyKey)}', '${escapeForJs(chkText)}', 'specialized')"
                            class="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg font-bold text-[10px] shrink-0 flex items-center gap-1 shadow-2xs transition-all">
                            <i class="fa-solid fa-list-check"></i>
                            <span>${selectedDefect ? 'Değiştir' : 'Cümle Seç'}</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    const showStep2 = (activeTab === 1 || activeTab === -1);
    const step2Html = !showStep2 ? '' : `
        ${showStdChecks ? `
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between gap-2">
                    <span>3. Gözle ve Fonksiyon Kontrol Kriterleri (${checksList.length})</span>
                    <button type="button" onclick="markAllUniversalChecksSuitable()" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs active:scale-95">
                        <i class="fa-solid fa-check-double"></i>
                        <span>Boş Kalanları Uygun Yap</span>
                    </button>
                </div>
                <div class="p-3 space-y-2">
                    ${checksHtml}
                </div>
            </div>
        ` : ''}
        ${renderCustomBlocksForPosition('after_checks', schema, fd)}
    `;

    // ------------------------------------------------------------------------
    // ADIM 3: DİNAMİK ÖLÇÜM VE TEST TABLOLARI (ÇOKLU TABLO + HAZIR ŞABLON + OTOMASYON)
    // ------------------------------------------------------------------------
    const rowPresetsHtml = (Array.isArray(schema.rowPresets) && schema.rowPresets.length > 0) ? `
        <div class="px-3 pt-2.5 pb-1 bg-slate-50 border-b border-slate-200 space-y-1">
            <div class="flex items-center justify-between text-[10px] font-bold text-slate-600">
                <span class="flex items-center gap-1"><i class="fa-solid fa-wand-magic-sparkles text-amber-500"></i><span>Tek Dokunuşla Hazır Mühendislik Satırı Ekle:</span></span>
                ${schema.autoCalcType ? `<span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Otomatik Hesap &amp; RCD Hafızası Aktif</span>` : ''}
            </div>
            <div class="flex flex-wrap gap-1.5 pb-1">
                ${schema.rowPresets.map((rp, rpIdx) => `
                    <button type="button" onclick="addUniversalPresetRow(${rpIdx})"
                        class="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 text-slate-800 hover:text-sky-700 border border-slate-300 hover:border-sky-400 font-bold text-[11px] shadow-2xs active:scale-95 transition">
                        ${escapeHtml(rp.label)}
                    </button>
                `).join('')}
            </div>
        </div>
    ` : '';

    const cardsHtml = tableRows.map((rowObj, rIdx) => {
        const inputs = cols.map((col, cIdx) => {
            const cKey = col.key || `col_${cIdx}`;
            const cellVal = String((rowObj && rowObj[cKey] !== undefined) ? rowObj[cKey] : '');
            const cleanOpts = Array.isArray(col.options) ? col.options.filter(o => String(o).trim() !== '') : [];

            if (cleanOpts.length > 0 && cleanOpts.length <= 3) {
                const btns = cleanOpts.map(opt => {
                    const isSel = cellVal === opt;
                    const isBad = opt === 'Uygun Değil' || opt.includes('Kırmızı') || opt.includes('Not-2') || opt.includes('Not-3');
                    const actCls = isBad ? 'bg-rose-600 text-white border-rose-600' : 'bg-emerald-600 text-white border-emerald-600';
                    return `<button type="button" onclick="setUniversalTableCell(${rIdx}, '${escapeForJs(cKey)}', '${escapeForJs(opt)}', true)"
                        class="flex-1 min-h-[34px] px-2 py-1 rounded-lg border text-xs font-bold transition ${isSel ? actCls : 'bg-white text-slate-700 border-slate-300'}">${escapeHtml(opt)}</button>`;
                }).join('');
                return `
                    <div class="col-span-2 sm:col-span-1">
                        <label class="block text-xs font-bold text-slate-700 mb-1 truncate">${escapeHtml(col.label)}</label>
                        <div class="flex gap-1">${btns}</div>
                    </div>
                `;
            }

            if (cleanOpts.length > 3) {
                const optsHtml = cleanOpts.map(o => `<option value="${escapeHtml(o)}" ${cellVal === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
                return `
                    <div class="${cIdx === 1 ? 'col-span-2' : ''}">
                        <label class="block text-xs font-bold text-slate-700 mb-1 truncate">${escapeHtml(col.label)}</label>
                        <select onchange="setUniversalTableCell(${rIdx}, '${escapeForJs(cKey)}', this.value, true)"
                            class="w-full h-9 border border-slate-300 rounded-lg px-2 text-xs bg-white font-semibold">
                            <option value="">Seçiniz...</option>
                            ${optsHtml}
                        </select>
                    </div>
                `;
            }

            return `
                <div class="${cIdx === 1 ? 'col-span-2' : ''}">
                    <label class="block text-xs font-bold text-slate-700 mb-1 truncate">${escapeHtml(col.label)}</label>
                    <input type="text" id="utbl_${rIdx}_${escapeHtml(cKey)}" value="${escapeHtml(cellVal)}"
                        oninput="setUniversalTableCell(${rIdx}, '${escapeForJs(cKey)}', this.value, false)"
                        class="w-full h-9 border border-slate-300 rounded-lg px-2.5 text-xs font-semibold bg-white focus:border-sky-500 focus:outline-none">
                </div>
            `;
        }).join('');

        return `
            <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">
                    <span class="font-bold text-xs text-slate-800">Ölçüm / Test Satırı #${rIdx + 1}</span>
                    <div class="flex items-center gap-1.5">
                        <button type="button" onclick="duplicateSpecificSpecializedRow(${rIdx})" class="px-2.5 py-1 bg-sky-100 active:bg-sky-200 text-sky-800 rounded-lg text-xs font-bold flex items-center gap-1">
                            <i class="fa-solid fa-copy"></i>
                            <span>Kopyala</span>
                        </button>
                        <button type="button" onclick="removeUniversalTableRow(${rIdx})"
                            class="px-2 py-1 bg-rose-50 active:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold">
                            <i class="fa-solid fa-trash-can mr-1"></i>Sil
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    ${inputs}
                </div>
            </div>
        `;
    }).join('');

    // Çoklu Ek Tablolar (6.2 Potansiyel Dengeleme, 6.3 Zemin İzolasyonu, 5.3 Selektivite, 5.2/5.3 Jeneratör vb.)
    const additionalTablesHtml = (schema.additionalTables || []).map(subTbl => {
        const subId = subTbl.id;
        const subCols = subTbl.columns || [];
        const subRows = (fd.universalSubTables && Array.isArray(fd.universalSubTables[subId])) ? fd.universalSubTables[subId] : [];

        const subCardsHtml = subRows.map((sRow, sIdx) => {
            const sInputs = subCols.map((sc, scIdx) => {
                const scKey = sc.key;
                const scVal = String((sRow && sRow[scKey] !== undefined) ? sRow[scKey] : '');
                const scOpts = Array.isArray(sc.options) ? sc.options.filter(Boolean) : [];
                if (scOpts.length > 0) {
                    return `
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1 truncate">${escapeHtml(sc.label)}</label>
                            <select onchange="setUniversalSubTableCell('${escapeForJs(subId)}', ${sIdx}, '${escapeForJs(scKey)}', this.value)"
                                class="w-full h-9 border border-slate-300 rounded-lg px-2 text-xs bg-white font-semibold">
                                ${scOpts.map(o => `<option value="${escapeHtml(o)}" ${scVal === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                            </select>
                        </div>
                    `;
                }
                return `
                    <div class="${scIdx === 0 ? 'col-span-2 sm:col-span-1' : ''}">
                        <label class="block text-xs font-bold text-slate-700 mb-1 truncate">${escapeHtml(sc.label)}</label>
                        <input type="text" value="${escapeHtml(scVal)}"
                            oninput="setUniversalSubTableCell('${escapeForJs(subId)}', ${sIdx}, '${escapeForJs(scKey)}', this.value)"
                            class="w-full h-9 border border-slate-300 rounded-lg px-2.5 text-xs font-semibold bg-white focus:border-sky-500 focus:outline-none">
                    </div>
                `;
            }).join('');

            return `
                <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">
                        <span class="font-bold text-xs text-slate-800">Satır #${sIdx + 1}</span>
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="removeUniversalSubTableRow('${escapeForJs(subId)}', ${sIdx})"
                                class="px-2 py-1 bg-rose-50 active:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold">
                                <i class="fa-solid fa-trash-can mr-1"></i>Sil
                            </button>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${sInputs}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="px-3.5 py-2.5 bg-slate-800 text-white flex items-center justify-between gap-2">
                    <span class="font-bold text-xs truncate">${escapeHtml(subTbl.title)} (${subRows.length})</span>
                    <button type="button" onclick="addUniversalSubTableRow('${escapeForJs(subId)}')" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs shrink-0 active:scale-95">
                        <i class="fa-solid fa-plus"></i>
                        <span>Satır Ekle</span>
                    </button>
                </div>
                <div class="p-3 space-y-2.5">${subCardsHtml}</div>
            </div>
        `;
    }).join('');

    const showStep3 = (activeTab === 2 || activeTab === -1);
    const step3Html = !showStep3 ? '' : `
        <div class="space-y-3">
            ${showStdTable && cols.length > 0 ? `
                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div class="px-3.5 py-2.5 bg-slate-800 text-white flex items-center justify-between gap-2">
                        <span class="font-bold text-xs truncate">4. ${escapeHtml(schema.tableTitle || 'Ölçüm ve Test Sonuçları')} (${tableRows.length})</span>
                        <button type="button" onclick="addSpecializedRow(${cols.length})" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs shrink-0 active:scale-95">
                            <i class="fa-solid fa-plus"></i>
                            <span>Satır Ekle</span>
                        </button>
                    </div>
                    ${rowPresetsHtml}
                    <div class="p-3 space-y-2.5">
                        ${cardsHtml}
                    </div>
                </div>
            ` : ''}
            ${showStdTable ? additionalTablesHtml : ''}
            ${renderCustomBlocksForPosition('after_table', schema, fd)}
        </div>
    `;

    // ------------------------------------------------------------------------
    // ADIM 4: FOTOĞRAFLAR VE ADIM 5: SONUÇ & ONAY
    // ------------------------------------------------------------------------
    const showStep4 = (activeTab === 3 || activeTab === -1);
    const step4Html = !showStep4 ? '' : renderPhotoSectionUI();

    const showStep5 = (activeTab === 4 || activeTab === -1);
    const step5Html = !showStep5 ? '' : `
        ${renderCustomBlocksForPosition('before_conclusion', schema, fd)}
        ${renderEvaluationAndFooterSection()}
    `;

    return `
        <div class="space-y-3">
            ${stepperHtml}
            ${step1Html}
            ${step2Html}
            ${step3Html}
            ${step4Html}
            ${step5Html}
        </div>
    `;
}

function setUniversalFieldValue(fieldKey, value, shouldRepaint = false) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.specializedFields) fd.specializedFields = {};
    fd.specializedFields[fieldKey] = value;

    if (insp && window.UniversalSchemaRegistry && typeof window.UniversalSchemaRegistry.evaluateFieldAutoCalc === 'function') {
        const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);
        const changed = window.UniversalSchemaRegistry.evaluateFieldAutoCalc(schema, fieldKey, value, fd);
        if (changed) {
            const ik3El = document.getElementById('ufld_pano_ik3');
            if (ik3El && fd.specializedFields.pano_ik3 !== undefined) {
                ik3El.value = fd.specializedFields.pano_ik3;
            }
        }
    }

    triggerAutoSave();
    if (shouldRepaint) {
        paintInspectionEditorUI();
    }
}

function handleUniversalCheckChange(semanticId, legacyKey, value, checkTitle = '', defaultDefect = '') {
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.specializedChecks) fd.specializedChecks = {};
    if (!fd.universalChecksById) fd.universalChecksById = {};

    fd.specializedChecks[legacyKey] = value;
    fd.universalChecksById[semanticId] = value;

    if (value === 'Uygun Değil' || value === 'Kısmen Uygun') {
        fd.overallResult = 'UYGUN DEĞİL';
        if (defaultDefect) {
            if (!fd.itemDefectSelections) fd.itemDefectSelections = {};
            if (!fd.itemDefectSelections[legacyKey]) {
                fd.itemDefectSelections[legacyKey] = {
                    title: checkTitle,
                    sentence: defaultDefect,
                    category: 'specialized'
                };
                if (typeof syncAllDefectsToDefectNotes === 'function') {
                    syncAllDefectsToDefectNotes();
                } else if (!String(fd.defectNotes || '').includes(defaultDefect)) {
                    fd.defectNotes = [fd.defectNotes, defaultDefect].filter(Boolean).join('\n');
                }
            }
        }
        triggerAutoSave();
        paintInspectionEditorUI();
        if (checkTitle) {
            setTimeout(() => openItemDefectPickerModal(legacyKey, checkTitle, 'specialized'), 50);
        }
    } else {
        if (fd.itemDefectSelections && fd.itemDefectSelections[legacyKey]) {
            delete fd.itemDefectSelections[legacyKey];
            if (typeof syncAllDefectsToDefectNotes === 'function') {
                syncAllDefectsToDefectNotes();
            }
        }
        triggerAutoSave();
        paintInspectionEditorUI();
    }
}

function markAllUniversalChecksSuitable() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd) return;
    const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);
    if (!fd.specializedChecks) fd.specializedChecks = {};
    if (!fd.universalChecksById) fd.universalChecksById = {};

    let count = 0;
    (schema.visualChecks || []).forEach((chk, idx) => {
        const legacyKey = `chk_${idx}`;
        const semanticId = (typeof chk === 'object' && chk.id) ? chk.id : legacyKey;
        const cur = fd.universalChecksById[semanticId] || fd.specializedChecks[legacyKey];
        if (!cur) {
            fd.universalChecksById[semanticId] = 'Uygun';
            fd.specializedChecks[legacyKey] = 'Uygun';
            count++;
        }
    });

    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`${count} adet boş kontrol kriteri "✓ Uygun" olarak işaretlendi.`);
}

function syncLegacySpecializedRowsFromUniversal() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd) return;
    const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);
    const cols = schema.tableColumns || [];
    if (Array.isArray(fd.universalTableRows)) {
        fd.specializedRows = fd.universalTableRows.map(rowObj =>
            cols.map(c => (rowObj && rowObj[c.key] !== undefined) ? String(rowObj[c.key]) : '')
        );
    }
}

function setUniversalTableCell(rowIndex, colKey, value, shouldRepaint = false) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd) return;
    const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);
    if (!Array.isArray(fd.universalTableRows) || !fd.universalTableRows[rowIndex]) return;

    const rowObj = fd.universalTableRows[rowIndex];
    rowObj[colKey] = value;

    if (window.UniversalSchemaRegistry && typeof window.UniversalSchemaRegistry.evaluateRowLimitRules === 'function') {
        window.UniversalSchemaRegistry.evaluateRowLimitRules(schema, rowObj, fd, colKey);
        // Otomatik hesaplanan hücreleri DOM üzerinde anında güncelle (odak kaybı olmadan!)
        ['iz_a', 'n_mm2', 'pe_mm2', 'ia_amp', 'ik1_amp', 'zs_ra', 'result'].forEach(autoKey => {
            if (autoKey !== colKey && rowObj[autoKey] !== undefined) {
                const autoEl = document.getElementById(`utbl_${rowIndex}_${autoKey}`);
                if (autoEl) autoEl.value = rowObj[autoKey];
            }
        });
    }
    if (colKey === 'result' && (value === 'Uygun Değil' || String(value).includes('Uygun Değil'))) {
        fd.overallResult = 'UYGUN DEĞİL';
    }

    syncLegacySpecializedRowsFromUniversal();
    triggerAutoSave();
    if (shouldRepaint) {
        paintInspectionEditorUI();
    }
}

function addUniversalPresetRow(presetIndex) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd) return;
    const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);
    const preset = schema.rowPresets && schema.rowPresets[presetIndex];
    if (!preset || !preset.row) return;

    if (!Array.isArray(fd.universalTableRows)) fd.universalTableRows = [];
    const newRowObj = JSON.parse(JSON.stringify(preset.row));
    if (newRowObj.no !== undefined) {
        newRowObj.no = String(fd.universalTableRows.length + 1);
    }

    // İş emri RCD hafızası varsa uygula
    try {
        const woId = insp.work_order_id || 'default';
        const memRaw = localStorage.getItem(`enlab_wo_rcd_mem_${woId}`);
        if (memRaw) {
            const mem = JSON.parse(memRaw);
            if (mem.rcd_id && newRowObj.rcd_id !== undefined && newRowObj.curve !== 'TMŞ') newRowObj.rcd_id = mem.rcd_id;
            if (mem.rcd_td && newRowObj.rcd_td !== undefined) newRowObj.rcd_td = mem.rcd_td;
        }
    } catch (e) {}

    fd.universalTableRows.push(newRowObj);
    syncLegacySpecializedRowsFromUniversal();
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`"${preset.label}" satırı eklendi.`);
}

function setUniversalSubTableCell(subTableId, rowIndex, colKey, value) {
    const fd = AppState.currentFormData;
    if (!fd || !fd.universalSubTables || !Array.isArray(fd.universalSubTables[subTableId])) return;
    if (!fd.universalSubTables[subTableId][rowIndex]) return;
    fd.universalSubTables[subTableId][rowIndex][colKey] = value;
    triggerAutoSave();
}

function addUniversalSubTableRow(subTableId) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd) return;
    const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);
    const subTbl = (schema.additionalTables || []).find(t => t.id === subTableId);
    if (!subTbl) return;

    if (!fd.universalSubTables) fd.universalSubTables = {};
    if (!Array.isArray(fd.universalSubTables[subTableId])) fd.universalSubTables[subTableId] = [];
    const newRow = {};
    (subTbl.columns || []).forEach(c => {
        newRow[c.key] = c.default || '';
    });
    fd.universalSubTables[subTableId].push(newRow);
    triggerAutoSave();
    paintInspectionEditorUI();
}

function removeUniversalSubTableRow(subTableId, rowIndex) {
    const fd = AppState.currentFormData;
    if (!fd || !fd.universalSubTables || !Array.isArray(fd.universalSubTables[subTableId])) return;
    fd.universalSubTables[subTableId].splice(rowIndex, 1);
    triggerAutoSave();
    paintInspectionEditorUI();
}

function addSpecializedRow(colCount) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!fd) return;
    const schema = insp ? window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name) : { tableColumns: [] };
    const cols = schema.tableColumns || [];

    if (!Array.isArray(fd.universalTableRows)) fd.universalTableRows = [];
    const newRowObj = {};
    cols.forEach((c, idx) => {
        if (c.key === 'no') {
            newRowObj[c.key] = String(fd.universalTableRows.length + 1);
        } else {
            newRowObj[c.key] = c.default || '';
        }
    });
    fd.universalTableRows.push(newRowObj);
    syncLegacySpecializedRowsFromUniversal();

    triggerAutoSave();
    paintInspectionEditorUI();
}

function removeUniversalTableRow(rowIndex) {
    const fd = AppState.currentFormData;
    if (!fd || !Array.isArray(fd.universalTableRows)) return;
    fd.universalTableRows.splice(rowIndex, 1);
    syncLegacySpecializedRowsFromUniversal();
    triggerAutoSave();
    paintInspectionEditorUI();
}

function duplicateSpecificSpecializedRow(rowIndex) {
    const fd = AppState.currentFormData;
    if (!fd || !Array.isArray(fd.universalTableRows) || !fd.universalTableRows[rowIndex]) return;
    const copy = JSON.parse(JSON.stringify(fd.universalTableRows[rowIndex]));
    if (copy.no && /^\d+$/.test(String(copy.no))) {
        copy.no = String(fd.universalTableRows.length + 1);
    }
    fd.universalTableRows.push(copy);
    syncLegacySpecializedRowsFromUniversal();
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`Satır #${rowIndex + 1} kopyalanıp sona eklendi`);
}

function cloneSpecializedRow() {
    const fd = AppState.currentFormData;
    if (!fd || !Array.isArray(fd.universalTableRows) || !fd.universalTableRows.length) {
        return addSpecializedRow(6);
    }
    duplicateSpecificSpecializedRow(fd.universalTableRows.length - 1);
}

// ============================================================================
// ŞABLON EK BLOKLARI (SADECE VERİ GİRİŞİ — ŞABLON TASARIMI WEB STÜDYOSUNA ÖZELDİR)
// ============================================================================
function renderCustomBlocksForPosition(position, schema, fd) {
    if (!window.UniversalSchemaRegistry || typeof window.UniversalSchemaRegistry.getEffectiveCustomBlocks !== 'function') return '';
    const allBlocks = window.UniversalSchemaRegistry.getEffectiveCustomBlocks(schema, fd);
    const blocks = allBlocks.filter(b => b.position === position);
    if (!blocks.length) return '';

    return blocks.map(blk => {
        const store = window.UniversalSchemaRegistry.ensureCustomBlockData(fd, blk) || { fields: {}, rows: [], checks: {}, text: '' };

        let bodyHtml = '';

        // 1. BİLGİ KARTI (field_grid)
        if (blk.blockType === 'field_grid') {
            const fields = blk.fields || [];
            bodyHtml = `<div class="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${fields.map(f => {
                    const val = String(store.fields?.[f.key] ?? '');
                    const cleanOpts = Array.isArray(f.options) ? f.options.filter(Boolean) : [];
                    if (cleanOpts.length > 0 && cleanOpts.length <= 6) {
                        return `
                            <div class="sm:col-span-2 space-y-1">
                                <label class="block text-xs font-bold text-slate-700">${escapeHtml(f.label)}</label>
                                <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    ${cleanOpts.map(opt => {
                                        const isSel = val === opt;
                                        const isNeg = ['Yok', 'Uygun Değil', 'Uygunsuz', 'Arızalı'].includes(opt);
                                        const act = isNeg ? 'bg-rose-600 text-white border-rose-600' : 'bg-emerald-600 text-white border-emerald-600';
                                        return `<button type="button" onclick="setCustomBlockField('${escapeForJs(blk.id)}', '${escapeForJs(f.key)}', '${escapeForJs(opt)}', true)"
                                            class="min-h-[34px] px-2 py-1 rounded-xl border text-xs font-bold transition ${isSel ? act : 'bg-white text-slate-700 border-slate-200'}">${escapeHtml(opt)}</button>`;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }
                    return `
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1">${escapeHtml(f.label)}</label>
                            <div class="relative flex items-center">
                                <input type="text" value="${escapeHtml(val)}"
                                    oninput="setCustomBlockField('${escapeForJs(blk.id)}', '${escapeForJs(f.key)}', this.value, false)"
                                    class="w-full h-9 border border-slate-300 rounded-xl px-2.5 ${f.unit ? 'pr-12' : ''} text-xs font-semibold bg-white focus:border-sky-500 focus:outline-none">
                                ${f.unit ? `<span class="absolute right-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold text-[10px] pointer-events-none">${escapeHtml(f.unit)}</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>`;
        }
        // 2. TABLO veya YATAY MATRİS TABLO (table / matrix_row)
        else if (blk.blockType === 'table' || blk.blockType === 'matrix_row') {
            const cols = blk.columns || [];
            const rows = Array.isArray(store.rows) ? store.rows : [];
            const rowsCards = rows.map((rowObj, rIdx) => {
                const inputsHtml = cols.map((col, cIdx) => {
                    const cVal = String(rowObj?.[col.key] ?? '');
                    const cleanOpts = Array.isArray(col.options) ? col.options.filter(Boolean) : [];
                    if (cleanOpts.length > 0 && cleanOpts.length <= 3) {
                        return `
                            <div class="col-span-2 sm:col-span-1">
                                <label class="block text-xs font-bold text-slate-700 mb-1 truncate">${escapeHtml(col.label)}</label>
                                <div class="flex gap-1">
                                    ${cleanOpts.map(opt => {
                                        const isSel = cVal === opt;
                                        const isBad = opt === 'Uygun Değil' || opt.includes('Uygun Değil');
                                        const act = isBad ? 'bg-rose-600 text-white border-rose-600' : 'bg-emerald-600 text-white border-emerald-600';
                                        return `<button type="button" onclick="setCustomBlockTableCell('${escapeForJs(blk.id)}', ${rIdx}, '${escapeForJs(col.key)}', '${escapeForJs(opt)}', true)"
                                            class="flex-1 min-h-[34px] px-2 py-1 rounded-lg border text-xs font-bold transition ${isSel ? act : 'bg-white text-slate-700 border-slate-300'}">${escapeHtml(opt)}</button>`;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }
                    if (cleanOpts.length > 3) {
                        return `
                            <div>
                                <label class="block text-xs font-bold text-slate-700 mb-1 truncate">${escapeHtml(col.label)}</label>
                                <select onchange="setCustomBlockTableCell('${escapeForJs(blk.id)}', ${rIdx}, '${escapeForJs(col.key)}', this.value, true)"
                                    class="w-full h-9 border border-slate-300 rounded-lg px-2 text-xs bg-white font-semibold">
                                    <option value="">Seçiniz...</option>
                                    ${cleanOpts.map(o => `<option value="${escapeHtml(o)}" ${cVal === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                                </select>
                            </div>
                        `;
                    }
                    return `
                        <div class="${cIdx === 1 ? 'col-span-2 sm:col-span-1' : ''}">
                            <label class="block text-xs font-bold text-slate-700 mb-1 truncate">${escapeHtml(col.label)}</label>
                            <input type="text" id="cblk_cell_${escapeHtml(blk.id)}_${rIdx}_${escapeHtml(col.key)}" value="${escapeHtml(cVal)}"
                                oninput="setCustomBlockTableCell('${escapeForJs(blk.id)}', ${rIdx}, '${escapeForJs(col.key)}', this.value, false)"
                                class="w-full h-9 border border-slate-300 rounded-lg px-2.5 text-xs font-semibold bg-white focus:border-sky-500 focus:outline-none">
                        </div>
                    `;
                }).join('');

                return `
                    <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">
                            <span class="font-bold text-xs text-slate-800">Satır #${rIdx + 1}</span>
                            <div class="flex items-center gap-1.5">
                                <button type="button" onclick="duplicateCustomBlockTableRow('${escapeForJs(blk.id)}', ${rIdx})" class="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-lg text-xs font-bold flex items-center gap-1">
                                    <i class="fa-solid fa-copy"></i><span>Kopyala</span>
                                </button>
                                <button type="button" onclick="removeCustomBlockTableRow('${escapeForJs(blk.id)}', ${rIdx})" class="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold">
                                    <i class="fa-solid fa-trash-can mr-1"></i>Sil
                                </button>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${inputsHtml}</div>
                    </div>
                `;
            }).join('');

            bodyHtml = `
                <div class="p-3 space-y-2.5">
                    ${rowsCards}
                    <button type="button" onclick="addCustomBlockTableRow('${escapeForJs(blk.id)}')"
                        class="w-full h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98">
                        <i class="fa-solid fa-plus"></i><span>Bu Tabloya Satır Ekle</span>
                    </button>
                </div>
            `;
        }
        // 3. ÖZEL KONTROL LİSTESİ (checklist)
        else if (blk.blockType === 'checklist') {
            const items = blk.items || [];
            bodyHtml = `
                <div class="p-3 space-y-2">
                    <div class="flex justify-end">
                        <button type="button" onclick="markAllCustomBlockChecksSuitable('${escapeForJs(blk.id)}')"
                            class="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1">
                            <i class="fa-solid fa-check-double"></i><span>Boş Kalanları Uygun Yap</span>
                        </button>
                    </div>
                    ${items.map((it, idx) => {
                        const val = store.checks?.[it.id] || '';
                        const isDefect = val === 'Uygun Değil';
                        const btns = [
                            { val: 'Uygun', short: '✓', act: 'bg-emerald-600 text-white border-emerald-600', idle: 'bg-white text-emerald-700 border-slate-200' },
                            { val: 'Uygun Değil', short: '✕', act: 'bg-rose-600 text-white border-rose-600', idle: 'bg-white text-rose-700 border-slate-200' },
                            { val: 'Uygulaması Yok', short: 'N', act: 'bg-slate-700 text-white border-slate-700', idle: 'bg-white text-slate-600 border-slate-200' },
                            { val: 'Görülemedi', short: 'G', act: 'bg-amber-500 text-slate-950 border-amber-500', idle: 'bg-white text-amber-700 border-slate-200' }
                        ].map(b => `<button type="button" onclick="setCustomBlockCheck('${escapeForJs(blk.id)}', '${escapeForJs(it.id)}', '${b.val}', '${escapeForJs(it.text)}', '${escapeForJs(it.defect || '')}')"
                            class="w-8 h-8 rounded-lg border text-xs font-black flex items-center justify-center ${val === b.val ? b.act : b.idle}">${b.short}</button>`).join('');
                        return `
                            <div class="p-2.5 rounded-xl border ${isDefect ? 'border-rose-300 bg-rose-50/40' : val === 'Uygun' ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/60'} flex items-center justify-between gap-2">
                                <span class="text-xs font-medium text-slate-800 flex-1 min-w-0"><strong>${escapeHtml(it.code || String(idx + 1))}.</strong> ${escapeHtml(it.text)}</span>
                                <div class="flex items-center gap-1 shrink-0">${btns}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        // 4. SERBEST BİLGİ / FORMÜL / UYARI KUTUSU (info_box)
        else if (blk.blockType === 'info_box') {
            bodyHtml = `
                <div class="p-3 space-y-1.5">
                    <textarea rows="4" oninput="setCustomBlockInfoText('${escapeForJs(blk.id)}', this.value)"
                        placeholder="Bilgi, formül veya referans metnini buraya yazın..."
                        class="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50 focus:bg-white focus:border-sky-500 focus:outline-none">${escapeHtml(store.text !== undefined ? store.text : (blk.content || ''))}</textarea>
                    ${blk.boxStyle === 'two_col_terms' ? `<div class="text-[10px] text-slate-500">İpucu: <code>Terim : Açıklama</code> formatında yazdığınız her satır PDF'te 2 sütunlu teknik referans kutusu olarak basılır.</div>` : ''}
                </div>
            `;
        }

        return `
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div class="px-3.5 py-2.5 bg-slate-800 text-white flex items-center justify-between gap-2">
                    <span class="font-bold text-xs truncate">${escapeHtml(blk.title || 'Ek Bölüm')}</span>
                </div>
                ${bodyHtml}
            </div>
        `;
    }).join('');
}

function setCustomBlockField(blockId, fieldKey, value, shouldRepaint = false) {
    const fd = AppState.currentFormData;
    if (!fd || !fd.universalCustomBlocksData?.[blockId]) return;
    if (!fd.universalCustomBlocksData[blockId].fields) fd.universalCustomBlocksData[blockId].fields = {};
    fd.universalCustomBlocksData[blockId].fields[fieldKey] = value;
    triggerAutoSave();
    if (shouldRepaint) paintInspectionEditorUI();
}

function setCustomBlockTableCell(blockId, rowIdx, colKey, value, shouldRepaint = false) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!fd || !fd.universalCustomBlocksData?.[blockId]) return;
    const rows = fd.universalCustomBlocksData[blockId].rows;
    if (!Array.isArray(rows) || !rows[rowIdx]) return;
    rows[rowIdx][colKey] = value;

    if (insp && window.UniversalSchemaRegistry) {
        const schema = window.UniversalSchemaRegistry.resolveSchema(insp.template_id, insp.equipment_name, fd);
        const blk = window.UniversalSchemaRegistry.getEffectiveCustomBlocks(schema, fd).find(b => b.id === blockId);
        if (blk && Array.isArray(blk.columns)) {
            window.UniversalSchemaRegistry.evaluateColumnLimitRules(blk.columns, rows[rowIdx], colKey);
            if (rows[rowIdx].result !== undefined) {
                const resEl = document.getElementById(`cblk_cell_${blockId}_${rowIdx}_result`);
                if (resEl) resEl.value = rows[rowIdx].result;
            }
            if (rows[rowIdx].result === 'Uygun Değil') fd.overallResult = 'UYGUN DEĞİL';
        }
    }
    triggerAutoSave();
    if (shouldRepaint) paintInspectionEditorUI();
}

function addCustomBlockTableRow(blockId) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!fd || !insp || !window.UniversalSchemaRegistry) return;
    const schema = window.UniversalSchemaRegistry.resolveSchema(insp.template_id, insp.equipment_name, fd);
    const blk = window.UniversalSchemaRegistry.getEffectiveCustomBlocks(schema, fd).find(b => b.id === blockId);
    if (!blk) return;
    const store = window.UniversalSchemaRegistry.ensureCustomBlockData(fd, blk);
    const newRow = {};
    (blk.columns || []).forEach(c => {
        newRow[c.key] = (c.key === 'no') ? String(store.rows.length + 1) : (c.default || '');
    });
    store.rows.push(newRow);
    triggerAutoSave();
    paintInspectionEditorUI();
}

function duplicateCustomBlockTableRow(blockId, rowIdx) {
    const fd = AppState.currentFormData;
    const rows = fd?.universalCustomBlocksData?.[blockId]?.rows;
    if (!Array.isArray(rows) || !rows[rowIdx]) return;
    const copy = JSON.parse(JSON.stringify(rows[rowIdx]));
    if (copy.no && /^\d+$/.test(String(copy.no))) copy.no = String(rows.length + 1);
    rows.push(copy);
    triggerAutoSave();
    paintInspectionEditorUI();
}

function removeCustomBlockTableRow(blockId, rowIdx) {
    const fd = AppState.currentFormData;
    const rows = fd?.universalCustomBlocksData?.[blockId]?.rows;
    if (!Array.isArray(rows)) return;
    rows.splice(rowIdx, 1);
    triggerAutoSave();
    paintInspectionEditorUI();
}

function setCustomBlockCheck(blockId, itemId, val, itemTitle = '', defaultDefect = '') {
    const fd = AppState.currentFormData;
    if (!fd || !fd.universalCustomBlocksData?.[blockId]) return;
    if (!fd.universalCustomBlocksData[blockId].checks) fd.universalCustomBlocksData[blockId].checks = {};
    fd.universalCustomBlocksData[blockId].checks[itemId] = val;

    if (val === 'Uygun Değil') {
        fd.overallResult = 'UYGUN DEĞİL';
        if (defaultDefect && !String(fd.defectNotes || '').includes(defaultDefect)) {
            fd.defectNotes = [fd.defectNotes, defaultDefect].filter(Boolean).join('\n');
        }
    }
    triggerAutoSave();
    paintInspectionEditorUI();
}

function markAllCustomBlockChecksSuitable(blockId) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd || !window.UniversalSchemaRegistry) return;
    const schema = window.UniversalSchemaRegistry.resolveSchema(insp.template_id, insp.equipment_name, fd);
    const blk = window.UniversalSchemaRegistry.getEffectiveCustomBlocks(schema, fd).find(b => b.id === blockId);
    if (!blk) return;
    const store = window.UniversalSchemaRegistry.ensureCustomBlockData(fd, blk);
    let cnt = 0;
    (blk.items || []).forEach(it => {
        if (!store.checks[it.id]) {
            store.checks[it.id] = 'Uygun';
            cnt++;
        }
    });
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`${cnt} madde "✓ Uygun" olarak işaretlendi.`);
}

function setCustomBlockInfoText(blockId, text) {
    const fd = AppState.currentFormData;
    if (!fd || !fd.universalCustomBlocksData?.[blockId]) return;
    fd.universalCustomBlocksData[blockId].text = text;
    triggerAutoSave();
}

window.setUniversalFieldValue = setUniversalFieldValue;
window.handleUniversalCheckChange = handleUniversalCheckChange;
window.markAllUniversalChecksSuitable = markAllUniversalChecksSuitable;
window.setUniversalTableCell = setUniversalTableCell;
window.removeUniversalTableRow = removeUniversalTableRow;
window.addUniversalPresetRow = addUniversalPresetRow;
window.setUniversalSubTableCell = setUniversalSubTableCell;
window.addUniversalSubTableRow = addUniversalSubTableRow;
window.removeUniversalSubTableRow = removeUniversalSubTableRow;
window.setCustomBlockField = setCustomBlockField;
window.setCustomBlockTableCell = setCustomBlockTableCell;
window.addCustomBlockTableRow = addCustomBlockTableRow;
window.duplicateCustomBlockTableRow = duplicateCustomBlockTableRow;
window.removeCustomBlockTableRow = removeCustomBlockTableRow;
window.setCustomBlockCheck = setCustomBlockCheck;
window.markAllCustomBlockChecksSuitable = markAllCustomBlockChecksSuitable;
window.setCustomBlockInfoText = setCustomBlockInfoText;



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



                // Fotoğraf görseli saf ve temiz tutulur (filigran çizilmez)
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
            const insp = (typeof AppState !== 'undefined' && AppState.currentInspection) || {};
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const dateStr = `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()}`;
            const defaultTitle = photoNum === 1 ? (insp.equipment_name || 'Ana Dağıtım Panosu') : (photoNum === 2 ? 'Termal Kamera Görüntüsü' : `Fotoğraf ${photoNum}`);

            fd.photos.push({
                id: 'ph_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                dataUrl: dataUrl,
                title: defaultTitle,
                caption: '',
                description: '',
                date: dateStr,
                reportNo: insp.report_no || ''
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



function updatePhotoTitle(idx, title) {
    const fd = AppState.currentFormData;
    if (!fd.photos || !fd.photos[idx]) return;
    fd.photos[idx].title = title;
    triggerAutoSave();
}

function updatePhotoCaption(idx, caption) {
    const fd = AppState.currentFormData;
    if (!fd.photos || !fd.photos[idx]) return;
    fd.photos[idx].caption = caption;
    fd.photos[idx].description = caption;
    triggerAutoSave();
}

window.updatePhotoTitle = updatePhotoTitle;
window.updatePhotoCaption = updatePhotoCaption;



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

                Tarih: ${photo.date || '-'}

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

                    <span class="font-bold text-slate-900">8. EKİPMAN FOTOĞRAFLARI (${photos.length})</span>

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

                    Henüz fotoğraf eklenmedi.

                </div>

            ` : `

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">

                    ${photos.map((ph, idx) => {
                        const photoNum = idx + 1;
                        let curCaption = (ph.description || ph.caption || '').trim();
                        const lower = curCaption.toLowerCase();
                        if (lower === `fotoğraf ${photoNum}`.toLowerCase() ||
                            lower.includes('ana dağıtım') ||
                            lower === 'adp' ||
                            lower.includes('termal kamera')) {
                            curCaption = '';
                        }

                        return `
                        <div class="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs">
                            <div class="relative bg-black h-36 flex items-center justify-center cursor-pointer group" onclick="openPhotoPreviewModal(${idx})">
                                <img src="${ph.dataUrl}" class="max-h-full max-w-full object-contain">
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                    <i class="fa-solid fa-magnifying-glass-plus"></i> Büyüt
                                </div>
                                <span class="absolute top-1.5 left-1.5 px-2.5 py-0.5 bg-black/75 text-white rounded text-xs font-bold tracking-wide">
                                    Fotoğraf ${photoNum}
                                </span>
                            </div>
                            <div class="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-800 mb-1">Açıklama</label>
                                    <input type="text" id="photoCaptionInput_${idx}" value="${(typeof escapeHtml !== 'undefined' ? escapeHtml(curCaption) : curCaption)}"
                                        placeholder="Fotoğraf hakkında açıklama / tespit giriniz..."
                                        oninput="updatePhotoCaption(${idx}, this.value)"
                                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:border-sky-500 focus:outline-none">
                                </div>
                                <div class="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                                    <div class="flex items-center gap-2.5">
                                        <button onclick="openPhotoAnnotatorModal(${idx})" class="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 active:scale-95" title="Fotoğraf üzerine kırmızı ok veya halka çizin">
                                            <i class="fa-solid fa-pen-ruler"></i> Kusuru İşaretle
                                        </button>
                                        <button onclick="savePhotoToGallery(${idx})" class="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 active:scale-95">
                                            <i class="fa-solid fa-floppy-disk"></i> Galeri
                                        </button>
                                    </div>
                                    <button onclick="removeReportPhoto(${idx})" class="text-slate-400 hover:text-rose-600 font-bold flex items-center gap-1 active:scale-95">
                                        <i class="fa-regular fa-trash-can"></i> Sil
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;}).join('')}

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



