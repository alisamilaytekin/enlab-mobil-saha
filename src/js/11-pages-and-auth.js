// ============================================================================
// HIZLI RAPOR - 11-PAGES-AND-AUTH.JS
// Açıklama: Kullanıcı Hesapları, Şirket Ayarları, Yedekleme ve Yardımcı Sayfalar
// Satır Aralığı: 15981 - 19624 (3644 satır)
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

                <div class="p-3.5 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl">

                    <div class="flex items-center gap-2.5 text-sky-950 font-bold text-xs mb-1">

                        <i class="fa-solid fa-circle-check text-sky-600 text-sm"></i>

                        <span>%100 Çevrimdışı & Yerel Koruma</span>

                    </div>

                    <p class="text-[11px] text-sky-900 leading-relaxed">

                        Tüm iş emirleriniz, elektrik muayene raporlarınız, ölçüm değerleriniz ve girdiğiniz özel uygunsuzluk cümleleri cihazınızın güvenli depolama alanında saklanmaktadır.

                    </p>

                </div>



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

                            <div class="text-left">

                                <div>Tek Tıkla Tam Yedek İndir (JSON)</div>

                                <div class="text-[10px] font-normal text-emerald-100">Tüm raporları ve uygunsuzluk hafızasını tek dosyada indirir</div>

                            </div>

                        </div>

                        <i class="fa-solid fa-chevron-right text-xs opacity-70"></i>

                    </button>



                    <label class="w-full p-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-between shadow-sm transition cursor-pointer">

                        <div class="flex items-center gap-2.5">

                            <i class="fa-solid fa-file-arrow-up text-base text-sky-400"></i>

                            <div class="text-left">

                                <div>Yedekten Geri Yükle (JSON İçe Aktar)</div>

                                <div class="text-[10px] font-normal text-slate-300">Daha önce indirilmiş bir yedeği sisteme aktarır</div>

                            </div>

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

            <p class="text-slate-600 leading-relaxed">

                Tek tıkla ardışık numaralandırılmış hazır ölçüm noktaları üretir ve formül hesaplamalarını otomatik uygular.

            </p>

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





// ============================================================================

// 14. ENLAB KULLANICI HESAP, ŞİFRE & KİMLİK YÖNETİM SİSTEMİ (OFFLINE-FIRST)

// ============================================================================



const AuthManager = {

    STORAGE_USERS_KEY: 'enlab_user_accounts_v1',

    STORAGE_SESSION_KEY: 'enlab_current_user_id',



    getUsers() {

        try {

            const raw = localStorage.getItem(this.STORAGE_USERS_KEY);

            if (raw) {

                const list = JSON.parse(raw);

                if (Array.isArray(list) && list.length > 0) return list;

            }

        } catch (e) {}



        // Standart Varsayılan Mühendis Hesabı

        const defaultUsers = [

            {

                id: 'usr_alisamil',

                username: 'alisamil',

                password: '123',

                fullName: 'Ali Şamil Aytekin',

                title: 'Elektrik Mühendisi',

                ministryRegNo: 'K2023224376',

                diplomaNoDate: '249538 / 28.09.2022',

                emoNo: '64215',

                createdAt: '2026-01-01'

            }

        ];

        this.saveUsers(defaultUsers);

        return defaultUsers;

    },



    saveUsers(users) {

        try {

            localStorage.setItem(this.STORAGE_USERS_KEY, JSON.stringify(users));

        } catch (e) {}

    },



    getCurrentUser() {

        const users = this.getUsers();

        const curId = localStorage.getItem(this.STORAGE_SESSION_KEY);

        if (curId) {

            const found = users.find(u => String(u.id) === String(curId));

            if (found) return found;

        }

        return null;

    },



    login(username, password) {

        const users = this.getUsers();

        const uTrim = String(username || '').trim().toLowerCase();

        const pTrim = String(password || '').trim();



        const user = users.find(u => 

            u.username.trim().toLowerCase() === uTrim && 

            String(u.password).trim() === pTrim

        );



        if (user) {

            localStorage.setItem(this.STORAGE_SESSION_KEY, user.id);

            updateHeaderUserWidget();

            return { success: true, user };

        }

        return { success: false, message: 'Kullanıcı adı veya şifre hatalı!' };

    },



    register(data) {

        const users = this.getUsers();

        const uTrim = String(data.username || '').trim().toLowerCase();



        if (!data.fullName || !data.username || !data.password) {

            return { success: false, message: 'Lütfen Ad Soyad, Kullanıcı Adı ve Şifre alanlarını doldurun.' };

        }



        const exists = users.find(u => u.username.trim().toLowerCase() === uTrim);

        if (exists) {

            return { success: false, message: 'Bu kullanıcı adı zaten kullanılmaktadır!' };

        }



        const newUser = {

            id: 'usr_' + Date.now(),

            username: String(data.username).trim(),

            password: String(data.password).trim(),

            fullName: String(data.fullName).trim(),

            title: String(data.title || 'Elektrik Mühendisi').trim(),

            ministryRegNo: String(data.ministryRegNo || '').trim(),

            diplomaNoDate: String(data.diplomaNoDate || '').trim(),

            emoNo: String(data.emoNo || '').trim(),

            createdAt: new Date().toISOString()

        };



        users.push(newUser);

        this.saveUsers(users);

        localStorage.setItem(this.STORAGE_SESSION_KEY, newUser.id);

        updateHeaderUserWidget();

        return { success: true, user: newUser };

    },



    updateProfile(userId, fields) {

        const users = this.getUsers();

        const idx = users.findIndex(u => String(u.id) === String(userId));

        if (idx >= 0) {

            Object.assign(users[idx], fields);

            this.saveUsers(users);

            updateHeaderUserWidget();

            return { success: true, user: users[idx] };

        }

        return { success: false, message: 'Kullanıcı bulunamadı.' };

    },



    logout() {

        localStorage.removeItem(this.STORAGE_SESSION_KEY);

        updateHeaderUserWidget();

        const dock = document.getElementById('bottomActionDock');

        if (dock) dock.classList.add('hidden');

        renderAuthScreen('login');

        showToast('Oturum kapatıldı.');

    }

};



