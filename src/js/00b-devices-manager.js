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
                            ${locked ? `
                                <span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold inline-flex items-center gap-1">
                                    <i class="fa-solid fa-lock text-[9px] text-amber-600"></i>
                                    <span>Yönetici Ataması</span>
                                </span>
                            ` : `
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
                <div class="p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2">
                    <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-base">
                        <i class="fa-solid fa-screwdriver-wrench"></i>
                    </div>
                    <div class="text-xs font-bold text-slate-800">${locked ? 'Yöneticiniz henüz size cihaz atamadı' : 'Henüz üzerinize ölçüm cihazı almadınız'}</div>
                    <p class="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                        ${locked
                            ? "Firma yöneticiniz web panelinden size ölçüm cihazı atadığında burada otomatik görünür ve raporlara eklenir. Atama sonrası 'Buluttan Yenile'ye dokunun."
                            : 'Aşağıdan kendi kullandığınız cihazları (ör. Fluke / UNI-T Termal Kamera, Metrel Test Cihazı, Pensampermetre vb.) seçin; yeni rapor yazarken otomatik eklensinler.'}
                    </p>
                </div>
            `;

            return `
                <div id="settingsMeasuringDevicesCard" class="card-craft-white p-3 space-y-2.5">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                        <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                            <i class="fa-solid fa-screwdriver-wrench text-amber-600 shrink-0"></i>
                            <span class="truncate">${locked ? 'Ölçüm Cihazlarım (Yönetici Ataması)' : 'Ölçüm Cihazlarım (Üzerime Alınanlar)'}</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            ${locked ? `
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <i class="fa-solid fa-cloud mr-0.5"></i>Yönetici Ataması
                                </span>
                            ` : ''}
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${assigned.length ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}">
                                ${assigned.length} Aktif Cihaz
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px]">
                        <label class="flex items-center gap-2 cursor-pointer font-semibold text-amber-950 flex-1 min-w-0">
                            <input type="checkbox" ${autoApply ? 'checked' : ''}
                                onchange="MeasuringDevicesManager.setAutoApplyEnabled(this.checked); showToast(this.checked ? 'Raporlara otomatik cihaz ekleme açıldı' : 'Otomatik ekleme kapatıldı');"
                                class="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 shrink-0">
                            <span class="leading-snug"><strong>${esc(userName)}</strong> için yeni rapor yazarken otomatik eklensin</span>
                        </label>
                    </div>

                    <div class="space-y-2">
                        ${cardsHtml}
                    </div>

                    ${locked ? `
                        <div class="pt-1 space-y-2">
                            <button type="button" onclick="window.CloudAppSync && window.CloudAppSync.syncNow()"
                                class="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition">
                                <i class="fa-solid fa-arrows-rotate"></i>
                                <span>Buluttan Yenile (Cihazları Güncelle)</span>
                            </button>
                            <div class="text-[10px] text-slate-500 text-center">
                                Cihaz ekleme, çıkarma ve kalibrasyon güncelleme işlemleri yalnızca firma yöneticisi web panelinden yapılır.
                            </div>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <button type="button" onclick="openDeviceCatalogPickerModal('settings_assign')"
                                class="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition">
                                <i class="fa-solid fa-list-check"></i>
                                <span>Havuzdan Cihaz Seç / Üzerime Al (${catalog.length})</span>
                            </button>
                            <button type="button" onclick="openDeviceEditModal(null, { assignByDefault: true, refreshSettings: true })"
                                class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition">
                                <i class="fa-solid fa-plus"></i>
                                <span>Yeni Ölçüm Cihazı Ekle</span>
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
            bannerHtml = `
                <div class="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900">
                    Kendi çantanızda / üzerinizde taşıdığınız cihazları işaretleyin. Seçilen cihazlar yeni rapor oluştururken otomatik eklenir.
                </div>
            `;
            newDeviceContextOpts = { assignByDefault: true, reopenPicker: true };
        } else if (mode === 'settings_swap') {
            const oldDev = MeasuringDevicesManager.getDeviceById(ctx.oldDeviceId);
            modalTitle = `<i class="fa-solid fa-right-left text-sky-400 mr-2"></i>Cihaz Değiştir (Ayarlar)`;
            bannerHtml = `
                <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950">
                    <span class="font-semibold">Değiştirilecek Cihaz:</span>
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
                <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950">
                    <span class="font-semibold">Şu an seçili:</span>
                    <strong class="ml-1">${esc(rowLabel)}</strong>
                    ${row.serial ? `<span class="font-mono text-[10px] ml-1">(${esc(row.serial)})</span>` : ''}
                    <div class="text-[10px] text-amber-800 mt-0.5">Yeni seçtiğiniz cihaz hemen bu satırın yerine yazılır (örn. Fluke yerine UNI-T).</div>
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
            const curCamName = curRow[guids[0]] || 'Henüz Seçilmedi';
            const curCamSerial = curRow[guids[1]] || '';
            modalTitle = `<i class="fa-solid fa-temperature-half text-orange-400 mr-2"></i>Termal Kamera Seç / Değiştir`;
            bannerHtml = `
                <div class="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-[11px] text-orange-950">
                    <span class="font-semibold">Bölüm 3 Termal Kamera:</span>
                    <strong class="ml-1">${esc(curCamName)}</strong>
                    ${curCamSerial ? `<span class="font-mono text-[10px] ml-1">(${esc(curCamSerial)})</span>` : ''}
                    <div class="text-[10px] text-orange-800 mt-0.5">Seçtiğiniz termal kamera Bölüm 3'e ve Bölüm 4'teki termal kamera satırına uygulanır.</div>
                </div>
            `;
            newDeviceContextOpts = {
                defaultCategory: 'Termal Kamera',
                assignByDefault: false,
                swapThermalReport: true
            };
        } else if (mode === 'report_add') {
            modalTitle = `<i class="fa-solid fa-plus text-emerald-400 mr-2"></i>Rapora Cihaz Ekle`;
            bannerHtml = `
                <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950">
                    Üzerinizdeki cihazlardan veya havuzdan dokunarak bu rapora ekleyin.
                </div>
            `;
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
                    <span class="font-bold text-emerald-950 text-xs">Bu cihaz üzerimde olsun (Yeni raporlara otomatik eklensin)</span>
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
            <div class="space-y-3 text-xs">
                <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                    Raporda şu anda <strong>${curDevices.length} cihaz</strong> kayıtlı. Ayarlardaki üzerinizdeki <strong>${assigned.length} cihaz</strong> nasıl aktarılsın?
                </div>
                <div class="space-y-2">
                    <button type="button" onclick="MeasuringDevicesManager.syncAssignedDevicesToCurrentReport('replace'); closeModal();"
                        class="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-left flex items-center justify-between gap-2">
                        <div>
                            <div class="text-amber-300">Mevcut Listeyi Yenile (Üzerimdekilerle Değiştir)</div>
                            <div class="text-[10px] font-normal text-slate-300 mt-0.5">Rapordaki ölçüm aletleri tablosunu ayarlardaki listeyle değiştirir</div>
                        </div>
                        <i class="fa-solid fa-arrows-rotate text-amber-400"></i>
                    </button>
                    <button type="button" onclick="MeasuringDevicesManager.syncAssignedDevicesToCurrentReport('append'); closeModal();"
                        class="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 font-bold text-left flex items-center justify-between gap-2">
                        <div>
                            <div>Eksik Olanları Sona Ekle</div>
                            <div class="text-[10px] font-normal text-emerald-800 mt-0.5">Mevcut cihazları korur, ayarlardaki eksik cihazları ekler</div>
                        </div>
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
