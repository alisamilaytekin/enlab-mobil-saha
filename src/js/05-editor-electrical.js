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