function updateHeaderUserWidget() {

    const el = document.getElementById('headerUserWidget');

    if (!el) return;

    const cur = AuthManager.getCurrentUser();

    if (cur) {

        const isSettings = AppState.currentRoute === 'settings';

        el.innerHTML = `

            <button onclick="navigateTo('${isSettings ? 'home' : 'settings'}')"

                class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"

                title="${isSettings ? 'Ana Sayfaya Dön' : 'Uygulama, Şirket ve Rapor Ayarları'}">

                <i class="fa-solid ${isSettings ? 'fa-arrow-left text-sky-400' : 'fa-gear text-amber-400'}"></i>

                <span>${isSettings ? 'Geri' : 'Ayarlar'}</span>

            </button>

        `;

    } else {

        el.innerHTML = `

            <button onclick="renderAuthScreen('login')" class="px-2 py-1 rounded-lg bg-sky-600 text-[11px] hover:bg-sky-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1 transition">

                <i class="fa-solid fa-right-to-bracket"></i>

                <span>Giriş</span>

            </button>

        `;

    }

}



function renderAuthScreen(activeTab = 'login') {

    const container = document.getElementById('pageContent');

    if (!container) return;

    container.scrollTop = 0;



    const dock = document.getElementById('bottomActionDock');

    if (dock) dock.classList.add('hidden');



    const users = AuthManager.getUsers();



    container.innerHTML = `

        <div class="max-w-md mx-auto my-4 sm:my-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden modal-sheet-animate">

            <!-- BRAND HEADER -->

            <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 text-center">

                <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 text-xl font-black shadow-lg mb-2">

                    <i class="fa-solid fa-bolt"></i>

                </div>

                <h1 class="font-black text-base tracking-tight">Hızlı Rapor</h1>

                <p class="text-xs text-slate-300 mt-0.5">Saha Muayene & Periyodik Kontrol Sistemi</p>

                <div class="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold">

                    <i class="fa-solid fa-shield-halved"></i>

                    <span>%100 Çevrimdışı Yetkili Personel Sistemi</span>

                </div>

            </div>



            <!-- TABS -->

            <div class="p-4 space-y-4">

                <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1 text-xs font-bold">

                    <button onclick="renderAuthScreen('login')"

                        class="py-2.5 rounded-lg transition ${activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">

                        <i class="fa-solid fa-right-to-bracket mr-1"></i> Giriş Yap

                    </button>

                    <button onclick="renderAuthScreen('register')"

                        class="py-2.5 rounded-lg transition ${activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">

                        <i class="fa-solid fa-user-plus mr-1"></i> Yeni Hesap Oluştur

                    </button>

                </div>



                ${activeTab === 'login' ? renderLoginFormHtml(users) : renderRegisterFormHtml()}

            </div>

        </div>

    `;

}



function renderLoginFormHtml(users) {

    return `

        <div class="space-y-3.5 text-xs">

            ${users.length > 0 ? `

                <div>

                    <label class="block font-bold text-slate-700 mb-1 flex items-center justify-between">

                        <span>Kayıtlı Mühendis / Personel Seçin:</span>

                        <span class="text-[10px] text-slate-400 font-normal">Hızlı doldurur</span>

                    </label>

                    <div class="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">

                        ${users.map(u => `

                            <button type="button" onclick="selectQuickUser('${escapeForJs(u.username)}')"

                                class="p-2 rounded-lg bg-white border border-slate-200 hover:border-sky-500 text-left flex items-center justify-between transition active:scale-98">

                                <div class="min-w-0">

                                    <div class="font-bold text-slate-900 truncate">${escapeHtml(u.fullName)}</div>

                                    <div class="text-[10px] text-slate-500 truncate">${escapeHtml(u.title || 'Mühendis')}</div>

                                </div>

                                <span class="text-[10px] text-sky-700 font-mono font-bold bg-sky-50 px-1.5 py-0.5 rounded">@${escapeHtml(u.username)}</span>

                            </button>

                        `).join('')}

                    </div>

                </div>

            ` : ''}



            <div>

                <label class="block font-bold text-slate-700 mb-1">Kullanıcı Adı</label>

                <input type="text" id="loginUsername" placeholder="Kullanıcı adınızı girin"

                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:border-sky-500 focus:outline-none bg-white">

            </div>



            <div>

                <label class="block font-bold text-slate-700 mb-1">Şifre</label>

                <div class="relative">

                    <input type="password" id="loginPassword" placeholder="••••••••"

                        onkeydown="if(event.key==='Enter') handleLoginSubmit()"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 pr-10 text-xs font-semibold focus:border-sky-500 focus:outline-none bg-white">

                    <button type="button" onclick="togglePasswordVisibility('loginPassword', this)"

                        class="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5 text-xs">

                        <i class="fa-solid fa-eye"></i>

                    </button>

                </div>

                <p class="text-[10px] text-slate-400 mt-1">Varsayılan demo şifresi: <strong>123</strong></p>

            </div>



            <button type="button" onclick="handleLoginSubmit()"

                class="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5">

                <i class="fa-solid fa-right-to-bracket"></i>

                <span>Giriş Yap ve Raporlara Başla</span>

            </button>

        </div>

    `;

}



