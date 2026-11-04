// All Official TKM / ENLAB Report Templates & Specific Engineering Schemas
window.ENLAB_REPORT_TEMPLATES = [
    { id: "2201", code: "TKM-FR.318", category: "Elektriksel", name: "ELEKTRİK İÇ TESİSATI GÖZLE KONTROL VE FONKSİYON TESTLERİ" },
    { id: "2202", code: "TKM-FR.317", category: "Elektriksel", name: "ALÇAK GERİLİM TOPRAKLAMA TESİSATI" },
    { id: "2074", code: "TKM-FR.320", category: "Elektriksel", name: "YILDIRIMDAN KORUNMA TESİSATI (PARATONER)" },
    { id: "2205", code: "TKM-FR.164", category: "Elektriksel", name: "JENERATÖR" },
    { id: "2042", code: "TKM-FR.322", category: "Elektriksel", name: "YANGIN ALGILAMA VE UYARI SİSTEMLERİ" },
    { id: "2139", code: "TKM-FR.323", category: "Elektriksel", name: "REAKTİF GÜÇ KOMPANZASYON SİSTEMLERİ" },
    { id: "2203", code: "TKM-FR.327", category: "Elektriksel", name: "TRANSFORMATÖR 1-36kV (YG) GÖZLE KONTROL VE TOPRAKLAMA TESİSATI" },
    { id: "1668", code: "TKM-FR.328", category: "Elektriksel", name: "ACİL AYDINLATMA VE YÖNLENDİRME SİSTEMLERİ" },
    { id: "2204", code: "TKM-FR.329", category: "Elektriksel", name: "AKÜMÜLATÖR / KESİNTİSİZ GÜÇ KAYNAĞI (UPS)" },
    { id: "2141", code: "TKM-FR.330", category: "Elektriksel", name: "ELEKTRİKLİ ARAÇ ŞARJ İSTASYONLARI VE ÜNİTELERİ" },
    { id: "1851", code: "TKM-FR.326", category: "Elektriksel", name: "KATODİK KORUMA TESİSATI" },
    { id: "1758", code: "TKM-FR.325", category: "Elektriksel", name: "YALITIM DİRENCİ (İZOLASYON) ÖLÇÜMÜ" },
    { id: "1762", code: "TKM-FR.331", category: "Elektriksel", name: "ZEMİN-DUVAR YALITIM DİRENCİ" },
    { id: "2122", code: "TKM-FR.332", category: "Elektriksel", name: "ENERJİ/GÜÇ KALİTESİ VE HARMONİK ANALİZİ" },
    { id: "2159", code: "TKM-FR.112", category: "Mekanik / Kapı", name: "OTOMATİK/MANUEL KAPI" },
    { id: "2150", code: "TKM-FR.210", category: "Yangın", name: "YAĞMURLAMA (SPRİNKLER) SİSTEMLERİ" },
    { id: "2160", code: "TKM-FR.215", category: "Yangın", name: "YANGIN DOLAP SİSTEMİ" },
    { id: "2196", code: "TKM-FR.220", category: "Yangın", name: "PORTATİF YANGIN SÖNDÜRME TÜPLERİ" },
    { id: "2151", code: "TKM-FR.225", category: "Yangın", name: "YANGIN POMPA İSTASYONU" },
    { id: "2153", code: "TKM-FR.180", category: "HVAC", name: "HAVALANDIRMA/KLİMA TESİSATI" },
    { id: "2096", code: "TKM-FR.145", category: "Mekanik", name: "RAF / DEPO RAF SİSTEMLERİ" },
    { id: "2187", code: "TKM-FR.101", category: "Basınçlı Kap", name: "HAVA TANKI / KOMPRESÖR" },
    { id: "2179", code: "TKM-FR.102", category: "Basınçlı Kap", name: "KAPALI GENLEŞME TANKI" },
    { id: "2056", code: "TKM-FR.103", category: "Basınçlı Kap", name: "BUHAR KAZANI / KALORİFER KAZANI" },
    { id: "1591", code: "TKM-FR.120", category: "Kaldırma İletme", name: "FORKLİFT" },
    { id: "2143", code: "TKM-FR.121", category: "Kaldırma İletme", name: "TRANSPALET / İSTİF MAKİNESİ" },
    { id: "2140", code: "TKM-FR.122", category: "Kaldırma İletme", name: "VİNÇ / CARASKAL" },
    { id: "2035", code: "TKM-FR.125", category: "Kaldırma İletme", name: "YÜKSELTİLEBİLEN SEYYAR İŞ PLATFORMU" },
    { id: "1737", code: "TKM-FR.160", category: "Makina", name: "MAKİNA / TEZGAH GÜVENLİĞİ" }
];

