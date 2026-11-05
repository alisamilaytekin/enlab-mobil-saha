// ============================================================================
// HIZLI RAPOR - 07-DEFECTS-LIBRARY.JS
// Açıklama: Kusur Kütüphanesi, Kusur Seçiciler ve Değerlendirme Bölümü
// Satır Aralığı: 8135 - 9664 (1530 satır)
// ============================================================================

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





// ============================================================================

// TOPRAKLAMA PANO & LİNYE İSİMLERİ AKILLI ÖNERİ LİSTESİ (100% OPAQUE AUTOCOMPLETE)

// ============================================================================

const COMMON_LINYE_SUGGESTIONS = [

    { title: 'Ana Dağıtım Panosu (ADP)', tag: 'Ana Pano' },

    { title: 'Tali Dağıtım Panosu (TDP)', tag: 'Tali Pano' },

    { title: 'Aydınlatma Panosu', tag: 'Aydınlatma' },

    { title: 'Priz Linyeleri', tag: 'Priz' },

    { title: 'UPS / Kesintisiz Güç Panosu', tag: 'UPS' },

    { title: 'Havalandırma / Klima Santrali (KKS)', tag: 'Klima' },

    { title: 'Kompresör Panosu', tag: 'Kompresör' },

    { title: 'Kazan Dairesi Panosu', tag: 'Isıtma' },

    { title: 'Yangın Pompası Panosu', tag: 'Yangın' },

    { title: 'Hidrofor / Pompa Panosu', tag: 'Pompa' },

    { title: 'Çatı GES / İnvertör Panosu', tag: 'Solar' },

    { title: 'Soğutma Grubu Panosu', tag: 'Soğutma' },

    { title: 'Ofis Tali Panosu', tag: 'Ofis' },

    { title: 'Mutfak / Yemekhane Panosu', tag: 'Mutfak' },

    { title: 'Makine / Atölye Besleme Panosu', tag: 'Makine' },

    { title: 'Jeneratör Transfer Panosu (ATS)', tag: 'Jeneratör' },

    { title: 'Kompanzasyon Panosu', tag: 'Reaktif' },

    { title: 'Dış Aydınlatma / Çevre Panosu', tag: 'Aydınlatma' },

    { title: 'Kantar / Güvenlik Panosu', tag: 'Saha' },

    { title: 'Yangın Algılama Paneli Beslemesi', tag: 'Yangın' }

];



const LinyeMemoryManager = {

    STORAGE_KEY: 'enlab_linye_frequencies_v3',



    getFrequencies() {

        try {

            const raw = localStorage.getItem(this.STORAGE_KEY);

            if (raw) return JSON.parse(raw);

        } catch (e) {}

        return {};

    },



    recordUsage(title) {

        const trimmed = (title || '').trim();

        if (!trimmed || trimmed.length < 2) return;

        const freqs = this.getFrequencies();

        // Dengeli ve gerçekçi sayaç: maksimum 99 ile sınırlandırılır

        freqs[trimmed] = Math.min((freqs[trimmed] || 0) + 1, 99);

        try {

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(freqs));

        } catch (e) {}

    },



    seedFromExistingData() {

        try {

            const freqs = this.getFrequencies();

            let changed = false;

            const seen = new Set();



            // Sadece her raporda geçen linye isimlerini 1 kez tohumla

            for (let i = 0; i < localStorage.length; i++) {

                const k = localStorage.key(i);

                if (k && k.startsWith('enlab_insp_')) {

                    try {

                        const data = JSON.parse(localStorage.getItem(k));

                        const pts = data?.grounding?.points || [];

                        pts.forEach(p => {

                            const name = (p.point || '').trim();

                            if (name && name.length >= 2 && !seen.has(`${k}_${name}`)) {

                                seen.add(`${k}_${name}`);

                                freqs[name] = Math.min((freqs[name] || 0) + 1, 8);

                                changed = true;

                            }

                        });

                    } catch (e) {}

                }

            }



            if (changed) {

                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(freqs));

            }

        } catch (e) {}

    },



    getSuggestions(query = '') {

        const freqs = this.getFrequencies();

        const q = (query || '').toLowerCase().trim();

        const map = new Map();



        // 1. Standart tanımlı öneriler

        COMMON_LINYE_SUGGESTIONS.forEach(item => {

            map.set(item.title, {

                title: item.title,

                tag: item.tag || 'Standart',

                count: freqs[item.title] || 0,

                isCustom: false

            });

        });



        // 2. Kullanıcının yazdığı ve kaydettiği özel linye hafızası

        Object.keys(freqs).forEach(customTitle => {

            if (map.has(customTitle)) {

                map.get(customTitle).count = freqs[customTitle];

            } else {

                map.set(customTitle, {

                    title: customTitle,

                    tag: 'Kişisel',

                    count: freqs[customTitle],

                    isCustom: true

                });

            }

        });



        let list = Array.from(map.values());



        if (q) {

            list = list.filter(item =>

                item.title.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q)

            );

        }



        // EN ÇOK KULLANILAN EN ÜSTTE! (Frekans Sıralaması)

        list.sort((a, b) => {

            if (b.count !== a.count) {

                return b.count - a.count; // En yüksek frekans önce

            }

            return a.title.localeCompare(b.title, 'tr');

        });



        return list;

    },



    getQuickChips() {

        const freqs = this.getFrequencies();

        const topUsed = Object.entries(freqs)

            .sort((a, b) => b[1] - a[1])

            .map(entry => entry[0])

            .slice(0, 5);



        const defaults = ['ADP', 'TDP', 'Aydınlatma', 'Priz Linyeleri', 'UPS Panosu', 'Klima Santrali', 'Kompresör', 'Yangın Pompası'];

        const combined = Array.from(new Set([...topUsed, ...defaults]));

        return combined.slice(0, 9);

    }

};



