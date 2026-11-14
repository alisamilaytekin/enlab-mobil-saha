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