// Standard Defect Descriptions for Automatic Filling when "Uygun Değil" or "Hafif Kusur" is selected
window.STANDARD_DEFECT_NOTES = {
    "Kablo şebeke tarafı": "Pano şebeke besleme kablosu girişinde mekanik koruma (rakor/conta) eksikliği veya uygunsuzluğu tespit edilmiştir.",
    "Kablo donanım tarafı": "Pano çıkış kablo bağlantılarında gevşeklik, yüksük eksikliği veya uygunsuz klemens bağlantısı tespit edilmiştir.",
    "Pano sabitlenmesi (Depreme dayanıklılık)": "Pano gövdesi zemine veya duvara devrilmeye ve depreme karşı rijit şekilde sabitlenmemiştir.",
    "Dış darbelere karşı koruma önlemi": "Pano dış darbelere ve çevresel etkilere (IP koruma sınıfı) karşı korumasız durumdadır.",
    "Elektrik panosu etrafında yabancı malzemeler": "Elektrik panosu önünde ve çevresinde müdahaleyi engelleyen veya yangın riski oluşturan yabancı malzemeler bulunmaktadır.",
    "Zemin izolasyonu": "Pano önünde TS EN 61111 standardına uygun dielektrik yalıtkan paspas (izolasyon halısı) bulunmamaktadır.",
    "Topraklama iletkeni": "Pano ana topraklama barası bağlantısı veya topraklama iletkeni kesiti standartlara uygun değildir.",
    "Ana potansiyel dengeleme iletkeni": "Ana potansiyel dengeleme barası ve iletken bağlantısı tesis edilmemiştir.",
    "Ek Potansiyel dengeleme İletkeni (Tamamlayıcı pot.den)": "Metal gövdeli donanımlar arasında tamamlayıcı potansiyel dengeleme bağlantısı eksiktir.",
    "Pano kapak bağlantısı kontrolü 6 mm2": "Pano metal kapağı ile gövde arasında min. 6 mm² esnek sarı-yeşil topraklama köprüsü bulunmamaktadır.",
    "Elektriksel olmayan tesislere yaklaşma ve diğer etkilerin kontrolü": "Elektrik tesisatı ile su/doğalgaz/mekanik boru hatları arasında yeterli güvenlik mesafesi yoktur.",
    "Bant I ve Bant II ayrılması, Bant II yalıtımı": "Zayıf akım (Bant I) ve kuvvetli akım (Bant II) kabloları aynı kanalda ayrıştırma yapılmadan çekilmiştir.",
    "Güvenlik devre ayrılması": "Acil durum ve güvenlik devreleri genel besleme devrelerinden bağımsız ayrılmamıştır.",
    "Pano iç kapak, faza erişim engeli veya pleksi koruma": "Pano içerisinde gerilim altındaki aktif bölümlere doğrudan dokunmayı önleyen iç kapak veya pleksi koruma bulunmamaktadır (TS HD 60364-4-41).",
    "Şemalar, talimatlar, devre çizimleri ve kısa bilgiler": "Pano içerisinde güncel onaylı tek hat şeması ve işletme talimatı bulunmamaktadır.",
    "Koruma cihaz ve terminal etiket": "Pano içerisindeki şalter, sigorta, RCD ve klemenslerin beslediği linyeleri belirten etiketlemeler eksiktir.",
    "Tehlike işaretleri ve diğer uyarı işaretleri": "Pano dış kapağında standart ölüm tehlikesi / elektrik uyarı levhası bulunmamaktadır.",
    "Kablo yollarının uygunluğu ve mekanik koruma": "Kablo tava ve kanallarında kapak eksikliği, sarkma veya mekanik hasar tespit edilmiştir.",
    "Kablo renk kodları Nötr: Mavi Toprak: Sarı/ Yeşil": "Tesisatta Nötr (Mavi) ve Koruma/Toprak (Sarı-Yeşil) iletken renk kodlaması standartlara uygun değildir.",
    "Tesisat yöntemi": "Kablo döşeme ve sabitleme yöntemi tesisat standartlarına uygun değildir.",
    "Yangın engeli, uygun kilitleme ve sıcaklık etkisine karşı koruma": "Kablo geçişlerinde yangın durdurucu harç/bariyer eksikliği mevcuttur.",
    "Kontak gevşekliği ısınması": "Termal kamera incelemesinde klemens/şalter bağlantı noktasında kontak gevşekliği kaynaklı aşırı ısınma tespit edilmiştir.",
    "Aşırı yük ısınması PVC kablolar için >70 derece": "Termal kamera incelemesinde PVC yalıtımlı iletkenlerde 70°C sınır değerinin üzerinde aşırı yük ısınması tespit edilmiştir.",
    "Ekipman yakınında elektriksel ekipman yangın söndürme tertibatı": "Pano odası / yakınında elektrik yangınlarına uygun (CO2 / KKT) yangın söndürme tüpü bulunmamaktadır.",
    "Ekipman temizlik/bakım durumu": "Pano içerisinde toz, örümcek ağı ve yabancı partikül birikimi mevcut olup pano içi temizlik ve bakım yapılmalıdır.",
    "Pano içi ve bağlantılarının korozyon kontrolü": "Pano içi bara ve bağlantı elemanlarında oksitlenme/korozyon başlangıcı görülmüştür.",
    "Ekipman içi veya yakınında acil durum aydınlatma tertibatı": "Pano mahallinde enerji kesintisinde devreye giren acil durum aydınlatma armatürü bulunmamaktadır."
};

