// ============================================================================
// HIZLI RAPOR - 09-EDITOR-GENERATOR.JS
// Açıklama: Jeneratör Periyodik Kontrol (TKM-FR.320) Editörü ve Ölçümleri
// Satır Aralığı: 11121 - 13006 (1886 satır)
// ============================================================================

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

    const hadInitDevices = Boolean(fd._devicesInitialized);
    const hasLegacyGenDevices = Array.isArray(gen.devices) && gen.devices.some(d => d && (d.name || d.serial || d.calDate || d.validDate || d.certNo));
    const isMeasBlank = !Array.isArray(fd.measuringDevices) || fd.measuringDevices.length === 0 || fd.measuringDevices.every(d => !d || (!d.name && !d.serial && !d.calDate && !d.validDate && !d.certNo));

    if (!hadInitDevices && hasLegacyGenDevices && isMeasBlank) {
        fd.measuringDevices = gen.devices;
        fd._devicesInitialized = true;
    }

    ensureMeasuringDevices();

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

            </div>

            <div class="p-3.5 space-y-3.5 text-xs">

                <div>

                    <div class="text-[11px] font-black text-rose-700 uppercase tracking-wide mb-2">3. Muayeneye Ait Genel Bilgiler</div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">

                        <div>

                            <label class="block text-xs font-bold text-slate-700 mb-1">Muayene Nedeni</label>

                            <select onchange="AppState.currentFormData.generator.info.reason=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">

                            <option value="">Seçiniz...</option>

                            ${['Periyodik', 'İlk Kontrol', 'Revizyon Sonrası'].map(opt => `<option value="${opt}" ${(gen.info.reason || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Hava Durumu</label>

                        <select onchange="AppState.currentFormData.generator.info.weather=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                            <option value="">Seçiniz...</option>

                            ${['Açık', 'Kapalı', 'Yağışlı'].map(opt => `<option value="${opt}" ${(gen.info.weather || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Toprak Durumu</label>

                        <select onchange="AppState.currentFormData.generator.info.soilStatus=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                            <option value="">Seçiniz...</option>

                            ${['Kuru', 'Nemli', 'Islak'].map(opt => `<option value="${opt}" ${(gen.info.soilStatus || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Şebeke Tipi</label>

                        <select onchange="AppState.currentFormData.generator.info.networkType=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">

                            <option value="">Seçiniz...</option>

                            ${['TT', 'TN-S', 'TN-C-S', 'IT'].map(opt => `<option value="${opt}" ${(gen.info.networkType || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Topraklama Tipi</label>

                        <select onchange="AppState.currentFormData.generator.info.groundingType=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">

                            <option value="">Seçiniz...</option>

                            ${['Temel', 'Ring', 'Çubuk', 'Levha'].map(opt => `<option value="${opt}" ${(gen.info.groundingType || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Eşpotansiyel Bara</label>

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

                        <label class="block text-xs font-bold text-slate-700 mb-1">Marka</label>

                        <input type="text" value="${gen.equipment.brand || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.equipment.brand=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Model</label>

                        <input type="text" value="${gen.equipment.model || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.equipment.model=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Seri No</label>

                        <input type="text" value="${gen.equipment.serialNo || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.equipment.serialNo=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">İmal Yılı</label>

                        <input type="text" value="${gen.equipment.mfgYear || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.equipment.mfgYear=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Yakıt</label>

                        <select onchange="AppState.currentFormData.generator.equipment.fuel=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">

                            <option value="">Seçiniz...</option>

                            ${['Dizel', 'Benzin', 'Doğalgaz', 'LPG'].map(opt => `<option value="${opt}" ${(gen.equipment.fuel || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Ses İzolasyon</label>

                        <select onchange="AppState.currentFormData.generator.equipment.soundInsulation=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">

                            <option value="">Seçiniz...</option>

                            ${['Kabinli', 'Kabinsiz', 'Konteynerli'].map(opt => `<option value="${opt}" ${(gen.equipment.soundInsulation || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Tip</label>

                        <select onchange="AppState.currentFormData.generator.equipment.type=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">

                            <option value="">Seçiniz...</option>

                            ${['Dahili', 'Harici', 'Mobil'].map(opt => `<option value="${opt}" ${(gen.equipment.type || '') === opt ? 'selected' : ''}>${opt}</option>`).join('')}

                        </select>

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Gerilim (V)</label>

                        <input type="text" value="${gen.equipment.voltage || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.equipment.voltage=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Güç (kVA)</label>

                        <input type="text" value="${gen.equipment.power || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.equipment.power=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Frekans (Hz)</label>

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

                        <label class="block text-xs font-bold text-slate-700 mb-1">L1 – N (V)</label>

                        <input type="text" value="${gen.potential.l1_n || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.potential.l1_n=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">L2 – N (V)</label>

                        <input type="text" value="${gen.potential.l2_n || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.potential.l2_n=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">L3 – N (V)</label>

                        <input type="text" value="${gen.potential.l3_n || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.potential.l3_n=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">L1 – L2 (V)</label>

                        <input type="text" value="${gen.potential.l1_l2 || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.potential.l1_l2=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">L1 – L3 (V)</label>

                        <input type="text" value="${gen.potential.l1_l3 || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.potential.l1_l3=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">L2 – L3 (V)</label>

                        <input type="text" value="${gen.potential.l2_l3 || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.potential.l2_l3=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">N – Pe (V)</label>

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

                        <label class="block text-xs font-bold text-slate-700 mb-1">Aydınlatma (lux)</label>

                        <input type="text" value="${gen.measurements.lux || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.measurements.lux=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">1 mt Ses Seviyesi (dB)</label>

                        <input type="text" value="${gen.measurements.db_1m || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.measurements.db_1m=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">7 mt Ses Seviyesi (dB)</label>

                        <input type="text" value="${gen.measurements.db_7m || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.measurements.db_7m=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Gövde Topraklaması (Ω)</label>

                        <input type="text" value="${gen.measurements.ground_r || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.measurements.ground_r=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-emerald-800">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">L1 Frekans (Hz)</label>

                        <input type="text" value="${gen.measurements.hz_l1 || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.measurements.hz_l1=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">L2 Frekans (Hz)</label>

                        <input type="text" value="${gen.measurements.hz_l2 || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.measurements.hz_l2=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">L3 Frekans (Hz)</label>

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

                        <label class="block text-xs font-bold text-slate-700 mb-1">Akü Markası</label>

                        <input type="text" value="${gen.battery.brand || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.battery.brand=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Akü Modeli</label>

                        <input type="text" value="${gen.battery.model || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.battery.model=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Akü Seri No</label>

                        <input type="text" value="${gen.battery.serialNo || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.battery.serialNo=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">İmal Yılı</label>

                        <input type="text" value="${gen.battery.mfgYear || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.battery.mfgYear=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Redresör Devredeyken (V)</label>

                        <input type="text" value="${gen.battery.v_on || ''}" placeholder=""

                            oninput="AppState.currentFormData.generator.battery.v_on=this.value; triggerAutoSave();"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-700">

                    </div>

                    <div>

                        <label class="block text-xs font-bold text-slate-700 mb-1">Redresör Devre Dışıyken (V)</label>

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

    if (typeof window.addManualMeasuringDeviceRow === 'function') {
        return window.addManualMeasuringDeviceRow();
    }

    const fd = AppState.currentFormData;

    if (!Array.isArray(fd.measuringDevices)) fd.measuringDevices = [];

    fd.measuringDevices.push({

        name: '',

        serial: '',

        calDate: '',

        validDate: '',

        certNo: ''

    });

    fd._devicesInitialized = true;

    if (!fd.generator) fd.generator = {};
    fd.generator.devices = fd.measuringDevices;

    triggerAutoSave();

    paintInspectionEditorUI();

}



function removeGeneratorDeviceRow(idx) {

    if (typeof window.removeMeasuringDeviceRow === 'function') {
        return window.removeMeasuringDeviceRow(idx);
    }

    const fd = AppState.currentFormData;

    if (!Array.isArray(fd.measuringDevices) || !fd.measuringDevices[idx]) return;

    fd.measuringDevices.splice(idx, 1);

    fd._devicesInitialized = true;

    if (fd.generator) fd.generator.devices = fd.measuringDevices;

    triggerAutoSave();

    paintInspectionEditorUI();

}



function seedGeneratorDefaultDevices() {

    const fd = AppState.currentFormData;

    if (!fd.generator) fd.generator = {};

    const assignedRows = (window.MeasuringDevicesManager && window.MeasuringDevicesManager.getAssignedDevices().length > 0)
        ? window.MeasuringDevicesManager.getDefaultReportDevices()
        : null;

    fd.measuringDevices = assignedRows || [

        { name: 'Multimetre', serial: '0793436', calDate: '19.06.2026', validDate: '19.06.2027', certNo: '0074K-0626-00956' },

        { name: 'Termal Kamera', serial: '201266702', calDate: '22.06.2026', validDate: '22.06.2027', certNo: '0074K-0626-01712' },

        { name: 'Çok Fonksiyonlu Test Cihazı', serial: '21050830', calDate: '20.10.2026', validDate: '20.10.2027', certNo: '0176K-1026-01697' },

        { name: 'Dijital Ses Seviyesi Ölçer', serial: 'C211213034', calDate: '07.11.2025', validDate: '07.11.2026', certNo: '0016K-1125-01098' },

        { name: 'Dijital Işık Ölçer', serial: 'C230285545', calDate: '14.07.2026', validDate: '14.07.2027', certNo: '0016K-0726-02235' }

    ];

    fd._devicesInitialized = true;
    fd.generator.devices = fd.measuringDevices;

    triggerAutoSave();

    paintInspectionEditorUI();

    showToast(assignedRows ? 'Üzerinizdeki cihaz listesi eklendi' : 'Örnek cihaz listesi eklendi');

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

                <label class="block font-bold text-slate-700 mb-1.5">Kayıtlı Uygunsuzluk Cümleleri</label>

                <div class="space-y-2 max-h-56 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">

                    ${cardsHtml}

                </div>

            </div>



            <!-- YENİ CÜMLE EKLEME ALANI -->

            <div class="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">

                <div class="font-bold text-amber-900 text-[11px] flex items-center gap-1.5">

                    <i class="fa-solid fa-circle-plus text-amber-600"></i>

                    <span>Yeni Uygunsuzluk Cümlesi Ekle</span>

                </div>

                <div class="space-y-2">

                    <div class="relative">

                        <textarea id="newItemDefectCustomInput" rows="2"

                            placeholder="Örn: Bu madde için sahada tespit edilen özel uygunsuzluk cümlesini yazın..."

                            class="w-full border border-amber-300 bg-white rounded-lg p-2 text-xs focus:border-amber-500 focus:outline-none"></textarea>

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

    if (String(AppState.currentInspection?.template_id) === '2201' && typeof window.getElectrical22DefectLines === 'function') {

        window.getElectrical22DefectLines(fd).forEach(l => lines.push(l));

    }

    if (String(AppState.currentInspection?.template_id) === '2201' && typeof window.getElectrical61DefectLines === 'function') {

        window.getElectrical61DefectLines(fd).forEach(l => {

            if (!lines.includes(l)) lines.push(l);

        });

    }



    const cur = (fd.defectNotes || '').trim();

    const existingManual = cur ? cur.split('\n').filter(l => l.trim() && !l.trim().startsWith('• [')) : [];



    if (lines.length) {

        fd.defectNotes = lines.join('\n') + (existingManual.length ? '\n\n' + existingManual.join('\n') : '');

        fd.overallResult = 'UYGUN DEĞİL';

        if (AppState.currentInspection) AppState.currentInspection.result_status = 'UYGUN DEĞİL';

    } else {

        fd.defectNotes = existingManual.join('\n');

    }

    const defectTa = document.getElementById('defectNotesTextarea');
    if (defectTa && defectTa.value !== fd.defectNotes) {
        defectTa.value = fd.defectNotes;
    }



    triggerAutoSave();

}



function handleAnswerInput(qKey, value) {
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.answers) fd.answers = {};
    fd.answers[qKey] = value;
    if (String(AppState.currentInspection?.template_id) === '2201' && typeof window.onElectrical2201AnswerUpdated === 'function') {
        window.onElectrical2201AnswerUpdated(qKey, value, true);
    }
    triggerAutoSave();
}
window.handleAnswerInput = handleAnswerInput;

function handleAnswerChange(qKey, value, questionTitle = '', isDirectInput = false) {
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.answers) fd.answers = {};
    fd.answers[qKey] = value;

    const is2201 = String(AppState.currentInspection?.template_id) === '2201';
    if (is2201 && typeof window.onElectrical2201AnswerUpdated === 'function') {
        window.onElectrical2201AnswerUpdated(qKey, value, isDirectInput);
    }

    if (isDirectInput) {
        triggerAutoSave();
        return;
    }

    // Direct text entry guard: if not standard choice, only save (except 2.2 edits which need styling/defect UI sync)
    const standardStatuses = ['Uygun', 'Uygun Değil', 'Kısmen Uygun', 'Uygulaması Yok', 'Görülemedi', 'Muaf', 'Kapsam Dışı', ''];
    if (!standardStatuses.includes(value)) {
        triggerAutoSave();
        if (is2201 && (value === 'Uygunsuz' || String(questionTitle).includes('Tespit edilen bilgiler'))) {
            paintInspectionEditorUI();
        }
        return;
    }

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



function handleSpecializedCheckChange(cKey, value, checkTitle = '', isDirectInput = false) {
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.specializedChecks) fd.specializedChecks = {};
    fd.specializedChecks[cKey] = value;

    if (isDirectInput) {
        triggerAutoSave();
        return;
    }

    const standardStatuses = ['Uygun', 'Uygun Değil', 'Kısmen Uygun', 'Uygulaması Yok', 'Görülemedi', 'Muaf', 'Kapsam Dışı', ''];
    if (!standardStatuses.includes(value)) {
        triggerAutoSave();
        return;
    }



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



function markAllVisualChecksSuitable(onlyUnanswered = true) {

    const insp = AppState.currentInspection;

    const fd = AppState.currentFormData;

    let filledCount = 0;



    if (String(insp.template_id) === '2201' && AppState.electricalTemplate) {

        AppState.electricalTemplate.areas.forEach(area => {

            (area.topics || []).forEach(topic => {

                (topic.questions || []).forEach(q => {

                    if (q.type === 'YesNo') {

                        const cur = fd.answers[`q_${q.guid}`];

                        if (!onlyUnanswered || !cur) {

                            if (cur !== 'Uygun Değil' || !onlyUnanswered) {

                                fd.answers[`q_${q.guid}`] = 'Uygun';

                                filledCount++;

                            }

                        }

                    }

                });

            });

        });

    } else {

        const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);

        (schema.visualChecks || []).forEach((_, idx) => {

            const cur = fd.specializedChecks[`chk_${idx}`];

            if (!onlyUnanswered || !cur) {

                if (cur !== 'Uygun Değil' || !onlyUnanswered) {

                    fd.specializedChecks[`chk_${idx}`] = 'Uygun';

                    filledCount++;

                }

            }

        });

    }



    if (String(insp.template_id) === '2201' && typeof window.syncElectrical2201Section22FromTriggers === 'function') {

        window.syncElectrical2201Section22FromTriggers(null, true);

    }



    triggerAutoSave();

    paintInspectionEditorUI();

    showToast(`${filledCount} adet boş madde "✓ Uygun" olarak tamamlandı! (Kusurlar korundu)`);

}

window.markAllVisualChecksSuitable = markAllVisualChecksSuitable;



// Duplicate handlePhotoUpload removed; primary optimized handler is active above.



function triggerAutoSave() {

    const insp = AppState.currentInspection;

    if (!insp) return;

    const badge = document.getElementById('lastSavedBadge');

    if (badge) {

        badge.classList.remove('hidden');

        badge.innerHTML = `<i class="fa-solid fa-rotate fa-spin text-amber-400 mr-1"></i> Kaydediliyor...`;

    }

    clearTimeout(AppState.saveTimer);

    AppState.saveTimer = setTimeout(() => {

        AppState.saveTimer = null;

        saveCurrentInspection(false);

    }, 250);

}

function flushPendingAutoSave() {

    if (!AppState.saveTimer) return;

    clearTimeout(AppState.saveTimer);

    AppState.saveTimer = null;

    const insp = AppState.currentInspection;

    const fd = AppState.currentFormData;

    if (!insp || !fd) return;

    try {

        localStorage.setItem(`enlab_insp_${insp.id}`, JSON.stringify(fd));

    } catch (e) {

        console.warn('LocalStorage kotası uyarısı:', e);

    }

    saveCurrentInspection(false);

}

if (typeof document !== 'undefined' && !window._enlabAutoSaveLifecycleBound) {

    window._enlabAutoSaveLifecycleBound = true;

    document.addEventListener('visibilitychange', () => {

        if (document.visibilityState === 'hidden') {

            flushPendingAutoSave();

        }

    });

    window.addEventListener('pagehide', flushPendingAutoSave);

}

async function saveCurrentInspection(manualToast = false) {

    clearTimeout(AppState.saveTimer);

    AppState.saveTimer = null;

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

        let cloudSaved = false;

        if (window.CloudAppSync) {

            if (manualToast && typeof window.CloudAppSync.pushInspection === 'function') {

                const pushRes = await window.CloudAppSync.pushInspection(insp, fd);

                cloudSaved = Boolean(pushRes && pushRes.ok);

            } else if (!manualToast && typeof window.CloudAppSync.queueInspectionPush === 'function') {

                window.CloudAppSync.queueInspectionPush(insp, fd);

            }

        }

        if (badge) {

            badge.classList.remove('hidden');

            const nowStr = new Date().toLocaleTimeString('tr-TR');

            badge.innerHTML = cloudSaved

                ? `<i class="fa-solid fa-cloud-check text-emerald-400 mr-1"></i> Buluta Kaydedildi (${nowStr})`

                : `<i class="fa-solid fa-cloud-check text-emerald-400 mr-1"></i> Kaydedildi (${nowStr})`;

        }

        if (manualToast) {

            showToast(cloudSaved

                ? 'Rapor hem cihaza hem bulut hesabınıza kaydedildi!'

                : 'Rapor cihaz hafızasına kaydedildi!');

        }

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