// ============================================================================

// TOPRAKLAMA ACCORDION (KATLANABİLİR LİNYE KARTLARI) YÖNETİMİ

// ============================================================================

function isGroundingPointExpanded(pIdx) {

    if (!AppState.expandedGroundingPoints) AppState.expandedGroundingPoints = {};

    if (AppState.expandedGroundingPoints[pIdx] !== undefined) {

        return AppState.expandedGroundingPoints[pIdx];

    }

    const gd = AppState.currentFormData?.grounding;

    const pts = gd?.points || [];

    if (pts.length <= 4) return true;

    const p = pts[pIdx];

    if (!p) return true;

    if (!p.point || !p.zxRx) return true; // Tamamlanmamışlar açık kalır

    if (pIdx === pts.length - 1) return true; // Son eklenen açık kalır

    return false; // Tamamlanmışlar yer kaplamaz, özet satırına daralır

}



function toggleGroundingPointAccordion(pIdx) {

    if (!AppState.expandedGroundingPoints) AppState.expandedGroundingPoints = {};

    const cur = isGroundingPointExpanded(pIdx);

    AppState.expandedGroundingPoints[pIdx] = !cur;

    paintInspectionEditorUI();

}



function setAllGroundingPointsExpanded(expanded) {

    if (!AppState.expandedGroundingPoints) AppState.expandedGroundingPoints = {};

    const pts = AppState.currentFormData?.grounding?.points || [];

    pts.forEach((_, idx) => {

        AppState.expandedGroundingPoints[idx] = expanded;

    });

    paintInspectionEditorUI();

    showToast(expanded ? 'Tüm ölçüm kartları açıldı' : 'Tüm ölçüm kartları daraltıldı');

}



function setGroundingPointBreakerPreset(pIdx, curve, inVal) {

    updateGroundingPointField(pIdx, 'curve', curve);

    updateGroundingPointField(pIdx, 'inAmp', inVal);

    paintInspectionEditorUI();

    const iaVal = (curve === 'B' ? parseInt(inVal)*5 : parseInt(inVal)*10);

    showToast(`Sigorta: ${curve}${inVal}A seçildi (Ia: ${iaVal}A)`);

}



function undoDeleteGroundingPointRow() {

    if (!window.__lastDeletedGroundingPoint) return;

    const { index, point } = window.__lastDeletedGroundingPoint;

    const gd = AppState.currentFormData.grounding;

    if (!gd.points) gd.points = [];

    gd.points.splice(index, 0, point);

    if (!AppState.expandedGroundingPoints) AppState.expandedGroundingPoints = {};

    AppState.expandedGroundingPoints[index] = true;

    window.__lastDeletedGroundingPoint = null;

    triggerAutoSave();

    paintInspectionEditorUI();

    showToast('Silinen ölçüm noktası geri getirildi!', 'success');

}



