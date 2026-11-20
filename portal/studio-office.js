/* ============================================================================
   HIZLI RAPOR — OFFICE EXCEL & WORD GÜÇ MOTORU (studio-office.js)
   GridCraft & WordCraft İlhamlı Kapsamlı Şerit, Formül, Veri ve Belge Motoru
   ============================================================================ */

(function () {
  'use strict';

  const AUTOSAVE_KEY = 'hr_studio_autosave_draft_v3';
  const DARK_MODE_KEY = 'hr_studio_dark_mode';

  const OfficeState = {
    lastBgColor: '#fef3c7',
    lastFontColor: '#c00000',
    colorTargetMode: 'bg',
    clipboard: null, // { rows: [[{ raw, style }]], isCut: false, sourceKeys: [] }
    findMatches: [],
    findIndex: -1,
    activePopoverId: null,
    condRuleOp: 'gt',
    cmdFiltered: [],
    cmdActiveIdx: 0
  };

  function S() { return window.__Studio; }

  // ==========================================================================
  // 1. RENK PALETİ & SİMGE IZGARASI BAŞLATMA
  // ==========================================================================
  const THEME_PALETTE = [
    '#ffffff', '#000000', '#e7e6e6', '#44546a', '#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47',
    '#f2f2f2', '#7f7f7f', '#d0cece', '#d6dce4', '#d9e1f2', '#fce4d6', '#ededed', '#fff2cc', '#ddebf7', '#e2efda',
    '#d9d9d9', '#595959', '#aeaaaa', '#acb9ca', '#b4c6e7', '#f8cbad', '#dbdbdb', '#ffe699', '#bdd7ee', '#c6e0b4',
    '#bfbfbf', '#3f3f3f', '#757171', '#8497b0', '#8ea9db', '#f4b084', '#c9c9c9', '#ffd966', '#9bc2e6', '#a9d08e',
    '#a6a6a6', '#262626', '#3a3838', '#333f4f', '#305496', '#c65911', '#7b7b7b', '#bf8f00', '#2f75b5', '#548235',
    '#808080', '#0c0c0c', '#161616', '#222b35', '#203764', '#833c0c', '#525252', '#806000', '#1f4e78', '#375623'
  ];

  const STD_PALETTE = [
    '#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'
  ];

  const ENG_SYMBOLS = [
    'Ω', '±', '°C', 'µ', 'Δ', 'Ø', '≥', '≤',
    '≈', '≠', '✓', '✗', '²', '³', '⚡', '§',
    '©', '®', '™', '•', '→', '↔', '↑', '↓',
    '∞', 'π', '√', '∑', '½', '¼', '¾', '₺'
  ];

  function buildStaticPopoverGrids() {
    const grid = document.getElementById('popColorGrid');
    if (grid) {
      grid.innerHTML = THEME_PALETTE.map(hex =>
        `<button type="button" class="pal-cell" style="background:${hex};" title="${hex}" onclick="officeSelectPaletteColor('${hex}')"></button>`
      ).join('');
    }
    const std = document.getElementById('popStdColors');
    if (std) {
      std.innerHTML = STD_PALETTE.map(hex =>
        `<button type="button" class="pal-cell" style="background:${hex};" title="${hex}" onclick="officeSelectPaletteColor('${hex}')"></button>`
      ).join('');
    }
    const sym = document.getElementById('popSymbolGrid');
    if (sym) {
      sym.innerHTML = ENG_SYMBOLS.map(ch =>
        `<button type="button" class="sym-key" onclick="officeInsertSymbol('${ch}')" title="Ekle: ${ch}">${ch}</button>`
      ).join('');
    }
  }

  // ==========================================================================
  // 2. EXCEL FORMÜL MOTORU (TÜRKÇE + İNGİLİZCE 25+ İŞLEV & ARALIK HESAPLAMA)
  // ==========================================================================
  function parseLocaleNumber(val) {
    if (typeof val === 'number') return isFinite(val) ? val : NaN;
    const raw = String(val == null ? '' : val).trim();
    if (!raw) return NaN;
    // Strip currency/unit suffix if purely numeric + unit
    let cleaned = raw.replace(/[₺$€%ΩVAmska²³\s]/gi, '');
    if (!cleaned) return NaN;
    if (cleaned.includes(',') && cleaned.includes('.')) {
      if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    if (!/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(cleaned)) return NaN;
    return parseFloat(cleaned);
  }

  function excelLetterToColIndex(letters) {
    let idx = 0;
    const up = String(letters || '').toUpperCase();
    for (let i = 0; i < up.length; i++) {
      idx = idx * 26 + (up.charCodeAt(i) - 64);
    }
    return idx - 1;
  }

  function splitFormulaArgs(argStr) {
    // Türkçe Excel sözdiziminde ';' argüman ayırıcı, ',' ondalık ayırıcıdır (ör. =YUVARLA(3,14159;2))
    let hasTopLevelSemi = false;
    {
      let d = 0, s = false;
      for (let i = 0; i < argStr.length; i++) {
        const ch = argStr[i];
        if (ch === '"') s = !s;
        else if (!s && ch === '(') d++;
        else if (!s && ch === ')') d--;
        else if (!s && d === 0 && ch === ';') { hasTopLevelSemi = true; break; }
      }
    }
    const sep = hasTopLevelSemi ? ';' : ',';
    const args = [];
    let cur = '';
    let depth = 0;
    let inStr = false;
    for (let i = 0; i < argStr.length; i++) {
      const ch = argStr[i];
      if (ch === '"') {
        inStr = !inStr;
        cur += ch;
      } else if (!inStr && ch === '(') {
        depth++;
        cur += ch;
      } else if (!inStr && ch === ')') {
        depth--;
        cur += ch;
      } else if (!inStr && depth === 0 && ch === sep) {
        args.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim() !== '' || args.length > 0) args.push(cur.trim());
    return args;
  }

  function evaluateTableFormulas(gridMatrix) {
    const rawValues = gridMatrix.map(row =>
      row.map(cell => (cell.dataset.rawValue !== undefined ? cell.dataset.rawValue : S().getCellEditableText(cell)))
    );
    const cache = new Map();
    const visiting = new Set();

    function getCellVal(r, c) {
      if (r < 0 || r >= rawValues.length || c < 0 || !rawValues[r] || c >= rawValues[r].length) return '';
      const id = `${r}:${c}`;
      if (cache.has(id)) return cache.get(id);
      const raw = String(rawValues[r][c] == null ? '' : rawValues[r][c]).trim();
      if (!raw.startsWith('=')) {
        const num = parseLocaleNumber(raw);
        const res = !isNaN(num) && /^-?[\d.,\s]+$/.test(raw) ? num : raw;
        cache.set(id, res);
        return res;
      }
      if (visiting.has(id)) return '#DÖNGÜ!';
      visiting.add(id);
      let out;
      try {
        out = evalExpr(raw.slice(1).trim());
      } catch (_) {
        out = '#HATA!';
      }
      visiting.delete(id);
      cache.set(id, out);
      return out;
    }

    function expandRangeMatrix(rangeExpr) {
      const m = String(rangeExpr || '').trim().match(/^\$?([A-Z]+)\$?(\d+)\s*:\s*\$?([A-Z]+)\$?(\d+)$/i);
      if (!m) return null;
      const c1 = excelLetterToColIndex(m[1]);
      const r1 = parseInt(m[2], 10) - 1;
      const c2 = excelLetterToColIndex(m[3]);
      const r2 = parseInt(m[4], 10) - 1;
      const rows = [];
      for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
        const row = [];
        for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
          row.push(getCellVal(r, c));
        }
        rows.push(row);
      }
      return rows;
    }

    function expandRangeValues(rangeExpr) {
      const mat = expandRangeMatrix(rangeExpr);
      return mat ? mat.flat() : null;
    }

    function collectNumbers(args) {
      const nums = [];
      args.forEach(a => {
        const rng = expandRangeValues(a);
        if (rng) {
          rng.forEach(v => {
            const n = parseLocaleNumber(v);
            if (!isNaN(n)) nums.push(n);
          });
        } else {
          const v = evalExpr(a);
          const n = parseLocaleNumber(v);
          if (!isNaN(n)) nums.push(n);
        }
      });
      return nums;
    }

    function collectAllValues(args) {
      const all = [];
      args.forEach(a => {
        const rng = expandRangeValues(a);
        if (rng) all.push(...rng);
        else all.push(evalExpr(a));
      });
      return all;
    }

    function matchCriteria(val, crit) {
      const cs = String(crit == null ? '' : crit).trim();
      const cmp = cs.match(/^(>=|<=|<>|!=|>|<|=)\s*(.+)$/);
      if (cmp) {
        const op = cmp[1];
        const rhsNum = parseLocaleNumber(cmp[2]);
        const lhsNum = parseLocaleNumber(val);
        if (!isNaN(lhsNum) && !isNaN(rhsNum)) {
          if (op === '>') return lhsNum > rhsNum;
          if (op === '>=') return lhsNum >= rhsNum;
          if (op === '<') return lhsNum < rhsNum;
          if (op === '<=') return lhsNum <= rhsNum;
          if (op === '<>' || op === '!=') return lhsNum !== rhsNum;
          if (op === '=') return lhsNum === rhsNum;
        }
      }
      return String(val == null ? '' : val).trim().toLowerCase() === cs.toLowerCase();
    }

    function evalFunction(nameRaw, argsRaw) {
      const fn = nameRaw.toUpperCase()
        .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
        .replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
      const args = argsRaw.trim() === '' ? [] : splitFormulaArgs(argsRaw);

      if (fn === 'TOPLA' || fn === 'SUM') {
        return collectNumbers(args).reduce((a, b) => a + b, 0);
      }
      if (fn === 'ORTALAMA' || fn === 'AVERAGE' || fn === 'ORT') {
        const nums = collectNumbers(args);
        return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      }
      if (fn === 'SAY' || fn === 'COUNT') {
        return collectNumbers(args).length;
      }
      if (fn === 'BAG_DEG_DOLU_SAY' || fn === 'COUNTA' || fn === 'DOLUSAY') {
        return collectAllValues(args).filter(v => String(v == null ? '' : v).trim() !== '').length;
      }
      if (fn === 'MIN') {
        const nums = collectNumbers(args);
        return nums.length ? Math.min(...nums) : 0;
      }
      if (fn === 'MAK' || fn === 'MAX') {
        const nums = collectNumbers(args);
        return nums.length ? Math.max(...nums) : 0;
      }
      if (fn === 'MEDYAN' || fn === 'MEDIAN') {
        const nums = collectNumbers(args).sort((a, b) => a - b);
        if (!nums.length) return 0;
        const mid = Math.floor(nums.length / 2);
        return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
      }
      if (fn === 'CARPIM' || fn === 'PRODUCT') {
        const nums = collectNumbers(args);
        return nums.length ? nums.reduce((a, b) => a * b, 1) : 0;
      }
      if (fn === 'EGER' || fn === 'IF') {
        const cond = evalExpr(args[0] || '0');
        const truthy = cond === true || (typeof cond === 'number' && cond !== 0) || (typeof cond === 'string' && cond.toLowerCase() === 'true');
        return truthy ? evalExpr(args[1] ?? '') : evalExpr(args[2] ?? '');
      }
      if (fn === 'EGERSAY' || fn === 'COUNTIF') {
        const vals = expandRangeValues(args[0] || '') || [evalExpr(args[0] || '')];
        const crit = evalExpr(args[1] || '');
        return vals.filter(v => matchCriteria(v, crit)).length;
      }
      if (fn === 'ETOPLA' || fn === 'SUMIF') {
        const vals = expandRangeValues(args[0] || '') || [];
        const crit = evalExpr(args[1] || '');
        const sumVals = args[2] ? (expandRangeValues(args[2]) || vals) : vals;
        let tot = 0;
        vals.forEach((v, idx) => {
          if (matchCriteria(v, crit)) {
            const n = parseLocaleNumber(sumVals[idx]);
            if (!isNaN(n)) tot += n;
          }
        });
        return tot;
      }
      if (fn === 'YUVARLA' || fn === 'ROUND') {
        const n = parseLocaleNumber(evalExpr(args[0] || '0'));
        const d = parseInt(evalExpr(args[1] || '0'), 10) || 0;
        const f = Math.pow(10, d);
        return isNaN(n) ? 0 : Math.round(n * f) / f;
      }
      if (fn === 'MUTLAK' || fn === 'ABS') {
        const n = parseLocaleNumber(evalExpr(args[0] || '0'));
        return isNaN(n) ? 0 : Math.abs(n);
      }
      if (fn === 'KAREKOK' || fn === 'SQRT') {
        const n = parseLocaleNumber(evalExpr(args[0] || '0'));
        return isNaN(n) || n < 0 ? '#SAYI!' : Math.sqrt(n);
      }
      if (fn === 'US' || fn === 'POWER') {
        return Math.pow(parseLocaleNumber(evalExpr(args[0] || '0')), parseLocaleNumber(evalExpr(args[1] || '1')));
      }
      if (fn === 'YUKARIYUVARLA' || fn === 'ROUNDUP') {
        const n = parseLocaleNumber(evalExpr(args[0] || '0'));
        const d = parseInt(evalExpr(args[1] || '0'), 10) || 0;
        const f = Math.pow(10, d);
        return isNaN(n) ? 0 : (n >= 0 ? Math.ceil(n * f) / f : Math.floor(n * f) / f);
      }
      if (fn === 'ASAGIYUVARLA' || fn === 'ROUNDDOWN') {
        const n = parseLocaleNumber(evalExpr(args[0] || '0'));
        const d = parseInt(evalExpr(args[1] || '0'), 10) || 0;
        const f = Math.pow(10, d);
        return isNaN(n) ? 0 : Math.trunc(n * f) / f;
      }
      if (fn === 'TAMSAYI' || fn === 'INT') {
        const n = parseLocaleNumber(evalExpr(args[0] || '0'));
        return isNaN(n) ? 0 : Math.floor(n);
      }
      if (fn === 'MOD') {
        const a = parseLocaleNumber(evalExpr(args[0] || '0'));
        const b = parseLocaleNumber(evalExpr(args[1] || '1'));
        return b === 0 ? '#SAYI/0!' : ((a % b) + b) % b;
      }
      if (fn === 'BOLUM' || fn === 'QUOTIENT') {
        const a = parseLocaleNumber(evalExpr(args[0] || '0'));
        const b = parseLocaleNumber(evalExpr(args[1] || '1'));
        return b === 0 ? '#SAYI/0!' : Math.trunc(a / b);
      }
      if (fn === 'PI') return Math.PI;
      if (fn === 'SIN') return Math.sin(parseLocaleNumber(evalExpr(args[0] || '0')) || 0);
      if (fn === 'COS') return Math.cos(parseLocaleNumber(evalExpr(args[0] || '0')) || 0);
      if (fn === 'TAN') return Math.tan(parseLocaleNumber(evalExpr(args[0] || '0')) || 0);
      if (fn === 'LOG10') { const n = parseLocaleNumber(evalExpr(args[0] || '1')); return n > 0 ? Math.log10(n) : '#SAYI!'; }
      if (fn === 'LN') { const n = parseLocaleNumber(evalExpr(args[0] || '1')); return n > 0 ? Math.log(n) : '#SAYI!'; }
      if (fn === 'LOG') {
        const n = parseLocaleNumber(evalExpr(args[0] || '1'));
        const base = args[1] ? parseLocaleNumber(evalExpr(args[1])) : 10;
        return n > 0 && base > 0 && base !== 1 ? Math.log(n) / Math.log(base) : '#SAYI!';
      }
      if (fn === 'BOSLUKSAY' || fn === 'COUNTBLANK') {
        return collectAllValues(args).filter(v => String(v == null ? '' : v).trim() === '').length;
      }
      if (fn === 'EGERORTALAMA' || fn === 'AVERAGEIF') {
        const vals = expandRangeValues(args[0] || '') || [];
        const crit = evalExpr(args[1] || '');
        const avgVals = args[2] ? (expandRangeValues(args[2]) || vals) : vals;
        let tot = 0, cnt = 0;
        vals.forEach((v, idx) => {
          if (matchCriteria(v, crit)) {
            const n = parseLocaleNumber(avgVals[idx]);
            if (!isNaN(n)) { tot += n; cnt++; }
          }
        });
        return cnt ? tot / cnt : '#SAYI/0!';
      }
      if (fn === 'STDSAPMA' || fn === 'STDEV' || fn === 'STDEV.S') {
        const nums = collectNumbers(args);
        if (nums.length < 2) return '#SAYI/0!';
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        return Math.sqrt(nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (nums.length - 1));
      }
      if (fn === 'BUYUK' || fn === 'LARGE') {
        const nums = (expandRangeValues(args[0] || '') || []).map(parseLocaleNumber).filter(n => !isNaN(n)).sort((a, b) => b - a);
        const k = parseInt(evalExpr(args[1] || '1'), 10) - 1;
        return nums[k] !== undefined ? nums[k] : '#SAYI!';
      }
      if (fn === 'KUCUK' || fn === 'SMALL') {
        const nums = (expandRangeValues(args[0] || '') || []).map(parseLocaleNumber).filter(n => !isNaN(n)).sort((a, b) => a - b);
        const k = parseInt(evalExpr(args[1] || '1'), 10) - 1;
        return nums[k] !== undefined ? nums[k] : '#SAYI!';
      }
      if (fn === 'TOPLA.CARPIM' || fn === 'SUMPRODUCT') {
        const arrs = args.map(a => (expandRangeValues(a) || [evalExpr(a)]).map(v => parseLocaleNumber(v) || 0));
        if (!arrs.length) return 0;
        const len = Math.min(...arrs.map(a => a.length));
        let sum = 0;
        for (let i = 0; i < len; i++) sum += arrs.reduce((acc, arr) => acc * arr[i], 1);
        return sum;
      }
      if (fn === 'COKEGER' || fn === 'IFS') {
        for (let i = 0; i + 1 < args.length; i += 2) {
          const cond = evalExpr(args[i]);
          if (cond === true || (typeof cond === 'number' && cond !== 0)) return evalExpr(args[i + 1]);
        }
        return '#YOK';
      }
      if (fn === 'EGERHATA' || fn === 'IFERROR') {
        const v = evalExpr(args[0] || '');
        return (typeof v === 'string' && v.startsWith('#')) ? evalExpr(args[1] ?? '') : v;
      }
      if (fn === 'DUSEYARA' || fn === 'VLOOKUP') {
        const needle = evalExpr(args[0] || '');
        const mat = expandRangeMatrix(args[1] || '');
        const colNum = parseInt(evalExpr(args[2] || '1'), 10) - 1;
        if (!mat || colNum < 0) return '#YOK';
        const hit = mat.find(row => String(row[0] ?? '').trim().toLowerCase() === String(needle ?? '').trim().toLowerCase());
        return hit && hit[colNum] !== undefined ? hit[colNum] : '#YOK';
      }
      if (fn === 'CAPRAZARA' || fn === 'XLOOKUP') {
        const needle = evalExpr(args[0] || '');
        const lookupArr = expandRangeValues(args[1] || '') || [];
        const returnArr = expandRangeValues(args[2] || '') || [];
        const notFound = args[3] !== undefined ? evalExpr(args[3]) : '#YOK';
        const idx = lookupArr.findIndex(v => String(v ?? '').trim().toLowerCase() === String(needle ?? '').trim().toLowerCase());
        return idx >= 0 && returnArr[idx] !== undefined ? returnArr[idx] : notFound;
      }
      if (fn === 'KACINCI' || fn === 'MATCH') {
        const needle = evalExpr(args[0] || '');
        const arr = expandRangeValues(args[1] || '') || [];
        const idx = arr.findIndex(v => String(v ?? '').trim().toLowerCase() === String(needle ?? '').trim().toLowerCase());
        return idx >= 0 ? idx + 1 : '#YOK';
      }
      if (fn === 'INDIS' || fn === 'INDEX') {
        const mat = expandRangeMatrix(args[0] || '');
        const r = Math.max(1, parseInt(evalExpr(args[1] || '1'), 10)) - 1;
        const c = args[2] !== undefined ? Math.max(1, parseInt(evalExpr(args[2]), 10)) - 1 : 0;
        return mat && mat[r] && mat[r][c] !== undefined ? mat[r][c] : '#BAŞV!';
      }
      if (fn === 'BIRLESTIR' || fn === 'CONCAT' || fn === 'CONCATENATE') {
        return collectAllValues(args).map(v => (v == null ? '' : String(v))).join('');
      }
      if (fn === 'METINBIRLESTIR' || fn === 'TEXTJOIN') {
        const delim = String(evalExpr(args[0] || ''));
        const ignoreEmpty = Boolean(evalExpr(args[1] || 'TRUE'));
        let vals = collectAllValues(args.slice(2)).map(v => (v == null ? '' : String(v)));
        if (ignoreEmpty) vals = vals.filter(v => v.trim() !== '');
        return vals.join(delim);
      }
      if (fn === 'SOL' || fn === 'LEFT') {
        return String(evalExpr(args[0] || '')).slice(0, parseInt(evalExpr(args[1] || '1'), 10) || 1);
      }
      if (fn === 'SAG' || fn === 'RIGHT') {
        const s = String(evalExpr(args[0] || ''));
        const n = parseInt(evalExpr(args[1] || '1'), 10) || 1;
        return s.slice(Math.max(0, s.length - n));
      }
      if (fn === 'PARCAAL' || fn === 'MID') {
        const s = String(evalExpr(args[0] || ''));
        const start = Math.max(1, parseInt(evalExpr(args[1] || '1'), 10)) - 1;
        const len = Math.max(0, parseInt(evalExpr(args[2] || '1'), 10));
        return s.slice(start, start + len);
      }
      if (fn === 'KIRP' || fn === 'TRIM') return String(evalExpr(args[0] || '')).trim().replace(/\s+/g, ' ');
      if (fn === 'YERINEKOY' || fn === 'SUBSTITUTE') {
        const s = String(evalExpr(args[0] || ''));
        const oldT = String(evalExpr(args[1] || ''));
        const newT = String(evalExpr(args[2] || ''));
        return oldT ? s.split(oldT).join(newT) : s;
      }
      if (fn === 'YAZIM.DUZENI' || fn === 'PROPER') {
        return String(evalExpr(args[0] || '')).toLocaleLowerCase('tr-TR').replace(/(^|\s)\S/g, m => m.toLocaleUpperCase('tr-TR'));
      }
      if (fn === 'BUYUKHARF' || fn === 'UPPER') return String(evalExpr(args[0] || '')).toLocaleUpperCase('tr-TR');
      if (fn === 'KUCUKHARF' || fn === 'LOWER') return String(evalExpr(args[0] || '')).toLocaleLowerCase('tr-TR');
      if (fn === 'UZUNLUK' || fn === 'LEN') return String(evalExpr(args[0] || '')).length;
      if (fn === 'BUGUN' || fn === 'TODAY') return new Date().toLocaleDateString('tr-TR');
      if (fn === 'SIMDI' || fn === 'NOW') return new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
      if (fn === 'YIL' || fn === 'YEAR') return new Date().getFullYear();
      if (fn === 'AY' || fn === 'MONTH') return new Date().getMonth() + 1;
      if (fn === 'GUN' || fn === 'DAY') return new Date().getDate();
      if (fn === 'VE' || fn === 'AND') return args.every(a => Boolean(evalExpr(a)));
      if (fn === 'VEYA' || fn === 'OR') return args.some(a => Boolean(evalExpr(a)));
      if (fn === 'DEGIL' || fn === 'NOT') return !Boolean(evalExpr(args[0] || '0'));
      return `#AD?`;
    }

    function findTopLevelOp(expr, ops) {
      let depth = 0, inStr = false;
      for (let i = expr.length - 1; i >= 0; i--) {
        const ch = expr[i];
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === ')') depth++;
        else if (ch === '(') depth--;
        else if (depth === 0) {
          for (const op of ops) {
            const len = op.length;
            if (i - len + 1 >= 0 && expr.slice(i - len + 1, i + 1) === op) {
              // Avoid unary minus at start or right after another operator
              const pos = i - len + 1;
              if ((op === '-' || op === '+') && (pos === 0 || /[+\-*/^(=<>&]/.test(expr.slice(0, pos).trim().slice(-1)))) {
                continue;
              }
              return { pos, op };
            }
          }
        }
      }
      return null;
    }

    function evalExpr(exprRaw) {
      let expr = String(exprRaw == null ? '' : exprRaw).trim();
      if (!expr) return '';

      // Strip wrapping parentheses
      while (expr.startsWith('(') && expr.endsWith(')')) {
        let depth = 0, wraps = true, inStr = false;
        for (let i = 0; i < expr.length; i++) {
          if (expr[i] === '"') inStr = !inStr;
          if (inStr) continue;
          if (expr[i] === '(') depth++;
          else if (expr[i] === ')') {
            depth--;
            if (depth === 0 && i < expr.length - 1) { wraps = false; break; }
          }
        }
        if (wraps) expr = expr.slice(1, -1).trim();
        else break;
      }

      // String literal
      if (expr.startsWith('"') && expr.endsWith('"') && expr.indexOf('"', 1) === expr.length - 1) {
        return expr.slice(1, -1);
      }

      // Comparison operators
      const cmpHit = findTopLevelOp(expr, ['>=', '<=', '<>', '!=', '=', '>', '<']);
      if (cmpHit) {
        const L = evalExpr(expr.slice(0, cmpHit.pos));
        const R = evalExpr(expr.slice(cmpHit.pos + cmpHit.op.length));
        const ln = parseLocaleNumber(L), rn = parseLocaleNumber(R);
        const bothNum = !isNaN(ln) && !isNaN(rn) && String(L).trim() !== '' && String(R).trim() !== '';
        const a = bothNum ? ln : String(L).toLowerCase();
        const b = bothNum ? rn : String(R).toLowerCase();
        if (cmpHit.op === '=') return a === b;
        if (cmpHit.op === '<>' || cmpHit.op === '!=') return a !== b;
        if (cmpHit.op === '>') return a > b;
        if (cmpHit.op === '>=') return a >= b;
        if (cmpHit.op === '<') return a < b;
        if (cmpHit.op === '<=') return a <= b;
      }

      // String concat &
      const ampHit = findTopLevelOp(expr, ['&']);
      if (ampHit) {
        return String(evalExpr(expr.slice(0, ampHit.pos))) + String(evalExpr(expr.slice(ampHit.pos + 1)));
      }

      // Add / Sub
      const addHit = findTopLevelOp(expr, ['+', '-']);
      if (addHit) {
        const L = parseLocaleNumber(evalExpr(expr.slice(0, addHit.pos))) || 0;
        const R = parseLocaleNumber(evalExpr(expr.slice(addHit.pos + 1))) || 0;
        return addHit.op === '+' ? L + R : L - R;
      }

      // Mul / Div
      const mulHit = findTopLevelOp(expr, ['*', '/']);
      if (mulHit) {
        const L = parseLocaleNumber(evalExpr(expr.slice(0, mulHit.pos))) || 0;
        const R = parseLocaleNumber(evalExpr(expr.slice(mulHit.pos + 1))) || 0;
        if (mulHit.op === '/') return R === 0 ? '#SAYI/0!' : L / R;
        return L * R;
      }

      // Power ^
      const powHit = findTopLevelOp(expr, ['^']);
      if (powHit) {
        const L = parseLocaleNumber(evalExpr(expr.slice(0, powHit.pos))) || 0;
        const R = parseLocaleNumber(evalExpr(expr.slice(powHit.pos + 1))) || 0;
        return Math.pow(L, R);
      }

      // Unary minus
      if (expr.startsWith('-')) {
        return -(parseLocaleNumber(evalExpr(expr.slice(1))) || 0);
      }

      // Function call: NAME(...) (dot supported e.g. TOPLA.ÇARPIM, YAZIM.DÜZENİ)
      const fnMatch = expr.match(/^([A-ZÇĞİÖŞÜa-zçğıöşü_.]+)\(([\s\S]*)\)$/);
      if (fnMatch) {
        return evalFunction(fnMatch[1], fnMatch[2]);
      }

      // Single cell ref: A1, B12
      const refMatch = expr.match(/^\$?([A-Z]+)\$?(\d+)$/i);
      if (refMatch) {
        return getCellVal(parseInt(refMatch[2], 10) - 1, excelLetterToColIndex(refMatch[1]));
      }

      // Booleans
      if (expr.toUpperCase() === 'DOĞRU' || expr.toUpperCase() === 'TRUE') return true;
      if (expr.toUpperCase() === 'YANLIŞ' || expr.toUpperCase() === 'FALSE') return false;

      // Pure number
      const num = parseLocaleNumber(expr);
      if (!isNaN(num)) return num;
      return expr;
    }

    return { getCellVal };
  }

  // ==========================================================================
  // 3. SAYI & BİRİM BİÇİMLENDİRME + KOŞULLU BİÇİMLENDİRME RENDERER
  // ==========================================================================
  function formatDisplayValue(val, st) {
    if (val === '' || val == null) return '';
    if (typeof val === 'boolean') return val ? 'DOĞRU' : 'YANLIŞ';
    const fmt = st && st.numFmt ? st.numFmt : '';
    const dec = (st && st.decimals != null) ? Math.max(0, Math.min(6, Number(st.decimals))) : 2;
    const num = parseLocaleNumber(val);

    if (isNaN(num)) return String(val);

    if (!fmt) {
      if (typeof val === 'number') {
        const rounded = Math.round(val * 10000) / 10000;
        return String(rounded).replace('.', ',');
      }
      return String(val);
    }

    const nf = (d) => num.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
    if (fmt === 'number') return nf(dec);
    if (fmt === 'integer') return nf(0);
    if (fmt === 'currency') return `₺${nf(dec)}`;
    if (fmt === 'percent') return `%${nf(dec === 2 ? 1 : dec)}`;
    const unitMap = {
      ohm: ' Ω', amp: ' A', volt: ' V', ma: ' mA', ms: ' ms', ka: ' kA', mm2: ' mm²'
    };
    if (unitMap[fmt]) return `${nf(st.decimals != null ? dec : (Number.isInteger(num) ? 0 : 2))}${unitMap[fmt]}`;
    return String(val);
  }

  function evaluateTableVisuals(tbl, gridMatrix, secId, tIdx, schema) {
    const { getCellVal } = evaluateTableFormulas(gridMatrix);
    const cellStyles = schema.cellStyles || {};
    const showFormulas = Boolean(S().state.showFormulas);

    // 1. Formül ve Sayı Biçimi Uygula
    const computedGrid = [];
    gridMatrix.forEach((rowCells, rIdx) => {
      computedGrid[rIdx] = [];
      rowCells.forEach((cell, cIdx) => {
        const key = cell.dataset.cellKey;
        const raw = cell.dataset.rawValue;
        const st = cellStyles[key] || {};
        if (!S().isCellTextEditable(cell) || raw === undefined) {
          computedGrid[rIdx][cIdx] = raw || '';
          return;
        }
        const isFormula = String(raw).trim().startsWith('=');
        let val = raw;
        if (isFormula) {
          val = getCellVal(rIdx, cIdx);
        }
        computedGrid[rIdx][cIdx] = val;

        if (isFormula || st.numFmt) {
          const display = (isFormula && showFormulas) ? raw : formatDisplayValue(val, st);
          S().setCellDomTextKeepingHandles(cell, display);
          if (isFormula && String(val).startsWith('#')) {
            cell.style.setProperty('color', '#dc2626', 'important');
            cell.style.setProperty('font-weight', '800', 'important');
          }
        }
      });
    });

    // 2. Koşullu Biçimlendirme Kuralları (Excel Data Bars, Color Scales, Icon Sets, Highlights)
    const rules = (schema.conditionalRules || []).filter(r => r.secId === secId);
    if (rules.length === 0) return;

    rules.forEach(rule => {
      const targetCells = [];
      gridMatrix.forEach((rowCells, rIdx) => {
        if (rIdx === 0 && tbl.querySelector('thead')) return; // Başlık satırını atla
        rowCells.forEach((cell, cIdx) => {
          if (cell.tagName === 'TH') return;
          if (rule.cIdx != null && Number(rule.cIdx) !== cIdx) return;
          const v = computedGrid[rIdx]?.[cIdx];
          targetCells.push({ cell, val: v, num: parseLocaleNumber(v) });
        });
      });

      const validNums = targetCells.map(t => t.num).filter(n => !isNaN(n));
      const minN = validNums.length ? Math.min(...validNums) : 0;
      const maxN = validNums.length ? Math.max(...validNums) : 1;
      const span = Math.max(0.0001, maxN - minN);

      targetCells.forEach(({ cell, val, num }) => {
        if (rule.kind === 'gt' && !isNaN(num) && num > Number(rule.threshold)) {
          cell.style.setProperty('background-color', rule.bg || '#fee2e2', 'important');
          cell.style.setProperty('color', rule.color || '#991b1b', 'important');
          cell.style.setProperty('font-weight', '700', 'important');
        } else if (rule.kind === 'lt' && !isNaN(num) && num < Number(rule.threshold)) {
          cell.style.setProperty('background-color', rule.bg || '#dcfce7', 'important');
          cell.style.setProperty('color', rule.color || '#14573a', 'important');
          cell.style.setProperty('font-weight', '700', 'important');
        } else if (rule.kind === 'contains' && rule.text && String(val).toLowerCase().includes(String(rule.text).toLowerCase())) {
          cell.style.setProperty('background-color', rule.bg || '#fef3c7', 'important');
          cell.style.setProperty('color', rule.color || '#92400e', 'important');
          cell.style.setProperty('font-weight', '700', 'important');
        } else if (rule.kind === 'databar' && !isNaN(num) && maxN > 0) {
          const pct = Math.max(4, Math.min(100, (Math.max(0, num) / maxN) * 100));
          cell.classList.add('cf-databar-wrap');
          const bar = document.createElement('span');
          bar.className = 'cf-databar-fill';
          bar.style.width = `${pct.toFixed(1)}%`;
          bar.style.background = rule.param || '#3b82f6';
          cell.prepend(bar);
        } else if (rule.kind === 'colorscale' && !isNaN(num)) {
          const ratio = Math.max(0, Math.min(1, (num - minN) / span));
          const hue = Math.round((1 - ratio) * 120); // 120=yeşil -> 60=sarı -> 0=kırmızı
          cell.style.setProperty('background-color', `hsl(${hue}, 82%, 88%)`, 'important');
          cell.style.setProperty('color', '#0f172a', 'important');
        } else if (rule.kind === 'iconset' && !isNaN(num)) {
          const ratio = (num - minN) / span;
          const ico = ratio >= 0.66 ? { t: '▲', c: '#16a34a' } : (ratio >= 0.33 ? { t: '▶', c: '#d97706' } : { t: '▼', c: '#dc2626' });
          const sp = document.createElement('span');
          sp.className = 'cf-icon-prefix';
          sp.style.color = ico.c;
          sp.textContent = ico.t;
          cell.prepend(sp);
        }
      });
    });
  }

  // ==========================================================================
  // 4. ARALIK SEÇİMİ, PANO (KES/KOPYALA/ÖZEL YAPIŞTIR) & DOLDURMA TUTAMACI
  // ==========================================================================
  function parseCellKeyParts(key) {
    const m = String(key || '').match(/^(.+)::t(\d+)::r(\d+)::c(\d+)$/);
    if (!m) return null;
    return { secId: m[1], tIdx: Number(m[2]), r: Number(m[3]), c: Number(m[4]) };
  }

  function computeCellRangeKeys(keyA, keyB) {
    const a = parseCellKeyParts(keyA);
    const b = parseCellKeyParts(keyB);
    if (!a || !b || a.secId !== b.secId || a.tIdx !== b.tIdx) return [keyB];
    const rMin = Math.min(a.r, b.r), rMax = Math.max(a.r, b.r);
    const cMin = Math.min(a.c, b.c), cMax = Math.max(a.c, b.c);
    const out = [];
    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        const k = `${a.secId}::t${a.tIdx}::r${r}::c${c}`;
        if (document.querySelector(`[data-cell-key="${CSS.escape(k)}"]`)) out.push(k);
      }
    }
    return out;
  }

  function updateSelectionStats() {
    const el = document.getElementById('statusSelectionStats');
    if (!el) return;
    const keys = S().getSelectedCellKeys();
    if (keys.length < 2) {
      el.classList.add('hidden');
      return;
    }
    const nums = [];
    let nonEmpty = 0;
    keys.forEach(k => {
      const td = document.querySelector(`[data-cell-key="${CSS.escape(k)}"]`);
      if (!td) return;
      const txt = S().getCellEditableText(td).trim();
      if (txt) nonEmpty++;
      const n = parseLocaleNumber(txt);
      if (!isNaN(n)) nums.push(n);
    });
    if (nums.length > 0) {
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = sum / nums.length;
      el.textContent = `Sayı: ${nonEmpty} · Toplam: ${sum.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} · Ort: ${avg.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
    } else {
      el.textContent = `Seçili: ${keys.length} hücre (${nonEmpty} dolu)`;
    }
    el.classList.remove('hidden');
  }

  function attachFillHandle(cellEl, key) {
    const h = document.createElement('div');
    h.className = 'a4-fill-handle';
    h.title = 'Aşağı sürükleyerek değeri veya seriyi doldurun (Excel Fill Handle)';
    h.addEventListener('click', e => e.stopPropagation());
    h.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const startP = parseCellKeyParts(key);
      if (!startP) return;
      let targetKeys = [key];

      const onMove = (me) => {
        const over = document.elementFromPoint(me.clientX, me.clientY)?.closest('td[data-cell-key], th[data-cell-key]');
        if (!over || !over.dataset.cellKey) return;
        const p = parseCellKeyParts(over.dataset.cellKey);
        if (!p || p.secId !== startP.secId || p.tIdx !== startP.tIdx) return;
        targetKeys = computeCellRangeKeys(key, over.dataset.cellKey);
        S().state.selectedCellRange = targetKeys;
        S().applySelectionHighlightDom();
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        if (targetKeys.length > 1) {
          fillRangeFromFirst(targetKeys, true);
        }
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
    cellEl.appendChild(h);
  }

  function incrementSeriesText(baseText, step) {
    const raw = String(baseText == null ? '' : baseText).trim();
    if (!raw || step === 0) return raw;
    if (/^-?\d+$/.test(raw)) return String(parseInt(raw, 10) + step);
    const trailing = raw.match(/^(.*?)(\d+)$/);
    if (trailing) {
      return `${trailing[1]}${parseInt(trailing[2], 10) + step}`;
    }
    return raw;
  }

  function fillRangeFromFirst(keys, smartSeries) {
    if (!keys || keys.length < 2) return;
    const srcEl = document.querySelector(`[data-cell-key="${CSS.escape(keys[0])}"]`);
    if (!srcEl || !S().isCellTextEditable(srcEl)) return;
    const srcText = srcEl.dataset.rawValue !== undefined ? srcEl.dataset.rawValue : S().getCellEditableText(srcEl);
    const srcStyle = S().state.schema.cellStyles[keys[0]];
    S().pushUndoSnapshot();
    keys.forEach((k, idx) => {
      if (idx === 0) return;
      const td = document.querySelector(`[data-cell-key="${CSS.escape(k)}"]`);
      if (!td || !S().isCellTextEditable(td)) return;
      const nextVal = smartSeries ? incrementSeriesText(srcText, idx) : srcText;
      S().applyCellTextToModel(k, nextVal, td);
      if (srcStyle) S().state.schema.cellStyles[k] = Object.assign({}, srcStyle);
    });
    S().renderAll();
    S().showToast(`${keys.length - 1} hücre dolduruldu`);
  }

  function copySelectedToClipboard(isCut) {
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce kopyalanacak hücreleri seçin');
    const parsed = keys.map(k => ({ k, p: parseCellKeyParts(k) })).filter(x => x.p);
    if (parsed.length === 0) return;
    const rMin = Math.min(...parsed.map(x => x.p.r));
    const rMax = Math.max(...parsed.map(x => x.p.r));
    const cMin = Math.min(...parsed.map(x => x.p.c));
    const cMax = Math.max(...parsed.map(x => x.p.c));
    const base = parsed[0].p;

    const matrix = [];
    const tsvLines = [];
    for (let r = rMin; r <= rMax; r++) {
      const rowArr = [];
      const tsvRow = [];
      for (let c = cMin; c <= cMax; c++) {
        const k = `${base.secId}::t${base.tIdx}::r${r}::c${c}`;
        const el = document.querySelector(`[data-cell-key="${CSS.escape(k)}"]`);
        const raw = el ? (el.dataset.rawValue !== undefined ? el.dataset.rawValue : S().getCellEditableText(el)) : '';
        const display = el ? S().getCellEditableText(el) : '';
        const style = S().state.schema.cellStyles[k] ? Object.assign({}, S().state.schema.cellStyles[k]) : null;
        rowArr.push({ raw, display, style });
        tsvRow.push(display.replace(/\t/g, ' ').replace(/\r?\n/g, ' '));
      }
      matrix.push(rowArr);
      tsvLines.push(tsvRow.join('\t'));
    }

    const plainTsv = tsvLines.join('\n');
    OfficeState.clipboard = { rows: matrix, isCut: Boolean(isCut), sourceKeys: keys.slice(), lastPlainTsv: plainTsv };
    try { navigator.clipboard?.writeText(plainTsv); } catch (_) {}
    S().showToast(isCut ? `${keys.length} hücre kesildi` : `${keys.length} hücre kopyalandı (Excel uyumlu)`);
  }

  window.officeClipboardCopy = () => copySelectedToClipboard(false);
  window.officeClipboardCut = () => copySelectedToClipboard(true);

  window.officeClipboardPaste = function (mode = 'all') {
    officeCloseAllPopovers();
    const anchorKey = S().state.selectedCellKey;
    if (!anchorKey) return S().showToast('Yapıştırmak için hedef hücre seçin');
    const clip = OfficeState.clipboard;
    if (!clip || !clip.rows || clip.rows.length === 0) {
      return S().showToast('Pano boş — önce Ctrl+C ile hücre kopyalayın');
    }
    const start = parseCellKeyParts(anchorKey);
    if (!start) return;

    let rows = clip.rows;
    if (mode === 'transpose') {
      const h = rows.length, w = rows[0].length;
      const trans = [];
      for (let c = 0; c < w; c++) {
        const nr = [];
        for (let r = 0; r < h; r++) nr.push(rows[r][c]);
        trans.push(nr);
      }
      rows = trans;
    }

    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    let count = 0;
    rows.forEach((rArr, dr) => {
      rArr.forEach((item, dc) => {
        const targetKey = `${start.secId}::t${start.tIdx}::r${start.r + dr}::c${start.c + dc}`;
        const el = document.querySelector(`[data-cell-key="${CSS.escape(targetKey)}"]`);
        if (!el) return;
        if (mode !== 'formats' && S().isCellTextEditable(el)) {
          const textVal = mode === 'values' ? item.display : (mode === 'formulas' ? (String(item.raw).startsWith('=') ? item.raw : item.display) : item.raw);
          S().applyCellTextToModel(targetKey, textVal, el);
        }
        if ((mode === 'all' || mode === 'formats' || mode === 'transpose') && item.style) {
          S().state.schema.cellStyles[targetKey] = Object.assign({}, item.style);
        }
        count++;
      });
    });

    if (clip.isCut) {
      clip.sourceKeys.forEach(sk => {
        const el = document.querySelector(`[data-cell-key="${CSS.escape(sk)}"]`);
        if (el && S().isCellTextEditable(el)) S().applyCellTextToModel(sk, '', el);
      });
      clip.isCut = false;
    }

    S().renderAll();
    S().showToast(`${count} hücreye yapıştırıldı`);
  };

  window.officeFillDirection = function (dir) {
    officeCloseAllPopovers();
    const keys = S().getSelectedCellKeys();
    if (keys.length >= 2) return fillRangeFromFirst(keys, false);
    const cur = parseCellKeyParts(S().state.selectedCellKey);
    if (!cur) return S().showToast('Önce bir hücre veya aralık seçin');
    const prevKey = dir === 'down'
      ? `${cur.secId}::t${cur.tIdx}::r${cur.r - 1}::c${cur.c}`
      : `${cur.secId}::t${cur.tIdx}::r${cur.r}::c${cur.c - 1}`;
    const prevEl = document.querySelector(`[data-cell-key="${CSS.escape(prevKey)}"]`);
    const curEl = document.querySelector(`[data-cell-key="${CSS.escape(S().state.selectedCellKey)}"]`);
    if (!prevEl || !curEl || !S().isCellTextEditable(curEl)) return S().showToast('Doldurulacak kaynak hücre bulunamadı');
    S().pushUndoSnapshot();
    const val = prevEl.dataset.rawValue !== undefined ? prevEl.dataset.rawValue : S().getCellEditableText(prevEl);
    S().applyCellTextToModel(S().state.selectedCellKey, val, curEl);
    S().renderAll();
    S().showToast(dir === 'down' ? 'Üstteki hücreden aşağı dolduruldu' : 'Soldaki hücreden sağa dolduruldu');
  };

  window.officeAutoFillSeriesDown = function () {
    officeCloseAllPopovers();
    const keys = S().getSelectedCellKeys();
    if (keys.length >= 2) return fillRangeFromFirst(keys, true);
    const cur = parseCellKeyParts(S().state.selectedCellKey);
    if (!cur) return S().showToast('Önce seri başlangıç hücresini seçin');
    const colKeys = [];
    for (let r = cur.r; r < cur.r + 30; r++) {
      const k = `${cur.secId}::t${cur.tIdx}::r${r}::c${cur.c}`;
      if (document.querySelector(`[data-cell-key="${CSS.escape(k)}"]`)) colKeys.push(k);
      else break;
    }
    if (colKeys.length < 2) return S().showToast('Aşağıda doldurulacak satır bulunamadı');
    fillRangeFromFirst(colKeys, true);
  };

  window.officeClearSelection = function (mode) {
    officeCloseAllPopovers();
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce hücre seçin');
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    keys.forEach(k => {
      if (mode === 'all' || mode === 'formats') {
        delete S().state.schema.cellStyles[k];
      }
      if (mode === 'all' || mode === 'contents') {
        const el = document.querySelector(`[data-cell-key="${CSS.escape(k)}"]`);
        if (el && S().isCellTextEditable(el)) S().applyCellTextToModel(k, '', el);
      }
    });
    S().renderAll();
    S().showToast(mode === 'formats' ? 'Biçimler temizlendi' : (mode === 'contents' ? 'İçerik temizlendi' : 'Hücreler tamamen temizlendi'));
  };

  window.officeMergeOrUnmergeCells = function () {
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Birleştirmek için Shift+Tıkla ile birden fazla hücre seçin');
    S().ensureStyleDefaults(S().state.schema);
    const merges = S().state.schema.cellMerges;
    const firstKey = keys[0];

    if (merges[firstKey]) {
      S().pushUndoSnapshot();
      delete merges[firstKey];
      S().renderAll();
      return S().showToast('Hücre birleştirmesi ayrıldı');
    }

    if (keys.length < 2) {
      return S().showToast('Hücre birleştirmek için Shift tuşuna basılı tutarak en az 2 komşu hücre seçin');
    }
    const pts = keys.map(parseCellKeyParts).filter(Boolean);
    const sameTbl = pts.every(p => p.secId === pts[0].secId && p.tIdx === pts[0].tIdx);
    if (!sameTbl) return S().showToast('Yalnızca aynı tablo içindeki komşu hücreler birleştirilebilir');

    const rMin = Math.min(...pts.map(p => p.r)), rMax = Math.max(...pts.map(p => p.r));
    const cMin = Math.min(...pts.map(p => p.c)), cMax = Math.max(...pts.map(p => p.c));
    const topLeftKey = `${pts[0].secId}::t${pts[0].tIdx}::r${rMin}::c${cMin}`;

    S().pushUndoSnapshot();
    // Birleştirilen hücrelerdeki dolu metinleri kaybetmeden üst-sol hücrede koru
    const topLeftEl = document.querySelector(`[data-cell-key="${CSS.escape(topLeftKey)}"]`);
    if (topLeftEl && S().isCellTextEditable(topLeftEl)) {
      const topText = topLeftEl.dataset.rawValue !== undefined ? topLeftEl.dataset.rawValue : S().getCellEditableText(topLeftEl);
      if (!topText.trim()) {
        const joined = keys.map(k => {
          const el = document.querySelector(`[data-cell-key="${CSS.escape(k)}"]`);
          return el && S().isCellTextEditable(el) ? (el.dataset.rawValue || S().getCellEditableText(el)).trim() : '';
        }).filter(Boolean).join(' ');
        if (joined) S().applyCellTextToModel(topLeftKey, joined, topLeftEl);
      }
    }
    merges[topLeftKey] = { colspan: cMax - cMin + 1, rowspan: rMax - rMin + 1 };
    if (!S().state.schema.cellStyles[topLeftKey]) S().state.schema.cellStyles[topLeftKey] = {};
    S().state.schema.cellStyles[topLeftKey].align = 'center';
    S().state.schema.cellStyles[topLeftKey].valign = 'middle';
    S().state.selectedCellKey = topLeftKey;
    S().state.selectedCellRange = [topLeftKey];
    S().renderAll();
    S().showToast(`${(cMax - cMin + 1)}×${(rMax - rMin + 1)} hücre birleştirildi ve ortalandı`);
  };

  // ==========================================================================
  // 5. POPOVER YÖNETİMİ, RENKLER, KENARLIKLAR, HARF DÜZENİ, SAYI BİÇİMİ & STİLLER
  // ==========================================================================
  window.officeCloseAllPopovers = function () {
    document.querySelectorAll('.office-popover').forEach(p => p.classList.add('hidden'));
    OfficeState.activePopoverId = null;
  };

  window.officeTogglePopover = function (popId, triggerEl, ev) {
    if (ev) ev.stopPropagation();
    officeCloseContextMenu();
    const pop = document.getElementById(popId);
    if (!pop) return;
    const alreadyOpen = !pop.classList.contains('hidden');
    officeCloseAllPopovers();
    if (alreadyOpen) return;

    pop.classList.remove('hidden');
    OfficeState.activePopoverId = popId;
    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      const pw = pop.offsetWidth || 220;
      const ph = pop.offsetHeight || 220;
      let left = Math.min(window.innerWidth - pw - 10, Math.max(8, rect.left));
      let top = rect.bottom + 4;
      if (top + ph > window.innerHeight - 10) top = Math.max(8, rect.top - ph - 4);
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
    }
  };

  window.officeOpenColorPopover = function (mode, triggerEl, ev) {
    OfficeState.colorTargetMode = mode;
    const title = document.getElementById('popColorTitle');
    if (title) {
      title.textContent = mode === 'bg' ? 'Dolgu Rengi (Tema Renkleri)' : (mode === 'color' ? 'Yazı Tipi Rengi' : 'A4 Sayfa Rengi');
    }
    officeTogglePopover('popColorPicker', triggerEl, ev);
  };

  window.officeApplyLastColor = function (mode) {
    const col = mode === 'bg' ? OfficeState.lastBgColor : OfficeState.lastFontColor;
    window.applyCellStyleProp(mode, col);
  };

  window.officeSelectPaletteColor = function (hex, keepOpen) {
    const mode = OfficeState.colorTargetMode;
    if (mode === 'pageColor') {
      officeUpdateDesign('pageColor', hex || '#ffffff');
    } else if (mode === 'bg') {
      if (hex) {
        OfficeState.lastBgColor = hex;
        const bar = document.getElementById('csrBgBar');
        if (bar) bar.style.background = hex;
      }
      window.applyCellStyleProp('bg', hex);
    } else if (mode === 'color') {
      if (hex) {
        OfficeState.lastFontColor = hex;
        const bar = document.getElementById('csrColorBar');
        if (bar) bar.style.background = hex;
      }
      window.applyCellStyleProp('color', hex);
    }
    if (!keepOpen) officeCloseAllPopovers();
  };

  window.officeApplyCellBorder = function (preset) {
    officeCloseAllPopovers();
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce kenarlık uygulanacak hücreleri seçin');
    const col = document.getElementById('popBorderColor')?.value || '#0f172a';
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    const clearSides = (st) => { delete st.border; delete st.borderTop; delete st.borderBottom; delete st.borderLeft; delete st.borderRight; };

    keys.forEach(k => {
      if (!S().state.schema.cellStyles[k]) S().state.schema.cellStyles[k] = {};
      const st = S().state.schema.cellStyles[k];
      if (preset === 'none') { clearSides(st); st.border = 'none'; }
      else if (preset === 'all') { clearSides(st); st.border = `1px solid ${col}`; }
      else if (preset === 'outside') { clearSides(st); st.border = `1.5px solid ${col}`; }
      else if (preset === 'thick') { clearSides(st); st.border = `2px solid ${col}`; }
      else if (preset === 'dashed') { clearSides(st); st.border = `1px dashed ${col}`; }
      else if (preset === 'bottom') { st.borderBottom = `1.5px solid ${col}`; }
      else if (preset === 'top') { st.borderTop = `1.5px solid ${col}`; }
      else if (preset === 'left') { st.borderLeft = `1.5px solid ${col}`; }
      else if (preset === 'right') { st.borderRight = `1.5px solid ${col}`; }
      else if (preset === 'doubleBottom') { st.borderBottom = `3px double ${col}`; }
    });
    S().renderAll();
    S().showToast('Kenarlık uygulandı');
  };

  window.officeTransformTextCase = function (mode) {
    officeCloseAllPopovers();
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce bir hücre seçin');
    S().pushUndoSnapshot();
    keys.forEach(k => {
      const el = document.querySelector(`[data-cell-key="${CSS.escape(k)}"]`);
      if (!el || !S().isCellTextEditable(el)) return;
      const txt = el.dataset.rawValue !== undefined ? el.dataset.rawValue : S().getCellEditableText(el);
      let out = txt;
      if (mode === 'upper') out = txt.toLocaleUpperCase('tr-TR');
      else if (mode === 'lower') out = txt.toLocaleLowerCase('tr-TR');
      else if (mode === 'sentence') out = txt.toLocaleLowerCase('tr-TR').replace(/(^\s*\S|[.!?]\s+\S)/g, m => m.toLocaleUpperCase('tr-TR'));
      else if (mode === 'title') out = txt.toLocaleLowerCase('tr-TR').replace(/(^|\s)\S/g, m => m.toLocaleUpperCase('tr-TR'));
      S().applyCellTextToModel(k, out, el);
    });
    S().renderAll();
    S().showToast('Harf düzeni güncellendi');
  };

  window.officeToggleWrapText = function () {
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce bir hücre seçin');
    const cur = S().state.schema.cellStyles[keys[0]]?.wrapText !== false;
    window.applyCellStyleProp('wrapText', cur ? false : true);
    S().showToast(cur ? 'Metni kaydırma kapatıldı' : 'Metni kaydırma açıldı');
  };

  window.officeCycleTextOrientation = function () {
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce bir hücre seçin');
    const cur = S().state.schema.cellStyles[keys[0]]?.orientation || '';
    window.applyCellStyleProp('orientation', cur === 'vertical' ? '' : 'vertical');
    S().showToast(cur === 'vertical' ? 'Yatay metin yönü' : 'Dikey (90°) metin yönü');
  };

  window.officeApplyNumberFormat = function (fmt) {
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce sayı biçimi uygulanacak hücre seçin');
    window.applyCellStyleProp('numFmt', fmt);
  };

  window.officeStepDecimals = function (delta) {
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce bir hücre seçin');
    S().ensureStyleDefaults(S().state.schema);
    const cur = Number(S().state.schema.cellStyles[keys[0]]?.decimals ?? 2);
    const next = Math.max(0, Math.min(6, cur + delta));
    S().pushUndoSnapshot();
    keys.forEach(k => {
      if (!S().state.schema.cellStyles[k]) S().state.schema.cellStyles[k] = {};
      if (!S().state.schema.cellStyles[k].numFmt) S().state.schema.cellStyles[k].numFmt = 'number';
      S().state.schema.cellStyles[k].decimals = next;
    });
    S().renderAll();
    S().showToast(`Ondalık basamak: ${next}`);
  };

  window.officeApplyQuickCellStyle = function (preset) {
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce stil uygulanacak hücreleri seçin');
    const styles = {
      normal: {},
      heading1: { bold: true, fontSize: 9, color: '#1b365d', bg: '#eff6ff' },
      good: { bold: true, color: '#14573a', bg: '#dcfce7' },
      bad: { bold: true, color: '#991b1b', bg: '#fee2e2' },
      warn: { bold: true, color: '#92400e', bg: '#fef3c7' },
      total: { bold: true, color: '#0f172a', bg: '#f8fafc', borderTop: '1.5px solid #0f172a', borderBottom: '3px double #0f172a' }
    };
    const chosen = styles[preset] || {};
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    keys.forEach(k => {
      if (preset === 'normal') delete S().state.schema.cellStyles[k];
      else S().state.schema.cellStyles[k] = Object.assign({}, chosen);
    });
    S().renderAll();
    S().showToast('Stil uygulandı');
  };

  // ==========================================================================
  // 6. KOŞULLU BİÇİMLENDİRME (CONDITIONAL FORMATTING)
  // ==========================================================================
  window.officeOpenCondRuleModal = function (op) {
    officeCloseAllPopovers();
    const sec = S().getSelectedSection();
    if (!sec) return S().showToast('Önce bir tablo veya hücre seçin');
    OfficeState.condRuleOp = op;
    const body = document.getElementById('condRuleModalBody');
    const titleMap = { gt: 'Büyüktür (>)', lt: 'Küçüktür (<)', contains: 'Metin İçerir' };
    body.innerHTML = `
      <div class="st-field">
        <label class="st-label">Kural Türü: <strong>${titleMap[op] || op}</strong></label>
        <input id="cfRuleValue" class="st-input" placeholder="${op === 'contains' ? 'Örn: X veya Uygun Değil' : 'Örn: 50 veya 2.0'}" value="${op === 'contains' ? 'X' : '50'}">
      </div>
      <div class="st-grid-2">
        <div class="st-field">
          <label class="st-label">Vurgu Dolgu Rengi</label>
          <input id="cfRuleBg" type="color" class="st-input" style="height:34px;padding:2px;" value="${op === 'lt' ? '#dcfce7' : '#fee2e2'}">
        </div>
        <div class="st-field">
          <label class="st-label">Yazı Rengi</label>
          <input id="cfRuleColor" type="color" class="st-input" style="height:34px;padding:2px;" value="${op === 'lt' ? '#14573a' : '#991b1b'}">
        </div>
      </div>
    `;
    document.getElementById('condRuleModal').classList.remove('hidden');
  };

  window.officeSaveCondRuleModal = function () {
    const sec = S().getSelectedSection();
    if (!sec) return;
    const val = document.getElementById('cfRuleValue')?.value || '';
    const bg = document.getElementById('cfRuleBg')?.value || '#fee2e2';
    const color = document.getElementById('cfRuleColor')?.value || '#991b1b';
    const p = parseCellKeyParts(S().state.selectedCellKey);
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    S().state.schema.conditionalRules.push({
      id: S().uid('cf'),
      secId: sec.id,
      cIdx: p ? p.c : null,
      kind: OfficeState.condRuleOp,
      threshold: parseLocaleNumber(val) || 0,
      text: val,
      bg,
      color
    });
    window.closeModal('condRuleModal');
    S().renderAll();
    S().showToast('Koşullu biçimlendirme kuralı eklendi');
  };

  window.officeAddVisualCondRule = function (kind, param) {
    officeCloseAllPopovers();
    const sec = S().getSelectedSection();
    if (!sec) return S().showToast('Önce bir tablo hücresi seçin');
    const p = parseCellKeyParts(S().state.selectedCellKey);
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    S().state.schema.conditionalRules.push({
      id: S().uid('cf'),
      secId: sec.id,
      cIdx: p ? p.c : null,
      kind,
      param
    });
    S().renderAll();
    S().showToast(kind === 'databar' ? 'Veri çubuğu eklendi' : (kind === 'colorscale' ? 'Renk ölçeği eklendi' : 'Simge kümesi eklendi'));
  };

  window.officeClearCondRulesForTable = function () {
    officeCloseAllPopovers();
    const sec = S().getSelectedSection();
    if (!sec) return;
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    S().state.schema.conditionalRules = S().state.schema.conditionalRules.filter(r => r.secId !== sec.id);
    S().renderAll();
    S().showToast('Tablodaki koşullu biçim kuralları temizlendi');
  };

  // ==========================================================================
  // 7. SATIR / SÜTUN İŞLEMLERİ, TABLO TASARIMI, SIRALAMA, OTO FİLTRE & VERİ ARAÇLARI
  // ==========================================================================
  function getSelectedDataTableContext() {
    const sec = S().getSelectedSection();
    if (!sec || sec.type !== 'data_table') return null;
    const key = S().state.selectedCellKey;
    const cell = key ? document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`) : null;
    let rIdx = sec.rows.length - 1;
    let colIdx = 0;
    if (cell) {
      const bind = cell.dataset.bind || '';
      if (bind.startsWith('dt_cell:')) {
        const parts = bind.split(':');
        rIdx = Number(parts[2]);
        colIdx = Math.max(0, sec.columns.findIndex(c => c.id === parts[3]));
      } else if (bind.startsWith('dt_col:')) {
        colIdx = Number(bind.split(':')[2]);
      } else if (cell.dataset.dtCol) {
        colIdx = Math.max(0, sec.columns.findIndex(c => c.id === cell.dataset.dtCol));
        const tr = cell.closest('tr[data-dt-row]');
        if (tr) rIdx = Number(tr.dataset.dtRow);
      }
    }
    return { sec, rIdx: Math.max(0, Math.min(sec.rows.length - 1, rIdx)), colIdx: Math.max(0, Math.min(sec.columns.length - 1, colIdx)) };
  }

  window.officeInsertRowRelative = function (offset) {
    officeCloseAllPopovers();
    const ctx = getSelectedDataTableContext();
    if (!ctx) return window.quickInsertTableRow();
    S().pushUndoSnapshot();
    const row = {};
    ctx.sec.columns.forEach(c => { row[c.id] = c.type === 'symbol' ? '✓' : ''; });
    const pos = offset < 0 ? ctx.rIdx : ctx.rIdx + 1;
    ctx.sec.rows.splice(pos, 0, row);
    S().renderAll();
    S().showToast(offset < 0 ? 'Üste yeni satır eklendi' : 'Alta yeni satır eklendi');
  };

  window.officeDeleteSelectedRow = function () {
    officeCloseAllPopovers();
    const ctx = getSelectedDataTableContext();
    if (!ctx) return S().showToast('Satır silmek için bir ölçüm tablosunda hücre seçin');
    if (ctx.sec.rows.length <= 1) return S().showToast('Tabloda en az 1 satır kalmalıdır');
    S().pushUndoSnapshot();
    ctx.sec.rows.splice(ctx.rIdx, 1);
    S().renderAll();
    S().showToast('Seçili satır silindi');
  };

  window.officeInsertColRelative = function (offset) {
    officeCloseAllPopovers();
    const ctx = getSelectedDataTableContext();
    if (!ctx) return S().showToast('Sütun eklemek için bir ölçüm tablosunda hücre seçin');
    S().pushUndoSnapshot();
    const id = S().uid('c');
    const pos = offset < 0 ? ctx.colIdx : ctx.colIdx + 1;
    ctx.sec.columns.splice(pos, 0, { id, label: 'Yeni Sütun', group: '', width: 10, type: 'text', align: 'center' });
    ctx.sec.rows.forEach(r => { r[id] = ''; });
    S().renderAll();
    S().showToast(offset < 0 ? 'Sola yeni sütun eklendi' : 'Sağa yeni sütun eklendi');
  };

  window.officeDeleteSelectedCol = function () {
    officeCloseAllPopovers();
    const ctx = getSelectedDataTableContext();
    if (!ctx) return S().showToast('Sütun silmek için bir ölçüm tablosunda hücre seçin');
    if (ctx.sec.columns.length <= 1) return S().showToast('Tabloda en az 1 sütun kalmalıdır');
    S().pushUndoSnapshot();
    const rem = ctx.sec.columns.splice(ctx.colIdx, 1)[0];
    if (rem) ctx.sec.rows.forEach(r => delete r[rem.id]);
    S().renderAll();
    S().showToast(`"${rem?.label || 'Sütun'}" silindi`);
  };

  window.officeDistributeColsEvenly = function () {
    officeCloseAllPopovers();
    const ctx = getSelectedDataTableContext();
    if (!ctx) return S().showToast('Önce bir ölçüm tablosu seçin');
    S().pushUndoSnapshot();
    const remW = 100 - (ctx.sec.showNoCol ? Number(ctx.sec.noColWidth || 4) : 0);
    const each = Math.round((remW / ctx.sec.columns.length) * 10) / 10;
    ctx.sec.columns.forEach(c => { c.width = each; });
    S().renderAll();
    S().showToast('Tüm sütun genişlikleri eşit dağıtıldı');
  };

  window.officeSetTableOption = function (optKey, val) {
    const sec = S().getSelectedSection();
    if (!sec || sec.type !== 'data_table') return S().showToast('Önce bir ölçüm tablosu seçin');
    S().pushUndoSnapshot();
    if (!sec.tableOptions) sec.tableOptions = {};
    sec.tableOptions[optKey] = Boolean(val);
    S().renderAll();
  };

  window.officeApplyTablePreset = function (preset) {
    officeCloseAllPopovers();
    const sec = S().getSelectedSection();
    if (!sec || sec.type !== 'data_table') return S().showToast('Önce bir ölçüm tablosu seçin');
    S().pushUndoSnapshot();
    sec.tablePreset = preset;
    S().renderAll();
    S().showToast('Tablo stili uygulandı');
  };

  window.officeToggleTotalRow = function (force) {
    const sec = S().getSelectedSection();
    if (!sec || sec.type !== 'data_table') return S().showToast('Önce bir ölçüm tablosu seçin');
    S().pushUndoSnapshot();
    sec.showTotalRow = typeof force === 'boolean' ? force : !sec.showTotalRow;
    S().renderAll();
    S().showToast(sec.showTotalRow ? 'Otomatik Toplam Satırı eklendi' : 'Toplam Satırı kaldırıldı');
  };

  window.officeSortTableBySelectedCol = function (dir) {
    officeCloseAllPopovers();
    const ctx = getSelectedDataTableContext();
    if (!ctx) return S().showToast('Sıralamak için bir ölçüm tablosunda sütun seçin');
    const col = ctx.sec.columns[ctx.colIdx];
    S().pushUndoSnapshot();
    ctx.sec.rows.sort((a, b) => {
      const va = String(a[col.id] == null ? '' : a[col.id]).trim();
      const vb = String(b[col.id] == null ? '' : b[col.id]).trim();
      const na = parseLocaleNumber(va), nb = parseLocaleNumber(vb);
      const cmp = (!isNaN(na) && !isNaN(nb)) ? (na - nb) : va.localeCompare(vb, 'tr');
      return dir === 'desc' ? -cmp : cmp;
    });
    S().renderAll();
    S().showToast(`"${col.label}" sütunu ${dir === 'asc' ? 'A→Z' : 'Z→A'} sıralandı`);
  };

  window.officeToggleAutoFilter = function (force) {
    officeCloseAllPopovers();
    const sec = S().getSelectedSection();
    if (!sec || sec.type !== 'data_table') return S().showToast('Otomatik Filtre için bir ölçüm tablosu seçin');
    S().pushUndoSnapshot();
    sec.autoFilter = typeof force === 'boolean' ? force : !sec.autoFilter;
    if (!sec.autoFilter) delete S().state.tableFilters[sec.id];
    S().renderAll();
    S().showToast(sec.autoFilter ? 'Otomatik Filtre düğmeleri açıldı' : 'Otomatik Filtre kapatıldı');
  };

  window.officeOpenHeaderFilter = function (secId, colId, btnEl, ev) {
    if (ev) ev.stopPropagation();
    const sec = S().state.schema.sections.find(x => x.id === secId);
    if (!sec) return;
    const col = sec.columns.find(c => c.id === colId);
    const uniqueVals = Array.from(new Set((sec.rows || []).map(r => String(r[colId] == null ? '' : r[colId]).trim())));
    const activeSet = S().state.tableFilters[secId]?.[colId] || null;
    const pop = document.getElementById('popHeaderFilter');
    if (!pop) return;

    pop.innerHTML = `
      <div class="pop-title">Filtre: ${S().escapeHtml(col?.label || colId)}</div>
      <div style="max-height:190px;overflow-y:auto;padding:4px 6px;">
        ${uniqueVals.map((v, i) => `
          <label class="rb-check-row" style="display:flex;padding:3px 2px;">
            <input type="checkbox" class="hf-chk" value="${S().escapeHtml(v)}" ${!activeSet || activeSet.has(v) ? 'checked' : ''}>
            <span>${S().escapeHtml(v || '(Boş)')}</span>
          </label>
        `).join('')}
      </div>
      <div class="pop-sep"></div>
      <div style="display:flex;gap:5px;padding:4px 6px;">
        <button type="button" class="rb-btn bordered" style="flex:1;" onclick="officeClearColFilter('${secId}', '${colId}')">Tümü</button>
        <button type="button" class="rb-btn bordered" style="flex:1;background:#107c41;color:#fff;border-color:#107c41;" onclick="officeApplyHeaderFilter('${secId}', '${colId}')">Uygula</button>
      </div>
    `;
    officeTogglePopover('popHeaderFilter', btnEl, ev);
  };

  window.officeApplyHeaderFilter = function (secId, colId) {
    const chks = Array.from(document.querySelectorAll('#popHeaderFilter .hf-chk'));
    const checkedVals = new Set(chks.filter(c => c.checked).map(c => c.value));
    if (!S().state.tableFilters[secId]) S().state.tableFilters[secId] = {};
    if (checkedVals.size === chks.length) delete S().state.tableFilters[secId][colId];
    else S().state.tableFilters[secId][colId] = checkedVals;
    officeCloseAllPopovers();
    S().renderAll();
  };

  window.officeClearColFilter = function (secId, colId) {
    if (S().state.tableFilters[secId]) delete S().state.tableFilters[secId][colId];
    officeCloseAllPopovers();
    S().renderAll();
  };

  window.officeClearTableFilters = function () {
    officeCloseAllPopovers();
    S().state.tableFilters = {};
    S().renderAll();
    S().showToast('Tüm tablo filtreleri temizlendi');
  };

  window.officeRemoveDuplicates = function () {
    const ctx = getSelectedDataTableContext();
    if (!ctx) return S().showToast('Önce bir ölçüm tablosu seçin');
    const seen = new Set();
    const nextRows = [];
    ctx.sec.rows.forEach(r => {
      const sig = ctx.sec.columns.map(c => String(r[c.id] || '').trim()).join('||');
      if (!seen.has(sig)) {
        seen.add(sig);
        nextRows.push(r);
      }
    });
    const removed = ctx.sec.rows.length - nextRows.length;
    if (removed === 0) return S().showToast('Yinelenen satır bulunamadı');
    S().pushUndoSnapshot();
    ctx.sec.rows = nextRows;
    S().renderAll();
    S().showToast(`${removed} yinelenen satır kaldırıldı`);
  };

  window.officeOpenTextToColsModal = function () {
    if (!getSelectedDataTableContext()) return S().showToast('Önce bir ölçüm tablosunda sütun seçin');
    document.getElementById('textToColsModal').classList.remove('hidden');
  };

  window.officeRunTextToCols = function () {
    const ctx = getSelectedDataTableContext();
    if (!ctx) return;
    const delim = document.getElementById('ttcDelimiter')?.value || '/';
    const col = ctx.sec.columns[ctx.colIdx];
    const newId = S().uid('c');
    S().pushUndoSnapshot();
    ctx.sec.columns.splice(ctx.colIdx + 1, 0, { id: newId, label: `${col.label} (2)`, group: col.group || '', width: Math.max(5, Math.round((col.width / 2) * 10) / 10), type: 'text', align: col.align || 'center' });
    col.width = Math.max(5, Math.round((col.width / 2) * 10) / 10);
    ctx.sec.rows.forEach(r => {
      const parts = String(r[col.id] || '').split(delim);
      r[col.id] = (parts[0] || '').trim();
      r[newId] = parts.slice(1).join(delim).trim();
    });
    window.closeModal('textToColsModal');
    S().renderAll();
    S().showToast('Metin sütunlara bölündü');
  };

  window.officeExportTableCsv = function () {
    const ctx = getSelectedDataTableContext();
    if (!ctx) return S().showToast('CSV indirmek için bir ölçüm tablosu seçin');
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const lines = [ctx.sec.columns.map(c => esc(c.label)).join(';')];
    ctx.sec.rows.forEach(r => lines.push(ctx.sec.columns.map(c => esc(r[c.id])).join(';')));
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${S().getSectionDisplayName(ctx.sec).slice(0, 32).replace(/[^a-zA-Z0-9_-]+/g, '_')}.csv`;
    a.click();
    S().showToast('Tablo Excel uyumlu CSV olarak indirildi');
  };

  window.officeImportCsvFile = function (input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const ctx = getSelectedDataTableContext();
    if (!ctx) { input.value = ''; return S().showToast('CSV almak için önce bir ölçüm tablosu seçin'); }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '').replace(/^\uFEFF/, '');
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length === 0) return;
      const delim = lines[0].includes(';') ? ';' : (lines[0].includes('\t') ? '\t' : ',');
      const parseLine = (l) => l.split(delim).map(s => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      S().pushUndoSnapshot();
      const startIdx = lines.length > 1 ? 1 : 0;
      const added = [];
      for (let i = startIdx; i < lines.length; i++) {
        const vals = parseLine(lines[i]);
        const row = {};
        ctx.sec.columns.forEach((c, ci) => { row[c.id] = vals[ci] || ''; });
        added.push(row);
      }
      ctx.sec.rows.push(...added);
      S().renderAll();
      S().showToast(`CSV dosyasından ${added.length} satır tabloya eklendi`);
      input.value = '';
    };
    reader.readAsText(file, 'utf-8');
  };

  // ==========================================================================
  // 8. FORMÜL YARDIMCILARI (İŞLEV SİHİRBAZI, HIZLI FORMÜLLER, FORMÜL GÖSTER)
  // ==========================================================================
  const FUNCTION_CATALOG = [
    { name: 'TOPLA', en: 'SUM', syntax: '=TOPLA(B2:B10)', desc: 'Belirtilen hücre aralığındaki tüm sayıları toplar.' },
    { name: 'ORTALAMA', en: 'AVERAGE', syntax: '=ORTALAMA(B2:B10)', desc: 'Aralıktaki sayıların aritmetik ortalamasını hesaplar.' },
    { name: 'SAY', en: 'COUNT', syntax: '=SAY(B2:B10)', desc: 'Aralıktaki sayısal değer içeren hücre sayısını döndürür.' },
    { name: 'MAK', en: 'MAX', syntax: '=MAK(B2:B10)', desc: 'Aralıktaki en büyük sayısal değeri bulur.' },
    { name: 'MİN', en: 'MIN', syntax: '=MİN(B2:B10)', desc: 'Aralıktaki en küçük sayısal değeri bulur.' },
    { name: 'EĞER', en: 'IF', syntax: '=EĞER(B2<=C2;"✓";"X")', desc: 'Koşul doğruysa 1. değeri, yanlışsa 2. değeri yazar.' },
    { name: 'EĞERSAY', en: 'COUNTIF', syntax: '=EĞERSAY(D2:D10;"✓")', desc: 'Ölçüte uyan hücrelerin sayısını bulur.' },
    { name: 'ETOPLA', en: 'SUMIF', syntax: '=ETOPLA(A2:A10;"Pano";B2:B10)', desc: 'Ölçüte uyan satırların toplamını alır.' },
    { name: 'YUVARLA', en: 'ROUND', syntax: '=YUVARLA(B2;2)', desc: 'Sayıyı belirtilen ondalık basamağa yuvarlar.' },
    { name: 'KAREKÖK', en: 'SQRT', syntax: '=KAREKÖK(B2)', desc: 'Sayısal değerin karekökünü hesaplar.' },
    { name: 'BİRLEŞTİR', en: 'CONCAT', syntax: '=BİRLEŞTİR(A2;" - ";B2)', desc: 'Birden fazla hücre metnini birleştirir.' },
    { name: 'DÜŞEYARA', en: 'VLOOKUP', syntax: '=DÜŞEYARA(A2;A2:D10;2;0)', desc: 'İlk sütunda aranan değeri bulur, ilgili sütundan karşılığını getirir.' },
    { name: 'ÇAPRAZARA', en: 'XLOOKUP', syntax: '=ÇAPRAZARA(A2;A2:A10;C2:C10;"Yok")', desc: 'Modern Excel araması — aranan değere karşılık gelen sonucu döndürür.' },
    { name: 'ÇOKEĞER', en: 'IFS', syntax: '=ÇOKEĞER(B2<1;"İyi";B2<2;"Orta";1;"Yüksek")', desc: 'Birden fazla koşulu sırayla test eder.' },
    { name: 'EĞERHATA', en: 'IFERROR', syntax: '=EĞERHATA(B2/C2;0)', desc: 'Formül hata verirse güvenli alternatif değer yazar.' },
    { name: 'TOPLA.ÇARPIM', en: 'SUMPRODUCT', syntax: '=TOPLA.ÇARPIM(B2:B5;C2:C5)', desc: 'İki aralığın karşılıklı elemanlarını çarpıp toplar.' },
    { name: 'STDSAPMA', en: 'STDEV', syntax: '=STDSAPMA(B2:B10)', desc: 'Ölçüm değerlerinin standart sapmasını hesaplar.' },
    { name: 'BUGÜN', en: 'TODAY', syntax: '=BUGÜN()', desc: 'Güncel sistem tarihini otomatik yerleştirir.' }
  ];

  window.officeOpenInsertFunctionModal = function () {
    officeCloseAllPopovers();
    const body = document.getElementById('insertFunctionBody');
    if (!body) return;
    body.innerHTML = `
      <p style="margin:0 0 10px 0;font-size:12px;color:var(--of-muted);">Seçili hücreye eklemek istediğiniz Excel işlevine tıklayın (Türkçe ve İngilizce işlev adları desteklenir):</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
        ${FUNCTION_CATALOG.map(f => `
          <button type="button" class="st-blueprint-card" style="margin:0;padding:8px 10px;" onclick="officeInsertFormulaLiteral('${S().escapeHtml(f.syntax)}'); closeModal('insertFunctionModal');">
            <div class="st-blueprint-name" style="color:var(--of-excel);">${f.name} <span style="font-weight:500;color:var(--of-muted);">(${f.en})</span></div>
            <div style="font-family:monospace;font-size:10.5px;color:var(--of-word);margin-top:2px;">${f.syntax}</div>
            <div class="st-blueprint-meta">${f.desc}</div>
          </button>
        `).join('')}
      </div>
    `;
    document.getElementById('insertFunctionModal').classList.remove('hidden');
  };

  window.officeInsertFormulaLiteral = function (formulaStr) {
    const key = S().state.selectedCellKey;
    if (!key) return S().showToast('Önce formül eklenecek hücreyi seçin');
    const cell = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    if (!cell || !S().isCellTextEditable(cell)) return S().showToast('Bu hücreye formül yazılamaz');
    S().pushUndoSnapshot();
    S().applyCellTextToModel(key, formulaStr, cell);
    S().renderAll();
    const fx = document.getElementById('fxCellInput');
    if (fx) { fx.focus(); fx.select(); }
    S().showToast(`Formül eklendi: ${formulaStr}`);
  };

  window.officeInsertQuickFormula = function (fnName) {
    officeCloseAllPopovers();
    const key = S().state.selectedCellKey;
    if (!key) return S().showToast('Önce formül eklenecek hücreyi seçin');
    const p = parseCellKeyParts(key);
    if (!p) return;
    const colLet = S().colIndexToExcelLetter(p.c);
    const startR = p.r > 1 ? 2 : 1;
    const endR = Math.max(startR, p.r);
    const map = {
      TOPLA: `=TOPLA(${colLet}${startR}:${colLet}${endR})`,
      ORTALAMA: `=ORTALAMA(${colLet}${startR}:${colLet}${endR})`,
      SAY: `=SAY(${colLet}${startR}:${colLet}${endR})`,
      MAK: `=MAK(${colLet}${startR}:${colLet}${endR})`,
      MIN: `=MİN(${colLet}${startR}:${colLet}${endR})`,
      EGER: `=EĞER(${S().colIndexToExcelLetter(Math.max(0, p.c - 1))}${p.r + 1}>0;"✓";"X")`,
      EGERSAY: `=EĞERSAY(${colLet}${startR}:${colLet}${endR};"✓")`,
      YUVARLA: `=YUVARLA(${S().colIndexToExcelLetter(Math.max(0, p.c - 1))}${p.r + 1};2)`,
      BUGUN: `=BUGÜN()`
    };
    officeInsertFormulaLiteral(map[fnName] || `=${fnName}()`);
  };

  window.officeInsertEngineeringFormula = function (kind) {
    const key = S().state.selectedCellKey;
    if (!key) return S().showToast('Önce hedef hücreyi seçin');
    const p = parseCellKeyParts(key);
    if (!p) return;
    if (kind === 'limit_check') {
      const c1 = S().colIndexToExcelLetter(Math.max(0, p.c - 2));
      const c2 = S().colIndexToExcelLetter(Math.max(0, p.c - 1));
      officeInsertFormulaLiteral(`=EĞER(${c1}${p.r + 1}<=${c2}${p.r + 1};"✓";"X")`);
    } else if (kind === 'ok_rate') {
      const colLet = S().colIndexToExcelLetter(p.c);
      officeInsertFormulaLiteral(`=YUVARLA((EĞERSAY(${colLet}2:${colLet}${Math.max(2, p.r)};"✓")/BAĞ_DEĞ_DOLU_SAY(${colLet}2:${colLet}${Math.max(2, p.r)}))*100;1)&"%"`);
    }
  };

  window.officeToggleShowFormulas = function () {
    S().state.showFormulas = !S().state.showFormulas;
    S().renderAll();
    S().showToast(S().state.showFormulas ? 'Formül Görünümü Açık (Ctrl+`)' : 'Sonuç Görünümü Açık');
  };

  window.officeRecalculateAll = function () {
    S().renderLiveA4();
    S().showToast('Tüm tablo formülleri yeniden hesaplandı (F9)');
  };

  window.officeCancelFormulaInput = function () {
    const fx = document.getElementById('fxCellInput');
    if (fx) {
      fx.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
  };

  window.officeCommitFormulaInput = function () {
    const fx = document.getElementById('fxCellInput');
    if (fx) fx.blur();
  };

  // ==========================================================================
  // 9. YENİ BLOKLAR: GRAFİK, FOTOĞRAF, UYARI KUTUSU, İMZA & SİMGE
  // ==========================================================================
  function renderChartSvg(sec) {
    const pts = (sec.dataPoints || []).filter(p => p && !isNaN(Number(p.value)));
    if (pts.length === 0) return '<div style="padding:12px;font-size:7pt;color:#64748b;">Veri noktası yok</div>';
    const colors = ['#1b365d', '#107c41', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#0d9488'];
    const type = sec.chartType || 'column';
    const W = 540, H = 155;

    if (type === 'pie') {
      const total = pts.reduce((a, b) => a + Math.max(0, Number(b.value)), 0) || 1;
      let startA = -Math.PI / 2;
      const cx = 135, cy = 78, r = 62;
      let slices = '';
      let legend = '';
      pts.forEach((p, idx) => {
        const val = Math.max(0, Number(p.value));
        const angle = (val / total) * Math.PI * 2;
        const endA = startA + angle;
        const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
        const x2 = cx + r * Math.cos(endA), y2 = cy + r * Math.sin(endA);
        const large = angle > Math.PI ? 1 : 0;
        const col = colors[idx % colors.length];
        slices += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${col}" stroke="#ffffff" stroke-width="1.2"/>`;
        const ly = 22 + idx * 18;
        const pct = ((val / total) * 100).toFixed(1);
        legend += `<rect x="240" y="${ly - 8}" width="10" height="10" rx="2" fill="${col}"/><text x="256" y="${ly}" font-size="9.5" fill="#1e293b" font-family="Inter,Arial,sans-serif">${S().escapeHtml(p.label)} (${val} · %${pct})</text>`;
        startA = endA;
      });
      return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:155px;display:block;">${slices}${legend}</svg>`;
    }

    const maxVal = Math.max(...pts.map(p => Number(p.value)), 1);
    if (type === 'bar') {
      const rowH = Math.min(24, (H - 18) / pts.length);
      const bars = pts.map((p, idx) => {
        const y = 10 + idx * rowH;
        const bw = Math.max(4, (Number(p.value) / maxVal) * 330);
        const col = colors[idx % colors.length];
        return `<text x="128" y="${y + rowH * 0.65}" text-anchor="end" font-size="9" fill="#334155" font-family="Inter,Arial,sans-serif">${S().escapeHtml(String(p.label).slice(0, 20))}</text>
                <rect x="136" y="${y + 2}" width="${bw.toFixed(1)}" height="${Math.max(8, rowH - 6)}" rx="2" fill="${col}"/>
                <text x="${(142 + bw).toFixed(1)}" y="${y + rowH * 0.65}" font-size="9" font-weight="700" fill="#0f172a" font-family="Inter,Arial,sans-serif">${p.value}</text>`;
      }).join('');
      return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:155px;display:block;">${bars}</svg>`;
    }

    if (type === 'line') {
      const stepX = pts.length > 1 ? 450 / (pts.length - 1) : 225;
      const coords = pts.map((p, i) => ({
        x: 45 + i * stepX,
        y: 125 - (Number(p.value) / maxVal) * 98,
        p
      }));
      const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
      const dots = coords.map(c =>
        `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.5" fill="#107c41" stroke="#fff" stroke-width="1.5"/>
         <text x="${c.x.toFixed(1)}" y="${(c.y - 7).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#0f172a">${c.p.value}</text>
         <text x="${c.x.toFixed(1)}" y="143" text-anchor="middle" font-size="8.5" fill="#475569">${S().escapeHtml(String(c.p.label).slice(0, 12))}</text>`
      ).join('');
      return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:155px;display:block;">
        <line x1="35" y1="125" x2="510" y2="125" stroke="#cbd5e1" stroke-width="1"/>
        <path d="${pathD}" fill="none" stroke="#185abd" stroke-width="2.2"/>
        ${dots}
      </svg>`;
    }

    // Default: Column chart
    const slotW = 460 / pts.length;
    const barW = Math.min(46, slotW * 0.62);
    const cols = pts.map((p, idx) => {
      const x = 42 + idx * slotW + (slotW - barW) / 2;
      const bh = Math.max(3, (Number(p.value) / maxVal) * 98);
      const y = 125 - bh;
      const col = colors[idx % colors.length];
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${col}"/>
              <text x="${(x + barW / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#0f172a">${p.value}</text>
              <text x="${(x + barW / 2).toFixed(1)}" y="142" text-anchor="middle" font-size="8.5" fill="#475569">${S().escapeHtml(String(p.label).slice(0, 12))}</text>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:155px;display:block;">
      <line x1="35" y1="125" x2="510" y2="125" stroke="#cbd5e1" stroke-width="1"/>
      ${cols}
    </svg>`;
  }

  window.officeOpenInsertChartModal = function () {
    const body = document.getElementById('insertChartBody');
    if (!body) return;
    body.innerHTML = `
      <div class="st-grid-2">
        <div class="st-field">
          <label class="st-label">Grafik Başlığı</label>
          <input id="newChartTitle" class="st-input" value="Ölçüm & Kontrol Özeti">
        </div>
        <div class="st-field">
          <label class="st-label">Grafik Türü</label>
          <select id="newChartType" class="st-select">
            <option value="column">Sütun Grafiği</option>
            <option value="bar">Yatay Çubuk</option>
            <option value="pie">Pasta Grafiği</option>
            <option value="line">Çizgi Grafiği</option>
          </select>
        </div>
      </div>
      <div class="st-field">
        <label class="st-label">Veriler (Her satır: Etiket: Değer)</label>
        <textarea id="newChartData" class="st-textarea" rows="5">Uygun (✓): 28
Uygun Değil (X): 2
Uygulama Yok (N): 3
Görülemedi (G): 1</textarea>
      </div>
    `;
    document.getElementById('insertChartModal').classList.remove('hidden');
  };

  function parseChartText(raw) {
    return String(raw || '').split(/\r?\n/).map(line => {
      const parts = line.split(/[:;=]/);
      if (parts.length < 2) return null;
      const val = parseLocaleNumber(parts[1]);
      return isNaN(val) ? null : { label: parts[0].trim(), value: val };
    }).filter(Boolean);
  }

  window.officeConfirmInsertChart = function () {
    const title = document.getElementById('newChartTitle')?.value || 'Ölçüm Özeti Grafiği';
    const chartType = document.getElementById('newChartType')?.value || 'column';
    const dataPoints = parseChartText(document.getElementById('newChartData')?.value);
    if (dataPoints.length === 0) return S().showToast('En az 1 geçerli "Etiket: Sayı" satırı girin');

    S().pushUndoSnapshot();
    const newSec = {
      id: S().uid('sec_chart'),
      type: 'chart_block',
      visible: true,
      title: 'GRAFİK ANALİZİ',
      chartTitle: title,
      chartType,
      dataPoints
    };
    const secs = S().state.schema.sections;
    secs.splice(Math.max(0, secs.length - 2), 0, newSec);
    S().state.selectedSectionId = newSec.id;
    window.closeModal('insertChartModal');
    S().renderAll();
    S().showToast('Grafik bloğu rapora eklendi');
  };

  window.officeUpdateChartDataText = function (raw) {
    const sec = S().getSelectedSection();
    if (!sec || sec.type !== 'chart_block') return;
    sec.dataPoints = parseChartText(raw);
    S().renderLiveA4();
  };

  window.officeHandleImageUpload = function (input) {
    const files = Array.from(input.files || []);
    if (files.length === 0) return;
    const readers = files.slice(0, 6).map(f => new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve({ src: String(r.result), caption: f.name.replace(/\.[^.]+$/, '') });
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(loaded => {
      S().pushUndoSnapshot();
      const curSec = S().getSelectedSection();
      if (curSec && curSec.type === 'image_block') {
        curSec.images = (curSec.images || []).concat(loaded);
      } else {
        const newSec = {
          id: S().uid('sec_img'),
          type: 'image_block',
          visible: true,
          title: 'EKİPMAN / TERMAL FOTOĞRAFLAR',
          cols: loaded.length === 1 ? 1 : 2,
          images: loaded
        };
        const secs = S().state.schema.sections;
        secs.splice(Math.max(0, secs.length - 2), 0, newSec);
        S().state.selectedSectionId = newSec.id;
      }
      S().renderAll();
      S().showToast(`${loaded.length} fotoğraf eklendi`);
      input.value = '';
    });
  };

  window.officeRemoveImageFromBlock = function (idx) {
    const sec = S().getSelectedSection();
    if (!sec || !sec.images) return;
    S().pushUndoSnapshot();
    sec.images.splice(idx, 1);
    S().renderAll();
  };

  window.officeUpdateImageCaption = function (idx, val) {
    const sec = S().getSelectedSection();
    if (!sec || !sec.images?.[idx]) return;
    sec.images[idx].caption = val;
    S().renderLiveA4();
  };

  window.officeInsertCalloutBlock = function (variant) {
    S().pushUndoSnapshot();
    const newSec = {
      id: S().uid('sec_call'),
      type: 'callout_block',
      visible: true,
      variant: variant || 'info',
      title: 'ÖNEMLİ TEKNİK UYARI / NOT',
      body: 'Bu uyarı kutusunun başlığını, stilini (Bilgi / Uyarı / Kritik C1 / Uygun) ve içeriğini sağdaki Bölüm Özellikleri panelinden düzenleyebilirsiniz.'
    };
    const secs = S().state.schema.sections;
    secs.splice(Math.max(0, secs.length - 2), 0, newSec);
    S().state.selectedSectionId = newSec.id;
    S().renderAll();
    window.toggleDetailPane(true);
    S().showToast('Uyarı / Şekil kutusu eklendi');
  };

  window.officeInsertSignatureBlock = function () {
    S().pushUndoSnapshot();
    const newSec = {
      id: S().uid('sec_sig'),
      type: 'signature_block',
      visible: true,
      title: 'İMZA VE TESLİM ONAYI',
      signers: [
        { role: 'Muayene Mühendisi', name: 'Ad Soyad' },
        { role: 'Teknik Yönetici', name: 'Ad Soyad' },
        { role: 'Firma Yetkilisi', name: 'Ad Soyad' }
      ]
    };
    S().state.schema.sections.push(newSec);
    S().state.selectedSectionId = newSec.id;
    S().renderAll();
    S().showToast('İmza satırı eklendi');
  };

  window.officeAddSignerCol = function () {
    const sec = S().getSelectedSection();
    if (!sec || sec.type !== 'signature_block') return;
    S().pushUndoSnapshot();
    sec.signers.push({ role: 'Yetkili', name: 'Ad Soyad' });
    S().renderAll();
  };

  window.officeRemoveSignerCol = function (idx) {
    const sec = S().getSelectedSection();
    if (!sec || !sec.signers || sec.signers.length <= 1) return;
    S().pushUndoSnapshot();
    sec.signers.splice(idx, 1);
    S().renderAll();
  };

  window.officeUpdateSigner = function (idx, prop, val) {
    const sec = S().getSelectedSection();
    if (!sec || !sec.signers?.[idx]) return;
    sec.signers[idx][prop] = val;
    S().renderLiveA4();
  };

  window.officeInsertSymbol = function (ch) {
    officeCloseAllPopovers();
    const key = S().state.selectedCellKey;
    if (!key) return S().showToast('Simge eklemek için önce bir hücre seçin');
    const cell = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    if (!cell || !S().isCellTextEditable(cell)) return S().showToast('Bu hücreye simge eklenemez');
    S().pushUndoSnapshot();
    const cur = cell.dataset.rawValue !== undefined ? cell.dataset.rawValue : S().getCellEditableText(cell);
    S().applyCellTextToModel(key, cur + ch, cell);
    S().renderAll();
    S().showToast(`Simge eklendi: ${ch}`);
  };

  window.officeInsertTimestamp = function () {
    const today = new Date().toLocaleDateString('tr-TR');
    officeInsertSymbol(today);
  };

  // ==========================================================================
  // 10. TASARIM & SAYFA DÜZENİ (FİLİGRAN, KENARLIK, YATAY A4, SATIR NO, CETVEL SÜRÜKLEME)
  // ==========================================================================
  window.officeUpdateDesign = function (prop, val) {
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    S().state.schema.designSettings[prop] = val;
    S().renderAll();
  };

  window.officeApplyDensityPreset = function (preset) {
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    const map = {
      compact: { cellPadY: 1, blockGap: 1, secMarginTop: 2, tableFontSize: 6.8, label: 'Sıkı (Daha fazla satır)' },
      normal: { cellPadY: 2, blockGap: 2, secMarginTop: 4, tableFontSize: 7.2, label: 'Standart (1:1 Orijinal)' },
      relaxed: { cellPadY: 3.5, blockGap: 5, secMarginTop: 7, tableFontSize: 7.8, label: 'Ferah (Okuma odaklı)' }
    };
    const p = map[preset] || map.normal;
    Object.assign(S().state.schema.layoutStyles, {
      cellPadY: p.cellPadY, blockGap: p.blockGap, secMarginTop: p.secMarginTop, tableFontSize: p.tableFontSize
    });
    S().renderAll();
    S().showToast(`Belge yoğunluğu: ${p.label}`);
  };

  window.officeSetWatermark = function (text) {
    officeCloseAllPopovers();
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    S().state.schema.designSettings.watermarkText = text;
    S().renderAll();
    S().showToast(text ? `Filigran uygulandı: ${text}` : 'Filigran kaldırıldı');
  };

  window.officeOpenCustomWatermarkModal = function () {
    officeCloseAllPopovers();
    S().ensureStyleDefaults(S().state.schema);
    const ds = S().state.schema.designSettings;
    document.getElementById('customWmText').value = ds.watermarkText || 'TASLAK';
    document.getElementById('customWmColor').value = ds.watermarkColor || '#64748b';
    document.getElementById('customWmOpacity').value = Math.round((ds.watermarkOpacity || 0.11) * 100);
    document.getElementById('customWatermarkModal').classList.remove('hidden');
  };

  window.officeSaveCustomWatermark = function () {
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    const ds = S().state.schema.designSettings;
    ds.watermarkText = document.getElementById('customWmText')?.value || '';
    ds.watermarkColor = document.getElementById('customWmColor')?.value || '#64748b';
    ds.watermarkOpacity = Math.max(0.04, Math.min(0.35, Number(document.getElementById('customWmOpacity')?.value || 11) / 100));
    window.closeModal('customWatermarkModal');
    S().renderAll();
    S().showToast('Özel filigran güncellendi');
  };

  window.officeSetPageBorder = function (style) {
    officeCloseAllPopovers();
    officeUpdateDesign('pageBorder', style);
    S().showToast(style === 'none' ? 'Sayfa kenarlığı kaldırıldı' : 'A4 sayfa kenarlığı uygulandı');
  };

  window.officeToggleOrientation = function () {
    S().ensureStyleDefaults(S().state.schema);
    const cur = S().state.schema.designSettings.orientation || 'portrait';
    const next = cur === 'landscape' ? 'portrait' : 'landscape';
    officeUpdateDesign('orientation', next);
    setTimeout(() => { window.fitPreviewZoom(); }, 50);
    S().showToast(next === 'landscape' ? 'Yatay A4 (297×210 mm) aktif' : 'Dikey A4 (210×297 mm) aktif');
  };

  window.officeToggleLineNumbers = function () {
    S().ensureStyleDefaults(S().state.schema);
    const next = !S().state.schema.designSettings.lineNumbers;
    officeUpdateDesign('lineNumbers', next);
    S().showToast(next ? 'Tablo satır numaraları açıldı' : 'Satır numaraları kapatıldı');
  };

  function bindInteractiveRulerDrag() {
    const track = document.getElementById('wordRulerTrack');
    if (!track) return;
    track.addEventListener('mousedown', (ev) => {
      const shade = ev.target.closest('.ruler-margin-shade');
      if (!shade) return;
      ev.preventDefault();
      S().ensureStyleDefaults(S().state.schema);
      S().pushUndoSnapshot();
      const isLeft = shade.classList.contains('left');
      const rect = track.getBoundingClientRect();
      const totalMm = S().state.schema.designSettings.orientation === 'landscape' ? 297 : 210;

      const onMove = (me) => {
        const px = isLeft ? (me.clientX - rect.left) : (rect.right - me.clientX);
        const mm = Math.max(4, Math.min(24, Math.round(((px / rect.width) * totalMm) * 2) / 2));
        S().state.schema.layoutStyles.pagePadX = mm;
        S().updateRulerMargins();
        window.updateLayoutStyle('pagePadX', mm, true);
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        S().showToast(`Sağ/Sol Kenar Boşluğu: ${S().state.schema.layoutStyles.pagePadX} mm`);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  // ==========================================================================
  // 11. GÖRÜNÜM MODLARI, KOYU MOD, GEZİNTİ (BAŞLIKLAR / SAYFALAR / SONUÇLAR)
  // ==========================================================================
  window.officeSetViewMode = function (mode) {
    S().state.viewMode = mode;
    ['vmPrint', 'vmTwoUp', 'vmPageBreak'].forEach(id => document.getElementById(id)?.classList.remove('active'));
    ['osbVmPrint', 'osbVmTwoUp', 'osbVmBreak'].forEach(id => document.getElementById(id)?.classList.remove('active'));
    if (mode === 'print') { document.getElementById('vmPrint')?.classList.add('active'); document.getElementById('osbVmPrint')?.classList.add('active'); }
    if (mode === 'twoup') { document.getElementById('vmTwoUp')?.classList.add('active'); document.getElementById('osbVmTwoUp')?.classList.add('active'); }
    if (mode === 'pagebreak') { document.getElementById('vmPageBreak')?.classList.add('active'); document.getElementById('osbVmBreak')?.classList.add('active'); }
    S().renderLiveA4();
    setTimeout(() => window.fitPreviewZoom(), 40);
  };

  window.officeToggleFocusMode = function () {
    S().state.focusMode = !S().state.focusMode;
    document.body.classList.toggle('view-focus', S().state.focusMode);
    document.getElementById('vmFocus')?.classList.toggle('active', S().state.focusMode);
    document.getElementById('osbVmFocus')?.classList.toggle('active', S().state.focusMode);
    setTimeout(() => window.fitPreviewZoom(), 50);
    S().showToast(S().state.focusMode ? 'Odak Modu açık (Çıkmak için Esc veya Odak düğmesi)' : 'Odak Modu kapatıldı');
  };

  window.officeToggleRibbonCollapse = function () {
    document.body.classList.toggle('ribbon-collapsed');
  };

  window.officeToggleExcelHeaders = function (checked) {
    S().state.showExcelHeaders = Boolean(checked);
    document.getElementById('liveA4Canvas')?.classList.toggle('show-excel-headers', S().state.showExcelHeaders);
    const chk = document.getElementById('chkHeadings');
    if (chk) chk.checked = S().state.showExcelHeaders;
  };

  window.officeToggleFormattingMarks = function (checked) {
    S().state.showFormattingMarks = Boolean(checked);
    document.getElementById('liveA4Canvas')?.classList.toggle('show-fmt-marks', S().state.showFormattingMarks);
    const chk = document.getElementById('chkFormattingMarks');
    if (chk) chk.checked = S().state.showFormattingMarks;
  };

  window.officeToggleDarkMode = function (force) {
    const next = typeof force === 'boolean' ? force : !document.body.classList.contains('office-dark');
    document.body.classList.toggle('office-dark', next);
    try { localStorage.setItem(DARK_MODE_KEY, next ? '1' : '0'); } catch (_) {}
  };

  // SOL GEZİNTİ SEKMELERİ (WORDCRAFT)
  window.officeSwitchNavTab = function (tab) {
    S().state.activeNavTab = tab;
    document.querySelectorAll('.nav-tab[data-navtab]').forEach(b => b.classList.toggle('active', b.dataset.navtab === tab));
    document.getElementById('navOutlineBody')?.classList.toggle('hidden', tab !== 'headings');
    document.getElementById('navPagesBody')?.classList.toggle('hidden', tab !== 'pages');
    document.getElementById('navResultsBody')?.classList.toggle('hidden', tab !== 'results');
    if (tab === 'pages') renderNavPages();
  };

  function renderNavPages() {
    const box = document.getElementById('navPagesBody');
    if (!box) return;
    const pages = document.querySelectorAll('#liveA4Canvas .tkm-a4-page');
    box.innerHTML = Array.from(pages).map((pg, idx) => {
      const titles = Array.from(pg.querySelectorAll('.tkm-sec-title')).map(t => t.textContent.trim()).slice(0, 2);
      return `
        <div class="nav-page-card" onclick="officeJumpToPage(${idx})">
          <div class="nav-page-thumb">
            <span style="width:100%;background:#1b365d;height:5px;"></span>
            <span style="width:76%;"></span>
            <span style="width:92%;"></span>
            <span style="width:64%;"></span>
          </div>
          <div class="nav-page-label">
            <span>Sayfa ${idx + 1}</span>
            <span style="font-weight:500;color:var(--of-muted);font-size:10px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${S().escapeHtml(titles[0] || 'A4 Sayfası')}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  window.officeJumpToPage = function (idx) {
    const pg = document.querySelectorAll('#liveA4Canvas .tkm-a4-page')[idx];
    if (pg) pg.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.officeNavSearch = function (q) {
    const clearBtn = document.getElementById('navSearchClear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !q);
    const term = String(q || '').trim().toLowerCase();
    if (!term) {
      officeSwitchNavTab('headings');
      return;
    }
    officeSwitchNavTab('results');
    const box = document.getElementById('navResultsBody');
    if (!box) return;
    const hits = [];
    document.querySelectorAll('#liveA4Canvas td[data-cell-key], #liveA4Canvas th[data-cell-key]').forEach(el => {
      const txt = S().getCellEditableText(el);
      const pos = txt.toLowerCase().indexOf(term);
      if (pos >= 0) {
        hits.push({ key: el.dataset.cellKey, txt, pos });
      }
    });
    if (hits.length === 0) {
      box.innerHTML = `<div style="text-align:center;color:var(--of-muted);padding:18px;font-size:11.5px;">"${S().escapeHtml(q)}" için sonuç bulunamadı.</div>`;
      return;
    }
    box.innerHTML = `<div style="font-size:10.5px;color:var(--of-muted);margin-bottom:6px;font-weight:600;">${hits.length} eşleşme bulundu</div>` +
      hits.slice(0, 80).map(h => {
        const before = S().escapeHtml(h.txt.slice(Math.max(0, h.pos - 16), h.pos));
        const match = S().escapeHtml(h.txt.slice(h.pos, h.pos + term.length));
        const after = S().escapeHtml(h.txt.slice(h.pos + term.length, h.pos + term.length + 32));
        return `
          <button type="button" class="nav-result-item" onclick="officeJumpToCell('${S().escapeHtml(h.key)}')">
            <div class="nav-result-addr">${S().escapeHtml(S().formatCellAddress(h.key))}</div>
            <div class="nav-result-snip">${before}<mark>${match}</mark>${after}</div>
          </button>
        `;
      }).join('');
  };

  window.officeClearNavSearch = function () {
    const inp = document.getElementById('navSearchInput');
    if (inp) inp.value = '';
    officeNavSearch('');
  };

  window.officeJumpToCell = function (key) {
    window.selectCellByKey(key);
    const el = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ==========================================================================
  // 12. BUL & DEĞİŞTİR (CTRL+F / CTRL+H — WORD & EXCEL)
  // ==========================================================================
  window.officeOpenFindReplace = function (showReplace) {
    const bar = document.getElementById('findReplaceBar');
    const repRow = document.getElementById('replaceRow');
    if (!bar) return;
    bar.classList.remove('hidden');
    if (repRow) repRow.classList.toggle('hidden', !showReplace);
    const inp = document.getElementById('findInput');
    if (inp) { inp.focus(); inp.select(); }
    officeRunFind();
  };

  window.officeCloseFindReplace = function () {
    document.getElementById('findReplaceBar')?.classList.add('hidden');
    document.querySelectorAll('.office-find-hit, .office-find-active').forEach(el => {
      el.classList.remove('office-find-hit', 'office-find-active');
    });
    OfficeState.findMatches = [];
    OfficeState.findIndex = -1;
  };

  window.officeRunFind = function () {
    document.querySelectorAll('.office-find-hit, .office-find-active').forEach(el => {
      el.classList.remove('office-find-hit', 'office-find-active');
    });
    const term = String(document.getElementById('findInput')?.value || '').trim().toLowerCase();
    OfficeState.findMatches = [];
    OfficeState.findIndex = -1;
    if (term) {
      document.querySelectorAll('#liveA4Canvas td[data-cell-key], #liveA4Canvas th[data-cell-key]').forEach(el => {
        if (S().getCellEditableText(el).toLowerCase().includes(term)) {
          el.classList.add('office-find-hit');
          OfficeState.findMatches.push(el.dataset.cellKey);
        }
      });
    }
    if (OfficeState.findMatches.length > 0) {
      OfficeState.findIndex = 0;
      focusFindMatch();
    } else {
      const cnt = document.getElementById('findMatchCounter');
      if (cnt) cnt.textContent = '0 / 0';
    }
  };

  function focusFindMatch() {
    const cnt = document.getElementById('findMatchCounter');
    const total = OfficeState.findMatches.length;
    if (cnt) cnt.textContent = total ? `${OfficeState.findIndex + 1} / ${total}` : '0 / 0';
    document.querySelectorAll('.office-find-active').forEach(e => e.classList.remove('office-find-active'));
    const key = OfficeState.findMatches[OfficeState.findIndex];
    if (!key) return;
    const el = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    if (el) {
      el.classList.add('office-find-active');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.selectCellByKey(key);
    }
  }

  window.officeFindStep = function (dir) {
    const total = OfficeState.findMatches.length;
    if (!total) return;
    OfficeState.findIndex = (OfficeState.findIndex + dir + total) % total;
    focusFindMatch();
  };

  window.officeFindKeydown = function (ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      officeFindStep(ev.shiftKey ? -1 : 1);
    } else if (ev.key === 'Escape') {
      officeCloseFindReplace();
    }
  };

  window.officeReplaceCurrent = function () {
    const term = String(document.getElementById('findInput')?.value || '');
    const rep = String(document.getElementById('replaceInput')?.value || '');
    const key = OfficeState.findMatches[OfficeState.findIndex];
    if (!term || !key) return;
    const el = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    if (!el || !S().isCellTextEditable(el)) return S().showToast('Bu hücre değiştirilemez');
    S().pushUndoSnapshot();
    const raw = el.dataset.rawValue !== undefined ? el.dataset.rawValue : S().getCellEditableText(el);
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    S().applyCellTextToModel(key, raw.replace(re, rep), el);
    S().renderAll();
    officeRunFind();
    S().showToast('Eşleşme değiştirildi');
  };

  window.officeReplaceAll = function () {
    const term = String(document.getElementById('findInput')?.value || '');
    const rep = String(document.getElementById('replaceInput')?.value || '');
    if (!term || OfficeState.findMatches.length === 0) return;
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    S().pushUndoSnapshot();
    let changed = 0;
    OfficeState.findMatches.forEach(key => {
      const el = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
      if (!el || !S().isCellTextEditable(el)) return;
      const raw = el.dataset.rawValue !== undefined ? el.dataset.rawValue : S().getCellEditableText(el);
      const next = raw.replace(re, rep);
      if (next !== raw) {
        S().applyCellTextToModel(key, next, el);
        changed++;
      }
    });
    S().renderAll();
    officeRunFind();
    S().showToast(`${changed} hücrede metin değiştirildi`);
  };

  // ==========================================================================
  // 13. SAĞ PANEL SEKMELERİ: YORUMLAR, RAPOR DENETÇİSİ & İSTATİSTİKLER
  // ==========================================================================
  window.officeOpenSideTab = function (tab) {
    window.toggleDetailPane(true);
    officeSwitchSideTab(tab);
  };

  window.officeSwitchSideTab = function (tab) {
    S().state.activeSideTab = tab;
    document.querySelectorAll('.side-tab[data-sidetab]').forEach(b => b.classList.toggle('active', b.dataset.sidetab === tab));
    document.getElementById('studioEditorBody')?.classList.toggle('hidden', tab !== 'props');
    document.getElementById('studioCommentsBody')?.classList.toggle('hidden', tab !== 'comments');
    document.getElementById('studioAuditBody')?.classList.toggle('hidden', tab !== 'audit');
    if (tab === 'props') S().renderDetailPane();
    if (tab === 'comments') renderCommentsPane();
    if (tab === 'audit') renderAuditPane();
  };

  window.officeAddCommentForSelection = function () {
    officeOpenSideTab('comments');
    setTimeout(() => document.getElementById('newCommentTextarea')?.focus(), 40);
  };

  window.officeSubmitComment = function () {
    const txt = String(document.getElementById('newCommentTextarea')?.value || '').trim();
    if (!txt) return S().showToast('Yorum metni boş olamaz');
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    const cellKey = S().state.selectedCellKey || null;
    const sec = S().getSelectedSection();
    S().state.schema.comments.unshift({
      id: S().uid('cmt'),
      cellKey,
      targetLabel: cellKey ? S().formatCellAddress(cellKey) : (sec ? S().getSectionDisplayName(sec) : 'Genel Belge'),
      text: txt,
      author: S().state.manager?.name || 'Mühendis',
      createdAt: new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }),
      resolved: false
    });
    S().renderAll();
    renderCommentsPane();
    S().showToast('Yorum eklendi');
  };

  window.officeToggleCommentResolved = function (id) {
    const c = (S().state.schema?.comments || []).find(x => x.id === id);
    if (!c) return;
    S().pushUndoSnapshot();
    c.resolved = !c.resolved;
    S().renderAll();
    renderCommentsPane();
  };

  window.officeDeleteComment = function (id) {
    S().pushUndoSnapshot();
    S().state.schema.comments = (S().state.schema.comments || []).filter(x => x.id !== id);
    S().renderAll();
    renderCommentsPane();
  };

  window.officeToggleCommentMarkers = function () {
    S().state.showCommentMarkers = !S().state.showCommentMarkers;
    S().renderLiveA4();
    S().showToast(S().state.showCommentMarkers ? 'Hücre yorum üçgenleri gösteriliyor' : 'Yorum işaretçileri gizlendi');
  };

  function renderCommentsPane() {
    const box = document.getElementById('studioCommentsBody');
    if (!box || !S().state.schema) return;
    S().ensureStyleDefaults(S().state.schema);
    const list = S().state.schema.comments || [];
    const activeTarget = S().state.selectedCellKey ? S().formatCellAddress(S().state.selectedCellKey) : (S().getSelectedSection() ? S().getSectionDisplayName(S().getSelectedSection()) : 'Belge');
    const openCount = list.filter(c => !c.resolved).length;
    const badge = document.getElementById('otbCommentsCount');
    if (badge) {
      badge.textContent = String(openCount);
      badge.classList.toggle('hidden', openCount === 0);
    }

    box.innerHTML = `
      <div class="st-card">
        <div class="st-label">Hedef: <strong style="color:var(--of-word);">${S().escapeHtml(activeTarget)}</strong></div>
        <textarea id="newCommentTextarea" class="st-textarea" rows="3" placeholder="Bu hücre veya bölüm için inceleme notu yazın..."></textarea>
        <button type="button" class="st-btn st-btn-primary st-btn-xs" style="width:100%;margin-top:6px;" onclick="officeSubmitComment()">+ Yorum Ekle</button>
      </div>
      ${list.length === 0 ? `<div style="text-align:center;color:var(--of-muted);padding:20px;font-size:12px;">Henüz yorum eklenmemiş.</div>` : list.map(c => `
        <div class="comment-card ${c.resolved ? 'resolved' : ''}">
          <div class="comment-head">
            <span class="comment-target" onclick="${c.cellKey ? `officeJumpToCell('${S().escapeHtml(c.cellKey)}')` : ''}">${S().escapeHtml(c.targetLabel)}</span>
            <div style="display:flex;gap:3px;">
              <button type="button" class="st-mini-icon-btn" onclick="officeToggleCommentResolved('${c.id}')" title="${c.resolved ? 'Yeniden Aç' : 'Çözüldü İşaretle'}">✓</button>
              <button type="button" class="st-mini-icon-btn danger" onclick="officeDeleteComment('${c.id}')" title="Sil">✕</button>
            </div>
          </div>
          <div class="comment-body">${S().escapeHtml(c.text)}</div>
          <div class="comment-meta"><span>${S().escapeHtml(c.author)}</span><span>${S().escapeHtml(c.createdAt)}</span></div>
        </div>
      `).join('')}
    `;
  }

  function renderAuditPane() {
    const box = document.getElementById('studioAuditBody');
    const s = S().state.schema;
    if (!box || !s) return;
    const findings = [];

    // 1. Formül hataları
    document.querySelectorAll('#liveA4Canvas td[data-cell-key]').forEach(td => {
      const txt = td.textContent.trim();
      if (/^#(HATA!|SAYI\/0!|DÖNGÜ!|AD\?|SAYI!)/.test(txt)) {
        findings.push({ sev: 'err', title: `Formül Hatası (${txt})`, meta: S().formatCellAddress(td.dataset.cellKey), cellKey: td.dataset.cellKey });
      }
    });

    // 2. X (Uygun Değil) kusurları
    (s.sections || []).forEach(sec => {
      if (sec.visible === false) return;
      if (sec.type === 'data_table') {
        const totalW = (sec.showNoCol ? Number(sec.noColWidth || 4) : 0) + (sec.columns || []).reduce((a, c) => a + Number(c.width || 0), 0);
        if (Math.abs(totalW - 100) > 2) {
          findings.push({ sev: 'warn', title: `Sütun Toplamı %${totalW.toFixed(1)}`, meta: `${S().getSectionDisplayName(sec)} — %100'e eşitlemeniz önerilir`, secId: sec.id });
        }
        (sec.rows || []).forEach((r, ri) => {
          (sec.columns || []).forEach(c => {
            if (c.type === 'symbol' && r[c.id] === 'X') {
              findings.push({ sev: 'err', title: `Uygun Değil (X) Satır #${ri + 1}`, meta: S().getSectionDisplayName(sec), secId: sec.id });
            }
          });
        });
      }
      if (sec.type === 'visual_checklist_group') {
        (sec.topics || []).forEach(t => {
          (t.items || []).forEach(it => {
            if (it.sym === 'X') {
              findings.push({ sev: 'err', title: `Gözle Kontrol Kusuru (X)`, meta: `${t.title}: ${it.text}`, secId: sec.id });
            }
          });
        });
      }
      if (sec.type === 'company_info') {
        (sec.rows || []).forEach(r => {
          if (!String(r.val1 || '').trim()) {
            findings.push({ sev: 'warn', title: `Boş Firma Alanı: ${r.label1}`, meta: '1. Firma Bilgileri', secId: sec.id });
          }
        });
      }
    });

    if (findings.length === 0) {
      box.innerHTML = `<div class="audit-item"><span class="audit-dot ok"></span><div><strong>Rapor Tertemiz!</strong><div style="font-size:11px;color:var(--of-muted);margin-top:2px;">Formül hatası, sütun taşması veya kritik kusur tespit edilmedi.</div></div></div>`;
      return;
    }

    box.innerHTML = `<div style="font-size:11px;font-weight:700;color:var(--of-muted);margin-bottom:8px;">${findings.length} bulgu tespit edildi</div>` +
      findings.map(f => `
        <div class="audit-item" onclick="${f.cellKey ? `officeJumpToCell('${S().escapeHtml(f.cellKey)}')` : `selectSection('${S().escapeHtml(f.secId)}', { scrollToA4: true, openDetail: true })`}">
          <span class="audit-dot ${f.sev}"></span>
          <div style="min-width:0;">
            <div style="font-size:11.5px;font-weight:700;">${S().escapeHtml(f.title)}</div>
            <div style="font-size:10.5px;color:var(--of-muted);margin-top:1px;">${S().escapeHtml(f.meta)}</div>
          </div>
        </div>
      `).join('');
  }

  function computeDocumentStats() {
    const canvas = document.getElementById('liveA4Canvas');
    const pages = canvas ? canvas.querySelectorAll('.tkm-a4-page').length : 0;
    const cells = canvas ? canvas.querySelectorAll('td[data-cell-key], th[data-cell-key]').length : 0;
    const rawText = canvas ? canvas.innerText : '';
    const words = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
    const chars = rawText.replace(/\s+/g, '').length;
    const sections = (S().state.schema?.sections || []).filter(x => x.visible !== false).length;

    let symOk = 0, symBad = 0, symN = 0, symG = 0;
    (S().state.schema?.sections || []).forEach(sec => {
      if (sec.visible === false) return;
      if (sec.type === 'visual_checklist_group') {
        (sec.topics || []).forEach(t => (t.items || []).forEach(it => {
          if (it.sym === '✓') symOk++;
          else if (it.sym === 'X') symBad++;
          else if (it.sym === 'N') symN++;
          else if (it.sym === 'G') symG++;
        }));
      } else if (sec.type === 'data_table') {
        (sec.rows || []).forEach(r => (sec.columns || []).forEach(c => {
          if (c.type !== 'symbol') return;
          if (r[c.id] === '✓') symOk++;
          else if (r[c.id] === 'X') symBad++;
          else if (r[c.id] === 'N') symN++;
          else if (r[c.id] === 'G') symG++;
        }));
      }
    });
    return { pages, cells, words, chars, sections, symOk, symBad, symN, symG };
  }

  window.officeOpenDocStatsModal = function () {
    const st = computeDocumentStats();
    const body = document.getElementById('docStatsBody');
    if (!body) return;
    body.innerHTML = `
      <table class="st-cell-table" style="font-size:12px;">
        <tbody>
          <tr><td style="padding:7px;">Sayfa Sayısı (A4)</td><td style="padding:7px;font-weight:700;text-align:right;">${st.pages}</td></tr>
          <tr><td style="padding:7px;">Aktif Bölüm Sayısı</td><td style="padding:7px;font-weight:700;text-align:right;">${st.sections}</td></tr>
          <tr><td style="padding:7px;">Toplam Tablo Hücresi</td><td style="padding:7px;font-weight:700;text-align:right;">${st.cells}</td></tr>
          <tr><td style="padding:7px;">Sözcük Sayısı</td><td style="padding:7px;font-weight:700;text-align:right;">${st.words.toLocaleString('tr-TR')}</td></tr>
          <tr><td style="padding:7px;">Karakter (Boşluksuz)</td><td style="padding:7px;font-weight:700;text-align:right;">${st.chars.toLocaleString('tr-TR')}</td></tr>
          <tr><td style="padding:7px;color:#14573a;font-weight:600;">✓ Uygun Maddeler</td><td style="padding:7px;font-weight:800;color:#14573a;text-align:right;">${st.symOk}</td></tr>
          <tr><td style="padding:7px;color:#991b1b;font-weight:600;">X Uygun Değil (Kusur)</td><td style="padding:7px;font-weight:800;color:#991b1b;text-align:right;">${st.symBad}</td></tr>
          <tr><td style="padding:7px;">N (Uygulaması Yok) / G (Görülemedi)</td><td style="padding:7px;font-weight:700;text-align:right;">${st.symN} / ${st.symG}</td></tr>
        </tbody>
      </table>
    `;
    document.getElementById('docStatsModal').classList.remove('hidden');
  };

  window.officeToggleSheetProtect = function () {
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    S().state.schema.sheetProtected = !S().state.schema.sheetProtected;
    S().renderAll();
    S().showToast(S().state.schema.sheetProtected ? 'Şablon koruması aktif — kilitli hücreler düzenlenemez' : 'Şablon koruması kaldırıldı');
  };

  window.officeToggleLockSelectedCells = function () {
    officeCloseAllPopovers();
    const keys = S().getSelectedCellKeys();
    if (keys.length === 0) return S().showToast('Önce kilitlenecek hücreleri seçin');
    S().ensureStyleDefaults(S().state.schema);
    S().pushUndoSnapshot();
    const next = !S().state.schema.lockedCells[keys[0]];
    keys.forEach(k => {
      if (next) S().state.schema.lockedCells[k] = true;
      else delete S().state.schema.lockedCells[k];
    });
    S().renderAll();
    S().showToast(next ? `${keys.length} hücre kilitlendi (Gözden Geçir → Şablonu Koru ile etkinleştirin)` : `${keys.length} hücrenin kilidi açıldı`);
  };

  // ==========================================================================
  // 14. WORDCRAFT TAM EKRAN DOSYA BACKSTAGE & HTML DIŞA AKTARMA
  // ==========================================================================
  window.officeOpenBackstage = function (tab = 'home') {
    officeCloseAllPopovers();
    officeCloseContextMenu();
    document.getElementById('fileBackstage')?.classList.remove('hidden');
    officeSwitchBackstageTab(tab);
  };

  window.officeCloseBackstage = function () {
    document.getElementById('fileBackstage')?.classList.add('hidden');
  };

  window.officeSwitchBackstageTab = function (tab) {
    document.querySelectorAll('.bs-nav-item[data-bstab]').forEach(b => b.classList.toggle('active', b.dataset.bstab === tab));
    const box = document.getElementById('bsMainContent');
    if (!box) return;
    const s = S().state.schema;

    if (tab === 'home') {
      const hour = new Date().getHours();
      const greet = hour < 12 ? 'Günaydın' : (hour < 18 ? 'İyi Çalışmalar' : 'İyi Akşamlar');
      const recents = (S().state.allVersions || []).filter(v => !v.is_archived).slice(0, 8);
      box.innerHTML = `
        <h1 class="bs-heading">${greet} — Hızlı Rapor Studio</h1>
        <p class="bs-sub">Hazır bir resmi rapor şablonundan başlayın veya kayıtlı sürümlerinizden devam edin.</p>
        <div class="bs-tpl-grid">
          ${S().blueprints.map(bp => `
            <button type="button" class="bs-tpl-card" onclick="loadBlueprintById('${bp.id}'); officeCloseBackstage();">
              <div class="bs-tpl-preview">
                <div class="bar-top"></div>
                <div class="bar-l"></div>
                <div class="bar-grid"></div>
              </div>
              <div style="font-size:12.5px;font-weight:700;margin-bottom:3px;">${S().escapeHtml(bp.name)}</div>
              <div style="font-size:11px;color:var(--of-muted);">${S().escapeHtml(bp.meta)}</div>
            </button>
          `).join('')}
        </div>
        <h2 style="font-size:16px;font-weight:700;margin:0 0 10px 0;">Son Kayıtlı Versiyonlar</h2>
        ${recents.length === 0 ? `<div style="color:var(--of-muted);font-size:12.5px;">Henüz kayıtlı versiyon yok. Üstteki "Kaydet (v1)" düğmesiyle ilk sürümünüzü oluşturabilirsiniz.</div>` : recents.map(v => `
          <div class="st-ver-card" style="max-width:740px;">
            <div>
              <strong>${S().escapeHtml(v.title)}</strong> <span style="color:var(--of-word);font-weight:700;">${S().escapeHtml(v.version_label)}</span>
              <div style="font-size:11px;color:var(--of-muted);">${S().escapeHtml(v.form_code)} · ${S().escapeHtml(v.changelog || '')}</div>
            </div>
            <button type="button" class="st-btn st-btn-outline st-btn-xs" onclick="window.__Studio.loadVersionById('${S().escapeHtml(v.id)}'); officeCloseBackstage();">Aç</button>
          </div>
        `).join('')}
      `;
    } else if (tab === 'versions') {
      officeCloseBackstage();
      window.openVersionHistoryModal();
    } else if (tab === 'info') {
      officeCloseBackstage();
      window.openBrandingModal();
    } else if (tab === 'export') {
      box.innerHTML = `
        <h1 class="bs-heading">Yazdır &amp; Dışa Aktar</h1>
        <p class="bs-sub">${S().escapeHtml(s?.title || 'Rapor Şablonu')} belgesini istediğiniz formatta dışa aktarın.</p>
        <div class="bs-tpl-grid" style="max-width:860px;">
          <button type="button" class="bs-tpl-card" onclick="officeCloseBackstage(); setTimeout(() => window.print(), 120);">
            <div style="font-size:14px;font-weight:800;color:var(--of-word);margin-bottom:4px;">PDF / Yazdır (A4)</div>
            <div style="font-size:11.5px;color:var(--of-muted);">Tüm A4 sayfalarını filigran, tablo stilleri ve grafiklerle birlikte birebir PDF olarak kaydeder.</div>
          </button>
          <button type="button" class="bs-tpl-card" onclick="officeExportStandaloneHtml(); officeCloseBackstage();">
            <div style="font-size:14px;font-weight:800;color:#0284c7;margin-bottom:4px;">Tek Dosya HTML Rapor</div>
            <div style="font-size:11.5px;color:var(--of-muted);">Herhangi bir tarayıcıda çevrimdışı açılabilen tam görsel HTML belgesi indirir.</div>
          </button>
          <button type="button" class="bs-tpl-card" onclick="exportCurrentSchemaJson(); officeCloseBackstage();">
            <div style="font-size:14px;font-weight:800;color:var(--of-excel);margin-bottom:4px;">Şablon Yedeği (JSON)</div>
            <div style="font-size:11.5px;color:var(--of-muted);">Tüm bölüm, formül, stil ve koşullu kuralları başka bilgisayara aktarmak için JSON indirir.</div>
          </button>
          <button type="button" class="bs-tpl-card" onclick="officeCloseBackstage(); document.getElementById('importJsonInput').click();">
            <div style="font-size:14px;font-weight:800;color:#7c3aed;margin-bottom:4px;">JSON Şablon İçe Aktar</div>
            <div style="font-size:11.5px;color:var(--of-muted);">Daha önce dışa aktardığınız bir şablon dosyasını stüdyoya yükler.</div>
          </button>
          <button type="button" class="bs-tpl-card" onclick="officeExportTableCsv(); officeCloseBackstage();">
            <div style="font-size:14px;font-weight:800;color:#107c41;margin-bottom:4px;">Seçili Tablo → Excel CSV</div>
            <div style="font-size:11.5px;color:var(--of-muted);">Aktif ölçüm tablosunu Türkçe karakter uyumlu (UTF-8 BOM) Excel CSV dosyası olarak indirir.</div>
          </button>
        </div>
      `;
    }
  };

  window.officeExportStandaloneHtml = function () {
    const canvas = document.getElementById('liveA4Canvas');
    if (!canvas) return;
    const s = S().state.schema;
    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${S().escapeHtml(s?.title || 'Rapor')}</title>
      <style>body{margin:0;padding:16px;background:#e6eaef;display:flex;flex-direction:column;align-items:center;font-family:'Segoe UI',Arial,sans-serif;}
      @media print{body{padding:0;background:#fff;}.tkm-a4-page{box-shadow:none!important;margin:0!important;page-break-after:always;}}</style>
      <link rel="stylesheet" href="${location.origin}/studio.css">
      </head><body><div data-pdf-theme="${S().escapeHtml(s?.pdfTheme || 'rams_navy')}">${canvas.innerHTML}</div></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(s?.template_key || 'rapor')}.html`;
    a.click();
    S().showToast('Tek dosya HTML rapor indirildi');
  };

  // ==========================================================================
  // 15. KOMUT ARAMA PALETİ (WORDCRAFT SEARCH COMMANDS — CTRL+K)
  // ==========================================================================
  const COMMAND_INDEX = [
    { label: 'Kalın (Bold)', cat: 'Giriş', run: () => window.toggleCellStyleBool('bold') },
    { label: 'İtalik (Italic)', cat: 'Giriş', run: () => window.toggleCellStyleBool('italic') },
    { label: 'Altı Çizili (Underline)', cat: 'Giriş', run: () => window.toggleCellStyleBool('underline') },
    { label: 'Biçim Boyacısı', cat: 'Pano', run: () => window.toggleFormatPainter() },
    { label: 'Hücreleri Birleştir / Ayır (Merge)', cat: 'Hizalama', run: () => officeMergeOrUnmergeCells() },
    { label: 'Metni Kaydır (Wrap Text)', cat: 'Hizalama', run: () => officeToggleWrapText() },
    { label: 'BÜYÜK HARF Yap', cat: 'Yazı Tipi', run: () => officeTransformTextCase('upper') },
    { label: 'küçük harf Yap', cat: 'Yazı Tipi', run: () => officeTransformTextCase('lower') },
    { label: 'Madde İşaretli Liste (•)', cat: 'Paragraf', run: () => window.toggleCellListFormat('bullet') },
    { label: 'Numaralı Liste (1. 2. 3.)', cat: 'Paragraf', run: () => window.toggleCellListFormat('number') },
    { label: 'İşlev Ekle (fx Formül Sihirbazı)', cat: 'Formüller', run: () => officeOpenInsertFunctionModal() },
    { label: 'Otomatik Toplam (=TOPLA)', cat: 'Formüller', run: () => officeInsertQuickFormula('TOPLA') },
    { label: 'Ortalama Formülü (=ORTALAMA)', cat: 'Formüller', run: () => officeInsertQuickFormula('ORTALAMA') },
    { label: 'Formülleri Göster / Gizle', cat: 'Formüller', run: () => officeToggleShowFormulas() },
    { label: 'Veri Çubuğu Ekle (Koşullu Biçim)', cat: 'Stiller', run: () => officeAddVisualCondRule('databar', '#3b82f6') },
    { label: 'Renk Ölçeği Ekle (Yeşil-Sarı-Kırmızı)', cat: 'Stiller', run: () => officeAddVisualCondRule('colorscale', 'gyr') },
    { label: 'Tabloyu A→Z Sırala', cat: 'Veri', run: () => officeSortTableBySelectedCol('asc') },
    { label: 'Tabloyu Z→A Sırala', cat: 'Veri', run: () => officeSortTableBySelectedCol('desc') },
    { label: 'Otomatik Filtre Aç / Kapat', cat: 'Veri', run: () => officeToggleAutoFilter() },
    { label: 'Toplam Satırı Ekle / Kaldır', cat: 'Tablo', run: () => officeToggleTotalRow() },
    { label: 'Yinelenen Satırları Kaldır', cat: 'Veri', run: () => officeRemoveDuplicates() },
    { label: 'Metni Sütunlara Dönüştür', cat: 'Veri', run: () => officeOpenTextToColsModal() },
    { label: 'CSV Dışa Aktar (Excel)', cat: 'Veri', run: () => officeExportTableCsv() },
    { label: 'Bul ve Değiştir (Ctrl+H)', cat: 'Düzenleme', run: () => officeOpenFindReplace(true) },
    { label: 'Grafik Bloğu Ekle (Sütun/Pasta)', cat: 'Ekle', run: () => officeOpenInsertChartModal() },
    { label: 'Fotoğraf / Görsel Ekle', cat: 'Ekle', run: () => document.getElementById('insertImageInput').click() },
    { label: 'Uyarı / Şekil Kutusu Ekle', cat: 'Ekle', run: () => officeInsertCalloutBlock('warn') },
    { label: 'İmza Satırı Ekle', cat: 'Ekle', run: () => officeInsertSignatureBlock() },
    { label: 'Ölçüm Tablosu Ekle', cat: 'Ekle', run: () => window.addNewSection('data_table') },
    { label: 'Filigran: TASLAK Ekle', cat: 'Tasarım', run: () => officeSetWatermark('TASLAK') },
    { label: 'Özel Filigran Ayarları', cat: 'Tasarım', run: () => officeOpenCustomWatermarkModal() },
    { label: 'A4 Sayfa Kenarlığı (Kurumsal)', cat: 'Tasarım', run: () => officeSetPageBorder('corporate') },
    { label: 'Yatay / Dikey A4 Değiştir', cat: 'Sayfa Düzeni', run: () => officeToggleOrientation() },
    { label: 'Sütun Genişliklerini Eşitle', cat: 'Tablo', run: () => officeDistributeColsEvenly() },
    { label: 'Yeni Yorum Ekle', cat: 'Gözden Geçir', run: () => officeAddCommentForSelection() },
    { label: 'Rapor Denetçisini Aç', cat: 'Gözden Geçir', run: () => officeOpenSideTab('audit') },
    { label: 'Sözcük ve Hücre Sayımı', cat: 'Gözden Geçir', run: () => officeOpenDocStatsModal() },
    { label: 'Şablonu Koru / Korumayı Kaldır', cat: 'Gözden Geçir', run: () => officeToggleSheetProtect() },
    { label: 'İki Sayfa Yan Yana Görünümü', cat: 'Görünüm', run: () => officeSetViewMode('twoup') },
    { label: 'Sayfa Sonu Önizleme', cat: 'Görünüm', run: () => officeSetViewMode('pagebreak') },
    { label: 'Odak Modu (Focus)', cat: 'Görünüm', run: () => officeToggleFocusMode() },
    { label: 'Koyu / Açık Mod Değiştir (Dark Mode)', cat: 'Görünüm', run: () => officeToggleDarkMode() },
    { label: 'PDF İndir / Yazdır', cat: 'Dosya', run: () => window.print() },
    { label: 'Yeni Versiyon Kaydet (Ctrl+S)', cat: 'Dosya', run: () => window.openSaveVersionModal() }
  ];

  window.officeOpenCommandSearch = function () {
    officeFilterCommands(document.getElementById('commandSearchInput')?.value || '');
  };

  window.officeFilterCommands = function (q) {
    const dd = document.getElementById('commandPaletteDropdown');
    if (!dd) return;
    const term = String(q || '').trim().toLowerCase();
    OfficeState.cmdFiltered = term
      ? COMMAND_INDEX.filter(c => c.label.toLowerCase().includes(term) || c.cat.toLowerCase().includes(term)).slice(0, 12)
      : COMMAND_INDEX.slice(0, 10);
    OfficeState.cmdActiveIdx = 0;
    dd.classList.remove('hidden');
    if (OfficeState.cmdFiltered.length === 0) {
      dd.innerHTML = `<div style="padding:10px;text-align:center;color:var(--of-muted);font-size:11.5px;">Komut bulunamadı</div>`;
      return;
    }
    dd.innerHTML = OfficeState.cmdFiltered.map((c, idx) => `
      <button type="button" class="cmd-item${idx === 0 ? ' selected' : ''}" onmousedown="event.preventDefault(); officeRunCommandIdx(${idx});">
        <span>${S().escapeHtml(c.label)}</span>
        <span class="cmd-item-cat">${S().escapeHtml(c.cat)}</span>
      </button>
    `).join('');
  };

  window.officeRunCommandIdx = function (idx) {
    const cmd = OfficeState.cmdFiltered[idx];
    document.getElementById('commandPaletteDropdown')?.classList.add('hidden');
    const inp = document.getElementById('commandSearchInput');
    if (inp) { inp.value = ''; inp.blur(); }
    if (cmd && cmd.run) cmd.run();
  };

  window.officeCommandSearchKeydown = function (ev) {
    const dd = document.getElementById('commandPaletteDropdown');
    if (!dd || dd.classList.contains('hidden')) return;
    const len = OfficeState.cmdFiltered.length;
    if (ev.key === 'ArrowDown' && len > 0) {
      ev.preventDefault();
      OfficeState.cmdActiveIdx = (OfficeState.cmdActiveIdx + 1) % len;
      dd.querySelectorAll('.cmd-item').forEach((el, i) => el.classList.toggle('selected', i === OfficeState.cmdActiveIdx));
    } else if (ev.key === 'ArrowUp' && len > 0) {
      ev.preventDefault();
      OfficeState.cmdActiveIdx = (OfficeState.cmdActiveIdx - 1 + len) % len;
      dd.querySelectorAll('.cmd-item').forEach((el, i) => el.classList.toggle('selected', i === OfficeState.cmdActiveIdx));
    } else if (ev.key === 'Enter' && len > 0) {
      ev.preventDefault();
      officeRunCommandIdx(OfficeState.cmdActiveIdx);
    } else if (ev.key === 'Escape') {
      dd.classList.add('hidden');
      ev.target.blur();
    }
  };

  // ==========================================================================
  // 16. SAĞ TIK BAĞLAM MENÜSÜ, OTOMATİK KAYIT & KISAYOLLAR
  // ==========================================================================
  function openCellContextMenu(x, y) {
    officeCloseAllPopovers();
    const menu = document.getElementById('cellContextMenu');
    if (!menu) return;
    menu.classList.remove('hidden');
    const mw = menu.offsetWidth || 224;
    const mh = menu.offsetHeight || 310;
    menu.style.left = `${Math.min(window.innerWidth - mw - 8, Math.max(8, x))}px`;
    menu.style.top = `${Math.min(window.innerHeight - mh - 8, Math.max(8, y))}px`;
  }

  window.officeCloseContextMenu = function () {
    document.getElementById('cellContextMenu')?.classList.add('hidden');
  };

  window.officeToggleAutoSave = function (checked) {
    S().state.autoSave = Boolean(checked);
    const ind = document.getElementById('statusAutoSave');
    if (ind) ind.textContent = S().state.autoSave ? 'Otomatik Kayıt Açık' : 'Otomatik Kayıt Kapalı';
  };

  let autoSaveTimer = null;
  function scheduleAutoSave() {
    if (!S().state.autoSave || !S().state.schema) return;
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
          savedAt: new Date().toISOString(),
          schema: S().state.schema
        }));
        const ind = document.getElementById('statusAutoSave');
        if (ind) {
          const t = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          ind.textContent = `Otomatik Kaydedildi (${t})`;
        }
      } catch (_) {}
    }, 800);
  }

  function bindGlobalOfficeEvents() {
    document.addEventListener('click', (ev) => {
      if (OfficeState.activePopoverId) {
        const pop = document.getElementById(OfficeState.activePopoverId);
        if (pop && !pop.contains(ev.target)) officeCloseAllPopovers();
      }
      const ctx = document.getElementById('cellContextMenu');
      if (ctx && !ctx.classList.contains('hidden') && !ctx.contains(ev.target)) {
        officeCloseContextMenu();
      }
      const cmdDd = document.getElementById('commandPaletteDropdown');
      const cmdInp = document.getElementById('commandSearchInput');
      if (cmdDd && !cmdDd.classList.contains('hidden') && !cmdDd.contains(ev.target) && ev.target !== cmdInp) {
        cmdDd.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (ev) => {
      const mod = ev.ctrlKey || ev.metaKey;
      const tag = (ev.target?.tagName || '').toUpperCase();
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(ev.target?.isContentEditable);

      if ((mod && ev.key.toLowerCase() === 'k') || (ev.altKey && ev.key.toLowerCase() === 'q')) {
        ev.preventDefault();
        const inp = document.getElementById('commandSearchInput');
        if (inp) { inp.focus(); officeOpenCommandSearch(); }
        return;
      }
      if (mod && ev.key.toLowerCase() === 'f') {
        ev.preventDefault();
        officeOpenFindReplace(false);
        return;
      }
      if (mod && ev.key.toLowerCase() === 'h') {
        ev.preventDefault();
        officeOpenFindReplace(true);
        return;
      }
      if (mod && ev.key === 'F1') {
        ev.preventDefault();
        officeToggleRibbonCollapse();
        return;
      }
      if (mod && (ev.key === '`' || ev.code === 'Backquote')) {
        ev.preventDefault();
        officeToggleShowFormulas();
        return;
      }
      if (ev.key === 'F9') {
        ev.preventDefault();
        officeRecalculateAll();
        return;
      }
      if (ev.shiftKey && ev.key === 'F3') {
        ev.preventDefault();
        officeOpenInsertFunctionModal();
        return;
      }
      if (ev.key === 'Escape') {
        officeCloseAllPopovers();
        officeCloseContextMenu();
        officeCloseBackstage();
        officeCloseFindReplace();
        ['insertFunctionModal', 'condRuleModal', 'insertChartModal', 'docStatsModal', 'textToColsModal', 'customWatermarkModal'].forEach(window.closeModal);
        if (S().state.focusMode) officeToggleFocusMode();
        return;
      }

      if (isEditing) return;

      if (mod && ev.key.toLowerCase() === 'c' && S().state.selectedCellKey) {
        ev.preventDefault();
        officeClipboardCopy();
      } else if (mod && ev.key.toLowerCase() === 'x' && S().state.selectedCellKey) {
        ev.preventDefault();
        officeClipboardCut();
      } else if (mod && ev.key.toLowerCase() === 'd' && S().state.selectedCellKey) {
        ev.preventDefault();
        officeFillDirection('down');
      } else if (mod && ev.key.toLowerCase() === 'r' && S().state.selectedCellKey) {
        ev.preventDefault();
        officeFillDirection('right');
      }
    });
  }

  // ==========================================================================
  // 16B. EXCEL POINT-MODE FORMÜL SEÇİMİ, FARE İLE ARALIK SEÇİMİ & EVRENSEL BOYUTLANDIRMA
  // ==========================================================================
  let fxFormulaEditing = false;
  function bindFormulaPointMode() {
    const fx = document.getElementById('fxCellInput');
    const canvas = document.getElementById('liveA4Canvas');
    if (!fx) return;
    fx.addEventListener('focus', () => { fxFormulaEditing = true; });
    fx.addEventListener('blur', () => { setTimeout(() => { fxFormulaEditing = false; }, 160); });
    // mousedown aşamasında blur olmasını engelle ki '=' yazarken hücreye tıklayınca doğrudan koordinat eklensin!
    if (canvas) {
      canvas.addEventListener('mousedown', (ev) => {
        if (!fxFormulaEditing || !String(fx.value || '').trim().startsWith('=')) return;
        const cell = ev.target.closest('td[data-cell-key], th[data-cell-key]');
        if (!cell || !cell.dataset.cellKey || cell.dataset.cellKey === S().state.selectedCellKey) return;
        ev.preventDefault();
        ev.stopPropagation();
        tryInsertFormulaRef(cell.dataset.cellKey, ev);
      }, true);
    }
  }

  let lastPointInsertTs = 0;
  function tryInsertFormulaRef(clickedKey, ev) {
    const fx = document.getElementById('fxCellInput');
    if (!fx || !fxFormulaEditing) return false;
    const val = String(fx.value || '');
    if (!val.trim().startsWith('=')) return false;
    if (clickedKey === S().state.selectedCellKey) return false;
    if (Date.now() - lastPointInsertTs < 250) return true; // mousedown + click çift tetiklenmeyi engelle
    lastPointInsertTs = Date.now();
    const p = parseCellKeyParts(clickedKey);
    if (!p) return false;
    const ref = `${S().colIndexToExcelLetter(p.c)}${p.r + 1}`;
    const pos = fx.selectionStart ?? val.length;
    const end = fx.selectionEnd ?? val.length;
    const before = val.slice(0, pos);
    const after = val.slice(end);
    // Öncesinde operatör/parantez/ayırıcı varsa ekle, yoksa noktalı virgül koy
    const needsSep = before.length > 1 && /[A-Z0-9)]$/i.test(before.trim());
    const insertStr = (needsSep ? (ev && ev.shiftKey ? ':' : ';') : '') + ref;
    fx.value = before + insertStr + after;
    const nextPos = pos + insertStr.length;
    fx.focus();
    fx.selectionStart = fx.selectionEnd = nextPos;
    fx.dispatchEvent(new Event('input', { bubbles: true }));
    S().showToast(`Formüle hücre eklendi: ${ref}`);
    return true;
  }

  // FARE İLE SÜRÜKLEYEREK EXCEL ARALIK SEÇİMİ (DRAG-SELECT)
  function bindDragRangeSelection() {
    const canvas = document.getElementById('liveA4Canvas');
    if (!canvas) return;
    let dragStartKey = null;
    let dragStartParts = null;
    let dragged = false;

    canvas.addEventListener('mousedown', (ev) => {
      if (ev.button !== 0 || ev.shiftKey) return;
      if (ev.target.closest('.col-resize-handle, .row-resize-handle, .a4-fill-handle, .tbl-filter-btn, .a4-click-opt, .a4-click-sym')) return;
      const cell = ev.target.closest('td[data-cell-key], th[data-cell-key]');
      if (!cell || cell.isContentEditable) return;
      dragStartKey = cell.dataset.cellKey;
      dragStartParts = parseCellKeyParts(dragStartKey);
      dragged = false;
    });

    canvas.addEventListener('mousemove', (ev) => {
      if (!dragStartKey || !dragStartParts || !(ev.buttons & 1)) return;
      const over = ev.target.closest('td[data-cell-key], th[data-cell-key]');
      if (!over || !over.dataset.cellKey || over.dataset.cellKey === dragStartKey) return;
      const p = parseCellKeyParts(over.dataset.cellKey);
      if (!p || p.secId !== dragStartParts.secId || p.tIdx !== dragStartParts.tIdx) return;
      dragged = true;
      ev.preventDefault();
      try { window.getSelection()?.removeAllRanges(); } catch (_) {}
      S().state.selectedCellKey = dragStartKey;
      S().state.selectedCellRange = computeCellRangeKeys(dragStartKey, over.dataset.cellKey);
      S().applySelectionHighlightDom();
      S().syncCellStyleRibbon();
    });

    window.addEventListener('mouseup', () => {
      if (dragged) {
        dragged = false;
        updateSelectionStats();
      }
      dragStartKey = null;
      dragStartParts = null;
    });
  }

  // EVRENSEL SATIR YÜKSEKLİĞİ & SÜTUN GENİŞLİĞİ SÜRÜKLEME (TÜM TABLOLARDA!)
  function attachUniversalResizers(root, s) {
    const tooltip = document.getElementById('colResizeTooltip');
    S().ensureStyleDefaults(s);

    // 1. SATIR YÜKSEKLİĞİ SÜRÜKLEME (TÜM TABLO SATIRLARININ ALT ÇİZGİSİ)
    root.querySelectorAll('table.tkm-table').forEach(tbl => {
      const secId = tbl.closest('.a4-interactive-block')?.dataset?.secId;
      const sec = (s.sections || []).find(x => x.id === secId);
      const rows = tbl.querySelectorAll('tr:not(.excel-col-letters)');
      rows.forEach((tr) => {
        const rowCells = Array.from(tr.querySelectorAll('th[data-cell-key], td[data-cell-key]'));
        if (rowCells.length === 0) return;
        // İlk 2 hücreye (ve geniş hücrelere) alt boyutlandırma çizgisi ekle
        rowCells.forEach(cell => {
          if (cell.querySelector('.row-resize-handle')) return;
          const h = document.createElement('div');
          h.className = 'row-resize-handle';
          h.title = 'Satır yüksekliğini büyütmek/küçültmek için aşağı veya yukarı sürükleyin';
          h.addEventListener('click', e => e.stopPropagation());
          h.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            S().pushUndoSnapshot();
            const startY = ev.clientY;
            const startH = tr.getBoundingClientRect().height || 22;
            const zoom = S().state.zoom || 1;
            let finalH = Math.round(startH / zoom);

            h.classList.add('dragging');
            if (tooltip) tooltip.classList.remove('hidden');

            const onMove = (me) => {
              const dy = (me.clientY - startY) / zoom;
              finalH = Math.max(14, Math.min(260, Math.round(startH / zoom + dy)));
              tr.style.height = `${finalH}px`;
              rowCells.forEach(c => c.style.setProperty('height', `${finalH}px`, 'important'));
              if (tooltip) {
                tooltip.textContent = `Satır Yüksekliği: ${finalH}px`;
                tooltip.style.left = `${me.clientX + 12}px`;
                tooltip.style.top = `${me.clientY - 26}px`;
              }
            };

            const onUp = () => {
              h.classList.remove('dragging');
              if (tooltip) tooltip.classList.add('hidden');
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);

              const dtRowIdx = tr.dataset.dtRow !== undefined ? Number(tr.dataset.dtRow) : -1;
              if (sec && sec.type === 'data_table' && dtRowIdx >= 0 && sec.rows[dtRowIdx]) {
                sec.rows[dtRowIdx]._height = finalH;
              } else {
                rowCells.forEach(c => {
                  const k = c.dataset.cellKey;
                  if (!k) return;
                  if (!s.cellStyles[k]) s.cellStyles[k] = {};
                  s.cellStyles[k].minHeight = finalH;
                });
              }
              S().renderAll();
              S().showToast(`Satır yüksekliği: ${finalH}px`);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          });
          cell.appendChild(h);
        });
      });

      // 2. DATA_TABLE DIŞINDAKİ TABLOLAR İÇİN DE SÜTUN GENİŞLİĞİ SÜRÜKLEME
      if (!tbl.dataset.dtSec) {
        const tblKey = tbl.dataset.tblKey;
        const colsDom = Array.from(tbl.querySelectorAll('colgroup col'));
        const firstRow = tbl.querySelector('tr:not(.excel-col-letters)');
        if (!tblKey || colsDom.length < 2 || !firstRow) return;
        const topCells = Array.from(firstRow.querySelectorAll('th, td'));
        let colCursor = 0;
        topCells.forEach((cell) => {
          const span = Number(cell.colSpan || 1);
          const rightColIdx = colCursor + span - 1;
          colCursor += span;
          if (rightColIdx >= colsDom.length - 1 || cell.querySelector('.col-resize-handle')) return;

          const ch = document.createElement('div');
          ch.className = 'col-resize-handle';
          ch.title = 'Sütun genişliğini değiştirmek için sürükleyin';
          ch.addEventListener('click', e => e.stopPropagation());
          ch.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            S().pushUndoSnapshot();
            const tblW = tbl.getBoundingClientRect().width || 700;
            const startX = ev.clientX;
            const curWidths = colsDom.map(c => parseFloat(c.style.width) || (100 / colsDom.length));
            const startL = curWidths[rightColIdx];
            const startR = curWidths[rightColIdx + 1];
            const combined = startL + startR;
            ch.classList.add('dragging');
            if (tooltip) tooltip.classList.remove('hidden');

            const onMove = (me) => {
              const deltaPct = ((me.clientX - startX) / tblW) * 100;
              const newL = Math.round(Math.max(5, Math.min(combined - 5, startL + deltaPct)) * 10) / 10;
              const newR = Math.round((combined - newL) * 10) / 10;
              curWidths[rightColIdx] = newL;
              curWidths[rightColIdx + 1] = newR;
              colsDom[rightColIdx].style.width = `${newL}%`;
              colsDom[rightColIdx + 1].style.width = `${newR}%`;
              if (tooltip) {
                tooltip.textContent = `${newL.toFixed(1)}% ↔ ${newR.toFixed(1)}%`;
                tooltip.style.left = `${me.clientX + 12}px`;
                tooltip.style.top = `${me.clientY - 28}px`;
              }
            };
            const onUp = () => {
              ch.classList.remove('dragging');
              if (tooltip) tooltip.classList.add('hidden');
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
              s.tableColWidths[tblKey] = curWidths.map(w => Math.round(w * 10) / 10);
              S().renderAll();
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          });
          cell.appendChild(ch);
        });
      }
    });
  }

  window.officeSetSelectedRowHeight = function (rawVal) {
    const key = S().state.selectedCellKey;
    if (!key) return S().showToast('Önce bir hücre seçin');
    const el = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    const tr = el?.closest('tr');
    if (!tr) return;
    const str = String(rawVal || '').trim().replace(',', '.');
    if (str && /[.,]$/.test(str)) return;
    const num = str ? parseFloat(str) : 0;
    if (str && (isNaN(num) || num < 10)) return;
    const s = S().state.schema;
    S().ensureStyleDefaults(s);
    S().pushUndoSnapshot();
    const rowCells = Array.from(tr.querySelectorAll('th[data-cell-key], td[data-cell-key]'));
    rowCells.forEach(c => {
      const k = c.dataset.cellKey;
      if (!k) return;
      if (!s.cellStyles[k]) s.cellStyles[k] = {};
      if (!num) delete s.cellStyles[k].minHeight;
      else s.cellStyles[k].minHeight = Math.max(12, Math.min(260, Math.round(num)));
    });
    S().renderLiveA4();
    S().syncCellStyleRibbon();
  };

  window.officeStepRowHeight = function (delta) {
    const key = S().state.selectedCellKey;
    if (!key) return S().showToast('Önce bir hücre seçin');
    const el = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    const cur = Number(S().state.schema.cellStyles[key]?.minHeight || Math.round((el?.closest('tr')?.getBoundingClientRect().height || 24) / (S().state.zoom || 1)));
    const next = Math.max(14, Math.min(260, cur + delta));
    officeSetSelectedRowHeight(next);
    const inp = document.getElementById('csrHeight');
    if (inp) inp.value = String(next);
  };

  // ==========================================================================
  // 16C. KAPSAMLI EXCEL / WORD PANO YAPIŞTIRMA MOTORU (TABLO + STİL + BİRLEŞTİRME + GRAFİK + RESİM)
  // ==========================================================================
  function cssColorToHex(raw) {
    if (!raw) return '';
    const v = String(raw).trim().toLowerCase();
    if (!v || v === 'transparent' || v === 'none' || v === 'initial' || v === 'inherit' || v === 'windowtext' || v === 'auto') return '';
    if (v.startsWith('#')) {
      if (v.length === 4) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
      return v.slice(0, 7);
    }
    const rgb = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (rgb) {
      if (rgb[4] !== undefined && parseFloat(rgb[4]) === 0) return '';
      const hex = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0');
      return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
    }
    const named = { yellow: '#ffff00', red: '#ff0000', green: '#008000', blue: '#0000ff', navy: '#000080', gray: '#808080', silver: '#c0c0c0', white: '#ffffff', black: '#000000', orange: '#ffa500' };
    return named[v] || '';
  }

  function parseCssDeclarations(cssText) {
    const out = {};
    String(cssText || '').split(';').forEach(decl => {
      const idx = decl.indexOf(':');
      if (idx < 0) return;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const val = decl.slice(idx + 1).replace(/!important/gi, '').trim();
      if (prop && val) out[prop] = val;
    });
    return out;
  }

  function extractExcelStyleSheetRules(doc) {
    const map = {};
    doc.querySelectorAll('style').forEach(stEl => {
      const css = stEl.textContent || '';
      const ruleRe = /([^{}]+)\{([^{}]+)\}/g;
      let m;
      while ((m = ruleRe.exec(css)) !== null) {
        const decls = parseCssDeclarations(m[2]);
        m[1].split(',').forEach(sel => {
          const cls = sel.trim().match(/\.([A-Za-z0-9_-]+)/);
          if (cls) map[cls[1]] = Object.assign(map[cls[1]] || {}, decls);
        });
      }
    });
    return map;
  }

  function extractCellStyleFromHtmlElement(el, classRules) {
    const merged = {};
    Array.from(el.classList || []).forEach(c => {
      if (classRules[c]) Object.assign(merged, classRules[c]);
    });
    Object.assign(merged, parseCssDeclarations(el.getAttribute('style') || ''));

    const st = {};
    const bg = cssColorToHex(merged['background-color'] || merged['background']);
    if (bg && bg !== '#ffffff') st.bg = bg;
    const fg = cssColorToHex(merged['color']);
    if (fg && fg !== '#000000') st.color = fg;

    const fw = merged['font-weight'] || '';
    if (fw === 'bold' || fw === 'bolder' || Number(fw) >= 600 || el.tagName === 'TH' || el.querySelector('b, strong')) {
      st.bold = true;
    }
    if ((merged['font-style'] || '').includes('italic') || el.querySelector('i, em')) st.italic = true;
    const td = merged['text-decoration'] || '';
    if (td.includes('underline') || el.querySelector('u')) st.underline = true;
    if (td.includes('line-through') || el.querySelector('s, strike')) st.strike = true;

    const align = (merged['text-align'] || el.getAttribute('align') || '').toLowerCase();
    if (['left', 'center', 'right', 'justify'].includes(align)) st.align = align;
    const valign = (merged['vertical-align'] || el.getAttribute('valign') || '').toLowerCase();
    if (['top', 'middle', 'bottom'].includes(valign)) st.valign = valign;

    const fsRaw = merged['font-size'] || '';
    const ptM = fsRaw.match(/([\d.]+)\s*pt/i);
    const pxM = fsRaw.match(/([\d.]+)\s*px/i);
    if (ptM) st.fontSize = Math.max(5, Math.min(24, Math.round(parseFloat(ptM[1]) * 10) / 10));
    else if (pxM) st.fontSize = Math.max(5, Math.min(24, Math.round((parseFloat(pxM[1]) * 0.75) * 10) / 10));

    if (merged['font-family']) st.fontFamily = merged['font-family'];
    return st;
  }

  function parseHtmlTableToGrid(tableEl, classRules) {
    const trs = Array.from(tableEl.querySelectorAll('tr'));
    const grid = [];
    const occupied = new Set();
    let maxCols = 0;

    trs.forEach((tr, rIdx) => {
      if (!grid[rIdx]) grid[rIdx] = [];
      let cCursor = 0;
      Array.from(tr.children).forEach(td => {
        if (td.tagName !== 'TD' && td.tagName !== 'TH') return;
        while (occupied.has(`${rIdx}:${cCursor}`)) cCursor++;
        const cs = Math.max(1, parseInt(td.getAttribute('colspan') || '1', 10));
        const rs = Math.max(1, parseInt(td.getAttribute('rowspan') || '1', 10));
        const text = (td.innerText || td.textContent || '').replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
        const style = extractCellStyleFromHtmlElement(td, classRules);
        grid[rIdx][cCursor] = { text, style, colspan: cs, rowspan: rs, isHeader: td.tagName === 'TH' };

        for (let dr = 0; dr < rs; dr++) {
          for (let dc = 0; dc < cs; dc++) {
            occupied.add(`${rIdx + dr}:${cCursor + dc}`);
            if (!grid[rIdx + dr]) grid[rIdx + dr] = [];
            if ((dr > 0 || dc > 0) && !grid[rIdx + dr][cCursor + dc]) {
              grid[rIdx + dr][cCursor + dc] = { text: '', style: null, covered: true };
            }
          }
        }
        cCursor += cs;
        if (cCursor > maxCols) maxCols = cCursor;
      });
    });

    // Normalize width
    grid.forEach(row => {
      for (let c = 0; c < maxCols; c++) {
        if (!row[c]) row[c] = { text: '', style: null };
      }
    });
    return { grid, rows: grid.length, cols: maxCols };
  }

  function parseTsvToGrid(plain) {
    const rows = [];
    let row = [];
    let cur = '';
    let inQ = false;
    const txt = String(plain || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (inQ) {
        if (ch === '"' && txt[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') {
        inQ = true;
      } else if (ch === '\t') {
        row.push({ text: cur.trim(), style: null });
        cur = '';
      } else if (ch === '\n') {
        row.push({ text: cur.trim(), style: null });
        rows.push(row);
        row = [];
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.length > 0 || row.length > 0) {
      row.push({ text: cur.trim(), style: null });
      rows.push(row);
    }
    const cleanRows = rows.filter(r => r.some(c => c.text !== ''));
    const maxCols = cleanRows.reduce((m, r) => Math.max(m, r.length), 0);
    cleanRows.forEach(r => { while (r.length < maxCols) r.push({ text: '', style: null }); });
    return { grid: cleanRows, rows: cleanRows.length, cols: maxCols };
  }

  function insertPastedImages(dataUrls, sourceLabel) {
    if (!dataUrls || dataUrls.length === 0) return;
    S().pushUndoSnapshot();
    const curSec = S().getSelectedSection();
    const items = dataUrls.map((src, i) => ({ src, caption: `${sourceLabel || 'Yapıştırılan Grafik / Görsel'} #${i + 1}` }));
    if (curSec && curSec.type === 'image_block') {
      curSec.images = (curSec.images || []).concat(items);
    } else {
      const newSec = {
        id: S().uid('sec_img'),
        type: 'image_block',
        visible: true,
        title: 'YAPIŞTIRILAN GRAFİK / GÖRSELLER',
        cols: items.length === 1 ? 1 : 2,
        images: items
      };
      const secs = S().state.schema.sections;
      secs.splice(Math.max(0, secs.length - 2), 0, newSec);
      S().state.selectedSectionId = newSec.id;
    }
    S().renderAll();
    S().showToast(`${items.length} grafik / fotoğraf Excel/Word panosundan yapıştırıldı!`);
  }

  function pasteParsedGridIntoStudio(parsed, label) {
    if (!parsed || parsed.rows === 0 || parsed.cols === 0) return;
    const s = S().state.schema;
    S().ensureStyleDefaults(s);
    S().pushUndoSnapshot();

    // Hedef: Seçili hücre bir data_table hücresi ise o tabloyu otomatik genişleterek içine yapıştır!
    const selKey = S().state.selectedCellKey;
    const selEl = selKey ? document.querySelector(`[data-cell-key="${CSS.escape(selKey)}"]`) : null;
    const bind = selEl?.dataset?.bind || '';
    const dtCtx = bind.startsWith('dt_cell:') ? getSelectedDataTableContext() : null;

    let styleCount = 0;
    let mergeCount = 0;

    if (dtCtx && dtCtx.sec) {
      const sec = dtCtx.sec;
      // Gereken sütun sayısını otomatik genişlet
      while (sec.columns.length < dtCtx.colIdx + parsed.cols) {
        const nid = S().uid('c');
        sec.columns.push({ id: nid, label: `Sütun ${sec.columns.length + 1}`, group: '', width: 10, type: 'text', align: 'center' });
        sec.rows.forEach(r => { r[nid] = ''; });
      }
      // Sütun genişliklerini %100'e normalize et
      const remW = 100 - (sec.showNoCol ? Number(sec.noColWidth || 4) : 0);
      const sumW = sec.columns.reduce((a, c) => a + Number(c.width || 10), 0);
      if (sumW > 105) {
        const scale = remW / sumW;
        sec.columns.forEach(c => { c.width = Math.max(4, Math.round(c.width * scale * 10) / 10); });
      }
      // Gereken satır sayısını otomatik genişlet
      while (sec.rows.length < dtCtx.rIdx + parsed.rows) {
        const nr = {};
        sec.columns.forEach(c => { nr[c.id] = ''; });
        sec.rows.push(nr);
      }

      const selParts = parseCellKeyParts(selKey);
      const baseR = selParts ? selParts.r : (dtCtx.rIdx + 1);
      const baseC = selParts ? selParts.c : (dtCtx.colIdx + (sec.showNoCol ? 1 : 0));

      parsed.grid.forEach((rowArr, dr) => {
        rowArr.forEach((cellData, dc) => {
          const col = sec.columns[dtCtx.colIdx + dc];
          const row = sec.rows[dtCtx.rIdx + dr];
          if (!col || !row) return;
          if (!cellData.covered) row[col.id] = cellData.text;
          const tKey = `${sec.id}::t0::r${baseR + dr}::c${baseC + dc}`;
          if (cellData.style && Object.keys(cellData.style).length > 0) {
            s.cellStyles[tKey] = Object.assign({}, cellData.style);
            styleCount++;
          }
          if ((cellData.colspan > 1 || cellData.rowspan > 1) && !cellData.covered) {
            s.cellMerges[tKey] = { colspan: cellData.colspan || 1, rowspan: cellData.rowspan || 1 };
            mergeCount++;
          }
        });
      });

      S().renderAll();
      S().showToast(`${label}: ${parsed.rows}×${parsed.cols} hücre (${styleCount} stil, ${mergeCount} birleştirme) tabloya yapıştırıldı!`);
      return;
    }

    // Hedef data_table değilse: Excel/Word tablosundan YENİ TAM ÖLÇEKLİ TABLO BÖLÜMÜ oluştur!
    const hasHeader = parsed.rows > 1 && (parsed.grid[0].some(c => c.isHeader || c.style?.bold) || parsed.rows >= 2);
    const headerRow = hasHeader ? parsed.grid[0] : null;
    const dataRows = hasHeader ? parsed.grid.slice(1) : parsed.grid;
    const eachW = Math.round((100 / parsed.cols) * 10) / 10;

    const newSecId = S().uid('sec_xl');
    const cols = Array.from({ length: parsed.cols }, (_, ci) => ({
      id: S().uid('c'),
      label: headerRow && headerRow[ci]?.text ? headerRow[ci].text : `Sütun ${ci + 1}`,
      group: '',
      width: eachW,
      type: 'text',
      align: headerRow?.[ci]?.style?.align || (ci === 0 ? 'left' : 'center')
    }));

    const rows = dataRows.map(rArr => {
      const obj = {};
      cols.forEach((c, ci) => { obj[c.id] = rArr[ci]?.covered ? '' : (rArr[ci]?.text || ''); });
      return obj;
    });

    const newSec = {
      id: newSecId,
      type: 'data_table',
      visible: true,
      title: 'EXCEL / WORD YAPIŞTIRILAN TABLO',
      subTitle: '',
      showNoCol: false,
      showLegend: false,
      columns: cols,
      rows: rows.length > 0 ? rows : [cols.reduce((o, c) => { o[c.id] = ''; return o; }, {})]
    };

    // Başlık & veri hücre stillerini ve birleştirmelerini birebir koru!
    if (headerRow) {
      headerRow.forEach((cellData, ci) => {
        const k = `${newSecId}::t0::r0::c${ci}`;
        if (cellData.style && Object.keys(cellData.style).length > 0) { s.cellStyles[k] = Object.assign({}, cellData.style); styleCount++; }
        if (cellData.colspan > 1 || cellData.rowspan > 1) { s.cellMerges[k] = { colspan: cellData.colspan || 1, rowspan: cellData.rowspan || 1 }; mergeCount++; }
      });
    }
    dataRows.forEach((rArr, ri) => {
      rArr.forEach((cellData, ci) => {
        const k = `${newSecId}::t0::r${ri + 1}::c${ci}`;
        if (cellData.style && Object.keys(cellData.style).length > 0) { s.cellStyles[k] = Object.assign({}, cellData.style); styleCount++; }
        if ((cellData.colspan > 1 || cellData.rowspan > 1) && !cellData.covered) { s.cellMerges[k] = { colspan: cellData.colspan || 1, rowspan: cellData.rowspan || 1 }; mergeCount++; }
      });
    });

    const secs = s.sections;
    secs.splice(Math.max(0, secs.length - 2), 0, newSec);
    S().state.selectedSectionId = newSecId;
    S().renderAll();
    S().showToast(`${label}: Yeni ${parsed.rows}×${parsed.cols} tablo (${styleCount} stil, ${mergeCount} birleştirme) oluşturuldu!`);
  }

  function processExternalClipboardPayload({ html, plain, imageBlobs }) {
    // 1. Önce panodaki resim/grafik dosyalarını işle (Excel Grafik Ctrl+C / Ekran Görüntüsü / Word Fotoğraf)
    if (imageBlobs && imageBlobs.length > 0) {
      Promise.all(imageBlobs.map(blob => new Promise(res => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.readAsDataURL(blob);
      }))).then(urls => insertPastedImages(urls, 'Excel / Word Grafik'));
      return true;
    }

    // 2. Zengin HTML içeriği (Excel Tablo + Stiller + Birleştirmeler, Word Tablo/Metin/Gömülü Resim)
    if (html && html.trim()) {
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const classRules = extractExcelStyleSheetRules(doc);

        // HTML içinde gömülü veri görselleri (Excel/Word grafik veya fotoğraf) varsa çıkar
        const embeddedImgs = Array.from(doc.querySelectorAll('img[src^="data:image/"]')).map(im => im.getAttribute('src')).filter(Boolean);
        const tables = Array.from(doc.querySelectorAll('table'));

        if (tables.length > 0) {
          const parsed = parseHtmlTableToGrid(tables[0], classRules);
          if (parsed.rows > 0 && parsed.cols > 0) {
            pasteParsedGridIntoStudio(parsed, 'Excel/Word Tablo');
            if (embeddedImgs.length > 0) insertPastedImages(embeddedImgs, 'Gömülü Görsel');
            return true;
          }
        }
        if (embeddedImgs.length > 0) {
          insertPastedImages(embeddedImgs, 'Excel/Word Görsel');
          return true;
        }

        // Word zengin paragraf / liste metni
        const listItems = Array.from(doc.querySelectorAll('li'));
        if (listItems.length > 0) {
          const isOl = Boolean(doc.querySelector('ol'));
          const textLines = listItems.map((li, i) => `${isOl ? `${i + 1}.` : '•'} ${(li.textContent || '').trim()}`).join('\n');
          const key = S().state.selectedCellKey;
          const el = key ? document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`) : null;
          if (el && S().isCellTextEditable(el)) {
            S().pushUndoSnapshot();
            S().applyCellTextToModel(key, textLines, el);
            S().renderAll();
            S().showToast('Word listesi seçili hücreye yapıştırıldı');
            return true;
          }
        }
      } catch (_) {}
    }

    // 3. Kendi iç panomuzla birebir aynı düz metinse zengin iç panoyu (formül + stil) kullan
    if (plain && OfficeState.clipboard && OfficeState.clipboard.lastPlainTsv === plain.replace(/\r\n/g, '\n')) {
      window.officeClipboardPaste('all');
      return true;
    }

    // 4. Excel / Google Sheets TSV düz metin tablosu (\t veya çok satır)
    if (plain && (plain.includes('\t') || plain.includes('\n'))) {
      const parsed = parseTsvToGrid(plain);
      if (parsed.rows > 1 || parsed.cols > 1) {
        pasteParsedGridIntoStudio(parsed, 'Excel TSV Verisi');
        return true;
      }
    }

    // 5. Tekil düz metin -> seçili hücreye yaz
    if (plain && plain.trim()) {
      const key = S().state.selectedCellKey;
      const el = key ? document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`) : null;
      if (el && S().isCellTextEditable(el)) {
        S().pushUndoSnapshot();
        S().applyCellTextToModel(key, plain.trim(), el);
        S().renderAll();
        S().showToast('Metin hücreye yapıştırıldı');
        return true;
      }
    }
    return false;
  }

  function bindNativeExternalPaste() {
    document.addEventListener('paste', (ev) => {
      const tag = (ev.target?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(ev.target?.isContentEditable)) return;

      const cd = ev.clipboardData;
      if (!cd) {
        if (OfficeState.clipboard) { ev.preventDefault(); window.officeClipboardPaste('all'); }
        return;
      }

      const imageBlobs = [];
      Array.from(cd.items || []).forEach(it => {
        if (it.kind === 'file' && it.type && it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) imageBlobs.push(f);
        }
      });

      const html = cd.getData('text/html') || '';
      const plain = cd.getData('text/plain') || '';
      if (imageBlobs.length > 0 || html || plain) {
        ev.preventDefault();
        processExternalClipboardPayload({ html, plain, imageBlobs });
      } else if (OfficeState.clipboard) {
        ev.preventDefault();
        window.officeClipboardPaste('all');
      }
    });
  }

  window.officePasteFromSystemClipboard = async function () {
    officeCloseAllPopovers();
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        let html = '', plain = '';
        const imageBlobs = [];
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) imageBlobs.push(await item.getType(type));
            else if (type === 'text/html') html = await (await item.getType(type)).text();
            else if (type === 'text/plain') plain = await (await item.getType(type)).text();
          }
        }
        if (processExternalClipboardPayload({ html, plain, imageBlobs })) return;
      } else if (navigator.clipboard && navigator.clipboard.readText) {
        const plain = await navigator.clipboard.readText();
        if (processExternalClipboardPayload({ html: '', plain, imageBlobs: [] })) return;
      }
      S().showToast('Panoda yapıştırılacak veri yok — Excel/Word\'de Ctrl+C yapıp burada Ctrl+V tuşlayın');
    } catch (_) {
      S().showToast('Tarayıcı pano izni için doğrudan klavyeden Ctrl+V tuşlayın');
    }
  };

  // ==========================================================================
  // 17. YAŞAM DÖNGÜSÜ KANCALARI (window.__StudioOffice)
  // ==========================================================================
  function afterRenderA4() {
    const st = computeDocumentStats();
    const wc = document.getElementById('statusWordCount');
    if (wc) wc.textContent = `${st.words.toLocaleString('tr-TR')} kelime · ${st.cells} hücre`;
    if (S().state.activeNavTab === 'pages') renderNavPages();
    updateSelectionStats();
  }

  function afterRenderAll() {
    const list = S().state.schema?.comments || [];
    const openCount = list.filter(c => !c.resolved).length;
    const badge = document.getElementById('otbCommentsCount');
    if (badge) {
      badge.textContent = String(openCount);
      badge.classList.toggle('hidden', openCount === 0);
    }
    if (S().state.showDetailPane) {
      if (S().state.activeSideTab === 'comments') renderCommentsPane();
      else if (S().state.activeSideTab === 'audit') renderAuditPane();
    }
    scheduleAutoSave();
  }

  function init() {
    buildStaticPopoverGrids();
    bindInteractiveRulerDrag();
    bindFormulaPointMode();
    bindDragRangeSelection();
    bindNativeExternalPaste();
    bindGlobalOfficeEvents();
    try {
      if (localStorage.getItem(DARK_MODE_KEY) === '1') {
        document.body.classList.add('office-dark');
      }
    } catch (_) {}
  }

  window.__StudioOffice = {
    init,
    evaluateTableVisuals,
    renderChartSvg,
    computeCellRangeKeys,
    attachFillHandle,
    attachUniversalResizers,
    tryInsertFormulaRef,
    processExternalClipboardPayload,
    updateSelectionStats,
    openCellContextMenu,
    afterRenderA4,
    afterRenderAll
  };
})();
