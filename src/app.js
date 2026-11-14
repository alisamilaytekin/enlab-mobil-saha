// ============================================================================
// HIZLI RAPOR - MODÜL 00: SİSTEM SABİTLERİ (CONSTANTS)
// ============================================================================

window.HIZLI_RAPOR_CONSTANTS = {
    APP_NAME: 'Hızlı Rapor',
    VERSION: '0.60',
    
    // Rapor ve Muayene Durumları
    STATUS: {
        TO_COMPLETE: 'Tamamlanacak',
        TO_SIGN: 'İmzalanacak',
        PENDING_APPROVAL: 'İmzalandı / Onay Bekliyor',
        APPROVED: 'Onaylandı',
        EDIT_REQUIRED: 'Düzenlenecek',
        SENT: 'Rapor Gönderilmiş'
    },
    
    // Değerlendirme Sonuçları
    RESULTS: {
        SUITABLE: 'UYGUN',
        UNSUITABLE: 'UYGUN DEĞİL',
        NOT_APPLICABLE: 'KAPSAM DIŞI',
        NOT_INSPECTED: 'KONTROL EDİLMEDİ'
    },
    
    // Şablon ID'leri
    TEMPLATES: {
        ELECTRICAL_2201: '2201',
        GROUNDING_2202: '2202',
        GENERATOR_2205: '2205',
        LIGHTNING_2203: '2203',
        TRANSFORMER_2204: '2204',
        ILLUMINATION_2206: '2206',
        THERMAL_2207: '2207',
        BODY_PROTECTION_2208: '2208'
    },
    
    // Veri Saklama Anahtarları
    STORAGE: {
        DB_V3: 'enlab_offline_db_v3_clean',
        DB_V2: 'enlab_offline_db_v2',
        CUSTOM_DEFECTS: 'enlab_item_custom_defects_v2',
        DEFECT_LIBRARY: 'enlab_defects_library_v1',
        USER_ACCOUNTS: 'enlab_user_accounts_v1',
        CURRENT_USER: 'enlab_current_user_v1',
        COMPANY_SETTINGS: 'enlab_company_branding_v1',
        USER_DEVICES: 'enlab_user_devices_v1'
    }
};


// ============================================================================
// HIZLI RAPOR - 00B-DEVICES-MANAGER.JS
// Açıklama: Personel Üzerine Alınan Ölçüm Cihazları Havuzu, Ayarlar & Editör Entegrasyonu
// ============================================================================

(function () {
    const STORAGE_KEY = (window.HIZLI_RAPOR_CONSTANTS && window.HIZLI_RAPOR_CONSTANTS.STORAGE && window.HIZLI_RAPOR_CONSTANTS.STORAGE.USER_DEVICES)
        || 'enlab_user_devices_v1';

    // Elektrik İç Tesisatı (2201) -> 3. TERMAL KAMERA BİLGİLERİ (topic_1_0) varsayılan GUID eşlemeleri
    const THERMAL_TOPIC_FALLBACK_GUIDS = [
        '82b2fd27-f7df-488d-b52a-9120fc5cdd55', // 0: Cihaz Adı
        'd61d680b-c295-4240-9907-dabaae9cc955', // 1: Seri No
        'b17cd17a-8329-4146-ae40-38dbfec58e66', // 2: Kalibrasyon Tarihi
        'aa1e8e0f-de2f-42d2-982e-ba99bd668942', // 3: Kalibrasyon Geçerlilik Tarihi
        '3958b75a-20e4-4c1a-afb3-495da0c47fc1'  // 4: Sertifika No
    ];

    const DEVICE_CATEGORIES = [
        'Termal Kamera',
        'Çok Fonksiyonlu Test Cihazı',
        'Multimetre',
        'Pensampermetre',
        'Dijital Işık Ölçer',
        'Kumpas',
        'Dijital Ses Seviyesi Ölçer',
        'Lazer Mesafe Ölçer',
        'Diğer'
    ];

    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function cloneObj(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function getDefaultCatalog() {
        return [
            {
                id: 'dev_termal_fluke_tis40',
                category: 'Termal Kamera',
                code: 'C.70',
                brand: 'Fluke',
                model: 'TiS40',
                reportName: 'Termal Kamera',
                thermalReportName: 'Fluke TiS40',
                isThermal: true,
                serial: '18110120',
                calDate: '',
                validDate: '',
                certNo: '',
                isCustom: false
            },
            {
                id: 'dev_termal_unit_c105',
                category: 'Termal Kamera',
                code: 'C.105',
                brand: 'UNI-T',
                model: 'UTi165A',
                reportName: 'Termal Kamera',
                thermalReportName: 'UNI-T UTi165A',
                isThermal: true,
                serial: '201266702',
                calDate: '22.06.2026',
                validDate: '22.06.2027',
                certNo: '0074K-0626-01712',
                isCustom: false
            },
            {
                id: 'dev_termal_unit_c104',
                category: 'Termal Kamera',
                code: 'C.104',
                brand: 'UNI-T',
                model: 'PRO (UTi165A)',
                reportName: 'Termal Kamera',
                thermalReportName: 'UNI-T PRO',
                isThermal: true,
                serial: '201266711',
                calDate: '20.06.2026',
                validDate: '20.06.2027',
                certNo: '0074K-0626-01516',
                isCustom: false
            },
            {
                id: 'dev_termal_unit_c122',
                category: 'Termal Kamera',
                code: 'C.122',
                brand: 'UNI-T',
                model: 'UTi165A',
                reportName: 'Termal Kamera',
                thermalReportName: 'UNI-T UTi165A',
                isThermal: true,
                serial: 'C210839955',
                calDate: '',
                validDate: '',
                certNo: '',
                isCustom: false
            },
            {
                id: 'dev_termal_hti_c162',
                category: 'Termal Kamera',
                code: 'C.162',
                brand: 'Hti',
                model: 'HT-04D',
                reportName: 'Termal Kamera',
                thermalReportName: 'Hti HT-04D',
                isThermal: true,
                serial: 'HDJA000005950',
                calDate: '02.07.2026',
                validDate: '02.07.2027',
                certNo: '0074K-0626-02534',
                isCustom: false
            },
            {
                id: 'dev_mft_metrel_c121',
                category: 'Çok Fonksiyonlu Test Cihazı',
                code: 'C.121',
                brand: 'Metrel',
                model: 'MI 3102 BT',
                reportName: 'Çok Fonksiyonlu Test Cihazı',
                thermalReportName: '',
                isThermal: false,
                serial: '21050830',
                calDate: '20.10.2026',
                validDate: '20.10.2027',
                certNo: '0176K-1026-01697',
                isCustom: false
            },
            {
                id: 'dev_mft_metrel_2515',
                category: 'Çok Fonksiyonlu Test Cihazı',
                code: 'MFT-1',
                brand: 'Metrel',
                model: 'MI 3102 BT',
                reportName: 'Çok Fonksiyonlu Test Cihazı',
                thermalReportName: '',
                isThermal: false,
                serial: '25151340',
                calDate: '18.08.2026',
                validDate: '18.08.2027',
                certNo: '0176K-0826-01648',
                isCustom: false
            },
            {
                id: 'dev_mft_metrel_c177',
                category: 'Çok Fonksiyonlu Test Cihazı',
                code: 'C.177',
                brand: 'Metrel',
                model: 'MI 3102 BT',
                reportName: 'Çok Fonksiyonlu Test Cihazı',
                thermalReportName: '',
                isThermal: false,
                serial: '25213081',
                calDate: '05.10.2026',
                validDate: '05.10.2027',
                certNo: '0176K-1026-00358',
                isCustom: false
            },
            {
                id: 'dev_mft_cem_c173',
                category: 'Çok Fonksiyonlu Test Cihazı',
                code: 'C.173',
                brand: 'CEM',
                model: 'DT-6650',
                reportName: 'Çok Fonksiyonlu Test Cihazı',
                thermalReportName: '',
                isThermal: false,
                serial: '230878850',
                calDate: '',
                validDate: '',
                certNo: '',
                isCustom: false
            },
            {
                id: 'dev_mm_fluke_c103',
                category: 'Multimetre',
                code: 'C.103',
                brand: 'Fluke',
                model: '179',
                reportName: 'Multimetre',
                thermalReportName: '',
                isThermal: false,
                serial: '48291021',
                calDate: '',
                validDate: '',
                certNo: '',
                isCustom: false
            },
            {
                id: 'dev_mm_079',
                category: 'Multimetre',
                code: 'MM-1',
                brand: 'Multimetre',
                model: 'Genel',
                reportName: 'Multimetre',
                thermalReportName: '',
                isThermal: false,
                serial: '0793436',
                calDate: '19.06.2026',
                validDate: '19.06.2027',
                certNo: '0074K-0626-00956',
                isCustom: false
            },
            {
                id: 'dev_clamp_unit_c116',
                category: 'Pensampermetre',
                code: 'C.116',
                brand: 'UNI-T',
                model: 'UT204',
                reportName: 'Pensampermetre',
                thermalReportName: '',
                isThermal: false,
                serial: 'C182918252',
                calDate: '09.09.2026',
                validDate: '09.09.2027',
                certNo: '0074K-0926-00560',
                isCustom: false
            },
            {
                id: 'dev_clamp_pa_2512',
                category: 'Pensampermetre',
                code: 'PA-1',
                brand: 'Pensampermetre',
                model: 'C251245633',
                reportName: 'Pensampermetre',
                thermalReportName: '',
                isThermal: false,
                serial: 'C251245633',
                calDate: '12.01.2026',
                validDate: '12.01.2027',
                certNo: '0074K-0126-00541',
                isCustom: false
            },
            {
                id: 'dev_lux_cem_c165',
                category: 'Dijital Işık Ölçer',
                code: 'C.165',
                brand: 'CEM',
                model: 'DT-1308',
                reportName: 'Dijital Işık Ölçer',
                thermalReportName: '',
                isThermal: false,
                serial: '19082311',
                calDate: '',
                validDate: '',
                certNo: '',
                isCustom: false
            },
            {
                id: 'dev_lux_2331',
                category: 'Dijital Işık Ölçer',
                code: 'LUX-1',
                brand: 'CEM',
                model: 'DT-1308',
                reportName: 'Dijital Işık Ölçer',
                thermalReportName: '',
                isThermal: false,
                serial: 'C233112975',
                calDate: '09.01.2026',
                validDate: '09.01.2027',
                certNo: '0016K-0126-01217',
                isCustom: false
            },
            {
                id: 'dev_kumpas_c135',
                category: 'Kumpas',
                code: 'C.135',
                brand: 'Electronic',
                model: 'Karbon Fiber Kompozit',
                reportName: 'Kumpas',
                thermalReportName: '',
                isThermal: false,
                serial: 'TKM-CFC-0003',
                calDate: '04.10.2026',
                validDate: '04.04.2027',
                certNo: '2026-03.2',
                isCustom: false
            },
            {
                id: 'dev_kumpas_mitutoyo_c170',
                category: 'Kumpas',
                code: 'C.170',
                brand: 'Mitutoyo',
                model: '150mm',
                reportName: 'Kumpas',
                thermalReportName: '',
                isThermal: false,
                serial: '2019482',
                calDate: '',
                validDate: '',
                certNo: '',
                isCustom: false
            },
            {
                id: 'dev_sound_2520',
                category: 'Dijital Ses Seviyesi Ölçer',
                code: 'DB-1',
                brand: 'Ses Seviyesi',
                model: 'Dijital',
                reportName: 'Dijital Ses Seviyesi Ölçer',
                thermalReportName: '',
                isThermal: false,
                serial: 'C252034872',
                calDate: '09.01.2026',
                validDate: '09.01.2027',
                certNo: '0016K-0126-01218',
                isCustom: false
            },
            {
                id: 'dev_laser_488',
                category: 'Lazer Mesafe Ölçer',
                code: 'LZR-1',
                brand: 'Lazer Metre',
                model: 'Dijital',
                reportName: 'Lazer Mesafe Ölçer',
                thermalReportName: '',
                isThermal: false,
                serial: '488309447',
                calDate: '04.12.2025',
                validDate: '04.12.2026',
                certNo: '0074K-1225-00179',
                isCustom: false
            }
        ];
    }

    function parseTrDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const clean = dateStr.trim();
        let m = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
        if (m) {
            const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 23, 59, 59);
            return isNaN(d.getTime()) ? null : d;
        }
        m = clean.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
        if (m) {
            const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    }

    function addOneYearTrDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return '';
        const clean = dateStr.trim();
        const m = clean.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
        if (m) {
            const day = String(m[1]).padStart(2, '0');
            const month = String(m[2]).padStart(2, '0');
            const year = Number(m[3]) + 1;
            return `${day}.${month}.${year}`;
        }
        const mIso = clean.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
        if (mIso) {
            const day = String(mIso[3]).padStart(2, '0');
            const month = String(mIso[2]).padStart(2, '0');
            const year = Number(mIso[1]) + 1;
            return `${day}.${month}.${year}`;
        }
        return '';
    }

    function isThermalDeviceObj(dev) {
        if (!dev) return false;
        if (dev.isThermal) return true;
        const cat = (dev.category || '').toLowerCase();
        const nm = (dev.name || dev.reportName || '').toLowerCase();
        return cat.includes('termal') || nm.includes('termal kamera');
    }

    function getDeviceDisplayTitle(dev) {
        if (!dev) return 'Ölçüm Cihazı';
        const bm = [dev.brand, dev.model].filter(Boolean).join(' ').trim();
        if (bm) return bm;
        return dev.reportName || dev.name || dev.category || 'Ölçüm Cihazı';
    }

    function getThermalCameraQuestions(topic) {
        if (topic && Array.isArray(topic.questions) && topic.questions.length >= 5) {
            return topic.questions.map(q => q.guid);
        }
        const tpl = window.AppState && window.AppState.electricalTemplate;
        const area1 = tpl && Array.isArray(tpl.areas) ? tpl.areas[1] : null;
        const t0 = area1 && Array.isArray(area1.topics) ? area1.topics[0] : null;
        if (t0 && Array.isArray(t0.questions) && t0.questions.length >= 5) {
            return t0.questions.map(q => q.guid);
        }
        if (window.OFFLINE_SEED_DATA && Array.isArray(window.OFFLINE_SEED_DATA.electricalTemplate)) {
            const seedArea1 = window.OFFLINE_SEED_DATA.electricalTemplate[1];
            const seedT0 = seedArea1 && Array.isArray(seedArea1.topics) ? seedArea1.topics[0] : null;
            if (seedT0 && Array.isArray(seedT0.questions) && seedT0.questions.length >= 5) {
                return seedT0.questions.map(q => q.guid);
            }
        }
        return THERMAL_TOPIC_FALLBACK_GUIDS;
    }

    function isDeviceRowBlank(row) {
        if (!row || typeof row !== 'object') return true;
        return !String(row.name || '').trim()
            && !String(row.serial || '').trim()
            && !String(row.calDate || '').trim()
            && !String(row.validDate || '').trim()
            && !String(row.certNo || '').trim();
    }

    function isThermalTopicRowsBlank(rows) {
        if (!Array.isArray(rows) || rows.length === 0) return true;
        return rows.every(r => {
            if (!r || typeof r !== 'object') return true;
            return Object.values(r).every(v => !String(v || '').trim());
        });
    }

    const MeasuringDevicesManager = {
        STORAGE_KEY,
        DEVICE_CATEGORIES,

        getCurrentUserId() {
            try {
                if (typeof AuthManager !== 'undefined' && typeof AuthManager.getCurrentUser === 'function') {
                    const u = AuthManager.getCurrentUser();
                    if (u && u.id) return String(u.id);
                }
                const sid = localStorage.getItem('enlab_current_user_id');
                if (sid) return String(sid);
            } catch (e) {}
            return 'default';
        },

        loadState() {
            let state = null;
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && Array.isArray(parsed.catalog)) {
                        state = parsed;
                    }
                }
            } catch (e) {}

            // Fallback: Android WebView DB içinde saklanan yedekten kurtar
            if (!state && window.OfflineDB && window.OfflineDB.state && window.OfflineDB.state.userDevicesCatalog) {
                const cached = window.OfflineDB.state.userDevicesCatalog;
                if (cached && Array.isArray(cached.catalog)) {
                    state = cloneObj(cached);
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
                }
            }

            if (!state) {
                state = {
                    version: 1,
                    catalog: getDefaultCatalog(),
                    assignmentsByUser: {},
                    autoApplyEnabled: true
                };
                this.saveState(state);
            }

            if (!Array.isArray(state.catalog)) state.catalog = getDefaultCatalog();
            if (!state.assignmentsByUser || typeof state.assignmentsByUser !== 'object') state.assignmentsByUser = {};
            if (!state.cloudDevicesByUser || typeof state.cloudDevicesByUser !== 'object') state.cloudDevicesByUser = {};
            if (!state.cloudManagedByUser || typeof state.cloudManagedByUser !== 'object') state.cloudManagedByUser = {};
            if (state.autoApplyEnabled === undefined) state.autoApplyEnabled = true;

            return state;
        },

        isCloudManaged(userId = null) {
            const uid = userId || this.getCurrentUserId();
            try {
                if (typeof AuthManager !== 'undefined' && typeof AuthManager.getCurrentUser === 'function') {
                    const u = AuthManager.getCurrentUser();
                    if (u && (!userId || String(u.id) === String(uid)) && u.isCloudManaged) {
                        return true;
                    }
                }
            } catch (e) {}
            const s = this.loadState();
            return Boolean(s.cloudManagedByUser && s.cloudManagedByUser[uid]);
        },

        syncCloudDevices(cloudDevices, userId = null) {
            const s = this.loadState();
            const uid = userId || this.getCurrentUserId();
            const cleanList = (Array.isArray(cloudDevices) ? cloudDevices : []).map(d => ({
                id: String(d.id || ('cloud_' + (d.cloudId || Date.now()))),
                cloudId: d.cloudId || '',
                category: String(d.category || 'Diğer').trim() || 'Diğer',
                code: String(d.code || '').trim(),
                brand: String(d.brand || '').trim(),
                model: String(d.model || '').trim(),
                reportName: String(d.reportName || d.category || 'Ölçüm Cihazı').trim(),
                thermalReportName: String(d.thermalReportName || '').trim(),
                isThermal: Boolean(d.isThermal),
                serial: String(d.serial || '').trim(),
                calDate: String(d.calDate || '').trim(),
                validDate: String(d.validDate || '').trim(),
                certNo: String(d.certNo || '').trim(),
                isCustom: false,
                lockedByManager: true
            }));
            s.cloudDevicesByUser[uid] = cleanList;
            s.cloudManagedByUser[uid] = true;
            s.assignmentsByUser[uid] = cleanList.map(d => String(d.id));
            s.autoApplyEnabled = true;
            this.saveState(s);
            return cleanList;
        },

        saveState(state) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) {
                console.warn('MeasuringDevicesManager localStorage warning:', e);
            }
            try {
                if (window.OfflineDB && window.OfflineDB.state) {
                    window.OfflineDB.state.userDevicesCatalog = cloneObj(state);
                    if (typeof window.OfflineDB.save === 'function') {
                        window.OfflineDB.save();
                    }
                }
            } catch (e) {
                console.warn('MeasuringDevicesManager OfflineDB sync warning:', e);
            }
        },

        getCatalog(userId = null) {
            const s = this.loadState();
            const uid = userId || this.getCurrentUserId();
            if (this.isCloudManaged(uid)) {
                return Array.isArray(s.cloudDevicesByUser[uid]) ? s.cloudDevicesByUser[uid] : [];
            }
            return s.catalog;
        },

        getDeviceById(deviceId) {
            if (!deviceId) return null;
            return this.getCatalog().find(d => String(d.id) === String(deviceId)) || null;
        },

        isAutoApplyEnabled() {
            return this.loadState().autoApplyEnabled !== false;
        },

        setAutoApplyEnabled(enabled) {
            const s = this.loadState();
            s.autoApplyEnabled = Boolean(enabled);
            this.saveState(s);
        },

        getAssignedDeviceIds(userId = null) {
            const s = this.loadState();
            const uid = userId || this.getCurrentUserId();
            if (this.isCloudManaged(uid)) {
                const cloudDevs = Array.isArray(s.cloudDevicesByUser[uid]) ? s.cloudDevicesByUser[uid] : [];
                const validSet = new Set(cloudDevs.map(d => String(d.id)));
                const storedIds = Array.isArray(s.assignmentsByUser[uid])
                    ? s.assignmentsByUser[uid].map(String).filter(id => validSet.has(id))
                    : [];
                return storedIds.length === cloudDevs.length ? storedIds : cloudDevs.map(d => String(d.id));
            }
            const ids = s.assignmentsByUser[uid];
            if (Array.isArray(ids)) return ids;
            // Fallback: varsa default anahtarını kontrol et
            if (uid !== 'default' && Array.isArray(s.assignmentsByUser.default) && s.assignmentsByUser.default.length) {
                return s.assignmentsByUser.default;
            }
            return [];
        },

        setAssignedDeviceIds(ids, userId = null) {
            const s = this.loadState();
            const uid = userId || this.getCurrentUserId();
            const validIdSet = new Set(this.getCatalog(uid).map(d => String(d.id)));
            const deduped = [];
            (Array.isArray(ids) ? ids : []).forEach(id => {
                const sid = String(id);
                if (validIdSet.has(sid) && !deduped.includes(sid)) deduped.push(sid);
            });
            s.assignmentsByUser[uid] = deduped;
            this.saveState(s);
            return deduped;
        },

        getAssignedDevices(userId = null) {
            const ids = this.getAssignedDeviceIds(userId);
            const map = new Map(this.getCatalog(userId).map(d => [String(d.id), d]));
            return ids.map(id => map.get(String(id))).filter(Boolean);
        },

        isAssigned(deviceId, userId = null) {
            return this.getAssignedDeviceIds(userId).map(String).includes(String(deviceId));
        },

        assignDevice(deviceId, userId = null) {
            const ids = [...this.getAssignedDeviceIds(userId)];
            const sid = String(deviceId);
            if (!ids.map(String).includes(sid)) {
                ids.push(sid);
                this.setAssignedDeviceIds(ids, userId);
            }
            return this.getAssignedDevices(userId);
        },

        unassignDevice(deviceId, userId = null) {
            const sid = String(deviceId);
            const ids = this.getAssignedDeviceIds(userId).filter(id => String(id) !== sid);
            this.setAssignedDeviceIds(ids, userId);
            return this.getAssignedDevices(userId);
        },

        toggleAssignment(deviceId, userId = null) {
            if (this.isAssigned(deviceId, userId)) {
                this.unassignDevice(deviceId, userId);
                return false;
            }
            this.assignDevice(deviceId, userId);
            return true;
        },

        swapAssignedDevice(oldDeviceId, newDeviceId, userId = null) {
            const ids = [...this.getAssignedDeviceIds(userId)];
            const oldIdx = ids.findIndex(id => String(id) === String(oldDeviceId));
            const newSid = String(newDeviceId);
            if (!this.getDeviceById(newSid)) return false;

            const existingNewIdx = ids.findIndex(id => String(id) === newSid);
            if (oldIdx >= 0) {
                if (existingNewIdx >= 0 && existingNewIdx !== oldIdx) {
                    // Yer değiştir (eskiyi kaldırıp yeniyi eski pozisyona koy)
                    ids[oldIdx] = newSid;
                    ids.splice(existingNewIdx, 1);
                } else {
                    ids[oldIdx] = newSid;
                }
            } else if (existingNewIdx < 0) {
                ids.push(newSid);
            }
            this.setAssignedDeviceIds(ids, userId);
            return true;
        },

        moveAssignedDevice(deviceId, direction, userId = null) {
            const ids = [...this.getAssignedDeviceIds(userId)];
            const idx = ids.findIndex(id => String(id) === String(deviceId));
            if (idx < 0) return false;
            const targetIdx = idx + (direction < 0 ? -1 : 1);
            if (targetIdx < 0 || targetIdx >= ids.length) return false;
            const tmp = ids[targetIdx];
            ids[targetIdx] = ids[idx];
            ids[idx] = tmp;
            this.setAssignedDeviceIds(ids, userId);
            return true;
        },

        saveCatalogDevice(input, assignToUser = null) {
            const s = this.loadState();
            const isEdit = Boolean(input.id && s.catalog.some(d => String(d.id) === String(input.id)));
            const category = String(input.category || 'Diğer').trim() || 'Diğer';
            const brand = String(input.brand || '').trim();
            const model = String(input.model || '').trim();
            const isThermal = input.isThermal !== undefined ? Boolean(input.isThermal) : category.toLowerCase().includes('termal');
            const defaultReportName = category === 'Diğer' ? ([brand, model].filter(Boolean).join(' ') || 'Ölçüm Cihazı') : category;
            const reportName = String(input.reportName || '').trim() || defaultReportName;
            const thermalDefaultName = [brand, model].filter(Boolean).join(' ').trim() || reportName;
            const thermalReportName = isThermal
                ? (String(input.thermalReportName || '').trim() || thermalDefaultName)
                : '';

            const devObj = {
                id: isEdit ? String(input.id) : ('dev_custom_' + Date.now() + '_' + Math.floor(100 + Math.random() * 899)),
                category,
                code: String(input.code || '').trim(),
                brand,
                model,
                reportName,
                thermalReportName,
                isThermal,
                serial: String(input.serial || '').trim(),
                calDate: String(input.calDate || '').trim(),
                validDate: String(input.validDate || '').trim(),
                certNo: String(input.certNo || '').trim(),
                isCustom: isEdit ? Boolean(s.catalog.find(d => String(d.id) === String(input.id))?.isCustom) : true
            };

            if (isEdit) {
                const idx = s.catalog.findIndex(d => String(d.id) === String(devObj.id));
                s.catalog[idx] = devObj;
            } else {
                s.catalog.unshift(devObj);
            }
            this.saveState(s);

            if (assignToUser === true) {
                this.assignDevice(devObj.id);
            } else if (assignToUser === false) {
                this.unassignDevice(devObj.id);
            }
            return devObj;
        },

        deleteCatalogDevice(deviceId) {
            const s = this.loadState();
            const sid = String(deviceId);
            s.catalog = s.catalog.filter(d => String(d.id) !== sid);
            Object.keys(s.assignmentsByUser).forEach(uid => {
                if (Array.isArray(s.assignmentsByUser[uid])) {
                    s.assignmentsByUser[uid] = s.assignmentsByUser[uid].filter(id => String(id) !== sid);
                }
            });
            this.saveState(s);
        },

        restoreDefaultCatalogEntries() {
            const s = this.loadState();
            const existingIds = new Set(s.catalog.map(d => String(d.id)));
            let added = 0;
            getDefaultCatalog().forEach(def => {
                if (!existingIds.has(String(def.id))) {
                    s.catalog.push(cloneObj(def));
                    added++;
                }
            });
            if (added > 0) this.saveState(s);
            return added;
        },

        getCalibrationStatus(validDateStr) {
            const d = parseTrDate(validDateStr);
            if (!d) {
                return {
                    status: 'unknown',
                    label: 'Tarih Girilmedi',
                    daysLeft: null,
                    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
                };
            }
            const now = new Date();
            const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                return {
                    status: 'expired',
                    label: 'Kalibrasyon Süresi Doldu',
                    daysLeft: diffDays,
                    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
                };
            }
            if (diffDays <= 30) {
                return {
                    status: 'soon',
                    label: `${diffDays} Gün Kaldı`,
                    daysLeft: diffDays,
                    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
                };
            }
            return {
                status: 'valid',
                label: 'Geçerli',
                daysLeft: diffDays,
                badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
            };
        },

        toReportDeviceRow(dev) {
            if (!dev) return { name: '', serial: '', calDate: '', validDate: '', certNo: '' };
            return {
                sourceId: dev.id || '',
                brand: dev.brand || '',
                model: dev.model || '',
                code: dev.code || '',
                category: dev.category || '',
                isThermal: isThermalDeviceObj(dev),
                name: dev.reportName || dev.name || dev.category || getDeviceDisplayTitle(dev),
                serial: dev.serial || '',
                calDate: dev.calDate || '',
                validDate: dev.validDate || '',
                certNo: dev.certNo || ''
            };
        },

        toThermalTopicRow(dev, topic = null) {
            const guids = getThermalCameraQuestions(topic);
            const thermalName = (dev && (dev.thermalReportName || [dev.brand, dev.model].filter(Boolean).join(' ').trim() || dev.reportName || dev.name)) || '';
            const row = {};
            row[guids[0]] = thermalName;
            row[guids[1]] = (dev && dev.serial) || '';
            row[guids[2]] = (dev && dev.calDate) || '';
            row[guids[3]] = (dev && dev.validDate) || '';
            row[guids[4]] = (dev && dev.certNo) || '';
            return row;
        },

        getDefaultReportDevices() {
            return this.getAssignedDevices().map(d => this.toReportDeviceRow(d));
        },

        getAssignedThermalCamera() {
            const assigned = this.getAssignedDevices();
            return assigned.find(isThermalDeviceObj) || null;
        },

        applyDefaultsToFormData(formData, templateId = null, forceReplace = false) {
            if (!formData || typeof formData !== 'object') return formData;
            if (!forceReplace && !this.isAutoApplyEnabled()) return formData;

            const assigned = this.getAssignedDevices();
            if (!assigned.length && !forceReplace) return formData;

            const tplStr = String(templateId || '');

            // 1. Genel Ölçüm Aletleri Tablosu (fd.measuringDevices)
            const curDevices = Array.isArray(formData.measuringDevices) ? formData.measuringDevices : [];
            const isDevicesBlank = curDevices.length === 0 || curDevices.every(isDeviceRowBlank);
            if (forceReplace || (!formData._devicesInitialized && isDevicesBlank)) {
                const mapped = assigned.map(d => this.toReportDeviceRow(d));
                formData.measuringDevices = mapped.length ? mapped : (forceReplace ? [] : curDevices);
                formData._devicesInitialized = true;
                if (tplStr === '2205') {
                    if (!formData.generator || typeof formData.generator !== 'object') {
                        formData.generator = { info: {}, equipment: {}, checks: {}, potential: {}, measurements: {}, battery: {}, devices: [] };
                    }
                    formData.generator.devices = formData.measuringDevices;
                }
            }

            // 2. Elektrik İç Tesisatı (2201) -> 3. Termal Kamera Bilgileri (tableRows.topic_1_0)
            if (tplStr === '2201') {
                if (!formData.tableRows || typeof formData.tableRows !== 'object') {
                    formData.tableRows = {};
                }
                const curThermalRows = formData.tableRows.topic_1_0 || [];
                const isThermalBlank = isThermalTopicRowsBlank(curThermalRows);
                const thermalDev = this.getAssignedThermalCamera();

                if ((forceReplace || (!formData._thermalInitialized && isThermalBlank)) && thermalDev) {
                    formData.tableRows.topic_1_0 = [this.toThermalTopicRow(thermalDev)];
                    formData._thermalSourceId = thermalDev.id;
                    formData._thermalInitialized = true;
                }
            }

            return formData;
        },

        inferCategoryForReportRow(row) {
            if (!row) return '';
            if (row.category && DEVICE_CATEGORIES.includes(row.category)) return row.category;
            if (row.isThermal) return 'Termal Kamera';
            const src = row.sourceId ? this.getDeviceById(row.sourceId) : null;
            if (src && src.category) return src.category;
            const n = String(row.name || '').toLowerCase();
            if (n.includes('termal')) return 'Termal Kamera';
            if (n.includes('çok fonksiyon') || n.includes('test cihaz')) return 'Çok Fonksiyonlu Test Cihazı';
            if (n.includes('multimetre') || n.includes('avometre')) return 'Multimetre';
            if (n.includes('pensampermetre') || n.includes('pens')) return 'Pensampermetre';
            if (n.includes('ışık') || n.includes('lüks') || n.includes('luks')) return 'Dijital Işık Ölçer';
            if (n.includes('kumpas')) return 'Kumpas';
            if (n.includes('ses') || n.includes('gürültü') || n.includes('desibel')) return 'Dijital Ses Seviyesi Ölçer';
            if (n.includes('lazer') || n.includes('mesafe')) return 'Lazer Mesafe Ölçer';
            return '';
        },

        swapReportDevice(rowIdx, newDeviceId) {
            const fd = window.AppState && window.AppState.currentFormData;
            const insp = window.AppState && window.AppState.currentInspection;
            if (!fd || !Array.isArray(fd.measuringDevices)) return false;

            const newDev = this.getDeviceById(newDeviceId);
            if (!newDev) return false;

            const oldRow = fd.measuringDevices[rowIdx] || {};
            const oldLabel = oldRow.brand || oldRow.model
                ? [oldRow.brand, oldRow.model].filter(Boolean).join(' ')
                : (oldRow.name || `Cihaz #${rowIdx + 1}`);

            const wasThermal = isThermalDeviceObj(oldRow) || isThermalDeviceObj(newDev);
            fd.measuringDevices[rowIdx] = this.toReportDeviceRow(newDev);
            fd._devicesInitialized = true;

            if (insp && String(insp.template_id) === '2205' && fd.generator) {
                fd.generator.devices = fd.measuringDevices;
            }

            // 2201 Elektrik İç Tesisatı raporunda Bölüm 3 (Termal Kamera) ile otomatik senkronize et
            if (insp && String(insp.template_id) === '2201' && wasThermal && isThermalDeviceObj(newDev)) {
                if (!fd.tableRows) fd.tableRows = {};
                const curTCam = fd.tableRows.topic_1_0 || [];
                const guids = getThermalCameraQuestions();
                const firstCellVal = String((curTCam[0] && curTCam[0][guids[0]]) || '');
                if (!firstCellVal.includes('Uygulaması Yok')) {
                    fd.tableRows.topic_1_0 = [this.toThermalTopicRow(newDev)];
                    fd._thermalSourceId = newDev.id;
                    fd._thermalInitialized = true;
                }
            }

            if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
            if (typeof window.paintInspectionEditorUI === 'function') window.paintInspectionEditorUI();
            if (typeof window.showToast === 'function') {
                window.showToast(`${oldLabel} yerine ${getDeviceDisplayTitle(newDev)} seçildi`);
            }
            return true;
        },

        addReportDeviceFromCatalog(deviceId) {
            const fd = window.AppState && window.AppState.currentFormData;
            const insp = window.AppState && window.AppState.currentInspection;
            if (!fd) return false;

            const dev = this.getDeviceById(deviceId);
            if (!dev) return false;

            if (!Array.isArray(fd.measuringDevices)) fd.measuringDevices = [];
            // Eğer sadece tek boş satır varsa onun üzerine yaz
            if (fd.measuringDevices.length === 1 && isDeviceRowBlank(fd.measuringDevices[0])) {
                fd.measuringDevices[0] = this.toReportDeviceRow(dev);
            } else {
                fd.measuringDevices.push(this.toReportDeviceRow(dev));
            }
            fd._devicesInitialized = true;

            if (insp && String(insp.template_id) === '2205' && fd.generator) {
                fd.generator.devices = fd.measuringDevices;
            }

            if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
            if (typeof window.paintInspectionEditorUI === 'function') window.paintInspectionEditorUI();
            if (typeof window.showToast === 'function') {
                window.showToast(`${getDeviceDisplayTitle(dev)} rapora eklendi`);
            }
            return true;
        },

        swapReportThermalCamera(newDeviceId) {
            const fd = window.AppState && window.AppState.currentFormData;
            const insp = window.AppState && window.AppState.currentInspection;
            if (!fd) return false;

            const newDev = this.getDeviceById(newDeviceId);
            if (!newDev) return false;

            if (!fd.tableRows) fd.tableRows = {};
            const prevTCam = fd.tableRows.topic_1_0 && fd.tableRows.topic_1_0[0];
            const guids = getThermalCameraQuestions();
            const prevSerial = prevTCam ? String(prevTCam[guids[1]] || '').trim() : '';
            const prevSourceId = fd._thermalSourceId || '';

            fd.tableRows.topic_1_0 = [this.toThermalTopicRow(newDev)];
            fd._thermalSourceId = newDev.id;
            fd._thermalInitialized = true;

            // Bölüm 4 (Ölçüm Aletleri Bilgileri) içinde termal kamera satırı varsa onu da senkronize et
            if (Array.isArray(fd.measuringDevices)) {
                const matchIdx = fd.measuringDevices.findIndex(r =>
                    isThermalDeviceObj(r)
                    || (prevSourceId && String(r.sourceId) === String(prevSourceId))
                    || (prevSerial && String(r.serial || '').trim() === prevSerial)
                );
                if (matchIdx >= 0) {
                    fd.measuringDevices[matchIdx] = this.toReportDeviceRow(newDev);
                    fd._devicesInitialized = true;
                }
            }

            if (insp && String(insp.template_id) === '2205' && fd.generator) {
                fd.generator.devices = fd.measuringDevices;
            }

            if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
            if (typeof window.paintInspectionEditorUI === 'function') window.paintInspectionEditorUI();
            if (typeof window.showToast === 'function') {
                window.showToast(`Termal kamera: ${getDeviceDisplayTitle(newDev)} seçildi`);
            }
            return true;
        },

        syncAssignedDevicesToCurrentReport(mode = 'replace') {
            const fd = window.AppState && window.AppState.currentFormData;
            const insp = window.AppState && window.AppState.currentInspection;
            if (!fd) return false;

            const assigned = this.getAssignedDevices();
            if (!assigned.length) {
                if (typeof window.showToast === 'function') {
                    window.showToast('Ayarlarda üzerinize kayıtlı cihaz bulunamadı', 'warning');
                }
                return false;
            }

            if (mode === 'replace') {
                fd.measuringDevices = assigned.map(d => this.toReportDeviceRow(d));
                if (insp && String(insp.template_id) === '2201') {
                    const thermalDev = assigned.find(isThermalDeviceObj);
                    if (thermalDev) {
                        if (!fd.tableRows) fd.tableRows = {};
                        fd.tableRows.topic_1_0 = [this.toThermalTopicRow(thermalDev)];
                        fd._thermalSourceId = thermalDev.id;
                        fd._thermalInitialized = true;
                    }
                }
            } else {
                if (!Array.isArray(fd.measuringDevices)) fd.measuringDevices = [];
                if (fd.measuringDevices.length === 1 && isDeviceRowBlank(fd.measuringDevices[0])) {
                    fd.measuringDevices = [];
                }
                const existingKeys = new Set(fd.measuringDevices.map(d =>
                    `${String(d.sourceId || '')}|${String(d.name || '').trim().toLowerCase()}|${String(d.serial || '').trim().toLowerCase()}`
                ));
                assigned.forEach(d => {
                    const row = this.toReportDeviceRow(d);
                    const key = `${String(row.sourceId || '')}|${String(row.name || '').trim().toLowerCase()}|${String(row.serial || '').trim().toLowerCase()}`;
                    if (!existingKeys.has(key)) {
                        fd.measuringDevices.push(row);
                    }
                });
            }

            fd._devicesInitialized = true;
            if (insp && String(insp.template_id) === '2205' && fd.generator) {
                fd.generator.devices = fd.measuringDevices;
            }

            if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
            if (typeof window.paintInspectionEditorUI === 'function') window.paintInspectionEditorUI();
            if (typeof window.showToast === 'function') {
                window.showToast(`Üzerinizdeki ${assigned.length} cihaz rapora aktarıldı`);
            }
            return true;
        },

        // ====================================================================
        // AYARLAR SAYFASI KART RENDER'I
        // ====================================================================
        renderSettingsCardHtml() {
            const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;
            const userName = curUser ? curUser.fullName : 'Aktif Personel';
            const locked = this.isCloudManaged();
            const assigned = this.getAssignedDevices();
            const catalog = this.getCatalog();
            const autoApply = this.isAutoApplyEnabled();

            const cardsHtml = assigned.length ? assigned.map((dev, idx) => {
                const calStatus = this.getCalibrationStatus(dev.validDate);
                const dispTitle = getDeviceDisplayTitle(dev);
                const isFirst = idx === 0;
                const isLast = idx === assigned.length - 1;
                const isTherm = isThermalDeviceObj(dev);

                return `
                    <div class="p-2.5 rounded-xl border border-slate-200 bg-slate-50/90 space-y-2">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <span class="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 font-black text-[10px] shrink-0">#${idx + 1}</span>
                                    ${dev.code ? `<span class="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 font-mono font-bold text-[10px] shrink-0">${esc(dev.code)}</span>` : ''}
                                    <span class="font-bold text-slate-900 text-xs truncate">${esc(dispTitle)}</span>
                                    ${isTherm ? `<span class="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-bold text-[9px] shrink-0"><i class="fa-solid fa-temperature-half mr-0.5"></i>Bölüm 3 + 4</span>` : ''}
                                </div>
                                <div class="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span class="font-semibold text-slate-700">${esc(dev.reportName || dev.category)}</span>
                                    <span class="text-slate-300">•</span>
                                    <span>Seri: <strong class="font-mono text-slate-800">${esc(dev.serial || '-')}</strong></span>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-full border font-bold text-[10px] shrink-0 ${calStatus.badgeClass}">
                                ${esc(calStatus.label)}
                            </span>
                        </div>

                        <div class="grid grid-cols-3 gap-1.5 text-[10px] bg-white border border-slate-200/80 rounded-lg p-1.5">
                            <div>
                                <span class="text-slate-400 block font-semibold">Kalibrasyon</span>
                                <span class="font-mono font-bold text-slate-800">${esc(dev.calDate || '-')}</span>
                            </div>
                            <div>
                                <span class="text-slate-400 block font-semibold">Geçerlilik</span>
                                <span class="font-mono font-bold ${calStatus.status === 'expired' ? 'text-rose-700' : 'text-slate-800'}">${esc(dev.validDate || '-')}</span>
                            </div>
                            <div>
                                <span class="text-slate-400 block font-semibold">Sertifika No</span>
                                <span class="font-mono font-bold text-slate-800 truncate block">${esc(dev.certNo || '-')}</span>
                            </div>
                        </div>

                        <div class="flex items-center justify-between gap-1.5 pt-0.5">
                            <div class="flex items-center gap-1">
                                <button type="button" onclick="MeasuringDevicesManager.handleMove('${esc(dev.id)}', -1)" ${isFirst ? 'disabled' : ''}
                                    class="px-2 py-1 rounded-lg border text-[10px] font-bold ${isFirst ? 'bg-slate-100 text-slate-300 border-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 active:scale-95'}" title="Yukarı Taşı">
                                    ▲
                                </button>
                                <button type="button" onclick="MeasuringDevicesManager.handleMove('${esc(dev.id)}', 1)" ${isLast ? 'disabled' : ''}
                                    class="px-2 py-1 rounded-lg border text-[10px] font-bold ${isLast ? 'bg-slate-100 text-slate-300 border-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 active:scale-95'}" title="Aşağı Taşı">
                                    ▼
                                </button>
                            </div>
                            ${locked ? '' : `
                                <div class="flex items-center gap-1.5 flex-wrap justify-end">
                                    <button type="button" onclick="openDeviceCatalogPickerModal('settings_swap', { oldDeviceId: '${esc(dev.id)}' })"
                                        class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition">
                                        <i class="fa-solid fa-right-left"></i>
                                        <span>Değiştir</span>
                                    </button>
                                    <button type="button" onclick="openDeviceEditModal('${esc(dev.id)}', { refreshSettings: true })"
                                        class="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold text-[11px] flex items-center gap-1 transition">
                                        <i class="fa-solid fa-pen"></i>
                                        <span>Düzenle</span>
                                    </button>
                                    <button type="button" onclick="MeasuringDevicesManager.handleUnassignFromSettings('${esc(dev.id)}')"
                                        class="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1 transition" title="Üzerimden Çıkar">
                                        <i class="fa-solid fa-xmark"></i>
                                        <span>Çıkar</span>
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }).join('') : `
                <div class="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 text-center space-y-1.5">
                    <div class="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-sm">
                        <i class="fa-solid fa-screwdriver-wrench"></i>
                    </div>
                    <div class="text-xs font-bold text-slate-800">${locked ? 'Henüz size cihaz atanmadı' : 'Üzerinizde ölçüm cihazı yok'}</div>
                </div>
            `;

            return `
                <div id="settingsMeasuringDevicesCard" class="card-craft-white p-3 space-y-2.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                        <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                            <i class="fa-solid fa-screwdriver-wrench text-amber-600 shrink-0"></i>
                            <span class="truncate">Ölçüm Cihazlarım</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            ${locked ? `
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <i class="fa-solid fa-cloud mr-0.5"></i>Yönetici Ataması
                                </span>
                            ` : ''}
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${assigned.length ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}">
                                ${assigned.length} Cihaz
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px]">
                        <label class="flex items-center gap-2 cursor-pointer font-semibold text-amber-950 flex-1 min-w-0">
                            <input type="checkbox" ${autoApply ? 'checked' : ''}
                                onchange="MeasuringDevicesManager.setAutoApplyEnabled(this.checked); showToast(this.checked ? 'Raporlara otomatik cihaz ekleme açıldı' : 'Otomatik ekleme kapatıldı');"
                                class="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 shrink-0">
                            <span class="leading-snug">Yeni raporlara otomatik eklensin</span>
                        </label>
                    </div>

                    <div class="space-y-2">
                        ${cardsHtml}
                    </div>

                    ${locked ? `
                        <div class="pt-1">
                            <button type="button" onclick="window.CloudAppSync && window.CloudAppSync.syncNow()"
                                class="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition">
                                <i class="fa-solid fa-arrows-rotate"></i>
                                <span>Buluttan Yenile</span>
                            </button>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <button type="button" onclick="openDeviceCatalogPickerModal('settings_assign')"
                                class="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition">
                                <i class="fa-solid fa-list-check"></i>
                                <span>Havuzdan Seç (${catalog.length})</span>
                            </button>
                            <button type="button" onclick="openDeviceEditModal(null, { assignByDefault: true, refreshSettings: true })"
                                class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition">
                                <i class="fa-solid fa-plus"></i>
                                <span>Yeni Cihaz Ekle</span>
                            </button>
                        </div>
                    `}
                </div>
            `;
        },

        handleMove(deviceId, dir) {
            if (this.moveAssignedDevice(deviceId, dir)) {
                if (typeof window.renderSettingsPage === 'function' && window.AppState && window.AppState.currentRoute === 'settings') {
                    window.renderSettingsPage();
                }
            }
        },

        handleUnassignFromSettings(deviceId) {
            if (this.isCloudManaged()) {
                if (typeof window.showToast === 'function') {
                    window.showToast('Cihaz atamaları yalnızca firma yöneticisi tarafından değiştirilebilir', 'warning');
                }
                return;
            }
            const dev = this.getDeviceById(deviceId);
            this.unassignDevice(deviceId);
            if (typeof window.renderSettingsPage === 'function' && window.AppState && window.AppState.currentRoute === 'settings') {
                window.renderSettingsPage();
            }
            if (typeof window.showToast === 'function') {
                window.showToast(`${dev ? getDeviceDisplayTitle(dev) : 'Cihaz'} üzerinizden çıkarıldı`, 'info');
            }
        }
    };

    // ========================================================================
    // MODALLAR: HAVUZ / DEĞİŞTİRME SEÇİCİSİ & CİHAZ EKLEME/DÜZENLEME
    // ========================================================================
    let _pickerState = {
        mode: 'settings_assign',
        context: {},
        searchQuery: '',
        categoryFilter: 'ALL'
    };

    function openDeviceCatalogPickerModal(mode = 'settings_assign', context = {}) {
        let initialCategory = 'ALL';
        if (mode === 'report_thermal_swap') {
            initialCategory = 'Termal Kamera';
        } else if (mode === 'settings_swap' && context.oldDeviceId) {
            const oldDev = MeasuringDevicesManager.getDeviceById(context.oldDeviceId);
            if (oldDev && oldDev.category) initialCategory = oldDev.category;
        } else if (mode === 'report_swap' && context.rowIdx !== undefined) {
            const row = window.AppState?.currentFormData?.measuringDevices?.[context.rowIdx];
            const inferred = MeasuringDevicesManager.inferCategoryForReportRow(row);
            if (inferred) initialCategory = inferred;
        }

        _pickerState = {
            mode,
            context: context || {},
            searchQuery: '',
            categoryFilter: initialCategory
        };
        renderDeviceCatalogPickerModal();
    }

    function setDevicePickerCategory(cat) {
        _pickerState.categoryFilter = cat;
        renderDeviceCatalogPickerModal();
    }

    function setDevicePickerSearch(query) {
        _pickerState.searchQuery = query || '';
        const listEl = document.getElementById('devicePickerListContainer');
        if (listEl) {
            listEl.innerHTML = buildDevicePickerListHtml();
        }
    }

    function renderDeviceCatalogPickerModal() {
        const mode = _pickerState.mode;
        const ctx = _pickerState.context;
        const locked = MeasuringDevicesManager.isCloudManaged();
        if (locked && (mode === 'settings_assign' || mode === 'settings_swap')) {
            if (typeof window.showToast === 'function') {
                window.showToast('Cihaz atamaları yalnızca firma yöneticisi web panelinden yapılabilir.', 'warning');
            }
            return;
        }
        const catalog = MeasuringDevicesManager.getCatalog();

        let modalTitle = '<i class="fa-solid fa-screwdriver-wrench text-amber-400 mr-2"></i>Ölçüm Cihazı Havuzu';
        let bannerHtml = '';
        let newDeviceContextOpts = { assignByDefault: true };

        if (mode === 'settings_assign') {
            const assignedCount = MeasuringDevicesManager.getAssignedDeviceIds().length;
            modalTitle = `<i class="fa-solid fa-list-check text-amber-400 mr-2"></i>Üzerime Cihaz Al (${assignedCount} Seçili)`;
            newDeviceContextOpts = { assignByDefault: true, reopenPicker: true };
        } else if (mode === 'settings_swap') {
            const oldDev = MeasuringDevicesManager.getDeviceById(ctx.oldDeviceId);
            modalTitle = `<i class="fa-solid fa-right-left text-sky-400 mr-2"></i>Cihaz Değiştir`;
            bannerHtml = `
                <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950">
                    <span class="font-semibold">Değiştirilecek:</span>
                    <strong class="ml-1">${esc(oldDev ? getDeviceDisplayTitle(oldDev) : 'Seçili Cihaz')}</strong>
                    ${oldDev && oldDev.serial ? `<span class="font-mono text-[10px] ml-1">(${esc(oldDev.serial)})</span>` : ''}
                </div>
            `;
            newDeviceContextOpts = {
                defaultCategory: (oldDev && oldDev.category) || '',
                assignByDefault: false,
                swapSettingsOldId: ctx.oldDeviceId
            };
        } else if (mode === 'report_swap') {
            const row = window.AppState?.currentFormData?.measuringDevices?.[ctx.rowIdx] || {};
            const rowLabel = [row.brand, row.model].filter(Boolean).join(' ') || row.name || `Cihaz #${Number(ctx.rowIdx) + 1}`;
            modalTitle = `<i class="fa-solid fa-right-left text-sky-400 mr-2"></i>Rapordaki Cihazı Değiştir`;
            bannerHtml = `
                <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950">
                    <span class="font-semibold">Şu an seçili:</span>
                    <strong class="ml-1">${esc(rowLabel)}</strong>
                    ${row.serial ? `<span class="font-mono text-[10px] ml-1">(${esc(row.serial)})</span>` : ''}
                </div>
            `;
            newDeviceContextOpts = {
                defaultCategory: MeasuringDevicesManager.inferCategoryForReportRow(row),
                assignByDefault: false,
                swapReportRowIdx: ctx.rowIdx
            };
        } else if (mode === 'report_thermal_swap') {
            const guids = getThermalCameraQuestions();
            const curRow = window.AppState?.currentFormData?.tableRows?.topic_1_0?.[0] || {};
            const curCamName = curRow[guids[0]] || 'Seçilmedi';
            const curCamSerial = curRow[guids[1]] || '';
            modalTitle = `<i class="fa-solid fa-temperature-half text-orange-400 mr-2"></i>Termal Kamera Seç / Değiştir`;
            bannerHtml = `
                <div class="p-2 rounded-xl bg-orange-50 border border-orange-200 text-[11px] text-orange-950">
                    <span class="font-semibold">Mevcut:</span>
                    <strong class="ml-1">${esc(curCamName)}</strong>
                    ${curCamSerial ? `<span class="font-mono text-[10px] ml-1">(${esc(curCamSerial)})</span>` : ''}
                </div>
            `;
            newDeviceContextOpts = {
                defaultCategory: 'Termal Kamera',
                assignByDefault: false,
                swapThermalReport: true
            };
        } else if (mode === 'report_add') {
            modalTitle = `<i class="fa-solid fa-plus text-emerald-400 mr-2"></i>Rapora Cihaz Ekle`;
            newDeviceContextOpts = {
                assignByDefault: false,
                addReportAfterSave: true
            };
        }

        const catCounts = {};
        catalog.forEach(d => {
            const c = d.category || 'Diğer';
            catCounts[c] = (catCounts[c] || 0) + 1;
        });

        const categoryChips = ['ALL', ...DEVICE_CATEGORIES.filter(c => catCounts[c] > 0 || _pickerState.categoryFilter === c)].map(c => {
            const isActive = _pickerState.categoryFilter === c;
            const label = c === 'ALL' ? `Tümü (${catalog.length})` : `${c} (${catCounts[c] || 0})`;
            return `
                <button type="button" onclick="setDevicePickerCategory('${esc(c)}')"
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold border transition whitespace-nowrap shrink-0 ${
                        isActive
                            ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }">
                    ${esc(label)}
                </button>
            `;
        }).join('');

        window._activeNewDeviceCtxOpts = newDeviceContextOpts;

        const bodyHtml = `
            <div class="space-y-2.5 text-xs">
                ${bannerHtml}

                <div class="flex items-center gap-1.5">
                    <div class="relative flex-1">
                        <i class="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
                        <input type="text" id="devicePickerSearchInput" value="${esc(_pickerState.searchQuery)}"
                            oninput="setDevicePickerSearch(this.value)"
                            placeholder="Marka, model, kod veya seri no ara (ör. Fluke, UNI-T, Metrel)..."
                            class="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-medium bg-white focus:border-sky-500 focus:outline-none">
                    </div>
                    ${locked ? '' : `
                        <button type="button" onclick="openDeviceEditModal(null, window._activeNewDeviceCtxOpts || {})"
                            class="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs">
                            <i class="fa-solid fa-plus"></i>
                            <span>Yeni</span>
                        </button>
                    `}
                </div>

                <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
                    ${categoryChips}
                </div>

                <div id="devicePickerListContainer" class="space-y-2 max-h-[46vh] overflow-y-auto pr-0.5">
                    ${buildDevicePickerListHtml()}
                </div>
            </div>
        `;

        const footerHtml = mode === 'settings_assign'
            ? `<button type="button" onclick="closeModal(); if(AppState.currentRoute==='settings' && typeof renderSettingsPage==='function') renderSettingsPage();" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm">Tamam (Kaydedildi)</button>`
            : `<button type="button" onclick="closeModal()" class="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs">Kapat</button>`;

        if (typeof window.openModal === 'function') {
            window.openModal(modalTitle, bodyHtml, footerHtml);
        }
    }

    function buildDevicePickerListHtml() {
        const mode = _pickerState.mode;
        const ctx = _pickerState.context;
        const locked = MeasuringDevicesManager.isCloudManaged();
        const q = (_pickerState.searchQuery || '').trim().toLowerCase();
        const catFilter = _pickerState.categoryFilter;
        const assignedIds = new Set(MeasuringDevicesManager.getAssignedDeviceIds().map(String));

        let items = MeasuringDevicesManager.getCatalog().filter(dev => {
            if (catFilter !== 'ALL' && (dev.category || 'Diğer') !== catFilter) return false;
            if (!q) return true;
            const hay = `${dev.brand} ${dev.model} ${dev.category} ${dev.reportName} ${dev.thermalReportName} ${dev.code} ${dev.serial} ${dev.certNo}`.toLowerCase();
            return hay.includes(q);
        });

        // Sıralama: report_add için önce üzerimdekiler, swap modlarında alternatifler
        items = [...items].sort((a, b) => {
            if (mode === 'report_add') {
                const aA = assignedIds.has(String(a.id)) ? 0 : 1;
                const bA = assignedIds.has(String(b.id)) ? 0 : 1;
                if (aA !== bA) return aA - bA;
            }
            return String(a.category || '').localeCompare(String(b.category || ''), 'tr');
        });

        if (!items.length) {
            return `
                <div class="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-2">
                    <div class="text-xs font-bold text-slate-600">${locked ? 'Üzerinize atanmış uygun cihaz bulunamadı' : 'Aramaya uygun cihaz bulunamadı'}</div>
                    ${locked ? '<div class="text-[11px] text-slate-500">Yöneticinizden web paneli üzerinden cihaz ataması isteyebilirsiniz.</div>' : `
                        <button type="button" onclick="openDeviceEditModal(null, window._activeNewDeviceCtxOpts || {})"
                            class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1">
                            <i class="fa-solid fa-plus"></i>
                            <span>Yeni Cihaz Olarak Ekle</span>
                        </button>
                    `}
                </div>
            `;
        }

        return items.map(dev => {
            const isMine = assignedIds.has(String(dev.id));
            const isSameOld = mode === 'settings_swap' && String(ctx.oldDeviceId) === String(dev.id);
            const cal = MeasuringDevicesManager.getCalibrationStatus(dev.validDate);
            const title = getDeviceDisplayTitle(dev);

            let primaryActionHtml = '';
            if (mode === 'settings_assign') {
                primaryActionHtml = `
                    <button type="button" onclick="handlePickerToggleAssign('${esc(dev.id)}')"
                        class="px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0 transition active:scale-95 ${
                            isMine
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        }">
                        <i class="fa-solid ${isMine ? 'fa-check' : 'fa-plus'}"></i>
                        <span>${isMine ? 'Üzerimde' : 'Üzerime Al'}</span>
                    </button>
                `;
            } else if (mode === 'settings_swap') {
                primaryActionHtml = isSameOld
                    ? `<span class="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] shrink-0">Mevcut</span>`
                    : `<button type="button" onclick="handlePickerSelectSwapSettings('${esc(ctx.oldDeviceId)}', '${esc(dev.id)}')"
                        class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 shadow-2xs">
                        <i class="fa-solid fa-check"></i>
                        <span>Bunu Seç</span>
                    </button>`;
            } else if (mode === 'report_swap') {
                primaryActionHtml = `
                    <button type="button" onclick="MeasuringDevicesManager.swapReportDevice(${Number(ctx.rowIdx)}, '${esc(dev.id)}'); closeModal();"
                        class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 shadow-2xs">
                        <i class="fa-solid fa-right-left"></i>
                        <span>Seç</span>
                    </button>
                `;
            } else if (mode === 'report_thermal_swap') {
                primaryActionHtml = `
                    <button type="button" onclick="MeasuringDevicesManager.swapReportThermalCamera('${esc(dev.id)}'); closeModal();"
                        class="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 shadow-2xs">
                        <i class="fa-solid fa-check"></i>
                        <span>Bunu Seç</span>
                    </button>
                `;
            } else if (mode === 'report_add') {
                primaryActionHtml = `
                    <button type="button" onclick="MeasuringDevicesManager.addReportDeviceFromCatalog('${esc(dev.id)}'); closeModal();"
                        class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 shadow-2xs">
                        <i class="fa-solid fa-plus"></i>
                        <span>Ekle</span>
                    </button>
                `;
            }

            return `
                <div class="p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                    isMine ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'
                }">
                    <div class="min-w-0 flex-1 space-y-0.5">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            ${dev.code ? `<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold text-[10px]">${esc(dev.code)}</span>` : ''}
                            <span class="font-bold text-slate-900 text-xs">${esc(title)}</span>
                            ${isMine && mode !== 'settings_assign' ? `<span class="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px]">Üzerimde</span>` : ''}
                            <span class="px-1.5 py-0.5 rounded-full border font-bold text-[9px] ${cal.badgeClass}">${esc(cal.label)}</span>
                        </div>
                        <div class="text-[11px] text-slate-600">
                            ${esc(dev.category)}${dev.serial ? ` · Seri: <span class="font-mono font-semibold text-slate-800">${esc(dev.serial)}</span>` : ''}
                        </div>
                        <div class="text-[10px] text-slate-500 font-mono">
                            Kal: ${esc(dev.calDate || '-')} · Geç: ${esc(dev.validDate || '-')}${dev.certNo ? ` · Sert: ${esc(dev.certNo)}` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        ${locked ? '' : `
                            <button type="button" onclick="openDeviceEditModal('${esc(dev.id)}', { reopenPicker: true })"
                                class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[11px]" title="Cihaz Bilgilerini Düzenle">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        `}
                        ${primaryActionHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    function handlePickerToggleAssign(deviceId) {
        if (MeasuringDevicesManager.isCloudManaged()) {
            if (typeof window.showToast === 'function') {
                window.showToast('Cihaz atamaları yalnızca firma yöneticisi tarafından değiştirilebilir', 'warning');
            }
            return;
        }
        const assigned = MeasuringDevicesManager.toggleAssignment(deviceId);
        const dev = MeasuringDevicesManager.getDeviceById(deviceId);
        renderDeviceCatalogPickerModal();
        if (window.AppState && window.AppState.currentRoute === 'settings' && typeof window.renderSettingsPage === 'function') {
            window.renderSettingsPage();
        }
        if (typeof window.showToast === 'function') {
            window.showToast(assigned ? `${getDeviceDisplayTitle(dev)} üzerinize alındı` : `${getDeviceDisplayTitle(dev)} üzerinizden çıkarıldı`);
        }
    }

    function handlePickerSelectSwapSettings(oldDeviceId, newDeviceId) {
        if (MeasuringDevicesManager.isCloudManaged()) {
            if (typeof window.showToast === 'function') {
                window.showToast('Cihaz atamaları yalnızca firma yöneticisi tarafından değiştirilebilir', 'warning');
            }
            return;
        }
        const oldDev = MeasuringDevicesManager.getDeviceById(oldDeviceId);
        const newDev = MeasuringDevicesManager.getDeviceById(newDeviceId);
        MeasuringDevicesManager.swapAssignedDevice(oldDeviceId, newDeviceId);
        if (typeof window.closeModal === 'function') window.closeModal();
        if (window.AppState && window.AppState.currentRoute === 'settings' && typeof window.renderSettingsPage === 'function') {
            window.renderSettingsPage();
        }
        if (typeof window.showToast === 'function') {
            window.showToast(`${getDeviceDisplayTitle(oldDev)} yerine ${getDeviceDisplayTitle(newDev)} seçildi`);
        }
    }

    let _editModalOptions = {};

    function openDeviceEditModal(deviceId = null, options = {}) {
        if (MeasuringDevicesManager.isCloudManaged()) {
            if (typeof window.showToast === 'function') {
                window.showToast('Cihaz ekleme ve düzenleme yalnızca firma yöneticisi web panelinden yapılabilir.', 'warning');
            }
            return;
        }
        _editModalOptions = options || {};
        const existing = deviceId ? MeasuringDevicesManager.getDeviceById(deviceId) : null;
        const isEdit = Boolean(existing);

        const defaultCat = (existing && existing.category) || _editModalOptions.defaultCategory || 'Termal Kamera';
        const isAssignedNow = existing
            ? MeasuringDevicesManager.isAssigned(existing.id)
            : (_editModalOptions.assignByDefault !== false);
        const defaultReportName = existing
            ? existing.reportName
            : (defaultCat === 'Diğer' ? '' : defaultCat);
        const isThermCat = defaultCat.toLowerCase().includes('termal');

        const catOptions = DEVICE_CATEGORIES.map(c =>
            `<option value="${esc(c)}" ${c === defaultCat ? 'selected' : ''}>${esc(c)}</option>`
        ).join('');

        const titleHtml = isEdit
            ? `<i class="fa-solid fa-pen-to-square text-amber-400 mr-2"></i>Ölçüm Cihazını Düzenle`
            : `<i class="fa-solid fa-plus text-emerald-400 mr-2"></i>Yeni Ölçüm Cihazı Tanımla`;

        const bodyHtml = `
            <div class="space-y-2.5 text-xs">
                <input type="hidden" id="devFormId" value="${esc(existing ? existing.id : '')}">

                <div>
                    <label class="block font-bold text-slate-700 mb-1">Cihaz Kategorisi</label>
                    <select id="devFormCategory" onchange="onDeviceFormCategoryChange(this.value)"
                        class="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold bg-white">
                        ${catOptions}
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Marka</label>
                        <input type="text" id="devFormBrand" value="${esc(existing ? existing.brand : '')}"
                            placeholder="Örn: UNI-T, Fluke, Metrel"
                            class="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-white">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Model</label>
                        <input type="text" id="devFormModel" value="${esc(existing ? existing.model : '')}"
                            placeholder="Örn: UTi165A, TiS40, MI 3102 BT"
                            class="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-white">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Cihaz Kodu (İsteğe Bağlı)</label>
                        <input type="text" id="devFormCode" value="${esc(existing ? existing.code : '')}"
                            placeholder="Örn: C.105"
                            class="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono bg-white">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Seri Numarası</label>
                        <input type="text" id="devFormSerial" value="${esc(existing ? existing.serial : '')}"
                            placeholder="Örn: 201266702"
                            class="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold bg-white">
                    </div>
                </div>

                <div>
                    <label class="block font-bold text-slate-700 mb-1">Rapor Tablosundaki Cihaz Adı <span class="text-[10px] font-normal text-slate-400">(Ölçüm Aletleri Bilgileri)</span></label>
                    <input type="text" id="devFormReportName" value="${esc(defaultReportName)}"
                        placeholder="Örn: Termal Kamera, Çok Fonksiyonlu Test Cihazı"
                        class="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-white">
                </div>

                <div id="devFormThermalNameWrap" class="${isThermCat ? '' : 'hidden'}">
                    <label class="block font-bold text-orange-900 mb-1">Bölüm 3 Termal Kamera Adı <span class="text-[10px] font-normal text-orange-700">(Elektrik İç Tesisatı Raporu)</span></label>
                    <input type="text" id="devFormThermalName" value="${esc(existing ? existing.thermalReportName : '')}"
                        placeholder="Örn: UNI-T UTi165A veya Fluke TiS40 (Boş = Marka Model)"
                        class="w-full border border-orange-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-orange-50/40">
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span>Kalibrasyon Tarihi</span>
                            <button type="button" onclick="autoFillValidDatePlusOneYear()" class="text-[10px] font-bold text-sky-700 hover:underline">+1 Yıl</button>
                        </label>
                        <input type="text" id="devFormCalDate" value="${esc(existing ? existing.calDate : '')}"
                            placeholder="GG.AA.YYYY"
                            class="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono bg-white">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Geçerlilik Tarihi</label>
                        <input type="text" id="devFormValidDate" value="${esc(existing ? existing.validDate : '')}"
                            placeholder="GG.AA.YYYY"
                            class="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono bg-white">
                    </div>
                </div>

                <div>
                    <label class="block font-bold text-slate-700 mb-1">Kalibrasyon Sertifika No</label>
                    <input type="text" id="devFormCertNo" value="${esc(existing ? existing.certNo : '')}"
                        placeholder="Örn: 0074K-0626-01712"
                        class="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono bg-white">
                </div>

                <label class="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer">
                    <input type="checkbox" id="devFormAssignToMe" ${isAssignedNow ? 'checked' : ''}
                        class="w-4 h-4 rounded border-emerald-400 text-emerald-600">
                    <span class="font-bold text-emerald-950 text-xs">Üzerimde olsun (Yeni raporlara otomatik eklensin)</span>
                </label>

                ${isEdit && existing.isCustom ? `
                    <div class="pt-1 border-t border-slate-100 flex justify-end">
                        <button type="button" onclick="handleDeleteCustomCatalogDevice('${esc(existing.id)}')"
                            class="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center gap-1 border border-rose-200">
                            <i class="fa-solid fa-trash-can"></i>
                            <span>Cihazı Havuzdan Kalıcı Sil</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        const footerHtml = `
            <button type="button" onclick="${_editModalOptions.reopenPicker ? 'renderDeviceCatalogPickerModal()' : 'closeModal()'}"
                class="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs">
                ${_editModalOptions.reopenPicker ? 'Geri' : 'İptal'}
            </button>
            <button type="button" onclick="submitDeviceEditModal()"
                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center gap-1.5">
                <i class="fa-solid fa-check"></i>
                <span>Kaydet</span>
            </button>
        `;

        if (typeof window.openModal === 'function') {
            window.openModal(titleHtml, bodyHtml, footerHtml);
        }
    }

    function onDeviceFormCategoryChange(cat) {
        const isTherm = String(cat || '').toLowerCase().includes('termal');
        const wrap = document.getElementById('devFormThermalNameWrap');
        if (wrap) wrap.classList.toggle('hidden', !isTherm);

        const repInput = document.getElementById('devFormReportName');
        if (repInput) {
            const curVal = repInput.value.trim();
            if (!curVal || DEVICE_CATEGORIES.includes(curVal)) {
                repInput.value = cat === 'Diğer' ? '' : cat;
            }
        }
    }

    function autoFillValidDatePlusOneYear() {
        const calInput = document.getElementById('devFormCalDate');
        const valInput = document.getElementById('devFormValidDate');
        if (!calInput || !valInput) return;
        const nextDate = addOneYearTrDate(calInput.value);
        if (nextDate) {
            valInput.value = nextDate;
        } else if (typeof window.showToast === 'function') {
            window.showToast('Önce GG.AA.YYYY formatında kalibrasyon tarihi girin', 'warning');
        }
    }

    function submitDeviceEditModal() {
        const id = document.getElementById('devFormId')?.value || '';
        const category = document.getElementById('devFormCategory')?.value || 'Diğer';
        const brand = document.getElementById('devFormBrand')?.value.trim() || '';
        const model = document.getElementById('devFormModel')?.value.trim() || '';
        const code = document.getElementById('devFormCode')?.value.trim() || '';
        const serial = document.getElementById('devFormSerial')?.value.trim() || '';
        const reportName = document.getElementById('devFormReportName')?.value.trim() || '';
        const thermalReportName = document.getElementById('devFormThermalName')?.value.trim() || '';
        const calDate = document.getElementById('devFormCalDate')?.value.trim() || '';
        const validDate = document.getElementById('devFormValidDate')?.value.trim() || '';
        const certNo = document.getElementById('devFormCertNo')?.value.trim() || '';
        const assignChecked = Boolean(document.getElementById('devFormAssignToMe')?.checked);

        if (!brand && !model && !reportName) {
            if (typeof window.showToast === 'function') {
                window.showToast('Lütfen en az marka/model veya cihaz adı girin', 'warning');
            }
            return;
        }

        const saved = MeasuringDevicesManager.saveCatalogDevice({
            id: id || undefined,
            category,
            brand,
            model,
            code,
            serial,
            reportName,
            thermalReportName,
            isThermal: category.toLowerCase().includes('termal'),
            calDate,
            validDate,
            certNo
        }, assignChecked);

        const opts = _editModalOptions || {};

        if (opts.swapSettingsOldId) {
            MeasuringDevicesManager.swapAssignedDevice(opts.swapSettingsOldId, saved.id);
        }
        if (opts.swapReportRowIdx !== undefined) {
            MeasuringDevicesManager.swapReportDevice(opts.swapReportRowIdx, saved.id);
            closeModal();
            return;
        }
        if (opts.swapThermalReport) {
            MeasuringDevicesManager.swapReportThermalCamera(saved.id);
            closeModal();
            return;
        }
        if (opts.addReportAfterSave) {
            MeasuringDevicesManager.addReportDeviceFromCatalog(saved.id);
            closeModal();
            return;
        }

        if (opts.reopenPicker) {
            renderDeviceCatalogPickerModal();
        } else if (typeof window.closeModal === 'function') {
            window.closeModal();
        }

        if (window.AppState && window.AppState.currentRoute === 'settings' && typeof window.renderSettingsPage === 'function') {
            window.renderSettingsPage();
        }
        if (typeof window.showToast === 'function') {
            window.showToast(`${getDeviceDisplayTitle(saved)} kaydedildi!`);
        }
    }

    function handleDeleteCustomCatalogDevice(deviceId) {
        const dev = MeasuringDevicesManager.getDeviceById(deviceId);
        if (!confirm(`"${dev ? getDeviceDisplayTitle(dev) : 'Cihaz'}" havuzdan kalıcı olarak silinsin mi?`)) return;
        MeasuringDevicesManager.deleteCatalogDevice(deviceId);
        if (_editModalOptions && _editModalOptions.reopenPicker) {
            renderDeviceCatalogPickerModal();
        } else if (typeof window.closeModal === 'function') {
            window.closeModal();
        }
        if (window.AppState && window.AppState.currentRoute === 'settings' && typeof window.renderSettingsPage === 'function') {
            window.renderSettingsPage();
        }
        if (typeof window.showToast === 'function') {
            window.showToast('Cihaz havuzdan silindi', 'info');
        }
    }

    function openReportSwapDeviceModal(rowIdx) {
        openDeviceCatalogPickerModal('report_swap', { rowIdx });
    }

    function openReportAddDeviceModal() {
        openDeviceCatalogPickerModal('report_add', {});
    }

    function openReportThermalSwapModal() {
        openDeviceCatalogPickerModal('report_thermal_swap', {});
    }

    function applyAssignedThermalCameraToReport() {
        const thermalDev = MeasuringDevicesManager.getAssignedThermalCamera();
        if (!thermalDev) {
            if (typeof window.showToast === 'function') {
                window.showToast('Ayarlarda üzerinizde tanımlı termal kamera yok; buradan seçebilirsiniz', 'warning');
            }
            openReportThermalSwapModal();
            return;
        }
        MeasuringDevicesManager.swapReportThermalCamera(thermalDev.id);
    }

    function syncSettingsDevicesToCurrentReportPrompt() {
        const assigned = MeasuringDevicesManager.getAssignedDevices();
        if (!assigned.length) {
            if (typeof window.showToast === 'function') {
                window.showToast('Ayarlarda üzerinize kayıtlı cihaz bulunmuyor. Önce havuzdan seçin.', 'warning');
            }
            openDeviceCatalogPickerModal('report_add', {});
            return;
        }

        const fd = window.AppState && window.AppState.currentFormData;
        const curDevices = (fd && Array.isArray(fd.measuringDevices)) ? fd.measuringDevices : [];
        const hasRealEntries = curDevices.some(d => !isDeviceRowBlank(d));

        if (!hasRealEntries) {
            MeasuringDevicesManager.syncAssignedDevicesToCurrentReport('replace');
            return;
        }

        const modalHtml = `
            <div class="space-y-2.5 text-xs">
                <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                    Raporda <strong>${curDevices.length}</strong>, üzerinizde <strong>${assigned.length} cihaz</strong> var.
                </div>
                <div class="space-y-2">
                    <button type="button" onclick="MeasuringDevicesManager.syncAssignedDevicesToCurrentReport('replace'); closeModal();"
                        class="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-left flex items-center justify-between gap-2">
                        <span class="text-amber-300">Mevcut Listeyi Yenile</span>
                        <i class="fa-solid fa-arrows-rotate text-amber-400"></i>
                    </button>
                    <button type="button" onclick="MeasuringDevicesManager.syncAssignedDevicesToCurrentReport('append'); closeModal();"
                        class="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 font-bold text-left flex items-center justify-between gap-2">
                        <span>Eksik Olanları Sona Ekle</span>
                        <i class="fa-solid fa-plus text-emerald-700"></i>
                    </button>
                </div>
            </div>
        `;
        if (typeof window.openModal === 'function') {
            window.openModal(
                '<i class="fa-solid fa-arrows-rotate text-amber-400 mr-2"></i>Ayarlarımdaki Cihazları Aktar',
                modalHtml,
                `<button type="button" onclick="closeModal()" class="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs">Vazgeç</button>`
            );
        }
    }

    // Global dışa aktarım
    window.MeasuringDevicesManager = MeasuringDevicesManager;
    window.openDeviceCatalogPickerModal = openDeviceCatalogPickerModal;
    window.renderDeviceCatalogPickerModal = renderDeviceCatalogPickerModal;
    window.setDevicePickerCategory = setDevicePickerCategory;
    window.setDevicePickerSearch = setDevicePickerSearch;
    window.handlePickerToggleAssign = handlePickerToggleAssign;
    window.handlePickerSelectSwapSettings = handlePickerSelectSwapSettings;
    window.openDeviceEditModal = openDeviceEditModal;
    window.onDeviceFormCategoryChange = onDeviceFormCategoryChange;
    window.autoFillValidDatePlusOneYear = autoFillValidDatePlusOneYear;
    window.submitDeviceEditModal = submitDeviceEditModal;
    window.handleDeleteCustomCatalogDevice = handleDeleteCustomCatalogDevice;
    window.openReportSwapDeviceModal = openReportSwapDeviceModal;
    window.openReportAddDeviceModal = openReportAddDeviceModal;
    window.openReportThermalSwapModal = openReportThermalSwapModal;
    window.applyAssignedThermalCameraToReport = applyAssignedThermalCameraToReport;
    window.syncSettingsDevicesToCurrentReportPrompt = syncSettingsDevicesToCurrentReportPrompt;
})();


// ============================================================================
// HIZLI RAPOR - 01-CORE.JS
// Açıklama: Çekirdek Sistem, AppState, Auth, Navigasyon, Modal ve Toastlar
// Satır Aralığı: 1 - 1685 (1685 satır)
// ============================================================================



function calculateInspectionProgress(insp, fd) {

    let total = 0;

    let answered = 0;

    let defects = 0;



    if (String(insp.template_id) === '2201' && AppState.electricalTemplate) {

        (AppState.electricalTemplate.areas || []).forEach(a => {

            (a.topics || []).forEach(t => {

                (t.questions || []).forEach(q => {

                    if (q.type === 'YesNo') {

                        total++;

                        const ans = fd.answers?.[`q_${q.guid}`];

                        if (ans) answered++;

                        if (ans === 'Uygun Değil' || ans === 'Kısmen Uygun') defects++;

                    }

                });

            });

        });

    } else if (String(insp.template_id) === '2202' && fd.grounding) {

        total = (fd.grounding.points || []).length || 1;

        (fd.grounding.points || []).forEach(p => {

            if (p.point && p.zxRx) answered++;

            if (p.result && p.result !== 'Not-1' && p.result !== 'Not-4') defects++;

        });

    } else if (String(insp.template_id) === '2205' && fd.generator) {

        const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);

        total = (schema.visualChecks || []).length || 10;

        (schema.visualChecks || []).forEach((_, idx) => {

            const c = fd.specializedChecks?.[`chk_${idx}`];

            if (c) answered++;

            if (c === 'Uygun Değil') defects++;

        });

    } else {

        total = 10;

        answered = 5;

    }



    const percent = total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 100;

    const unanswered = Math.max(0, total - answered);

    return { total, answered, unanswered, defects, percent };


}



// ============================================================================

// ENLAB v2.7.90 FULL APPLICATION ENGINE (Part A: Core, Normalizers, Navigation, Lists & Work Orders)

// ============================================================================



// ============================================================================

// COMPANY BRANDING & WHITE-LABEL CUSTOMIZATION ENGINE

// ============================================================================

const DEFAULT_COMPANY_BRANDING = {

    companyFullName: 'Mühendislik Muayene ve Periyodik Kontrol Hizmetleri',

    companyShortName: 'Hızlı Rapor',

    companyAddress: 'İstanbul / Türkiye',

    companyPhone: '',

    companyEmail: '',

    companyWeb: '',

    customCompanyLogo: null,

    customTurkakLogo: null,

    showTurkakLogo: true,

    accreditationNo: 'AB-0227-M',

    accreditationStandard: 'TS EN ISO/IEC 17020',

    reportNoPrefix: 'HZL-',

    defaultRevisionInfo: 'REV.00',

    footerDisclaimer: 'Muayene sonuçları sadece talep edilen hizmet veya muayene edilen ürün/parti veya proses ile ilgili olup, başka hizmet veya muayene edilmeyen ürün/ parti veya proses için geçerli değildir. Muayene raporları {COMPANY_NAME} ve müşterinin onayı olmaksızın kısmi olarak veya tamamen kopya edilip çoğaltılamaz. İmzasız raporlar geçersizdir. Bu rapor elektronik ortamda bir nüsha olarak hazırlanmıştır.'

};




const CompanySettingsManager = {

    STORAGE_KEY: 'enlab_company_branding_v3',



    getSettings() {

        try {

            let raw = localStorage.getItem(this.STORAGE_KEY);

            if (!raw) {

                // Check legacy v2 storage and migrate

                const legacy = localStorage.getItem('enlab_company_branding_v2');

                if (legacy) {

                    const parsed = JSON.parse(legacy);

                    if (parsed.companyShortName === 'TEKKOMER' || parsed.companyShortName === 'ENLAB') parsed.companyShortName = 'Hızlı Rapor';

                    if (parsed.companyFullName && parsed.companyFullName.includes('TEKNİK KONTROL MERKEZİ')) {

                        parsed.companyFullName = DEFAULT_COMPANY_BRANDING.companyFullName;

                    }

                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));

                    return { ...DEFAULT_COMPANY_BRANDING, ...parsed };


                }

            } else {

                const parsed = JSON.parse(raw);

                if (parsed.companyShortName === 'TEKKOMER' || parsed.companyShortName === 'ENLAB') parsed.companyShortName = 'Hızlı Rapor';
                if (parsed.companyFullName && /KOMTROL/i.test(parsed.companyFullName)) {
                    parsed.companyFullName = parsed.companyFullName.replace(/KOMTROL/gi, 'KONTROL');
                    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed)); } catch (e) {}
                }

                return { ...DEFAULT_COMPANY_BRANDING, ...parsed };


            }

        } catch (e) {

            console.error('CompanySettingsManager load error:', e);

        }

        return { ...DEFAULT_COMPANY_BRANDING };


    },



    saveSettings(newSettings) {

        try {

            const current = this.getSettings();

            const merged = { ...current, ...newSettings };


            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));

            this.syncHeaderTitle();

            return { success: true, message: 'Şirket ve rapor ayarları başarıyla kaydedildi.' };


        } catch (e) {

            console.error('CompanySettingsManager save error:', e);

            return { success: false, message: 'Ayarlar kaydedilemedi: ' + e.message };


        }

    },



    resetToDefault() {

        try {

            localStorage.removeItem(this.STORAGE_KEY);

            localStorage.removeItem('enlab_company_branding_v2');

            this.syncHeaderTitle();

            return { success: true, message: 'Varsayılan şirket ve rapor ayarlarına sıfırlandı.' };


        } catch (e) {

            return { success: false, message: e.message };


        }

    },



    getLogoSrc() {

        const s = this.getSettings();

        if (s.customCompanyLogo) return s.customCompanyLogo;

        return (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.tekkomerLogo) || 'assets/tekkomer_logo.png';

    },



    getTurkakLogoSrc() {

        const s = this.getSettings();

        if (s.customTurkakLogo) return s.customTurkakLogo;

        return (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.turkakLogo) || 'assets/turkak_logo.jpg';

    },



    getCompanyFullName() {

        return this.getSettings().companyFullName || DEFAULT_COMPANY_BRANDING.companyFullName;

    },



    getCompanyShortName() {

        return this.getSettings().companyShortName || DEFAULT_COMPANY_BRANDING.companyShortName;

    },



    getFooterDisclaimer() {

        const s = this.getSettings();

        const base = s.footerDisclaimer || DEFAULT_COMPANY_BRANDING.footerDisclaimer;

        return base.replace(/\{COMPANY_NAME\}/g, s.companyFullName || 'ŞİRKET');

    },



    syncHeaderTitle() {
        const s = this.getSettings();
        const isCustom = s.companyShortName && s.companyShortName !== 'TEKKOMER' && s.companyShortName !== 'ENLAB' && s.companyShortName !== 'Hızlı Rapor';
        const brandName = isCustom ? s.companyShortName : 'Hızlı Rapor';

        // 1. Header Metinleri
        const titleEl = document.getElementById('appHeaderBrandTitle');
        if (titleEl) {
            titleEl.innerText = brandName;
        }
        document.title = isCustom ? `${brandName} - Hızlı Rapor` : 'Hızlı Rapor - Saha Muayene & Test';

        // 2. Header Logosu: Şirketin yüklediği logo varsa doğrudan onu göster
        const logoWrapper = document.getElementById('appHeaderLogoWrapper');
        if (logoWrapper) {
            if (s.customCompanyLogo) {
                logoWrapper.innerHTML = `<img src="${s.customCompanyLogo}" alt="${escapeHtml(brandName)}" class="h-full w-full object-contain p-0.5 bg-white rounded-md">`;
                logoWrapper.className = 'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-white border border-slate-600 shadow-2xs';
            } else {
                logoWrapper.innerHTML = `<i class="fa-solid fa-bolt-lightning text-slate-950 text-xs"></i>`;
                logoWrapper.className = 'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-br from-amber-400 to-amber-500 border border-amber-300 text-slate-950 font-black shadow-2xs';
            }
        }

        // 3. Favicon Senkronizasyonu
        try {
            let link = document.querySelector("link[rel*='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            if (s.customCompanyLogo) {
                link.href = s.customCompanyLogo;
            }
        } catch (e) {}

        // 4. Ana Sayfadaki Dinamik Logo ve İsim Alanı
        const homeBrandNameEl = document.getElementById('homeBrandTitleText');
        if (homeBrandNameEl) {
            homeBrandNameEl.innerText = brandName;
        }
        const homeLogoWrapper = document.getElementById('homeBrandLogoWrapper');
        if (homeLogoWrapper) {
            if (s.customCompanyLogo) {
                homeLogoWrapper.innerHTML = `<img src="${s.customCompanyLogo}" alt="${escapeHtml(brandName)}" class="h-10 w-10 object-contain p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">`;
            } else {
                homeLogoWrapper.innerHTML = `<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-2xs border border-amber-300">
                    <i class="fa-solid fa-bolt-lightning text-slate-950"></i>
                </div>`;
            }
        }

    }

};

const ReportDateTimePrefs = {
    STORAGE_KEY: 'enlab_report_datetime_prefs_v1',
    DEFAULTS: {
        fixedStartTime: '',
        fixedEndTime: '',
        validityMonths: {
            '2201': 12,
            '2202': 12,
            '2205': 12,
            'default': 12
        }
    },
    get() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(this.DEFAULTS));
            const parsed = JSON.parse(raw);
            return {
                fixedStartTime: typeof parsed.fixedStartTime === 'string' ? parsed.fixedStartTime : '',
                fixedEndTime: typeof parsed.fixedEndTime === 'string' ? parsed.fixedEndTime : '',
                validityMonths: Object.assign({}, this.DEFAULTS.validityMonths, parsed.validityMonths || {})
            };
        } catch (e) {
            return JSON.parse(JSON.stringify(this.DEFAULTS));
        }
    },
    save(nextPrefs) {
        const current = this.get();
        const merged = {
            fixedStartTime: nextPrefs.fixedStartTime !== undefined ? String(nextPrefs.fixedStartTime || '').trim() : current.fixedStartTime,
            fixedEndTime: nextPrefs.fixedEndTime !== undefined ? String(nextPrefs.fixedEndTime || '').trim() : current.fixedEndTime,
            validityMonths: Object.assign({}, current.validityMonths, nextPrefs.validityMonths || {})
        };
        try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged)); } catch (e) {}
        return merged;
    },
    getValidityMonths(templateId) {
        const prefs = this.get();
        const tid = String(templateId || '').trim();
        const val = parseInt(prefs.validityMonths[tid] ?? prefs.validityMonths['default'] ?? 12, 10);
        return (Number.isFinite(val) && val > 0) ? val : 12;
    },
    setValidityMonth(templateId, months) {
        const tid = String(templateId || 'default').trim();
        const num = parseInt(months, 10);
        const safe = (Number.isFinite(num) && num >= 1 && num <= 120) ? num : 12;
        const cur = this.get();
        cur.validityMonths[tid] = safe;
        return this.save(cur);
    },
    clearFixedTimes() {
        return this.save({ fixedStartTime: '', fixedEndTime: '' });
    }
};
window.ReportDateTimePrefs = ReportDateTimePrefs;

function getLocalTodayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getLocalNowHHMM() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toIsoDate(val) {
    const s = String(val || '').trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return '';
}

function toTrDate(val) {
    const s = String(val || '').trim();
    if (!s) return '';
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
    const iso = toIsoDate(s);
    if (!iso) return s;
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
}

function addDaysIso(isoDate, days) {
    const iso = toIsoDate(isoDate) || getLocalTodayIso();
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d + (Number(days) || 0));
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function addMonthsIso(isoDate, months) {
    const iso = toIsoDate(isoDate) || getLocalTodayIso();
    const [y, m, d] = iso.split('-').map(Number);
    const totalMonths = (y * 12 + (m - 1)) + (parseInt(months, 10) || 12);
    const targetY = Math.floor(totalMonths / 12);
    const targetM = totalMonths % 12;
    const maxDay = new Date(targetY, targetM + 1, 0).getDate();
    const targetD = Math.min(d, maxDay);
    return `${targetY}-${String(targetM + 1).padStart(2, '0')}-${String(targetD).padStart(2, '0')}`;
}

function formatStartEndTimeDisplay(startIso, startTime, endIso, endTime) {
    const sDate = toTrDate(startIso);
    const eDate = toTrDate(endIso || startIso);
    const st = String(startTime || '').trim();
    const et = String(endTime || '').trim();
    if (sDate && st && et) {
        if (!eDate || eDate === sDate) return `${sDate} ${st} - ${et}`;
        return `${sDate} ${st} - ${eDate} ${et}`;
    }
    if (sDate && st) return `${sDate} ${st}`;
    if (sDate && et) return `${sDate} - ${et}`;
    if (sDate) return sDate;
    if (st && et) return `${st} - ${et}`;
    return st || et || '';
}

window.getLocalTodayIso = getLocalTodayIso;
window.getLocalNowHHMM = getLocalNowHHMM;
window.toIsoDate = toIsoDate;
window.toTrDate = toTrDate;
window.addDaysIso = addDaysIso;
window.addMonthsIso = addMonthsIso;
window.formatStartEndTimeDisplay = formatStartEndTimeDisplay;




function compressLogoImage(file, maxDim = 320, callback) {

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        const img = new Image();

        img.onload = function() {

            let w = img.width;

            let h = img.height;

            if (w > maxDim || h > maxDim) {

                if (w > h) {

                    h = Math.round((h * maxDim) / w);

                    w = maxDim;

                } else {

                    w = Math.round((w * maxDim) / h);

                    h = maxDim;

                }

            }

            const canvas = document.createElement('canvas');

            canvas.width = w;

            canvas.height = h;

            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0, w, h);

            const dataUrl = canvas.toDataURL('image/png', 0.92);

            canvas.width = 0;

            canvas.height = 0;

            callback(dataUrl);

        };


        img.src = e.target.result;

    };


    reader.readAsDataURL(file);

}



const AppState = {

    currentRoute: 'home',

    currentParams: {},

    activeTab: '',

    counts: {},

    electricalTemplate: null,

    instruments: [],

    calibrations: [],

    calendarEvents: [],

    workOrdersCache: [],

    inspectionsCache: [],

    currentWorkOrder: null,

    currentInspection: null,

    currentFormData: {},

    activeAreaIndex: 0,

    showAllAreas: false,

    saveTimer: null

};


window.AppState = AppState;



// Normalize DB Work Order row from server.js

function normalizeWorkOrder(w) {

    if (!w) return {};


    let files = [];

    try { files = typeof w.files_json === 'string' ? JSON.parse(w.files_json || '[]') : (w.files || []); } catch (e) {}

    return Object.assign({}, w, {

        work_order_no: w.code || w.work_order_no || `TKM-${w.id}`,

        customer_name: w.company_name || w.customer_name || '',

        customer_branch: w.company_branch || '',

        customer_address: [w.company_branch, w.company_address || w.customer_address].filter(Boolean).join(' - ') || '',

        isg_katip_no: w.isg_katip_no || '',

        sgk_sicil_no: w.sgk_sicil_no || '',

        contact_email: w.contact_email || w.customer_email || '',

        assigned_to: w.inspectors || w.assigned_to || 'Ali Şamil Aytekin',

        planner_name: w.planner || '',

        is_open: w.status === 'Açık' || w.status === 'open',

        files

    });

}



// Normalize DB Inspection row from server.js

function normalizeInspection(i) {

    if (!i) return {};


    let formData = {};


    try {

        formData = typeof i.data_json === 'string' ? JSON.parse(i.data_json || '{}') : (i.form_data || {});

    } catch (e) {}

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    return Object.assign({}, i, {

        work_order_no: i.work_order_code || i.work_order_no || '',

        customer_name: i.company_name || i.customer_name || '',

        inspector_name: i.inspector || i.inspector_name || (curUser ? curUser.fullName : 'Ali Şamil Aytekin'),

        inspector_title: i.inspector_title || (curUser ? curUser.title : 'Elektrik Mühendisi'),

        ministry_reg_no: i.ministry_reg_no || (curUser ? curUser.ministryRegNo : 'K2023224376'),

        diploma_no: i.diploma_no || (curUser ? curUser.diplomaNoDate : '249538 / 28.09.2022'),

        result_status: i.result || i.result_status || 'UYGUN',

        form_data: formData

    });

}



// Initialize Application on Load

window.addEventListener('DOMContentLoaded', async () => {

    await loadInitData();

    await preloadInstruments();

    

    // Auth Check

    const curUser = AuthManager.getCurrentUser();

    updateHeaderUserWidget();

    if (typeof CompanySettingsManager !== 'undefined') {

        CompanySettingsManager.syncHeaderTitle();

    }

    if (!curUser) {

        renderAuthScreen();

    } else {

        navigateTo('home');

        if (curUser.isCloudManaged && navigator.onLine !== false && window.CloudAppSync && typeof window.CloudAppSync.syncNow === 'function') {

            window.CloudAppSync.syncNow({ silent: true });

        }

    }



    document.addEventListener('click', (e) => {

        if (!e.target.closest('#toolsDropdown') && !e.target.closest('[onclick*="toolsDropdown"]')) {

            document.getElementById('toolsDropdown')?.classList.add('hidden');

        }

        if (!e.target.closest('#userDropdown') && !e.target.closest('[onclick*="userDropdown"]')) {

            document.getElementById('userDropdown')?.classList.add('hidden');

        }

        if (!e.target.closest('.row-action-menu') && !e.target.closest('.row-action-btn')) {

            document.querySelectorAll('.row-action-menu').forEach(el => el.classList.add('hidden'));

        }

        if (!e.target.closest('[id^="linyeDropdown_"]') && !e.target.closest('[id^="pt_name_"]')) {

            document.querySelectorAll('[id^="linyeDropdown_"]').forEach(el => el.classList.add('hidden'));

        }

    });

});



async function loadInitData() {

    try {

        const res = await fetch('/api/init');

        const data = await res.json();

        const c = data.counts || {};


        AppState.counts = {

            allWorkOrdersOpen: c.allOpenWO ?? c.allWorkOrdersOpen ?? 52,

            allWorkOrdersClosed: c.allClosedWO ?? 6,

            myWorkOrdersOpen: c.myOpenWO ?? c.myWorkOrdersOpen ?? 31,

            allInspectionsCurrent: c.allActiveInsp ?? c.allInspectionsCurrent ?? 64,

            myInspectionsCurrent: c.myActiveInsp ?? c.myInspectionsCurrent ?? 48,

            toApprovePending: c.toApproveInsp ?? c.toApprovePending ?? 24,

            activeInstruments: c.activeInst ?? c.activeInstruments ?? 14

        };


        if (Array.isArray(data.electricalTemplate)) {

            AppState.electricalTemplate = { areas: data.electricalTemplate };


        } else if (data.electricalTemplate && data.electricalTemplate.areas) {

            AppState.electricalTemplate = data.electricalTemplate;

        }

        AppState.calendarEvents = data.events || data.calendar || [];

        updateSidebarBadges();

    } catch (err) {

        console.error('Init yükleme hatası:', err);

        setSyncStatus(false, 'Çevrimdışı Mod (Yerel Önbellek)');

    }

}



async function preloadInstruments() {

    try {

        const res = await fetch('/api/instruments');

        const data = await res.json();

        AppState.instruments = data.instruments || [];

        AppState.calibrations = data.calibrations || [];

    } catch (e) {}

}



function updateSidebarBadges() {

    const c = AppState.counts;

    const setBadge = (id, val) => {

        const el = document.getElementById(id);

        if (el) el.textContent = val !== undefined ? val : '';

    };


    setBadge('badge-all-wo', c.allWorkOrdersOpen);

    setBadge('badge-my-wo', c.myWorkOrdersOpen);

    setBadge('badge-all-insp', c.allInspectionsCurrent);

    setBadge('badge-my-insp', c.myInspectionsCurrent);

    setBadge('badge-approve-insp', c.toApprovePending);

}



function setSyncStatus(online, text) {

    const badge = document.getElementById('syncBadge');

    const txt = document.getElementById('syncText');

    if (!badge || !txt) return;

    txt.textContent = text;

    badge.className = online

        ? 'flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'

        : 'flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30';

}



// ============================================================================

// UI HELPERS (Sidebar, Dropdowns, Modals, Toast, Android Hardware Back)

// ============================================================================



function toggleSidebar() {

    const sb = document.getElementById('leftSidebar');

    const bd = document.getElementById('sidebarBackdrop');

    if (!sb) return;

    if (window.innerWidth < 1024) {

        const isHidden = sb.classList.contains('hidden');

        if (isHidden) {

            sb.classList.remove('hidden');

            sb.classList.add('flex');

            bd?.classList.remove('hidden');

        } else {

            sb.classList.add('hidden');

            sb.classList.remove('flex');

            bd?.classList.add('hidden');

        }

    } else {

        sb.classList.toggle('lg:flex');

        sb.classList.toggle('lg:hidden');

    }

}



function closeSidebarOnMobile() {

    if (window.innerWidth < 1024) {

        const sb = document.getElementById('leftSidebar');

        const bd = document.getElementById('sidebarBackdrop');

        sb?.classList.add('hidden');

        sb?.classList.remove('flex');

        bd?.classList.add('hidden');

    }

}



// Called by Android Native MainActivity.onBackPressed() / onKeyDown()

let lastHomeBackPressTime = 0;

window.handleAndroidBackButton = function () {

    const emailModal = document.getElementById('reportEmailModal');

    if (emailModal && !emailModal.classList.contains('hidden')) {

        if (typeof closeReportEmailModal === 'function') closeReportEmailModal();
        else emailModal.classList.add('hidden');

        return 'HANDLED';

    }

    const a4Modal = document.getElementById('a4PreviewModal');

    if (a4Modal && !a4Modal.classList.contains('hidden')) {

        closeA4PreviewModal();

        return 'HANDLED';

    }

    const appModal = document.getElementById('appModal');

    if (appModal && !appModal.classList.contains('hidden')) {

        closeModal();

        return 'HANDLED';

    }

    if (AppState.currentRoute === 'inspection-complete') {

        const woId = AppState.currentInspection?.work_order_id || AppState.currentWorkOrder?.id;

        if (woId) {

            navigateTo('work-order-details', { id: woId, tab: 'inspections' });

        } else {

            navigateTo('home');

        }

        return 'HANDLED';

    }

    if (AppState.currentRoute !== 'home') {

        navigateTo('home');

        return 'HANDLED';

    }

    const now = Date.now();

    if (now - lastHomeBackPressTime < 2000) {

        return 'EXIT';

    }

    lastHomeBackPressTime = now;

    showToast('Uygulamadan çıkmak için tekrar geri tuşuna basın', 'info');

    return 'HANDLED';

};




window.addEventListener('popstate', () => {

    window.handleAndroidBackButton();

    try { history.pushState({ enlab: true }, ''); } catch (e) {}

});

try { history.pushState({ enlab: true }, ''); } catch (e) {}



function toggleSubmenu(id) {

    document.getElementById(id)?.classList.toggle('hidden');

}



function toggleDropdown(id) {

    document.getElementById(id)?.classList.toggle('hidden');

}



function toggleRowActionMenu(menuId, event) {

    if (event) event.stopPropagation();

    document.querySelectorAll('.row-action-menu').forEach(el => {

        if (el.id !== menuId) el.classList.add('hidden');

    });

    document.getElementById(menuId)?.classList.toggle('hidden');

}



let toastTimeoutId = null;

function showToast(msg, type = 'success') {

    const toast = document.getElementById('toast');

    const toastMsg = document.getElementById('toastMsg');

    const toastIcon = document.getElementById('toastIcon');

    const toastIconWrapper = document.getElementById('toastIconWrapper');

    if (!toast || !toastMsg) return;



    if (toastTimeoutId) {

        clearTimeout(toastTimeoutId);

        toastTimeoutId = null;

    }



    toastMsg.textContent = msg;



    if (type === 'success') {

        if (toastIconWrapper) toastIconWrapper.className = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-400';

        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-check text-xs sonner-toast-icon-bounce';

    } else if (type === 'warning') {

        if (toastIconWrapper) toastIconWrapper.className = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-400';

        if (toastIcon) toastIcon.className = 'fa-solid fa-triangle-exclamation text-xs sonner-toast-icon-bounce';

    } else if (type === 'error') {

        if (toastIconWrapper) toastIconWrapper.className = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-rose-500/20 text-rose-400';

        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-exclamation text-xs sonner-toast-icon-bounce';

    } else {

        if (toastIconWrapper) toastIconWrapper.className = 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-sky-500/20 text-sky-400';

        if (toastIcon) toastIcon.className = 'fa-solid fa-circle-info text-xs sonner-toast-icon-bounce';

    }



    toast.classList.remove('translate-y-32', 'translate-y-24');

    toast.classList.add('sonner-visible');



    toastTimeoutId = setTimeout(() => {

        toast.classList.remove('sonner-visible');

    }, 2800);

}



function openModal(title, bodyHtml, footerHtml = '') {

    document.getElementById('modalTitle').innerHTML = title;

    document.getElementById('modalBody').innerHTML = bodyHtml;

    document.getElementById('modalFooter').innerHTML = footerHtml || `

        <button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs">Kapat</button>

    `;

    document.getElementById('appModal').classList.remove('hidden');

}



function closeModal() {

    document.getElementById('appModal').classList.add('hidden');

}



function openCharPickerModal() {

    const chars = ['Ω', 'kΩ', 'MΩ', 'Δ', 'ΔI', 'IΔn', 'φ', 'cosφ', 'mm²', '≤', '≥', '±', '°C', 'µF', 'mV', 'kA', '√3', '∞'];

    const btns = chars.map(c => `

        <button onclick="navigator.clipboard?.writeText('${c}'); showToast('${c} panoya kopyalandı!')"

            class="p-3 bg-slate-100 hover:bg-sky-100 hover:text-sky-700 border border-slate-300 rounded-lg font-mono font-bold text-base transition">

            ${c}

        </button>

    `).join('');

    openModal(

        '<i class="fa-solid fa-omega mr-2 text-sky-400"></i>Mühendislik Karakter Seçici',

        `<p class="text-xs text-slate-500 mb-3">Rapor yazarken kullanmak istediğiniz sembole tıklayın; otomatik olarak panoya kopyalanır:</p>

         <div class="grid grid-cols-6 gap-2">${btns}</div>`

    );

}



function openUserSettingsModal() {

    const curUser = (typeof AuthManager !== 'undefined' && typeof AuthManager.getCurrentUser === 'function')
        ? AuthManager.getCurrentUser()
        : null;
    const locked = typeof MeasuringDevicesManager !== 'undefined'
        && typeof MeasuringDevicesManager.isCloudManaged === 'function'
        && MeasuringDevicesManager.isCloudManaged();
    const assigned = (typeof MeasuringDevicesManager !== 'undefined' && typeof MeasuringDevicesManager.getAssignedDevices === 'function')
        ? MeasuringDevicesManager.getAssignedDevices()
        : [];
    const defaultTitle = curUser
        ? `${curUser.title || 'Elektrik Mühendisi'}${curUser.emoNo ? ` (EMO: ${curUser.emoNo})` : ''}`
        : 'Elektrik Mühendisi';
    const savedTitle = localStorage.getItem('enlab_eng_title') || defaultTitle;
    const escapeVal = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const assignedSummaryHtml = assigned.length
        ? assigned.map((d, i) => `
            <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <div class="min-w-0 truncate">
                    <span class="font-bold text-slate-800">${i + 1}. ${escapeVal([d.brand, d.model].filter(Boolean).join(' ') || d.reportName || d.category)}</span>
                    ${d.serial ? `<span class="text-[10px] font-mono text-slate-500 ml-1">(${escapeVal(d.serial)})</span>` : ''}
                </div>
                <span class="text-[10px] font-semibold text-emerald-700 shrink-0">${escapeVal(d.category || '')}</span>
            </div>
        `).join('')
        : `<div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">${locked ? 'Yöneticiniz tarafından henüz size ölçüm cihazı atanmadı.' : 'Henüz üzerinize alınmış ölçüm cihazı yok. Havuzdan seçerek raporlara otomatik eklenmesini sağlayabilirsiniz.'}</div>`;

    openModal(

        '<i class="fa-solid fa-sliders mr-2 text-sky-400"></i>Kullanıcı ve Ölçüm Cihazı Ayarları',

        `<div class="space-y-3 text-xs">

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div>

                    <label class="block font-semibold text-slate-600 mb-1">Ad Soyad</label>

                    <input type="text" value="${escapeVal(curUser ? curUser.fullName : 'Aktif Personel')}" class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-semibold" readonly>

                </div>

                <div>

                    <label class="block font-semibold text-slate-600 mb-1">Unvan / Oda Sicil No</label>

                    <input type="text" id="prefEngineerTitle" value="${escapeVal(savedTitle)}" class="w-full border border-slate-300 rounded-lg px-3 py-2">

                </div>

            </div>

            <div class="space-y-2 pt-1 border-t border-slate-100">

                <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-800">Üzerinizdeki Ölçüm Cihazları (${assigned.length})</span>
                    ${locked
                        ? `<span class="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">Yönetici Ataması</span>`
                        : `<button type="button" onclick="closeModal(); openDeviceEditModal(null, { assignByDefault: true, refreshSettings: true });" class="text-[11px] font-bold text-emerald-700 hover:underline">+ Yeni Cihaz Tanımla</button>`
                    }
                </div>

                <div class="space-y-1.5 max-h-40 overflow-y-auto">
                    ${assignedSummaryHtml}
                </div>

                ${locked ? `
                    <button type="button" onclick="window.CloudAppSync && window.CloudAppSync.syncNow();"
                        class="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition">
                        <i class="fa-solid fa-arrows-rotate"></i>
                        <span>Buluttan Cihazları Güncelle</span>
                    </button>
                ` : `
                    <button type="button" onclick="closeModal(); openDeviceCatalogPickerModal('settings_assign');"
                        class="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition">
                        <i class="fa-solid fa-right-left"></i>
                        <span>Ölçüm Cihazlarımı Seç / Değiştir (Havuz)</span>
                    </button>
                `}

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">İptal</button>

         <button onclick="localStorage.setItem('enlab_eng_title', document.getElementById('prefEngineerTitle').value); closeModal(); showToast('Ayarlar kaydedildi');" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs">Kaydet</button>`

    );

}



async function exportLocalBackup() {

    try {

        const backupObj = window.OfflineDB

            ? window.OfflineDB.exportFullBackupObject()

            : await (await fetch('/api/inspections')).json();

        const jsonStr = JSON.stringify(backupObj, null, 2);

        const fileName = `Hizli_Rapor_Yedek_${new Date().toISOString().slice(0, 10)}.json`;



        if (window.AndroidBridge && typeof window.AndroidBridge.shareJsonBackup === 'function') {

            if (typeof window.AndroidBridge.saveDatabase === 'function') {
                window.AndroidBridge.saveDatabase(jsonStr);
            }
            window.AndroidBridge.shareJsonBackup(fileName, jsonStr);

            showToast('Saha yedeği hazırlandı!');

            return;

        }



        const blob = new Blob([jsonStr], { type: 'application/json' });

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;

        a.download = fileName;

        a.click();

        showToast('Tüm saha işleri, notlar ve raporlar JSON olarak indirildi!');

    } catch (e) {

        showToast('Yedekleme sırasında hata oluştu', 'warning');

    }

}



function openImportBackupModal() {

    openModal(

        '<i class="fa-solid fa-upload mr-2 text-amber-400"></i>Saha Yedek Dosyası Geri Yükle (JSON)',

        `<div class="space-y-3 text-xs">

            <p class="text-slate-600">Yedek <strong>.json</strong> dosyasını seçin:</p>

            <input type="file" accept=".json,application/json" onchange="handleBackupFileImport(this)" class="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50">

        </div>`

    );

}



function handleBackupFileImport(input) {

    const file = input.files && input.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {

        try {

            const parsed = JSON.parse(e.target.result);

            if (window.OfflineDB && window.OfflineDB.importFullBackupObject(parsed)) {

                closeModal();

                await loadInitData();

                navigateTo('home');

                showToast('Saha yedeği başarıyla geri yüklendi!');

            } else {

                showToast('Geçersiz yedek dosyası formatı', 'warning');

            }

        } catch (err) {

            showToast('Dosya okunamadı', 'warning');

        }

    };


    reader.readAsText(file);

}



// ============================================================================

// ROUTER & NAVIGATION

// ============================================================================



async function navigateTo(route, params = {}) {

    // If not logged in and not auth, redirect to auth

    if (!AuthManager.getCurrentUser() && route !== 'auth') {

        return renderAuthScreen();

    }



    AppState.currentRoute = route;

    AppState.currentParams = params;

    updateHeaderUserWidget();



    document.querySelectorAll('.enlab-nav-link, .enlab-subnav-link').forEach(el => el.classList.remove('active'));

    const activeNav = document.getElementById(`nav-${route}`);

    if (activeNav) activeNav.classList.add('active');



    const container = document.getElementById('pageContent');

    if (container) container.scrollTop = 0;

    container.innerHTML = `<div class="flex items-center justify-center py-12 text-slate-400 text-xs"><i class="fa-solid fa-circle-notch fa-spin mr-2 text-sky-600"></i> Yükleniyor...</div>`;



    const dock = document.getElementById('bottomActionDock');

    if (dock && route !== 'inspection-edit') dock.classList.add('hidden');

    if (container && route !== 'inspection-edit') container.classList.remove('pb-24');



    switch (route) {

        case 'home': return renderHome();

        case 'settings': return renderSettingsPage();

        case 'field-notebook': return renderFieldNotebookPage();

        case 'all-work-orders': return renderWorkOrdersPage('all', params.tab || 'open');

        case 'my-work-orders': return renderWorkOrdersPage('my', params.tab || 'open');

        case 'work-order-details': return renderWorkOrderDetails(params.id || '43129', params.tab || 'inspections');

        case 'all-inspections': return renderInspectionsPage('all', params.tab || 'current');

        case 'my-inspections': return renderInspectionsPage('my', params.tab || 'current');

        case 'inspections-to-approve': return renderInspectionsPage('approve', params.tab || 'pending_approval');

        case 'inspection-complete': return renderInspectionEditor(params.id, params.templateId);

        case 'documents': return renderDocumentsPage('internal', params.tab || 'active');

        case 'outsource-documents': return renderDocumentsPage('external', params.tab || 'active');

        case 'quality-record-create': return renderQualityRecordsPage(params.tab || 'create');

        case 'staff-my-details': return renderStaffPage(params.tab || 'profile');

        case 'reference-products': return renderInstrumentsPage(params.tab || 'active');

        case 'instrument-users': return renderInstrumentUsersPage();

        case 'calibrations': return renderCalibrationsPage(params.tab || 'current');

        case 'calendar': return renderCalendarPage(params.tab || 'calendar');

        case 'calendar-create': return renderCalendarPage('create');

        default: return renderHome();

    }

}



// ============================================================================

// 1. HOME PAGE (Çevrimdışı Saha İşleri, Hızlı Rapor Taslağı & Not Defteri)

// ============================================================================



function renderGrayOfflineNotesFolderHtml() {

    let noteCount = 0;

    try {

        if (window.OfflineDB) {

            window.OfflineDB.init();

            noteCount = Array.isArray(window.OfflineDB.state?.quickNotes) ? window.OfflineDB.state.quickNotes.length : 0;

        }

    } catch (e) {}

    return `

        <div onclick="navigateTo('field-notebook')"

            class="p-2.5 rounded-xl bg-slate-200/95 hover:bg-slate-300/80 active:scale-[0.99] border border-slate-300 cursor-pointer flex items-center justify-between gap-2.5 transition shadow-2xs">

            <div class="flex items-center gap-2.5 min-w-0 flex-1">

                <div class="w-9 h-9 rounded-lg bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-2xs">

                    <i class="fa-solid fa-folder text-sm"></i>

                </div>

                <div class="min-w-0 flex-1">

                    <div class="font-bold text-slate-900 text-xs sm:text-sm truncate">

                        Offline Not Alma Klasörü

                    </div>

                </div>

            </div>

            <div class="shrink-0 flex items-center gap-1.5">

                <span class="px-2 py-0.5 rounded-md bg-slate-700 text-white font-bold text-[10px]">

                    ${noteCount} Not

                </span>

                <i class="fa-solid fa-chevron-right text-slate-500 text-[11px]"></i>

            </div>

        </div>

    `;

}



async function renderHome(opts = {}) {

    const container = document.getElementById('pageContent');

    await loadInitData();



    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    const isManaged = Boolean(curUser && curUser.isCloudManaged);

    const userCloudId = curUser && curUser.cloudId ? String(curUser.cloudId) : '';



    const woRes = await fetch('/api/work-orders');

    const rawWOs = await woRes.json();

    const allJobs = (Array.isArray(rawWOs) ? rawWOs : []).map(normalizeWorkOrder).filter(wo => {

        if (userCloudId && wo.assigned_user_cloud_id) {

            return String(wo.assigned_user_cloud_id) === userCloudId;

        }

        return true;

    });

    AppState.workOrdersCache = allJobs;



    container.innerHTML = `

        <div class="max-w-2xl mx-auto space-y-2 pb-6">

            <!-- 1. İŞYERİ ARAMA VE YENİLE / YENİ KLASÖR -->

            <div class="flex items-center gap-2 pt-0.5">

                <input type="text" id="homeSearchInput" oninput="filterHomeJobs(this.value)" placeholder="Firma adı, şube veya not ara..."

                    class="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-sky-500 shadow-2xs">

                ${isManaged ? `
                    <button onclick="window.CloudAppSync && window.CloudAppSync.syncNow()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-300 font-bold text-xs rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm transition" title="Yöneticinin açtığı işleri ve atadığı cihazları internetten çek">

                        <i class="fa-solid fa-arrows-rotate"></i>

                        <span>Yenile</span>

                    </button>
                ` : `
                    <button onclick="openQuickFieldJobModal()" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm transition">

                        <i class="fa-solid fa-plus text-emerald-400"></i>

                        <span>Yeni Klasör</span>

                    </button>
                `}

            </div>



            <!-- 2. OFFLINE NOT KLASÖRÜ (GRİ) + İŞ KLASÖRLERİ LİSTESİ -->

            <div id="homeJobsList" class="space-y-2 pt-0.5">

                ${renderGrayOfflineNotesFolderHtml()}

                ${renderMinimalJobCards(allJobs)}

            </div>

        </div>

    `;



    if (typeof CompanySettingsManager !== 'undefined') {

        CompanySettingsManager.syncHeaderTitle();

    }

    updateHeaderUserWidget();

}



function renderMinimalJobCards(jobs) {

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    const isManaged = Boolean(curUser && curUser.isCloudManaged);

    if (!jobs || !jobs.length) {

        return `<div class="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-xs font-semibold">
            ${isManaged ? 'Size atanmış açık iş klasörü yok' : 'Henüz iş klasörü yok'}
        </div>`;

    }

    return jobs.map(wo => {

        const notePreview = (wo.field_notes || '').trim();

        const count = wo.actual_inspection_count ?? wo.inspection_count ?? 0;

        const lockedFolder = Boolean(wo.assigned_by_manager || isManaged);

        return `

            <div onclick="navigateTo('work-order-details', {id: '${wo.id}'})"

                class="card-craft-white p-2.5 cursor-pointer flex items-center justify-between gap-2 transition hover:border-slate-300">

                <div class="min-w-0 flex-1">

                    <div class="flex items-center gap-1.5 min-w-0">

                        <span class="font-bold text-slate-900 text-xs sm:text-sm truncate">${wo.customer_name}</span>

                        ${wo.assigned_by_manager ? `<span class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[9px] shrink-0">İş Emri</span>` : ''}

                    </div>

                    ${wo.customer_branch ? `<div class="text-[10px] text-slate-500 truncate mt-0.5">${wo.customer_branch}</div>` : ''}

                    ${notePreview ? `<div class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md px-2 py-0.5 mt-1 truncate"><i class="fa-solid fa-note-sticky mr-1 text-amber-500"></i>${notePreview.replace(/\n/g, ' ')}</div>` : ''}

                </div>

                <div class="shrink-0 flex items-center gap-1">

                    <button type="button" onclick="openWorkOrderPortalModal('${wo.id}', event)"

                        class="px-2 py-0.5 rounded-md border ${wo.portal_folder_url ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'} font-bold text-[10px] flex items-center gap-1 active:scale-95 transition"

                        title="Müşteri İnternet Klasörü">

                        <i class="fa-solid fa-globe text-[9px]"></i>

                        <span>Portal</span>

                    </button>

                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">

                        ${count} Rapor

                    </span>

                    ${lockedFolder ? '' : `
                        <button onclick="deleteWorkOrderHeading('${wo.id}', event, '${(wo.customer_name || 'İş Klasörü').replace(/'/g, "\\'")}')" class="p-1.5 text-slate-400 hover:text-rose-600 active:scale-90 rounded-md transition" title="Klasörü Sil">

                            <i class="fa-solid fa-trash-can text-[11px]"></i>

                        </button>
                    `}

                </div>

            </div>

        `;

    }).join('');

}



async function openWorkOrderPortalModal(workOrderId, ev) {

    if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();

    let wo = (AppState.workOrdersCache || []).find(w => String(w.id) === String(workOrderId));

    if (!wo) {

        try {

            const res = await fetch(`/api/work-orders/${workOrderId}`);

            const data = await res.json();

            if (data && data.workOrder) wo = normalizeWorkOrder(data.workOrder);

        } catch (e) {}

    }

    if (!wo) {

        showToast('İş emri bulunamadı', 'error');

        return;

    }



    const hasPortal = Boolean(wo.portal_folder_url);

    const bodyHtml = `

        <div class="space-y-3 text-xs">

            <div class="p-2.5 rounded-xl bg-slate-900 text-white">

                <div class="font-bold text-sm truncate">${escapeHtml(wo.customer_name || 'İş Klasörü')}</div>

                ${wo.customer_branch ? `<div class="text-[11px] text-slate-300 truncate">${escapeHtml(wo.customer_branch)}</div>` : ''}

            </div>

            ${hasPortal ? `

                <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">

                    <div class="flex items-center gap-1.5 flex-wrap font-bold text-indigo-900">

                        <i class="fa-solid fa-globe text-indigo-600"></i>

                        <span>Müşteri İnternet Klasörü Hazır</span>

                    </div>

                    <div class="flex items-center gap-1.5 flex-wrap">

                        ${wo.portal_customer_username ? `<span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 font-mono text-[11px]">@${escapeHtml(wo.portal_customer_username)}</span>` : ''}

                        ${wo.portal_customer_password ? `<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[11px]">Şifre: ${escapeHtml(wo.portal_customer_password)}</span>` : ''}

                        ${wo.portal_pin ? `<span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[11px]">PIN: ${escapeHtml(wo.portal_pin)}</span>` : (!wo.portal_customer_username ? `<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">Şifresiz</span>` : '')}

                    </div>

                    <div class="text-[11px] font-mono text-indigo-700 break-all bg-white/80 p-2 rounded-lg border border-indigo-200/70">${escapeHtml(wo.portal_folder_url)}</div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">

                        ${wo.portal_customer_username ? `<button type="button" onclick="CloudPortal.copyCustomerLoginInfo('${escapeForJs(wo.id)}')" class="px-2.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition"><i class="fa-solid fa-user-shield"></i><span>Girişi Kopyala</span></button>` : ''}

                        <button type="button" onclick="CloudPortal.copyText('${escapeForJs(wo.portal_folder_url)}')" class="px-2.5 py-2 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 flex items-center justify-center gap-1 transition">

                            <i class="fa-regular fa-copy"></i><span>Linki Kopyala</span>

                        </button>

                        <a href="${escapeHtml(wo.portal_folder_url)}" target="_blank" rel="noopener" class="px-2.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition">

                            <i class="fa-solid fa-arrow-up-right-from-square"></i><span>Aç</span>

                        </a>

                    </div>

                </div>

            ` : `

                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">

                    Henüz internet klasörü oluşturulmadı.

                </div>

            `}

        </div>

    `;



    const footerHtml = `

        <button type="button" onclick="closeModal()" class="px-3.5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs">Kapat</button>

        <button type="button" onclick="closeModal(); setTimeout(() => openPortalUploadModal('${escapeForJs(wo.id)}'), 50);" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5">

            <i class="fa-solid fa-cloud-arrow-up"></i>

            <span>${hasPortal ? 'Rapor Yükle / Güncelle' : 'İnternete Yükle'}</span>

        </button>

    `;



    openModal('<i class="fa-solid fa-globe mr-2 text-indigo-400"></i>Müşteri İnternet Klasörü', bodyHtml, footerHtml);

}

window.openWorkOrderPortalModal = openWorkOrderPortalModal;



// ============================================================================

// GÜVENLİK & ŞİFRELİ SİLME DOĞRULAMA SİSTEMİ

// ============================================================================

function promptSecurityPasswordConfirmation({ title, entityName, message, onConfirmed }) {

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || { fullName: 'Yetkili Personel', password: '123' };


    const modalTitle = `<i class="fa-solid fa-triangle-exclamation text-rose-500 mr-2"></i>${title || 'Silme Onayı'}`;

    const modalBody = `

        <div class="space-y-3 text-xs">

            <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 leading-relaxed">

                <strong>"${entityName || 'Kayıt'}"</strong> kalıcı olarak silinecektir.

            </div>

            <div class="space-y-1.5 pt-1">

                <label class="block font-bold text-slate-700">

                    <strong>${curUser.fullName}</strong> şifresi:

                </label>

                <div class="relative">

                    <input type="password" id="secConfirmPasswordInput" placeholder="Kullanıcı şifreniz"

                        class="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono pr-10 focus:outline-none focus:border-rose-500 bg-white"

                        onkeydown="if(event.key==='Enter') executeSecurityPasswordCheck()">

                    <button type="button" onclick="togglePasswordVisibility('secConfirmPasswordInput')"

                        class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1">

                        <i class="fa-solid fa-eye text-xs"></i>

                    </button>

                </div>

            </div>

        </div>

    `;

    const modalFooter = `

        <button onclick="closeModal()" class="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl active:scale-95 transition">İptal</button>

        <button onclick="executeSecurityPasswordCheck()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl active:scale-95 shadow-sm transition">

            <i class="fa-solid fa-trash-can mr-1.5"></i>Onayla ve Sil

        </button>

    `;

    window._pendingSecurityCallback = onConfirmed;

    window._pendingSecurityExpectedPass = String(curUser.password || '123').trim();

    openModal(modalTitle, modalBody, modalFooter);



    setTimeout(() => {

        const inp = document.getElementById('secConfirmPasswordInput');

        if (inp) inp.focus();

    }, 150);

}



function executeSecurityPasswordCheck() {

    const inp = document.getElementById('secConfirmPasswordInput');

    const entered = inp ? inp.value.trim() : '';

    const expected = window._pendingSecurityExpectedPass || '123';



    if (!entered) {

        showToast('Lütfen silme onay şifrenizi girin!', 'error');

        if (inp) inp.focus();

        return;

    }



    if (entered !== expected) {

        showToast('Hatalı şifre! Silme işlemi iptal edildi.', 'error');

        if (inp) {

            inp.classList.add('border-rose-500', 'bg-rose-50');

            inp.value = '';

            inp.focus();

        }

        return;

    }



    const callback = window._pendingSecurityCallback;

    window._pendingSecurityCallback = null;

    window._pendingSecurityExpectedPass = null;

    closeModal();



    if (typeof callback === 'function') {

        callback();

    }

}



async function deleteWorkOrderHeading(woId, event, folderName) {

    if (event) event.stopPropagation();

    const targetWo = (AppState.workOrdersCache || []).find(w => String(w.id) === String(woId));

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    if ((targetWo && targetWo.assigned_by_manager) || (curUser && curUser.isCloudManaged)) {

        showToast('Yöneticinin açtığı iş klasörü silinemez', 'warning');

        return;

    }

    promptSecurityPasswordConfirmation({

        title: 'İş Klasörünü Sil',

        entityName: folderName || 'İş Klasörü',

        message: 'Bu klasör ve içindeki tüm muayene raporları kalıcı olarak silinecektir.',

        onConfirmed: async () => {

            await fetch(`/api/work-orders/${woId}`, { method: 'DELETE' });

            showToast('İş klasörü ve raporlar silindi');

            await loadInitData();

            navigateTo('home');

        }

    });

}



function filterHomeJobs(query) {

    const q = (query || '').toLowerCase();

    const filtered = (AppState.workOrdersCache || []).filter(w =>

        (w.customer_name || '').toLowerCase().includes(q) ||

        (w.customer_branch || '').toLowerCase().includes(q) ||

        (w.field_notes || '').toLowerCase().includes(q)

    );

    const showOfflineCard = !q || 'offline not alma klasörü saha notları defter'.includes(q);

    const listEl = document.getElementById('homeJobsList');

    if (listEl) {

        listEl.innerHTML = (showOfflineCard ? renderGrayOfflineNotesFolderHtml() : '') + renderMinimalJobCards(filtered);

    }

}



// ============================================================================

// 1B. QUICK FIELD JOB & REPORT TEMPLATE CREATOR

// ============================================================================





// ============================================================================
// HIZLI RAPOR - 02-WORK-ORDERS.JS
// Açıklama: İşyeri / Saha Klasörleri, İş Listesi ve Klasör Detayları
// Satır Aralığı: 1686 - 3274 (1589 satır)
// ============================================================================

function openQuickFieldJobModal() {

    const _curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    if (_curUser && _curUser.isCloudManaged) {

        showToast('Yeni iş klasörleri yalnızca firma yöneticisi web panelinden açılabilir.', 'warning');

        return;

    }

    const templates = window.ENLAB_REPORT_TEMPLATES || [];

    const tplCheckboxes = templates.map((t) => {

        const cleanName = typeof getCleanTemplateTypeLabel === 'function' ? getCleanTemplateTypeLabel(t.id, t.code) : t.name;

        return `

        <label class="quick-tpl-item flex items-center p-2.5 rounded-xl border border-slate-200 bg-white hover:border-sky-500 cursor-pointer transition-all shadow-2xs">

            <div class="flex items-center gap-2.5 min-w-0">

                <input type="checkbox" name="quickJobTpl" value="${t.id}" class="w-4 h-4 accent-sky-600 rounded shrink-0">

                <div class="min-w-0">

                    <div class="font-bold text-slate-800 text-xs truncate">${cleanName}</div>

                </div>

            </div>

        </label>

    `;}).join('');



    openModal(

        'Yeni İşyeri / Saha Klasörü Aç',

        `<div class="space-y-2.5 text-xs">

            <div>

                <label class="block font-bold text-slate-800 mb-1">İşyeri / Firma Adı <span class="text-rose-500">*</span></label>

                <input type="text" id="qjCompanyName" placeholder=""

                    class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none">

            </div>

            <div>

                <label class="block font-bold text-slate-700 mb-1">Periyodik Kontrol Adresi</label>

                <input type="text" id="qjAddress" placeholder=""

                    class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-3 py-2 text-xs">

            </div>

            <div class="grid grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-1">İSG-KATİP Sözleşme ID</label>

                    <input type="text" id="qjIsgKatipNo" placeholder=""

                        class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs font-medium">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-1">SGK Sicil No</label>

                    <input type="text" id="qjSgkSicilNo" placeholder=""

                        class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs font-medium">

                </div>

            </div>

            <div>

                <label class="block font-bold text-slate-700 mb-1"><i class="fa-solid fa-envelope text-sky-600 mr-1"></i>Yetkili E-posta Adresi</label>

                <input type="email" id="qjContactEmail" placeholder="yetkili@firma.com"

                    class="w-full border border-slate-300 focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs">

            </div>

            <div>

                <label class="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">

                    <i class="fa-solid fa-bolt text-amber-500"></i>

                    <span>Oluşturulacak Raporlar</span>

                </label>

                <div id="qjTemplatesGrid" class="space-y-1.5 p-2 border border-slate-200 rounded-xl bg-slate-50 max-h-44 overflow-y-auto">

                    ${tplCheckboxes}

                </div>

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">İptal</button>

         <button onclick="submitQuickFieldJob(false)" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-2xs">

            <i class="fa-solid fa-folder-plus"></i>

            <span>Klasörü Aç</span>

         </button>`

    );

    setTimeout(() => document.getElementById('qjCompanyName')?.focus(), 100);

}



function filterQuickJobTemplates(query) {

    const q = (query || '').toLowerCase();

    document.querySelectorAll('.quick-tpl-item').forEach(el => {

        const s = el.getAttribute('data-search') || '';

        el.style.display = s.includes(q) ? '' : 'none';

    });

}



async function submitQuickFieldJob(openFirstReportDirectly = false) {

    const nameInput = document.getElementById('qjCompanyName');

    const rawName = (nameInput?.value || '').trim();

    if (!rawName) {

        showToast('Lütfen başlık adını yazın', 'warning');

        nameInput?.focus();

        return;

    }



    const address = (document.getElementById('qjAddress')?.value || '').trim();
    const isgKatipNo = (document.getElementById('qjIsgKatipNo')?.value || '').trim();
    const sgkSicilNo = (document.getElementById('qjSgkSicilNo')?.value || '').trim();
    const contactEmail = (document.getElementById('qjContactEmail')?.value || '').trim();
    if (contactEmail) { try { localStorage.setItem('enlab_last_recipient_email', contactEmail); } catch (e) {} }
    const fieldNotes = (document.getElementById('qjFieldNotes')?.value || '').trim();

    const checkedTpls = Array.from(document.querySelectorAll('input[name="quickJobTpl"]:checked')).map(cb => cb.value);



    const res = await fetch('/api/work-orders', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

            company_name: rawName,

            company_branch: address,

            company_address: address,

            isg_katip_no: isgKatipNo,

            sgk_sicil_no: sgkSicilNo,

            contact_email: contactEmail,

            field_notes: fieldNotes,

            initial_templates: checkedTpls

        })

    });

    const data = await res.json();

    closeModal();

    await loadInitData();

    navigateTo('work-order-details', { id: data.id });

}



async function renderFieldNotebookPage() {

    const container = document.getElementById('pageContent');

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    const isManaged = Boolean(curUser && curUser.isCloudManaged);

    const userCloudId = curUser && curUser.cloudId ? String(curUser.cloudId) : '';

    const [woRes, notesRes] = await Promise.all([

        fetch('/api/work-orders'),

        fetch('/api/quick-notes')

    ]);

    const wos = (await woRes.json()).map(normalizeWorkOrder).filter(w => {

        if (userCloudId && w.assigned_user_cloud_id) return String(w.assigned_user_cloud_id) === userCloudId;

        return true;

    });

    const quickNotes = await notesRes.json();



    const jobOptions = wos.map(w => `<option value="${escapeHtml(w.id)}" data-name="${escapeHtml(w.customer_name)}">${escapeHtml(w.customer_name)} (${escapeHtml(w.work_order_no)})</option>`).join('');



    const quickNotesHtml = (quickNotes || []).map(n => `

        <div class="bg-slate-200/80 rounded-xl border border-slate-300 p-4 space-y-2.5 shadow-2xs">

            <div class="flex flex-wrap items-start justify-between gap-2">

                <div>

                    <h3 class="font-black text-slate-900 text-sm">${escapeHtml(n.title || 'Saha Notu')}</h3>

                    <div class="text-[11px] text-slate-600 font-semibold">${escapeHtml(n.job_name || 'Genel Offline Not')} · <span class="font-mono">${escapeHtml(n.updated_at || '')}</span></div>

                </div>

                <div class="flex items-center gap-1.5">

                    ${n.work_order_id ? `

                        <button onclick="navigateTo('work-order-details', {id: '${escapeForJs(n.work_order_id)}', tab: 'inspections'})" class="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-[11px] font-bold">

                            İşe Git →

                        </button>

                    ` : ''}

                    ${isManaged ? '' : `

                        <button onclick="convertQuickNoteToJob(${n.id})" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold" title="Bu nottan yeni iş ve rapor taslağı oluştur">

                            <i class="fa-solid fa-file-circle-plus mr-1"></i>Rapor Taslağına Dönüştür

                        </button>

                    `}

                    <button onclick="deleteQuickNote(${n.id})" class="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[11px] font-bold">

                        <i class="fa-solid fa-trash-can"></i>

                    </button>

                </div>

            </div>

            <textarea rows="4" oninput="updateExistingQuickNote(${n.id}, this.value)"

                class="w-full border border-slate-300 bg-white rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:border-slate-500 focus:outline-none">${escapeHtml(n.content || '')}</textarea>

        </div>

    `).join('');



    const jobsWithNotesHtml = wos.slice(0, 10).map(w => `

        <div class="bg-slate-100 rounded-xl border border-slate-300 p-4 space-y-2 shadow-2xs">

            <div class="flex flex-wrap items-center justify-between gap-2">

                <div>

                    <span class="font-mono text-[11px] font-bold text-slate-600">${escapeHtml(w.work_order_no)}</span>

                    <h4 class="font-bold text-slate-900 text-xs sm:text-sm">${escapeHtml(w.customer_name)} ${w.customer_branch ? `- ${escapeHtml(w.customer_branch)}` : ''}</h4>

                </div>

                <button onclick="navigateTo('work-order-details', {id: '${escapeForJs(w.id)}', tab: 'inspections'})" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold">

                    İşi &amp; Raporları Aç (${w.actual_inspection_count ?? 0}) →

                </button>

            </div>

            <textarea rows="3" placeholder="Saha notları..."

                oninput="saveWorkOrderNotesRealtime('${escapeForJs(w.id)}', this.value)"

                class="w-full border border-slate-300 bg-white rounded-lg p-2.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none">${escapeHtml(w.field_notes || '')}</textarea>

        </div>

    `).join('');



    container.innerHTML = `

        <div class="max-w-4xl mx-auto space-y-4 pb-6">

            <div class="bg-slate-200 rounded-xl border border-slate-300 shadow-xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">

                <div class="flex items-center gap-3">

                    <button onclick="navigateTo('home')" class="px-2.5 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 rounded-xl font-bold text-xs shrink-0 transition border border-slate-300">

                        <i class="fa-solid fa-arrow-left mr-1"></i>Geri

                    </button>

                    <h1 class="text-lg font-black text-slate-900 flex items-center gap-2">

                        <i class="fa-solid fa-folder text-slate-600"></i> Offline Not Alma Klasörü

                    </h1>

                </div>

                ${isManaged ? '' : `

                    <button onclick="openQuickFieldJobModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow flex items-center gap-2">

                        <i class="fa-solid fa-plus"></i> Yeni İş & Rapor Taslağı Aç

                    </button>

                `}

            </div>



            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">

                <!-- Left: Add New Standalone Note + Quick Notes List -->

                <div class="lg:col-span-6 space-y-4">

                    <div class="bg-slate-100 rounded-xl border border-slate-300 shadow-xs overflow-hidden">

                        <div class="px-4 py-3 bg-slate-700 text-white font-bold text-xs uppercase flex items-center justify-between">

                            <span><i class="fa-solid fa-pen-clip text-slate-200 mr-2"></i>Yeni Saha Notu</span>

                        </div>

                        <div class="p-4 space-y-3 text-xs">

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                <div>

                                    <label class="block font-bold text-slate-700 mb-1">Not Başlığı / Mahal</label>

                                    <input type="text" id="newNoteTitle" placeholder="Örn: Bodrum Ana Pano Ölçümleri"

                                        class="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 font-semibold">

                                </div>

                                <div>

                                    <label class="block font-bold text-slate-700 mb-1">İlgili İş</label>

                                    <select id="newNoteWoSelect" class="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">

                                        <option value="">-- Genel Not --</option>

                                        ${jobOptions}

                                    </select>

                                </div>

                            </div>

                            <div>

                                <label class="block font-bold text-slate-700 mb-1">Saha Notu İçeriği</label>

                                <textarea id="newNoteContent" rows="4" placeholder="Panolar, kablo kesitleri, topraklama dirençleri, eksiklikler..."

                                    class="w-full border border-slate-300 bg-white rounded-lg p-3 font-medium focus:border-slate-500 focus:outline-none"></textarea>

                            </div>

                            <div class="flex justify-end">

                                <button onclick="createNewQuickNote()" class="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-black rounded-lg shadow-xs flex items-center gap-1.5">

                                    <i class="fa-solid fa-floppy-disk"></i> Notu Kaydet

                                </button>

                            </div>

                        </div>

                    </div>



                    <div class="space-y-3">

                        <h2 class="font-bold text-xs uppercase text-slate-600 px-1">Kayıtlı Offline Notlarım (${quickNotes.length})</h2>

                        ${quickNotesHtml || '<div class="p-6 bg-slate-100 rounded-xl border border-slate-300 text-center text-xs text-slate-500">Henüz bağımsız hızlı not eklenmemiş.</div>'}

                    </div>

                </div>



                <!-- Right: Per-Job Notebook Cards -->

                <div class="lg:col-span-6 space-y-3">

                    <h2 class="font-bold text-xs uppercase text-slate-600 px-1">İş Klasörlerine Ait Saha Notları</h2>

                    ${jobsWithNotesHtml || '<div class="p-6 bg-slate-100 rounded-xl border border-slate-300 text-center text-xs text-slate-500">Size atanmış iş klasörü bulunmuyor.</div>'}

                </div>

            </div>

        </div>

    `;

}



async function createNewQuickNote() {

    const title = (document.getElementById('newNoteTitle')?.value || '').trim() || 'Saha Tespit Notu';

    const content = (document.getElementById('newNoteContent')?.value || '').trim();

    const sel = document.getElementById('newNoteWoSelect');

    const woId = sel?.value || null;

    const jobName = woId ? sel.options[sel.selectedIndex].getAttribute('data-name') : 'Genel Saha Notu';



    if (!content) {

        showToast('Lütfen not içeriği yazınız', 'warning');

        return;

    }

    await fetch('/api/quick-notes', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ title, content, work_order_id: woId, job_name: jobName })

    });

    showToast('Saha notu kaydedildi!');

    renderFieldNotebookPage();

}



let quickNoteTimer = null;

function updateExistingQuickNote(noteId, newContent) {

    clearTimeout(quickNoteTimer);

    quickNoteTimer = setTimeout(async () => {

        await fetch('/api/quick-notes', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ id: noteId, content: newContent })

        });

    }, 350);

}



async function deleteQuickNote(noteId) {

    await fetch(`/api/quick-notes/${noteId}`, { method: 'DELETE' });

    showToast('Not silindi');

    renderFieldNotebookPage();

}



async function convertQuickNoteToJob(noteId) {

    const _curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    if (_curUser && _curUser.isCloudManaged) {

        showToast('İş klasörleri yalnızca firma yöneticisi web panelinden açılabilir.', 'warning');

        return;

    }

    const res = await fetch('/api/quick-notes');

    const notes = await res.json();

    const note = notes.find(n => String(n.id) === String(noteId));

    if (!note) return;

    openQuickFieldJobModal();

    setTimeout(() => {

        const compEl = document.getElementById('qjCompanyName');

        const notesEl = document.getElementById('qjFieldNotes');

        if (compEl) compEl.value = note.title || 'Yeni Saha İşi';

        if (notesEl) notesEl.value = note.content || '';

    }, 120);

}



let woNoteSaveTimer = null;

function saveWorkOrderNotesRealtime(woId, notesText) {

    if (AppState.currentWorkOrder && String(AppState.currentWorkOrder.id) === String(woId)) {

        AppState.currentWorkOrder.field_notes = notesText;

    }

    const previewEl = document.getElementById(`woFieldNotePreview_${woId}`);

    if (previewEl) {

        const trimmed = (notesText || '').replace(/\n/g, ' ').trim();

        previewEl.textContent = trimmed || 'Not ekle...';

        previewEl.className = trimmed ? 'text-[11px] text-amber-800 font-medium truncate' : 'text-[11px] text-slate-400 truncate';

    }

    const statusEl = document.getElementById(`woNoteSaveStatus_${woId}`);

    if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-rotate fa-spin mr-1"></i>Kaydediliyor...`;

    clearTimeout(woNoteSaveTimer);

    woNoteSaveTimer = setTimeout(async () => {

        await fetch(`/api/work-orders/${woId}/notes`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ field_notes: notesText })

        });

        if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-check-double text-emerald-600 mr-1"></i>Not Defterine Kaydedildi`;

    }, 300);

}



let woEmailSaveTimer = null;
function saveWorkOrderEmailRealtime(woId, emailText) {
    const clean = (emailText || '').trim();
    if (AppState.currentWorkOrder && String(AppState.currentWorkOrder.id) === String(woId)) {
        AppState.currentWorkOrder.contact_email = clean;
    }
    if (clean) {
        try { localStorage.setItem('enlab_last_recipient_email', clean); } catch (e) {}
    }
    const statusEl = document.getElementById(`woEmailSaveStatus_${woId}`);
    if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i>`;
    }
    clearTimeout(woEmailSaveTimer);
    woEmailSaveTimer = setTimeout(async () => {
        await fetch(`/api/work-orders/${woId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_email: clean })
        });
        if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-check text-emerald-600"></i> Kaydedildi`;
    }, 300);
}

function openWorkOrderFieldNotesModal(woId) {

    const wo = (AppState.currentWorkOrder && String(AppState.currentWorkOrder.id) === String(woId))

        ? AppState.currentWorkOrder

        : (AppState.workOrdersCache || []).find(w => String(w.id) === String(woId)) || { id: woId, field_notes: '' };

    openModal(

        '<i class="fa-solid fa-note-sticky mr-2 text-amber-400"></i>Saha Notu',

        `<div class="space-y-2 text-xs">

            <textarea id="woFieldNotesTextarea_${escapeHtml(woId)}" rows="5"

                oninput="saveWorkOrderNotesRealtime('${escapeForJs(woId)}', this.value)"

                placeholder="Saha notlarınızı buraya yazın..."

                class="w-full border border-slate-300 bg-amber-50/20 rounded-xl p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none">${escapeHtml(wo.field_notes || '')}</textarea>

            <div class="flex items-center justify-between text-[11px] text-slate-400 min-h-[16px]">

                <span id="woNoteSaveStatus_${escapeHtml(woId)}"></span>

            </div>

        </div>`,

        `<button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg active:scale-95 transition">Tamam</button>`

    );

    setTimeout(() => {

        const ta = document.getElementById(`woFieldNotesTextarea_${woId}`);

        if (ta) {

            ta.focus();

            ta.setSelectionRange(ta.value.length, ta.value.length);

        }

    }, 100);

}

window.openWorkOrderFieldNotesModal = openWorkOrderFieldNotesModal;



function appendQuickSnippetToJobNotes(woId, snippet) {

    const ta = document.getElementById(`woFieldNotesTextarea_${woId}`);

    if (!ta) return;

    const prefix = ta.value && !ta.value.endsWith('\n') ? '\n' : '';

    ta.value = ta.value + prefix + snippet;

    saveWorkOrderNotesRealtime(woId, ta.value);

    ta.focus();

}



// ============================================================================

// 2. WORK ORDERS LIST PAGES (Tüm İş Emirleri & Benim İş Emirlerim)

//    Tabs: Açık İş Emirleri | Kapanmış İş Emirleri

// ============================================================================



async function renderWorkOrdersPage(scope = 'all', tab = 'open') {

    AppState.activeTab = tab;

    const container = document.getElementById('pageContent');

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    const isManaged = Boolean(curUser && curUser.isCloudManaged);

    const userCloudId = curUser && curUser.cloudId ? String(curUser.cloudId) : '';

    const pageTitle = scope === 'my' ? 'Benim İş Emirlerim' : 'Tüm İş Emirleri';

    const routeName = scope === 'my' ? 'my-work-orders' : 'all-work-orders';



    const res = await fetch('/api/work-orders');

    const rawList = await res.json();

    const allNormalized = (Array.isArray(rawList) ? rawList : (rawList.workOrders || [])).map(normalizeWorkOrder).filter(w => {

        if (userCloudId && w.assigned_user_cloud_id) return String(w.assigned_user_cloud_id) === userCloudId;

        return true;

    });



    const openList = allNormalized.filter(w => (scope === 'my' ? w.is_mine == 1 : true) && w.is_open);

    const closedList = allNormalized.filter(w => (scope === 'my' ? w.is_mine == 1 : true) && !w.is_open);

    AppState.workOrdersCache = tab === 'open' ? openList : closedList;



    container.innerHTML = `

        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

            <div class="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">

                <h1 class="text-lg font-bold text-slate-800">${pageTitle}</h1>

                <div class="flex items-center gap-2">

                    <input type="text" id="woSearchInput" oninput="filterWorkOrdersTable()" placeholder="İş emri no, müşteri, şube veya teklif ara..."

                        class="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-sky-500">

                    ${isManaged ? '' : `

                        <button onclick="openNewWorkOrderModal()" class="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5">

                            <i class="fa-solid fa-plus"></i> Yeni İş Emri Ekle

                        </button>

                    `}

                </div>

            </div>



            <!-- Authentic ENLAB Tabs: Açık / Kapanmış -->

            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto">

                <button onclick="navigateTo('${routeName}', {tab: 'open'})" class="enlab-tab-btn ${tab === 'open' ? 'active' : ''}">

                    <i class="fa-solid fa-folder-open text-sky-600"></i>

                    <span>Açık İş Emirleri (${openList.length})</span>

                </button>

                <button onclick="navigateTo('${routeName}', {tab: 'closed'})" class="enlab-tab-btn ${tab === 'closed' ? 'active' : ''}">

                    <i class="fa-solid fa-folder-closed text-slate-500"></i>

                    <span>Kapanmış İş Emirleri (${closedList.length})</span>

                </button>

            </div>



            <div class="overflow-x-auto">

                <table class="w-full text-left border-collapse">

                    <thead>

                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">

                            <th class="py-3 px-4">İş Emri Kodu</th>

                            <th class="py-3 px-4">Müşteri Firma</th>

                            <th class="py-3 px-4">Şube / Muayene Adresi</th>

                            <th class="py-3 px-4">Başlangıç Tarihi</th>

                            <th class="py-3 px-4">Görevli Uzmanlar</th>

                            <th class="py-3 px-4">Durum</th>

                            <th class="py-3 px-4 text-right">İşlemler</th>

                        </tr>

                    </thead>

                    <tbody id="woTableBody" class="divide-y divide-slate-100 text-xs">

                        ${renderWorkOrderRows(AppState.workOrdersCache)}

                    </tbody>

                </table>

            </div>

        </div>

    `;

}



function renderWorkOrderRows(list) {

    if (!list.length) {

        return `<tr><td colspan="7" class="p-8 text-center text-slate-400">Bu sekmede kayıtlı iş emri bulunamadı.</td></tr>`;

    }

    return list.map(wo => `

        <tr class="hover:bg-sky-50/50 transition">

            <td class="py-3 px-4 font-mono font-bold text-sky-700">

                <a href="javascript:void(0)" onclick="navigateTo('work-order-details', {id: '${wo.id}', tab: 'inspections'})" class="hover:underline">

                    ${wo.work_order_no}

                </a>

            </td>

            <td class="py-3 px-4 font-bold text-slate-800">${wo.customer_name}</td>

            <td class="py-3 px-4 text-slate-600">${wo.customer_address || '-'}</td>

            <td class="py-3 px-4 font-mono text-slate-600">${wo.start_date || '-'}</td>

            <td class="py-3 px-4 text-slate-600">${wo.assigned_to || 'Ali Şamil Aytekin'}</td>

            <td class="py-3 px-4">

                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${wo.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">

                    ${wo.is_open ? 'Açık' : 'Kapanmış'}

                </span>

            </td>

            <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">

                <button onclick="navigateTo('work-order-details', {id: '${wo.id}', tab: 'info'})" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold">

                    Detaylar

                </button>

                <button onclick="navigateTo('work-order-details', {id: '${wo.id}', tab: 'inspections'})" class="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-semibold">

                    <i class="fa-solid fa-list-check mr-1"></i>Muayeneler & Raporlar

                </button>

            </td>

        </tr>

    `).join('');

}



function filterWorkOrdersTable() {

    const q = (document.getElementById('woSearchInput')?.value || '').toLowerCase();

    const filtered = AppState.workOrdersCache.filter(w =>

        (w.work_order_no || '').toLowerCase().includes(q) ||

        (w.customer_name || '').toLowerCase().includes(q) ||

        (w.customer_address || '').toLowerCase().includes(q) ||

        (w.proposal_no || '').toLowerCase().includes(q)

    );

    const tbody = document.getElementById('woTableBody');

    if (tbody) tbody.innerHTML = renderWorkOrderRows(filtered);

}



function openNewWorkOrderModal() {

    const _curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    if (_curUser && _curUser.isCloudManaged) {

        showToast('Yeni iş emirleri yalnızca firma yöneticisi web panelinden oluşturulabilir.', 'warning');

        return;

    }

    openModal(

        '<i class="fa-solid fa-folder-plus mr-2 text-sky-400"></i>Yeni İş Emri Oluştur',

        `<div class="space-y-3 text-xs">

            <div class="grid grid-cols-2 gap-3">

                <div>

                    <label class="block font-semibold text-slate-700 mb-1">İş Emri Kodu</label>

                    <input type="text" id="newWoNo" value="${(typeof CompanySettingsManager !== 'undefined' ? CompanySettingsManager.getSettings().reportNoPrefix : 'ENL-') || 'ENL-'}${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100+Math.random()*900)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono">

                </div>

                <div>

                    <label class="block font-semibold text-slate-700 mb-1">Teklif No</label>

                    <input type="text" id="newWoProposal" value="${(typeof CompanySettingsManager !== 'undefined' ? CompanySettingsManager.getSettings().reportNoPrefix : 'ENL-') || 'ENL-'}TKL-2026-${Math.floor(100+Math.random()*900)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono">

                </div>

            </div>

            <div>

                <label class="block font-semibold text-slate-700 mb-1">Müşteri Firma Ünvanı</label>

                <input type="text" id="newWoCustomer" placeholder="" class="w-full border border-slate-300 rounded-lg px-3 py-2">

            </div>

            <div class="grid grid-cols-2 gap-3">

                <div>

                    <label class="block font-semibold text-slate-700 mb-1">Şube / Tesis Adı</label>

                    <input type="text" id="newWoBranch" placeholder="" class="w-full border border-slate-300 rounded-lg px-3 py-2">

                </div>

                <div>

                    <label class="block font-semibold text-slate-700 mb-1">Muayene Adresi</label>

                    <input type="text" id="newWoAddress" placeholder="Kurtuluş Mah. Fatih Cad..." class="w-full border border-slate-300 rounded-lg px-3 py-2">

                </div>

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">İptal</button>

         <button onclick="submitNewWorkOrder()" class="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs">İş Emrini Oluştur ve Aç</button>`

    );

}



async function submitNewWorkOrder() {

    const payload = {

        code: document.getElementById('newWoNo').value.trim(),

        proposal_no: document.getElementById('newWoProposal').value.trim(),

        company_name: document.getElementById('newWoCustomer').value.trim() || 'YENİ MÜŞTERİ FİRMA A.Ş.',

        company_branch: document.getElementById('newWoBranch').value.trim() || 'Merkez Tesis',

        company_address: document.getElementById('newWoAddress').value.trim() || 'Saha Adresi'

    };

    const res = await fetch('/api/work-orders', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload)

    });

    const data = await res.json();

    closeModal();

    await loadInitData();

    showToast('Yeni İş Emri oluşturuldu!');

    navigateTo('work-order-details', { id: data.id, tab: 'inspections' });

}



// ============================================================================

// 3. WORK ORDER DETAILS (/Inspection/WorkOrder/Details/:id)

//    Tabs: 1. İş Emri Bilgileri | 2. Muayeneler | 3. Dosyalar

// ============================================================================



async function renderWorkOrderDetails(workOrderId) {

    const container = document.getElementById('pageContent');

    const res = await fetch(`/api/work-orders/${workOrderId}`);

    const data = await res.json();

    const wo = normalizeWorkOrder(data.workOrder || { id: workOrderId, code: `TKM-${workOrderId}` });

    let inspections = (data.inspections || []).map(normalizeInspection);



    if (String(workOrderId) === '43129') {

        const teknosaItems = inspections.filter(i => (i.customer_name || '').includes('TEKNOSA') || Number(i.id) >= 500000);

        if (teknosaItems.length > 0) inspections = teknosaItems;

    }



    AppState.currentWorkOrder = wo;

    AppState.inspectionsCache = inspections;



    container.innerHTML = `

        <div class="max-w-2xl mx-auto space-y-3 pb-8">

            <!-- HEADER (EMIL KOWALSKI CRAFT) -->

            <div class="card-craft-white p-2.5 flex items-center justify-between gap-2">

                <div class="flex items-center gap-2.5 min-w-0">

                    <button onclick="navigateTo('home')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl font-bold text-xs shrink-0 transition border border-slate-200">

                        <i class="fa-solid fa-arrow-left mr-1"></i>Geri

                    </button>

                    <div class="min-w-0">

                        <h1 class="font-bold text-slate-900 text-sm sm:text-base truncate">${wo.customer_name}</h1>

                        ${wo.customer_branch ? `<div class="text-[11px] text-slate-500 truncate">${wo.customer_branch}</div>` : ''}

                    </div>

                </div>

            </div>



            <!-- SAHA NOTU (KOMPAKT BUTON) -->

            <button type="button" onclick="openWorkOrderFieldNotesModal('${wo.id}')"

                class="w-full card-craft-white px-3 py-2 flex items-center justify-between gap-2 hover:border-amber-300 active:scale-[0.99] transition text-left">

                <div class="flex items-center gap-2 min-w-0 flex-1">

                    <i class="fa-solid fa-note-sticky text-amber-500 text-xs shrink-0"></i>

                    <span class="font-bold text-xs text-slate-800 shrink-0">Saha Notu</span>

                    <span id="woFieldNotePreview_${wo.id}" class="text-[11px] ${wo.field_notes && wo.field_notes.trim() ? 'text-amber-800 font-medium' : 'text-slate-400'} truncate">${wo.field_notes && wo.field_notes.trim() ? escapeHtml(wo.field_notes.replace(/\n/g, ' ').trim()) : 'Not ekle...'}</span>

                </div>

                <i class="fa-solid fa-pen text-[10px] text-slate-400 shrink-0"></i>

            </button>



            <!-- RAPORLAR (IMPECCABLE CRAFT) -->

            <div class="card-craft-white p-3.5 space-y-3">

                <div class="flex flex-wrap items-center justify-between gap-2">

                    <div class="font-bold text-xs text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-file-lines text-sky-600"></i>

                        <span>Rapor Taslakları (${inspections.length})</span>

                    </div>

                    <div class="flex items-center gap-1.5 flex-wrap justify-end">

                        <button onclick="openPortalUploadModal('${wo.id}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition" title="Raporları İnternete Yükle ve Müşteri Linki Oluştur">

                            <i class="fa-solid fa-cloud-arrow-up"></i>

                            <span>İnternete Yükle</span>

                        </button>

                        <button onclick="openAddInspectionModal('${wo.id}')" class="px-3.5 py-1.5 btn-craft-emerald active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition">

                            <i class="fa-solid fa-plus"></i>

                            <span>Rapor Ekle</span>

                        </button>

                    </div>

                </div>



                <div id="woInspectionsTableBody" class="space-y-2">

                    ${renderWoInspectionRows(inspections, wo.id)}

                </div>

            </div>

        </div>

    `;

}



function escapeHtml(str) {

    if (str === null || str === undefined) return '';

    return String(str)

        .replace(/&/g, '&amp;')

        .replace(/</g, '&lt;')

        .replace(/>/g, '&gt;')

        .replace(/"/g, '&quot;')

        .replace(/'/g, '&#039;');

}



function escapeForJs(str) {

    if (str === null || str === undefined) return '';

    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');

}



function getCleanTemplateTypeLabel(templateId, templateCode) {

    const tid = String(templateId || '');

    const code = String(templateCode || '');

    if (tid === '2202' || code.includes('317')) {

        return 'Alçak Gerilim Topraklama';

    } else if (tid === '2205' || code.includes('164') || code.includes('322')) {

        return 'Jeneratör';

    } else if (tid === '2201' || code.includes('318')) {

        return 'Elektrik İç Tesisatı';

    }

    const tpl = (window.ENLAB_REPORT_TEMPLATES || []).find(t => String(t.id) === tid);

    if (tpl && tpl.name) {

        let n = tpl.name;

        n = n.replace(' GÖZLE KONTROL VE TESTLERİ', '')

             .replace(' GÖZLE KONTROL VE FONKSİYON TESTLERİ', '')

             .replace(' PERİYODİK KONTROLÜ', '')

             .replace(' TESİSATI', '')

             .replace(' Muayene Raporu', '');

        return n;

    }

    return 'Elektrik Muayenesi';

}



function renderWoInspectionRows(list, workOrderId) {

    if (!list.length) {

        return `<div class="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">

            <i class="fa-solid fa-folder-open text-slate-300 text-2xl mb-2 block"></i>

            Bu klasörde henüz rapor yok.

        </div>`;

    }

    return list.map(item => {

        const isSuitable = (item.result_status || 'UYGUN') === 'UYGUN';

        const isPublished = Boolean(item.portal_report_url);

        const typeLabel = getCleanTemplateTypeLabel(item.template_id, item.template_code);

        return `

        <div class="card-craft-white p-2.5 transition space-y-1.5 hover:border-slate-300">

            <!-- TIER 1: REPORT TITLE & SUBTITLE -->

            <div>

                <div class="flex items-start justify-between gap-2">

                    <!-- ANA YAZI: KULLANICININ GİRDİĞİ PANO / EKİPMAN ADI (ADP, TDP-1 vb.) -->

                    <div class="font-black text-slate-900 text-sm tracking-tight leading-snug flex-1 truncate">

                        ${escapeHtml(item.equipment_name || 'İsimsiz Pano / Ekipman')}

                    </div>

                    <div class="flex items-center gap-1 shrink-0">

                        ${isPublished ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200" title="Doğrulama: ${escapeHtml(item.portal_verify_code || '')}"><i class="fa-solid fa-globe text-[9px]"></i>Yayında</span>` : ''}

                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold ${isSuitable ? 'text-emerald-700' : 'text-rose-700'} bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">

                            <span class="w-1.5 h-1.5 rounded-full ${isSuitable ? 'bg-emerald-500' : 'bg-rose-500'}"></span>

                            ${item.result_status || 'UYGUN'}

                        </span>

                    </div>

                </div>

                <!-- ALT YAZI: KÜÇÜK FONTLA KATEGORİ (TKM-FR YAZILARI KALDIRILDI) -->

                <div class="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap font-medium">

                    <span class="text-sky-700 font-semibold">${typeLabel}</span>

                    ${item.location ? `<span class="text-slate-300">•</span><span class="text-slate-600">${escapeHtml(item.location)}</span>` : ''}

                    ${item.serial_no ? `<span class="text-slate-300">•</span><span class="text-slate-400 font-mono text-[10px]">${escapeHtml(item.serial_no)}</span>` : ''}

                </div>

            </div>



            <!-- TIER 2: ACTION BUTTONS (KOMPAKT & RAFİNE) -->

            <div class="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">

                <div class="flex items-center gap-1 flex-wrap flex-1 min-w-0">

                    <button onclick="navigateTo('inspection-complete', {id: '${item.id}', templateId: '${item.template_id}'})"

                        class="px-2 py-1 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition shadow-2xs">

                        <i class="fa-solid fa-pen-to-square text-[10px]"></i>

                        <span>Doldur</span>

                    </button>

                    <button onclick="quickPreviewReportFromList('${item.id}')"

                        class="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition border border-slate-200">

                        <i class="fa-solid fa-file-pdf text-amber-600 text-[10px]"></i>

                        <span>PDF</span>

                    </button>

                    <button onclick="openPortalUploadModal('${workOrderId}', ['${item.id}'])"

                        class="px-2 py-1 ${isPublished ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'} active:scale-95 font-semibold rounded-lg text-xs flex items-center gap-1 transition border" title="${isPublished ? 'Raporu İnternette Güncelle' : 'İnternete Yükle'}">

                        <i class="fa-solid fa-cloud-arrow-up text-[10px] ${isPublished ? 'text-indigo-600' : 'text-sky-600'}"></i>

                        <span>${isPublished ? 'Güncelle' : 'Yükle'}</span>

                    </button>

                </div>

                <div class="flex items-center gap-0.5 shrink-0">

                    <button onclick="cloneInspectionReport('${item.id}', '${workOrderId}')"

                        class="p-1 text-slate-400 hover:text-sky-600 active:scale-90 rounded-md transition" title="Raporu Klonla">

                        <i class="fa-solid fa-clone text-xs"></i>

                    </button>

                    <button onclick="event.stopPropagation(); openRenameInspectionModal('${item.id}', '${escapeForJs(item.equipment_name || '')}', '${workOrderId}')"

                        class="p-1 text-slate-400 hover:text-sky-600 active:scale-90 rounded-md transition" title="Pano İsmini Düzenle">

                        <i class="fa-solid fa-pen text-xs"></i>

                    </button>

                    <button onclick="event.stopPropagation(); deleteInspectionItem('${item.id}', '${workOrderId}', '${(item.equipment_name || 'Muayene Raporu').replace(/'/g, "\'")}')"

                        class="p-1 text-slate-400 hover:text-rose-600 active:scale-90 rounded-md transition" title="Raporu Sil">

                        <i class="fa-solid fa-trash-can text-xs text-rose-500"></i>

                    </button>

                </div>

            </div>

        </div>

        `;

    }).join('');

}



function openRenameInspectionModal(inspectionId, currentName, workOrderId) {

    openModal(

        '<i class="fa-solid fa-pen-to-square mr-2 text-sky-500"></i>Ekipman Adını Düzenle',

        `<div class="space-y-3 text-xs">

            <div>

                <label class="block font-bold text-slate-800 mb-1">Ekipman Adı <span class="text-rose-500">*</span></label>

                <input type="text" id="renameInspectionInput" value="${escapeHtml(currentName || '')}"

                    placeholder="Örn: ADP, TDP-1, Jeneratör-1..."

                    class="w-full border-2 border-slate-300 focus:border-sky-500 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none">

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">İptal</button>

         <button onclick="submitRenameInspection('${inspectionId}', '${workOrderId}')" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-bold text-xs">Kaydet</button>`

    );

    setTimeout(() => {

        const inp = document.getElementById('renameInspectionInput');

        if (inp) { inp.focus(); inp.select(); }

    }, 120);

}



async function submitRenameInspection(inspectionId, workOrderId) {

    const input = document.getElementById('renameInspectionInput');

    const newName = (input?.value || '').trim();

    if (!newName) {

        showToast('Lütfen geçerli bir pano veya ekipman adı yazın (Örn: ADP, TDP-1)!', 'warning');

        if (input) input.focus();

        return;

    }



    const item = AppState.inspectionsCache.find(x => String(x.id) === String(inspectionId));

    if (item) item.equipment_name = newName;



    if (AppState.currentInspection && String(AppState.currentInspection.id) === String(inspectionId)) {

        AppState.currentInspection.equipment_name = newName;

        if (AppState.currentFormData) {

            if (!AppState.currentFormData.companyInfo) AppState.currentFormData.companyInfo = {};

            AppState.currentFormData.companyInfo.equipmentName = newName;

        }

    }



    try {

        await fetch(`/api/inspections/${inspectionId}`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ equipment_name: newName })

        });

    } catch (e) {

        console.error(e);

    }



    closeModal();

    showToast(`Pano adı "${newName}" olarak güncellendi`);

    await loadInitData();

    if (workOrderId && (AppState.currentPage === 'work-order-details' || AppState.currentRoute === 'work-order-details')) {

        renderWorkOrderDetails(workOrderId, 'inspections');

    } else if (AppState.currentPage === 'inspection-complete') {

        paintInspectionEditorUI();

    }

}



async function quickPreviewReportFromList(inspectionId) {

    await renderInspectionEditor(inspectionId);

    setTimeout(() => printOfficialReport(false), 80);

}



function filterWoInspections() {

    const q = (document.getElementById('woInspFilterInput')?.value || '').toLowerCase();

    const filtered = AppState.inspectionsCache.filter(i =>

        (i.equipment_name || '').toLowerCase().includes(q) ||

        (i.report_no || '').toLowerCase().includes(q)

    );

    const tbody = document.getElementById('woInspectionsTableBody');

    if (tbody && AppState.currentWorkOrder) {

        tbody.innerHTML = renderWoInspectionRows(filtered, AppState.currentWorkOrder.id);

    }

}



function openStartInspectionModal(inspectionId) {

    const item = AppState.inspectionsCache.find(x => String(x.id) === String(inspectionId)) || {

        id: inspectionId,

        equipment_name: 'Muayene Kalemi',

        template_id: '2201'

    };



    const optionsHtml = (window.ENLAB_REPORT_TEMPLATES || []).map(t => `

        <option value="${t.id}" ${String(t.id) === String(item.template_id) ? 'selected' : ''}>

            ${t.code} - ${t.name} (${t.category})

        </option>

    `).join('');



    openModal(

        '<i class="fa-solid fa-play-circle mr-2 text-amber-400"></i>Muayene İşlemine Başla',

        `<div class="space-y-4 text-xs">

            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">

                <div class="text-slate-500">Seçili Ekipman / Muayene Kalemi:</div>

                <div class="font-bold text-slate-900 text-sm mt-0.5">${item.equipment_name}</div>

                <div class="text-slate-500 font-mono mt-0.5">Rapor No: ${item.report_no || 'Otomatik Atanacak'}</div>

            </div>

            <div>

                <label class="block font-bold text-slate-700 mb-1.5">Rapor Şablonu</label>

                <select id="startModalTemplateSelect" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold bg-white focus:border-sky-500 focus:outline-none">

                    ${optionsHtml}

                </select>

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">İptal</button>

         <button onclick="const tid = document.getElementById('startModalTemplateSelect').value; closeModal(); navigateTo('inspection-complete', {id: '${item.id}', templateId: tid});"

            class="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs">

            <i class="fa-solid fa-arrow-right mr-1"></i> Başla ve Raporu Aç

         </button>`

    );

}



window.setQuickInspEqName = function(val) {

    const inp = document.getElementById('newInspEqName');

    if (inp) {

        inp.value = val;

        inp.classList.remove('border-rose-500', 'ring-2', 'ring-rose-200');

        inp.focus();

        const box = document.getElementById('quickInspBox');
        if (box) box.style.display = 'none';

    }

};



// ============================================================================
// HIZLI RAPOR - 03-INSPECTIONS.JS
// Açıklama: Ekipman Ekleme, Akıllı Öneri Algoritması ve Muayene İşlemleri
// Satır Aralığı: 3275 - 5202 (1928 satır)
// ============================================================================

function normalizeEquipmentSearchText(str) {
    if (!str) return '';
    return str
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'I')
        .replace(/i/g, 'I')
        .replace(/Ğ/g, 'G')
        .replace(/ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/ü/g, 'U')
        .replace(/Ş/g, 'S')
        .replace(/ş/g, 'S')
        .replace(/Ö/g, 'O')
        .replace(/ö/g, 'O')
        .replace(/Ç/g, 'C')
        .replace(/ç/g, 'C')
        .toUpperCase();
}

function getEquipmentSuggestions(query, limit = 10) {
    const qRaw = (query || '').trimStart();
    if (!qRaw.trim()) return [];

    const normQ = normalizeEquipmentSearchText(qRaw);
    const counts = {};

    let list = [];
    try {
        if (window.OfflineDB && window.OfflineDB.state && Array.isArray(window.OfflineDB.state.inspections)) {
            list = list.concat(window.OfflineDB.state.inspections);
        }
    } catch (e) {}

    if (window.AppState && Array.isArray(AppState.inspectionsCache)) {
        list = list.concat(AppState.inspectionsCache);
    }

    ['enlab_offline_db_v3_clean', 'enlab_offline_db_v2'].forEach(key => {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed.inspections)) {
                    list = list.concat(parsed.inspections);
                }
            }
        } catch (e) {}
    });

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('enlab_insp_')) {
                const val = JSON.parse(localStorage.getItem(k));
                if (val && val.equipment_name) {
                    list.push({ equipment_name: val.equipment_name });
                }
            }
        }
    } catch (e) {}

    list.forEach(i => {
        if (!i) return;
        const name = (i.equipment_name || '').trim();
        if (name && !name.toLowerCase().includes('isimsiz') && !name.toLowerCase().includes('rapor tasla')) {
            counts[name] = (counts[name] || 0) + 1;
        }
    });

    // Sadece kullanıcının daha önce girdiği veriler taranır (varsayılan statik liste yok)
    // Sadece aranan harfle BAŞLAYANLAR listelenir (içinde geçenler hariç)
    const matching = [];
    Object.keys(counts).forEach(name => {
        const normName = normalizeEquipmentSearchText(name);
        if (normName.startsWith(normQ)) {
            matching.push(name);
        }
    });

    matching.sort((a, b) => (counts[b] || 0) - (counts[a] || 0));

    return matching.slice(0, limit);
}

window.updateEquipmentQuickSuggestions = function(query) {
    const box = document.getElementById('quickInspBox');
    const container = document.getElementById('quickInspChips');
    if (!box || !container) return;

    const suggestions = getEquipmentSuggestions(query, 10);
    if (!suggestions || suggestions.length === 0) {
        box.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    container.innerHTML = suggestions.map(name => `
        <button type="button" onclick="setQuickInspEqName('${escapeForJs(name)}')"
            class="px-2 py-1 bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 rounded text-[11px] font-bold text-slate-700 transition active:scale-95 shadow-2xs">
            ${escapeHtml(name)}
        </button>
    `).join('');

    box.style.display = 'block';
};

function getMostUsedEquipmentNames(limit = 10) {
    return getEquipmentSuggestions('', limit);
}

function openAddInspectionModal(workOrderId) {

    const optionsHtml = (window.ENLAB_REPORT_TEMPLATES || []).map(t => {

        const cleanName = getCleanTemplateTypeLabel(t.id, t.code);

        return `<option value="${t.id}" data-code="${t.code}" data-name="${t.name}">

            ${cleanName}

        </option>`;

    }).join('');



    openModal(
        'Yeni Ekipman Ekle',

        `<div class="space-y-3 text-xs">

            <div>

                <label class="block font-bold text-slate-800 mb-1">Rapor Türü</label>

                <select id="newInspTemplate"

                    class="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold bg-white text-xs">

                    ${optionsHtml}

                </select>

            </div>

            <div>

                <label class="block font-bold text-slate-800 mb-1">Ekipman Adı <span class="text-rose-500">*</span></label>

                <input type="text" id="newInspEqName" value="" placeholder="Örn: ADP, TDP-1, Jeneratör-1..."

                    oninput="updateEquipmentQuickSuggestions(this.value)"

                    class="w-full border-2 border-slate-300 focus:border-sky-500 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none transition">

                

                <!-- Hızlı Seçim Bölmesi (Başlangıçta kapalı, kullanıcı yazdıkça max 10 öneri gelir) -->
                <div id="quickInspBox" style="display: none;" class="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <div class="text-[10px] text-slate-500 font-semibold mb-1 flex items-center justify-between">
                        <span class="flex items-center gap-1">
                            <i class="fa-solid fa-bolt text-amber-500"></i>
                            <span>Hızlı Seçim</span>
                        </span>
                    </div>
                    <div id="quickInspChips" class="flex flex-wrap gap-1"></div>
                </div>

            </div>

            <div class="grid grid-cols-2 gap-2.5">

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Bölge / Mahal (İsteğe Bağlı)</label>

                    <input type="text" id="newInspLocation" value="" placeholder="Örn: Ana Pano Odası" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Seri No / Kod (İsteğe Bağlı)</label>

                    <input type="text" id="newInspSerial" value="" placeholder="Örn: ADP-01" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs">

                </div>

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs">İptal</button>

         <button onclick="submitNewInspection('${workOrderId}')" class="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-2xs active:scale-95">

            <i class="fa-solid fa-plus"></i>

            <span>Ekle ve Aç</span>

         </button>`

    );

    setTimeout(() => {

        const inp = document.getElementById('newInspEqName');

        if (inp) inp.focus();

    }, 120);

}



async function submitNewInspection(workOrderId) {

    const sel = document.getElementById('newInspTemplate');

    const templateId = sel.value;

    const templateCode = sel.options[sel.selectedIndex].getAttribute('data-code') || 'TKM-FR.318';

    const eqNameInput = document.getElementById('newInspEqName');

    const eqName = (eqNameInput?.value || '').trim();



    if (!eqName) {

        showToast('Lütfen ekipman adını giriniz (Örn: ADP, TDP-1)!', 'warning');

        if (eqNameInput) {

            eqNameInput.classList.add('border-rose-500', 'ring-2', 'ring-rose-200');

            eqNameInput.focus();

        }

        return;

    }



    const loc = document.getElementById('newInspLocation').value.trim();

    const serial = document.getElementById('newInspSerial').value.trim();



    const wo = AppState.currentWorkOrder || {};

    const res = await fetch('/api/inspections/new', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

            work_order_id: workOrderId,

            company_name: wo.customer_name || '',

            equipment_name: eqName,

            template_id: templateId,

            template_code: templateCode,

            location: loc,

            serial_no: serial

        })

    });

    const data = await res.json();

    closeModal();

    await loadInitData();

    showToast(`${eqName} muayenesi eklendi!`);

    navigateTo('inspection-complete', { id: data.id, templateId });

}

async function duplicateInspection(inspectionId, workOrderId) {

    const orig = AppState.inspectionsCache.find(x => String(x.id) === String(inspectionId));

    if (!orig) return;

    await fetch('/api/inspections/new', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

            work_order_id: workOrderId || orig.work_order_id,

            company_name: orig.customer_name,

            equipment_name: orig.equipment_name + ' (Kopya)',

            template_id: orig.template_id,

            template_code: orig.template_code,

            location: orig.location,

            serial_no: orig.serial_no,

            copy_from_id: orig.id

        })

    });

    showToast('Muayene kaydı kopyalandı!');

    if (AppState.currentRoute === 'work-order-details') {

        renderWorkOrderDetails(workOrderId, 'inspections');

    } else {

        navigateTo(AppState.currentRoute, AppState.currentParams);

    }

}



async function deleteInspectionItem(inspectionId, workOrderId, inspectionTitle) {

    promptSecurityPasswordConfirmation({

        title: 'Muayene Raporunu Sil',

        entityName: inspectionTitle || 'Muayene Raporu',

        message: 'Bu muayene kaydı ve bağlı tüm ölçüm verileri kalıcı olarak silinecektir.',

        onConfirmed: async () => {

            await fetch(`/api/inspections/${inspectionId}`, { method: 'DELETE' });

            showToast('Muayene silindi', 'warning');

            await loadInitData();

            if (workOrderId && AppState.currentRoute === 'work-order-details') {

                renderWorkOrderDetails(workOrderId, 'inspections');

            } else {

                navigateTo(AppState.currentRoute, AppState.currentParams);

            }

        }

    });

}



async function signAndApproveInspection(inspectionId, workOrderId) {

    await fetch(`/api/inspections/${inspectionId}`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ status: 'Rapor Gönderilmiş', result: 'Uygun' })

    });

    showToast('Rapor E-İmza ile onaylandı!');

    await loadInitData();

    if (workOrderId && AppState.currentRoute === 'work-order-details') {

        renderWorkOrderDetails(workOrderId, 'inspections');

    } else {

        navigateTo(AppState.currentRoute, AppState.currentParams);

    }

}



function openLabelModal(inspectionId, mode = 'label') {

    const cachedItem = AppState.inspectionsCache.find(x => String(x.id) === String(inspectionId));

    const dbItem = (window.OfflineDB?.state?.inspections || []).find(x => String(x.id) === String(inspectionId));

    const item = Object.assign({}, dbItem || {}, cachedItem || {});

    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;

    const logoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getLogoSrc() : 'assets/tekkomer_logo.png';

    const turkakLogoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getTurkakLogoSrc() : 'assets/turkak_logo.jpg';

    const showTurkak = branding.showTurkakLogo !== false;

    const qrImgSrc = (item.portal_report_url && typeof window.generateQrDataUrl === 'function')
        ? window.generateQrDataUrl(item.portal_report_url)
        : ((window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.qrDefault) || 'assets/qr_default.jpg');



    openModal(

        mode === 'qr' ? '<i class="fa-solid fa-qrcode mr-2 text-sky-400"></i>Ekipman Karekod (QR) Etiketi' : '<i class="fa-solid fa-tag mr-2 text-emerald-400"></i>Periyodik Kontrol Ekipman Etiketi',

        `<div class="p-5 border-2 border-slate-800 rounded-xl bg-white max-w-md mx-auto text-center space-y-2.5">

            <div class="flex items-center justify-between border-b-2 border-slate-900 pb-2">

                <img src="${logoSrc}" class="w-12 h-12 object-contain" alt="Logo">

                <div class="text-center flex-1 px-2">

                    <div class="text-[11px] font-black tracking-tight text-slate-900">${escapeHtml(branding.companyFullName)}</div>

                    <div class="text-[10px] font-bold text-red-700">PERİYODİK KONTROL ETİKETİ</div>

                </div>

                ${showTurkak ? `<img src="${turkakLogoSrc}" class="w-10 h-14 object-contain" alt="Akreditasyon">` : `<div class="w-10"></div>`}

            </div>

            <div class="text-sm font-black text-slate-900 pt-1">${escapeHtml(item.equipment_name || 'Ekipman')}</div>

            <div class="text-xs font-semibold text-slate-600">${escapeHtml(item.customer_name || '')}</div>

            <div class="py-2 flex flex-col items-center justify-center gap-1">

                <img src="${qrImgSrc}" class="w-28 h-28 border border-slate-300 p-1 bg-white object-contain" alt="QR Code">

                ${item.portal_verify_code ? `<div class="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">Doğrulama Kodu: ${escapeHtml(item.portal_verify_code)}</div>` : ''}

            </div>

            <div class="grid grid-cols-2 text-left text-[11px] bg-slate-100 p-2.5 rounded border border-slate-200 gap-1.5">

                <div><strong>Rapor No:</strong> <span class="font-mono">${escapeHtml(item.report_no || '-')}</span></div>

                <div><strong>Tarih:</strong> <span class="font-mono">${escapeHtml(item.inspection_date || '-')}</span></div>

                <div><strong>Seri No:</strong> <span class="font-mono">${escapeHtml(item.serial_no || '-')}</span></div>

                <div><strong>Sonuç:</strong> <span class="text-emerald-700 font-black">${escapeHtml(item.result_status || 'UYGUN')}</span></div>

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">Kapat</button>

         <button onclick="window.print()" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs"><i class="fa-solid fa-print mr-1"></i>Etiketi Yazdır</button>`

    );

}



function openUploadWoFileModal(workOrderId) {

    openModal(

        '<i class="fa-solid fa-cloud-arrow-up mr-2 text-sky-400"></i>İş Emrine Dosya Ekle',

        `<div class="space-y-3 text-xs">

            <div>

                <label class="block font-bold text-slate-700 mb-1">Dosya Adı / Açıklaması</label>

                <input type="text" id="woFileNameInput" placeholder="Örn: Tek_Hat_Semasi_ve_Croki.pdf" class="w-full border border-slate-300 rounded-lg px-3 py-2">

            </div>

            <div>

                <label class="block font-bold text-slate-700 mb-1">Dosya Seçin</label>

                <input type="file" onchange="if(this.files[0]) document.getElementById('woFileNameInput').value = this.files[0].name" class="w-full border border-slate-300 rounded-lg p-2 bg-slate-50">

            </div>

        </div>`,

        `<button onclick="closeModal()" class="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs">İptal</button>

         <button onclick="submitWoFile('${workOrderId}')" class="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs">Yükle</button>`

    );

}



async function submitWoFile(workOrderId) {

    const fileName = document.getElementById('woFileNameInput').value.trim() || 'Saha_Ek_Dosyasi.pdf';

    await fetch(`/api/work-orders/${workOrderId}/files`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ name: fileName })

    });

    closeModal();

    showToast('Dosya iş emrine eklendi!');

    renderWorkOrderDetails(workOrderId, 'files');

}



// ============================================================================

// 4. INSPECTIONS LIST PAGES (Tüm Muayeneler, Benim Muayenelerim, Onaylayacağım)

// ============================================================================



async function renderInspectionsPage(scope = 'all', tab = 'current') {

    const container = document.getElementById('pageContent');

    let pageTitle = 'Tüm Muayeneler';

    let routeName = 'all-inspections';

    let tabs = [

        { id: 'current', label: 'Güncel Muayeneler', icon: 'fa-bolt text-sky-600' },

        { id: 'planned', label: 'Planlanmış Muayeneler', icon: 'fa-calendar text-amber-600' }

    ];



    if (scope === 'my') {

        pageTitle = 'Benim Muayenelerim';

        routeName = 'my-inspections';

        tabs = [

            { id: 'current', label: 'Güncel Muayeneler', icon: 'fa-clipboard-check text-sky-600' },

            { id: 'revision', label: 'Düzenleme Yapılacaklar', icon: 'fa-rotate-left text-rose-600' },

            { id: 'planned', label: 'Planlanmış Muayeneler', icon: 'fa-calendar-day text-amber-600' },

            { id: 'sent', label: 'Raporları Gönderilmiş', icon: 'fa-paper-plane text-emerald-600' }

        ];

    } else if (scope === 'approve') {

        pageTitle = 'Onaylayacağım Muayeneler';

        routeName = 'inspections-to-approve';

        tabs = [

            { id: 'pending_approval', label: 'Onay Bekleyenler', icon: 'fa-hourglass-half text-amber-600' },

            { id: 'approved', label: 'Onaylananlar', icon: 'fa-circle-check text-emerald-600' }

        ];

    }



    const res = await fetch('/api/inspections');

    const rawList = await res.json();

    const allNormalized = (Array.isArray(rawList) ? rawList : (rawList.inspections || [])).map(normalizeInspection);



    const filteredByTab = allNormalized.filter(i => {

        if (scope === 'my' && i.is_mine != 1) return false;

        const st = (i.status || '').toLowerCase();

        if (tab === 'sent' || tab === 'approved') return st.includes('gönderil') || st.includes('onaylan') || st === 'approved';

        if (tab === 'revision') return st.includes('düzenle') || st === 'revision' || (i.result_status || '').toLowerCase().includes('uygunsuz');

        if (tab === 'planned') return st.includes('başlayacak') || st.includes('plan');

        if (tab === 'pending_approval') return st.includes('imza') || st.includes('onay') || st.includes('tamamlan');

        return !st.includes('gönderil');

    });



    AppState.inspectionsCache = filteredByTab.length ? filteredByTab : allNormalized;



    const tabsHtml = tabs.map(t => `

        <button onclick="navigateTo('${routeName}', {tab: '${t.id}'})" class="enlab-tab-btn ${tab === t.id ? 'active' : ''}">

            <i class="fa-solid ${t.icon}"></i>

            <span>${t.label}</span>

        </button>

    `).join('');



    container.innerHTML = `

        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

            <div class="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">

                <h1 class="text-lg font-bold text-slate-800">${pageTitle}</h1>

                <div class="flex items-center gap-2">

                    <input type="text" id="inspListSearch" oninput="filterGlobalInspectionsTable()" placeholder="Ekipman, müşteri, iş emri veya rapor no ara..."

                        class="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-72 focus:outline-none focus:border-sky-500">

                </div>

            </div>



            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto">

                ${tabsHtml}

            </div>



            <div class="overflow-x-auto pb-24">

                <table class="w-full text-left border-collapse">

                    <thead>

                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">

                            <th class="py-3 px-3">Ekipman / Tesisat Adı</th>

                            <th class="py-3 px-3">Müşteri Firma</th>

                            <th class="py-3 px-3">İş Emri Kodu</th>

                            <th class="py-3 px-3">Rapor No</th>

                            <th class="py-3 px-3">Muayene Tarihi</th>

                            <th class="py-3 px-3">Şablon</th>

                            <th class="py-3 px-3">Sonuç / Durum</th>

                            <th class="py-3 px-3 text-right">İşlemler</th>

                        </tr>

                    </thead>

                    <tbody id="globalInspTableBody" class="divide-y divide-slate-100 text-xs">

                        ${renderGlobalInspectionRows(AppState.inspectionsCache)}

                    </tbody>

                </table>

            </div>

        </div>

    `;

}



function renderGlobalInspectionRows(list) {

    if (!list.length) {

        return `<tr><td colspan="8" class="p-8 text-center text-slate-400">Bu sekmede muayene kaydı bulunamadı.</td></tr>`;

    }

    return list.map(item => `

        <tr class="hover:bg-sky-50/50 transition">

            <td class="py-3 px-3 font-bold text-slate-800">

                <a href="javascript:void(0)" onclick="navigateTo('inspection-complete', {id: '${item.id}', templateId: '${item.template_id}'})" class="hover:text-sky-600">

                    ${item.equipment_name}

                </a>

                ${item.serial_no ? `<div class="text-[11px] text-slate-500 font-normal">${item.serial_no}</div>` : ''}

            </td>

            <td class="py-3 px-3 font-semibold text-slate-700">${item.customer_name || '-'}</td>

            <td class="py-3 px-3 font-mono text-sky-700">

                <a href="javascript:void(0)" onclick="navigateTo('work-order-details', {id: '${item.work_order_id || 43129}', tab: 'inspections'})" class="hover:underline">

                    ${item.work_order_no || '-'}

                </a>

            </td>

            <td class="py-3 px-3 font-mono text-slate-700">${item.report_no || '-'}</td>

            <td class="py-3 px-3 font-mono text-slate-600">${item.inspection_date || '-'}</td>

            <td class="py-3 px-3"><span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px]">${item.template_code || 'TKM-FR.318'}</span></td>

            <td class="py-3 px-3">

                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${

                    (item.result_status || '').toLowerCase().includes('uygunsuz') || item.result_status === 'UYGUN DEĞİL' ? 'bg-rose-100 text-rose-800' :

                    item.result_status === 'KISMEN UYGUN' ? 'bg-amber-100 text-amber-800' :

                    'bg-emerald-100 text-emerald-800'

                }">${item.result_status || 'Uygun'}</span>

            </td>

            <td class="py-3 px-3 text-right whitespace-nowrap space-x-1">

                <button onclick="openStartInspectionModal('${item.id}')" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px]">

                    <i class="fa-solid fa-play mr-1"></i>Başla

                </button>

                <button onclick="navigateTo('inspection-complete', {id: '${item.id}', templateId: '${item.template_id}'})" class="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded text-[11px]">

                    Raporu Aç

                </button>

                <button onclick="signAndApproveInspection('${item.id}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px]" title="Onayla">

                    <i class="fa-solid fa-check"></i>

                </button>

            </td>

        </tr>

    `).join('');

}



function filterGlobalInspectionsTable() {

    const q = (document.getElementById('inspListSearch')?.value || '').toLowerCase();

    const filtered = AppState.inspectionsCache.filter(i =>

        (i.equipment_name || '').toLowerCase().includes(q) ||

        (i.customer_name || '').toLowerCase().includes(q) ||

        (i.work_order_no || '').toLowerCase().includes(q) ||

        (i.report_no || '').toLowerCase().includes(q) ||

        (i.serial_no || '').toLowerCase().includes(q)

    );

    const tbody = document.getElementById('globalInspTableBody');

    if (tbody) tbody.innerHTML = renderGlobalInspectionRows(filtered);

}



// ============================================================================

// 5. DOCUMENTATION PAGES (Dokümanlar & Dış Kaynaklı Dokümanlar)

// ============================================================================



async function renderDocumentsPage(docType = 'internal', tab = 'active') {

    const container = document.getElementById('pageContent');

    const isExternal = docType === 'external';

    const pageTitle = isExternal ? 'Dış Kaynaklı Dokümanlar (Standart & Yönetmelikler)' : 'Kalite ve Muayene Dokümanları (Talimat & Formlar)';

    const routeName = isExternal ? 'outsource-documents' : 'documents';



    const res = await fetch('/api/documents');

    const rawDocs = await res.json();

    const allDocs = Array.isArray(rawDocs) ? rawDocs : (rawDocs.documents || []);

    const docs = allDocs.filter(d => d.doc_type === docType && (tab === 'active' ? (d.status === 'Aktif' || d.status === 'active') : (d.status !== 'Aktif' && d.status !== 'active')));



    const rowsHtml = docs.map(d => `

        <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">

            <td class="py-3 px-4 font-mono font-bold text-sky-700">${d.code}</td>

            <td class="py-3 px-4 font-semibold text-slate-800">${d.name}</td>

            <td class="py-3 px-4 text-slate-600">${d.category || '-'}</td>

            <td class="py-3 px-4 font-mono text-slate-600">${d.rev_no || '00'}</td>

            <td class="py-3 px-4 font-mono text-slate-600">${d.pub_date || '-'}</td>

            <td class="py-3 px-4">

                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">

                    ${d.status || 'Yürürlükte'}

                </span>

            </td>

            <td class="py-3 px-4 text-right">

                <button onclick="openDocumentPreviewModal('${d.code}', '${(d.name || '').replace(/'/g, '')}')" class="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded font-semibold">

                    <i class="fa-solid fa-eye mr-1"></i>Görüntüle

                </button>

            </td>

        </tr>

    `).join('');



    container.innerHTML = `

        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                <h1 class="text-lg font-bold text-slate-800">${pageTitle}</h1>

            </div>

            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">

                <button onclick="navigateTo('${routeName}', {tab: 'active'})" class="enlab-tab-btn ${tab === 'active' ? 'active' : ''}">

                    <i class="fa-solid fa-book-open text-emerald-600"></i>

                    <span>Güncel Dokümanlar</span>

                </button>

                <button onclick="navigateTo('${routeName}', {tab: 'cancelled'})" class="enlab-tab-btn ${tab === 'cancelled' ? 'active' : ''}">

                    <i class="fa-solid fa-ban text-rose-500"></i>

                    <span>İptal Edilenler</span>

                </button>

            </div>

            <div class="overflow-x-auto">

                <table class="w-full text-left border-collapse">

                    <thead>

                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">

                            <th class="py-3 px-4">Doküman Kodu</th>

                            <th class="py-3 px-4">Doküman / Standart Adı</th>

                            <th class="py-3 px-4">Kategori / Yayınlayan</th>

                            <th class="py-3 px-4">Rev. No</th>

                            <th class="py-3 px-4">Yayın Tarihi</th>

                            <th class="py-3 px-4">Durum</th>

                            <th class="py-3 px-4 text-right">İşlem</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${rowsHtml || '<tr><td colspan="7" class="p-8 text-center text-slate-400 text-xs">Bu sekmede doküman bulunmuyor.</td></tr>'}

                    </tbody>

                </table>

            </div>

        </div>

    `;

}



function openDocumentPreviewModal(code, name) {

    openModal(

        `<i class="fa-solid fa-file-pdf mr-2 text-amber-400"></i>${code} - ${name}`,

        `<div class="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">

            <div class="font-bold text-slate-800 text-sm">${name}</div>

            <div class="text-slate-600">Doküman Kodu: <strong class="font-mono">${code}</strong> · TÜRKAK TS EN ISO/IEC 17020 A Tipi Muayene Kuruluşu Kalite Yönetim Sistemi Dokümanı.</div>

            <p class="text-slate-600 pt-2">Bu standart/talimat ENLAB saha muayene şablonlarına (TKM-FR.318, TKM-FR.319, TKM-FR.320, TKM-FR.321, TKM-FR.322 vb.) otomatik referans olarak bağlanmıştır.</p>

        </div>`

    );

}



// ============================================================================

// 6. QUALITY RECORD MANAGEMENT (Kayıt Yönetimi -> Yeni Kayıt & Kayıt Listesi)

// ============================================================================



async function renderQualityRecordsPage(tab = 'create') {

    const container = document.getElementById('pageContent');

    const res = await fetch('/api/quality-records');

    const raw = await res.json();

    const records = Array.isArray(raw) ? raw : (raw.records || []);



    let bodyHtml = '';

    if (tab === 'create') {

        bodyHtml = `

            <div class="p-6 max-w-2xl space-y-4 text-xs">

                <div class="grid grid-cols-2 gap-4">

                    <div>

                        <label class="block font-bold text-slate-700 mb-1">Kayıt / Form Türü</label>

                        <select id="qrType" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold">

                            <option value="Saha Denetim Kaydı">Saha Denetim / Gözlem Kaydı</option>

                            <option value="DÖF (Düzeltici Önleyici Faaliyet)">DÖF (Düzeltici Önleyici Faaliyet)</option>

                            <option value="Cihaz Doğrulama Kaydı">Cihaz Ara Doğrulama Kaydı</option>

                            <option value="Müşteri Geri Bildirimi">Müşteri Geri Bildirimi / Şikayet</option>

                        </select>

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-1">İlgili Birim</label>

                        <input type="text" id="qrDept" value="Elektriksel Kontroller" class="w-full border border-slate-300 rounded-lg px-3 py-2">

                    </div>

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Kayıt Konusu / Başlığı</label>

                    <input type="text" id="qrTitle" placeholder="Örn: C.121 Metrel MI 3102 BT Saha Öncesi Doğrulama Kontrolü" class="w-full border border-slate-300 rounded-lg px-3 py-2">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Detaylı Açıklama ve Aksiyon Planı</label>

                    <textarea id="qrDesc" rows="4" placeholder="Kayıt detaylarını buraya giriniz..." class="w-full border border-slate-300 rounded-lg p-3"></textarea>

                </div>

                <div class="pt-2">

                    <button onclick="submitQualityRecord()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs">

                        <i class="fa-solid fa-floppy-disk mr-1.5"></i>Kaydı Oluştur ve Sakla

                    </button>

                </div>

            </div>

        `;

    } else {

        const rows = records.map(r => `

            <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">

                <td class="py-3 px-4 font-semibold text-sky-700">${r.record_type}</td>

                <td class="py-3 px-4 font-bold text-slate-800">${r.subject || r.title || '-'}</td>

                <td class="py-3 px-4 text-slate-600">${r.description || '-'}</td>

                <td class="py-3 px-4 text-slate-600">${r.owner || r.created_by || 'Ali Şamil Aytekin'}</td>

                <td class="py-3 px-4 font-mono text-slate-500">${r.created_at || '-'}</td>

            </tr>

        `).join('');

        bodyHtml = `

            <div class="overflow-x-auto">

                <table class="w-full text-left border-collapse">

                    <thead>

                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">

                            <th class="py-3 px-4">Kayıt Türü</th>

                            <th class="py-3 px-4">Konu / Başlık</th>

                            <th class="py-3 px-4">Açıklama</th>

                            <th class="py-3 px-4">Sorumlu</th>

                            <th class="py-3 px-4">Tarih</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${rows || '<tr><td colspan="5" class="p-6 text-center text-slate-400 text-xs">Henüz kalite kaydı oluşturulmadı.</td></tr>'}

                    </tbody>

                </table>

            </div>

        `;

    }



    container.innerHTML = `

        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

            <div class="px-5 py-4 border-b border-slate-200">

                <h1 class="text-lg font-bold text-slate-800">Kalite ve Saha Kayıt Yönetimi</h1>

            </div>

            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">

                <button onclick="navigateTo('quality-record-create', {tab: 'create'})" class="enlab-tab-btn ${tab === 'create' ? 'active' : ''}">

                    <i class="fa-solid fa-file-circle-plus text-emerald-600"></i>

                    <span>Yeni Kayıt Oluştur</span>

                </button>

                <button onclick="navigateTo('quality-record-create', {tab: 'list'})" class="enlab-tab-btn ${tab === 'list' ? 'active' : ''}">

                    <i class="fa-solid fa-list text-sky-600"></i>

                    <span>Kayıt Listesi (${records.length})</span>

                </button>

            </div>

            ${bodyHtml}

        </div>

    `;

}



async function submitQualityRecord() {

    const payload = {

        record_type: document.getElementById('qrType').value,

        department: document.getElementById('qrDept').value.trim(),

        subject: document.getElementById('qrTitle').value.trim() || 'Saha Kalite Kaydı',

        description: document.getElementById('qrDesc').value.trim()

    };

    await fetch('/api/quality-records', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload)

    });

    showToast('Kalite kaydı başarıyla eklendi!');

    navigateTo('quality-record-create', { tab: 'list' });

}



// ============================================================================

// 7. STAFF PAGE (Personel -> Benim Sayfam: Personel & Dosyalar Tabs)

// ============================================================================



async function renderStaffPage(tab = 'profile') {

    const container = document.getElementById('pageContent');

    let contentHtml = '';



    if (tab === 'profile') {

        contentHtml = `

            <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">

                <div class="border border-slate-200 rounded-xl overflow-hidden">

                    <div class="bg-slate-800 text-white px-4 py-2.5 font-bold uppercase tracking-wider">Personel Kimlik & Yetki Bilgileri</div>

                    <div class="divide-y divide-slate-100">

                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">Ad Soyad:</span><span class="col-span-2 font-bold text-slate-900">Ali Şamil Aytekin</span></div>

                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">Meslek / Unvan:</span><span class="col-span-2 font-semibold text-sky-700">Elektrik Mühendisi / Muayene Uzmanı</span></div>

                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">Birim:</span><span class="col-span-2">Periyodik Kontrol ve Elektriksel Ölçümler</span></div>

                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">EKİPNET / Oda No:</span><span class="col-span-2 font-mono">EMO-64892 / EKİPNET Kayıtlı</span></div>

                        <div class="grid grid-cols-3 p-3"><span class="font-semibold text-slate-500">Yetki Kapsamı:</span><span class="col-span-2">Elektrik İç Tesisatı, Topraklama, Paratoner, Jeneratör, Kompanzasyon, Termal Kamera, Yangın Algılama, Mekanik Tesisat</span></div>

                    </div>

                </div>

                <div class="border border-slate-200 rounded-xl overflow-hidden">

                    <div class="bg-slate-800 text-white px-4 py-2.5 font-bold uppercase tracking-wider">Zimmetli Referans Cihazlarım</div>

                    <div class="p-4 space-y-2.5">

                        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">

                            <div>

                                <div class="font-bold text-slate-800">C.121 - METREL MI 3102 BT EurotestXE</div>

                                <div class="text-slate-500">Çok Fonksiyonlu Elektrik Tesisat Test Cihazı</div>

                            </div>

                            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Aktif Zimmetli</span>

                        </div>

                        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">

                            <div>

                                <div class="font-bold text-slate-800">C.105 - UNI-T UTi165A Termal Kamera</div>

                                <div class="text-slate-500">Termal Görüntüleme ve Sıcaklık Ölçüm Cihazı</div>

                            </div>

                            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Aktif Zimmetli</span>

                        </div>

                    </div>

                </div>

            </div>

        `;

    } else {

        contentHtml = `

            <div class="p-5">

                <table class="w-full text-left border-collapse text-xs">

                    <thead>

                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">

                            <th class="py-3 px-4">Belge / Sertifika Adı</th>

                            <th class="py-3 px-4">Geçerlilik Durumu</th>

                            <th class="py-3 px-4 text-right">İşlem</th>

                        </tr>

                    </thead>

                    <tbody class="divide-y divide-slate-100">

                        <tr><td class="py-3 px-4 font-semibold">Elektrik Mühendisliği Lisans Diploması & EMO Yetki Belgesi</td><td class="py-3 px-4"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">Geçerli</span></td><td class="py-3 px-4 text-right"><button onclick="showToast('Belge görüntülendi')" class="text-sky-600 font-semibold">Görüntüle</button></td></tr>

                        <tr><td class="py-3 px-4 font-semibold">Elektrik İç Tesisleri ve Topraklama Ölçüm Yetki Sertifikası</td><td class="py-3 px-4"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">Geçerli</span></td><td class="py-3 px-4 text-right"><button onclick="showToast('Belge görüntülendi')" class="text-sky-600 font-semibold">Görüntüle</button></td></tr>

                        <tr><td class="py-3 px-4 font-semibold">TS EN ISO/IEC 17020 Muayene Personeli Atama Yazısı</td><td class="py-3 px-4"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold">Geçerli</span></td><td class="py-3 px-4 text-right"><button onclick="showToast('Belge görüntülendi')" class="text-sky-600 font-semibold">Görüntüle</button></td></tr>

                    </tbody>

                </table>

            </div>

        `;

    }



    container.innerHTML = `

        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

            <div class="px-5 py-4 border-b border-slate-200">

                <h1 class="text-lg font-bold text-slate-800">Ali Şamil Aytekin - Personel Dosyası</h1>

            </div>

            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">

                <button onclick="navigateTo('staff-my-details', {tab: 'profile'})" class="enlab-tab-btn ${tab === 'profile' ? 'active' : ''}">

                    <i class="fa-solid fa-user-check text-sky-600"></i>

                    <span>Personel Bilgileri</span>

                </button>

                <button onclick="navigateTo('staff-my-details', {tab: 'files'})" class="enlab-tab-btn ${tab === 'files' ? 'active' : ''}">

                    <i class="fa-solid fa-folder-open text-amber-600"></i>

                    <span>Personel Dosyaları & Sertifikalar</span>

                </button>

            </div>

            ${contentHtml}

        </div>

    `;

}



// ============================================================================

// 8. INSTRUMENT MANAGEMENT (Cihazlar, Cihaz Kullanıcıları, Kalibrasyonlar)

// ============================================================================



async function renderInstrumentsPage(tab = 'active') {

    const container = document.getElementById('pageContent');

    const res = await fetch('/api/instruments');

    const data = await res.json();

    const allInst = data.instruments || [];

    const filtered = allInst.filter(i => tab === 'active' ? (i.status === 'Aktif' || i.status === 'active') : (i.status !== 'Aktif' && i.status !== 'active'));



    const rowsHtml = filtered.map(inst => `

        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">

            <td class="py-3 px-4 font-mono font-bold text-sky-700">${inst.code}</td>

            <td class="py-3 px-4 font-bold text-slate-800">${inst.name}</td>

            <td class="py-3 px-4 text-slate-700">${inst.brand || '-'} / ${inst.model || '-'}</td>

            <td class="py-3 px-4 font-mono text-slate-600">${inst.serial_no || '-'}</td>

            <td class="py-3 px-4 text-slate-700 font-medium">${inst.responsible || 'Ali Şamil Aytekin'}</td>

            <td class="py-3 px-4 text-slate-600">${inst.department || 'Muayene'} (${inst.branch || 'Merkez'})</td>

            <td class="py-3 px-4">

                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">${inst.status || 'Aktif'}</span>

            </td>

        </tr>

    `).join('');



    container.innerHTML = `

        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

            <div class="px-5 py-4 border-b border-slate-200">

                <h1 class="text-lg font-bold text-slate-800">Test ve Ölçüm Cihazları Listesi</h1>

            </div>

            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">

                <button onclick="navigateTo('reference-products', {tab: 'active'})" class="enlab-tab-btn ${tab === 'active' ? 'active' : ''}">

                    <i class="fa-solid fa-gauge-high text-emerald-600"></i>

                    <span>Aktif Cihazlar (${allInst.filter(x=>x.status==='Aktif'||x.status==='active').length})</span>

                </button>

                <button onclick="navigateTo('reference-products', {tab: 'passive'})" class="enlab-tab-btn ${tab === 'passive' ? 'active' : ''}">

                    <i class="fa-solid fa-box-archive text-slate-500"></i>

                    <span>Pasif / Bakımdaki Cihazlar</span>

                </button>

            </div>

            <div class="overflow-x-auto">

                <table class="w-full text-left border-collapse">

                    <thead>

                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">

                            <th class="py-3 px-4">Cihaz Kodu</th>

                            <th class="py-3 px-4">Cihaz Tanımı</th>

                            <th class="py-3 px-4">Marka / Model</th>

                            <th class="py-3 px-4">Seri No</th>

                            <th class="py-3 px-4">Sorumlu Personel</th>

                            <th class="py-3 px-4">Birim / Şube</th>

                            <th class="py-3 px-4">Durum</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${rowsHtml || '<tr><td colspan="7" class="p-8 text-center text-slate-400 text-xs">Bu sekmede cihaz bulunmamaktadır.</td></tr>'}

                    </tbody>

                </table>

            </div>

        </div>

    `;

}



async function renderInstrumentUsersPage() {

    const container = document.getElementById('pageContent');

    const res = await fetch('/api/instruments');

    const data = await res.json();

    const allInst = data.instruments || [];



    const rows = allInst.map(i => `

        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">

            <td class="py-3 px-4 font-bold text-slate-800">${i.responsible || 'Ali Şamil Aytekin'}</td>

            <td class="py-3 px-4 font-mono font-bold text-sky-700">${i.code}</td>

            <td class="py-3 px-4 font-semibold text-slate-700">${i.brand} ${i.model} (${i.name})</td>

            <td class="py-3 px-4 font-mono text-slate-600">${i.serial_no}</td>

            <td class="py-3 px-4"><span class="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold text-[11px]">Saha Zimmetinde</span></td>

        </tr>

    `).join('');



    container.innerHTML = `

        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

            <div class="px-5 py-4 border-b border-slate-200">

                <h1 class="text-lg font-bold text-slate-800">Personel Cihaz Zimmet Listesi</h1>

            </div>

            <div class="overflow-x-auto">

                <table class="w-full text-left border-collapse">

                    <thead>

                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">

                            <th class="py-3 px-4">Personel Adı</th>

                            <th class="py-3 px-4">Cihaz Kodu</th>

                            <th class="py-3 px-4">Cihaz Bilgisi</th>

                            <th class="py-3 px-4">Seri No</th>

                            <th class="py-3 px-4">Zimmet Durumu</th>

                        </tr>

                    </thead>

                    <tbody>${rows}</tbody>

                </table>

            </div>

        </div>

    `;

}



async function renderCalibrationsPage(tab = 'current') {

    const container = document.getElementById('pageContent');

    const res = await fetch('/api/instruments');

    const data = await res.json();

    const allCals = data.calibrations || [];

    const cals = allCals.filter(c => tab === 'current' ? c.is_current == 1 : c.is_current != 1);



    const rows = (cals.length ? cals : allCals).map(c => `

        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">

            <td class="py-3 px-4 font-mono font-bold text-sky-700">${c.device_code || c.instrument_code || '-'}</td>

            <td class="py-3 px-4 font-semibold text-slate-800">${c.device_name || c.instrument_name || '-'} (${c.brand || ''} ${c.model || ''})</td>

            <td class="py-3 px-4 font-mono text-slate-700">${c.cert_no || c.certificate_no || '-'}</td>

            <td class="py-3 px-4 font-mono text-slate-600">${c.cal_date || c.calibration_date || '-'}</td>

            <td class="py-3 px-4 font-semibold text-emerald-700">${c.remaining_text || c.due_date || 'Güncel'}</td>

            <td class="py-3 px-4 text-slate-600">${c.company || c.provider || '-'}</td>

            <td class="py-3 px-4"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-[11px]">Geçerli</span></td>

        </tr>

    `).join('');



    container.innerHTML = `

        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

            <div class="px-5 py-4 border-b border-slate-200">

                <h1 class="text-lg font-bold text-slate-800">Cihaz Kalibrasyon Sertifikaları ve Takibi</h1>

            </div>

            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">

                <button onclick="navigateTo('calibrations', {tab: 'current'})" class="enlab-tab-btn ${tab === 'current' ? 'active' : ''}">

                    <i class="fa-solid fa-certificate text-emerald-600"></i>

                    <span>Güncel Kalibrasyonlar (${allCals.length})</span>

                </button>

                <button onclick="navigateTo('calibrations', {tab: 'history'})" class="enlab-tab-btn ${tab === 'history' ? 'active' : ''}">

                    <i class="fa-solid fa-clock-rotate-left text-slate-500"></i>

                    <span>Geçmiş Kalibrasyon Kayıtları</span>

                </button>

            </div>

            <div class="overflow-x-auto">

                <table class="w-full text-left border-collapse">

                    <thead>

                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">

                            <th class="py-3 px-4">Cihaz Kodu</th>

                            <th class="py-3 px-4">Cihaz Adı</th>

                            <th class="py-3 px-4">Sertifika No</th>

                            <th class="py-3 px-4">Kalibrasyon Tarihi</th>

                            <th class="py-3 px-4">Kalan Süre / Geçerlilik</th>

                            <th class="py-3 px-4">Kalibrasyon Kuruluşu</th>

                            <th class="py-3 px-4">Durum</th>

                        </tr>

                    </thead>

                    <tbody>${rows}</tbody>

                </table>

            </div>

        </div>

    `;

}



// ============================================================================

// 9. CALENDAR PAGE (Takvim -> Etkinlikler & Yeni Etkinlik)

// ============================================================================



async function renderCalendarPage(tab = 'calendar') {

    const container = document.getElementById('pageContent');

    const res = await fetch('/api/calendar');

    const raw = await res.json();

    const events = Array.isArray(raw) ? raw : (raw.events || []);



    let bodyHtml = '';

    if (tab === 'create') {

        bodyHtml = `

            <div class="p-6 max-w-xl space-y-4 text-xs">

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Etkinlik / Saha Muayene Başlığı</label>

                    <input type="text" id="calTitle" placeholder="Örn: TEKNOSA Manisa Soma Periyodik Muayene Planı" class="w-full border border-slate-300 rounded-lg px-3 py-2">

                </div>

                <div class="grid grid-cols-2 gap-3">

                    <div>

                        <label class="block font-bold text-slate-700 mb-1">Başlangıç Tarihi</label>

                        <input type="date" id="calStart" value="${new Date().toISOString().slice(0,10)}" class="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono">

                    </div>

                    <div>

                        <label class="block font-bold text-slate-700 mb-1">Lokasyon / Şube</label>

                        <input type="text" id="calLoc" value="Manisa Soma" class="w-full border border-slate-300 rounded-lg px-3 py-2">

                    </div>

                </div>

                <button onclick="submitCalendarEvent()" class="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg">

                    <i class="fa-solid fa-calendar-plus mr-1.5"></i>Takvime Ekle

                </button>

            </div>

        `;

    } else {

        const rows = events.map(ev => `

            <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">

                <td class="py-3 px-4 font-bold text-slate-800">${ev.title}</td>

                <td class="py-3 px-4 font-mono text-slate-600">${(ev.start_date || '').replace('T', ' ').slice(0, 16)}</td>

                <td class="py-3 px-4 text-slate-600">${ev.location || 'Müşteri Sahası'}</td>

                <td class="py-3 px-4 text-slate-600">${ev.inspector || 'Ali Şamil Aytekin'}</td>

                <td class="py-3 px-4 text-right">

                    <button onclick="navigateTo('work-order-details', {id: '43129'})" class="px-2.5 py-1 bg-sky-50 text-sky-700 rounded font-semibold">İş Emrini Aç</button>

                </td>

            </tr>

        `).join('');

        bodyHtml = `

            <div class="overflow-x-auto">

                <table class="w-full text-left border-collapse">

                    <thead>

                        <tr class="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">

                            <th class="py-3 px-4">Saha Muayene / Etkinlik Başlığı</th>

                            <th class="py-3 px-4">Tarih</th>

                            <th class="py-3 px-4">Lokasyon</th>

                            <th class="py-3 px-4">Uzman</th>

                            <th class="py-3 px-4 text-right">Bağlantı</th>

                        </tr>

                    </thead>

                    <tbody>${rows}</tbody>

                </table>

            </div>

        `;

    }



    container.innerHTML = `

        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

            <div class="px-5 py-4 border-b border-slate-200">

                <h1 class="text-lg font-bold text-slate-800">Muayene ve Denetim Takvimi</h1>

            </div>

            <div class="px-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2">

                <button onclick="navigateTo('calendar', {tab: 'calendar'})" class="enlab-tab-btn ${tab !== 'create' ? 'active' : ''}">

                    <i class="fa-solid fa-calendar-week text-sky-600"></i>

                    <span>Planlanan Etkinlikler (${events.length})</span>

                </button>

                <button onclick="navigateTo('calendar-create')" class="enlab-tab-btn ${tab === 'create' ? 'active' : ''}">

                    <i class="fa-solid fa-calendar-plus text-emerald-600"></i>

                    <span>Yeni Etkinlik Ekle</span>

                </button>

            </div>

            ${bodyHtml}

        </div>

    `;

}



async function submitCalendarEvent() {

    const title = document.getElementById('calTitle').value.trim() || 'Saha Muayene Planı';

    const start_date = document.getElementById('calStart').value;

    const location = document.getElementById('calLoc').value.trim();

    await fetch('/api/calendar', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ title, start_date, end_date: start_date, location })

    });

    await loadInitData();

    showToast('Yeni takvim etkinliği kaydedildi!');

    navigateTo('calendar');

}



// ============================================================================

// 10. DYNAMIC INSPECTION REPORT EDITOR (/Inspection/Inspection/Complete/:id)

// ============================================================================





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
    if (!container || !insp) return;

    // Scroll ve odak koruma (kullanıcının en üste atılmasını ve odak kaybını önler)
    const prevScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const activeEl = document.activeElement;
    const activeId = activeEl && activeEl.id ? activeEl.id : null;
    let selStart = null, selEnd = null;
    if (activeEl && ('selectionStart' in activeEl)) {
        selStart = activeEl.selectionStart;
        selEnd = activeEl.selectionEnd;
    }

    

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
    // Scroll pozisyonunu derhal eski yerine döndür
    if (prevScrollY > 0) {
        window.scrollTo({ top: prevScrollY, behavior: 'instant' });
        requestAnimationFrame(() => {
            window.scrollTo({ top: prevScrollY, behavior: 'instant' });
        });
    }

    // Odaklanılmış eleman varsa odağı ve imleç konumunu geri yükle
    if (activeId) {
        const el = document.getElementById(activeId);
        if (el) {
            try {
                el.focus();
                if (selStart !== null && selEnd !== null && ('setSelectionRange' in el)) {
                    el.setSelectionRange(selStart, selEnd);
                }
            } catch (e) {}
        }
    }
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

    if (!fd.companyInfo.contactEmail) fd.companyInfo.contactEmail = insp.contact_email || insp.customer_email || wo.contact_email || '';

    if (fd.companyInfo.equipmentName === undefined) fd.companyInfo.equipmentName = insp.equipment_name || '';

    if (fd.companyInfo.serialCode === undefined) fd.companyInfo.serialCode = insp.serial_no || '';

    if (fd.companyInfo.startEndTime === undefined) fd.companyInfo.startEndTime = '';

    if (fd.companyInfo.reportNo === undefined) fd.companyInfo.reportNo = insp.report_no || '';

    if (fd.companyInfo.reportDate === undefined) fd.companyInfo.reportDate = insp.inspection_date || '';

    if (fd.companyInfo.nextControlDate === undefined) fd.companyInfo.nextControlDate = fd.nextInspectionDate || '';

    // İlk kez rapora girildiğinde tarih, saat ve sonraki kontrol tarihini otomatik ayarla
    const ci = fd.companyInfo;
    if (!ci._dateTimeInitialized) {
        if (ci.startEndTime && String(ci.startEndTime).trim()) {
            // Mevcut eski formatlı kaydı koru ve parçalayabildiklerini picker'lara aktar
            const raw = String(ci.startEndTime).trim();
            const times = raw.match(/\b(\d{1,2}:\d{2})\b/g) || [];
            const dates = raw.match(/\b(\d{1,2}\.\d{1,2}\.\d{4})\b/g) || [];
            ci.controlStartDate = toIsoDate(dates[0] || insp.inspection_date || ci.reportDate) || getLocalTodayIso();
            ci.controlEndDate = toIsoDate(dates[1] || dates[0] || ci.controlStartDate) || ci.controlStartDate;
            ci.controlStartTime = times[0] ? times[0].padStart(5, '0') : '';
            ci.controlEndTime = times[1] ? times[1].padStart(5, '0') : '';
        } else {
            const prefs = (typeof ReportDateTimePrefs !== 'undefined') ? ReportDateTimePrefs.get() : { fixedStartTime: '', fixedEndTime: '' };
            const todayIso = getLocalTodayIso();
            const startTime = prefs.fixedStartTime || getLocalNowHHMM();
            const endTime = prefs.fixedEndTime || '';
            let endIso = todayIso;
            if (prefs.fixedStartTime && prefs.fixedEndTime && prefs.fixedEndTime < prefs.fixedStartTime) {
                endIso = addDaysIso(todayIso, 1);
            }
            ci.controlStartDate = todayIso;
            ci.controlStartTime = startTime;
            ci.controlEndDate = endIso;
            ci.controlEndTime = endTime;
            ci.startEndTime = formatStartEndTimeDisplay(todayIso, startTime, endIso, endTime);
            const trStart = toTrDate(todayIso);
            ci.reportDate = trStart;
            insp.inspection_date = trStart;
            const months = (typeof ReportDateTimePrefs !== 'undefined') ? ReportDateTimePrefs.getValidityMonths(insp.template_id) : 12;
            const nextTr = toTrDate(addMonthsIso(todayIso, months));
            fd.nextInspectionDate = nextTr;
            ci.nextControlDate = nextTr;
        }
        ci._dateTimeInitialized = true;
    } else {
        if (!ci.controlStartDate) ci.controlStartDate = toIsoDate(insp.inspection_date || ci.reportDate) || getLocalTodayIso();
        if (!ci.controlEndDate) ci.controlEndDate = ci.controlStartDate;
        if (!ci.startEndTime) {
            ci.startEndTime = formatStartEndTimeDisplay(ci.controlStartDate, ci.controlStartTime, ci.controlEndDate, ci.controlEndTime);
        }
    }

}

function syncReportNextDateFromStart(baseIso) {
    const fd = AppState.currentFormData;
    const insp = AppState.currentInspection;
    if (!fd || !insp || !baseIso) return;
    if (!fd.companyInfo) fd.companyInfo = {};
    const months = (typeof ReportDateTimePrefs !== 'undefined') ? ReportDateTimePrefs.getValidityMonths(insp.template_id) : 12;
    const nextIso = addMonthsIso(baseIso, months);
    const nextTr = toTrDate(nextIso);
    fd.nextInspectionDate = nextTr;
    fd.companyInfo.nextControlDate = nextTr;
    const qNext = document.getElementById('editorQuickNextDateInput');
    if (qNext && qNext.value !== nextIso) qNext.value = nextIso;
    const sNext = document.getElementById('editorNextControlDateInput');
    if (sNext && sNext.value !== nextIso) sNext.value = nextIso;
}

function updateReportDateTimeField(field, value) {
    ensureCompanyInfo();
    const ci = AppState.currentFormData.companyInfo;
    const insp = AppState.currentInspection;
    ci._dateTimeInitialized = true;

    if (field === 'startDate') {
        const iso = toIsoDate(value);
        if (!iso) return;
        const prevStart = ci.controlStartDate;
        ci.controlStartDate = iso;
        if (!ci.controlEndDate || ci.controlEndDate === prevStart || ci.controlEndDate < iso) {
            ci.controlEndDate = (ci.controlStartTime && ci.controlEndTime && ci.controlEndTime < ci.controlStartTime)
                ? addDaysIso(iso, 1)
                : iso;
            const endDateEl = document.getElementById('editorEndDateInput');
            if (endDateEl) endDateEl.value = ci.controlEndDate;
        }
        const tr = toTrDate(iso);
        ci.reportDate = tr;
        if (insp) insp.inspection_date = tr;
        const repDateEl = document.getElementById('editorReportDateInput');
        if (repDateEl) repDateEl.value = iso;
        syncReportNextDateFromStart(iso);
    } else if (field === 'startTime') {
        ci.controlStartTime = String(value || '').trim();
        if (ci.controlStartDate) syncReportNextDateFromStart(ci.controlStartDate);
    } else if (field === 'endDate') {
        const iso = toIsoDate(value);
        if (iso) ci.controlEndDate = iso;
    } else if (field === 'endTime') {
        ci.controlEndTime = String(value || '').trim();
        if (ci.controlStartDate && ci.controlStartTime && ci.controlEndTime && ci.controlEndTime < ci.controlStartTime && ci.controlEndDate === ci.controlStartDate) {
            ci.controlEndDate = addDaysIso(ci.controlStartDate, 1);
            const endDateEl = document.getElementById('editorEndDateInput');
            if (endDateEl) endDateEl.value = ci.controlEndDate;
        }
        if (ci.controlStartDate && !AppState.currentFormData.nextInspectionDate) {
            syncReportNextDateFromStart(ci.controlStartDate);
        }
    }

    ci.startEndTime = formatStartEndTimeDisplay(ci.controlStartDate, ci.controlStartTime, ci.controlEndDate, ci.controlEndTime);
    const previewEl = document.getElementById('editorStartEndPreview');
    if (previewEl) previewEl.textContent = ci.startEndTime || '-';
    triggerAutoSave();
}

function setReportEndTimeNow() {
    ensureCompanyInfo();
    const ci = AppState.currentFormData.companyInfo;
    const nowTime = getLocalNowHHMM();
    const todayIso = getLocalTodayIso();
    ci.controlEndTime = nowTime;
    ci.controlEndDate = todayIso;
    const endTimeEl = document.getElementById('editorEndTimeInput');
    if (endTimeEl) endTimeEl.value = nowTime;
    const endDateEl = document.getElementById('editorEndDateInput');
    if (endDateEl) endDateEl.value = todayIso;
    updateReportDateTimeField('endTime', nowTime);
}

function updateReportDateManual(isoVal) {
    const iso = toIsoDate(isoVal);
    if (!iso || !AppState.currentInspection || !AppState.currentFormData) return;
    ensureCompanyInfo();
    const tr = toTrDate(iso);
    AppState.currentInspection.inspection_date = tr;
    AppState.currentFormData.companyInfo.reportDate = tr;
    syncReportNextDateFromStart(iso);
    triggerAutoSave();
}

function updateReportNextDateManual(isoVal) {
    const iso = toIsoDate(isoVal);
    if (!AppState.currentFormData) return;
    if (!AppState.currentFormData.companyInfo) AppState.currentFormData.companyInfo = {};
    const tr = iso ? toTrDate(iso) : '';
    AppState.currentFormData.nextInspectionDate = tr;
    AppState.currentFormData.companyInfo.nextControlDate = tr;
    const qNext = document.getElementById('editorQuickNextDateInput');
    if (qNext && qNext.value !== iso) qNext.value = iso;
    const sNext = document.getElementById('editorNextControlDateInput');
    if (sNext && sNext.value !== iso) sNext.value = iso;
    triggerAutoSave();
}

window.updateReportDateTimeField = updateReportDateTimeField;
window.setReportEndTimeNow = setReportEndTimeNow;
window.updateReportDateManual = updateReportDateManual;
window.updateReportNextDateManual = updateReportNextDateManual;



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

                    <label class="block font-bold text-slate-700 mb-1">Seri No / Pano Kodu</label>

                    <input type="text" value="${escapeHtml(ci.serialCode || '')}" placeholder=""

                        oninput="AppState.currentFormData.companyInfo.serialCode=this.value; AppState.currentInspection.serial_no=this.value; triggerAutoSave();"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Rapor No</label>

                    <input type="text" value="${escapeHtml(ci.reportNo || insp.report_no || '')}" placeholder=""

                        oninput="AppState.currentFormData.companyInfo.reportNo=this.value; AppState.currentInspection.report_no=this.value; triggerAutoSave();"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

                </div>

                <div class="sm:col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">

                    <div class="flex items-center justify-between gap-2 flex-wrap">

                        <span class="font-bold text-slate-800 text-xs flex items-center gap-1.5">

                            <i class="fa-solid fa-clock text-sky-600"></i>

                            <span>Kontrol Tarih &amp; Saati</span>

                        </span>

                        <span id="editorStartEndPreview" class="text-[11px] font-mono font-semibold text-sky-800 bg-white px-2 py-0.5 rounded border border-slate-200">${escapeHtml(ci.startEndTime || '-')}</span>

                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">

                        <div>

                            <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Başlangıç Tarihi</label>

                            <input type="date" id="editorStartDateInput" value="${escapeHtml(toIsoDate(ci.controlStartDate || insp.inspection_date) || getLocalTodayIso())}"

                                onchange="updateReportDateTimeField('startDate', this.value)"

                                class="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold bg-white">

                        </div>

                        <div>

                            <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Başlangıç Saati</label>

                            <input type="time" id="editorStartTimeInput" value="${escapeHtml(ci.controlStartTime || '')}"

                                onchange="updateReportDateTimeField('startTime', this.value)"

                                class="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold bg-white">

                        </div>

                        <div>

                            <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Bitiş Tarihi</label>

                            <input type="date" id="editorEndDateInput" value="${escapeHtml(toIsoDate(ci.controlEndDate || ci.controlStartDate || insp.inspection_date) || getLocalTodayIso())}"

                                onchange="updateReportDateTimeField('endDate', this.value)"

                                class="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold bg-white">

                        </div>

                        <div>

                            <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Bitiş Saati</label>

                            <div class="flex items-center gap-1">

                                <input type="time" id="editorEndTimeInput" value="${escapeHtml(ci.controlEndTime || '')}"

                                    onchange="updateReportDateTimeField('endTime', this.value)"

                                    class="flex-1 min-w-0 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold bg-white">

                                <button type="button" onclick="setReportEndTimeNow()" class="px-2 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg text-[10px] font-bold shrink-0 border border-sky-200 transition" title="Şu anki saati bitiş saati yap">Şimdi</button>

                            </div>

                        </div>

                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/70">

                        <div>

                            <label class="block text-[10px] font-bold text-slate-600 mb-0.5">Sonraki Periyodik Kontrol (${(typeof ReportDateTimePrefs !== 'undefined') ? ReportDateTimePrefs.getValidityMonths(insp.template_id) : 12} Ay)</label>

                            <input type="date" id="editorQuickNextDateInput" value="${escapeHtml(toIsoDate(AppState.currentFormData.nextInspectionDate || ci.nextControlDate) || '')}"

                                onchange="updateReportNextDateManual(this.value)"

                                class="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold bg-white">

                        </div>

                    </div>

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

                <div class="sm:col-span-2">

                    <label class="block font-bold text-slate-700 mb-1"><i class="fa-solid fa-envelope text-sky-600 mr-1"></i>Yetkili E-posta Adresi</label>

                    <input type="email" value="${escapeHtml(ci.contactEmail || '')}" placeholder="yetkili@firma.com"

                        oninput="AppState.currentFormData.companyInfo.contactEmail=this.value; AppState.currentInspection.contact_email=this.value; if(AppState.currentInspection.work_order_id && typeof saveWorkOrderEmailRealtime==='function'){saveWorkOrderEmailRealtime(AppState.currentInspection.work_order_id, this.value);} triggerAutoSave();"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">

                </div>

            </div>

        </div>

    `;

}



function isSharedMeasuringDeviceRowBlank(row) {
    if (!row || typeof row !== 'object') return true;
    return !String(row.name || '').trim()
        && !String(row.serial || '').trim()
        && !String(row.calDate || '').trim()
        && !String(row.validDate || '').trim()
        && !String(row.certNo || '').trim();
}

function ensureMeasuringDevices() {

    const fd = AppState.currentFormData;
    const insp = AppState.currentInspection;

    if (!fd) return;

    if (!Array.isArray(fd.measuringDevices)) {
        fd.measuringDevices = [];
    }

    const isBlankList = fd.measuringDevices.length === 0 || fd.measuringDevices.every(isSharedMeasuringDeviceRowBlank);
    if (!isBlankList && !fd._devicesInitialized) {
        fd._devicesInitialized = true;
    }

    if (!fd._devicesInitialized && isBlankList && window.MeasuringDevicesManager) {
        const mgr = window.MeasuringDevicesManager;
        if (mgr.isAutoApplyEnabled() && mgr.getAssignedDevices().length > 0) {
            mgr.applyDefaultsToFormData(fd, insp ? insp.template_id : null, false);
        }
    }

    if (!fd._devicesInitialized && fd.measuringDevices.length === 0) {
        fd.measuringDevices = [
            { name: '', serial: '', calDate: '', validDate: '', certNo: '' }
        ];
    }

}

function syncGeneratorMeasuringDevicesRef() {
    const fd = AppState.currentFormData;
    const insp = AppState.currentInspection;
    if (fd && insp && String(insp.template_id) === '2205' && fd.generator) {
        fd.generator.devices = fd.measuringDevices;
    }
}

function addManualMeasuringDeviceRow() {
    if (window.MeasuringDevicesManager && typeof window.MeasuringDevicesManager.isCloudManaged === 'function' && window.MeasuringDevicesManager.isCloudManaged()) {
        showToast('Yalnızca firma yöneticinizin atadığı ölçüm cihazlarını kullanabilirsiniz.', 'warning');
        return;
    }
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!Array.isArray(fd.measuringDevices)) fd.measuringDevices = [];
    fd.measuringDevices.push({ name: '', serial: '', calDate: '', validDate: '', certNo: '' });
    fd._devicesInitialized = true;
    syncGeneratorMeasuringDevicesRef();
    triggerAutoSave();
    paintInspectionEditorUI();
}

function removeMeasuringDeviceRow(dIdx) {
    const fd = AppState.currentFormData;
    if (!fd || !Array.isArray(fd.measuringDevices)) return;
    fd.measuringDevices.splice(dIdx, 1);
    fd._devicesInitialized = true;
    syncGeneratorMeasuringDevicesRef();
    triggerAutoSave();
    paintInspectionEditorUI();
}

function updateMeasuringDeviceCell(dIdx, field, val) {
    if (window.MeasuringDevicesManager && typeof window.MeasuringDevicesManager.isCloudManaged === 'function' && window.MeasuringDevicesManager.isCloudManaged()) {
        return;
    }
    const fd = AppState.currentFormData;
    if (!fd || !Array.isArray(fd.measuringDevices) || !fd.measuringDevices[dIdx]) return;
    fd.measuringDevices[dIdx][field] = val;
    fd._devicesInitialized = true;
    syncGeneratorMeasuringDevicesRef();
    triggerAutoSave();
}

window.addManualMeasuringDeviceRow = addManualMeasuringDeviceRow;
window.removeMeasuringDeviceRow = removeMeasuringDeviceRow;
window.updateMeasuringDeviceCell = updateMeasuringDeviceCell;

function renderSharedMeasuringDevicesSection(title = 'Ölçüm Aletleri Bilgileri') {

    ensureMeasuringDevices();

    const fd = AppState.currentFormData;

    const devices = fd.measuringDevices;
    const mgr = window.MeasuringDevicesManager || null;
    const hasCatalogUi = Boolean(mgr);
    const isLockedManaged = Boolean(mgr && typeof mgr.isCloudManaged === 'function' && mgr.isCloudManaged());

    const cardsHtml = devices.length ? devices.map((dev, dIdx) => {
        const subLabel = [dev.brand, dev.model].filter(Boolean).join(' ').trim();
        const calStatus = (mgr && dev.validDate) ? mgr.getCalibrationStatus(dev.validDate) : null;
        const isTherm = Boolean(dev.isThermal || (String(dev.category || '').toLowerCase().includes('termal')) || (String(dev.name || '').toLowerCase().includes('termal')));

        return `
                    <div class="p-2.5 rounded-xl border ${isTherm ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200 bg-slate-50'} space-y-2">

                        <div class="flex items-center justify-between border-b border-slate-200/80 pb-1.5 gap-2 flex-wrap">

                            <div class="flex items-center gap-1.5 flex-wrap min-w-0">
                                <span class="font-bold text-slate-800">Cihaz #${dIdx + 1}</span>
                                ${dev.code ? `<span class="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 font-mono font-bold text-[10px]">${escapeHtml(dev.code)}</span>` : ''}
                                ${subLabel ? `<span class="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800 font-bold text-[10px] truncate max-w-[160px]">${escapeHtml(subLabel)}</span>` : ''}
                                ${calStatus && calStatus.status !== 'unknown' ? `<span class="px-1.5 py-0.5 rounded-full border font-bold text-[9px] ${calStatus.badgeClass}">${escapeHtml(calStatus.label)}</span>` : ''}
                            </div>

                            <div class="flex items-center gap-1.5 shrink-0">
                                ${hasCatalogUi ? `
                                    <button type="button" onclick="openReportSwapDeviceModal(${dIdx})"
                                        class="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition">
                                        <i class="fa-solid fa-right-left"></i>
                                        <span>Değiştir</span>
                                    </button>
                                ` : ''}
                                <button type="button" onclick="removeMeasuringDeviceRow(${dIdx})"
                                    class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 font-semibold text-[11px] flex items-center gap-1 transition">
                                    <i class="fa-solid fa-trash-can"></i> Sil
                                </button>
                            </div>

                        </div>

                        <div class="grid grid-cols-2 gap-2">

                            <div class="col-span-2">

                                <label class="block text-xs font-bold text-slate-700">Cihaz Adı</label>

                                <input type="text" value="${escapeHtml(dev.name || '')}" placeholder="" ${isLockedManaged ? 'readonly' : ''}

                                    oninput="updateMeasuringDeviceCell(${dIdx}, 'name', this.value)"

                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg ${isLockedManaged ? 'bg-slate-100 text-slate-700' : 'bg-white'} font-semibold">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700">Seri No</label>

                                <input type="text" value="${escapeHtml(dev.serial || '')}" placeholder="" ${isLockedManaged ? 'readonly' : ''}

                                    oninput="updateMeasuringDeviceCell(${dIdx}, 'serial', this.value)"

                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg ${isLockedManaged ? 'bg-slate-100 text-slate-700' : 'bg-white'}">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700">Sertifika No</label>

                                <input type="text" value="${escapeHtml(dev.certNo || '')}" placeholder="" ${isLockedManaged ? 'readonly' : ''}

                                    oninput="updateMeasuringDeviceCell(${dIdx}, 'certNo', this.value)"

                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg ${isLockedManaged ? 'bg-slate-100 text-slate-700' : 'bg-white'}">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700">Kalibrasyon Tarihi</label>

                                <input type="text" value="${escapeHtml(dev.calDate || '')}" placeholder="" ${isLockedManaged ? 'readonly' : ''}

                                    oninput="updateMeasuringDeviceCell(${dIdx}, 'calDate', this.value)"

                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg ${isLockedManaged ? 'bg-slate-100 text-slate-700' : 'bg-white'}">

                            </div>

                            <div>

                                <label class="block text-xs font-bold text-slate-700">Geçerlilik Tarihi</label>

                                <input type="text" value="${escapeHtml(dev.validDate || '')}" placeholder="" ${isLockedManaged ? 'readonly' : ''}

                                    oninput="updateMeasuringDeviceCell(${dIdx}, 'validDate', this.value)"

                                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg ${isLockedManaged ? 'bg-slate-100 text-slate-700' : 'bg-white'}">

                            </div>

                        </div>

                    </div>
        `;
    }).join('') : `
        <div class="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2.5">
            <div class="text-xs font-bold text-slate-700">Bu raporda henüz ölçüm cihazı tanımlı değil.</div>
            <div class="flex items-center justify-center gap-2 flex-wrap">
                ${hasCatalogUi ? `
                    <button type="button" onclick="syncSettingsDevicesToCurrentReportPrompt()"
                        class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-[11px] flex items-center gap-1">
                        <i class="fa-solid fa-arrows-rotate"></i>
                        <span>Üzerimdekileri Çek</span>
                    </button>
                    <button type="button" onclick="openReportAddDeviceModal()"
                        class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center gap-1">
                        <i class="fa-solid fa-list-check"></i>
                        <span>Havuzdan Cihaz Ekle</span>
                    </button>
                ` : ''}
                ${isLockedManaged ? '' : `
                    <button type="button" onclick="addManualMeasuringDeviceRow()"
                        class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1">
                        <i class="fa-solid fa-plus"></i>
                        <span>Boş Satır Ekle</span>
                    </button>
                `}
            </div>
        </div>
    `;

    return `

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">

            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between gap-2 flex-wrap">

                <span>${title} (${devices.length})</span>

                <div class="flex items-center gap-1.5 flex-wrap">
                    ${hasCatalogUi ? `
                        <button type="button" onclick="syncSettingsDevicesToCurrentReportPrompt()"
                            class="px-2 py-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition"
                            title="Ayarlardaki üzerinizdeki cihazları bu rapora çek">
                            <i class="fa-solid fa-arrows-rotate"></i>
                            <span>Üzerimdekileri Çek</span>
                        </button>
                        <button type="button" onclick="openReportAddDeviceModal()"
                            class="px-2 py-1 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition">
                            <i class="fa-solid fa-list-check"></i>
                            <span>${isLockedManaged ? 'Atanan Cihazlardan Ekle' : 'Havuzdan Ekle'}</span>
                        </button>
                    ` : ''}
                    ${isLockedManaged ? '' : `
                        <button type="button" onclick="addManualMeasuringDeviceRow()"

                            class="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs transition">

                            <i class="fa-solid fa-plus"></i>

                            <span>Manuel</span>

                        </button>
                    `}
                </div>

            </div>

            <div class="p-3 space-y-2.5 text-xs">

                ${cardsHtml}

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





// ============================================================================
// HIZLI RAPOR - 05-EDITOR-ELECTRICAL.JS
// Açıklama: Elektrik İç Tesisat (TKM-FR.318) Muayene Editörü ve Tabloları
// Satır Aralığı: 5947 - 6872 (926 satır)
// ============================================================================

const ELECTRICAL_22_LINK_RULES = [
    {
        guid: '930c427b-c0e1-442c-b4fa-6c8235486d57',
        shortLabel: 'Gerilim altındaki bölümlerin yalıtılması (iç kapak veya pleksi koruma)',
        visualGuids: ['d15eb74f-badd-49ea-ba95-ac4230cd5f7f'],
        defaultWhenEmpty: 'Var',
        defectText: 'Pano içerisinde gerilim altındaki aktif bölümlere doğrudan dokunmayı önleyen iç kapak veya pleksi koruma bulunmamaktadır (TS HD 60364-4-41).'
    },
    {
        guid: '619a1b60-0c36-4835-9bd6-00318b69832b',
        shortLabel: 'Mahfaza (IPXY, Pano kilidi, tehlike işareti vb.)',
        visualGuids: [
            'af7097ae-e0ff-4069-a64f-a524b6da87c9',
            'cd8491fb-f0f9-460c-b2e1-4498d74dafbd',
            'f5e4e4a7-f71f-4d8a-9aca-e67ae12ef9d2'
        ],
        defaultWhenEmpty: 'Var',
        defectText: 'Pano mahfazası (IP koruma, pano kilidi veya elektrik tehlike uyarı işareti) uygun değildir.'
    },
    {
        guid: '4bcb9475-e58b-4cf1-ad73-ea44fe01bc2d',
        shortLabel: 'Engel',
        visualGuids: ['36200b35-2f22-4b08-9bf8-27c5f36e1bb1'],
        defaultWhenEmpty: 'Var',
        defectText: 'Doğrudan dokunmaya karşı engel koruma önlemi uygun değildir.'
    },
    {
        guid: 'a45cd0bf-7881-465d-9e16-07346cf02e8e',
        shortLabel: 'El ulaşma uzaklığı dışına yerleştirme',
        visualGuids: [],
        defaultWhenEmpty: 'Yok',
        defectText: 'El ulaşma uzaklığı dışına yerleştirme koruma önlemi uygun değildir.'
    },
    {
        guid: 'f0692f94-58bf-4a0c-9770-c5bf0215db58',
        shortLabel: 'İlave koruma',
        visualGuids: [
            '160910e4-2bdc-4f6b-9ce9-b9fb85b0f877',
            '44c2419b-ccf2-4111-ba47-bc7bc178c9fa'
        ],
        defaultWhenEmpty: 'Var',
        defectText: 'Tamamlayıcı / ilave koruma (ek potansiyel dengeleme veya pano kapak koruma bağlantısı) uygun değildir.'
    },
    {
        guid: '4ccb36a2-cb3b-41eb-abff-04c9796f01c9',
        shortLabel: '30 mA RCD (5xI için 40 ms açma zamanı); devre kesicisi <32 A devreler için (TS HD 60364-4-41)',
        visualGuids: [],
        defaultWhenEmpty: 'Var',
        isRcdRule: true,
        defectText: '<32 A devreler için 30 mA RCD (Kaçak Akım Koruma Rölesi) koruması veya açma testi sonucu uygun değildir.'
    }
];

function getElectrical21Guids() {
    const questions = AppState.electricalTemplate?.areas?.[0]?.topics?.[0]?.questions || [];
    return questions.map(q => q.guid).filter(Boolean);
}

function getElectrical22Guids() {
    return ELECTRICAL_22_LINK_RULES.map(r => r.guid);
}

function ensureElectrical2201DetailsFromPrevious() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    const sec21Guids = getElectrical21Guids();
    if (!insp || !fd || String(insp.template_id) !== '2201' || !sec21Guids.length) return;
    if (!fd.answers || typeof fd.answers !== 'object') fd.answers = {};

    const hasAny21Answer = sec21Guids.some(guid => String(fd.answers[`q_${guid}`] ?? '').trim() !== '');
    if (hasAny21Answer) {
        fd._details21Initialized = true;
        return;
    }
    if (fd._details21Initialized) return;
    if (!insp.work_order_id) return;

    const allInsps = (window.OfflineDB && window.OfflineDB.state && Array.isArray(window.OfflineDB.state.inspections))
        ? window.OfflineDB.state.inspections
        : (Array.isArray(AppState.inspectionsCache) ? AppState.inspectionsCache : []);

    const candidates = allInsps.filter(item =>
        item &&
        String(item.work_order_id) === String(insp.work_order_id) &&
        String(item.id) !== String(insp.id) &&
        String(item.template_id) === '2201'
    );
    if (!candidates.length) return;

    const extractFd = (item) => {
        let sfd = null;
        try {
            const rawLocal = localStorage.getItem(`enlab_insp_${item.id}`);
            if (rawLocal) sfd = JSON.parse(rawLocal);
        } catch (e) {}
        if (!sfd && item.form_data && typeof item.form_data === 'object') sfd = item.form_data;
        if (!sfd && item.data_json) {
            try { sfd = typeof item.data_json === 'string' ? JSON.parse(item.data_json) : item.data_json; } catch (e) {}
        }
        return sfd;
    };

    const getScore = (item) => {
        const tsStr = item.local_updated_at || item.updated_at || '';
        const ts = tsStr ? Date.parse(tsStr) : NaN;
        if (!Number.isNaN(ts) && ts > 0) return ts;
        const n = Number(item.id);
        return Number.isFinite(n) ? n : 0;
    };

    const withData = [];
    candidates.forEach((item, idx) => {
        const sfd = extractFd(item);
        if (!sfd || !sfd.answers) return;
        const hasVal = sec21Guids.some(guid => String(sfd.answers[`q_${guid}`] ?? '').trim() !== '');
        if (hasVal) withData.push({ sfd, score: getScore(item), idx });
    });
    if (!withData.length) return;

    withData.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.idx - b.idx));
    const latestFd = withData[0].sfd;

    let copied = 0;
    sec21Guids.forEach(guid => {
        const val = latestFd.answers[`q_${guid}`];
        if (val !== undefined && String(val).trim() !== '') {
            fd.answers[`q_${guid}`] = val;
            copied++;
        }
    });
    if (copied > 0) {
        fd._details21Initialized = true;
        if (typeof triggerAutoSave === 'function') triggerAutoSave();
    }
}

function evaluateElectrical22RuleStatus(rule, fd) {
    const answers = fd?.answers || {};
    if (rule.isRcdRule) {
        const rows = fd?.tableRows?.topic_3_3 || [];
        let hasRcdFail = false;
        rows.forEach(r => {
            if (!r || typeof r !== 'object') return;
            const res = String(r['241bf571-43dd-46d1-836d-ecdff0c7acd2'] || '').trim();
            if (res !== 'Uygun Değil' && res !== 'X') return;
            const linyeName = String(r['405e297d-cea7-45ec-9c1e-6e2116cfb541'] || '').toLowerCase();
            const curve = String(r['7f4bdff7-97bd-47dd-8151-7eacc32f5d8e'] || '').toLowerCase();
            const iDeltaRaw = String(r['e42d31e0-dbc3-4e34-88c2-5e95f8e85636'] || '').replace(',', '.');
            const iDelta = parseFloat(iDeltaRaw);
            const inAmp = parseFloat(String(r['bd17d9ca-3087-4406-9f16-867d10642df6'] || '').replace(',', '.'));
            const isRcdOrSmallBreaker =
                (!Number.isNaN(iDelta) && iDelta <= 30) ||
                curve.includes('rccb') || curve.includes('rcd') || curve.includes('kakr') ||
                linyeName.includes('rcd') || linyeName.includes('kakr') ||
                (!Number.isNaN(inAmp) && inAmp > 0 && inAmp <= 32);
            if (isRcdOrSmallBreaker) hasRcdFail = true;
        });
        if (hasRcdFail) return 'Uygunsuz';
        return rule.defaultWhenEmpty;
    }

    if (!rule.visualGuids || !rule.visualGuids.length) {
        return rule.defaultWhenEmpty;
    }

    const vals = rule.visualGuids.map(g => String(answers[`q_${g}`] || '').trim());
    if (vals.some(v => v === 'Uygun Değil' || v === 'Kısmen Uygun')) {
        return 'Uygunsuz';
    }
    if (vals.some(v => v === 'Uygun')) {
        return 'Var';
    }
    if (vals.every(v => v === 'Uygulaması Yok') && vals.some(Boolean)) {
        return 'Yok';
    }
    return rule.defaultWhenEmpty;
}

function getElectrical22VisualDetailNotes(rule, fd) {
    const answers = fd?.answers || {};
    const sels = fd?.itemDefectSelections || {};
    const questionsMap = {};
    (AppState.electricalTemplate?.areas || []).forEach(a => {
        (a.topics || []).forEach(t => {
            (t.questions || []).forEach(q => {
                questionsMap[q.guid] = q.question;
            });
        });
    });

    const parts = [];
    (rule.visualGuids || []).forEach(vg => {
        const ans = String(answers[`q_${vg}`] || '').trim();
        if (ans === 'Uygun Değil' || ans === 'Kısmen Uygun') {
            const sel = sels[`q_${vg}`];
            const title = questionsMap[vg] || '';
            if (sel && sel.sentence) {
                parts.push(sel.sentence);
            } else if (title && window.STANDARD_DEFECT_NOTES && window.STANDARD_DEFECT_NOTES[title]) {
                parts.push(window.STANDARD_DEFECT_NOTES[title]);
            } else if (title) {
                parts.push(`${title} uygun değil`);
            }
        }
    });
    return parts.join(' ');
}

function getElectrical22DefectLines(fd) {
    if (!fd || !fd.answers) return [];
    const lines = [];
    ELECTRICAL_22_LINK_RULES.forEach(rule => {
        const val = String(fd.answers[`q_${rule.guid}`] || '').trim();
        if (val === 'Uygunsuz') {
            const linkedVisual = getElectrical22VisualDetailNotes(rule, fd);
            const detail = linkedVisual || rule.defectText;
            lines.push(`• [2.2 Tespit Edilen Bilgiler - ${rule.shortLabel}]: Uygunsuz (${detail})`);
        }
    });
    return lines;
}
window.getElectrical22DefectLines = getElectrical22DefectLines;

function syncElectrical2201Section22FromTriggers(triggeredGuid = null, allowDefectNoteSync = true) {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd || String(insp.template_id) !== '2201') return false;
    if (!fd.answers || typeof fd.answers !== 'object') fd.answers = {};
    const manualMap = fd._manual22Answers || {};
    let changed = false;

    const cleanTrigger = triggeredGuid ? String(triggeredGuid).replace(/^q_/, '') : null;

    ELECTRICAL_22_LINK_RULES.forEach(rule => {
        const qKey = `q_${rule.guid}`;
        const curVal = String(fd.answers[qKey] || '').trim();
        const isLinkedTrigger = !cleanTrigger || (rule.visualGuids && rule.visualGuids.includes(cleanTrigger)) || (cleanTrigger === 'topic_3_3' && rule.isRcdRule);
        if (!isLinkedTrigger) return;

        const nextVal = evaluateElectrical22RuleStatus(rule, fd);
        const shouldForceDefect = (nextVal === 'Uygunsuz');
        const wasTriggerUpdated = Boolean(cleanTrigger && ((rule.visualGuids && rule.visualGuids.includes(cleanTrigger)) || (cleanTrigger === 'topic_3_3' && rule.isRcdRule)));

        if (shouldForceDefect || !curVal || (wasTriggerUpdated && !manualMap[rule.guid])) {
            if (curVal !== nextVal) {
                fd.answers[qKey] = nextVal;
                changed = true;
            }
        } else if (wasTriggerUpdated && manualMap[rule.guid] && curVal === 'Uygunsuz' && nextVal === 'Var') {
            // Gözle kontrol düzeltildiyse kilidi çöz ve Var yap
            delete manualMap[rule.guid];
            fd.answers[qKey] = nextVal;
            changed = true;
        }
    });

    // DKD/SPD (6.3) -> 2.2 DKD/SPD kullanılmış mı senkronu
    const dkdVal = String(fd.answers['q_dc17ec9f-90bc-442a-a61b-729215d36fa0'] || '').trim();
    const sec22DkdKey = 'q_ddb49ead-c7b4-42b9-b449-0cc456ce6fbc';
    if (dkdVal && !manualMap['ddb49ead-c7b4-42b9-b449-0cc456ce6fbc']) {
        const targetDkd = dkdVal === 'Mevcut Değil' ? 'Hayır' : 'Evet';
        if (fd.answers[sec22DkdKey] !== targetDkd) {
            fd.answers[sec22DkdKey] = targetDkd;
            changed = true;
        }
    }

    if (allowDefectNoteSync && typeof syncAllDefectsToDefectNotes === 'function') {
        syncAllDefectsToDefectNotes();
    }
    return changed;
}
window.syncElectrical2201Section22FromTriggers = syncElectrical2201Section22FromTriggers;

function ensureElectrical2201Section22Defaults() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd || String(insp.template_id) !== '2201') return;
    const changed = syncElectrical2201Section22FromTriggers(null, false);
    if (changed && typeof triggerAutoSave === 'function') {
        triggerAutoSave();
    }
}

const ELEC_61_GUIDS = {
    ZX: 'c1229a3e-6354-4c60-a437-3f1b53e90729',
    ZLN: 'a07f1984-6eb3-48fe-ad63-5b3383d2fe7b',
    IK3: 'fb491c19-e0ac-49f2-8144-b4719ad1fce5',
    DKD_TIP: 'dc17ec9f-90bc-442a-a61b-729215d36fa0',
    V_FF: '38645b9b-e756-4d53-8b3a-e32012f2ba24',
    V_LN: 'bfe4eebe-fd77-47fa-a152-df2a70f2c73f',
    V_NPE: 'd4512880-a16c-4f08-ad98-f71be809ba6f',
    DKD_KA: '675db3c1-9c92-49c2-b54a-3a7fb2b27959'
};

const ELECTRICAL_61_X_DEFECTS = [
    {
        guid: ELEC_61_GUIDS.ZX,
        line: '• [6.1 Zx Ölçümü]: Panodan ölçülen faz-toprak çevrim empedansı (Zx) ölçümü uygun değildir / değer alınamamıştır (X). Topraklama ve koruma sürekliliği kontrol edilmelidir.'
    },
    {
        guid: ELEC_61_GUIDS.ZLN,
        line: '• [6.1 ZLN Ölçümü]: Panodan ölçülen faz-nötr çevrim empedansı (ZLN) ölçümü uygun değildir / değer alınamamıştır (X). Bağlantı ve nötr hattı kontrol edilmelidir.'
    },
    {
        guid: ELEC_61_GUIDS.IK3,
        line: '• [6.1 Kısa Devre Akımı]: Hesaplanan 3 fazlı kısa devre akımı ölçümü/değeri uygun değildir (X).'
    },
    {
        guid: ELEC_61_GUIDS.V_FF,
        line: '• [6.1 Faz-Faz Gerilim (F-F)]: Faz-Faz şebeke gerilimi ölçümü uygun değildir / enerji tespit edilememiştir (X).'
    },
    {
        guid: ELEC_61_GUIDS.V_LN,
        line: '• [6.1 Faz-Nötr Gerilim (L-N)]: Faz-Nötr gerilim ölçümü uygun değildir / nötr hattı kontrol edilmelidir (X).'
    },
    {
        guid: ELEC_61_GUIDS.V_NPE,
        line: '• [6.1 Nötr-Toprak Gerilim (N-PE)]: Nötr-Toprak (N-PE) gerilimi sınır değer dışında veya uygun değildir (X). Toprak-nötr arası gerilimin 1,5 V\'dan düşük olması gerekmektedir.'
    },
    {
        guid: ELEC_61_GUIDS.DKD_KA,
        line: '• [6.1 DKD Dayanma Akımı]: Aşırı gerilim koruma cihazı (DKD) dayanma akımı ölçümü/değeri uygun değildir (X).'
    }
];

const TOPIC_3_3_MEASURED_COLS = {
    'bd17d9ca-3087-4406-9f16-867d10642df6': 'Nominal Akım In',
    'ee0ef618-52cb-4dd9-9361-15200dcee077': 'Kesme Kapasitesi Icu',
    '8e43f81a-34b3-4c8e-9baf-e4161f5ba11e': 'Faz Kesiti',
    '07697e7d-212a-4c84-be0e-fd64e539b5b0': 'N/PEN Kesiti',
    'e16540f3-b6b7-486a-8f40-2722add48bb7': 'PE Koruma Kesiti',
    '16c7e5ea-b08e-4d33-b9f1-49c4ae6c1437': 'İşletme Akımı Ib',
    'd3bb692d-56ca-4b1b-b609-81198be785b0': 'İletken Akımı Iz',
    'e42d31e0-dbc3-4e34-88c2-5e95f8e85636': 'RCD IΔ (mA)',
    '016eca98-d8f9-4a4d-bdfd-36160d324726': 'RCD Açma Süresi TΔ (ms)'
};
const TOPIC_3_3_NAME_GUID = '405e297d-cea7-45ec-9c1e-6e2116cfb541';
const TOPIC_3_3_RES_GUID = '241bf571-43dd-46d1-836d-ecdff0c7acd2';
const TOPIC_3_4_MEASURED_COLS = {
    '7a977dd5-098c-4a56-a047-f1fe69cc7ed2': 'Potansiyel Dengeleme Kesiti',
    '0cee7c0e-d915-4069-825a-b0984512cd08': 'Potansiyel Dengeleme Süreklilik',
    '4980b506-7bc6-423e-898e-6f89536754f3': 'Tamamlayıcı PD Kesiti',
    'b4af8cc0-2dad-4768-8fc3-5393757675af': 'Tamamlayıcı PD Süreklilik'
};
const TOPIC_3_4_NAME_GUID = '2f743a60-497c-41bc-84aa-a499220310a3';
const TOPIC_3_4_RES_GUID = 'b21fd22e-6cd7-431c-8949-b67fdc46613c';
const TOPIC_3_5_MEASURED_COLS = {
    '8b095f55-b0a3-41c4-b8d9-6a4f4b7c9026': 'Eni',
    '0f614ecc-406f-46b3-8d63-a759c3e119e7': 'Boyu',
    '33143091-c517-439e-b79d-6bde5d06143f': 'Zemin İzolasyon Direnci'
};
const TOPIC_3_5_NAME_GUID = 'd0096971-113c-4f4c-ac4e-31ba59227c0b';
const TOPIC_3_5_RES_GUID = '1114914a-a154-4859-93f9-19b22fddc098';

function isElectricalMarkedX(val) {
    return String(val ?? '').trim().toLowerCase() === 'x';
}

function parseElectricalNumber(raw) {
    const clean = String(raw ?? '').trim().replace(',', '.');
    if (!clean) return NaN;
    const num = Number(clean);
    return Number.isFinite(num) ? num : NaN;
}

function randomElectricalVoltageFF(excludeCurrentVal) {
    const pool = [393, 394, 395, 396, 397];
    const curInt = parseInt(String(excludeCurrentVal ?? '').trim(), 10);
    const filtered = pool.length > 1 && pool.includes(curInt) ? pool.filter(v => v !== curInt) : pool;
    return filtered[Math.floor(Math.random() * filtered.length)];
}

function computeElectricalLNFromFF(ffRaw) {
    if (isElectricalMarkedX(ffRaw)) return null;
    const ff = parseElectricalNumber(ffRaw);
    if (!Number.isFinite(ff) || ff <= 0) return null;
    return String(Math.round(ff / Math.sqrt(3)));
}

function computeElectricalShortCircuitIk3(zlnRaw, vlnRaw, vffRaw) {
    if (isElectricalMarkedX(zlnRaw)) return null;
    const zln = parseElectricalNumber(zlnRaw);
    if (!Number.isFinite(zln) || zln <= 0) return null;
    const zEff = zln >= 0.07 ? Math.max(0.001, zln - 0.05) : zln;
    let uln = (!isElectricalMarkedX(vlnRaw)) ? parseElectricalNumber(vlnRaw) : NaN;
    if (!Number.isFinite(uln) || uln <= 0) {
        const ff = (!isElectricalMarkedX(vffRaw)) ? parseElectricalNumber(vffRaw) : NaN;
        uln = (Number.isFinite(ff) && ff > 0) ? (ff / Math.sqrt(3)) : 230;
    }
    const ik3 = uln / (zEff * 1000);
    if (!Number.isFinite(ik3) || ik3 <= 0) return null;
    return String(parseFloat(ik3.toFixed(2))).replace('.', ',');
}

function updateElectricalQuestionDom(qKey, val) {
    if (typeof document === 'undefined') return;
    const input = document.querySelector(`[data-qkey="${qKey}"]`);
    if (input && input.value !== val) {
        input.value = val;
    }
}

function syncElectrical61AutoCalculations(fd, triggerGuid = null) {
    if (!fd || !fd.answers) return;
    const ffKey = `q_${ELEC_61_GUIDS.V_FF}`;
    const lnKey = `q_${ELEC_61_GUIDS.V_LN}`;
    const zlnKey = `q_${ELEC_61_GUIDS.ZLN}`;
    const ik3Key = `q_${ELEC_61_GUIDS.IK3}`;

    if (triggerGuid === ELEC_61_GUIDS.V_FF) {
        fd._voltage61Initialized = true;
        const lnComputed = computeElectricalLNFromFF(fd.answers[ffKey]);
        if (lnComputed !== null) {
            fd.answers[lnKey] = lnComputed;
            updateElectricalQuestionDom(lnKey, lnComputed);
        }
    }

    if (!triggerGuid || triggerGuid === ELEC_61_GUIDS.V_FF || triggerGuid === ELEC_61_GUIDS.V_LN || triggerGuid === ELEC_61_GUIDS.ZLN) {
        const curIk3 = String(fd.answers[ik3Key] ?? '').trim();
        if (!isElectricalMarkedX(curIk3)) {
            const ik3Computed = computeElectricalShortCircuitIk3(fd.answers[zlnKey], fd.answers[lnKey], fd.answers[ffKey]);
            if (ik3Computed !== null) {
                fd.answers[ik3Key] = ik3Computed;
                updateElectricalQuestionDom(ik3Key, ik3Computed);
            }
        }
    }
}

function randomizeElectrical61Voltage() {
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.answers || typeof fd.answers !== 'object') fd.answers = {};
    const ffKey = `q_${ELEC_61_GUIDS.V_FF}`;
    const nextFF = String(randomElectricalVoltageFF(fd.answers[ffKey]));
    fd.answers[ffKey] = nextFF;
    fd._voltage61Initialized = true;
    updateElectricalQuestionDom(ffKey, nextFF);
    syncElectrical61AutoCalculations(fd, ELEC_61_GUIDS.V_FF);
    if (typeof syncAllDefectsToDefectNotes === 'function') {
        syncAllDefectsToDefectNotes();
    }
    if (typeof triggerAutoSave === 'function') {
        triggerAutoSave();
    }
}
window.randomizeElectrical61Voltage = randomizeElectrical61Voltage;

function ensureElectrical2201VisualChecksDefaults() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    const area2 = AppState.electricalTemplate?.areas?.[2];
    if (!insp || !fd || String(insp.template_id) !== '2201' || !area2) return;
    if (!fd.answers || typeof fd.answers !== 'object') fd.answers = {};
    if (fd._visualDefaultsInitialized) return;

    let filled = 0;
    (area2.topics || []).forEach(topic => {
        (topic.questions || []).forEach(q => {
            if (q.type === 'YesNo') {
                const qKey = `q_${q.guid}`;
                if (fd.answers[qKey] === undefined || String(fd.answers[qKey]).trim() === '') {
                    fd.answers[qKey] = 'Uygun';
                    filled++;
                }
            }
        });
    });
    fd._visualDefaultsInitialized = true;
    if (filled > 0 && typeof triggerAutoSave === 'function') {
        triggerAutoSave();
    }
}

function ensureElectrical2201Section61Defaults() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd || String(insp.template_id) !== '2201') return;
    if (!fd.answers || typeof fd.answers !== 'object') fd.answers = {};

    const ffKey = `q_${ELEC_61_GUIDS.V_FF}`;
    const lnKey = `q_${ELEC_61_GUIDS.V_LN}`;
    let changed = false;

    if (!fd._voltage61Initialized && !String(fd.answers[ffKey] || '').trim()) {
        fd.answers[ffKey] = String(randomElectricalVoltageFF());
        fd._voltage61Initialized = true;
        changed = true;
    } else if (String(fd.answers[ffKey] || '').trim()) {
        fd._voltage61Initialized = true;
    }

    if (!String(fd.answers[lnKey] || '').trim() && !isElectricalMarkedX(fd.answers[ffKey])) {
        const lnComputed = computeElectricalLNFromFF(fd.answers[ffKey]);
        if (lnComputed !== null) {
            fd.answers[lnKey] = lnComputed;
            changed = true;
        }
    }

    const zlnVal = fd.answers[`q_${ELEC_61_GUIDS.ZLN}`];
    const ik3Key = `q_${ELEC_61_GUIDS.IK3}`;
    if (!String(fd.answers[ik3Key] || '').trim() && zlnVal && !isElectricalMarkedX(zlnVal)) {
        const ik3Computed = computeElectricalShortCircuitIk3(zlnVal, fd.answers[lnKey], fd.answers[ffKey]);
        if (ik3Computed !== null) {
            fd.answers[ik3Key] = ik3Computed;
            changed = true;
        }
    }

    if (changed && typeof triggerAutoSave === 'function') {
        triggerAutoSave();
    }
}

function getElectrical61DefectLines(fd) {
    if (!fd) return [];
    const lines = [];
    const answers = fd.answers || {};

    ELECTRICAL_61_X_DEFECTS.forEach(item => {
        if (isElectricalMarkedX(answers[`q_${item.guid}`])) {
            lines.push(item.line);
        }
    });

    const tr = fd.tableRows || {};

    (tr.topic_3_3 || []).forEach((r, idx) => {
        if (!r || typeof r !== 'object') return;
        const rowLabel = String(r[TOPIC_3_3_NAME_GUID] || '').trim() || `Linye #${idx + 1}`;
        const xCols = [];
        Object.keys(TOPIC_3_3_MEASURED_COLS).forEach(colGuid => {
            if (isElectricalMarkedX(r[colGuid])) {
                xCols.push(TOPIC_3_3_MEASURED_COLS[colGuid]);
            }
        });
        const resVal = String(r[TOPIC_3_3_RES_GUID] || '').trim();
        if (xCols.length > 0) {
            lines.push(`• [6.1 Linye - ${rowLabel}]: ${xCols.join(', ')} ölçüm değeri uygun değildir / açma yapmamıştır (X).`);
        } else if (resVal === 'Uygun Değil' || resVal === 'X') {
            lines.push(`• [6.1 Linye - ${rowLabel}]: Linye koruma/ölçüm kontrolü uygun değildir (X).`);
        }
    });

    (tr.topic_3_4 || []).forEach((r, idx) => {
        if (!r || typeof r !== 'object') return;
        const rowLabel = String(r[TOPIC_3_4_NAME_GUID] || '').trim() || `Bölüm #${idx + 1}`;
        const xCols = [];
        Object.keys(TOPIC_3_4_MEASURED_COLS).forEach(colGuid => {
            if (isElectricalMarkedX(r[colGuid])) {
                xCols.push(TOPIC_3_4_MEASURED_COLS[colGuid]);
            }
        });
        const resVal = String(r[TOPIC_3_4_RES_GUID] || '').trim();
        if (xCols.length > 0) {
            lines.push(`• [6.2 Potansiyel Dengeleme - ${rowLabel}]: ${xCols.join(', ')} ölçümü uygun değildir (X).`);
        } else if (resVal === 'Uygun Değil' || resVal === 'X') {
            lines.push(`• [6.2 Potansiyel Dengeleme - ${rowLabel}]: Potansiyel dengeleme iletkeni kontrolü uygun değildir (X).`);
        }
    });

    (tr.topic_3_5 || []).forEach((r, idx) => {
        if (!r || typeof r !== 'object') return;
        const rowLabel = String(r[TOPIC_3_5_NAME_GUID] || '').trim() || `Zemin #${idx + 1}`;
        const xCols = [];
        Object.keys(TOPIC_3_5_MEASURED_COLS).forEach(colGuid => {
            if (isElectricalMarkedX(r[colGuid])) {
                xCols.push(TOPIC_3_5_MEASURED_COLS[colGuid]);
            }
        });
        const resVal = String(r[TOPIC_3_5_RES_GUID] || '').trim();
        if (xCols.length > 0 || resVal === 'Uygun Değil' || resVal === 'X') {
            lines.push(`• [6.3 Zemin İzolasyonu - ${rowLabel}]: Zemin izolasyonunun olmadığı veya yalıtım direncinin (< 50 kΩ) uygun olmadığı tespit edilmiştir.`);
        }
    });

    return lines;
}
window.getElectrical61DefectLines = getElectrical61DefectLines;

function onElectrical2201AnswerUpdated(qKey, value, isDirectInput = false) {
    const fd = AppState.currentFormData;
    if (!fd) return;
    const cleanGuid = String(qKey || '').replace(/^q_/, '');

    if (getElectrical21Guids().includes(cleanGuid)) {
        fd._details21Initialized = true;
        return;
    }

    if (getElectrical22Guids().includes(cleanGuid) || cleanGuid === 'ddb49ead-c7b4-42b9-b449-0cc456ce6fbc') {
        if (!fd._manual22Answers || typeof fd._manual22Answers !== 'object') fd._manual22Answers = {};
        if (String(value || '').trim()) {
            fd._manual22Answers[cleanGuid] = true;
        } else {
            delete fd._manual22Answers[cleanGuid];
        }
        if (value === 'Uygunsuz') {
            fd.overallResult = 'UYGUN DEĞİL';
            if (AppState.currentInspection) AppState.currentInspection.result_status = 'UYGUN DEĞİL';
        }
        if (typeof syncAllDefectsToDefectNotes === 'function') {
            syncAllDefectsToDefectNotes();
        }
        return;
    }

    if (cleanGuid === ELEC_61_GUIDS.V_FF || cleanGuid === ELEC_61_GUIDS.V_LN || cleanGuid === ELEC_61_GUIDS.ZLN || cleanGuid === ELEC_61_GUIDS.IK3) {
        syncElectrical61AutoCalculations(fd, cleanGuid);
    }

    if (ELECTRICAL_61_X_DEFECTS.some(d => d.guid === cleanGuid)) {
        if (typeof document !== 'undefined') {
            const el = document.querySelector(`[data-qkey="${qKey}"]`);
            if (el) {
                if (isElectricalMarkedX(value)) {
                    el.classList.add('border-rose-400', 'bg-rose-50/50', 'text-rose-700', 'font-bold');
                } else {
                    el.classList.remove('border-rose-400', 'bg-rose-50/50', 'text-rose-700', 'font-bold');
                }
            }
        }
        if (typeof syncAllDefectsToDefectNotes === 'function') {
            syncAllDefectsToDefectNotes();
        }
    }

    if (!isDirectInput) {
        syncElectrical2201Section22FromTriggers(cleanGuid, true);
    }
}
window.onElectrical2201AnswerUpdated = onElectrical2201AnswerUpdated;

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

    ensureElectrical2201DetailsFromPrevious();

    ensureElectrical2201VisualChecksDefaults();

    ensureElectrical2201Section61Defaults();

    ensureElectrical2201Section22Defaults();



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

                                    <span class="font-medium text-slate-800 text-[11px] leading-snug block">${selectedDefect || 'Uygunsuzluk cümlesi seçilmedi'}</span>

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

                                <span class="font-medium text-slate-800 text-[11px] leading-snug block">${selectedDefect || 'Uygunsuzluk cümlesi seçilmedi'}</span>

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

        const hasValInOpts = !val || q.options.includes(val);
        const optsList = hasValInOpts ? q.options : [...q.options, val];
        const opts = optsList.map(o => `<option value="${escapeHtml(o)}" ${val === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');

        const is22Defect = (areaIdx === 0 && topicIdx === 1 && val === 'Uygunsuz');
        const cardCls = is22Defect
            ? 'border-rose-400 bg-rose-50/70'
            : (areaIdx === 0 && topicIdx === 1 && (val === 'Var' || val === 'Uygun' || val === 'Evet'))
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-200 bg-slate-50/40';
        const selCls = is22Defect
            ? 'border-rose-400 bg-white text-rose-700 font-bold'
            : 'border-slate-300 bg-white text-slate-900 font-semibold';

        return `

            <div class="p-2.5 rounded-lg border ${cardCls} flex flex-col justify-between transition-colors">

                <label class="block text-[11px] font-bold text-slate-700 mb-1 leading-snug">${qTitle}</label>

                <select onchange="handleAnswerChange('${qKey}', this.value, '${qTitle.replace(/'/g, "\\'")}')"

                    class="w-full border rounded-lg px-2.5 py-1.5 text-xs ${selCls}">

                    <option value="">Seçiniz...</option>

                    ${opts}

                </select>

            </div>

        `;

    }



    const isVFF = q.guid === ELEC_61_GUIDS.V_FF;
    const is61XField = ELECTRICAL_61_X_DEFECTS.some(d => d.guid === q.guid);
    const isMarkedX = is61XField && isElectricalMarkedX(val);
    const xInputCls = isMarkedX ? 'border-rose-400 bg-rose-50/50 text-rose-700 font-bold' : 'border-slate-300 bg-white font-medium';

    return `

        <div class="p-2.5 rounded-lg border ${isMarkedX ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-slate-50/40'} flex flex-col justify-between">

            <div class="flex items-center justify-between gap-2 mb-1">
                <label class="block text-[11px] font-bold text-slate-700 leading-snug">${qTitle}</label>
                ${isVFF ? `<button type="button" onclick="randomizeElectrical61Voltage()" class="px-2 py-0.5 rounded-md bg-sky-100 hover:bg-sky-200 active:scale-95 text-sky-800 text-[10px] font-bold shrink-0 transition" title="393-397 V arası rastgele seç">🎲 393-397</button>` : ''}
            </div>

            <input type="text" data-qkey="${qKey}" value="${String(val || '').replace(/"/g, '&quot;')}"

                oninput="handleAnswerInput('${qKey}', this.value)"

                placeholder=""

                class="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:border-sky-500 focus:outline-none ${xInputCls}">

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

                const isNoGood = cellVal === 'Uygun Değil' || cellVal === 'X';

                return `

                    <div class="${isSection65 ? 'col-span-full sm:col-span-1' : ''}">

                        <label class="block text-[11px] font-bold text-slate-700 mb-1 leading-snug break-words">${labelText}</label>

                        <select data-table-cell="${tKey}_${rIdx}_${q.guid}" onchange="handleTopicTableCell('${tKey}', ${rIdx}, '${q.guid}', this.value)"

                            class="w-full border rounded-lg px-2.5 py-2 text-xs font-bold shadow-2xs ${isNoGood ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-900'}">

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
            const isXTableCell = (tKey === 'topic_3_3' || tKey === 'topic_3_4' || tKey === 'topic_3_5') && isElectricalMarkedX(cellVal);
            const cellCls = isLockedThermal
                ? 'border-slate-300 bg-slate-100 text-slate-700 font-medium'
                : isXTableCell
                    ? 'border-rose-400 bg-rose-50/60 text-rose-700 font-bold'
                    : 'border-slate-300 bg-white font-medium';

            return `

                <div class="${spanClass}">

                    <label class="block text-[11px] font-bold text-slate-700 mb-1 leading-snug break-words">${labelText}</label>

                    <input type="text" data-table-cell="${tKey}_${rIdx}_${q.guid}" value="${String(cellVal).replace(/"/g, '&quot;')}" ${isLockedThermal ? 'readonly' : ''}

                        oninput="handleTopicTableCell('${tKey}', ${rIdx}, '${q.guid}', this.value)"

                        class="w-full border rounded-lg px-2.5 py-1.5 text-xs ${cellCls} focus:border-sky-500 focus:outline-none shadow-2xs">

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

    const is2201 = String(AppState.currentInspection?.template_id) === '2201';
    if (is2201 && (tKey === 'topic_3_3' || tKey === 'topic_3_4' || tKey === 'topic_3_5')) {
        if (typeof document !== 'undefined') {
            const cellEl = document.querySelector(`[data-table-cell="${tKey}_${rowIndex}_${qGuid}"]`);
            if (cellEl && cellEl.tagName === 'INPUT') {
                if (isElectricalMarkedX(value)) {
                    cellEl.classList.add('border-rose-400', 'bg-rose-50/60', 'text-rose-700', 'font-bold');
                } else {
                    cellEl.classList.remove('border-rose-400', 'bg-rose-50/60', 'text-rose-700', 'font-bold');
                }
            }
        }

        const measuredCols = tKey === 'topic_3_3'
            ? TOPIC_3_3_MEASURED_COLS
            : tKey === 'topic_3_4'
                ? TOPIC_3_4_MEASURED_COLS
                : TOPIC_3_5_MEASURED_COLS;
        const resGuid = tKey === 'topic_3_3'
            ? TOPIC_3_3_RES_GUID
            : tKey === 'topic_3_4'
                ? TOPIC_3_4_RES_GUID
                : TOPIC_3_5_RES_GUID;

        if (measuredCols[qGuid] && isElectricalMarkedX(value)) {
            rows[rowIndex][resGuid] = 'Uygun Değil';
            if (typeof document !== 'undefined') {
                const resEl = document.querySelector(`[data-table-cell="${tKey}_${rowIndex}_${resGuid}"]`);
                if (resEl) {
                    resEl.value = 'Uygun Değil';
                    resEl.classList.add('border-rose-400', 'bg-rose-50', 'text-rose-700');
                    resEl.classList.remove('border-slate-300', 'bg-white', 'text-slate-900');
                }
            }
        } else if (qGuid === resGuid && typeof document !== 'undefined') {
            const resEl = document.querySelector(`[data-table-cell="${tKey}_${rowIndex}_${resGuid}"]`);
            if (resEl) {
                if (value === 'Uygun Değil' || value === 'X') {
                    resEl.classList.add('border-rose-400', 'bg-rose-50', 'text-rose-700');
                    resEl.classList.remove('border-slate-300', 'bg-white', 'text-slate-900');
                } else {
                    resEl.classList.remove('border-rose-400', 'bg-rose-50', 'text-rose-700');
                    resEl.classList.add('border-slate-300', 'bg-white', 'text-slate-900');
                }
            }
        }

        if (tKey === 'topic_3_3' && typeof window.syncElectrical2201Section22FromTriggers === 'function') {
            window.syncElectrical2201Section22FromTriggers('topic_3_3', true);
        } else if (typeof syncAllDefectsToDefectNotes === 'function') {
            syncAllDefectsToDefectNotes();
        }
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

                                <span class="font-medium text-slate-800 text-[11px] leading-snug block">${selectedDefect || 'Uygunsuzluk cümlesi seçilmedi'}</span>

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

            Uygun madde bulunamadı.

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

                <span class="font-black text-xs text-slate-800 uppercase tracking-wide">7-10. KUSUR, NOT VE SONUÇ</span>

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

                        <label class="block font-bold text-slate-800">7. KUSUR AÇIKLAMALARI / UYGUNSUZLUKLAR</label>



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

                    placeholder="Uygunsuzluk açıklamaları..."

                    class="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 leading-relaxed focus:border-sky-500 focus:outline-none font-medium">${fd.defectNotes || ''}</textarea>

            </div>



            <div>

                <label class="block font-bold text-slate-800 mb-1">9. NOTLAR (Proje Bilgileri & Saha Notları)</label>

                <textarea rows="2"

                    oninput="AppState.currentFormData.generalNotes=this.value; triggerAutoSave();"

                    placeholder="Proje sorumlusu veya saha notları..."

                    class="w-full border border-slate-300 rounded-xl p-2.5 text-slate-700 focus:border-sky-500 focus:outline-none">${fd.generalNotes || ''}</textarea>

            </div>



            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">

                <div>

                    <label class="block font-bold text-slate-800 mb-1">10. SONUÇ VE KANAAT</label>

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

                    <input type="date" id="editorReportDateInput" value="${escapeHtml((typeof toIsoDate === 'function' ? toIsoDate(AppState.currentInspection?.inspection_date || AppState.currentFormData?.companyInfo?.reportDate) : '') || '')}"

                        onchange="if(typeof updateReportDateManual === 'function') updateReportDateManual(this.value);"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-2 bg-white">

                </div>

                <div>

                    <label class="block font-bold text-slate-800 mb-1">Sonraki Kontrol Tarihi</label>

                    <input type="date" id="editorNextControlDateInput" value="${escapeHtml((typeof toIsoDate === 'function' ? toIsoDate(fd.nextInspectionDate || AppState.currentFormData?.companyInfo?.nextControlDate) : '') || '')}"

                        onchange="if(typeof updateReportNextDateManual === 'function') updateReportNextDateManual(this.value);"

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-2 bg-white">

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

        if (typeof window.getElectrical22DefectLines === 'function') {

            window.getElectrical22DefectLines(fd).forEach(l => {

                if (!detectedDefects.includes(l)) detectedDefects.push(l);

            });

        }

        const has61Helper = typeof window.getElectrical61DefectLines === 'function';
        if (has61Helper) {
            window.getElectrical61DefectLines(fd).forEach(l => {
                if (!detectedDefects.includes(l)) detectedDefects.push(l);
            });
        }

        Object.keys(fd.tableRows || {}).forEach(tKey => {

            if (has61Helper && (tKey === 'topic_3_3' || tKey === 'topic_3_4' || tKey === 'topic_3_5')) return;

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

        <div class="px-3 py-1.5 bg-slate-900 text-white font-bold text-[10px] flex items-center border-b border-slate-800 sticky top-0 z-10 select-none">

            <span class="flex items-center gap-1.5">

                <i class="fa-solid fa-bolt text-amber-400"></i>

                <span>Pano &amp; Linye Listesi</span>

            </span>

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

                Öneri bulunamadı.

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





// ============================================================================
// HIZLI RAPOR - 10A-PDF-CORE.JS
// Açıklama: PDF Önizleme/Panzoom, Ortak Antet/Altbilgi, Sayfalama ve E-Posta Motoru
// ============================================================================

function formatSymbolForPrint(val) {

    if (val === 'Uygun' || val === '✓') return '✓';

    if (val === 'Uygun Değil' || val === 'X') return 'X';

    if (val === 'Uygulaması Yok' || val === 'N') return 'N';

    if (val === 'Görülemedi' || val === 'G') return 'G';

    return val ?? '';

}

function formatSymbolBadge(sym) {
    if (!sym) return '';
    let cls = 'tkm-badge-default';
    if (sym === '✓') cls = 'tkm-badge-ok';
    else if (sym === 'X' || sym === '✕') cls = 'tkm-badge-bad';
    else if (sym === 'N' || sym === 'G') cls = 'tkm-badge-neutral';
    return `<span class="tkm-sym-badge ${cls}">${sym}</span>`;
}




function buildTkmPageHeader(reportMainTitle) {
    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;
    const logoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getLogoSrc() : 'assets/tekkomer_logo.png';
    const showTurkak = branding.showTurkakLogo !== false;
    const turkakLogoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getTurkakLogoSrc() : 'assets/turkak_logo.jpg';
    const accNo = branding.accreditationNo || 'AB-0227-M';
    const safeCompanyFullName = String(branding.companyFullName || 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.').replace(/KOMTROL/gi, 'KONTROL');

    return `
        <div class="tkm-header">
            <div style="display:flex;justify-content:center;align-items:center;padding-left:2px;overflow:visible;">
                <img src="${logoSrc}" alt="TEKKOMER Logo" style="width:78px;height:70px;object-fit:contain;object-position:center;display:block;">
            </div>
            <div style="text-align:center;padding:0 6px;">
                <div style="font-size:11.2pt;font-weight:700;color:#222222;letter-spacing:0.2px;margin-bottom:1px;line-height:1.15;">
                    ${escapeHtml(safeCompanyFullName)}
                </div>
                <div style="font-size:7.6pt;color:#222222;line-height:1.2;">
                    T: +90 (216) 526 61 41 &nbsp;&nbsp; F: +90 (216) 526 61 40
                </div>
                <div style="font-size:7.6pt;color:#222222;line-height:1.2;margin-bottom:2px;">
                    info@tkmkontrol.com &nbsp;&nbsp; www.tkmkontrol.com
                </div>
                <div class="tkm-header-title" style="font-size:10.5pt;font-weight:700;color:#222222;line-height:1.12;text-transform:uppercase;">
                    ${reportMainTitle}
                </div>
                <div class="tkm-header-acc" style="font-size:9pt;font-weight:400;color:#333333;margin-top:1px;letter-spacing:0.3px;">
                    PERİYODİK KONTROL RAPORU
                </div>
            </div>
            <div style="display:flex;justify-content:center;align-items:center;">
                ${showTurkak ? `<img src="${turkakLogoSrc}" alt="Akreditasyon ${escapeHtml(accNo)}" style="width:68px;height:84px;object-fit:contain;display:block;">` : `<div style="width:68px;"></div>`}
            </div>
        </div>
    `;
}



function buildTkmPageFooter(formCode, reportNo, pageNum, totalPages) {

    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;
    const safeCompanyFullName = String(branding.companyFullName || 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.').replace(/KOMTROL/gi, 'KONTROL');

    const disclaimer = ((branding.footerDisclaimer || DEFAULT_COMPANY_BRANDING.footerDisclaimer))
        .replace(/\{COMPANY_NAME\}/g, safeCompanyFullName)
        .replace(/KOMTROL/gi, 'KONTROL');

    const isRams = (typeof isRamsTheme === 'function') && isRamsTheme(getPdfTheme());

    if (isRams) {
        const baseFormCode = String(formCode || 'FR.01').split(',')[0].trim() || 'FR.01';
        const docCode = (baseFormCode.includes('318') || baseFormCode.includes('ZPKR02'))
            ? 'ZPKR02'
            : baseFormCode;

        return `

        <div class="tkm-footer">

            <div class="tkm-footer-disclaimer">

                ${escapeHtml(disclaimer)}

            </div>

            <div class="tkm-footer-meta">

                <table class="tkm-footer-doc-table">
                    <tbody>
                        <tr>
                            <td class="tkm-fdoc-lbl">Doküman Kodu</td>
                            <td class="tkm-fdoc-val">${escapeHtml(docCode)}</td>
                            <td class="tkm-fdoc-lbl">Yayım Tarihi</td>
                            <td class="tkm-fdoc-val">18.07.2025</td>
                            <td class="tkm-fdoc-lbl">Revizyon No / Tarihi</td>
                            <td class="tkm-fdoc-val">- / -</td>
                            <td class="tkm-fdoc-lbl">Yürürlük Tarihi</td>
                            <td class="tkm-fdoc-val">01.09.2025</td>
                            <td class="tkm-fdoc-lbl">Rapor No</td>
                            <td class="tkm-fdoc-val">${escapeHtml(reportNo || '-')}</td>
                            <td class="tkm-fdoc-lbl">Sayfa No</td>
                            <td class="tkm-fdoc-val">${pageNum} / ${totalPages}</td>
                        </tr>
                    </tbody>
                </table>

            </div>

        </div>

    `;
    }

    const revDefault = branding.defaultRevisionInfo || 'REV.00 / YT: 01.09.2025';

    let displayFormCode = formCode || 'FR.01';

    if (!displayFormCode.includes('REV') && !displayFormCode.includes('RT:')) {

        displayFormCode = `${displayFormCode}, ${revDefault}`;

    }

    return `

        <div class="tkm-footer">

            <div class="tkm-footer-disclaimer">

                ${escapeHtml(disclaimer)}

            </div>

            <div class="tkm-footer-meta">

                <span style="width:38%;text-align:left;">${escapeHtml(displayFormCode)}</span>

                <span style="width:34%;text-align:center;">${escapeHtml(reportNo)}</span>

                <span style="width:28%;text-align:right;">${pageNum} / ${totalPages}</span>

            </div>

        </div>

    `;

}



function buildTkmOnaySection(insp, sectionNumber = '10', customTitle = null) {

    const hasPortalQr = Boolean(insp && insp.portal_report_url && typeof window.generateQrDataUrl === 'function');

    const qrSrc = hasPortalQr
        ? window.generateQrDataUrl(insp.portal_report_url)
        : ((window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.qrDefault) || 'assets/qr_default.jpg');

    const verifyCodeHtml = (insp && insp.portal_verify_code)
        ? `<div style="font-size:6pt;font-family:monospace;font-weight:700;color:#111;margin-top:2px;letter-spacing:0.3px;">Doğrulama: ${escapeHtml(insp.portal_verify_code)}</div>`
        : '';

    const qrImgSize = verifyCodeHtml ? '70px' : '76px';

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || {

        fullName: 'Ali Şamil Aytekin',

        title: 'Elektrik Mühendisi',

        ministryRegNo: 'K2023224376',

        diplomaNoDate: '249538 / 28.09.2022'

    };



    const inspectorName = (insp && insp.inspector_name) || curUser.fullName || 'Ali Şamil Aytekin';

    const inspectorTitle = (insp && insp.inspector_title) || curUser.title || 'Elektrik Mühendisi';

    const ministryNo = (insp && insp.ministry_reg_no) || curUser.ministryRegNo || 'K2023224376';

    const diplomaNo = (insp && insp.diploma_no) || curUser.diplomaNoDate || '249538 / 28.09.2022';

    const eimzaSrc = curUser.signatureImage || (window.TKM_EMBEDDED_ASSETS && window.TKM_EMBEDDED_ASSETS.eimza) || 'assets/eimza.jpg';



    return `

        <div class="tkm-sec-title">${customTitle || `${sectionNumber}. ONAY`}</div>

        <table class="tkm-table">

            <colgroup>

                <col style="width:19%;">

                <col style="width:48%;">

                <col style="width:33%;">

            </colgroup>

            <thead>

                <tr>

                    <th style="border:1px solid #000;"></th>

                    <th style="border:1px solid #000;text-align:center;font-weight:700;">Muayene Personeli</th>

                    <th style="border:1px solid #000;text-align:center;font-weight:700;">Kare Kod</th>

                </tr>

            </thead>

            <tbody>

                <tr>

                    <td style="font-weight:700;text-align:left;">Adı Soyadı / Mesleği</td>

                    <td style="text-align:center;font-weight:bold;">${inspectorName} / ${inspectorTitle}</td>

                    <td rowspan="4" style="text-align:center;vertical-align:middle;padding:4px;">

                        <img src="${qrSrc}" alt="QR Code" style="width:${qrImgSize};height:${qrImgSize};object-fit:contain;display:inline-block;">${verifyCodeHtml}

                    </td>

                </tr>

                <tr>

                    <td style="font-weight:700;text-align:left;">Bakanlık Kayıt No</td>

                    <td style="text-align:center;font-weight:bold;">${ministryNo}</td>

                </tr>

                <tr>

                    <td style="font-weight:700;text-align:left;">Diploma No / Tarih</td>

                    <td style="text-align:center;font-weight:bold;">${diplomaNo}</td>

                </tr>

                <tr style="height:44px;">

                    <td style="font-weight:700;text-align:left;vertical-align:middle;">İmza</td>

                    <td style="text-align:center;vertical-align:middle;padding:3px;">

                        <img src="${eimzaSrc}" alt="e-imzalıdır" style="height:34px;object-fit:contain;display:inline-block;">

                    </td>

                </tr>

            </tbody>

        </table>
        <div style="font-size:6.8pt;color:#333333;margin-top:2px;text-align:left;font-style:italic;">
            Bu rapor elektronik ortamda 1 (bir) nüsha olarak hazırlanmıştır.
        </div>
    `;
}



function triggerBrowserPrint() {

    const insp = AppState.currentInspection;

    const reportNo = (insp && insp.report_no) ? insp.report_no : 'TKM_A4_Rapor';

    const customer = (insp && insp.customer_name) ? insp.customer_name.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 28) : 'Rapor';

    const jobTitle = `${reportNo}_${customer}`;

    if (typeof showToast === 'function') {
        showToast('PDF Yazdırma / Kaydetme ekranı açılıyor... Açılan ekranda üstten "PDF Olarak Kaydet"i seçebilirsiniz.', 4500);
    }

    // Native Android WebView PrintManager support (100% Offline A4 PDF export)

    if (window.AndroidBridge && typeof window.AndroidBridge.printA4Report === 'function') {

        try {

            window.AndroidBridge.printA4Report(jobTitle);

            return;

        } catch (err) {

            console.warn('AndroidBridge.printA4Report fallback to window.print:', err);

        }

    }

    window.print();

}

let _emailModalReportsPool = [];

function getResolvedRecipientEmail(wo, insp, ci) {
    return (
        (ci && ci.contactEmail) ||
        (insp && (insp.contact_email || insp.customer_email)) ||
        (wo && (wo.contact_email || wo.customer_email)) ||
        (function() { try { return localStorage.getItem('enlab_last_recipient_email') || ''; } catch (e) { return ''; } })() ||
        ''
    ).trim();
}

function onReportEmailRecipientChange(val) {
    const clean = (val || '').trim();
    try {
        if (clean) localStorage.setItem('enlab_last_recipient_email', clean);
    } catch (e) {}
    if (AppState.currentFormData && AppState.currentFormData.companyInfo) {
        AppState.currentFormData.companyInfo.contactEmail = clean;
    }
    if (AppState.currentInspection) {
        AppState.currentInspection.contact_email = clean;
    }
    const woId = (AppState.currentWorkOrder && AppState.currentWorkOrder.id) || (AppState.currentInspection && AppState.currentInspection.work_order_id);
    if (woId && typeof saveWorkOrderEmailRealtime === 'function') {
        saveWorkOrderEmailRealtime(woId, clean);
    }
}

function renderEmailModalMultiList(reports, preselectedIds) {
    const sec = document.getElementById('reportEmailMultiSection');
    const listEl = document.getElementById('reportEmailMultiList');
    if (!sec || !listEl) return;

    _emailModalReportsPool = Array.isArray(reports) ? reports : [];
    if (_emailModalReportsPool.length <= 1) {
        sec.classList.add('hidden');
        listEl.innerHTML = '';
        return;
    }

    sec.classList.remove('hidden');
    const selectedSet = new Set((preselectedIds || []).map(x => String(x)));
    listEl.innerHTML = _emailModalReportsPool.map((item, idx) => {
        const isChecked = selectedSet.has(String(item.id));
        const eqName = item.equipment_name || 'Periyodik Kontrol Raporu';
        const rNo = item.report_no || `Rapor-${idx + 1}`;
        return `
            <label class="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition">
                <div class="flex items-center gap-2 min-w-0">
                    <input type="checkbox" name="emailReportItemCb" value="${item.id}" ${isChecked ? 'checked' : ''}
                        onchange="rebuildEmailTextFromSelection()"
                        class="w-4 h-4 accent-sky-500 rounded shrink-0">
                    <span class="font-bold text-slate-100 text-xs truncate">${escapeHtml(eqName)}</span>
                </div>
                <span class="text-[10px] font-mono text-slate-400 shrink-0">${escapeHtml(rNo)}</span>
            </label>
        `;
    }).join('');
}

function toggleAllEmailReports(selectAll = true) {
    const boxes = document.querySelectorAll('input[name="emailReportItemCb"]');
    const allChecked = Array.from(boxes).every(cb => cb.checked);
    const targetState = selectAll ? !allChecked : false;
    boxes.forEach(cb => { cb.checked = targetState; });
    rebuildEmailTextFromSelection();
}

function rebuildEmailTextFromSelection() {
    const subjectInput = document.getElementById('reportEmailSubject');
    const bodyInput = document.getElementById('reportEmailBody');
    if (!subjectInput || !bodyInput) return;

    const insp = AppState.currentInspection || {};
    const fd = AppState.currentFormData || {};
    const ci = fd.companyInfo || {};
    const woId = insp.work_order_id || (AppState.currentWorkOrder && AppState.currentWorkOrder.id) || (_emailModalReportsPool[0] && _emailModalReportsPool[0].work_order_id);
    const dbWo = woId && window.OfflineDB?.state?.workOrders
        ? window.OfflineDB.state.workOrders.find(w => String(w.id) === String(woId))
        : null;
    const wo = dbWo || AppState.currentWorkOrder || {};

    const checkedIds = Array.from(document.querySelectorAll('input[name="emailReportItemCb"]:checked')).map(cb => String(cb.value));
    let selectedReports = _emailModalReportsPool.filter(r => checkedIds.includes(String(r.id)));

    if (selectedReports.length === 0 && _emailModalReportsPool.length > 0) {
        selectedReports = [_emailModalReportsPool[0]];
    }

    // Refresh selected report objects from OfflineDB if available so freshly uploaded portal URLs are included
    selectedReports = selectedReports.map(r => {
        const fresh = (r && r.id && window.OfflineDB?.state?.inspections)
            ? window.OfflineDB.state.inspections.find(x => String(x.id) === String(r.id))
            : null;
        return fresh ? Object.assign({}, r, fresh) : r;
    });

    const customer = (
        (selectedReports[0] && (selectedReports[0].customer_name || selectedReports[0].company_name)) ||
        wo.customer_name ||
        wo.company_name ||
        insp.customer_name ||
        ci.firmName ||
        'Firmanız'
    ).trim();

    const pdfBtnLabel = document.getElementById('btnDownloadSelectedPdfLabel');
    if (pdfBtnLabel) {
        pdfBtnLabel.textContent = selectedReports.length > 1
            ? `Seçili ${selectedReports.length} Raporu Tek PDF Olarak Kaydet / İndir`
            : 'Seçili Raporu PDF Olarak Kaydet / İndir';
    }

    const portalFolderUrl = wo.portal_folder_url || (selectedReports.find(r => r && r.portal_folder_url) || {}).portal_folder_url || '';
    const portalPin = wo.portal_pin || '';
    const portalUsername = wo.portal_customer_username || '';
    const portalPassword = wo.portal_customer_password || '';
    const portalSiteUrl = (typeof CloudPortal !== 'undefined' && CloudPortal.getConfig) ? CloudPortal.getConfig().portalUrl : 'https://hizli-rapor-portal.vercel.app';

    if (selectedReports.length <= 1) {
        const r = selectedReports[0] || insp;
        const reportNo = r.report_no || ci.reportNo || 'TKM-RAPOR';
        const equipment = r.equipment_name || ci.equipmentName || 'Periyodik Kontrol';
        const safeCust = customer.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 25);
        const pdfFileName = `${reportNo}_${safeCust}.pdf`;

        const portalBlockLines = [];
        if (portalFolderUrl || r.portal_report_url || portalUsername) {
            portalBlockLines.push('İNTERNET ÜZERİNDEN RAPOR GÖRÜNTÜLEME (Yalnızca firmanıza özeldir):');
            if (portalUsername) {
                portalBlockLines.push(`- Portal Giriş Adresi: ${portalSiteUrl}`);
                portalBlockLines.push(`- Müşteri Kullanıcı Adı: ${portalUsername}`);
                if (portalPassword) portalBlockLines.push(`- Müşteri Şifresi: ${portalPassword}`);
            }
            if (portalFolderUrl) portalBlockLines.push(`- Müşteri Klasörü: ${portalFolderUrl}`);
            if (portalPin) portalBlockLines.push(`- Ek Erişim PIN Şifresi: ${portalPin}`);
            if (r.portal_report_url) {
                portalBlockLines.push(`- Doğrudan Rapor Linki: ${r.portal_report_url}${r.portal_verify_code ? ` (Doğrulama Kodu: ${r.portal_verify_code})` : ''}`);
            }
        }
        const portalSection = portalBlockLines.length ? `\n\n${portalBlockLines.join('\n')}` : '';

        subjectInput.value = `Periyodik Kontrol Raporu - ${customer} (${equipment})`;
        bodyInput.value =
`Sayın Yetkili,

${customer} firmasında gerçekleştirilen periyodik kontrol çalışmasına ait ${equipment} (${reportNo}) raporu hazırlanmış olup ekte (${pdfFileName}) bilgilerinize sunulmuştur.${portalSection}

İyi çalışmalar dileriz.
ENLAB / TEKKOMER Periyodik Kontrol Muayene Kuruluşu`;
    } else {
        const listLines = selectedReports.map((r, i) => {
            const eq = r.equipment_name || 'Periyodik Kontrol Raporu';
            const rNo = r.report_no ? ` (${r.report_no})` : '';
            const rLink = r.portal_report_url ? `\n   Link: ${r.portal_report_url}${r.portal_verify_code ? ` · Kod: ${r.portal_verify_code}` : ''}` : '';
            return `${i + 1}. ${eq}${rNo}${rLink}`;
        }).join('\n');
        const safeCust = customer.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 25);
        const pdfFileName = `Periyodik_Kontrol_Raporlari_${selectedReports.length}_Adet_${safeCust}.pdf`;

        const portalHeaderLines = [];
        if (portalFolderUrl || portalUsername) {
            portalHeaderLines.push('İNTERNET ÜZERİNDEN RAPOR KLASÖRÜ (Yalnızca firmanıza özeldir):');
            if (portalUsername) {
                portalHeaderLines.push(`- Portal Giriş Adresi: ${portalSiteUrl}`);
                portalHeaderLines.push(`- Müşteri Kullanıcı Adı: ${portalUsername}`);
                if (portalPassword) portalHeaderLines.push(`- Müşteri Şifresi: ${portalPassword}`);
            }
            if (portalFolderUrl) portalHeaderLines.push(`- Müşteri Klasörü: ${portalFolderUrl}`);
            if (portalPin) portalHeaderLines.push(`- Ek Erişim PIN Şifresi: ${portalPin}`);
        }
        const portalSection = portalHeaderLines.length ? `\n\n${portalHeaderLines.join('\n')}` : '';

        subjectInput.value = `Periyodik Kontrol Raporları (${selectedReports.length} Adet) - ${customer}`;
        bodyInput.value =
`Sayın Yetkili,

${customer} firmasında gerçekleştirilen periyodik kontrol çalışmalarına ait aşağıdaki raporlar hazırlanmış olup ekte (${pdfFileName}) bilgilerinize sunulmuştur:

${listLines}${portalSection}

İyi çalışmalar dileriz.
ENLAB / TEKKOMER Periyodik Kontrol Muayene Kuruluşu`;
    }
}

function getSelectedEmailReportsList() {
    const checkedIds = Array.from(document.querySelectorAll('input[name="emailReportItemCb"]:checked')).map(cb => String(cb.value));
    let selectedReports = _emailModalReportsPool.filter(r => checkedIds.includes(String(r.id)));
    if (selectedReports.length === 0) {
        if (_emailModalReportsPool.length > 0) selectedReports = [_emailModalReportsPool[0]];
        else if (AppState.currentInspection) selectedReports = [AppState.currentInspection];
    }
    return selectedReports;
}

function loadInspectionFormDataObject(inspObj) {
    if (!inspObj) return {};
    let baseData = {};
    try {
        baseData = typeof inspObj.data_json === 'string' ? JSON.parse(inspObj.data_json || '{}') : (inspObj.form_data || {});
    } catch (e) {}
    let localData = null;
    try {
        const localRaw = localStorage.getItem(`enlab_insp_${inspObj.id}`);
        if (localRaw) localData = JSON.parse(localRaw);
    } catch (e) {}
    const formData = Object.assign({}, baseData || {}, localData || {});
    if (!formData.answers) formData.answers = {};
    if (!formData.tableRows) formData.tableRows = {};
    if (!formData.specializedFields) formData.specializedFields = {};
    if (!formData.specializedChecks) formData.specializedChecks = {};
    if (!formData.specializedRows) formData.specializedRows = [];
    if (!formData.photos) formData.photos = [];
    if (formData.defectNotes === undefined) formData.defectNotes = '';
    if (formData.generalNotes === undefined) formData.generalNotes = '';
    if (!formData.overallResult) formData.overallResult = 'UYGUN';
    if (!formData.grounding) formData.grounding = { details: {}, detected: {}, method: 'Çevrim empedansı', points: [], selectivity: [] };
    if (!formData.generator) formData.generator = { info: {}, equipment: {}, checks: {}, potential: {}, measurements: {}, battery: {}, devices: [] };
    if (window.MeasuringDevicesManager && typeof window.MeasuringDevicesManager.applyDefaultsToFormData === 'function') {
        window.MeasuringDevicesManager.applyDefaultsToFormData(formData, inspObj.template_id, false);
    }
    if (String(inspObj.template_id) === '2205' && Array.isArray(formData.measuringDevices) && formData.measuringDevices.length && (!formData.generator.devices || !formData.generator.devices.length)) {
        formData.generator.devices = formData.measuringDevices;
    }
    return formData;
}

function downloadSelectedEmailReportsAsPdf() {
    const selectedReports = getSelectedEmailReportsList();
    if (!selectedReports.length) {
        if (typeof showToast === 'function') showToast('Lütfen en az bir rapor seçin.', 'warning');
        return;
    }

    const printArea = document.getElementById('printableReportArea');
    const activePdfTheme = getPdfTheme();

    // Save current editor state so we don't disturb the user's open report
    const savedInsp = AppState.currentInspection;
    const savedFd = AppState.currentFormData;

    const allPagesHtml = [];

    try {
        for (let i = 0; i < selectedReports.length; i++) {
            const r = normalizeInspection(selectedReports[i]);
            let fd = loadInspectionFormDataObject(r);
            if (savedInsp && String(savedInsp.id) === String(r.id) && savedFd) {
                fd = savedFd;
            }
            AppState.currentInspection = r;
            AppState.currentFormData = fd;
            printOfficialReport(false, null, true);
            if (printArea && printArea.innerHTML) {
                allPagesHtml.push(printArea.innerHTML);
            }
        }
    } finally {
        AppState.currentInspection = savedInsp;
        AppState.currentFormData = savedFd;
    }

    if (printArea && allPagesHtml.length > 0) {
        printArea.setAttribute('data-pdf-theme', activePdfTheme);
        printArea.innerHTML = allPagesHtml.join('');
    }

    const first = selectedReports[0];
    const customer = ((first && (first.customer_name || first.company_name)) || 'Rapor').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ_-]/g, '_').slice(0, 25);
    const jobTitle = selectedReports.length > 1
        ? `Periyodik_Kontrol_Raporlari_${selectedReports.length}_Adet_${customer}`
        : `${first.report_no || 'TKM_Rapor'}_${customer}`;

    if (typeof showToast === 'function') {
        showToast('Açılan ekranda üstten "PDF Olarak Kaydet"i seçip telefonunuza kaydedin, ardından E-posta uygulamasında ataç (📎) ikonundan ekleyin.', 5000);
    }

    if (window.AndroidBridge && typeof window.AndroidBridge.printA4Report === 'function') {
        try {
            window.AndroidBridge.printA4Report(jobTitle);
            return;
        } catch (err) {
            console.warn('AndroidBridge.printA4Report error:', err);
        }
    }
    window.print();
}

function openReportEmailModal() {
    const insp = AppState.currentInspection || {};
    const fd = AppState.currentFormData || {};
    const ci = fd.companyInfo || {};
    const woId = insp.work_order_id || (AppState.currentWorkOrder && AppState.currentWorkOrder.id);
    const wo = (window.OfflineDB?.state?.workOrders || []).find(w => String(w.id) === String(woId)) || AppState.currentWorkOrder || {};

    let folderReports = [];
    if (woId && window.OfflineDB?.state?.inspections) {
        folderReports = window.OfflineDB.state.inspections.filter(i => String(i.work_order_id) === String(woId));
    } else if (Array.isArray(AppState.inspectionsCache) && AppState.inspectionsCache.length > 0) {
        folderReports = AppState.inspectionsCache;
    }
    if (folderReports.length === 0 && insp.id) {
        folderReports = [insp];
    }

    const modal = document.getElementById('reportEmailModal');
    if (!modal) return;

    const recipientInput = document.getElementById('reportEmailRecipient');
    if (recipientInput) {
        recipientInput.value = getResolvedRecipientEmail(wo, insp, ci);
    }

    renderEmailModalMultiList(folderReports, [insp.id || (folderReports[0] && folderReports[0].id)]);
    rebuildEmailTextFromSelection();

    modal.classList.remove('hidden');
}

async function openMultiReportEmailModal(workOrderId) {
    const woId = workOrderId || (AppState.currentWorkOrder && AppState.currentWorkOrder.id);
    let wo = AppState.currentWorkOrder || {};
    let reports = Array.isArray(AppState.inspectionsCache) ? AppState.inspectionsCache : [];

    if (woId) {
        try {
            const res = await fetch(`/api/work-orders/${woId}`);
            const data = await res.json();
            if (data.workOrder) {
                wo = normalizeWorkOrder(data.workOrder);
                AppState.currentWorkOrder = wo;
            }
            if (Array.isArray(data.inspections)) reports = data.inspections.map(normalizeInspection);
        } catch (e) {}
    }

    if (!reports.length) {
        if (typeof showToast === 'function') showToast('Bu klasörde gönderilecek rapor bulunamadı.', 'warning');
        return;
    }

    const modal = document.getElementById('reportEmailModal');
    if (!modal) return;

    const recipientInput = document.getElementById('reportEmailRecipient');
    if (recipientInput) {
        recipientInput.value = getResolvedRecipientEmail(wo, reports[0], null);
    }

    renderEmailModalMultiList(reports, reports.map(r => r.id));
    rebuildEmailTextFromSelection();

    modal.classList.remove('hidden');
}

function closeReportEmailModal() {
    const modal = document.getElementById('reportEmailModal');
    if (modal) modal.classList.add('hidden');
}

function restoreNativeDatabaseImmediately() {
    try {
        if (window.OfflineDB) {
            window.OfflineDB.init();
            window.OfflineDB.save();
        }
    } catch (e) {
        console.warn('Database restore warning:', e);
    }
}

function sendReportEmailDirect() {
    const recipient = (document.getElementById('reportEmailRecipient')?.value || '').trim();
    const subject = (document.getElementById('reportEmailSubject')?.value || 'Periyodik Kontrol Raporu').trim();
    const body = document.getElementById('reportEmailBody')?.value || '';

    if (recipient) {
        onReportEmailRecipientChange(recipient);
        // Copy recipient email to clipboard so user can paste with 1 tap if needed
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(recipient);
            }
        } catch (e) {}
    }

    const fullEmailText = recipient ? `Alıcı: ${recipient}\n\n${body}` : body;

    // 1. Native Android Share / Email Chooser via AndroidBridge
    if (window.AndroidBridge && typeof window.AndroidBridge.shareJsonBackup === 'function') {
        try {
            window.AndroidBridge.shareJsonBackup(subject, fullEmailText);
            // Restore actual offline DB immediately on both JS and UI threads
            restoreNativeDatabaseImmediately();
            setTimeout(restoreNativeDatabaseImmediately, 80);
            setTimeout(restoreNativeDatabaseImmediately, 350);
            setTimeout(restoreNativeDatabaseImmediately, 1000);
            if (typeof showToast === 'function') {
                showToast(recipient ? `E-posta ekranı açılıyor (Alıcı: ${recipient} panoya kopyalandı)` : 'E-posta / Paylaşım ekranı açılıyor...');
            }
            setTimeout(() => closeReportEmailModal(), 400);
            return;
        } catch (err) {
            console.warn('AndroidBridge email launch error:', err);
        }
    }

    // 2. Web Share API fallback
    if (navigator.share) {
        navigator.share({
            title: subject,
            text: fullEmailText
        }).then(() => {
            closeReportEmailModal();
        }).catch(() => {});
        return;
    }

    // 3. Desktop Browser Fallback via mailto:
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
        const a = document.createElement('a');
        a.href = mailtoUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { if (a.parentNode) document.body.removeChild(a); }, 300);
        if (typeof showToast === 'function') {
            showToast('E-posta uygulaması açılıyor...');
        }
        setTimeout(() => closeReportEmailModal(), 500);
    } catch (err) {
        console.error('Mailto link error:', err);
        copyReportEmailText();
    }
}

function shareReportViaWebShare() {
    sendReportEmailDirect();
}

function copyReportEmailText() {
    const body = document.getElementById('reportEmailBody')?.value || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(body).then(() => {
            if (typeof showToast === 'function') {
                showToast('Rapor metni panoya kopyalandı! Dilediğiniz uygulamaya yapıştırabilirsiniz.', 3500);
            }
        }).catch(() => {
            fallbackCopyText(body);
        });
    } else {
        fallbackCopyText(body);
    }
}

function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        if (typeof showToast === 'function') {
            showToast('Rapor metni panoya kopyalandı!', 3000);
        }
    } catch (e) {
        if (typeof showToast === 'function') {
            showToast('Lütfen metni seçip kopyalayınız.', 3000);
        }
    }
    if (ta.parentNode) document.body.removeChild(ta);
}

window.openReportEmailModal = openReportEmailModal;
window.openMultiReportEmailModal = openMultiReportEmailModal;
window.closeReportEmailModal = closeReportEmailModal;
window.sendReportEmailDirect = sendReportEmailDirect;
window.shareReportViaWebShare = shareReportViaWebShare;
window.copyReportEmailText = copyReportEmailText;
window.onReportEmailRecipientChange = onReportEmailRecipientChange;
window.toggleAllEmailReports = toggleAllEmailReports;
window.rebuildEmailTextFromSelection = rebuildEmailTextFromSelection;
window.downloadSelectedEmailReportsAsPdf = downloadSelectedEmailReportsAsPdf;



AppState.a4Zoom = 1;



// --- AKROBAT / STANDART PDF PANZOOM MOTORU (TİTREMESİZ / SILKY SMOOTH) ---
let pdfViewerState = {
    zoom: 1,
    panX: 16,
    panY: 16,
    minZoom: 0.35,
    maxZoom: 3.2
};

let _rafId = null;

function clampPdfBounds() {
    const scrollContainer = document.getElementById('a4PreviewScrollContainer');
    const pagesContainer = document.getElementById('a4PreviewPagesContainer');
    if (!scrollContainer || !pagesContainer) return;

    const viewportW = scrollContainer.clientWidth || window.innerWidth;
    const viewportH = scrollContainer.clientHeight || window.innerHeight;
    const baseW = 794;
    const pages = pagesContainer.querySelectorAll('.tkm-a4-page');
    const pageCount = pages.length || 1;
    const baseH = pageCount * 1142;

    const scaledW = baseW * pdfViewerState.zoom;
    const scaledH = baseH * pdfViewerState.zoom;

    // YATAY SINIRLAR (SOL VE SAĞ LİMİTLER)
    if (scaledW <= viewportW) {
        // Ekrana tam sığıyorsa ortala
        pdfViewerState.panX = (viewportW - scaledW) / 2;
    } else {
        // En sola gidildiğinde sol kenar 16px payla durur
        // En sağa gidildiğinde sağ kenar 16px payla durur
        const maxPanX = 16;
        const minPanX = viewportW - scaledW - 16;
        pdfViewerState.panX = Math.min(maxPanX, Math.max(minPanX, pdfViewerState.panX));
    }

    // DÜŞEY SINIRLAR (YUKARI VE AŞAĞI LİMİTLER)
    if (scaledH <= viewportH) {
        pdfViewerState.panY = Math.max(16, (viewportH - scaledH) / 2);
    } else {
        // En yukarı gidildiğinde 1. sayfanın üstü 16px payla durur
        // En aşağı gidildiğinde son sayfanın altı 16px payla durur
        const maxPanY = 16;
        const minPanY = viewportH - scaledH - 16;
        pdfViewerState.panY = Math.min(maxPanY, Math.max(minPanY, pdfViewerState.panY));
    }
}

function renderPdfTransform(animate = false) {
    const pagesContainer = document.getElementById('a4PreviewPagesContainer');
    if (!pagesContainer) return;
    clampPdfBounds();
    if (animate) {
        pagesContainer.style.transition = 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)';
    } else {
        pagesContainer.style.transition = 'none';
    }
    // Sub-pixel floating precision avoids pixel snapping jitter
    pagesContainer.style.transform = `translate3d(${pdfViewerState.panX.toFixed(2)}px, ${pdfViewerState.panY.toFixed(2)}px, 0) scale(${pdfViewerState.zoom.toFixed(4)})`;
}

function scheduleRender(animate = false) {
    if (_rafId) return;
    _rafId = requestAnimationFrame(() => {
        _rafId = null;
        renderPdfTransform(animate);
    });
}

function applyA4PreviewZoom() {
    renderPdfTransform(false);
}

function adjustA4PreviewZoom(delta) {
    const scrollContainer = document.getElementById('a4PreviewScrollContainer');
    const vw = (scrollContainer && scrollContainer.clientWidth) || window.innerWidth;
    const vh = (scrollContainer && scrollContainer.clientHeight) || window.innerHeight;
    const focalX = vw / 2;
    const focalY = vh / 2;

    const oldZ = pdfViewerState.zoom;
    const newZ = Math.max(pdfViewerState.minZoom, Math.min(pdfViewerState.maxZoom, oldZ + delta));
    const factor = newZ / oldZ;

    pdfViewerState.panX = focalX - (focalX - pdfViewerState.panX) * factor;
    pdfViewerState.panY = focalY - (focalY - pdfViewerState.panY) * factor;
    pdfViewerState.zoom = newZ;
    AppState.a4Zoom = newZ;

    renderPdfTransform(true);
}

let _touchState = {
    mode: 'none',
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    lastDist: 0,
    lastFocalX: 0,
    lastFocalY: 0,
    lastTapTime: 0
};

function initA4PinchZoom() {
    const scrollContainer = document.getElementById('a4PreviewScrollContainer');
    if (!scrollContainer || scrollContainer._pinchInitialized) return;
    scrollContainer._pinchInitialized = true;

    scrollContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            _touchState.mode = 'pan';
            _touchState.startX = e.touches[0].clientX;
            _touchState.startY = e.touches[0].clientY;
            _touchState.startPanX = pdfViewerState.panX;
            _touchState.startPanY = pdfViewerState.panY;

            // Çift Dokunma (Double Tap) ile Yakınlaştırma / Sığdırma
            const now = Date.now();
            if (now - _touchState.lastTapTime < 320) {
                const rect = scrollContainer.getBoundingClientRect();
                const tapX = e.touches[0].clientX - rect.left;
                const tapY = e.touches[0].clientY - rect.top;
                const vw = scrollContainer.clientWidth || window.innerWidth;
                const fitZoom = Math.max(0.35, Math.min(1.0, (vw - 32) / 794));

                if (pdfViewerState.zoom > fitZoom * 1.25) {
                    resetA4PreviewZoom();
                } else {
                    const targetZoom = 1.65;
                    const factor = targetZoom / pdfViewerState.zoom;
                    pdfViewerState.panX = tapX - (tapX - pdfViewerState.panX) * factor;
                    pdfViewerState.panY = tapY - (tapY - pdfViewerState.panY) * factor;
                    pdfViewerState.zoom = targetZoom;
                    AppState.a4Zoom = targetZoom;
                    renderPdfTransform(true);
                }
                _touchState.mode = 'none';
            }
            _touchState.lastTapTime = now;

        } else if (e.touches.length === 2) {
            _touchState.mode = 'pinch';
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const rect = scrollContainer.getBoundingClientRect();
            _touchState.lastDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            _touchState.lastFocalX = ((t1.clientX + t2.clientX) / 2) - rect.left;
            _touchState.lastFocalY = ((t1.clientY + t2.clientY) / 2) - rect.top;
        }
    }, { passive: false });

    scrollContainer.addEventListener('touchmove', (e) => {
        if (_touchState.mode === 'pan' && e.touches.length === 1) {
            e.preventDefault();
            const dx = e.touches[0].clientX - _touchState.startX;
            const dy = e.touches[0].clientY - _touchState.startY;
            pdfViewerState.panX = _touchState.startPanX + dx;
            pdfViewerState.panY = _touchState.startPanY + dy;
            scheduleRender(false);

        } else if (_touchState.mode === 'pinch' && e.touches.length === 2) {
            e.preventDefault();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const rect = scrollContainer.getBoundingClientRect();
            const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const currentFocalX = ((t1.clientX + t2.clientX) / 2) - rect.left;
            const currentFocalY = ((t1.clientY + t2.clientY) / 2) - rect.top;

            if (_touchState.lastDist > 10) {
                const scaleDelta = currentDist / _touchState.lastDist;
                const newZoom = Math.max(pdfViewerState.minZoom, Math.min(pdfViewerState.maxZoom, pdfViewerState.zoom * scaleDelta));
                const actualFactor = newZoom / pdfViewerState.zoom;

                // Odak noktasına göre pürüzsüz ölçekleme
                pdfViewerState.panX = currentFocalX - (currentFocalX - pdfViewerState.panX) * actualFactor;
                pdfViewerState.panY = currentFocalY - (currentFocalY - pdfViewerState.panY) * actualFactor;
                
                // İki parmağın merkezindeki kaymayı da birebir takip et (titremeyi yok eden formül)
                pdfViewerState.panX += (currentFocalX - _touchState.lastFocalX);
                pdfViewerState.panY += (currentFocalY - _touchState.lastFocalY);
                
                pdfViewerState.zoom = newZoom;
                AppState.a4Zoom = newZoom;

                _touchState.lastDist = currentDist;
                _touchState.lastFocalX = currentFocalX;
                _touchState.lastFocalY = currentFocalY;

                scheduleRender(false);
            }
        }
    }, { passive: false });

    scrollContainer.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            _touchState.mode = 'none';
            renderPdfTransform(true);
        } else if (e.touches.length === 1) {
            _touchState.mode = 'pan';
            _touchState.startX = e.touches[0].clientX;
            _touchState.startY = e.touches[0].clientY;
            _touchState.startPanX = pdfViewerState.panX;
            _touchState.startPanY = pdfViewerState.panY;
        }
    }, { passive: true });

    scrollContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.ctrlKey) {
            adjustA4PreviewZoom(e.deltaY < 0 ? 0.15 : -0.15);
        } else {
            pdfViewerState.panY -= e.deltaY;
            pdfViewerState.panX -= (e.deltaX || 0);
            scheduleRender(false);
        }
    }, { passive: false });
}

function resetA4PreviewZoom() {
    const scrollContainer = document.getElementById('a4PreviewScrollContainer');
    const vw = (scrollContainer && scrollContainer.clientWidth) || window.innerWidth || 1024;
    const fitZoom = Math.max(0.35, Math.min(1.0, (vw - 32) / 794));
    pdfViewerState.zoom = fitZoom;
    pdfViewerState.panX = 16;
    pdfViewerState.panY = 16;
    AppState.a4Zoom = fitZoom;
    renderPdfTransform(true);
}

function closeA4PreviewModal() {

    const modal = document.getElementById('a4PreviewModal');

    if (modal) modal.classList.add('hidden');

}

function isRamsTheme(theme) {
    if (!theme) return false;
    return theme === 'modern' || theme.startsWith('rams_');
}
window.isRamsTheme = isRamsTheme;

function getPdfTheme() {
    try {
        const saved = localStorage.getItem('tkm_pdf_theme') || 'classic';
        const aliasMap = {
            'modern': 'rams_navy',
            'bureau_veritas': 'rams_navy',
            'isg_emerald': 'rams_emerald',
            'nordic_tech': 'rams_nordic',
            'tuv_modern': 'rams_tuv'
        };
        return aliasMap[saved] || saved;
    } catch (e) {
        return 'classic';
    }
}

function updateThemeSelectorUI(theme) {
    const sel = document.getElementById('pdfThemeSelect');
    if (sel && sel.value !== theme) {
        sel.value = theme;
    }
}
window.updateThemeSelectorUI = updateThemeSelectorUI;
window.updateThemeToggleUI = updateThemeSelectorUI;

function setPdfTheme(themeName) {
    const validThemes = ['classic', 'rams_navy', 'rams_emerald', 'rams_nordic', 'rams_tuv'];
    const aliasMap = {
        'modern': 'rams_navy',
        'bureau_veritas': 'rams_navy',
        'isg_emerald': 'rams_emerald',
        'nordic_tech': 'rams_nordic',
        'tuv_modern': 'rams_tuv'
    };
    const resolvedTheme = aliasMap[themeName] || themeName;
    const theme = validThemes.includes(resolvedTheme) ? resolvedTheme : 'classic';
    try {
        localStorage.setItem('tkm_pdf_theme', theme);
    } catch (e) {}

    updateThemeSelectorUI(theme);

    const previewContainer = document.getElementById('a4PreviewPagesContainer');
    if (previewContainer) {
        previewContainer.setAttribute('data-pdf-theme', theme);
        previewContainer.querySelectorAll('.tkm-a4-page').forEach(el => {
            el.setAttribute('data-pdf-theme', theme);
        });
    }

    const printArea = document.getElementById('printableReportArea');
    if (printArea) {
        printArea.setAttribute('data-pdf-theme', theme);
        printArea.querySelectorAll('.tkm-a4-page').forEach(el => {
            el.setAttribute('data-pdf-theme', theme);
        });
    }

    // Re-render report so pagination and layout (like 2-column visual checks vs 1-column) re-calculate cleanly!
    if (typeof printOfficialReport === 'function') {
        printOfficialReport(false);
    }
}
window.getPdfTheme = getPdfTheme;
window.setPdfTheme = setPdfTheme;
function paginateBlocksIntoA4Pages(blocksHtmlArray, reportMainTitle, formCode, reportNo) {

    // Create an off-screen A4 measurement sandbox so browser layout engine measures exact pixel heights

    let sandbox = document.getElementById('tkmMeasureSandbox');

    if (sandbox) sandbox.remove();

    sandbox = document.createElement('div');

    sandbox.id = 'tkmMeasureSandbox';

    sandbox.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;visibility:hidden;pointer-events:none;z-index:-1;';

    document.body.appendChild(sandbox);



    const activeTheme = getPdfTheme();
    const probePage = document.createElement('div');
    probePage.className = 'tkm-a4-page';
    probePage.setAttribute('data-pdf-theme', activeTheme);

    probePage.innerHTML = `

        ${buildTkmPageHeader(reportMainTitle)}

        <div id="tkmProbeBody" style="flex:0 0 auto;display:block;width:100%;"></div>

        ${buildTkmPageFooter(formCode, reportNo, 1, 1)}

    `;

    sandbox.appendChild(probePage);



    const headerEl = probePage.querySelector('.tkm-header');

    const footerEl = probePage.querySelector('.tkm-footer');

    const bodyEl = probePage.querySelector('#tkmProbeBody');

    const cs = window.getComputedStyle(probePage);

    const padTop = parseFloat(cs.paddingTop) || 24;

    const padBottom = parseFloat(cs.paddingBottom) || 22;

    const pageInnerH = (probePage.clientHeight || 1120) - padTop - padBottom;

    const headerH = (headerEl ? headerEl.offsetHeight : 112) + 4;

    const footerH = (footerEl ? footerEl.offsetHeight : 44) + 6;

    const maxBodyHeight = pageInnerH - headerH - footerH - 6;



    const packedPages = [];

    for (let i = 0; i < blocksHtmlArray.length; i++) {
        const blockHtml = blocksHtmlArray[i];
        const isForceBreak = typeof blockHtml === 'string' && blockHtml.includes('tkm-force-page-break');
        if (isForceBreak && bodyEl.children.length > 0) {
            packedPages.push(bodyEl.innerHTML);
            bodyEl.innerHTML = '';
        }

        const blockEl = document.createElement('div');

        blockEl.className = 'tkm-block';

        blockEl.innerHTML = blockHtml;

        bodyEl.appendChild(blockEl);



        if (bodyEl.children.length > 1 && bodyEl.offsetHeight > maxBodyHeight) {

            // Current block doesn't fit completely on this A4 page — move entire block (title + table) to next page!

            bodyEl.removeChild(blockEl);

            packedPages.push(bodyEl.innerHTML);

            bodyEl.innerHTML = '';

            bodyEl.appendChild(blockEl);

        }

    }

    if (bodyEl.children.length > 0) {

        packedPages.push(bodyEl.innerHTML);

    }



    sandbox.remove();



    const totalPages = packedPages.length || 1;

    return packedPages.map((pageContentHtml, idx) => `

        ${buildTkmPageHeader(reportMainTitle)}

        <div class="tkm-page-body">${pageContentHtml}</div>

        ${buildTkmPageFooter(formCode, reportNo, idx + 1, totalPages)}

    `);

}



function renderPdfPhotoBlocks(photosList, secTitle = 'FOTOĞRAFLAR') {
    if (!photosList || photosList.length === 0) return [];
    const validPhotos = photosList.filter(p => {
        if (!p) return false;
        if (typeof p === 'string') return p.length > 10;
        return Boolean(p.dataUrl || p.data || p.url);
    });
    if (validPhotos.length === 0) return [];

    const photoBlocks = [];
    const chunkSize = 2;

    const getSrc = (item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        return item.dataUrl || item.data || item.url || '';
    };

    const getCaption = (item, photoNum) => {
        if (!item) return '';
        let text = (item.description || item.caption || '').trim();
        if (!text) return '';
        const lower = text.toLowerCase();
        if (lower === `fotoğraf ${photoNum}`.toLowerCase() ||
            lower.includes('ana dağıtım') ||
            lower === 'adp' ||
            lower.includes('termal kamera')) {
            return '';
        }
        return text;
    };

    for (let i = 0; i < validPhotos.length; i += chunkSize) {
        const pair = validPhotos.slice(i, i + chunkSize);
        const isFirst = (i === 0);
        let blockHtml = '';
        if (isFirst) {
            blockHtml += `<div class="tkm-sec-title">${secTitle}</div>`;
        }

        blockHtml += `
            <div style="display:flex;gap:8px;margin-bottom:6px;width:100%;box-sizing:border-box;">
                ${pair.map((ph, pIdx) => {
                    const src = getSrc(ph);
                    const photoNum = i + pIdx + 1;
                    const caption = getCaption(ph, photoNum);

                    return `
                        <div style="flex:1;border:1px solid #111;padding:5px 6px;text-align:center;box-sizing:border-box;background:#fff;">
                            <!-- Fotoğraf Üstü: Sadece Fotoğraf 1, 2, 3... -->
                            <div style="font-weight:700;font-size:7.5pt;margin-bottom:4px;color:#111;">Fotoğraf ${photoNum}</div>
                            <!-- Fotoğraf Görseli -->
                            <div style="height:155px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">
                                <img src="${src}" alt="Fotoğraf ${photoNum}" style="max-height:150px;max-width:100%;object-fit:contain;display:block;margin:0 auto;">
                            </div>
                            <!-- Fotoğraf Altı: Açıklama / Not -->
                            ${caption ? `
                                <div style="font-size:7pt;color:#222222;border-top:1px solid #eee;padding-top:3px;margin-top:3px;min-height:14px;line-height:1.2;font-style:italic;">
                                    ${escapeHtml(caption)}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
                ${pair.length === 1 ? `<div style="flex:1;visibility:hidden;"></div>` : ''}
            </div>
        `;
        photoBlocks.push(blockHtml);
    }
    return photoBlocks;
}

function printOfficialReport(directPrint = false, customTarget = null, silentRender = false) {

    const insp = AppState.currentInspection;

    const fd = AppState.currentFormData;

    const printArea = document.getElementById('printableReportArea');

    if (!insp || !printArea) return;

    if (fd && window.MeasuringDevicesManager && typeof window.MeasuringDevicesManager.applyDefaultsToFormData === 'function') {
        window.MeasuringDevicesManager.applyDefaultsToFormData(fd, insp.template_id, false);
    }

    const activePdfTheme = getPdfTheme();



    const is2201 = String(insp.template_id) === '2201' && AppState.electricalTemplate && AppState.electricalTemplate.areas;

    const ci = fd.companyInfo || {

        firmName: insp.customer_name || '',

        address: insp.address || '',

        isgKatipNo: '',

        sgkSicilNo: '',

        reportNo: insp.report_no || '',

        reportDate: insp.inspection_date || '',

        startEndTime: '',

        nextControlDate: fd.nextInspectionDate || '',

        serialCode: insp.serial_no || ''

    };



    const reportNo = insp.report_no || ci.reportNo || '';

    const formCode = insp.template_code || 'TKM-FR.318';

    let pagesArray = [];





    const isGrounding2202 = String(insp.template_id) === '2202';

    const isGenerator2205 = String(insp.template_id) === '2205';



    if (is2201) {
        pagesArray = buildPdfPages2201(insp, fd, ci, reportNo, formCode, activePdfTheme);
    } else if (isGrounding2202) {
        pagesArray = buildPdfPages2202(insp, fd, ci, reportNo, activePdfTheme);
    } else if (isGenerator2205) {
        pagesArray = buildPdfPages2205(insp, fd, ci, reportNo, activePdfTheme);
    } else {
        pagesArray = buildPdfPagesSpecialized(insp, fd, ci, reportNo, formCode, activePdfTheme);
    }


    updateThemeSelectorUI(activePdfTheme);

    const themeSelect = document.getElementById('pdfThemeSelect');
    if (themeSelect) themeSelect.value = activePdfTheme;

    // Populate Printable Container (for @media print)
    printArea.setAttribute('data-pdf-theme', activePdfTheme);
    printArea.innerHTML = pagesArray.map(p => `<div class="tkm-a4-page" data-pdf-theme="${activePdfTheme}">${p}</div>`).join('');

    if (customTarget && typeof Element !== 'undefined' && customTarget instanceof Element) {
        customTarget.setAttribute('data-pdf-theme', activePdfTheme);
        customTarget.innerHTML = printArea.innerHTML;
    }

    if (silentRender) {
        return;
    }

    // Populate On-Screen A4 Preview Modal
    const previewContainer = document.getElementById('a4PreviewPagesContainer');
    const previewModal = document.getElementById('a4PreviewModal');
    const previewTitle = document.getElementById('a4PreviewTitle');
    const previewSubtitle = document.getElementById('a4PreviewSubtitle');
    if (previewTitle) {
        previewTitle.textContent = `${reportNo || 'Rapor'} · ${insp.customer_name || 'Müşteri'}`;
    }
    if (previewSubtitle) {
        previewSubtitle.textContent = `${insp.equipment_name || 'Periyodik Kontrol'} (${pagesArray.length} Sayfa A4)`;
    }
    if (previewContainer) {
        previewContainer.setAttribute('data-pdf-theme', activePdfTheme);
        previewContainer.innerHTML = pagesArray.map(p => `<div class="tkm-a4-page tkm-preview-sheet" data-pdf-theme="${activePdfTheme}">${p}</div>`).join('');
    }

    if (previewModal && !directPrint) {

        previewModal.classList.remove('hidden');

        resetA4PreviewZoom();
    initA4PinchZoom();

    } else {

        triggerBrowserPrint();

    }

}


// ============================================================================
// HIZLI RAPOR - 10B-PDF-2201-ELECTRICAL.JS
// Açıklama: 2201 Elektrik İç Tesisatı (TKM-FR.318 / ZPKR02) Resmi A4 PDF Şablonu
// ============================================================================

function buildPdfPages2201(insp, fd, ci, reportNo, formCode, activePdfTheme) {





        const reportMainTitle = 'ELEKTRİK İÇ TESİSATI GÖZLE KONTROL VE FONKSİYON<br>TESTLERİ';

        const areas = AppState.electricalTemplate.areas.filter(a => a.topics && a.topics.length > 0);

        const area0 = areas[0]; // 2. EKİPMAN BİLGİLERİ

        const area1 = areas[1]; // 3. TERMAL KAMERA BİLGİLERİ

        const area2 = areas[2]; // 5. GÖZLE KONTROL KRİTERLERİ

        const area3 = areas[3]; // 6. FONKSİYON KONTROL KRİTERLERİ



        const renderOrderedGridTable = (questions, colsPerRow = 3) => {

            let colgroup = '';

            if (colsPerRow === 3) {

                colgroup = `

                    <colgroup>

                        <col style="width:19%;"><col style="width:14.3%;">

                        <col style="width:19%;"><col style="width:14.3%;">

                        <col style="width:19%;"><col style="width:14.4%;">

                    </colgroup>

                `;

            } else if (colsPerRow === 4) {

                colgroup = `

                    <colgroup>

                        <col style="width:14.5%;"><col style="width:10.5%;">

                        <col style="width:14.5%;"><col style="width:10.5%;">

                        <col style="width:14.5%;"><col style="width:10.5%;">

                        <col style="width:14.5%;"><col style="width:10.5%;">

                    </colgroup>

                `;

            } else {

                colgroup = `<colgroup><col style="width:50%;"><col style="width:50%;"></colgroup>`;

            }



            let html = `<table class="tkm-table">${colgroup}<tbody>`;

            for (let i = 0; i < questions.length; i += colsPerRow) {

                html += '<tr>';

                for (let c = 0; c < colsPerRow; c++) {

                    const q = questions[i + c];

                    if (q) {

                        const ans = fd.answers[`q_${q.guid}`] ?? SAMPLE_PDF_DEFAULTS[q.question] ?? '';

                        html += `

                            <td style="text-align:center;vertical-align:middle;font-weight:400;color:#111;">${q.question}</td>

                            <td style="text-align:left;vertical-align:middle;font-weight:400;padding-left:5px;color:#111;">${ans}</td>

                        `;

                    } else {

                        html += `<td></td><td></td>`;

                    }

                }

                html += '</tr>';

            }

            html += '</tbody></table>';

            return html;

        };



        // 3. Termal Kamera Table

        const tCamRows = fd.tableRows['topic_1_0'] || [];

        const tCamTopic = area1.topics[0];

        const tCamBody = tCamRows.length

            ? tCamRows.map(r => `

                <tr>${tCamTopic.questions.map((q, idx) => `<td style="text-align:${idx === 0 && (r[q.guid] || '').includes('Uygulaması Yok') ? 'left' : 'center'};">${r[q.guid] || ''}</td>`).join('')}</tr>

            `).join('')

            : `<tr><td style="text-align:left;">Uygulaması Yok</td><td></td><td></td><td></td><td></td></tr>`;



        // 4. Ölçüm Aletleri Table

        const devList = (fd.measuringDevices && fd.measuringDevices.length) ? fd.measuringDevices : [

            { name: '', serial: '', calDate: '', validDate: '', certNo: '' }

        ];

        const devRowsHtml = devList.map(d => `

            <tr>

                <td style="text-align:center;">${d.name || ''}</td>

                <td style="text-align:center;">${d.serial || ''}</td>

                <td style="text-align:center;">${d.calDate || ''}</td>

                <td style="text-align:center;">${d.validDate || ''}</td>

                <td style="text-align:center;">${d.certNo || ''}</td>

            </tr>

        `).join('');



        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const useRamsMinistryEnhanced2201 = isRamsTheme(activePdfTheme) && (window.RAMS_2201_ENHANCED_LAYOUT !== false);

        const renderRadioDotHtml = (selected, isBad = false) => {
            const bg = isBad ? '#ffffff' : (selected ? '#0f172a' : '#ffffff');
            const bd = isBad ? '#be123c' : '#0f172a';
            return `<span style="display:inline-block;width:6.8px;height:6.8px;border-radius:50%;border:1.1px solid ${bd};background:${bg};vertical-align:middle;margin-right:3.5px;box-sizing:border-box;"></span>`;
        };

        const getAns = (q) => {
            if (!q) return '';
            const raw = fd.answers[`q_${q.guid}`] ?? SAMPLE_PDF_DEFAULTS[q.question] ?? '';
            return String(raw).trim();
        };

        const renderRadioOptionsInline = (q, gapPx = '6px') => {
            if (!q) return '';
            const cur = getAns(q);
            const opts = Array.isArray(q.options) && q.options.length ? q.options : [];
            if (!opts.length) return escapeHtml(cur);
            const matchedAny = opts.some(opt => cur.toLowerCase() === String(opt).trim().toLowerCase());
            const itemsHtml = opts.map(opt => {
                const isSel = cur.toLowerCase() === String(opt).trim().toLowerCase();
                return `<span style="display:inline-flex;align-items:center;font-weight:${isSel ? '700' : '400'};color:${isSel ? '#0f172a' : '#334155'};white-space:nowrap;">${renderRadioDotHtml(isSel)}${escapeHtml(opt)}</span>`;
            }).join('');
            const extraCustom = (cur && !matchedAny) ? `<span style="font-weight:700;color:#0f172a;">(${escapeHtml(cur)})</span>` : '';
            return `<div style="display:flex;flex-wrap:wrap;gap:2px ${gapPx};align-items:center;">${itemsHtml}${extraCustom}</div>`;
        };

        const renderCompleteVisualTopicBlock = (subNumberTitle, questions, showHeaderRow = true, showLegendRow = true) => {
            const currentTheme = activePdfTheme;
            if (isRamsTheme(currentTheme)) {
                // Dual column (2-sütun) layout matching Ministry format!
                const mid = Math.ceil(questions.length / 2);
                let rowsHtml = '';
                for (let i = 0; i < mid; i++) {
                    const qL = questions[i];
                    const letterL = letters[i] || (i + 1);
                    const symL = formatSymbolForPrint(fd.answers[`q_${qL.guid}`] || '');
                    const badgeL = formatSymbolBadge(symL);
                    const badClsL = (useRamsMinistryEnhanced2201 && symL === 'X') ? ' class="tkm-cell-bad"' : '';

                    const rightIdx = i + mid;
                    const qR = rightIdx < questions.length ? questions[rightIdx] : null;
                    const letterR = qR ? (letters[rightIdx] || (rightIdx + 1)) : '';
                    const symR = qR ? formatSymbolForPrint(fd.answers[`q_${qR.guid}`] || '') : '';
                    const badgeR = qR ? formatSymbolBadge(symR) : '';
                    const badClsR = (useRamsMinistryEnhanced2201 && symR === 'X') ? ' class="tkm-cell-bad"' : '';

                    rowsHtml += `
                        <tr>
                            <td${badClsL} style="text-align:center;vertical-align:middle;font-weight:700;width:24px;">${letterL}</td>
                            <td${badClsL} style="text-align:left;vertical-align:middle;padding-left:4px;font-size:6.9pt;">${qL.question}</td>
                            <td${badClsL} style="text-align:center;vertical-align:middle;width:34px;border-right:1.5px solid #333333 !important;">${badgeL}</td>
                            ${qR ? `
                                <td${badClsR} style="text-align:center;vertical-align:middle;font-weight:700;width:24px;border-left:1.5px solid #333333 !important;">${letterR}</td>
                                <td${badClsR} style="text-align:left;vertical-align:middle;padding-left:4px;font-size:6.9pt;">${qR.question}</td>
                                <td${badClsR} style="text-align:center;vertical-align:middle;width:34px;">${badgeR}</td>
                            ` : `
                                <td style="vertical-align:middle;border-left:1.5px solid #333333 !important;"></td>
                                <td style="vertical-align:middle;"></td>
                                <td style="vertical-align:middle;"></td>
                            `}
                        </tr>
                    `;
                }

                const theadHtml = (!useRamsMinistryEnhanced2201 || showHeaderRow) ? `
                    <thead>
                        <tr>
                            <th style="vertical-align:middle;"></th>
                            <th style="text-align:left;vertical-align:middle;padding-left:4px;font-weight:700;">Soru / Kriter</th>
                            <th style="text-align:center;vertical-align:middle;font-weight:700;border-right:1.5px solid #333333 !important;">1</th>
                            <th style="vertical-align:middle;border-left:1.5px solid #333333 !important;"></th>
                            <th style="text-align:left;vertical-align:middle;padding-left:4px;font-weight:700;">Soru / Kriter</th>
                            <th style="text-align:center;vertical-align:middle;font-weight:700;">1</th>
                        </tr>
                    </thead>
                ` : '';

                const legendHtml = (!useRamsMinistryEnhanced2201 || showLegendRow)
                    ? `<div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>`
                    : '';

                return `
                    <div class="tkm-sub-bar">${subNumberTitle}</div>
                    <table class="tkm-table tkm-table-twocol">
                        <colgroup>
                            <col style="width:24px;">
                            <col style="width:42%;">
                            <col style="width:34px;">
                            <col style="width:24px;">
                            <col style="width:42%;">
                            <col style="width:34px;">
                        </colgroup>
                        ${theadHtml}
                        <tbody>${rowsHtml}</tbody>
                    </table>
                    ${legendHtml}
                `;
            }

            // CLASSIC THEME (100% UNCHANGED)
            const rowsHtml = questions.map((q, idx) => {
                const letter = letters[idx] || (idx + 1);
                const sym = formatSymbolForPrint(fd.answers[`q_${q.guid}`] || '');
                return `
                    <tr>
                        <td style="text-align:center;font-weight:700;">${letter}</td>
                        <td style="text-align:left;padding-left:6px;">${q.question}</td>
                        <td style="text-align:center;">${sym}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="tkm-sub-bar">${subNumberTitle}</div>
                <table class="tkm-table">
                    <colgroup>
                        <col style="width:28px;">
                        <col>
                        <col style="width:42px;">
                    </colgroup>
                    <thead>
                        <tr>
                            <th></th>
                            <th style="text-align:left;padding-left:6px;font-weight:700;">Soru / Kriter</th>
                            <th style="text-align:center;font-weight:700;">1</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>
            `;
        };



        // Build atomic, indivisible blocks so NO heading or table is EVER cut in half or orphaned!

        const blocks = [];



        // Block 1: 1. FİRMA BİLGİLERİ
        const docCodeBarHtml = isRamsTheme(activePdfTheme) ? '' : `
            <div style="display:flex;justify-content:flex-end;margin-bottom:3px;">
                <table style="border:1px solid #000000;font-size:6.7pt;border-collapse:collapse;background:#ffffff;">
                    <tr>
                        <td style="padding:1.5px 6px;font-weight:700;border:1px solid #000000;background:#f4f4f4;">Doküman Kodu</td>
                        <td style="padding:1.5px 6px;border:1px solid #000000;font-weight:600;">ZPKR02</td>
                        <td style="padding:1.5px 6px;font-weight:700;border:1px solid #000000;background:#f4f4f4;">Yürürlük Tarihi</td>
                        <td style="padding:1.5px 6px;border:1px solid #000000;">01.09.2025</td>
                    </tr>
                </table>
            </div>
        `;

        const lblCls1 = useRamsMinistryEnhanced2201 ? ' class="tkm-label-cell"' : '';
        const valCls1 = useRamsMinistryEnhanced2201 ? ' class="tkm-val-cell"' : '';

        blocks.push(`
            ${docCodeBarHtml}
            <div class="tkm-sec-title">1. FİRMA BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:19%;">

                    <col style="width:36%;">

                    <col style="width:17%;">

                    <col style="width:28%;">

                </colgroup>

                <tbody>

                    <tr>

                        <td${lblCls1} style="font-weight:700;">Firma Adı</td>

                        <td${valCls1} colspan="3">${ci.firmName}</td>

                    </tr>

                    <tr>

                        <td${lblCls1} style="font-weight:700;">Periyodik Kontrol Adresi</td>

                        <td${valCls1} colspan="3">${ci.address}</td>

                    </tr>

                    <tr>

                        <td${lblCls1} style="font-weight:700;">İSG-KATİP Sözleşme ID</td>

                        <td${valCls1}>${ci.isgKatipNo}</td>

                        <td${lblCls1} style="font-weight:700;">SGK Sicil Numarası</td>

                        <td${valCls1}>${ci.sgkSicilNo}</td>

                    </tr>

                    <tr>

                        <td${lblCls1} style="font-weight:700;">Rapor Numarası</td>

                        <td${valCls1}>${reportNo}</td>

                        <td${lblCls1} style="font-weight:700;">Rapor Tarihi</td>

                        <td${valCls1}>${insp.inspection_date || ci.reportDate}</td>

                    </tr>

                    <tr>

                        <td${lblCls1} style="font-weight:700;">Periyodik Kontrol Başlangıç ve<br>Bitiş Tarih ve Saati</td>

                        <td${valCls1}>${ci.startEndTime}</td>

                        <td${lblCls1} style="font-weight:700;">Bir Sonraki Periyodik<br>Kontrol Tarihi</td>

                        <td${valCls1}>${fd.nextInspectionDate || ci.nextControlDate}</td>

                    </tr>

                    <tr>

                        <td${lblCls1} style="font-weight:700;">Rapor / Ekipman Adı</td>

                        <td${valCls1}>${insp.equipment_name || ci.equipmentName || 'Elektrik İç Tesisatı'}</td>

                        <td${lblCls1} style="font-weight:700;">Ekipman Seri No / Kod</td>

                        <td${valCls1}>${ci.serialCode || insp.serial_no || ''}</td>

                    </tr>

                    <tr>

                        <td${lblCls1} style="font-weight:700;">Periyodik Kontrol Metodu ve<br>Kapsamı</td>

                        <td colspan="3" style="line-height:1.22;">

                            • TS HD 60364-4-43 Alçak Gerilim Elektrik Tesisatları- Bölüm 4: Güvenlik İçin Koruma Grup 43 - Aşırı Akıma Karşı Koruma<br>
                            • TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama<br>
                            • İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği<br>
                            • Elektrik İç Tesisleri Yönetmeliği<br>
                            • Elektrik Tesislerinde Topraklamalar Yönetmeliği

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 2: 2. EKİPMAN BİLGİLERİ + 2.1. DETAY BİLGİLER
        const sec21Questions = area0.topics[0].questions || [];
        const renderMinistrySec21Table = () => {
            const q = sec21Questions;
            const qPhase = q[10];
            const curPhase = getAns(qPhase);
            const aaOpts = ['AA(1 faz-2 tel)', 'AA(1 faz-3 tel)', 'AA(2 faz-3 tel)', 'AA(3 faz-3 tel)', 'AA(3 faz-4 tel)'];
            const daOpts = ['DA(2 kutup)', 'DA(3 kutup)', 'DA(Diğer)'];
            const isAAGroup = curPhase.toUpperCase().startsWith('AA');
            const isDAGroup = curPhase.toUpperCase().startsWith('DA');

            const renderPhaseCol = (groupTitle, isGroupSelected, list) => `
                <div style="display:flex;flex-wrap:wrap;gap:3px 6px;align-items:center;">
                    <span style="font-weight:700;color:#0f172a;font-size:7.3pt;margin-right:2px;white-space:nowrap;">
                        ${renderRadioDotHtml(isGroupSelected)}${groupTitle}:
                    </span>
                    ${list.map(opt => {
                        const sel = curPhase.toLowerCase() === opt.toLowerCase();
                        return `<span style="display:inline-flex;align-items:center;font-size:7.1pt;font-weight:${sel ? '700' : '400'};color:${sel ? '#0f172a' : '#334155'};white-space:nowrap;">${renderRadioDotHtml(sel)}${escapeHtml(opt)}</span>`;
                    }).join('')}
                </div>
            `;

            const lblStyle = 'text-align:left;padding:2px 4px;line-height:1.18;font-size:7.3pt;vertical-align:middle;';
            const valStyle = 'text-align:left;padding:2px 4px;line-height:1.18;font-size:7.5pt;vertical-align:middle;';

            return `
                <table class="tkm-table">
                    <colgroup>
                        <col style="width:21%;">
                        <col style="width:29%;">
                        <col style="width:22%;">
                        <col style="width:28%;">
                    </colgroup>
                    <tbody>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[0] ? q[0].question : 'Enerji sağlayan kuruluş'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[0]))}</td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[1] ? q[1].question : 'Şebeke tipi'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${renderRadioOptionsInline(q[1], '6px')}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[2] ? q[2].question : 'Şebeke gerilimi (V)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[2]))}</td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[5] ? q[5].question : 'Kontrol nedeni'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${renderRadioOptionsInline(q[5], '8px')}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[3] ? q[3].question : 'Tesise ait proje var mı?'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${renderRadioOptionsInline(q[3], '10px')}</td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[4] ? q[4].question : 'Tek hat şeması var mı?'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${renderRadioOptionsInline(q[4], '10px')}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[7] ? q[7].question : 'Yapı cinsi'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${renderRadioOptionsInline(q[7], '6px')}</td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[6] ? q[6].question : 'Topraklayıcı tipi'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${renderRadioOptionsInline(q[6], '6px')}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[8] ? q[8].question : 'Ekipmanın kullanım amacı'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[8]))}</td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[9] ? q[9].question : 'Son kontrol tarihi'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[9]))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" rowspan="5" style="${lblStyle}">
                                ${qPhase ? qPhase.question : 'Faz iletkenlerinin sayısı ve tipi'}
                            </td>
                            <td class="tkm-val-cell" rowspan="5" style="${valStyle}">
                                <div style="display:flex;flex-direction:column;gap:3px;">
                                    ${renderPhaseCol('AA', isAAGroup, aaOpts)}
                                    <div style="border-top:1px dashed #cbd5e1;padding-top:2px;">
                                        ${renderPhaseCol('DA', isDAGroup, daOpts)}
                                    </div>
                                </div>
                            </td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[11] ? q[11].question : 'Temel topraklama direnci (Ω)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[11]))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[12] ? q[12].question : 'İlave topraklama elektrotu detayları(varsa)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[12]))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[13] ? q[13].question : 'Sistem topraklama iletkeni ve kesiti (mm²)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[13]))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[14] ? q[14].question : 'Ana eşpotansiyel iletkeni ve kesiti (mm²)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[14]))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[19] ? q[19].question : 'Ana kesici karakteristikleri-Tip'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[19]))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[15] ? q[15].question : 'Besleme kaynağı karakteristikleri-Nominal gerilim, U/Uo (kV)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[15]))}</td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[20] ? q[20].question : 'Ana kesici karakteristikleri-Nominal akım (A)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[20]))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[16] ? q[16].question : 'Besleme kaynağı karakteristikleri-Nominal frekans, f (Hz)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[16]))}</td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[21] ? q[21].question : 'TT/TN-S Şebeke için ana RCD anma akımı (A)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[21]))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[17] ? q[17].question : 'Besleme kaynağı karakteristikleri-Hata akımı olasılığı, IF (kA)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[17]))}</td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[22] ? q[22].question : 'TT/TN-S Şebeke için ana RCD açma akımı (mA)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[22]))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[18] ? q[18].question : 'Besleme kaynağı karakteristikleri-Dış çevrim empedansı ZE (Ω)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[18]))}</td>
                            <td class="tkm-label-cell" style="${lblStyle}">${q[23] ? q[23].question : 'TT/TN-S Şebeke için ana RCD açma zamanı (ms)'}</td>
                            <td class="tkm-val-cell" style="${valStyle}">${escapeHtml(getAns(q[23]))}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        };

        blocks.push(`

            <div class="tkm-sec-title">2. EKİPMAN BİLGİLERİ</div>

            <div class="tkm-sub-bar">2.1. DETAY BİLGİLER</div>

            ${useRamsMinistryEnhanced2201 ? renderMinistrySec21Table() : renderOrderedGridTable(area0.topics[0].questions, 3)}

        `);



        // Block 3: 2.2. TESPİT EDİLEN BİLGİLER
        const sec22Questions = area0.topics[1].questions || [];
        const renderMinistrySec22Table = () => {
            const dotHtml = (selected, isBad = false) => {
                const bg = isBad ? '#ffffff' : (selected ? '#0f172a' : '#ffffff');
                const bd = isBad ? '#be123c' : '#0f172a';
                const inner = isBad ? '' : '';
                return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;border:1.1px solid ${bd};background:${bg};vertical-align:middle;margin-right:4px;box-sizing:border-box;">${inner}</span>`;
            };
            const optPairHtml = (guid, optA, optB) => {
                const cur = String(fd.answers[`q_${guid}`] || '').trim();
                const selA = cur === optA;
                const selB = cur === optB;
                return `
                    <span style="display:inline-flex;align-items:center;margin-right:16px;font-weight:${selA ? '700' : '400'};color:#111;">${dotHtml(selA)}${optA}</span>
                    <span style="display:inline-flex;align-items:center;font-weight:${selB ? '700' : '400'};color:#111;">${dotHtml(selB)}${optB}</span>
                `;
            };

            const qChange = sec22Questions[0];
            const qSpd = sec22Questions[1];
            const qPrevTag = sec22Questions[2];
            const protectionQs = sec22Questions.slice(3);

            const protectionRowsHtml = protectionQs.map(q => {
                const cur = String(fd.answers[`q_${q.guid}`] || '').trim();
                const isSelected = (cur === 'Var' || cur === 'Uygun');
                const isBad = (cur === 'Uygunsuz' || cur === 'Uygun Değil');
                const shortTxt = String(q.question || '').replace(/^Tespit edilen bilgiler\s*\([^)]*\)\s*-\s*/i, '').trim();
                return `
                    <div style="display:flex;align-items:flex-start;gap:4px;line-height:1.15;margin-bottom:0.5px;">
                        <span style="flex-shrink:0;margin-top:2px;">${dotHtml(isSelected, isBad)}</span>
                        <span style="font-weight:${(isSelected || isBad) ? '700' : '400'};color:${isBad ? '#be123c' : '#111'};">
                            ${shortTxt}${isBad ? ' <span style="color:#be123c;font-weight:700;">(Uygunsuz)</span>' : ''}
                        </span>
                    </div>
                `;
            }).join('');

            return `
                <table class="tkm-table">
                    <colgroup>
                        <col style="width:43%;">
                        <col style="width:57%;">
                    </colgroup>
                    <tbody>
                        <tr>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 4px;line-height:1.15;font-weight:600;color:#111;">${qChange ? qChange.question : 'Tesisatta kapsamlı değişiklik var mı? (&gt;%20)'}</td>
                            <td class="tkm-val-cell" style="text-align:left;padding:2px 4px;line-height:1.15;">${qChange ? optPairHtml(qChange.guid, 'Var', 'Yok') : ''}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 4px;line-height:1.15;font-weight:600;color:#111;">${qSpd ? qSpd.question : 'Tesisatta aşırı gerilim koruma cihazları (DKD/SPD) kullanılmış mı?'}</td>
                            <td class="tkm-val-cell" style="text-align:left;padding:2px 4px;line-height:1.15;">${qSpd ? optPairHtml(qSpd.guid, 'Evet', 'Hayır') : ''}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 4px;line-height:1.15;font-weight:600;vertical-align:middle;color:#111;">
                                Tespit edilen bilgiler<br>(Doğrudan dokunmaya karşı koruma önlemleri)
                            </td>
                            <td class="tkm-val-cell" style="text-align:left;padding:2px 4px;line-height:1.15;font-size:6.8pt;">
                                ${protectionRowsHtml}
                            </td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 4px;line-height:1.15;font-weight:600;color:#111;">${qPrevTag ? qPrevTag.question : 'Bir önceki periyodik kontrol etiketi var mı?'}</td>
                            <td class="tkm-val-cell" style="text-align:left;padding:2px 4px;line-height:1.15;">${qPrevTag ? optPairHtml(qPrevTag.guid, 'Var', 'Yok') : ''}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        };

        blocks.push(`

            <div class="tkm-sub-bar">2.2. TESPİT EDİLEN BİLGİLER</div>

            ${isRamsTheme(activePdfTheme) ? renderMinistrySec22Table() : renderOrderedGridTable(sec22Questions, 3)}

        `);



        // Block 4: 3. TERMAL KAMERA BİLGİLERİ (RAMS formatında 3, 4 ve 5. bölümler 2. sayfada yer alır)

        blocks.push(`
            ${isRamsTheme(activePdfTheme) ? '<div class="tkm-force-page-break" style="display:none;"></div>' : ''}

            <div class="tkm-sec-title">3. TERMAL KAMERA BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:20%;"><col style="width:18%;"><col style="width:20%;"><col style="width:22%;"><col style="width:20%;">

                </colgroup>

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Cihaz Adı</th>

                        <th style="text-align:center;font-weight:700;">Seri Numarası</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Numarası</th>

                    </tr>

                </thead>

                <tbody>${tCamBody}</tbody>

            </table>

        `);



        // Block 5: 4. ÖLÇÜM ALETLERİ BİLGİLERİ

        blocks.push(`

            <div class="tkm-sec-title">4. ÖLÇÜM ALETLERİ BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:24%;"><col style="width:17%;"><col style="width:19%;"><col style="width:21%;"><col style="width:19%;">

                </colgroup>

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Cihaz Adı</th>

                        <th style="text-align:center;font-weight:700;">Seri Numarası</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Numarası</th>

                    </tr>

                </thead>

                <tbody>${devRowsHtml}</tbody>

            </table>

        `);



        // Block 6: 5. TEST VE KONTROLLER Title + 5.1. PANO ADI/EKİPMAN TANIMLAMASI
        const qPano51 = area2.topics[0].questions[0];
        const sec51TableHtml = useRamsMinistryEnhanced2201 ? `
            <table class="tkm-table">
                <colgroup><col style="width:32%;"><col style="width:68%;"></colgroup>
                <tbody>
                    <tr>
                        <td class="tkm-label-cell" style="text-align:left;padding:2px 6px;">${qPano51 ? qPano51.question : 'Pano Adı/Ekipman Tanımlaması'}</td>
                        <td class="tkm-val-cell" style="text-align:left;padding:2px 6px;">${escapeHtml(getAns(qPano51))}</td>
                    </tr>
                </tbody>
            </table>
        ` : renderOrderedGridTable(area2.topics[0].questions, 1);

        blocks.push(`
            ${!isRamsTheme(activePdfTheme) ? '<div class="tkm-force-page-break" style="display:none;"></div>' : ''}
            <div class="tkm-sec-title" style="text-align:left;font-size:8.4pt;color:#111111;font-weight:700;letter-spacing:0.2px;padding:2px 0;margin:2px 0;">TEST VE KONTROLLER</div>
            <div class="tkm-sec-title">5. KONTROL KRİTERLERİ VE TESTLER</div>

            <div class="tkm-sub-bar">5.1. ${area2.topics[0].name}</div>

            ${sec51TableHtml}

        `);



        // Blocks for 5.2 through 5.8
        const visualTopics = area2.topics.slice(1);
        visualTopics.forEach((t, idx) => {
            const isFirstVisual = (idx === 0);
            const isLastVisual = (idx === visualTopics.length - 1);
            let blockHtml = renderCompleteVisualTopicBlock(`5.${idx + 2}. ${t.name}`, t.questions, isFirstVisual, isLastVisual);
            if (isLastVisual) {
                blockHtml += `
                    <div style="font-size:6.8pt;color:#333333;font-style:italic;margin-top:2px;padding:2px 4px;">
                        Pano/Ekipman sayısı fazla olan tesislerde birden fazla form kullanılmalıdır.
                    </div>
                `;
            }
            blocks.push(blockHtml);
        });



        // Block for 6. FONKSİYON KONTROL KRİTERLERİ VE TESTLER
        // Rams formatında 6. Başlık 3. sayfadan başlar!
        const sec6Break = isRamsTheme(activePdfTheme) ? '<div class="tkm-force-page-break" style="display:none;"></div>' : '';

        const renderMinistrySec6TopHtml = () => {
            const qMethod = area3.topics[0].questions[0];
            const qPano61 = area3.topics[1].questions[0];
            const q61 = area3.topics[2].questions || [];
            // q61[0]: Zx, q61[1]: ZLN, q61[2]: IK3, q61[3]: DKD tipi, q61[4]: F-F, q61[5]: L-N, q61[6]: N-PE, q61[7]: DKD dayanma akımı
            const cellValAndCls = (quest) => {
                const v = getAns(quest);
                const isX = v.toLowerCase() === 'x';
                return {
                    val: escapeHtml(v),
                    cls: isX ? 'tkm-val-cell tkm-cell-bad' : 'tkm-val-cell'
                };
            };
            const cZx = cellValAndCls(q61[0]);
            const cZln = cellValAndCls(q61[1]);
            const cIk3 = cellValAndCls(q61[2]);
            const cFF = cellValAndCls(q61[4]);
            const cLN = cellValAndCls(q61[5]);
            const cNPE = cellValAndCls(q61[6]);
            const cDkdKa = cellValAndCls(q61[7]);

            return `
                <div class="tkm-sub-bar">Ölçüm ve Doğrulama Metodu</div>
                <table class="tkm-table" style="margin-bottom:2px;">
                    <tbody>
                        <tr>
                            <td class="tkm-val-cell" style="text-align:left;padding:2.5px 6px;font-size:7.4pt;">${renderRadioOptionsInline(qMethod, '18px')}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="tkm-sub-bar">6.1. ${area3.topics[2].name}</div>
                <table class="tkm-table" style="margin-bottom:2px;">
                    <colgroup>
                        <col style="width:25%;">
                        <col style="width:11%;">
                        <col style="width:16%;">
                        <col style="width:11%;">
                        <col style="width:22%;">
                        <col style="width:15%;">
                    </colgroup>
                    <tbody>
                        <tr>
                            <td class="tkm-label-cell" style="text-align:left;padding:2.5px 6px;">${qPano61 ? qPano61.question : 'Pano (Ekipman) Adı-Etiketi veya Kodu'}</td>
                            <td class="tkm-val-cell" colspan="5" style="text-align:left;padding:2.5px 6px;">${escapeHtml(getAns(qPano61))}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 5px;">${q61[0] ? q61[0].question : 'Panodan ölçülen faz-toprak çevrim empedansı (Zx) (Ω)'}</td>
                            <td class="${cZx.cls}" style="text-align:center;padding:2px 4px;">${cZx.val}</td>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 5px;">${q61[4] ? q61[4].question : 'Gerilimler F-F(V)'}</td>
                            <td class="${cFF.cls}" style="text-align:center;padding:2px 4px;">${cFF.val}</td>
                            <td class="tkm-label-cell" rowspan="2" style="text-align:left;padding:2px 5px;vertical-align:middle;">${q61[3] ? q61[3].question : 'Aşırı gerilim koruma (DKD) tipi'}</td>
                            <td class="tkm-val-cell" rowspan="2" style="text-align:left;padding:2px 5px;vertical-align:middle;font-size:6.8pt;line-height:1.3;">${renderRadioOptionsInline(q61[3], '6px')}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 5px;">${q61[1] ? q61[1].question : 'Panodan ölçülen faz-nötr çevrim empedansı (ZLN) (Ω)'}</td>
                            <td class="${cZln.cls}" style="text-align:center;padding:2px 4px;">${cZln.val}</td>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 5px;">${q61[5] ? q61[5].question : 'Gerilimler L-N(V)'}</td>
                            <td class="${cLN.cls}" style="text-align:center;padding:2px 4px;">${cLN.val}</td>
                        </tr>
                        <tr>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 5px;">${q61[2] ? q61[2].question : 'Hesaplanan 3 fazlı kısa devre akımı (kA)'}</td>
                            <td class="${cIk3.cls}" style="text-align:center;padding:2px 4px;">${cIk3.val}</td>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 5px;">${q61[6] ? q61[6].question : 'Gerilimler N-PE(V)'}</td>
                            <td class="${cNPE.cls}" style="text-align:center;padding:2px 4px;">${cNPE.val}</td>
                            <td class="tkm-label-cell" style="text-align:left;padding:2px 5px;">${q61[7] ? q61[7].question : 'Aşırı gerilim koruma (DKD) dayanma akımı (kA)'}</td>
                            <td class="${cDkdKa.cls}" style="text-align:center;padding:2px 4px;">${cDkdKa.val}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        };

        blocks.push(`
            ${sec6Break}
            <div class="tkm-sec-title">6. FONKSİYON KONTROL KRİTERLERİ VE TESTLER</div>
            ${useRamsMinistryEnhanced2201 ? renderMinistrySec6TopHtml() : `
                <div class="tkm-sub-bar">Ölçüm ve Doğrulama Metodu</div>
                ${renderOrderedGridTable(area3.topics[0].questions, 1)}
                <div class="tkm-sub-bar">6.1. ${area3.topics[2].name}</div>
                <div style="margin-bottom:2px;">
                    ${renderOrderedGridTable(area3.topics[1].questions, 1)}
                </div>
                ${renderOrderedGridTable(area3.topics[2].questions, 4)}
            `}
        `);

        // Helper to push multi-row tables (6.1 Linye, 6.2 Potansiyel Dengeleme, 6.3 Zemin İzolasyonu)
        const pushMultiRowTopicBlocks = (topic, tKey, subTitle, isLastSec6Topic = false) => {
            const allRows = (fd.tableRows[tKey] && fd.tableRows[tKey].length)
                ? fd.tableRows[tKey]
                : [createDefaultTopicRow(area3, topic, 1)];
            const chunkSize = 8;

            const topicColWidths = tKey === 'topic_3_3'
                ? (useRamsMinistryEnhanced2201
                    ? ['4.0%', '22.0%', '6.2%', '5.4%', '6.0%', '6.6%', '6.0%', '6.2%', '6.8%', '6.4%', '6.4%', '6.0%', '6.0%', '6.0%']
                    : ['2.7%', '14.5%', '7.6%', '5.6%', '7.6%', '8.4%', '6.8%', '7.0%', '7.6%', '7.4%', '7.4%', '6.4%', '6.4%', '4.6%'])
                : tKey === 'topic_3_4'
                    ? ['3.5%', '25.5%', '14.5%', '14.5%', '18.5%', '16.5%', '7.0%']
                    : tKey === 'topic_3_5'
                        ? ['3.5%', '38.5%', '11.5%', '11.5%', '27.0%', '8.0%']
                        : null;

            const colGroupHtml = (topicColWidths && topicColWidths.length === topic.questions.length + 1)
                ? `<colgroup>${topicColWidths.map(w => `<col style="width:${w};">`).join('')}</colgroup>`
                : '';

            const formatPdfTopicHdr = (q) => {
                let hdr = getShortTopicQuestionLabel(3, topic.index, q.question);
                if (tKey === 'topic_3_3') {
                    if (hdr === 'Pano / Linye Tanımı') return 'Pano / Tablo<br>Linye Adı';
                    if (hdr === 'Sonuç / Değerlendirme') return 'Sonuç';
                }
                return hdr;
            };

            const tableCls = tKey === 'topic_3_3' ? 'tkm-table tkm-linye-table' : 'tkm-table';
            const thNoStyle = topicColWidths
                ? 'text-align:center;font-weight:700;word-break:keep-all;overflow-wrap:normal;'
                : 'width:24px;text-align:center;font-weight:700;font-size:7pt;';
            const thDefaultStyle = tKey === 'topic_3_3'
                ? 'text-align:center;font-weight:700;word-break:keep-all;overflow-wrap:normal;'
                : 'text-align:center;font-weight:700;font-size:6.8pt;line-height:1.18;padding:2.8px 3px;';

            const buildTableHeadHtml = () => {
                if (useRamsMinistryEnhanced2201 && tKey === 'topic_3_3') {
                    // 2-tier grouped Ministry header with 100% unabridged Ministry terminology
                    return `
                        <thead>
                            <tr>
                                <th rowspan="2" style="${thNoStyle}vertical-align:middle;">No</th>
                                <th rowspan="2" style="${thDefaultStyle}vertical-align:middle;">Pano/Tablo numarası-<br>Linye Adı-Etiketi</th>
                                <th colspan="4" class="tkm-linye-group-th" style="text-align:center;">Aşırı Akım Koruma Cihazının</th>
                                <th colspan="5" class="tkm-linye-group-th" style="text-align:center;">İletkenin</th>
                                <th colspan="2" class="tkm-linye-group-th" style="text-align:center;">RCD Testi</th>
                                <th rowspan="2" style="${thDefaultStyle}vertical-align:middle;">Sonuç</th>
                            </tr>
                            <tr>
                                <th style="${thDefaultStyle}">Açma eğrisi tipi</th>
                                <th style="${thDefaultStyle}">Kutup sayısı</th>
                                <th style="${thDefaultStyle}">Nominal akımı<br>In (A)</th>
                                <th style="${thDefaultStyle}">Kısa devre kesme<br>akımı Icu (kA)</th>
                                <th style="${thDefaultStyle}">Faz kesiti<br>(mm²)</th>
                                <th style="${thDefaultStyle}">N/PEN Kesiti<br>(mm²)</th>
                                <th style="${thDefaultStyle}">PE Koruma iletkeni<br>kesiti (mm²)</th>
                                <th style="${thDefaultStyle}">Ib Yük/Tasarım<br>akımı (A)</th>
                                <th style="${thDefaultStyle}">Iz Akım taşıma<br>kapasitesi (A)</th>
                                <th style="${thDefaultStyle}">IΔ (mA)</th>
                                <th style="${thDefaultStyle}">TΔ (ms)</th>
                            </tr>
                        </thead>
                    `;
                }
                const ths = topic.questions.map(q => {
                    const hdr = formatPdfTopicHdr(q);
                    return `<th style="${thDefaultStyle}">${hdr}</th>`;
                }).join('');
                return `
                    <thead>
                        <tr>
                            <th style="${thNoStyle}">No</th>
                            ${ths}
                        </tr>
                    </thead>
                `;
            };

            const theadFullHtml = buildTableHeadHtml();

            for (let start = 0; start < allRows.length; start += chunkSize) {
                const slice = allRows.slice(start, start + chunkSize);
                const trs = slice.map((r, idx) => {
                    const lastQ = topic.questions[topic.questions.length - 1];
                    const rowResultSym = (lastQ && lastQ.type === 'YesNo') ? formatSymbolForPrint(r[lastQ.guid] || '') : '';
                    const isBadRow = useRamsMinistryEnhanced2201 && rowResultSym === 'X';
                    const trCls = isBadRow ? ' class="tkm-row-bad"' : '';

                    return `
                        <tr${trCls}>
                            <td style="text-align:center;">${start + idx + 1}</td>
                            ${topic.questions.map((q, qIdx) => {
                                const cellAlign = (qIdx === 0 && (tKey === 'topic_3_3' || tKey === 'topic_3_4' || tKey === 'topic_3_5')) ? 'left' : 'center';
                                const rawVal = r[q.guid] ?? '';
                                if (q.type === 'YesNo') {
                                    const sym = formatSymbolForPrint(rawVal);
                                    const out = useRamsMinistryEnhanced2201 ? formatSymbolBadge(sym) : sym;
                                    return `<td style="text-align:${cellAlign};font-size:7.1pt;">${out}</td>`;
                                }
                                const strVal = String(rawVal).trim();
                                const isXCell = useRamsMinistryEnhanced2201 && strVal.toLowerCase() === 'x';
                                const tdCls = isXCell ? ' class="tkm-cell-bad"' : '';
                                return `<td${tdCls} style="text-align:${cellAlign};font-size:7.1pt;">${escapeHtml(strVal)}</td>`;
                            }).join('')}
                        </tr>
                    `;
                }).join('');
                const chunkTitle = start === 0 ? subTitle : `${subTitle} (Devamı)`;
                const isFinalChunk = (start + chunkSize >= allRows.length);
                const footNoteHtml = (isLastSec6Topic && isFinalChunk) ? `
                    <div style="font-size:6.8pt;color:#333333;font-style:italic;margin-top:2px;padding:2px 4px;">
                        Nokta sayısı fazla olan tesislerde birden fazla form kullanılabilir. Ya da formun sadece 6. Bölümü çoğaltılabilir.
                    </div>
                ` : '';

                blocks.push(`
                    <div class="tkm-sub-bar">${chunkTitle}</div>
                    <table class="${tableCls}">
                        ${colGroupHtml}
                        ${theadFullHtml}
                        <tbody>${trs}</tbody>
                    </table>
                    <div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>
                    ${footNoteHtml}
                `);
            }
        };

        // 6.1 Linye Ölçüm ve Test Tablosu
        pushMultiRowTopicBlocks(area3.topics[3], 'topic_3_3', '6.1. Linye Ölçüm ve Test Tablosu');

        // 6.2 Potansiyel Dengeleme İletkenleri Kontrolü (Bakanlık 6.2)
        pushMultiRowTopicBlocks(area3.topics[4], 'topic_3_4', '6.2. ' + area3.topics[4].name);

        // 6.3 Zemin İzolasyonunun Kontrolü (Bakanlık 6.3)
        pushMultiRowTopicBlocks(area3.topics[5], 'topic_3_5', '6.3. ' + area3.topics[5].name, true);

        // Block for 7. KUSUR AÇIKLAMALARI
        const rawDefectNotes = (fd.defectNotes || 'Kusur tespiti bulunmamaktadır.').trim();
        const renderRamsDefectNotesContent = () => {
            if (!rawDefectNotes || rawDefectNotes === 'Kusur tespiti bulunmamaktadır.') {
                return `<div style="color:#14573a;font-weight:700;font-size:7.3pt;">✓ Kusur tespiti bulunmamaktadır.</div>`;
            }
            const lines = rawDefectNotes.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            return lines.map(line => {
                const isHeavy = line.includes('**');
                const isLight = !isHeavy && line.includes('*');
                const badge = isHeavy
                    ? `<span style="display:inline-block;padding:0.5px 4px;margin-right:5px;border-radius:3px;background:#fdecea;border:1px solid #f5c2c7;color:#7a1812;font-weight:800;font-size:6.3pt;">AĞIR KUSUR (**)</span>`
                    : isLight
                        ? `<span style="display:inline-block;padding:0.5px 4px;margin-right:5px;border-radius:3px;background:#fef3c7;border:1px solid #fde68a;color:#92400e;font-weight:800;font-size:6.3pt;">HAFİF KUSUR (*)</span>`
                        : '';
                return `<div style="padding:1.5px 0;border-bottom:1px dashed #e2e8f0;line-height:1.28;color:${isHeavy ? '#7a1812' : '#0f172a'};font-weight:${isHeavy ? '700' : '500'};">${badge}${escapeHtml(line)}</div>`;
            }).join('');
        };

        blocks.push(`
            <div class="tkm-sec-title">7. KUSUR AÇIKLAMALARI</div>
            <table class="tkm-table ${useRamsMinistryEnhanced2201 ? 'tkm-defect-notes-box' : ''}">
                <tbody>
                    <tr>
                        <td style="min-height:22px;height:24px;vertical-align:top;text-align:left;padding:3.5px 6px;">
                            ${useRamsMinistryEnhanced2201 ? renderRamsDefectNotesContent() : escapeHtml(rawDefectNotes).replace(/\n/g, '<br>')}
                        </td>
                    </tr>
                </tbody>
            </table>
            <div style="font-size:6.8pt;color:#222222;font-weight:600;padding:2.5px 6px;margin-top:2px;background:#ffffff;border:1px solid ${useRamsMinistryEnhanced2201 ? '#cbd5e1' : '#000000'};border-radius:2px;line-height:1.25;">
                Kusur derecesi “*” hafif kusurlu ve “**” ağır kusurlu anlamında kullanılmaktadır. Değerlendirme “Uygun”, “Uygun Değil” ve “Uygulanamaz” olarak yapılmıştır.
            </div>
        `);

        // Block 8: 8. EKİPMAN FOTOĞRAFLARI (Bakanlık Formatı: SABİT 8. BÖLÜM - Asla silinmez / kaydırılmaz)
        const validPhotos = (fd.photos || []).filter(p => {
            if (!p) return false;
            if (typeof p === 'string') return p.length > 10;
            return Boolean(p.dataUrl || p.data || p.url);
        });

        if (validPhotos.length > 0) {
            let photoRowsHtml = '';

            const getSrc = (item) => {
                if (!item) return '';
                if (typeof item === 'string') return item;
                return item.dataUrl || item.data || item.url || '';
            };

            const getCaption = (item, photoNum) => {
                if (!item) return '';
                let text = (item.description || item.caption || '').trim();
                if (!text) return '';
                const lower = text.toLowerCase();
                if (lower === `fotoğraf ${photoNum}`.toLowerCase() ||
                    lower.includes('ana dağıtım') ||
                    lower === 'adp' ||
                    lower.includes('termal kamera')) {
                    return '';
                }
                return text;
            };

            const renderPhotoCell = (src, photoNum, caption, widthPct) => `
                <td style="${widthPct ? `width:${widthPct};` : ''}text-align:center;padding:5px 6px;vertical-align:top;background:#ffffff;">
                    <!-- Fotoğraf Üstü: Sadece Fotoğraf 1, 2, 3... -->
                    <div style="font-weight:700;font-size:7.5pt;margin-bottom:4px;color:#111;">Fotoğraf ${photoNum}</div>
                    <!-- Fotoğraf Görseli -->
                    <div style="display:flex;align-items:center;justify-content:center;height:145px;overflow:hidden;background:#ffffff;border:1px solid #e2e8f0;">
                        <img src="${src}" alt="Fotoğraf ${photoNum}" style="max-height:145px;max-width:100%;object-fit:contain;display:block;margin:0 auto;">
                    </div>
                    <!-- Fotoğraf Altı: Kullanıcı Açıklaması / Tespit (Varsa) -->
                    ${caption ? `
                        <div style="font-size:7pt;color:#222222;margin-top:3px;padding:2px 4px;text-align:center;font-style:italic;line-height:1.25;background:#ffffff;border-top:1px solid #e2e8f0;">
                            ${escapeHtml(caption)}
                        </div>
                    ` : ''}
                </td>
            `;

            for (let i = 0; i < validPhotos.length; i += 2) {
                const p1 = validPhotos[i];
                const p2 = validPhotos[i + 1] || null;

                const photoNum1 = i + 1;
                const src1 = getSrc(p1);
                const caption1 = getCaption(p1, photoNum1);

                if (p2) {
                    const photoNum2 = i + 2;
                    const src2 = getSrc(p2);
                    const caption2 = getCaption(p2, photoNum2);

                    photoRowsHtml += `
                        <tr>
                            ${renderPhotoCell(src1, photoNum1, caption1, '50%')}
                            ${renderPhotoCell(src2, photoNum2, caption2, '50%')}
                        </tr>
                    `;
                } else {
                    photoRowsHtml += `
                        <tr>
                            ${renderPhotoCell(src1, photoNum1, caption1, null)}
                        </tr>
                    `;
                }
            }

            blocks.push(`
                <div class="tkm-sec-title">8. EKİPMAN FOTOĞRAFLARI</div>
                <table class="tkm-table" style="table-layout:fixed;background:#ffffff;">
                    <tbody>
                        ${photoRowsHtml}
                    </tbody>
                </table>
            `);
        } else {
            blocks.push(`
                <div class="tkm-sec-title">8. EKİPMAN FOTOĞRAFLARI</div>
                <table class="tkm-table" style="table-layout:fixed;background:#ffffff;">
                    <tbody>
                        <tr>
                            <td style="min-height:24px;height:24px;vertical-align:middle;text-align:center;color:#333333;font-style:italic;font-size:7.2pt;">
                                
                            </td>
                        </tr>
                    </tbody>
                </table>
            `);
        }

        // Block 9: 9. NOTLAR (Bakanlık Formatı: SABİT 9. BÖLÜM)
        blocks.push(`
            <div class="tkm-sec-title">9. NOTLAR</div>
            <table class="tkm-table ${useRamsMinistryEnhanced2201 ? 'tkm-general-notes-box' : ''}">
                <tbody>
                    <tr>
                        <td style="min-height:22px;height:22px;vertical-align:top;text-align:left;padding:3.5px 6px;font-size:7.2pt;line-height:1.2;">
                            ${escapeHtml(fd.generalNotes || "Proje Bilgileri: Tesisin elektrik tesisat projeleri ve tek hat şeması yerinde incelenmiş olup kontroller bu doğrultuda gerçekleştirilmiştir.").replace(/\n/g, '<br>')}
                        </td>
                    </tr>
                </tbody>
            </table>
        `);

        // Block 10: 10. SONUÇ VE KANAAT (Bakanlık Formatı: SABİT 10. BÖLÜM)
        const isSuitable = fd.overallResult !== 'UYGUN DEĞİL';
        const conclusionText = isSuitable 
            ? 'KULLANILMASI UYGUNDUR.' 
            : 'KULLANILMASI UYGUN DEĞİLDİR. C1 – Tehlike mevcut. Yaralanma riski. Derhal düzeltici eylem gerekli.';

        const conclusionBannerHtml = `
            <div class="tkm-conclusion-box ${isSuitable ? 'tkm-result-box-ok' : 'tkm-result-box-bad'}" style="margin-top:2px;margin-bottom:3px;font-size:7.4pt;font-weight:700;color:${isSuitable ? '#047857' : '#c00000'};line-height:1.25;">
                Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen Elektrik Tesisatının fonksiyon testleri muayenesi sonrasında mevcut şartlar altında<br>
                <span style="font-size:8.5pt;">
                    ${conclusionText}
                </span>
            </div>
        `;

        const heavyDefectDefinitionsHtml = `
            <div style="font-weight:700;">Ağır kusur tanımları:</div>
            <div style="font-weight:700;margin-top:1px;">Gözle Kontrol Bölümü</div>
            <div>1. Faza erişim engeli IP2X koruma sınıfını sağlamıyorsa,</div>
            <div>2. Kablo ek noktaları yalıtımlı değilse, pano içinde ucu açıkta iletken varsa,</div>
            <div>3. Pano elemanları bağlantı noktalarında kontak gevşekliği (seri ark) tespit edilmişse,</div>
            <div>4. PVC izoleli kablolarda ve pano elemanlarının dokunulabilen metal olmayan yüzeylerinde aşırı ısınma tespit edilmişse.</div>

            <div style="font-weight:700;margin-top:2px;">Fonksiyon Testleri Bölümü</div>
            <div>1. Hesaplanan 3 fazlı kısa devre akımı, pano içinde bulunan herhangi bir aşırı akım koruma cihazı etiketinde yazan kısa devre kesme kapasitesinden (Icu) fazla ise,</div>
            <div>2. Aşırı akım koruma elemanı değerleri linye kesiti ile uyumsuz ise,</div>
            <div>3. El ulaşma mesafesindeki metal bölümler, ekipmanın toprak barası veya toprak ucuyla eş potansiyel değilse,</div>
            <div>4. RCD performans testi sonuçları yetersiz ise,</div>
            <div>5. Kablo şalter koordinasyonunun aşağıdaki uygunsuzluğu;<br>Devre Tasarım Akımı (Ib), Devre Kesici Akımı (In) ve Kablo Akım Taşıma Kapasitesi (Iz) için Ib&lt;In&lt;Iz sağlanmadıysa,</div>
            <div>6. Zemin yalıtımının aşağıdaki uygunsuzlukları;<br>a) El ulaşma mesafesinde bulunan zemin izolasyonu uygun boyutta değilse, (EİTY Md. 33d)<br>b) Zemin izolasyon direnci 50 kΩ’dan büyük değilse, (EİTY Md. 48)</div>
            <div>7. N/PEN iletkeni kesitinin ve kullanım yerinin aşağıdaki uygunsuzlukları;<br>a) N/PEN kesiti ile faz iletkeni kesiti eşit değilse. (EİTY Md 57b3-ii-1)<br>İstisna: N/PEN kesitinin faz iletkeninin kesitinden küçük olması durumunda (örneğin 3x70+35 mm2 gibi) faz iletkenlerini koruyan devre kesici anma akımının, N/PEN iletkeni kesitine göre (örnekteki 35mm2’ye göre) belirlenmesi kuralı ihlal edildiyse (EİTY Md 57b3-ii-2)<br>b) PEN iletkeni kesiti &gt;10 mm2 değilse (EİTY Md 36)<br>c) PEN iletkeni yangın tehlikesi olan yerlerden geçirilmemesi kuralı ihlal edildiyse (EİTY Md 64)<br>d) PEN iletkeni Exproof tehlikeli bölge sınırları içinden geçirilmemesi kuralı ihlal edildiyse (IEC 60079-14)</div>
            <div>8. PE koruma iletkeni kesitinin aşağıdaki uygunsuzluğu;<br>Koruma iletkeni kesiti ETTY Md. 9e1i’de verilen formülle yapılan hesap sonucuna ve ETTY Çizelge 8’de verilen tabloya uygun değilse,</div>
            <div>9. PD potansiyel dengeleme iletkeni kesitinin aşağıdaki uygunsuzluğu;<br>6 mm2 &lt; PD &lt; 25 mm2 değilse,</div>
            <div>10. Tamamlayıcı potansiyel dengeleme: PD &gt; 4mm² değilse.</div>
            <div style="font-weight:700;margin-top:1px;">Ağır kusur olarak değerlendirilir.</div>

            <div style="margin-top:2px;">
                Bu rapor “Alçak Gerilim Topraklama Tesisatı Kontrol Raporu” ile birlikte geçerlidir.<br>
                TS HD 60364 standardına göre kullanımı uygun olmayan tesisatlar aşağıdaki şekilde işaretlenir:<br>
                C1 – Tehlike mevcut. Yaralanma riski. Derhal düzeltici eylem gerekli.<br>
                C2 – Potansiyel olarak tehlikeli – acil düzeltici eylem gerekli.<br>
                C3 – İyileştirme önerilir.
            </div>
        `;

        const ramsCompactHeavyDefsHtml = `
            <div style="column-count:2;column-gap:12px;font-size:7.1pt;line-height:1.15;text-align:left;">
                ${heavyDefectDefinitionsHtml}
            </div>
        `;

        blocks.push(`
            <div class="tkm-sec-title">10. SONUÇ VE KANAAT</div>
            <table class="tkm-table">
                <tbody>
                    <tr>
                        <td style="font-size:${useRamsMinistryEnhanced2201 ? '7.1pt' : '6.6pt'};line-height:1.15;padding:3.5px 6px;text-align:left;">
                            ${useRamsMinistryEnhanced2201
                                ? `${conclusionBannerHtml}${ramsCompactHeavyDefsHtml}`
                                : `${heavyDefectDefinitionsHtml}${conclusionBannerHtml}`
                            }
                        </td>
                    </tr>
                </tbody>
            </table>
        `);

        // Block 11: 11. PERİYODİK KONTROLLERİ YAPMAYA YETKİLİ KİŞİ BİLGİLERİ ve ONAY (Bakanlık Resmi Başlığı)
        blocks.push(buildTkmOnaySection(insp, '11', '11. PERİYODİK KONTROLLERİ YAPMAYA YETKİLİ KİŞİ BİLGİLERİ ve ONAY'));

        // Dynamically pack blocks into A4 pages using real DOM measurement!

        return paginateBlocksIntoA4Pages(blocks, reportMainTitle, formCode, reportNo);

}


// ============================================================================
// HIZLI RAPOR - 10C-PDF-2202-GROUNDING.JS
// Açıklama: 2202 Alçak Gerilim Topraklama Tesisatı (TKM-FR.317) Resmi A4 PDF Şablonu
// ============================================================================

function buildPdfPages2202(insp, fd, ci, reportNo, activePdfTheme) {

        // ====================================================================

        // ALÇAK GERİLİM TOPRAKLAMA TESİSATI (TKM-FR.317, REV.00 / YT: 01.09.2025)

        // ====================================================================

        const reportMainTitle = 'ALÇAK GERİLİM TOPRAKLAMA TESİSATI<br>PERİYODİK KONTROL RAPORU';

        const docFormCode = 'TKM-FR.317, REV.00 / YT: 01.09.2025';

        const gd = fd.grounding || { details: {}, detected: {}, method: 'Çevrim empedansı', points: [], selectivity: [] };

        const d = gd.details || {};

        const det = gd.detected || {};

        const points = gd.points || [];

        const selectivity = gd.selectivity || [];



        const blocks = [];



        // Block 1: 1. FİRMA BİLGİLERİ

        blocks.push(`

            <div class="tkm-sec-title">1. FİRMA BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:20%;"><col style="width:30%;"><col style="width:20%;"><col style="width:30%;">

                </colgroup>

                <tbody>

                    <tr><td style="font-weight:700;">Firma Adı</td><td colspan="3">${ci.firmName}</td></tr>

                    <tr><td style="font-weight:700;">Periyodik Kontrol Adresi</td><td colspan="3">${ci.address}</td></tr>

                    <tr><td style="font-weight:700;">İSG-KATİP Sözleşme ID</td><td>${ci.isgKatipNo}</td><td style="font-weight:700;">SGK Sicil No</td><td>${ci.sgkSicilNo}</td></tr>

                    <tr><td style="font-weight:700;">Rapor Numarası</td><td>${reportNo}</td><td style="font-weight:700;">Rapor Tarihi</td><td>${insp.inspection_date || ci.reportDate}</td></tr>

                    <tr><td style="font-weight:700;">Periyodik Kontrol Başlangıç ve Bitiş Tarih ve Saati</td><td>${ci.startEndTime || ''}</td><td style="font-weight:700;">Bir Sonraki Periyodik Kontrol Tarihi</td><td>${fd.nextInspectionDate || ci.nextControlDate}</td></tr>

                    <tr><td style="font-weight:700;">Rapor / Ekipman Adı</td><td>${insp.equipment_name || ci.equipmentName || 'Alçak Gerilim Topraklama'}</td><td style="font-weight:700;">Ekipman Seri No / Kod</td><td>${ci.serialCode || insp.serial_no || ''}</td></tr>

                    <tr>

                        <td style="font-weight:700;vertical-align:top;">Periyodik Kontrol Metodu ve Kapsamı</td>

                        <td colspan="3" style="line-height:1.2;font-size:7pt;">

                            • RG, 04.11.1984 - 18565 Elektrik İç Tesisleri Yönetmeliği<br>

                            • RG, 21.08.2001 - 24500 Elektrik Tesislerinde Topraklamalar Yönetmeliği<br>

                            • RG, 25.04.2013 - 28628 İş Ekipmanları Kullanımında Sağlık Güvenlik Şartları Yönetmeliği<br>

                            • TS HD 60364-4-41 Alçak Gerilim Elektrik Tesisleri – Bölüm 4: Güvenlik İçin Koruma – Bölüm 41: Elektrik Çarpmasına Karşı Koruma<br>

                            • TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 2: 2. EKİPMAN BİLGİLERİ (2.1 & 2.2)

        blocks.push(`

            <div class="tkm-sec-title">2. EKİPMAN BİLGİLERİ</div>

            <div class="tkm-sub-bar">2.1. ETİKET VE DETAY BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:19%;"><col style="width:14.3%;">

                    <col style="width:19%;"><col style="width:14.3%;">

                    <col style="width:19%;"><col style="width:14.4%;">

                </colgroup>

                <tbody>

                    <tr>

                        <td style="text-align:center;">Enerji sağlayan kuruluş</td><td style="text-align:left;padding-left:4px;">${d.supplier || ''}</td>

                        <td style="text-align:center;">Şebeke tipi</td><td style="text-align:left;padding-left:4px;font-weight:700;">${d.networkType || ''}</td>

                        <td style="text-align:center;">Şebeke gerilimi (V)</td><td style="text-align:left;padding-left:4px;">${d.voltage || ''}</td>

                    </tr>

                    <tr>

                        <td style="text-align:center;">Tesise ait proje var mı?</td><td style="text-align:left;padding-left:4px;">${d.hasProject || ''}</td>

                        <td style="text-align:center;">Tek hat şeması var mı?</td><td style="text-align:left;padding-left:4px;">${d.hasSingleLine || ''}</td>

                        <td style="text-align:center;">Kontrol nedeni</td><td style="text-align:left;padding-left:4px;">${d.reason || ''}</td>

                    </tr>

                    <tr>

                        <td style="text-align:center;">Proje bilgileri</td><td style="text-align:left;padding-left:4px;">${d.projectInfo || ''}</td>

                        <td style="text-align:center;">Topraklayıcı tipi</td><td style="text-align:left;padding-left:4px;">${d.grounderType || ''}</td>

                        <td style="text-align:center;">Yapı cinsi</td><td style="text-align:left;padding-left:4px;">${d.buildingType || ''}</td>

                    </tr>

                    <tr>

                        <td style="text-align:center;">Ekipmanın kullanım amacı</td><td style="text-align:left;padding-left:4px;">${d.usagePurpose || ''}</td>

                        <td style="text-align:center;">Son kontrol tarihi</td><td style="text-align:left;padding-left:4px;">${d.lastControlDate || ''}</td>

                        <td style="text-align:center;">Hava durumu</td><td style="text-align:left;padding-left:4px;">${d.weather || ''}</td>

                    </tr>

                    <tr>

                        <td style="text-align:center;">Hava sıcaklığı (°C)</td><td style="text-align:left;padding-left:4px;">${d.temperature || ''}</td>

                        <td style="text-align:center;">Zemin nem durumu</td><td style="text-align:left;padding-left:4px;">${d.soilMoisture || ''}</td>

                        <td style="text-align:center;">Dolaylı dokunmaya karşı koruma önlemi</td><td style="text-align:left;padding-left:4px;font-size:6.6pt;">${d.protectionMeasure || ''}</td>

                    </tr>

                </tbody>

            </table>



            <div class="tkm-sub-bar" style="margin-top:3px;">2.2. TESPİT EDİLEN BİLGİLER</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:24%;"><col style="width:9.3%;">

                    <col style="width:24%;"><col style="width:9.3%;">

                    <col style="width:19%;"><col style="width:14.4%;">

                </colgroup>

                <tbody>

                    <tr>

                        <td style="text-align:center;">Tesisatta kapsamlı değişiklik var mı?</td><td style="text-align:left;padding-left:4px;">${det.majorChange || ''}</td>

                        <td style="text-align:center;">Bir önceki periyodik kontrole ait ek var mı?</td><td style="text-align:left;padding-left:4px;">${det.prevReportAttached || ''}</td>

                        <td style="text-align:center;">Pano/Ekipman tanımlaması</td><td style="text-align:left;padding-left:4px;">${det.panelIdent || ''}</td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 3: 3. ÖLÇÜM ALETLERİ BİLGİLERİ

        const grdDevList = (fd.measuringDevices && fd.measuringDevices.length) ? fd.measuringDevices : [
            { name: '', serial: '', calDate: '', validDate: '', certNo: '' }
        ];

        const grdDevRowsHtml = grdDevList.map(dev => `
            <tr>
                <td style="text-align:center;">${escapeHtml(dev.name || '')}</td>
                <td style="text-align:center;">${escapeHtml(dev.serial || '')}</td>
                <td style="text-align:center;">${escapeHtml(dev.calDate || '')}</td>
                <td style="text-align:center;">${escapeHtml(dev.validDate || '')}</td>
                <td style="text-align:center;">${escapeHtml(dev.certNo || '')}</td>
            </tr>
        `).join('');

        blocks.push(`

            <div class="tkm-sec-title">3. ÖLÇÜM ALETLERİ BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:24%;"><col style="width:17%;"><col style="width:19%;"><col style="width:21%;"><col style="width:19%;">

                </colgroup>

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Cihaz Adı</th>

                        <th style="text-align:center;font-weight:700;">Seri No</th>

                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>

                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>

                        <th style="text-align:center;font-weight:700;">Sertifika No</th>

                    </tr>

                </thead>

                <tbody>${grdDevRowsHtml}</tbody>

            </table>

        `);



        // Block 4: 4. TEST DEĞERLERİ

        blocks.push(`

            <div class="tkm-sec-title">4. TEST DEĞERLERİ</div>

            <table class="tkm-table">

                <tbody>

                    <tr>

                        <td style="font-size:6.8pt;line-height:1.2;padding:3.5px 6px;text-align:left;">

                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 14px;">

                                <div><strong>Zx:</strong> Ölçülen çevrim empedansı.</div>

                                <div><strong>Zs:</strong> Aşırı akım koruma cihazının açma akımına göre hesaplanan sınır çevrim empedansı.</div>

                                <div><strong>Rx:</strong> Ölçülen topraklama direnci.</div>

                                <div><strong>RA:</strong> Aşırı akım koruma cihazının açma akımına göre hesaplanan sınır topraklama direnci.</div>

                                <div><strong>Ik:</strong> Devredeki toprak çevrim empedansına göre hesaplanan ya da ölçülen faz- toprak hata akımı.</div>

                                <div><strong>Ia:</strong> Aşırı akım koruma cihazının açma eğrisi tipine göre hesaplanan ani açma ya da otomatik açma akımı-RCD’ler için etikette yazılı beyan açma akımı (IΔn)</div>

                                <div><strong>IΔn:</strong> RCD (Artık akım anahtarı) için beyan açma akımı</div>

                                <div><strong>IΔ:</strong> RCD için test açma akımı</div>

                                <div><strong>TΔ:</strong> RCD için test açma zamanı-max: 200 ms.</div>

                                <div><strong>50V:</strong> Dokunma gerilimi sınır değeri (AG tesisat a.a da, normal, ya da kuru yerler)</div>

                                <div><strong>25V:</strong> Dokunma gerilimi sınır değeri (AG tesisat a.a da, tehlikenin yüksek olduğu yerler, ıslak hacimler, tarımsal alanlar vb.)</div>

                                <div><strong>230V:</strong> (Uo) Hesaplamalar için kullanılacak faz-toprak veya faz-nötr gerilimi</div>

                                <div><strong>Zs&lt;230V/Ia:</strong> TN şebekeler için hesaplanan çevrim empedansı sınır değeri. (TN şebekeler için dolaylı dokunmaya karşı güvenlik şartı.)</div>

                                <div><strong>RA&lt;50V/Ia:</strong> TT şebekeler için hesaplanan topraklama direnci sınır değeri. (TT Şebekeler için dolaylı dokunmaya karşı güvenlik şartı.)</div>

                            </div>

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 5: 5. KONTROL KRİTERLERİ VE TESTLER (5.1 & 5.2)

        const pointRowsToRender = points.length ? points : [

            { point: '', inAmp: '', curve: '', iaAmp: '', ik1Amp: '', zxRx: '', zsRa: '', rcdSpec: '', rcdId: '', rcdTd: '', result: '' }

        ];



        // Split points into chunks if there are multiple rows so pagination never breaks cleanly

        const chunkSize = 14;

        for (let pIdx = 0; pIdx < pointRowsToRender.length; pIdx += chunkSize) {

            const chunk = pointRowsToRender.slice(pIdx, pIdx + chunkSize);

            const isFirstChunk = (pIdx === 0);

            const isLastChunk = (pIdx + chunkSize >= pointRowsToRender.length);



            let chunkHtml = '';

            if (isFirstChunk) {

                chunkHtml += `

                    <div class="tkm-sec-title">5. KONTROL KRİTERLERİ VE TESTLER</div>

                    <div class="tkm-sub-bar">5.1. ÖLÇÜM METODU</div>

                    <table class="tkm-table" style="margin-bottom:3px;">

                        <colgroup><col style="width:25%;"><col style="width:75%;"></colgroup>

                        <tbody>

                            <tr><td style="font-weight:700;">Ölçüm ve doğrulama metodu</td><td style="padding-left:6px;">${gd.method || ''}</td></tr>

                        </tbody>

                    </table>

                    <div class="tkm-sub-bar">5.2. SON TÜKETİM NOKTALARINDA DOLAYLI DOKUNMAYA KARŞI KORUMA YETERLİLİĞİ KONTROLÜ</div>

                `;

            } else {

                chunkHtml += `

                    <div class="tkm-sub-bar">5.2. SON TÜKETİM NOKTALARINDA DOLAYLI DOKUNMAYA KARŞI KORUMA YETERLİLİĞİ KONTROLÜ (Devam)</div>

                `;

            }



            chunkHtml += `

                <table class="tkm-table" style="font-size:6.8pt;">

                    <thead>

                        <tr>

                            <th style="width:22px;text-align:center;">No</th>

                            <th style="text-align:center;">Ölçüm noktası / Etiket veya kodu</th>

                            <th style="width:40px;text-align:center;">Koruma elemanının In (A)</th>

                            <th style="width:40px;text-align:center;">Koruma elemanının açma eğrisi tipi</th>

                            <th style="width:42px;text-align:center;">Koruma elemanının açma akımı Ia (A)</th>

                            <th style="width:50px;text-align:center;">Koruma elemanının toprak kısa devre akımı Ik1 (A)</th>

                            <th style="width:46px;text-align:center;">Ölçüm ölçülen değer Zx / Rx (Ω)</th>

                            <th style="width:46px;text-align:center;">Ölçüm sınır değer Zs / RA (Ω)</th>

                            <th style="width:70px;text-align:center;">RCD tipi, dayanma akımı ve açma akımı In (A) / I∆n (mA)</th>

                            <th style="width:44px;text-align:center;">RCD test açma akımı I∆ (mA)</th>

                            <th style="width:44px;text-align:center;">RCD test açma zamanı T∆ (ms)</th>

                            <th style="width:48px;text-align:center;">Sonuç (Uygunluk notu)</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${chunk.map((pt, idx) => `

                            <tr>

                                <td style="text-align:center;">${pIdx + idx + 1}</td>

                                <td style="text-align:left;padding-left:4px;">${pt.point || ''}</td>

                                <td style="text-align:center;">${pt.inAmp || ''}</td>

                                <td style="text-align:center;">${pt.curve || ''}</td>

                                <td style="text-align:center;">${pt.iaAmp || ''}</td>

                                <td style="text-align:center;">${pt.ik1Amp || ''}</td>

                                <td style="text-align:center;">${pt.zxRx || ''}</td>

                                <td style="text-align:center;">${pt.zsRa || ''}</td>

                                <td style="text-align:center;">${pt.rcdSpec || ''}</td>

                                <td style="text-align:center;">${pt.rcdId || ''}</td>

                                <td style="text-align:center;">${pt.rcdTd || ''}</td>

                                <td style="text-align:center;font-weight:700;">${pt.result || ''}</td>

                            </tr>

                        `).join('')}

                    </tbody>

                </table>

            `;



            if (isLastChunk) {

                // Also append 5.3 RCD Selektivite Kontrolü

                const selRowsHtml = selectivity.length ? selectivity.map((s, idx) => `

                    <tr>

                        <td style="text-align:center;">${idx + 1}</td>

                        <td style="text-align:left;padding-left:3px;">${s.priorPanel || ''}</td>

                        <td style="text-align:center;">${s.priorRcdType || ''}</td>

                        <td style="text-align:center;">${s.priorRcdIn || ''}</td>

                        <td style="text-align:center;">${s.priorRcdIdn || ''}</td>

                        <td style="text-align:center;">${s.priorRcdTd || ''}</td>

                        <td style="text-align:left;padding-left:3px;">${s.destPanel || ''}</td>

                        <td style="text-align:center;">${s.destRcdType || ''}</td>

                        <td style="text-align:center;">${s.destRcdIdn || ''}</td>

                        <td style="text-align:center;">${s.destRcdTd || ''}</td>

                        <td style="text-align:center;font-weight:700;">${s.result || ''}</td>

                    </tr>

                `).join('') : `

                    <tr><td colspan="11" style="text-align:center;padding:3px;font-style:italic;">Uygulaması Yok</td></tr>

                `;



                chunkHtml += `

                    <div class="tkm-sub-bar" style="margin-top:3px;">5.3. ARTIK AKIM ANAHTARLARI (RCD) SELEKTİVİTE KONTROLÜ</div>

                    <table class="tkm-table" style="font-size:6.7pt;">

                        <thead>

                            <tr>

                                <th style="width:20px;text-align:center;">No</th>

                                <th style="text-align:center;">Son tüketim noktasını besleyen panodan N önceki panonun adı</th>

                                <th style="width:50px;text-align:center;">Kullanılan RCD etiket bilgileri RCD tipi</th>

                                <th style="width:48px;text-align:center;">Kullanılan RCD dayanma akımı In (A)</th>

                                <th style="width:48px;text-align:center;">Kullanılan RCD açma akım I∆n (mA)</th>

                                <th style="width:50px;text-align:center;">Kullanılan RCD açma zamanı gecikmesi T∆ (ms)</th>

                                <th style="text-align:center;">Son tüketim noktasını besleyen pano adı</th>

                                <th style="width:50px;text-align:center;">Kullanılan RCD tipi</th>

                                <th style="width:48px;text-align:center;">Kullanılan RCD açma akımı I∆n (mA)</th>

                                <th style="width:48px;text-align:center;">Kullanılan RCD açma zamanı T∆ (ms)</th>

                                <th style="width:48px;text-align:center;">Sonuç (Uygunluk notu)</th>

                            </tr>

                        </thead>

                        <tbody>${selRowsHtml}</tbody>

                    </table>

                `;

            }



            blocks.push(chunkHtml);

        }



        // Block 6: 6. KUSUR AÇIKLAMALARI & 7. NOTLAR

        blocks.push(`

            <div class="tkm-sec-title">6. KUSUR AÇIKLAMALARI</div>

            <table class="tkm-table">

                <tbody>

                    <tr><td style="min-height:18px;height:18px;vertical-align:top;text-align:left;">${(fd.defectNotes || '').replace(/\n/g, '<br>')}</td></tr>

                </tbody>

            </table>

            <div class="tkm-sec-title">7. NOTLAR</div>

            <table class="tkm-table">

                <tbody>

                    <tr><td style="min-height:18px;height:18px;vertical-align:top;text-align:left;">${(fd.generalNotes || '').replace(/\n/g, '<br>')}</td></tr>

                </tbody>

            </table>

        `);



        // Photos Block (if attached)

        if (fd.photos && fd.photos.length) {

            blocks.push(...renderPdfPhotoBlocks(fd.photos, 'FOTOĞRAFLAR'));

        }



        // Block 7: 8. SONUÇ VE KANAAT

        const isGroundingSuitable = fd.overallResult !== 'UYGUN DEĞİL';

        blocks.push(`

            <div class="tkm-sec-title">8. SONUÇ VE KANAAT</div>

            <table class="tkm-table">

                <tbody>

                    <tr>

                        <td style="font-size:6.7pt;line-height:1.2;padding:3.5px 6px;text-align:left;">

                            <div style="font-weight:700;margin-bottom:2px;">Uygunluk notu ve ağır kusur açıklamaları:</div>

                            <div><strong>Not-1:</strong> Uygun.</div>

                            <div><strong>Not-2:</strong> Güvenlik şartı sağlanamadığından uygun değildir. (Ağır kusur)</div>

                            <div><strong>Not-3:</strong> Topraklama bağlantısı yok kontrol edilmelidir. (Ağır kusur)</div>

                            <div><strong>Not-4:</strong> Artık akım anahtarı kullanıldığı ve faal olduğu için uygundur.</div>

                            <div><strong>Not-5:</strong> TT veya TN (TN-S veya TN-CS’nin S bölümü) şebeke sistemlerinde 32 A’e kadar genel kullanım priz tesisatlarında, 32 A’e kadar seyyar cihaz prizlerinde 30 mA artık akım cihazı RCD kullanımı zorunludur. 32 A’in üzerindeki devrelerde ise, doğal kaçak akımların kaçınılmaz olduğu durumlarda, uygun seçilmiş kaçak akım koruma cihazları (RCD), diğer elektrik çarpmasına karşı koruma önlemleriyle birlikte kullanılmalıdır. Doğal kaçakların bulunduğu bölümlere ilişkin teknik detay ve sebepler periyodik kontrol raporunun ilgili bölümlerinde belirtilmelidir. (Ağır kusur)</div>

                            <div><strong>Not-6:</strong> 32 A üzerindeki devrelerde dolaylı dokunmaya karşı önlemler yanında doğal kaçak akım tahkiki yapılmadığından yetersizdir. (Ağır kusur)</div>

                            <div><strong>Not-7:</strong> Son tüketim noktasını besleyen panodan bir önceki panoda kullanılan RCD gecikmeli tip (selektif veya gecikme ayarlı) olmadığından yetersizdir.</div>

                            <div><strong>Not-8:</strong> Nötr-toprak geriliminin yüksek olması nedeniyle ölçüm yapılamamıştır. (Ağır kusur)</div>

                            <div><strong>Not-9:</strong> TN-S ve TN-CS topraklama sistem tipini belirleyen PEN köprüsü dışında PE ve N iletkenlerinin birleştirilmesi uygun değildir. (Ağır kusur)</div>

                            <div><strong>Not-10:</strong> Priz üzerinde Nötr-Toprak birleşikliği (sıfırlama yapıldığı) tespit edildiğinden yetersiz. Tesis topraklama tipi TT ise sıfırlama yapılamaz. TN ise PEN iletken kesiti &lt;10 mm2 olamayacağından 2,5 mm2 prizde sıfırlama yapılamaz. (Ağır kusur)</div>

                            <div><strong>Not-11:</strong> Pano gövde–kapak köprüsü olmadığından yetersizdir. (Ağır kusur)</div>

                            <div style="margin-top:4px;font-size:7.4pt;font-weight:700;color:${isGroundingSuitable ? '#047857' : '#c00000'};line-height:1.25;">
                                Periyodik kontrol tarihi itibariyle yukarıda teknik özellikleri belirtilen AG Topraklama Tesisatı muayenesi sonrasında mevcut şartlar altında kullanımı 1 yıl süreyle;<br>
                                <span style="font-size:8.4pt;">${isGroundingSuitable ? 'UYGUNDUR.' : 'UYGUN DEĞİLDİR.'}</span>
                            </div>

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 8: 9. ONAY

        blocks.push(buildTkmOnaySection(insp, '9'));



        return paginateBlocksIntoA4Pages(blocks, reportMainTitle, docFormCode, reportNo);



}


// ============================================================================
// HIZLI RAPOR - 10D-PDF-2205-GENERATOR.JS
// Açıklama: 2205 Jeneratör (TKM-FR.164) ve Özel Şablonlar Resmi A4 PDF Motoru
// ============================================================================

function buildPdfPages2205(insp, fd, ci, reportNo, activePdfTheme) {

        // ====================================================================

        // JENERATÖR PERİYODİK KONTROL RAPORU (TKM-FR.164, REV.07 / RT: 09.12.2024)

        // ====================================================================

        const reportMainTitle = 'JENERATÖR<br>PERİYODİK KONTROL RAPORU';

        const docFormCode = 'TKM-FR.164, REV.07 / RT: 09.12.2024';

        const gen = fd.generator || { info: {}, equipment: {}, checks: {}, potential: {}, measurements: {}, battery: {}, devices: [] };

        const gInfo = gen.info || {};

        const gEq = gen.equipment || {};

        const gChecks = gen.checks || {};

        const gPot = gen.potential || {};

        const gMeas = gen.measurements || {};

        const gBat = gen.battery || {};



        const blocks = [];



        // Block 1: 1. FİRMA BİLGİLERİ

        blocks.push(`

            <div class="tkm-sec-title">1. FİRMA BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:20%;"><col style="width:30%;"><col style="width:20%;"><col style="width:30%;">

                </colgroup>

                <tbody>

                    <tr><td style="font-weight:700;">Firma Adı</td><td colspan="3">${ci.firmName}</td></tr>

                    <tr><td style="font-weight:700;">Periyodik Kontrol Adresi</td><td colspan="3">${ci.address}</td></tr>

                    <tr><td style="font-weight:700;">İSG-KATİP Sözleşme ID</td><td>${ci.isgKatipNo}</td><td style="font-weight:700;">SGK Sicil No</td><td>${ci.sgkSicilNo}</td></tr>

                    <tr><td style="font-weight:700;">Rapor Numarası</td><td>${reportNo}</td><td style="font-weight:700;">Rapor Tarihi</td><td>${insp.inspection_date || ci.reportDate}</td></tr>

                    <tr><td style="font-weight:700;">Periyodik Kontrol Başlangıç ve Bitiş Tarih ve Saati</td><td>${ci.startEndTime || ''}</td><td style="font-weight:700;">Bir Sonraki Periyodik Kontrol Tarihi</td><td>${fd.nextInspectionDate || ci.nextControlDate}</td></tr>

                    <tr><td style="font-weight:700;">Rapor / Ekipman Adı</td><td>${insp.equipment_name || ci.equipmentName || 'Alçak Gerilim Topraklama'}</td><td style="font-weight:700;">Ekipman Seri No / Kod</td><td>${ci.serialCode || insp.serial_no || ''}</td></tr>

                    <tr>

                        <td style="font-weight:700;vertical-align:top;">Periyodik Kontrol Metodu ve Kapsamı</td>

                        <td colspan="3" style="line-height:1.2;font-size:7pt;">

                            • RG, 04.11.1984 - 18565 Elektrik İç Tesisleri Yönetmeliği<br>

                            • RG, 21.08.2001 - 24500 Elektrik Tesislerinde Topraklamalar Yönetmeliği<br>

                            • RG, 25.04.2013 - 28628 İş Ekipmanları Kullanımında Sağlık Güvenlik Şartları Yönetmeliği<br>

                            • RG, 30.11.2000 - 24246 Elektrik Kuvvetli Akım Tesisleri Yönetmeliği<br>

                            • TS ISO 8528-1 Pistonlu içten yanmalı motorla tahrik edilen alternatif akım jeneratör grupları - Bölüm 1: Uygulama, beyan değerleri ve performans

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 2: 2. ÖLÇÜM ALETLERİ BİLGİLERİ

        const genDeviceRows = (fd.measuringDevices && fd.measuringDevices.length)
            ? fd.measuringDevices
            : ((gen.devices && gen.devices.length) ? gen.devices : []);



        blocks.push(`

            <div class="tkm-sec-title">2. ÖLÇÜM ALETLERİ BİLGİLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Cihaz Adı</th>

                        <th style="text-align:center;font-weight:700;">Seri Numarası</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>
                        <th style="text-align:center;font-weight:700;">Kalibrasyon Numarası</th>

                    </tr>

                </thead>

                <tbody>

                    ${genDeviceRows.length ? genDeviceRows.map(d => `

                        <tr>

                            <td style="text-align:center;">${d.name || ''}</td>

                            <td style="text-align:center;">${d.serial || ''}</td>

                            <td style="text-align:center;">${d.calDate || ''}</td>

                            <td style="text-align:center;">${d.validDate || ''}</td>

                            <td style="text-align:center;">${d.certNo || ''}</td>

                        </tr>

                    `).join('') : `

                        <tr><td colspan="5" style="text-align:center;padding:4px;font-style:italic;">Ölçüm cihazı kaydedilmedi</td></tr>

                    `}

                </tbody>

            </table>

        `);



        // Block 3: 3. MUAYENEYE AİT GENEL BİLGİLER

        blocks.push(`

            <div class="tkm-sec-title">3. MUAYENEYE AİT GENEL BİLGİLER</div>

            <div class="tkm-sub-bar">MUAYENE BİLGİLERİ</div>

            <table class="tkm-table">

                <colgroup>

                    <col style="width:16.6%;"><col style="width:16.6%;">

                    <col style="width:16.6%;"><col style="width:16.6%;">

                    <col style="width:16.6%;"><col style="width:17%;">

                </colgroup>

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Muayene Nedeni</th>

                        <th style="text-align:center;font-weight:700;">Hava Durumu</th>

                        <th style="text-align:center;font-weight:700;">Toprak Durumu</th>

                        <th style="text-align:center;font-weight:700;">Şebeke Tipi</th>

                        <th style="text-align:center;font-weight:700;">Topraklama Tipi</th>

                        <th style="text-align:center;font-weight:700;">Eşpotansiyel Bara</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gInfo.reason || ''}</td>

                        <td style="text-align:center;">${gInfo.weather || ''}</td>

                        <td style="text-align:center;">${gInfo.soilStatus || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gInfo.networkType || ''}</td>

                        <td style="text-align:center;">${gInfo.groundingType || ''}</td>

                        <td style="text-align:center;">${gInfo.equipotentialBar || ''}</td>

                    </tr>

                </tbody>

            </table>



            <div class="tkm-sub-bar" style="margin-top:3px;">3.1. EKİPMAN BİLGİLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Marka</th>

                        <th style="text-align:center;font-weight:700;">Model</th>

                        <th style="text-align:center;font-weight:700;">Seri No</th>

                        <th style="text-align:center;font-weight:700;">İmal Yılı</th>

                        <th style="text-align:center;font-weight:700;">Yakıt</th>

                        <th style="text-align:center;font-weight:700;">Ses İzolasyon</th>

                        <th style="text-align:center;font-weight:700;">Tip</th>

                        <th style="text-align:center;font-weight:700;">Gerilim</th>

                        <th style="text-align:center;font-weight:700;">Güç</th>

                        <th style="text-align:center;font-weight:700;">Frekans</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gEq.brand || ''}</td>

                        <td style="text-align:center;">${gEq.model || ''}</td>

                        <td style="text-align:center;">${gEq.serialNo || ''}</td>

                        <td style="text-align:center;">${gEq.mfgYear || ''}</td>

                        <td style="text-align:center;">${gEq.fuel || ''}</td>

                        <td style="text-align:center;">${gEq.soundInsulation || ''}</td>

                        <td style="text-align:center;">${gEq.type || ''}</td>

                        <td style="text-align:center;">${gEq.voltage || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gEq.power || ''}</td>

                        <td style="text-align:center;">${gEq.frequency || ''}</td>

                    </tr>

                </tbody>

            </table>

        `);



        // Helper to render 2-column checklist items matching sample PDF 1:1

        const renderChecklistCategoryRows = (itemsList) => {

            let trs = '';

            for (let i = 0; i < itemsList.length; i += 2) {

                const item1 = itemsList[i];

                const item2 = itemsList[i + 1];

                const val1 = formatSymbolForPrint(gChecks[item1.code] || '');

                const val2 = item2 ? formatSymbolForPrint(gChecks[item2.code] || '') : '';



                trs += `

                    <tr>

                        <td style="font-weight:700;width:30px;text-align:center;">${item1.code}</td>

                        <td style="text-align:left;padding-left:4px;font-size:6.7pt;line-height:1.15;">${item1.text}</td>

                        <td style="text-align:center;font-weight:700;width:24px;">${val1}</td>

                        ${item2 ? `

                            <td style="font-weight:700;width:30px;text-align:center;">${item2.code}</td>

                            <td style="text-align:left;padding-left:4px;font-size:6.7pt;line-height:1.15;">${item2.text}</td>

                            <td style="text-align:center;font-weight:700;width:24px;">${val2}</td>

                        ` : `

                            <td colspan="3"></td>

                        `}

                    </tr>

                `;

            }

            return trs;

        };



        // Block 4A: 4. GENEL KONTROLLER - Part 1 (Cat A, B, C and D.1 - D.8) -> Fits Page 1

        const itemsA = GENERATOR_CHECKLIST.filter(c => c.cat === 'A');

        const itemsB = GENERATOR_CHECKLIST.filter(c => c.cat === 'B');

        const itemsC = GENERATOR_CHECKLIST.filter(c => c.cat === 'C');

        const itemsD_part1 = GENERATOR_CHECKLIST.filter(c => c.cat === 'D').slice(0, 8);

        const itemsD_part2 = GENERATOR_CHECKLIST.filter(c => c.cat === 'D').slice(8);



        blocks.push(`

            <div class="tkm-sec-title">4. GENEL KONTROLLER</div>

            <table class="tkm-table" style="font-size:6.8pt;">

                <colgroup>

                    <col style="width:30px;"><col style="width:42.5%;"><col style="width:24px;">

                    <col style="width:30px;"><col style="width:42.5%;"><col style="width:24px;">

                </colgroup>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">A ÜÇÜNCÜ TARAF DOKÜMANLARININ KONTROLLERİ</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsA)}

                </tbody>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">B JENERATÖR ODASI KONTROLLERİ</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">B JENERATÖR ODASI KONTROLLERİ</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsB)}

                </tbody>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">C GÖRSEL KONTROLLER</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">C GÖRSEL KONTROLLER</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsC)}

                </tbody>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">D FONKSİYONEL KONTROLLER</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">D FONKSİYONEL KONTROLLER</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsD_part1)}

                </tbody>

            </table>

        `);



        // Block 4B: Part 2 (D.9 to D.16) + Section 5 (Ölçüm Sonuçları) -> Fits Page 2

        blocks.push(`

            <table class="tkm-table" style="font-size:6.8pt;margin-top:2px;">

                <colgroup>

                    <col style="width:30px;"><col style="width:42.5%;"><col style="width:24px;">

                    <col style="width:30px;"><col style="width:42.5%;"><col style="width:24px;">

                </colgroup>

                <thead>

                    <tr>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">D FONKSİYONEL KONTROLLER (Devam)</th><th style="text-align:center;font-weight:700;">Durum</th>

                        <th colspan="2" style="text-align:left;font-weight:700;padding-left:4px;">D FONKSİYONEL KONTROLLER (Devam)</th><th style="text-align:center;font-weight:700;">Durum</th>

                    </tr>

                </thead>

                <tbody>

                    ${renderChecklistCategoryRows(itemsD_part2)}

                </tbody>

            </table>



            <div class="tkm-sec-title">5. ÖLÇÜM SONUÇLARI</div>

            <div class="tkm-sub-bar">5.1. POTANSİYEL ÖLÇÜMLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">L1 – N (V)</th>

                        <th style="text-align:center;font-weight:700;">L2 – N (V)</th>

                        <th style="text-align:center;font-weight:700;">L3 – N (V)</th>

                        <th style="text-align:center;font-weight:700;">L1 – L2 (V)</th>

                        <th style="text-align:center;font-weight:700;">L1 – L3 (V)</th>

                        <th style="text-align:center;font-weight:700;">L2 – L3 (V)</th>

                        <th style="text-align:center;font-weight:700;">N – Pe (V)</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gPot.l1_n || ''}</td>

                        <td style="text-align:center;">${gPot.l2_n || ''}</td>

                        <td style="text-align:center;">${gPot.l3_n || ''}</td>

                        <td style="text-align:center;">${gPot.l1_l2 || ''}</td>

                        <td style="text-align:center;">${gPot.l1_l3 || ''}</td>

                        <td style="text-align:center;">${gPot.l2_l3 || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gPot.n_pe || ''}</td>

                    </tr>

                </tbody>

            </table>



            <div class="tkm-sub-bar" style="margin-top:3px;">5.2. AYDINLATMA, SES, TOPRAKLAMA, ISI VE FREKANS ÖLÇÜMLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Aydınlatma Şiddeti (lux)</th>

                        <th style="text-align:center;font-weight:700;">1 mt' de Ses Seviyesi (dB)</th>

                        <th style="text-align:center;font-weight:700;">7 mt' de Ses Seviyesi (dB)</th>

                        <th style="text-align:center;font-weight:700;">L1 – Frekans (Hz)</th>

                        <th style="text-align:center;font-weight:700;">L2 – Frekans (Hz)</th>

                        <th style="text-align:center;font-weight:700;">L3 – Frekans (Hz)</th>

                        <th style="text-align:center;font-weight:700;">Gövde Topraklaması (Ω)</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gMeas.lux || ''}</td>

                        <td style="text-align:center;">${gMeas.db_1m || ''}</td>

                        <td style="text-align:center;">${gMeas.db_7m || ''}</td>

                        <td style="text-align:center;">${gMeas.hz_l1 || ''}</td>

                        <td style="text-align:center;">${gMeas.hz_l2 || ''}</td>

                        <td style="text-align:center;">${gMeas.hz_l3 || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gMeas.ground_r || ''}</td>

                    </tr>

                </tbody>

            </table>



            <div class="tkm-sub-bar" style="margin-top:3px;">5.3. AKÜ BİLGİLERİ VE ÖLÇÜMLERİ</div>

            <table class="tkm-table">

                <thead>

                    <tr>

                        <th style="text-align:center;font-weight:700;">Marka</th>

                        <th style="text-align:center;font-weight:700;">Model</th>

                        <th style="text-align:center;font-weight:700;">Seri No</th>

                        <th style="text-align:center;font-weight:700;">İmal Yılı</th>

                        <th style="text-align:center;font-weight:700;">Redresör Devredeyken (V)</th>

                        <th style="text-align:center;font-weight:700;">Redresör Devre Dışıyken (V)</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td style="text-align:center;">${gBat.brand || ''}</td>

                        <td style="text-align:center;">${gBat.model || ''}</td>

                        <td style="text-align:center;">${gBat.serialNo || ''}</td>

                        <td style="text-align:center;">${gBat.mfgYear || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gBat.v_on || ''}</td>

                        <td style="text-align:center;font-weight:700;">${gBat.v_off || ''}</td>

                    </tr>

                </tbody>

            </table>

        `);



        // Block 5: 6. KUSUR AÇIKLAMALARI

        blocks.push(`

            <div class="tkm-sec-title">6. KUSUR AÇIKLAMALARI</div>

            <table class="tkm-table">

                <tbody>

                    <tr>

                        <td style="min-height:18px;height:18px;vertical-align:top;text-align:left;">

                            ${(fd.defectNotes || '').replace(/\n/g, '<br>')}

                        </td>

                    </tr>

                </tbody>

            </table>

        `);



        // Photos Block (if attached) - exactly between Section 6 and Section 7 as in official sample report!

        if (fd.photos && fd.photos.length) {

            blocks.push(...renderPdfPhotoBlocks(fd.photos, 'FOTOĞRAFLAR'));

        }



        // Block 6: 7. SONUÇ VE KANAAT

        const isGenSuitable = fd.overallResult !== 'UYGUN DEĞİL';

        blocks.push(`

            <div class="tkm-sec-title">7. SONUÇ VE KANAAT</div>

            <table class="tkm-table">

                <tbody>

                    <tr>

                        <td style="padding:6px 8px;text-align:left;font-size:7.4pt;font-weight:700;color:${isGenSuitable ? '#047857' : '#c00000'};line-height:1.25;">
                            Periyodik kontrol tarihi itibariyle yukarıda teknik özellikleri belirtilen jeneratör muayenesi sonrasında mevcut şartlar altında<br>
                            <span style="font-size:8.4pt;">
                                ${isGenSuitable ? 'KULLANILMASI UYGUNDUR.' : 'KULLANILMASI UYGUN DEĞİLDİR.'}
                            </span>
                        </td>

                    </tr>

                </tbody>

            </table>

            <div class="tkm-legend">✓ : Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>

        `);



        // Block 7: 8. ONAY

        blocks.push(buildTkmOnaySection(insp, '8'));



        return paginateBlocksIntoA4Pages(blocks, reportMainTitle, docFormCode, reportNo);



}

function buildPdfPagesSpecialized(insp, fd, ci, reportNo, formCode, activePdfTheme) {

        // Specialized Templates (Paratoner, Yangın, Kapı, Raf, Klima vb.)

        const schema = window.getDynamicSchemaForEquipment(insp.template_id, insp.equipment_name);

        const reportMainTitle = (insp.equipment_name || schema.title || 'İŞ EKİPMANI').toUpperCase();

        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];



        const fields = schema.generalFields || schema.fields || [];

        let fieldsGridHtml = '<table class="tkm-table"><colgroup><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.4%;"></colgroup><tbody>';

        for (let i = 0; i < fields.length; i += 3) {

            fieldsGridHtml += '<tr>';

            for (let c = 0; c < 3; c++) {

                const f = fields[i + c];

                if (f) {

                    const fKey = f.key || f.id;

                    const val = fd.specializedFields?.[fKey] ?? '';

                    fieldsGridHtml += `

                        <td style="text-align:center;">${f.label}</td>

                        <td style="text-align:left;padding-left:5px;">${val}</td>

                    `;

                } else {

                    fieldsGridHtml += '<td></td><td></td>';

                }

            }

            fieldsGridHtml += '</tr>';

        }

        fieldsGridHtml += '</tbody></table>';



        const cHtml = (schema.visualChecks || []).map((c, idx) => `

            <tr>

                <td style="text-align:center;font-weight:700;">${letters[idx] || (idx + 1)}</td>

                <td style="text-align:left;padding-left:6px;">${c}</td>

                <td style="text-align:center;">${formatSymbolForPrint(fd.specializedChecks?.[`chk_${idx}`] || '')}</td>

            </tr>

        `).join('');



        const tableCols = schema.tableColumns || [];

        const normalizedRows = normalizeSpecializedRowsArray(fd.specializedRows || [], tableCols);

        const ths = tableCols.map(c => `<th style="text-align:center;font-weight:700;">${c.label}</th>`).join('');

        const trs = normalizedRows.map(r => `

            <tr>${r.map(cell => `<td style="text-align:center;">${cell}</td>`).join('')}</tr>

        `).join('');



        const devRowsHtml = ((fd.measuringDevices && fd.measuringDevices.length) ? fd.measuringDevices : [

            { name: '', serial: '', calDate: '', validDate: '', certNo: '' }

        ]).map(d => `

            <tr>

                <td style="text-align:center;">${d.name || ''}</td>

                <td style="text-align:center;">${d.serial || ''}</td>

                <td style="text-align:center;">${d.calDate || ''}</td>

                <td style="text-align:center;">${d.validDate || ''}</td>

                <td style="text-align:center;">${d.certNo || ''}</td>

            </tr>

        `).join('');



        const methodsHtml = (schema.methods && schema.methods.length)

            ? schema.methods.map(m => `• ${m}`).join('<br>')

            : '• RG, 25.04.2013 - 28628 İş Ekipmanları Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği';



        const specBlocks = [

            `

                <div class="tkm-sec-title">1. FİRMA BİLGİLERİ</div>

                <table class="tkm-table">

                    <colgroup><col style="width:19%;"><col style="width:36%;"><col style="width:17%;"><col style="width:28%;"></colgroup>

                    <tbody>

                        <tr><td style="font-weight:700;">Firma Adı</td><td colspan="3">${ci.firmName}</td></tr>

                        <tr><td style="font-weight:700;">Periyodik Kontrol Adresi</td><td colspan="3">${ci.address}</td></tr>

                        <tr><td style="font-weight:700;">İSG-KATİP Sözleşme ID</td><td>${ci.isgKatipNo}</td><td style="font-weight:700;">SGK Sicil No</td><td>${ci.sgkSicilNo}</td></tr>

                        <tr><td style="font-weight:700;">Rapor Numarası</td><td>${reportNo}</td><td style="font-weight:700;">Rapor Tarihi</td><td>${insp.inspection_date || ci.reportDate}</td></tr>

                        <tr><td style="font-weight:700;">Periyodik Kontrol Başlangıç ve Bitiş Saati</td><td>${ci.startEndTime}</td><td style="font-weight:700;">Bir Sonraki Periyodik Kontrol Tarihi</td><td>${fd.nextInspectionDate || ci.nextControlDate}</td></tr>

                        <tr><td style="font-weight:700;">Ekipman Seri No / Kod</td><td colspan="3">${ci.serialCode}</td></tr>

                        <tr><td style="font-weight:700;">Periyodik Kontrol Metodu ve Kapsamı</td><td colspan="3" style="line-height:1.22;">${methodsHtml}</td></tr>

                    </tbody>

                </table>

            `,

            `

                <div class="tkm-sec-title">2. EKİPMAN TEKNİK BİLGİLERİ</div>

                <div class="tkm-sub-bar">2.1. DETAY VE TESİS BİLGİLERİ</div>

                ${fieldsGridHtml}

            `,

            `

                <div class="tkm-sec-title">3. ÖLÇÜM ALETLERİ BİLGİLERİ</div>

                <table class="tkm-table">

                    <thead>

                        <tr>

                            <th style="text-align:center;font-weight:700;">Cihaz Adı</th>

                            <th style="text-align:center;font-weight:700;">Seri No</th>

                            <th style="text-align:center;font-weight:700;">Kalibrasyon Tarihi</th>

                            <th style="text-align:center;font-weight:700;">Kalibrasyon Geçerlilik Tarihi</th>

                            <th style="text-align:center;font-weight:700;">Sertifika No</th>

                        </tr>

                    </thead>

                    <tbody>${devRowsHtml}</tbody>

                </table>

            `,

            `

                <div class="tkm-sec-title">4. GÖZLE KONTROL KRİTERLERİ VE FONKSİYON TESTLERİ</div>

                <div class="tkm-sub-bar">4.1. KONTROL KRİTERLERİ</div>

                <table class="tkm-table">

                    <colgroup><col style="width:28px;"><col><col style="width:42px;"></colgroup>

                    <thead><tr><th></th><th style="text-align:left;padding-left:6px;font-weight:700;">Soru / Kriter</th><th style="text-align:center;font-weight:700;">1</th></tr></thead>

                    <tbody>${cHtml}</tbody>

                </table>

                <div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>

            `,

            `

                <div class="tkm-sec-title">5. ÖLÇÜM VE TEST SONUÇLARI TABLOSU</div>

                <table class="tkm-table">

                    <thead><tr>${ths}</tr></thead>

                    <tbody>${trs}</tbody>

                </table>

            `,

            `

                <div class="tkm-sec-title">6. KUSUR AÇIKLAMALARI & 7. NOTLAR</div>

                <table class="tkm-table">

                    <tbody>

                        <tr><td style="font-weight:700;width:19%;">Kusur Açıklamaları</td><td>${(fd.defectNotes || '').replace(/\n/g, '<br>')}</td></tr>

                        <tr><td style="font-weight:700;">Notlar</td><td>${(fd.generalNotes || '').replace(/\n/g, '<br>')}</td></tr>

                    </tbody>

                </table>

            `,

            ...(fd.photos && fd.photos.length ? renderPdfPhotoBlocks(fd.photos, 'FOTOĞRAFLAR') : []),

            `

                <div class="tkm-sec-title">8. SONUÇ VE KANAAT</div>

                <table class="tkm-table">

                    <tbody>

                        <tr>

                            <td style="padding:5px 6px;font-weight:700;font-size:7.4pt;color:${fd.overallResult === 'UYGUN DEĞİL' ? '#c00000' : '#047857'};line-height:1.25;">
                                Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen ekipmanın muayenesi sonrasında mevcut şartlar altında<br>
                                <span style="font-size:8.4pt;">
                                    KULLANIMI ${fd.overallResult === 'UYGUN DEĞİL' ? 'UYGUN DEĞİLDİR.' : 'UYGUNDUR.'}
                                </span>
                            </td>

                        </tr>

                    </tbody>

                </table>

            `,

            buildTkmOnaySection(insp, '9')

        ];



        const specDocCode = ((schema.docNo || schema.code || formCode).split(',')[0] || formCode).trim();

        return paginateBlocksIntoA4Pages(specBlocks, reportMainTitle, specDocCode, reportNo);

}


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







// ============================================================================
// HIZLI RAPOR - 11B-AUTH-AND-SETTINGS.JS
// Açıklama: Kullanıcı Hesapları, Kimlik Yönetimi, Şirket/Marka ve Uygulama Ayarları
// ============================================================================

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

                if (Array.isArray(list)) return list;

            }

        } catch (e) {}

        return [];

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



    upsertCloudUser(data) {

        const users = this.getUsers();

        const cloudId = String(data.cloudId || data.id || '').trim();

        const uname = String(data.username || '').trim();

        const localId = 'cloud_' + cloudId;

        const idx = users.findIndex(u =>
            (cloudId && String(u.cloudId) === cloudId)
            || String(u.id) === localId
            || (uname && String(u.username || '').trim().toLowerCase() === uname.toLowerCase())
        );

        const existing = idx >= 0 ? users[idx] : {};

        const record = {

            id: localId,

            cloudId,

            tenantId: String(data.tenantId || existing.tenantId || ''),

            tenantName: String(data.tenantName || existing.tenantName || ''),

            username: uname || existing.username || '',

            password: (data.password !== null && data.password !== undefined && data.password !== '')
                ? String(data.password).trim()
                : (existing.password || ''),

            role: String(data.role || existing.role || 'inspector'),

            fullName: String(data.fullName || existing.fullName || uname).trim(),

            title: String(data.title || existing.title || 'Elektrik Mühendisi').trim(),

            ministryRegNo: String(data.ministryRegNo !== undefined ? data.ministryRegNo : (existing.ministryRegNo || '')).trim(),

            diplomaNoDate: String(data.diplomaNoDate !== undefined ? data.diplomaNoDate : (existing.diplomaNoDate || '')).trim(),

            emoNo: String(data.emoNo !== undefined ? data.emoNo : (existing.emoNo || '')).trim(),

            cloudToken: data.cloudToken || existing.cloudToken || '',

            isCloudManaged: true,

            lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),

            createdAt: existing.createdAt || new Date().toISOString()

        };

        if (idx >= 0) {

            users[idx] = record;

        } else {

            users.push(record);

        }

        this.saveUsers(users);

        localStorage.setItem(this.STORAGE_SESSION_KEY, record.id);

        if (typeof updateHeaderUserWidget === 'function') updateHeaderUserWidget();

        return record;

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

            <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 text-center flex items-center justify-center gap-3">

                <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400 text-slate-950 text-lg font-black shadow-md shrink-0">

                    <i class="fa-solid fa-bolt"></i>

                </div>

                <h1 class="font-black text-base tracking-tight">Personel Girişi</h1>

            </div>



            <!-- FORM AREA -->

            <div class="p-4 space-y-4">

                ${renderLoginFormHtml(users)}

            </div>

        </div>

    `;

}



function renderLoginFormHtml(users) {

    return `

        <div class="space-y-3.5 text-xs">

            ${users.length > 0 ? `

                <div>

                    <label class="block font-bold text-slate-700 mb-1">Cihazdaki Kayıtlı Hesaplar</label>

                    <div class="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">

                        ${users.map(u => `

                            <button type="button" onclick="selectQuickUser('${escapeForJs(u.username)}')"

                                class="p-2 rounded-lg bg-white border border-slate-200 hover:border-sky-500 text-left flex items-center justify-between transition active:scale-98">

                                <div class="min-w-0">

                                    <div class="font-bold text-slate-900 truncate">${escapeHtml(u.fullName)}</div>

                                    <div class="text-[10px] text-slate-500 truncate">${escapeHtml(u.tenantName || u.title || 'Mühendis')}</div>

                                </div>

                                <span class="text-[10px] text-sky-700 font-mono font-bold bg-sky-50 px-1.5 py-0.5 rounded">@${escapeHtml(u.username)}</span>

                            </button>

                        `).join('')}

                    </div>

                </div>

            ` : ''}



            <div>

                <label class="block font-bold text-slate-700 mb-1">Kullanıcı Adı</label>

                <input type="text" id="loginUsername" placeholder="Kullanıcı adı"

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

            </div>



            <div id="loginSyncStatus" class="hidden p-2.5 rounded-xl text-[11px] font-semibold"></div>



            <button type="button" id="loginSubmitBtn" onclick="handleLoginSubmit()"

                class="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5">

                <i class="fa-solid fa-right-to-bracket"></i>

                <span>Giriş Yap</span>

            </button>

        </div>

    `;

}



function renderRegisterFormHtml() {

    return `

        <div class="space-y-3 text-xs">

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



async function handleLoginSubmit() {

    const u = (document.getElementById('loginUsername')?.value || '').trim();

    const p = (document.getElementById('loginPassword')?.value || '').trim();

    if (!u || !p) return showToast('Lütfen kullanıcı adı ve şifre girin', 'warning');



    const btn = document.getElementById('loginSubmitBtn');

    const statusEl = document.getElementById('loginSyncStatus');

    const setStatus = (msg, cls) => {

        if (!statusEl) return;

        statusEl.textContent = msg;

        statusEl.className = `p-2.5 rounded-xl text-[11px] font-semibold ${cls}`;

        statusEl.classList.remove('hidden');

    };



    if (btn) {

        btn.disabled = true;

        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Buluta bağlanılıyor...</span>';

    }

    setStatus('Firma hesabınız doğrulanıyor, cihazlarınız ve iş klasörleriniz alınıyor...', 'bg-sky-50 text-sky-800 border border-sky-200');



    try {

        if (window.CloudAppSync && typeof window.CloudAppSync.loginOnline === 'function') {

            const cloudRes = await window.CloudAppSync.loginOnline(u, p);

            if (cloudRes.success) {

                showToast(`Hoş geldiniz, ${cloudRes.user?.fullName || u}! (${cloudRes.deviceCount} cihaz, ${cloudRes.workOrderCount} iş klasörü)`);

                navigateTo('home');

                return;

            }

            if (cloudRes.authError) {

                setStatus(cloudRes.message || 'Kullanıcı adı veya şifre hatalı!', 'bg-rose-50 text-rose-800 border border-rose-200');

                showToast(cloudRes.message || 'Kullanıcı adı veya şifre hatalı!', 'error');

                return;

            }

        }



        // Yalnızca sunucuya ulaşılamadığında (çevrimdışı) daha önce giriş yapılmış yerel hesaba düş

        const res = AuthManager.login(u, p);

        if (res.success) {

            showToast(`Çevrimdışı giriş yapıldı: ${res.user.fullName}`, 'info');

            navigateTo('home');

        } else {

            const offlineMsg = 'İnternete ulaşılamadı ve bu cihazda kayıtlı çevrimdışı oturum bulunamadı. İlk girişte internet bağlantısı gereklidir.';

            setStatus(offlineMsg, 'bg-amber-50 text-amber-900 border border-amber-200');

            showToast(offlineMsg, 'error');

        }

    } finally {

        if (btn) {

            btn.disabled = false;

            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Giriş Yap ve Cihazları / İşleri Yükle</span>';

        }

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

    const isManaged = Boolean(user.isCloudManaged);



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



            <div>

                <label class="block font-bold text-slate-700 mb-0.5">Adı Soyadı</label>

                <input type="text" id="profFullName" value="${escapeHtml(user.fullName || '')}" ${isManaged ? 'readonly' : ''}

                    class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

            </div>



            <div class="grid grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Meslek / Unvan</label>

                    <input type="text" id="profTitle" value="${escapeHtml(user.title || 'Elektrik Mühendisi')}" ${isManaged ? 'readonly' : ''}

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Bakanlık Kayıt No</label>

                    <input type="text" id="profMinistry" value="${escapeHtml(user.ministryRegNo || '')}" ${isManaged ? 'readonly' : ''}

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

                </div>

            </div>



            <div class="grid grid-cols-2 gap-2">

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">Diploma No / Tarih</label>

                    <input type="text" id="profDiploma" value="${escapeHtml(user.diplomaNoDate || '')}" ${isManaged ? 'readonly' : ''}

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

                </div>

                <div>

                    <label class="block font-bold text-slate-700 mb-0.5">EMO / Oda Sicil No</label>

                    <input type="text" id="profEmo" value="${escapeHtml(user.emoNo || '')}" ${isManaged ? 'readonly' : ''}

                        class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono ${isManaged ? 'bg-slate-100 text-slate-600' : 'bg-white'}">

                </div>

            </div>



            ${isManaged ? '' : `
            <div>

                <label class="block font-bold text-slate-700 mb-0.5">Şifre Değiştir (İsteğe Bağlı)</label>

                <input type="password" id="profPassword" value="${escapeHtml(user.password || '')}"

                    class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white">

            </div>
            `}

        </div>

        `,

        `

        <button onclick="closeModal()" class="px-3 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-lg">Kapat</button>

        ${isManaged ? '' : `
        <button onclick="saveUserProfileSubmit('${user.id}')" class="px-4 py-2 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-lg active:scale-95 shadow-sm">

            <i class="fa-solid fa-floppy-disk mr-1"></i>Bilgileri Kaydet

        </button>
        `}

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

    const curUser = (typeof AuthManager !== 'undefined' && AuthManager.getCurrentUser()) || null;

    if (curUser && curUser.isCloudManaged) {

        showToast('Firma ve rapor antet bilgileri yalnızca firma yöneticisi web panelinden değiştirilebilir.', 'warning');

        return;

    }

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

                        <span>Raporda Akreditasyon Logosu Göster</span>

                    </label>

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

                    <div class="text-[10px] text-slate-400 mt-0.5"><code>{COMPANY_NAME}</code> = Şirket adı</div>

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

    const isManaged = Boolean(curUser && curUser.isCloudManaged);

    const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : DEFAULT_COMPANY_BRANDING;

    const logoSrc = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getLogoSrc() : 'assets/tekkomer_logo.png';



    OfflineDB.init();

    const db = OfflineDB.state || {};

    const workOrderCount = (db.workOrders || []).length;

    const inspectionCount = (db.inspections || []).length;



    container.innerHTML = `

        <div class="max-w-2xl mx-auto space-y-2.5 pb-8">

            <!-- 1. ÜST BAŞLIK -->

            <div class="card-craft-white p-2.5 flex items-center justify-between gap-2">

                <div class="min-w-0">

                    <h1 class="font-bold text-slate-900 text-sm sm:text-base truncate flex items-center gap-2">

                        <i class="fa-solid fa-sliders text-sky-600"></i>

                        <span>Uygulama & Şirket Ayarları</span>

                    </h1>

                </div>

                <span class="text-[10px] ${isManaged ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-sky-50 text-sky-700 border-sky-200'} border px-2 py-0.5 rounded-full font-bold shrink-0">

                    ${isManaged ? 'Bulut + Çevrimdışı' : '%100 Çevrimdışı'}

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

                        ${isManaged && curUser.tenantName ? escapeHtml(curUser.tenantName) : 'Aktif Personel'}

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

                        ${curUser && curUser.ministryRegNo ? `
                        <div class="text-[11px] text-slate-400 mt-0.5 truncate">
                            Bakanlık Sicil: ${escapeHtml(curUser.ministryRegNo)}
                        </div>
                        ` : ''}

                    </div>

                </div>



                ${isManaged ? `
                    <button type="button" onclick="window.CloudAppSync && window.CloudAppSync.syncNow()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs">
                        <i class="fa-solid fa-arrows-rotate"></i>
                        <span>Buluttan Senkronize Et</span>
                    </button>
                ` : ''}

                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/60">

                    <button onclick="openUserProfileModal()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 border border-slate-600/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs">

                        <i class="fa-solid fa-id-card text-amber-400"></i>

                        <span>${isManaged ? 'Profil Bilgilerim' : 'Profilimi Düzenle'}</span>

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

                        <span>Şirket & Marka Bilgileri</span>

                    </div>

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



                ${isManaged ? `
                    <div class="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 text-center">
                        Firma bilgileri yönetici panelinden gelir.
                    </div>
                ` : `
                    <button onclick="openCompanySettingsModal()" class="w-full py-2.5 btn-craft-primary active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition">

                        <i class="fa-solid fa-pen-nib"></i>

                        <span>Şirket Adı, Logo ve Akreditasyonu Düzenle</span>

                    </button>
                `}

            </div>



            <!-- 4. RAPOR KODLARI -->

            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-file-invoice text-emerald-600"></i>

                        <span>Rapor Kodları</span>

                    </div>

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

            </div>



            <!-- 4B. TARİH, SAAT & GEÇERLİLİK SÜRESİ AYARLARI -->

            ${(() => {
                const dtPrefs = (typeof ReportDateTimePrefs !== 'undefined') ? ReportDateTimePrefs.get() : { fixedStartTime: '', fixedEndTime: '', validityMonths: { '2201': 12, '2202': 12, '2205': 12, 'default': 12 } };
                const tpls = Array.isArray(window.ENLAB_REPORT_TEMPLATES) ? window.ENLAB_REPORT_TEMPLATES : [
                    { id: '2201', name: 'ELEKTRİK İÇ TESİSATI' },
                    { id: '2202', name: 'ALÇAK GERİLİM TOPRAKLAMA' },
                    { id: '2205', name: 'JENERATÖR' }
                ];
                return `
            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-clock text-sky-600"></i>

                        <span>Tarih, Saat &amp; Geçerlilik Süresi</span>

                    </div>

                    <span id="settingsDateTimeSavedBadge" class="hidden text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Kaydedildi</span>

                </div>

                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">

                    <div class="flex items-center justify-between gap-2">

                        <span class="font-bold text-slate-700">Sabit Kontrol Saati</span>

                        <button type="button" onclick="clearFixedReportTimesFromSettings()" class="text-[11px] font-bold text-sky-700 hover:underline">Sıfırla (Anlık Saat)</button>

                    </div>

                    <div class="grid grid-cols-2 gap-2">

                        <div>

                            <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Sabit Başlangıç Saati</label>

                            <input type="time" id="settingsFixedStartTime" value="${escapeHtml(dtPrefs.fixedStartTime || '')}"

                                onchange="saveReportDateTimePrefsFromSettings()"

                                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white">

                        </div>

                        <div>

                            <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Sabit Bitiş Saati</label>

                            <input type="time" id="settingsFixedEndTime" value="${escapeHtml(dtPrefs.fixedEndTime || '')}"

                                onchange="saveReportDateTimePrefsFromSettings()"

                                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white">

                        </div>

                    </div>

                </div>

                <div class="space-y-1.5 text-xs">

                    <div class="font-bold text-slate-700">Rapor Geçerlilik Süresi (Ay)</div>

                    <div class="grid grid-cols-1 gap-1.5">

                        ${tpls.map(t => {
                            const tid = String(t.id);
                            const label = (typeof getCleanTemplateTypeLabel === 'function') ? getCleanTemplateTypeLabel(tid, t.code) : (t.name || tid);
                            const val = dtPrefs.validityMonths[tid] ?? dtPrefs.validityMonths['default'] ?? 12;
                            return `
                            <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">

                                <span class="font-semibold text-slate-800 truncate">${escapeHtml(label)}</span>

                                <div class="flex items-center gap-1.5 shrink-0">

                                    <input type="number" min="1" max="120" value="${escapeHtml(String(val))}"

                                        onchange="saveReportValidityMonthFromSettings('${escapeForJs(tid)}', this.value)"

                                        class="w-16 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white">

                                    <span class="text-[11px] font-bold text-slate-500">Ay</span>

                                </div>

                            </div>`;
                        }).join('')}

                    </div>

                </div>

            </div>
                `;
            })()}



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

                        <span>Bulut Müşteri Portalı</span>

                    </div>

                    <code id="settingsPortalActiveHost" class="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">${escapeHtml(activeHost)}</code>

                </div>

                <div class="flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2">
                    <span>Aktif Şirket: <strong class="text-slate-900">${escapeHtml(activeComp.companyName)}</strong></span>
                    <span class="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold">/p/${escapeHtml(activeComp.companySlug)}-...</span>
                    ${!activeComp.isCustomized && !isManaged ? `
                        <button type="button" onclick="openCompanySettingsModal()" class="text-[10px] font-bold text-indigo-700 underline shrink-0">Şirket Adını Düzenle</button>
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
                        <span class="flex items-center gap-1.5"><i class="fa-solid fa-sliders text-slate-400"></i> Gelişmiş Ayarlar</span>
                        <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
                    </button>

                    <div id="settingsPortalAdvancedWrap" class="hidden mt-2 space-y-2 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Özel Alan Adı / Sunucu URL</label>
                            <input type="url" id="settingsPortalUrl" value="${escapeHtml(pCfg.customPortalUrl || '')}"
                                placeholder="https://hizli-rapor-portal.vercel.app (varsayılan)"
                                class="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Yönetici Anahtarı</label>
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
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Varsayılan Müşteri Klasör PIN</label>
                            <input type="text" id="settingsPortalPin" value="${escapeHtml(pCfg.defaultPin || '')}"
                                placeholder="Örn: 4829"
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



            <!-- 5. VERİ YEDEKLEME VE KURTARMA MERKEZİ -->

            <div class="card-craft-white p-3 space-y-2.5">

                <div class="flex items-center justify-between border-b border-slate-100 pb-2">

                    <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">

                        <i class="fa-solid fa-database text-amber-500"></i>

                        <span>Veri Yedekleme ve Kurtarma</span>

                    </div>

                </div>



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

        </div>

    `;



    if (typeof CompanySettingsManager !== 'undefined') {

        CompanySettingsManager.syncHeaderTitle();

    }

    updateHeaderUserWidget();

}

window.renderSettingsPage = renderSettingsPage;

function flashSettingsDateTimeSaved() {
    const b = document.getElementById('settingsDateTimeSavedBadge');
    if (b) {
        b.classList.remove('hidden');
        clearTimeout(window._dtSavedTimer);
        window._dtSavedTimer = setTimeout(() => b.classList.add('hidden'), 1800);
    }
}

function saveReportDateTimePrefsFromSettings() {
    if (typeof ReportDateTimePrefs === 'undefined') return;
    const st = document.getElementById('settingsFixedStartTime')?.value || '';
    const et = document.getElementById('settingsFixedEndTime')?.value || '';
    ReportDateTimePrefs.save({ fixedStartTime: st, fixedEndTime: et });
    flashSettingsDateTimeSaved();
}

function clearFixedReportTimesFromSettings() {
    if (typeof ReportDateTimePrefs === 'undefined') return;
    ReportDateTimePrefs.clearFixedTimes();
    const sEl = document.getElementById('settingsFixedStartTime');
    const eEl = document.getElementById('settingsFixedEndTime');
    if (sEl) sEl.value = '';
    if (eEl) eEl.value = '';
    flashSettingsDateTimeSaved();
    showToast('Sabit saat sıfırlandı, anlık giriş saati kullanılacak.');
}

function saveReportValidityMonthFromSettings(templateId, months) {
    if (typeof ReportDateTimePrefs === 'undefined') return;
    ReportDateTimePrefs.setValidityMonth(templateId, months);
    flashSettingsDateTimeSaved();
}

window.saveReportDateTimePrefsFromSettings = saveReportDateTimePrefsFromSettings;
window.clearFixedReportTimesFromSettings = clearFixedReportTimesFromSettings;
window.saveReportValidityMonthFromSettings = saveReportValidityMonthFromSettings;

window.promptSecurityPasswordConfirmation = promptSecurityPasswordConfirmation;

window.executeSecurityPasswordCheck = executeSecurityPasswordCheck;



// ============================================================================
// HIZLI RAPOR - MODÜL 12: BULUT MÜŞTERİ PORTALI & OFFLINE QR MOTORU
// Vercel + Supabase / Yerel Portal Sunucusuna Tek Tıkla Rapor Yükleme
// ============================================================================

(function () {
    const PORTAL_CONFIG_STORAGE_KEY = 'enlab_portal_config_v1';
    const CUSTOMER_ACCOUNTS_STORAGE_KEY = 'enlab_customer_portal_accounts_v1';
    const DEFAULT_CLOUD_PORTAL_URL = 'https://hizli-rapor-portal.vercel.app';

    // ========================================================================
    // 1. PURE-JS OFFLINE QR CODE ENCODER (ISO/IEC 18004, Versions 1-12, ECC M)
    // ========================================================================
    const QR_GF_EXP = new Uint8Array(512);
    const QR_GF_LOG = new Uint8Array(256);
    (function initGaloisTables() {
        let x = 1;
        for (let i = 0; i < 255; i++) {
            QR_GF_EXP[i] = x;
            QR_GF_EXP[i + 255] = x;
            QR_GF_LOG[x] = i;
            x <<= 1;
            if (x & 0x100) x ^= 0x11d;
        }
        QR_GF_EXP[510] = QR_GF_EXP[0];
        QR_GF_EXP[511] = QR_GF_EXP[1];
    })();

    function qrGfMul(a, b) {
        if (a === 0 || b === 0) return 0;
        return QR_GF_EXP[QR_GF_LOG[a] + QR_GF_LOG[b]];
    }

    function qrRsGeneratorPoly(ecCount) {
        let g = [1];
        for (let i = 0; i < ecCount; i++) {
            const next = new Array(g.length + 1).fill(0);
            const alphaI = QR_GF_EXP[i];
            for (let j = 0; j < g.length; j++) {
                next[j] ^= g[j];
                next[j + 1] ^= qrGfMul(g[j], alphaI);
            }
            g = next;
        }
        return g;
    }

    function qrRsRemainder(dataBytes, ecCount) {
        const gen = qrRsGeneratorPoly(ecCount);
        const buf = new Uint8Array(dataBytes.length + ecCount);
        buf.set(dataBytes, 0);
        for (let i = 0; i < dataBytes.length; i++) {
            const factor = buf[i];
            if (factor !== 0) {
                for (let j = 0; j < gen.length; j++) {
                    buf[i + j] ^= qrGfMul(gen[j], factor);
                }
            }
        }
        return buf.slice(dataBytes.length);
    }

    // [version, totalDataCodewords, ecPerBlock, alignmentCoords, blockGroups: [[count, totalPerBlock, dataPerBlock], ...]]
    const QR_VERSION_M_SPECS = [
        null,
        { v: 1,  dataCw: 16,  ecPerBlk: 10, align: [],           groups: [[1, 26, 16]] },
        { v: 2,  dataCw: 28,  ecPerBlk: 16, align: [6, 18],      groups: [[1, 44, 28]] },
        { v: 3,  dataCw: 44,  ecPerBlk: 26, align: [6, 22],      groups: [[1, 70, 44]] },
        { v: 4,  dataCw: 64,  ecPerBlk: 18, align: [6, 26],      groups: [[2, 50, 32]] },
        { v: 5,  dataCw: 86,  ecPerBlk: 24, align: [6, 30],      groups: [[2, 67, 43]] },
        { v: 6,  dataCw: 108, ecPerBlk: 16, align: [6, 34],      groups: [[4, 43, 27]] },
        { v: 7,  dataCw: 124, ecPerBlk: 18, align: [6, 22, 38],  groups: [[4, 49, 31]] },
        { v: 8,  dataCw: 154, ecPerBlk: 22, align: [6, 24, 42],  groups: [[2, 60, 38], [2, 61, 39]] },
        { v: 9,  dataCw: 182, ecPerBlk: 22, align: [6, 26, 46],  groups: [[3, 58, 36], [2, 59, 37]] },
        { v: 10, dataCw: 216, ecPerBlk: 26, align: [6, 28, 50],  groups: [[4, 69, 43], [1, 70, 44]] },
        { v: 11, dataCw: 254, ecPerBlk: 30, align: [6, 30, 54],  groups: [[1, 80, 50], [4, 81, 51]] },
        { v: 12, dataCw: 290, ecPerBlk: 22, align: [6, 32, 58],  groups: [[6, 58, 36], [2, 59, 37]] }
    ];

    function utf8Bytes(str) {
        if (typeof TextEncoder !== 'undefined') {
            return new TextEncoder().encode(String(str || ''));
        }
        const s = unescape(encodeURIComponent(String(str || '')));
        const arr = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
        return arr;
    }

    function pickQrVersion(byteLen) {
        for (let v = 1; v < QR_VERSION_M_SPECS.length; v++) {
            const spec = QR_VERSION_M_SPECS[v];
            const ccBits = v <= 9 ? 8 : 16;
            const usableBits = spec.dataCw * 8 - 4 - ccBits;
            if (byteLen * 8 <= usableBits) return spec;
        }
        return null;
    }

    function encodeQrDataCodewords(bytes, spec) {
        const ccBits = spec.v <= 9 ? 8 : 16;
        const maxBytes = Math.floor((spec.dataCw * 8 - 4 - ccBits) / 8);
        const payload = bytes.length > maxBytes ? bytes.slice(0, maxBytes) : bytes;
        const bits = [];
        const pushBits = (val, len) => {
            for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
        };

        // Byte mode = 0100
        pushBits(0b0100, 4);
        pushBits(payload.length, ccBits);
        for (let i = 0; i < payload.length; i++) pushBits(payload[i], 8);

        const capBits = spec.dataCw * 8;
        const termLen = Math.min(4, capBits - bits.length);
        pushBits(0, termLen);
        while (bits.length % 8 !== 0) bits.push(0);

        const dataCw = new Uint8Array(spec.dataCw);
        for (let i = 0; i < bits.length; i += 8) {
            let b = 0;
            for (let k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
            dataCw[i >>> 3] = b;
        }
        let cwIdx = bits.length >>> 3;
        const pads = [0xec, 0x11];
        let p = 0;
        while (cwIdx < spec.dataCw) {
            dataCw[cwIdx++] = pads[p];
            p ^= 1;
        }

        // Split into RS blocks & interleave
        const dataBlocks = [];
        const ecBlocks = [];
        let offset = 0;
        for (const [count, , dataLen] of spec.groups) {
            for (let i = 0; i < count; i++) {
                const slice = dataCw.slice(offset, offset + dataLen);
                offset += dataLen;
                dataBlocks.push(slice);
                ecBlocks.push(qrRsRemainder(slice, spec.ecPerBlk));
            }
        }

        const outBits = [];
        const maxDataLen = Math.max(...dataBlocks.map(b => b.length));
        for (let col = 0; col < maxDataLen; col++) {
            for (let b = 0; b < dataBlocks.length; b++) {
                if (col < dataBlocks[b].length) {
                    const byteVal = dataBlocks[b][col];
                    for (let bit = 7; bit >= 0; bit--) outBits.push((byteVal >>> bit) & 1);
                }
            }
        }
        for (let col = 0; col < spec.ecPerBlk; col++) {
            for (let b = 0; b < ecBlocks.length; b++) {
                const byteVal = ecBlocks[b][col];
                for (let bit = 7; bit >= 0; bit--) outBits.push((byteVal >>> bit) & 1);
            }
        }
        return outBits;
    }

    function bchCode(val, poly, polyDegree) {
        const msb = (n) => {
            let b = 0;
            while (n > 0) { b++; n >>>= 1; }
            return b;
        };
        const polyBits = polyDegree + 1;
        let rem = val << polyDegree;
        while (msb(rem) >= polyBits) {
            rem ^= poly << (msb(rem) - polyBits);
        }
        return rem;
    }

    function createBaseQrMatrix(spec) {
        const N = 4 * spec.v + 17;
        const mat = Array.from({ length: N }, () => new Uint8Array(N));
        const isFunc = Array.from({ length: N }, () => new Uint8Array(N));

        const setFunc = (row, col, dark) => {
            if (row < 0 || row >= N || col < 0 || col >= N) return;
            mat[row][col] = dark ? 1 : 0;
            isFunc[row][col] = 1;
        };

        const drawFinderWithSeparator = (topRow, leftCol) => {
            for (let dr = -1; dr <= 7; dr++) {
                for (let dc = -1; dc <= 7; dc++) {
                    const r = topRow + dr;
                    const c = leftCol + dc;
                    if (r < 0 || r >= N || c < 0 || c >= N) continue;
                    const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
                    const dark = inOuter && (
                        dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
                        (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)
                    );
                    setFunc(r, c, dark);
                }
            }
        };

        drawFinderWithSeparator(0, 0);
        drawFinderWithSeparator(0, N - 7);
        drawFinderWithSeparator(N - 7, 0);

        // Alignment patterns
        const coords = spec.align;
        for (let i = 0; i < coords.length; i++) {
            for (let j = 0; j < coords.length; j++) {
                const cr = coords[i];
                const cc = coords[j];
                if ((cr <= 8 && cc <= 8) || (cr <= 8 && cc >= N - 9) || (cr >= N - 9 && cc <= 8)) {
                    continue;
                }
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        const dist = Math.max(Math.abs(dr), Math.abs(dc));
                        setFunc(cr + dr, cc + dc, dist === 0 || dist === 2);
                    }
                }
            }
        }

        // Timing patterns
        for (let i = 8; i < N - 8; i++) {
            const dark = i % 2 === 0;
            if (!isFunc[6][i]) setFunc(6, i, dark);
            if (!isFunc[i][6]) setFunc(i, 6, dark);
        }

        // Dark module
        setFunc(4 * spec.v + 9, 8, true);

        // Reserve format info zones (15 bits x 2)
        for (let i = 0; i <= 8; i++) {
            if (i !== 6) {
                setFunc(8, i, false);
                setFunc(i, 8, false);
            }
        }
        for (let i = N - 8; i < N; i++) setFunc(8, i, false);
        for (let i = N - 7; i < N; i++) setFunc(i, 8, false);

        // Version info (V7+)
        if (spec.v >= 7) {
            const rem = bchCode(spec.v, 0x1f25, 12);
            const verBits = (spec.v << 12) | rem;
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 3; j++) {
                    const bit = (verBits >>> (i * 3 + j)) & 1;
                    setFunc(N - 11 + j, i, Boolean(bit));
                    setFunc(i, N - 11 + j, Boolean(bit));
                }
            }
        }

        return { N, mat, isFunc };
    }

    function placeDataBits(mat, isFunc, N, codeBits) {
        let bitIdx = 0;
        let dir = -1;
        let col = N - 1;
        while (col > 0) {
            if (col === 6) col--;
            let row = dir === -1 ? N - 1 : 0;
            while (row >= 0 && row < N) {
                for (let cOff = 0; cOff < 2; cOff++) {
                    const c = col - cOff;
                    if (!isFunc[row][c]) {
                        mat[row][c] = bitIdx < codeBits.length ? codeBits[bitIdx++] : 0;
                    }
                }
                row += dir;
            }
            dir = -dir;
            col -= 2;
        }
    }

    function qrMaskCondition(maskId, r, c) {
        switch (maskId) {
            case 0: return (r + c) % 2 === 0;
            case 1: return r % 2 === 0;
            case 2: return c % 3 === 0;
            case 3: return (r + c) % 3 === 0;
            case 4: return ((r >> 1) + Math.floor(c / 3)) % 2 === 0;
            case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
            case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
            case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
            default: return false;
        }
    }

    function drawFormatBits(mat, N, maskId) {
        // ECC Level M = 00 -> (0 << 3) | maskId
        const data = (0 << 3) | maskId;
        const rem = bchCode(data, 0x537, 10);
        const formatBits = ((data << 10) | rem) ^ 0x5412;

        // First copy around top-left finder (x=col, y=row matching ZXing TYPE_INFO_COORDINATES)
        const coords1 = [
            [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
            [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0]
        ];
        for (let i = 0; i < 15; i++) {
            const bit = (formatBits >>> i) & 1;
            const [r1, c1] = coords1[i];
            mat[r1][c1] = bit;

            if (i < 8) {
                mat[8][N - 1 - i] = bit;
            } else {
                mat[N - 7 + (i - 8)][8] = bit;
            }
        }
    }

    function evaluateQrPenalty(mat, N) {
        let penalty = 0;

        // N1: 5+ consecutive modules in rows and columns
        for (let r = 0; r < N; r++) {
            let runColor = mat[r][0];
            let runLen = 1;
            for (let c = 1; c < N; c++) {
                if (mat[r][c] === runColor) {
                    runLen++;
                } else {
                    if (runLen >= 5) penalty += 3 + (runLen - 5);
                    runColor = mat[r][c];
                    runLen = 1;
                }
            }
            if (runLen >= 5) penalty += 3 + (runLen - 5);
        }
        for (let c = 0; c < N; c++) {
            let runColor = mat[0][c];
            let runLen = 1;
            for (let r = 1; r < N; r++) {
                if (mat[r][c] === runColor) {
                    runLen++;
                } else {
                    if (runLen >= 5) penalty += 3 + (runLen - 5);
                    runColor = mat[r][c];
                    runLen = 1;
                }
            }
            if (runLen >= 5) penalty += 3 + (runLen - 5);
        }

        // N2: 2x2 blocks
        for (let r = 0; r < N - 1; r++) {
            for (let c = 0; c < N - 1; c++) {
                const v = mat[r][c];
                if (v === mat[r][c + 1] && v === mat[r + 1][c] && v === mat[r + 1][c + 1]) {
                    penalty += 3;
                }
            }
        }

        // N3: 1:1:3:1:1 with 4 white either side (10111010000 or 00001011101)
        const checkFinderLine = (arr) => {
            let hits = 0;
            for (let i = 0; i <= N - 11; i++) {
                const p1 = arr[i] === 1 && arr[i + 1] === 0 && arr[i + 2] === 1 && arr[i + 3] === 1 &&
                    arr[i + 4] === 1 && arr[i + 5] === 0 && arr[i + 6] === 1 &&
                    arr[i + 7] === 0 && arr[i + 8] === 0 && arr[i + 9] === 0 && arr[i + 10] === 0;
                const p2 = arr[i] === 0 && arr[i + 1] === 0 && arr[i + 2] === 0 && arr[i + 3] === 0 &&
                    arr[i + 4] === 1 && arr[i + 5] === 0 && arr[i + 6] === 1 &&
                    arr[i + 7] === 1 && arr[i + 8] === 1 && arr[i + 9] === 0 && arr[i + 10] === 1;
                if (p1 || p2) hits++;
            }
            return hits * 40;
        };
        const colBuf = new Uint8Array(N);
        for (let r = 0; r < N; r++) penalty += checkFinderLine(mat[r]);
        for (let c = 0; c < N; c++) {
            for (let r = 0; r < N; r++) colBuf[r] = mat[r][c];
            penalty += checkFinderLine(colBuf);
        }

        // N4: dark ratio balance
        let darkCount = 0;
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) darkCount += mat[r][c];
        }
        const total = N * N;
        const k = Math.floor(Math.abs(darkCount * 20 - total * 10) / total);
        penalty += k * 10;

        return penalty;
    }

    function encodeQrMatrix(text) {
        const bytes = utf8Bytes(text || '');
        const spec = pickQrVersion(bytes.length) || QR_VERSION_M_SPECS[12];
        const codeBits = encodeQrDataCodewords(bytes, spec);
        const { N, mat: baseMat, isFunc } = createBaseQrMatrix(spec);
        placeDataBits(baseMat, isFunc, N, codeBits);

        let bestMask = 0;
        let bestPenalty = Infinity;
        let bestMat = null;

        for (let mask = 0; mask < 8; mask++) {
            const candidate = baseMat.map(row => new Uint8Array(row));
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    if (!isFunc[r][c] && qrMaskCondition(mask, r, c)) {
                        candidate[r][c] ^= 1;
                    }
                }
            }
            drawFormatBits(candidate, N, mask);
            const score = evaluateQrPenalty(candidate, N);
            if (score < bestPenalty) {
                bestPenalty = score;
                bestMask = mask;
                bestMat = candidate;
            }
        }
        return { version: spec.v, mask: bestMask, size: N, matrix: bestMat };
    }

    function generateQrDataUrl(text) {
        if (!text) return '';
        try {
            const { size, matrix } = encodeQrMatrix(String(text));
            const border = 4;
            const total = size + border * 2;
            const pathParts = [];
            for (let r = 0; r < size; r++) {
                const row = matrix[r];
                let runStart = -1;
                for (let c = 0; c <= size; c++) {
                    const dark = c < size && row[c] === 1;
                    if (dark && runStart === -1) {
                        runStart = c;
                    } else if (!dark && runStart !== -1) {
                        const x = runStart + border;
                        const y = r + border;
                        const w = c - runStart;
                        pathParts.push(`M${x},${y}h${w}v1h-${w}z`);
                        runStart = -1;
                    }
                }
            }
            const svg =
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
                `<rect width="${total}" height="${total}" fill="#ffffff"/>` +
                `<path d="${pathParts.join('')}" fill="#000000"/>` +
                `</svg>`;
            return 'data:image/svg+xml;base64,' + btoa(svg);
        } catch (err) {
            console.warn('QR generation warning:', err);
            return '';
        }
    }

    // ========================================================================
    // 2. CLOUD PORTAL CLIENT CONFIG & API HELPERS
    // ========================================================================
    function normalizePortalUrl(raw) {
        let u = String(raw || '').trim();
        if (!u) return '';
        u = u.replace(/\/+$/, '');
        if (!/^https?:\/\//i.test(u)) {
            const isLocal = /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u);
            u = (isLocal ? 'http://' : 'https://') + u;
        }
        u = u.replace(/\/admin(\.html)?$/i, '').replace(/\/+$/, '');
        return u;
    }

    function realFetch(url, options = {}) {
        const fn = window.__ENLAB_REAL_FETCH__ || window.fetch.bind(window);
        const cleanOpts = Object.assign({}, options);
        delete cleanOpts.bypassOfflineDb;
        return fn(url, cleanOpts);
    }

    function toast(msg, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        }
    }

    function escapeStr(s) {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(s);
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function sanitizeCompanySlug(raw) {
        const trMap = {
            'ç': 'c', 'Ç': 'c',
            'ğ': 'g', 'Ğ': 'g',
            'ı': 'i', 'I': 'i',
            'İ': 'i', 'i': 'i',
            'ö': 'o', 'Ö': 'o',
            'ş': 's', 'Ş': 's',
            'ü': 'u', 'Ü': 'u'
        };
        const replaced = String(raw || '').trim().replace(/[çÇğĞıIİiöÖşŞüÜ]/g, ch => trMap[ch] || ch);
        return replaced
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 18)
            .replace(/-+$/g, '');
    }

    function sanitizeUsername(raw) {
        const trMap = {
            'ç': 'c', 'Ç': 'c',
            'ğ': 'g', 'Ğ': 'g',
            'ı': 'i', 'I': 'i',
            'İ': 'i', 'i': 'i',
            'ö': 'o', 'Ö': 'o',
            'ş': 's', 'Ş': 's',
            'ü': 'u', 'Ü': 'u'
        };
        const replaced = String(raw || '').trim().replace(/[çÇğĞıIİiöÖşŞüÜ]/g, ch => trMap[ch] || ch);
        return replaced
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 28)
            .replace(/-+$/g, '');
    }

    function buildSuggestedUsername(companyName) {
        let slug = sanitizeUsername(companyName);
        if (!slug || slug === 'musteri-firma') slug = 'musteri';
        if (slug.length < 3) slug = slug + '-01';
        return slug.slice(0, 24).replace(/-+$/g, '') || 'musteri';
    }

    function generateReadablePassword(len = 8) {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let out = '';
        try {
            if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
                const buf = new Uint32Array(len);
                window.crypto.getRandomValues(buf);
                for (let i = 0; i < len; i++) out += alphabet[buf[i] % alphabet.length];
                return out;
            }
        } catch (e) {}
        for (let i = 0; i < len; i++) {
            out += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        return out;
    }

    function getCustomerAccountKey(companyName) {
        return sanitizeUsername(companyName).slice(0, 48);
    }

    function loadCustomerAccountsMap() {
        let map = {};
        try {
            const raw = localStorage.getItem(CUSTOMER_ACCOUNTS_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') map = Object.assign(map, parsed);
            }
        } catch (e) {}
        try {
            if (window.OfflineDB) {
                window.OfflineDB.init();
                const dbMap = window.OfflineDB.state && window.OfflineDB.state.customerPortalAccounts;
                if (dbMap && typeof dbMap === 'object') {
                    map = Object.assign({}, map, dbMap);
                }
            }
        } catch (e) {}
        return map;
    }

    function getRememberedCustomerCreds(companyName, wo) {
        if (wo && wo.portal_customer_username) {
            return {
                username: String(wo.portal_customer_username).trim(),
                password: String(wo.portal_customer_password || '').trim(),
                account_write_token: String(wo.portal_account_write_token || '').trim(),
                company_name: String(wo.customer_name || wo.company_name || companyName || '').trim(),
                source: 'wo'
            };
        }
        const map = loadCustomerAccountsMap();
        const key = getCustomerAccountKey(companyName);
        if (key && map[key] && map[key].username) {
            return Object.assign({}, map[key], { source: 'memory' });
        }
        const shortKey = sanitizeCompanySlug(companyName);
        if (shortKey && map[shortKey] && map[shortKey].username) {
            return Object.assign({}, map[shortKey], { source: 'memory' });
        }
        return null;
    }

    function rememberCustomerCreds(info, wo) {
        if (!info || !info.username) return;
        const username = sanitizeUsername(info.username);
        const password = String(info.password || '').trim();
        const acctToken = String(info.account_write_token || '').trim();
        const companyName = String(info.companyName || info.company_name || (wo && (wo.customer_name || wo.company_name)) || '').trim();
        const key = getCustomerAccountKey(companyName);

        const map = loadCustomerAccountsMap();
        if (key) {
            const prev = map[key] || {};
            map[key] = {
                username,
                password: password || prev.password || '',
                account_write_token: acctToken || prev.account_write_token || '',
                company_name: companyName || prev.company_name || '',
                updated_at: new Date().toISOString()
            };
            try {
                localStorage.setItem(CUSTOMER_ACCOUNTS_STORAGE_KEY, JSON.stringify(map));
            } catch (e) {}
        }

        if (window.OfflineDB && window.OfflineDB.state) {
            if (!window.OfflineDB.state.customerPortalAccounts || typeof window.OfflineDB.state.customerPortalAccounts !== 'object') {
                window.OfflineDB.state.customerPortalAccounts = {};
            }
            if (key) window.OfflineDB.state.customerPortalAccounts[key] = map[key];
            if (wo && wo.id) {
                const dbWo = (window.OfflineDB.state.workOrders || []).find(w => String(w.id) === String(wo.id));
                if (dbWo) {
                    dbWo.portal_customer_username = username;
                    if (password) dbWo.portal_customer_password = password;
                    if (acctToken) dbWo.portal_account_write_token = acctToken;
                }
            }
            window.OfflineDB.save();
        }

        if (wo) {
            wo.portal_customer_username = username;
            if (password) wo.portal_customer_password = password;
            if (acctToken) wo.portal_account_write_token = acctToken;
        }
        if (window.AppState?.currentWorkOrder && wo && String(window.AppState.currentWorkOrder.id) === String(wo.id)) {
            window.AppState.currentWorkOrder.portal_customer_username = username;
            if (password) window.AppState.currentWorkOrder.portal_customer_password = password;
            if (acctToken) window.AppState.currentWorkOrder.portal_account_write_token = acctToken;
        }
    }

    function resolveActiveCompanyProfile() {
        const branding = (typeof CompanySettingsManager !== 'undefined' && CompanySettingsManager.getSettings)
            ? CompanySettingsManager.getSettings()
            : {};
        const shortRaw = String(branding.companyShortName || '').trim();
        const fullRaw = String(branding.companyFullName || '').trim();
        const prefixRaw = String(branding.reportNoPrefix || '').replace(/[-_/\s]+$/g, '').trim();

        const shortLower = shortRaw.toLowerCase();
        const fullLower = fullRaw.toLowerCase();
        const prefixLower = prefixRaw.toLowerCase();

        const isCustomShort = Boolean(shortRaw && !['hızlı rapor', 'hizli rapor', 'tekkomer', 'enlab'].includes(shortLower));
        const isCustomFull = Boolean(fullRaw && !['mühendislik muayene ve periyodik kontrol hizmetleri', 'muhendislik muayene ve periyodik kontrol hizmetleri'].includes(fullLower));
        const isCustomPrefix = Boolean(prefixRaw && !['hzl', 'enl'].includes(prefixLower));

        let companyName = 'Hızlı Rapor';
        let companySlug = 'hizli-rapor';
        let isCustomized = false;

        if (isCustomShort) {
            companyName = shortRaw;
            companySlug = sanitizeCompanySlug(shortRaw) || sanitizeCompanySlug(prefixRaw) || 'hizli-rapor';
            isCustomized = true;
        } else if (isCustomFull) {
            companyName = fullRaw;
            companySlug = (isCustomPrefix ? sanitizeCompanySlug(prefixRaw) : '') || sanitizeCompanySlug(fullRaw) || 'hizli-rapor';
            isCustomized = true;
        } else if (isCustomPrefix) {
            companyName = prefixRaw.toUpperCase();
            companySlug = sanitizeCompanySlug(prefixRaw) || 'hizli-rapor';
            isCustomized = true;
        }

        return {
            companyName,
            companySlug,
            companyShortName: shortRaw || 'Hızlı Rapor',
            companyFullName: fullRaw || '',
            reportNoPrefix: branding.reportNoPrefix || 'HZL-',
            isCustomized
        };
    }

    function getPortalConfig() {
        let fromLs = {};
        let fromDb = {};
        try {
            const raw = localStorage.getItem(PORTAL_CONFIG_STORAGE_KEY);
            if (raw) fromLs = JSON.parse(raw) || {};
        } catch (e) {}
        try {
            if (window.OfflineDB) {
                window.OfflineDB.init();
                fromDb = (window.OfflineDB.state && window.OfflineDB.state.portalConfig) || {};
            }
        } catch (e) {}
        const hasNewKey = (fromLs.customPortalUrl !== undefined) || (fromDb.customPortalUrl !== undefined);
        const storedCustom = normalizePortalUrl(
            fromLs.customPortalUrl !== undefined ? fromLs.customPortalUrl : (fromDb.customPortalUrl || '')
        );
        const legacyUrl = normalizePortalUrl(fromLs.portalUrl || fromDb.portalUrl || '');
        const customPortalUrl = hasNewKey
            ? storedCustom
            : (legacyUrl && legacyUrl !== DEFAULT_CLOUD_PORTAL_URL ? legacyUrl : '');
        const activeUrl = customPortalUrl || DEFAULT_CLOUD_PORTAL_URL;
        return {
            portalUrl: activeUrl,
            customPortalUrl,
            isCustomUrl: Boolean(customPortalUrl && customPortalUrl !== DEFAULT_CLOUD_PORTAL_URL),
            adminKey: String(fromLs.adminKey || fromDb.adminKey || '').trim(),
            defaultPin: String(fromLs.defaultPin || fromDb.defaultPin || '').trim()
        };
    }

    function savePortalConfig(cfg) {
        const rawUrl = cfg ? (cfg.customPortalUrl !== undefined ? cfg.customPortalUrl : cfg.portalUrl) : '';
        const norm = normalizePortalUrl(rawUrl);
        const customPortalUrl = (norm && norm !== DEFAULT_CLOUD_PORTAL_URL) ? norm : '';
        const clean = {
            portalUrl: customPortalUrl || DEFAULT_CLOUD_PORTAL_URL,
            customPortalUrl,
            adminKey: String((cfg && cfg.adminKey) || '').trim(),
            defaultPin: String((cfg && cfg.defaultPin) || '').trim()
        };
        try {
            localStorage.setItem(PORTAL_CONFIG_STORAGE_KEY, JSON.stringify(clean));
        } catch (e) {}
        try {
            if (window.OfflineDB) {
                window.OfflineDB.init();
                window.OfflineDB.state.portalConfig = clean;
                window.OfflineDB.save();
            }
        } catch (e) {}
        return Object.assign({}, clean, {
            isCustomUrl: Boolean(customPortalUrl)
        });
    }

    // ========================================================================
    // 3. PORTABLE SELF-CONTAINED A4 HTML BUILDER
    // ========================================================================
    const FALLBACK_A4_CSS = `
        .tkm-a4-page { width: 210mm; min-height: 296.5mm; height: 296.5mm; padding: 6.5mm 10.5mm 6mm 10.5mm; box-sizing: border-box; background: #fff; color: #111; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 7.6pt; line-height: 1.15; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
        .tkm-page-body { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; }
        .tkm-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 2px; }
        .tkm-header { display: grid; grid-template-columns: 88px 1fr 78px; align-items: center; border-bottom: 1.8px solid #000; padding-bottom: 4px; margin-bottom: 3px; flex-shrink: 0; }
        .tkm-sec-title { color: #c00000 !important; font-size: 8.4pt; font-weight: 700; margin: 4px 0 2px 0; }
        .tkm-sub-bar { background-color: #d3d3d3 !important; color: #111 !important; border: 1px solid #777 !important; font-size: 7.6pt; font-weight: 700; padding: 2.2px 6px; margin: 3px 0 2px 0; }
        .tkm-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7.2pt; line-height: 1.14; color: #111; border: 1px solid #000; }
        .tkm-table th, .tkm-table td { border: 1px solid #000; padding: 1.8px 3.5px; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; }
        .tkm-table th { background-color: #fff !important; color: #000; font-weight: 700; }
        .tkm-legend { font-size: 6.8pt; color: #111; margin: 1px 0 2px 0; }
        .tkm-footer { margin-top: auto; padding-top: 3px; flex-shrink: 0; }
        .tkm-footer-disclaimer { font-size: 6.3pt; line-height: 1.16; color: #222; text-align: justify; padding-bottom: 2.5px; border-bottom: 1px solid #222; }
        .tkm-footer-meta { display: flex; justify-content: space-between; align-items: center; font-size: 7.6pt; color: #111; padding-top: 2px; }
    `;

    function extractMarkedCss() {
        let a4Css = '';
        let ramsCss = '';
        try {
            const styles = Array.from(document.querySelectorAll('head > style'));
            for (const s of styles) {
                const txt = s.textContent || '';
                const mA4 = txt.match(/\/\*\s*TKM_A4_CSS_START\s*\*\/([\s\S]*?)\/\*\s*TKM_A4_CSS_END\s*\*\//);
                if (mA4 && mA4[1]) a4Css += mA4[1] + '\n';
                const mRams = txt.match(/\/\*\s*TKM_RAMS_CSS_START\s*\*\/([\s\S]*?)\/\*\s*TKM_RAMS_CSS_END\s*\*\//);
                if (mRams && mRams[1]) ramsCss += mRams[1] + '\n';
            }
        } catch (e) {}

        // Fallback scanning stylesheet rules if markers are missing
        if (!a4Css.trim()) {
            try {
                const matchedRules = [];
                for (const sheet of Array.from(document.styleSheets || [])) {
                    let rules;
                    try { rules = sheet.cssRules; } catch (e) { continue; }
                    if (!rules) continue;
                    for (const rule of Array.from(rules)) {
                        const sel = rule.selectorText || '';
                        if (sel.includes('.tkm-') || sel.includes('data-pdf-theme')) {
                            matchedRules.push(rule.cssText);
                        }
                    }
                }
                if (matchedRules.length) a4Css = matchedRules.join('\n');
            } catch (e) {}
        }

        return {
            a4Css: a4Css.trim() || FALLBACK_A4_CSS,
            ramsCss: ramsCss.trim()
        };
    }

    function embedRelativeAssetsInHtml(html) {
        const assets = window.TKM_EMBEDDED_ASSETS || {};
        return String(html || '').replace(/src=(["'])\/?assets\/([a-zA-Z0-9_.-]+)\1/gi, (full, q, fname) => {
            const lower = fname.toLowerCase();
            let replacement = '';
            if (lower.includes('tekkomer')) replacement = assets.tekkomerLogo || '';
            else if (lower.includes('turkak')) replacement = assets.turkakLogo || '';
            else if (lower.includes('eimza')) replacement = assets.eimza || '';
            else if (lower.includes('qr_default')) replacement = assets.qrDefault || '';
            if (replacement) return `src=${q}${replacement}${q}`;
            return full;
        });
    }

    function buildPortableA4ReportHtml(pagesHtml, theme, meta = {}) {
        const { a4Css, ramsCss } = extractMarkedCss();
        const safePages = embedRelativeAssetsInHtml(pagesHtml);
        const title = `${meta.reportNo || 'Rapor'} - ${meta.equipmentName || 'Periyodik Kontrol Raporu'}`;

        return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeStr(title)}</title>
<style>
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: #1e293b;
  color: #111111;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
}
${a4Css}
${ramsCss}
@media screen {
  .tkm-portal-pages { padding: 14px 0; }
  .tkm-a4-page { margin: 0 auto 16px auto; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); border: 1px solid #0f172a; }
}
@page { size: A4 portrait; margin: 0mm; }
@media print {
  html, body { background: #ffffff !important; width: 210mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
  .tkm-portal-pages { padding: 0 !important; margin: 0 !important; }
  .tkm-a4-page { margin: 0 !important; box-shadow: none !important; border: none !important; transform: none !important; zoom: 1 !important; page-break-after: always; break-after: page; }
  .tkm-a4-page:last-child { page-break-after: auto; break-after: auto; }
}
</style>
</head>
<body>
<div class="tkm-portal-pages" data-pdf-theme="${escapeStr(theme || 'classic')}">${safePages}</div>
</body>
</html>`;
    }

    // ========================================================================
    // 4. PORTAL NETWORK PIPELINE (TEST / UPLOAD A4 HTML / UPLOAD PDF)
    // ========================================================================
    async function testPortalConnection(overrideUrl, overrideKey) {
        const cfg = getPortalConfig();
        const url = normalizePortalUrl(overrideUrl !== undefined && String(overrideUrl).trim() !== '' ? overrideUrl : cfg.portalUrl) || DEFAULT_CLOUD_PORTAL_URL;
        const key = String(overrideKey !== undefined ? overrideKey : cfg.adminKey).trim();
        try {
            const headers = { 'X-App-Client': 'hizli-rapor-mobile' };
            if (key) headers['X-Admin-Key'] = key;
            const res = await realFetch(`${url}/api/health`, { method: 'GET', headers });
            const text = await res.text();
            let data = null;
            try { data = JSON.parse(text); } catch (e) {}
            if (!res.ok || !data || !data.ok) {
                return { ok: false, error: (data && data.error) || `Sunucu yanıt hatası (HTTP ${res.status})` };
            }
            if (key && data.authValid === false) {
                return { ok: false, error: 'Sunucuya ulaşıldı ancak isteğe bağlı Yönetici Anahtarı hatalı!', data };
            }
            if (data.dbConnected === false) {
                return {
                    ok: false,
                    error: `Sunucu veritabanına bağlı değil (${data.dbError || 'Supabase ortam değişkenleri eksik'}).`,
                    data
                };
            }
            if (data.appUploadReady === false && data.configured === false) {
                return {
                    ok: false,
                    error: 'Sunucu yükleme ayarları eksik (Supabase / Portal ortam değişkenlerini kontrol edin).',
                    data
                };
            }
            return { ok: true, url, data };
        } catch (err) {
            return { ok: false, error: 'Bağlantı kurulamadı: ' + (err.message || 'İnternet bağlantınızı kontrol edin.') };
        }
    }

    function persistPortalFieldsLocally(wo, insp, folderInfo, reportInfo, pinApplied) {
        const nowIso = new Date().toISOString();
        if (wo) {
            wo.portal_folder_slug = folderInfo.share_slug;
            wo.portal_folder_url = folderInfo.url;
            if (folderInfo.write_token) {
                wo.portal_write_token = folderInfo.write_token;
            }
            wo.portal_last_sync = nowIso;
            if (pinApplied && pinApplied.pinMode === 'set' && pinApplied.pin) {
                wo.portal_pin = pinApplied.pin;
            } else if (pinApplied && pinApplied.pinMode === 'clear') {
                wo.portal_pin = '';
            }
        }
        if (insp) {
            insp.portal_report_slug = reportInfo.share_slug;
            insp.portal_report_url = reportInfo.url;
            insp.portal_verify_code = reportInfo.verify_code;
            insp.portal_uploaded_at = nowIso;
            insp.portal_folder_slug = folderInfo.share_slug;
            insp.portal_folder_url = folderInfo.url;
        }

        // Sync OfflineDB + AppState caches immediately
        if (window.OfflineDB && window.OfflineDB.state) {
            if (wo && wo.id) {
                const dbWo = (window.OfflineDB.state.workOrders || []).find(w => String(w.id) === String(wo.id));
                if (dbWo) Object.assign(dbWo, {
                    portal_folder_slug: wo.portal_folder_slug,
                    portal_folder_url: wo.portal_folder_url,
                    portal_write_token: wo.portal_write_token || dbWo.portal_write_token || '',
                    portal_customer_username: wo.portal_customer_username || dbWo.portal_customer_username || '',
                    portal_customer_password: wo.portal_customer_password !== undefined ? wo.portal_customer_password : (dbWo.portal_customer_password || ''),
                    portal_account_write_token: wo.portal_account_write_token || dbWo.portal_account_write_token || '',
                    portal_pin: wo.portal_pin,
                    portal_last_sync: wo.portal_last_sync
                });
            }
            if (insp && insp.id) {
                const dbInsp = (window.OfflineDB.state.inspections || []).find(i => String(i.id) === String(insp.id));
                if (dbInsp) Object.assign(dbInsp, {
                    portal_report_slug: insp.portal_report_slug,
                    portal_report_url: insp.portal_report_url,
                    portal_verify_code: insp.portal_verify_code,
                    portal_uploaded_at: insp.portal_uploaded_at,
                    portal_folder_slug: insp.portal_folder_slug,
                    portal_folder_url: insp.portal_folder_url
                });
            }
            window.OfflineDB.save();
        }

        if (Array.isArray(window.AppState?.inspectionsCache) && insp && insp.id) {
            const cached = window.AppState.inspectionsCache.find(i => String(i.id) === String(insp.id));
            if (cached) Object.assign(cached, {
                portal_report_slug: insp.portal_report_slug,
                portal_report_url: insp.portal_report_url,
                portal_verify_code: insp.portal_verify_code,
                portal_uploaded_at: insp.portal_uploaded_at,
                portal_folder_slug: insp.portal_folder_slug,
                portal_folder_url: insp.portal_folder_url
            });
        }
        if (window.AppState?.currentWorkOrder && wo && String(window.AppState.currentWorkOrder.id) === String(wo.id)) {
            Object.assign(window.AppState.currentWorkOrder, {
                portal_folder_slug: wo.portal_folder_slug,
                portal_folder_url: wo.portal_folder_url,
                portal_write_token: wo.portal_write_token || window.AppState.currentWorkOrder.portal_write_token || '',
                portal_customer_username: wo.portal_customer_username || window.AppState.currentWorkOrder.portal_customer_username || '',
                portal_customer_password: wo.portal_customer_password !== undefined ? wo.portal_customer_password : (window.AppState.currentWorkOrder.portal_customer_password || ''),
                portal_account_write_token: wo.portal_account_write_token || window.AppState.currentWorkOrder.portal_account_write_token || '',
                portal_pin: wo.portal_pin,
                portal_last_sync: wo.portal_last_sync
            });
        }
        if (window.AppState?.currentInspection && insp && String(window.AppState.currentInspection.id) === String(insp.id)) {
            Object.assign(window.AppState.currentInspection, {
                portal_report_slug: insp.portal_report_slug,
                portal_report_url: insp.portal_report_url,
                portal_verify_code: insp.portal_verify_code,
                portal_uploaded_at: insp.portal_uploaded_at,
                portal_folder_slug: insp.portal_folder_slug,
                portal_folder_url: insp.portal_folder_url
            });
        }

        // Persist through standard API routes (which also keep PC server synced when online)
        if (wo && wo.id) {
            window.fetch(`/api/work-orders/${wo.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portal_folder_slug: wo.portal_folder_slug,
                    portal_folder_url: wo.portal_folder_url,
                    portal_write_token: wo.portal_write_token || '',
                    portal_customer_username: wo.portal_customer_username || '',
                    portal_customer_password: wo.portal_customer_password || '',
                    portal_account_write_token: wo.portal_account_write_token || '',
                    portal_pin: wo.portal_pin !== undefined ? wo.portal_pin : '',
                    portal_last_sync: wo.portal_last_sync
                })
            }).catch(() => {});
        }
        if (insp && insp.id) {
            window.fetch(`/api/inspections/${insp.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portal_report_slug: insp.portal_report_slug,
                    portal_report_url: insp.portal_report_url,
                    portal_verify_code: insp.portal_verify_code,
                    portal_uploaded_at: insp.portal_uploaded_at,
                    portal_folder_slug: insp.portal_folder_slug,
                    portal_folder_url: insp.portal_folder_url
                })
            }).catch(() => {});
        }
    }

    async function callUploadInit(cfg, payload, writeToken, accountWriteToken) {
        const headers = {
            'Content-Type': 'application/json',
            'X-App-Client': 'hizli-rapor-mobile'
        };
        if (cfg.adminKey) headers['X-Admin-Key'] = cfg.adminKey;
        if (writeToken) headers['X-Folder-Write-Token'] = writeToken;
        if (accountWriteToken) headers['X-Account-Write-Token'] = accountWriteToken;

        const res = await realFetch(`${cfg.portalUrl}/api/upload-init`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            throw new Error(data.error || `Yükleme başlatılamadı (HTTP ${res.status})`);
        }
        return data;
    }

    async function callSignedUpload(uploadUrl, contentType, bodyBlob) {
        const res = await realFetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType
            },
            body: bodyBlob
        });
        if (!res.ok) {
            const errTxt = await res.text().catch(() => '');
            throw new Error(`Dosya buluta yüklenemedi (HTTP ${res.status}) ${errTxt.slice(0, 120)}`);
        }
    }

    async function callUploadComplete(cfg, reportId, byteSize, writeToken) {
        const headers = {
            'Content-Type': 'application/json',
            'X-App-Client': 'hizli-rapor-mobile'
        };
        if (cfg.adminKey) headers['X-Admin-Key'] = cfg.adminKey;
        if (writeToken) headers['X-Folder-Write-Token'] = writeToken;

        const res = await realFetch(`${cfg.portalUrl}/api/upload-complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                report_id: reportId,
                file_size_bytes: byteSize,
                write_token: writeToken || undefined
            })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            throw new Error(data.error || `Yükleme tamamlanamadı (HTTP ${res.status})`);
        }
        return data;
    }

    function buildFolderPayload(wo, pinOption) {
        const branding = (typeof CompanySettingsManager !== 'undefined') ? CompanySettingsManager.getSettings() : {};
        const company = resolveActiveCompanyProfile();
        return {
            slug: (wo && wo.portal_folder_slug) ? wo.portal_folder_slug : undefined,
            write_token: (wo && wo.portal_write_token) ? wo.portal_write_token : undefined,
            local_wo_id: wo && wo.id ? String(wo.id) : '',
            work_order_code: (wo && (wo.work_order_no || wo.code)) || '',
            owner_company_slug: company.companySlug,
            owner_company_name: company.companyName,
            company_name: (wo && (wo.customer_name || wo.company_name)) || 'Müşteri Firma',
            company_branch: (wo && (wo.customer_branch || wo.company_branch)) || '',
            company_address: (wo && (wo.customer_address || wo.company_address)) || '',
            contact_email: (wo && wo.contact_email) || '',
            pin: (pinOption && pinOption.pinMode === 'set' && pinOption.pin) ? pinOption.pin : undefined,
            pin_mode: (pinOption && pinOption.pinMode) || 'keep',
            branding_json: {
                companyFullName: branding.companyFullName || company.companyName || '',
                companyShortName: branding.companyShortName || company.companyName || '',
                ownerCompanySlug: company.companySlug
            }
        };
    }

    function rememberFolderOwnershipNow(wo, folderInfo) {
        if (!wo || !folderInfo) return;
        if (folderInfo.share_slug) wo.portal_folder_slug = folderInfo.share_slug;
        if (folderInfo.write_token) wo.portal_write_token = folderInfo.write_token;
        if (window.OfflineDB && window.OfflineDB.state && wo.id) {
            const dbWo = (window.OfflineDB.state.workOrders || []).find(w => String(w.id) === String(wo.id));
            if (dbWo) {
                if (folderInfo.share_slug) dbWo.portal_folder_slug = folderInfo.share_slug;
                if (folderInfo.write_token) dbWo.portal_write_token = folderInfo.write_token;
                window.OfflineDB.save();
            }
        }
    }

    function buildCustomerRequestPayload(wo, customerOption) {
        if (!customerOption || !customerOption.username) return undefined;
        const username = sanitizeUsername(customerOption.username);
        if (!username) return undefined;
        return {
            username,
            password: String(customerOption.password || '').trim(),
            company_name: String(
                customerOption.company_name || (wo && (wo.customer_name || wo.company_name)) || 'Müşteri Firma'
            ).trim(),
            auto_username: Boolean(customerOption.auto_username),
            update_password: Boolean(customerOption.update_password),
            account_write_token: customerOption.account_write_token || undefined
        };
    }

    async function uploadInspectionReport(inspRaw, woRaw, pinOption = { pinMode: 'keep' }, customerOption = null) {
        const cfg = getPortalConfig();
        const normInsp = typeof normalizeInspection === 'function' ? normalizeInspection(inspRaw) : Object.assign({}, inspRaw);
        const wo = woRaw || {};
        let fd = typeof loadInspectionFormDataObject === 'function' ? loadInspectionFormDataObject(normInsp) : (normInsp.form_data || {});
        if (window.AppState?.currentInspection && String(window.AppState.currentInspection.id) === String(normInsp.id) && window.AppState.currentFormData) {
            fd = window.AppState.currentFormData;
        }
        const ci = (fd && fd.companyInfo) || {};

        const customerPayload = buildCustomerRequestPayload(wo, customerOption);
        const acctToken = (customerOption && customerOption.account_write_token) || wo.portal_account_write_token || '';

        // 1. Reserve report slug & verify code BEFORE rendering A4 HTML so live QR matches final URL
        const initData = await callUploadInit(cfg, {
            customer: customerPayload,
            folder: buildFolderPayload(wo, pinOption),
            report: {
                local_inspection_id: String(normInsp.id || ''),
                report_no: normInsp.report_no || ci.reportNo || `RPR-${normInsp.id}`,
                equipment_name: normInsp.equipment_name || ci.equipmentName || 'Periyodik Kontrol Raporu',
                template_code: normInsp.template_code || '',
                inspection_date: normInsp.inspection_date || ci.reportDate || '',
                next_inspection_date: fd.nextInspectionDate || ci.nextControlDate || '',
                inspector_name: normInsp.inspector_name || normInsp.inspector || '',
                result_status: fd.overallResult || normInsp.result_status || normInsp.result || 'UYGUN',
                source_type: 'app_html',
                mime_type: 'text/html'
            }
        }, wo.portal_write_token || '', acctToken);

        const activeWriteToken = (initData.folder && initData.folder.write_token) || wo.portal_write_token || '';
        rememberFolderOwnershipNow(wo, initData.folder);
        if (initData.customer && initData.customer.username) {
            rememberCustomerCreds({
                companyName: wo.customer_name || wo.company_name || initData.customer.company_name,
                username: initData.customer.username,
                password: (customerOption && customerOption.password) || wo.portal_customer_password || '',
                account_write_token: initData.customer.write_token || acctToken
            }, wo);
        }

        normInsp.portal_report_slug = initData.report.share_slug;
        normInsp.portal_report_url = initData.report.url;
        normInsp.portal_verify_code = initData.report.verify_code;
        normInsp.portal_folder_slug = initData.folder.share_slug;
        normInsp.portal_folder_url = initData.folder.url;

        // 2. Render full A4 report silently into #printableReportArea with the live QR URL
        const printArea = document.getElementById('printableReportArea');
        const prevPrintHtml = printArea ? printArea.innerHTML : '';
        const prevThemeAttr = printArea ? (printArea.getAttribute('data-pdf-theme') || 'classic') : 'classic';
        const savedInsp = window.AppState ? window.AppState.currentInspection : null;
        const savedFd = window.AppState ? window.AppState.currentFormData : null;

        let pagesHtml = '';
        const activeTheme = (typeof getPdfTheme === 'function') ? getPdfTheme() : 'classic';
        try {
            if (window.AppState) {
                window.AppState.currentInspection = normInsp;
                window.AppState.currentFormData = fd;
            }
            if (typeof printOfficialReport === 'function') {
                printOfficialReport(false, null, true);
            }
            pagesHtml = printArea ? printArea.innerHTML : '';
        } finally {
            if (window.AppState) {
                window.AppState.currentInspection = savedInsp;
                window.AppState.currentFormData = savedFd;
            }
            if (printArea) {
                printArea.setAttribute('data-pdf-theme', prevThemeAttr);
                printArea.innerHTML = prevPrintHtml;
            }
        }

        if (!pagesHtml || !pagesHtml.trim()) {
            throw new Error('Rapor A4 HTML çıktısı oluşturulamadı.');
        }

        // If the user is currently previewing THIS report in #a4PreviewModal, refresh preview with live QR!
        const previewModal = document.getElementById('a4PreviewModal');
        const previewContainer = document.getElementById('a4PreviewPagesContainer');
        if (previewModal && !previewModal.classList.contains('hidden') && previewContainer && savedInsp && String(savedInsp.id) === String(normInsp.id)) {
            previewContainer.setAttribute('data-pdf-theme', activeTheme);
            previewContainer.innerHTML = pagesHtml.replace(/class="tkm-a4-page"/g, 'class="tkm-a4-page tkm-preview-sheet"');
        }

        const portableHtml = buildPortableA4ReportHtml(pagesHtml, activeTheme, {
            reportNo: normInsp.report_no,
            equipmentName: normInsp.equipment_name
        });
        const htmlBlob = new Blob([portableHtml], { type: 'text/html' });

        // 3. Upload self-contained HTML to Supabase Signed URL / Local Storage
        await callSignedUpload(initData.uploadUrl, initData.contentType || 'text/html', htmlBlob);

        // 4. Mark report ready
        const compData = await callUploadComplete(cfg, initData.report.id, htmlBlob.size, activeWriteToken);

        // 5. Persist portal links locally
        persistPortalFieldsLocally(wo, normInsp, initData.folder, initData.report, pinOption);

        // 6. Also persist full editable report JSON to Supabase cloud sync so uninstall/reinstall keeps form data
        try {
            await pushInspectionToCloud(normInsp, fd, wo);
        } catch (syncErr) {
            console.warn('Cloud report draft backup warning:', syncErr);
        }

        return {
            folderUrl: compData.folderUrl || initData.folder.url,
            folderSlug: compData.folderSlug || initData.folder.share_slug,
            reportUrl: compData.reportUrl || initData.report.url,
            reportSlug: compData.reportSlug || initData.report.share_slug,
            verifyCode: compData.verifyCode || initData.report.verify_code,
            equipmentName: normInsp.equipment_name || 'Rapor',
            reportNo: normInsp.report_no || '',
            sourceType: 'app_html',
            customer: initData.customer || null
        };
    }

    async function uploadExternalPdfToPortal(woRaw, pdfFile, meta = {}, pinOption = { pinMode: 'keep' }, customerOption = null) {
        const cfg = getPortalConfig();
        if (!pdfFile) {
            throw new Error('Yüklenecek PDF dosyası seçilmedi.');
        }
        const wo = woRaw || {};
        const fallbackTitle = (pdfFile.name || 'Ek PDF Raporu').replace(/\.pdf$/i, '');
        const reportNo = String(meta.reportNo || `PDF-${Date.now().toString().slice(-6)}`).trim();
        const equipmentName = String(meta.equipmentName || fallbackTitle).trim();
        const resultStatus = String(meta.resultStatus || 'UYGUN').trim();

        const customerPayload = buildCustomerRequestPayload(wo, customerOption);
        const acctToken = (customerOption && customerOption.account_write_token) || wo.portal_account_write_token || '';

        const initData = await callUploadInit(cfg, {
            customer: customerPayload,
            folder: buildFolderPayload(wo, pinOption),
            report: {
                report_no: reportNo,
                equipment_name: equipmentName,
                inspection_date: meta.inspectionDate || new Date().toLocaleDateString('tr-TR'),
                result_status: resultStatus,
                source_type: 'uploaded_pdf',
                mime_type: 'application/pdf'
            }
        }, wo.portal_write_token || '', acctToken);

        const activeWriteToken = (initData.folder && initData.folder.write_token) || wo.portal_write_token || '';
        rememberFolderOwnershipNow(wo, initData.folder);
        if (initData.customer && initData.customer.username) {
            rememberCustomerCreds({
                companyName: wo.customer_name || wo.company_name || initData.customer.company_name,
                username: initData.customer.username,
                password: (customerOption && customerOption.password) || wo.portal_customer_password || '',
                account_write_token: initData.customer.write_token || acctToken
            }, wo);
        }

        await callSignedUpload(initData.uploadUrl, 'application/pdf', pdfFile);
        const compData = await callUploadComplete(cfg, initData.report.id, pdfFile.size || 0, activeWriteToken);

        persistPortalFieldsLocally(wo, null, initData.folder, initData.report, pinOption);

        if (wo && wo.id) {
            window.fetch(`/api/work-orders/${wo.id}/files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `${equipmentName} (${reportNo}).pdf` })
            }).catch(() => {});
        }

        return {
            folderUrl: compData.folderUrl || initData.folder.url,
            folderSlug: compData.folderSlug || initData.folder.share_slug,
            reportUrl: compData.reportUrl || initData.report.url,
            reportSlug: compData.reportSlug || initData.report.share_slug,
            verifyCode: compData.verifyCode || initData.report.verify_code,
            equipmentName,
            reportNo,
            sourceType: 'uploaded_pdf',
            customer: initData.customer || null
        };
    }

    // ========================================================================
    // 5. SHARE, CLIPBOARD & EMAIL HELPERS
    // ========================================================================
    function copyTextToClipboard(text, message = 'Bağlantı panoya kopyalandı!') {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                toast(message, 'success');
            }).catch(() => {
                legacyCopy(text, message);
            });
        } else {
            legacyCopy(text, message);
        }
    }

    function legacyCopy(text, message) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            toast(message, 'success');
        } catch (e) {
            toast('Lütfen bağlantıyı seçip kopyalayın.', 'warning');
        }
        if (ta.parentNode) document.body.removeChild(ta);
    }

    function buildCustomerShareText(wo, uploadedResults, effectivePin, customerCreds) {
        const cfg = getPortalConfig();
        const customerName = (wo && (wo.customer_name || wo.company_name)) || 'Firmanız';
        const folderUrl = (uploadedResults[0] && uploadedResults[0].folderUrl) || (wo && wo.portal_folder_url) || '';
        const username = (customerCreds && customerCreds.username) || (wo && wo.portal_customer_username) || '';
        const password = (customerCreds && customerCreds.password) || (wo && wo.portal_customer_password) || '';
        const listText = uploadedResults.map((r, i) =>
            `${i + 1}. ${r.equipmentName} (${r.reportNo}) - Doğrulama: ${r.verifyCode}\n   ${r.reportUrl}`
        ).join('\n');

        const accessLines = [];
        if (username) {
            accessLines.push(`MÜŞTERİ PORTAL GİRİŞ BİLGİLERİ (Yalnızca firmanızın raporlarını görürsünüz):`);
            accessLines.push(`- Portal Giriş Adresi: ${cfg.portalUrl}`);
            accessLines.push(`- Kullanıcı Adı: ${username}`);
            if (password) accessLines.push(`- Şifre: ${password}`);
            if (folderUrl) accessLines.push(`- Direkt Klasör Bağlantısı: ${folderUrl}`);
            if (effectivePin) accessLines.push(`- Ek Klasör PIN'i: ${effectivePin}`);
        } else {
            if (folderUrl) accessLines.push(`Müşteri Rapor Klasörü: ${folderUrl}`);
            accessLines.push(effectivePin ? `Erişim Şifresi (PIN): ${effectivePin}` : `Erişim Durumu: Doğrudan bağlantı ile açılır`);
        }

        return [
            `Sayın Yetkili,`,
            ``,
            `${customerName} firmasına ait Periyodik Kontrol Raporları internet portalına yüklenmiştir.`,
            ``,
            ...accessLines,
            uploadedResults.length ? `\nYayınlanan Raporlar:\n${listText}` : '',
            ``,
            `Portal giriş adresinden veya klasör bağlantısından kullanıcı adı ve şifrenizle oturum açarak firmanıza ait tüm raporları inceleyebilir ve PDF olarak indirebilirsiniz.`
        ].filter(Boolean).join('\n');
    }

    function buildLoginCredentialSnippet(username, password, portalUrl) {
        const lines = [
            `Portal Adresi: ${portalUrl}`,
            `Kullanıcı Adı: ${username}`
        ];
        if (password) lines.push(`Şifre: ${password}`);
        return lines.join('\n');
    }

    function copyCustomerLoginInfo(workOrderId) {
        let wo = window.AppState?.currentWorkOrder || null;
        if (workOrderId && window.OfflineDB?.state?.workOrders) {
            wo = window.OfflineDB.state.workOrders.find(w => String(w.id) === String(workOrderId)) || wo;
        }
        if (!wo || !wo.portal_customer_username) {
            toast('Bu iş kaydında kayıtlı müşteri giriş bilgisi bulunamadı.', 'warning');
            return;
        }
        const cfg = getPortalConfig();
        const snippet = buildLoginCredentialSnippet(
            wo.portal_customer_username,
            wo.portal_customer_password || '',
            cfg.portalUrl
        );
        copyTextToClipboard(snippet, 'Müşteri giriş bilgileri panoya kopyalandı!');
    }

    function copyLastCredentials() {
        if (!_portalModalState || !_portalModalState.effectiveCustomer?.username) return;
        const cfg = getPortalConfig();
        const snippet = buildLoginCredentialSnippet(
            _portalModalState.effectiveCustomer.username,
            _portalModalState.effectiveCustomer.password || '',
            cfg.portalUrl
        );
        copyTextToClipboard(snippet, 'Müşteri giriş bilgileri panoya kopyalandı!');
    }

    function shareTextViaNativeOrWeb(subject, text) {
        if (window.AndroidBridge && typeof window.AndroidBridge.shareJsonBackup === 'function') {
            try {
                window.AndroidBridge.shareJsonBackup(subject, text);
                if (typeof restoreNativeDatabaseImmediately === 'function') {
                    restoreNativeDatabaseImmediately();
                    setTimeout(restoreNativeDatabaseImmediately, 80);
                    setTimeout(restoreNativeDatabaseImmediately, 350);
                    setTimeout(restoreNativeDatabaseImmediately, 1000);
                }
                toast('Paylaşım ekranı açılıyor...');
                return;
            } catch (e) {
                console.warn('AndroidBridge share fallback:', e);
            }
        }
        if (navigator.share) {
            navigator.share({ title: subject, text }).catch(() => {});
            return;
        }
        copyTextToClipboard(text, 'Paylaşım metni panoya kopyalandı! WhatsApp veya e-postaya yapıştırabilirsiniz.');
    }

    function copyReportPortalLink(inspId) {
        let insp = null;
        if (Array.isArray(window.AppState?.inspectionsCache)) {
            insp = window.AppState.inspectionsCache.find(i => String(i.id) === String(inspId));
        }
        if (!insp && window.OfflineDB?.state?.inspections) {
            insp = window.OfflineDB.state.inspections.find(i => String(i.id) === String(inspId));
        }
        if (!insp || !insp.portal_report_url) {
            toast('Bu rapor henüz internete yüklenmemiş.', 'warning');
            return;
        }
        copyTextToClipboard(insp.portal_report_url, `Rapor linki kopyalandı! (Doğrulama: ${insp.portal_verify_code || '-'})`);
    }

    // ========================================================================
    // 6. UPLOAD & SETTINGS UI MODALS
    // ========================================================================
    let _portalModalState = null;

    async function resolveWorkOrderAndReports(workOrderId) {
        let wo = (window.AppState && window.AppState.currentWorkOrder) || {};
        let reports = Array.isArray(window.AppState?.inspectionsCache) ? window.AppState.inspectionsCache.slice() : [];

        if (workOrderId) {
            try {
                const res = await window.fetch(`/api/work-orders/${workOrderId}`);
                const data = await res.json();
                if (data.workOrder) {
                    wo = typeof normalizeWorkOrder === 'function' ? normalizeWorkOrder(data.workOrder) : data.workOrder;
                }
                if (Array.isArray(data.inspections)) {
                    reports = data.inspections.map(r => typeof normalizeInspection === 'function' ? normalizeInspection(r) : r);
                }
            } catch (e) {}
        }
        if (!reports.length && window.AppState?.currentInspection) {
            reports = [window.AppState.currentInspection];
        }
        return { wo, reports };
    }

    async function openPortalUploadModal(workOrderId, preselectedIds = null) {
        const woId = workOrderId || window.AppState?.currentWorkOrder?.id || window.AppState?.currentInspection?.work_order_id;
        const { wo, reports } = await resolveWorkOrderAndReports(woId);
        const cfg = getPortalConfig();
        const company = resolveActiveCompanyProfile();
        const portalHostLabel = cfg.portalUrl.replace(/^https?:\/\//i, '');
        const preSet = Array.isArray(preselectedIds) && preselectedIds.length
            ? new Set(preselectedIds.map(x => String(x)))
            : null;

        const customerName = (wo.customer_name || wo.company_name || '').trim();
        const remembered = getRememberedCustomerCreds(customerName, wo);
        const initUsername = remembered ? remembered.username : buildSuggestedUsername(customerName);
        const initPassword = remembered
            ? (remembered.password || '')
            : generateReadablePassword(8);

        _portalModalState = {
            wo,
            reports,
            uploadedResults: [],
            effectivePin: wo.portal_pin || '',
            rememberedCustomer: remembered,
            initialUsername: initUsername,
            initialPassword: initPassword,
            manualUsernameEdit: false,
            effectiveCustomer: remembered ? {
                username: remembered.username,
                password: initPassword,
                account_write_token: remembered.account_write_token || ''
            } : null
        };

        const reportsHtml = reports.length ? reports.map(r => {
            const isChecked = preSet ? preSet.has(String(r.id)) : true;
            const isPublished = Boolean(r.portal_report_url);
            const isOk = (r.result_status || 'UYGUN') === 'UYGUN';
            return `
                <label class="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-sky-50/60 cursor-pointer transition">
                    <div class="flex items-center gap-2 min-w-0">
                        <input type="checkbox" name="portalUploadCb" value="${escapeStr(r.id)}" ${isChecked ? 'checked' : ''}
                            class="w-4 h-4 accent-emerald-600 rounded shrink-0">
                        <div class="min-w-0">
                            <div class="font-bold text-slate-900 text-xs truncate">${escapeStr(r.equipment_name || 'Periyodik Kontrol Raporu')}</div>
                            <div class="text-[10px] text-slate-500 font-mono truncate">${escapeStr(r.report_no || '-')}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        ${isPublished ? `<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">Yayında</span>` : ''}
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${isOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">${escapeStr(r.result_status || 'UYGUN')}</span>
                    </div>
                </label>
            `;
        }).join('') : `<div class="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-slate-500 text-xs">Bu iş klasöründe henüz kayıtlı uygulama raporu yok. Aşağıdan harici PDF yükleyebilirsiniz.</div>`;

        const bodyHtml = `
            <div class="space-y-3 text-xs">
                <!-- Müşteri Başlığı -->
                <div class="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2">
                    <div class="min-w-0">
                        <div class="text-[10px] uppercase tracking-wider text-sky-300 font-bold">Bulut Müşteri Klasörü</div>
                        <div class="font-bold text-sm truncate">${escapeStr(wo.customer_name || wo.company_name || 'Müşteri Klasörü')}</div>
                        ${wo.portal_folder_url ? `<div class="text-[10px] text-emerald-300 font-mono truncate mt-0.5"><i class="fa-solid fa-link mr-1"></i>${escapeStr(wo.portal_folder_url)}</div>` : ''}
                    </div>
                    ${wo.portal_folder_url ? `<button type="button" onclick="CloudPortal.copyText('${escapeStr(wo.portal_folder_url)}')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[11px] shrink-0 border border-slate-700"><i class="fa-regular fa-copy mr-1"></i>Kopyala</button>` : ''}
                </div>

                ${!company.isCustomized ? `
                    <div class="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-2 flex items-center justify-between gap-2">
                        <span>Şirket kısaltması henüz varsayılan (/p/${escapeStr(company.companySlug)}-...)</span>
                        <button type="button" onclick="closeModal(); setTimeout(() => { if(typeof openCompanySettingsModal==='function') openCompanySettingsModal(); else navigateTo('settings'); }, 60);" class="font-bold text-amber-950 underline shrink-0">Şirket Adını Ayarla</button>
                    </div>
                ` : ''}

                <!-- Rapor Seçimi -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <label class="font-bold text-slate-800">Yayınlanacak Uygulama Raporları</label>
                        ${reports.length > 1 ? `<button type="button" onclick="CloudPortal.toggleAllModalReports()" class="text-[11px] font-bold text-sky-600 hover:underline">Tümünü Seç / Bırak</button>` : ''}
                    </div>
                    <div class="max-h-44 overflow-y-auto space-y-1.5 pr-0.5">${reportsHtml}</div>
                </div>

                <!-- Harici PDF Ekleme -->
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden">
                    <button type="button" onclick="document.getElementById('portalExtPdfFields').classList.toggle('hidden')"
                        class="w-full px-3 py-2 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-100 transition">
                        <span class="flex items-center gap-1.5"><i class="fa-solid fa-file-circle-plus text-rose-600"></i> Hazır PDF Dosyası Ekle</span>
                        <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
                    </button>
                    <div id="portalExtPdfFields" class="${reports.length === 0 ? '' : 'hidden'} p-3 pt-1 border-t border-slate-200 space-y-2 bg-white">
                        <input type="file" id="portalExternalPdfInput" accept="application/pdf,.pdf"
                            onchange="CloudPortal.onExternalPdfSelected(this)"
                            class="w-full text-[11px] border border-slate-300 rounded-lg p-1.5 bg-slate-50">
                        <div class="grid grid-cols-2 gap-2">
                            <input type="text" id="portalExtPdfTitle" placeholder="Rapor / Ekipman Başlığı"
                                class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs">
                            <input type="text" id="portalExtPdfNo" placeholder="Rapor No (Örn: TKM-PDF-01)"
                                class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono">
                        </div>
                        <select id="portalExtPdfResult" class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold">
                            <option value="UYGUN">Sonuç: UYGUN</option>
                            <option value="UYGUN DEĞİL">Sonuç: UYGUN DEĞİL</option>
                        </select>
                    </div>
                </div>

                <!-- Müşteri Firma Giriş Bilgileri -->
                <div class="p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 space-y-2">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                        <label class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i class="fa-solid fa-user-shield text-indigo-600"></i>
                            <span>Müşteri Firma Giriş Bilgileri</span>
                        </label>
                        ${remembered
                            ? `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px]">Kayıtlı Hesap</span>`
                            : ''}
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-600 mb-0.5" for="portalCustUsernameInput">Kullanıcı Adı</label>
                            <input type="text" id="portalCustUsernameInput" value="${escapeStr(initUsername)}"
                                oninput="CloudPortal.onCustomerUsernameInput()"
                                placeholder="ornek-firma"
                                class="w-full px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-mono font-bold text-slate-900">
                        </div>
                        <div>
                            <div class="flex items-center justify-between mb-0.5">
                                <label class="block text-[10px] font-bold text-slate-600" for="portalCustPasswordInput">Şifre</label>
                                <button type="button" onclick="CloudPortal.generateRandomCustomerPassword()" class="text-[10px] font-bold text-indigo-700 hover:underline">Rastgele</button>
                            </div>
                            <input type="text" id="portalCustPasswordInput" value="${escapeStr(initPassword)}"
                                placeholder="${remembered && !initPassword ? 'Mevcut şifre korunur' : 'En az 4 karakter'}"
                                class="w-full px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-mono font-bold text-slate-900">
                        </div>
                    </div>
                    ${wo.portal_pin ? `
                        <label class="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 cursor-pointer">
                            <input type="checkbox" id="portalUploadClearPinCb" checked class="accent-indigo-600">
                            <span>Eski klasör PIN'ini (<strong>${escapeStr(wo.portal_pin)}</strong>) kaldır</span>
                        </label>
                    ` : ''}
                </div>

                <!-- İlerleme Çubuğu -->
                <div id="portalUploadProgressBox" class="hidden p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-1.5">
                    <div id="portalUploadProgressText" class="font-bold text-sky-900 text-xs">Hazırlanıyor...</div>
                    <div class="w-full h-2 rounded-full bg-sky-100 overflow-hidden">
                        <div id="portalUploadProgressBar" class="h-full bg-sky-600 transition-all duration-200" style="width: 5%"></div>
                    </div>
                </div>

                <!-- Başarılı Sonuç & Paylaşım Kartı -->
                <div id="portalUploadResultBox" class="hidden p-3 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2.5"></div>
            </div>
        `;

        const footerHtml = `
            <button type="button" onclick="closeModal()" class="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs">Kapat</button>
            <button type="button" id="portalStartUploadBtn" onclick="CloudPortal.executeModalUpload()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <span>İnternete Yükle ve Link Oluştur</span>
            </button>
        `;

        if (typeof window.openModal === 'function') {
            window.openModal('<i class="fa-solid fa-cloud-arrow-up mr-2 text-emerald-400"></i>İnternete Rapor Yükle &amp; Paylaş', bodyHtml, footerHtml);
        }
    }

    function toggleAllModalReports() {
        const boxes = Array.from(document.querySelectorAll('input[name="portalUploadCb"]'));
        if (!boxes.length) return;
        const allChecked = boxes.every(b => b.checked);
        boxes.forEach(b => { b.checked = !allChecked; });
    }

    function onExternalPdfSelected(input) {
        const file = input && input.files && input.files[0];
        if (!file) return;
        const titleEl = document.getElementById('portalExtPdfTitle');
        const noEl = document.getElementById('portalExtPdfNo');
        if (titleEl && !titleEl.value.trim()) {
            titleEl.value = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
        }
        if (noEl && !noEl.value.trim()) {
            noEl.value = `PDF-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
        }
    }

    function onCustomerUsernameInput() {
        if (!_portalModalState) return;
        const val = (document.getElementById('portalCustUsernameInput')?.value || '').trim();
        _portalModalState.manualUsernameEdit = (sanitizeUsername(val) !== sanitizeUsername(_portalModalState.initialUsername));
    }

    function generateRandomCustomerPassword() {
        const pwd = generateReadablePassword(8);
        const inp = document.getElementById('portalCustPasswordInput');
        if (inp) inp.value = pwd;
    }

    function generateRandomPin() {
        const pin = String(Math.floor(1000 + Math.random() * 9000));
        const inp = document.getElementById('portalUploadPinInput');
        if (inp) inp.value = pin;
        const cb = document.getElementById('portalUploadClearPinCb');
        if (cb) cb.checked = false;
    }

    async function executeModalUpload() {
        if (!_portalModalState) return;

        const checkedIds = Array.from(document.querySelectorAll('input[name="portalUploadCb"]:checked')).map(cb => String(cb.value));
        const selectedReports = _portalModalState.reports.filter(r => checkedIds.includes(String(r.id)));
        const pdfFile = document.getElementById('portalExternalPdfInput')?.files?.[0] || null;

        if (selectedReports.length === 0 && !pdfFile) {
            toast('Lütfen yüklenecek en az bir rapor veya PDF dosyası seçin.', 'warning');
            return;
        }

        const usernameInputEl = document.getElementById('portalCustUsernameInput');
        const passwordInputEl = document.getElementById('portalCustPasswordInput');
        const username = sanitizeUsername(usernameInputEl?.value || '');
        const passwordRaw = (passwordInputEl?.value || '').trim();

        if (!username || username.length < 3) {
            toast('Müşteri kullanıcı adı en az 3 karakter olmalıdır.', 'warning');
            if (usernameInputEl) usernameInputEl.focus();
            return;
        }
        if (usernameInputEl) usernameInputEl.value = username;

        const remembered = _portalModalState.rememberedCustomer;
        const isSameRememberedUser = Boolean(remembered && sanitizeUsername(remembered.username) === username);
        const hasRememberedToken = Boolean(isSameRememberedUser && remembered.account_write_token);

        if ((!hasRememberedToken && passwordRaw.length < 4) || (passwordRaw && passwordRaw.length < 4)) {
            toast('Müşteri şifresi en az 4 karakter olmalıdır.', 'warning');
            if (passwordInputEl) passwordInputEl.focus();
            return;
        }

        const pwdChanged = Boolean(passwordRaw && passwordRaw !== (_portalModalState.initialPassword || ''));
        let activeCustomerOpt = {
            username,
            password: passwordRaw,
            company_name: (_portalModalState.wo && (_portalModalState.wo.customer_name || _portalModalState.wo.company_name)) || 'Müşteri Firma',
            auto_username: !isSameRememberedUser && !_portalModalState.manualUsernameEdit,
            update_password: Boolean(hasRememberedToken && pwdChanged),
            account_write_token: hasRememberedToken ? remembered.account_write_token : ''
        };

        const clearChecked = Boolean(document.getElementById('portalUploadClearPinCb')?.checked);
        const pinOption = clearChecked ? { pinMode: 'clear', pin: '' } : { pinMode: 'keep', pin: '' };

        const startBtn = document.getElementById('portalStartUploadBtn');
        const progBox = document.getElementById('portalUploadProgressBox');
        const progTxt = document.getElementById('portalUploadProgressText');
        const progBar = document.getElementById('portalUploadProgressBar');
        const resultBox = document.getElementById('portalUploadResultBox');

        if (startBtn) startBtn.disabled = true;
        if (progBox) progBox.classList.remove('hidden');
        if (resultBox) resultBox.classList.add('hidden');

        const totalTasks = selectedReports.length + (pdfFile ? 1 : 0);
        const uploaded = [];
        const errors = [];
        let doneCount = 0;

        const updateProg = (label) => {
            const pct = Math.max(8, Math.round((doneCount / totalTasks) * 100));
            if (progTxt) progTxt.textContent = label;
            if (progBar) progBar.style.width = `${pct}%`;
        };

        const syncResolvedCustomer = (resItem) => {
            if (resItem && resItem.customer && resItem.customer.username) {
                activeCustomerOpt = {
                    username: resItem.customer.username,
                    password: passwordRaw || (remembered && remembered.password) || '',
                    company_name: activeCustomerOpt.company_name,
                    auto_username: false,
                    update_password: false,
                    account_write_token: resItem.customer.write_token || activeCustomerOpt.account_write_token
                };
                if (usernameInputEl) usernameInputEl.value = activeCustomerOpt.username;
            }
        };

        try {
            for (const insp of selectedReports) {
                updateProg(`${doneCount + 1}/${totalTasks} Yükleniyor: ${insp.equipment_name || insp.report_no || 'Rapor'}...`);
                try {
                    const r = await uploadInspectionReport(insp, _portalModalState.wo, pinOption, activeCustomerOpt);
                    syncResolvedCustomer(r);
                    uploaded.push(r);
                } catch (err) {
                    errors.push(`${insp.equipment_name || insp.report_no}: ${err.message}`);
                }
                doneCount++;
                updateProg(`${doneCount}/${totalTasks} Tamamlandı`);
            }

            if (pdfFile) {
                updateProg(`${doneCount + 1}/${totalTasks} Harici PDF yükleniyor: ${pdfFile.name}...`);
                try {
                    const r = await uploadExternalPdfToPortal(_portalModalState.wo, pdfFile, {
                        equipmentName: document.getElementById('portalExtPdfTitle')?.value || '',
                        reportNo: document.getElementById('portalExtPdfNo')?.value || '',
                        resultStatus: document.getElementById('portalExtPdfResult')?.value || 'UYGUN'
                    }, pinOption, activeCustomerOpt);
                    syncResolvedCustomer(r);
                    uploaded.push(r);
                } catch (err) {
                    errors.push(`PDF (${pdfFile.name}): ${err.message}`);
                }
                doneCount++;
                updateProg(`${doneCount}/${totalTasks} Tamamlandı`);
            }

            _portalModalState.uploadedResults = uploaded;
            _portalModalState.effectiveCustomer = activeCustomerOpt;
            _portalModalState.rememberedCustomer = {
                username: activeCustomerOpt.username,
                password: activeCustomerOpt.password,
                account_write_token: activeCustomerOpt.account_write_token,
                company_name: activeCustomerOpt.company_name
            };
            _portalModalState.effectivePin = pinOption.pinMode === 'clear'
                ? ''
                : (_portalModalState.wo.portal_pin || '');

            if (progBar) progBar.style.width = '100%';

            if (uploaded.length > 0 && resultBox) {
                const cfg = getPortalConfig();
                const folderUrl = uploaded[0].folderUrl || _portalModalState.wo.portal_folder_url || '';
                const effPin = _portalModalState.effectivePin;
                const finalUsername = activeCustomerOpt.username || _portalModalState.wo.portal_customer_username || '';
                const finalPassword = activeCustomerOpt.password || _portalModalState.wo.portal_customer_password || '';
                const linksList = uploaded.map(u => `
                    <div class="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <div class="min-w-0">
                            <div class="font-bold text-slate-900 text-[11px] truncate">${escapeStr(u.equipmentName)}</div>
                            <div class="text-[10px] font-mono text-slate-500">${escapeStr(u.reportNo)} · Kod: <strong class="text-sky-700">${escapeStr(u.verifyCode)}</strong></div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button type="button" onclick="CloudPortal.copyText('${escapeStr(u.reportUrl)}')" class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px]">Link</button>
                            <a href="${escapeStr(u.reportUrl)}" target="_blank" rel="noopener" class="px-2 py-1 rounded bg-sky-600 text-white font-bold text-[10px]">Aç</a>
                        </div>
                    </div>
                `).join('');

                resultBox.innerHTML = `
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                        <div class="font-black text-emerald-900 flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                            <span>${uploaded.length} Rapor Başarıyla Yayınlandı!</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 font-mono font-bold text-[10px]">🛡️ @${escapeStr(finalUsername)}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-white border border-indigo-200 space-y-1.5">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[10px] font-bold text-indigo-900 uppercase">Müşteri Portal Giriş Bilgileri</span>
                            <button type="button" onclick="CloudPortal.copyLastCredentials()" class="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px]">Girişi Kopyala</button>
                        </div>
                        <div class="grid grid-cols-1 gap-1 text-[11px] font-mono text-slate-800">
                            <div class="truncate">Site: <strong>${escapeStr(cfg.portalUrl)}</strong></div>
                            <div>Kullanıcı Adı: <strong>${escapeStr(finalUsername)}</strong> · Şifre: <strong>${escapeStr(finalPassword || '(Mevcut)')}</strong></div>
                        </div>
                    </div>
                    <div class="space-y-1">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-bold text-emerald-800 uppercase">Müşteri Klasör Bağlantısı</span>
                            ${effPin ? `<span class="text-[10px] font-mono text-amber-800 font-bold">Ek PIN: ${escapeStr(effPin)}</span>` : ''}
                        </div>
                        <div class="flex items-center gap-1.5">
                            <input type="text" readonly value="${escapeStr(folderUrl)}" onclick="this.select()"
                                class="flex-1 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono text-[11px] text-slate-900">
                            <button type="button" onclick="CloudPortal.copyText('${escapeStr(folderUrl)}')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0">Kopyala</button>
                        </div>
                    </div>
                    <div class="space-y-1 max-h-32 overflow-y-auto">${linksList}</div>
                    ${errors.length ? `<div class="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">${escapeStr(errors.join(' | '))}</div>` : ''}
                    <div class="grid grid-cols-3 gap-1.5 pt-1">
                        <button type="button" onclick="CloudPortal.shareLastUpload()" class="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1">
                            <i class="fa-brands fa-whatsapp"></i>
                            <span>Paylaş</span>
                        </button>
                        <button type="button" onclick="CloudPortal.transferLastUploadToEmail()" class="py-2 px-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center justify-center gap-1">
                            <i class="fa-solid fa-envelope"></i>
                            <span>E-postaya Aktar</span>
                        </button>
                        <a href="${escapeStr(cfg.portalUrl)}" target="_blank" rel="noopener" class="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center gap-1">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            <span>Siteye Git</span>
                        </a>
                    </div>
                `;
                resultBox.classList.remove('hidden');
                toast(`${uploaded.length} rapor internet portalına yüklendi!`, 'success');

                // Refresh active view in background
                if (window.AppState?.currentRoute === 'work-order-details' && typeof window.renderWorkOrderDetails === 'function' && _portalModalState.wo?.id) {
                    window.renderWorkOrderDetails(_portalModalState.wo.id);
                } else if (window.AppState?.currentRoute === 'home' && typeof window.renderHome === 'function') {
                    window.renderHome();
                }
            } else {
                const msg = errors.join('\n') || 'Yükleme sırasında hata oluştu.';
                if (progTxt) progTxt.textContent = 'Yükleme başarısız: ' + msg;
                toast(msg, 'error');
            }
        } finally {
            if (startBtn) startBtn.disabled = false;
        }
    }

    function shareLastUpload() {
        if (!_portalModalState || !_portalModalState.uploadedResults.length) return;
        const wo = _portalModalState.wo || {};
        const customer = wo.customer_name || wo.company_name || 'Müşteri';
        const subject = `Periyodik Kontrol Raporları - ${customer}`;
        const text = buildCustomerShareText(
            wo,
            _portalModalState.uploadedResults,
            _portalModalState.effectivePin,
            _portalModalState.effectiveCustomer
        );
        shareTextViaNativeOrWeb(subject, text);
    }

    function transferLastUploadToEmail() {
        if (!_portalModalState) return;
        const woId = _portalModalState.wo?.id;
        if (typeof window.closeModal === 'function') window.closeModal();
        if (woId && typeof window.openMultiReportEmailModal === 'function') {
            window.openMultiReportEmailModal(woId);
        } else if (typeof window.openReportEmailModal === 'function') {
            window.openReportEmailModal();
        }
    }

    // Settings UI actions
    function savePortalSettingsFromPage() {
        const urlVal = document.getElementById('settingsPortalUrl')?.value || '';
        const keyVal = document.getElementById('settingsPortalKey')?.value || '';
        const pinVal = document.getElementById('settingsPortalPin')?.value || '';
        const saved = savePortalConfig({ customPortalUrl: urlVal, adminKey: keyVal, defaultPin: pinVal });
        const urlEl = document.getElementById('settingsPortalUrl');
        if (urlEl) urlEl.value = saved.customPortalUrl;
        const activeHostEl = document.getElementById('settingsPortalActiveHost');
        if (activeHostEl) activeHostEl.textContent = saved.portalUrl.replace(/^https?:\/\//i, '');
        const statusEl = document.getElementById('settingsPortalStatus');
        if (statusEl) {
            statusEl.className = 'text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5';
            statusEl.textContent = saved.isCustomUrl
                ? `✓ Özel adres kaydedildi: ${saved.portalUrl}`
                : `✓ Varsayılan bulut portalı aktif: ${saved.portalUrl}`;
            statusEl.classList.remove('hidden');
        }
        toast('Bulut portal ayarları kaydedildi!', 'success');
    }

    async function testPortalFromSettingsPage() {
        const urlEl = document.getElementById('settingsPortalUrl');
        const keyEl = document.getElementById('settingsPortalKey');
        const urlVal = urlEl ? urlEl.value : getPortalConfig().customPortalUrl;
        const keyVal = keyEl ? keyEl.value : getPortalConfig().adminKey;
        const targetUrl = normalizePortalUrl(urlVal) || DEFAULT_CLOUD_PORTAL_URL;
        const statusEl = document.getElementById('settingsPortalStatus');
        if (statusEl) {
            statusEl.className = 'text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5';
            statusEl.textContent = `Portal sunucusu kontrol ediliyor (${targetUrl})...`;
            statusEl.classList.remove('hidden');
        }
        const res = await testPortalConnection(targetUrl, keyVal);
        if (res.ok) {
            savePortalConfig({
                customPortalUrl: urlVal,
                adminKey: keyVal,
                defaultPin: document.getElementById('settingsPortalPin')?.value || getPortalConfig().defaultPin
            });
            if (statusEl) {
                statusEl.className = 'text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5';
                statusEl.textContent = `✓ Bağlantı başarılı! Portal tek tıkla yüklemeye hazır (${res.url || targetUrl})`;
            }
            toast('Portal bağlantısı başarılı!', 'success');
        } else {
            if (statusEl) {
                statusEl.className = 'text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5';
                statusEl.textContent = '✕ ' + res.error;
            }
            toast(res.error, 'error');
        }
    }

    function openPortalSiteFromSettings() {
        const urlVal = normalizePortalUrl(document.getElementById('settingsPortalUrl')?.value || '') || getPortalConfig().portalUrl;
        window.open(urlVal, '_blank', 'noopener');
    }

    // ========================================================================
    // 7. SAHA PERSONELİ BULUT GİRİŞ & CİHAZ / İŞ KLASÖRÜ SENKRONİZASYONU
    // ========================================================================
    function resolveTemplateMeta(tplId) {
        const idStr = String(tplId || '2201');
        const list = (window.ENLAB_REPORT_TEMPLATES || []).concat(window.ENLAB_ALL_REPORT_TEMPLATES_BACKUP || []);
        const found = list.find(t => String(t.id) === idStr);
        if (found) return { id: found.id, code: found.code || 'TKM-FR.318', name: found.name || 'Elektrik Periyodik Kontrol' };
        if (idStr === '2202') return { id: '2202', code: 'TKM-FR.317', name: 'ALÇAK GERİLİM TOPRAKLAMA TESİSATI' };
        if (idStr === '2205') return { id: '2205', code: 'TKM-FR.164', name: 'JENERATÖR PERİYODİK KONTROLÜ' };
        return { id: '2201', code: 'TKM-FR.318', name: 'ELEKTRİK İÇ TESİSATI GÖZLE KONTROL VE TESTLERİ' };
    }

    function applyTenantBranding(tenant) {
        if (!tenant || typeof CompanySettingsManager === 'undefined') return;
        const b = (tenant.branding_json && typeof tenant.branding_json === 'object') ? tenant.branding_json : {};
        const patch = {};
        if (b.companyFullName || tenant.name) patch.companyFullName = b.companyFullName || tenant.name;
        if (b.companyShortName || tenant.name) patch.companyShortName = b.companyShortName || tenant.name;
        if (b.companyAddress !== undefined) patch.companyAddress = b.companyAddress;
        if (b.companyPhone !== undefined) patch.companyPhone = b.companyPhone;
        if (b.companyEmail !== undefined) patch.companyEmail = b.companyEmail;
        if (b.reportNoPrefix) patch.reportNoPrefix = b.reportNoPrefix;
        if (b.accreditationNo !== undefined) patch.accreditationNo = b.accreditationNo;
        try {
            CompanySettingsManager.saveSettings(patch);
            if (typeof CompanySettingsManager.syncHeaderTitle === 'function') {
                CompanySettingsManager.syncHeaderTitle();
            }
        } catch (e) {}
    }

    function getInspectionLocalFormData(insp) {
        if (!insp) return {};
        if (window.AppState?.currentInspection && String(window.AppState.currentInspection.id) === String(insp.id) && window.AppState.currentFormData) {
            return window.AppState.currentFormData;
        }
        try {
            const rawLocal = localStorage.getItem(`enlab_insp_${insp.id}`);
            if (rawLocal) {
                const parsed = JSON.parse(rawLocal);
                if (parsed && typeof parsed === 'object') return parsed;
            }
        } catch (e) {}
        try {
            if (insp.data_json) {
                const parsed = typeof insp.data_json === 'string' ? JSON.parse(insp.data_json) : insp.data_json;
                if (parsed && typeof parsed === 'object') return parsed;
            }
        } catch (e) {}
        return {};
    }

    function isBlankDraftInspection(insp) {
        if (!insp) return true;
        if (insp.cloud_dirty) return false;
        if (insp.status && insp.status !== 'Tamamlanacak' && insp.status !== 'Başlayacak') return false;
        const fd = getInspectionLocalFormData(insp);
        if (!fd || typeof fd !== 'object') return true;
        const hasKeys = (obj) => Boolean(obj && typeof obj === 'object' && Object.keys(obj).some(k => {
            const v = obj[k];
            if (v === null || v === undefined || v === '') return false;
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === 'object') return Object.keys(v).length > 0;
            return true;
        }));
        if (hasKeys(fd.answers)) return false;
        if (hasKeys(fd.tableRows)) return false;
        if (hasKeys(fd.specializedFields)) return false;
        if (hasKeys(fd.specializedChecks)) return false;
        if (Array.isArray(fd.specializedRows) && fd.specializedRows.length > 0) return false;
        if (Array.isArray(fd.photos) && fd.photos.length > 0) return false;
        if (String(fd.defectNotes || '').trim()) return false;
        if (fd.grounding && ((Array.isArray(fd.grounding.points) && fd.grounding.points.length > 0) || hasKeys(fd.grounding.details))) return false;
        if (fd.generator && ((Array.isArray(fd.generator.devices) && fd.generator.devices.length > 0) || hasKeys(fd.generator.measurements) || hasKeys(fd.generator.checks))) return false;
        return true;
    }

    function ensureInspectionCloudIdentity(insp, db, wo) {
        if (!insp || !db) return '';
        const targetWo = wo || (db.workOrders || []).find(w => String(w.id) === String(insp.work_order_id));
        if (!targetWo || !targetWo.cloud_wo_id) return '';
        insp.cloud_wo_id = String(targetWo.cloud_wo_id);
        if (!insp.cloud_report_key) {
            const siblings = (db.inspections || []).filter(i => String(i.work_order_id) === String(targetWo.id) && String(i.id) !== String(insp.id));
            const tplId = String(insp.template_id || '2201');
            const defaultSlotKey = `tpl_${tplId}_0`;
            const slotTaken = siblings.some(s => s.cloud_report_key === defaultSlotKey);
            insp.cloud_report_key = slotTaken ? `insp_${insp.id}` : defaultSlotKey;
        }
        return insp.cloud_report_key;
    }

    function hydrateInspectionFromSavedReport(targetInsp, sr, userRecord) {
        if (!targetInsp || !sr) return;
        const fdObj = sr.form_data_json && typeof sr.form_data_json === 'object' ? sr.form_data_json : {};
        targetInsp.cloud_wo_id = String(sr.work_order_id || targetInsp.cloud_wo_id || '');
        targetInsp.cloud_report_key = sr.client_report_key || targetInsp.cloud_report_key || '';
        targetInsp.template_id = String(sr.template_id || targetInsp.template_id || '2201');
        targetInsp.template_code = sr.template_code || targetInsp.template_code || 'TKM-FR.318';
        if (sr.report_no) targetInsp.report_no = sr.report_no;
        if (sr.equipment_name) targetInsp.equipment_name = sr.equipment_name;
        if (sr.serial_no !== undefined) targetInsp.serial_no = sr.serial_no || '';
        if (sr.location !== undefined) targetInsp.location = sr.location || '';
        if (sr.status) targetInsp.status = sr.status;
        if (sr.result) targetInsp.result = sr.result;
        if (sr.inspection_date) targetInsp.inspection_date = sr.inspection_date;
        if (sr.portal_report_slug) targetInsp.portal_report_slug = sr.portal_report_slug;
        if (sr.portal_report_url) targetInsp.portal_report_url = sr.portal_report_url;
        if (sr.portal_verify_code) targetInsp.portal_verify_code = sr.portal_verify_code;
        if (sr.portal_folder_slug) targetInsp.portal_folder_slug = sr.portal_folder_slug;
        if (sr.portal_folder_url) targetInsp.portal_folder_url = sr.portal_folder_url;
        if (userRecord && userRecord.fullName && !targetInsp.inspector) targetInsp.inspector = userRecord.fullName;
        targetInsp.data_json = JSON.stringify(fdObj);
        targetInsp.cloud_dirty = false;
        targetInsp.cloud_synced_at = sr.updated_at || new Date().toISOString();
        targetInsp.local_updated_at = sr.client_updated_at || sr.updated_at || targetInsp.cloud_synced_at;

        try {
            localStorage.setItem(`enlab_insp_${targetInsp.id}`, JSON.stringify(fdObj));
        } catch (e) {}

        if (window.AppState?.currentInspection && String(window.AppState.currentInspection.id) === String(targetInsp.id)) {
            Object.assign(window.AppState.currentInspection, {
                report_no: targetInsp.report_no,
                equipment_name: targetInsp.equipment_name,
                serial_no: targetInsp.serial_no,
                location: targetInsp.location,
                status: targetInsp.status,
                result: targetInsp.result,
                inspection_date: targetInsp.inspection_date,
                portal_report_slug: targetInsp.portal_report_slug,
                portal_report_url: targetInsp.portal_report_url,
                portal_verify_code: targetInsp.portal_verify_code,
                portal_folder_slug: targetInsp.portal_folder_slug,
                portal_folder_url: targetInsp.portal_folder_url
            });
            window.AppState.currentFormData = Object.assign({}, fdObj);
        }
    }

    function applyPortalLinksFallback(inspList, wo) {
        const portalReports = Array.isArray(wo?.portal_reports) ? wo.portal_reports : [];
        if (!portalReports.length || !Array.isArray(inspList)) return;
        for (const pr of portalReports) {
            const match =
                inspList.find(i => pr.report_no && i.report_no === pr.report_no) ||
                inspList.find(i => !i.portal_report_url && pr.template_code && i.template_code === pr.template_code);
            if (match && !match.portal_report_url) {
                match.portal_report_slug = pr.share_slug || '';
                match.portal_report_url = pr.report_url || '';
                match.portal_verify_code = pr.verify_code || '';
                if (wo.portal_folder_slug) match.portal_folder_slug = wo.portal_folder_slug;
                if (wo.portal_folder_url) match.portal_folder_url = wo.portal_folder_url;
                if (pr.report_no && isBlankDraftInspection(match)) {
                    match.report_no = pr.report_no;
                }
            }
        }
    }

    function syncCloudWorkOrders(cloudWorkOrders, userRecord, savedReports = []) {
        if (!window.OfflineDB) return { added: 0, updated: 0 };
        window.OfflineDB.init();
        const db = window.OfflineDB.state;
        if (!Array.isArray(db.workOrders)) db.workOrders = [];
        if (!Array.isArray(db.inspections)) db.inspections = [];

        const list = Array.isArray(cloudWorkOrders) ? cloudWorkOrders : [];
        const cloudIds = new Set(list.map(w => String(w.id)));
        const uid = String(userRecord.cloudId || userRecord.id || '');
        const todayStr = new Date().toLocaleDateString('tr-TR');
        let added = 0;
        let updated = 0;

        const savedByWo = new Map();
        (Array.isArray(savedReports) ? savedReports : []).forEach(sr => {
            const key = String(sr.work_order_id || '');
            if (!key) return;
            const arr = savedByWo.get(key) || [];
            arr.push(sr);
            savedByWo.set(key, arr);
        });

        // 1. Yönetici tarafından kaldırılan/başkasına devredilen ve henüz yerel değişmemiş klasörleri temizle
        db.workOrders = db.workOrders.filter(localWo => {
            if (!localWo.assigned_by_manager || !localWo.cloud_wo_id) return true;
            if (localWo.assigned_user_cloud_id && uid && String(localWo.assigned_user_cloud_id) !== uid) return true;
            if (cloudIds.has(String(localWo.cloud_wo_id))) return true;
            const childInsps = db.inspections.filter(i => String(i.work_order_id) === String(localWo.id));
            const hasEdited = childInsps.some(i => !isBlankDraftInspection(i));
            if (hasEdited) return true;
            db.inspections = db.inspections.filter(i => String(i.work_order_id) !== String(localWo.id));
            return false;
        });

        // 2. Gelen iş klasörlerini ve buluttaki kayıtlı raporları oluştur / güncelle
        list.forEach((wo, idx) => {
            const woSavedReports = savedByWo.get(String(wo.id)) || [];
            const savedByKey = new Map(woSavedReports.map(sr => [String(sr.client_report_key), sr]));

            const existing = db.workOrders.find(w => String(w.cloud_wo_id) === String(wo.id));
            if (existing) {
                existing.code = wo.work_order_code || existing.code;
                existing.company_name = wo.company_name || existing.company_name;
                existing.company_branch = wo.company_branch || '';
                existing.company_address = wo.company_address || '';
                existing.isg_katip_no = wo.isg_katip_no || '';
                existing.sgk_sicil_no = wo.sgk_sicil_no || '';
                existing.contact_email = wo.contact_email || existing.contact_email || '';
                if (!existing.field_notes && wo.field_notes) existing.field_notes = wo.field_notes;
                if (wo.portal_folder_slug && !existing.portal_folder_slug) existing.portal_folder_slug = wo.portal_folder_slug;
                if (wo.portal_folder_url && !existing.portal_folder_url) existing.portal_folder_url = wo.portal_folder_url;
                if (wo.portal_write_token && !existing.portal_write_token) existing.portal_write_token = wo.portal_write_token;
                existing.assigned_user_cloud_id = uid;
                existing.assigned_to = userRecord.fullName || existing.assigned_to;
                existing.assigned_by_manager = true;
                existing.cloud_status = wo.status || 'open';
                existing.is_open = wo.status === 'completed' ? 0 : 1;

                // Ensure existing child inspections have stable cloud keys
                const childInsps = db.inspections.filter(i => String(i.work_order_id) === String(existing.id));
                const seenKeys = new Set();
                childInsps.forEach(ci => {
                    ci.cloud_wo_id = String(wo.id);
                    if (!ci.cloud_report_key) {
                        const baseKey = `tpl_${String(ci.template_id || '2201')}_0`;
                        ci.cloud_report_key = !seenKeys.has(baseKey) ? baseKey : `insp_${ci.id}`;
                    }
                    seenKeys.add(ci.cloud_report_key);
                });

                // Reconcile cloud saved reports into existing work order
                woSavedReports.forEach((sr, sIdx) => {
                    const currentChildren = db.inspections.filter(i => String(i.work_order_id) === String(existing.id));
                    let match =
                        currentChildren.find(i => i.cloud_report_key === sr.client_report_key) ||
                        currentChildren.find(i => sr.report_no && i.report_no === sr.report_no) ||
                        (String(sr.client_report_key || '').startsWith('tpl_')
                            ? currentChildren.find(i => String(i.template_id) === String(sr.template_id) && isBlankDraftInspection(i))
                            : null);

                    if (match) {
                        const cloudMs = Date.parse(sr.updated_at || '') || 0;
                        const localSyncedMs = Date.parse(match.cloud_synced_at || '') || 0;
                        if ((!match.cloud_dirty && (cloudMs > localSyncedMs || isBlankDraftInspection(match))) || isBlankDraftInspection(match)) {
                            hydrateInspectionFromSavedReport(match, sr, userRecord);
                        }
                    } else {
                        const newInspId = Date.now() + 3000 + idx * 50 + sIdx;
                        const newInsp = {
                            id: newInspId,
                            work_order_id: existing.id,
                            work_order_code: existing.code,
                            cloud_wo_id: String(wo.id),
                            cloud_report_key: sr.client_report_key,
                            report_no: sr.report_no || '',
                            template_id: String(sr.template_id || '2201'),
                            template_code: sr.template_code || 'TKM-FR.318',
                            company_name: existing.company_name,
                            company_branch: existing.company_branch,
                            address: existing.company_address,
                            isg_katip_no: existing.isg_katip_no,
                            sgk_sicil_no: existing.sgk_sicil_no,
                            equipment_name: sr.equipment_name || 'Rapor',
                            accreditation: 'AK',
                            serial_no: sr.serial_no || '',
                            location: sr.location || '',
                            inspector: userRecord.fullName || '',
                            approver: '',
                            status: sr.status || 'Tamamlanacak',
                            result: sr.result || 'UYGUN',
                            inspection_date: sr.inspection_date || todayStr,
                            end_date: todayStr,
                            report_date: todayStr,
                            is_mine: 1,
                            data_json: '{}'
                        };
                        hydrateInspectionFromSavedReport(newInsp, sr, userRecord);
                        db.inspections.unshift(newInsp);
                    }
                });

                const finalChildren = db.inspections.filter(i => String(i.work_order_id) === String(existing.id));
                applyPortalLinksFallback(finalChildren, wo);
                existing.inspection_count = finalChildren.length;
                updated++;
                return;
            }

            const newWoId = Date.now() + idx * 100 + Math.floor(Math.random() * 50);
            const newWo = {
                id: newWoId,
                cloud_wo_id: String(wo.id),
                assigned_user_cloud_id: uid,
                assigned_by_manager: true,
                cloud_status: wo.status || 'open',
                code: wo.work_order_code || `HZL-${newWoId}`,
                proposal_no: 'TKL-SAHA',
                company_name: wo.company_name || 'İşyeri',
                company_branch: wo.company_branch || '',
                company_address: wo.company_address || '',
                isg_katip_no: wo.isg_katip_no || '',
                sgk_sicil_no: wo.sgk_sicil_no || '',
                contact_email: wo.contact_email || '',
                field_notes: wo.field_notes || '',
                portal_folder_slug: wo.portal_folder_slug || '',
                portal_folder_url: wo.portal_folder_url || '',
                portal_write_token: wo.portal_write_token || '',
                start_date: todayStr,
                end_date: todayStr,
                assigned_to: userRecord.fullName || '',
                status: 'Açık',
                is_open: wo.status === 'completed' ? 0 : 1,
                is_mine: 1,
                inspection_count: 0,
                files_json: '[]'
            };
            db.workOrders.unshift(newWo);

            const tpls = Array.isArray(wo.template_ids) ? wo.template_ids : [];
            const prefix = (typeof CompanySettingsManager !== 'undefined' && CompanySettingsManager.getSettings().reportNoPrefix) || 'HZL-';
            const occCount = {};
            const consumedSavedKeys = new Set();
            const createdList = [];

            tpls.forEach((tplId, tIdx) => {
                const tplStr = String(tplId);
                const occIdx = occCount[tplStr] || 0;
                occCount[tplStr] = occIdx + 1;
                const slotKey = `tpl_${tplStr}_${occIdx}`;
                const meta = resolveTemplateMeta(tplStr);
                const inspId = newWoId + 1000 + tIdx * 17 + Math.floor(Math.random() * 10);

                // Check matching saved report by exact slotKey or fallback same template_id
                let sr = savedByKey.get(slotKey) || null;
                if (!sr) {
                    sr = woSavedReports.find(cand => !consumedSavedKeys.has(cand.client_report_key) && String(cand.template_id) === tplStr) || null;
                }

                if (sr) {
                    consumedSavedKeys.add(sr.client_report_key);
                    const restoredInsp = {
                        id: inspId,
                        work_order_id: newWoId,
                        work_order_code: newWo.code,
                        cloud_wo_id: String(wo.id),
                        cloud_report_key: sr.client_report_key,
                        report_no: sr.report_no || `${prefix}${new Date().toISOString().slice(2, 4)}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(54100 + Math.random() * 5800)}`,
                        template_id: tplStr,
                        template_code: meta.code,
                        company_name: newWo.company_name,
                        company_branch: newWo.company_branch,
                        address: newWo.company_address,
                        isg_katip_no: newWo.isg_katip_no,
                        sgk_sicil_no: newWo.sgk_sicil_no,
                        equipment_name: sr.equipment_name || meta.name,
                        accreditation: 'AK',
                        serial_no: sr.serial_no || '',
                        location: sr.location || '',
                        inspector: userRecord.fullName || '',
                        approver: '',
                        status: sr.status || 'Tamamlanacak',
                        result: sr.result || 'UYGUN',
                        inspection_date: sr.inspection_date || todayStr,
                        end_date: todayStr,
                        report_date: todayStr,
                        is_mine: 1,
                        data_json: '{}'
                    };
                    hydrateInspectionFromSavedReport(restoredInsp, sr, userRecord);
                    db.inspections.unshift(restoredInsp);
                    createdList.push(restoredInsp);
                    return;
                }

                const reportNo = `${prefix}${new Date().toISOString().slice(2, 4)}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(54100 + Math.random() * 5800)}`;
                const formData = {
                    companyInfo: {
                        firmName: newWo.company_name,
                        address: newWo.company_address,
                        isgKatipNo: newWo.isg_katip_no,
                        sgkSicilNo: newWo.sgk_sicil_no,
                        contactEmail: newWo.contact_email,
                        reportNo,
                        reportDate: todayStr
                    }
                };
                if (window.MeasuringDevicesManager && typeof window.MeasuringDevicesManager.applyDefaultsToFormData === 'function') {
                    window.MeasuringDevicesManager.applyDefaultsToFormData(formData, meta.id, false);
                }
                const inspObj = {
                    id: inspId,
                    work_order_id: newWoId,
                    work_order_code: newWo.code,
                    cloud_wo_id: String(wo.id),
                    cloud_report_key: slotKey,
                    cloud_dirty: false,
                    report_no: reportNo,
                    template_id: String(meta.id),
                    template_code: meta.code,
                    company_name: newWo.company_name,
                    company_branch: newWo.company_branch,
                    address: newWo.company_address,
                    isg_katip_no: newWo.isg_katip_no,
                    sgk_sicil_no: newWo.sgk_sicil_no,
                    equipment_name: meta.name,
                    accreditation: 'AK',
                    serial_no: '',
                    location: '',
                    inspector: userRecord.fullName || '',
                    approver: '',
                    status: 'Tamamlanacak',
                    result: 'UYGUN',
                    inspection_date: todayStr,
                    end_date: todayStr,
                    report_date: todayStr,
                    is_mine: 1,
                    data_json: JSON.stringify(formData)
                };
                db.inspections.unshift(inspObj);
                createdList.push(inspObj);
            });

            // Restore any additional saved reports added in the field (e.g. duplicated or extra panels)
            woSavedReports.forEach((sr, extraIdx) => {
                if (consumedSavedKeys.has(sr.client_report_key)) return;
                const extraId = newWoId + 5000 + extraIdx * 13;
                const extraInsp = {
                    id: extraId,
                    work_order_id: newWoId,
                    work_order_code: newWo.code,
                    cloud_wo_id: String(wo.id),
                    cloud_report_key: sr.client_report_key,
                    report_no: sr.report_no || '',
                    template_id: String(sr.template_id || '2201'),
                    template_code: sr.template_code || 'TKM-FR.318',
                    company_name: newWo.company_name,
                    company_branch: newWo.company_branch,
                    address: newWo.company_address,
                    isg_katip_no: newWo.isg_katip_no,
                    sgk_sicil_no: newWo.sgk_sicil_no,
                    equipment_name: sr.equipment_name || 'Rapor',
                    accreditation: 'AK',
                    serial_no: sr.serial_no || '',
                    location: sr.location || '',
                    inspector: userRecord.fullName || '',
                    approver: '',
                    status: sr.status || 'Tamamlanacak',
                    result: sr.result || 'UYGUN',
                    inspection_date: sr.inspection_date || todayStr,
                    end_date: todayStr,
                    report_date: todayStr,
                    is_mine: 1,
                    data_json: '{}'
                };
                hydrateInspectionFromSavedReport(extraInsp, sr, userRecord);
                db.inspections.unshift(extraInsp);
                createdList.push(extraInsp);
            });

            applyPortalLinksFallback(createdList, wo);
            newWo.inspection_count = createdList.length;
            added++;
        });

        window.OfflineDB.save();
        return { added, updated };
    }

    function applyCloudSyncPayload(data, rawPassword = null) {
        if (!data || !data.user) return null;
        let userRecord = null;
        if (typeof window.AuthManager !== 'undefined' && typeof window.AuthManager.upsertCloudUser === 'function') {
            userRecord = window.AuthManager.upsertCloudUser({
                cloudId: data.user.id,
                tenantId: data.tenant ? data.tenant.id : data.user.tenant_id,
                tenantName: data.tenant ? data.tenant.name : '',
                username: data.user.username,
                password: rawPassword,
                role: data.user.role || 'inspector',
                fullName: data.user.full_name,
                title: data.user.title || 'Elektrik Mühendisi',
                ministryRegNo: data.user.ministry_reg_no || '',
                diplomaNoDate: data.user.diploma_no_date || '',
                emoNo: data.user.emo_no || '',
                cloudToken: data.token || undefined,
                lastSyncedAt: data.synced_at || new Date().toISOString()
            });
        }
        if (data.tenant) {
            applyTenantBranding(data.tenant);
        }
        if (window.MeasuringDevicesManager && typeof window.MeasuringDevicesManager.syncCloudDevices === 'function') {
            window.MeasuringDevicesManager.syncCloudDevices(
                Array.isArray(data.devices) ? data.devices : [],
                userRecord ? userRecord.id : null
            );
        }
        if (userRecord) {
            syncCloudWorkOrders(
                Array.isArray(data.work_orders) ? data.work_orders : [],
                userRecord,
                Array.isArray(data.saved_reports) ? data.saved_reports : []
            );
        }
        if (typeof window.updateHeaderUserWidget === 'function') {
            window.updateHeaderUserWidget();
        }
        return userRecord;
    }

    async function pushInspectionToCloud(inspRaw, formDataOverride = null, workOrderOverride = null) {
        if (!inspRaw) return { ok: false, reason: 'no_inspection' };
        const curUser = (typeof window.AuthManager !== 'undefined' && window.AuthManager.getCurrentUser()) || null;
        if (!curUser || !curUser.isCloudManaged || !curUser.cloudToken) {
            return { ok: false, reason: 'no_cloud_session' };
        }
        if (navigator.onLine === false) {
            return { ok: false, reason: 'offline' };
        }
        if (!window.OfflineDB) return { ok: false, reason: 'no_db' };
        window.OfflineDB.init();
        const db = window.OfflineDB.state;
        const dbInsp = (db.inspections || []).find(i => String(i.id) === String(inspRaw.id)) || inspRaw;
        const wo = workOrderOverride || (db.workOrders || []).find(w => String(w.id) === String(dbInsp.work_order_id));
        if (!wo || !wo.cloud_wo_id) {
            return { ok: false, reason: 'not_cloud_wo' };
        }
        const key = ensureInspectionCloudIdentity(dbInsp, db, wo);
        if (!key) return { ok: false, reason: 'no_key' };

        const fd = formDataOverride || getInspectionLocalFormData(dbInsp);
        const cfg = getPortalConfig();

        try {
            const res = await realFetch(`${cfg.portalUrl}/api/app-sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Token': curUser.cloudToken
                },
                body: JSON.stringify({
                    action: 'save-report',
                    work_order_id: String(wo.cloud_wo_id),
                    client_report_key: key,
                    template_id: String(dbInsp.template_id || '2201'),
                    template_code: dbInsp.template_code || 'TKM-FR.318',
                    report_no: dbInsp.report_no || '',
                    equipment_name: dbInsp.equipment_name || '',
                    serial_no: dbInsp.serial_no || '',
                    location: dbInsp.location || '',
                    status: dbInsp.status || 'Tamamlanacak',
                    result: (fd && fd.overallResult) || dbInsp.result || 'UYGUN',
                    inspection_date: dbInsp.inspection_date || '',
                    portal_report_slug: dbInsp.portal_report_slug || '',
                    portal_report_url: dbInsp.portal_report_url || '',
                    portal_verify_code: dbInsp.portal_verify_code || '',
                    portal_folder_slug: dbInsp.portal_folder_slug || wo.portal_folder_slug || '',
                    portal_folder_url: dbInsp.portal_folder_url || wo.portal_folder_url || '',
                    form_data_json: fd && typeof fd === 'object' ? fd : {},
                    client_updated_at: dbInsp.local_updated_at || new Date().toISOString()
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                return { ok: false, status: res.status, error: data.error || 'Bulut kayıt hatası' };
            }
            dbInsp.cloud_dirty = false;
            dbInsp.cloud_synced_at = (data.report && data.report.updated_at) || new Date().toISOString();
            if (inspRaw !== dbInsp) {
                inspRaw.cloud_wo_id = dbInsp.cloud_wo_id;
                inspRaw.cloud_report_key = dbInsp.cloud_report_key;
                inspRaw.cloud_dirty = false;
                inspRaw.cloud_synced_at = dbInsp.cloud_synced_at;
            }
            window.OfflineDB.save();
            return { ok: true, report: data.report };
        } catch (err) {
            return { ok: false, networkError: true, error: err && err.message ? err.message : 'Ağ hatası' };
        }
    }

    const _cloudPushTimers = new Map();
    function queueInspectionPush(insp, formData = null) {
        if (!insp || !insp.id) return;
        const curUser = (typeof window.AuthManager !== 'undefined' && window.AuthManager.getCurrentUser()) || null;
        if (!curUser || !curUser.isCloudManaged || !curUser.cloudToken) return;
        const key = String(insp.id);
        if (_cloudPushTimers.has(key)) clearTimeout(_cloudPushTimers.get(key));
        _cloudPushTimers.set(key, setTimeout(() => {
            _cloudPushTimers.delete(key);
            pushInspectionToCloud(insp, formData).catch(() => {});
        }, 3500));
    }

    async function flushPendingCloudChanges() {
        const curUser = (typeof window.AuthManager !== 'undefined' && window.AuthManager.getCurrentUser()) || null;
        if (!curUser || !curUser.isCloudManaged || !curUser.cloudToken || navigator.onLine === false) {
            return { ok: false, pushed: 0 };
        }
        if (!window.OfflineDB) return { ok: false, pushed: 0 };
        window.OfflineDB.init();
        const db = window.OfflineDB.state;
        const cfg = getPortalConfig();
        let pushed = 0;

        // 1. Flush pending deletes
        if (Array.isArray(db.pendingCloudDeletes) && db.pendingCloudDeletes.length > 0) {
            const remaining = [];
            for (const del of db.pendingCloudDeletes) {
                try {
                    const res = await realFetch(`${cfg.portalUrl}/api/app-sync`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-App-Token': curUser.cloudToken
                        },
                        body: JSON.stringify({
                            action: 'delete-report',
                            work_order_id: del.work_order_id,
                            client_report_key: del.client_report_key
                        })
                    });
                    if (!res.ok) remaining.push(del);
                } catch (e) {
                    remaining.push(del);
                }
            }
            db.pendingCloudDeletes = remaining;
            window.OfflineDB.save();
        }

        // 2. Push any dirty or modified local inspections belonging to this user's cloud work orders
        const uid = String(curUser.cloudId || '');
        const userCloudWos = new Map(
            (db.workOrders || [])
                .filter(w => w.cloud_wo_id && (!w.assigned_user_cloud_id || !uid || String(w.assigned_user_cloud_id) === uid))
                .map(w => [String(w.id), w])
        );
        const dirtyInsps = (db.inspections || []).filter(i => {
            const wo = userCloudWos.get(String(i.work_order_id));
            if (!wo) return false;
            return Boolean(i.cloud_dirty) || (!i.cloud_synced_at && !isBlankDraftInspection(i));
        });

        for (const insp of dirtyInsps) {
            const wo = userCloudWos.get(String(insp.work_order_id));
            const r = await pushInspectionToCloud(insp, null, wo);
            if (r && r.ok) pushed++;
        }

        return { ok: true, pushed };
    }

    async function loginOnline(username, password) {
        const cfg = getPortalConfig();
        const url = `${cfg.portalUrl}/api/app-sync`;
        try {
            const res = await realFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    username: String(username || '').trim(),
                    password: String(password || '').trim()
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                return {
                    success: false,
                    authError: res.status === 400 || res.status === 401 || res.status === 403,
                    message: data.error || 'Kullanıcı adı veya şifre hatalı!'
                };
            }
            const user = applyCloudSyncPayload(data, String(password || '').trim());
            return {
                success: true,
                user,
                deviceCount: Array.isArray(data.devices) ? data.devices.length : 0,
                workOrderCount: Array.isArray(data.work_orders) ? data.work_orders.length : 0,
                savedReportCount: Array.isArray(data.saved_reports) ? data.saved_reports.length : 0
            };
        } catch (err) {
            return {
                success: false,
                networkError: true,
                message: err && err.message ? err.message : 'Sunucuya ulaşılamadı'
            };
        }
    }

    let _syncPromise = null;
    async function syncNow({ silent = false } = {}) {
        const curUser = (typeof window.AuthManager !== 'undefined' && window.AuthManager.getCurrentUser()) || null;
        if (!curUser || !curUser.isCloudManaged || !curUser.cloudToken) {
            if (!silent) toast('Bulut senkronizasyonu için şirket hesabınızla giriş yapın.', 'warning');
            return { ok: false, reason: 'no_cloud_session' };
        }
        if (navigator.onLine === false) {
            if (!silent) toast('İnternet bağlantısı yok — çevrimdışı modda çalışılıyor.', 'warning');
            return { ok: false, reason: 'offline' };
        }
        if (_syncPromise) return _syncPromise;

        _syncPromise = (async () => {
            try {
                await flushPendingCloudChanges();
                const cfg = getPortalConfig();
                const res = await realFetch(`${cfg.portalUrl}/api/app-sync`, {
                    method: 'GET',
                    headers: { 'X-App-Token': curUser.cloudToken }
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) {
                    if (!silent) toast(data.error || 'Senkronizasyon başarısız oldu.', 'error');
                    return { ok: false, status: res.status, error: data.error };
                }
                applyCloudSyncPayload(data, null);
                if (!silent) {
                    toast(`Güncellendi: ${(data.devices || []).length} cihaz, ${(data.work_orders || []).length} iş klasörü, ${(data.saved_reports || []).length} kayıtlı rapor`, 'success');
                }
                if (window.AppState && window.AppState.currentRoute === 'home' && typeof window.renderHome === 'function') {
                    window.renderHome({ skipSync: true });
                } else if (window.AppState && window.AppState.currentRoute === 'settings' && typeof window.renderSettingsPage === 'function') {
                    window.renderSettingsPage();
                } else if (window.AppState && window.AppState.currentRoute === 'work-order-details' && window.AppState.currentWorkOrder?.id && typeof window.renderWorkOrderDetails === 'function') {
                    window.renderWorkOrderDetails(window.AppState.currentWorkOrder.id, 'inspections');
                }
                return { ok: true, devices: (data.devices || []).length, workOrders: (data.work_orders || []).length };
            } catch (err) {
                if (!silent) toast('İnternet bağlantısı kurulamadı; çevrimdışı veriler korunuyor.', 'warning');
                return { ok: false, networkError: true };
            } finally {
                _syncPromise = null;
            }
        })();
        return _syncPromise;
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('online', () => {
            flushPendingCloudChanges().catch(() => {});
        });
    }

    window.CloudAppSync = {
        loginOnline,
        syncNow,
        applySyncPayload: applyCloudSyncPayload,
        pushInspection: pushInspectionToCloud,
        queueInspectionPush,
        flushPendingCloudChanges
    };

    window.CloudPortal = {
        DEFAULT_PORTAL_URL: DEFAULT_CLOUD_PORTAL_URL,
        getConfig: getPortalConfig,
        saveConfig: savePortalConfig,
        normalizeUrl: normalizePortalUrl,
        sanitizeCompanySlug,
        sanitizeUsername,
        buildSuggestedUsername,
        generateReadablePassword,
        getActiveCompanyProfile: resolveActiveCompanyProfile,
        generateQrDataUrl,
        buildPortableA4ReportHtml,
        testConnection: testPortalConnection,
        uploadInspectionReport,
        uploadExternalPdfToPortal,
        openPortalUploadModal,
        toggleAllModalReports,
        onExternalPdfSelected,
        onCustomerUsernameInput,
        generateRandomCustomerPassword,
        generateRandomPin,
        executeModalUpload,
        shareLastUpload,
        transferLastUploadToEmail,
        copyReportPortalLink,
        copyCustomerLoginInfo,
        copyLastCredentials,
        savePortalSettingsFromPage,
        testPortalFromSettingsPage,
        openPortalSiteFromSettings,
        copyText: copyTextToClipboard
    };

    window.generateQrDataUrl = generateQrDataUrl;
    window.openPortalUploadModal = openPortalUploadModal;
    window.copyReportPortalLink = copyReportPortalLink;
})();
