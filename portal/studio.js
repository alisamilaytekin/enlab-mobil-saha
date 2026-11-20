/* ============================================================================
   HIZLI RAPOR — WEB RAPOR ŞABLON STÜDYOSU (1:1 ORİJİNAL TEKKOMER & RAMS MOTORU)
   - Orijinal 4 Sayfalık TEKKOMER (TKM-FR.318) & RAMS (ZPKR02) hücre/satır/sütun yapısı
   - Gruplu üst başlıklar (colspan), radyo noktaları (● / ○), 2-sütunlu gözle kontrol (✓/X/N/G)
   - Canlı çok sayfalı A4 DOM sayfalama (1/4, 2/4, 3/4, 4/4)
   - A4 üzerinde doğrudan tıklayıp bölüm seçme, radyo ve ✓/X/N/G işaretleme
   - Üstüne yazmayan güvenli versiyonlama (v1 -> v2 -> v3...)
   ============================================================================ */

(function () {
  'use strict';

  const LOCAL_STORAGE_KEY = 'hr_web_studio_versions_v2';
  const MANAGER_TOKEN_KEY = 'hr_manager_token';

  const DEFAULT_HEAVY_DEFECTS = [
    'Gözle Kontrol Bölümü',
    '1. Faza erişim engeli IP2X koruma sınıfını sağlamıyorsa,',
    '2. Kablo ek noktaları yalıtımlı değilse, pano içinde ucu açıkta iletken varsa,',
    '3. Pano elemanları bağlantı noktalarında kontak gevşekliği (seri ark) tespit edilmişse,',
    '4. PVC izoleli kablolarda ve pano elemanlarının dokunulabilen metal olmayan yüzeylerinde aşırı ısınma tespit edilmişse.',
    'Fonksiyon Testleri Bölümü',
    '1. Hesaplanan 3 fazlı kısa devre akımı, pano içinde bulunan herhangi bir aşırı akım koruma cihazı etiketinde yazan kısa devre kesme kapasitesinden (Icu) fazla ise,',
    '2. Aşırı akım koruma elemanı değerleri linye kesiti ile uyumsuz ise,',
    '3. El ulaşma mesafesindeki metal bölümler, ekipmanın toprak barası veya toprak ucuyla eş potansiyel değilse,',
    '4. RCD performans testi sonuçları yetersiz ise,',
    '5. Kablo şalter koordinasyonunun aşağıdaki uygunsuzluğu; Devre Tasarım Akımı (Ib), Devre Kesici Akımı (In) ve Kablo Akım Taşıma Kapasitesi (Iz) için Ib<In<Iz sağlanmadıysa,',
    '6. Zemin yalıtımının aşağıdaki uygunsuzlukları; a) El ulaşma mesafesinde bulunan zemin izolasyonu uygun boyutta değilse, (EİTY Md. 33d) b) Zemin izolasyon direnci 50 kΩ’dan büyük değilse, (EİTY Md. 48)',
    '7. N/PEN iletkeni kesitinin ve kullanım yerinin aşağıdaki uygunsuzlukları; a) N/PEN kesiti ile faz iletkeni kesiti eşit değilse. (EİTY Md 57b3-ii-1) İstisna: N/PEN kesitinin faz iletkeninin kesitinden küçük olması durumunda (örneğin 3x70+35 mm2 gibi) faz iletkenlerini koruyan devre kesici anma akımının, N/PEN iletkeni kesitine göre belirlenmesi kuralı ihlal edildiyse (EİTY Md 57b3-ii-2) b) PEN iletkeni kesiti >10 mm2 değilse (EİTY Md 36) c) PEN iletkeni yangın tehlikesi olan yerlerden geçirilmemesi kuralı ihlal edildiyse (EİTY Md 64) d) PEN iletkeni Exproof tehlikeli bölge sınırları içinden geçirilmemesi kuralı ihlal edildiyse (IEC 60079-14)',
    '8. PE koruma iletkeni kesitinin aşağıdaki uygunsuzluğu; Koruma iletkeni kesiti ETTY Md. 9e1i’de verilen formülle yapılan hesap sonucuna ve ETTY Çizelge 8’de verilen tabloya uygun değilse,',
    '9. PD potansiyel dengeleme iletkeni kesitinin aşağıdaki uygunsuzluğu; 6 mm2 < PD < 25 mm2 değilse,',
    '10. Tamamlayıcı potansiyel dengeleme: PD > 4mm² değilse.',
    'Ağır kusur olarak değerlendirilir.',
    'Bu rapor “Alçak Gerilim Topraklama Tesisatı Kontrol Raporu” ile birlikte geçerlidir.',
    'TS HD 60364 standardına göre kullanımı uygun olmayan tesisatlar aşağıdaki şekilde işaretlenir:',
    'C1 – Tehlike mevcut. Yaralanma riski. Derhal düzeltici eylem gerekli.',
    'C2 – Potansiyel olarak tehlikeli – acil düzeltici eylem gerekli.',
    'C3 – İyileştirme önerilir.'
  ].join('\n');

  // --------------------------------------------------------------------------
  // 1. ORİJİNAL 1:1 RAPOR ŞABLONLARI (ELEKTRİK 4 SAYFA + TOPRAKLAMA + JENERATÖR + DİĞER)
  // --------------------------------------------------------------------------
  function createElectrical2201Blueprint() {
    return {
      schemaVersion: 2,
      template_key: 'elektrik-ic-tesisat-zpkr02',
      version_number: 1,
      version_label: 'v1',
      title: 'ELEKTRİK İÇ TESİSATI GÖZLE KONTROL VE FONKSİYON TESTLERİ',
      subtitle: 'PERİYODİK KONTROL RAPORU',
      category: 'Elektrik',
      form_code: 'TKM-FR.318, REV.00',
      doc_code: 'ZPKR02',
      publish_date: '18.07.2025',
      rev_info: '- / -',
      effective_date: '01.09.2025',
      report_no_sample: 'TKM-26-02-57801',
      pdfTheme: 'rams_navy',
      branding: {
        companyFullName: 'TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş.',
        phone: '+90 (216) 526 61 41',
        email: 'info@tkmkontrol.com',
        accreditationNo: 'AB-0227-M',
        showLogo: true,
        showTurkak: true,
        disclaimer: 'Muayene sonuçları sadece talep edilen hizmet veya muayene edilen ürün/parti veya proses ile ilgili olup, başka hizmet veya muayene edilmeyen ürün/ parti veya proses için geçerli değildir. Muayene raporları TEKNİK KONTROL MERKEZİ BELGELENDİRME A.Ş. ve müşterinin onayı olmaksızın kısmi olarak veya tamamen kopya edilip çoğaltılamaz. İmzasız raporlar geçersizdir. Bu rapor elektronik ortamda bir nüsha olarak hazırlanmıştır.'
      },
      sections: [
        {
          id: 'sec_company',
          type: 'company_info',
          visible: true,
          title: '1. FİRMA BİLGİLERİ',
          rows: [
            { layout: 'full', label1: 'Firma Adı', val1: 'siemens' },
            { layout: 'full', label1: 'Periyodik Kontrol Adresi', val1: 'gemze osb' },
            { layout: 'pair', label1: 'İSG-KATİP Sözleşme ID', val1: '213091827301928', label2: 'SGK Sicil Numarası', val2: '012938102937' },
            { layout: 'pair', label1: 'Rapor Numarası', val1: 'TKM-26-02-57801', label2: 'Rapor Tarihi', val2: '20.11.2026' },
            { layout: 'pair', label1: 'Periyodik Kontrol Başlangıç ve Bitiş Tarih ve Saati', val1: '20.11.2026 00:07', label2: 'Bir Sonraki Periyodik Kontrol Tarihi', val2: '20.11.2027' },
            { layout: 'pair', label1: 'Rapor / Ekipman Adı', val1: 'Deneme', label2: 'Ekipman Seri No / Kod', val2: '' }
          ],
          scopeLabel: 'Periyodik Kontrol Metodu ve Kapsamı',
          scopeLines: [
            'TS HD 60364-4-43 Alçak Gerilim Elektrik Tesisatları- Bölüm 4: Güvenlik İçin Koruma Grup 43 - Aşırı Akıma Karşı Koruma',
            'TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama',
            'İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği',
            'Elektrik İç Tesisleri Yönetmeliği',
            'Elektrik Tesislerinde Topraklamalar Yönetmeliği'
          ]
        },
        {
          id: 'sec_detail_21',
          type: 'detail_21',
          visible: true,
          sectionTitle: '2. EKİPMAN BİLGİLERİ',
          subTitle: '2.1. DETAY BİLGİLER',
          fields: [
            { id: 'd0', label: 'Enerji sağlayan kuruluş', type: 'text', value: 'Ayedaş' },
            { id: 'd1', label: 'Şebeke tipi', type: 'radio', options: ['TT', 'IT', 'TN', 'TN-CS', 'TN-C', 'TN-S'], value: 'TT' },
            { id: 'd2', label: 'Şebeke gerilimi (V)', type: 'text', value: '230/400' },
            { id: 'd3', label: 'Tesise ait proje var mı?', type: 'radio', options: ['Var', 'Yok'], value: 'Yok' },
            { id: 'd4', label: 'Tek hat şeması var mı?', type: 'radio', options: ['Var', 'Yok'], value: 'Yok' },
            { id: 'd5', label: 'Kontrol nedeni', type: 'radio', options: ['Periyodik Kontrol', 'İlk Kontrol'], value: 'İlk Kontrol' },
            { id: 'd6', label: 'Topraklayıcı tipi', type: 'radio', options: ['Ring', 'Yüzeysel', 'Temel', 'Derin', 'Belirlenemedi'], value: 'Temel' },
            { id: 'd7', label: 'Yapı cinsi', type: 'radio', options: ['Ev', 'Ticari', 'Endüstri', 'Diğer'], value: 'Ticari' },
            { id: 'd8', label: 'Ekipmanın kullanım amacı', type: 'text', value: '' },
            { id: 'd9', label: 'Son kontrol tarihi', type: 'text', value: '-' },
            {
              id: 'd10',
              label: 'Faz iletkenlerinin sayısı ve tipi',
              type: 'phase_group',
              aaOptions: ['AA(1 faz-2 tel)', 'AA(1 faz-3 tel)', 'AA(2 faz-3 tel)', 'AA(3 faz-3 tel)', 'AA(3 faz-4 tel)'],
              daOptions: ['DA(2 kutup)', 'DA(3 kutup)', 'DA(Diğer)'],
              value: 'AA(3 faz-4 tel)'
            },
            { id: 'd11', label: 'Temel topraklama direnci (Ω)', type: 'text', value: '' },
            { id: 'd12', label: 'İlave topraklama elektrotu detayları(varsa)', type: 'text', value: '-' },
            { id: 'd13', label: 'Sistem topraklama iletkeni ve kesiti (mm²)', type: 'text', value: '' },
            { id: 'd14', label: 'Ana eşpotansiyel iletkeni ve kesiti (mm²)', type: 'text', value: '' },
            { id: 'd15', label: 'Besleme kaynağı karakteristikleri-Nominal gerilim, U/Uo (kV)', type: 'text', value: '' },
            { id: 'd16', label: 'Besleme kaynağı karakteristikleri-Nominal frekans, f (Hz)', type: 'text', value: '50' },
            { id: 'd17', label: 'Besleme kaynağı karakteristikleri-Hata akımı olasılığı, IF (kA)', type: 'text', value: '' },
            { id: 'd18', label: 'Besleme kaynağı karakteristikleri-Dış çevrim empedansı ZE (Ω)', type: 'text', value: '' },
            { id: 'd19', label: 'Ana kesici karakteristikleri-Tip', type: 'text', value: '' },
            { id: 'd20', label: 'Ana kesici karakteristikleri-Nominal akım (A)', type: 'text', value: '' },
            { id: 'd21', label: 'TT/TN-S Şebeke için ana RCD anma akımı (A)', type: 'text', value: '' },
            { id: 'd22', label: 'TT/TN-S Şebeke için ana RCD açma akımı (mA)', type: 'text', value: '' },
            { id: 'd23', label: 'TT/TN-S Şebeke için ana RCD açma zamanı (ms)', type: 'text', value: '' }
          ]
        },
        {
          id: 'sec_detail_22',
          type: 'detail_22',
          visible: true,
          subTitle: '2.2. TESPİT EDİLEN BİLGİLER',
          topQuestions: [
            { id: 't0', label: 'Tesisatta kapsamlı değişiklik var mı?(>%20)', options: ['Var', 'Yok'], value: 'Yok' },
            { id: 't1', label: 'Tesisatta aşırı gerilim koruma cihazları (DKD/SPD) kullanılmış mı?', options: ['Evet', 'Hayır'], value: 'Hayır' }
          ],
          protectionTitle: 'Tespit edilen bilgiler\n(Doğrudan dokunmaya karşı koruma önlemleri)',
          protectionItems: [
            { id: 'p0', label: 'Gerilim altındaki bölümlerin yalıtılması (iç kapak veya pleksi koruma)', value: 'Var' },
            { id: 'p1', label: 'Mahfaza (IPXY, Pano kilidi, tehlike işareti vb.)', value: 'Var' },
            { id: 'p2', label: 'Engel', value: 'Var' },
            { id: 'p3', label: 'El ulaşma uzaklığı dışına yerleştirme', value: 'Yok' },
            { id: 'p4', label: 'İlave koruma', value: 'Var' },
            { id: 'p5', label: '30 mA RCD (5xI için 40 ms açma zamanı); devre kesicisi <32 A devreler için (TS HD 60364-4-41)', value: 'Var' }
          ],
          bottomQuestion: { id: 't2', label: 'Bir önceki periyodik kontrol etiketi var mı?', options: ['Var', 'Yok'], value: 'Var' }
        },
        {
          id: 'sec_thermal',
          type: 'data_table',
          visible: true,
          forceBreakInRams: true,
          title: '3. TERMAL KAMERA BİLGİLERİ',
          subTitle: '',
          showNoCol: false,
          showLegend: false,
          columns: [
            { id: 'c1', label: 'Cihaz Adı', group: '', width: 20, type: 'text', align: 'center' },
            { id: 'c2', label: 'Seri Numarası', group: '', width: 18, type: 'text', align: 'center' },
            { id: 'c3', label: 'Kalibrasyon Tarihi', group: '', width: 20, type: 'text', align: 'center' },
            { id: 'c4', label: 'Kalibrasyon Geçerlilik Tarihi', group: '', width: 22, type: 'text', align: 'center' },
            { id: 'c5', label: 'Kalibrasyon Numarası', group: '', width: 20, type: 'text', align: 'center' }
          ],
          rows: [
            { c1: 'fluke abcd', c2: '1235', c3: '10.11.2026', c4: '10.11.2027', c5: '19283712847120398' }
          ]
        },
        {
          id: 'sec_devices',
          type: 'data_table',
          visible: true,
          title: '4. ÖLÇÜM ALETLERİ BİLGİLERİ',
          subTitle: '',
          showNoCol: false,
          showLegend: false,
          columns: [
            { id: 'c1', label: 'Cihaz Adı', group: '', width: 24, type: 'text', align: 'center' },
            { id: 'c2', label: 'Seri Numarası', group: '', width: 17, type: 'text', align: 'center' },
            { id: 'c3', label: 'Kalibrasyon Tarihi', group: '', width: 19, type: 'text', align: 'center' },
            { id: 'c4', label: 'Kalibrasyon Geçerlilik Tarihi', group: '', width: 21, type: 'text', align: 'center' },
            { id: 'c5', label: 'Kalibrasyon Numarası', group: '', width: 19, type: 'text', align: 'center' }
          ],
          rows: [
            { c1: 'Çok Fonksiyonlu Test Cihazı', c2: '1238192312', c3: '10.11.2026', c4: '10.11.2027', c5: '18273612037812037' },
            { c1: 'Termal Kamera', c2: '1235', c3: '10.11.2026', c4: '10.11.2027', c5: '19283712847120398' }
          ]
        },
        {
          id: 'sec_visual_5',
          type: 'visual_checklist_group',
          visible: true,
          forceBreakInClassic: true,
          superTitle: 'TEST VE KONTROLLER',
          title: '5. KONTROL KRİTERLERİ VE TESTLER',
          panoSubTitle: '5.1. PANO ADI/EKİPMAN TANIMLAMASI',
          panoLabel: 'Pano Adı/Ekipman Tanımlaması',
          panoValue: 'Deneme',
          footnote: 'Pano/Ekipman sayısı fazla olan tesislerde birden fazla form kullanılmalıdır.',
          topics: [
            {
              id: 'vt1',
              title: '5.2. PANO VE DİĞER DONANIMLARA GİRİŞİN UYGUNLUĞU',
              items: [
                { id: 'i1', text: 'Kablo şebeke tarafı', sym: '✓' },
                { id: 'i2', text: 'Kablo donanım tarafı', sym: '✓' },
                { id: 'i3', text: 'Pano sabitlenmesi (Depreme dayanıklılık)', sym: '✓' },
                { id: 'i4', text: 'Dış darbelere karşı koruma önlemi', sym: '✓' },
                { id: 'i5', text: 'Elektrik panosu etrafında yabancı malzemeler', sym: '✓' },
                { id: 'i6', text: 'Zemin izolasyonu', sym: '✓' }
              ]
            },
            {
              id: 'vt2',
              title: '5.3. TOPRAKLANMIŞ POTANSİYEL DENGELEME VE BESLEMENİN OTOMATİK KESİLMESİ, ELEKTRİK ÇARPMASINA (DOLAYLI DOKUNMAYA) KARŞI KORUMA',
              items: [
                { id: 'i1', text: 'Topraklama iletkeni', sym: '✓' },
                { id: 'i2', text: 'Ana potansiyel dengeleme iletkeni', sym: '✓' },
                { id: 'i3', text: 'Ek Potansiyel dengeleme İletkeni (Tamamlayıcı pot.den)', sym: '✓' },
                { id: 'i4', text: 'Pano kapak bağlantısı kontrolü 6 mm2', sym: '✓' }
              ]
            },
            {
              id: 'vt3',
              title: '5.4. KARŞILIKLI ZARARLI ETKİLERİN ÖNLENMESİ',
              items: [
                { id: 'i1', text: 'Elektriksel olmayan tesislere yaklaşma ve diğer etkilerin kontrolü', sym: '✓' },
                { id: 'i2', text: 'Bant I ve Bant II ayrılması, Bant II yalıtımı', sym: '✓' },
                { id: 'i3', text: 'Güvenlik devre ayrılması', sym: '✓' },
                { id: 'i4', text: 'Pano iç kapak, faza erişim engeli veya pleksi koruma', sym: '✓' }
              ]
            },
            {
              id: 'vt4',
              title: '5.5. TANIMLAMA',
              items: [
                { id: 'i1', text: 'Şemalar, talimatlar, devre çizimleri ve kısa bilgiler', sym: '✓' },
                { id: 'i2', text: 'Koruma cihaz ve terminal etiket', sym: '✓' },
                { id: 'i3', text: 'Tehlike işaretleri ve diğer uyarı işaretleri', sym: '✓' }
              ]
            },
            {
              id: 'vt5',
              title: '5.6. KABLO VE İLETKENLER',
              items: [
                { id: 'i1', text: 'Kablo yollarının uygunluğu ve mekanik koruma', sym: '✓' },
                { id: 'i2', text: 'Kablo renk kodları Nötr: Mavi Toprak: Sarı/ Yeşil', sym: '✓' },
                { id: 'i3', text: 'Tesisat yöntemi', sym: '✓' },
                { id: 'i4', text: 'Yangın engeli, uygun kilitleme ve sıcaklık etkisine karşı koruma', sym: '✓' }
              ]
            },
            {
              id: 'vt6',
              title: '5.7. TERMAL KAMERA',
              items: [
                { id: 'i1', text: 'Fotoğraf tarihi', sym: '✓' },
                { id: 'i2', text: 'Fotoğraf no.', sym: '✓' },
                { id: 'i3', text: 'Kontak gevşekliği ısınması', sym: '✓' },
                { id: 'i4', text: 'Aşırı yük ısınması PVC kablolar için >70 derece', sym: '✓' }
              ]
            },
            {
              id: 'vt7',
              title: '5.8. GENEL DEĞERLENDİRMELER',
              items: [
                { id: 'i1', text: 'Ekipman yakınında elektriksel ekipman yangın söndürme tertibatı', sym: '✓' },
                { id: 'i2', text: 'Ekipman temizlik/bakım durumu', sym: '✓' },
                { id: 'i3', text: 'Pano içi ve bağlantılarının korozyon kontrolü', sym: '✓' },
                { id: 'i4', text: 'Ekipman içi veya yakınında acil durum aydınlatma tertibatı', sym: '✓' }
              ]
            }
          ]
        },
        {
          id: 'sec_func_6_top',
          type: 'func_matrix',
          visible: true,
          forceBreakInRams: true,
          title: '6. FONKSİYON KONTROL KRİTERLERİ VE TESTLER',
          methodTitle: 'Ölçüm ve Doğrulama Metodu',
          methodOptions: ['Çevrim empedansı', '3 uçlu topraklama', 'Klamp metodu(çoklu topraklayıcılı)'],
          methodValue: 'Çevrim empedansı',
          subTitle: '6.1. AŞIRI AKIM CİHAZI / İLETKEN UYGUNLUĞU - GERİLİM KONTROLÜ - AŞIRI GERİM CİHAZLARI (DKD) KONTROLÜ - RCD TESTLERİ',
          panoLabel: 'Pano (Ekipman) Adı-Etiketi veya Kodu',
          panoValue: 'Deneme',
          zxLabel: 'Panodan ölçülen faz-toprak çevrim empedansı (Zx) (Ω)',
          zxVal: '',
          zlnLabel: 'Panodan ölçülen faz-nötr çevrim empedansı (ZLN) (Ω)',
          zlnVal: '',
          ik3Label: 'Hesaplanan 3 fazlı kısa devre akımı (kA)',
          ik3Val: '',
          ffLabel: 'Gerilimler F-F(V)',
          ffVal: '395',
          lnLabel: 'Gerilimler L-N(V)',
          lnVal: '228',
          npeLabel: 'Gerilimler N-PE(V)',
          npeVal: '',
          dkdTypeLabel: 'Aşırı gerilim koruma (DKD) tipi',
          dkdOptions: ['Mevcut Değil', 'Sınıf I', 'Sınıf II', 'Sınıf III', 'Diğer'],
          dkdTypeVal: 'Mevcut Değil',
          dkdKaLabel: 'Aşırı gerilim koruma (DKD) dayanma akımı (kA)',
          dkdKaVal: ''
        },
        {
          id: 'sec_linye_61',
          type: 'data_table',
          visible: true,
          title: '',
          subTitle: '6.1. Linye Ölçüm ve Test Tablosu',
          isLinyeTable: true,
          showNoCol: true,
          noColWidth: 4,
          showLegend: true,
          columns: [
            { id: 'c1', label: 'Pano/Tablo numarası-Linye Adı-Etiketi', group: '', width: 22, type: 'text', align: 'left' },
            { id: 'c2', label: 'Açma eğrisi tipi', group: 'Aşırı Akım Koruma Cihazının', width: 6.2, type: 'text', align: 'center' },
            { id: 'c3', label: 'Kutup sayısı', group: 'Aşırı Akım Koruma Cihazının', width: 5.4, type: 'text', align: 'center' },
            { id: 'c4', label: 'Nominal akımı In (A)', group: 'Aşırı Akım Koruma Cihazının', width: 6.0, type: 'text', align: 'center' },
            { id: 'c5', label: 'Kısa devre kesme akımı Icu (kA)', group: 'Aşırı Akım Koruma Cihazının', width: 6.6, type: 'text', align: 'center' },
            { id: 'c6', label: 'Faz kesiti (mm²)', group: 'İletkenin', width: 6.0, type: 'text', align: 'center' },
            { id: 'c7', label: 'N/PEN Kesiti (mm²)', group: 'İletkenin', width: 6.2, type: 'text', align: 'center' },
            { id: 'c8', label: 'PE Koruma iletkeni kesiti (mm²)', group: 'İletkenin', width: 6.8, type: 'text', align: 'center' },
            { id: 'c9', label: 'Ib Yük/Tasarım akımı (A)', group: 'İletkenin', width: 6.4, type: 'text', align: 'center' },
            { id: 'c10', label: 'Iz Akım taşıma kapasitesi (A)', group: 'İletkenin', width: 6.4, type: 'text', align: 'center' },
            { id: 'c11', label: 'IΔ (mA)', group: 'RCD Testi', width: 6.0, type: 'text', align: 'center' },
            { id: 'c12', label: 'TΔ (ms)', group: 'RCD Testi', width: 6.0, type: 'text', align: 'center' },
            { id: 'c13', label: 'Sonuç', group: '', width: 6.0, type: 'symbol', align: 'center' }
          ],
          rows: [
            { c1: '', c2: '', c3: '', c4: '', c5: '', c6: '', c7: '', c8: '', c9: '', c10: '', c11: '', c12: '', c13: '' }
          ]
        },
        {
          id: 'sec_pot_62',
          type: 'data_table',
          visible: true,
          title: '',
          subTitle: '6.2. POTANSİYEL DENGELEME İLETKENLERİ KONTROLÜ',
          showNoCol: true,
          noColWidth: 3.5,
          showLegend: true,
          columns: [
            { id: 'c1', label: 'Potansiyel dengeleme yapılan ilgili bölüm adı', group: '', width: 25.5, type: 'text', align: 'left' },
            { id: 'c2', label: 'Potansiyel dengeleme iletkeni kesiti (mm²)', group: '', width: 14.5, type: 'text', align: 'center' },
            { id: 'c3', label: 'Potansiyel dengeleme iletkeni süreklilik (Ω)', group: '', width: 14.5, type: 'text', align: 'center' },
            { id: 'c4', label: 'Varsa tamamlayıcı potansiyel dengeleme iletkeni kesiti (mm²)', group: '', width: 18.5, type: 'text', align: 'center' },
            { id: 'c5', label: 'Tamamlayıcı potansiyel dengeleme süreklilik (Ω)', group: '', width: 16.5, type: 'text', align: 'center' },
            { id: 'c6', label: 'Sonuç', group: '', width: 7.0, type: 'symbol', align: 'center' }
          ],
          rows: [{ c1: '', c2: '', c3: '', c4: '', c5: '', c6: '' }]
        },
        {
          id: 'sec_floor_63',
          type: 'data_table',
          visible: true,
          title: '',
          subTitle: '6.3. ZEMİN İZOLASYONUNUN KONTROLÜ',
          showNoCol: true,
          noColWidth: 3.5,
          showLegend: true,
          footnote: 'Nokta sayısı fazla olan tesislerde birden fazla form kullanılabilir. Ya da formun sadece 6. Bölümü çoğaltılabilir.',
          columns: [
            { id: 'c1', label: 'İzolasyon halısının (Zemin yalıtımının) yeri', group: '', width: 38.5, type: 'text', align: 'left' },
            { id: 'c2', label: 'Eni (m)', group: '', width: 11.5, type: 'text', align: 'center' },
            { id: 'c3', label: 'Boyu (m)', group: '', width: 11.5, type: 'text', align: 'center' },
            { id: 'c4', label: 'Zemin izolasyon direnci (kΩ)', group: '', width: 27.0, type: 'text', align: 'center' },
            { id: 'c5', label: 'Sonuç', group: '', width: 8.0, type: 'symbol', align: 'center' }
          ],
          rows: [{ c1: '', c2: '', c3: '', c4: '', c5: '' }]
        },
        {
          id: 'sec_defects_7',
          type: 'notes_box',
          visible: true,
          title: '7. KUSUR AÇIKLAMALARI',
          isDefectBox: true,
          content: 'Kusur tespiti bulunmamaktadır.',
          bottomNote: 'Kusur derecesi “*” hafif kusurlu ve “**” ağır kusurlu anlamında kullanılmaktadır. Değerlendirme “Uygun”, “Uygun Değil” ve “Uygulanamaz” olarak yapılmıştır.'
        },
        {
          id: 'sec_photos_8',
          type: 'notes_box',
          visible: true,
          title: '8. EKİPMAN FOTOĞRAFLARI',
          content: '',
          bottomNote: ''
        },
        {
          id: 'sec_notes_9',
          type: 'notes_box',
          visible: true,
          title: '9. NOTLAR',
          content: 'Proje Bilgileri: Kontrol esnasında tesise ait onaylı elektrik tesisat projesi ve tek hat şeması ibraz edilmemiş olup, periyodik kontroller mevcut tesisat durumu üzerinden gerçekleştirilmiştir.',
          bottomNote: ''
        },
        {
          id: 'sec_conclusion_10',
          type: 'conclusion_box',
          visible: true,
          forceBreakInRams: true,
          forceBreakInClassic: true,
          title: '10. SONUÇ VE KANAAT',
          overallResult: 'UYGUN',
          leadSentence: 'Periyodik kontrol tarihi itibari ile yukarıda teknik özellikleri belirtilen Elektrik Tesisatının fonksiyon testleri muayenesi sonrasında mevcut şartlar altında',
          okSentence: 'KULLANILMASI UYGUNDUR.',
          badSentence: 'KULLANILMASI UYGUN DEĞİLDİR. C1 – Tehlike mevcut. Yaralanma riski. Derhal düzeltici eylem gerekli.',
          heavyDefectsText: DEFAULT_HEAVY_DEFECTS
        },
        {
          id: 'sec_approval_11',
          type: 'approval_box',
          visible: true,
          title: '11. PERİYODİK KONTROLLERİ YAPMAYA YETKİLİ KİŞİ BİLGİLERİ ve ONAY',
          inspectorName: 'Ali Şamil Aytekin / Elektrik Mühendisi',
          ministryNo: 'abc',
          diplomaNo: 'abc',
          showEimza: true,
          showQr: true,
          footnote: 'Bu rapor elektronik ortamda 1 (bir) nüsha olarak hazırlanmıştır.'
        }
      ]
    };
  }

  function createGroundingBlueprint() {
    const base = createElectrical2201Blueprint();
    base.template_key = 'topraklama-tesisati-fr317';
    base.title = 'ALÇAK GERİLİM TOPRAKLAMA TESİSATI PERİYODİK KONTROL RAPORU';
    base.category = 'Topraklama & Paratoner';
    base.form_code = 'TKM-FR.317, REV.00';
    base.doc_code = 'FR.317';
    base.sections = [
      base.sections[0],
      base.sections[1],
      base.sections[4],
      {
        id: 'sec_ground_table',
        type: 'data_table',
        visible: true,
        title: '5. KONTROL KRİTERLERİ VE TOPRAKLAMA ÖLÇÜMLERİ',
        subTitle: '5.2. SON TÜKETİM NOKTALARINDA DOLAYLI DOKUNMAYA KARŞI KORUMA ÖLÇÜMLERİ',
        showNoCol: true,
        noColWidth: 4,
        showLegend: true,
        columns: [
          { id: 'c1', label: 'Ölçüm Noktası / Pano / Makine', group: '', width: 26, type: 'text', align: 'left' },
          { id: 'c2', label: 'Sigorta Tipi', group: 'Koruma Elemanı', width: 10, type: 'text', align: 'center' },
          { id: 'c3', label: 'In (A)', group: 'Koruma Elemanı', width: 9, type: 'text', align: 'center' },
          { id: 'c4', label: 'Ia (A)', group: 'Koruma Elemanı', width: 9, type: 'text', align: 'center' },
          { id: 'c5', label: 'Ölçülen Rx (Ω)', group: 'Topraklama Ölçümü', width: 12, type: 'text', align: 'center' },
          { id: 'c6', label: 'Sınır Ra (Ω)', group: 'Topraklama Ölçümü', width: 12, type: 'text', align: 'center' },
          { id: 'c7', label: 'RCD (mA)', group: 'Topraklama Ölçümü', width: 10, type: 'text', align: 'center' },
          { id: 'c8', label: 'Sonuç', group: '', width: 8, type: 'symbol', align: 'center' }
        ],
        rows: [
          { c1: 'Ana Eşpotansiyel Bara (EBB)', c2: 'TMŞ', c3: '250', c4: '1250', c5: '1.15', c6: '2.00', c7: '300', c8: '✓' },
          { c1: 'Üretim Panosu #1 Gövde', c2: 'C Tipi', c3: '32', c4: '320', c5: '0.78', c6: '166.0', c7: '30', c8: '✓' }
        ]
      },
      base.sections[10],
      base.sections[12],
      base.sections[13],
      base.sections[14]
    ];
    return base;
  }

  function createGeneratorBlueprint() {
    const base = createElectrical2201Blueprint();
    base.template_key = 'jenerator-kontrol-fr164';
    base.title = 'JENERATÖR PERİYODİK KONTROL RAPORU';
    base.category = 'Jeneratör & Güç';
    base.form_code = 'TKM-FR.164, REV.00';
    base.doc_code = 'FR.164';
    base.sections = [
      base.sections[0],
      base.sections[4],
      {
        id: 'sec_gen_checks',
        type: 'visual_checklist_group',
        visible: true,
        superTitle: '',
        title: '4. GENEL KONTROLLER',
        panoSubTitle: '4.1. JENERATÖR TANIMLAMA',
        panoLabel: 'Jeneratör Marka / Güç',
        panoValue: 'Aksa / 165 kVA Dizel',
        footnote: '',
        topics: [
          {
            id: 'gt1',
            title: '4.2. FİZİKSEL VE GÜVENLİK KONTROLLERİ',
            items: [
              { id: 'i1', text: 'Acil durdurma (Emergency Stop) butonu aktif ve erişilebilir mi?', sym: '✓' },
              { id: 'i2', text: 'Egzoz hattı izolasyonu ve kabin havalandırması uygun mu?', sym: '✓' },
              { id: 'i3', text: 'Gövde ve yıldız noktası topraklama bağlantıları mevcut mu?', sym: '✓' },
              { id: 'i4', text: 'Uygun sınıf yangın söndürme cihazı mevcut mu?', sym: '✓' }
            ]
          }
        ]
      },
      {
        id: 'sec_gen_meas',
        type: 'data_table',
        visible: true,
        title: '5. ÖLÇÜM SONUÇLARI',
        subTitle: '5.1. POTANSİYEL, GERİLİM VE AKÜ ÖLÇÜMLERİ',
        showNoCol: true,
        noColWidth: 5,
        showLegend: true,
        columns: [
          { id: 'c1', label: 'Ölçüm Parametresi', group: '', width: 35, type: 'text', align: 'left' },
          { id: 'c2', label: 'Ölçülen Değer', group: 'Test Sonucu', width: 22, type: 'text', align: 'center' },
          { id: 'c3', label: 'Referans / Sınır', group: 'Test Sonucu', width: 24, type: 'text', align: 'center' },
          { id: 'c4', label: 'Sonuç', group: '', width: 14, type: 'symbol', align: 'center' }
        ],
        rows: [
          { c1: 'Faz-Faz Gerilimi (L1-L2 / L2-L3 / L3-L1)', c2: '400 / 401 / 400 V', c3: '400 V ± %5', c4: '✓' },
          { c1: 'Frekans', c2: '50.0 Hz', c3: '50 Hz ± %2', c4: '✓' },
          { c1: 'Akü Şarj Voltajı', c2: '27.2 V DC', c3: '24–28 V DC', c4: '✓' }
        ]
      },
      base.sections[10],
      base.sections[13],
      base.sections[14]
    ];
    return base;
  }

  function createBlankBlueprint() {
    const base = createElectrical2201Blueprint();
    base.template_key = `ozel-rapor-${Date.now().toString(36).slice(-4)}`;
    base.title = 'YENİ PERİYODİK KONTROL RAPORU';
    base.category = 'Özel';
    base.form_code = 'TKM-FR.900, REV.00';
    base.doc_code = 'FR.900';
    base.sections = [
      base.sections[0],
      base.sections[4],
      {
        id: 'sec_custom_tbl',
        type: 'data_table',
        visible: true,
        title: '3. ÖLÇÜM VE TEST TABLOSU',
        subTitle: '3.1. SAHA ÖLÇÜM VERİLERİ',
        showNoCol: true,
        noColWidth: 5,
        showLegend: true,
        columns: [
          { id: 'c1', label: 'Kontrol Noktası', group: '', width: 35, type: 'text', align: 'left' },
          { id: 'c2', label: 'Ölçülen Değer', group: 'Ölçüm', width: 25, type: 'text', align: 'center' },
          { id: 'c3', label: 'Sınır Değer', group: 'Ölçüm', width: 25, type: 'text', align: 'center' },
          { id: 'c4', label: 'Sonuç', group: '', width: 10, type: 'symbol', align: 'center' }
        ],
        rows: [{ c1: 'Örnek Nokta 1', c2: '—', c3: '—', c4: '✓' }]
      },
      base.sections[10],
      base.sections[13],
      base.sections[14]
    ];
    return base;
  }

  const BLUEPRINT_CATALOG = [
    { id: '2201', name: 'Elektrik İç Tesisatı (Orijinal 4 Sayfa — ZPKR02 / TKM-FR.318)', meta: '11 Bölüm · 14 Sütunlu Gruplu Linye Tablosu · 5.1–5.8 Gözle Kontrol · 2.1/2.2 Radyo', factory: createElectrical2201Blueprint },
    { id: '2202', name: 'Alçak Gerilim Topraklama Tesisatı (TKM-FR.317)', meta: 'Firma + Ekipman + Cihazlar + Gruplu Topraklama Ölçüm Tablosu + Onay', factory: createGroundingBlueprint },
    { id: '2205', name: 'Jeneratör Periyodik Kontrol (TKM-FR.164)', meta: 'Firma + Cihazlar + Gözle Kontroller + Potansiyel/Akü Ölçüm Tablosu + Onay', factory: createGeneratorBlueprint },
    { id: 'blank', name: 'Sıfırdan Boş Resmi Rapor Şablonu', meta: 'Antet + Firma + Cihazlar + Özelleştirilebilir Tablo + Sonuç & E-İmza/QR', factory: createBlankBlueprint }
  ];

  const DEFAULT_LAYOUT_STYLES = {
    secMarginTop: 4,
    secMarginBottom: 2,
    secFontSize: 8.5,
    subMarginTop: 3,
    subMarginBottom: 2,
    subFontSize: 7.6,
    blockGap: 2,
    headerMarginBottom: 3,
    pagePadY: 6.5,
    pagePadX: 10.5,
    cellPadY: 2,
    cellPadX: 3.5,
    rowMinHeight: 0,
    tableFontSize: 7.2,
    tableLineHeight: 1.16,
    customBorderEnabled: false,
    borderColor: '#cbd5e1',
    borderWidth: 1,
    customColorsEnabled: false,
    secTitleColor: '#1f3a5f',
    subBg: '#eaeff5',
    subColor: '#1f3a5f',
    thBg: '#f1f5f9',
    thColor: '#1f3a5f'
  };

  const DEFAULT_DESIGN_SETTINGS = {
    docFont: '',
    watermarkText: '',
    watermarkColor: '#64748b',
    watermarkOpacity: 0.11,
    pageColor: '#ffffff',
    pageBorder: 'none',
    orientation: 'portrait',
    lineNumbers: false,
    hideHeader: false,
    hideFooter: false
  };

  function ensureStyleDefaults(s) {
    if (!s) return;
    s.layoutStyles = Object.assign({}, DEFAULT_LAYOUT_STYLES, s.layoutStyles || {});
    s.designSettings = Object.assign({}, DEFAULT_DESIGN_SETTINGS, s.designSettings || {});
    if (!s.cellStyles || typeof s.cellStyles !== 'object') s.cellStyles = {};
    if (!s.cellTextOverrides || typeof s.cellTextOverrides !== 'object') s.cellTextOverrides = {};
    if (!s.cellMerges || typeof s.cellMerges !== 'object') s.cellMerges = {};
    if (!s.tableColWidths || typeof s.tableColWidths !== 'object') s.tableColWidths = {};
    if (!Array.isArray(s.conditionalRules)) s.conditionalRules = [];
    if (!Array.isArray(s.comments)) s.comments = [];
    if (!s.lockedCells || typeof s.lockedCells !== 'object') s.lockedCells = {};
    if (typeof s.sheetProtected !== 'boolean') s.sheetProtected = false;
    (s.sections || []).forEach(sec => {
      if (!sec.style || typeof sec.style !== 'object') sec.style = {};
    });
  }

  const THEME_LABELS = {
    rams_navy: 'Rams Lacivert',
    classic: 'TEKKOMER Klasik',
    rams_emerald: 'Rams Zümrüt',
    rams_nordic: 'Rams Nordic',
    rams_tuv: 'Rams Kobalt'
  };

  // --------------------------------------------------------------------------
  // 2. DURUM YÖNETİMİ (STATE) & GERİ AL / YİNELE (UNDO / REDO)
  // --------------------------------------------------------------------------
  const StudioState = {
    activeRibbon: 'home',
    selectedSectionId: 'sec_company',
    selectedCellKey: null,
    selectedCellRange: [],
    formatPainterStyle: null,
    undoStack: [],
    redoStack: [],
    showNavPane: true,
    showDetailPane: false,
    showFormulaBar: true,
    showRuler: true,
    showFormulas: false,
    showExcelHeaders: false,
    showFormattingMarks: false,
    showCommentMarkers: true,
    viewMode: 'print',
    focusMode: false,
    autoSave: true,
    activeSideTab: 'props',
    activeNavTab: 'headings',
    tableFilters: {},
    zoom: 0.9,
    storageMode: 'local',
    manager: null,
    tenant: null,
    allVersions: [],
    loadedVersionId: null,
    schema: null
  };

  function getSelectedCellKeys() {
    if (Array.isArray(StudioState.selectedCellRange) && StudioState.selectedCellRange.length > 0) {
      return StudioState.selectedCellRange.slice();
    }
    return StudioState.selectedCellKey ? [StudioState.selectedCellKey] : [];
  }

  function updateUndoRedoButtons() {
    const uBtn = document.getElementById('btnUndo');
    const rBtn = document.getElementById('btnRedo');
    if (uBtn) uBtn.disabled = StudioState.undoStack.length === 0;
    if (rBtn) rBtn.disabled = StudioState.redoStack.length === 0;
  }

  function pushUndoSnapshot() {
    if (!StudioState.schema) return;
    try {
      const snap = JSON.stringify(StudioState.schema);
      if (StudioState.undoStack.length > 0 && StudioState.undoStack[StudioState.undoStack.length - 1] === snap) {
        return;
      }
      StudioState.undoStack.push(snap);
      if (StudioState.undoStack.length > 40) StudioState.undoStack.shift();
      StudioState.redoStack = [];
      updateUndoRedoButtons();
    } catch (_) {}
  }

  window.studioUndo = function () {
    if (StudioState.undoStack.length === 0 || !StudioState.schema) return;
    try {
      const curSnap = JSON.stringify(StudioState.schema);
      let prev = StudioState.undoStack.pop();
      while (prev === curSnap && StudioState.undoStack.length > 0) {
        prev = StudioState.undoStack.pop();
      }
      if (!prev || prev === curSnap) {
        updateUndoRedoButtons();
        return;
      }
      StudioState.redoStack.push(curSnap);
      StudioState.schema = JSON.parse(prev);
      ensureStyleDefaults(StudioState.schema);
      renderAll();
      showToast('Son işlem geri alındı (Ctrl+Z)');
    } catch (_) {}
  };

  window.studioRedo = function () {
    if (StudioState.redoStack.length === 0 || !StudioState.schema) return;
    try {
      StudioState.undoStack.push(JSON.stringify(StudioState.schema));
      const next = StudioState.redoStack.pop();
      StudioState.schema = JSON.parse(next);
      ensureStyleDefaults(StudioState.schema);
      renderAll();
      showToast('İşlem yinelendi (Ctrl+Y)');
    } catch (_) {}
  };

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeHtmlBr(str) {
    return escapeHtml(str).replace(/\r?\n/g, '<br>');
  }

  function sanitizeKey(raw) {
    const map = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', I: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
    return String(raw || '')
      .trim()
      .replace(/[çğıİöşüÇĞIÖŞÜ]/g, c => map[c] || c)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '')
      .slice(0, 64) || `sablon-${Date.now().toString(36)}`;
  }

  function isRamsTheme(theme) {
    return String(theme || '').startsWith('rams_');
  }

  function showToast(msg) {
    const el = document.getElementById('studioToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function getSelectedSection() {
    const list = StudioState.schema?.sections || [];
    return list.find(s => s.id === StudioState.selectedSectionId) || list[0] || null;
  }

  // --------------------------------------------------------------------------
  // 3. BULUT (/api/studio) + YEREL VERSİYONLAMA (v1 -> v2 -> v3...)
  // --------------------------------------------------------------------------
  function loadLocalVersions() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveLocalVersions(list) {
    try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list || [])); } catch (_) {}
  }

  function getAuthHeaders() {
    const token = localStorage.getItem(MANAGER_TOKEN_KEY) || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async function initStorageAndLoad() {
    try {
      const resp = await fetch('/api/studio', { method: 'GET', credentials: 'same-origin', headers: getAuthHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.ok) {
          StudioState.storageMode = 'cloud';
          StudioState.manager = data.manager || null;
          StudioState.tenant = data.tenant || null;
          StudioState.allVersions = (Array.isArray(data.versions) ? data.versions : []).filter(v => v.schema_json && Array.isArray(v.schema_json.sections));
          updateStorageBadge();
          populateFamilyAndVersionSelects();
          if (StudioState.allVersions.length > 0) {
            loadVersionById(StudioState.allVersions[0].id);
          } else {
            StudioState.schema = createElectrical2201Blueprint();
            StudioState.selectedSectionId = StudioState.schema.sections[0].id;
            populateFamilyAndVersionSelects();
            renderAll();
          }
          return;
        }
      }
    } catch (_) {}

    StudioState.storageMode = 'local';
    StudioState.allVersions = loadLocalVersions().filter(v => v.schema_json && Array.isArray(v.schema_json.sections));
    updateStorageBadge();
    populateFamilyAndVersionSelects();

    if (StudioState.allVersions.length > 0) {
      loadVersionById(StudioState.allVersions[0].id);
    } else {
      StudioState.schema = createElectrical2201Blueprint();
      StudioState.selectedSectionId = StudioState.schema.sections[0].id;
      populateFamilyAndVersionSelects();
      renderAll();
    }
  }

  function updateStorageBadge() {
    const badge = document.getElementById('storageMenuBadge');
    if (!badge) return;
    if (StudioState.storageMode === 'cloud' && StudioState.tenant) {
      badge.className = 'fm-badge cloud';
      badge.textContent = 'Bulut';
      badge.title = `Bağlı: ${StudioState.tenant.name || 'Sunucu'}`;
    } else {
      badge.className = 'fm-badge';
      badge.textContent = 'Yerel';
      badge.title = 'Yerel Tarayıcı Modu';
    }
  }

  function getFamiliesMap() {
    const map = new Map();
    for (const v of StudioState.allVersions) {
      if (v.is_archived) continue;
      if (!map.has(v.template_key)) map.set(v.template_key, []);
      map.get(v.template_key).push(v);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => Number(b.version_number) - Number(a.version_number));
    }
    return map;
  }

  function getNextVersionNumber(templateKey) {
    const key = sanitizeKey(templateKey);
    const matching = StudioState.allVersions.filter(v => v.template_key === key);
    return matching.reduce((acc, v) => Math.max(acc, Number(v.version_number || 0)), 0) + 1;
  }

  function populateFamilyAndVersionSelects() {
    const famSel = document.getElementById('familySelect');
    if (!famSel) return;

    const famMap = getFamiliesMap();
    const currentKey = StudioState.schema ? StudioState.schema.template_key : '';

    let famHtml = `<option value="__new__">+ Yeni Şablon / Hazır Taslak</option>`;
    if (StudioState.schema && !famMap.has(currentKey)) {
      famHtml = `<option value="__current_draft__" selected>${escapeHtml(StudioState.schema.title || 'Yeni Taslak')}</option>` + famHtml;
    }
    for (const [key, versions] of famMap.entries()) {
      const pub = versions.find(v => v.is_published) || versions[0];
      const sel = key === currentKey ? 'selected' : '';
      famHtml += `<option value="${escapeHtml(key)}" ${sel}>${escapeHtml(pub.title)} (${versions.length})</option>`;
    }
    famSel.innerHTML = famHtml;
    updateVersionBadge();
  }

  function updateVersionBadge() {
    const pill = document.getElementById('currentVersionPill');
    const txt = document.getElementById('currentVersionText');
    const saveLbl = document.getElementById('savePrimaryBtnLabel');
    if (!StudioState.schema) return;
    const nextV = getNextVersionNumber(StudioState.schema.template_key);
    if (saveLbl) saveLbl.textContent = `Kaydet (v${nextV})`;

    const loaded = StudioState.allVersions.find(v => v.id === StudioState.loadedVersionId);
    if (pill && txt) {
      if (loaded) {
        pill.className = loaded.is_published ? 'otb-version-pill' : 'otb-version-pill draft';
        txt.textContent = `${loaded.version_label}${loaded.is_published ? ' · Yayında' : ' · Arşiv'}`;
      } else {
        pill.className = 'otb-version-pill draft';
        txt.textContent = `Taslak · v${nextV}`;
      }
    }
  }

  function loadVersionById(versionId) {
    const found = StudioState.allVersions.find(v => v.id === versionId);
    if (!found) return;
    StudioState.loadedVersionId = found.id;
    StudioState.schema = JSON.parse(JSON.stringify(found.schema_json));
    ensureStyleDefaults(StudioState.schema);
    StudioState.schema.template_key = found.template_key;
    StudioState.schema.version_number = found.version_number;
    StudioState.schema.version_label = found.version_label;
    StudioState.selectedCellKey = null;
    StudioState.formatPainterStyle = null;
    StudioState.undoStack = [];
    StudioState.redoStack = [];
    if (StudioState.schema.sections && StudioState.schema.sections.length > 0) {
      StudioState.selectedSectionId = StudioState.schema.sections[0].id;
    }
    populateFamilyAndVersionSelects();
    renderAll();
  }

  window.onSelectTemplateFamily = function (key) {
    if (key === '__current_draft__') return;
    if (key === '__new__') {
      openBlueprintsModal();
      populateFamilyAndVersionSelects();
      return;
    }
    const list = getFamiliesMap().get(key) || [];
    if (list.length > 0) {
      const pref = list.find(v => v.is_published) || list[0];
      loadVersionById(pref.id);
      showToast(`${pref.title} (${pref.version_label}) yüklendi`);
    }
  };

  window.toggleFileMenu = function (ev) {
    if (ev) ev.stopPropagation();
    const pop = document.getElementById('fileMenuPopover');
    if (pop) pop.classList.toggle('hidden');
  };

  window.closeFileMenu = function () {
    const pop = document.getElementById('fileMenuPopover');
    if (pop) pop.classList.add('hidden');
  };

  window.switchRibbonTab = function (tabName) {
    StudioState.activeRibbon = tabName;
    closeFileMenu();
    document.querySelectorAll('.ribbon-tab[data-ribbon]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ribbon === tabName);
    });
    document.querySelectorAll('.ribbon-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `ribbon_${tabName}`);
    });
    syncRibbonInputsFromState();
  };

  window.toggleNavPane = function (force) {
    StudioState.showNavPane = typeof force === 'boolean' ? force : !StudioState.showNavPane;
    document.getElementById('navPane')?.classList.toggle('hidden', !StudioState.showNavPane);
    const chk = document.getElementById('chkNavPane');
    if (chk) chk.checked = StudioState.showNavPane;
    setTimeout(fitPreviewZoom, 40);
  };

  window.toggleDetailPane = function (force) {
    StudioState.showDetailPane = typeof force === 'boolean' ? force : !StudioState.showDetailPane;
    document.getElementById('detailPane')?.classList.toggle('hidden', !StudioState.showDetailPane);
    document.getElementById('rbDetailDrawerBtn')?.classList.toggle('active', StudioState.showDetailPane);
    const chk = document.getElementById('chkDetailPane');
    if (chk) chk.checked = StudioState.showDetailPane;
    if (StudioState.showDetailPane) renderDetailPane();
    setTimeout(fitPreviewZoom, 40);
  };

  window.openDetailPane = function () {
    toggleDetailPane(true);
  };

  window.toggleFormulaBar = function (force) {
    StudioState.showFormulaBar = typeof force === 'boolean' ? force : !StudioState.showFormulaBar;
    document.getElementById('formulaBar')?.classList.toggle('hidden', !StudioState.showFormulaBar);
    const chk = document.getElementById('chkFormulaBar');
    if (chk) chk.checked = StudioState.showFormulaBar;
  };

  window.toggleWordRuler = function (force) {
    StudioState.showRuler = typeof force === 'boolean' ? force : !StudioState.showRuler;
    document.getElementById('wordRulerBar')?.classList.toggle('hidden', !StudioState.showRuler);
    const chk = document.getElementById('chkRuler');
    if (chk) chk.checked = StudioState.showRuler;
  };

  window.toggleAddSectionPopover = function () {
    const pop = document.getElementById('addSectionPopover');
    if (pop) pop.classList.toggle('hidden');
  };

  window.openBlueprintsModal = function () {
    const body = document.getElementById('blueprintsModalBody');
    if (!body) return;
    body.innerHTML = `
      <p style="margin:0 0 12px 0; font-size:12px; color:#64748b;">
        Mevcut mobil uygulamadaki temel elektrik şablonlarına dokunmadan yeni bir taslak başlatır.
      </p>
      ${BLUEPRINT_CATALOG.map(bp => `
        <button type="button" class="st-blueprint-card" onclick="loadBlueprintById('${bp.id}'); closeModal('blueprintsModal');">
          <div class="st-blueprint-name">${escapeHtml(bp.name)}</div>
          <div class="st-blueprint-meta">${escapeHtml(bp.meta)}</div>
        </button>
      `).join('')}
    `;
    document.getElementById('blueprintsModal').classList.remove('hidden');
  };

  window.openBrandingModal = function () {
    const body = document.getElementById('brandingModalBody');
    const s = StudioState.schema;
    if (!body || !s) return;
    const b = s.branding || {};
    body.innerHTML = `
      <div class="st-field">
        <label class="st-label">Ana Rapor Başlığı</label>
        <input class="st-input" value="${escapeHtml(s.title || '')}" oninput="updateRootProp('title', this.value)">
      </div>
      <div class="st-grid-2">
        <div class="st-field">
          <label class="st-label">Alt Başlık</label>
          <input class="st-input" value="${escapeHtml(s.subtitle || '')}" oninput="updateRootProp('subtitle', this.value)">
        </div>
        <div class="st-field">
          <label class="st-label">Doküman Kodu</label>
          <input class="st-input" value="${escapeHtml(s.doc_code || '')}" oninput="updateRootProp('doc_code', this.value)">
        </div>
      </div>
      <div class="st-grid-3">
        <div class="st-field">
          <label class="st-label">Form Kodu</label>
          <input class="st-input" value="${escapeHtml(s.form_code || '')}" oninput="updateRootProp('form_code', this.value)">
        </div>
        <div class="st-field">
          <label class="st-label">Yayım Tarihi</label>
          <input class="st-input" value="${escapeHtml(s.publish_date || '')}" oninput="updateRootProp('publish_date', this.value)">
        </div>
        <div class="st-field">
          <label class="st-label">Yürürlük Tarihi</label>
          <input class="st-input" value="${escapeHtml(s.effective_date || '')}" oninput="updateRootProp('effective_date', this.value)">
        </div>
      </div>
      <div class="st-grid-2">
        <div class="st-field">
          <label class="st-label">Revizyon No / Tarihi</label>
          <input class="st-input" value="${escapeHtml(s.rev_info || '')}" oninput="updateRootProp('rev_info', this.value)">
        </div>
        <div class="st-field">
          <label class="st-label">Örnek Rapor No</label>
          <input class="st-input" value="${escapeHtml(s.report_no_sample || '')}" oninput="updateRootProp('report_no_sample', this.value)">
        </div>
      </div>
      <div class="st-field">
        <label class="st-label">Kuruluş Unvanı</label>
        <input class="st-input" value="${escapeHtml(b.companyFullName || '')}" oninput="updateRootProp('branding.companyFullName', this.value)">
      </div>
      <div class="st-grid-2">
        <div class="st-field">
          <label class="st-label">Telefon</label>
          <input class="st-input" value="${escapeHtml(b.phone || '')}" oninput="updateRootProp('branding.phone', this.value)">
        </div>
        <div class="st-field">
          <label class="st-label">E-posta</label>
          <input class="st-input" value="${escapeHtml(b.email || '')}" oninput="updateRootProp('branding.email', this.value)">
        </div>
      </div>
      <label class="st-toggle-row">
        <span>Sol Firma Logosu (TEKKOMER)</span>
        <input type="checkbox" ${b.showLogo !== false ? 'checked' : ''} onchange="updateRootProp('branding.showLogo', this.checked)">
      </label>
      <label class="st-toggle-row">
        <span>Sağ TÜRKAK Logosu</span>
        <input type="checkbox" ${b.showTurkak !== false ? 'checked' : ''} onchange="updateRootProp('branding.showTurkak', this.checked)">
      </label>
      <div class="st-field" style="margin-top:8px;">
        <label class="st-label">Altbilgi Yasal Uyarı Metni</label>
        <textarea class="st-textarea" rows="3" oninput="updateRootProp('branding.disclaimer', this.value)">${escapeHtml(b.disclaimer || '')}</textarea>
      </div>
    `;
    document.getElementById('brandingModal').classList.remove('hidden');
  };

  window.applyMarginPreset = function (preset) {
    ensureStyleDefaults(StudioState.schema);
    pushUndoSnapshot();
    const map = {
      narrow: { pagePadY: 4, pagePadX: 6, label: 'Dar (4mm / 6mm)' },
      normal: { pagePadY: 6.5, pagePadX: 10.5, label: 'Normal (6.5mm / 10.5mm)' },
      wide: { pagePadY: 10, pagePadX: 15, label: 'Geniş (10mm / 15mm)' }
    };
    const p = map[preset] || map.normal;
    StudioState.schema.layoutStyles.pagePadY = p.pagePadY;
    StudioState.schema.layoutStyles.pagePadX = p.pagePadX;
    renderAll();
    showToast(`Kenar boşluğu: ${p.label}`);
  };

  window.quickInsertTableRow = function () {
    const sec = getSelectedSection();
    if (!sec) return;
    if (sec.type === 'data_table') {
      addDataTableRow();
      showToast(`"${getSectionDisplayName(sec)}" tablosuna yeni satır eklendi`);
    } else if (sec.type === 'company_info') {
      addCompanyRow();
      showToast('Firma Bilgileri tablosuna yeni satır eklendi');
    } else if (sec.type === 'detail_21') {
      addDetail21Field();
      showToast('2.1 Detay tablosuna yeni alan eklendi');
    } else if (sec.type === 'detail_22') {
      addDetail22Prot();
      showToast('2.2 Koruma listesine yeni madde eklendi');
    } else if (sec.type === 'visual_checklist_group' && sec.topics && sec.topics.length > 0) {
      addVisualTopicItem(sec.topics.length - 1);
      showToast('Gözle kontrol listesine yeni madde eklendi');
    } else {
      showToast('Satır eklemek için bir tablo veya kontrol bölümü seçin');
    }
  };

  window.quickInsertTableCol = function () {
    const sec = getSelectedSection();
    if (sec && sec.type === 'data_table') {
      addDataTableCol();
      showToast(`"${getSectionDisplayName(sec)}" tablosuna yeni sütun eklendi`);
    } else {
      showToast('Sütun eklemek için bir ölçüm tablosu seçin (ör. 3, 4, 6.1, 6.2, 6.3)');
    }
  };

  window.quickCloneLastRow = function () {
    const sec = getSelectedSection();
    if (sec && sec.type === 'data_table' && sec.rows && sec.rows.length > 0) {
      cloneDataTableRow(sec.rows.length - 1);
      showToast('Son satır kopyalandı');
    } else if (sec && sec.type === 'company_info' && sec.rows && sec.rows.length > 0) {
      pushUndoSnapshot();
      sec.rows.push(JSON.parse(JSON.stringify(sec.rows[sec.rows.length - 1])));
      renderAll();
      showToast('Son firma satırı kopyalandı');
    } else {
      showToast('Kopyalamak için bir tablo bölümü seçin');
    }
  };

  window.toggleSelectedSectionPageBreak = function () {
    const sec = getSelectedSection();
    if (!sec) return;
    pushUndoSnapshot();
    if (!sec.style) sec.style = {};
    sec.style.forceBreak = !sec.style.forceBreak;
    renderAll();
    showToast(sec.style.forceBreak ? 'Seçili bölüm yeni sayfadan başlatılacak' : 'Sayfa sonu kaldırıldı');
  };

  window.moveSelectedSection = function (dir) {
    const arr = StudioState.schema?.sections || [];
    const idx = arr.findIndex(s => s.id === StudioState.selectedSectionId);
    if (idx < 0) return;
    moveSection(idx, dir);
  };

  window.toggleSelectedSectionVisibility = function () {
    const arr = StudioState.schema?.sections || [];
    const idx = arr.findIndex(s => s.id === StudioState.selectedSectionId);
    if (idx < 0) return;
    toggleSectionVisible(idx);
  };

  window.deleteSelectedSection = function () {
    const arr = StudioState.schema?.sections || [];
    const idx = arr.findIndex(s => s.id === StudioState.selectedSectionId);
    if (idx < 0) return;
    deleteSection(idx);
  };

  function syncRibbonInputsFromState() {
    const s = StudioState.schema;
    if (!s) return;
    ensureStyleDefaults(s);
    const ls = s.layoutStyles;
    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = v;
    };
    const setChk = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.checked = Boolean(v);
    };

    setVal('rbPagePadY', ls.pagePadY);
    setVal('rbPagePadX', ls.pagePadX);
    setVal('rbSecMT', ls.secMarginTop);
    setVal('rbSecMB', ls.secMarginBottom);
    setVal('rbSubMT', ls.subMarginTop);
    setVal('rbBlockGap', ls.blockGap);
    setVal('rbHeaderMB', ls.headerMarginBottom);
    setVal('rbCellPY', ls.cellPadY);
    setVal('rbRowMinH', ls.rowMinHeight);
    setVal('rbTblFS', ls.tableFontSize);

    setChk('rbGlobalBorderCheck', ls.customBorderEnabled);
    setVal('rbGlobalBorderColor', ls.borderColor || '#cbd5e1');
    setVal('rbGlobalBorderW', String(ls.borderWidth || 1));

    setChk('rbGlobalColorCheck', ls.customColorsEnabled);
    setVal('rbSecColor', ls.secTitleColor || '#1f3a5f');
    setVal('rbThBg', ls.thBg || '#f1f5f9');
    setVal('rbSubBg', ls.subBg || '#eaeff5');

    const theme = s.pdfTheme || 'rams_navy';
    document.querySelectorAll('[data-rb-theme]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rbTheme === theme);
    });

    const sec = getSelectedSection();
    const secLbl = document.getElementById('statusSecName');
    if (secLbl && sec) secLbl.textContent = `Seçili: ${getSectionDisplayName(sec)}`;

    const thLbl = document.getElementById('statusThemeLabel');
    if (thLbl) thLbl.textContent = `Tema: ${THEME_LABELS[theme] || theme}`;

    const ds = s.designSettings || DEFAULT_DESIGN_SETTINGS;
    setVal('rbDocFont', ds.docFont || '');
    setChk('chkShowHeader', !ds.hideHeader);
    setChk('chkShowFooter', !ds.hideFooter);
    const orientLbl = document.getElementById('rbOrientLabel');
    if (orientLbl) orientLbl.innerHTML = ds.orientation === 'landscape' ? 'Yatay<br>A4' : 'Dikey<br>A4';
    document.getElementById('rbOrientBtn')?.classList.toggle('active', ds.orientation === 'landscape');
    document.getElementById('rbLineNumBtn')?.classList.toggle('active', Boolean(ds.lineNumbers));
    document.getElementById('rbShowFormulasBtn')?.classList.toggle('active', Boolean(StudioState.showFormulas));
    document.getElementById('rbProtectBtn')?.classList.toggle('active', Boolean(s.sheetProtected));
    const protLbl = document.getElementById('rbProtectLabel');
    if (protLbl) protLbl.innerHTML = s.sheetProtected ? 'Korumayı<br>Kaldır' : 'Şablonu<br>Koru';

    if (sec && sec.type === 'data_table') {
      const opts = sec.tableOptions || {};
      setChk('chkTblBandedRows', opts.bandedRows !== false);
      setChk('chkTblBandedCols', Boolean(opts.bandedCols));
      setChk('chkTblFirstCol', Boolean(opts.firstColBold));
      setChk('chkTblLastCol', Boolean(opts.lastColBold));
      setChk('chkTblTotalRow', Boolean(sec.showTotalRow));
      setChk('chkTblFilterBtn', Boolean(sec.autoFilter));
      document.getElementById('rbAutoFilterBtn')?.classList.toggle('active', Boolean(sec.autoFilter));
    }

    document.getElementById('rbDetailDrawerBtn')?.classList.toggle('active', StudioState.showDetailPane);
    document.getElementById('rbFormatPainterBtn')?.classList.toggle('active', Boolean(StudioState.formatPainterStyle));
    document.getElementById('fxPainterPill')?.classList.toggle('hidden', !StudioState.formatPainterStyle);
  }

  window.onSelectVersion = function (versionId) {
    if (versionId === '__draft__') return;
    loadVersionById(versionId);
    const v = StudioState.allVersions.find(x => x.id === versionId);
    if (v) showToast(`${v.version_label} açıldı (kaydettiğinizde yeni versiyon oluşur)`);
  };

  window.openSaveVersionModal = function () {
    const s = StudioState.schema;
    if (!s) return;
    const keyInput = document.getElementById('saveTemplateKeyInput');
    keyInput.value = sanitizeKey(s.template_key || s.title);
    document.getElementById('saveChangelogInput').value = '';
    const refreshNext = () => {
      const nextV = getNextVersionNumber(keyInput.value || s.title);
      document.getElementById('nextVersionPreviewLabel').textContent = `v${nextV}`;
      document.getElementById('confirmSaveVerSpan').textContent = `v${nextV}`;
    };
    refreshNext();
    keyInput.oninput = refreshNext;
    document.getElementById('saveVersionModal').classList.remove('hidden');
  };

  window.confirmSaveNewVersion = async function () {
    const s = StudioState.schema;
    const key = sanitizeKey(document.getElementById('saveTemplateKeyInput').value || s.title);
    const changelog = String(document.getElementById('saveChangelogInput').value || '').trim();
    const publish = Boolean(document.getElementById('savePublishCheckbox').checked);
    const btn = document.getElementById('confirmSaveVersionBtn');
    btn.disabled = true;

    try {
      if (StudioState.storageMode === 'cloud') {
        const resp = await fetch('/api/studio', {
          method: 'POST',
          credentials: 'same-origin',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'save_version',
            template_key: key,
            title: s.title,
            category: s.category,
            form_code: s.form_code,
            changelog,
            publish,
            schema_json: s
          })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) throw new Error(data.error || 'Kayıt başarısız');
        const created = data.version;
        if (created.is_published) {
          StudioState.allVersions.forEach(v => { if (v.template_key === created.template_key) v.is_published = false; });
        }
        StudioState.allVersions.unshift(created);
        loadVersionById(created.id);
        closeModal('saveVersionModal');
        showToast(`Buluta kaydedildi: ${created.version_label} (Eski sürümler korundu)`);
      } else {
        const nextV = getNextVersionNumber(key);
        const verLabel = `v${nextV}`;
        if (publish) {
          StudioState.allVersions.forEach(v => { if (v.template_key === key) v.is_published = false; });
        }
        const copy = JSON.parse(JSON.stringify(s));
        copy.template_key = key;
        copy.version_number = nextV;
        copy.version_label = verLabel;

        const rec = {
          id: `loc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          template_key: key,
          version_number: nextV,
          version_label: verLabel,
          title: s.title,
          category: s.category || 'Elektrik',
          form_code: s.form_code || 'TKM-FR.318',
          changelog: changelog || (nextV === 1 ? 'İlk sürüm oluşturuldu' : `${verLabel} güncellemesi`),
          is_published: publish || nextV === 1,
          is_archived: false,
          schema_json: copy,
          created_by_name: 'Yerel Kullanıcı',
          created_at: new Date().toISOString()
        };
        StudioState.allVersions.unshift(rec);
        saveLocalVersions(StudioState.allVersions);
        loadVersionById(rec.id);
        closeModal('saveVersionModal');
        showToast(`Yeni versiyon kaydedildi: ${verLabel} (Eski sürümler korundu)`);
      }
    } catch (err) {
      showToast(`Hata: ${err.message}`);
    } finally {
      btn.disabled = false;
    }
  };

  window.openVersionHistoryModal = function () {
    const body = document.getElementById('versionHistoryBody');
    const key = StudioState.schema ? StudioState.schema.template_key : '';
    const list = StudioState.allVersions
      .filter(v => !v.is_archived && v.template_key === key)
      .sort((a, b) => Number(b.version_number) - Number(a.version_number));

    if (list.length === 0) {
      body.innerHTML = `<div style="text-align:center; padding:24px; color:#64748b;">
        Bu şablon için henüz kayıtlı versiyon yok.<br><strong>"Yeni Versiyon Kaydet"</strong> ile <strong>v1</strong> oluşturabilirsiniz.
      </div>`;
    } else {
      body.innerHTML = list.map(v => {
        const isCurrent = v.id === StudioState.loadedVersionId;
        const dt = v.created_at ? new Date(v.created_at).toLocaleString('tr-TR') : '';
        return `
          <div class="st-ver-card ${isCurrent ? 'active-ver' : ''}">
            <div style="min-width:0;">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <strong style="font-size:13px;">${escapeHtml(v.version_label)}</strong>
                ${v.is_published ? '<span style="background:#d1fae5;color:#065f46;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;">★ YAYINDA</span>' : ''}
                ${isCurrent ? '<span style="background:#e0f2fe;color:#0369a1;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;">AÇIK</span>' : ''}
                <span style="font-size:11px; color:#64748b;">${escapeHtml(v.form_code)} · ${escapeHtml(dt)}</span>
              </div>
              <div style="font-size:12px; font-weight:700; margin-top:3px;">${escapeHtml(v.title)}</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">${escapeHtml(v.changelog || '—')}</div>
            </div>
            <div style="display:flex; gap:5px; flex-shrink:0;">
              <button type="button" class="st-btn st-btn-light st-btn-xs" onclick="loadVersionFromHistory('${escapeHtml(v.id)}')">Aç</button>
              ${!v.is_published ? `<button type="button" class="st-btn st-btn-emerald st-btn-xs" onclick="publishVersionById('${escapeHtml(v.id)}')">Yayına Al</button>` : ''}
            </div>
          </div>`;
      }).join('');
    }
    document.getElementById('versionHistoryModal').classList.remove('hidden');
  };

  window.loadVersionFromHistory = function (id) {
    loadVersionById(id);
    closeModal('versionHistoryModal');
    showToast('Seçili versiyon açıldı');
  };

  window.publishVersionById = async function (id) {
    const target = StudioState.allVersions.find(v => v.id === id);
    if (!target) return;
    if (StudioState.storageMode === 'cloud') {
      try {
        const resp = await fetch('/api/studio', {
          method: 'POST', credentials: 'same-origin', headers: getAuthHeaders(),
          body: JSON.stringify({ action: 'publish_version', version_id: id })
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) throw new Error(data.error || 'Yayına alınamadı');
      } catch (err) {
        return showToast(`Hata: ${err.message}`);
      }
    }
    StudioState.allVersions.forEach(v => { if (v.template_key === target.template_key) v.is_published = (v.id === id); });
    if (StudioState.storageMode === 'local') saveLocalVersions(StudioState.allVersions);
    populateFamilyAndVersionSelects();
    openVersionHistoryModal();
    showToast(`${target.version_label} yayına alındı!`);
  };

  window.openCloudLoginModal = function () {
    const box = document.getElementById('cloudLoginStatusBox');
    box.innerHTML = (StudioState.storageMode === 'cloud' && StudioState.tenant)
      ? `<div style="background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46;padding:9px 11px;border-radius:9px;font-size:12px;"><strong>Bağlı:</strong> ${escapeHtml(StudioState.tenant.name)}</div>`
      : '';
    document.getElementById('cloudLoginModal').classList.remove('hidden');
  };

  window.submitStudioCloudLogin = async function (ev) {
    ev.preventDefault();
    const username = document.getElementById('studioLoginUser').value.trim();
    const password = document.getElementById('studioLoginPass').value.trim();
    try {
      const resp = await fetch('/api/manager', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password })
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || 'Giriş başarısız');
      if (data.token) localStorage.setItem(MANAGER_TOKEN_KEY, data.token);
      closeModal('cloudLoginModal');
      showToast('Bulut oturumu açıldı');
      await initStorageAndLoad();
    } catch (err) {
      showToast(`Giriş hatası: ${err.message}`);
    }
  };

  window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  };

  // --------------------------------------------------------------------------
  // 4. İNTERAKTİF DÜZENLEME AKSİYONLARI (WORD + EXCEL RIBBON & A4 ÜZERİNDEN)
  // --------------------------------------------------------------------------
  window.selectSection = function (secId, opts) {
    StudioState.selectedSectionId = secId;
    const scrollToA4 = (opts && typeof opts === 'object') ? Boolean(opts.scrollToA4) : false;
    const openDetail = (opts && typeof opts === 'object') ? Boolean(opts.openDetail) : false;

    renderNavPane();
    highlightSelectedOnA4();
    syncRibbonInputsFromState();

    if (openDetail) {
      toggleDetailPane(true);
    } else if (StudioState.showDetailPane) {
      renderDetailPane();
    }

    if (scrollToA4) {
      const target = document.querySelector(`.a4-interactive-block[data-sec-id="${CSS.escape(secId)}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  function highlightSelectedOnA4() {
    document.querySelectorAll('.a4-interactive-block').forEach(el => {
      el.classList.toggle('a4-selected-block', el.dataset.secId === StudioState.selectedSectionId);
    });
  }

  window.setQuickTheme = function (theme) {
    if (StudioState.schema.pdfTheme === theme) return;
    pushUndoSnapshot();
    StudioState.schema.pdfTheme = theme;
    renderLiveA4();
    syncRibbonInputsFromState();
    showToast(`Tema: ${THEME_LABELS[theme] || theme}`);
  };

  window.updateRootProp = function (path, val) {
    const parts = path.split('.');
    let obj = StudioState.schema;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = val;
    renderLiveA4();
    if (path === 'pdfTheme') syncRibbonInputsFromState();
  };

  window.loadBlueprintById = function (bpId) {
    const bp = BLUEPRINT_CATALOG.find(b => b.id === bpId);
    if (!bp) return;
    StudioState.loadedVersionId = null;
    StudioState.schema = bp.factory();
    ensureStyleDefaults(StudioState.schema);
    StudioState.selectedSectionId = StudioState.schema.sections[0].id;
    StudioState.selectedCellKey = null;
    StudioState.formatPainterStyle = null;
    StudioState.undoStack = [];
    StudioState.redoStack = [];
    populateFamilyAndVersionSelects();
    renderAll();
    showToast(`"${bp.name}" taslağı yüklendi`);
  };

  // --- BÖLÜM EKLE / SİL / SIRALA / GİZLE ---
  window.addNewSection = function (type) {
    pushUndoSnapshot();
    const secs = StudioState.schema.sections;
    let newSec = null;
    if (type === 'data_table') {
      newSec = {
        id: uid('sec_tbl'),
        type: 'data_table',
        visible: true,
        title: 'YENİ ÖLÇÜM / TEST TABLOSU',
        subTitle: 'ALT TABLO BAŞLIĞI',
        showNoCol: true,
        noColWidth: 5,
        showLegend: true,
        columns: [
          { id: uid('c'), label: 'Ölçüm Noktası', group: '', width: 35, type: 'text', align: 'left' },
          { id: uid('c'), label: 'Ölçülen Değer', group: 'Ölçüm Değerleri', width: 25, type: 'text', align: 'center' },
          { id: uid('c'), label: 'Sınır Değer', group: 'Ölçüm Değerleri', width: 25, type: 'text', align: 'center' },
          { id: uid('c'), label: 'Sonuç', group: '', width: 10, type: 'symbol', align: 'center' }
        ],
        rows: [{}]
      };
      newSec.columns.forEach((c, i) => { newSec.rows[0][c.id] = c.type === 'symbol' ? '✓' : (i === 0 ? 'Örnek Nokta 1' : ''); });
    } else if (type === 'visual_checklist_group') {
      newSec = {
        id: uid('sec_vis'),
        type: 'visual_checklist_group',
        visible: true,
        superTitle: '',
        title: 'YENİ GÖZLE KONTROL KRİTERLERİ',
        panoSubTitle: '',
        panoLabel: '',
        panoValue: '',
        footnote: '',
        topics: [{
          id: uid('vt'),
          title: 'KONTROL GRUBU 1',
          items: [
            { id: uid('i'), text: 'Kontrol maddesi 1', sym: '✓' },
            { id: uid('i'), text: 'Kontrol maddesi 2', sym: '✓' }
          ]
        }]
      };
    } else if (type === 'notes_box') {
      newSec = {
        id: uid('sec_note'),
        type: 'notes_box',
        visible: true,
        title: 'YENİ AÇIKLAMA / NOT BÖLÜMÜ',
        content: 'Bu bölüme rapora özel açıklamalar veya yönetmelik notları yazılabilir.',
        bottomNote: ''
      };
    }
    if (!newSec) return;
    const insertIdx = Math.max(0, secs.length - 2);
    secs.splice(insertIdx, 0, newSec);
    StudioState.selectedSectionId = newSec.id;
    renderAll();
    setTimeout(() => {
      const el = document.querySelector(`.a4-interactive-block[data-sec-id="${CSS.escape(newSec.id)}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    showToast('Yeni bölüm eklendi');
  };

  window.moveSection = function (idx, dir, ev) {
    if (ev) ev.stopPropagation();
    const arr = StudioState.schema.sections;
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    pushUndoSnapshot();
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    renderAll();
  };

  window.toggleSectionVisible = function (idx, ev) {
    if (ev) ev.stopPropagation();
    pushUndoSnapshot();
    StudioState.schema.sections[idx].visible = !StudioState.schema.sections[idx].visible;
    renderAll();
  };

  window.deleteSection = function (idx, ev) {
    if (ev) ev.stopPropagation();
    if (StudioState.schema.sections.length <= 1) return showToast('En az 1 bölüm kalmalıdır');
    pushUndoSnapshot();
    StudioState.schema.sections.splice(idx, 1);
    StudioState.selectedSectionId = StudioState.schema.sections[0].id;
    renderAll();
    showToast('Bölüm kaldırıldı');
  };

  // --- DOĞRUDAN A4 ÜZERİNDEN CANLI İŞARETLEME (✓ -> X -> N -> G & RADYO) ---
  const SYM_CYCLE = ['✓', 'X', 'N', 'G', ''];
  window.cycleVisualItemOnA4 = function (secId, tIdx, iIdx, ev) {
    if (ev) ev.stopPropagation();
    const sec = StudioState.schema.sections.find(s => s.id === secId);
    if (!sec || !sec.topics[tIdx] || !sec.topics[tIdx].items[iIdx]) return;
    pushUndoSnapshot();
    const item = sec.topics[tIdx].items[iIdx];
    const nextIdx = (SYM_CYCLE.indexOf(item.sym || '') + 1) % SYM_CYCLE.length;
    item.sym = SYM_CYCLE[nextIdx];
    StudioState.selectedSectionId = secId;
    renderAll();
  };

  window.cycleTableCellSymOnA4 = function (secId, rIdx, colId, ev) {
    if (ev) ev.stopPropagation();
    const sec = StudioState.schema.sections.find(s => s.id === secId);
    if (!sec || !sec.rows[rIdx]) return;
    pushUndoSnapshot();
    const cur = sec.rows[rIdx][colId] || '';
    const nextIdx = (SYM_CYCLE.indexOf(cur) + 1) % SYM_CYCLE.length;
    sec.rows[rIdx][colId] = SYM_CYCLE[nextIdx];
    StudioState.selectedSectionId = secId;
    renderAll();
  };

  window.pickDetail21RadioOnA4 = function (secId, fieldIdx, optVal, ev) {
    if (ev) ev.stopPropagation();
    const sec = StudioState.schema.sections.find(s => s.id === secId);
    if (!sec || !sec.fields[fieldIdx]) return;
    pushUndoSnapshot();
    sec.fields[fieldIdx].value = optVal;
    StudioState.selectedSectionId = secId;
    renderAll();
  };

  window.pickDetail22OptOnA4 = function (secId, kind, idx, optVal, ev) {
    if (ev) ev.stopPropagation();
    const sec = StudioState.schema.sections.find(s => s.id === secId);
    if (!sec) return;
    pushUndoSnapshot();
    if (kind === 'top') sec.topQuestions[idx].value = optVal;
    else if (kind === 'bottom') sec.bottomQuestion.value = optVal;
    else if (kind === 'prot') {
      const p = sec.protectionItems[idx];
      p.value = (p.value === 'Var') ? 'Yok' : 'Var';
    }
    StudioState.selectedSectionId = secId;
    renderAll();
  };

  window.pickFuncRadioOnA4 = function (secId, field, optVal, ev) {
    if (ev) ev.stopPropagation();
    const sec = StudioState.schema.sections.find(s => s.id === secId);
    if (!sec) return;
    pushUndoSnapshot();
    sec[field] = optVal;
    StudioState.selectedSectionId = secId;
    renderAll();
  };

  // --- GENEL SECTION PROPERTY UPDATERS ---
  window.updateSecProp = function (prop, val) {
    const sec = getSelectedSection();
    if (!sec) return;
    sec[prop] = val;
    renderLiveA4();
  };

  // Company info helpers
  window.updateCompanyRow = function (rIdx, prop, val) {
    const sec = getSelectedSection();
    if (!sec || !sec.rows[rIdx]) return;
    sec.rows[rIdx][prop] = val;
    renderLiveA4();
    if (prop === 'layout') renderLeftPanel();
  };
  window.addCompanyRow = function () {
    pushUndoSnapshot();
    const sec = getSelectedSection();
    sec.rows.push({ layout: 'pair', label1: 'Yeni Alan 1', val1: '', label2: 'Yeni Alan 2', val2: '' });
    renderAll();
  };
  window.removeCompanyRow = function (rIdx) {
    pushUndoSnapshot();
    getSelectedSection().rows.splice(rIdx, 1);
    renderAll();
  };
  window.updateCompanyScope = function (text) {
    const sec = getSelectedSection();
    sec.scopeLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    renderLiveA4();
  };

  // Detail 2.1 helpers
  window.updateDetail21Field = function (idx, prop, val) {
    const sec = getSelectedSection();
    const f = sec.fields[idx];
    if (!f) return;
    if (prop === 'optionsText') {
      f.options = val.split(',').map(x => x.trim()).filter(Boolean);
    } else {
      f[prop] = val;
    }
    renderLiveA4();
    if (prop === 'type') renderLeftPanel();
  };
  window.addDetail21Field = function () {
    pushUndoSnapshot();
    const sec = getSelectedSection();
    sec.fields.push({ id: uid('d'), label: 'Yeni Detay Hücresi', type: 'text', value: '' });
    renderAll();
  };
  window.removeDetail21Field = function (idx) {
    pushUndoSnapshot();
    getSelectedSection().fields.splice(idx, 1);
    renderAll();
  };

  // Detail 2.2 helpers
  window.updateDetail22Item = function (kind, idx, prop, val) {
    const sec = getSelectedSection();
    if (kind === 'top') sec.topQuestions[idx][prop] = val;
    else if (kind === 'prot') sec.protectionItems[idx][prop] = val;
    else if (kind === 'bottom') sec.bottomQuestion[prop] = val;
    renderLiveA4();
  };
  window.addDetail22Prot = function () {
    pushUndoSnapshot();
    getSelectedSection().protectionItems.push({ id: uid('p'), label: 'Yeni koruma önlemi maddesi', value: 'Var' });
    renderAll();
  };
  window.removeDetail22Prot = function (idx) {
    pushUndoSnapshot();
    getSelectedSection().protectionItems.splice(idx, 1);
    renderAll();
  };

  // Data table helpers (Sütun + Grup Başlığı + Satır/Hücre!)
  window.addDataTableCol = function () {
    pushUndoSnapshot();
    const sec = getSelectedSection();
    const id = uid('c');
    sec.columns.push({ id, label: 'Yeni Sütun', group: '', width: 10, type: 'text', align: 'center' });
    sec.rows.forEach(r => { r[id] = ''; });
    renderAll();
  };
  window.updateDataTableCol = function (cIdx, prop, val) {
    const sec = getSelectedSection();
    const col = sec.columns[cIdx];
    if (!col) return;
    col[prop] = prop === 'width' ? Number(val || 8) : val;
    renderLiveA4();
    if (prop === 'type' || prop === 'label') renderLeftPanel();
  };
  window.moveDataTableCol = function (cIdx, dir) {
    const arr = getSelectedSection().columns;
    const t = cIdx + dir;
    if (t < 0 || t >= arr.length) return;
    pushUndoSnapshot();
    [arr[cIdx], arr[t]] = [arr[t], arr[cIdx]];
    renderAll();
  };
  window.removeDataTableCol = function (cIdx) {
    const sec = getSelectedSection();
    if (sec.columns.length <= 1) return showToast('En az 1 sütun kalmalıdır');
    pushUndoSnapshot();
    const rem = sec.columns.splice(cIdx, 1)[0];
    if (rem) sec.rows.forEach(r => delete r[rem.id]);
    renderAll();
  };
  window.addDataTableRow = function () {
    pushUndoSnapshot();
    const sec = getSelectedSection();
    const row = {};
    sec.columns.forEach(c => { row[c.id] = c.type === 'symbol' ? '✓' : ''; });
    sec.rows.push(row);
    renderAll();
  };
  window.cloneDataTableRow = function (rIdx) {
    pushUndoSnapshot();
    const sec = getSelectedSection();
    sec.rows.push(JSON.parse(JSON.stringify(sec.rows[rIdx])));
    renderAll();
  };
  window.removeDataTableRow = function (rIdx) {
    const sec = getSelectedSection();
    if (sec.rows.length <= 1) return showToast('En az 1 satır kalmalıdır');
    pushUndoSnapshot();
    sec.rows.splice(rIdx, 1);
    renderAll();
  };
  window.updateDataTableCell = function (rIdx, colId, val) {
    const sec = getSelectedSection();
    if (!sec.rows[rIdx]) return;
    sec.rows[rIdx][colId] = val;
    renderLiveA4();
  };
  window.updateDataTableRowHeight = function (rIdx, val) {
    const sec = getSelectedSection();
    if (!sec || !sec.rows[rIdx]) return;
    const n = Number(val);
    sec.rows[rIdx]._height = (n && n >= 12) ? n : 0;
    renderLiveA4();
  };

  function parseDecimalValue(raw) {
    if (raw === '' || raw === null || raw === undefined) return { state: 'empty', num: null };
    const str = String(raw).trim();
    if (!str) return { state: 'empty', num: null };
    if (/[.,]$/.test(str)) return { state: 'typing', num: null };
    const normalized = str.replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) return { state: 'invalid', num: null };
    const n = parseFloat(normalized);
    return isFinite(n) ? { state: 'ok', num: n } : { state: 'invalid', num: null };
  }

  // --- GLOBAL BOŞLUK, BOYUTLANDIRMA & HÜCRE STİLLERİ ---
  window.updateLayoutStyle = function (prop, val, isNum = false) {
    ensureStyleDefaults(StudioState.schema);
    let finalVal = val;
    if (isNum) {
      const p = parseDecimalValue(val);
      if (p.state === 'typing' || p.state === 'invalid') return;
      if (p.state === 'empty') return;
      finalVal = p.num;
    }
    StudioState.schema.layoutStyles[prop] = finalVal;
    const valSpan = document.getElementById(`lsVal_${prop}`);
    if (valSpan) {
      const unit = valSpan.dataset.unit || '';
      valSpan.textContent = `${finalVal}${unit}`;
    }
    renderLiveA4();
    syncRibbonInputsFromState();
    if (prop === 'pagePadX') updateRulerMargins();
  };

  window.resetLayoutStyles = function () {
    pushUndoSnapshot();
    StudioState.schema.layoutStyles = Object.assign({}, DEFAULT_LAYOUT_STYLES);
    renderAll();
    showToast('Tüm boşluk ve hücre boyutları varsayılana sıfırlandı');
  };

  // --- BÖLÜM BAZLI BOŞLUK & HÜCRE STİLİ ---
  window.updateSecStyle = function (prop, val, isNum = false) {
    const sec = getSelectedSection();
    if (!sec) return;
    if (!sec.style) sec.style = {};
    if (val === '' || val === null || val === undefined) {
      delete sec.style[prop];
    } else {
      sec.style[prop] = isNum ? Number(val) : val;
    }
    const valSpan = document.getElementById(`secStVal_${prop}`);
    if (valSpan) {
      const unit = valSpan.dataset.unit || '';
      valSpan.textContent = (val === '' || (Number(val) === 0 && prop !== 'marginTop' && prop !== 'marginBottom')) ? 'Oto' : `${val}${unit}`;
    }
    renderLiveA4();
  };

  window.resetSecStyle = function () {
    const sec = getSelectedSection();
    if (!sec) return;
    pushUndoSnapshot();
    sec.style = {};
    renderAll();
    showToast('Seçili bölümün özel stilleri sıfırlandı');
  };

  // --- EXCEL HÜCRE SEÇİMİ, fx ÇUBUĞU, DOĞRUDAN YAZMA & BİÇİM BOYACISI ---
  function colIndexToExcelLetter(idx) {
    let n = Number(idx) || 0;
    let s = '';
    while (n >= 0) {
      s = String.fromCharCode((n % 26) + 65) + s;
      n = Math.floor(n / 26) - 1;
    }
    return s;
  }

  function formatCellAddress(key) {
    if (!key) return 'Hücre seçin...';
    const parts = String(key).split('::');
    const secId = parts[0] || '';
    const rNum = Number((parts[2] || 'r0').replace(/^r/, '')) + 1;
    const cNum = Number((parts[3] || 'c0').replace(/^c/, ''));
    const sec = (StudioState.schema?.sections || []).find(x => x.id === secId);
    const shortSec = sec ? getSectionDisplayName(sec).slice(0, 14).trim() : 'Hücre';
    return `${shortSec} · ${colIndexToExcelLetter(cNum)}${rNum}`;
  }

  function isCellTextEditable(cell) {
    if (!cell) return false;
    if (cell.classList.contains('a4-click-sym')) return false;
    if (cell.querySelector('img, .a4-click-opt, .a4-click-sym, .tkm-sym-badge, .tkm-conclusion-box, input, select')) {
      return false;
    }
    return true;
  }

  function getCellEditableText(cell) {
    if (!cell) return '';
    const clone = cell.cloneNode(true);
    clone.querySelectorAll('.col-resize-handle, .row-resize-handle, .a4-fill-handle, .tbl-filter-btn, .cf-databar-fill, .cf-icon-prefix').forEach(h => h.remove());
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    const blocks = clone.querySelectorAll('div, p, li');
    blocks.forEach((b, idx) => {
      if (idx > 0 || b.previousSibling) {
        b.before('\n');
      }
    });
    return clone.textContent
      .replace(/\r\n/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function setCellDomTextKeepingHandles(cell, text) {
    if (!cell) return;
    const handles = Array.from(cell.querySelectorAll('.col-resize-handle, .row-resize-handle, .a4-fill-handle, .tbl-filter-btn'));
    const str = String(text == null ? '' : text);
    if (str.includes('\n')) {
      cell.innerHTML = escapeHtmlBr(str);
    } else {
      cell.textContent = str;
    }
    handles.forEach(h => cell.appendChild(h));
  }

  function applyCellTextToModel(key, newText, cellEl) {
    const s = StudioState.schema;
    if (!s) return;
    ensureStyleDefaults(s);

    const bind = cellEl?.dataset?.bind || '';
    let syncedNative = false;

    if (bind) {
      const parts = bind.split(':');
      const kind = parts[0];
      const sec = (s.sections || []).find(x => x.id === parts[1]);
      if (sec) {
        if (kind === 'ci' && sec.rows && sec.rows[Number(parts[2])]) {
          sec.rows[Number(parts[2])][parts[3]] = newText;
          syncedNative = true;
        } else if (kind === 'ci_scope') {
          sec.scopeLines = newText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          sec.scopeRawLines = true;
          syncedNative = true;
        } else if (kind === 'ci_scope_lbl') {
          sec.scopeLabel = newText;
          syncedNative = true;
        } else if (kind === 'd22_prot_title') {
          sec.protectionTitle = newText;
          syncedNative = true;
        } else if (kind === 'dt_col' && sec.columns && sec.columns[Number(parts[2])]) {
          sec.columns[Number(parts[2])].label = newText;
          syncedNative = true;
        } else if (kind === 'dt_cell' && sec.rows && sec.rows[Number(parts[2])]) {
          sec.rows[Number(parts[2])][parts[3]] = newText;
          syncedNative = true;
        } else if (kind === 'note') {
          sec.content = newText.replace(/^✓\s*/, '');
          syncedNative = true;
        } else if (kind === 'appr') {
          sec[parts[2]] = newText;
          syncedNative = true;
        }
      }
    }

    if (syncedNative) {
      delete s.cellTextOverrides[key];
    } else {
      s.cellTextOverrides[key] = newText;
    }
  }

  function syncCellStyleRibbon() {
    const key = StudioState.selectedCellKey;
    const range = getSelectedCellKeys();
    const nameBox = document.getElementById('fxNameBox');
    const fxInput = document.getElementById('fxCellInput');

    if (!key) {
      if (nameBox) {
        nameBox.textContent = 'Hücre seçin...';
        nameBox.title = 'Aktif Hücre Adresi';
      }
      if (fxInput && document.activeElement !== fxInput) {
        fxInput.value = '';
        fxInput.disabled = true;
        fxInput.placeholder = 'A4 üzerinde hücreye tıklayın — metin veya =TOPLA(B1:B5) gibi Excel formülü yazabilirsiniz...';
      }
      ['csrBoldBtn', 'csrItalicBtn', 'csrUnderlineBtn', 'csrStrikeBtn', 'csrSubBtn', 'csrSupBtn',
       'csrAlignLeft', 'csrAlignCenter', 'csrAlignRight', 'csrAlignJustify',
       'csrValignTop', 'csrValignMid', 'csrValignBot', 'csrWrapBtn', 'csrMergeBtn',
       'csrBulletBtn', 'csrNumberBtn'].forEach(id => {
        document.getElementById(id)?.classList.remove('active');
      });
      if (window.__StudioOffice?.updateSelectionStats) window.__StudioOffice.updateSelectionStats();
      return;
    }

    ensureStyleDefaults(StudioState.schema);
    const st = StudioState.schema.cellStyles[key] || {};
    const cellEl = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);

    let addr = formatCellAddress(key);
    if (range.length > 1) {
      const first = formatCellAddress(range[0]).split(' · ')[1] || '';
      const last = formatCellAddress(range[range.length - 1]).split(' · ')[1] || '';
      const secPart = addr.split(' · ')[0] || 'Aralık';
      addr = `${secPart} · ${first}:${last} (${range.length})`;
    }
    if (nameBox) {
      nameBox.textContent = addr;
      nameBox.title = addr;
    }

    const editable = isCellTextEditable(cellEl);
    const isLockedProtected = Boolean(StudioState.schema?.sheetProtected && StudioState.schema?.lockedCells?.[key]);
    const curText = editable ? (cellEl?.dataset?.rawValue !== undefined ? cellEl.dataset.rawValue : getCellEditableText(cellEl)) : '';
    const nonEmptyLines = curText ? curText.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];
    const isBulletList = nonEmptyLines.length > 0 && nonEmptyLines.every(l => /^[•●▪\-*]\s+/.test(l));
    const isNumberList = nonEmptyLines.length > 0 && nonEmptyLines.every(l => /^\d+[.)]\s+/.test(l));

    if (fxInput && document.activeElement !== fxInput) {
      fxInput.disabled = !editable || isLockedProtected;
      if (isLockedProtected) {
        fxInput.value = curText;
        fxInput.placeholder = 'Bu hücre kilitli — düzenlemek için Gözden Geçir → Korumayı Kaldır seçeneğini kullanın.';
      } else if (editable) {
        fxInput.value = curText;
        fxInput.placeholder = 'Metin veya =TOPLA(B1:B5) formülü yazın (Yeni satır: Alt+Enter, Kaydet: Enter)...';
      } else {
        fxInput.value = '';
        fxInput.placeholder = 'Bu hücre radyo / ✓-X-N-G / görsel içerir — doğrudan üzerine tıklayarak veya Özellikler panelinden düzenleyin.';
      }
    }

    const ffEl = document.getElementById('csrFontFamily');
    const fsEl = document.getElementById('csrFontSize');
    const hEl = document.getElementById('csrHeight');
    const pyEl = document.getElementById('csrPadY');
    const lhEl = document.getElementById('csrLineHeight');
    const nfEl = document.getElementById('csrNumFmtSelect');
    const bgBar = document.getElementById('csrBgBar');
    const colBar = document.getElementById('csrColorBar');

    if (ffEl) ffEl.value = st.fontFamily || '';
    if (fsEl && document.activeElement !== fsEl) fsEl.value = st.fontSize || '';
    if (hEl && document.activeElement !== hEl) hEl.value = st.minHeight || '';
    if (pyEl && document.activeElement !== pyEl) pyEl.value = (st.padY != null && st.padY !== '') ? st.padY : '';
    if (lhEl) lhEl.value = st.lineHeight || '';
    if (nfEl) nfEl.value = st.numFmt || '';
    if (bgBar && st.bg) bgBar.style.background = st.bg;
    if (colBar && st.color) colBar.style.background = st.color;

    const isMerged = Boolean(StudioState.schema.cellMerges && StudioState.schema.cellMerges[key]);
    document.getElementById('csrBoldBtn')?.classList.toggle('active', Boolean(st.bold));
    document.getElementById('csrItalicBtn')?.classList.toggle('active', Boolean(st.italic));
    document.getElementById('csrUnderlineBtn')?.classList.toggle('active', Boolean(st.underline));
    document.getElementById('csrStrikeBtn')?.classList.toggle('active', Boolean(st.strike));
    document.getElementById('csrSubBtn')?.classList.toggle('active', Boolean(st.subscript));
    document.getElementById('csrSupBtn')?.classList.toggle('active', Boolean(st.superscript));
    document.getElementById('csrAlignLeft')?.classList.toggle('active', st.align === 'left');
    document.getElementById('csrAlignCenter')?.classList.toggle('active', st.align === 'center');
    document.getElementById('csrAlignRight')?.classList.toggle('active', st.align === 'right');
    document.getElementById('csrAlignJustify')?.classList.toggle('active', st.align === 'justify');
    document.getElementById('csrValignTop')?.classList.toggle('active', st.valign === 'top');
    document.getElementById('csrValignMid')?.classList.toggle('active', st.valign === 'middle');
    document.getElementById('csrValignBot')?.classList.toggle('active', st.valign === 'bottom');
    document.getElementById('csrWrapBtn')?.classList.toggle('active', st.wrapText !== false);
    document.getElementById('csrMergeBtn')?.classList.toggle('active', isMerged);
    document.getElementById('csrBulletBtn')?.classList.toggle('active', isBulletList);
    document.getElementById('csrNumberBtn')?.classList.toggle('active', isNumberList);

    if (window.__StudioOffice?.updateSelectionStats) window.__StudioOffice.updateSelectionStats();
  }

  function applySelectionHighlightDom() {
    document.querySelectorAll('.a4-cell-selected, .a4-cell-in-range').forEach(el => {
      el.classList.remove('a4-cell-selected', 'a4-cell-in-range');
    });
    document.querySelectorAll('.a4-fill-handle').forEach(h => h.remove());
    const range = getSelectedCellKeys();
    range.forEach(k => {
      const el = document.querySelector(`[data-cell-key="${CSS.escape(k)}"]`);
      if (el) el.classList.add('a4-cell-in-range');
    });
    const activeKey = StudioState.selectedCellKey;
    if (activeKey) {
      const el = document.querySelector(`[data-cell-key="${CSS.escape(activeKey)}"]`);
      if (el) {
        el.classList.add('a4-cell-selected');
        if (range.length === 1) el.classList.remove('a4-cell-in-range');
        if (window.__StudioOffice?.attachFillHandle) {
          window.__StudioOffice.attachFillHandle(el, activeKey);
        }
      }
    }
  }

  window.selectCellByKey = function (key, opts) {
    if (document.activeElement && ['BUTTON', 'A'].includes(document.activeElement.tagName)) {
      document.activeElement.blur();
    }
    const extendRange = Boolean(opts && opts.extendRange);
    if (extendRange && StudioState.selectedCellKey && window.__StudioOffice?.computeCellRangeKeys) {
      const keys = window.__StudioOffice.computeCellRangeKeys(StudioState.selectedCellKey, key);
      StudioState.selectedCellRange = keys.length > 0 ? keys : [key];
    } else {
      StudioState.selectedCellKey = key;
      StudioState.selectedCellRange = key ? [key] : [];
    }
    applySelectionHighlightDom();

    const secId = String(key || '').split('::')[0];
    if (secId && secId !== StudioState.selectedSectionId) {
      StudioState.selectedSectionId = secId;
      renderNavPane();
      highlightSelectedOnA4();
      if (StudioState.showDetailPane && StudioState.activeSideTab === 'props') renderDetailPane();
    }
    syncRibbonInputsFromState();
    syncCellStyleRibbon();
  };

  function moveCellSelection(dRow, dCol, wrapLinear = false) {
    const key = StudioState.selectedCellKey;
    if (!key) return false;
    const cell = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    const tbl = cell ? cell.closest('table.tkm-table') : null;
    if (!cell || !tbl) return false;

    const allCells = Array.from(tbl.querySelectorAll('th[data-cell-key], td[data-cell-key]'));
    if (wrapLinear) {
      const idx = allCells.indexOf(cell);
      const next = allCells[idx + dCol];
      if (next && next.dataset.cellKey) {
        selectCellByKey(next.dataset.cellKey);
        next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return true;
      }
      return false;
    }

    const rows = Array.from(tbl.querySelectorAll('tr'));
    const curTr = cell.closest('tr');
    const rIdx = rows.indexOf(curTr);
    const curCells = curTr ? Array.from(curTr.querySelectorAll('th[data-cell-key], td[data-cell-key]')) : [];
    const cIdx = curCells.indexOf(cell);
    if (rIdx < 0 || cIdx < 0) return false;

    const nextR = Math.max(0, Math.min(rows.length - 1, rIdx + dRow));
    const nextRowCells = Array.from(rows[nextR].querySelectorAll('th[data-cell-key], td[data-cell-key]'));
    if (nextRowCells.length === 0) return false;
    const nextC = Math.max(0, Math.min(nextRowCells.length - 1, cIdx + dCol));
    const target = nextRowCells[nextC];
    if (target && target.dataset.cellKey && target !== cell) {
      selectCellByKey(target.dataset.cellKey);
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return true;
    }
    return false;
  }

  function startInlineCellEdit(cell, key, opts) {
    if (!cell || !key) return;
    ensureStyleDefaults(StudioState.schema);
    if (StudioState.schema.sheetProtected && StudioState.schema.lockedCells[key]) {
      showToast('Bu hücre kilitli! Düzenlemek için Gözden Geçir → Korumayı Kaldır seçeneğini kullanın.');
      return;
    }
    if (!isCellTextEditable(cell)) {
      showToast('Bu hücre radyo/işaret/görsel içerir; doğrudan tıklayarak veya Özellikler panelinden değiştirebilirsiniz');
      return;
    }
    selectCellByKey(key);
    if (cell.isContentEditable) return;

    const origHtml = cell.innerHTML;
    const origText = cell.dataset.rawValue !== undefined ? cell.dataset.rawValue : getCellEditableText(cell);
    const handles = Array.from(cell.querySelectorAll('.col-resize-handle, .row-resize-handle, .a4-fill-handle, .tbl-filter-btn'));
    handles.forEach(h => h.remove());

    const initialText = (opts && opts.replaceWith !== undefined) ? String(opts.replaceWith) : origText;
    if (initialText.includes('\n')) {
      cell.innerHTML = escapeHtmlBr(initialText);
    } else {
      cell.textContent = initialText;
    }
    cell.contentEditable = 'true';
    cell.classList.add('a4-cell-editing');
    cell.focus();

    const fxInput = document.getElementById('fxCellInput');
    if (fxInput) fxInput.value = initialText;

    // İmleci metnin sonuna koy
    try {
      const range = document.createRange();
      range.selectNodeContents(cell);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (_) {}

    let canceled = false;
    let postNav = null; // { dRow, dCol, wrap }

    const onInput = () => {
      if (fxInput) fxInput.value = getCellEditableText(cell);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Enter' && (e.shiftKey || e.altKey)) {
        // Excel (Alt+Enter) & Word (Shift+Enter) hücre içi yeni satır
        e.preventDefault();
        e.stopPropagation();
        try {
          document.execCommand('insertLineBreak');
        } catch (_) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const r = sel.getRangeAt(0);
            const br = document.createElement('br');
            r.deleteContents();
            r.insertNode(br);
            r.setStartAfter(br);
            r.collapse(true);
            sel.removeAllRanges();
            sel.addRange(r);
          }
        }
        if (fxInput) fxInput.value = getCellEditableText(cell);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        postNav = { dRow: 1, dCol: 0, wrap: false };
        cell.blur();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        postNav = { dRow: 0, dCol: e.shiftKey ? -1 : 1, wrap: true };
        cell.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        canceled = true;
        cell.innerHTML = origHtml;
        cell.blur();
      }
    };

    const onBlur = () => {
      cell.removeEventListener('input', onInput);
      cell.removeEventListener('keydown', onKeyDown);
      cell.removeEventListener('blur', onBlur);
      cell.contentEditable = 'false';
      cell.classList.remove('a4-cell-editing');

      const finalText = getCellEditableText(cell);
      if (!canceled && finalText !== origText) {
        pushUndoSnapshot();
        applyCellTextToModel(key, finalText, cell);
        renderAll();
      } else {
        // Değişiklik yoksa veya iptal edildiyse orijinal HTML'i (<br>, madde düzeni vb.) bozulmadan koru
        cell.innerHTML = origHtml;
        syncCellStyleRibbon();
      }
      if (!canceled && postNav) {
        moveCellSelection(postNav.dRow, postNav.dCol, postNav.wrap);
      }
    };

    cell.addEventListener('input', onInput);
    cell.addEventListener('keydown', onKeyDown);
    cell.addEventListener('blur', onBlur);
  }

  // --- WORD / EXCEL PARAGRAF, MADDE İŞARETLERİ, NUMARALI LİSTE & GİRİNTİ ---
  window.toggleCellListFormat = function (kind) {
    const key = StudioState.selectedCellKey;
    if (!key) return showToast('Önce A4 üzerinde bir hücre seçin');
    const cell = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    if (!cell || !isCellTextEditable(cell)) {
      return showToast('Bu hücre metin düzenlemeye uygun değil');
    }

    const origText = getCellEditableText(cell);
    const rawLines = origText ? origText.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];
    const lines = rawLines.length > 0 ? rawLines : ['Yeni madde'];
    const stripPrefix = (l) => l.replace(/^([•●▪◦\-*]|\d+[.)])\s+/, '').trim();

    let newLines;
    let toastMsg = '';
    if (kind === 'bullet') {
      const alreadyBulleted = lines.every(l => /^[•●▪◦\-*]\s+/.test(l));
      if (alreadyBulleted) {
        newLines = lines.map(stripPrefix);
        toastMsg = 'Madde işaretleri kaldırıldı';
      } else {
        newLines = lines.map(l => `• ${stripPrefix(l)}`);
        toastMsg = 'Madde işaretli liste (•) uygulandı';
      }
    } else {
      const alreadyNumbered = lines.every(l => /^\d+[.)]\s+/.test(l));
      if (alreadyNumbered) {
        newLines = lines.map(stripPrefix);
        toastMsg = 'Numaralandırma kaldırıldı';
      } else {
        newLines = lines.map((l, idx) => `${idx + 1}. ${stripPrefix(l)}`);
        toastMsg = 'Numaralı liste (1. 2. 3.) uygulandı';
      }
    }

    pushUndoSnapshot();
    applyCellTextToModel(key, newLines.join('\n'), cell);
    renderAll();
    showToast(toastMsg);
  };

  window.appendCellListItem = function () {
    const key = StudioState.selectedCellKey;
    if (!key) return showToast('Önce madde eklenecek hücreyi seçin');
    const cell = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    if (!cell || !isCellTextEditable(cell)) {
      return showToast('Bu hücreye madde eklenemez');
    }

    const origText = getCellEditableText(cell);
    const lines = origText ? origText.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];
    let nextText = '';
    if (lines.length === 0) {
      nextText = '•\u00a0';
    } else if (lines.every(l => /^\d+[.)]\s+/.test(l))) {
      nextText = `${lines.join('\n')}\n${lines.length + 1}.\u00a0`;
    } else if (lines.every(l => /^[•●▪◦\-*]\s+/.test(l))) {
      nextText = `${lines.join('\n')}\n•\u00a0`;
    } else {
      nextText = `${lines.map(l => `• ${l.replace(/^([•●▪◦\-*]|\d+[.)])\s+/, '')}`).join('\n')}\n•\u00a0`;
    }

    startInlineCellEdit(cell, key, { replaceWith: nextText });
  };

  window.adjustCellIndent = function (deltaPx) {
    const key = StudioState.selectedCellKey;
    if (!key) return showToast('Önce A4 üzerinde bir hücre seçin');
    ensureStyleDefaults(StudioState.schema);
    const cur = Number(StudioState.schema.cellStyles[key]?.padLeft ?? 4);
    const next = Math.max(0, Math.min(48, cur + Number(deltaPx || 0)));
    applyCellStyleProp('padLeft', next === 4 ? '' : next);
  };

  window.toggleFormulaBarExpand = function (force) {
    const bar = document.getElementById('formulaBar');
    if (!bar) return;
    if (typeof force === 'boolean') bar.classList.toggle('expanded', force);
    else bar.classList.toggle('expanded');
  };

  function clearFormatPainter() {
    StudioState.formatPainterStyle = null;
    document.getElementById('liveA4Canvas')?.classList.remove('painter-cursor');
    syncRibbonInputsFromState();
  }

  window.toggleFormatPainter = function () {
    if (StudioState.formatPainterStyle) {
      clearFormatPainter();
      showToast('Biçim Boyacısı kapatıldı');
      return;
    }
    const key = StudioState.selectedCellKey;
    if (!key) {
      showToast('Önce biçimini kopyalayacağınız bir hücreye tıklayın');
      return;
    }
    ensureStyleDefaults(StudioState.schema);
    const src = StudioState.schema.cellStyles[key] || {};
    StudioState.formatPainterStyle = Object.assign({}, src);
    document.getElementById('liveA4Canvas')?.classList.add('painter-cursor');
    syncRibbonInputsFromState();
    showToast('Biçim kopyalandı — uygulamak istediğiniz hedef hücreye tıklayın');
  };

  window.stepSelectedCellFontSize = function (delta) {
    const keys = getSelectedCellKeys();
    if (keys.length === 0) return showToast('Önce A4 üzerinde bir hücre seçin');
    ensureStyleDefaults(StudioState.schema);
    const cur = Number(StudioState.schema.cellStyles[keys[0]]?.fontSize || StudioState.schema.layoutStyles.tableFontSize || 7.2);
    const next = Math.max(5, Math.min(24, Math.round((cur + delta) * 10) / 10));
    applyCellStyleProp('fontSize', next);
  };

  window.applyCellStyleProp = function (prop, val, isCommit) {
    const keys = getSelectedCellKeys();
    if (keys.length === 0) return showToast('Önce A4 üzerinde bir hücre seçin');
    ensureStyleDefaults(StudioState.schema);
    let finalVal = val;
    if (prop === 'fontSize' || prop === 'minHeight' || prop === 'padY' || prop === 'padLeft' || prop === 'lineHeight') {
      const p = parseDecimalValue(val);
      if (p.state === 'typing') return;
      if (p.state === 'invalid') return;
      if (p.state === 'empty') {
        finalVal = '';
      } else {
        if (prop === 'fontSize') {
          if (p.num < 4 && !isCommit) return; // Kullanıcı "1" yazıp "12" veya "10.5" yazmaya devam ederken kesme!
          finalVal = Math.max(4, Math.min(48, Math.round(p.num * 100) / 100));
        } else if (prop === 'minHeight') {
          if (p.num < 10 && !isCommit) return;
          finalVal = Math.max(10, Math.min(300, Math.round(p.num * 10) / 10));
        } else if (prop === 'padY' || prop === 'padLeft') {
          finalVal = Math.max(0, Math.min(60, Math.round(p.num * 10) / 10));
        } else {
          finalVal = Math.max(0.8, Math.min(3, Math.round(p.num * 100) / 100));
        }
      }
    }
    pushUndoSnapshot();
    keys.forEach(key => {
      if (!StudioState.schema.cellStyles[key]) StudioState.schema.cellStyles[key] = {};
      if (finalVal === '' || finalVal === null || finalVal === undefined) {
        delete StudioState.schema.cellStyles[key][prop];
      } else {
        StudioState.schema.cellStyles[key][prop] = finalVal;
      }
    });
    renderLiveA4();
    syncCellStyleRibbon();
  };

  window.toggleCellStyleBool = function (prop) {
    const keys = getSelectedCellKeys();
    if (keys.length === 0) return showToast('Önce A4 üzerinde bir hücre seçin');
    ensureStyleDefaults(StudioState.schema);
    pushUndoSnapshot();
    const nextVal = !StudioState.schema.cellStyles[keys[0]]?.[prop];
    keys.forEach(key => {
      if (!StudioState.schema.cellStyles[key]) StudioState.schema.cellStyles[key] = {};
      StudioState.schema.cellStyles[key][prop] = nextVal;
    });
    renderLiveA4();
    syncCellStyleRibbon();
  };

  window.copySelectedCellStyleToRow = function () {
    const key = StudioState.selectedCellKey;
    if (!key) return showToast('Önce bir hücre seçin');
    ensureStyleDefaults(StudioState.schema);
    const st = StudioState.schema.cellStyles[key];
    if (!st || Object.keys(st).length === 0) return showToast('Bu hücrede kopyalanacak özel stil yok');
    const srcEl = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    const rowKey = srcEl?.dataset?.rowKey;
    if (!rowKey) return;
    pushUndoSnapshot();
    const targets = document.querySelectorAll(`[data-row-key="${CSS.escape(rowKey)}"]`);
    targets.forEach(td => {
      const k = td.dataset.cellKey;
      if (k) StudioState.schema.cellStyles[k] = Object.assign({}, st);
    });
    renderLiveA4();
    showToast(`Stil satırdaki ${targets.length} hücreye uygulandı`);
  };

  window.copySelectedCellStyleToCol = function () {
    const key = StudioState.selectedCellKey;
    if (!key) return showToast('Önce bir hücre seçin');
    ensureStyleDefaults(StudioState.schema);
    const st = StudioState.schema.cellStyles[key];
    if (!st || Object.keys(st).length === 0) return showToast('Bu hücrede kopyalanacak özel stil yok');
    const srcEl = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
    const colKey = srcEl?.dataset?.colKey;
    if (!colKey) return;
    pushUndoSnapshot();
    const targets = document.querySelectorAll(`[data-col-key="${CSS.escape(colKey)}"]`);
    targets.forEach(td => {
      const k = td.dataset.cellKey;
      if (k) StudioState.schema.cellStyles[k] = Object.assign({}, st);
    });
    renderLiveA4();
    showToast(`Stil sütundaki ${targets.length} hücreye uygulandı`);
  };

  window.clearSelectedCellStyle = function () {
    const keys = getSelectedCellKeys();
    if (keys.length === 0) return showToast('Önce bir hücre seçin');
    ensureStyleDefaults(StudioState.schema);
    pushUndoSnapshot();
    keys.forEach(k => delete StudioState.schema.cellStyles[k]);
    renderLiveA4();
    syncCellStyleRibbon();
    showToast(keys.length > 1 ? `${keys.length} hücrenin biçimi sıfırlandı` : 'Hücre stili sıfırlandı');
  };

  // Visual Checklist Group helpers (5.2 - 5.8 alt tablolar & A,B,C... satırları)
  window.addVisualTopic = function () {
    pushUndoSnapshot();
    const sec = getSelectedSection();
    sec.topics.push({
      id: uid('vt'),
      title: `5.${sec.topics.length + 2}. YENİ KONTROL GRUBU`,
      items: [{ id: uid('i'), text: 'Yeni kontrol kriteri', sym: '✓' }]
    });
    renderAll();
  };
  window.updateVisualTopicTitle = function (tIdx, val) {
    getSelectedSection().topics[tIdx].title = val;
    renderLiveA4();
  };
  window.removeVisualTopic = function (tIdx) {
    pushUndoSnapshot();
    getSelectedSection().topics.splice(tIdx, 1);
    renderAll();
  };
  window.addVisualTopicItem = function (tIdx) {
    pushUndoSnapshot();
    getSelectedSection().topics[tIdx].items.push({ id: uid('i'), text: 'Yeni soru / kriter', sym: '✓' });
    renderAll();
  };
  window.updateVisualTopicItem = function (tIdx, iIdx, prop, val) {
    getSelectedSection().topics[tIdx].items[iIdx][prop] = val;
    renderLiveA4();
    if (prop === 'sym') renderLeftPanel();
  };
  window.removeVisualTopicItem = function (tIdx, iIdx) {
    pushUndoSnapshot();
    getSelectedSection().topics[tIdx].items.splice(iIdx, 1);
    renderAll();
  };

  // --------------------------------------------------------------------------
  // 5. SOL PANEL RENDER (BÖLÜMLER AĞACI / SEÇİLİ BÖLÜM EDİTÖRÜ / TEMA / ŞABLONLAR)
  // --------------------------------------------------------------------------
  function getSectionDisplayName(sec) {
    return sec.title || sec.sectionTitle || sec.subTitle || 'Adsız Bölüm';
  }

  function getSectionTypeLabel(type) {
    return {
      company_info: 'Firma Bilgileri',
      detail_21: '2.1 Detay + Radyo',
      detail_22: '2.2 Tespit + Koruma',
      data_table: 'Sütun/Satır Tablo',
      visual_checklist_group: 'Gözle Kontrol (✓/X)',
      func_matrix: 'Pano Matrisi',
      notes_box: 'Kusur / Not Kutusu',
      conclusion_box: 'Sonuç & Ağır Kusur',
      approval_box: 'Yetkili & E-İmza/QR',
      chart_block: 'Grafik (Excel)',
      image_block: 'Fotoğraf / Görsel',
      callout_block: 'Uyarı / Şekil Kutusu',
      signature_block: 'İmza & Onay Satırı'
    }[type] || type;
  }

  const SVG_ICONS = {
    eye: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>',
    up: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>',
    down: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    trash: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    chevDown: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    edit: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
  };

  function renderNavPane() {
    const body = document.getElementById('navOutlineBody');
    const s = StudioState.schema;
    if (!body || !s) return;

    body.innerHTML = `
      <div class="st-outline-list">
        ${s.sections.map((sec, idx) => {
          const subMeta = sec.type === 'data_table'
            ? `${sec.columns.length} sütun · ${sec.rows.length} satır`
            : (sec.type === 'visual_checklist_group' ? `${sec.topics.length} kontrol grubu` : getSectionTypeLabel(sec.type));
          return `
            <div class="st-outline-row ${sec.id === StudioState.selectedSectionId ? 'selected' : ''} ${sec.visible === false ? 'hidden-sec' : ''}"
                 onclick="selectSection('${escapeHtml(sec.id)}', { scrollToA4: true })"
                 ondblclick="selectSection('${escapeHtml(sec.id)}', { scrollToA4: true, openDetail: true })">
              <span class="st-outline-num">${idx + 1}</span>
              <div class="st-outline-info">
                <div class="st-outline-title">${escapeHtml(getSectionDisplayName(sec))}</div>
                <div class="st-outline-meta">${escapeHtml(subMeta)}</div>
              </div>
              <div class="st-outline-actions">
                <button type="button" class="st-mini-icon-btn" onclick="event.stopPropagation(); selectSection('${escapeHtml(sec.id)}', { scrollToA4: true, openDetail: true });" title="Bölüm Özelliklerini Aç">${SVG_ICONS.edit}</button>
                <button type="button" class="st-mini-icon-btn" onclick="toggleSectionVisible(${idx}, event)" title="${sec.visible === false ? 'Göster' : 'Gizle'}">${sec.visible === false ? SVG_ICONS.eyeOff : SVG_ICONS.eye}</button>
                <button type="button" class="st-mini-icon-btn" onclick="moveSection(${idx}, -1, event)" title="Yukarı Taşı">${SVG_ICONS.up}</button>
                <button type="button" class="st-mini-icon-btn" onclick="moveSection(${idx}, 1, event)" title="Aşağı Taşı">${SVG_ICONS.down}</button>
                <button type="button" class="st-mini-icon-btn danger" onclick="deleteSection(${idx}, event)" title="Bölümü Sil">${SVG_ICONS.trash}</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderDetailPane() {
    const body = document.getElementById('studioEditorBody');
    if (!body || !StudioState.showDetailPane || !StudioState.schema) return;
    const sec = getSelectedSection();
    if (!sec) return;
    body.innerHTML = renderSectionInspector(sec);
  }

  function renderLeftPanel() {
    renderNavPane();
    renderDetailPane();
  }

  function renderSectionStyleCard(sec) {
    const st = sec.style || {};
    const mt = st.marginTop != null ? st.marginTop : 0;
    const mb = st.marginBottom != null ? st.marginBottom : 0;
    const py = st.padY != null ? st.padY : 0;
    const px = st.padX != null ? st.padX : 0;
    const rh = st.rowMinHeight != null ? st.rowMinHeight : 0;
    const fs = st.fontSize != null ? st.fontSize : 0;
    const hasCustom = Object.keys(st).length > 0;
    return `
      <details class="st-accordion" ${hasCustom ? 'open' : ''}>
        <summary>
          <span>Bölüm Boşluğu &amp; Hücre Boyutu ${hasCustom ? '<span style="color:#0284c7;">●</span>' : ''}</span>
          ${SVG_ICONS.chevDown}
        </summary>
        <div class="st-accordion-body">
          <div class="st-slider-row">
            <label>Üst Boşluk</label>
            <input type="range" min="0" max="44" step="1" value="${mt}" oninput="updateSecStyle('marginTop', this.value, true)">
            <span id="secStVal_marginTop" data-unit="px" class="st-slider-val">${mt}px</span>
          </div>
          <div class="st-slider-row">
            <label>Alt Boşluk</label>
            <input type="range" min="0" max="44" step="1" value="${mb}" oninput="updateSecStyle('marginBottom', this.value, true)">
            <span id="secStVal_marginBottom" data-unit="px" class="st-slider-val">${mb}px</span>
          </div>
          <div class="st-slider-row">
            <label>Dikey Dolgu</label>
            <input type="range" min="0" max="14" step="0.5" value="${py}" oninput="updateSecStyle('padY', Number(this.value) ? this.value : '', true)">
            <span id="secStVal_padY" data-unit="px" class="st-slider-val">${py ? py + 'px' : 'Oto'}</span>
          </div>
          <div class="st-slider-row">
            <label>Yatay Dolgu</label>
            <input type="range" min="0" max="14" step="0.5" value="${px}" oninput="updateSecStyle('padX', Number(this.value) ? this.value : '', true)">
            <span id="secStVal_padX" data-unit="px" class="st-slider-val">${px ? px + 'px' : 'Oto'}</span>
          </div>
          <div class="st-slider-row">
            <label>Satır Yüksekliği</label>
            <input type="range" min="0" max="70" step="2" value="${rh}" oninput="updateSecStyle('rowMinHeight', Number(this.value) ? this.value : '', true)">
            <span id="secStVal_rowMinHeight" data-unit="px" class="st-slider-val">${rh ? rh + 'px' : 'Oto'}</span>
          </div>
          <div class="st-slider-row">
            <label>Yazı Boyutu</label>
            <input type="range" min="0" max="11" step="0.5" value="${fs}" oninput="updateSecStyle('fontSize', Number(this.value) >= 5 ? this.value : '', true)">
            <span id="secStVal_fontSize" data-unit="pt" class="st-slider-val">${fs >= 5 ? fs + 'pt' : 'Oto'}</span>
          </div>

          <div class="st-grid-3" style="margin-top:8px;">
            <div>
              <label class="st-label">Başlık</label>
              <input type="color" class="st-input" style="height:28px;padding:2px;" value="${escapeHtml(st.titleColor || '#1f3a5f')}" oninput="updateSecStyle('titleColor', this.value, false)">
            </div>
            <div>
              <label class="st-label">TH Zemin</label>
              <input type="color" class="st-input" style="height:28px;padding:2px;" value="${escapeHtml(st.thBg || '#f1f5f9')}" oninput="updateSecStyle('thBg', this.value, false)">
            </div>
            <div>
              <label class="st-label">Çerçeve</label>
              <input type="color" class="st-input" style="height:28px;padding:2px;" value="${escapeHtml(st.borderColor || '#cbd5e1')}" oninput="updateSecStyle('borderColor', this.value, false)">
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:9px; gap:8px;">
            <label style="font-size:11.5px; font-weight:600; display:flex; align-items:center; gap:5px; color:#334155;">
              <input type="checkbox" ${st.forceBreak ? 'checked' : ''} onchange="updateSecStyle('forceBreak', this.checked, false)"> Yeni Sayfadan Başlat
            </label>
            <button type="button" class="st-btn st-btn-outline st-btn-xs" onclick="resetSecStyle()">Sıfırla</button>
          </div>
        </div>
      </details>
    `;
  }

  function renderSectionInspector(sec) {
    const headerBar = `
      <div class="inspector-context-bar">
        <div style="min-width:0;">
          <div style="font-size:10px; color:#0284c7; font-weight:700; text-transform:uppercase; letter-spacing:0.04em;">${getSectionTypeLabel(sec.type)}</div>
          <div style="font-size:12.5px; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(getSectionDisplayName(sec))}</div>
        </div>
        <button type="button" class="st-btn st-btn-outline st-btn-xs" onclick="toggleDetailPane(false)">Kapat</button>
      </div>
    ` + renderSectionStyleCard(sec);

    // 1. COMPANY INFO INSPECTOR
    if (sec.type === 'company_info') {
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header">
            <h3 class="st-card-title">Bölüm Başlığı &amp; Firma Hücreleri</h3>
            <button type="button" class="st-btn st-btn-primary st-btn-xs" onclick="addCompanyRow()">+ Satır Ekle</button>
          </div>
          <div class="st-field">
            <label class="st-label">Başlık</label>
            <input class="st-input" value="${escapeHtml(sec.title)}" oninput="updateSecProp('title', this.value)">
          </div>
          ${sec.rows.map((r, rIdx) => `
            <div class="st-item-row">
              <div class="st-item-top">
                <span class="st-item-num">Satır #${rIdx + 1}</span>
                <div style="display:flex; gap:5px; align-items:center;">
                  <select class="st-select" style="width:auto; padding:2px 6px; font-size:10.5px;" onchange="updateCompanyRow(${rIdx}, 'layout', this.value)">
                    <option value="full" ${r.layout === 'full' ? 'selected' : ''}>Tek Geniş Hücre</option>
                    <option value="pair" ${r.layout !== 'full' ? 'selected' : ''}>2'li Yan Yana Hücre</option>
                  </select>
                  <button type="button" class="st-btn st-btn-danger-soft st-btn-icon" onclick="removeCompanyRow(${rIdx})">✕</button>
                </div>
              </div>
              <div class="st-grid-2">
                <input class="st-input" placeholder="Sol Etiket" value="${escapeHtml(r.label1 || '')}" oninput="updateCompanyRow(${rIdx}, 'label1', this.value)">
                <input class="st-input" placeholder="Sol Değer" value="${escapeHtml(r.val1 || '')}" oninput="updateCompanyRow(${rIdx}, 'val1', this.value)">
              </div>
              ${r.layout !== 'full' ? `
                <div class="st-grid-2" style="margin-top:5px;">
                  <input class="st-input" placeholder="Sağ Etiket" value="${escapeHtml(r.label2 || '')}" oninput="updateCompanyRow(${rIdx}, 'label2', this.value)">
                  <input class="st-input" placeholder="Sağ Değer" value="${escapeHtml(r.val2 || '')}" oninput="updateCompanyRow(${rIdx}, 'val2', this.value)">
                </div>
              ` : ''}
            </div>
          `).join('')}

          <div class="st-field" style="margin-top:8px;">
            <label class="st-label">Kapsam Satırı Başlığı</label>
            <input class="st-input" value="${escapeHtml(sec.scopeLabel || '')}" oninput="updateSecProp('scopeLabel', this.value)">
          </div>
          <div class="st-field">
            <label class="st-label">Standart &amp; Yönetmelik Maddeleri (Her satıra 1 madde)</label>
            <textarea class="st-textarea" rows="5" oninput="updateCompanyScope(this.value)">${escapeHtml((sec.scopeLines || []).join('\n'))}</textarea>
          </div>
        </div>
      `;
    }

    // 2. DETAIL 2.1 INSPECTOR
    if (sec.type === 'detail_21') {
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header">
            <h3 class="st-card-title">2.1 Detay Bilgiler Hücreleri (${sec.fields.length} Alan)</h3>
            <button type="button" class="st-btn st-btn-primary st-btn-xs" onclick="addDetail21Field()">+ Alan Ekle</button>
          </div>
          <div class="st-grid-2">
            <div class="st-field">
              <label class="st-label">Ana Bölüm Başlığı</label>
              <input class="st-input" value="${escapeHtml(sec.sectionTitle || '')}" oninput="updateSecProp('sectionTitle', this.value)">
            </div>
            <div class="st-field">
              <label class="st-label">Alt Şerit Başlığı</label>
              <input class="st-input" value="${escapeHtml(sec.subTitle || '')}" oninput="updateSecProp('subTitle', this.value)">
            </div>
          </div>
          ${sec.fields.map((f, idx) => `
            <div class="st-item-row">
              <div class="st-item-top">
                <span class="st-item-num">#${idx + 1} · ${f.type === 'radio' ? 'Radyo Seçim' : (f.type === 'phase_group' ? 'AA/DA Faz Bloğu' : 'Metin Hücresi')}</span>
                <div style="display:flex; gap:4px;">
                  <select class="st-select" style="width:auto; padding:2px 6px; font-size:10.5px;" onchange="updateDetail21Field(${idx}, 'type', this.value)">
                    <option value="text" ${f.type === 'text' ? 'selected' : ''}>Metin</option>
                    <option value="radio" ${f.type === 'radio' ? 'selected' : ''}>Radyo (● / ○)</option>
                    <option value="phase_group" ${f.type === 'phase_group' ? 'selected' : ''}>AA/DA Faz</option>
                  </select>
                  ${idx >= 24 ? `<button type="button" class="st-btn st-btn-danger-soft st-btn-icon" onclick="removeDetail21Field(${idx})">✕</button>` : ''}
                </div>
              </div>
              <div class="st-grid-2">
                <input class="st-input" value="${escapeHtml(f.label)}" oninput="updateDetail21Field(${idx}, 'label', this.value)" placeholder="Etiket">
                <input class="st-input" value="${escapeHtml(f.value || '')}" oninput="updateDetail21Field(${idx}, 'value', this.value)" placeholder="Seçili Değer">
              </div>
              ${f.type === 'radio' ? `
                <div style="margin-top:5px;">
                  <label class="st-label">Radyo Seçenekleri (virgülle ayırın)</label>
                  <input class="st-input" value="${escapeHtml((f.options || []).join(', '))}" oninput="updateDetail21Field(${idx}, 'optionsText', this.value)">
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    // 3. DETAIL 2.2 INSPECTOR
    if (sec.type === 'detail_22') {
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header">
            <h3 class="st-card-title">2.2 Tespit Edilen Bilgiler &amp; Koruma Önlemleri</h3>
            <button type="button" class="st-btn st-btn-primary st-btn-xs" onclick="addDetail22Prot()">+ Önlem Ekle</button>
          </div>
          <div class="st-field">
            <label class="st-label">Alt Şerit Başlığı</label>
            <input class="st-input" value="${escapeHtml(sec.subTitle || '')}" oninput="updateSecProp('subTitle', this.value)">
          </div>
          ${sec.topQuestions.map((q, idx) => `
            <div class="st-item-row">
              <div class="st-grid-2">
                <input class="st-input" value="${escapeHtml(q.label)}" oninput="updateDetail22Item('top', ${idx}, 'label', this.value)">
                <select class="st-select" onchange="updateDetail22Item('top', ${idx}, 'value', this.value)">
                  ${(q.options || ['Var', 'Yok']).map(o => `<option value="${o}" ${q.value === o ? 'selected' : ''}>${o}</option>`).join('')}
                </select>
              </div>
            </div>
          `).join('')}

          <div class="st-label" style="margin:8px 0 4px 0;">Doğrudan Dokunmaya Karşı Koruma Önlemleri (● / ○)</div>
          ${sec.protectionItems.map((p, idx) => `
            <div class="st-item-row">
              <div style="display:flex; gap:5px; align-items:center;">
                <input class="st-input" style="flex:1;" value="${escapeHtml(p.label)}" oninput="updateDetail22Item('prot', ${idx}, 'label', this.value)">
                <select class="st-select" style="width:74px;" onchange="updateDetail22Item('prot', ${idx}, 'value', this.value)">
                  <option value="Var" ${p.value === 'Var' ? 'selected' : ''}>● Var</option>
                  <option value="Yok" ${p.value === 'Yok' ? 'selected' : ''}>○ Yok</option>
                </select>
                <button type="button" class="st-btn st-btn-danger-soft st-btn-icon" onclick="removeDetail22Prot(${idx})">✕</button>
              </div>
            </div>
          `).join('')}

          <div class="st-item-row" style="margin-top:8px;">
            <div class="st-grid-2">
              <input class="st-input" value="${escapeHtml(sec.bottomQuestion.label)}" oninput="updateDetail22Item('bottom', 0, 'label', this.value)">
              <select class="st-select" onchange="updateDetail22Item('bottom', 0, 'value', this.value)">
                <option value="Var" ${sec.bottomQuestion.value === 'Var' ? 'selected' : ''}>● Var</option>
                <option value="Yok" ${sec.bottomQuestion.value === 'Yok' ? 'selected' : ''}>○ Yok</option>
              </select>
            </div>
          </div>
        </div>
      `;
    }

    // 4. DATA TABLE INSPECTOR (SÜTUNLAR + GRUPLU ÜST BAŞLIK + SATIR/HÜCRE EDİTÖRÜ)
    if (sec.type === 'data_table') {
      const totalW = (sec.showNoCol ? Number(sec.noColWidth || 4) : 0) + sec.columns.reduce((a, c) => a + Number(c.width || 0), 0);
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header">
            <div>
              <h3 class="st-card-title">Tablo Başlıkları &amp; Sütunlar (${sec.columns.length})</h3>
              <div class="st-card-sub">Toplam Genişlik: <strong style="color:${Math.abs(totalW - 100) <= 1 ? '#059669' : '#d97706'};">%${totalW.toFixed(1)}</strong> · Aynı "Üst Grup" adını yazan yan yana sütunlar RAMS'ta birleşir!</div>
            </div>
            <button type="button" class="st-btn st-btn-primary st-btn-xs" onclick="addDataTableCol()">+ Sütun</button>
          </div>
          <div class="st-grid-2">
            <div class="st-field">
              <label class="st-label">Ana Bölüm Başlığı (Opsiyonel)</label>
              <input class="st-input" value="${escapeHtml(sec.title || '')}" oninput="updateSecProp('title', this.value)">
            </div>
            <div class="st-field">
              <label class="st-label">Gri Alt Şerit Başlığı</label>
              <input class="st-input" value="${escapeHtml(sec.subTitle || '')}" oninput="updateSecProp('subTitle', this.value)">
            </div>
          </div>
          <div style="display:flex; gap:10px; margin-bottom:8px; flex-wrap:wrap;">
            <label style="font-size:11px; font-weight:700; display:flex; align-items:center; gap:4px;">
              <input type="checkbox" ${sec.showNoCol ? 'checked' : ''} onchange="updateSecProp('showNoCol', this.checked)"> "No" Sütunu
            </label>
            <label style="font-size:11px; font-weight:700; display:flex; align-items:center; gap:4px;">
              <input type="checkbox" ${sec.showLegend ? 'checked' : ''} onchange="updateSecProp('showLegend', this.checked)"> ✓/X/N/G Açıklaması
            </label>
            <label style="font-size:11px; font-weight:700; display:flex; align-items:center; gap:4px;">
              <input type="checkbox" ${sec.forceBreakInRams ? 'checked' : ''} onchange="updateSecProp('forceBreakInRams', this.checked)"> Yeni Sayfadan Başlat
            </label>
          </div>

          ${sec.columns.map((col, cIdx) => `
            <div class="st-item-row">
              <div class="st-item-top">
                <span class="st-item-num">Sütun #${cIdx + 1}</span>
                <div style="display:flex; gap:3px;">
                  <button type="button" class="st-btn st-btn-light st-btn-icon" onclick="moveDataTableCol(${cIdx}, -1)" title="Sola">←</button>
                  <button type="button" class="st-btn st-btn-light st-btn-icon" onclick="moveDataTableCol(${cIdx}, 1)" title="Sağa">→</button>
                  <button type="button" class="st-btn st-btn-danger-soft st-btn-icon" onclick="removeDataTableCol(${cIdx})" title="Sil">✕</button>
                </div>
              </div>
              <div class="st-grid-2">
                <div>
                  <label class="st-label">Sütun Başlığı</label>
                  <input class="st-input" value="${escapeHtml(col.label)}" oninput="updateDataTableCol(${cIdx}, 'label', this.value)">
                </div>
                <div>
                  <label class="st-label">Üst Grup Başlığı (colspan)</label>
                  <input class="st-input" placeholder="Boş = Tek Katlı" value="${escapeHtml(col.group || '')}" oninput="updateDataTableCol(${cIdx}, 'group', this.value)">
                </div>
              </div>
              <div class="st-grid-3" style="margin-top:5px;">
                <div>
                  <label class="st-label">Genişlik (%)</label>
                  <input type="number" step="0.5" min="3" max="80" class="st-input" value="${Number(col.width || 10)}" oninput="updateDataTableCol(${cIdx}, 'width', this.value)">
                </div>
                <div>
                  <label class="st-label">Hücre Tipi</label>
                  <select class="st-select" onchange="updateDataTableCol(${cIdx}, 'type', this.value)">
                    <option value="text" ${col.type === 'text' ? 'selected' : ''}>Metin / Sayı</option>
                    <option value="symbol" ${col.type === 'symbol' ? 'selected' : ''}>İşaret (✓/X/N/G)</option>
                  </select>
                </div>
                <div>
                  <label class="st-label">Hizalama</label>
                  <select class="st-select" onchange="updateDataTableCol(${cIdx}, 'align', this.value)">
                    <option value="left" ${col.align === 'left' ? 'selected' : ''}>Sol</option>
                    <option value="center" ${col.align === 'center' ? 'selected' : ''}>Orta</option>
                  </select>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="st-card">
          <div class="st-card-header">
            <h3 class="st-card-title">Satırlar &amp; Hücre Verileri (${sec.rows.length} Satır)</h3>
            <button type="button" class="st-btn st-btn-emerald st-btn-xs" onclick="addDataTableRow()">+ Satır Ekle</button>
          </div>
          <div class="st-cell-table-wrap">
            <table class="st-cell-table">
              <thead>
                <tr>
                  <th style="width:24px;">#</th>
                  ${sec.columns.map(c => `<th>${escapeHtml(c.label.slice(0, 18))}</th>`).join('')}
                  <th style="width:48px;" title="Satır Yüksekliği (px)">Yüks.</th>
                  <th style="width:52px;">İşlem</th>
                </tr>
              </thead>
              <tbody>
                ${sec.rows.map((row, rIdx) => `
                  <tr>
                    <td style="text-align:center; font-weight:700;">${rIdx + 1}</td>
                    ${sec.columns.map(c => {
                      const val = row[c.id] == null ? '' : row[c.id];
                      if (c.type === 'symbol') {
                        return `<td><select onchange="updateDataTableCell(${rIdx}, '${c.id}', this.value)">
                          <option value="" ${val === '' ? 'selected' : ''}>—</option>
                          <option value="✓" ${val === '✓' ? 'selected' : ''}>✓</option>
                          <option value="X" ${val === 'X' ? 'selected' : ''}>X</option>
                          <option value="N" ${val === 'N' ? 'selected' : ''}>N</option>
                          <option value="G" ${val === 'G' ? 'selected' : ''}>G</option>
                        </select></td>`;
                      }
                      return `<td><input value="${escapeHtml(val)}" oninput="updateDataTableCell(${rIdx}, '${c.id}', this.value)"></td>`;
                    }).join('')}
                    <td><input type="number" min="0" max="140" step="2" style="min-width:42px; text-align:center;" placeholder="oto" value="${row._height || ''}" oninput="updateDataTableRowHeight(${rIdx}, this.value)"></td>
                    <td style="white-space:nowrap;">
                      <button type="button" class="st-btn st-btn-light st-btn-xs" onclick="cloneDataTableRow(${rIdx})" title="Kopyala">⧉</button>
                      <button type="button" class="st-btn st-btn-danger-soft st-btn-xs" onclick="removeDataTableRow(${rIdx})" title="Sil">✕</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // 5. VISUAL CHECKLIST GROUP INSPECTOR (5.1 - 5.8)
    if (sec.type === 'visual_checklist_group') {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header">
            <h3 class="st-card-title">Gözle Kontrol Grupları (${sec.topics.length} Alt Tablo)</h3>
            <button type="button" class="st-btn st-btn-primary st-btn-xs" onclick="addVisualTopic()">+ Alt Grup Ekle</button>
          </div>
          <div class="st-grid-2">
            <div class="st-field">
              <label class="st-label">Üst Başlık</label>
              <input class="st-input" value="${escapeHtml(sec.superTitle || '')}" oninput="updateSecProp('superTitle', this.value)">
            </div>
            <div class="st-field">
              <label class="st-label">Bölüm Başlığı</label>
              <input class="st-input" value="${escapeHtml(sec.title || '')}" oninput="updateSecProp('title', this.value)">
            </div>
          </div>
          <div class="st-grid-2">
            <div class="st-field">
              <label class="st-label">5.1 Pano Etiketi</label>
              <input class="st-input" value="${escapeHtml(sec.panoLabel || '')}" oninput="updateSecProp('panoLabel', this.value)">
            </div>
            <div class="st-field">
              <label class="st-label">5.1 Pano Değeri</label>
              <input class="st-input" value="${escapeHtml(sec.panoValue || '')}" oninput="updateSecProp('panoValue', this.value)">
            </div>
          </div>
        </div>

        ${sec.topics.map((t, tIdx) => `
          <div class="st-card">
            <div class="st-item-top">
              <input class="st-input" style="font-weight:800;" value="${escapeHtml(t.title)}" oninput="updateVisualTopicTitle(${tIdx}, this.value)">
              <button type="button" class="st-btn st-btn-emerald st-btn-xs" onclick="addVisualTopicItem(${tIdx})">+ Madde</button>
              <button type="button" class="st-btn st-btn-danger-soft st-btn-icon" onclick="removeVisualTopic(${tIdx})" title="Grubu Sil">✕</button>
            </div>
            ${t.items.map((it, iIdx) => `
              <div style="display:flex; gap:5px; align-items:center; margin-bottom:5px;">
                <span class="st-item-num" style="width:24px; text-align:center;">${letters[iIdx] || (iIdx + 1)}</span>
                <input class="st-input" style="flex:1;" value="${escapeHtml(it.text)}" oninput="updateVisualTopicItem(${tIdx}, ${iIdx}, 'text', this.value)">
                <div class="st-sym-picker">
                  ${['✓', 'X', 'N', 'G'].map(sym => {
                    const act = it.sym === sym ? (sym === '✓' ? 'active-ok' : (sym === 'X' ? 'active-bad' : 'active-neu')) : '';
                    return `<button type="button" class="st-sym-btn ${act}" onclick="updateVisualTopicItem(${tIdx}, ${iIdx}, 'sym', '${sym}')">${sym}</button>`;
                  }).join('')}
                </div>
                <button type="button" class="st-btn st-btn-danger-soft st-btn-icon" onclick="removeVisualTopicItem(${tIdx}, ${iIdx})">✕</button>
              </div>
            `).join('')}
          </div>
        `).join('')}
      `;
    }

    // 6. FUNC MATRIX (6.1 ÜST MATRİS)
    if (sec.type === 'func_matrix') {
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header">
            <h3 class="st-card-title">6. Fonksiyon Kontrolü &amp; Pano Üst Matrisi</h3>
          </div>
          <div class="st-field">
            <label class="st-label">Ana Başlık</label>
            <input class="st-input" value="${escapeHtml(sec.title)}" oninput="updateSecProp('title', this.value)">
          </div>
          <div class="st-field">
            <label class="st-label">Ölçüm Metodu</label>
            <select class="st-select" onchange="updateSecProp('methodValue', this.value)">
              ${sec.methodOptions.map(o => `<option value="${o}" ${sec.methodValue === o ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
          <div class="st-field">
            <label class="st-label">6.1 Alt Başlık</label>
            <input class="st-input" value="${escapeHtml(sec.subTitle)}" oninput="updateSecProp('subTitle', this.value)">
          </div>
          <div class="st-grid-2">
            <div class="st-field"><label class="st-label">Pano Adı</label><input class="st-input" value="${escapeHtml(sec.panoValue)}" oninput="updateSecProp('panoValue', this.value)"></div>
            <div class="st-field"><label class="st-label">DKD Tipi</label>
              <select class="st-select" onchange="updateSecProp('dkdTypeVal', this.value)">
                ${sec.dkdOptions.map(o => `<option value="${o}" ${sec.dkdTypeVal === o ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </div>
            <div class="st-field"><label class="st-label">Zx (Ω)</label><input class="st-input" value="${escapeHtml(sec.zxVal)}" oninput="updateSecProp('zxVal', this.value)"></div>
            <div class="st-field"><label class="st-label">Gerilim F-F (V)</label><input class="st-input" value="${escapeHtml(sec.ffVal)}" oninput="updateSecProp('ffVal', this.value)"></div>
            <div class="st-field"><label class="st-label">ZLN (Ω)</label><input class="st-input" value="${escapeHtml(sec.zlnVal)}" oninput="updateSecProp('zlnVal', this.value)"></div>
            <div class="st-field"><label class="st-label">Gerilim L-N (V)</label><input class="st-input" value="${escapeHtml(sec.lnVal)}" oninput="updateSecProp('lnVal', this.value)"></div>
            <div class="st-field"><label class="st-label">3 Faz Kısa Devre (kA)</label><input class="st-input" value="${escapeHtml(sec.ik3Val)}" oninput="updateSecProp('ik3Val', this.value)"></div>
            <div class="st-field"><label class="st-label">Gerilim N-PE (V)</label><input class="st-input" value="${escapeHtml(sec.npeVal)}" oninput="updateSecProp('npeVal', this.value)"></div>
          </div>
        </div>
      `;
    }

    // 7. NOTES / DEFECTS / PHOTOS BOX
    if (sec.type === 'notes_box') {
      return headerBar + `
        <div class="st-card">
          <div class="st-field">
            <label class="st-label">Bölüm Başlığı</label>
            <input class="st-input" value="${escapeHtml(sec.title)}" oninput="updateSecProp('title', this.value)">
          </div>
          <div class="st-field">
            <label class="st-label">Kutu İçeriği</label>
            <textarea class="st-textarea" rows="4" oninput="updateSecProp('content', this.value)">${escapeHtml(sec.content || '')}</textarea>
          </div>
          <div class="st-field">
            <label class="st-label">Alt Bilgi Şeridi (Opsiyonel)</label>
            <textarea class="st-textarea" rows="2" oninput="updateSecProp('bottomNote', this.value)">${escapeHtml(sec.bottomNote || '')}</textarea>
          </div>
        </div>
      `;
    }

    // 8. CONCLUSION BOX (10. SONUÇ VE KANAAT)
    if (sec.type === 'conclusion_box') {
      return headerBar + `
        <div class="st-card">
          <div class="st-field">
            <label class="st-label">Bölüm Başlığı</label>
            <input class="st-input" value="${escapeHtml(sec.title)}" oninput="updateSecProp('title', this.value)">
          </div>
          <div class="st-field">
            <label class="st-label">Genel Sonuç Durumu</label>
            <select class="st-select" onchange="updateSecProp('overallResult', this.value)">
              <option value="UYGUN" ${sec.overallResult !== 'UYGUN DEĞİL' ? 'selected' : ''}>✓ KULLANILMASI UYGUNDUR</option>
              <option value="UYGUN DEĞİL" ${sec.overallResult === 'UYGUN DEĞİL' ? 'selected' : ''}>✗ KULLANILMASI UYGUN DEĞİLDİR (C1)</option>
            </select>
          </div>
          <div class="st-field">
            <label class="st-label">Karar Giriş Cümlesi</label>
            <textarea class="st-textarea" rows="2" oninput="updateSecProp('leadSentence', this.value)">${escapeHtml(sec.leadSentence || '')}</textarea>
          </div>
          <div class="st-field">
            <label class="st-label">Ağır Kusur Tanımları Metni</label>
            <textarea class="st-textarea" rows="10" oninput="updateSecProp('heavyDefectsText', this.value)">${escapeHtml(sec.heavyDefectsText || '')}</textarea>
          </div>
        </div>
      `;
    }

    // 9. APPROVAL BOX (11. YETKİLİ & ONAY + E-İMZA + QR)
    if (sec.type === 'approval_box') {
      return headerBar + `
        <div class="st-card">
          <div class="st-field">
            <label class="st-label">Bölüm Başlığı</label>
            <input class="st-input" value="${escapeHtml(sec.title)}" oninput="updateSecProp('title', this.value)">
          </div>
          <div class="st-field">
            <label class="st-label">Adı Soyadı / Mesleği</label>
            <input class="st-input" value="${escapeHtml(sec.inspectorName)}" oninput="updateSecProp('inspectorName', this.value)">
          </div>
          <div class="st-grid-2">
            <div class="st-field">
              <label class="st-label">Bakanlık Kayıt No</label>
              <input class="st-input" value="${escapeHtml(sec.ministryNo)}" oninput="updateSecProp('ministryNo', this.value)">
            </div>
            <div class="st-field">
              <label class="st-label">Diploma No / Tarih</label>
              <input class="st-input" value="${escapeHtml(sec.diplomaNo)}" oninput="updateSecProp('diplomaNo', this.value)">
            </div>
          </div>
          <label class="st-toggle-row">
            <span>e-imzalıdır Görselini Göster</span>
            <input type="checkbox" ${sec.showEimza !== false ? 'checked' : ''} onchange="updateSecProp('showEimza', this.checked)">
          </label>
          <label class="st-toggle-row">
            <span>Kare Kod (QR) Göster</span>
            <input type="checkbox" ${sec.showQr !== false ? 'checked' : ''} onchange="updateSecProp('showQr', this.checked)">
          </label>
        </div>
      `;
    }

    // 10. CHART BLOCK INSPECTOR (EXCEL / GRIDCRAFT CHART)
    if (sec.type === 'chart_block') {
      const itemsText = (sec.dataPoints || []).map(p => `${p.label}: ${p.value}`).join('\n');
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header"><h3 class="st-card-title">Grafik Ayarları (Excel)</h3></div>
          <div class="st-field">
            <label class="st-label">Bölüm Başlığı</label>
            <input class="st-input" value="${escapeHtml(sec.title || '')}" oninput="updateSecProp('title', this.value)">
          </div>
          <div class="st-grid-2">
            <div class="st-field">
              <label class="st-label">Grafik Türü</label>
              <select class="st-select" onchange="updateSecProp('chartType', this.value)">
                <option value="column" ${sec.chartType === 'column' ? 'selected' : ''}>Sütun Grafiği</option>
                <option value="bar" ${sec.chartType === 'bar' ? 'selected' : ''}>Yatay Çubuk</option>
                <option value="pie" ${sec.chartType === 'pie' ? 'selected' : ''}>Pasta Grafiği</option>
                <option value="line" ${sec.chartType === 'line' ? 'selected' : ''}>Çizgi Grafiği</option>
              </select>
            </div>
            <div class="st-field">
              <label class="st-label">Grafik Alt Başlığı</label>
              <input class="st-input" value="${escapeHtml(sec.chartTitle || '')}" oninput="updateSecProp('chartTitle', this.value)">
            </div>
          </div>
          <div class="st-field">
            <label class="st-label">Veri Noktaları (Her satır: Etiket: Sayı)</label>
            <textarea class="st-textarea" rows="6" oninput="officeUpdateChartDataText(this.value)">${escapeHtml(itemsText)}</textarea>
          </div>
        </div>
      `;
    }

    // 11. IMAGE BLOCK INSPECTOR (WORD PICTURES / GALLERY)
    if (sec.type === 'image_block') {
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header">
            <h3 class="st-card-title">Fotoğraf / Görsel Bloğu (${(sec.images || []).length})</h3>
            <button type="button" class="st-btn st-btn-primary st-btn-xs" onclick="document.getElementById('insertImageInput').click()">+ Fotoğraf Ekle</button>
          </div>
          <div class="st-grid-2">
            <div class="st-field">
              <label class="st-label">Bölüm Başlığı</label>
              <input class="st-input" value="${escapeHtml(sec.title || '')}" oninput="updateSecProp('title', this.value)">
            </div>
            <div class="st-field">
              <label class="st-label">Yan Yana Sütun</label>
              <select class="st-select" onchange="updateSecProp('cols', Number(this.value))">
                <option value="1" ${Number(sec.cols) === 1 ? 'selected' : ''}>1 Sütun (Büyük)</option>
                <option value="2" ${Number(sec.cols || 2) === 2 ? 'selected' : ''}>2 Sütun</option>
                <option value="3" ${Number(sec.cols) === 3 ? 'selected' : ''}>3 Sütun</option>
              </select>
            </div>
          </div>
          ${(sec.images || []).map((img, iIdx) => `
            <div class="st-item-row">
              <div class="st-item-top">
                <span class="st-item-num">Fotoğraf #${iIdx + 1}</span>
                <button type="button" class="st-btn st-btn-danger-soft st-btn-icon" onclick="officeRemoveImageFromBlock(${iIdx})">✕</button>
              </div>
              <input class="st-input" placeholder="Fotoğraf açıklaması..." value="${escapeHtml(img.caption || '')}" oninput="officeUpdateImageCaption(${iIdx}, this.value)">
            </div>
          `).join('')}
        </div>
      `;
    }

    // 12. CALLOUT BLOCK INSPECTOR (WORD SHAPE / CALLOUT BOX)
    if (sec.type === 'callout_block') {
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header"><h3 class="st-card-title">Uyarı / Şekil Kutusu (Word)</h3></div>
          <div class="st-grid-2">
            <div class="st-field">
              <label class="st-label">Kutu Stili</label>
              <select class="st-select" onchange="updateSecProp('variant', this.value)">
                <option value="info" ${sec.variant === 'info' ? 'selected' : ''}>Bilgi (Mavi)</option>
                <option value="warn" ${sec.variant === 'warn' ? 'selected' : ''}>Uyarı (Kehribar)</option>
                <option value="danger" ${sec.variant === 'danger' ? 'selected' : ''}>Kritik C1 (Kırmızı)</option>
                <option value="ok" ${sec.variant === 'ok' ? 'selected' : ''}>Uygun (Yeşil)</option>
              </select>
            </div>
            <div class="st-field">
              <label class="st-label">Başlık</label>
              <input class="st-input" value="${escapeHtml(sec.title || '')}" oninput="updateSecProp('title', this.value)">
            </div>
          </div>
          <div class="st-field">
            <label class="st-label">Açıklama Metni</label>
            <textarea class="st-textarea" rows="4" oninput="updateSecProp('body', this.value)">${escapeHtml(sec.body || '')}</textarea>
          </div>
        </div>
      `;
    }

    // 13. SIGNATURE BLOCK INSPECTOR (WORD SIGNATURE LINE)
    if (sec.type === 'signature_block') {
      return headerBar + `
        <div class="st-card">
          <div class="st-card-header">
            <h3 class="st-card-title">İmza &amp; Onay Satırı</h3>
            <button type="button" class="st-btn st-btn-primary st-btn-xs" onclick="officeAddSignerCol()">+ İmza Sütunu</button>
          </div>
          <div class="st-field">
            <label class="st-label">Bölüm Başlığı</label>
            <input class="st-input" value="${escapeHtml(sec.title || '')}" oninput="updateSecProp('title', this.value)">
          </div>
          ${(sec.signers || []).map((sg, sIdx) => `
            <div class="st-item-row">
              <div class="st-item-top">
                <span class="st-item-num">Yetkili #${sIdx + 1}</span>
                <button type="button" class="st-btn st-btn-danger-soft st-btn-icon" onclick="officeRemoveSignerCol(${sIdx})">✕</button>
              </div>
              <div class="st-grid-2">
                <input class="st-input" placeholder="Unvan" value="${escapeHtml(sg.role || '')}" oninput="officeUpdateSigner(${sIdx}, 'role', this.value)">
                <input class="st-input" placeholder="Ad Soyad" value="${escapeHtml(sg.name || '')}" oninput="officeUpdateSigner(${sIdx}, 'name', this.value)">
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return headerBar;
  }

  // --------------------------------------------------------------------------
  // 6. ORİJİNAL 1:1 TEKKOMER & RAMS A4 RENDERER + ÇOK SAYFALI DOM SAYFALAMA
  // --------------------------------------------------------------------------
  function renderRadioDot(selected) {
    return `<span style="display:inline-block;width:6.8px;height:6.8px;border-radius:50%;border:1.1px solid #0f172a;background:${selected ? '#0f172a' : '#ffffff'};vertical-align:middle;margin-right:3px;box-sizing:border-box;"></span>`;
  }

  function formatSymBadge(sym, rams) {
    if (!sym) return '';
    if (!rams) return `<span style="font-weight:700;">${escapeHtml(sym)}</span>`;
    let cls = 'tkm-badge-neutral';
    if (sym === '✓') cls = 'tkm-badge-ok';
    else if (sym === 'X') cls = 'tkm-badge-bad';
    return `<span class="tkm-sym-badge ${cls}">${escapeHtml(sym)}</span>`;
  }

  function buildPageHeaderHtml(s) {
    const b = s.branding || {};
    const titleHtml = escapeHtml(s.title || '').replace('VE FONKSİYON TESTLERİ', 'VE FONKSİYON<br>TESTLERİ');
    return `
      <div class="tkm-header">
        <div style="display:flex;justify-content:center;align-items:center;padding-left:2px;">
          ${b.showLogo !== false ? `<img src="/assets/tekkomer_logo.png" alt="Logo" style="width:76px;height:68px;object-fit:contain;display:block;">` : `<div style="width:76px;"></div>`}
        </div>
        <div style="text-align:center;padding:0 6px;">
          <div style="font-size:11pt;font-weight:700;color:#222222;letter-spacing:0.2px;margin-bottom:1px;line-height:1.15;">${escapeHtml(b.companyFullName || '')}</div>
          ${b.phone ? `<div style="font-size:7.6pt;color:#222222;line-height:1.2;">${escapeHtml(b.phone)}</div>` : ''}
          ${b.email ? `<div style="font-size:7.6pt;color:#222222;line-height:1.2;margin-bottom:2px;">${escapeHtml(b.email)}</div>` : ''}
          <div class="tkm-header-title" style="font-size:10.3pt;font-weight:700;color:#222222;line-height:1.12;text-transform:uppercase;">${titleHtml}</div>
          <div class="tkm-header-acc" style="font-size:8.8pt;font-weight:400;color:#333333;margin-top:1px;letter-spacing:0.3px;">${escapeHtml(s.subtitle || 'PERİYODİK KONTROL RAPORU')}</div>
        </div>
        <div style="display:flex;justify-content:center;align-items:center;">
          ${b.showTurkak !== false ? `<img src="/assets/turkak_logo.jpg" alt="TÜRKAK" style="width:66px;height:82px;object-fit:contain;display:block;">` : `<div style="width:66px;"></div>`}
        </div>
      </div>
    `;
  }

  function buildPageFooterHtml(s, pageNum, totalPages) {
    const rams = isRamsTheme(s.pdfTheme);
    const disc = escapeHtml(s.branding?.disclaimer || '');
    const repNo = escapeHtml(s.report_no_sample || 'TKM-26-02-57801');

    if (rams) {
      return `
        <div class="tkm-footer">
          <div class="tkm-footer-disclaimer">${disc}</div>
          <div class="tkm-footer-doc-line">
            <span>Doküman Kodu: <strong>${escapeHtml(s.doc_code || 'ZPKR02')}</strong></span>
            <span class="tkm-fdoc-sep">&middot;</span>
            <span>Yayım Tarihi: <strong>${escapeHtml(s.publish_date || '18.07.2025')}</strong></span>
            <span class="tkm-fdoc-sep">&middot;</span>
            <span>Revizyon No / Tarihi: <strong>${escapeHtml(s.rev_info || '- / -')}</strong></span>
            <span class="tkm-fdoc-sep">&middot;</span>
            <span>Yürürlük Tarihi: <strong>${escapeHtml(s.effective_date || '01.09.2025')}</strong></span>
          </div>
          <div class="tkm-footer-meta">
            <span style="width:33%;text-align:left;"></span>
            <span style="width:34%;text-align:center;">${repNo}</span>
            <span style="width:33%;text-align:right;">${pageNum} / ${totalPages}</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="tkm-footer">
        <div class="tkm-footer-disclaimer">${disc}</div>
        <div class="tkm-footer-meta">
          <span style="width:38%;text-align:left;">${escapeHtml(s.form_code || 'TKM-FR.318, REV.00')}</span>
          <span style="width:34%;text-align:center;">${repNo}</span>
          <span style="width:28%;text-align:right;">${pageNum} / ${totalPages}</span>
        </div>
      </div>
    `;
  }

  function buildBlocksForSchema(s) {
    const rams = isRamsTheme(s.pdfTheme);
    const lblCls = rams ? ' class="tkm-label-cell"' : '';
    const valCls = rams ? ' class="tkm-val-cell"' : '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const blocks = [];

    const wrapBlock = (sec, innerHtml, forceBreak = false, allowSecBreak = true) => {
      const selCls = sec.id === StudioState.selectedSectionId ? ' a4-selected-block' : '';
      const effectiveBreak = Boolean(forceBreak || (allowSecBreak && sec.style && sec.style.forceBreak));
      return {
        forceBreak: effectiveBreak,
        html: `<div class="a4-interactive-block${selCls}" data-sec-id="${escapeHtml(sec.id)}" data-force-break="${effectiveBreak ? '1' : '0'}" onclick="onClickA4Block('${escapeHtml(sec.id)}', event)">${innerHtml}</div>`
      };
    };

    for (const sec of (s.sections || [])) {
      if (sec.visible === false) continue;

      // 1. COMPANY INFO
      if (sec.type === 'company_info') {
        const docBox = rams ? '' : `
          <div style="display:flex;justify-content:flex-end;margin-bottom:3px;">
            <table style="border:1px solid #000000;font-size:6.7pt;border-collapse:collapse;background:#ffffff;">
              <tr>
                <td style="padding:1.5px 6px;font-weight:700;border:1px solid #000000;background:#f4f4f4;">Doküman Kodu</td>
                <td style="padding:1.5px 6px;border:1px solid #000000;font-weight:600;">${escapeHtml(s.doc_code || 'ZPKR02')}</td>
                <td style="padding:1.5px 6px;font-weight:700;border:1px solid #000000;background:#f4f4f4;">Yürürlük Tarihi</td>
                <td style="padding:1.5px 6px;border:1px solid #000000;">${escapeHtml(s.effective_date || '01.09.2025')}</td>
              </tr>
            </table>
          </div>
        `;
        const rowsHtml = (sec.rows || []).map((r, rIdx) => r.layout === 'full'
          ? `<tr><td${lblCls} data-bind="ci:${sec.id}:${rIdx}:label1" style="font-weight:700;">${escapeHtmlBr(r.label1)}</td><td${valCls} data-bind="ci:${sec.id}:${rIdx}:val1" colspan="3">${escapeHtmlBr(r.val1)}</td></tr>`
          : `<tr><td${lblCls} data-bind="ci:${sec.id}:${rIdx}:label1" style="font-weight:700;">${escapeHtmlBr(r.label1)}</td><td${valCls} data-bind="ci:${sec.id}:${rIdx}:val1">${escapeHtmlBr(r.val1)}</td><td${lblCls} data-bind="ci:${sec.id}:${rIdx}:label2" style="font-weight:700;">${escapeHtmlBr(r.label2)}</td><td${valCls} data-bind="ci:${sec.id}:${rIdx}:val2">${escapeHtmlBr(r.val2)}</td></tr>`
        ).join('');
        const scopeHtml = (sec.scopeLines || []).length > 0 ? `
          <tr>
            <td${lblCls} data-bind="ci_scope_lbl:${sec.id}" style="font-weight:700;">${escapeHtmlBr(sec.scopeLabel || 'Periyodik Kontrol Metodu ve Kapsamı')}</td>
            <td colspan="3" data-bind="ci_scope:${sec.id}" style="line-height:1.22;">${sec.scopeLines.map(l => {
              const t = String(l || '').trim();
              if (!t) return '';
              if (sec.scopeRawLines || /^([•●▪◦\-*]|\d+[.)]|[a-zA-Z][.)])\s/.test(t)) return escapeHtml(t);
              return `• ${escapeHtml(t)}`;
            }).filter(Boolean).join('<br>')}</td>
          </tr>
        ` : '';
        blocks.push(wrapBlock(sec, `
          ${docBox}
          <div class="tkm-sec-title">${escapeHtml(sec.title)}</div>
          <table class="tkm-table">
            <colgroup><col style="width:19%;"><col style="width:36%;"><col style="width:17%;"><col style="width:28%;"></colgroup>
            <tbody>${rowsHtml}${scopeHtml}</tbody>
          </table>
        `));
        continue;
      }

      // 2.1 DETAIL GRID (RAMS 4-SÜTUN RADYO + AA/DA ROWSPAN vs KLASİK 6-SÜTUN 3'LÜ IZGARA)
      if (sec.type === 'detail_21') {
        const f = sec.fields || [];
        const renderCellVal = (fieldIdx, gap = '6px') => {
          const q = f[fieldIdx];
          if (!q) return '';
          if (q.type === 'radio' && Array.isArray(q.options) && q.options.length > 0) {
            return `<div style="display:flex;flex-wrap:wrap;gap:2px ${gap};align-items:center;">
              ${q.options.map(opt => {
                const isSel = String(q.value || '').toLowerCase() === String(opt).toLowerCase();
                return `<span class="a4-click-opt" onclick="pickDetail21RadioOnA4('${sec.id}', ${fieldIdx}, '${escapeHtml(opt)}', event)" style="display:inline-flex;align-items:center;font-weight:${isSel ? '700' : '400'};color:${isSel ? '#0f172a' : '#334155'};white-space:nowrap;">${renderRadioDot(isSel)}${escapeHtml(opt)}</span>`;
              }).join('')}
            </div>`;
          }
          return escapeHtml(q.value || '');
        };

        let tblHtml = '';
        if (rams && f.length >= 24) {
          const qPhase = f[10];
          const curP = String(qPhase.value || '');
          const aaOpts = qPhase.aaOptions || ['AA(1 faz-2 tel)', 'AA(1 faz-3 tel)', 'AA(2 faz-3 tel)', 'AA(3 faz-3 tel)', 'AA(3 faz-4 tel)'];
          const daOpts = qPhase.daOptions || ['DA(2 kutup)', 'DA(3 kutup)', 'DA(Diğer)'];
          const renderPGroup = (gName, isG, opts) => `
            <div style="display:flex;flex-wrap:wrap;gap:3px 6px;align-items:center;">
              <span style="font-weight:700;color:#0f172a;font-size:7.2pt;margin-right:2px;">${renderRadioDot(isG)}${gName}:</span>
              ${opts.map(opt => {
                const sel = curP.toLowerCase() === opt.toLowerCase();
                return `<span class="a4-click-opt" onclick="pickDetail21RadioOnA4('${sec.id}', 10, '${escapeHtml(opt)}', event)" style="display:inline-flex;align-items:center;font-size:7pt;font-weight:${sel ? '700' : '400'};color:${sel ? '#0f172a' : '#334155'};white-space:nowrap;">${renderRadioDot(sel)}${escapeHtml(opt)}</span>`;
              }).join('')}
            </div>
          `;
          const ls = 'text-align:left;padding:2px 4px;line-height:1.18;font-size:7.2pt;';
          const vs = 'text-align:left;padding:2px 4px;line-height:1.18;font-size:7.4pt;';
          const extraRows = [];
          for (let i = 24; i < f.length; i += 2) {
            const a = f[i], b = f[i + 1];
            extraRows.push(`<tr>
              <td class="tkm-label-cell" style="${ls}">${escapeHtml(a.label)}</td>
              <td class="tkm-val-cell" style="${vs}">${renderCellVal(i)}</td>
              <td class="tkm-label-cell" style="${ls}">${b ? escapeHtml(b.label) : ''}</td>
              <td class="tkm-val-cell" style="${vs}">${b ? renderCellVal(i + 1) : ''}</td>
            </tr>`);
          }
          tblHtml = `
            <table class="tkm-table">
              <colgroup><col style="width:21%;"><col style="width:29%;"><col style="width:22%;"><col style="width:28%;"></colgroup>
              <tbody>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[0].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(0)}</td><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[1].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(1)}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[2].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(2)}</td><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[5].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(5, '8px')}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[3].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(3, '10px')}</td><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[4].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(4, '10px')}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[7].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(7)}</td><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[6].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(6)}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[8].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(8)}</td><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[9].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(9)}</td></tr>
                <tr>
                  <td class="tkm-label-cell" rowspan="5" style="${ls}">${escapeHtml(qPhase.label)}</td>
                  <td class="tkm-val-cell" rowspan="5" style="${vs}">
                    <div style="display:flex;flex-direction:column;gap:3px;">
                      ${renderPGroup('AA', curP.toUpperCase().startsWith('AA'), aaOpts)}
                      <div style="border-top:1px dashed #cbd5e1;padding-top:2px;">${renderPGroup('DA', curP.toUpperCase().startsWith('DA'), daOpts)}</div>
                    </div>
                  </td>
                  <td class="tkm-label-cell" style="${ls}">${escapeHtml(f[11].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(11)}</td>
                </tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[12].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(12)}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[13].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(13)}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[14].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(14)}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[19].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(19)}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[15].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(15)}</td><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[20].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(20)}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[16].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(16)}</td><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[21].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(21)}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[17].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(17)}</td><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[22].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(22)}</td></tr>
                <tr><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[18].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(18)}</td><td class="tkm-label-cell" style="${ls}">${escapeHtml(f[23].label)}</td><td class="tkm-val-cell" style="${vs}">${renderCellVal(23)}</td></tr>
                ${extraRows.join('')}
              </tbody>
            </table>
          `;
        } else {
          // CLASSIC 3-PAIR (6-COLUMN) GRID
          let rows = '';
          for (let i = 0; i < f.length; i += 3) {
            rows += '<tr>';
            for (let c = 0; c < 3; c++) {
              const q = f[i + c];
              rows += q
                ? `<td style="text-align:center;">${escapeHtml(q.label)}</td><td style="text-align:left;padding-left:5px;">${escapeHtml(q.value || '')}</td>`
                : `<td></td><td></td>`;
            }
            rows += '</tr>';
          }
          tblHtml = `<table class="tkm-table"><colgroup><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.4%;"></colgroup><tbody>${rows}</tbody></table>`;
        }
        blocks.push(wrapBlock(sec, `
          ${sec.sectionTitle ? `<div class="tkm-sec-title">${escapeHtml(sec.sectionTitle)}</div>` : ''}
          <div class="tkm-sub-bar">${escapeHtml(sec.subTitle || '2.1. DETAY BİLGİLER')}</div>
          ${tblHtml}
        `));
        continue;
      }

      // 2.2 TESPİT EDİLEN BİLGİLER
      if (sec.type === 'detail_22') {
        let tblHtml = '';
        if (rams) {
          const optPair = (kind, idx, q) => (q.options || ['Var', 'Yok']).map(opt => {
            const sel = q.value === opt;
            return `<span class="a4-click-opt" onclick="pickDetail22OptOnA4('${sec.id}', '${kind}', ${idx}, '${escapeHtml(opt)}', event)" style="display:inline-flex;align-items:center;margin-right:16px;font-weight:${sel ? '700' : '400'};">${renderRadioDot(sel)}${escapeHtml(opt)}</span>`;
          }).join('');
          const protHtml = (sec.protectionItems || []).map((p, idx) => {
            const sel = p.value === 'Var';
            return `<div class="a4-click-opt" onclick="pickDetail22OptOnA4('${sec.id}', 'prot', ${idx}, '', event)" style="display:flex;align-items:flex-start;gap:4px;line-height:1.18;margin-bottom:1px;">
              <span style="flex-shrink:0;margin-top:2px;">${renderRadioDot(sel)}</span>
              <span style="font-weight:${sel ? '700' : '400'};">${escapeHtml(p.label)}</span>
            </div>`;
          }).join('');
          tblHtml = `
            <table class="tkm-table">
              <colgroup><col style="width:43%;"><col style="width:57%;"></colgroup>
              <tbody>
                ${(sec.topQuestions || []).map((q, i) => `
                  <tr><td class="tkm-label-cell" style="text-align:left;padding:2px 4px;">${escapeHtml(q.label)}</td><td class="tkm-val-cell" style="text-align:left;padding:2px 4px;">${optPair('top', i, q)}</td></tr>
                `).join('')}
                <tr>
                  <td class="tkm-label-cell" data-bind="d22_prot_title:${sec.id}" style="text-align:left;padding:2px 4px;">${escapeHtmlBr(sec.protectionTitle || '')}</td>
                  <td class="tkm-val-cell" style="text-align:left;padding:2px 4px;font-size:6.8pt;">${protHtml}</td>
                </tr>
                <tr>
                  <td class="tkm-label-cell" style="text-align:left;padding:2px 4px;">${escapeHtml(sec.bottomQuestion.label)}</td>
                  <td class="tkm-val-cell" style="text-align:left;padding:2px 4px;">${optPair('bottom', 0, sec.bottomQuestion)}</td>
                </tr>
              </tbody>
            </table>
          `;
        } else {
          const allFlat = [
            ...(sec.topQuestions || []).map(q => ({ label: q.label, val: q.value })),
            { label: sec.bottomQuestion.label, val: sec.bottomQuestion.value },
            ...(sec.protectionItems || []).map(p => ({ label: `Tespit edilen bilgiler(Doğrudan dokunmaya karşı koruma önlemleri) - ${p.label}`, val: p.value }))
          ];
          let rows = '';
          for (let i = 0; i < allFlat.length; i += 3) {
            rows += '<tr>';
            for (let c = 0; c < 3; c++) {
              const q = allFlat[i + c];
              rows += q ? `<td style="text-align:center;">${escapeHtml(q.label)}</td><td style="text-align:left;padding-left:5px;">${escapeHtml(q.val)}</td>` : `<td></td><td></td>`;
            }
            rows += '</tr>';
          }
          tblHtml = `<table class="tkm-table"><colgroup><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.3%;"><col style="width:19%;"><col style="width:14.4%;"></colgroup><tbody>${rows}</tbody></table>`;
        }
        blocks.push(wrapBlock(sec, `<div class="tkm-sub-bar">${escapeHtml(sec.subTitle || '2.2. TESPİT EDİLEN BİLGİLER')}</div>${tblHtml}`));
        continue;
      }

      // 3/4/6.1/6.2/6.3 DATA TABLES (2-KATLI GRUPLU ÜST BAŞLIK + EXCEL TABLO SEÇENEKLERİ + OTO FİLTRE + TOPLAM SATIRI!)
      if (sec.type === 'data_table') {
        const cols = sec.columns || [];
        const tblOpts = sec.tableOptions || {};
        const hasGroups = rams && cols.some(c => String(c.group || '').trim() !== '');
        const totalColsCount = (sec.showNoCol ? 1 : 0) + cols.length;
        const colgroup = `<colgroup>
          ${sec.showNoCol ? `<col style="width:${Number(sec.noColWidth || 4)}%;">` : ''}
          ${cols.map(c => `<col style="width:${Number(c.width || 10)}%;">`).join('')}
        </colgroup>`;

        const filterMap = StudioState.tableFilters[sec.id] || {};
        const filterBtn = (cId) => {
          if (!sec.autoFilter) return '';
          const active = filterMap[cId] && filterMap[cId].size > 0;
          return `<button type="button" class="tbl-filter-btn${active ? ' filtered' : ''}" onclick="officeOpenHeaderFilter('${sec.id}', '${cId}', this, event)" title="Sütuna Göre Filtrele">▾</button>`;
        };

        const excelLetterRow = `<tr class="excel-col-letters">${Array.from({ length: totalColsCount }, (_, i) => `<th>${colIndexToExcelLetter(i)}</th>`).join('')}</tr>`;

        let theadHtml = '';
        if (hasGroups) {
          let row1 = sec.showNoCol ? `<th rowspan="2" style="text-align:center;" data-resize-sec="${sec.id}" data-resize-col="__no__">No</th>` : '';
          let row2 = '';
          let i = 0;
          while (i < cols.length) {
            const g = String(cols[i].group || '').trim();
            if (!g) {
              row1 += `<th rowspan="2" style="text-align:center;" data-bind="dt_col:${sec.id}:${i}" data-resize-sec="${sec.id}" data-resize-col="${i}">${escapeHtml(cols[i].label)}${filterBtn(cols[i].id)}</th>`;
              i++;
            } else {
              let span = 1;
              while (i + span < cols.length && String(cols[i + span].group || '').trim() === g) span++;
              row1 += `<th colspan="${span}" class="tkm-linye-group-th" style="text-align:center;">${escapeHtml(g)}</th>`;
              for (let k = 0; k < span; k++) {
                row2 += `<th style="text-align:center;" data-bind="dt_col:${sec.id}:${i + k}" data-resize-sec="${sec.id}" data-resize-col="${i + k}">${escapeHtml(cols[i + k].label)}${filterBtn(cols[i + k].id)}</th>`;
              }
              i += span;
            }
          }
          theadHtml = `<thead>${excelLetterRow}<tr>${row1}</tr><tr>${row2}</tr></thead>`;
        } else {
          theadHtml = `<thead>${excelLetterRow}<tr>
            ${sec.showNoCol ? `<th style="text-align:center;" data-resize-sec="${sec.id}" data-resize-col="__no__">No</th>` : ''}
            ${cols.map((c, cIdx) => `<th style="text-align:center;" data-bind="dt_col:${sec.id}:${cIdx}" data-resize-sec="${sec.id}" data-resize-col="${cIdx}">${escapeHtml(c.label)}${filterBtn(c.id)}</th>`).join('')}
          </tr></thead>`;
        }

        const activeFilterCols = Object.keys(filterMap).filter(k => filterMap[k] && filterMap[k].size > 0);
        const visibleRows = (sec.rows || []).map((r, origIdx) => ({ r, origIdx })).filter(({ r }) => {
          if (activeFilterCols.length === 0) return true;
          return activeFilterCols.every(cid => filterMap[cid].has(String(r[cid] == null ? '' : r[cid]).trim()));
        });

        const tbodyHtml = visibleRows.map(({ r, origIdx: rIdx }) => {
          const rhStyle = (r._height && Number(r._height) >= 12) ? ` style="height:${Number(r._height)}px;"` : '';
          return `
          <tr${rhStyle} data-dt-row="${rIdx}">
            ${sec.showNoCol ? `<td style="text-align:center;">${rIdx + 1}</td>` : ''}
            ${cols.map(c => {
              const raw = r[c.id] == null ? '' : String(r[c.id]);
              if (c.type === 'symbol') {
                const badCls = (rams && raw === 'X') ? ' class="tkm-cell-bad a4-click-sym"' : ' class="a4-click-sym"';
                return `<td${badCls} data-dt-col="${c.id}" style="text-align:center;" onclick="cycleTableCellSymOnA4('${sec.id}', ${rIdx}, '${c.id}', event)" title="Tıklayarak ✓ / X / N / G değiştirin">${formatSymBadge(raw, rams)}</td>`;
              }
              return `<td data-bind="dt_cell:${sec.id}:${rIdx}:${c.id}" data-dt-col="${c.id}" style="text-align:${c.align || 'center'};">${escapeHtmlBr(raw)}</td>`;
            }).join('')}
          </tr>
        `;
        }).join('');

        let totalRowHtml = '';
        if (sec.showTotalRow && visibleRows.length > 0) {
          totalRowHtml = `<tr class="tkm-total-row">
            ${sec.showNoCol ? `<td style="text-align:center;">Σ</td>` : ''}
            ${cols.map((c, idx) => {
              if (idx === 0) return `<td style="text-align:left;">TOPLAM (${visibleRows.length})</td>`;
              if (c.type === 'symbol') {
                const okCount = visibleRows.filter(({ r }) => r[c.id] === '✓').length;
                const badCount = visibleRows.filter(({ r }) => r[c.id] === 'X').length;
                return `<td style="text-align:center;">✓${okCount}${badCount ? ` / X${badCount}` : ''}</td>`;
              }
              const nums = visibleRows.map(({ r }) => {
                const raw = String(r[c.id] || '').replace(/\s+/g, '').replace(',', '.');
                const m = raw.match(/^-?\d+(\.\d+)?$/);
                return m ? parseFloat(raw) : NaN;
              }).filter(n => !isNaN(n));
              if (nums.length > 0) {
                const sum = nums.reduce((a, b) => a + b, 0);
                const formatted = Number.isInteger(sum) ? String(sum) : sum.toFixed(2).replace('.', ',');
                return `<td style="text-align:center;">${formatted}</td>`;
              }
              return `<td></td>`;
            }).join('')}
          </tr>`;
        }

        const extraCls = [
          sec.isLinyeTable ? 'tkm-linye-table' : '',
          tblOpts.bandedRows === false ? 'tkm-no-banded' : '',
          tblOpts.bandedCols ? 'tkm-banded-cols' : '',
          tblOpts.firstColBold ? 'tkm-first-col-bold' : '',
          tblOpts.lastColBold ? 'tkm-last-col-bold' : '',
          sec.tablePreset && sec.tablePreset !== 'default' ? `tbl-preset-${sec.tablePreset}` : ''
        ].filter(Boolean).join(' ');
        const tblCls = `tkm-table${extraCls ? ' ' + extraCls : ''}`;
        const forceBreak = Boolean((rams && sec.forceBreakInRams) || (!rams && sec.forceBreakInClassic));
        blocks.push(wrapBlock(sec, `
          ${sec.title ? `<div class="tkm-sec-title">${escapeHtml(sec.title)}</div>` : ''}
          ${sec.subTitle ? `<div class="tkm-sub-bar">${escapeHtml(sec.subTitle)}</div>` : ''}
          <table class="${tblCls}" data-dt-sec="${sec.id}">${colgroup}${theadHtml}<tbody>${tbodyHtml}${totalRowHtml}</tbody></table>
          ${sec.showLegend ? `<div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>` : ''}
          ${sec.footnote ? `<div style="font-size:6.8pt;color:#333333;font-style:italic;margin-top:2px;">${escapeHtml(sec.footnote)}</div>` : ''}
        `, forceBreak));
        continue;
      }

      // 5. VISUAL CHECKLIST GROUP (5.1 - 5.8: RAMS 2-SÜTUN vs KLASİK 1-SÜTUN)
      if (sec.type === 'visual_checklist_group') {
        const forceBreak = Boolean((rams && sec.forceBreakInRams) || (!rams && sec.forceBreakInClassic));
        let topHtml = `
          ${sec.superTitle ? `<div class="tkm-sec-title" style="color:#111111;">${escapeHtml(sec.superTitle)}</div>` : ''}
          ${sec.title ? `<div class="tkm-sec-title">${escapeHtml(sec.title)}</div>` : ''}
        `;
        if (sec.panoSubTitle) {
          topHtml += `
            <div class="tkm-sub-bar">${escapeHtml(sec.panoSubTitle)}</div>
            <table class="tkm-table">
              <colgroup><col style="width:32%;"><col style="width:68%;"></colgroup>
              <tbody><tr><td${lblCls} style="text-align:${rams ? 'left' : 'center'};">${escapeHtml(sec.panoLabel || '')}</td><td${valCls} style="text-align:left;padding-left:6px;">${escapeHtml(sec.panoValue || '')}</td></tr></tbody>
            </table>
          `;
        }
        blocks.push(wrapBlock(sec, topHtml, forceBreak));

        (sec.topics || []).forEach((t, tIdx) => {
          const isFirst = tIdx === 0;
          const isLast = tIdx === sec.topics.length - 1;
          let topicTableHtml = '';
          if (rams) {
            const mid = Math.ceil(t.items.length / 2);
            let rows = '';
            for (let i = 0; i < mid; i++) {
              const L = t.items[i];
              const R = t.items[i + mid] || null;
              const badL = L.sym === 'X' ? ' tkm-cell-bad' : '';
              const badR = (R && R.sym === 'X') ? ' tkm-cell-bad' : '';
              rows += `<tr>
                <td class="${badL}" style="text-align:center;font-weight:700;width:24px;">${letters[i] || (i + 1)}</td>
                <td class="${badL}" style="text-align:left;padding-left:4px;font-size:6.9pt;">${escapeHtml(L.text)}</td>
                <td class="a4-click-sym${badL}" onclick="cycleVisualItemOnA4('${sec.id}', ${tIdx}, ${i}, event)" style="text-align:center;width:34px;border-right:1.5px solid #333333 !important;" title="Tıklayarak işareti değiştirin">${formatSymBadge(L.sym, true)}</td>
                ${R ? `
                  <td class="${badR}" style="text-align:center;font-weight:700;width:24px;border-left:1.5px solid #333333 !important;">${letters[i + mid] || (i + mid + 1)}</td>
                  <td class="${badR}" style="text-align:left;padding-left:4px;font-size:6.9pt;">${escapeHtml(R.text)}</td>
                  <td class="a4-click-sym${badR}" onclick="cycleVisualItemOnA4('${sec.id}', ${tIdx}, ${i + mid}, event)" style="text-align:center;width:34px;" title="Tıklayarak işareti değiştirin">${formatSymBadge(R.sym, true)}</td>
                ` : `<td style="border-left:1.5px solid #333333 !important;"></td><td></td><td></td>`}
              </tr>`;
            }
            const thead = isFirst ? `<thead><tr><th></th><th style="text-align:left;padding-left:4px;">Soru / Kriter</th><th style="text-align:center;border-right:1.5px solid #333333 !important;">1</th><th style="border-left:1.5px solid #333333 !important;"></th><th style="text-align:left;padding-left:4px;">Soru / Kriter</th><th style="text-align:center;">1</th></tr></thead>` : '';
            topicTableHtml = `
              <div class="tkm-sub-bar">${escapeHtml(t.title)}</div>
              <table class="tkm-table tkm-table-twocol">
                <colgroup><col style="width:24px;"><col style="width:42%;"><col style="width:34px;"><col style="width:24px;"><col style="width:42%;"><col style="width:34px;"></colgroup>
                ${thead}<tbody>${rows}</tbody>
              </table>
              ${isLast ? `<div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>` : ''}
            `;
          } else {
            const rows = t.items.map((it, i) => `
              <tr>
                <td style="text-align:center;font-weight:700;">${letters[i] || (i + 1)}</td>
                <td style="text-align:left;padding-left:6px;">${escapeHtml(it.text)}</td>
                <td class="a4-click-sym" onclick="cycleVisualItemOnA4('${sec.id}', ${tIdx}, ${i}, event)" style="text-align:center;">${formatSymBadge(it.sym, false)}</td>
              </tr>
            `).join('');
            topicTableHtml = `
              <div class="tkm-sub-bar">${escapeHtml(t.title)}</div>
              <table class="tkm-table">
                <colgroup><col style="width:28px;"><col><col style="width:42px;"></colgroup>
                <thead><tr><th></th><th style="text-align:left;padding-left:6px;">Soru / Kriter</th><th style="text-align:center;">1</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
              <div class="tkm-legend">✓: Uygun; X: Uygun Değil; N: Uygulaması Yok; G: Görülemedi</div>
            `;
          }
          if (isLast && sec.footnote) {
            topicTableHtml += `<div style="font-size:6.8pt;color:#333333;font-style:italic;margin-top:2px;">${escapeHtml(sec.footnote)}</div>`;
          }
          blocks.push(wrapBlock(sec, topicTableHtml, false, false));
        });
        continue;
      }

      // 6. FUNC MATRIX
      if (sec.type === 'func_matrix') {
        const forceBreak = Boolean((rams && sec.forceBreakInRams) || (!rams && sec.forceBreakInClassic));
        let inner = '';
        if (rams) {
          const methodHtml = (sec.methodOptions || []).map(opt => {
            const sel = sec.methodValue === opt;
            return `<span class="a4-click-opt" onclick="pickFuncRadioOnA4('${sec.id}', 'methodValue', '${escapeHtml(opt)}', event)" style="display:inline-flex;align-items:center;margin-right:16px;font-weight:${sel ? '700' : '400'};">${renderRadioDot(sel)}${escapeHtml(opt)}</span>`;
          }).join('');
          const dkdHtml = (sec.dkdOptions || []).map(opt => {
            const sel = sec.dkdTypeVal === opt;
            return `<span class="a4-click-opt" onclick="pickFuncRadioOnA4('${sec.id}', 'dkdTypeVal', '${escapeHtml(opt)}', event)" style="display:inline-flex;align-items:center;margin-right:6px;font-weight:${sel ? '700' : '400'};">${renderRadioDot(sel)}${escapeHtml(opt)}</span>`;
          }).join('');
          inner = `
            <div class="tkm-sec-title">${escapeHtml(sec.title)}</div>
            <div class="tkm-sub-bar">${escapeHtml(sec.methodTitle)}</div>
            <table class="tkm-table" style="margin-bottom:2px;"><tbody><tr><td class="tkm-val-cell" style="text-align:left;padding:2.5px 6px;">${methodHtml}</td></tr></tbody></table>
            <div class="tkm-sub-bar">${escapeHtml(sec.subTitle)}</div>
            <table class="tkm-table">
              <colgroup><col style="width:25%;"><col style="width:11%;"><col style="width:16%;"><col style="width:11%;"><col style="width:22%;"><col style="width:15%;"></colgroup>
              <tbody>
                <tr><td class="tkm-label-cell">${escapeHtml(sec.panoLabel)}</td><td class="tkm-val-cell" colspan="5">${escapeHtml(sec.panoValue)}</td></tr>
                <tr>
                  <td class="tkm-label-cell">${escapeHtml(sec.zxLabel)}</td><td class="tkm-val-cell" style="text-align:center;">${escapeHtml(sec.zxVal)}</td>
                  <td class="tkm-label-cell">${escapeHtml(sec.ffLabel)}</td><td class="tkm-val-cell" style="text-align:center;">${escapeHtml(sec.ffVal)}</td>
                  <td class="tkm-label-cell" rowspan="2">${escapeHtml(sec.dkdTypeLabel)}</td><td class="tkm-val-cell" rowspan="2" style="font-size:6.8pt;line-height:1.3;">${dkdHtml}</td>
                </tr>
                <tr>
                  <td class="tkm-label-cell">${escapeHtml(sec.zlnLabel)}</td><td class="tkm-val-cell" style="text-align:center;">${escapeHtml(sec.zlnVal)}</td>
                  <td class="tkm-label-cell">${escapeHtml(sec.lnLabel)}</td><td class="tkm-val-cell" style="text-align:center;">${escapeHtml(sec.lnVal)}</td>
                </tr>
                <tr>
                  <td class="tkm-label-cell">${escapeHtml(sec.ik3Label)}</td><td class="tkm-val-cell" style="text-align:center;">${escapeHtml(sec.ik3Val)}</td>
                  <td class="tkm-label-cell">${escapeHtml(sec.npeLabel)}</td><td class="tkm-val-cell" style="text-align:center;">${escapeHtml(sec.npeVal)}</td>
                  <td class="tkm-label-cell">${escapeHtml(sec.dkdKaLabel)}</td><td class="tkm-val-cell" style="text-align:center;">${escapeHtml(sec.dkdKaVal)}</td>
                </tr>
              </tbody>
            </table>
          `;
        } else {
          inner = `
            <div class="tkm-sec-title">${escapeHtml(sec.title)}</div>
            <div class="tkm-sub-bar">${escapeHtml(sec.methodTitle)}</div>
            <table class="tkm-table"><colgroup><col style="width:50%;"><col style="width:50%;"></colgroup><tbody><tr><td style="text-align:center;">Ölçüm ve doğrulama metodu</td><td>${escapeHtml(sec.methodValue)}</td></tr></tbody></table>
            <div class="tkm-sub-bar">${escapeHtml(sec.subTitle)}</div>
            <table class="tkm-table" style="margin-bottom:2px;"><colgroup><col style="width:50%;"><col style="width:50%;"></colgroup><tbody><tr><td style="text-align:center;">${escapeHtml(sec.panoLabel)}</td><td>${escapeHtml(sec.panoValue)}</td></tr></tbody></table>
            <table class="tkm-table">
              <colgroup><col style="width:14.5%;"><col style="width:10.5%;"><col style="width:14.5%;"><col style="width:10.5%;"><col style="width:14.5%;"><col style="width:10.5%;"><col style="width:14.5%;"><col style="width:10.5%;"></colgroup>
              <tbody>
                <tr><td style="text-align:center;">${escapeHtml(sec.zxLabel)}</td><td>${escapeHtml(sec.zxVal)}</td><td style="text-align:center;">${escapeHtml(sec.zlnLabel)}</td><td>${escapeHtml(sec.zlnVal)}</td><td style="text-align:center;">${escapeHtml(sec.ik3Label)}</td><td>${escapeHtml(sec.ik3Val)}</td><td style="text-align:center;">${escapeHtml(sec.dkdTypeLabel)}</td><td>${escapeHtml(sec.dkdTypeVal)}</td></tr>
                <tr><td style="text-align:center;">${escapeHtml(sec.ffLabel)}</td><td>${escapeHtml(sec.ffVal)}</td><td style="text-align:center;">${escapeHtml(sec.lnLabel)}</td><td>${escapeHtml(sec.lnVal)}</td><td style="text-align:center;">${escapeHtml(sec.npeLabel)}</td><td>${escapeHtml(sec.npeVal)}</td><td style="text-align:center;">${escapeHtml(sec.dkdKaLabel)}</td><td>${escapeHtml(sec.dkdKaVal)}</td></tr>
              </tbody>
            </table>
          `;
        }
        blocks.push(wrapBlock(sec, inner, forceBreak));
        continue;
      }

      // 7/8/9 NOTES BOX
      if (sec.type === 'notes_box') {
        const isCleanDefect = sec.isDefectBox && rams && String(sec.content || '').toLowerCase().includes('bulunmamaktadır');
        const bodyContent = isCleanDefect
          ? `<div style="color:#14573a;font-weight:700;font-size:7.3pt;">✓ ${escapeHtml(sec.content)}</div>`
          : escapeHtml(sec.content || '').replace(/\n/g, '<br>');
        blocks.push(wrapBlock(sec, `
          <div class="tkm-sec-title">${escapeHtml(sec.title)}</div>
          <table class="tkm-table ${rams ? 'tkm-general-notes-box' : ''}">
            <tbody><tr><td data-bind="note:${sec.id}" style="min-height:22px;height:24px;vertical-align:top;text-align:left;padding:3.5px 6px;">${bodyContent}</td></tr></tbody>
          </table>
          ${sec.bottomNote ? `<div style="font-size:6.8pt;color:#222;font-weight:600;padding:2.5px 6px;margin-top:2px;background:#fff;border:1px solid ${rams ? '#cbd5e1' : '#000'};border-radius:2px;">${escapeHtml(sec.bottomNote)}</div>` : ''}
        `));
        continue;
      }

      // 10. CONCLUSION BOX
      if (sec.type === 'conclusion_box') {
        const isOk = sec.overallResult !== 'UYGUN DEĞİL';
        const banner = `
          <div class="tkm-conclusion-box ${isOk ? 'tkm-result-box-ok' : 'tkm-result-box-bad'}" style="margin:2px 0 4px 0;font-size:7.4pt;font-weight:700;color:${isOk ? '#047857' : '#c00000'};line-height:1.25;">
            ${escapeHtml(sec.leadSentence || '')}<br>
            <span style="font-size:8.4pt;">${escapeHtml(isOk ? sec.okSentence : sec.badSentence)}</span>
          </div>
        `;
        const heavyLines = String(sec.heavyDefectsText || '').split(/\r?\n/).map(line => {
          const bold = /^(Gözle Kontrol Bölümü|Fonksiyon Testleri Bölümü|Ağır kusur olarak)/i.test(line.trim());
          return `<div${bold ? ' style="font-weight:700;margin-top:2px;"' : ''}>${escapeHtml(line)}</div>`;
        }).join('');
        const heavyBlock = rams
          ? `<div style="column-count:2;column-gap:12px;font-size:7pt;line-height:1.15;text-align:left;"><div style="font-weight:700;">Ağır kusur tanımları:</div>${heavyLines}</div>`
          : `<div style="font-size:6.6pt;line-height:1.15;text-align:left;"><div style="font-weight:700;">Ağır kusur tanımları:</div>${heavyLines}</div>`;
        const forceBreak = Boolean((rams && sec.forceBreakInRams) || (!rams && sec.forceBreakInClassic));
        blocks.push(wrapBlock(sec, `
          <div class="tkm-sec-title">${escapeHtml(sec.title)}</div>
          <table class="tkm-table"><tbody><tr><td style="padding:4px 6px;text-align:left;">
            ${rams ? `${banner}${heavyBlock}` : `${heavyBlock}${banner}`}
          </td></tr></tbody></table>
        `, forceBreak));
        continue;
      }

      // 11. APPROVAL BOX (E-İMZA + QR)
      if (sec.type === 'approval_box') {
        blocks.push(wrapBlock(sec, `
          <div class="tkm-sec-title">${escapeHtml(sec.title)}</div>
          <table class="tkm-table">
            <colgroup><col style="width:19%;"><col style="width:48%;"><col style="width:33%;"></colgroup>
            <thead><tr><th></th><th style="text-align:center;">Muayene Personeli</th><th style="text-align:center;">Kare Kod</th></tr></thead>
            <tbody>
              <tr>
                <td style="font-weight:700;">Adı Soyadı / Mesleği</td>
                <td data-bind="appr:${sec.id}:inspectorName" style="text-align:center;font-weight:700;">${escapeHtml(sec.inspectorName)}</td>
                <td rowspan="4" style="text-align:center;vertical-align:middle;padding:4px;">
                  ${sec.showQr !== false ? `<img src="/assets/qr_default.jpg" alt="QR" style="width:76px;height:76px;object-fit:contain;display:inline-block;">` : ''}
                </td>
              </tr>
              <tr><td style="font-weight:700;">Bakanlık Kayıt No</td><td data-bind="appr:${sec.id}:ministryNo" style="text-align:center;font-weight:700;">${escapeHtml(sec.ministryNo)}</td></tr>
              <tr><td style="font-weight:700;">Diploma No / Tarih</td><td data-bind="appr:${sec.id}:diplomaNo" style="text-align:center;font-weight:700;">${escapeHtml(sec.diplomaNo)}</td></tr>
              <tr style="height:44px;">
                <td style="font-weight:700;">İmza</td>
                <td style="text-align:center;vertical-align:middle;padding:3px;">
                  ${sec.showEimza !== false ? `<img src="/assets/eimza.jpg" alt="e-imzalıdır" style="height:34px;object-fit:contain;display:inline-block;">` : ''}
                </td>
              </tr>
            </tbody>
          </table>
          <div style="font-size:6.8pt;color:#333;margin-top:2px;font-style:italic;">${escapeHtml(sec.footnote || '')}</div>
        `));
        continue;
      }

      // 12. CHART BLOCK (EXCEL / GRIDCRAFT SVG GRAFİK)
      if (sec.type === 'chart_block') {
        const svg = window.__StudioOffice?.renderChartSvg ? window.__StudioOffice.renderChartSvg(sec) : '';
        blocks.push(wrapBlock(sec, `
          ${sec.title ? `<div class="tkm-sec-title">${escapeHtml(sec.title)}</div>` : ''}
          <div class="tkm-chart-box">
            ${sec.chartTitle ? `<div class="tkm-chart-title">${escapeHtml(sec.chartTitle)}</div>` : ''}
            ${svg}
          </div>
        `));
        continue;
      }

      // 13. IMAGE BLOCK (WORD FOTOĞRAF / GÖRSEL GALERİSİ)
      if (sec.type === 'image_block') {
        const imgs = Array.isArray(sec.images) ? sec.images : [];
        const cols = Math.max(1, Math.min(3, Number(sec.cols || 2)));
        blocks.push(wrapBlock(sec, `
          ${sec.title ? `<div class="tkm-sec-title">${escapeHtml(sec.title)}</div>` : ''}
          <div class="tkm-img-grid" style="grid-template-columns:repeat(${cols}, 1fr);">
            ${imgs.length === 0 ? `<div style="grid-column:1/-1;text-align:center;color:#64748b;padding:12px;font-size:7.2pt;">Görsel eklemek için Ekle → Resim/Fotoğraf seçeneğini kullanın.</div>` : imgs.map(im => `
              <div class="tkm-img-item">
                <img src="${escapeHtml(im.src)}" alt="${escapeHtml(im.caption || 'Görsel')}">
                ${im.caption ? `<div class="tkm-img-cap">${escapeHtml(im.caption)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `));
        continue;
      }

      // 14. CALLOUT BLOCK (WORD ŞEKİL / UYARI KUTUSU)
      if (sec.type === 'callout_block') {
        const variant = sec.variant || 'info';
        blocks.push(wrapBlock(sec, `
          <div class="tkm-callout ${escapeHtml(variant)}">
            ${sec.title ? `<div class="tkm-callout-title">${escapeHtml(sec.title)}</div>` : ''}
            <div>${escapeHtmlBr(sec.body || '')}</div>
          </div>
        `));
        continue;
      }

      // 15. SIGNATURE BLOCK (WORD İMZA & ONAY SATIRI)
      if (sec.type === 'signature_block') {
        const signers = Array.isArray(sec.signers) && sec.signers.length > 0 ? sec.signers : [
          { role: 'Muayene Mühendisi', name: 'Ad Soyad' },
          { role: 'Firma Yetkilisi', name: 'Ad Soyad' }
        ];
        blocks.push(wrapBlock(sec, `
          ${sec.title ? `<div class="tkm-sec-title">${escapeHtml(sec.title)}</div>` : ''}
          <table class="tkm-table tkm-sig-table">
            <thead><tr>${signers.map(sg => `<th style="text-align:center;">${escapeHtml(sg.role || 'Yetkili')}</th>`).join('')}</tr></thead>
            <tbody>
              <tr>${signers.map(sg => `<td style="text-align:center;font-weight:700;">${escapeHtml(sg.name || '')}</td>`).join('')}</tr>
              <tr style="height:36px;">${signers.map(() => `<td style="text-align:center;color:#94a3b8;font-size:6.5pt;vertical-align:bottom;">İmza / Kaşe</td>`).join('')}</tr>
            </tbody>
          </table>
        `));
        continue;
      }
    }
    return blocks;
  }

  // --------------------------------------------------------------------------
  // 6B. CSS DEĞİŞKENLERİ, BÖLÜM STİLLERİ, TEKİL HÜCRE STİLLERİ VE SÜTUN SÜRÜKLEME
  // --------------------------------------------------------------------------
  window.onClickA4Block = function (secId, ev) {
    const cell = ev && ev.target ? ev.target.closest('td[data-cell-key], th[data-cell-key]') : null;
    if (cell && cell.isContentEditable) return;

    if (cell && cell.dataset.cellKey) {
      const key = cell.dataset.cellKey;
      ev.stopPropagation();

      // Excel Point-Mode: Formül çubuğunda '=' yazarken başka hücreye tıklanırsa adresini ekle!
      if (window.__StudioOffice?.tryInsertFormulaRef && window.__StudioOffice.tryInsertFormulaRef(key, ev)) {
        return;
      }

      if (StudioState.formatPainterStyle) {
        ensureStyleDefaults(StudioState.schema);
        pushUndoSnapshot();
        const painted = StudioState.formatPainterStyle;
        if (Object.keys(painted).length === 0) {
          delete StudioState.schema.cellStyles[key];
        } else {
          StudioState.schema.cellStyles[key] = Object.assign({}, painted);
        }
        clearFormatPainter();
        StudioState.selectedCellKey = key;
        StudioState.selectedCellRange = [key];
        StudioState.selectedSectionId = secId;
        renderAll();
        showToast('Biçim hücreye kopyalandı');
        return;
      }

      selectCellByKey(key, { extendRange: Boolean(ev && ev.shiftKey) });
      return;
    }

    selectSection(secId, { scrollToA4: false });
  };

  function applyLayoutCssVarsTo(el, s) {
    ensureStyleDefaults(s);
    const ls = s.layoutStyles;
    const ds = s.designSettings || DEFAULT_DESIGN_SETTINGS;
    el.style.setProperty('--st-sec-mt', `${ls.secMarginTop}px`);
    el.style.setProperty('--st-sec-mb', `${ls.secMarginBottom}px`);
    el.style.setProperty('--st-sec-fs', `${ls.secFontSize}pt`);
    el.style.setProperty('--st-sub-mt', `${ls.subMarginTop}px`);
    el.style.setProperty('--st-sub-mb', `${ls.subMarginBottom}px`);
    el.style.setProperty('--st-sub-fs', `${ls.subFontSize}pt`);
    el.style.setProperty('--st-block-gap', `${ls.blockGap}px`);
    el.style.setProperty('--st-header-mb', `${ls.headerMarginBottom}px`);
    el.style.setProperty('--st-page-py', `${ls.pagePadY}mm`);
    el.style.setProperty('--st-page-px', `${ls.pagePadX}mm`);
    el.style.setProperty('--st-cell-py', `${ls.cellPadY}px`);
    el.style.setProperty('--st-cell-px', `${ls.cellPadX}px`);
    el.style.setProperty('--st-row-min-h', Number(ls.rowMinHeight) > 0 ? `${ls.rowMinHeight}px` : 'auto');
    el.style.setProperty('--st-tbl-fs', `${ls.tableFontSize}pt`);
    el.style.setProperty('--st-tbl-lh', `${ls.tableLineHeight}`);
    el.style.setProperty('--st-page-bg', ds.pageColor || '#ffffff');
    if (ds.docFont) el.style.setProperty('--st-doc-font', ds.docFont);
    else el.style.removeProperty('--st-doc-font');

    el.classList.toggle('has-custom-border', Boolean(ls.customBorderEnabled));
    if (ls.customBorderEnabled) {
      el.style.setProperty('--st-border-color', ls.borderColor || '#cbd5e1');
      el.style.setProperty('--st-border-w', `${ls.borderWidth || 1}px`);
    }

    el.classList.toggle('has-custom-sec-color', Boolean(ls.customColorsEnabled));
    el.classList.toggle('has-custom-sub-style', Boolean(ls.customColorsEnabled));
    el.classList.toggle('has-custom-th-style', Boolean(ls.customColorsEnabled));
    if (ls.customColorsEnabled) {
      el.style.setProperty('--st-sec-title-color', ls.secTitleColor || '#1f3a5f');
      el.style.setProperty('--st-sub-bg', ls.subBg || '#eaeff5');
      el.style.setProperty('--st-sub-color', ls.subColor || '#1f3a5f');
      el.style.setProperty('--st-th-bg', ls.thBg || '#f1f5f9');
      el.style.setProperty('--st-th-color', ls.thColor || '#1f3a5f');
    }
  }

  function applySectionStylesToDom(root, s) {
    const secById = new Map((s.sections || []).map(sec => [sec.id, sec]));
    root.querySelectorAll('.a4-interactive-block[data-sec-id]').forEach(blk => {
      const sec = secById.get(blk.dataset.secId);
      const st = sec && sec.style ? sec.style : null;
      if (!st || Object.keys(st).length === 0) return;

      if (st.marginTop != null && Number(st.marginTop) > 0) blk.style.marginTop = `${st.marginTop}px`;
      if (st.marginBottom != null && Number(st.marginBottom) > 0) blk.style.marginBottom = `${st.marginBottom}px`;

      if (st.titleColor) {
        blk.querySelectorAll('.tkm-sec-title').forEach(el => {
          el.style.setProperty('color', st.titleColor, 'important');
          el.style.setProperty('border-left-color', st.titleColor, 'important');
        });
      }
      if (st.thBg) {
        blk.querySelectorAll('.tkm-table th').forEach(el => {
          el.style.setProperty('background-color', st.thBg, 'important');
        });
      }
      if (st.borderColor) {
        blk.querySelectorAll('.tkm-table, .tkm-table th, .tkm-table td').forEach(el => {
          el.style.setProperty('border-color', st.borderColor, 'important');
        });
      }
      if (st.fontSize && Number(st.fontSize) >= 5) {
        blk.querySelectorAll('.tkm-table, .tkm-table th, .tkm-table td').forEach(el => {
          el.style.setProperty('font-size', `${st.fontSize}pt`, 'important');
        });
      }
      if (st.padY != null && st.padY !== '' || st.padX != null && st.padX !== '') {
        blk.querySelectorAll('.tkm-table th, .tkm-table td').forEach(el => {
          if (st.padY != null && st.padY !== '') {
            el.style.setProperty('padding-top', `${st.padY}px`, 'important');
            el.style.setProperty('padding-bottom', `${st.padY}px`, 'important');
          }
          if (st.padX != null && st.padX !== '') {
            el.style.setProperty('padding-left', `${st.padX}px`, 'important');
            el.style.setProperty('padding-right', `${st.padX}px`, 'important');
          }
        });
      }
      if (st.rowMinHeight && Number(st.rowMinHeight) > 0) {
        blk.querySelectorAll('.tkm-table td').forEach(el => {
          el.style.setProperty('height', `${st.rowMinHeight}px`, 'important');
        });
      }
    });
  }

  function applyCellKeysAndStyles(root, s, interactive, sharedCounter) {
    ensureStyleDefaults(s);
    const cellStyles = s.cellStyles || {};
    const overrides = s.cellTextOverrides || {};
    const cellMerges = s.cellMerges || {};
    const lockedCells = s.lockedCells || {};
    const commentKeys = new Set((s.comments || []).filter(c => !c.resolved && c.cellKey).map(c => c.cellKey));
    const secTableCounter = sharedCounter || new Map();

    root.querySelectorAll('.a4-interactive-block[data-sec-id]').forEach(blk => {
      const secId = blk.dataset.secId;
      blk.querySelectorAll('table.tkm-table').forEach(tbl => {
        const tIdx = secTableCounter.get(secId) || 0;
        secTableCounter.set(secId, tIdx + 1);
        tbl.dataset.tblKey = `${secId}::t${tIdx}`;

        // Kaydedilmiş evrensel sütun genişliklerini uygula (Firma, 2.1, 2.2, Onay vb. dahil)
        const savedColW = s.tableColWidths && s.tableColWidths[tbl.dataset.tblKey];
        if (Array.isArray(savedColW) && savedColW.length > 0) {
          const colsDom = tbl.querySelectorAll('colgroup col');
          savedColW.forEach((w, ci) => {
            if (colsDom[ci] && w > 0) colsDom[ci].style.width = `${w}%`;
          });
        }

        const rows = tbl.querySelectorAll('tr:not(.excel-col-letters)');
        const gridMatrix = [];

        rows.forEach((tr, rIdx) => {
          const cells = Array.from(tr.querySelectorAll('th, td'));
          gridMatrix[rIdx] = cells;
          cells.forEach((cell, cIdx) => {
            const key = `${secId}::t${tIdx}::r${rIdx}::c${cIdx}`;
            cell.dataset.cellKey = key;
            cell.dataset.rowKey = `${secId}::t${tIdx}::r${rIdx}`;
            cell.dataset.colKey = `${secId}::t${tIdx}::c${cIdx}`;
            cell.dataset.rIdx = String(rIdx);
            cell.dataset.cIdx = String(cIdx);

            if (Object.prototype.hasOwnProperty.call(overrides, key) && isCellTextEditable(cell)) {
              setCellDomTextKeepingHandles(cell, overrides[key]);
              cell.dataset.rawValue = String(overrides[key] == null ? '' : overrides[key]);
            } else if (isCellTextEditable(cell) && cell.dataset.rawValue === undefined) {
              cell.dataset.rawValue = getCellEditableText(cell);
            }

            const st = cellStyles[key];
            if (st) {
              if (st.bg) cell.style.setProperty('background-color', st.bg, 'important');
              if (st.color) cell.style.setProperty('color', st.color, 'important');
              if (st.fontFamily) cell.style.setProperty('font-family', st.fontFamily, 'important');
              if (st.fontSize) cell.style.setProperty('font-size', `${st.fontSize}pt`, 'important');
              if (st.bold) cell.style.setProperty('font-weight', '800', 'important');
              if (st.italic) cell.style.setProperty('font-style', 'italic', 'important');
              if (st.underline || st.strike) {
                const dec = [st.underline ? 'underline' : '', st.strike ? 'line-through' : ''].filter(Boolean).join(' ');
                cell.style.setProperty('text-decoration', dec, 'important');
              }
              if (st.uppercase) cell.style.setProperty('text-transform', 'uppercase', 'important');
              if (st.subscript) {
                cell.style.setProperty('vertical-align', 'sub', 'important');
                if (!st.fontSize) cell.style.setProperty('font-size', '5.8pt', 'important');
              } else if (st.superscript) {
                cell.style.setProperty('vertical-align', 'super', 'important');
                if (!st.fontSize) cell.style.setProperty('font-size', '5.8pt', 'important');
              }
              if (st.align) cell.style.setProperty('text-align', st.align, 'important');
              if (st.valign) cell.style.setProperty('vertical-align', st.valign, 'important');
              if (st.wrapText === false) {
                cell.style.setProperty('white-space', 'nowrap', 'important');
                cell.style.setProperty('overflow', 'hidden', 'important');
                cell.style.setProperty('text-overflow', 'ellipsis', 'important');
              }
              if (st.orientation === 'vertical') {
                cell.style.setProperty('writing-mode', 'vertical-rl', 'important');
                cell.style.setProperty('transform', 'rotate(180deg)', 'important');
              }
              if (st.minHeight) cell.style.setProperty('height', `${st.minHeight}px`, 'important');
              if (st.padY != null && st.padY !== '') {
                cell.style.setProperty('padding-top', `${st.padY}px`, 'important');
                cell.style.setProperty('padding-bottom', `${st.padY}px`, 'important');
              }
              if (st.padLeft != null && st.padLeft !== '') {
                cell.style.setProperty('padding-left', `${st.padLeft}px`, 'important');
              }
              if (st.lineHeight) cell.style.setProperty('line-height', `${st.lineHeight}`, 'important');
              if (st.border) cell.style.setProperty('border', st.border, 'important');
              if (st.borderTop) cell.style.setProperty('border-top', st.borderTop, 'important');
              if (st.borderBottom) cell.style.setProperty('border-bottom', st.borderBottom, 'important');
              if (st.borderLeft) cell.style.setProperty('border-left', st.borderLeft, 'important');
              if (st.borderRight) cell.style.setProperty('border-right', st.borderRight, 'important');
            }

            if (lockedCells[key]) cell.classList.add('is-cell-locked');
            if (interactive && StudioState.showCommentMarkers && commentKeys.has(key)) {
              cell.classList.add('has-cell-comment');
            }

            if (interactive) {
              cell.addEventListener('dblclick', (ev) => {
                if (ev.target && ev.target.closest('.col-resize-handle, .row-resize-handle, .a4-click-opt, .a4-click-sym, .tbl-filter-btn, .a4-fill-handle')) return;
                ev.stopPropagation();
                startInlineCellEdit(cell, key);
              });
              cell.addEventListener('contextmenu', (ev) => {
                if (window.__StudioOffice?.openCellContextMenu) {
                  ev.preventDefault();
                  ev.stopPropagation();
                  if (!getSelectedCellKeys().includes(key)) selectCellByKey(key);
                  window.__StudioOffice.openCellContextMenu(ev.clientX, ev.clientY, key);
                }
              });
            }
          });
        });

        // Hücre Birleştirmeleri (Excel Merge & Center)
        gridMatrix.forEach((rowCells, rIdx) => {
          rowCells.forEach((cell, cIdx) => {
            const key = cell.dataset.cellKey;
            const mg = cellMerges[key];
            if (!mg || (!mg.colspan && !mg.rowspan)) return;
            const cs = Math.max(1, Number(mg.colspan || 1));
            const rs = Math.max(1, Number(mg.rowspan || 1));
            if (cs === 1 && rs === 1) return;
            cell.colSpan = cs;
            cell.rowSpan = rs;
            for (let dr = 0; dr < rs; dr++) {
              for (let dc = 0; dc < cs; dc++) {
                if (dr === 0 && dc === 0) continue;
                const covered = gridMatrix[rIdx + dr]?.[cIdx + dc];
                if (covered) {
                  covered.style.display = 'none';
                  covered.dataset.mergedBy = key;
                }
              }
            }
          });
        });

        // Excel Canlı Formül Hesaplama + Sayı Biçimlendirme + Koşullu Biçimlendirme
        if (window.__StudioOffice?.evaluateTableVisuals) {
          window.__StudioOffice.evaluateTableVisuals(tbl, gridMatrix, secId, tIdx, s);
        }
      });
    });

    if (interactive) {
      applySelectionHighlightDom();
    }
  }

  function attachColumnResizeHandles(root, s) {
    const tooltip = document.getElementById('colResizeTooltip');
    const secById = new Map((s.sections || []).map(sec => [sec.id, sec]));

    root.querySelectorAll('th[data-resize-sec][data-resize-col]').forEach(th => {
      const secId = th.dataset.resizeSec;
      const colToken = th.dataset.resizeCol;
      const sec = secById.get(secId);
      if (!sec || sec.type !== 'data_table') return;

      const isNoCol = colToken === '__no__';
      const colIdx = isNoCol ? -1 : Number(colToken);
      const isLast = !isNoCol && colIdx >= sec.columns.length - 1;
      if (isLast) return;

      const handle = document.createElement('div');
      handle.className = 'col-resize-handle';
      handle.title = 'Sütun genişliğini değiştirmek için sürükleyin';
      handle.addEventListener('click', ev => ev.stopPropagation());
      handle.addEventListener('mousedown', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        pushUndoSnapshot();

        const tbl = th.closest('table');
        if (!tbl) return;
        const tableRect = tbl.getBoundingClientRect();
        const tableWidthPx = tableRect.width || 700;
        const startX = ev.clientX;
        const startLeftW = isNoCol ? Number(sec.noColWidth || 4) : Number(sec.columns[colIdx].width || 10);
        const nextIdx = isNoCol ? 0 : colIdx + 1;
        const startRightW = Number(sec.columns[nextIdx].width || 10);
        const combined = startLeftW + startRightW;

        handle.classList.add('dragging');
        if (tooltip) tooltip.classList.remove('hidden');

        const onMove = (moveEv) => {
          const dxPx = moveEv.clientX - startX;
          const deltaPct = (dxPx / tableWidthPx) * 100;
          const minW = 3;
          let newLeft = Math.max(minW, Math.min(combined - minW, startLeftW + deltaPct));
          newLeft = Math.round(newLeft * 10) / 10;
          const newRight = Math.round((combined - newLeft) * 10) / 10;

          if (isNoCol) sec.noColWidth = newLeft;
          else sec.columns[colIdx].width = newLeft;
          sec.columns[nextIdx].width = newRight;

          const colsDom = tbl.querySelectorAll('colgroup col');
          const leftDomIdx = sec.showNoCol ? (isNoCol ? 0 : colIdx + 1) : colIdx;
          const rightDomIdx = leftDomIdx + 1;
          if (colsDom[leftDomIdx]) colsDom[leftDomIdx].style.width = `${newLeft}%`;
          if (colsDom[rightDomIdx]) colsDom[rightDomIdx].style.width = `${newRight}%`;

          if (tooltip) {
            tooltip.textContent = `${newLeft.toFixed(1)}% ↔ ${newRight.toFixed(1)}%`;
            tooltip.style.left = `${moveEv.clientX + 12}px`;
            tooltip.style.top = `${moveEv.clientY - 28}px`;
          }
        };

        const onUp = () => {
          handle.classList.remove('dragging');
          if (tooltip) tooltip.classList.add('hidden');
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          renderAll();
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });

      th.appendChild(handle);
    });
  }

  // GERÇEK DOM ÖLÇÜMLÜ ÇOK SAYFALI A4 SAYFALAMA (10A-PDF-CORE.JS İLE BİREBİR)
  function renderLiveA4() {
    const canvas = document.getElementById('liveA4Canvas');
    const scaler = document.getElementById('liveA4Scaler');
    const scrollArea = document.getElementById('previewScrollArea');
    const s = StudioState.schema;
    if (!canvas || !s) return;

    const prevScrollTop = scrollArea ? scrollArea.scrollTop : 0;
    const prevScrollLeft = scrollArea ? scrollArea.scrollLeft : 0;

    ensureStyleDefaults(s);
    const ds = s.designSettings || DEFAULT_DESIGN_SETTINGS;
    const isLandscape = ds.orientation === 'landscape';
    const blocks = buildBlocksForSchema(s);
    const theme = s.pdfTheme || 'rams_navy';

    // Dinamik @page yönlendirme kuralı
    let dynPageStyle = document.getElementById('studioDynamicPageStyle');
    if (!dynPageStyle) {
      dynPageStyle = document.createElement('style');
      dynPageStyle.id = 'studioDynamicPageStyle';
      document.head.appendChild(dynPageStyle);
    }
    dynPageStyle.textContent = `@page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 0mm; }`;

    let sandbox = document.getElementById('studioMeasureSandbox');
    if (sandbox) sandbox.remove();
    sandbox = document.createElement('div');
    sandbox.id = 'studioMeasureSandbox';
    sandbox.style.cssText = `position:fixed;left:-10000px;top:0;width:${isLandscape ? '297mm' : '210mm'};visibility:hidden;pointer-events:none;z-index:-1;`;
    sandbox.setAttribute('data-pdf-theme', theme);
    applyLayoutCssVarsTo(sandbox, s);
    document.body.appendChild(sandbox);

    const probePage = document.createElement('div');
    probePage.className = `tkm-a4-page${isLandscape ? ' tkm-a4-landscape' : ''}`;
    probePage.setAttribute('data-pdf-theme', theme);
    probePage.innerHTML = `
      ${ds.hideHeader ? '' : buildPageHeaderHtml(s)}
      <div id="stProbeBody" style="flex:0 0 auto;display:block;width:100%;"></div>
      ${ds.hideFooter ? '' : buildPageFooterHtml(s, 1, 1)}
    `;
    sandbox.appendChild(probePage);

    const cs = window.getComputedStyle(probePage);
    const padTop = parseFloat(cs.paddingTop) || 24;
    const padBottom = parseFloat(cs.paddingBottom) || 22;
    const pageInnerH = (probePage.clientHeight || (isLandscape ? 790 : 1120)) - padTop - padBottom;
    const headerH = ds.hideHeader ? 0 : ((probePage.querySelector('.tkm-header')?.offsetHeight || 105) + 4);
    const footerH = ds.hideFooter ? 0 : ((probePage.querySelector('.tkm-footer')?.offsetHeight || 48) + 6);
    const maxBodyH = pageInnerH - headerH - footerH - 6;

    const bodyEl = probePage.querySelector('#stProbeBody');
    const pages = [];
    const sandboxCounter = new Map();

    for (const blk of blocks) {
      if (blk.forceBreak && bodyEl.children.length > 0) {
        pages.push(bodyEl.innerHTML);
        bodyEl.innerHTML = '';
      }
      const el = document.createElement('div');
      el.className = 'tkm-block';
      el.innerHTML = blk.html;
      applySectionStylesToDom(el, s);
      applyCellKeysAndStyles(el, s, false, sandboxCounter);
      bodyEl.appendChild(el);

      if (bodyEl.children.length > 1 && bodyEl.offsetHeight > maxBodyH) {
        bodyEl.removeChild(el);
        pages.push(bodyEl.innerHTML);
        bodyEl.innerHTML = '';
        bodyEl.appendChild(el);
      }
    }
    if (bodyEl.children.length > 0) pages.push(bodyEl.innerHTML);
    sandbox.remove();

    const totalPages = Math.max(1, pages.length);
    const pageBorderCls = (ds.pageBorder && ds.pageBorder !== 'none') ? ` page-border-${ds.pageBorder}` : '';
    const wmHtml = ds.watermarkText
      ? `<div class="tkm-watermark"><span style="color:${escapeHtml(ds.watermarkColor || '#64748b')};opacity:${Number(ds.watermarkOpacity || 0.11)};">${escapeHtml(ds.watermarkText)}</span></div>`
      : '';

    if (scaler) {
      scaler.classList.toggle('is-landscape', isLandscape);
      scaler.classList.toggle('view-twoup', StudioState.viewMode === 'twoup' && !isLandscape);
    }

    canvas.setAttribute('data-pdf-theme', theme);
    applyLayoutCssVarsTo(canvas, s);
    canvas.classList.toggle('painter-cursor', Boolean(StudioState.formatPainterStyle));
    canvas.classList.toggle('view-pagebreak', StudioState.viewMode === 'pagebreak');
    canvas.classList.toggle('show-excel-headers', Boolean(StudioState.showExcelHeaders));
    canvas.classList.toggle('show-fmt-marks', Boolean(StudioState.showFormattingMarks));
    canvas.classList.toggle('show-line-numbers', Boolean(ds.lineNumbers));

    canvas.innerHTML = pages.map((bodyHtml, idx) => `
      <div class="tkm-a4-page${isLandscape ? ' tkm-a4-landscape' : ''}${pageBorderCls}" data-pdf-theme="${escapeHtml(theme)}" data-page-num="${idx + 1}">
        ${wmHtml}
        ${ds.hideHeader ? '' : buildPageHeaderHtml(s)}
        <div class="tkm-page-body">${bodyHtml}</div>
        ${ds.hideFooter ? '' : buildPageFooterHtml(s, idx + 1, totalPages)}
      </div>
    `).join('');

    applySectionStylesToDom(canvas, s);
    applyCellKeysAndStyles(canvas, s, true);
    attachColumnResizeHandles(canvas, s);
    if (window.__StudioOffice?.attachUniversalResizers) {
      window.__StudioOffice.attachUniversalResizers(canvas, s);
    }

    if (scrollArea) {
      scrollArea.scrollTop = prevScrollTop;
      scrollArea.scrollLeft = prevScrollLeft;
    }

    const countEl = document.getElementById('pageCountPill');
    if (countEl) countEl.textContent = `${totalPages} Sayfa A4${isLandscape ? ' (Yatay)' : ''}`;

    if (window.__StudioOffice?.afterRenderA4) {
      window.__StudioOffice.afterRenderA4(totalPages);
    }
  }

  // --------------------------------------------------------------------------
  // 7. WORD CM CETVELİ, ZOOM, fx BAR & KLAVYE KISAYOLLARI
  // --------------------------------------------------------------------------
  function renderWordRuler() {
    const track = document.getElementById('wordRulerTrack');
    if (!track) return;
    let html = '<div id="rulerMarginLeft" class="ruler-margin-shade left"></div><div id="rulerMarginRight" class="ruler-margin-shade right"></div>';
    for (let cm = 1; cm <= 21; cm++) {
      html += `<div class="ruler-cm">${cm}</div>`;
    }
    track.innerHTML = html;
    updateRulerMargins();
  }

  function updateRulerMargins() {
    const s = StudioState.schema;
    if (!s) return;
    ensureStyleDefaults(s);
    const padX = Number(s.layoutStyles.pagePadX || 10.5);
    const pct = Math.max(0, Math.min(25, (padX / 210) * 100));
    const l = document.getElementById('rulerMarginLeft');
    const r = document.getElementById('rulerMarginRight');
    if (l) l.style.width = `${pct.toFixed(2)}%`;
    if (r) r.style.width = `${pct.toFixed(2)}%`;
  }

  function applyZoom() {
    const scaler = document.getElementById('liveA4Scaler');
    const ruler = document.getElementById('wordRulerTrack');
    const lbl = document.getElementById('zoomLabelBtn');
    const slider = document.getElementById('statusZoomSlider');
    const isLand = StudioState.schema?.designSettings?.orientation === 'landscape';
    const baseMm = isLand ? 297 : 210;
    const pct = Math.round(StudioState.zoom * 100);
    if (scaler) scaler.style.transform = `scale(${StudioState.zoom})`;
    if (ruler) ruler.style.width = `${(baseMm * StudioState.zoom).toFixed(2)}mm`;
    if (lbl) lbl.textContent = `${pct}%`;
    if (slider && document.activeElement !== slider) slider.value = String(pct);
  }

  window.setZoomAbsolute = function (z) {
    StudioState.zoom = Math.max(0.45, Math.min(1.4, Math.round(Number(z || 0.9) * 100) / 100));
    applyZoom();
  };

  window.adjustPreviewZoom = function (delta) {
    setZoomAbsolute(StudioState.zoom + delta);
  };

  window.fitPreviewZoom = function () {
    const area = document.getElementById('previewScrollArea');
    if (!area) return;
    const isLand = StudioState.schema?.designSettings?.orientation === 'landscape';
    const isTwoUp = StudioState.viewMode === 'twoup' && !isLand;
    const targetPx = isTwoUp ? 1630 : (isLand ? 1135 : 806);
    const availW = Math.max(320, area.clientWidth - 48);
    StudioState.zoom = Math.max(0.45, Math.min(1.1, Math.floor((availW / targetPx) * 100) / 100));
    applyZoom();
  };

  window.exportCurrentSchemaJson = function () {
    const s = StudioState.schema;
    if (!s) return;
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${sanitizeKey(s.template_key || s.title)}_${s.version_label || 'v1'}.json`;
    a.click();
    showToast('Şablon JSON olarak indirildi');
  };

  window.importSchemaJsonFile = function (input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed || !Array.isArray(parsed.sections)) throw new Error('Geçersiz v2 stüdyo şablon JSON dosyası');
        StudioState.loadedVersionId = null;
        StudioState.schema = parsed;
        ensureStyleDefaults(StudioState.schema);
        StudioState.selectedSectionId = parsed.sections[0]?.id || '';
        StudioState.selectedCellKey = null;
        StudioState.formatPainterStyle = null;
        StudioState.undoStack = [];
        StudioState.redoStack = [];
        populateFamilyAndVersionSelects();
        renderAll();
        showToast('JSON şablonu yüklendi (kaydettiğinizde yeni versiyon oluşur)');
      } catch (err) {
        showToast(`Hata: ${err.message}`);
      }
      input.value = '';
    };
    reader.readAsText(file);
  };

  function bindFormulaBarAndShortcuts() {
    const fxInput = document.getElementById('fxCellInput');
    if (fxInput) {
      let startVal = '';
      let pushed = false;

      fxInput.addEventListener('focus', () => {
        startVal = fxInput.value;
        pushed = false;
        if (fxInput.value.includes('\n')) {
          toggleFormulaBarExpand(true);
        }
      });

      fxInput.addEventListener('input', () => {
        const key = StudioState.selectedCellKey;
        if (!key) return;
        if (StudioState.schema?.sheetProtected && StudioState.schema?.lockedCells?.[key]) {
          showToast('Bu hücre kilitli! Düzenlemek için Gözden Geçir → Korumayı Kaldır seçeneğini kullanın.');
          fxInput.value = startVal;
          return;
        }
        const cellEl = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
        if (!cellEl || !isCellTextEditable(cellEl)) return;
        if (!pushed) {
          pushUndoSnapshot();
          pushed = true;
        }
        setCellDomTextKeepingHandles(cellEl, fxInput.value);
        cellEl.dataset.rawValue = fxInput.value;
        applyCellTextToModel(key, fxInput.value, cellEl);
      });

      fxInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.shiftKey || e.altKey)) {
          if (e.altKey) {
            // Alt+Enter (Excel kısayolu) textarea içine yeni satır ekler
            e.preventDefault();
            const pos = fxInput.selectionStart || 0;
            const end = fxInput.selectionEnd || 0;
            fxInput.value = fxInput.value.slice(0, pos) + '\n' + fxInput.value.slice(end);
            fxInput.selectionStart = fxInput.selectionEnd = pos + 1;
            fxInput.dispatchEvent(new Event('input', { bubbles: true }));
            toggleFormulaBarExpand(true);
          }
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          fxInput.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          const key = StudioState.selectedCellKey;
          fxInput.value = startVal;
          if (key) {
            const cellEl = document.querySelector(`[data-cell-key="${CSS.escape(key)}"]`);
            if (cellEl && isCellTextEditable(cellEl)) {
              setCellDomTextKeepingHandles(cellEl, startVal);
              applyCellTextToModel(key, startVal, cellEl);
            }
          }
          pushed = false;
          fxInput.blur();
        }
      });

      fxInput.addEventListener('blur', () => {
        if (pushed) {
          pushed = false;
          renderAll();
        }
      });
    }

    document.addEventListener('click', (ev) => {
      const pop = document.getElementById('fileMenuPopover');
      const btn = document.getElementById('fileTabBtn');
      if (pop && !pop.classList.contains('hidden')) {
        if (!pop.contains(ev.target) && (!btn || !btn.contains(ev.target))) {
          closeFileMenu();
        }
      }
    });

    document.addEventListener('keydown', (ev) => {
      const tag = (ev.target && ev.target.tagName) ? ev.target.tagName.toUpperCase() : '';
      const isEditingInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(ev.target && ev.target.isContentEditable);
      const mod = ev.ctrlKey || ev.metaKey;

      if (mod && ev.key.toLowerCase() === 's') {
        ev.preventDefault();
        openSaveVersionModal();
        return;
      }

      if (ev.key === 'Escape') {
        if (StudioState.formatPainterStyle) {
          clearFormatPainter();
          showToast('Biçim Boyacısı iptal edildi');
        }
        closeFileMenu();
        ['saveVersionModal', 'versionHistoryModal', 'blueprintsModal', 'brandingModal', 'cloudLoginModal'].forEach(closeModal);
        return;
      }

      if (isEditingInput) return;

      if (mod && ev.key.toLowerCase() === 'z' && !ev.shiftKey) {
        ev.preventDefault();
        studioUndo();
      } else if (mod && (ev.key.toLowerCase() === 'y' || (ev.shiftKey && ev.key.toLowerCase() === 'z'))) {
        ev.preventDefault();
        studioRedo();
      } else if (mod && ev.key.toLowerCase() === 'b' && StudioState.selectedCellKey) {
        ev.preventDefault();
        toggleCellStyleBool('bold');
      } else if (mod && ev.key.toLowerCase() === 'i' && StudioState.selectedCellKey) {
        ev.preventDefault();
        toggleCellStyleBool('italic');
      } else if (mod && ev.key.toLowerCase() === 'u' && StudioState.selectedCellKey) {
        ev.preventDefault();
        toggleCellStyleBool('underline');
      } else if (ev.key === 'F2' && StudioState.selectedCellKey) {
        ev.preventDefault();
        const cell = document.querySelector(`[data-cell-key="${CSS.escape(StudioState.selectedCellKey)}"]`);
        if (cell) startInlineCellEdit(cell, StudioState.selectedCellKey);
      } else if (StudioState.selectedCellKey && !mod && !ev.altKey) {
        const cell = document.querySelector(`[data-cell-key="${CSS.escape(StudioState.selectedCellKey)}"]`);
        if (!cell) return;
        if (ev.key === 'Tab') {
          ev.preventDefault();
          moveCellSelection(0, ev.shiftKey ? -1 : 1, true);
        } else if (ev.key === 'ArrowRight') {
          ev.preventDefault();
          moveCellSelection(0, 1, false);
        } else if (ev.key === 'ArrowLeft') {
          ev.preventDefault();
          moveCellSelection(0, -1, false);
        } else if (ev.key === 'ArrowDown' || ev.key === 'Enter') {
          ev.preventDefault();
          moveCellSelection(1, 0, false);
        } else if (ev.key === 'ArrowUp') {
          ev.preventDefault();
          moveCellSelection(-1, 0, false);
        } else if (ev.key === 'Delete') {
          if (StudioState.schema?.sheetProtected && StudioState.schema?.lockedCells?.[StudioState.selectedCellKey]) {
            ev.preventDefault();
            showToast('Bu hücre kilitli! Silmek için Gözden Geçir → Korumayı Kaldır seçeneğini kullanın.');
            return;
          }
          if (isCellTextEditable(cell) && getCellEditableText(cell) !== '') {
            ev.preventDefault();
            pushUndoSnapshot();
            applyCellTextToModel(StudioState.selectedCellKey, '', cell);
            renderAll();
          }
        } else if (ev.key === 'Backspace') {
          if (isCellTextEditable(cell)) {
            ev.preventDefault();
            startInlineCellEdit(cell, StudioState.selectedCellKey, { replaceWith: '' });
          }
        } else if (ev.key.length === 1 && !ev.repeat) {
          if (isCellTextEditable(cell)) {
            // Do NOT call preventDefault(): focusing contentEditable lets the native browser char event insert the typed character once cleanly (no doubling).
            startInlineCellEdit(cell, StudioState.selectedCellKey, { replaceWith: '' });
          }
        }
      }
    });
  }

  function renderAll() {
    renderNavPane();
    renderDetailPane();
    renderLiveA4();
    syncRibbonInputsFromState();
    syncCellStyleRibbon();
    updateVersionBadge();
    updateUndoRedoButtons();
    updateRulerMargins();
    const pop = document.getElementById('addSectionPopover');
    if (pop) pop.classList.add('hidden');
    if (window.__StudioOffice?.afterRenderAll) {
      window.__StudioOffice.afterRenderAll();
    }
  }

  // Office eklenti motoru (studio-office.js) köprüsü
  window.__Studio = {
    state: StudioState,
    blueprints: BLUEPRINT_CATALOG,
    ensureStyleDefaults,
    pushUndoSnapshot,
    renderAll,
    renderLiveA4,
    renderNavPane,
    renderDetailPane,
    syncRibbonInputsFromState,
    syncCellStyleRibbon,
    applySelectionHighlightDom,
    getSelectedSection,
    getSelectedCellKeys,
    getSectionDisplayName,
    getSectionTypeLabel,
    isCellTextEditable,
    getCellEditableText,
    setCellDomTextKeepingHandles,
    applyCellTextToModel,
    startInlineCellEdit,
    colIndexToExcelLetter,
    formatCellAddress,
    escapeHtml,
    escapeHtmlBr,
    uid,
    showToast,
    applyZoom,
    updateRulerMargins,
    renderWordRuler,
    loadVersionById
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderWordRuler();
    bindFormulaBarAndShortcuts();
    if (window.__StudioOffice?.init) window.__StudioOffice.init();
    initStorageAndLoad().then(() => {
      if (window.__StudioOffice?.onSchemaLoaded) window.__StudioOffice.onSchemaLoaded();
      setTimeout(fitPreviewZoom, 80);
    });
    window.addEventListener('resize', () => {
      clearTimeout(window._stResizeTimer);
      window._stResizeTimer = setTimeout(fitPreviewZoom, 120);
    });
  });
})();
