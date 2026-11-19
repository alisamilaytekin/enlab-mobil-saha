// ============================================================================
// HIZLI RAPOR - 06B-UNIVERSAL-SCHEMA-REGISTRY.JS
// Açıklama: Evrensel Versiyonlu Şema Kayıt Defteri, 29+ Standart Form Şeması,
//           Firma Özelleştirme Yaması (Tenant Overlay), Rapor Şema Mühürleme
//           (Immutable Snapshot) ve Otomatik Kural/Sınır Değer Motoru (v1.0)
// ============================================================================

(function () {
    const TENANT_OVERLAY_STORAGE_KEY = 'enlab_universal_tenant_overlays_v1';
    const DESIGN_TOKENS_STORAGE_KEY = 'enlab_universal_pdf_design_tokens_v1';

    // Varsayılan Kurumsal PDF Tasarım Parametreleri (Design Tokens)
    const DEFAULT_PDF_DESIGN_TOKENS = {
        headerVariant: 'auto',          // 'auto' | 'three_col_logos' | 'rams_banner' | 'corporate_compact'
        footerVariant: 'auto',          // 'auto' | 'boxed_table' | 'rams_strip' | 'minimal_line'
        fieldGridColumns: 'auto',       // 'auto' | 2 | 3
        checklistColumns: 'auto',       // 'auto' | 1 | 2
        signatureColumns: 1,            // 1: Muayene Personeli + QR | 2: + Teknik Yönetici | 3: + İşletme Yetkilisi
        techManagerName: '',
        techManagerTitle: 'Teknik Yönetici / Onaylayan',
        techManagerRegNo: '',
        customerRepTitle: 'İşletme / Firma Yetkilisi',
        pageDensity: 'auto',            // 'auto' (Akıllı 1-Sayfa Sığdırma) | 'normal' | 'compact'
        autoSealOnApprove: true,        // Onaylanan/yüklenen raporun şemasını otomatik mühürle
        docCodePrefixOverride: ''       // Örn: 'ABC-FR.' yazılırsa TKM-FR. yerine otomatik uygulanır
    };

    // ========================================================================
    // 1. STANDART ANA ŞABLON KATALOĞU (MASTER SCHEMAS v1)
    // ========================================================================
    const MASTER_SCHEMAS_V1 = {
        // 2074 - YILDIRIMDAN KORUNMA (PARATONER) TESİSATI
        '2074': {
            templateId: '2074',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.320',
            docNo: 'TKM-FR.320, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'YILDIRIMDAN KORUNMA (PARATONER) TESİSATI PERİYODİK KONTROL RAPORU',
            methods: [
                'TS EN 62305-1..4 Yıldırımdan Korunma Standartları',
                'NF C 17-102 Aktif Yakalama Uçlu Yıldırımdan Korunma Sistemleri',
                'RG, 21.08.2001 - 24500 Elektrik Tesislerinde Topraklamalar Yönetmeliği',
                'RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği'
            ],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'paratoner_tipi', label: 'Yıldırımdan Korunma Sistemi Tipi', type: 'select', options: ['Aktif Paratoner (ESE)', 'Faraday Kafesi', 'Yakalama Çubuğu (Franklin)'], default: 'Aktif Paratoner (ESE)' },
                { key: 'marka_model', label: 'Paratoner Marka / Model / Seri No', type: 'text', presets: ['FOREND / PETEX-M', 'TRIMBOX / ESE', 'LIVA / LAP-DX 250'], default: 'FOREND / PETEX-M' },
                { key: 'koruma_seviyesi', label: 'Yıldırımdan Korunma Seviyesi', type: 'select', options: ['Seviye I (Çok Yüksek)', 'Seviye II (Yüksek)', 'Seviye III (Normal)', 'Seviye IV'], default: 'Seviye I (Çok Yüksek)' },
                { key: 'delta_t', label: 'Ön Uyartım Süresi Δt', type: 'text', unit: 'μs', presets: ['60 μs', '45 μs', '30 μs', '15 μs'], default: '60 μs' },
                { key: 'koruma_yaricapi', label: 'Hesaplanan Koruma Yarıçapı Rp', type: 'text', unit: 'm', presets: ['79 m', '65 m', '50 m', '105 m'], default: '79 m' },
                { key: 'inis_iletkeni', label: 'İniş İletkeni Sayısı, Tipi ve Kesiti', type: 'text', presets: ['2 Adet x 50 mm² Elektrolitik Bakır', '1 Adet x 50 mm² Cu + Koruma Borusu', '30x3.5 mm Galvaniz Şerit'], default: '2 Adet x 50 mm² Elektrolitik Bakır' },
                { key: 'darbe_sayaci', label: 'Yıldırım Darbe Sayacı Durumu / Endeksi', type: 'text', presets: ['Mevcut - Çalışır / 002', 'Mevcut - Çalışır / 000', 'Yok'], negativeValues: ['Yok', 'Arızalı'], default: 'Mevcut / 002' },
                { key: 'direk_yuksekligi', label: 'Yakalama Ucu Direk Yüksekliği', type: 'text', unit: 'm', presets: ['6 m', '5 m', '4 m', '8 m'], default: '6 m' }
            ],
            visualChecks: [
                { id: 'chk_2074_pole', code: 'A', text: 'Yakalama ucu ve direği sağlam, dik, rüzgar gergileri tam ve korozyonsuz durumda mı?', isCritical: true, defect: 'Paratoner yakalama ucu/direk bağlantısında gevşeklik, eğilme veya korozyon tespit edilmiştir.' },
                { id: 'chk_2074_down', code: 'B', text: 'İniş iletkenleri tesis boyunca kesintisiz, keskin dönüşsüz ve kroşelerle sağlam sabitlenmiş mi?', isCritical: true, defect: 'Paratoner iniş iletkenlerinde kopukluk, gevşek kroşe veya uygunsuz bükülme tespit edilmiştir.' },
                { id: 'chk_2074_clamp', code: 'C', text: 'İniş iletkeni üzerinde test/ayırma klemensi mevcut, numaralı ve kolay erişilebilir mi?', isCritical: false, defect: 'Paratoner iniş hattı üzerinde ölçüm ayırma (test) klemensi bulunmamaktadır veya oksitlenmiştir.' },
                { id: 'chk_2074_pipe', code: 'D', text: 'İniş iletkeni zeminden en az 2 metre yüksekliğe kadar darbelere karşı koruyucu boru/muhafaza içinde mi?', isCritical: false, defect: 'Paratoner iniş iletkeninin zeminden ilk 2 metrelik kısmında mekanik koruyucu boru/muhafaza bulunmamaktadır.' },
                { id: 'chk_2074_counter', code: 'E', text: 'Yıldırım darbe sayacı mevcut ve çalışır durumda mı?', isCritical: false, defect: 'Yıldırım darbe sayacı bulunmamaktadır veya test edildiğinde çalışmamaktadır.' },
                { id: 'chk_2074_equip', code: 'F', text: 'Paratoner topraklaması bina eşpotansiyel sistemine (ark boynuzu / parafudr ile) irtibatlandırılmış mı?', isCritical: true, defect: 'Paratoner topraklaması ile bina eşpotansiyel dengeleme barası bağlantısı tesis edilmemiştir.' },
                { id: 'chk_2074_res', code: 'G', text: 'Ölçülen topraklama geçiş direnci standart sınır değerin (≤ 10 Ω) altında mı?', isCritical: true, defect: 'Paratoner topraklama geçiş direnci yönetmelik sınır değeri olan 10 Ω üzerindedir (RE > 10 Ω).' }
            ],
            tableTitle: 'PARATONER İNİŞ İLETKENLERİ VE TOPRAKLAMA ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'no', label: 'İniş No', width: '9%', default: '1' },
                { key: 'location', label: 'Test Klemensi / Ölçüm Noktası Yeri', width: '31%', default: 'Bina Kuzey Cephe 1 No\'lu İniş Test Klemensi' },
                { key: 'conductor', label: 'İniş İletkeni Kesiti', width: '16%', presets: ['2x50 mm² Cu', '50 mm² Cu', '30x3.5 Galv.'], default: '2x50 mm² Cu' },
                { key: 'continuity', label: 'Süreklilik (Ω)', width: '13%', default: '0.06' },
                { key: 're_ohm', label: 'Ölçülen RE (Ω)', width: '14%', default: '2.85', limitRule: { operator: '<=', max: 10, targetCol: 'result' } },
                { key: 'limit_ohm', label: 'Sınır (Ω)', width: '9%', default: '≤ 10 Ω' },
                { key: 'result', label: 'Sonuç', width: '8%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { no: '1', location: 'Bina Kuzey Cephe 1 No\'lu İniş Test Klemensi', conductor: '2x50 mm² Cu', continuity: '0.06', re_ohm: '2.85', limit_ohm: '≤ 10 Ω', result: 'Uygun' }
            ]
        },

        // 2042 - YANGIN ALGILAMA VE UYARI SİSTEMLERİ
        '2042': {
            templateId: '2042',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.322',
            docNo: 'TKM-FR.322, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'YANGIN ALGILAMA VE UYARI SİSTEMİ PERİYODİK KONTROL RAPORU',
            methods: [
                'Binaların Yangından Korunması Hakkında Yönetmelik',
                'TS EN 54-1..14 Yangın Algılama ve Yangın Alarm Sistemleri',
                'RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği'
            ],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'santral_marka', label: 'Yangın Santrali Marka / Model', type: 'text', presets: ['MAVİGARD', 'TEKNİM', 'BOSCH', 'HONEYWELL / NOTIFIER'], default: 'MAVİGARD / TEKNİM' },
                { key: 'santral_tipi', label: 'Santral Tipi', type: 'select', options: ['Adresli Sistem', 'Konvansiyonel Sistem'], default: 'Adresli Sistem' },
                { key: 'loop_bolge_sayisi', label: 'Loop / Bölge Sayısı', type: 'text', presets: ['1 Loop / 32 Adres', '2 Loop / 64 Adres', '4 Loop', '8 Bölge Konvansiyonel'], default: '2 Loop / 48 Adres' },
                { key: 'besleme_aku', label: 'Şebeke Beslemesi ve Yedek Akü Kapasitesi', type: 'text', presets: ['230V AC / 2x12V 7Ah Akü', '230V AC / 2x12V 12Ah Akü'], default: '230V AC / 2x12V 7Ah Bakımsız Akü' },
                { key: 'santral_yeri', label: 'Santralin Bulunduğu Yer', type: 'text', presets: ['Güvenlik / Danışma Odası', 'Zemin Kat Giriş Holü', 'Teknik Oda'], default: 'Güvenlik / Danışma Odası' },
                { key: 'kablo_tipi', label: 'Yangın Tesisat Kablo Tipi', type: 'text', presets: ['JE-H(St)H FE180 PH120 Halojensiz', 'LIH(St)H Halojensiz'], default: 'JE-H(St)H FE180 PH120 Halojensiz' }
            ],
            visualChecks: [
                { id: 'chk_2042_loc', code: 'A', text: 'Yangın ihbar santrali sürekli gözetim altındaki bir mahalde tesis edilmiş mi?', isCritical: false, defect: 'Yangın algılama santrali sürekli personel gözetimi bulunan bir mahalde yer almamaktadır.' },
                { id: 'chk_2042_fault', code: 'B', text: 'Santral üzerinde hata (Fault) veya devre dışı (Disable) uyarısı bulunmuyor mu?', isCritical: true, defect: 'Yangın ihbar santrali üzerinde aktif arıza (Fault) / hat kopukluğu uyarısı bulunmaktadır.' },
                { id: 'chk_2042_bat', code: 'C', text: 'Şebeke enerjisi kesildiğinde yedek aküler sistemi kesintisiz besliyor mu?', isCritical: true, defect: 'Yangın santrali yedek aküleri arızalı/zayıf olup şebeke kesintisinde sistemi besleyememektedir.' },
                { id: 'chk_2042_btn', code: 'D', text: 'Yangın ihbar butonları kaçış yollarında, yerden 1.1 - 1.4 m yükseklikte ve engelsiz erişilebilir mi?', isCritical: true, defect: 'Yangın ihbar butonlarının önü kapatılmış veya montaj yüksekliği standart dışıdır.' },
                { id: 'chk_2042_det', code: 'E', text: 'Duman ve ısı dedektörleri aktif, temiz ve koruyucu toz kapakları çıkarılmış durumda mı?', isCritical: true, defect: 'Bazı duman dedektörlerinin üzerinde montaj toz kapağı unutulmuş veya dedektörler devre dışıdır.' },
                { id: 'chk_2042_siren', code: 'F', text: 'Sesli ve ışıklı uyarıcılar (siren/flaşör) tesisin her noktasından duyulabilir (>65 / >75 dBA) düzeyde mi?', isCritical: true, defect: 'Yangın alarm sirenlerinin ses seviyesi ortam gürültüsünün üzerinde (min. 65-75 dBA) duyulabilir değildir.' },
                { id: 'chk_2042_scen', code: 'G', text: 'Yangın senaryosu (havalandırma kapatma, asansör, acil kapı serbest bırakma) çalışıyor mu?', isCritical: false, defect: 'Yangın anında devreye girmesi gereken otomasyon/acil durum kontrol röleleri aktif değildir.' }
            ],
            tableTitle: 'YANGIN ALGILAMA ELEMANLARI VE FONKSİYON TEST TABLOSU',
            tableColumns: [
                { key: 'zone', label: 'Bölge / Loop', width: '18%', default: 'Loop 1 - Adres 01' },
                { key: 'device_type', label: 'Cihaz Tipi', width: '24%', options: ['Optik Duman Dedektörü', 'Sıcaklık Dedektörü', 'Yangın İhbar Butonu', 'Siren / Flaşör', 'Gaz Dedektörü', 'Santral Akü Testi'], default: 'Optik Duman Dedektörü' },
                { key: 'location', label: 'Bulunduğu Mahal', width: '24%', default: 'İdari Ofis / Koridor' },
                { key: 'measured', label: 'Test / Ölçüm Değeri', width: '22%', default: 'Test Gazı ile Alarm Verdi (4 sn)' },
                { key: 'result', label: 'Sonuç', width: '12%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { zone: 'Loop 1 - Adres 01', device_type: 'Optik Duman Dedektörü', location: 'Ana Çalışma Alanı', measured: 'Test Gazı ile Alarm Verdi (4 sn)', result: 'Uygun' },
                { zone: 'Loop 1 - Adres 12', device_type: 'Yangın İhbar Butonu', location: 'Acil Çıkış Kapısı Yanı', measured: 'Test Anahtarı ile Alarm Verdi', result: 'Uygun' },
                { zone: 'Siren Çıkışı 1', device_type: 'Siren / Flaşör', location: 'Koridor / Hol', measured: '84.5 dBA (Ortam: 52 dBA)', result: 'Uygun' },
                { zone: 'Güç Kaynağı', device_type: 'Santral Akü Testi', location: 'Yangın Santrali İçi', measured: '27.2 V DC (Yedek Enerji Aktif)', result: 'Uygun' }
            ]
        },

        // 2139 - REAKTİF GÜÇ KOMPANZASYON SİSTEMLERİ
        '2139': {
            templateId: '2139',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.323',
            docNo: 'TKM-FR.323, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'REAKTİF GÜÇ KOMPANZASYON PANOSU PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628', 'TS HD 60364-6', 'TS EN 60831-1 Alçak Gerilim Şönt Güç Kondansatörleri'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'role_marka', label: 'Reaktif Güç Kontrol Rölesi Marka / Model', type: 'text', presets: ['ENTES RGP-12SR', 'KAEL VARKOM', 'SCHNEIDER VARLOGIC'], default: 'ENTES RGP-12SR' },
                { key: 'kademe_sayisi', label: 'Kademe Sayısı', type: 'text', presets: ['12 Kademe', '18 Kademe', '8 Kademe + SVC'], default: '12 Kademe' },
                { key: 'toplam_guc', label: 'Toplam Kompanzasyon Gücü', type: 'text', unit: 'kVAr', presets: ['50 kVAr', '100 kVAr', '150 kVAr', '250 kVAr'], default: '150 kVAr' },
                { key: 'enduktif_oran', label: 'Endüktif / Kapasitif Ceza Oranları (%)', type: 'text', default: 'Endüktif: %4.2 / Kapasitif: %1.8 (Uygun)' },
                { key: 'harmonik_filtre', label: 'Harmonik Filtre / Şönt Reaktör Durumu', type: 'select', options: ['Var', 'Yok'], negativeValues: [], default: 'Var' },
                { key: 'cos_phi', label: 'Ölçülen Güç Faktörü (Cos φ)', type: 'text', presets: ['0.99 İndüktif', '0.98 İndüktif', '1.00'], default: '0.99 İndüktif' }
            ],
            visualChecks: [
                { id: 'chk_2139_relay', code: 'A', text: 'Reaktif güç kontrol rölesi ekranı ve kademe LED\'leri aktif çalışıyor mu?', isCritical: true, defect: 'Reaktif güç kontrol rölesi arızalıdır veya kademeleri otomatik devreye almamaktadır.' },
                { id: 'chk_2139_cap', code: 'B', text: 'Kondansatörlerde şişme, yağ sızıntısı veya deformasyon yok mu?', isCritical: true, defect: 'Kompanzasyon kondansatörlerinde şişme/deformasyon tespit edilmiş olup yenilenmelidir.' },
                { id: 'chk_2139_disc', code: 'C', text: 'Kondansatör deşarj dirençleri bağlı ve sağlam mı?', isCritical: false, defect: 'Kondansatör deşarj dirençleri eksik veya kopuk durumdadır.' },
                { id: 'chk_2139_cont', code: 'D', text: 'Kompanzasyon kontaktörlerinde ark/kontak yapışması veya aşırı ısınma yok mu?', isCritical: true, defect: 'Kompanzasyon kontaktörlerinde kontak yapışması ve aşırı ısınma tespit edilmiştir.' },
                { id: 'chk_2139_fan', code: 'E', text: 'Pano havalandırma fanı, filtresi ve termostatı çalışır durumda mı?', isCritical: false, defect: 'Kompanzasyon panosu soğutma fanı çalışmamaktadır veya filtreleri tıkalıdır.' },
                { id: 'chk_2139_pe', code: 'F', text: 'Pano kapak ve gövde topraklaması uygun mu?', isCritical: true, defect: 'Kompanzasyon panosu gövde/kapak topraklama bağlantısı eksiktir.' }
            ],
            tableTitle: 'KOMPANZASYON KADEMELERİ AKIM VE TERMAL ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'step', label: 'Kademe No', width: '15%', default: 'Kademe 1' },
                { key: 'power', label: 'Kademe Gücü (kVAr)', width: '18%', default: '10 kVAr' },
                { key: 'fuse', label: 'NH / Sigorta (A)', width: '15%', default: '25 A' },
                { key: 'current', label: 'Çekilen Faz Akımları L1/L2/L3 (A)', width: '26%', default: '14.2 / 14.1 / 14.3 A' },
                { key: 'temp', label: 'Termal Sıcaklık (°C)', width: '14%', default: '36 °C', limitRule: { operator: '<=', max: 70, targetCol: 'result' } },
                { key: 'result', label: 'Sonuç', width: '12%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { step: 'Kademe 1', power: '5 kVAr', fuse: '16 A', current: '7.1 / 7.2 / 7.1 A', temp: '34 °C', result: 'Uygun' },
                { step: 'Kademe 2', power: '10 kVAr', fuse: '25 A', current: '14.4 / 14.2 / 14.3 A', temp: '38 °C', result: 'Uygun' },
                { step: 'Kademe 3 (SVC)', power: '15 kVAr', fuse: '32 A', current: '21.5 / 21.4 / 21.6 A', temp: '41 °C', result: 'Uygun' }
            ]
        },

        // 2203 - TRANSFORMATÖR 1-36kV (YG) GÖZLE KONTROL VE TOPRAKLAMA
        '2203': {
            templateId: '2203',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.327',
            docNo: 'TKM-FR.327, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'YÜKSEK GERİLİM (1-36 kV) TRANSFORMATÖR MERKEZİ PERİYODİK KONTROL RAPORU',
            methods: [
                'RG, 30.11.2000 - 24246 Elektrik Kuvvetli Akım Tesisleri Yönetmeliği',
                'RG, 21.08.2001 - 24500 Elektrik Tesislerinde Topraklamalar Yönetmeliği',
                'RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği',
                'TS EN 60076 Güç Transformatörleri Standartları'
            ],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'trafo_marka', label: 'Trafo Marka / İmal Yılı / Seri No', type: 'text', presets: ['BEST / 2021', 'ASTOR / 2022', 'ELTAŞ / 2020', 'ABB / 2019'], default: 'ASTOR / 2022' },
                { key: 'trafo_tipi', label: 'Transformatör Tipi ve Soğutma Şekli', type: 'select', options: ['Hermetik Yağlı Tip (ONAN)', 'Genleşme Depolu Yağlı Tip', 'Kuru Tip (Cast Resin - AN/AF)'], default: 'Hermetik Yağlı Tip (ONAN)' },
                { key: 'guc_kva', label: 'Nominal Güç', type: 'text', unit: 'kVA', presets: ['400 kVA', '630 kVA', '1000 kVA', '1250 kVA', '1600 kVA', '2000 kVA'], default: '1000 kVA' },
                { key: 'gerilim_orani', label: 'Primer / Sekonder Gerilim (kV / V)', type: 'text', presets: ['34.5 / 0.4 kV', '15.8 / 0.4 kV', '10.5 / 0.4 kV'], default: '34.5 / 0.4 kV' },
                { key: 'baglanti_grubu', label: 'Bağlantı Grubu / Uk (%)', type: 'text', presets: ['Dyn11 / %6', 'Dyn11 / %4.5', 'Yzn11 / %4'], default: 'Dyn11 / %6' },
                { key: 'kademe', label: 'Kademe Şalteri Konumu', type: 'select', options: ['Kademe 1', 'Kademe 2', 'Kademe 3 (Nominal)', 'Kademe 4', 'Kademe 5'], default: 'Kademe 3 (Nominal)' },
                { key: 'isletme_sorumlusu', label: 'YG İşletme Sorumlusu Sözleşmesi', type: 'select', options: ['Var', 'Yok'], negativeValues: ['Yok'], default: 'Var' },
                { key: 'hucre_tipi', label: 'OG Hücre Tipi', type: 'select', options: ['Metal Enclosed Modüler Hücre (SF6)', 'Metal Clad Hücre', 'Açık Tip OG Hücre'], default: 'Metal Enclosed Modüler Hücre (SF6)' }
            ],
            visualChecks: [
                { id: 'chk_2203_room', code: 'A', text: 'Trafo ve OG hücre odası kapısı kilitli, ölüm tehlikesi levhası var ve dışarıya doğru açılıyor mu?', isCritical: true, defect: 'Trafo merkezi kapısında standart YG tehlike levhası veya kilit mekanizması eksiktir.' },
                { id: 'chk_2203_equip', code: 'B', text: 'Trafo merkezinde YG izole eldiven (36 kV), izole sehpa, ıstanka ve OG yangın tüpü mevcut mu?', isCritical: true, defect: 'Trafo merkezinde kişisel koruyucu YG ekipmanları (36 kV eldiven, izole sehpa, ıstanka) eksiktir.' },
                { id: 'chk_2203_oil', code: 'C', text: 'Trafo kazanında, buşinglerde ve radyatörlerde yağ kaçağı veya silikajel bozulması yok mu?', isCritical: true, defect: 'Transformatör kazan/buşing bağlantılarında yağ sızıntısı tespit edilmiştir.' },
                { id: 'chk_2203_prot', code: 'D', text: 'Buchholz, Hermetik koruma (DGPT2) veya sıcaklık koruma rölesi bağlantıları aktif ve hatasız mı?', isCritical: true, defect: 'Trafo koruma rölesi (DGPT2 / Termometre) alarm veya açma bağlantılarında arıza mevcuttur.' },
                { id: 'chk_2203_earthing', code: 'E', text: 'Trafo koruma (gövde) ve işletme (nötr yıldız noktası) topraklamaları uygun kesitte yapılmış mı?', isCritical: true, defect: 'Trafo gövde koruma veya AG nötr işletme topraklaması yönetmeliğe uygun tesis edilmemiştir.' },
                { id: 'chk_2203_mesh', code: 'F', text: 'Havalandırma panjurlarında haşere/kuş girişini önleyen tel kafes mevcut ve sağlam mı?', isCritical: false, defect: 'Trafo odası havalandırma menfezlerinde koruyucu tel kafes bulunmamaktadır.' },
                { id: 'chk_2203_thermal', code: 'G', text: 'OG/AG buşing ve bara bağlantılarında termal kamera ile aşırı ısınma tespit edilmedi mi?', isCritical: true, defect: 'Trafo AG/OG buşing bağlantılarında termal kamera ile kontak ısınması tespit edilmiştir.' }
            ],
            tableTitle: 'TRANSFORMATÖR TOPRAKLAMA, SICAKLIK VE ELEKTRİKSEL ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'point', label: 'Ölçüm Noktası / Parametre', width: '32%' },
                { key: 'conductor', label: 'İletken / Detay', width: '20%' },
                { key: 'measured', label: 'Ölçülen Değer', width: '20%' },
                { key: 'limit', label: 'Sınır / Referans', width: '16%' },
                { key: 'result', label: 'Sonuç', width: '12%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { point: 'Trafo Gövde Koruma Topraklaması', conductor: '50 mm² Cu', measured: '0.85 Ω', limit: '≤ 2.0 Ω', result: 'Uygun' },
                { point: 'Trafo AG Nötr İşletme Topraklaması', conductor: '95 mm² Cu', measured: '0.72 Ω', limit: '≤ 2.0 Ω', result: 'Uygun' },
                { point: 'OG Hücre Gövde & Ayırıcı Topraklaması', conductor: '50 mm² Cu', measured: '0.90 Ω', limit: '≤ 2.0 Ω', result: 'Uygun' },
                { point: 'AG Buşing Termal Sıcaklık (L1/L2/L3/N)', conductor: 'Termal Kamera', measured: '48.2 °C', limit: '≤ 70 °C', result: 'Uygun' }
            ]
        },

        // 1668 - ACİL AYDINLATMA VE YÖNLENDİRME SİSTEMLERİ
        '1668': {
            templateId: '1668',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.328',
            docNo: 'TKM-FR.328, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'ACİL DURUM AYDINLATMA VE YÖNLENDİRME SİSTEMLERİ PERİYODİK KONTROL RAPORU',
            methods: [
                'Binaların Yangından Korunması Hakkında Yönetmelik (Madde 70-73)',
                'TS EN 1838 Aydınlatma Uygulamaları - Acil Durum Aydınlatması',
                'TS EN 50172 Acil Durum Kaçış Aydınlatma Sistemleri'
            ],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'sistem_tipi', label: 'Acil Aydınlatma Besleme Tipi', type: 'select', options: ['Kendinden Bataryalı (Kitli) Armatürler', 'Merkezi Batarya / UPS Beslemeli', 'Karma Sistem'], default: 'Kendinden Bataryalı (Kitli) Armatürler' },
                { key: 'calisma_suresi', label: 'Standart Aydınlatma Süresi', type: 'select', options: ['En az 60 Dakika', 'En az 120 Dakika (Yüksek Tehlike)', 'En az 180 Dakika'], default: 'En az 60 Dakika' },
                { key: 'armatur_adedi', label: 'Kontrol Edilen Armatür / Yönlendirme Adedi', type: 'text', default: 'Tesis Geneli Kaçış Yolları' },
                { key: 'min_aydinlik', label: 'Yönetmelik Min. Aydınlık Kriteri', type: 'text', default: 'Kaçış Yolu ≥ 1 Lux (Riskli Alan ≥ 15 Lux)' }
            ],
            visualChecks: [
                { id: 'chk_1668_poweroff', code: 'A', text: 'Normal aydınlatma enerjisi kesildiğinde acil aydınlatma armatürleri anında devreye giriyor mu?', isCritical: true, defect: 'Şebeke kesintisi testinde bazı acil aydınlatma armatürlerinin bataryası devreye girmemiştir.' },
                { id: 'chk_1668_exit', code: 'B', text: 'Acil çıkış yönlendirme levhaları tüm kaçış koridorlarından ve kapı üstlerinden net görülüyor mu?', isCritical: true, defect: 'Kaçış güzergahında acil çıkış yönlendirme armatürü eksik veya görüşü engellenmiş durumdadır.' },
                { id: 'chk_1668_lux', code: 'C', text: 'Kaçış yolları merkez hattında zemin aydınlık düzeyi en az 1 Lux (pano önlerinde ≥ 5 Lux) sağlıyor mu?', isCritical: true, defect: 'Acil durumda ölçülen aydınlık seviyesi standart sınır değer olan 1 Lux\'ün altındadır.' },
                { id: 'chk_1668_led', code: 'D', text: 'Armatürlerin üzerindeki yeşil şarj gösterge LED\'leri aktif yanıyor mu?', isCritical: false, defect: 'Acil durum armatürlerinde şarj LED\'i yanmayan (batarya ömrü bitmiş) üniteler tespit edilmiştir.' },
                { id: 'chk_1668_duration', code: 'E', text: 'Batarya kapasitesi en az 60 dakika süreyle aydınlatmayı sürdürebilecek durumda mı?', isCritical: true, defect: 'Acil aydınlatma bataryaları 60 dakikalık deşarj süresini tamamlayamamaktadır.' }
            ],
            tableTitle: 'ACİL AYDINLATMA VE YÖNLENDİRME ARMATÜRLERİ ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'no', label: 'No', width: '8%', default: '1' },
                { key: 'location', label: 'Bulunduğu Mahal / Kaçış Yolu', width: '28%', default: 'Zemin Kat Acil Çıkış Koridoru' },
                { key: 'fixture_type', label: 'Armatür Tipi', width: '24%', options: ['Acil Aydınlatma Spotu', 'Acil Çıkış Yönlendirme (EXIT)', 'Acil Kitli LED Panel'], default: 'Acil Çıkış Yönlendirme (EXIT)' },
                { key: 'lux_val', label: 'Ölçülen Aydınlık (Lux)', width: '16%', default: '4.8 Lux' },
                { key: 'limit_lux', label: 'Sınır (Lux)', width: '12%', default: '≥ 1.0 Lux' },
                { key: 'result', label: 'Sonuç', width: '12%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { no: '1', location: 'Zemin Kat Ana Kaçış Koridoru', fixture_type: 'Acil Çıkış Yönlendirme (EXIT)', lux_val: '4.8 Lux', limit_lux: '≥ 1.0 Lux', result: 'Uygun' },
                { no: '2', location: 'Ana Elektrik Pano Odası Önü', fixture_type: 'Acil Kitli LED Panel', lux_val: '18.5 Lux', limit_lux: '≥ 5.0 Lux', result: 'Uygun' },
                { no: '3', location: 'Yangın Merdiveni Sahanlığı', fixture_type: 'Acil Aydınlatma Spotu', lux_val: '6.2 Lux', limit_lux: '≥ 1.0 Lux', result: 'Uygun' }
            ]
        },

        // 2204 - AKÜMÜLATÖR / KESİNTİSİZ GÜÇ KAYNAĞI (UPS)
        '2204': {
            templateId: '2204',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.329',
            docNo: 'TKM-FR.329, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'KESİNTİSİZ GÜÇ KAYNAĞI (UPS) VE AKÜ GRUBU PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628', 'TS EN IEC 62040-1..3 Kesintisiz Güç Sistemleri (KGS / UPS)', 'TS HD 60364-6'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'marka_model', label: 'UPS Marka / Model / Seri No', type: 'text', presets: ['MAKELSAN', 'INFORM', 'EATON', 'APC / SCHNEIDER', 'TESCOM'], default: 'MAKELSAN / Online UPS' },
                { key: 'guc_kva', label: 'Nominal Güç', type: 'text', unit: 'kVA', presets: ['10 kVA', '20 kVA', '30 kVA', '40 kVA', '60 kVA', '100 kVA'], default: '20 kVA' },
                { key: 'faz_yapisi', label: 'Giriş / Çıkış Faz Yapısı', type: 'select', options: ['3 Faz Giriş / 3 Faz Çıkış (3/3)', '3 Faz Giriş / 1 Faz Çıkış (3/1)', '1 Faz Giriş / 1 Faz Çıkış (1/1)'], default: '3 Faz Giriş / 3 Faz Çıkış (3/3)' },
                { key: 'aku_adedi', label: 'Akü Sayısı ve Kapasitesi', type: 'text', presets: ['32 Adet x 12V 7Ah VRLA', '32 Adet x 12V 9Ah VRLA', '40 Adet x 12V 18Ah VRLA'], default: '32 Adet x 12V 9Ah VRLA' },
                { key: 'destek_suresi', label: 'Tam Yükte Yedekleme Süresi (Dk)', type: 'text', default: '15 - 20 Dakika' },
                { key: 'yuk_orani', label: 'Mevcut Çalışma Yük Oranı (%)', type: 'text', default: '%42' }
            ],
            visualChecks: [
                { id: 'chk_2204_online', code: 'A', text: 'UPS Online (Normal Inverter) modunda hatasız ve alarmsız çalışıyor mu?', isCritical: true, defect: 'UPS üzerinde arıza/bypass uyarısı mevcut olup normal inverter modunda çalışmamaktadır.' },
                { id: 'chk_2204_bat', code: 'B', text: 'Akü kabini ve akülerde şişme, sızıntı, kutup başı oksitlenmesi veya aşırı ısınma yok mu?', isCritical: true, defect: 'UPS akü grubunda şişmiş/oksitlenmiş aküler tespit edilmiştir.' },
                { id: 'chk_2204_test', code: 'C', text: 'Şebeke kesintisi simülasyonunda UPS kesintisiz olarak akü moduna geçiyor mu?', isCritical: true, defect: 'Şebeke enerjisi kesildiğinde UPS yükü tutamamakta veya kapanmaktadır.' },
                { id: 'chk_2204_bypass', code: 'D', text: 'Statik ve manuel bakım bypass şalteri sağlam ve etiketli mi?', isCritical: false, defect: 'UPS bakım bypass şalteri etiketlemesi ve kullanım talimatı eksiktir.' },
                { id: 'chk_2204_vent', code: 'E', text: 'UPS odası havalandırması/kliması çalışıyor (ortam 20-25 °C) ve gövde topraklaması uygun mu?', isCritical: false, defect: 'UPS mahalli ortam sıcaklığı akü ömrü için sınır değer olan 25 °C\'nin üzerindedir.' }
            ],
            tableTitle: 'UPS GİRİŞ / ÇIKIŞ VE AKÜ GRUBU ELEKTRİKSEL ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'param', label: 'Ölçülen Parametre', width: '34%' },
                { key: 'l1_val', label: 'L1 / Değer 1', width: '18%' },
                { key: 'l2_val', label: 'L2 / Değer 2', width: '18%' },
                { key: 'l3_val', label: 'L3 / Referans', width: '18%' },
                { key: 'result', label: 'Sonuç', width: '12%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { param: 'Giriş Şebeke Gerilimi (V AC) / Frekans', l1_val: '231 V', l2_val: '230 V', l3_val: '232 V / 50.0 Hz', result: 'Uygun' },
                { param: 'Çıkış Inverter Gerilimi (V AC) / Frekans', l1_val: '230.0 V', l2_val: '230.1 V', l3_val: '230.0 V / 50.0 Hz', result: 'Uygun' },
                { param: 'Çıkış Yük Akımı (A) / Yük (%)', l1_val: '11.4 A', l2_val: '10.8 A', l3_val: '11.1 A (%42)', result: 'Uygun' },
                { param: 'DC Bara Tampon Şarj / Deşarj Gerilimi', l1_val: '436 V DC (Şarj)', l2_val: '398 V DC (Yükte)', l3_val: 'Termal: 28 °C', result: 'Uygun' }
            ]
        },

        // 2141 - ELEKTRİKLİ ARAÇ ŞARJ İSTASYONLARI
        '2141': {
            templateId: '2141',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.330',
            docNo: 'TKM-FR.330, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'ELEKTRİKLİ ARAÇ ŞARJ İSTASYONU PERİYODİK KONTROL RAPORU',
            methods: ['TS HD 60364-7-722 Elektrikli Araçların Beslenmesi', 'TS EN IEC 61851-1 Elektrikli Araç İletken Şarj Sistemleri', 'RG, 25.04.2013 - 28628'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'marka_model', label: 'Şarj Ünitesi Marka / Model', type: 'text', presets: ['ZES / VESTEL EVC04', 'ABB TERRA AC/DC', 'SCHNEIDER EVlink', 'WALLBOX'], default: 'VESTEL EVC04' },
                { key: 'sarj_tipi', label: 'Şarj Tipi ve Soket Yapısı', type: 'select', options: ['AC Tip-2 (Mod 3 - 22 kW)', 'DC Hızlı Şarj CCS2 (Mod 4)', 'AC + DC Kombine'], default: 'AC Tip-2 (Mod 3 - 22 kW)' },
                { key: 'guc_akim', label: 'Nominal Güç / Anma Akımı', type: 'text', presets: ['22 kW / 3x32 A', '11 kW / 3x16 A', '60 kW DC', '120 kW DC'], default: '22 kW / 3x32 A' },
                { key: 'rcd_tipi', label: 'Kaçak Akım Koruması (RCD)', type: 'select', options: ['Tip B RCD (30 mA AC + 6 mA DC)', 'Tip A RCD + 6 mA RDC-DD', 'Uygunsuz / Yok'], negativeValues: ['Uygunsuz / Yok'], default: 'Tip B RCD (30 mA AC + 6 mA DC)' },
                { key: 'besleme_kablosu', label: 'Besleme Kablosu Kesiti / Sigorta', type: 'text', default: '5x6 mm² NYY / 4x40 A C Tipi' },
                { key: 'ip_koruma', label: 'IP / IK Koruma Sınıfı', type: 'text', default: 'IP54 / IK10' }
            ],
            visualChecks: [
                { id: 'chk_2141_rcd', code: 'A', text: 'Her şarj bağlantı noktası DC kaçak akım korumalı (Tip B veya Tip A + 6 mA DC) bireysel RCD ile korunuyor mu?', isCritical: true, defect: 'Şarj istasyonu beslemesinde TS HD 60364-7-722 gereği DC kaçak akım korumalı (Tip B veya 6 mA RDC-DD) RCD bulunmamaktadır.' },
                { id: 'chk_2141_socket', code: 'B', text: 'Şarj kablosu, tabancası (soket pinleri) ve izolasyonunda kırık/aşınma yok mu?', isCritical: true, defect: 'Şarj tabancası veya kablo izolasyonunda fiziksel hasar tespit edilmiştir.' },
                { id: 'chk_2141_barrier', code: 'C', text: 'Ünite araç çarpmasına karşı koruyucu bariyer/stoper ile korunmuş ve sağlam sabitlenmiş mi?', isCritical: false, defect: 'Şarj ünitesi önünde araç çarpmasına karşı mekanik stoper/bariyer bulunmamaktadır.' },
                { id: 'chk_2141_estop', code: 'D', text: 'Acil durdurma butonu, PE sürekliliği ve kullanım talimatları mevcut mu?', isCritical: true, defect: 'Şarj ünitesi koruma iletkeni (PE) sürekliliği veya acil durdurma fonksiyonu uygun değildir.' }
            ],
            tableTitle: 'ŞARJ İSTASYONU ELEKTRİKSEL VE FONKSİYON TEST TABLOSU',
            tableColumns: [
                { key: 'test_item', label: 'Test / Ölçüm Kalemi', width: '34%' },
                { key: 'measured', label: 'Ölçülen Değer', width: '24%' },
                { key: 'reference', label: 'Sınır / Kriter', width: '26%' },
                { key: 'result', label: 'Sonuç', width: '16%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { test_item: 'PE Koruma İletkeni Sürekliliği (Rpe)', measured: '0.07 Ω', reference: '≤ 0.20 Ω', result: 'Uygun' },
                { test_item: 'Çevrim Empedansı (Zs) / Kısa Devre Akımı', measured: '0.42 Ω / 547 A', reference: 'Ia Açma Sınırında', result: 'Uygun' },
                { test_item: 'RCD Açma Akımı (IΔn) ve Süresi (tΔn)', measured: '24 mA / 28 ms (6 mA DC Aktif)', reference: '≤ 30 mA / ≤ 300 ms', result: 'Uygun' },
                { test_item: 'CP (Control Pilot) Durum A->B->C->Açma Simülasyonu', measured: 'Başarılı / Kilitlendi', reference: 'TS EN 61851-1', result: 'Uygun' }
            ]
        },

        // 1851 - KATODİK KORUMA TESİSATI
        '1851': {
            templateId: '1851',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.326',
            docNo: 'TKM-FR.326, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'KATODİK KORUMA TESİSATI PERİYODİK KONTROL VE ÖLÇÜM RAPORU',
            methods: ['TS EN 12954 Katodik Koruma - Gömülü veya Suya Daldırılmış Metalik Yapılar', 'TS EN 13636 Gömülü Metalik Tankların Katodik Koruması', 'RG, 25.04.2013 - 28628'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'korunan_yapi', label: 'Korunan Metalik Yapı / Tank', type: 'text', default: 'Yeraltı LPG / Akaryakıt Tankı' },
                { key: 'sistem_tipi', label: 'Katodik Koruma Yöntemi', type: 'select', options: ['Galvanik Anotlu (Magnezyum Anot)', 'Dış Akım Kaynaklı (Redresörlü)'], default: 'Galvanik Anotlu (Magnezyum Anot)' },
                { key: 'referans_elektrot', label: 'Kullanılan Referans Elektrot', type: 'select', options: ['Bakır / Bakır Sülfat (Cu/CuSO4)', 'Gümüş / Gümüş Klorür (Ag/AgCl)'], default: 'Bakır / Bakır Sülfat (Cu/CuSO4)' },
                { key: 'kriter_aralik', label: 'Standart Koruma Potansiyeli Aralığı', type: 'text', default: '-850 mV ile -1200 mV (Cu/CuSO4)' }
            ],
            visualChecks: [
                { id: 'chk_1851_box', code: 'A', text: 'Katodik koruma ölçü kutusu sağlam, kapağı mevcut ve klemens bağlantıları temiz mi?', isCritical: true, defect: 'Katodik koruma ölçü kutusu veya klemens bağlantıları hasarlı/kopuk durumdadır.' },
                { id: 'chk_1851_pot', code: 'B', text: 'Ölçülen yapı/zemin potansiyeli -850 mV (daha negatif) koruma kriterini sağlıyor mu?', isCritical: true, defect: 'Ölçülen katodik koruma potansiyeli -850 mV sınır değerinin altında olup tank/yapı korozyona karşı korunmamaktadır.' },
                { id: 'chk_1851_iso', code: 'C', text: 'İzolasyon flanşı / dielektrik rakor bağlantıları sağlam mı?', isCritical: false, defect: 'Tank boru hattı izolasyon flanşında elektriksel kaçak tespit edilmiştir.' }
            ],
            tableTitle: 'KATODİK KORUMA POTANSİYEL ÖLÇÜM TABLOSU (Cu/CuSO4)',
            tableColumns: [
                { key: 'no', label: 'Ölçüm No', width: '10%', default: '1' },
                { key: 'point', label: 'Ölçüm Noktası / Tank Adı', width: '32%', default: 'Yeraltı Tankı Ölçü Kutusu - Nokta 1' },
                { key: 'v_on', label: 'Koruma Potansiyeli Von (mV)', width: '22%', default: '-985 mV' },
                { key: 'v_limit', label: 'Kriter Aralığı (mV)', width: '22%', default: '-850 / -1200 mV' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { no: '1', point: 'Tank Gövde + Anot Bağlı (Ölçü Kutusu)', v_on: '-985 mV', v_limit: '-850 .. -1200 mV', result: 'Uygun' },
                { no: '2', point: 'Anot Açık Devre Potansiyeli', v_on: '-1540 mV', v_limit: '≤ -1400 mV (Mg)', result: 'Uygun' }
            ]
        },

        // 1758 - YALITIM DİRENCİ (İZOLASYON) ÖLÇÜMÜ
        '1758': {
            templateId: '1758',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.325',
            docNo: 'TKM-FR.325, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'KABLO VE TESİSAT YALITIM DİRENCİ (İZOLASYON) ÖLÇÜM RAPORU',
            methods: ['TS HD 60364-6 Madde 6.4.3.3 Yalıtım Direnci', 'RG, 04.11.1984 - 18565 Elektrik İç Tesisleri Yönetmeliği'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'test_gerilimi', label: 'Uygulanan DC Test Gerilimi', type: 'select', options: ['500 V DC (Nominal ≤ 500V Tesisat)', '1000 V DC (500V - 1000V Arası)', '250 V DC (SELV / PELV)'], default: '500 V DC (Nominal ≤ 500V Tesisat)' },
                { key: 'sinir_deger', label: 'Standart Minimum Yalıtım Direnci', type: 'text', default: '≥ 1.0 MΩ (TS HD 60364-6 Tablo 6.1)' },
                { key: 'pano_adi', label: 'Ölçüm Yapılan Pano / Hat', type: 'text', default: 'Ana Dağıtım Panosu ve Alt Linyeleri' },
                { key: 'ortam_bilgisi', label: 'Ortam Sıcaklığı / Nem', type: 'text', default: '22 °C / %45' }
            ],
            visualChecks: [
                { id: 'chk_1758_iso', code: 'A', text: 'Tüm ölçülen devrelerde faz-faz, faz-nötr ve faz-toprak yalıtım direnci ≥ 1.0 MΩ üzerinde mi?', isCritical: true, defect: 'Ölçülen hat yalıtım direnci standart sınır değer olan 1.0 MΩ altındadır.' },
                { id: 'chk_1758_cable', code: 'B', text: 'Kablo başlıklarında ve klemens bağlantılarında kavrulma veya izolasyon çatlağı yok mu?', isCritical: false, defect: 'Kablo izolasyonunda deformasyon tespit edilmiştir.' }
            ],
            tableTitle: 'HAT / KABLO YALITIM DİRENCİ (MΩ) ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'no', label: 'No', width: '8%', default: '1' },
                { key: 'circuit', label: 'Linye / Kablo / Motor Adı', width: '28%', default: 'TDP-1 Besleme Kablosu (4x16 mm²)' },
                { key: 'test_v', label: 'Test (V DC)', width: '14%', default: '500 V' },
                { key: 'l_pe', label: 'Faz - PE (MΩ)', width: '18%', default: '> 200 MΩ' },
                { key: 'l_n', label: 'Faz - N / Faz (MΩ)', width: '18%', default: '> 200 MΩ' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { no: '1', circuit: 'TDP-1 Besleme Hattı (5x16 mm²)', test_v: '500 V', l_pe: '> 200 MΩ', l_n: '> 200 MΩ', result: 'Uygun' },
                { no: '2', circuit: 'TDP-2 Besleme Hattı (5x10 mm²)', test_v: '500 V', l_pe: '> 200 MΩ', l_n: '> 200 MΩ', result: 'Uygun' }
            ]
        },

        // 1762 - ZEMİN-DUVAR YALITIM DİRENCİ
        '1762': {
            templateId: '1762',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.331',
            docNo: 'TKM-FR.331, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'ZEMİN VE DUVAR YALITIM DİRENCİ (İZOLE HALI) ÖLÇÜM RAPORU',
            methods: ['TS HD 60364-6 Ek A', 'TS EN 61111 Gerilim Altında Çalışma - Elektriksel Yalıtkan Paspaslar'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'paspas_sinifi', label: 'İzole Halı / Zemin Sınıfı', type: 'select', options: ['Sınıf 0 (1.000 V)', 'Sınıf 2 (17.000 V)', 'Sınıf 3 (26.500 V)', 'Sınıf 4 (36.000 V)'], default: 'Sınıf 0 (1.000 V)' },
                { key: 'test_gerilimi', label: 'Uygulanan Test Gerilimi', type: 'text', default: '500 V / 1000 V DC' },
                { key: 'sinir_deger', label: 'Minimum Yalıtım Direnci Kriteri', type: 'text', default: '≥ 50 kΩ (AG) / ≥ 100 MΩ (İzole Paspas)' }
            ],
            visualChecks: [
                { id: 'chk_1762_mat', code: 'A', text: 'Pano önü izole paspaslar yırtıksız, kuru, temiz ve TS EN 61111 damgalı mı?', isCritical: true, defect: 'Pano önündeki izole paspas hasarlı veya standart dışıdır.' },
                { id: 'chk_1762_res', code: 'B', text: 'Ölçülen zemin yalıtım direnci sınır değerin üzerinde mi?', isCritical: true, defect: 'Zemin yalıtım direnci standart sınır değerin altındadır.' }
            ],
            tableTitle: 'PANO ÖNÜ ZEMİN / İZOLE PASPAS YALITIM ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'no', label: 'No', width: '10%', default: '1' },
                { key: 'location', label: 'Ölçüm Yapılan Pano Önü / Mahal', width: '38%', default: 'ADP Ana Pano Önü İzole Halı' },
                { key: 'test_v', label: 'Test Gerilimi', width: '18%', default: '1000 V DC' },
                { key: 'measured', label: 'Ölçülen Direnç', width: '20%', default: '> 500 MΩ' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { no: '1', location: 'Ana Dağıtım Panosu (ADP) Önü İzole Paspas', test_v: '1000 V DC', measured: '> 500 MΩ', result: 'Uygun' }
            ]
        },

        // 2122 - ENERJİ/GÜÇ KALİTESİ VE HARMONİK ANALİZİ
        '2122': {
            templateId: '2122',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.332',
            docNo: 'TKM-FR.332, REV.00 / YT: 01.09.2025',
            category: 'Elektriksel',
            title: 'ENERJİ KALİTESİ VE HARMONİK ANALİZİ ÖLÇÜM RAPORU',
            methods: ['TS EN 50160 Şebeke Gerilim Karakteristikleri', 'IEEE 519 Harmonik Kontrol Standardı', 'EPDK Elektrik Şebeke Yönetmeliği'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'olcum_noktasi', label: 'Analizör Bağlantı Noktası', type: 'text', default: 'Ana Dağıtım Panosu (ADP) Giriş Şalteri' },
                { key: 'olcum_suresi', label: 'Kayıt / Ölçüm Periyodu', type: 'text', default: 'Anlık ve Yük AltındaHarmonik Analiz' },
                { key: 'thdv_sinir', label: 'Gerilim Harmonik Bozulma Sınırı (THDv)', type: 'text', default: '≤ %8.0 (TS EN 50160)' },
                { key: 'thdi_sinir', label: 'Akım Harmonik Bozulma Sınırı (THDi)', type: 'text', default: '≤ %15.0 (IEEE 519)' }
            ],
            visualChecks: [
                { id: 'chk_2122_v', code: 'A', text: 'Faz-Nötr ve Faz-Faz gerilimleri nominal değerin ±%10 sınırları (207V - 253V) içinde mi?', isCritical: true, defect: 'Şebeke gerilimi ±%10 tolerans sınırları dışındadır.' },
                { id: 'chk_2122_thdv', code: 'B', text: 'Toplam Gerilim Harmonik Bozulması (THDv) %8 sınırının altında mı?', isCritical: true, defect: 'Toplam gerilim harmonik bozulması (THDv) sınır değerin üzerindedir.' },
                { id: 'chk_2122_unb', code: 'C', text: 'Gerilim dengesizliği %2 sınırının altında ve Nötr-Toprak gerilimi normal mi?', isCritical: false, defect: 'Fazlar arası aşırı yük dengesizliği mevcuttur.' }
            ],
            tableTitle: 'GÜÇ KALİTESİ VE HARMONİK ÖLÇÜM DEĞERLERİ TABLOSU',
            tableColumns: [
                { key: 'param', label: 'Parametre', width: '28%' },
                { key: 'l1', label: 'L1 Fazı', width: '16%' },
                { key: 'l2', label: 'L2 Fazı', width: '16%' },
                { key: 'l3', label: 'L3 Fazı', width: '16%' },
                { key: 'limit', label: 'Sınır', width: '12%' },
                { key: 'result', label: 'Sonuç', width: '12%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { param: 'Faz-Nötr Gerilimi (V RMS)', l1: '231.2 V', l2: '230.4 V', l3: '231.8 V', limit: '230V ±%10', result: 'Uygun' },
                { param: 'Hat Akımı (A RMS)', l1: '142 A', l2: '138 A', l3: '145 A', limit: 'In Altı', result: 'Uygun' },
                { param: 'Gerilim Harmoniği THDv (%)', l1: '%2.4', l2: '%2.5', l3: '%2.3', limit: '≤ %8.0', result: 'Uygun' },
                { param: 'Akım Harmoniği THDi (%)', l1: '%9.8', l2: '%10.2', l3: '%9.5', limit: '≤ %15.0', result: 'Uygun' }
            ]
        },

        // 2150 - YAĞMURLAMA (SPRİNKLER) SİSTEMLERİ
        '2150': {
            templateId: '2150',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.210',
            docNo: 'TKM-FR.210, REV.00 / YT: 01.09.2025',
            category: 'Yangın',
            title: 'OTOMATİK YAĞMURLAMA (SPRİNKLER) SİSTEMİ PERİYODİK KONTROL RAPORU',
            methods: ['Binaların Yangından Korunması Hakkında Yönetmelik', 'TS EN 12845 Sabit Yangın Söndürme Sistemleri - Otomatik Sprinkler Sistemleri', 'RG, 25.04.2013 - 28628'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'sistem_tipi', label: 'Sprinkler Tesisat Tipi', type: 'select', options: ['Islak Borulu Sprinkler Sistemi', 'Kuru Borulu Sprinkler Sistemi', 'Ön Tepkili (Pre-Action) Sistem'], default: 'Islak Borulu Sprinkler Sistemi' },
                { key: 'tehlike_sinifi', label: 'Yangın Tehlike Sınıfı / Sıcaklık', type: 'text', presets: ['Düşük Tehlike (DT) / 68 °C Kırmızı Ampul', 'Orta Tehlike (OT) / 68 °C Kırmızı Ampul', 'Yüksek Tehlike (YT) / 93 °C Yeşil Ampul'], default: 'Orta Tehlike (OT) / 68 °C Kırmızı Ampul' },
                { key: 'statik_basinc', label: 'Islak Alarm Vanası Alt/Üst Basıncı', type: 'text', unit: 'Bar', default: '8.2 Bar / 8.2 Bar' },
                { key: 'zon_sayisi', label: 'Zon / Kat İzleme Vana Sayısı', type: 'text', default: 'Tesis Geneli Tam Kapsam' }
            ],
            visualChecks: [
                { id: 'chk_2150_valve', code: 'A', text: 'Islak alarm vanası ve kat kesme vanaları açık konumda kilitli ve izleme anahtarları aktif mi?', isCritical: true, defect: 'Sprinkler hattı kesme vanası kapalı veya izleme anahtarı devre dışıdır.' },
                { id: 'chk_2150_bulb', code: 'B', text: 'Sprinkler başlıkları boyasız, darbesiz, korozyonsuz ve cam ampulleri sağlam mı?', isCritical: true, defect: 'Bazı sprinkler başlıklarının üzeri boyanmış veya fiziksel darbe almış durumdadır.' },
                { id: 'chk_2150_clear', code: 'C', text: 'Sprinkler başlıkları altında en az 50 cm boşluk bırakılmış mı (yüksek istif engeli yok mu)?', isCritical: true, defect: 'Sprinkler başlıklarına 50 cm\'den daha yakın malzeme istiflenerek su dağılımı engellenmiştir.' },
                { id: 'chk_2150_flow', code: 'D', text: 'Akış anahtarı (Flow Switch) ve test-drenaj vanası açıldığında yangın santraline alarm düşüyor mu?', isCritical: true, defect: 'Test vanası açıldığında akış anahtarı yangın algılama santraline sinyal göndermemektedir.' },
                { id: 'chk_2150_spare', code: 'E', text: 'Tesiste yeterli sayıda yedek sprinkler başlığı ve özel sprinkler anahtarı mevcut mu?', isCritical: false, defect: 'Tesiste TS EN 12845 gereği bulundurulması gereken yedek sprinkler başlığı ve montaj anahtarı eksiktir.' }
            ],
            tableTitle: 'SPRİNKLER ZONLARI BASINÇ VE AKIŞ TEST TABLOSU',
            tableColumns: [
                { key: 'zone', label: 'Zon / Kat No', width: '20%', default: 'Zon 1 - Zemin Kat' },
                { key: 'valve_state', label: 'Kesme Vanası Durumu', width: '22%', default: 'Açık (İzlemeli)' },
                { key: 'pressure', label: 'Hat Basıncı (Bar)', width: '18%', default: '7.8 Bar' },
                { key: 'flow_alarm', label: 'Akış Anahtarı Alarm Testi', width: '26%', default: 'Santrale Alarm Düştü (12 sn)' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { zone: 'Islak Alarm Vanası - 1', valve_state: 'Açık / Mühürlü', pressure: '8.0 Bar', flow_alarm: 'Gong ve Santral Alarmı Aktif', result: 'Uygun' },
                { zone: 'Zon 1 - Üretim / Depo', valve_state: 'Açık / İzlemeli', pressure: '7.6 Bar', flow_alarm: 'Test Drenajda Alarm Verdi', result: 'Uygun' }
            ]
        },

        // 2160 - YANGIN DOLAP SİSTEMİ
        '2160': {
            templateId: '2160',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.215',
            docNo: 'TKM-FR.215, REV.00 / YT: 01.09.2025',
            category: 'Yangın',
            title: 'SABİT BORU TESİSATI VE YANGIN DOLAPLARI PERİYODİK KONTROL RAPORU',
            methods: ['Binaların Yangından Korunması Hakkında Yönetmelik', 'TS EN 671-1 Yarı Rijit Hortumlu Sabit Yangın Dolapları', 'TS EN 671-3 Bakım Standardı', 'RG, 25.04.2013 - 28628'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'dolap_tipi', label: 'Yangın Dolabı ve Hortum Tipi', type: 'select', options: ['TS EN 671-1 Yarı Rijit Hortumlu (1" - 30m)', 'TS EN 671-2 Yassı Hortumlu (2" - 20m)', 'Karma + İtfaiye Su Alma Ağzı'], default: 'TS EN 671-1 Yarı Rijit Hortumlu (1" - 30m)' },
                { key: 'su_kaynagi', label: 'Besleme Kaynağı', type: 'text', default: 'Yangın Pompa İstasyonu ve Yangın Su Deposu' },
                { key: 'calisma_basinci', label: 'Sistem Statik / Dinamik Basıncı', type: 'text', unit: 'Bar', default: '6.5 Bar / 5.4 Bar' },
                { key: 'dolap_adedi', label: 'Kontrol Edilen Yangın Dolabı Sayısı', type: 'text', default: 'Tabloda Belirtilen Dolaplar' }
            ],
            visualChecks: [
                { id: 'chk_2160_access', code: 'A', text: 'Yangın dolaplarının önü tamamen açık, kapağı rahat açılıyor ve işaret levhası var mı?', isCritical: true, defect: 'Yangın dolabı önüne malzeme istiflenmiş olup acil durumda erişim engellenmiştir.' },
                { id: 'chk_2160_reel', code: 'B', text: 'Hortum makarası her yönde rahat dönüyor ve hortumda çatlak/kaçak yok mu?', isCritical: true, defect: 'Yangın dolabı makarası sıkışık veya hortum/rekor bağlantısında su kaçağı mevcuttur.' },
                { id: 'chk_2160_nozzle', code: 'C', text: 'Lans (nozul) Kapalı - Sprey - Jet konumlarında sağlam çalışıyor mu?', isCritical: true, defect: 'Yangın dolabı ucundaki lans (nozul) eksik veya kırık durumdadır.' },
                { id: 'chk_2160_press', code: 'D', text: 'En uzak yangın dolabında bile yeterli su basıncı ve debi mevcut mu?', isCritical: true, defect: 'Yangın dolabı hattında su basıncı yetersizdir veya hat susuzdur.' }
            ],
            tableTitle: 'YANGIN DOLAPLARI KONTROL VE BASINÇ TEST TABLOSU',
            tableColumns: [
                { key: 'no', label: 'Dolap No', width: '12%', default: 'YD-01' },
                { key: 'location', label: 'Bulunduğu Kat / Mahal', width: '28%', default: 'Zemin Kat Giriş Holü' },
                { key: 'hose', label: 'Hortum & Makara', width: '20%', default: '1" 30m Yarı Rijit / Sağlam' },
                { key: 'pressure', label: 'Basınç / Su Testi', width: '16%', default: '6.2 Bar (Aktif)' },
                { key: 'nozzle', label: 'Vana & Lans Durumu', width: '14%', default: 'Tam / Sızdırmaz' },
                { key: 'result', label: 'Sonuç', width: '10%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { no: 'YD-01', location: 'Zemin Kat Ana Koridor', hose: '1" 30m Yarı Rijit', pressure: '6.2 Bar', nozzle: 'Tam / Çalışır', result: 'Uygun' },
                { no: 'YD-02', location: '1. Kat Ofis / Üretim Çıkışı', hose: '1" 30m Yarı Rijit', pressure: '5.8 Bar', nozzle: 'Tam / Çalışır', result: 'Uygun' }
            ]
        },

        // 2196 - PORTATİF YANGIN SÖNDÜRME TÜPLERİ
        '2196': {
            templateId: '2196',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.220',
            docNo: 'TKM-FR.220, REV.00 / YT: 01.09.2025',
            category: 'Yangın',
            title: 'PORTATİF YANGIN SÖNDÜRME CİHAZLARI (TÜPLERİ) PERİYODİK KONTROL RAPORU',
            methods: ['Binaların Yangından Korunması Hakkında Yönetmelik (Madde 99)', 'TS ISO 11602-2 Yangından Korunma - Taşınabilir ve Tekerlekli Yangın Söndürücüler', 'TS 862 EN 3'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: false },
            generalFields: [
                { key: 'sondurucu_tipleri', label: 'Bulunan Söndürücü Tipleri', type: 'text', default: '6 kg KKT (ABC Tozlu), 5 kg CO2, 50 kg Arabalı KKT' },
                { key: 'aski_yuksekligi', label: 'Montaj / Askı Yüksekliği', type: 'text', default: 'Yerden ≤ 90 cm (Standartlara Uygun)' },
                { key: 'toplam_adet', label: 'Kontrol Edilen Toplam Tüp Sayısı', type: 'text', default: 'Tabloda Listelenen Cihazlar' },
                { key: 'dolum_firma', label: 'Dolum / Bakım Yapan Firma', type: 'text', default: 'Yetkili Dolum Firması Etiketli' }
            ],
            visualChecks: [
                { id: 'chk_2196_gauge', code: 'A', text: 'Tüm tüplerin manometre ibresi yeşil (uygun basınç) bölgesinde mi?', isCritical: true, defect: 'Bazı yangın söndürme tüplerinin manometre basıncı kırmızı (düşük basınç) bölgesindedir.' },
                { id: 'chk_2196_pin', code: 'B', text: 'Emniyet pimi, kurşun/plastik mührü, tetik tertibatı ve hortumu sağlam mı?', isCritical: true, defect: 'Yangın söndürme tüpünde emniyet pimi/mührü kopuk veya hortumu hasarlıdır.' },
                { id: 'chk_2196_date', code: 'C', text: 'Üzerindeki kontrol ve yeniden dolum tarihi etiketleri geçerli mi?', isCritical: true, defect: 'Yangın söndürme tüplerinin periyodik dolum/kontrol süresi geçmiştir.' },
                { id: 'chk_2196_loc', code: 'D', text: 'Tüplerin önü açık, kolay görünür yerde, yönlendirme levhası mevcut ve yerden ≤ 90 cm yüksekte mi?', isCritical: false, defect: 'Yangın tüpünün önü kapatılmış veya konum işaretleme levhası eksiktir.' }
            ],
            tableTitle: 'YANGIN SÖNDÜRME CİHAZLARI ENVANTER VE KONTROL TABLOSU',
            tableColumns: [
                { key: 'no', label: 'Tüp No', width: '10%', default: 'YST-01' },
                { key: 'type_cap', label: 'Cinsi ve Kapasitesi', width: '22%', options: ['6 kg KKT (ABC)', '12 kg KKT (ABC)', '5 kg CO2', '2 kg CO2', '6 Lt Köpüklü', '50 kg KKT Arabalı'], default: '6 kg KKT (ABC)' },
                { key: 'location', label: 'Bulunduğu Mahal', width: '26%', default: 'Zemin Kat Giriş' },
                { key: 'manometer', label: 'Basınç / Manometre', width: '16%', default: 'Yeşil (16 Bar)' },
                { key: 'seal_hose', label: 'Mühür / Hortum / Etiket', width: '16%', default: 'Tam ve Geçerli' },
                { key: 'result', label: 'Sonuç', width: '10%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { no: 'YST-01', type_cap: '6 kg KKT (ABC)', location: 'Zemin Kat Ana Giriş', manometer: 'Yeşil (16 Bar)', seal_hose: 'Mühürlü / Geçerli', result: 'Uygun' },
                { no: 'YST-02', type_cap: '5 kg CO2', location: 'Elektrik Pano Odası Önü', manometer: 'Tam Dolu (Tartım)', seal_hose: 'Mühürlü / Geçerli', result: 'Uygun' }
            ]
        },

        // 2151 - YANGIN POMPA İSTASYONU
        '2151': {
            templateId: '2151',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.225',
            docNo: 'TKM-FR.225, REV.00 / YT: 01.09.2025',
            category: 'Yangın',
            title: 'YANGIN POMPA İSTASYONU (ANA, YEDEK VE JOKEY POMPA) PERİYODİK KONTROL RAPORU',
            methods: ['Binaların Yangından Korunması Hakkında Yönetmelik (Madde 93)', 'TS EN 12845', 'NFPA 20 Sabit Yangın Pompaları Standardı', 'RG, 25.04.2013 - 28628'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'pompa_konfig', label: 'Pompa Grubu Yapısı', type: 'select', options: ['1 Elektrikli Ana + 1 Dizel Yedek + 1 Jokey', '2 Elektrikli (Asıl/Yedek) + 1 Jokey', '1 Elektrikli + 1 Jokey'], default: '1 Elektrikli Ana + 1 Dizel Yedek + 1 Jokey' },
                { key: 'debi_basinc', label: 'Nominal Debi (m³/h - GPM) / Basınç (Bar)', type: 'text', default: '114 m³/h (500 GPM) / 8.5 Bar' },
                { key: 'su_deposu', label: 'Yangın Su Deposu Kapasitesi ve Doluluk', type: 'text', default: '150 m³ / Tam Dolu' },
                { key: 'kontrol_panosu', label: 'Pompa Kontrol Panoları Durumu', type: 'select', options: ['Otomatik (AUTO) Konumda', 'Manuel Konumda', 'Kapalı / Arızalı'], negativeValues: ['Kapalı / Arızalı'], default: 'Otomatik (AUTO) Konumda' }
            ],
            visualChecks: [
                { id: 'chk_2151_auto', code: 'A', text: 'Tüm yangın pompalarının kontrol panoları OTOMATİK (Auto) konumda ve enerjili mi?', isCritical: true, defect: 'Yangın pompası kontrol panosu OTOMATİK konumda değildir.' },
                { id: 'chk_2151_jockey', code: 'B', text: 'Hat basıncı düştüğünde Jokey pompa otomatik devreye girip set basıncında duruyor mu?', isCritical: true, defect: 'Jokey pompa basınç düşümünde otomatik devreye girmemektedir.' },
                { id: 'chk_2151_main', code: 'C', text: 'Ana ve yedek yangın pompaları basınç şalteri (presostat) ile sırasıyla otomatik devreye giriyor mu?', isCritical: true, defect: 'Ana veya yedek yangın pompası basınç düşümünde otomatik devreye girmemektedir.' },
                { id: 'chk_2151_diesel', code: 'D', text: 'Dizel pompa varsa; çift akü grubu, yakıt seviyesi (>%75) ve ceket suyu ısıtıcısı sağlam mı?', isCritical: true, defect: 'Dizel yangın pompası akü grubu veya yakıt seviyesi yetersizdir.' },
                { id: 'chk_2151_valves', code: 'E', text: 'Emiş ve basma kolektör vanaları açık, çekvalfler ve kolektör manometreleri sağlam mı?', isCritical: true, defect: 'Yangın pompa kolektör vanalarından biri kapalı veya manometresi arızalıdır.' }
            ],
            tableTitle: 'YANGIN POMPALARI DEVREYE GİRME VE PERFORMANS TEST TABLOSU',
            tableColumns: [
                { key: 'pump', label: 'Pompa Adı', width: '24%' },
                { key: 'power_rpm', label: 'Güç (kW) / Devir', width: '18%' },
                { key: 'start_bar', label: 'Devreye Girme (Bar)', width: '18%' },
                { key: 'work_bar', label: 'Çalışma Basıncı (Bar)', width: '18%' },
                { key: 'mode', label: 'Pano Konumu', width: '12%' },
                { key: 'result', label: 'Sonuç', width: '10%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { pump: 'Jokey Pompa', power_rpm: '4 kW / 2900 d/dk', start_bar: '7.5 Bar', work_bar: '8.5 Bar (Durdu)', mode: 'Otomatik', result: 'Uygun' },
                { pump: 'Elektrikli Ana Yangın Pompası', power_rpm: '45 kW / 2950 d/dk', start_bar: '6.8 Bar', work_bar: '8.2 Bar', mode: 'Otomatik', result: 'Uygun' },
                { pump: 'Dizel Yedek Yangın Pompası', power_rpm: '55 kW / 2950 d/dk', start_bar: '6.0 Bar', work_bar: '8.2 Bar', mode: 'Otomatik', result: 'Uygun' }
            ]
        },

        // 2153 - HAVALANDIRMA / KLİMA TESİSATI
        '2153': {
            templateId: '2153',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.180',
            docNo: 'TKM-FR.180, REV.00 / YT: 01.09.2025',
            category: 'HVAC',
            title: 'HAVALANDIRMA VE KLİMA TESİSATI PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği', 'TS EN 12599 Havalandırma ve İklimlendirme Deney Metotları', 'TS 3419', 'ASHRAE Standartları'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'sistem_tipi', label: 'Havalandırma / İklimlendirme Sistemi Tipi', type: 'select', options: ['Merkezi Klima Santrali (AHU)', 'VRV / VRF ve Taze Hava Sistemi', 'Egzoz ve Taze Hava Fan Tesisatı', 'Rooftop Ünitesi'], default: 'VRV / VRF ve Taze Hava Sistemi' },
                { key: 'marka_model', label: 'Ünite Marka / Model', type: 'text', default: 'DAIKIN / MITSUBISHI / ALARKO CARRIER' },
                { key: 'mahal_hacim', label: 'Hizmet Verdiği Mahal ve Hacim (m³)', type: 'text', default: 'Çalışma & Ofis Alanları / 1200 m³' },
                { key: 'filtre_durumu', label: 'Filtre Tipi ve Temizlik Durumu', type: 'text', default: 'G4 Kaset + F7 Torba Filtre / Temiz' }
            ],
            visualChecks: [
                { id: 'chk_2153_vib', code: 'A', text: 'Fan ve klima üniteleri titreşim takozları üzerine sağlam monte edilmiş ve kayış-kasnak muhafazalı mı?', isCritical: false, defect: 'Klima santrali fan/motor titreşim takozları veya kayış-kasnak muhafazası hasarlıdır.' },
                { id: 'chk_2153_duct', code: 'B', text: 'Hava kanallarında sızdırmazlık, askı rotları ve ısı izolasyonu uygun mu?', isCritical: false, defect: 'Hava kanalı bağlantı contalarında hava kaçağı veya izolasyon yırtılması mevcuttur.' },
                { id: 'chk_2153_grill', code: 'C', text: 'Menfez ve anemostatlarda tıkanıklık, kırık veya hava akış engeli yok mu?', isCritical: true, defect: 'Havalandırma menfezleri kir/toz nedeniyle tıkanmış olup hava debisi yetersizdir.' },
                { id: 'chk_2153_damper', code: 'D', text: 'Yangın damperi ve yangın otomasyon bağlantısı mevcut ve çalışır durumda mı?', isCritical: true, defect: 'Yangın anında havalandırmayı kesecek yangın damperi/otomasyon bağlantısı aktif değildir.' },
                { id: 'chk_2153_elec', code: 'E', text: 'Elektrik besleme panosu, acil bakım şalteri (pako şalter) ve gövde topraklaması uygun mu?', isCritical: true, defect: 'Klima santrali acil bakım şalteri veya gövde topraklama bağlantısı eksiktir.' },
                { id: 'chk_2153_drain', code: 'F', text: 'Drenaj hattı, sifonu ve yoğuşma tavası temiz ve sızdırmaz durumda mı?', isCritical: false, defect: 'Yoğuşma tavası ve drenaj hattında tıkanıklık/su birikintisi tespit edilmiştir.' }
            ],
            tableTitle: 'MENFEZ HAVA HIZI, DEBİ VE ORTAM ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'no', label: 'Ölçüm No', width: '9%', default: 'M-1' },
                { key: 'location', label: 'Mahal / Menfez Adı', width: '23%', default: 'Çalışma Alanı Giriş Bölgesi' },
                { key: 'type', label: 'Menfez Tipi', width: '18%', options: ['Taze Hava Üfleme', 'Egzoz Emiş', 'İklimlendirme Üfleme'], default: 'Taze Hava Üfleme' },
                { key: 'size', label: 'Ebat / Kesit', width: '16%', default: '40x40 cm (0.16 m²)' },
                { key: 'velocity', label: 'Hava Hızı (m/s)', width: '11%', default: '2.5 m/s' },
                { key: 'flow', label: 'Debi Q (m³/h)', width: '13%', default: '1440 m³/h' },
                { key: 'result', label: 'Sonuç', width: '10%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { no: 'M-1', location: 'Çalışma Alanı Giriş Bölgesi', type: 'Taze Hava Üfleme', size: '40x40 cm (0.16 m²)', velocity: '2.5 m/s', flow: '1440 m³/h', result: 'Uygun' },
                { no: 'M-2', location: 'Çalışma Alanı Orta Bölüm', type: 'Taze Hava Üfleme', size: '40x40 cm (0.16 m²)', velocity: '2.3 m/s', flow: '1325 m³/h', result: 'Uygun' },
                { no: 'E-1', location: 'Depo ve Teknik Hacim', type: 'Egzoz Emiş', size: '30x30 cm (0.09 m²)', velocity: '2.8 m/s', flow: '907 m³/h', result: 'Uygun' }
            ]
        },

        // 2159 - OTOMATİK / MANUEL KAPI
        '2159': {
            templateId: '2159',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.112',
            docNo: 'TKM-FR.112, REV.00 / YT: 01.09.2025',
            category: 'Mekanik / Kapı',
            title: 'ENDÜSTRİYEL VE OTOMATİK KAPI SİSTEMLERİ PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628', 'TS EN 16005 Güçle Çalışan Yaya Kapıları Güvenliği', 'TS EN 13241 Endüstriyel ve Garaj Kapıları', 'TS EN 12453'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: false },
            generalFields: [
                { key: 'kapi_tipi', label: 'Kapı Tipi ve Çalışma Şekli', type: 'select', options: ['Fotoselli Otomatik Kayar Kapı', 'Seksiyonel Endüstriyel Kapı', 'Sarmal (Kepenk / PVC Hızlı) Kapı', 'Motorlu Bahçe / Yana Kayar Kapı'], default: 'Fotoselli Otomatik Kayar Kapı' },
                { key: 'marka_model', label: 'Marka / Model / Seri No', type: 'text', default: 'DORMA / MANUSA / BFT' },
                { key: 'olculer', label: 'Geçiş Genişliği x Yüksekliği (cm)', type: 'text', default: '200 x 220 cm' },
                { key: 'tahrik_tipi', label: 'Tahrik / Besleme Tipi', type: 'text', default: '230V AC Elektrik Motorlu + Batarya Destekli' }
            ],
            visualChecks: [
                { id: 'chk_2159_wing', code: 'A', text: 'Kapı kanatlarında, camlarında veya panellerinde kırık/çatlak/deformasyon yok mu?', isCritical: true, defect: 'Kapı kanadı veya cam panelinde güvenlik riski oluşturan deformasyon/çatlak mevcuttur.' },
                { id: 'chk_2159_photo', code: 'B', text: 'Sıkışma önleyici emniyet fotoseli / boy fotoseli aktif çalışıyor mu?', isCritical: true, defect: 'Kapı sıkışma önleyici emniyet fotoseli çalışmamakta olup çarpmaya karşı korumasızdır.' },
                { id: 'chk_2159_rev', code: 'C', text: 'Kapanma sırasında engel algılandığında kapı otomatik geri açılıyor mu (Auto-Reverse)?', isCritical: true, defect: 'Kapanma esnasında engel algılandığında kapı otomatik geri açılma (auto-reverse) yapmamaktadır.' },
                { id: 'chk_2159_bat', code: 'D', text: 'Enerji kesintisinde manuel açılma mekanizması veya batarya ile açık kalma fonksiyonu çalışıyor mu?', isCritical: true, defect: 'Enerji kesintisinde kapının acil çıkış için batarya ile açılma veya manuel boşa alma mekanizması çalışmamaktadır.' },
                { id: 'chk_2159_rail', code: 'E', text: 'Kılavuz raylar, makaralar, halatlar ve düşme önleyici paraşüt fren sistemi güvenli mi?', isCritical: true, defect: 'Kapı kılavuz rayları veya taşıyıcı makara/halat sisteminde aşınma tespit edilmiştir.' },
                { id: 'chk_2159_sign', code: 'F', text: 'Acil durdurma / konum anahtarı, flaşör lamba ve uyarı etiketleri mevcut mu?', isCritical: false, defect: 'Kapı üzerinde hareket uyarı etiketi veya acil durdurma butonu eksiktir.' }
            ],
            tableTitle: 'KAPI FONKSİYON VE GÜVENLİK TEST TABLOSU',
            tableColumns: [
                { key: 'test_name', label: 'Test Edilen Güvenlik Fonksiyonu', width: '30%' },
                { key: 'method', label: 'Uygulanan Test Yöntemi', width: '30%' },
                { key: 'measured', label: 'Gözlenen Tepki / Ölçüm', width: '26%' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { test_name: 'Emniyet Fotoseli Algılama Testi', method: 'Kapanma esnasında fotosel hattı kesildi', measured: 'Temas etmeden durdu ve tam açıldı', result: 'Uygun' },
                { test_name: 'Engel Algılama / Geri Dönüş Testi', method: 'Kapanma yönünde direnç uygulandı', measured: '< 150 N kuvvetle geri açıldı', result: 'Uygun' },
                { test_name: 'Enerji Kesintisi / Acil Çıkış Testi', method: 'Şebeke beslemesi kesildi', measured: 'Batarya/Manuel ile açık konuma geçti', result: 'Uygun' }
            ]
        },

        // 2096 - RAF / DEPO RAF SİSTEMLERİ
        '2096': {
            templateId: '2096',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.145',
            docNo: 'TKM-FR.145, REV.00 / YT: 01.09.2025',
            category: 'Mekanik',
            title: 'ENDÜSTRİYEL DEPO RAF SİSTEMLERİ PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628', 'TS EN 15635 Çelik Statik Saklama Sistemleri - Uygulama ve Bakım', 'TS EN 15620', 'TS EN 15512'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'raf_tipi', label: 'Raf Sistemi Tipi', type: 'select', options: ['Sırt Sırta Palet Rafı', 'Hafif/Orta Yük Depo Rafı', 'Konsol Kollu Raf', 'Mezanin / İki Katlı Raf', 'Drive-In Raf'], default: 'Sırt Sırta Palet Rafı' },
                { key: 'ayak_travers', label: 'Ayak Yüksekliği / Travers Uzunluğu (mm)', type: 'text', default: '4500 mm / 2700 mm' },
                { key: 'kat_modul', label: 'Kat Sayısı / Modül Sayısı', type: 'text', default: '4 Kat / 10 Modül' },
                { key: 'kapasite', label: 'Göz / Kat Başına Maks. Yük Kapasitesi (kg)', type: 'text', default: '2000 kg / kat' }
            ],
            visualChecks: [
                { id: 'chk_2096_anchor', code: 'A', text: 'Raf ayakları (dikmeler) taban plakalarından zemine çelik dübellerle eksiksiz sabitlenmiş mi?', isCritical: true, defect: 'Raf ayak taban plakalarında eksik veya gevşek zemin ankraj dübelleri tespit edilmiştir.' },
                { id: 'chk_2096_pin', code: 'B', text: 'Travers güvenlik pimleri (emniyet kilitleri) tüm travers-ayak bağlantılarında takılı mı?', isCritical: true, defect: 'Travers başlıklarında yerinden çıkmayı önleyen emniyet pimleri (kilitleri) eksiktir.' },
                { id: 'chk_2096_damage', code: 'C', text: 'Ayak profillerinde ve diyagonallerde forklift darbesi, burkulma veya kırmızı riskli deformasyon yok mu?', isCritical: true, defect: 'Raf dikme ve diyagonal profillerinde TS EN 15635 sınırlarını aşan darbe/eğilme hasarı mevcuttur.' },
                { id: 'chk_2096_sign', code: 'D', text: 'Raf sıra başlarında azami yükleme kapasitelerini gösteren yük uyarı levhaları mevcut mu?', isCritical: false, defect: 'Raf sisteminde kat ve modül başına azami yük kapasitesini belirten uyarı levhası bulunmamaktadır.' },
                { id: 'chk_2096_guard', code: 'E', text: 'Köşe ve koridor başlarındaki raf ayaklarında darbe koruyucu bariyerler mevcut mu?', isCritical: false, defect: 'Forklift dönüş koridorlarındaki raf ayaklarında darbe koruyucu bariyer eksiktir.' }
            ],
            tableTitle: 'RAF SİSTEMİ BOYUTSAL KONTROL VE SEHİM ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'no', label: 'Ünite / Aks No', width: '16%', default: 'Raf-01' },
                { key: 'location', label: 'Depo Bölümü', width: '24%', default: 'Ana Depo A Koridoru' },
                { key: 'deflection', label: 'Ölçülen Travers Sehimi (mm)', width: '20%', default: '4.2 mm' },
                { key: 'limit', label: 'Sınır (L/200)', width: '16%', default: '≤ 13.5 mm' },
                { key: 'plumb', label: 'Şakül Kaçıklığı', width: '12%', default: '2.0 mm' },
                { key: 'result', label: 'Sonuç', width: '12%', options: ['Uygun', 'Uygun Değil'], default: 'Uygun' }
            ],
            defaultRows: [
                { no: 'Raf-01', location: 'Depo A Koridoru', deflection: '4.2 mm', limit: '≤ 13.5 mm', plumb: '2.0 mm', result: 'Uygun' },
                { no: 'Raf-02', location: 'Depo B Koridoru', deflection: '3.8 mm', limit: '≤ 13.5 mm', plumb: '1.8 mm', result: 'Uygun' }
            ]
        },

        // 2187 - HAVA TANKI / KOMPRESÖR
        '2187': {
            templateId: '2187',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.101',
            docNo: 'TKM-FR.101, REV.00 / YT: 01.09.2025',
            category: 'Basınçlı Kap',
            title: 'BASINÇLI HAVA TANKI PERİYODİK KONTROL VE MUAYENE RAPORU',
            methods: ['RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği', 'TS 1203 EN 286-1 Hava veya Azot Depolamak İçin Basit Basınçlı Kaplar', 'TS EN 13445'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'marka_imalatci', label: 'İmalatçı Firma / Marka', type: 'text', presets: ['DALGAKIRAN', 'EKOMAK', 'ATLAS COPCO', 'AYDIN TRAFO', 'SARMAK'], default: 'DALGAKIRAN' },
                { key: 'seri_yil', label: 'Seri Numarası / İmal Yılı', type: 'text', default: '2022' },
                { key: 'hacim_lt', label: 'Tank Hacmi', type: 'text', unit: 'Litre', presets: ['300 Lt', '500 Lt', '1000 Lt', '2000 Lt', '3000 Lt'], default: '500 Lt' },
                { key: 'isletme_basinci', label: 'Maksimum İşletme Basıncı (PS)', type: 'text', unit: 'Bar', presets: ['8 Bar', '10 Bar', '11 Bar', '12 Bar', '16 Bar'], default: '10 Bar' },
                { key: 'test_basinci', label: 'Test Basıncı (1.5 x PS) / Test Yöntemi', type: 'text', default: '15 Bar / Hidrostatik / NDT' },
                { key: 'konum_tip', label: 'Tank Tipi / Konumu', type: 'select', options: ['Dikey Silindirik', 'Yatay Silindirik'], default: 'Dikey Silindirik' }
            ],
            visualChecks: [
                { id: 'chk_2187_body', code: 'A', text: 'Tank gövdesinde, bombelerde ve kaynak dikişlerinde çatlak, deformasyon veya aşırı korozyon yok mu?', isCritical: true, defect: 'Hava tankı gövde/kaynak dikişlerinde korozyon veya deformasyon tespit edilmiştir.' },
                { id: 'chk_2187_sv', code: 'B', text: 'Emniyet ventili mevcut, mühürlü ve işletme basıncının %10 üzerinde açmaya ayarlı mı?', isCritical: true, defect: 'Hava tankı üzerinde emniyet ventili bulunmamaktadır veya arızalıdır.' },
                { id: 'chk_2187_mano', code: 'C', text: 'Manometre çalışır durumda, kadranı okunaklı ve azami işletme basıncı kırmızı çizgiyle işaretli mi?', isCritical: true, defect: 'Tank üzerindeki manometre arızalıdır veya çalışma basıncı işaretlemesi yoktur.' },
                { id: 'chk_2187_drain', code: 'D', text: 'Tank alt noktasında yoğuşma suyu tahliye (blöf) vanası veya otomatik konkens tahliyesi çalışıyor mu?', isCritical: false, defect: 'Hava tankı alt su tahliye (blöf) vanası tıkalı veya arızalıdır.' },
                { id: 'chk_2187_plate', code: 'E', text: 'Tank üzerinde imalatçı etiketi (Marka, Seri No, Hacim, Basınç, Yıl) mevcut ve okunaklı mı?', isCritical: false, defect: 'Hava tankı üzerinde teknik bilgileri içeren metal tanıtım etiketi bulunmamaktadır.' },
                { id: 'chk_2187_room', code: 'F', text: 'Tank patlama/darbe etkilerine karşı güvenli bir mahalde ve sabitlenmiş durumda mı?', isCritical: false, defect: 'Hava tankı çalışma mahallinde koruyucu bölme olmadan personel yakınında konumlandırılmıştır.' }
            ],
            tableTitle: 'HAVA TANKI BASINÇ, ET KALINLIĞI VE DONANIM KONTROL TABLOSU',
            tableColumns: [
                { key: 'param', label: 'Kontrol / Ölçüm Kalemi', width: '34%' },
                { key: 'measured', label: 'Ölçülen / Gözlenen Değer', width: '26%' },
                { key: 'limit', label: 'Standart / Referans', width: '26%' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { param: 'Kompresör Durma / Devreye Girme Basıncı', measured: '7.8 Bar / 6.5 Bar', limit: '≤ 10 Bar (PS)', result: 'Uygun' },
                { param: 'Emniyet Ventili Açma Basıncı', measured: '11.0 Bar (Mühürlü)', limit: '1.1 x İşletme Basıncı', result: 'Uygun' },
                { param: 'Ultrasonik Gövde / Bombe Et Kalınlığı (mm)', measured: 'Gövde: 5.8 mm / Bombe: 6.1 mm', limit: 'Korozyon Kaybı Yok', result: 'Uygun' },
                { param: 'Basınç Dayanım / Sızdırmazlık Kontrolü', measured: 'Kaçak ve Deformasyon Yok', limit: 'Sızdırmaz Olmalı', result: 'Uygun' }
            ]
        },

        // 2179 - KAPALI GENLEŞME TANKI
        '2179': {
            templateId: '2179',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.102',
            docNo: 'TKM-FR.102, REV.00 / YT: 01.09.2025',
            category: 'Basınçlı Kap',
            title: 'KAPALI GENLEŞME VE HİDROFOR DENGE TANKI PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628', 'TS EN 13831 Kapalı Genleşme Kapları (Membranlı)', 'TS 1911'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'kullanim_amaci', label: 'Tank Kullanım Amacı', type: 'select', options: ['Isıtma / Soğutma Tesisatı Kapalı Genleşme Tankı', 'Kullanım Suyu Hidrofor Denge Tankı', 'Yangın Tesisatı Denge Tankı'], default: 'Isıtma / Soğutma Tesisatı Kapalı Genleşme Tankı' },
                { key: 'marka_seri', label: 'Marka / Seri No / İmal Yılı', type: 'text', presets: ['REFLEX', 'WILO', 'BAYMAK', 'DAF', ' Zilmet'], default: 'REFLEX / 2022' },
                { key: 'hacim_basinc', label: 'Hacim (Lt) / Maks. İşletme Basıncı (Bar)', type: 'text', presets: ['100 Lt / 10 Bar', '200 Lt / 10 Bar', '300 Lt / 10 Bar', '500 Lt / 10 Bar', '1000 Lt / 10 Bar'], default: '300 Lt / 10 Bar' },
                { key: 'on_gaz_basinci', label: 'Membran Ön Gaz (Azot/Hava) Basıncı', type: 'text', unit: 'Bar', default: '2.5 Bar' }
            ],
            visualChecks: [
                { id: 'chk_2179_memb', code: 'A', text: 'Tank membranı sağlam (sübaptan su gelmiyor) ve ön gaz basıncı uygun mu?', isCritical: true, defect: 'Genleşme tankı membranı patlak olup hava sübabından su gelmektedir, membran değiştirilmelidir.' },
                { id: 'chk_2179_sv', code: 'B', text: 'Tesisat hattında emniyet ventili ve çalışan bir manometre mevcut mu?', isCritical: true, defect: 'Genleşme tankı bağlantısında emniyet ventili veya çalışan manometre bulunmamaktadır.' },
                { id: 'chk_2179_body', code: 'C', text: 'Tank gövdesinde, flanşında ve ayaklarında korozyon veya su sızıntısı yok mu?', isCritical: true, defect: 'Tank alt flanş bağlantısında korozyon ve su kaçağı mevcuttur.' }
            ],
            tableTitle: 'GENLEŞME / HİDROFOR TANKI KONTROL VE ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'param', label: 'Kontrol Kalemi', width: '36%' },
                { key: 'measured', label: 'Ölçülen Değer', width: '26%' },
                { key: 'reference', label: 'Referans / Sınır', width: '24%' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { param: 'Tesisat İşletme Basıncı (Bar)', measured: '3.2 Bar', reference: '≤ 10 Bar', result: 'Uygun' },
                { param: 'Membran Sağlamlık ve Ön Gaz Kontrolü', measured: 'Membran Sağlam / 2.5 Bar', reference: 'Sızdırmaz', result: 'Uygun' },
                { param: 'Emniyet Ventili ve Manometre Kontrolü', measured: '6.0 Bar Emniyet Ventili Aktif', reference: 'Tam ve Çalışır', result: 'Uygun' }
            ]
        },

        // 2056 - BUHAR KAZANI / KALORİFER KAZANI
        '2056': {
            templateId: '2056',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.103',
            docNo: 'TKM-FR.103, REV.00 / YT: 01.09.2025',
            category: 'Basınçlı Kap',
            title: 'ISITMA (KALORİFER / SICAK SU) VE BUHAR KAZANI PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628', 'TS EN 303-1 Isıtma Kazanları', 'TS EN 12953 Silindirik Buhar Kazanları', 'TS 2025 / TS 377'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'kazan_tipi', label: 'Kazan Tipi ve Yakıt Cinsi', type: 'select', options: ['Sıcak Su / Kalorifer Kazanı (Doğalgaz)', 'Duvar Tipi Yoğuşmalı Kaskad Kazan', 'Buhar Kazanı (Doğalgaz / Sıvı Yakıt)', 'Kızgın Yağ / Sıcak Su Kazanı'], default: 'Sıcak Su / Kalorifer Kazanı (Doğalgaz)' },
                { key: 'marka_model', label: 'Marka / Model / Seri No', type: 'text', presets: ['VIESSMANN', 'BUDERUS', 'ALARKO', 'EKOMAX', 'MIMSAN'], default: 'BUDERUS / VIESSMANN' },
                { key: 'kapasite_kw', label: 'Isıl Kapasite (kW / kcal/h)', type: 'text', default: '450 kW (387.000 kcal/h)' },
                { key: 'isletme_basinc_sicaklik', label: 'İşletme Basıncı (Bar) / Maks. Sıcaklık (°C)', type: 'text', default: '4.0 Bar / 90 °C' }
            ],
            visualChecks: [
                { id: 'chk_2056_sv', code: 'A', text: 'Kazan üzerinde emniyet ventili mevcut, tahliye borusu güvenli yere yönlendirilmiş ve çalışır durumda mı?', isCritical: true, defect: 'Kazan emniyet ventili arızalı veya tahliye hattı uygunsuzdur.' },
                { id: 'chk_2056_thermo', code: 'B', text: 'Termometre, hidrometre/manometre ve limit (emniyet) termostatı aktif çalışıyor mu?', isCritical: true, defect: 'Kazan üzerindeki termometre veya manometre arızalıdır.' },
                { id: 'chk_2056_burner', code: 'C', text: 'Brülör gaz yolu emniyet donanımları, gaz kaçak dedektörü ve selenoid valf çalışıyor mu?', isCritical: true, defect: 'Kazan dairesi doğalgaz algılama dedektörü veya acil gaz kesme selenoid valfi çalışmamaktadır.' },
                { id: 'chk_2056_chimney', code: 'D', text: 'Duman bacası bağlantısı sızdırmaz, çekişi uygun ve kazan dairesi havalandırması yeterli mi?', isCritical: true, defect: 'Kazan duman bacası bağlantısında kaçak veya kazan dairesi taze hava menfezinde tıkanıklık vardır.' }
            ],
            tableTitle: 'KAZAN GÜVENLİK DONANIMLARI VE İŞLETME ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'param', label: 'Kontrol / Test Kalemi', width: '36%' },
                { key: 'measured', label: 'Ölçülen / Gözlenen Değer', width: '26%' },
                { key: 'limit', label: 'Standart Kriter', width: '24%' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { param: 'Çalışma Sıcaklığı (°C) ve Limit Termostat', measured: '72 °C (Limit: 95 °C Aktif)', limit: '≤ 90-100 °C', result: 'Uygun' },
                { param: 'İşletme Basıncı ve Emniyet Ventili', measured: '2.4 Bar (SV: 4.0 Bar)', limit: '≤ Maks. İşletme Basıncı', result: 'Uygun' },
                { param: 'Gaz Algılama ve Acil Durdurma Sistemi', measured: 'Aktif ve Çalışır Durumda', limit: 'Tam Fonksiyon', result: 'Uygun' }
            ]
        },

        // 1591 - FORKLİFT
        '1591': {
            templateId: '1591',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.120',
            docNo: 'TKM-FR.120, REV.00 / YT: 01.09.2025',
            category: 'Kaldırma İletme',
            title: 'FORKLİFT (ENDÜSTRİYEL İSTİF ARACI) PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği', 'TS EN ISO 3691-1 Endüstriyel Araçlar - Güvenlik Kuralları', 'TS ISO 5057 Forklift Çatal Kolları Muayenesi', 'FEM 4.004'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'marka_model', label: 'Marka / Model', type: 'text', presets: ['TOYOTA', 'LINDE', 'STILL', 'JUNGHEINRICH', 'HYSTER', 'CAT'], default: 'TOYOTA / 8FBE18' },
                { key: 'seri_yil', label: 'Seri No / İmal Yılı / Çalışma Saati', type: 'text', default: '2022 / 1450 Saat' },
                { key: 'tahrik_tipi', label: 'Tahrik / Yakıt Tipi', type: 'select', options: ['Elektrikli (Akülü)', 'Dizel Motorlu', 'LPG Motorlu'], default: 'Elektrikli (Akülü)' },
                { key: 'kapasite_kg', label: 'Nominal Kaldırma Kapasitesi', type: 'text', unit: 'kg', presets: ['1500 kg', '1800 kg', '2000 kg', '2500 kg', '3000 kg', '5000 kg'], default: '1800 kg' },
                { key: 'kaldirma_yuksekligi', label: 'Maks. Kaldırma Yüksekliği / Yük Merkezi', type: 'text', default: '4500 mm / 500 mm' },
                { key: 'catal_olculeri', label: 'Çatal Ölçüleri (Uzunluk x Genişlik x Kalınlık)', type: 'text', default: '1200 x 100 x 40 mm' }
            ],
            visualChecks: [
                { id: 'chk_1591_forks', code: 'A', text: 'Çatal kollarında çatlak yok, topuk aşınması %10 sınırının altında ve çatal kilit pimleri sağlam mı?', isCritical: true, defect: 'Forklift çatal kollarında TS ISO 5057 sınırını (%10) aşan topuk aşınması veya çatal sabitleme pimi eksikliği tespit edilmiştir.' },
                { id: 'chk_1591_chain', code: 'B', text: 'Asansör kaldırma zincirlerinde uzama (<%3), kırık bakla veya hidrolik silindirlerde yağ kaçağı yok mu?', isCritical: true, defect: 'Asansör kaldırma zincirlerinde aşırı uzama veya hidrolik kaldırma silindirinde yağ kaçağı mevcuttur.' },
                { id: 'chk_1591_brake', code: 'C', text: 'Servis freni ve el (park) freni yüklü durumda aracı güvenle durdurup sabit tutuyor mu?', isCritical: true, defect: 'Forklift servis freni veya el (park) freni tutmamaktadır.' },
                { id: 'chk_1591_belt', code: 'D', text: 'Operatör koltuğu, emniyet kemeri, koltuk switch\'i ve baş üstü koruyucu kabin (ROPS/FOPS) sağlam mı?', isCritical: true, defect: 'Forklift operatör koltuğunda emniyet kemeri bulunmamaktadır veya arızalıdır.' },
                { id: 'chk_1591_horn', code: 'E', text: 'Korna, geri vites sesli ikazı, tepe flaşör lambası, farlar ve dikiz aynası çalışıyor mu?', isCritical: true, defect: 'Forklift geri vites sesli uyarı kornası veya tepe ikaz lambası çalışmamaktadır.' },
                { id: 'chk_1591_tires', code: 'F', text: 'Lastiklerde yarılma/parça kopması yok, bijonlar tam ve yük diyagramı etiketi okunaklı mı?', isCritical: false, defect: 'Forklift lastiklerinde aşırı aşınma/parçalanma veya yük kapasite diyagramı eksikliği mevcuttur.' }
            ],
            tableTitle: 'FORKLİFT ÇATAL AŞINMA, ZİNCİR VE YÜK TESTİ TABLOSU',
            tableColumns: [
                { key: 'test_item', label: 'Kontrol / Test Kalemi', width: '32%' },
                { key: 'measured', label: 'Ölçülen Değer / Tepki', width: '28%' },
                { key: 'reference', label: 'Standart Sınır Değer', width: '26%' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { test_item: 'Sağ / Sol Çatal Topuk Kalınlığı (mm)', measured: '39.2 mm / 39.4 mm (Orijinal: 40 mm)', reference: 'Max %10 Aşınma (≥ 36 mm)', result: 'Uygun' },
                { test_item: 'Kaldırma Zinciri Uzama Oranı (%)', measured: '%0.8 Uzama', reference: '≤ %2 - %3 (TS ISO 4347)', result: 'Uygun' },
                { test_item: 'Nominal Yükle Statik & Hidrolik Kaçırma Testi (10 dk)', measured: '1800 kg yükte 4 mm çökme', reference: '≤ 100 mm / 10 dk', result: 'Uygun' },
                { test_item: 'Yüklü Dinamik Hareket ve Frenleme Testi', measured: 'Kayma ve Deformasyon Yok', reference: 'Tam Fonksiyon', result: 'Uygun' }
            ]
        },

        // 2143 - TRANSPALET / İSTİF MAKİNESİ
        '2143': {
            templateId: '2143',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.121',
            docNo: 'TKM-FR.121, REV.00 / YT: 01.09.2025',
            category: 'Kaldırma İletme',
            title: 'AKÜLÜ / MANUEL TRANSPALET VE İSTİF MAKİNESİ PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628', 'TS EN ISO 3691-1 / TS EN ISO 3691-5 Yaya Kumandalı Araçlar', 'FEM 4.004'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'ekipman_turu', label: 'Ekipman Cinsi', type: 'select', options: ['Manuel El Transpaleti', 'Akülü Yaya Kumandalı Transpalet', 'Akülü Yaya Kumandalı İstif Makinesi (Stacker)', 'Terazili Transpalet'], default: 'Manuel El Transpaleti' },
                { key: 'marka_seri', label: 'Marka / Model / Seri No', type: 'text', presets: ['JUNGHEINRICH', 'LINDE', 'STILL', 'CROWN', 'NETLIFT', 'BIGLIFT'], default: 'JUNGHEINRICH' },
                { key: 'kapasite_kg', label: 'Kaldırma Kapasitesi', type: 'text', unit: 'kg', presets: ['1500 kg', '2000 kg', '2500 kg', '3000 kg'], default: '2500 kg' },
                { key: 'kaldirma_yuksekligi', label: 'Kaldırma Yüksekliği / Çatal Boyu', type: 'text', default: '200 mm / 1150 mm' }
            ],
            visualChecks: [
                { id: 'chk_2143_pump', code: 'A', text: 'Hidrolik pompa, kaldırma-indirme kolu ve emniyet valfi yağ kaçırmadan çalışıyor mu?', isCritical: true, defect: 'Transpalet hidrolik pompasında yağ kaçağı vardır veya yük altında kendi kendine inmektedir.' },
                { id: 'chk_2143_wheel', code: 'B', text: 'Yön ve yük tekerleklerinde kırık, düzleşme veya rulman dağılması yok mu?', isCritical: true, defect: 'Transpalet yük/yön tekerlekleri parçalanmış olup hareket güvenliğini bozmaktadır.' },
                { id: 'chk_2143_belly', code: 'C', text: 'Akülü modellerde; acil stop, korna ve operatör sıkışma önleyici (göbek/karın) butonu çalışıyor mu?', isCritical: true, defect: 'Akülü istif/transpalet üzerinde operatör sıkışma önleyici (karın) butonu veya acil stop çalışmamaktadır.' },
                { id: 'chk_2143_chassis', code: 'D', text: 'Çatal şasisinde eğilme, çatlak yok ve kapasite etiketi okunaklı mı?', isCritical: false, defect: 'Transpalet çatallarında simetri bozukluğu/eğilme veya kapasite etiketi eksikliği mevcuttur.' }
            ],
            tableTitle: 'TRANSPALET / İSTİF MAKİNESİ YÜK VE FONKSİYON TEST TABLOSU',
            tableColumns: [
                { key: 'test_item', label: 'Test Kalemi', width: '34%' },
                { key: 'measured', label: 'Gözlenen / Ölçülen Değer', width: '28%' },
                { key: 'reference', label: 'Standart Kriter', width: '24%' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { test_item: 'Hidrolik Yük Tutma / Sızdırmazlık Testi', measured: 'Yük Altında Çökme Yok', reference: 'Kaçırma Olmamalı', result: 'Uygun' },
                { test_item: 'Kaldırma, İndirme ve Yürüyüş Fonksiyon Testi', measured: 'Normal ve Dengeli', reference: 'Tam Fonksiyon', result: 'Uygun' }
            ]
        },

        // 2140 - VİNÇ / CARASKAL
        '2140': {
            templateId: '2140',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.122',
            docNo: 'TKM-FR.122, REV.00 / YT: 01.09.2025',
            category: 'Kaldırma İletme',
            title: 'VİNÇ VE CARASKAL (KALDIRMA EKİPMANI) PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği', 'TS EN 13001 / TS EN 15011 Köprülü ve Portal Vinçler', 'TS EN 14492-2 Güç Tahrikli Caraskallar', 'TS ISO 4309 Çelik Halat Muayenesi'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'vinc_tipi', label: 'Kaldırma Ekipmanı Tipi', type: 'select', options: ['Tavan (Gezer Köprülü) Vinç', 'Monoray Elektrikli Caraskal', 'Pergel Vinç', 'Portal Vinç', 'Manuel Zincirli Caraskal'], default: 'Monoray Elektrikli Caraskal' },
                { key: 'marka_seri', label: 'Marka / Model / Seri No / İmal Yılı', type: 'text', presets: ['DEMAG', 'ABUS', 'KONECRANES', 'BÜLBÜLOĞLU', 'GÜRALP', 'YALE'], default: 'DEMAG / 2022' },
                { key: 'kapasite_kg', label: 'Nominal Kaldırma Kapasitesi (Q)', type: 'text', unit: 'kg', presets: ['500 kg', '1000 kg', '2000 kg', '3200 kg', '5000 kg', '10000 kg'], default: '2000 kg' },
                { key: 'halat_zincir', label: 'Halat / Zincir Çapı ve Donanım', type: 'text', default: 'Ø 8 mm Bakla Zincir / Çelik Halat' },
                { key: 'kaldirma_yuksekligi', label: 'Kaldırma Yüksekliği / Köprü Açıklığı (m)', type: 'text', default: '6 m' },
                { key: 'kumanda_tipi', label: 'Kumanda Şekli', type: 'select', options: ['Sarkıt Buton Kumandalı (24V/48V)', 'Kablosuz Radyo Frekans (Uzaktan) Kumandalı', 'Sarkıt + Uzaktan Kumandalı', 'Manuel Zincirli'], default: 'Sarkıt Buton Kumandalı (24V/48V)' }
            ],
            visualChecks: [
                { id: 'chk_2140_hook', code: 'A', text: 'Yük kancasında ağız açıklığı genişlemesi (<%10) yok ve kanca emniyet mandalı sağlam mı?', isCritical: true, defect: 'Vinç yük kancası üzerinde yükün kurtulmasını önleyen emniyet mandalı bulunmamaktadır veya kırık durumdadır.' },
                { id: 'chk_2140_rope', code: 'B', text: 'Çelik halat veya yük zincirinde tel kırığı, ezilme, korozyon veya aşırı uzama yok mu?', isCritical: true, defect: 'Kaldırma halatında/zincirinde TS ISO 4309 sınırlarını aşan tel kırığı ve deformasyon tespit edilmiştir.' },
                { id: 'chk_2140_limit', code: 'C', text: 'Alt ve üst kaldırma sınır kesicileri (Limit Switch) ile yürüyüş sınır switchleri aktif çalışıyor mu?', isCritical: true, defect: 'Vinç üst kaldırma sınır kesicisi (limit switch) çalışmamakta olup kanca tambura çarpmaktadır.' },
                { id: 'chk_2140_brake', code: 'D', text: 'Kaldırma motoru elektromanyetik freni test yükünü kaçırmadan güvenle tutuyor mu?', isCritical: true, defect: 'Kaldırma freni yük altında kaçırma yapmakta olup fren balata ayarı/bakımı yapılmalıdır.' },
                { id: 'chk_2140_ctrl', code: 'E', text: 'Kumanda üzerinde Acil Stop butonu aktif, yön etiketleri net ve taşıyıcı çelik halatı bağlı mı?', isCritical: true, defect: 'Sarkıt kumanda üzerinde acil durdurma butonu çalışmamakta veya kumanda kablosu çelik gergi teli olmadan taşınmaktadır.' },
                { id: 'chk_2140_cap', code: 'F', text: 'Vinç kirişi/gövdesi üzerinde azami kaldırma kapasitesi (kg/ton) levhası ve sesli/ışıklı ikaz var mı?', isCritical: false, defect: 'Vinç üzerinde nominal kaldırma kapasitesini belirten okunaklı yük levhası bulunmamaktadır.' }
            ],
            tableTitle: 'VİNÇ / CARASKAL KANCA, HALAT VE YÜK TESTİ TABLOSU',
            tableColumns: [
                { key: 'test_type', label: 'Test / Ölçüm Kalemi', width: '32%' },
                { key: 'applied', label: 'Uygulanan Yük / Ölçüm', width: '24%' },
                { key: 'observed', label: 'Gözlenen Değer / Tepki', width: '30%' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { test_type: 'Kanca Ağız Açıklığı / Gövde Ölçümü', applied: 'Kumpas ile Ölçüm', observed: 'Kalıcı Açılma ve Çatlak Yok', result: 'Uygun' },
                { test_type: 'Fonksiyon ve Limit Switch Testi (Yüksüz)', applied: 'Yüksüz Tam Hareket', observed: 'Alt/Üst Limit ve Acil Stop Aktif', result: 'Uygun' },
                { test_type: 'Dinamik Yük Testi (1.1 x Q)', applied: '2200 kg', observed: 'Kaldırma, Yürütme ve Frenleme Uygun', result: 'Uygun' },
                { test_type: 'Statik Yük Testi (1.25 x Q - 10 dk)', applied: '2500 kg', observed: 'Fren Kaçırması ve Kalıcı Sehim Yok', result: 'Uygun' }
            ]
        },

        // 2035 - YÜKSELTİLEBİLEN SEYYAR İŞ PLATFORMU (MAKASLI / EKLEMLİ PLATFORM)
        '2035': {
            templateId: '2035',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.125',
            docNo: 'TKM-FR.125, REV.00 / YT: 01.09.2025',
            category: 'Kaldırma İletme',
            title: 'YÜKSELTİLEBİLEN SEYYAR İŞ PLATFORMU PERİYODİK KONTROL RAPORU',
            methods: ['RG, 25.04.2013 - 28628', 'TS EN 280+A1 Yükseltilebilen Seyyar İş Platformları'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'platform_tipi', label: 'Platform Tipi', type: 'select', options: ['Akülü Makaslı Platform', 'Eklemli / Teleskopik Bomlu Platform', 'Dikey Personel Yükseltici'], default: 'Akülü Makaslı Platform' },
                { key: 'marka_model', label: 'Marka / Model / Seri No', type: 'text', presets: ['HAULOTTE', 'GENIE', 'JLG', 'ZOOMLION', 'ELS', 'DINGLI'], default: 'HAULOTTE / Compact 10' },
                { key: 'kapasite_kg', label: 'Sepet Taşıma Kapasitesi (kg / Kişi)', type: 'text', default: '230 kg (2 Kişi)' },
                { key: 'calisma_yuksekligi', label: 'Maksimum Çalışma Yüksekliği', type: 'text', unit: 'm', default: '10.0 m' }
            ],
            visualChecks: [
                { id: 'chk_2035_rail', code: 'A', text: 'Sepet korkulukları (min. 1.1 m), ara korkuluk, süpürgelik ve kendiliğinden kapanan kapı sağlam mı?', isCritical: true, defect: 'Platform sepet korkulukları veya kapı kilitleme mekanizması hasarlıdır.' },
                { id: 'chk_2035_estop', code: 'B', text: 'Hem sepet hem şasi kumanda panelinde Acil Stop ve acil manuel indirme valfi çalışıyor mu?', isCritical: true, defect: 'Platform acil durum manuel indirme valfi veya acil durdurma butonu çalışmamaktadır.' },
                { id: 'chk_2035_tilt', code: 'C', text: 'Eğim sensörü (şasi su terazisi), çukur koruma barları ve aşırı yük sensörü aktif mi?', isCritical: true, defect: 'Platform eğim/devrilme emniyet sensörü veya çukur koruma kolları devre dışıdır.' },
                { id: 'chk_2035_hyd', code: 'D', text: 'Makas mekanizması, emniyet takozu, hidrolik silindir ve hortumlarda yağ kaçağı yok mu?', isCritical: true, defect: 'Platform hidrolik kaldırma silindirinde yağ kaçağı tespit edilmiştir.' }
            ],
            tableTitle: 'SEYYAR İŞ PLATFORMU FONKSİYON VE YÜK TESTİ TABLOSU',
            tableColumns: [
                { key: 'test_item', label: 'Test Kalemi', width: '36%' },
                { key: 'measured', label: 'Gözlenen / Ölçülen', width: '30%' },
                { key: 'reference', label: 'Kriter (TS EN 280)', width: '20%' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { test_item: 'Alt ve Üst Kumanda + Acil Stop Testi', measured: 'Tam Fonksiyon Aktif', reference: 'Anında Kesmeli', result: 'Uygun' },
                { test_item: 'Acil Durum Manuel İndirme Valfi Testi', measured: 'Enerjisiz Güvenli İndirdi', reference: 'Çalışır Olmalı', result: 'Uygun' },
                { test_item: 'Nominal Sepet Yükü ile Kaldırma ve Bekleme Testi', measured: '230 kg ile Çökme Yok', reference: 'Hidrolik Tutmalı', result: 'Uygun' }
            ]
        },

        // 1737 - MAKİNA / TEZGAH GÜVENLİĞİ
        '1737': {
            templateId: '1737',
            schemaVersion: 1,
            engineVersion: 1,
            code: 'TKM-FR.160',
            docNo: 'TKM-FR.160, REV.00 / YT: 01.09.2025',
            category: 'Makina',
            title: 'MAKİNA VE TEZGAHLAR PERİYODİK KONTROL VE GÜVENLİK MUAYENE RAPORU',
            methods: ['RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği', 'TS EN ISO 12100 Makinalarda Güvenlik', 'TS EN 60204-1 Makinaların Elektrik Donanımı', 'TS EN ISO 13850 Acil Durdurma'],
            layoutHints: { fieldGridColumns: 2, checklistColumns: 1, showDevices: true },
            generalFields: [
                { key: 'makina_cinsi', label: 'Makina / Tezgah Cinsi', type: 'text', default: 'Üretim Tezgahı / Pres / CNC / Testere' },
                { key: 'marka_seri', label: 'Marka / Model / Seri No / İmal Yılı', type: 'text', default: 'STANDART / 2021' },
                { key: 'besleme_guc', label: 'Elektrik Beslemesi / Motor Gücü', type: 'text', default: '380V AC 3 Faz / 7.5 kW' },
                { key: 'operasyon_modu', label: 'Kumanda ve Koruma Tipi', type: 'text', default: 'Muhafaza Switchli / Çift El / Işık Perdeli' }
            ],
            visualChecks: [
                { id: 'chk_1737_guard', code: 'A', text: 'Hareketli ve döner operasyon noktalarında koruyucu siper/kapak ve emniyet switch\'i mevcut mu?', isCritical: true, defect: 'Makina hareketli/kesici operasyon bölgesinde koruyucu muhafaza veya kapak emniyet switch\'i bulunmamaktadır.' },
                { id: 'chk_1737_estop', code: 'B', text: 'Operatör erişim noktasında mantar başlı kilitli Acil Durdurma (E-Stop) butonu aktif çalışıyor mu?', isCritical: true, defect: 'Makina üzerindeki acil durdurma (E-Stop) butonu basıldığında hareketi anında durdurmamaktadır.' },
                { id: 'chk_1737_restart', code: 'C', text: 'Acil stop kaldırıldığında veya elektrik kesilip geldiğinde makina kendiliğinden çalışmıyor mu?', isCritical: true, defect: 'Acil durdurma butonu kurulduğunda Start butonuna basılmadan makina kendiliğinden devreye girmektedir.' },
                { id: 'chk_1737_pe', code: 'D', text: 'Makina elektrik panosu, kablo rakorları ve gövde koruma topraklaması uygun mu?', isCritical: true, defect: 'Makina gövde koruma topraklaması bağlantısı kopuk veya yetersizdir.' }
            ],
            tableTitle: 'MAKİNA EMNİYET DONANIMLARI VE TOPRAKLAMA ÖLÇÜM TABLOSU',
            tableColumns: [
                { key: 'test_item', label: 'Kontrol / Test Edilen Kısım', width: '36%' },
                { key: 'measured', label: 'Ölçülen / Gözlenen Değer', width: '28%' },
                { key: 'reference', label: 'Standart Kriter', width: '22%' },
                { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
            ],
            defaultRows: [
                { test_item: 'Acil Durdurma (E-Stop) Fonksiyon Testi', measured: 'Anında Durdu / Kendiliğinden Başlamadı', reference: 'TS EN ISO 13850', result: 'Uygun' },
                { test_item: 'Operasyon Bölgesi Muhafaza / Switch Testi', measured: 'Muhafaza Tam ve Aktif', reference: 'TS EN ISO 12100', result: 'Uygun' },
                { test_item: 'Gövde Koruma Topraklaması Sürekliliği', measured: '0.09 Ω', reference: '≤ 0.20 Ω (TS EN 60204-1)', result: 'Uygun' }
            ]
        }
    };

    // Mevcut SPECIALIZED_SCHEMAS (2202, 2205 vb.) varsa kaydet
    if (window.SPECIALIZED_SCHEMAS) {
        Object.keys(window.SPECIALIZED_SCHEMAS).forEach(tid => {
            if (!MASTER_SCHEMAS_V1[tid]) {
                const legacy = window.SPECIALIZED_SCHEMAS[tid];
                MASTER_SCHEMAS_V1[tid] = normalizeRawSchemaObject(legacy, tid, '');
            }
        });
    }

    function normalizeRawSchemaObject(raw, templateId, equipmentName) {
        const tid = String(templateId || raw.templateId || 'generic').trim();
        const eqTitle = (equipmentName || raw.title || 'İŞ EKİPMANI').toUpperCase();
        const rawDocNo = raw.docNo || raw.code || 'TKM-FR.100, REV.00 / YT: 01.09.2025';
        const baseCode = String(raw.code || rawDocNo.split(',')[0] || 'TKM-FR.100').trim();

        const generalFields = (raw.generalFields || raw.fields || []).map((f, idx) => ({
            key: String(f.key || f.id || `fld_${idx}`),
            label: f.label || `Alan ${idx + 1}`,
            type: f.type || ((Array.isArray(f.options) && f.options.length > 0) ? 'select' : 'text'),
            unit: f.unit || '',
            options: Array.isArray(f.options) ? f.options : undefined,
            presets: Array.isArray(f.presets) ? f.presets : undefined,
            negativeValues: Array.isArray(f.negativeValues) ? f.negativeValues : ['Yok', 'Uygun Değil', 'Uygunsuz', 'Arızalı', 'Kapalı / Arızalı'],
            default: f.default !== undefined ? f.default : ''
        }));

        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
        const visualChecks = (raw.visualChecks || []).map((item, idx) => {
            if (typeof item === 'string') {
                return {
                    id: `chk_${tid}_${idx}`,
                    legacyKey: `chk_${idx}`,
                    index: idx,
                    code: letters[idx] || String(idx + 1),
                    text: item,
                    isCritical: idx < 3,
                    defect: `${item.replace(/\?$/, '')} kriterinde uygunsuzluk tespit edilmiştir.`
                };
            }
            return {
                id: String(item.id || `chk_${tid}_${idx}`),
                legacyKey: `chk_${idx}`,
                index: idx,
                code: item.code || letters[idx] || String(idx + 1),
                group: item.group || '',
                text: item.text || '',
                isCritical: item.isCritical !== undefined ? Boolean(item.isCritical) : true,
                defect: item.defect || item.defectText || `${(item.text || '').replace(/\?$/, '')} kriterinde uygunsuzluk tespit edilmiştir.`
            };
        });

        const tableColumns = (raw.tableColumns || []).map((col, cIdx) => ({
            key: String(col.key || col.id || `col_${cIdx}`),
            label: col.label || `Sütun ${cIdx + 1}`,
            width: col.width || '',
            unit: col.unit || '',
            options: Array.isArray(col.options) ? col.options : undefined,
            presets: Array.isArray(col.presets) ? col.presets : undefined,
            default: col.default !== undefined ? col.default : '',
            limitRule: col.limitRule || null
        }));

        return {
            templateId: tid,
            schemaVersion: Number(raw.schemaVersion || 1),
            engineVersion: Number(raw.engineVersion || 1),
            code: baseCode,
            docNo: rawDocNo,
            category: raw.category || 'Genel Muayene',
            title: raw.title || `${eqTitle} PERİYODİK KONTROL VE MUAYENE RAPORU`,
            methods: Array.isArray(raw.methods) && raw.methods.length ? raw.methods : [
                'RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği',
                'İlgili TS EN ve ISO Standartları'
            ],
            layoutHints: Object.assign({ fieldGridColumns: 2, checklistColumns: 1, showDevices: true }, raw.layoutHints || {}),
            generalFields,
            visualChecks,
            tableTitle: raw.tableTitle || 'FONKSİYON TESTİ VE ÖLÇÜM DEĞERLERİ TABLOSU',
            tableColumns,
            defaultRows: Array.isArray(raw.defaultRows) ? raw.defaultRows : []
        };
    }

    // Ekipman adına göre akıllı şablon eşleştirme (Fallback)
    function inferTemplateIdFromEquipmentName(equipmentName) {
        const eq = String(equipmentName || '').toUpperCase();
        if (eq.includes('PARATONER') || eq.includes('YILDIRIM')) return '2074';
        if (eq.includes('YANGIN ALGILAMA') || eq.includes('İHBAR') || eq.includes('DEDEKTÖR')) return '2042';
        if (eq.includes('KOMPANZASYON')) return '2139';
        if (eq.includes('TRAFO') || eq.includes('TRANSFORMATÖR')) return '2203';
        if (eq.includes('ACİL AYDINLATMA') || eq.includes('YÖNLENDİRME') || eq.includes('EXIT')) return '1668';
        if (eq.includes('UPS') || eq.includes('KESİNTİSİZ') || eq.includes('AKÜ')) return '2204';
        if (eq.includes('ARAÇ ŞARJ') || eq.includes('EV ŞARJ')) return '2141';
        if (eq.includes('KATODİK')) return '1851';
        if (eq.includes('YALITIM') || eq.includes('İZOLASYON')) return eq.includes('ZEMİN') || eq.includes('PASPAS') ? '1762' : '1758';
        if (eq.includes('HARMONİK') || eq.includes('ENERJİ KALİTE')) return '2122';
        if (eq.includes('SPRİNKLER') || eq.includes('YAĞMURLAMA')) return '2150';
        if (eq.includes('YANGIN DOLAP') || eq.includes('YANGIN DOLABI')) return '2160';
        if (eq.includes('TÜP') || eq.includes('SÖNDÜRME CİHAZ')) return '2196';
        if (eq.includes('YANGIN POMPA')) return '2151';
        if (eq.includes('HAVALANDIRMA') || eq.includes('KLİMA')) return '2153';
        if (eq.includes('KAPI')) return '2159';
        if (eq.includes('RAF')) return '2096';
        if (eq.includes('HAVA TANK') || eq.includes('KOMPRESÖR')) return '2187';
        if (eq.includes('GENLEŞME') || eq.includes('HİDROFOR')) return '2179';
        if (eq.includes('KAZAN') || eq.includes('BUHAR') || eq.includes('KALORİFER')) return '2056';
        if (eq.includes('FORKLİFT')) return '1591';
        if (eq.includes('TRANSPALET') || eq.includes('İSTİF')) return '2143';
        if (eq.includes('VİNÇ') || eq.includes('CARASKAL') || eq.includes('MONORAY')) return '2140';
        if (eq.includes('PLATFORM') || eq.includes('MAKASLI')) return '2035';
        if (eq.includes('MAKİNA') || eq.includes('TEZGAH') || eq.includes('PRES')) return '1737';
        return '';
    }

    // ========================================================================
    // 2. FİRMA ÖZELLEŞTİRME & TASARIM TOKENLARI YÖNETİCİSİ (TENANT OVERLAY)
    // ========================================================================
    const UniversalTenantOverlay = {
        getDesignTokens(formData = null) {
            // Eğer rapor mühürlenmişse (sealed snapshot), raporun dondurulmuş tasarım tokenlarını kullan!
            if (formData && formData.universalSnapshot && formData.universalSnapshot.isSealed && formData.universalSnapshot.designTokens) {
                return Object.assign({}, DEFAULT_PDF_DESIGN_TOKENS, formData.universalSnapshot.designTokens);
            }
            try {
                const raw = localStorage.getItem(DESIGN_TOKENS_STORAGE_KEY);
                if (raw) {
                    return Object.assign({}, DEFAULT_PDF_DESIGN_TOKENS, JSON.parse(raw));
                }
            } catch (e) {}
            return Object.assign({}, DEFAULT_PDF_DESIGN_TOKENS);
        },

        saveDesignTokens(nextTokens) {
            const current = this.getDesignTokens();
            const merged = Object.assign({}, current, nextTokens || {});
            try {
                localStorage.setItem(DESIGN_TOKENS_STORAGE_KEY, JSON.stringify(merged));
            } catch (e) {}
            return merged;
        },

        getAllTemplateOverlays() {
            try {
                const raw = localStorage.getItem(TENANT_OVERLAY_STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object') return parsed;
                }
            } catch (e) {}
            return {};
        },

        getTemplateOverlay(templateId) {
            const all = this.getAllTemplateOverlays();
            return all[String(templateId)] || null;
        },

        saveTemplateOverlay(templateId, overlayObj) {
            const tid = String(templateId || '').trim();
            if (!tid) return null;
            const all = this.getAllTemplateOverlays();
            all[tid] = Object.assign({
                updatedAt: new Date().toISOString(),
                customTitle: '',
                customDocNo: '',
                addedFields: [],
                hiddenFields: [],
                addedChecks: [],
                hiddenChecks: [],
                layoutOverrides: {}
            }, overlayObj || {});
            try {
                localStorage.setItem(TENANT_OVERLAY_STORAGE_KEY, JSON.stringify(all));
            } catch (e) {}
            return all[tid];
        },

        resetTemplateOverlay(templateId) {
            const tid = String(templateId || '').trim();
            const all = this.getAllTemplateOverlays();
            delete all[tid];
            try {
                localStorage.setItem(TENANT_OVERLAY_STORAGE_KEY, JSON.stringify(all));
            } catch (e) {}
        },

        applyOverlayToSchema(masterSchema, templateId, designTokens) {
            const cloned = JSON.parse(JSON.stringify(masterSchema));
            const tokens = designTokens || this.getDesignTokens();

            // 1. Genel firma doküman kodu ön eki özelleştirmesi (örn: TKM-FR. -> ABC-FR.)
            if (tokens.docCodePrefixOverride && tokens.docCodePrefixOverride.trim()) {
                const prefix = tokens.docCodePrefixOverride.trim();
                cloned.code = cloned.code.replace(/^[A-Z0-9_-]+-FR\./i, prefix.endsWith('.') ? prefix : `${prefix}`);
                cloned.docNo = cloned.docNo.replace(/^[A-Z0-9_-]+-FR\./i, prefix.endsWith('.') ? prefix : `${prefix}`);
            }

            // 2. Şablona özel firma yaması (Overlay)
            const ov = this.getTemplateOverlay(templateId);
            if (!ov) return cloned;

            if (ov.customTitle && ov.customTitle.trim()) {
                cloned.title = ov.customTitle.trim();
            }
            if (ov.customDocNo && ov.customDocNo.trim()) {
                cloned.docNo = ov.customDocNo.trim();
                cloned.code = ov.customDocNo.split(',')[0].trim();
            }
            if (ov.layoutOverrides && typeof ov.layoutOverrides === 'object') {
                cloned.layoutHints = Object.assign({}, cloned.layoutHints || {}, ov.layoutOverrides);
            }

            // Gizlenen teknik alanlar
            if (Array.isArray(ov.hiddenFields) && ov.hiddenFields.length > 0) {
                const hideSet = new Set(ov.hiddenFields);
                cloned.generalFields = cloned.generalFields.filter(f => !hideSet.has(f.key));
            }
            // Eklenen firma özel teknik alanları
            if (Array.isArray(ov.addedFields) && ov.addedFields.length > 0) {
                ov.addedFields.forEach((af, i) => {
                    if (!af || !af.label) return;
                    const key = af.key || `custom_fld_${i}_${af.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                    if (!cloned.generalFields.some(x => x.key === key)) {
                        cloned.generalFields.push({
                            key,
                            label: af.label,
                            type: af.type || 'text',
                            unit: af.unit || '',
                            options: af.options,
                            default: af.default || '',
                            isTenantCustom: true
                        });
                    }
                });
            }

            // Gizlenen kontrol maddeleri
            if (Array.isArray(ov.hiddenChecks) && ov.hiddenChecks.length > 0) {
                const hideChkSet = new Set(ov.hiddenChecks);
                cloned.visualChecks = cloned.visualChecks.filter(c => !hideChkSet.has(c.id));
            }
            // Eklenen firma özel kontrol maddeleri
            if (Array.isArray(ov.addedChecks) && ov.addedChecks.length > 0) {
                const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Y', 'Z'];
                ov.addedChecks.forEach((ac, i) => {
                    if (!ac || !ac.text) return;
                    const nextIdx = cloned.visualChecks.length;
                    const id = ac.id || `custom_chk_${templateId}_${i}`;
                    cloned.visualChecks.push({
                        id,
                        legacyKey: `chk_${nextIdx}`,
                        index: nextIdx,
                        code: letters[nextIdx] || String(nextIdx + 1),
                        text: ac.text,
                        isCritical: ac.isCritical !== false,
                        defect: ac.defect || `${ac.text.replace(/\?$/, '')} kriterinde uygunsuzluk tespit edilmiştir.`,
                        isTenantCustom: true
                    });
                });
            }

            cloned.hasTenantOverlay = true;
            return cloned;
        }
    };

    // ========================================================================
    // 3. EVRENSEL ŞEMA KAYIT DEFTERİ VE SNAPSHOT ÇÖZÜCÜ
    // ========================================================================
    const UniversalSchemaRegistry = {
        getAllCatalogTemplates() {
            const active = window.ENLAB_REPORT_TEMPLATES || [];
            const backup = window.ENLAB_ALL_REPORT_TEMPLATES_BACKUP || [];
            const mergedMap = new Map();
            active.forEach(t => mergedMap.set(String(t.id), t));
            backup.forEach(t => {
                if (!mergedMap.has(String(t.id))) mergedMap.set(String(t.id), t);
            });
            return Array.from(mergedMap.values());
        },

        resolveSchema(templateId, equipmentName = '', formData = null) {
            // 1. Eğer rapor mühürlenmişse (Immutable Snapshot), doğrudan rapor içindeki dondurulmuş şemayı döndür!
            if (formData && formData.universalSnapshot && formData.universalSnapshot.isSealed && formData.universalSnapshot.schema) {
                return formData.universalSnapshot.schema;
            }

            const tid = String(templateId || '').trim();
            let rawSchema = MASTER_SCHEMAS_V1[tid];

            if (!rawSchema) {
                const inferredTid = inferTemplateIdFromEquipmentName(equipmentName);
                if (inferredTid && MASTER_SCHEMAS_V1[inferredTid]) {
                    rawSchema = MASTER_SCHEMAS_V1[inferredTid];
                }
            }

            if (!rawSchema) {
                // Evrensel Yedek Mühendislik Şeması (Herhangi yeni bir 100+ ekipman için)
                const eqUpper = (equipmentName || 'İŞ EKİPMANI').toUpperCase();
                rawSchema = {
                    templateId: tid || 'generic',
                    schemaVersion: 1,
                    engineVersion: 1,
                    code: 'TKM-FR.100',
                    docNo: 'TKM-FR.100, REV.00 / YT: 01.09.2025',
                    category: 'Genel Muayene',
                    title: `${eqUpper} PERİYODİK KONTROL VE MUAYENE RAPORU`,
                    methods: [
                        'RG, 25.04.2013 - 28628 İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği',
                        'İlgili TS EN ve ISO Standartları'
                    ],
                    generalFields: [
                        { key: 'marka', label: 'Marka', type: 'text', default: 'STANDART' },
                        { key: 'model_tip', label: 'Model / Tip', type: 'text', default: equipmentName || '' },
                        { key: 'seri_no', label: 'Seri Numarası / İmal Yılı', type: 'text', default: '2023' },
                        { key: 'kapasite', label: 'Kapasite / Teknik Değer', type: 'text', default: 'Standart Kapasite' }
                    ],
                    visualChecks: [
                        'Ekipman gövde ve taşıyıcı elemanlarında çatlak, korozyon veya deformasyon bulunmuyor mu?',
                        'Emniyet ve güvenlik donanımları (acil durdurma, limit switch, valf vb.) çalışır durumda mı?',
                        'Elektriksel bağlantılar, kumanda panosu ve gövde topraklaması standartlara uygun mu?',
                        'Uyarı, kapasite ve kullanım talimatı etiketleri ekipman üzerinde okunaklı mı?',
                        'Fonksiyon ve yük/basınç testlerinde ekipman güvenli şekilde çalıştı mı?'
                    ],
                    tableTitle: 'FONKSİYON TESTİ VE ÖLÇÜM DEĞERLERİ TABLOSU',
                    tableColumns: [
                        { key: 'no', label: 'No', width: '10%' },
                        { key: 'test_item', label: 'Kontrol / Test Edilen Kısım', width: '32%' },
                        { key: 'measured', label: 'Ölçülen / Gözlenen Değer', width: '24%' },
                        { key: 'reference', label: 'Standart Kriter', width: '20%' },
                        { key: 'result', label: 'Sonuç', width: '14%', options: ['Uygun', 'Uygun Değil'] }
                    ],
                    defaultRows: [
                        { no: '1', test_item: 'Gözle Fiziksel Muayene', measured: 'Deformasyon Yok', reference: 'Hasarsız Olmalı', result: 'Uygun' },
                        { no: '2', test_item: 'Fonksiyon ve Emniyet Testi', measured: 'Normal Çalıştı', reference: 'Tam Fonksiyon', result: 'Uygun' }
                    ]
                };
            }

            const normalized = normalizeRawSchemaObject(rawSchema, tid, equipmentName);
            const tokens = UniversalTenantOverlay.getDesignTokens(formData);
            const effective = UniversalTenantOverlay.applyOverlayToSchema(normalized, tid, tokens);

            // Hazır kusur cümlelerini ITEM_DEFECT_CATALOG içine de kaydet ki mevcut kusur seçici modalı ile %100 uyumlu çalışsın
            if (window.ITEM_DEFECT_CATALOG && Array.isArray(effective.visualChecks)) {
                effective.visualChecks.forEach(chk => {
                    if (chk.text && chk.defect) {
                        if (!window.ITEM_DEFECT_CATALOG[chk.text]) {
                            window.ITEM_DEFECT_CATALOG[chk.text] = [chk.defect];
                        } else if (!window.ITEM_DEFECT_CATALOG[chk.text].includes(chk.defect)) {
                            window.ITEM_DEFECT_CATALOG[chk.text].unshift(chk.defect);
                        }
                    }
                });
            }

            return effective;
        },

        // Eski raporları hiç bozmadan kalıcı kimlikli (Semantic ID) veri yapısına eşitleyen adaptör
        ensureUniversalFormData(formData, templateId, equipmentName = '') {
            if (!formData) return null;
            const schema = this.resolveSchema(templateId, equipmentName, formData);

            if (!formData.specializedFields || typeof formData.specializedFields !== 'object') {
                formData.specializedFields = {};
            }
            if (!formData.specializedChecks || typeof formData.specializedChecks !== 'object') {
                formData.specializedChecks = {};
            }
            if (!formData.universalChecksById || typeof formData.universalChecksById !== 'object') {
                formData.universalChecksById = {};
            }
            if (!formData.universalSchemaMeta) {
                formData.universalSchemaMeta = {
                    templateId: schema.templateId,
                    schemaVersion: schema.schemaVersion || 1,
                    engineVersion: schema.engineVersion || 1,
                    initializedAt: new Date().toISOString()
                };
            }

            // 1. Teknik alanları (generalFields) hem kalıcı key ile koru hem varsayılanları hazırla
            (schema.generalFields || []).forEach(f => {
                if (formData.specializedFields[f.key] === undefined) {
                    formData.specializedFields[f.key] = f.default !== undefined ? f.default : '';
                }
            });

            // 2. Gözle kontrol maddelerini hem kalıcı ID (chk.id) hem eski sıra anahtarı (chk_0) ile çift yönlü senkron tut!
            (schema.visualChecks || []).forEach((chk, idx) => {
                const legacyKey = `chk_${idx}`;
                const semanticId = chk.id || legacyKey;
                const valBySemantic = formData.universalChecksById[semanticId];
                const valByLegacy = formData.specializedChecks[legacyKey];

                const resolvedVal = (valBySemantic !== undefined && valBySemantic !== '')
                    ? valBySemantic
                    : (valByLegacy !== undefined ? valByLegacy : '');

                formData.universalChecksById[semanticId] = resolvedVal;
                formData.specializedChecks[legacyKey] = resolvedVal;
            });

            // 3. Ölçüm tablosu satırlarını hem nesne (semantic column key) hem dizi (legacy positional) olarak senkron tut!
            const cols = schema.tableColumns || [];
            if (!Array.isArray(formData.universalTableRows) || formData.universalTableRows.length === 0) {
                if (Array.isArray(formData.specializedRows) && formData.specializedRows.length > 0) {
                    formData.universalTableRows = formData.specializedRows.map(r => {
                        const rowObj = {};
                        cols.forEach((c, cIdx) => {
                            if (Array.isArray(r)) {
                                rowObj[c.key] = r[cIdx] !== undefined ? String(r[cIdx]) : (c.default || '');
                            } else if (r && typeof r === 'object') {
                                rowObj[c.key] = r[c.key] !== undefined ? String(r[c.key]) : (c.default || '');
                            } else {
                                rowObj[c.key] = c.default || '';
                            }
                        });
                        return rowObj;
                    });
                } else if (Array.isArray(schema.defaultRows) && schema.defaultRows.length > 0) {
                    formData.universalTableRows = schema.defaultRows.map(dr => {
                        const rowObj = {};
                        cols.forEach(c => {
                            rowObj[c.key] = dr[c.key] !== undefined ? String(dr[c.key]) : (c.default || '');
                        });
                        return rowObj;
                    });
                } else {
                    const emptyRow = {};
                    cols.forEach(c => { emptyRow[c.key] = c.default || ''; });
                    formData.universalTableRows = [emptyRow];
                }
            }

            // Legacy specializedRows dizisini her zaman universalTableRows nesnelerinden güncelle (geriye dönük %100 uyum)
            formData.specializedRows = formData.universalTableRows.map(rowObj =>
                cols.map(c => (rowObj && rowObj[c.key] !== undefined) ? String(rowObj[c.key]) : '')
            );

            return schema;
        },

        // Raporun şema ve firma tasarımını dondurarak mühürler (Gelecekteki hiçbir güncelleme bu raporu bozamaz)
        sealReportSnapshot(formData, inspection, silent = false) {
            if (!formData) return false;
            const tid = (inspection && inspection.template_id) || formData.universalSchemaMeta?.templateId || 'generic';
            const eqName = (inspection && inspection.equipment_name) || '';

            // Geçici olarak mevcut mührü kaldırıp güncel şemayı çöz
            const prevSealed = formData.universalSnapshot;
            formData.universalSnapshot = null;
            const currentSchema = this.resolveSchema(tid, eqName, formData);
            const currentTokens = UniversalTenantOverlay.getDesignTokens();
            const currentBranding = (typeof CompanySettingsManager !== 'undefined')
                ? CompanySettingsManager.getSettings()
                : {};

            formData.universalSnapshot = {
                isSealed: true,
                sealedAt: new Date().toISOString(),
                schemaVersion: currentSchema.schemaVersion || 1,
                engineVersion: currentSchema.engineVersion || 1,
                schema: JSON.parse(JSON.stringify(currentSchema)),
                designTokens: JSON.parse(JSON.stringify(currentTokens)),
                branding: {
                    companyFullName: currentBranding.companyFullName || '',
                    companyShortName: currentBranding.companyShortName || '',
                    companyAddress: currentBranding.companyAddress || '',
                    companyPhone: currentBranding.companyPhone || '',
                    companyWeb: currentBranding.companyWeb || '',
                    showTurkakLogo: currentBranding.showTurkakLogo !== false,
                    accreditationNo: currentBranding.accreditationNo || '',
                    accreditationStandard: currentBranding.accreditationStandard || '',
                    defaultRevisionInfo: currentBranding.defaultRevisionInfo || '',
                    footerDisclaimer: currentBranding.footerDisclaimer || ''
                }
            };

            if (typeof triggerAutoSave === 'function') triggerAutoSave();
            if (!silent && typeof showToast === 'function') {
                showToast('Rapor şablonu ve antet sürümü mühürlendi (gelecek güncellemelerden etkilenmez).');
            }
            return true;
        },

        unsealReportSnapshot(formData, silent = false) {
            if (!formData || !formData.universalSnapshot) return false;
            formData.universalSnapshot = null;
            if (typeof triggerAutoSave === 'function') triggerAutoSave();
            if (!silent && typeof showToast === 'function') {
                showToast('Rapor sürüm kilidi açıldı; güncel şablon ayarlarını kullanıyor.');
            }
            return true;
        },

        // Sınır değer ve otomatik uygunluk değerlendirme kural motoru
        evaluateRowLimitRules(schema, rowObj) {
            if (!schema || !Array.isArray(schema.tableColumns) || !rowObj) return;
            schema.tableColumns.forEach(col => {
                if (!col.limitRule) return;
                const rawVal = String(rowObj[col.key] || '').replace(',', '.');
                const numMatch = rawVal.match(/-?\d+(\.\d+)?/);
                if (!numMatch) return;
                const val = parseFloat(numMatch[0]);
                if (!Number.isFinite(val)) return;

                const rule = col.limitRule;
                const targetCol = rule.targetCol || 'result';
                let pass = true;
                if (rule.operator === '<=' && Number.isFinite(rule.max)) {
                    pass = val <= rule.max;
                } else if (rule.operator === '>=' && Number.isFinite(rule.min)) {
                    pass = val >= rule.min;
                }
                if (rowObj[targetCol] !== undefined) {
                    rowObj[targetCol] = pass ? 'Uygun' : 'Uygun Değil';
                }
            });
        }
    };

    // Mevcut getDynamicSchemaForEquipment çağrılarını yeni versiyonlu kayıt defterine yönlendir
    window.getDynamicSchemaForEquipment = function (templateId, equipmentName) {
        const fd = (typeof AppState !== 'undefined' && AppState.currentFormData) ? AppState.currentFormData : null;
        return UniversalSchemaRegistry.resolveSchema(templateId, equipmentName, fd);
    };

    // ========================================================================
    // 4. EVRENSEL ŞABLON & FİRMA ÖZELLEŞTİRME STÜDYOSU (UI MODAL)
    // ========================================================================
    window.openUniversalTemplateStudioModal = function (templateId, equipmentName = '') {
        const insp = (typeof AppState !== 'undefined' && AppState.currentInspection) || {};
        const tid = String(templateId || insp.template_id || '2074');
        const eqName = equipmentName || insp.equipment_name || '';
        const schema = UniversalSchemaRegistry.resolveSchema(tid, eqName, null);
        const ov = UniversalTenantOverlay.getTemplateOverlay(tid) || {
            customTitle: '',
            customDocNo: '',
            addedFields: [],
            addedChecks: []
        };
        const tokens = UniversalTenantOverlay.getDesignTokens();

        const customFieldsText = (ov.addedFields || []).map(f => f.unit ? `${f.label} [${f.unit}]` : f.label).join('\n');
        const customChecksText = (ov.addedChecks || []).map(c => c.text).join('\n');

        openModal(
            `<i class="fa-solid fa-sliders mr-2 text-sky-400"></i>Evrensel Form & PDF Özelleştirme Stüdyosu`,
            `<div class="space-y-3.5 text-xs">
                <div class="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 flex items-start gap-2">
                    <i class="fa-solid fa-shield-halved text-sky-600 mt-0.5"></i>
                    <div class="leading-snug">
                        <strong>Yama (Tenant Overlay) Mimarisi:</strong> Burada yaptığınız özelleştirmeler ana şablon kodunu bozmaz; firmanıza özel katman olarak kaydedilir. Mühürlenmiş eski raporlar etkilenmez.
                    </div>
                </div>

                <!-- 1. GENEL FİRMA PDF TASARIM TOKENLARI -->
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div class="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-file-pdf text-amber-500"></i>
                        <span>1. Firma Genel A4 PDF Görünüm & Düzen Ayarları</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Antet (Üst Başlık) Düzeni</label>
                            <select id="ustHeaderVariant" class="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-semibold">
                                <option value="auto" ${tokens.headerVariant === 'auto' ? 'selected' : ''}>Temaya Göre Otomatik</option>
                                <option value="three_col_logos" ${tokens.headerVariant === 'three_col_logos' ? 'selected' : ''}>Klasik 3 Sütun (Logo - Unvan - TÜRKAK)</option>
                                <option value="rams_banner" ${tokens.headerVariant === 'rams_banner' ? 'selected' : ''}>Modern Şerit / Bakanlık Düzeni</option>
                                <option value="corporate_compact" ${tokens.headerVariant === 'corporate_compact' ? 'selected' : ''}>Kompakt Kurumsal Antet</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Altbilgi (Footer) Düzeni</label>
                            <select id="ustFooterVariant" class="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-semibold">
                                <option value="auto" ${tokens.footerVariant === 'auto' ? 'selected' : ''}>Temaya Göre Otomatik</option>
                                <option value="rams_strip" ${tokens.footerVariant === 'rams_strip' ? 'selected' : ''}>Hücresiz Doküman Şeridi (RAMS)</option>
                                <option value="boxed_table" ${tokens.footerVariant === 'boxed_table' ? 'selected' : ''}>Klasik Kutulu ISO Tablo</option>
                                <option value="minimal_line" ${tokens.footerVariant === 'minimal_line' ? 'selected' : ''}>Minimal Tek Satır</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Teknik Özellikler Tablosu</label>
                            <select id="ustFieldCols" class="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-semibold">
                                <option value="auto" ${String(tokens.fieldGridColumns) === 'auto' ? 'selected' : ''}>Şablona Göre Otomatik</option>
                                <option value="2" ${Number(tokens.fieldGridColumns) === 2 ? 'selected' : ''}>2 Sütunlu (Geniş Okunaklı)</option>
                                <option value="3" ${Number(tokens.fieldGridColumns) === 3 ? 'selected' : ''}>3 Sütunlu (Kompakt)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Gözle Kontrol PDF Düzeni</label>
                            <select id="ustCheckCols" class="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-semibold">
                                <option value="auto" ${String(tokens.checklistColumns) === 'auto' ? 'selected' : ''}>Şablona Göre Otomatik</option>
                                <option value="1" ${Number(tokens.checklistColumns) === 1 ? 'selected' : ''}>1 Sütun (Detaylı Tam Satır)</option>
                                <option value="2" ${Number(tokens.checklistColumns) === 2 ? 'selected' : ''}>2 Sütun (Yan Yana Kompakt)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Onay & İmza Kutusu Düzeni</label>
                            <select id="ustSignCols" class="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-semibold">
                                <option value="1" ${Number(tokens.signatureColumns) === 1 ? 'selected' : ''}>1 İmzalı (Muayene Personeli + QR)</option>
                                <option value="2" ${Number(tokens.signatureColumns) === 2 ? 'selected' : ''}>2 İmzalı (+ Teknik Yönetici Onayı)</option>
                                <option value="3" ${Number(tokens.signatureColumns) === 3 ? 'selected' : ''}>3 İmzalı (+ Müşteri / İşletme Yetkilisi)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Sayfa Yoğunluğu & Sığdırma</label>
                            <select id="ustPageDensity" class="w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white font-semibold">
                                <option value="auto" ${tokens.pageDensity === 'auto' ? 'selected' : ''}>Akıllı Sığdır (Az Taşarsa 1 Sayfaya Sığdır)</option>
                                <option value="normal" ${tokens.pageDensity === 'normal' ? 'selected' : ''}>Standart Ferah Boşluk</option>
                                <option value="compact" ${tokens.pageDensity === 'compact' ? 'selected' : ''}>Her Zaman Kompakt</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 pt-1">
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Teknik Yönetici Adı Soyadı (2/3 İmza İçin)</label>
                            <input type="text" id="ustTechManagerName" value="${escapeHtml(tokens.techManagerName || '')}"
                                placeholder="Örn: Mehmet Yılmaz"
                                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Genel Doküman Kodu Ön Eki</label>
                            <input type="text" id="ustDocPrefix" value="${escapeHtml(tokens.docCodePrefixOverride || '')}"
                                placeholder="Örn: ABC-FR. (Boşsa varsayılan)"
                                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono">
                        </div>
                    </div>
                </div>

                <!-- 2. SEÇİLİ ŞABLONA ÖZEL FİRMA YAMASI -->
                <div class="p-3 rounded-xl bg-white border border-slate-200 space-y-2.5">
                    <div class="flex items-center justify-between">
                        <div class="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <i class="fa-solid fa-layer-group text-emerald-600"></i>
                            <span>2. Bu Şablona Özel Yama (${escapeHtml(schema.code)} · v${schema.schemaVersion})</span>
                        </div>
                        <button type="button" onclick="resetCurrentTemplateOverlay('${tid}')" class="text-[11px] font-bold text-rose-600 hover:underline">
                            Şablon Yamasını Sıfırla
                        </button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Özel Rapor Başlığı (Boşsa Standart)</label>
                            <input type="text" id="ustCustomTitle" value="${escapeHtml(ov.customTitle || '')}"
                                placeholder="${escapeHtml(schema.title)}"
                                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-0.5">Özel Form / Doküman Kodu</label>
                            <input type="text" id="ustCustomDocNo" value="${escapeHtml(ov.customDocNo || '')}"
                                placeholder="${escapeHtml(schema.docNo)}"
                                class="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono">
                        </div>
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-0.5">Ekstra Teknik Bilgi Alanları Ekle (Her satıra 1 alan adı)</label>
                        <textarea id="ustAddedFields" rows="2" placeholder="Örn:&#10;Üretim Hattı Kodu&#10;Bakım Sorumlusu"
                            class="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs">${escapeHtml(customFieldsText)}</textarea>
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-0.5">Ekstra Gözle Kontrol Sorusu Ekle (Her satıra 1 soru)</label>
                        <textarea id="ustAddedChecks" rows="2" placeholder="Örn:&#10;Ekipman üzerinde QR barkod etiketi mevcut mu?&#10;Periyodik bakım kartı pano yanında asılı mı?"
                            class="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs">${escapeHtml(customChecksText)}</textarea>
                    </div>
                </div>
            </div>`,
            `<button type="button" onclick="closeModal()" class="px-3 py-2 rounded-lg bg-slate-200 text-slate-800 font-bold text-xs">İptal</button>
             <button type="button" onclick="saveUniversalTemplateStudioSubmit('${tid}')" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95">
                <i class="fa-solid fa-floppy-disk mr-1"></i>Özelleştirmeyi Kaydet
             </button>`
        );
    };

    window.saveUniversalTemplateStudioSubmit = function (templateId) {
        const headerVariant = document.getElementById('ustHeaderVariant')?.value || 'auto';
        const footerVariant = document.getElementById('ustFooterVariant')?.value || 'auto';
        const fieldColsRaw = document.getElementById('ustFieldCols')?.value || 'auto';
        const checkColsRaw = document.getElementById('ustCheckCols')?.value || 'auto';
        const signColsRaw = parseInt(document.getElementById('ustSignCols')?.value || '1', 10) || 1;
        const pageDensity = document.getElementById('ustPageDensity')?.value || 'auto';
        const techManagerName = (document.getElementById('ustTechManagerName')?.value || '').trim();
        const docCodePrefixOverride = (document.getElementById('ustDocPrefix')?.value || '').trim();

        UniversalTenantOverlay.saveDesignTokens({
            headerVariant,
            footerVariant,
            fieldGridColumns: fieldColsRaw === 'auto' ? 'auto' : Number(fieldColsRaw),
            checklistColumns: checkColsRaw === 'auto' ? 'auto' : Number(checkColsRaw),
            signatureColumns: signColsRaw,
            pageDensity,
            techManagerName,
            docCodePrefixOverride
        });

        const customTitle = (document.getElementById('ustCustomTitle')?.value || '').trim();
        const customDocNo = (document.getElementById('ustCustomDocNo')?.value || '').trim();
        const rawFieldsLines = (document.getElementById('ustAddedFields')?.value || '').split('\n').map(s => s.trim()).filter(Boolean);
        const rawChecksLines = (document.getElementById('ustAddedChecks')?.value || '').split('\n').map(s => s.trim()).filter(Boolean);

        const addedFields = rawFieldsLines.map((line, i) => {
            const m = line.match(/^(.*?)\s*\[(.*?)\]$/);
            const label = m ? m[1].trim() : line;
            const unit = m ? m[2].trim() : '';
            return {
                key: `tenant_fld_${templateId}_${i}`,
                label,
                unit,
                type: 'text'
            };
        });

        const addedChecks = rawChecksLines.map((line, i) => ({
            id: `tenant_chk_${templateId}_${i}`,
            text: line,
            isCritical: true,
            defect: `${line.replace(/\?$/, '')} kriterinde uygunsuzluk tespit edilmiştir.`
        }));

        if (customTitle || customDocNo || addedFields.length || addedChecks.length) {
            UniversalTenantOverlay.saveTemplateOverlay(templateId, {
                customTitle,
                customDocNo,
                addedFields,
                addedChecks
            });
        } else {
            UniversalTenantOverlay.resetTemplateOverlay(templateId);
        }

        closeModal();
        if (typeof showToast === 'function') {
            showToast('Evrensel PDF tasarım ve şablon özelleştirmeleri kaydedildi!');
        }
        if (typeof paintInspectionEditorUI === 'function' && typeof AppState !== 'undefined' && AppState.currentInspection) {
            paintInspectionEditorUI();
        }
    };

    window.resetCurrentTemplateOverlay = function (templateId) {
        UniversalTenantOverlay.resetTemplateOverlay(templateId);
        closeModal();
        if (typeof showToast === 'function') {
            showToast('Şablon yaması varsayılan standart şemaya sıfırlandı.');
        }
        if (typeof paintInspectionEditorUI === 'function' && typeof AppState !== 'undefined' && AppState.currentInspection) {
            paintInspectionEditorUI();
        }
    };

    window.UniversalSchemaRegistry = UniversalSchemaRegistry;
    window.UniversalTenantOverlay = UniversalTenantOverlay;
})();
