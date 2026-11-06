// ============================================================================
// HIZLI RAPOR - 06-EDITOR-SPECIALIZED.JS
// Açıklama: Özel Teknik Şablonlar Editörü, Fotoğraf Yükleme ve Galeri
// Satır Aralığı: 6873 - 8134 (1262 satır)
// ============================================================================

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

                <label class="block text-xs font-bold text-slate-700 mb-1 truncate">${col.label}</label>

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

                    <span>Boş Kalanları Uygun Yap</span>

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

                    Henüz fotoğraf eklenmedi. Sahadan fotoğraf çekmek veya cihaz galerisinden yüklemek için yukarıdaki butonları kullanabilirsiniz. Eklenen fotoğraflar PDF raporunda yer alır ve daha sonra galeriye kaydedilebilir.

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
                                    <label class="block text-[11px] font-bold text-slate-800 mb-1">Fotoğraf ${photoNum} Açıklaması (Fotonun Altına)</label>
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



