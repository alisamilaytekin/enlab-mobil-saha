// ============================================================================
// ENLAB OFFLINE-FIRST DATABASE ENGINE & ANDROID NATIVE BRIDGE (offline-db.js)
// Works 100% offline with zero internet connection (Android APK & Browser)
// ============================================================================

(function () {
    const DB_STORAGE_KEY = 'enlab_offline_db_v3_clean';

    function mapEquipmentToTemplate(eqName) {
        const eq = (eqName || '').toLowerCase();
        if (eq.includes('topraklama')) return { tplId: '2202', tplCode: 'TKM-FR.317' };
        if (eq.includes('jeneratör') || eq.includes('jenerator')) return { tplId: '2205', tplCode: 'TKM-FR.164' };
        if (eq.includes('yıldırım') || eq.includes('paratoner')) return { tplId: '2074', tplCode: 'TKM-FR.320' };
        if (eq.includes('yangın algılama')) return { tplId: '2042', tplCode: 'TKM-FR.322' };
        if (eq.includes('kompanzasyon')) return { tplId: '2139', tplCode: 'TKM-FR.323' };
        if (eq.includes('kapı')) return { tplId: '2159', tplCode: 'TKM-FR.112' };
        if (eq.includes('yağmurlama') || eq.includes('sprinkler')) return { tplId: '2150', tplCode: 'TKM-FR.210' };
        if (eq.includes('raf')) return { tplId: '2096', tplCode: 'TKM-FR.145' };
        if (eq.includes('havalandırma') || eq.includes('klima')) return { tplId: '2153', tplCode: 'TKM-FR.180' };
        if (eq.includes('yangın dolap')) return { tplId: '2160', tplCode: 'TKM-FR.215' };
        if (eq.includes('tüp') || eq.includes('söndürme')) return { tplId: '2196', tplCode: 'TKM-FR.220' };
        return { tplId: '2201', tplCode: 'TKM-FR.318' };
    }

    function buildInitialDatabase() {
        // Start completely clean with 0 headings and 0 reports
        const workOrders = [];
        const inspections = [];
        const documents = [];
        const instruments = [];
        const calibrations = [];
        const calendarEvents = [];
        const qualityRecords = [];
        const quickNotes = [];

        return {
            version: 3,
            workOrders,
            inspections,
            documents,
            instruments,
            calibrations,
            calendarEvents,
            qualityRecords,
            quickNotes
        };
    }

    const OfflineDB = {
        state: null,

        init() {
            if (this.state) return this.state;
            let raw = null;
            // 1. Try loading from Android Native File Storage first if available
            try {
                if (window.AndroidBridge && typeof window.AndroidBridge.loadDatabase === 'function') {
                    const androidJson = window.AndroidBridge.loadDatabase();
                    if (androidJson && androidJson.length > 10) {
                        raw = androidJson;
                    }
                }
            } catch (e) {
                console.warn('AndroidBridge load warning:', e);
            }

            // 2. Fallback to localStorage
            if (!raw) {
                try {
                    raw = localStorage.getItem(DB_STORAGE_KEY);
                } catch (e) {}
            }

            if (raw) {
                try {
                    this.state = JSON.parse(raw);
                    if (!this.state.workOrders || !this.state.inspections) {
                        this.state = buildInitialDatabase();
                    }
                    if (!this.state.quickNotes) this.state.quickNotes = [];
                } catch (e) {
                    this.state = buildInitialDatabase();
                }
            } else {
                this.state = buildInitialDatabase();
                this.save();
            }
            return this.state;
        },

        save() {
            if (!this.state) return;
            const jsonStr = JSON.stringify(this.state);
            try {
                localStorage.setItem(DB_STORAGE_KEY, jsonStr);
            } catch (e) {
                console.warn('localStorage save warning:', e);
            }
            try {
                if (window.AndroidBridge && typeof window.AndroidBridge.saveDatabase === 'function') {
                    window.AndroidBridge.saveDatabase(jsonStr);
                }
            } catch (e) {
                console.warn('AndroidBridge save warning:', e);
            }
        },

        exportFullBackupObject() {
            this.init();
            // Include all per-inspection localStorage form data & custom defect memories
            const localForms = {};
            let customDefects = null;
            let defectLibrary = null;
            let userAccounts = null;
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('enlab_insp_')) {
                        try {
                            localForms[k] = JSON.parse(localStorage.getItem(k));
                        } catch (e) {}
                    }
                }
                const rawCustom = localStorage.getItem('enlab_item_custom_defects_v2');
                if (rawCustom) customDefects = JSON.parse(rawCustom);
                const rawLib = localStorage.getItem('enlab_defects_library_v1');
                if (rawLib) defectLibrary = JSON.parse(rawLib);
                const rawUsers = localStorage.getItem('enlab_user_accounts_v1');
                if (rawUsers) userAccounts = JSON.parse(rawUsers);
            } catch (e) {}
            return {
                version: 4,
                exported_at: new Date().toLocaleString('tr-TR'),
                timestamp: Date.now(),
                app: 'ENLAB Mobil Saha & Rapor Sistemi (Offline)',
                db: this.state,
                localForms,
                customDefects,
                defectLibrary,
                userAccounts
            };
        },

        importFullBackupObject(backupObj) {
            if (!backupObj) return false;
            try {
                if (backupObj.db && backupObj.db.workOrders) {
                    this.state = backupObj.db;
                    if (backupObj.localForms) {
                        Object.keys(backupObj.localForms).forEach(k => {
                            try {
                                localStorage.setItem(k, JSON.stringify(backupObj.localForms[k]));
                            } catch (e) {}
                        });
                    }
                    if (backupObj.customDefects) {
                        try {
                            localStorage.setItem('enlab_item_custom_defects_v2', JSON.stringify(backupObj.customDefects));
                        } catch (e) {}
                    }
                    if (backupObj.defectLibrary) {
                        try {
                            localStorage.setItem('enlab_defects_library_v1', JSON.stringify(backupObj.defectLibrary));
                        } catch (e) {}
                    }
                    if (backupObj.userAccounts) {
                        try {
                            localStorage.setItem('enlab_user_accounts_v1', JSON.stringify(backupObj.userAccounts));
                        } catch (e) {}
                    }
                    this.save();
                    return true;
                } else if (Array.isArray(backupObj)) {
                    // Legacy array of inspections backup
                    this.init();
                    backupObj.forEach(insp => {
                        const idx = this.state.inspections.findIndex(x => String(x.id) === String(insp.id));
                        if (idx >= 0) this.state.inspections[idx] = insp;
                        else this.state.inspections.unshift(insp);
                    });
                    this.save();
                    return true;
                }
            } catch (err) {
                console.error('Yedek içe aktarma hatası:', err);
            }
            return false;
        },

        handleApiRequest(pathname, method, body) {
            this.init();
            const db = this.state;

            // GET /api/init
            if (pathname === '/api/init' && method === 'GET') {
                const counts = {
                    allOpenWO: db.workOrders.filter(w => w.status === 'Açık').length,
                    allClosedWO: db.workOrders.filter(w => w.status !== 'Açık').length,
                    myOpenWO: db.workOrders.filter(w => w.status === 'Açık' && w.is_mine == 1).length,
                    myClosedWO: db.workOrders.filter(w => w.status !== 'Açık' && w.is_mine == 1).length,
                    allActiveInsp: db.inspections.filter(i => i.status !== 'Rapor Gönderilmiş').length,
                    myActiveInsp: db.inspections.filter(i => i.status !== 'Rapor Gönderilmiş' && i.is_mine == 1).length,
                    myToCompleteInsp: db.inspections.filter(i => ['Başlayacak', 'Tamamlanacak'].includes(i.status) && i.is_mine == 1).length,
                    myToSignInsp: db.inspections.filter(i => i.status === 'İmzalanacak' && i.is_mine == 1).length,
                    toApproveInsp: db.inspections.filter(i => ['İmzalandı / Onay Bekliyor', 'Onaylanacak'].includes(i.status)).length,
                    editRequiredInsp: db.inspections.filter(i => i.status === 'Düzenlenecek').length,
                    activeInst: db.instruments.filter(i => i.status === 'Aktif').length,
                    activeCal: db.calibrations.filter(c => c.is_current == 1).length
                };
                return {
                    counts,
                    events: db.calendarEvents,
                    electricalTemplate: (window.OFFLINE_SEED_DATA && window.OFFLINE_SEED_DATA.electricalTemplate) || []
                };
            }

            // GET /api/work-orders
            if (pathname === '/api/work-orders' && method === 'GET') {
                const rows = db.workOrders.map(w => {
                    const woInsps = db.inspections.filter(i => String(i.work_order_id) === String(w.id));
                    return Object.assign({}, w, {
                        actual_inspection_count: woInsps.length,
                        started_count: woInsps.filter(i => i.status !== 'Başlayacak').length
                    });
                });
                // Sort custom newly created jobs first, then 43129 (Teknosa), then by id DESC
                rows.sort((a, b) => {
                    if ((b.is_custom_job || 0) !== (a.is_custom_job || 0)) return (b.is_custom_job || 0) - (a.is_custom_job || 0);
                    if (String(a.id) === '43129') return -1;
                    if (String(b.id) === '43129') return 1;
                    return Number(b.id) - Number(a.id);
                });
                return rows;
            }

            // POST /api/work-orders (Create New Job / Work Order + Optional Initial Templates)
            if (pathname === '/api/work-orders' && method === 'POST') {
                const newId = Date.now();
                const code = body.code || `TKM-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
                const todayStr = new Date().toLocaleDateString('tr-TR');
                const newWO = {
                    id: newId,
                    code,
                    type: body.type || 'Saha Muayene & Rapor',
                    company_name: body.company_name || 'YENİ İŞ / FİRMA KAYDI',
                    company_branch: body.company_branch || '',
                    company_address: body.company_address || '',
                    isg_katip_no: body.isg_katip_no || '',
                    sgk_sicil_no: body.sgk_sicil_no || '',
                    tax_id: body.tax_id || '',
                    proposal_no: body.proposal_no || code,
                    open_date: todayStr,
                    start_date: body.start_date || todayStr,
                    end_date: body.end_date || todayStr,
                    planner: body.planner || 'Ali Şamil Aytekin',
                    inspectors: body.inspectors || 'Ali Şamil Aytekin',
                    inspection_count: 0,
                    status: 'Açık',
                    is_mine: 1,
                    is_custom_job: 1,
                    field_notes: body.field_notes || '',
                    files_json: '[]'
                };
                db.workOrders.unshift(newWO);

                const createdInspectionIds = [];
                if (Array.isArray(body.initial_templates) && body.initial_templates.length > 0) {
                    const allTpls = window.ENLAB_REPORT_TEMPLATES || [];
                    body.initial_templates.forEach((tplId, idx) => {
                        const tplObj = allTpls.find(t => String(t.id) === String(tplId)) || { id: tplId, code: 'TKM-FR.318', name: 'Elektrik İç Tesisatı' };
                        const inspId = Date.now() + idx + 1;
                        const rNo = `TKM-26-02-${Math.floor(54300 + Math.random() * 5500)}`;
                        db.inspections.unshift({
                            id: inspId,
                            work_order_id: newId,
                            work_order_code: code,
                            report_no: rNo,
                            template_id: String(tplObj.id),
                            template_code: tplObj.code,
                            company_name: newWO.company_name,
                            company_branch: newWO.company_branch,
                            address: newWO.company_address,
                            isg_katip_no: newWO.isg_katip_no,
                            sgk_sicil_no: newWO.sgk_sicil_no,
                            tax_id: newWO.tax_id,
                            equipment_name: body.equipment_name || (tplObj.name.includes('TOPRAKLAMA') ? 'Topraklama Tesisi' : (tplObj.name.includes('JENERATÖR') ? 'Jeneratör-1' : 'Ana Dağıtım Panosu (ADP)')),
                            accreditation: 'AK',
                            serial_no: body.default_serial || '',
                            location: body.default_location || '',
                            inspector: 'Ali Şamil Aytekin',
                            approver: 'Onur Yılmaz',
                            status: 'Tamamlanacak',
                            result: 'UYGUN',
                            inspection_date: todayStr,
                            end_date: todayStr,
                            report_date: todayStr,
                            is_mine: 1,
                            data_json: JSON.stringify({
                                generalNotes: newWO.field_notes || '',
                                companyInfo: {
                                    firmName: newWO.company_name,
                                    address: newWO.company_address,
                                    isgKatipNo: newWO.isg_katip_no,
                                    sgkSicilNo: newWO.sgk_sicil_no,
                                    taxId: newWO.tax_id,
                                    reportNo: rNo,
                                    reportDate: todayStr
                                }
                            })
                        });
                        createdInspectionIds.push(inspId);
                    });
                    newWO.inspection_count = createdInspectionIds.length;
                }

                this.save();
                return { id: newId, code, created_inspection_ids: createdInspectionIds };
            }

            // GET /api/work-orders/:id
            const woMatch = pathname.match(/^\/api\/work-orders\/(\d+)$/);
            if (woMatch && method === 'GET') {
                const woId = woMatch[1];
                const wo = db.workOrders.find(w => String(w.id) === String(woId));
                if (!wo) return { error: 'İş kaydı bulunamadı' };
                const inspections = db.inspections.filter(i => String(i.work_order_id) === String(woId));
                return { workOrder: wo, inspections };
            }

            // POST /api/work-orders/:id/notes (Update Job Field Notes or Details)
            const woNotesMatch = pathname.match(/^\/api\/work-orders\/(\d+)\/notes$/);
            if (woNotesMatch && method === 'POST') {
                const woId = woNotesMatch[1];
                const wo = db.workOrders.find(w => String(w.id) === String(woId));
                if (wo) {
                    if (body.field_notes !== undefined) wo.field_notes = body.field_notes;
                    if (body.company_name !== undefined) wo.company_name = body.company_name;
                    if (body.company_branch !== undefined) wo.company_branch = body.company_branch;
                    if (body.company_address !== undefined) wo.company_address = body.company_address;
                    this.save();
                }
                return { success: true, workOrder: wo };
            }

            // DELETE /api/work-orders/:id
            if (woMatch && method === 'DELETE') {
                const woId = woMatch[1];
                db.workOrders = db.workOrders.filter(w => String(w.id) !== String(woId));
                db.inspections = db.inspections.filter(i => String(i.work_order_id) !== String(woId));
                this.save();
                return { success: true };
            }

            // POST /api/work-orders/:id/files
            const woFileMatch = pathname.match(/^\/api\/work-orders\/(\d+)\/files$/);
            if (woFileMatch && method === 'POST') {
                const woId = woFileMatch[1];
                const wo = db.workOrders.find(w => String(w.id) === String(woId));
                const files = JSON.parse(wo?.files_json || '[]');
                files.unshift({
                    id: Date.now(),
                    name: body.name || 'Saha_Dosyasi.pdf',
                    ext: (body.name || 'PDF').split('.').pop().toUpperCase(),
                    uploader: 'Ali Şamil Aytekin',
                    date: new Date().toLocaleDateString('tr-TR')
                });
                if (wo) wo.files_json = JSON.stringify(files);
                this.save();
                return { success: true, files };
            }

            // GET /api/inspections
            if (pathname === '/api/inspections' && method === 'GET') {
                return db.inspections;
            }

            // POST /api/inspections/new
            if (pathname === '/api/inspections/new' && method === 'POST') {
                const woId = body.work_order_id || 43129;
                const wo = db.workOrders.find(w => String(w.id) === String(woId)) || {};
                const reportNo = body.report_no || `TKM-26-02-${Math.floor(54100 + Math.random() * 5800)}`;
                let initialData = body.data_json || {};
                if (body.copy_from_id) {
                    const source = db.inspections.find(i => String(i.id) === String(body.copy_from_id));
                    if (source && source.data_json) {
                        try { initialData = JSON.parse(source.data_json); } catch (e) {}
                    }
                    const localRaw = localStorage.getItem(`enlab_insp_${body.copy_from_id}`);
                    if (localRaw) {
                        try { initialData = JSON.parse(localRaw); } catch (e) {}
                    }
                }
                const newId = Date.now();
                const todayStr = new Date().toLocaleDateString('tr-TR');
                let parsedInitialData = {};
                try {
                    parsedInitialData = typeof initialData === 'string' ? JSON.parse(initialData || '{}') : (initialData || {});
                } catch (e) { parsedInitialData = {}; }

                if (!parsedInitialData.companyInfo) parsedInitialData.companyInfo = {};
                if (!parsedInitialData.companyInfo.firmName) parsedInitialData.companyInfo.firmName = body.company_name || wo.company_name || '';
                if (!parsedInitialData.companyInfo.address) parsedInitialData.companyInfo.address = body.address || wo.company_address || '';
                if (!parsedInitialData.companyInfo.isgKatipNo) parsedInitialData.companyInfo.isgKatipNo = wo.isg_katip_no || '';
                if (!parsedInitialData.companyInfo.sgkSicilNo) parsedInitialData.companyInfo.sgkSicilNo = wo.sgk_sicil_no || '';
                if (!parsedInitialData.companyInfo.taxId) parsedInitialData.companyInfo.taxId = wo.tax_id || '';
                if (!parsedInitialData.companyInfo.reportNo) parsedInitialData.companyInfo.reportNo = reportNo;
                if (!parsedInitialData.companyInfo.reportDate) parsedInitialData.companyInfo.reportDate = todayStr;

                const newInsp = {
                    id: newId,
                    work_order_id: Number(woId),
                    work_order_code: wo.code || 'TKM-SAHA',
                    report_no: reportNo,
                    template_id: String(body.template_id || '2201'),
                    template_code: body.template_code || 'TKM-FR.318',
                    company_name: body.company_name || wo.company_name || '',
                    company_branch: body.company_branch || wo.company_branch || '',
                    address: body.address || wo.company_address || '',
                    isg_katip_no: wo.isg_katip_no || '',
                    sgk_sicil_no: wo.sgk_sicil_no || '',
                    tax_id: wo.tax_id || '',
                    equipment_name: body.equipment_name || 'Elektrik İç Tesisatı Gözle Kontrol ve Fonksiyon Testleri',
                    accreditation: body.accreditation || 'AK',
                    serial_no: body.serial_no || '',
                    location: body.location || '',
                    inspector: body.inspector || 'Ali Şamil Aytekin',
                    approver: 'Onur Yılmaz',
                    status: body.status || 'Tamamlanacak',
                    result: body.result || 'UYGUN',
                    inspection_date: body.inspection_date || todayStr,
                    end_date: todayStr,
                    report_date: body.report_date || todayStr,
                    is_mine: 1,
                    data_json: JSON.stringify(parsedInitialData)
                };
                db.inspections.unshift(newInsp);
                if (wo) {
                    wo.inspection_count = db.inspections.filter(i => String(i.work_order_id) === String(woId)).length;
                }
                this.save();
                return { id: newId, report_no: reportNo, inspection: newInsp };
            }

            // GET / POST / DELETE /api/inspections/:id
            const inspMatch = pathname.match(/^\/api\/inspections\/(\d+)$/);
            if (inspMatch) {
                const inspId = inspMatch[1];
                const insp = db.inspections.find(i => String(i.id) === String(inspId));
                if (method === 'GET') {
                    return insp || { error: 'Muayene bulunamadı' };
                }
                if (method === 'POST') {
                    if (insp) {
                        if (body.report_no !== undefined) insp.report_no = body.report_no;
                        if (body.template_id !== undefined) insp.template_id = String(body.template_id);
                        if (body.template_code !== undefined) insp.template_code = body.template_code;
                        if (body.equipment_name !== undefined) insp.equipment_name = body.equipment_name;
                        if (body.accreditation !== undefined) insp.accreditation = body.accreditation;
                        if (body.serial_no !== undefined) insp.serial_no = body.serial_no;
                        if (body.location !== undefined) insp.location = body.location;
                        if (body.address !== undefined) insp.address = body.address;
                        if (body.inspector !== undefined) insp.inspector = body.inspector;
                        if (body.approver !== undefined) insp.approver = body.approver;
                        if (body.status !== undefined) insp.status = body.status;
                        if (body.result !== undefined) insp.result = body.result;
                        if (body.inspection_date !== undefined) insp.inspection_date = body.inspection_date;
                        if (body.end_date !== undefined) insp.end_date = body.end_date;
                        if (body.report_date !== undefined) insp.report_date = body.report_date;
                        if (body.form_data !== undefined) {
                            insp.data_json = typeof body.form_data === 'string' ? body.form_data : JSON.stringify(body.form_data);
                        }
                        this.save();
                    }
                    return { success: true, saved_at: new Date().toLocaleTimeString('tr-TR') };
                }
                if (method === 'DELETE') {
                    db.inspections = db.inspections.filter(i => String(i.id) !== String(inspId));
                    this.save();
                    return { success: true };
                }
            }

            // GET / POST / DELETE /api/quick-notes
            if (pathname === '/api/quick-notes' && method === 'GET') {
                return db.quickNotes || [];
            }
            if (pathname === '/api/quick-notes' && method === 'POST') {
                if (!db.quickNotes) db.quickNotes = [];
                if (body.id) {
                    const existing = db.quickNotes.find(n => String(n.id) === String(body.id));
                    if (existing) {
                        existing.title = body.title ?? existing.title;
                        existing.job_name = body.job_name ?? existing.job_name;
                        existing.content = body.content ?? existing.content;
                        existing.updated_at = new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                        this.save();
                        return existing;
                    }
                }
                const newNote = {
                    id: Date.now(),
                    title: body.title || 'Saha Notu',
                    job_name: body.job_name || 'Genel Saha Notu',
                    work_order_id: body.work_order_id || null,
                    content: body.content || '',
                    updated_at: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                };
                db.quickNotes.unshift(newNote);
                this.save();
                return newNote;
            }
            const qNoteDel = pathname.match(/^\/api\/quick-notes\/(\d+)$/);
            if (qNoteDel && method === 'DELETE') {
                db.quickNotes = (db.quickNotes || []).filter(n => String(n.id) !== String(qNoteDel[1]));
                this.save();
                return { success: true };
            }

            // GET /api/documents
            if (pathname === '/api/documents' && method === 'GET') {
                return db.documents || [];
            }

            // GET & POST /api/quality-records
            if (pathname === '/api/quality-records' && method === 'GET') {
                return db.qualityRecords || [];
            }
            if (pathname === '/api/quality-records' && method === 'POST') {
                db.qualityRecords.unshift({
                    id: Date.now(),
                    record_type: body.record_type || 'Uygunsuzluk / DÖF Kaydı',
                    subject: body.subject || '',
                    department: body.department || 'Elektriksel Kontroller',
                    owner: body.owner || 'Ali Şamil Aytekin',
                    description: body.description || '',
                    action_plan: body.action_plan || '',
                    status: 'Açık',
                    created_at: new Date().toLocaleDateString('tr-TR')
                });
                this.save();
                return { success: true };
            }

            // GET /api/instruments
            if (pathname === '/api/instruments' && method === 'GET') {
                return {
                    instruments: db.instruments || [],
                    calibrations: db.calibrations || [],
                    instrumentUsers: []
                };
            }

            // GET & POST /api/calendar
            if (pathname === '/api/calendar' && method === 'GET') {
                return db.calendarEvents || [];
            }
            if (pathname === '/api/calendar' && method === 'POST') {
                db.calendarEvents.unshift({
                    id: Date.now(),
                    title: body.title || 'Yeni Saha Etkinliği',
                    event_type: body.event_type || 'Saha Muayenesi',
                    start_date: body.start_date || new Date().toISOString().slice(0, 10),
                    end_date: body.end_date || new Date().toISOString().slice(0, 10),
                    location: body.location || '',
                    inspector: body.inspector || 'Ali Şamil Aytekin',
                    notes: body.notes || ''
                });
                this.save();
                return { success: true };
            }

            return { success: true };
        }
    };

    window.OfflineDB = OfflineDB;
    OfflineDB.init();

    // Intercept window.fetch so all /api/ calls work 100% offline with zero network dependency!
    const originalFetch = window.fetch ? window.fetch.bind(window) : null;
    window.fetch = async function (input, init = {}) {
        const urlStr = typeof input === 'string' ? input : (input && input.url) || '';
        let pathname = urlStr;
        try {
            if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
                pathname = new URL(urlStr).pathname;
            }
        } catch (e) {}

        if (pathname.startsWith('/api/')) {
            const method = (init.method || 'GET').toUpperCase();
            let bodyObj = {};
            if (init.body) {
                try {
                    bodyObj = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
                } catch (e) {}
            }

            // Always execute against OfflineDB first so offline persistence is immediate and guaranteed
            const localResult = OfflineDB.handleApiRequest(pathname, method, bodyObj);

            // If running on http/https (e.g., PC server.js), also sync to server in background if online
            const isHttpServer = window.location.protocol === 'http:' || window.location.protocol === 'https:';
            if (isHttpServer && originalFetch && navigator.onLine !== false) {
                try {
                    originalFetch(input, init).catch(() => {});
                } catch (e) {}
            }

            return new Response(JSON.stringify(localResult), {
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
        }

        if (originalFetch) {
            return originalFetch(input, init);
        }
        throw new Error('Offline mode');
    };
})();