// Specialized templates for non-2201 reports (Topraklama, Paratoner, Jeneratör, Yangın, Mekanik vb.)
window.SPECIALIZED_SCHEMAS = {
    // 2202 - ALÇAK GERİLİM TOPRAKLAMA TESİSATI
    "2202": {
        title: "ALÇAK GERİLİM TOPRAKLAMA TESİSATI PERİYODİK KONTROL RAPORU",
        docNo: "TKM-FR.317, REV.00 / YT: 01.09.2025",
        methods: [
            "RG, 04.11.1984 - 18565 Elektrik İç Tesisleri Yönetmeliği",
            "RG, 21.08.2001 - 24500 Elektrik Tesislerinde Topraklamalar Yönetmeliği",
            "RG, 25.04.2013 - 28628 İş Ekipmanları Kullanımında Sağlık Güvenlik Şartları Yönetmeliği",
            "TS HD 60364-4-41 Alçak Gerilim Elektrik Tesisleri – Bölüm 4: Güvenlik İçin Koruma – Bölüm 41: Elektrik Çarpmasına Karşı Koruma",
            "TS HD 60364-6 Alçak Gerilim Elektrik Tesisatları – Bölüm 6: Doğrulama"
        ],
        generalFields: [
            { key: "enerji_kurulusu", label: "Enerji Sağlayan Kuruluş", type: "text", default: "" },
            { key: "sebeke_tipi", label: "Şebeke Tipi", type: "select", options: ["", "TN-S", "TN-C-S", "TT", "IT", "TN-C"], default: "" },
            { key: "topraklayici_tipi", label: "Topraklayıcı Tipi", type: "select", options: ["", "Temel Topraklaması", "Ring (Çevre)", "Derin (Çubuk Elektrot)", "Yüzeysel (Şerit/Levha)"], default: "" },
            { key: "olcum_metodu", label: "Ölçüm ve Doğrulama Metodu", type: "select", options: ["", "Çevrim Empedansı Metodu", "3 Uçlu Topraklama Metodu", "Klamp Metodu (Çoklu Topraklayıcılı)"], default: "" },
            { key: "toprak_ozgul_direnci", label: "Toprak Özgül Direnci ρ (Ω·m)", type: "text", default: "" },
            { key: "ortam_sicaklik_nem", label: "Ortam Sıcaklığı (°C) / Nem (%)", type: "text", default: "" },
            { key: "toprak_durumu", label: "Toprak / Zemin Durumu", type: "select", options: ["", "Normal / Nemli", "Kuru", "Islak", "Beton / Asfalt Kaplı"], default: "" },
            { key: "ana_espotansiyel_kesit", label: "Ana Eşpotansiyel İletkeni Kesiti (mm²)", type: "text", default: "" }
        ],
        visualChecks: [
            "Ana topraklama barası (ATB) ve eşpotansiyel dengeleme barası uygun tesis edilmiş mi?",
            "Topraklama iletkenleri mekanik darbelere ve korozyona karşı korunmuş mu?",
            "Topraklama bağlantı klemensleri ve pabuçları sıkı ve sağlam mı?",
            "Koruma iletkeni (PE) sarı-yeşil renk koduna uygun mu?",
            "Pano gövde ve kapak topraklama köprüleri eksiksiz bağlı mı?",
            "Metalik boru hatları ve yapı çelik konstrüksiyonu eşpotansiyele dahil edilmiş mi?"
        ],
        tableTitle: "TOPRAKLAMA ÖLÇÜM NOKTALARI VE DEĞERLENDİRME TABLOSU",
        tableColumns: [
            { key: "no", label: "Ölçüm No", width: "60px" },
            { key: "point_name", label: "Ölçüm Noktası / Ekipman / Pano Adı" },
            { key: "location", label: "Bulunduğu Bölüm" },
            { key: "ground_type", label: "Topraklama Cinsi", options: ["", "Koruma", "İşletme", "Fonksiyon"] },
            { key: "breaker_type", label: "Açma Cihazı / Eğri", default: "" },
            { key: "in_amp", label: "In (A)", default: "" },
            { key: "section", label: "PE Kesiti (mm²)", default: "" },
            { key: "rx_ohm", label: "Ölçülen Rx / Zx (Ω)", default: "" },
            { key: "ra_limit", label: "Sınır Değer RA (Ω)", default: "" },
            { key: "result", label: "Sonuç", options: ["", "Uygun", "Uygun Değil"] }
        ],
        defaultRows: []
    },

    // 2074 - YILDIRIMDAN KORUNMA (PARATONER) TESİSATI
    "2074": {
        title: "YILDIRIMDAN KORUNMA (PARATONER) TESİSATI PERİYODİK KONTROL RAPORU",
        docNo: "TKM-FR.320, REV.00 / YT: 01.09.2025",
        methods: ["TS EN 62305-1..4", "NFC 17-102", "RG, 21.08.2001 - 24500", "RG, 25.04.2013 - 28628"],
        generalFields: [
            { key: "paratoner_tipi", label: "Yıldırımdan Korunma Sistemi Tipi", type: "select", options: ["Aktif Paratoner (ESE)", "Faraday Kafesi", "Yakalama Çubuğu (Franklin)"], default: "Aktif Paratoner (ESE)" },
            { key: "marka_model", label: "Paratoner Marka / Model / Seri No", type: "text", default: "FOREND / PETEX-M" },
            { key: "koruma_seviyesi", label: "Yıldırımdan Korunma Seviyesi", type: "select", options: ["Seviye I (Çok Yüksek)", "Seviye II (Yüksek)", "Seviye III (Normal)", "Seviye IV"], default: "Seviye I (Çok Yüksek)" },
            { key: "delta_t", label: "Ön Uyartım Süresi Δt (μs)", type: "text", default: "60 μs" },
            { key: "koruma_yaricapi", label: "Hesaplanan Koruma Yarıçapı Rp (m)", type: "text", default: "79 m" },
            { key: "inis_iletkeni", label: "İniş İletkeni Sayısı, Tipi ve Kesiti", type: "text", default: "2 Adet x 50 mm² Elektrolitik Bakır" },
            { key: "darbe_sayaci", label: "Yıldırım Darbe Sayacı Durumu / Endeksi", type: "text", default: "Mevcut / 002" },
            { key: "direk_yuksekligi", label: "Yakalama Ucu Direk Yüksekliği (m)", type: "text", default: "6 m" }
        ],
        visualChecks: [
            "Yakalama ucu ve direği sağlam, dik ve korozyonsuz durumda mı?",
            "İniş iletkenleri tesis boyunca kesintisiz ve kroşelerle sağlam sabitlenmiş mi?",
            "İniş iletkeni üzerinde test klemensi (kontrol bağlantı noktası) mevcut ve sağlam mı?",
            "İniş iletkeni zeminden 2 metre yüksekliğe kadar koruyucu boru/muhafaza içinde mi?",
            "Yıldırım darbe sayacı çalışır durumda mı?",
            "Paratoner topraklaması bina eşpotansiyel barasına (DKD/ark boynuzu ile) irtibatlandırılmış mı?",
            "Topraklama geçiş direnci sınır değerin (≤ 10 Ω) altında mı?"
        ],
        tableTitle: "PARATONER İNİŞ İLETKENLERİ VE TOPRAKLAMA ÖLÇÜM TABLOSU",
        tableColumns: [
            { key: "no", label: "İniş No", width: "60px" },
            { key: "location", label: "Test Klemensi / Ölçüm Noktası Yeri" },
            { key: "conductor", label: "İniş İletkeni Kesiti ve Cinsi", default: "50 mm² Cu" },
            { key: "continuity", label: "Süreklilik (Ω)", default: "0.08" },
            { key: "re_ohm", label: "Ölçülen Topraklama Direnci RE (Ω)", default: "3.40" },
            { key: "limit_ohm", label: "Sınır Değer (Ω)", default: "≤ 10 Ω" },
            { key: "result", label: "Sonuç", options: ["Uygun", "Uygun Değil"] }
        ],
        defaultRows: [
            { no: "1", location: "Bina Kuzey Cephe 1 No'lu İniş Test Klemensi", conductor: "2x50 mm² Cu", continuity: "0.06", re_ohm: "2.85", limit_ohm: "≤ 10 Ω", result: "Uygun" }
        ]
    },

    // 2205 - JENERATÖR PERİYODİK KONTROLÜ
    "2205": {
        title: "JENERATÖR PERİYODİK KONTROL RAPORU",
        docNo: "TKM-FR.164, REV.07 / RT: 09.12.2024",
        methods: [
            "RG, 04.11.1984 - 18565 Elektrik İç Tesisleri Yönetmeliği",
            "RG, 21.08.2001 - 24500 Elektrik Tesislerinde Topraklamalar Yönetmeliği",
            "RG, 25.04.2013 - 28628 İş Ekipmanları Kullanımında Sağlık Güvenlik Şartları Yönetmeliği",
            "RG, 30.11.2000 - 24246 Elektrik Kuvvetli Akım Tesisleri Yönetmeliği",
            "TS ISO 8528-1 Pistonlu içten yanmalı motorla tahrik edilen alternatif akım jeneratör grupları - Bölüm 1: Uygulama, beyan değerleri ve performans"
        ],
        generalFields: [
            { key: "marka_model", label: "Jeneratör Marka / Model", type: "text", default: "" },
            { key: "seri_no_yil", label: "Seri No / İmal Yılı", type: "text", default: "" },
            { key: "guc_kva", label: "Standby / Prime Güç (kVA / kW)", type: "text", default: "" },
            { key: "gerilim_frekans", label: "Nominal Gerilim (V) / Frekans (Hz)", type: "text", default: "" },
            { key: "devir_cos", label: "Devir Sayısı (d/dk) / Cos φ", type: "text", default: "" },
            { key: "calisma_saati", label: "Çalışma Saati", type: "text", default: "" },
            { key: "transfer_panosu", label: "Transfer Panosu (ATS) Tipi", type: "select", options: ["", "Otomatik Transfer (ATS)", "Manuel Enversör Şalter", "Senkron Panolu"], default: "" },
            { key: "kabin_tipi", label: "Kabin / Mahfaza Durumu", type: "select", options: ["", "Ses İzolasyonlu Kabinli", "Jeneratör Odası İçinde Açık Tip"], default: "" }
        ],
        visualChecks: [
            "Jeneratör gövde koruma topraklaması ve nötr yıldız noktası topraklaması uygun mu?",
            "Acil durdurma butonu (Emergency Stop) erişilebilir ve çalışır durumda mı?",
            "Transfer panosu (ATS) elektriksel ve mekanik kilitlemesi çalışıyor mu?",
            "Döner aksam (fan, kayış, kasnak) koruyucu muhafazaları tam ve sağlam mı?",
            "Egzoz borusu ve susturucu ısı izolasyonu yapılmış ve güvenli şekilde dışarı atılmış mı?",
            "Akü bağlantı kutup başları sağlam, izoleli ve şarj redresörü çalışıyor mu?",
            "Blok su ısıtıcısı (ceket suyu ısıtıcısı) ve termostatı çalışır durumda mı?",
            "Yakıt tankı, hortumları ve yağ/su devrelerinde sızıntı veya kaçak yok mu?",
            "Jeneratör mahallinde yangın söndürme tüpü, uyarı levhaları ve yalıtkan paspas var mı?"
        ],
        tableTitle: "JENERATÖR ELEKTRİKSEL ÖLÇÜM VE FONKSİYON TEST TABLOSU",
        tableColumns: [
            { key: "param", label: "Ölçülen / Test Edilen Parametre" },
            { key: "measured", label: "Ölçülen Değer" },
            { key: "reference", label: "Referans / Sınır Değer" },
            { key: "result", label: "Değerlendirme", options: ["", "Uygun", "Uygun Değil"] }
        ],
        defaultRows: []
    },

    // 2042 - YANGIN ALGILAMA VE UYARI SİSTEMLERİ
    "2042": {
        title: "YANGIN ALGILAMA VE UYARI SİSTEMİ PERİYODİK KONTROL RAPORU",
        docNo: "TKM-FR.322, REV.00 / YT: 01.09.2025",
        methods: ["Binaların Yangından Korunması Hakkında Yönetmelik", "TS EN 54-1..14", "RG, 25.04.2013 - 28628"],
        generalFields: [
            { key: "santral_marka", label: "Yangın Santrali Marka / Model", type: "text", default: "MAVİGARD / TEKNİM / BOSCH" },
            { key: "santral_tipi", label: "Santral Tipi", type: "select", options: ["Adresli Sistem", "Konvansiyonel Sistem"], default: "Adresli Sistem" },
            { key: "loop_bolge_sayisi", label: "Loop / Bölge Sayısı", type: "text", default: "2 Loop / 48 Adres" },
            { key: "besleme_aku", label: "Şebeke Beslemesi ve Yedek Akü Kapasitesi", type: "text", default: "230V AC / 2x12V 7Ah Bakımsız Akü" },
            { key: "santral_yeri", label: "Santralin Bulunduğu Yer", type: "text", default: "Güvenlik / Danışma Odası" },
            { key: "kablo_tipi", label: "Yangın Tesisat Kablo Tipi", type: "text", default: "JE-H(St)H FE180 PH120 Halojensiz" }
        ],
        visualChecks: [
            "Yangın ihbar santrali sürekli gözetim altındaki bir mahalde tesis edilmiş mi?",
            "Santral üzerinde hata (Fault) veya devre dışı (Disable) uyarısı bulunmuyor mu?",
            "Şebeke enerjisi kesildiğinde yedek aküler sistemi kesintisiz besliyor mu?",
            "Yangın ihbar butonları kaçış yollarında, yerden 1.1 - 1.4 m yükseklikte ve erişilebilir mi?",
            "Duman ve ısı dedektörleri aktif, temiz ve koruyucu kapakları çıkarılmış durumda mı?",
            "Sesli ve ışıklı uyarıcılar (siren/flaşör) tesisin her noktasından duyulabilir (>65 dBA / >75 dBA) düzeyde mi?",
            "Yangın senaryosu (havalandırma kapatma, asansör kata indirme, kapı serbest bırakma) çalışıyor mu?"
        ],
        tableTitle: "YANGIN ALGILAMA ELEMANLARI VE FONKSİYON TEST TABLOSU",
        tableColumns: [
            { key: "zone", label: "Bölge / Loop" },
            { key: "device_type", label: "Cihaz Tipi", options: ["Optik Duman Dedektörü", "Sıcaklık Dedektörü", "Yangın İhbar Butonu", "Siren / Flaşör", "Gaz Dedektörü", "Santral Akü Testi"] },
            { key: "location", label: "Bulunduğu Mahal" },
            { key: "measured", label: "Test / Ölçüm Değeri (dBA / V / sn)", default: "Aktif / 82 dBA" },
            { key: "result", label: "Sonuç", options: ["Uygun", "Uygun Değil"] }
        ],
        defaultRows: [
            { zone: "Loop 1 - Adres 01", device_type: "Optik Duman Dedektörü", location: "Mağaza Satış Alanı", measured: "Test Gazı ile Alarm Verdi (4 sn)", result: "Uygun" },
            { zone: "Loop 1 - Adres 12", device_type: "Yangın İhbar Butonu", location: "Acil Çıkış Kapısı Yanı", measured: "Test Anahtarı ile Alarm Verdi", result: "Uygun" },
            { zone: "Siren Çıkışı 1", device_type: "Siren / Flaşör", location: "Koridor / Mağaza İçi", measured: "84.5 dBA (Ortam: 52 dBA)", result: "Uygun" },
            { zone: "Güç Kaynağı", device_type: "Santral Akü Testi", location: "Yangın Santrali İçi", measured: "27.2 V DC (Yedek Enerji Aktif)", result: "Uygun" }
        ]
    }
};

