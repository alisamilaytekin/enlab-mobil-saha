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
            // Eğer bağlı olduğu 5.x Gözle Kontrol maddesinde veya 6.1 Linye tablosunda zaten kusur seçiliyse,
            // Bölüm 7'ye aynı kusur cümlesini ikinci kez (mükerrer) ekleme!
            const linkedVisual = getElectrical22VisualDetailNotes(rule, fd);
            if (linkedVisual) return;
            if (rule.isRcdRule && evaluateElectrical22RuleStatus(rule, fd) === 'Uygunsuz') return;
            lines.push(`• [2.2 Tespit Edilen Bilgiler - ${rule.shortLabel}]: Uygunsuz (${rule.defectText})`);
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

const ELEC_21_GUIDS = {
    NETWORK_TYPE: '26ee591d-05ba-4a47-857d-e40120d312ee',
    GRID_VOLTAGE: 'ac5e5f99-6517-4c09-b8c3-2c38a8f0f1e8',
    HAS_PROJECT: '03facbae-a3ef-4403-88db-2c86da421539',
    HAS_SINGLE_LINE: 'f30211b6-9dcd-4c8d-9fad-5f45c6bb436a',
    GROUNDER_TYPE: '4f035efc-81b9-4568-9ee9-8a3c0daa0bd6',
    LAST_CONTROL_DATE: '8613340f-35df-4930-a2d2-daf45e08997f',
    EXTRA_ELECTRODE: '045b232d-d221-4dc6-b104-6fd9fa994c8d',
    SUPPLY_VOLTAGE_KV: '480aca54-3a02-45d6-88e5-cbaa2353cfc6',
    MAIN_BREAKER_TYPE: '1203adb0-74e0-4260-aaec-f619ef290bef',
    MAIN_BREAKER_IN: '98e0d12e-16c9-45fe-9f7e-81e3fecbcafb',
    MAIN_RCD_IN: 'c38c11fa-81c8-4120-bfba-d6f77c684bd7',
    MAIN_RCD_TRIP_MA: '3c9d406a-3a6e-47d8-97d2-3f44034a74c1',
    MAIN_RCD_TRIP_MS: '622a425b-1739-4a70-94d5-433b9af7051c'
};

const WorkOrderRcdMemoryManager = {
    STORAGE_KEY: 'enlab_wo_rcd_memory_v1',
    loadAll() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') return parsed;
            }
        } catch (e) {}
        return {};
    },
    saveAll(map) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(map || {}));
        } catch (e) {}
    },
    get(workOrderId) {
        const woKey = String(workOrderId || '').trim();
        if (!woKey) return { tripCurrentMa: '', tripTimeMs: '', historyCurrentMa: [], historyTimeMs: [], byInspection: {} };
        const all = this.loadAll();
        let entry = all[woKey];
        if (!entry && window.OfflineDB?.state?.workOrders) {
            const wo = window.OfflineDB.state.workOrders.find(w => String(w.id) === woKey);
            if (wo && wo.rcd_memory) entry = wo.rcd_memory;
        }
        if (!entry || typeof entry !== 'object') {
            return { tripCurrentMa: '', tripTimeMs: '', historyCurrentMa: [], historyTimeMs: [], byInspection: {} };
        }
        return {
            tripCurrentMa: String(entry.tripCurrentMa || ''),
            tripTimeMs: String(entry.tripTimeMs || ''),
            historyCurrentMa: Array.isArray(entry.historyCurrentMa) ? entry.historyCurrentMa : [],
            historyTimeMs: Array.isArray(entry.historyTimeMs) ? entry.historyTimeMs : [],
            byInspection: (entry.byInspection && typeof entry.byInspection === 'object') ? entry.byInspection : {},
            updatedAt: entry.updatedAt || ''
        };
    },
    record(workOrderId, field, value, inspMeta = null) {
        const woKey = String(workOrderId || '').trim();
        if (!woKey) return;
        const cleanVal = String(value ?? '').trim();
        const all = this.loadAll();
        const cur = this.get(woKey);
        const nowIso = new Date().toISOString();

        if (field === 'tripCurrentMa') {
            cur.tripCurrentMa = cleanVal;
            if (cleanVal) {
                cur.historyCurrentMa = [cleanVal, ...cur.historyCurrentMa.filter(x => x !== cleanVal)].slice(0, 12);
            }
        } else if (field === 'tripTimeMs') {
            cur.tripTimeMs = cleanVal;
            if (cleanVal) {
                cur.historyTimeMs = [cleanVal, ...cur.historyTimeMs.filter(x => x !== cleanVal)].slice(0, 12);
            }
        }

        const inspId = inspMeta?.id ? String(inspMeta.id) : '';
        if (inspId) {
            const prevRec = cur.byInspection[inspId] || {};
            cur.byInspection[inspId] = {
                equipmentName: inspMeta.equipment_name || prevRec.equipmentName || '',
                tripCurrentMa: field === 'tripCurrentMa' ? cleanVal : (prevRec.tripCurrentMa || ''),
                tripTimeMs: field === 'tripTimeMs' ? cleanVal : (prevRec.tripTimeMs || ''),
                updatedAt: nowIso
            };
        }

        cur.updatedAt = nowIso;
        all[woKey] = cur;
        this.saveAll(all);

        try {
            if (window.OfflineDB?.state?.workOrders) {
                const wo = window.OfflineDB.state.workOrders.find(w => String(w.id) === woKey);
                if (wo) {
                    wo.rcd_memory = cur;
                    if (typeof window.OfflineDB.save === 'function') window.OfflineDB.save();
                }
            }
        } catch (e) {}
    }
};
window.WorkOrderRcdMemoryManager = WorkOrderRcdMemoryManager;