function renderRegisterFormHtml() {

    return `

        <div class="space-y-3 text-xs">

            <p class="text-slate-500 text-[11px] leading-relaxed">

                Aşağıdaki bilgiler oluşturacağınız resmi periyodik kontrol raporlarının <strong>"Muayene Personeli"</strong> ve onay bölümlerinde otomatik olarak yer alacaktır.

            </p>



            <div>

                <label class="block font-bold text-slate-700 mb-0.5">Adı Soyadı <span class="text-rose-500">*</span></label>

                <input type="text" id="regFullName" placeholder="Örn: Yusuf Kılıç"

                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 bg-white">

            </div>



            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Meslek / Unvan</label>

                    <select id="regTitle" class="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold bg-white">

                        <option value="Elektrik Mühendisi">Elektrik Mühendisi</option>

                        <option value="Elektrik-Elektronik Mühendisi">Elektrik-Elektronik Mühendisi</option>

                        <option value="Elektrik Teknikeri">Elektrik Teknikeri</option>

                        <option value="Teknik Öğretmen">Teknik Öğretmen</option>

                        <option value="Muayene Uzmanı">Muayene Uzmanı</option>

                    </select>

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Bakanlık Kayıt No</label>

                    <input type="text" id="regMinistry" placeholder="Örn: K2024119876"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-white">

                </div>

            </div>



            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Diploma No / Mezuniyet</label>

                    <input type="text" id="regDiploma" placeholder="Örn: 249538 / 28.09.2022"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-white">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Oda / EMO Sicil No</label>

                    <input type="text" id="regEmo" placeholder="Örn: 64215"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-white">

                </div>

            </div>



            <div class="pt-1 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Kullanıcı Adı <span class="text-rose-500">*</span></label>

                    <input type="text" id="regUsername" placeholder="Örn: yusuf"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold bg-white">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Şifre <span class="text-rose-500">*</span></label>

                    <input type="password" id="regPassword" placeholder="Şifrenizi belirleyin"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white">

                </div>

            </div>



            <button type="button" onclick="handleRegisterSubmit()"

                class="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5">

                <i class="fa-solid fa-user-check"></i>

                <span>Hesabı Oluştur ve Giriş Yap</span>

            </button>

        </div>

    `;

}



function selectQuickUser(username) {

    const input = document.getElementById('loginUsername');

    if (input) {

        input.value = username;

        document.getElementById('loginPassword')?.focus();

    }

}



function togglePasswordVisibility(inputId, btn) {

    const el = document.getElementById(inputId);

    if (!el) return;

    if (el.type === 'password') {

        el.type = 'text';

        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

    } else {

        el.type = 'password';

        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';

    }

}



function handleLoginSubmit() {

    const u = document.getElementById('loginUsername')?.value;

    const p = document.getElementById('loginPassword')?.value;

    if (!u || !p) return showToast('Lütfen kullanıcı adı ve şifre girin', 'warning');



    const res = AuthManager.login(u, p);

    if (res.success) {

        showToast(`Hoş geldiniz, ${res.user.fullName}!`);

        navigateTo('home');

    } else {

        showToast(res.message, 'error');

    }

}



function handleRegisterSubmit() {

    const fullName = document.getElementById('regFullName')?.value;

    const title = document.getElementById('regTitle')?.value;

    const ministryRegNo = document.getElementById('regMinistry')?.value;

    const diplomaNoDate = document.getElementById('regDiploma')?.value;

    const emoNo = document.getElementById('regEmo')?.value;

    const username = document.getElementById('regUsername')?.value;

    const password = document.getElementById('regPassword')?.value;



    const res = AuthManager.register({

        fullName, title, ministryRegNo, diplomaNoDate, emoNo, username, password

    });



    if (res.success) {

        showToast(`Hesabınız oluşturuldu! Hoş geldiniz, ${res.user.fullName}`);

        navigateTo('home');

    } else {

        showToast(res.message, 'error');

    }

}



// --- KULLANICI PROFİL DÜZENLEME & ÇIKIŞ MODALİ ---

function openUserProfileModal() {

    const user = AuthManager.getCurrentUser();

    if (!user) return renderAuthScreen('login');



    openModal(

        '<i class="fa-solid fa-user-gear mr-2 text-amber-500"></i>Yetkili Muayene Personeli Profili',

        `

        <div class="space-y-3 text-xs">

            <div class="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex items-center justify-between">

                <div class="flex items-center gap-2.5">

                    <div class="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center">

                        <i class="fa-solid fa-user-tie"></i>

                    </div>

                    <div>

                        <div class="font-bold text-sm">${escapeHtml(user.fullName)}</div>

                        <div class="text-[11px] text-slate-300">@${escapeHtml(user.username)} · ${escapeHtml(user.title || 'Mühendis')}</div>

                    </div>

                </div>

                <button type="button" onclick="closeModal(); AuthManager.logout();"

                    class="px-2.5 py-1.5 bg-rose-600/80 hover:bg-rose-600 active:scale-95 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 transition">

                    <i class="fa-solid fa-power-off"></i>

                    <span>Çıkış Yap</span>

                </button>

            </div>



            <div class="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-[11px] leading-relaxed">

                Bu bilgiler resmi A4 PDF raporlarının <strong>"Muayene Personeli"</strong> ve onay bölümlerinde basılmaktadır. İhtiyaç halinde buradan güncelleyebilirsiniz.

            </div>



            <div>

                <label class="block font-bold text-slate-700 mb-0.5">Adı Soyadı</label>

                <input type="text" id="profFullName" value="${escapeHtml(user.fullName || '')}"

                    class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 bg-white">

            </div>



            <div class="grid grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Meslek / Unvan</label>

                    <input type="text" id="profTitle" value="${escapeHtml(user.title || 'Elektrik Mühendisi')}"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold bg-white">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Bakanlık Kayıt No</label>

                    <input type="text" id="profMinistry" value="${escapeHtml(user.ministryRegNo || '')}"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                </div>

            </div>



            <div class="grid grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Diploma No / Tarih</label>

                    <input type="text" id="profDiploma" value="${escapeHtml(user.diplomaNoDate || '')}"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">EMO / Oda Sicil No</label>

                    <input type="text" id="profEmo" value="${escapeHtml(user.emoNo || '')}"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                </div>

            </div>



            <div>

                <label class="block font-bold text-slate-700 mb-0.5">Şifre Değiştir (İsteğe Bağlı)</label>

                <input type="password" id="profPassword" value="${escapeHtml(user.password || '')}"

                    class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

            </div>

        </div>

        `,

        `

        <button onclick="closeModal()" class="px-3 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-lg">Kapat</button>

        <button onclick="saveUserProfileSubmit('${user.id}')" class="px-4 py-2 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-lg active:scale-95 shadow-sm">

            <i class="fa-solid fa-floppy-disk mr-1"></i>Bilgileri Kaydet

        </button>

        `

    );

}