// Dynamic Schema Generator for All Other Equipment Types (Kapı, Yangın Dolabı, Tüp, Havalandırma, Raf, Kompanzasyon, Trafo, Kaldırma/Basınçlı Kap vb.)
window.getDynamicSchemaForEquipment = function(templateId, equipmentName) {
    if (window.SPECIALIZED_SCHEMAS[templateId]) {
        return window.SPECIALIZED_SCHEMAS[templateId];
    }

    const eq = (equipmentName || '').toUpperCase();

    if (eq.includes('KOMPANZASYON')) {
        return {
            title: "REAKTİF GÜÇ KOMPANZASYON PANOSU PERİYODİK KONTROL RAPORU",
            docNo: "TKM-FR.323, REV.00 / YT: 01.09.2025",
            methods: ["RG, 25.04.2013 - 28628", "TS HD 60364-6", "TS EN 60831-1"],
            generalFields: [
                { key: "role_marka", label: "Reaktif Güç Kontrol Rölesi Marka / Model", type: "text", default: "ENTES RGP-12SR / KAEL" },
                { key: "kademe_sayisi", label: "Kademe Sayısı", type: "text", default: "12 Kademe" },
                { key: "toplam_guc", label: "Toplam Kompanzasyon Gücü (kVAr)", type: "text", default: "150 kVAr" },
                { key: "enduktif_oran", label: "Endüktif / Kapasitif Ceza Oranları (%)", type: "text", default: "Endüktif: %4.2 / Kapasitif: %1.8 (Uygun)" },
                { key: "harmonik_filtre", label: "Harmonik Filtre / Şönt Reaktör Durumu", type: "select", options: ["Var", "Yok"], default: "Var" },
                { key: "cos_phi", label: "Ölçülen Güç Faktörü (Cos φ)", type: "text", default: "0.99 İndüktif" }
            ],
            visualChecks: [
                "Reaktif güç kontrol rölesi ekranı ve kademe LED'leri aktif çalışıyor mu?",
                "Kondansatörlerde şişme, yağ sızıntısı veya deformasyon yok mu?",
                "Kondansatör deşarj dirençleri bağlı ve sağlam mı?",
                "Kompanzasyon kontaktörlerinde ark/kontak yapışması veya aşırı ısınma yok mu?",
                "Pano havalandırma fanı ve termostatı çalışır durumda mı?",
                "Pano kapak ve gövde topraklaması uygun mu?"
            ],
            tableTitle: "KOMPANZASYON KADEMELERİ AKIM VE TERMAL ÖLÇÜM TABLOSU",
            tableColumns: [
                { key: "step", label: "Kademe No" },
                { key: "power", label: "Kademe Gücü (kVAr / μF)", default: "10 kVAr" },
                { key: "fuse", label: "NH / Sigorta (A)", default: "25 A" },
                { key: "current", label: "Çekilen Faz Akımları L1/L2/L3 (A)", default: "14.2 / 14.1 / 14.3 A" },
                { key: "temp", label: "Termal Sıcaklık (°C)", default: "36 °C" },
                { key: "result", label: "Sonuç", options: ["Uygun", "Uygun Değil"] }
            ],
            defaultRows: [
                { step: "Kademe 1", power: "5 kVAr", fuse: "16 A", current: "7.1 / 7.2 / 7.1 A", temp: "34 °C", result: "Uygun" },
                { step: "Kademe 2", power: "10 kVAr", fuse: "25 A", current: "14.4 / 14.2 / 14.3 A", temp: "38 °C", result: "Uygun" },
                { step: "Kademe 3 (SVC)", power: "15 kVAr", fuse: "32 A", current: "21.5 / 21.4 / 21.6 A", temp: "41 °C", result: "Uygun" }
            ]
        };
    }

    if (eq.includes('KAPI')) {
        return {
            title: "OTOMATİK / MANUEL KAPI PERİYODİK KONTROL RAPORU",
            docNo: "TKM-FR.112, REV.00 / YT: 01.09.2025",
            methods: ["RG, 25.04.2013 - 28628", "TS EN 16005", "TS EN 13241", "TS EN 12453"],
            generalFields: [
                { key: "kapi_tipi", label: "Kapı Tipi ve Çalışma Şekli", type: "select", options: ["Fotoselli Otomatik Kayar Kapı", "Seksiyonel Endüstriyel Kapı", "Sarmal (Kepenk) Kapı", "Manuel Acil Çıkış Kapısı"], default: "Fotoselli Otomatik Kayar Kapı" },
                { key: "marka_model", label: "Marka / Model / Seri No", type: "text", default: "DORMA / MANUSA / BFT" },
                { key: "olculer", label: "Geçiş Genişliği x Yüksekliği (cm)", type: "text", default: "200 x 220 cm" },
                { key: "tahrik_tipi", label: "Tahrik / Besleme Tipi", type: "text", default: "230V AC Elektrik Motorlu + Batarya Destekli" }
            ],
            visualChecks: [
                "Kapı kanatlarında, camlarında veya panellerinde kırık/çatlak/deformasyon yok mu?",
                "Sıkışma önleyici emniyet fotoseli / boy fotoseli aktif çalışıyor mu?",
                "Kapanma sırasında engel algılandığında kapı otomatik geri açılıyor mu (Auto-Reverse)?",
                "Enerji kesintisinde manuel açılma mekanizması veya batarya ile açık kalma fonksiyonu çalışıyor mu?",
                "Kılavuz raylar, makaralar ve askı mekanizması aşınmasız ve güvenli mi?",
                "Acil durdurma / konum anahtarı ve uyarı etiketleri mevcut mu?"
            ],
            tableTitle: "KAPI FONKSİYON VE GÜVENLİK TEST TABLOSU",
            tableColumns: [
                { key: "test_name", label: "Test Edilen Güvenlik Fonksiyonu" },
                { key: "method", label: "Uygulanan Test Yöntemi" },
                { key: "measured", label: "Gözlenen Tepki / Ölçüm" },
                { key: "result", label: "Sonuç", options: ["Uygun", "Uygun Değil"] }
            ],
            defaultRows: [
                { test_name: "Emniyet Fotoseli Algılama Testi", method: "Kapanma esnasında fotosel hattı kesildi", measured: "Temas etmeden durdu ve tam açıldı", result: "Uygun" },
                { test_name: "Engel Algılama / Geri Dönüş Testi", method: "Kapanma yönünde direnç uygulandı", measured: "< 150 N kuvvetle geri açıldı", result: "Uygun" },
                { test_name: "Enerji Kesintisi / Acil Çıkış Testi", method: "Şebeke beslemesi kesildi", measured: "Batarya ile otomatik açık konuma geçti", result: "Uygun" }
            ]
        };
    }

    if (eq.includes('RAF')) {
        return {
            title: "ENDÜSTRİYEL DEPO RAF SİSTEMLERİ PERİYODİK KONTROL RAPORU",
            docNo: "TKM-FR.145, REV.00 / YT: 01.09.2025",
            methods: ["RG, 25.04.2013 - 28628", "TS EN 15635", "TS EN 15620", "TS EN 15512"],
            generalFields: [
                { key: "raf_tipi", label: "Raf Sistemi Tipi", type: "select", options: ["Sırt Sırta Palet Rafı", "Hafif/Orta Yük Depo Rafı", "Konsol Kollu Raf", "Mezanin Raf"], default: "Hafif/Orta Yük Depo Rafı" },
                { key: "ayak_travers", label: "Ayak Yüksekliği (mm) / Travers Uzunluğu (mm)", type: "text", default: "2500 mm / 1800 mm" },
                { key: "kat_modul", label: "Kat Sayısı / Modül Sayısı", type: "text", default: "4 Kat / 6 Modül" },
                { key: "kapasite", label: "Göz Başına Maksimum Yük Kapasitesi (kg)", type: "text", default: "400 kg / kat" }
            ],
            visualChecks: [
                "Raf ayakları (dikmeler) zemine çelik dübellerle eksiksiz sabitlenmiş mi?",
                "Travers güvenlik pimleri (emniyet kilitleri) tüm bağlantılarda takılı mı?",
                "Ayak profillerinde ve diyagonallerde darbe, burkulma veya sehim sınırlar dahilinde mi?",
                "Raf üzerinde azami yükleme kapasitelerini gösteren uyarı levhası mevcut mu?",
                "Profil ve bağlantı elemanlarında korozyon veya çatlak bulunmuyor mu?",
                "İstifleme yüksekliği ve koridor geçiş genişlikleri güvenli mi?"
            ],
            tableTitle: "RAF SİSTEMİ BOYUTSAL KONTROL VE SEHİM ÖLÇÜM TABLOSU",
            tableColumns: [
                { key: "no", label: "Ünite / Aks No" },
                { key: "location", label: "Bulunduğu Depo Bölümü" },
                { key: "deflection", label: "Ölçülen Travers Sehimi (mm)", default: "3.2 mm" },
                { key: "limit", label: "İzin Verilen Sınır (L/200)", default: "≤ 9.0 mm" },
                { key: "plumb", label: "Şakülünden Kaçıklık (mm)", default: "2.0 mm" },
                { key: "result", label: "Sonuç", options: ["Uygun (Yeşil)", "Hafif Hasar (Sarı)", "Uygun Değil (Kırmızı)"] }
            ],
            defaultRows: [
                { no: "Raf-01", location: "Arka Depo Alanı", deflection: "2.8 mm", limit: "≤ 9.0 mm", plumb: "1.5 mm", result: "Uygun (Yeşil)" },
                { no: "Raf-02", location: "Arka Depo Alanı", deflection: "3.1 mm", limit: "≤ 9.0 mm", plumb: "2.0 mm", result: "Uygun (Yeşil)" }
            ]
        };
    }

    if (eq.includes('HAVALANDIRMA') || eq.includes('KLİMA')) {
        return {
            title: "HAVALANDIRMA VE KLİMA TESİSATI PERİYODİK KONTROL RAPORU",
            docNo: "TKM-FR.180, REV.00 / YT: 01.09.2025",
            methods: ["RG, 25.04.2013 - 28628", "TS EN 12599", "TS 3419", "ASHRAE Standartları"],
            generalFields: [
                { key: "sistem_tipi", label: "Havalandırma / İklimlendirme Sistemi Tipi", type: "select", options: ["Merkezi Klima Santrali (AHU)", "VRV / VRF ve Taze Hava Sistemi", "Egzoz ve Taze Hava Fan Tesisatı", "Rooftop Ünitesi"], default: "VRV / VRF ve Taze Hava Sistemi" },
                { key: "marka_model", label: "Ünite Marka / Model", type: "text", default: "DAIKIN / MITSUBISHI / ALARKO CARRIER" },
                { key: "mahal_hacim", label: "Hizmet Verdiği Mahal ve Hacim (m³)", type: "text", default: "Mağaza & Ofis Alanları / 1200 m³" },
                { key: "filtre_durumu", label: "Filtre Tipi ve Temizlik Durumu", type: "text", default: "G4 Kaset Filtre / Temiz" }
            ],
            visualChecks: [
                "Fan ve klima üniteleri titreşim takozları (izolatörler) üzerine sağlam monte edilmiş mi?",
                "Hava kanallarında sızdırmazlık, askı rotları ve izolasyon durumu uygun mu?",
                "Menfez ve anemostatlarda tıkanıklık, kırık veya hava akış engeli yok mu?",
                "Yangın damperi ve yangın otomasyon bağlantısı mevcut ve çalışır durumda mı?",
                "Elektrik besleme panosu, acil bakım şalteri (pako şalter) ve gövde topraklaması uygun mu?",
                "Drenaj hattı ve yoğuşma tavası temiz ve sızdırmaz durumda mı?"
            ],
            tableTitle: "MENFEZ HAVA HIZI, DEBİ VE ORTAM ÖLÇÜM TABLOSU",
            tableColumns: [
                { key: "no", label: "Ölçüm No" },
                { key: "location", label: "Mahal / Menfez Adı" },
                { key: "type", label: "Menfez Tipi", options: ["Taze Hava Üfleme", "Egzoz Emiş", "İklimlendirme Üfleme"] },
                { key: "size", label: "Ebat / Kesit (cm / m²)", default: "40x40 cm (0.16 m²)" },
                { key: "velocity", label: "Hava Hızı V (m/s)", default: "2.4 m/s" },
                { key: "flow", label: "Debi Q (m³/h)", default: "1382 m³/h" },
                { key: "temp", label: "Sıcaklık (°C) / Nem (%)", default: "21.5 °C / %46" },
                { key: "result", label: "Sonuç", options: ["Uygun", "Uygun Değil"] }
            ],
            defaultRows: [
                { no: "M-1", location: "Satış Alanı Giriş Bölgesi", type: "Taze Hava Üfleme", size: "40x40 cm (0.16 m²)", velocity: "2.5 m/s", flow: "1440 m³/h", temp: "21.2 °C / %45", result: "Uygun" },
                { no: "M-2", location: "Satış Alanı Orta Bölüm", type: "Taze Hava Üfleme", size: "40x40 cm (0.16 m²)", velocity: "2.3 m/s", flow: "1325 m³/h", temp: "21.6 °C / %46", result: "Uygun" },
                { no: "E-1", location: "Depo ve Teknik Hacim", type: "Egzoz Emiş", size: "30x30 cm (0.09 m²)", velocity: "2.8 m/s", flow: "907 m³/h", temp: "22.4 °C / %48", result: "Uygun" }
            ]
        };
    }

    if (eq.includes('YAĞMURLAMA') || eq.includes('SPRİNKLER') || eq.includes('YANGIN DOLAP') || eq.includes('TÜP') || eq.includes('SÖNDÜRME')) {
        return {
            title: `${equipmentName.toUpperCase()} PERİYODİK KONTROL RAPORU`,
            docNo: "TKM-FR.215, REV.00 / YT: 01.09.2025",
            methods: ["Binaların Yangından Korunması Hakkında Yönetmelik", "RG, 25.04.2013 - 28628", "TS EN 12845", "TS EN 671-1/2/3", "TS ISO 11602-2"],
            generalFields: [
                { key: "sistem_turu", label: "Yangın Söndürme Sistemi / Ekipman Türü", type: "text", default: equipmentName },
                { key: "su_kaynagi", label: "Su Kaynağı / Söndürücü Madde Tipi", type: "text", default: "Yangın Pompa İstasyonu / KKT / CO2" },
                { key: "calisma_basinci", label: "Sistem Statik / Dinamik Basıncı (Bar)", type: "text", default: "6.5 Bar / 5.2 Bar" },
                { key: "adet_kapsam", label: "Kontrol Edilen Ekipman / Zon Adedi", type: "text", default: "Tesis Geneli Tam Kapsam" }
            ],
            visualChecks: [
                "Ekipmanların önü açık, kolay erişilebilir ve yönlendirme levhaları mevcut mu?",
                "Boru hatları, vanalar, hortumlar ve lanslarda kaçak, yırtık veya korozyon yok mu?",
                "Manometreler (basınç göstergeleri) yeşil/uygun çalışma aralığında mı?",
                "Yangın dolaplarında hortum makarası rahat dönüyor ve lans açma-kapama vanası çalışıyor mu?",
                "Sprinkler başlıkları boyasız, darbesiz ve önünde engel (istif mesafesi >50 cm) olmadan açık mı?",
                "Portatif söndürücülerin mühürleri, pimleri, kontrol etiketleri ve dolum tarihleri geçerli mi?"
            ],
            tableTitle: "YANGIN SÖNDÜRME EKİPMANLARI KONTROL VE ÖLÇÜM TABLOSU",
            tableColumns: [
                { key: "no", label: "No / Kod" },
                { key: "type", label: "Ekipman Cinsi / Kapasitesi", default: equipmentName },
                { key: "location", label: "Bulunduğu Mahal / Kat" },
                { key: "pressure", label: "Basınç / Manometre / Dolum Durumu", default: "Uygun (Yeşil Bölge / 6 Bar)" },
                { key: "physical", label: "Fiziksel & Fonksiyon Kontrolü", default: "Hortum, Vana, Nozul Tam" },
                { key: "result", label: "Sonuç", options: ["Uygun", "Uygun Değil"] }
            ],
            defaultRows: [
                { no: "YD-01", type: equipmentName, location: "Zemin Kat Giriş Koridoru", pressure: "Uygun (6.2 Bar)", physical: "Tam ve Çalışır Durumda", result: "Uygun" },
                { no: "YD-02", type: equipmentName, location: "Depo Alanı Çıkışı", pressure: "Uygun (6.0 Bar)", physical: "Tam ve Çalışır Durumda", result: "Uygun" }
            ]
        };
    }

    // Default Universal Engineering Schema for any other equipment
    return {
        title: `${equipmentName.toUpperCase()} PERİYODİK KONTROL VE MUAYENE RAPORU`,
        docNo: "TKM-FR.100, REV.00 / YT: 01.09.2025",
        methods: ["RG, 25.04.2013 - 28628 (İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği)", "İlgili TS EN Standartları"],
        generalFields: [
            { key: "marka", label: "Marka", type: "text", default: "STANDART" },
            { key: "model_tip", label: "Model / Tip", type: "text", default: equipmentName },
            { key: "seri_no", label: "Seri Numarası / İmal Yılı", type: "text", default: "2023" },
            { key: "kapasite", label: "Kapasite / Teknik Değer", type: "text", default: "Standart Kapasite" }
        ],
        visualChecks: [
            "Ekipman gövde ve taşıyıcı elemanlarında çatlak, korozyon veya deformasyon bulunmuyor mu?",
            "Emniyet ve güvenlik donanımları (acil durdurma, limit switch, valf vb.) çalışır durumda mı?",
            "Elektriksel bağlantılar, kumanda panosu ve gövde topraklaması standartlara uygun mu?",
            "Uyarı, kapasite ve kullanım talimatı etiketleri ekipman üzerinde okunaklı mı?",
            "Fonksiyon ve yük/basınç testlerinde ekipman güvenli şekilde çalıştı mı?"
        ],
        tableTitle: "FONKSİYON TESTİ VE ÖLÇÜM DEĞERLERİ TABLOSU",
        tableColumns: [
            { key: "no", label: "No" },
            { key: "test_item", label: "Kontrol / Test Edilen Kısım" },
            { key: "measured", label: "Ölçülen / Gözlenen Değer" },
            { key: "reference", label: "Standart Kriter" },
            { key: "result", label: "Sonuç", options: ["Uygun", "Uygun Değil"] }
        ],
        defaultRows: [
            { no: "1", test_item: "Gözle Fiziksel Muayene", measured: "Deformasyon Yok", reference: "Hasarsız Olmalı", result: "Uygun" },
            { no: "2", test_item: "Fonksiyon ve Emniyet Testi", measured: "Normal Çalıştı", reference: "Tam Fonksiyon", result: "Uygun" }
        ]
    };
};