function renderLinyeDropdownItems(pIdx, query) {

    const q = (query || '').trim();

    const dropdown = document.getElementById(`linyeDropdown_${pIdx}`);

    if (!dropdown) return;



    if (!window.__linyeMemorySeeded) {

        LinyeMemoryManager.seedFromExistingData();

        window.__linyeMemorySeeded = true;

    }



    const suggestions = LinyeMemoryManager.getSuggestions(q);

    const hasExactMatch = suggestions.some(s => s.title.toLowerCase() === q.toLowerCase());



    let headerHtml = `

        <div class="px-3 py-1.5 bg-slate-900 text-white font-bold text-[10px] flex items-center justify-between border-b border-slate-800 sticky top-0 z-10 select-none">

            <span class="flex items-center gap-1.5">

                <i class="fa-solid fa-bolt text-amber-400"></i>

                <span>Akıllı Pano & Linye Listesi</span>

            </span>

            <span class="text-[9px] text-sky-300 font-medium">Sık kullanılanlar üstte</span>

        </div>

    `;



    let customAddHtml = '';

    if (q && !hasExactMatch) {

        customAddHtml = `

            <div onclick="selectLinyeSuggestion(${pIdx}, '${escapeForJs(q)}')"

                class="p-2.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 cursor-pointer flex items-center justify-between border-b border-emerald-200 text-emerald-950 select-none transition">

                <div class="flex items-center gap-2 min-w-0">

                    <i class="fa-solid fa-circle-plus text-emerald-600 shrink-0"></i>

                    <span class="font-bold text-xs truncate">"${escapeHtml(q)}" olarak kaydet ve kullan</span>

                </div>

                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0 shadow-2xs">Yeni Pano</span>

            </div>

        `;

    }



    let itemsHtml = '';

    if (suggestions.length === 0 && !q) {

        itemsHtml = `

            <div class="p-3 text-center text-slate-400 text-xs bg-white">

                Öneri bulunamadı. Pano adını doğrudan yazabilirsiniz.

            </div>

        `;

    } else {

        itemsHtml = suggestions.map(item => {

            const countBadge = item.count > 0 

                ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0"><i class="fa-solid fa-fire text-[9px] text-amber-500"></i>${item.count} kez</span>` 

                : (item.isCustom 

                    ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 shrink-0">Kişisel</span>` 

                    : `<span class="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">${escapeHtml(item.tag)}</span>`);



            return `

                <div onclick="selectLinyeSuggestion(${pIdx}, '${escapeForJs(item.title)}')"

                    class="p-2.5 hover:bg-sky-50 active:bg-sky-100 cursor-pointer flex items-center justify-between gap-2 transition bg-white text-slate-900 select-none">

                    <span class="font-bold text-xs text-slate-900 truncate">${escapeHtml(item.title)}</span>

                    ${countBadge}

                </div>

            `;

        }).join('');

    }



    dropdown.innerHTML = headerHtml + customAddHtml + `<div class="divide-y divide-slate-100 bg-white">${itemsHtml}</div>`;

    dropdown.classList.remove('hidden');

}



function handleLinyeInputFocus(pIdx, inputEl) {

    renderLinyeDropdownItems(pIdx, inputEl.value);

}



function handleLinyeInputType(pIdx, inputEl) {

    const val = inputEl.value;

    if (AppState.currentFormData?.grounding?.points?.[pIdx]) {

        AppState.currentFormData.grounding.points[pIdx].point = val;

    }

    triggerAutoSave();

    renderLinyeDropdownItems(pIdx, val);

}



function handleLinyeInputBlur(pIdx) {

    const inputEl = document.getElementById(`pt_name_${pIdx}`);

    if (inputEl && inputEl.value) {

        LinyeMemoryManager.recordUsage(inputEl.value);

    }

    setTimeout(() => {

        if (window.__linyeDropdownInteracting) return;

        const dropdown = document.getElementById(`linyeDropdown_${pIdx}`);

        if (dropdown) dropdown.classList.add('hidden');

    }, 350);

}



function selectLinyeSuggestion(pIdx, chosenTitle) {

    window.__linyeDropdownInteracting = false;

    if (AppState.currentFormData?.grounding?.points?.[pIdx]) {

        AppState.currentFormData.grounding.points[pIdx].point = chosenTitle;

    }

    const inputEl = document.getElementById(`pt_name_${pIdx}`);

    if (inputEl) inputEl.value = chosenTitle;

    

    // Sıklık hafızasını güncelle (en çok kullanılan en üstte çıksın)

    LinyeMemoryManager.recordUsage(chosenTitle);

    

    const dropdown = document.getElementById(`linyeDropdown_${pIdx}`);

    if (dropdown) dropdown.classList.add('hidden');

    

    triggerAutoSave();

    showToast(`Pano: ${chosenTitle}`);

}



