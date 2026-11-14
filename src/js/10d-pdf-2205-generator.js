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
