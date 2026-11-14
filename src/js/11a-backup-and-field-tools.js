// ============================================================================
// HIZLI RAPOR - 11A-BACKUP-AND-FIELD-TOOLS.JS
// Açıklama: Acil Yedekleme, Çökme Kalkanı, Fotoğraf Çizim/Annotator ve Saha Araçları
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

        const fileName = `Hizli_Rapor_Yedek_${timeStamp}.json`;



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

                <!-- İstatistikler -->

                <div class="grid grid-cols-3 gap-2 text-center">

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-base font-black text-slate-800">${workOrderCount}</div>

                        <div class="text-xs font-bold text-slate-700">Şirket / Klasör</div>

                    </div>

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-base font-black text-sky-700">${inspectionCount}</div>

                        <div class="text-xs font-bold text-slate-700">Rapor</div>

                    </div>

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-base font-black text-emerald-700">${customDefectCount}</div>

                        <div class="text-xs font-bold text-slate-700">Özel Cümle</div>

                    </div>

                </div>



                <!-- Aksiyonlar -->

                <div class="space-y-2.5 pt-1">

                    <button onclick="exportEmergencyBackup()" class="w-full p-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-between shadow-sm transition">

                        <div class="flex items-center gap-2.5">

                            <i class="fa-solid fa-file-arrow-down text-base"></i>

                            <div class="text-left">Tek Tıkla Tam Yedek İndir (JSON)</div>

                        </div>

                        <i class="fa-solid fa-chevron-right text-xs opacity-70"></i>

                    </button>



                    <label class="w-full p-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-between shadow-sm transition cursor-pointer">

                        <div class="flex items-center gap-2.5">

                            <i class="fa-solid fa-file-arrow-up text-base text-sky-400"></i>

                            <div class="text-left">Yedekten Geri Yükle (JSON İçe Aktar)</div>

                        </div>

                        <i class="fa-solid fa-chevron-right text-xs opacity-70"></i>

                        <input type="file" accept=".json,application/json" class="hidden" onchange="importBackupFromFile(this)">

                    </label>

                </div>

            </div>

        `;

    }



    const modalTitle = '<i class="fa-solid fa-shield-halved text-amber-400 mr-2"></i>Veri Yedekleme ve Kurtarma Merkezi';

    const modalFooter = `

        <button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg active:scale-95 transition">

            Kapat

        </button>

    `;



    openModal(modalTitle, bodyEl ? bodyEl.innerHTML : '', modalFooter);

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



// (Voice dictation removed as requested)



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
            { label: '1-2. Firma & Ekipman', id: 0 },
            { label: '3-4. Cihazlar & Aletler', id: 1 },
            { label: '5. Gözle Kontrol', id: 2 },
            { label: '6. Fonksiyon Testleri', id: 3 },
            { label: `8. Fotoğraflar (${(AppState.currentFormData.photos || []).length})`, id: 4 },
            { label: '7-11. Kusur, Not & Onay', id: 5 },
            { label: 'Tüm Bölümler (1-11)', id: -1 }
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





// ============================================================================

// 13. SAHA SÜPER PAKET FONKSİYONLARI (OTOMASYON, KLONLAMA, SENKRONİZASYON)

// ============================================================================



// --- 13.1 TOPRAKLAMA OTOMATİK DOKUNMA GERİLİMİ HESAPLAYICI (TN: 230/Ia, TT: 50/Ia) ---

function updateGroundingNetworkType(newType) {

    if (!AppState.currentFormData?.grounding) return;

    if (!AppState.currentFormData.grounding.details) AppState.currentFormData.grounding.details = {};

    AppState.currentFormData.grounding.details.networkType = newType;



    const isTN = (newType || '').trim().toUpperCase().startsWith('TN');

    const voltageLimit = isTN ? 230 : 50;



    // Tüm mevcut linye satırlarının Zs sınırlarını yeni şebeke tipine göre otomatik güncelle

    const pts = AppState.currentFormData.grounding.points || [];

    let updatedCount = 0;

    pts.forEach((p, idx) => {

        const inNum = parseFloat(String(p.inAmp || '').replace(',', '.'));

        const curve = (p.curve || 'C').toUpperCase();

        let mult = curve === 'B' ? 5 : curve === 'C' ? 10 : curve === 'D' ? 20 : curve === 'K' ? 14 : curve === 'Z' ? 3 : 10;



        if (!isNaN(inNum) && inNum > 0) {

            const ia = inNum * mult;

            p.iaAmp = String(ia);

            const zsLimit = parseFloat((voltageLimit / ia).toFixed(2));

            p.zsRa = String(zsLimit);

            updatedCount++;



            // Uygunluk durumunu da sınır değişimine göre yeniden değerlendir

            const zxCheck = parseFloat(String(p.zxRx || '').replace(',', '.'));

            if (!isNaN(zxCheck) && zxCheck > 0) {

                if (zxCheck <= zsLimit) {

                    p.result = 'Not-1';

                } else {

                    const hasRcd = (p.rcdSpec && p.rcdSpec.trim() && p.rcdSpec.trim() !== '-') || (p.rcdId && parseFloat(p.rcdId) > 0);

                    p.result = hasRcd ? 'Not-4' : 'Not-2';

                }

            }

        }

    });



    triggerAutoSave();

    showToast(`Şebeke Tipi: ${newType || 'Belirtilmedi'} → Zs Formülü: ${voltageLimit}/Ia (${isTN ? 'TN-S / 230V' : 'TT / 50V'})`);

    paintInspectionEditorUI();

}



function updateGroundingPointField(pIdx, field, val) {

    const gd = AppState.currentFormData.grounding;

    if (!gd || !gd.points || !gd.points[pIdx]) return;

    const p = gd.points[pIdx];

    p[field] = val;



    // Şebeke tipine göre gerilim sınırını belirle: TN-S/TN-C ise 230V, TT ise 50V

    const netType = (gd.details && gd.details.networkType) ? gd.details.networkType.trim().toUpperCase() : '';

    const isTN = netType.startsWith('TN');

    const voltageLimit = isTN ? 230 : 50;



    // 1. In (A) veya Açma Eğrisi (Curve) girildiğinde Ia (açma akımı) ve Zs Sınır (TN: 230/Ia, TT: 50/Ia) hesapla

    const inNum = parseFloat(String(p.inAmp || '').replace(',', '.'));

    const curve = (p.curve || 'C').toUpperCase();

    let mult = 10;

    if (curve === 'B') mult = 5;

    else if (curve === 'C') mult = 10;

    else if (curve === 'D') mult = 20;

    else if (curve === 'K') mult = 14;

    else if (curve === 'Z') mult = 3;



    if (!isNaN(inNum) && inNum > 0) {

        const ia = inNum * mult;

        p.iaAmp = String(ia);

        const zsLimit = parseFloat((voltageLimit / ia).toFixed(2));

        p.zsRa = String(zsLimit);



        const elIa = document.getElementById(`pt_ia_${pIdx}`);

        if (elIa && field !== 'iaAmp') elIa.value = p.iaAmp;



        const elZs = document.getElementById(`pt_zs_${pIdx}`);

        if (elZs && field !== 'zsRa') elZs.value = p.zsRa;

    }



    // 2. EMPEDANS (Zx/Rx) GİRİLDİĞİNDE OTOMATİK Ik1 HESAPLA: Ik1 = 230 / Empedans

    if (field === 'zxRx') {

        const zx = parseFloat(String(val || '').replace(',', '.'));

        if (!isNaN(zx) && zx > 0) {

            const ik1Val = 230 / zx;

            let formattedIk1 = '';

            if (ik1Val >= 100) {

                formattedIk1 = String(Math.round(ik1Val));

            } else if (ik1Val >= 10) {

                formattedIk1 = String(parseFloat(ik1Val.toFixed(1)));

            } else {

                formattedIk1 = String(parseFloat(ik1Val.toFixed(2)));

            }

            p.ik1Amp = formattedIk1;

            const elIk1 = document.getElementById(`pt_ik1_${pIdx}`);

            if (elIk1) elIk1.value = formattedIk1;

        } else if (val === '') {

            p.ik1Amp = '';

            const elIk1 = document.getElementById(`pt_ik1_${pIdx}`);

            if (elIk1) elIk1.value = '';

        }

    } else if (field !== 'ik1Amp' && p.zxRx && !p.ik1Amp) {

        // Eğer daha önce zx girilmiş ama ik1 boş kalmışsa tamamla

        const zx = parseFloat(String(p.zxRx).replace(',', '.'));

        if (!isNaN(zx) && zx > 0) {

            const ik1Val = 230 / zx;

            p.ik1Amp = ik1Val >= 100 ? String(Math.round(ik1Val)) : String(parseFloat(ik1Val.toFixed(1)));

            const elIk1 = document.getElementById(`pt_ik1_${pIdx}`);

            if (elIk1) elIk1.value = p.ik1Amp;

        }

    }



    // 3. Empedans (Zx) ve Zs Sınır varsa Uygunluk Notunu Otomatik Belirle

    const zxCheck = parseFloat(String(p.zxRx || '').replace(',', '.'));

    const zsCheck = parseFloat(String(p.zsRa || '').replace(',', '.'));

    if (!isNaN(zxCheck) && zxCheck > 0 && !isNaN(zsCheck) && zsCheck > 0) {

        if (zxCheck <= zsCheck) {

            p.result = 'Not-1'; // Uygun

        } else {

            // Sınır aşıldı: RCD aktifse Not-4, yoksa Not-2

            const hasRcd = (p.rcdSpec && p.rcdSpec.trim() && p.rcdSpec.trim() !== '-') || (p.rcdId && parseFloat(p.rcdId) > 0);

            p.result = hasRcd ? 'Not-4' : 'Not-2';

        }

        const elRes = document.getElementById(`pt_res_${pIdx}`);

        if (elRes && field !== 'result') elRes.value = p.result;

    }



    // Güncellenen alanı inputun kendisine de yaz (özellikle preset butonları için)

    if (field === 'rcdSpec') {

        const elRcd = document.getElementById(`pt_rcdSpec_${pIdx}`);

        if (elRcd) elRcd.value = val;

    }



    triggerAutoSave();

}



function setGroundingPointPresetIn(pIdx, inVal) {

    updateGroundingPointField(pIdx, 'inAmp', inVal);

    paintInspectionEditorUI();

}



// --- 13.2 SERİ SATIR ÇOĞALTICI (BATCH ROW GENERATOR) ---

function openBatchRowGeneratorModal() {

    openModal(

        '<i class="fa-solid fa-layer-group mr-2 text-sky-500"></i>Toplu Ölçüm Satırı Üretici',

        `

        <div class="space-y-3.5 text-xs">

            <div class="grid grid-cols-2 gap-2.5">

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Satır Sayısı</label>

                    <select id="batchRowCountInput" class="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs bg-white">

                        <option value="5">5 Adet Satır</option>

                        <option value="10" selected>10 Adet Satır</option>

                        <option value="15">15 Adet Satır</option>

                        <option value="20">20 Adet Satır</option>

                    </select>

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Pano / Linye Ön Adı</label>

                    <input type="text" id="batchPrefixInput" value="Linye" placeholder="Örn: Linye, Pano, Priz"

                        class="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs bg-white">

                </div>

            </div>

            <div class="grid grid-cols-2 gap-2.5">

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Varsayılan Sigorta (In)</label>

                    <select id="batchDefaultInInput" class="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs bg-white">

                        <option value="10">10 A</option>

                        <option value="16" selected>16 A</option>

                        <option value="20">20 A</option>

                        <option value="25">25 A</option>

                        <option value="32">32 A</option>

                    </select>

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Açma Eğrisi</label>

                    <select id="batchDefaultCurveInput" class="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs bg-white">

                        <option value="B">B Tipi</option>

                        <option value="C" selected>C Tipi</option>

                        <option value="D">D Tipi</option>

                    </select>

                </div>

            </div>

        </div>

        `,

        `

        <button onclick="closeModal()" class="px-3 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-lg">İptal</button>

        <button onclick="submitBatchRowGenerator()" class="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-lg active:scale-95 shadow-sm">

            <i class="fa-solid fa-plus mr-1"></i>Satırları Üret

        </button>

        `

    );

}



function submitBatchRowGenerator() {

    const count = parseInt(document.getElementById('batchRowCountInput')?.value || '10', 10);

    const prefix = document.getElementById('batchPrefixInput')?.value || 'Linye';

    const defIn = document.getElementById('batchDefaultInInput')?.value || '16';

    const defCurve = document.getElementById('batchDefaultCurveInput')?.value || 'C';



    const gd = AppState.currentFormData.grounding;

    if (!gd.points) gd.points = [];



    const startNum = gd.points.length + 1;

    const netType = (gd.details && gd.details.networkType) ? gd.details.networkType.trim().toUpperCase() : '';

    const isTN = netType.startsWith('TN');

    const voltageLimit = isTN ? 230 : 50;



    const inNum = parseFloat(defIn);

    let mult = defCurve === 'B' ? 5 : defCurve === 'C' ? 10 : 20;

    const ia = inNum * mult;

    const zsLimit = parseFloat((voltageLimit / ia).toFixed(2));



    for (let i = 0; i < count; i++) {

        gd.points.push({

            point: `${prefix} ${startNum + i}`,

            inAmp: defIn,

            curve: defCurve,

            iaAmp: String(ia),

            ik1Amp: '',

            zxRx: '',

            zsRa: String(zsLimit),

            rcdSpec: '',

            rcdId: '',

            rcdTd: '',

            result: ''

        });

    }



    triggerAutoSave();

    closeModal();

    paintInspectionEditorUI();

    showToast(`${count} adet yeni ölçüm satırı otomatik formüllerle üretildi!`);

}



// --- 13.3 ORTAK FİRMA VE CİHAZ SENKRONİZASYONU ---

function syncCompanyAndDevicesToAllReports() {

    const currentInsp = AppState.currentInspection;

    if (!currentInsp) return;

    const currentFd = AppState.currentFormData;

    if (!currentFd || !currentFd.companyInfo) return;



    OfflineDB.init();

    const woId = currentInsp.work_order_id;

    const targetInspections = (OfflineDB.state.inspections || []).filter(i => String(i.work_order_id) === String(woId));



    let updatedCount = 0;

    targetInspections.forEach(other => {

        if (String(other.id) !== String(currentInsp.id)) {

            const rawKey = `enlab_insp_${other.id}`;

            let otherFd = null;

            try {

                const stored = localStorage.getItem(rawKey);

                if (stored) otherFd = JSON.parse(stored);

            } catch (e) {}



            if (!otherFd) otherFd = {};

            if (!otherFd.companyInfo) otherFd.companyInfo = {};



            // Clone company info

            otherFd.companyInfo.firmName = currentFd.companyInfo.firmName;

            otherFd.companyInfo.address = currentFd.companyInfo.address;

            otherFd.companyInfo.sgkSicilNo = currentFd.companyInfo.sgkSicilNo;

            otherFd.companyInfo.isgKatipNo = currentFd.companyInfo.isgKatipNo;

            otherFd.companyInfo.inspectionDate = currentFd.companyInfo.inspectionDate;

            otherFd.companyInfo.nextDate = currentFd.companyInfo.nextDate;



            // Clone measuring devices if available

            if (currentFd.measuringDevices && currentFd.measuringDevices.length > 0) {

                otherFd.measuringDevices = JSON.parse(JSON.stringify(currentFd.measuringDevices));

                otherFd._devicesInitialized = true;

            }



            try {

                localStorage.setItem(rawKey, JSON.stringify(otherFd));

                updatedCount++;

            } catch (e) {}

        }

    });



    OfflineDB.save();

    showToast(`Firma ve cihaz bilgileri bu işteki diğer ${updatedCount} rapora başarıyla aktarıldı!`);

}



// --- 13.4 GEÇMİŞ RAPORU KLONLAMA ---

function cloneInspectionReport(sourceId, workOrderId) {

    if (!confirm('Bu raporu tüm ölçüm satırları ve ayarlarıyla klonlamak istediğinize emin misiniz?')) return;



    OfflineDB.init();

    const sourceInsp = (OfflineDB.state.inspections || []).find(i => String(i.id) === String(sourceId));

    if (!sourceInsp) return showToast('Kaynak rapor bulunamadı', 'error');



    const newId = String(Date.now() + Math.floor(Math.random() * 1000));

    const clonedInsp = JSON.parse(JSON.stringify(sourceInsp));

    clonedInsp.id = newId;

    clonedInsp.equipment_name = (clonedInsp.equipment_name || 'Rapor') + ' (Kopya)';

    clonedInsp.report_no = `TKM-26-02-${newId.slice(-5)}`;



    // Clone localStorage data

    try {

        const rawSource = localStorage.getItem(`enlab_insp_${sourceId}`);

        if (rawSource) {

            localStorage.setItem(`enlab_insp_${newId}`, rawSource);

        }

    } catch (e) {}



    OfflineDB.state.inspections.push(clonedInsp);

    OfflineDB.save();



    renderWorkOrderDetails(workOrderId);

    showToast('Rapor başarıyla klonlandı!');

}



// --- 13.5 GÖZLE KONTROL CANLI MADDE ARAMA ---

function filterVisualCheckQuestionsLive(query) {

    const qTrim = (query || '').toLowerCase().trim();

    const rows = document.querySelectorAll('#pageContent .space-y-4 > div, #pageContent .space-y-2 > div');

    rows.forEach(r => {

        if (!qTrim) {

            r.style.display = '';

            return;

        }

        const text = r.textContent.toLowerCase();

        if (text.includes(qTrim)) {

            r.style.display = '';

        } else {

            r.style.display = 'none';

        }

    });

}



window.updateGroundingPointField = updateGroundingPointField;

window.setGroundingPointPresetIn = setGroundingPointPresetIn;

window.openBatchRowGeneratorModal = openBatchRowGeneratorModal;

window.submitBatchRowGenerator = submitBatchRowGenerator;

window.syncCompanyAndDevicesToAllReports = syncCompanyAndDevicesToAllReports;

window.cloneInspectionReport = cloneInspectionReport;

window.filterVisualCheckQuestionsLive = filterVisualCheckQuestionsLive;