function onElectrical2201AnswerUpdated(qKey, value, isDirectInput = false) {
    const fd = AppState.currentFormData;
    if (!fd) return;
    const cleanGuid = String(qKey || '').replace(/^q_/, '');

    if (getElectrical21Guids().includes(cleanGuid)) {
        fd._details21Initialized = true;
        if (cleanGuid === ELEC_21_GUIDS.MAIN_RCD_TRIP_MA || cleanGuid === ELEC_21_GUIDS.MAIN_RCD_TRIP_MS) {
            const insp = AppState.currentInspection;
            const woId = insp?.work_order_id || AppState.currentWorkOrder?.id;
            if (woId) {
                WorkOrderRcdMemoryManager.record(
                    woId,
                    cleanGuid === ELEC_21_GUIDS.MAIN_RCD_TRIP_MA ? 'tripCurrentMa' : 'tripTimeMs',
                    value,
                    insp
                );
            }
        }
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

function ensureElectrical2201SmartRadioAndPanelDefaults() {
    const insp = AppState.currentInspection;
    const fd = AppState.currentFormData;
    if (!insp || !fd || String(insp.template_id) !== '2201') return;
    if (!fd.answers || typeof fd.answers !== 'object') fd.answers = {};
    let changed = false;

    // 1. Pano Adı (5.1 ve 6.1) üstteki Ekipman Adı ile otomatik senkron olsun (3 kez sorulmasın, PDF'te boş çıkmasın)
    const eqName = String(insp.equipment_name || fd.companyInfo?.equipmentName || '').trim();
    const serial = String(fd.companyInfo?.serialCode || insp.serial_no || '').trim();
    if (eqName) {
        const q51 = 'q_4806ef6b-a811-4c26-b76f-6467779e5499';
        const q61 = 'q_3e5cfce4-bb64-4339-b086-f0947d8dbccb';
        if (!String(fd.answers[q51] || '').trim()) {
            fd.answers[q51] = eqName;
            changed = true;
        }
        if (!String(fd.answers[q61] || '').trim()) {
            fd.answers[q61] = serial ? `${eqName} (${serial})` : eqName;
            changed = true;
        }
    }

    // 2. Resmi PDF'te boş kalmaması gereken temel radyo butonları için akıllı varsayılanlar (ilk açılışta)
    if (!fd._smartRadiosInitialized) {
        const defaultRadioMap = {
            'q_18337b76-c549-4c86-9149-0f7d093efc27': 'Periyodik Kontrol', // Kontrol nedeni
            'q_03facbae-a3ef-4403-88db-2c86da421539': 'Var',               // Tesise ait proje var mı?
            'q_f30211b6-9dcd-4c8d-9fad-5f45c6bb436a': 'Var',               // Tek hat şeması var mı?
            'q_a1206df8-1147-4f44-8b29-b23005235b6b': 'AA(3 faz-4 tel)',   // Faz iletkenlerinin sayısı ve tipi
            'q_ac5e5f99-6517-4c09-b8c3-2c38a8f0f1e8': '230/400',           // Şebeke gerilimi (V)
            'q_4cb81e03-b7c1-4f66-b728-a98fc76cd0ef': '50',                // Nominal frekans, f (Hz)
            'q_b5b1fe8c-0b83-4727-8d53-3064990806ce': 'Yok',               // Tesisatta kapsamlı değişiklik var mı?(>%20)
            'q_ddb49ead-c7b4-42b9-b449-0cc456ce6fbc': 'Hayır',             // DKD/SPD kullanılmış mı?
            'q_ac00a719-779a-4eed-a17c-153d5d1c2342': 'Var',               // Bir önceki periyodik kontrol etiketi var mı?
            'q_97839257-ba72-480f-8e3f-b044a1b0a8f1': 'Çevrim empedansı',  // Ölçüm ve doğrulama metodu
            'q_dc17ec9f-90bc-442a-a61b-729215d36fa0': 'Mevcut Değil'       // Aşırı gerilim koruma (DKD) tipi
        };
        Object.keys(defaultRadioMap).forEach(k => {
            if (!String(fd.answers[k] || '').trim()) {
                fd.answers[k] = defaultRadioMap[k];
                changed = true;
            }
        });
        fd._smartRadiosInitialized = true;
    }

    // 3. Son kontrol tarihi ve İlave topraklama elektrotu detayları varsayılan olarak "-" gelsin (değiştirilebilir)
    if (!fd._smart21DashDefaultsInitialized) {
        const qLastCtrl = `q_${ELEC_21_GUIDS.LAST_CONTROL_DATE}`;
        const qExtraEl = `q_${ELEC_21_GUIDS.EXTRA_ELECTRODE}`;
        if (!String(fd.answers[qLastCtrl] || '').trim()) {
            fd.answers[qLastCtrl] = '-';
            changed = true;
        }
        if (!String(fd.answers[qExtraEl] || '').trim()) {
            fd.answers[qExtraEl] = '-';
            changed = true;
        }
        fd._smart21DashDefaultsInitialized = true;
    }

    // 4. İş emri bazlı Ana RCD açma akımı (mA) ve açma zamanı (ms) hafıza senkronizasyonu
    const woId = insp.work_order_id || AppState.currentWorkOrder?.id;
    if (woId && !fd._woRcdMemorySynced) {
        const qRcdMa = `q_${ELEC_21_GUIDS.MAIN_RCD_TRIP_MA}`;
        const qRcdMs = `q_${ELEC_21_GUIDS.MAIN_RCD_TRIP_MS}`;
        const curMa = String(fd.answers[qRcdMa] || '').trim();
        const curMs = String(fd.answers[qRcdMs] || '').trim();
        const woMem = WorkOrderRcdMemoryManager.get(woId);

        if (curMa) {
            WorkOrderRcdMemoryManager.record(woId, 'tripCurrentMa', curMa, insp);
        } else if (woMem.tripCurrentMa) {
            fd.answers[qRcdMa] = woMem.tripCurrentMa;
            changed = true;
        }

        if (curMs) {
            WorkOrderRcdMemoryManager.record(woId, 'tripTimeMs', curMs, insp);
        } else if (woMem.tripTimeMs) {
            fd.answers[qRcdMs] = woMem.tripTimeMs;
            changed = true;
        }
        fd._woRcdMemorySynced = true;
    }

    if (changed && typeof triggerAutoSave === 'function') {
        triggerAutoSave();
    }
}

function applyElectrical2201StandardFieldDefaults() {
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.answers) fd.answers = {};
    const stdMap = {
        'q_26ee591d-05ba-4a47-857d-e40120d312ee': 'TN-S',
        'q_ac5e5f99-6517-4c09-b8c3-2c38a8f0f1e8': '230/400',
        'q_03facbae-a3ef-4403-88db-2c86da421539': 'Var',
        'q_f30211b6-9dcd-4c8d-9fad-5f45c6bb436a': 'Var',
        'q_18337b76-c549-4c86-9149-0f7d093efc27': 'Periyodik Kontrol',
        'q_4f035efc-81b9-4568-9ee9-8a3c0daa0bd6': 'Temel',
        'q_06cdc2dc-0830-49c4-9b36-a6d26c7344cc': 'Endüstri',
        'q_04faae5e-066a-4da0-a3a3-f8376a0f7a71': 'Elektrik Dağıtım ve Kuvvet/Aydınlatma Beslemesi',
        'q_a1206df8-1147-4f44-8b29-b23005235b6b': 'AA(3 faz-4 tel)',
        'q_480aca54-3a02-45d6-88e5-cbaa2353cfc6': '0,4',
        'q_4cb81e03-b7c1-4f66-b728-a98fc76cd0ef': '50',
        'q_b5b1fe8c-0b83-4727-8d53-3064990806ce': 'Yok',
        'q_ac00a719-779a-4eed-a17c-153d5d1c2342': 'Var',
        'q_97839257-ba72-480f-8e3f-b044a1b0a8f1': 'Çevrim empedansı',
        'q_dc17ec9f-90bc-442a-a61b-729215d36fa0': 'Mevcut Değil'
    };
    let count = 0;
    Object.keys(stdMap).forEach(k => {
        if (!String(fd.answers[k] || '').trim()) {
            fd.answers[k] = stdMap[k];
            count++;
        }
    });
    fd._details21Initialized = true;
    fd._smartRadiosInitialized = true;
    fd._standard21Applied = true;
    syncElectrical2201Section22FromTriggers(null, false);
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(count > 0 ? `${count} adet boş tesisat alanı standart saha değerleriyle dolduruldu!` : 'Tüm standart alanlar zaten dolu.');
}
window.applyElectrical2201StandardFieldDefaults = applyElectrical2201StandardFieldDefaults;

function toggleElectrical21AdvancedDrawer() {
    AppState.showElectrical21Advanced = !AppState.showElectrical21Advanced;
    paintInspectionEditorUI();
}
window.toggleElectrical21AdvancedDrawer = toggleElectrical21AdvancedDrawer;

function toggleThermalManualDetail() {
    AppState.showThermalManualDetail = !AppState.showThermalManualDetail;
    paintInspectionEditorUI();
}
window.toggleThermalManualDetail = toggleThermalManualDetail;

function renderElectrical2201Editor() {

    const tpl = AppState.electricalTemplate;

    if (!tpl || !tpl.areas) return '<div class="p-4 bg-white rounded-xl text-xs">Şablon yüklenemedi.</div>';



    ensureCompanyInfo();

    ensureMeasuringDevices();

    ensureThermalCameraDevice();

    ensureElectrical2201DetailsFromPrevious();

    ensureElectrical2201VisualChecksDefaults();

    ensureElectrical2201Section61Defaults();

    ensureElectrical2201SmartRadioAndPanelDefaults();

    ensureElectrical2201Section22Defaults();



    const fd = AppState.currentFormData;

    const areas = tpl.areas.filter(a => a.topics && a.topics.length > 0);



    if (AppState.activeAreaIndex === undefined || AppState.activeAreaIndex === 1) AppState.activeAreaIndex = 0;

    const activeIdx = AppState.showAllAreas ? -1 : AppState.activeAreaIndex;

    // Gözle kontrol uygunsuzluk sayısı
    let visualDefectCount = 0;
    (areas[2]?.topics || []).forEach(t => {
        (t.questions || []).forEach(q => {
            const v = fd.answers?.[`q_${q.guid}`];
            if (v === 'Uygun Değil' || v === 'Kısmen Uygun') visualDefectCount++;
        });
    });

    const linyeCount = (fd.tableRows?.topic_3_3 || []).filter(r => r && Object.values(r).some(v => String(v || '').trim())).length;
    const photoCount = (fd.photos || []).length;

    // 5 Net, Mantıksal Sıralı Adım + Tümü
    const steps = [
        { label: '1. Genel & Cihaz', short: '1. Genel', id: 0, icon: 'fa-building-circle-check' },
        { label: `2. Gözle Kontrol${visualDefectCount > 0 ? ` (${visualDefectCount}✕)` : ''}`, short: '2. Gözle', id: 2, icon: 'fa-eye', hasDefect: visualDefectCount > 0 },
        { label: `3. Ölçüm & Test${linyeCount > 0 ? ` (${linyeCount})` : ''}`, short: '3. Ölçüm', id: 3, icon: 'fa-bolt-lightning' },
        { label: `4. Fotoğraf (${photoCount})`, short: `4. Foto (${photoCount})`, id: 4, icon: 'fa-camera' },
        { label: '5. Kusur & Sonuç', short: '5. Sonuç', id: 5, icon: 'fa-file-signature', isBad: fd.overallResult === 'UYGUN DEĞİL' }
    ];



    const tabsHtml = `
        <div class="sticky top-0 z-20 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
            <div class="grid grid-cols-5 gap-1">
                ${steps.map(s => {
                    const isActive = activeIdx === s.id;
                    const defectStyle = s.hasDefect && !isActive ? 'bg-rose-50 text-rose-700 border border-rose-200' : '';
                    const badResultStyle = s.isBad && !isActive ? 'bg-rose-50 text-rose-800 border border-rose-200' : '';
                    return `
                        <button type="button" onclick="AppState.showAllAreas = false; AppState.activeAreaIndex = ${s.id}; paintInspectionEditorUI(); document.getElementById('pageContent')?.scrollTo({top: 0, behavior: 'smooth'});"
                            class="min-h-[44px] py-1.5 px-1 rounded-xl text-[11px] font-bold text-center truncate transition flex flex-col items-center justify-center gap-1 ${
                                isActive
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : (defectStyle || badResultStyle || 'bg-slate-100 text-slate-700 hover:bg-slate-200/80')
                            }">
                            <i class="fa-solid ${s.icon} text-xs ${isActive ? 'text-amber-400' : (s.hasDefect || s.isBad ? 'text-rose-600' : 'text-slate-500')}"></i>
                            <span class="truncate w-full leading-none">${s.short}</span>
                        </button>
                    `;
                }).join('')}
            </div>
            <div class="flex items-center justify-between px-1 pt-0.5 text-[11px]">
                <span class="font-bold text-slate-700 truncate flex items-center gap-1.5">
                    ${activeIdx === -1 ? '<i class="fa-solid fa-layer-group text-sky-600"></i><span>Tüm Bölümler (1-11)</span>' : escapeHtml(steps.find(s => s.id === activeIdx)?.label || '')}
                </span>
                <button type="button" onclick="AppState.showAllAreas = ${activeIdx === -1 ? 'false' : 'true'}; paintInspectionEditorUI();"
                    class="px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${activeIdx === -1 ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}">
                    ${activeIdx === -1 ? 'Adım Görünümü' : 'Tüm Bölümler (1-11)'}
                </button>
            </div>
        </div>
    `;



    const showTab0 = (activeIdx === 0 || activeIdx === -1);

    const showTab2 = (activeIdx === 2 || activeIdx === -1);

    const showTab3 = (activeIdx === 3 || activeIdx === -1);

    const showTab4 = (activeIdx === 4 || activeIdx === -1);

    const showTab5 = (activeIdx === 5 || activeIdx === -1);



    const section1Html = showTab0 ? renderSharedCompanyInfoSection() : '';

    const area0Html = (showTab0 && areas[0]) ? renderElectrical2201AreaBlock(areas[0], '2') : '';

    const area1Html = (showTab0 && areas[1]) ? renderElectrical2201AreaBlock(areas[1], '3') : '';

    const section4Html = showTab0 ? renderSharedMeasuringDevicesSection('4. Ölçüm Aletleri Bilgileri') : '';

    const area2Html = (showTab2 && areas[2]) ? renderElectrical2201AreaBlock(areas[2], '5') : '';

    const area3Html = (showTab3 && areas[3]) ? renderElectrical2201AreaBlock(areas[3], '6') : '';

    const photosHtml = showTab4 ? renderPhotoSectionUI() : '';

    const evaluationHtml = showTab5 ? renderEvaluationAndFooterSection() : '';

    // Alt Adım Geçiş Çubuğu (Kullanıcının tekrar en üste kaydırmasına gerek kalmaz)
    let stepNavFooterHtml = '';
    if (activeIdx !== -1) {
        const curStepPos = steps.findIndex(s => s.id === activeIdx);
        const prevStep = curStepPos > 0 ? steps[curStepPos - 1] : null;
        const nextStep = (curStepPos >= 0 && curStepPos < steps.length - 1) ? steps[curStepPos + 1] : null;
        stepNavFooterHtml = `
            <div class="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
                ${prevStep ? `
                    <button type="button" onclick="AppState.showAllAreas = false; AppState.activeAreaIndex = ${prevStep.id}; paintInspectionEditorUI(); document.getElementById('pageContent')?.scrollTo({top: 0, behavior: 'smooth'});"
                        class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition">
                        <i class="fa-solid fa-arrow-left text-[10px]"></i>
                        <span>${prevStep.short}</span>
                    </button>
                ` : `<div></div>`}
                ${nextStep ? `
                    <button type="button" onclick="AppState.showAllAreas = false; AppState.activeAreaIndex = ${nextStep.id}; paintInspectionEditorUI(); document.getElementById('pageContent')?.scrollTo({top: 0, behavior: 'smooth'});"
                        class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-400 font-black text-xs flex items-center gap-1.5 shadow-2xs transition">
                        <span>Sonraki: ${nextStep.short}</span>
                        <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </button>
                ` : `
                    <button type="button" onclick="printOfficialReport()"
                        class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs transition">
                        <i class="fa-solid fa-file-pdf"></i>
                        <span>PDF Önizle &amp; İndir</span>
                    </button>
                `}
            </div>
        `;
    }



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

            ${stepNavFooterHtml}

        </div>

    `;

}



function renderElectrical2201AreaBlock(area, secNum) {

    return `

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">

            <div class="px-3.5 py-2.5 bg-slate-800 text-white font-bold text-xs flex items-center justify-between gap-2 flex-wrap">

                <span class="truncate">${secNum}. ${area.name}</span>

                ${area.index === 0 ? `
                    <button type="button" onclick="applyElectrical2201StandardFieldDefaults()"
                        class="px-2.5 py-1 active:scale-95 font-bold rounded-lg text-[11px] shrink-0 flex items-center gap-1 shadow-2xs transition ${
                            AppState.currentFormData?._standard21Applied
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        }"
                        title="Boş kalan standart şebeke, frekans, proje ve kontrol nedeni alanlarını tek tıkla doldur">
                        <i class="fa-solid ${AppState.currentFormData?._standard21Applied ? 'fa-check' : 'fa-bolt'}"></i>
                        <span>${AppState.currentFormData?._standard21Applied ? 'Standart Değerler Dolu' : 'Standart Değerleri Doldur'}</span>
                    </button>
                ` : ''}

                ${area.index === 2 ? `<button onclick="markAllVisualChecksSuitable(false)" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-[11px] shrink-0">Tümünü Uygun Yap (✓)</button>` : ''}

            </div>

            ${area.index === 2 ? `

                <div class="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">

                    <div class="relative flex-1 min-w-[200px]">

                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>

                        <input type="text" id="visualCheckSearchInput" value="${escapeHtml(AppState.visualSearchQuery || '')}"

                            oninput="AppState.visualSearchQuery=this.value; filterVisualCheckQuestionsLive(this.value);"

                            placeholder="Maddelerde ara (Örn: kapak, kablo, etiket, yangın, zemin)..."

                            class="w-full h-9 bg-white border border-slate-300 rounded-xl pl-8 pr-3 text-xs font-medium focus:border-sky-500 focus:outline-none">

                    </div>

                    <div class="text-[10px] font-bold text-slate-500 px-1">
                        <span class="text-emerald-700">✓ Uygun</span> · <span class="text-rose-700">✕ Kusur</span> · <span class="text-slate-600">N Uyg.Yok</span> · <span class="text-amber-700">G Görülemedi</span>
                    </div>

                </div>

            ` : ''}

            <div class="p-3 space-y-3">

                ${area.topics.map(topic => renderElectrical2201Topic(area, topic, secNum)).join('')}

            </div>

        </div>

    `;

}



function renderElectrical2201Topic(area, topic, secNum) {

    // 5.1 Pano Adı ve 6.2 Pano Adı alanları üstteki sarı Ekipman Adı kutusuyla otomatik senkron olduğundan ekranda tekrar gösterip kafa karıştırma
    if ((area.index === 2 && topic.index === 0) || (area.index === 3 && topic.index === 1)) {
        return '';
    }

    // Resmi Bakanlık PDF'i ile birebir uyumlu numaralandırma:
    // Bölüm 6: 6.0 Ölçüm Metodu, 6.1 Pano Genel Ölçümleri, 6.1 Linye Tablosu, 6.2 Potansiyel Dengeleme, 6.3 Zemin İzolasyonu
    let subNum = `${secNum}.${topic.index + 1}`;
    if (area.index === 3) {
        if (topic.index === 0) subNum = '6.0';
        else if (topic.index === 2) subNum = '6.1';
        else if (topic.index === 3) subNum = '6.1';
        else if (topic.index === 4) subNum = '6.2';
        else if (topic.index === 5) subNum = '6.3';
    }

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

            const isDefect = (val === 'Uygun Değil' || val === 'Kısmen Uygun');
            const isOk = (val === 'Uygun');

            const selectedDefect = AppState.currentFormData.itemDefectSelections && AppState.currentFormData.itemDefectSelections[qKey]?.sentence;

            const safeQTitle = escapeForJs(q.question);

            // Tek dokunuşlu 4'lü buton grubu (Açılır menü yerine anında yeşil seçim!)
            const quickBtns = [
                { v: 'Uygun', lbl: '✓', title: 'Uygun', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' },
                { v: 'Uygun Değil', lbl: '✕', title: 'Uygun Değil (Kusur Seç)', activeCls: 'bg-rose-600 text-white border-rose-600 shadow-2xs' },
                { v: 'Uygulaması Yok', lbl: 'N', title: 'Uygulaması Yok', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' },
                { v: 'Görülemedi', lbl: 'G', title: 'Görülemedi', activeCls: 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs' }
            ].map(b => {
                const isSel = val === b.v;
                return `
                    <button type="button" onclick="handleAnswerChange('${qKey}', '${b.v}', '${safeQTitle}')"
                        title="${b.title}"
                        class="w-9 h-9 rounded-xl border text-xs font-black flex items-center justify-center transition active:scale-90 ${
                            isSel ? b.activeCls : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                        }">
                        ${b.lbl}
                    </button>
                `;
            }).join('');



            return `

                <div class="border-b border-slate-100 last:border-b-0 ${isDefect ? 'bg-rose-50/40' : isOk ? 'bg-emerald-50/25' : ''}">

                    <div class="p-2.5 flex items-center justify-between gap-2 text-xs">

                        <div class="min-w-0 flex-1 text-slate-800 leading-snug">

                            <strong class="text-slate-900 mr-1">${letters[qIdx] || (qIdx + 1)}.</strong>${q.question}

                        </div>

                        <div class="flex items-center gap-1 shrink-0">
                            ${quickBtns}
                        </div>

                    </div>

                    ${isDefect ? `

                        <div class="mx-2.5 mb-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">

                            <div class="flex items-start gap-1.5 min-w-0">

                                <i class="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 shrink-0 text-xs"></i>

                                <div class="min-w-0">

                                    <span class="font-medium text-slate-800 text-[11px] leading-snug block">${selectedDefect || 'Uygunsuzluk cümlesi seçilmedi'}</span>

                                </div>

                            </div>

                            <button type="button" onclick="openItemDefectPickerModal('${qKey}', '${safeQTitle}', 'answer')"

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

    const topicHeaderTitle = (area.index === 3 && topic.index === 3)
        ? '6.1. Linye Ölçüm ve Test Tablosu'
        : `${subNum}. ${topic.name}`;

    return `

        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">

            <div class="px-3 py-2 bg-slate-100 border-b border-slate-200 font-bold text-xs text-slate-800">

                ${topicHeaderTitle}

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
    const cleanTitle = qTitle.replace(/^Tespit edilen bilgiler\s*\([^)]*\)\s*-\s*/i, '').trim();
    const safeQTitle = escapeForJs(qTitle);

    let val = fd.answers[qKey];



    if (val === undefined) {

        val = '';

        fd.answers[qKey] = val;

    }



    if (q.type === 'YesNo') {

        const isDefect = (val === 'Uygun Değil' || val === 'Kısmen Uygun');
        const isOk = (val === 'Uygun');

        const selectedDefect = fd.itemDefectSelections && fd.itemDefectSelections[qKey]?.sentence;

        const quickBtns = [
            { v: 'Uygun', lbl: '✓', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' },
            { v: 'Uygun Değil', lbl: '✕', activeCls: 'bg-rose-600 text-white border-rose-600 shadow-2xs' },
            { v: 'Uygulaması Yok', lbl: 'N', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' },
            { v: 'Görülemedi', lbl: 'G', activeCls: 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs' }
        ].map(b => `
            <button type="button" onclick="handleAnswerChange('${qKey}', '${b.v}', '${safeQTitle}')"
                class="w-9 h-9 rounded-xl border text-xs font-black flex items-center justify-center transition active:scale-90 ${
                    val === b.v ? b.activeCls : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                }">${b.lbl}</button>
        `).join('');



        return `

            <div class="p-2.5 rounded-xl border ${isDefect ? 'border-rose-300 bg-rose-50/40' : isOk ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50'} flex flex-col justify-between gap-2 transition-all">

                <div class="flex items-center justify-between gap-2">

                    <label class="text-xs font-semibold text-slate-700 leading-snug">${cleanTitle}</label>

                    <div class="flex items-center gap-1 shrink-0">${quickBtns}</div>

                </div>

                ${isDefect ? `

                    <div class="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">

                        <div class="flex items-start gap-1.5 min-w-0">

                            <i class="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 shrink-0 text-xs"></i>

                            <div class="min-w-0">

                                <span class="font-medium text-slate-800 text-[11px] leading-snug block">${selectedDefect || 'Uygunsuzluk cümlesi seçilmedi'}</span>

                            </div>

                        </div>

                        <button type="button" onclick="openItemDefectPickerModal('${qKey}', '${safeQTitle}', 'answer')"

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

        const is22ProtectionItem = (areaIdx === 0 && topicIdx === 1 && q.options.includes('Uygunsuz'));
        const is22Defect = (areaIdx === 0 && topicIdx === 1 && val === 'Uygunsuz');
        const isRedWhenYok = (q.guid === ELEC_21_GUIDS.HAS_PROJECT || q.guid === ELEC_21_GUIDS.HAS_SINGLE_LINE);
        const isDangerSelected = is22Defect || (isRedWhenYok && String(val || '').toLowerCase() === 'yok');
        const hasValidSelection = Boolean(val && !isDangerSelected);
        const cardCls = isDangerSelected
            ? 'border-rose-400 bg-rose-50/70'
            : hasValidSelection
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-200 bg-slate-50/40';

        // Özel 2 satırlı yerleşim: 2.1 Şebeke Tipi -> Üst satır: [TT] [TN-S], Alt satır sıkışık: [TN] [TN-CS] [TN-C] [IT]
        if (q.guid === ELEC_21_GUIDS.NETWORK_TYPE) {
            const topRow = ['TT', 'TN-S'];
            const bottomRow = ['TN', 'TN-CS', 'TN-C', 'IT'];
            const renderNetBtn = (opt, extraCls) => {
                const isSel = String(val || '').toLowerCase() === String(opt).toLowerCase();
                return `
                    <button type="button" onclick="handleAnswerChange('${qKey}', '${escapeForJs(opt)}', '${safeQTitle}')"
                        class="rounded-lg border font-bold text-center whitespace-nowrap transition active:scale-95 ${extraCls} ${
                            isSel
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }">
                        ${escapeHtml(opt)}
                    </button>
                `;
            };
            return `
                <div class="p-2.5 rounded-lg border ${cardCls} flex flex-col justify-between gap-1.5 transition-colors">
                    <label class="block text-[11px] font-bold text-slate-700 leading-snug">${cleanTitle}</label>
                    <div class="space-y-1.5">
                        <div class="grid grid-cols-2 gap-1.5">
                            ${topRow.map(opt => renderNetBtn(opt, 'py-2 px-2 text-xs')).join('')}
                        </div>
                        <div class="grid grid-cols-4 gap-1">
                            ${bottomRow.map(opt => renderNetBtn(opt, 'py-1 px-1 text-[10px]')).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        // Özel 2 satırlı yerleşim: 2.1 Topraklayıcı Tipi -> Üst satır: [Temel] [Yüzeysel], Alt satır sıkışık: [Ring] [Derin] [Belirlenemedi]
        if (q.guid === ELEC_21_GUIDS.GROUNDER_TYPE) {
            const topRow = ['Temel', 'Yüzeysel'];
            const bottomRow = [
                { opt: 'Ring', flexCls: 'flex-1 min-w-0' },
                { opt: 'Derin', flexCls: 'flex-1 min-w-0' },
                { opt: 'Belirlenemedi', flexCls: 'flex-[1.85] min-w-0' }
            ];
            const renderGndBtn = (opt, extraCls) => {
                const isSel = String(val || '').toLowerCase() === String(opt).toLowerCase();
                return `
                    <button type="button" onclick="handleAnswerChange('${qKey}', '${escapeForJs(opt)}', '${safeQTitle}')"
                        class="rounded-lg border font-bold text-center whitespace-nowrap transition active:scale-95 ${extraCls} ${
                            isSel
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }">
                        ${escapeHtml(opt)}
                    </button>
                `;
            };
            return `
                <div class="p-2.5 rounded-lg border ${cardCls} flex flex-col justify-between gap-1.5 transition-colors">
                    <label class="block text-[11px] font-bold text-slate-700 leading-snug">${cleanTitle}</label>
                    <div class="space-y-1.5">
                        <div class="grid grid-cols-2 gap-1.5">
                            ${topRow.map(opt => renderGndBtn(opt, 'py-2 px-2 text-xs')).join('')}
                        </div>
                        <div class="flex items-center gap-1">
                            ${bottomRow.map(item => renderGndBtn(item.opt, `${item.flexCls} py-1.5 px-1 text-[10px]`)).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        // 2.2 Doğrudan dokunmaya karşı koruma önlemleri için sade 3'lü buton: [Var] [Yok] [Uygunsuz]
        const pillOptions = is22ProtectionItem ? ['Var', 'Yok', 'Uygunsuz'] : q.options;

        // Tüm çoktan seçmeli soruları TEK DOKUNUŞLU PILL BUTON yap!
        if (pillOptions.length <= 8) {
            const pillsHtml = pillOptions.map(opt => {
                const isSel = (String(val || '').toLowerCase() === String(opt || '').toLowerCase())
                    || (is22ProtectionItem && opt === 'Var' && val === 'Uygun');
                const isOptRed = (opt === 'Uygunsuz' || opt === 'Uygun Değil')
                    || (isRedWhenYok && String(opt || '').toLowerCase() === 'yok');
                const activeCls = isOptRed
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-emerald-600 text-white border-emerald-600 shadow-2xs';
                return `
                    <button type="button" onclick="handleAnswerChange('${qKey}', '${escapeForJs(opt)}', '${safeQTitle}')"
                        class="flex-1 min-w-[54px] py-1.5 px-2 rounded-lg border text-[11px] font-bold text-center transition active:scale-95 ${
                            isSel ? activeCls : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }">
                        ${escapeHtml(opt)}
                    </button>
                `;
            }).join('');

            return `
                <div class="p-2.5 rounded-lg border ${cardCls} flex flex-col justify-between gap-1.5 transition-colors">
                    <label class="block text-[11px] font-bold text-slate-700 leading-snug">${cleanTitle}</label>
                    <div class="flex flex-wrap gap-1">
                        ${pillsHtml}
                    </div>
                </div>
            `;
        }

        const hasValInOpts = !val || q.options.includes(val);
        const optsList = hasValInOpts ? q.options : [...q.options, val];
        const opts = optsList.map(o => `<option value="${escapeHtml(o)}" ${val === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
        const selCls = is22Defect
            ? 'border-rose-400 bg-white text-rose-700 font-bold'
            : 'border-slate-300 bg-white text-slate-900 font-semibold';

        return `

            <div class="p-2.5 rounded-lg border ${cardCls} flex flex-col justify-between transition-colors">

                <label class="block text-[11px] font-bold text-slate-700 mb-1 leading-snug">${cleanTitle}</label>

                <select onchange="handleAnswerChange('${qKey}', this.value, '${safeQTitle}')"

                    class="w-full border rounded-lg px-2.5 py-1.5 text-xs ${selCls}">

                    <option value="">Seçiniz...</option>

                    ${opts}

                </select>

            </div>

        `;

    }

    // 2.1 Seçilebilir Hızlı Seçenekli Metin Alanları (Gerilimler, Ana Kesici Tip/Akım, RCD Toroid, İş Emri Hafızalı RCD Açma Akım/Zamanı)
    const renderSelectableTextCard = (chips, opts = {}) => {
        const hasVal = Boolean(String(val || '').trim());
        const cardBorder = hasVal ? 'border-emerald-300 bg-emerald-50/25' : 'border-slate-200 bg-slate-50/40';
        let chipsBlockHtml = '';
        if (opts.twoTier && Array.isArray(opts.topRow) && Array.isArray(opts.bottomRow)) {
            const renderTierBtn = (opt, extraCls) => {
                const isSel = String(val || '').trim().toLowerCase() === String(opt).trim().toLowerCase();
                return `
                    <button type="button" onclick="handleAnswerChange('${qKey}', '${escapeForJs(opt)}', '${safeQTitle}')"
                        class="rounded-lg border font-bold text-center whitespace-nowrap transition active:scale-95 ${extraCls} ${
                            isSel
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }">
                        ${escapeHtml(opt)}
                    </button>
                `;
            };
            chipsBlockHtml = `
                <div class="space-y-1">
                    <div class="grid ${opts.topRow.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1">
                        ${opts.topRow.map(opt => renderTierBtn(opt, 'py-1.5 px-2 text-[11px]')).join('')}
                    </div>
                    <div class="grid grid-cols-${opts.bottomRow.length} gap-1">
                        ${opts.bottomRow.map(opt => renderTierBtn(opt, 'py-1.5 px-1 text-[10px]')).join('')}
                    </div>
                </div>
            `;
        } else if (Array.isArray(chips) && chips.length > 0) {
            chipsBlockHtml = `
                <div class="flex flex-wrap gap-1">
                    ${chips.map(opt => {
                        const isSel = String(val || '').trim().toLowerCase() === String(opt).trim().toLowerCase();
                        return `
                            <button type="button" onclick="handleAnswerChange('${qKey}', '${escapeForJs(opt)}', '${safeQTitle}')"
                                class="px-2 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap transition active:scale-95 ${
                                    isSel
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                }">
                                ${escapeHtml(opt)}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }

        return `
            <div class="p-2.5 rounded-lg border ${cardBorder} flex flex-col justify-between gap-1.5 transition-colors">
                <div class="flex items-center justify-between gap-1.5">
                    <label class="block text-[11px] font-bold text-slate-700 leading-snug">${cleanTitle}</label>
                    ${opts.badgeHtml || ''}
                </div>
                ${chipsBlockHtml}
                <input type="text" data-qkey="${qKey}" value="${String(val || '').replace(/"/g, '&quot;')}"
                    oninput="handleAnswerInput('${qKey}', this.value)"
                    placeholder="${escapeHtml(opts.placeholder || 'Seçin veya yazın...')}"
                    class="w-full border border-slate-300 bg-white rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-sky-500 focus:outline-none">
            </div>
        `;
    };

    if (q.guid === ELEC_21_GUIDS.GRID_VOLTAGE) {
        return renderSelectableTextCard(['230/400', '400', '230', '400/690'], { placeholder: 'Örn: 230/400' });
    }

    if (q.guid === ELEC_21_GUIDS.SUPPLY_VOLTAGE_KV) {
        return renderSelectableTextCard(['0,4/0,23', '0,4', '0,23', '15,8', '31,5', '34,5'], { placeholder: 'Örn: 0,4/0,23' });
    }

    if (q.guid === ELEC_21_GUIDS.MAIN_BREAKER_TYPE) {
        return renderSelectableTextCard(null, {
            twoTier: true,
            topRow: ['Termik-Manyetik Şalter'],
            bottomRow: ['C Tipi Sigorta', 'D Tipi Sigorta', 'B Tipi Sigorta'],
            placeholder: 'Tip seçin veya yazın...'
        });
    }

    if (q.guid === ELEC_21_GUIDS.MAIN_BREAKER_IN) {
        return renderSelectableTextCard(['32', '40', '63', '80', '100', '125', '160', '250', '400', '630'], { placeholder: 'Nominal akım (A)...' });
    }

    if (q.guid === ELEC_21_GUIDS.MAIN_RCD_IN) {
        return renderSelectableTextCard(['Toroid', '40', '63', '100', '125', '-'], { placeholder: 'Örn: Toroid veya 63' });
    }

    if (q.guid === ELEC_21_GUIDS.MAIN_RCD_TRIP_MA) {
        const woId = AppState.currentInspection?.work_order_id || AppState.currentWorkOrder?.id;
        const woMem = WorkOrderRcdMemoryManager.get(woId);
        const mergedMa = [...new Set([...(woMem.historyCurrentMa || []), '30', '300', '500', '1000'])];
        const badgeHtml = `<span class="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 text-[9px] font-bold shrink-0" title="Bu iş emri için hafızada saklanır"><i class="fa-solid fa-bookmark mr-0.5"></i>İş Emri Hafızası</span>`;
        return renderSelectableTextCard(mergedMa, { badgeHtml, placeholder: 'Açma akımı (mA)...' });
    }

    if (q.guid === ELEC_21_GUIDS.MAIN_RCD_TRIP_MS) {
        const woId = AppState.currentInspection?.work_order_id || AppState.currentWorkOrder?.id;
        const woMem = WorkOrderRcdMemoryManager.get(woId);
        const mergedMs = [...new Set([...(woMem.historyTimeMs || []), '25', '40', '150', '300'])];
        const badgeHtml = `<span class="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 text-[9px] font-bold shrink-0" title="Bu iş emri için hafızada saklanır"><i class="fa-solid fa-bookmark mr-0.5"></i>İş Emri Hafızası</span>`;
        return renderSelectableTextCard(mergedMs, { badgeHtml, placeholder: 'Açma zamanı (ms)...' });
    }



    const isVFF = q.guid === ELEC_61_GUIDS.V_FF;
    const is61XField = ELECTRICAL_61_X_DEFECTS.some(d => d.guid === q.guid);
    const isMarkedX = is61XField && isElectricalMarkedX(val);
    const xInputCls = isMarkedX ? 'border-rose-400 bg-rose-50/50 text-rose-700 font-bold' : 'border-slate-300 bg-white font-medium';

    return `

        <div class="p-2.5 rounded-lg border ${isMarkedX ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-slate-50/40'} flex flex-col justify-between">

            <div class="flex items-center justify-between gap-2 mb-1">
                <label class="block text-[11px] font-bold text-slate-700 leading-snug">${cleanTitle}</label>
                ${isVFF ? `<button type="button" onclick="randomizeElectrical61Voltage()" class="px-2 py-0.5 rounded-md bg-sky-100 hover:bg-sky-200 active:scale-95 text-sky-800 text-[10px] font-bold shrink-0 transition" title="393-397 V arası rastgele seç"><i class="fa-solid fa-shuffle mr-1"></i>393-397</button>` : ''}
            </div>

            <input type="text" data-qkey="${qKey}" value="${String(val || '').replace(/"/g, '&quot;')}"

                oninput="handleAnswerInput('${qKey}', this.value)"

                placeholder=""

                class="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:border-sky-500 focus:outline-none ${xInputCls}">

        </div>

    `;

}



// Short, compact abbreviations for Section 6.1 Linye Tablosu

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

        if (q.includes('Değerlendirme') || q.includes('Sonuç')) return 'Sonuç';

    }

    return q;

}

const STANDARD_CABLE_IZ_MAP = {
    '1,5': { pe: '1,5', iz: '19,5' },
    '1.5': { pe: '1,5', iz: '19,5' },
    '2,5': { pe: '2,5', iz: '27' },
    '2.5': { pe: '2,5', iz: '27' },
    '4':   { pe: '4',   iz: '36' },
    '6':   { pe: '6',   iz: '46' },
    '10':  { pe: '10',  iz: '63' },
    '16':  { pe: '16',  iz: '85' },
    '25':  { pe: '16',  iz: '112' },
    '35':  { pe: '16',  iz: '138' },
    '50':  { pe: '25',  iz: '168' },
    '70':  { pe: '35',  iz: '213' },
    '95':  { pe: '50',  iz: '258' },
    '120': { pe: '70',  iz: '299' }
};

const QUICK_LINYE_PRESETS = [
    { label: 'B10 (1,5mm²)', curve: 'B', poles: '1', inAmp: '10', icu: '6', phase: '1,5', npen: '1,5', pe: '1,5', ib: '8', iz: '19,5', rcdI: '30', rcdT: '25' },
    { label: 'B16 (2,5mm²)', curve: 'B', poles: '1', inAmp: '16', icu: '6', phase: '2,5', npen: '2,5', pe: '2,5', ib: '12', iz: '27', rcdI: '30', rcdT: '25' },
    { label: 'C16 (2,5mm²)', curve: 'C', poles: '1', inAmp: '16', icu: '6', phase: '2,5', npen: '2,5', pe: '2,5', ib: '12', iz: '27', rcdI: '30', rcdT: '25' },
    { label: 'C20 (4mm²)',   curve: 'C', poles: '1', inAmp: '20', icu: '6', phase: '4',   npen: '4',   pe: '4',   ib: '16', iz: '36', rcdI: '30', rcdT: '25' },
    { label: 'C25 (4mm²)',   curve: 'C', poles: '1', inAmp: '25', icu: '6', phase: '4',   npen: '4',   pe: '4',   ib: '20', iz: '36', rcdI: '30', rcdT: '25' },
    { label: 'C32 (6mm²)',   curve: 'C', poles: '1', inAmp: '32', icu: '6', phase: '6',   npen: '6',   pe: '6',   ib: '25', iz: '46', rcdI: '30', rcdT: '25' },
    { label: '3P C25 (4mm²)', curve: 'C', poles: '3', inAmp: '25', icu: '10', phase: '4',  npen: '4',   pe: '4',   ib: '20', iz: '36', rcdI: '30', rcdT: '25' },
    { label: '3P C32 (6mm²)', curve: 'C', poles: '3', inAmp: '32', icu: '10', phase: '6',  npen: '6',   pe: '6',   ib: '26', iz: '46', rcdI: '30', rcdT: '25' },
    { label: '3P C40 (10mm²)', curve: 'C', poles: '3', inAmp: '40', icu: '10', phase: '10', npen: '10', pe: '10',  ib: '32', iz: '63', rcdI: '300', rcdT: '35' },
    { label: '3P C63 (16mm²)', curve: 'C', poles: '3', inAmp: '63', icu: '10', phase: '16', npen: '16', pe: '16',  ib: '50', iz: '85', rcdI: '300', rcdT: '35' },
    { label: '3P C100 (35mm²)', curve: 'C', poles: '3', inAmp: '100', icu: '25', phase: '35', npen: '35', pe: '16', ib: '80', iz: '138', rcdI: '300', rcdT: '35' }
];

function applyQuickLinyePreset(rowIndex, presetIdx) {
    const fd = AppState.currentFormData;
    const rows = fd?.tableRows?.topic_3_3;
    const preset = QUICK_LINYE_PRESETS[presetIdx];
    if (!rows || !rows[rowIndex] || !preset) return;
    const r = rows[rowIndex];
    const insp = AppState.currentInspection || {};
    if (!String(r['405e297d-cea7-45ec-9c1e-6e2116cfb541'] || '').trim()) {
        r['405e297d-cea7-45ec-9c1e-6e2116cfb541'] = (insp.equipment_name || `Linye-${rowIndex + 1}`) + (rows.length > 1 ? ` - L${rowIndex + 1}` : '');
    }
    r['7f4bdff7-97bd-47dd-8151-7eacc32f5d8e'] = preset.curve;
    r['8c397b2d-a229-4bc9-b4ff-5fc78dd5a102'] = preset.poles;
    r['bd17d9ca-3087-4406-9f16-867d10642df6'] = preset.inAmp;
    r['ee0ef618-52cb-4dd9-9361-15200dcee077'] = preset.icu;
    r['8e43f81a-34b3-4c8e-9baf-e4161f5ba11e'] = preset.phase;
    r['07697e7d-212a-4c84-be0e-fd64e539b5b0'] = preset.npen;
    r['e16540f3-b6b7-486a-8f40-2722add48bb7'] = preset.pe;
    r['16c7e5ea-b08e-4d33-b9f1-49c4ae6c1437'] = preset.ib;
    r['d3bb692d-56ca-4b1b-b609-81198be785b0'] = preset.iz;
    r['e42d31e0-dbc3-4e34-88c2-5e95f8e85636'] = preset.rcdI;
    r['016eca98-d8f9-4a4d-bdfd-36160d324726'] = preset.rcdT;
    r['241bf571-43dd-46d1-836d-ecdff0c7acd2'] = 'Uygun';

    if (typeof window.syncElectrical2201Section22FromTriggers === 'function') {
        window.syncElectrical2201Section22FromTriggers('topic_3_3', true);
    }
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(`Satır #${rowIndex + 1}: ${preset.label} değerleri otomatik dolduruldu!`);
}
window.applyQuickLinyePreset = applyQuickLinyePreset;

function applyQuickPotentialEquipotentialPreset(mode = 'standard') {
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.tableRows) fd.tableRows = {};
    const insp = AppState.currentInspection || {};
    const panelName = insp.equipment_name || 'Ana Pano Topraklama Barası';
    if (mode === 'na') {
        fd.tableRows.topic_3_4 = [{
            '2f743a60-497c-41bc-84aa-a499220310a3': 'Uygulaması Yok',
            '7a977dd5-098c-4a56-a047-f1fe69cc7ed2': '-',
            '0cee7c0e-d915-4069-825a-b0984512cd08': '-',
            '4980b506-7bc6-423e-898e-6f89536754f3': '-',
            'b4af8cc0-2dad-4768-8fc3-5393757675af': '-',
            'b21fd22e-6cd7-431c-8949-b67fdc46613c': 'Uygulaması Yok'
        }];
    } else {
        fd.tableRows.topic_3_4 = [{
            '2f743a60-497c-41bc-84aa-a499220310a3': `${panelName} - Gövde / Toprak Barası`,
            '7a977dd5-098c-4a56-a047-f1fe69cc7ed2': '16',
            '0cee7c0e-d915-4069-825a-b0984512cd08': '0,08',
            '4980b506-7bc6-423e-898e-6f89536754f3': '6',
            'b4af8cc0-2dad-4768-8fc3-5393757675af': '0,12',
            'b21fd22e-6cd7-431c-8949-b67fdc46613c': 'Uygun'
        }];
    }
    if (typeof syncAllDefectsToDefectNotes === 'function') syncAllDefectsToDefectNotes();
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(mode === 'na' ? '6.2 Potansiyel Dengeleme: Uygulaması Yok seçildi' : '6.2 Potansiyel Dengeleme standart değerlerle dolduruldu');
}
window.applyQuickPotentialEquipotentialPreset = applyQuickPotentialEquipotentialPreset;

function applyQuickFloorInsulationPreset(mode = 'standard') {
    const fd = AppState.currentFormData;
    if (!fd) return;
    if (!fd.tableRows) fd.tableRows = {};
    const insp = AppState.currentInspection || {};
    const panelName = insp.equipment_name || 'Pano Önü';
    if (mode === 'na') {
        fd.tableRows.topic_3_5 = [{
            'd0096971-113c-4f4c-ac4e-31ba59227c0b': 'Uygulaması Yok',
            '8b095f55-b0a3-41c4-b8d9-6a4f4b7c9026': '-',
            '0f614ecc-406f-46b3-8d63-a759c3e119e7': '-',
            '33143091-c517-439e-b79d-6bde5d06143f': '-',
            '1114914a-a154-4859-93f9-19b22fddc098': 'Uygulaması Yok'
        }];
    } else if (mode === 'missing') {
        fd.tableRows.topic_3_5 = [{
            'd0096971-113c-4f4c-ac4e-31ba59227c0b': `${panelName} Önü`,
            '8b095f55-b0a3-41c4-b8d9-6a4f4b7c9026': 'X',
            '0f614ecc-406f-46b3-8d63-a759c3e119e7': 'X',
            '33143091-c517-439e-b79d-6bde5d06143f': 'X',
            '1114914a-a154-4859-93f9-19b22fddc098': 'Uygun Değil'
        }];
        if (fd.answers) fd.answers['q_98379425-05fc-4db3-8285-c74176c9365d'] = 'Uygun Değil';
    } else {
        fd.tableRows.topic_3_5 = [{
            'd0096971-113c-4f4c-ac4e-31ba59227c0b': `${panelName} Önü`,
            '8b095f55-b0a3-41c4-b8d9-6a4f4b7c9026': '1,0',
            '0f614ecc-406f-46b3-8d63-a759c3e119e7': '1,0',
            '33143091-c517-439e-b79d-6bde5d06143f': '>50',
            '1114914a-a154-4859-93f9-19b22fddc098': 'Uygun'
        }];
    }
    if (typeof syncAllDefectsToDefectNotes === 'function') syncAllDefectsToDefectNotes();
    triggerAutoSave();
    paintInspectionEditorUI();
    showToast(mode === 'missing' ? '6.3 Zemin İzolasyonu: Uygun Değil (X) işaretlendi' : mode === 'na' ? '6.3 Zemin İzolasyonu: Uygulaması Yok seçildi' : '6.3 Zemin İzolasyonu standart değerlerle dolduruldu');
}
window.applyQuickFloorInsulationPreset = applyQuickFloorInsulationPreset;



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

    const isSection66 = area.index === 3 && topic.index === 5;



    // Geniş ve ferah grid düzeni:
    let gridClass = 'grid-cols-1 sm:grid-cols-2 gap-3';

    if (isSection64) {

        gridClass = 'grid-cols-2 sm:grid-cols-4 gap-2';

    } else if (!isSection65) {

        gridClass = 'grid-cols-1 sm:grid-cols-2 gap-2.5';

    }



    const cardsHtml = rows.map((rowObj, rIdx) => {

        const linyeQuickPresetBar = isSection64 ? `
            <div class="p-2 rounded-lg bg-white border border-slate-200 space-y-1">
                <div class="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                    <span><i class="fa-solid fa-bolt text-amber-500 mr-1"></i>Tek Dokunuşla Linye Doldur (In / Kesit / Iz / RCD):</span>
                    <span class="text-slate-400 font-normal">Seçip değiştirebilirsiniz</span>
                </div>
                <div class="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
                    ${QUICK_LINYE_PRESETS.map((pr, pIdx) => {
                        const isPresetActive = (
                            String(rowObj['7f4bdff7-97bd-47dd-8151-7eacc32f5d8e'] || '').trim() === pr.curve &&
                            String(rowObj['8c397b2d-a229-4bc9-b4ff-5fc78dd5a102'] || '').trim() === pr.poles &&
                            String(rowObj['bd17d9ca-3087-4406-9f16-867d10642df6'] || '').trim() === pr.inAmp &&
                            String(rowObj['8e43f81a-34b3-4c8e-9baf-e4161f5ba11e'] || '').trim() === pr.phase
                        );
                        return `
                            <button type="button" onclick="applyQuickLinyePreset(${rIdx}, ${pIdx})"
                                class="px-2 py-1 rounded-md active:scale-95 font-mono font-bold text-[10px] border shrink-0 transition ${
                                    isPresetActive
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                        : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 border-slate-200'
                                }">
                                ${isPresetActive ? '✓ ' : ''}${pr.label}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : '';

        const fieldsHtml = topic.questions.map((q, qIdx) => {

            const cellVal = rowObj[q.guid] ?? '';

            const labelText = getShortTopicQuestionLabel(area.index, topic.index, q.question);

            if (q.type === 'YesNo') {

                const rowStatusBtns = [
                    { v: 'Uygun', match: ['Uygun', '✓'], lbl: '✓ Uygun', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' },
                    { v: 'Uygun Değil', match: ['Uygun Değil', 'X'], lbl: '✕ Uygun Değil', activeCls: 'bg-rose-600 text-white border-rose-600 shadow-2xs' },
                    { v: 'Uygulaması Yok', match: ['Uygulaması Yok', 'N'], lbl: 'N Uyg. Yok', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' }
                ].map(b => {
                    const isSel = b.match.includes(cellVal);
                    return `
                        <button type="button"
                            onclick="handleTopicTableCell('${tKey}', ${rIdx}, '${q.guid}', '${b.v}'); paintInspectionEditorUI();"
                            class="flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold text-center transition active:scale-95 ${
                                isSel ? b.activeCls : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                            }">
                            ${b.lbl}
                        </button>
                    `;
                }).join('');

                return `

                    <div class="col-span-full">

                        <label class="block text-[11px] font-bold text-slate-700 mb-1 leading-snug break-words">${labelText}</label>

                        <div class="flex items-center gap-1.5">
                            ${rowStatusBtns}
                        </div>

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

            <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">

                <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">

                    <span class="font-bold text-xs text-slate-800">${isSection64 ? `Linye #${rIdx + 1}` : `Satır #${rIdx + 1}`}</span>

                    <div class="flex items-center gap-1.5">

                        <button onclick="duplicateSpecificTopicRow('${tKey}', ${rIdx})" class="px-2 py-1 bg-sky-100 active:bg-sky-200 text-sky-800 rounded-lg text-[11px] font-bold flex items-center gap-1">

                            <i class="fa-solid fa-copy"></i>

                            <span>Kopyala</span>

                        </button>

                        <button onclick="removeTopicTableRow('${tKey}', ${rIdx})" class="px-2 py-1 bg-rose-50 active:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-semibold">

                            <i class="fa-solid fa-trash-can mr-1"></i>Sil

                        </button>

                    </div>

                </div>

                ${linyeQuickPresetBar}

                <div class="grid ${gridClass}">

                    ${fieldsHtml}

                </div>

            </div>

        `;

    }).join('');



    let thermalToolbarHtml = '';
    let showBodyRows = true;
    if (isThermalSection) {
        const firstGuid = topic.questions?.[0]?.guid;
        const serialGuid = topic.questions?.[1]?.guid;
        const firstVal = String((rows[0] && firstGuid && rows[0][firstGuid]) || '').trim();
        const serialVal = String((rows[0] && serialGuid && rows[0][serialGuid]) || '').trim();
        const isNotApp = firstVal.includes('Uygulaması Yok');
        const hasThermalSelected = Boolean(firstVal);
        showBodyRows = !hasThermalSelected || Boolean(AppState.showThermalManualDetail);

        const activeLabelHtml = isNotApp
            ? `<span class="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px]">Uygulaması Yok</span>`
            : firstVal
                ? `<span class="px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-300 font-bold text-[11px] truncate max-w-[220px]"><i class="fa-solid fa-temperature-half mr-1"></i>${escapeHtml(firstVal)}${serialVal ? ` (SN: ${escapeHtml(serialVal)})` : ''}</span>`
                : `<span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px]">Termal kamera seçilmedi</span>`;

        thermalToolbarHtml = `
            <div class="px-3.5 py-2.5 bg-orange-50/70 ${showBodyRows ? 'border-b border-orange-200' : ''} flex items-center justify-between gap-2 flex-wrap">
                <div onclick="toggleThermalManualDetail()" class="flex items-center gap-1.5 min-w-0 cursor-pointer">
                    ${activeLabelHtml}
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                    <button type="button" onclick="toggleThermalManualDetail()"
                        class="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-[10px] transition">
                        ${showBodyRows ? 'Gizle ▴' : 'Detay ▾'}
                    </button>
                    ${mgr ? `
                        <button type="button" onclick="openReportThermalSwapModal()"
                            class="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-2xs transition">
                            <i class="fa-solid fa-right-left"></i>
                            <span>Değiştir</span>
                        </button>
                    ` : ''}
                    <button type="button" onclick="setThermalCameraNotApplicable('${tKey}')"
                        class="px-2 py-1 active:scale-95 border font-bold rounded-lg text-[10px] flex items-center gap-1 transition ${
                            isNotApp
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }">
                        <i class="fa-solid ${isNotApp ? 'fa-check' : 'fa-ban text-slate-500'}"></i>
                        <span>Uyg. Yok</span>
                    </button>
                </div>
            </div>
        `;
    }

    const displayHeaderTitle = isSection64
        ? '6.1. Linye Ölçüm ve Test Tablosu'
        : `${subNum}. ${topic.name}`;

    const sec65FirstRes = isSection65 && rows[0] ? (rows[0]['b21fd22e-6cd7-431c-8949-b67fdc46613c'] || '') : '';
    const sec65FirstName = isSection65 && rows[0] ? (rows[0]['2f743a60-497c-41bc-84aa-a499220310a3'] || '') : '';
    const isSec65StandardActive = isSection65 && sec65FirstRes === 'Uygun' && Boolean(sec65FirstName.trim());
    const isSec65NaActive = isSection65 && sec65FirstRes === 'Uygulaması Yok';

    const sec66FirstRes = isSection66 && rows[0] ? (rows[0]['1114914a-a154-4859-93f9-19b22fddc098'] || '') : '';
    const sec66FirstName = isSection66 && rows[0] ? (rows[0]['d0096971-113c-4f4c-ac4e-31ba59227c0b'] || '') : '';
    const isSec66StandardActive = isSection66 && sec66FirstRes === 'Uygun' && Boolean(sec66FirstName.trim());
    const isSec66MissingActive = isSection66 && sec66FirstRes === 'Uygun Değil';
    const isSec66NaActive = isSection66 && sec66FirstRes === 'Uygulaması Yok';

    const quickTableActionBtns = isSection65 ? `
        <button type="button" onclick="applyQuickPotentialEquipotentialPreset('standard')" class="h-8 px-2.5 border font-bold rounded-lg text-[11px] shrink-0 shadow-2xs transition flex items-center gap-1 ${isSec65StandardActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'}"><i class="fa-solid ${isSec65StandardActive ? 'fa-check' : 'fa-bolt'} text-[10px]"></i>Standart Doldur</button>
        <button type="button" onclick="applyQuickPotentialEquipotentialPreset('na')" class="h-8 px-2.5 border font-bold rounded-lg text-[11px] shrink-0 transition ${isSec65NaActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'}">${isSec65NaActive ? '✓ ' : 'N '}Uyg. Yok</button>
    ` : isSection66 ? `
        <button type="button" onclick="applyQuickFloorInsulationPreset('standard')" class="h-8 px-2.5 border font-bold rounded-lg text-[11px] shrink-0 shadow-2xs transition flex items-center gap-1 ${isSec66StandardActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500'}"><i class="fa-solid ${isSec66StandardActive ? 'fa-check' : 'fa-bolt'} text-[10px]"></i>Standart Halı</button>
        <button type="button" onclick="applyQuickFloorInsulationPreset('missing')" class="h-8 px-2.5 border font-bold rounded-lg text-[11px] shrink-0 transition ${isSec66MissingActive ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'}">✕ Halı Yok</button>
        <button type="button" onclick="applyQuickFloorInsulationPreset('na')" class="h-8 px-2.5 border font-bold rounded-lg text-[11px] shrink-0 transition ${isSec66NaActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'}">${isSec66NaActive ? '✓ ' : 'N '}Uyg. Yok</button>
    ` : '';

    return `

        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">

            <div class="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">

                <div class="font-bold text-xs text-slate-900 leading-snug flex-1 min-w-[160px]">${displayHeaderTitle}</div>

                <div class="flex items-center gap-1.5 flex-wrap">
                    ${quickTableActionBtns}
                    ${isLockedThermal || isThermalSection ? '' : `
                        <button onclick="addTopicTableRow('${tKey}', ${area.index}, ${topic.index})" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-[11px] shrink-0 shadow-2xs">
                            + Satır Ekle
                        </button>
                    `}
                </div>

            </div>

            ${thermalToolbarHtml}

            ${!showBodyRows ? '' : `
                <div class="p-3 space-y-3">
                    ${cardsHtml}
                </div>
            `}

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
        // 6.1 Linye Tablosu: Faz Kesiti girildiğinde N/PEN, PE, Iz ve Sonuç alanlarını (boşsa) akıllı tamamla
        if (tKey === 'topic_3_3' && qGuid === '8e43f81a-34b3-4c8e-9baf-e4161f5ba11e') {
            const cleanSec = String(value || '').trim().replace('.', ',');
            const mapEntry = STANDARD_CABLE_IZ_MAP[cleanSec] || STANDARD_CABLE_IZ_MAP[String(value || '').trim()];
            if (mapEntry) {
                const nPenGuid = '07697e7d-212a-4c84-be0e-fd64e539b5b0';
                const peGuid = 'e16540f3-b6b7-486a-8f40-2722add48bb7';
                const izGuid = 'd3bb692d-56ca-4b1b-b609-81198be785b0';
                const resGuidLinye = '241bf571-43dd-46d1-836d-ecdff0c7acd2';
                const autoFillCell = (g, v) => {
                    if (!String(rows[rowIndex][g] || '').trim()) {
                        rows[rowIndex][g] = v;
                        if (typeof document !== 'undefined') {
                            const el = document.querySelector(`[data-table-cell="${tKey}_${rowIndex}_${g}"]`);
                            if (el) el.value = v;
                        }
                    }
                };
                autoFillCell(nPenGuid, cleanSec);
                autoFillCell(peGuid, mapEntry.pe);
                autoFillCell(izGuid, mapEntry.iz);
                autoFillCell(resGuidLinye, 'Uygun');
            }
        }

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

    // 5.7 Termal Kamera gözle kontrol maddelerini de otomatik Uygulaması Yok (N) yap (PDF Sayfa 2 tutarlılığı)
    if (AppState.currentFormData.answers) {
        [
            '474e7fc2-5975-432c-b2dc-e3d2683e1b16',
            '5524231c-cbf5-45f0-a32b-f925609b99d3',
            '54d69dbf-94c0-41e8-bae8-cc71276f0d1e',
            '759cc2dc-29bf-46b2-a769-1fc4ff7238b8'
        ].forEach(g => {
            AppState.currentFormData.answers[`q_${g}`] = 'Uygulaması Yok';
        });
    }

    triggerAutoSave();

    paintInspectionEditorUI();

    showToast('Termal kamera ve 5.7 Termal Kontrol maddeleri "Uygulaması Yok (N)" yapıldı.');

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