function saveUserProfileSubmit(userId) {

    const fullName = document.getElementById('profFullName')?.value;

    const title = document.getElementById('profTitle')?.value;

    const ministryRegNo = document.getElementById('profMinistry')?.value;

    const diplomaNoDate = document.getElementById('profDiploma')?.value;

    const emoNo = document.getElementById('profEmo')?.value;

    const password = document.getElementById('profPassword')?.value;



    const res = AuthManager.updateProfile(userId, {

        fullName, title, ministryRegNo, diplomaNoDate, emoNo, password

    });



    if (res.success) {

        showToast('Profil ve rapor onay bilgileriniz güncellendi!');

        closeModal();

        if (AppState.currentRoute === 'inspection-complete') {

            paintInspectionEditorUI();

        }

    } else {

        showToast(res.message, 'error');

    }

}



window.AuthManager = AuthManager;

window.renderAuthScreen = renderAuthScreen;

window.handleLoginSubmit = handleLoginSubmit;

window.handleRegisterSubmit = handleRegisterSubmit;

window.selectQuickUser = selectQuickUser;

window.togglePasswordVisibility = togglePasswordVisibility;

window.openUserProfileModal = openUserProfileModal;

window.saveUserProfileSubmit = saveUserProfileSubmit;

window.updateHeaderUserWidget = updateHeaderUserWidget;



// ============================================================================

// COMPANY & REPORT BRANDING UI MODAL HANDLERS

// ============================================================================

function openCompanySettingsModal() {

    const s = CompanySettingsManager.getSettings();

    const currentLogo = CompanySettingsManager.getLogoSrc();

    const currentTurkak = CompanySettingsManager.getTurkakLogoSrc();

    

    window._pendingBrandLogos = {

        companyLogo: s.customCompanyLogo,

        turkakLogo: s.customTurkakLogo,

        clearedCompanyLogo: false,

        clearedTurkakLogo: false

    };



    openModal(

        '<i class="fa-solid fa-building-shield mr-2 text-sky-400"></i>Şirket, Logo & Rapor Şablon Ayarları',

        `

        <div class="space-y-4 text-xs">

            <div class="p-3 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl text-sky-900 leading-relaxed">

                Bu alandan şirketinizin <strong>logosunu, adını, akreditasyon bilgilerini ve rapor kodlarını</strong> özelleştirebilirsiniz. Uygulama başka şirketlere verilebilir ve tüm resmi A4 PDF çıktıları buradaki ayarlara göre oluşturulur.

            </div>



            <!-- LOGO AYARLARI -->

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">

                <div class="font-bold text-slate-800 text-xs flex items-center gap-1.5">

                    <i class="fa-solid fa-image text-amber-500"></i>

                    <span>Şirket Kurumsal Logosu</span>

                </div>

                

                <div class="flex items-center gap-4">

                    <div class="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white p-1.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">

                        <img id="previewCompanyLogo" src="${currentLogo}" alt="Logo" class="max-w-full max-h-full object-contain">

                    </div>

                    <div class="space-y-1.5 flex-1 min-w-0">

                        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-lg font-bold text-[11px] cursor-pointer transition shadow-xs">

                            <i class="fa-solid fa-cloud-arrow-up"></i>

                            <span>Yeni Logo Yükle (PNG/JPG)</span>

                            <input type="file" accept="image/*" class="hidden" onchange="handleBrandLogoSelected(this, 'company')">

                        </label>

                        <button type="button" onclick="revertBrandLogo('company')" class="block text-[11px] text-slate-500 hover:text-rose-600 font-semibold underline">

                            Varsayılan Logoya Dön

                        </button>

                        <div class="text-[10px] text-slate-400">Önerilen: Şeffaf arka planlı kare veya yatay logo</div>

                    </div>

                </div>

            </div>



            <!-- FİRMA RESMİ BİLGİLERİ -->

            <div class="space-y-2.5">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Firma Tam Ticari Unvanı (Rapor Başlığı) *</label>

                    <input type="text" id="cfgCompanyFullName" value="${escapeHtml(s.companyFullName)}"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 bg-white">

                </div>



                <div class="grid grid-cols-2 gap-2">

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Firma Kısa Adı (Üst Başlık)</label>

                        <input type="text" id="cfgCompanyShortName" value="${escapeHtml(s.companyShortName)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold bg-white">

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Adres / Şehir</label>

                        <input type="text" id="cfgCompanyAddress" value="${escapeHtml(s.companyAddress)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">

                    </div>

                </div>



                <div class="grid grid-cols-2 gap-2">

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Telefon / Faks</label>

                        <input type="text" id="cfgCompanyPhone" value="${escapeHtml(s.companyPhone)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">E-Posta & Web</label>

                        <input type="text" id="cfgCompanyWeb" value="${escapeHtml(s.companyWeb)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">

                    </div>

                </div>

            </div>



            <!-- AKREDİTASYON (TÜRKAK VB.) AYARLARI -->

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">

                <div class="flex items-center justify-between">

                    <label class="font-bold text-slate-800 text-xs flex items-center gap-2 cursor-pointer">

                        <input type="checkbox" id="cfgShowTurkak" ${s.showTurkakLogo ? 'checked' : ''} class="w-4 h-4 accent-sky-600 rounded">

                        <span>Raporda Akreditasyon Logosu Gösterilsin</span>

                    </label>

                    <span class="text-[10px] text-slate-400">TÜRKAK vb.</span>

                </div>



                <div class="flex items-center gap-4 pt-1">

                    <div class="w-16 h-20 rounded-xl border border-slate-300 bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">

                        <img id="previewTurkakLogo" src="${currentTurkak}" alt="TÜRKAK" class="max-w-full max-h-full object-contain">

                    </div>

                    <div class="space-y-1.5 flex-1 min-w-0">

                        <label class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 rounded-lg font-bold text-[10px] cursor-pointer transition">

                            <i class="fa-solid fa-cloud-arrow-up"></i>

                            <span>Özel Akreditasyon Logosu</span>

                            <input type="file" accept="image/*" class="hidden" onchange="handleBrandLogoSelected(this, 'turkak')">

                        </label>

                        <button type="button" onclick="revertBrandLogo('turkak')" class="block text-[10px] text-slate-500 hover:text-rose-600 underline">

                            Varsayılan TÜRKAK Logosuna Dön

                        </button>

                    </div>

                </div>



                <div class="grid grid-cols-2 gap-2 pt-1">

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Akreditasyon No</label>

                        <input type="text" id="cfgAccreditationNo" value="${escapeHtml(s.accreditationNo)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Standart Kodu</label>

                        <input type="text" id="cfgAccreditationStandard" value="${escapeHtml(s.accreditationStandard)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                    </div>

                </div>

            </div>



            <!-- RAPOR KODLARI VE DİPNOT FERAGATNAME -->

            <div class="space-y-2.5">

                <div class="grid grid-cols-2 gap-2">

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Rapor No Ön Eki</label>

                        <input type="text" id="cfgReportNoPrefix" value="${escapeHtml(s.reportNoPrefix)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white" placeholder="Örn: TKM-">

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-0.5">Form Revizyon Bilgisi</label>

                        <input type="text" id="cfgDefaultRevision" value="${escapeHtml(s.defaultRevisionInfo)}"

                            class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                    </div>

                </div>



                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Rapor Altı Yasal Uyarı (Feragatname Metni)</label>

                    <textarea id="cfgFooterDisclaimer" rows="3"

                        class="w-full border border-slate-300 rounded-lg p-2 text-slate-800 text-[11px] leading-relaxed bg-white focus:outline-none focus:border-sky-500">${escapeHtml(s.footerDisclaimer)}</textarea>

                    <div class="text-[10px] text-slate-400 mt-0.5">{COMPANY_NAME} etiketi otomatik olarak şirket tam adınız ile değiştirilir.</div>

                </div>

            </div>

        </div>

        `,

        `

        <button type="button" onclick="resetCompanySettingsSubmit()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-lg transition mr-auto">

            <i class="fa-solid fa-rotate-left mr-1"></i>Varsayılana Sıfırla

        </button>

        <button type="button" onclick="closeModal()" class="px-3.5 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-lg">İptal</button>

        <button type="button" onclick="saveCompanySettingsSubmit()" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition">

            <i class="fa-solid fa-floppy-disk mr-1"></i>Ayarları Kaydet

        </button>

        `

    );

}



