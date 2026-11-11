// ============================================================================
// HIZLI RAPOR - MODÜL 12: BULUT MÜŞTERİ PORTALI & OFFLINE QR MOTORU
// Vercel + Supabase / Yerel Portal Sunucusuna Tek Tıkla Rapor Yükleme
// ============================================================================

(function () {
    const PORTAL_CONFIG_STORAGE_KEY = 'enlab_portal_config_v1';
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

    async function callUploadInit(cfg, payload, writeToken) {
        const headers = {
            'Content-Type': 'application/json',
            'X-App-Client': 'hizli-rapor-mobile'
        };
        if (cfg.adminKey) headers['X-Admin-Key'] = cfg.adminKey;
        if (writeToken) headers['X-Folder-Write-Token'] = writeToken;

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

    async function uploadInspectionReport(inspRaw, woRaw, pinOption = { pinMode: 'keep' }) {
        const cfg = getPortalConfig();
        const normInsp = typeof normalizeInspection === 'function' ? normalizeInspection(inspRaw) : Object.assign({}, inspRaw);
        const wo = woRaw || {};
        let fd = typeof loadInspectionFormDataObject === 'function' ? loadInspectionFormDataObject(normInsp) : (normInsp.form_data || {});
        if (window.AppState?.currentInspection && String(window.AppState.currentInspection.id) === String(normInsp.id) && window.AppState.currentFormData) {
            fd = window.AppState.currentFormData;
        }
        const ci = (fd && fd.companyInfo) || {};

        // 1. Reserve report slug & verify code BEFORE rendering A4 HTML so live QR matches final URL
        const initData = await callUploadInit(cfg, {
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
        }, wo.portal_write_token || '');

        const activeWriteToken = (initData.folder && initData.folder.write_token) || wo.portal_write_token || '';
        rememberFolderOwnershipNow(wo, initData.folder);

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

        return {
            folderUrl: compData.folderUrl || initData.folder.url,
            folderSlug: compData.folderSlug || initData.folder.share_slug,
            reportUrl: compData.reportUrl || initData.report.url,
            reportSlug: compData.reportSlug || initData.report.share_slug,
            verifyCode: compData.verifyCode || initData.report.verify_code,
            equipmentName: normInsp.equipment_name || 'Rapor',
            reportNo: normInsp.report_no || '',
            sourceType: 'app_html'
        };
    }

    async function uploadExternalPdfToPortal(woRaw, pdfFile, meta = {}, pinOption = { pinMode: 'keep' }) {
        const cfg = getPortalConfig();
        if (!pdfFile) {
            throw new Error('Yüklenecek PDF dosyası seçilmedi.');
        }
        const wo = woRaw || {};
        const fallbackTitle = (pdfFile.name || 'Ek PDF Raporu').replace(/\.pdf$/i, '');
        const reportNo = String(meta.reportNo || `PDF-${Date.now().toString().slice(-6)}`).trim();
        const equipmentName = String(meta.equipmentName || fallbackTitle).trim();
        const resultStatus = String(meta.resultStatus || 'UYGUN').trim();

        const initData = await callUploadInit(cfg, {
            folder: buildFolderPayload(wo, pinOption),
            report: {
                report_no: reportNo,
                equipment_name: equipmentName,
                inspection_date: meta.inspectionDate || new Date().toLocaleDateString('tr-TR'),
                result_status: resultStatus,
                source_type: 'uploaded_pdf',
                mime_type: 'application/pdf'
            }
        }, wo.portal_write_token || '');

        const activeWriteToken = (initData.folder && initData.folder.write_token) || wo.portal_write_token || '';
        rememberFolderOwnershipNow(wo, initData.folder);

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
            sourceType: 'uploaded_pdf'
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

    function buildCustomerShareText(wo, uploadedResults, effectivePin) {
        const customerName = (wo && (wo.customer_name || wo.company_name)) || 'Firmanız';
        const folderUrl = (uploadedResults[0] && uploadedResults[0].folderUrl) || (wo && wo.portal_folder_url) || '';
        const listText = uploadedResults.map((r, i) =>
            `${i + 1}. ${r.equipmentName} (${r.reportNo}) - Doğrulama: ${r.verifyCode}\n   ${r.reportUrl}`
        ).join('\n');

        return [
            `Sayın Yetkili,`,
            ``,
            `${customerName} firmasına ait Periyodik Kontrol Raporları internet portalına yüklenmiştir.`,
            ``,
            `Müşteri Rapor Klasörü: ${folderUrl}`,
            effectivePin ? `Erişim Şifresi (PIN): ${effectivePin}` : `Erişim Durumu: Doğrudan bağlantı ile açılır`,
            uploadedResults.length ? `\nYayınlanan Raporlar:\n${listText}` : '',
            ``,
            `Klasör linkine tıklayarak tüm raporları inceleyebilir ve PDF olarak indirebilirsiniz.`
        ].filter(Boolean).join('\n');
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

        _portalModalState = {
            wo,
            reports,
            uploadedResults: [],
            effectivePin: wo.portal_pin || cfg.defaultPin || ''
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
                        ${wo.portal_folder_url ? `<div class="text-[10px] text-emerald-300 font-mono truncate mt-0.5"><i class="fa-solid fa-link mr-1"></i>${escapeStr(wo.portal_folder_url)}</div>` : `<div class="text-[10px] text-slate-400 mt-0.5">İlk yüklemede müşteriye özel gizli klasör bağlantısı oluşturulur.</div>`}
                    </div>
                    ${wo.portal_folder_url ? `<button type="button" onclick="CloudPortal.copyText('${escapeStr(wo.portal_folder_url)}')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[11px] shrink-0 border border-slate-700"><i class="fa-regular fa-copy mr-1"></i>Kopyala</button>` : ''}
                </div>

                <!-- Otomatik Portal & Şirket Kimliği Kartı (Adres/Şifre İstemez) -->
                <div id="portalQuickSetupBox" class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                    <div class="flex items-center justify-between gap-2">
                        <div class="min-w-0 flex items-center gap-1.5 text-emerald-900 font-bold">
                            <i class="fa-solid fa-cloud-check text-emerald-600 shrink-0"></i>
                            <span>Otomatik Bulut Portalı Hazır ✓</span>
                        </div>
                        <span class="text-[10px] font-mono text-emerald-700 truncate max-w-[160px]" title="${escapeStr(cfg.portalUrl)}">${escapeStr(portalHostLabel)}</span>
                    </div>
                    <div class="flex items-center justify-between gap-2 flex-wrap text-[11px] text-emerald-950">
                        <span class="flex items-center gap-1 min-w-0">
                            <i class="fa-solid fa-building text-emerald-700 shrink-0"></i>
                            <span class="truncate">Şirket: <strong>${escapeStr(company.companyName)}</strong></span>
                        </span>
                        <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800 shrink-0">Ön Ek: /p/${escapeStr(company.companySlug)}-...</span>
                    </div>
                    ${!company.isCustomized ? `
                        <div class="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 flex items-center justify-between gap-2">
                            <span>Şirket kısaltmanız henüz varsayılan. İsterseniz firma adınızı girin:</span>
                            <button type="button" onclick="closeModal(); setTimeout(() => { if(typeof openCompanySettingsModal==='function') openCompanySettingsModal(); else navigateTo('settings'); }, 60);" class="font-bold text-amber-950 underline shrink-0">Şirket Adını Ayarla</button>
                        </div>
                    ` : ''}
                </div>

                <!-- Rapor Seçimi -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <label class="font-bold text-slate-800">Yayınlanacak Uygulama Raporları</label>
                        ${reports.length > 1 ? `<button type="button" onclick="CloudPortal.toggleAllModalReports()" class="text-[11px] font-bold text-sky-600 hover:underline">Tümünü Seç / Bırak</button>` : ''}
                    </div>
                    <div class="max-h-44 overflow-y-auto space-y-1.5 pr-0.5">${reportsHtml}</div>
                </div>

                <!-- Harici PDF Ekleme (İsteğe Bağlı) -->
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden">
                    <button type="button" onclick="document.getElementById('portalExtPdfFields').classList.toggle('hidden')"
                        class="w-full px-3 py-2 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-100 transition">
                        <span class="flex items-center gap-1.5"><i class="fa-solid fa-file-circle-plus text-rose-600"></i> + Hazır PDF Dosyası Ekle (İsteğe Bağlı)</span>
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

                <!-- Müşteri Erişim PIN Ayarı -->
                <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div class="flex items-center justify-between gap-2">
                        <label class="font-bold text-slate-800 flex items-center gap-1.5">
                            <i class="fa-solid fa-key text-amber-500"></i>
                            <span>Müşteri Klasörü PIN Şifresi</span>
                        </label>
                        <button type="button" onclick="CloudPortal.generateRandomPin()" class="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] border border-amber-300">Rastgele 4 Hane</button>
                    </div>
                    <input type="text" id="portalUploadPinInput" value="${escapeStr(wo.portal_pin || cfg.defaultPin || '')}"
                        placeholder="Örn: 4829 (Boş bırakılırsa şifresiz / mevcut korunur)"
                        class="w-full px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-mono font-bold tracking-wider">
                    ${wo.portal_folder_slug ? `
                        <label class="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                            <input type="checkbox" id="portalUploadClearPinCb" onchange="if(this.checked) document.getElementById('portalUploadPinInput').value='';" class="accent-sky-600">
                            <span>Klasörü şifresiz (yalnızca gizli linkle açılır) yap</span>
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

        const pinRaw = (document.getElementById('portalUploadPinInput')?.value || '').trim();
        const clearChecked = Boolean(document.getElementById('portalUploadClearPinCb')?.checked);
        let pinOption = { pinMode: 'keep', pin: '' };
        if (clearChecked) {
            pinOption = { pinMode: 'clear', pin: '' };
        } else if (pinRaw) {
            pinOption = { pinMode: 'set', pin: pinRaw };
        }

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

        try {
            for (const insp of selectedReports) {
                updateProg(`${doneCount + 1}/${totalTasks} Yükleniyor: ${insp.equipment_name || insp.report_no || 'Rapor'}...`);
                try {
                    const r = await uploadInspectionReport(insp, _portalModalState.wo, pinOption);
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
                    }, pinOption);
                    uploaded.push(r);
                } catch (err) {
                    errors.push(`PDF (${pdfFile.name}): ${err.message}`);
                }
                doneCount++;
                updateProg(`${doneCount}/${totalTasks} Tamamlandı`);
            }

            _portalModalState.uploadedResults = uploaded;
            _portalModalState.effectivePin = pinOption.pinMode === 'clear'
                ? ''
                : (pinOption.pinMode === 'set' ? pinOption.pin : (_portalModalState.wo.portal_pin || ''));

            if (progBar) progBar.style.width = '100%';

            if (uploaded.length > 0 && resultBox) {
                const folderUrl = uploaded[0].folderUrl || _portalModalState.wo.portal_folder_url || '';
                const effPin = _portalModalState.effectivePin;
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
                    <div class="flex items-center justify-between gap-2">
                        <div class="font-black text-emerald-900 flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                            <span>${uploaded.length} Rapor Başarıyla Yayınlandı!</span>
                        </div>
                        ${effPin ? `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-[10px]">PIN: ${escapeStr(effPin)}</span>` : `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Şifresiz Link</span>`}
                    </div>
                    <div class="space-y-1">
                        <div class="text-[10px] font-bold text-emerald-800 uppercase">Müşteri Klasör Bağlantısı</div>
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
                        <a href="${escapeStr(folderUrl)}" target="_blank" rel="noopener" class="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center gap-1">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            <span>Siteye Git</span>
                        </a>
                    </div>
                `;
                resultBox.classList.remove('hidden');
                toast(`${uploaded.length} rapor internet portalına yüklendi!`, 'success');

                // Refresh work-order details view in background if currently visible
                if (window.AppState?.currentRoute === 'work-order-details' && typeof window.renderWorkOrderDetails === 'function' && _portalModalState.wo?.id) {
                    window.renderWorkOrderDetails(_portalModalState.wo.id);
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
        const text = buildCustomerShareText(wo, _portalModalState.uploadedResults, _portalModalState.effectivePin);
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

    window.CloudPortal = {
        DEFAULT_PORTAL_URL: DEFAULT_CLOUD_PORTAL_URL,
        getConfig: getPortalConfig,
        saveConfig: savePortalConfig,
        normalizeUrl: normalizePortalUrl,
        sanitizeCompanySlug,
        getActiveCompanyProfile: resolveActiveCompanyProfile,
        generateQrDataUrl,
        buildPortableA4ReportHtml,
        testConnection: testPortalConnection,
        uploadInspectionReport,
        uploadExternalPdfToPortal,
        openPortalUploadModal,
        toggleAllModalReports,
        onExternalPdfSelected,
        generateRandomPin,
        executeModalUpload,
        shareLastUpload,
        transferLastUploadToEmail,
        copyReportPortalLink,
        savePortalSettingsFromPage,
        testPortalFromSettingsPage,
        openPortalSiteFromSettings,
        copyText: copyTextToClipboard
    };

    window.generateQrDataUrl = generateQrDataUrl;
    window.openPortalUploadModal = openPortalUploadModal;
    window.copyReportPortalLink = copyReportPortalLink;
})();
