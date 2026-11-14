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