function handleBrandLogoSelected(fileInput, type) {

    const file = fileInput.files && fileInput.files[0];

    if (!file) return;



    compressLogoImage(file, 340, function(dataUrl) {

        if (!window._pendingBrandLogos) window._pendingBrandLogos = {};

        if (type === 'company') {

            window._pendingBrandLogos.companyLogo = dataUrl;

            window._pendingBrandLogos.clearedCompanyLogo = false;

            const preview = document.getElementById('previewCompanyLogo');

            if (preview) preview.src = dataUrl;

            showToast('Şirket logosu seçildi');

        } else if (type === 'turkak') {

            window._pendingBrandLogos.turkakLogo = dataUrl;

            window._pendingBrandLogos.clearedTurkakLogo = false;

            const preview = document.getElementById('previewTurkakLogo');

            if (preview) preview.src = dataUrl;

            showToast('Akreditasyon logosu seçildi');

        }

    });

}



function revertBrandLogo(type) {

    if (!window._pendingBrandLogos) window._pendingBrandLogos = {};

    if (type === 'company') {

        window._pendingBrandLogos.companyLogo = null;

        window._pendingBrandLogos.clearedCompanyLogo = true;

        const preview = document.getElementById('previewCompanyLogo');

        if (preview) preview.src = 'assets/tekkomer_logo.png';

        showToast('Varsayılan şirket logosu ayarlandı');

    } else if (type === 'turkak') {

        window._pendingBrandLogos.turkakLogo = null;

        window._pendingBrandLogos.clearedTurkakLogo = true;

        const preview = document.getElementById('previewTurkakLogo');

        if (preview) preview.src = 'assets/turkak_logo.jpg';

        showToast('Varsayılan TÜRKAK logosu ayarlandı');

    }

}



function saveCompanySettingsSubmit() {

    const nameEl = document.getElementById('cfgCompanyFullName');

    const shortEl = document.getElementById('cfgCompanyShortName');

    const addrEl = document.getElementById('cfgCompanyAddress');

    const phoneEl = document.getElementById('cfgCompanyPhone');

    const webEl = document.getElementById('cfgCompanyWeb');

    const showTurkakEl = document.getElementById('cfgShowTurkak');

    const accNoEl = document.getElementById('cfgAccreditationNo');

    const accStdEl = document.getElementById('cfgAccreditationStandard');

    const repPrefixEl = document.getElementById('cfgReportNoPrefix');

    const revInfoEl = document.getElementById('cfgDefaultRevision');

    const discEl = document.getElementById('cfgFooterDisclaimer');



    const updateObj = {

        companyFullName: (nameEl ? nameEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyFullName,

        companyShortName: (shortEl ? shortEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyShortName,

        companyAddress: (addrEl ? addrEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyAddress,

        companyPhone: (phoneEl ? phoneEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyPhone,

        companyWeb: (webEl ? webEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.companyWeb,

        showTurkakLogo: showTurkakEl ? showTurkakEl.checked : true,

        accreditationNo: (accNoEl ? accNoEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.accreditationNo,

        accreditationStandard: (accStdEl ? accStdEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.accreditationStandard,

        reportNoPrefix: (repPrefixEl ? repPrefixEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.reportNoPrefix,

        defaultRevisionInfo: (revInfoEl ? revInfoEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.defaultRevisionInfo,

        footerDisclaimer: (discEl ? discEl.value.trim() : '') || DEFAULT_COMPANY_BRANDING.footerDisclaimer

    };



    if (window._pendingBrandLogos) {

        if (window._pendingBrandLogos.clearedCompanyLogo) {

            updateObj.customCompanyLogo = null;

        } else if (window._pendingBrandLogos.companyLogo) {

            updateObj.customCompanyLogo = window._pendingBrandLogos.companyLogo;

        }



        if (window._pendingBrandLogos.clearedTurkakLogo) {

            updateObj.customTurkakLogo = null;

        } else if (window._pendingBrandLogos.turkakLogo) {

            updateObj.customTurkakLogo = window._pendingBrandLogos.turkakLogo;

        }

    }



    const res = CompanySettingsManager.saveSettings(updateObj);

    if (res.success) {

        closeModal();

        showToast('Şirket ve rapor ayarları güncellendi!');

        if (AppState.currentRoute === 'home') {

            renderHome();

        } else if (AppState.currentRoute === 'settings' && typeof renderSettingsPage === 'function') {

            renderSettingsPage();

        }

    } else {

        showToast(res.message, 'error');

    }

}



function resetCompanySettingsSubmit() {

    if (!confirm('Tüm şirket, logo ve rapor kodlarını varsayılan ayarlara sıfırlamak istediğinize emin misiniz?')) return;

    CompanySettingsManager.resetToDefault();

    closeModal();

    showToast('Tüm ayarlar varsayılana sıfırlandı.');

    if (AppState.currentRoute === 'home') {

        renderHome();

    } else if (AppState.currentRoute === 'settings' && typeof renderSettingsPage === 'function') {

        renderSettingsPage();

    }

}



window.CompanySettingsManager = CompanySettingsManager;

window.compressLogoImage = compressLogoImage;

window.openCompanySettingsModal = openCompanySettingsModal;

window.handleBrandLogoSelected = handleBrandLogoSelected;

window.revertBrandLogo = revertBrandLogo;

window.saveCompanySettingsSubmit = saveCompanySettingsSubmit;

window.resetCompanySettingsSubmit = resetCompanySettingsSubmit;

window.LinyeMemoryManager = LinyeMemoryManager;

window.COMMON_LINYE_SUGGESTIONS = COMMON_LINYE_SUGGESTIONS;

window.renderLinyeDropdownItems = renderLinyeDropdownItems;

window.handleLinyeInputFocus = handleLinyeInputFocus;

window.handleLinyeInputType = handleLinyeInputType;

window.handleLinyeInputBlur = handleLinyeInputBlur;

window.selectLinyeSuggestion = selectLinyeSuggestion;

window.updateGroundingNetworkType = updateGroundingNetworkType;

window.isGroundingPointExpanded = isGroundingPointExpanded;

window.toggleGroundingPointAccordion = toggleGroundingPointAccordion;

window.setAllGroundingPointsExpanded = setAllGroundingPointsExpanded;

window.setGroundingPointBreakerPreset = setGroundingPointBreakerPreset;

window.undoDeleteGroundingPointRow = undoDeleteGroundingPointRow;





// ============================================================================

// MERKEZİ AYARLAR SEKME SAYFASI (Çevrimdışı Çoklu Şirket, Profil, Rapor Kodları & Yedek)

// ============================================================================

async function renderSettingsPage() {

    const container = document.getElementById('pageContent');

    if (!container) return;

    container.scrollTop = 0;



    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;

    const logoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getLogoSrc() : 'assets/tekkomer_logo.png';



    OfflineDB.init();

    const db = OfflineDB.state || {};

    const workOrderCount = (db.workOrders || []).length;

    const inspectionCount = (db.inspections || []).length;



    container.innerHTML = `

        <div class="max-w-2xl mx-auto space-y-2.5 pb-8">

            <!-- 1. ÜST BAŞLIK VE GERİ BUTONU -->

            <div class="card-craft-white p-2.5 flex items-center justify-between gap-2">

                <div class="flex items-center gap-2.5 min-w-0">

                    <button onclick="navigateTo('home')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl font-bold text-xs shrink-0 transition border border-slate-200">

                        <i class="fa-solid fa-arrow-left mr-1"></i>Ana Sayfa

                    </button>

                    <div class="min-w-0">

                        <h1 class="font-bold text-slate-900 text-sm sm:text-base truncate flex items-center gap-2">

                            <i class="fa-solid fa-sliders text-sky-600"></i>

                            <span>Uygulama & Şirket Ayarları</span>

                        </h1>

                    </div>

                </div>

                <span class="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-bold shrink-0">

                    %100 Çevrimdışı

                </span>

            </div>



            <!-- 2. MUAYENE PERSONELİ & PROFİL KARTI -->

            <div class="card-craft-dark text-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-700/60 pb-2">

                    <div class="text-xs font-bold text-amber-400 flex items-center gap-1.5">

                        <i class="fa-solid fa-user-shield"></i>

                        <span>Muayene Personeli & E-İmza Profili</span>

                    </div>

                    <span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">

                        Aktif Personel

                    </span>

                </div>



                <div class="flex items-center gap-3">

                    <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-sm">

                        <i class="fa-solid fa-user-tie"></i>

                    </div>

                    <div class="flex-1 min-w-0">

                        <div class="font-bold text-base text-white truncate">

                            ${curUser ? escapeHtml(curUser.fullName) : 'Muayene Personeli Tanımsız'}

                        </div>

                        <div class="text-xs text-slate-300 mt-0.5 truncate">

                            ${curUser ? `${escapeHtml(curUser.title || 'Elektrik Mühendisi')} · Oda Sicil: <span class="text-amber-300 font-mono font-bold">${escapeHtml(curUser.emoNo || '-')}</span>` : ''}

                        </div>

                        <div class="text-[11px] text-slate-400 mt-0.5 truncate">

                            ${curUser && curUser.ministryRegNo ? `Bakanlık Sicil: ${escapeHtml(curUser.ministryRegNo)}` : 'Raporlara imza atacak personel'}

                        </div>

                    </div>

                </div>



                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/60">

                    <button onclick="openUserProfileModal()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 border border-slate-600/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs">

                        <i class="fa-solid fa-user-pen text-amber-400"></i>

                        <span>Profilimi Düzenle</span>

                    </button>

                    <button onclick="AuthManager.logout()" class="w-full py-2.5 bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm">

                        <i class="fa-solid fa-arrow-right-from-bracket"></i>

                        <span>Kullanıcı Değiştir</span>

                    </button>

                </div>

            </div>



            <!-- 2B. KİŞİSEL ÖLÇÜM CİHAZLARI (ÜZERİME ALINANLAR) -->

            ${typeof MeasuringDevicesManager !== 'undefined' ? MeasuringDevicesManager.renderSettingsCardHtml() : ''}



            <!-- 3. ŞİRKET & KURUMSAL LOGO YÖNETİMİ (ÇOKLU ŞİRKET / WHITE-LABEL) -->

            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-building text-sky-600"></i>

                        <span>Şirket & Marka Bilgileri (Çoklu Şirket)</span>

                    </div>

                    <span class="text-[10px] text-slate-400">PDF Rapor Başlığı</span>

                </div>



                <div class="flex items-start gap-3.5 bg-slate-50 border border-slate-200/80 p-3 rounded-xl">

                    <div class="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">

                        <img src="${logoSrc}" alt="Şirket Logosu" class="max-w-full max-h-full object-contain">

                    </div>

                    <div class="flex-1 min-w-0">

                        <div class="font-bold text-xs text-slate-900 leading-snug truncate">

                            ${escapeHtml(branding.companyFullName)}

                        </div>

                        <div class="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">

                            <span>Kısa Ad: <strong class="text-slate-700">${escapeHtml(branding.companyShortName)}</strong></span>

                            ${branding.showTurkakLogo ? '<span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]"><i class="fa-solid fa-certificate text-[10px]"></i> Akredite</span>' : '<span class="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">Özel Şablon</span>'}

                        </div>

                    </div>

                </div>



                <button onclick="openCompanySettingsModal()" class="w-full py-2.5 btn-craft-primary active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition">

                    <i class="fa-solid fa-pen-nib"></i>

                    <span>Şirket Adı, Logo ve Akreditasyonu Düzenle</span>

                </button>

            </div>



            <!-- 4. RAPOR KODLARI & TEST CİHAZI VARSAYILANLARI -->

            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-file-invoice text-emerald-600"></i>

                        <span>Rapor Kodları & Test Cihazları</span>

                    </div>

                    <span class="text-[10px] text-slate-400">Otomatik Doldurma</span>

                </div>



                <div class="grid grid-cols-2 gap-2 text-xs">

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-[10px] text-slate-500 font-bold">Rapor No Ön Eki</div>

                        <div class="font-mono font-bold text-slate-800 text-sm mt-0.5">${escapeHtml(branding.reportNoPrefix || 'ENL-')}</div>

                    </div>

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-[10px] text-slate-500 font-bold">Revizyon Formatı</div>

                        <div class="font-mono font-bold text-slate-800 text-xs mt-0.5 truncate">${escapeHtml(branding.defaultRevisionInfo || 'REV.00')}</div>

                    </div>

                </div>



                <button onclick="openUserSettingsModal()" class="w-full py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition">

                    <i class="fa-solid fa-screwdriver-wrench text-slate-600"></i>

                    <span>Mühendis Unvanı & Hızlı Cihaz Ayarları</span>

                </button>

            </div>



            <!-- 4B. BULUT MÜŞTERİ PORTALI (OTOMATİK GÖNDERİM & ŞİRKET ÖN EKİ) -->

            ${(() => {
                const pCfg = (typeof CloudPortal !== 'undefined' && CloudPortal.getConfig) ? CloudPortal.getConfig() : { portalUrl: 'https://hizli-rapor-portal.vercel.app', customPortalUrl: '', isCustomUrl: false, adminKey: '', defaultPin: '' };
                const activeComp = (typeof CloudPortal !== 'undefined' && CloudPortal.getActiveCompanyProfile) ? CloudPortal.getActiveCompanyProfile() : { companyName: branding.companyShortName || 'Hızlı Rapor', companySlug: 'hizli-rapor', isCustomized: false };
                const activeHost = (pCfg.portalUrl || 'https://hizli-rapor-portal.vercel.app').replace(/^https?:\/\//i, '');
                return `
            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-globe text-indigo-600"></i>

                        <span>Bulut Müşteri Portalı (Otomatik)</span>

                    </div>

                    <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Otomatik Hazır ✓</span>

                </div>

                <div class="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5 text-xs">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                        <span class="font-bold text-emerald-950 flex items-center gap-1.5">
                            <i class="fa-solid fa-cloud-check text-emerald-600"></i>
                            <span>Firma bazlı kullanıcı adı &amp; şifre ile güvenli otomatik yükleme</span>
                        </span>
                        <code id="settingsPortalActiveHost" class="font-mono text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">${escapeHtml(activeHost)}</code>
                    </div>
                    <div class="flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-700">
                        <span>Aktif Şirket: <strong class="text-slate-900">${escapeHtml(activeComp.companyName)}</strong></span>
                        <span class="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold">Ön Ek: /p/${escapeHtml(activeComp.companySlug)}-...</span>
                    </div>
                    ${!activeComp.isCustomized ? `
                        <div class="pt-1 flex items-center justify-between gap-2 border-t border-emerald-200/70 text-[10px] text-amber-800">
                            <span>Kendi şirket kısaltmanızla (/p/tkm-...) göndermek için şirket adınızı girin.</span>
                            <button type="button" onclick="openCompanySettingsModal()" class="font-bold text-indigo-700 underline shrink-0">Şirket Adını Düzenle</button>
                        </div>
                    ` : ''}
                </div>

                <div id="settingsPortalStatus" class="hidden"></div>

                <div class="grid grid-cols-2 gap-1.5">
                    <button type="button" onclick="CloudPortal.testPortalFromSettingsPage()" class="py-2 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 border border-sky-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition">
                        <i class="fa-solid fa-plug-circle-check"></i>
                        <span>Bağlantıyı Test Et</span>
                    </button>
                    <button type="button" onclick="CloudPortal.openPortalSiteFromSettings()" class="py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        <span>Portal Sitesini Aç</span>
                    </button>
                </div>

                <div class="pt-1 border-t border-slate-100">
                    <button type="button" onclick="document.getElementById('settingsPortalAdvancedWrap')?.classList.toggle('hidden')" class="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-[11px] flex items-center justify-between border border-slate-200/80 transition">
                        <span class="flex items-center gap-1.5"><i class="fa-solid fa-sliders text-slate-400"></i> Gelişmiş / Özel Domain &amp; Varsayılan PIN (İsteğe Bağlı)</span>
                        <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
                    </button>

                    <div id="settingsPortalAdvancedWrap" class="hidden mt-2 space-y-2 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Özel Alan Adı / Sunucu URL (Boş = Varsayılan Bulut)</label>
                            <input type="url" id="settingsPortalUrl" value="${escapeHtml(pCfg.customPortalUrl || '')}"
                                placeholder="https://hizli-rapor-portal.vercel.app (varsayılan)"
                                class="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Yönetici Anahtarı (Sadece Kendi Sunucunuz İçin, İsteğe Bağlı)</label>
                            <div class="flex items-center gap-1.5">
                                <input type="password" id="settingsPortalKey" value="${escapeHtml(pCfg.adminKey || '')}"
                                    placeholder="Varsayılan bulutta boş bırakın"
                                    class="flex-1 px-3 py-2 border border-slate-200 bg-white rounded-xl font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none">
                                <button type="button" onclick="const el=document.getElementById('settingsPortalKey'); if(el) el.type = el.type==='password' ? 'text' : 'password';"
                                    class="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs" title="Göster / Gizle">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Varsayılan Müşteri Klasör PIN Şifresi (İsteğe Bağlı)</label>
                            <input type="text" id="settingsPortalPin" value="${escapeHtml(pCfg.defaultPin || '')}"
                                placeholder="Örn: 4829 (Boş bırakılırsa şifresiz)"
                                class="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none">
                        </div>

                        <button type="button" onclick="CloudPortal.savePortalSettingsFromPage()" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition">
                            <i class="fa-solid fa-floppy-disk"></i>
                            <span>Gelişmiş Ayarları Kaydet</span>
                        </button>
                    </div>
                </div>

            </div>
                `;
            })()}



            <!-- 5. VERİ YEDEKLEME VE KURTARMA MERKEZİ (ANA SAYFADAN BURAYA TAŞINDI) -->

            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-database text-amber-500"></i>

                        <span>Veri Yedekleme ve Kurtarma Merkezi</span>

                    </div>

                    <span class="text-[10px] text-emerald-600 font-bold">%100 Yerel Veri</span>

                </div>



                <p class="text-xs text-slate-600 leading-relaxed">

                    Tüm saha işleriniz, raporlarınız ve ölçüm hafızanız cihazınızda saklanır. Cihaz değişimi veya güvenlik için tek tıkla tam yedek alabilir veya geri yükleyebilirsiniz.

                </p>



                <!-- Sayaçlar -->

                <div class="grid grid-cols-2 gap-2 text-center">

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-base font-black text-slate-800">${workOrderCount}</div>

                        <div class="text-xs font-bold text-slate-700">İş Klasörü</div>

                    </div>

                    <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                        <div class="text-base font-black text-sky-700">${inspectionCount}</div>

                        <div class="text-xs font-bold text-slate-700">Rapor</div>

                    </div>

                </div>



                <!-- Aksiyonlar -->

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">

                    <button onclick="exportEmergencyBackup()" class="py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition">

                        <i class="fa-solid fa-file-arrow-down"></i>

                        <span>Tam Yedek İndir (JSON)</span>

                    </button>

                    <label class="py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer">

                        <i class="fa-solid fa-file-arrow-up text-sky-400"></i>

                        <span>Yedekten Geri Yükle</span>

                        <input type="file" accept=".json,application/json" class="hidden" onchange="importBackupFromFile(this)">

                    </label>

                </div>

            </div>



            <!-- 6. GÜVENLİK & SİLME KORUMASI BİLGİLENDİRMESİ -->

            <div class="card-craft-white p-3 space-y-1.5">

                <div class="flex items-center gap-2 text-xs font-bold text-slate-800">

                    <i class="fa-solid fa-shield-halved text-rose-500"></i>

                    <span>Şifreli Silme Koruması</span>

                </div>

                <p class="text-xs text-slate-600 leading-relaxed">

                    Saha raporlarının ve iş klasörlerinin kazara silinmesini önlemek amacıyla, tüm silme işlemlerinde aktif personel şifreniz (varsayılan: <strong>123</strong>) istenmektedir.

                </p>

                <div class="text-[11px] text-slate-500 pt-1">

                    Şifrenizi yukarıdaki <strong>"Profilimi Düzenle"</strong> butonundan dilediğiniz zaman güncelleyebilirsiniz.

                </div>

            </div>

        </div>

    `;



    if (typeof CompanySettingsManager !== 'undefined') {

        CompanySettingsManager.syncHeaderTitle();

    }

    updateHeaderUserWidget();

}

window.renderSettingsPage = renderSettingsPage;

window.promptSecurityPasswordConfirmation = promptSecurityPasswordConfirmation;

window.executeSecurityPasswordCheck = executeSecurityPasswordCheck;

