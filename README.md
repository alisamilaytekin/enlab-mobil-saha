# ENLAB Mobil Saha — Geliştirici & Kaynak Kod Rehberi

Bu proje, **TKM Kontrol / TEKKOMER** bünyesinde saha denetimleri, ekipman kontrolleri (Topraklama, Jeneratör, Yangın Algılama, Paratoner, vb.) ve resmi Türkak formatında **A4 Denetim Raporu** üretimi için tasarlanmış **çevrimdışı öncelikli (Offline-First)** hibrit bir mobil uygulamadır.

APK dosyası tamamen açılmış, kaynak kodları ayrıştırılmış ve **anında geliştirmeye ve tekrar APK üretmeye hazır** hale getirilmiştir.

---

## 📁 Proje Klasör Yapısı

```text
tkm uygulaması/
├── src/                          <-- 🛠️ GELİŞTİRMELERİN YAPILACAĞI ANA KAYNAK KODLAR
│   ├── index.html                <-- Ana sayfa kabuğu, modal yapısı, A4 çıktı CSS stilleri
│   ├── app.js                    <-- Uygulama motoru, form doldurma, navigasyon, fotoğraf işleme
│   ├── templates.js              <-- Muayene ve denetim şablonları (FR.317, FR.164, FR.320 vb.)
│   ├── offline-db.js             <-- Çevrimdışı veritabanı motoru & Android haberleşme köprüsü
│   ├── offline-data.js           <-- Varsayılan cihaz, ekipman, standart ve firma verileri
│   ├── manifest.json             <-- Mobil PWA yapılandırması
│   ├── assets/                   <-- Kurumsal logolar (TEKKOMER, TÜRKAK, e-imza, QR)
│   └── vendor/                   <-- Tailwind CSS ve FontAwesome ikon kütüphanesi
│
├── android/                      <-- 🤖 ANDROID NATIVE SARMALAYICI (KABUK)
│   ├── AndroidManifest.xml       <-- İzinler, uygulama paket adı ve ayarlar
│   ├── classes.dex               <-- Native Android WebView ve Print köprü motoru
│   ├── resources.arsc            <-- Android kaynak tablosu
│   └── res/                      <-- Uygulama ikonu (ic_launcher.png)
│
├── dist/                         <-- 📦 ÇIKTI KLASÖRÜ
│   └── ENLAB_Mobil_Saha_Guncel.apk <-- Yüklenmeye hazır, imzalı ve hizalanmış güncel APK
│
├── tools/                        <-- ⚙️ GELİŞTİRME & DERLEME ARAÇLARI
│   ├── dev_server.py             <-- Canlı yerel geliştirme sunucusu
│   ├── build_apk.py              <-- Tek tıkla APK paketleyici ve imzalayıcı
│   └── uber-apk-signer.jar       <-- Android v1, v2, v3 sertifika imzalama motoru
│
├── start_dev.bat                 <-- 🚀 Çift tıkla: Canlı geliştirme sunucusunu ve tarayıcıyı açar
├── build_apk.bat                 <-- 🔨 Çift tıkla: src/ içeriğinden yeni imzalı APK üretir
└── README.md                     <-- Bu rehber belgesi
```

---

## 🚀 Nasıl Geliştirilir? (3 Adımda Geliştirme Döngüsü)

### 1. Adım: Canlı Geliştirme Sunucusunu Başlatın
- Klasördeki **`start_dev.bat`** dosyasına çift tıklayın.
- Otomatik olarak yerel sunucu başlar ve varsayılan tarayıcınızda (`http://localhost:8080`) uygulama açılır.
- **Aynı Wi-Fi ağındaki telefonunuzdan** da konsolda yazan IP adresiyle (örn: `http://192.168.1.x:8080`) uygulamayı mobil cihazınızda anlık test edebilirsiniz.

### 2. Adım: Kodları Düzenleyin
`src/` klasöründeki dosyaları dilediğiniz kod editörü (VS Code vb.) veya Not Defteri ile açıp düzenleyin:
- **Yeni Form / Şablon Eklemek İçin**: `src/templates.js` dosyasını düzenleyin.
- **Tasarım / Arayüz / Buton Değişiklikleri İçin**: `src/index.html` ve `src/app.js` dosyasını düzenleyin.
- **Rapor Yazdırma ve A4 Görünümü İçin**: `src/index.html` içindeki `.tkm-a4-page` CSS stillerini ve `src/app.js` içindeki `renderA4PrintView` fonksiyonunu düzenleyin.
- **Logoları Değiştirmek İçin**: `src/assets/` klasöründeki `tekkomer_logo.png` veya `turkak_logo.jpg` dosyalarını güncelleyin.
- Tarayıcınızı yenilediğinizde (F5) tüm değişiklikleri **anında** görürsünüz.

### 3. Adım: Yeni APK'yı Üretin (Otomatik Versiyonlama)
- Yaptığınız değişiklikleri telefona yüklenebilir bir Android APK'sına dönüştürmek için **`build_apk.bat`** dosyasına çift tıklayın.
- Sistem her güncellemede dosya adını **otomatik olarak bir versiyon yükseltir** (Örn: `v0.1` -> `v0.2` -> `v0.3`):
  1. `src/` klasöründeki güncel kodları paketler.
  2. Android native dosyalarıyla birleştirir.
  3. Zipalign hizalamasını yapar.
  4. Google Android v1, v2 ve v3 şemalarıyla APK'yı imzalar.
  5. Çıktıyı doğrudan ana klasörde **`ENLAB_Mobil_Saha_v0.X.apk`** olarak oluşturur.
- Bu APK dosyasını doğrudan Android telefonunuza veya tabletinize yükleyip çalıştırabilirsiniz!

---

## 🔍 Temel Bileşenler ve Mimari Detayları

1. **Çevrimdışı Çalışma (100% Offline)**:
   - Uygulama internet bağlantısına ihtiyaç duymaz.
   - `offline-db.js`, istemci tarafında `window.fetch` çağrılarını yakalayarak REST API gibi çalışır ve verileri tarayıcının yerel hafızasında saklar.
   - Android APK içinde çalışırken ayrıca `window.AndroidBridge` üzerinden cihaz depolama alanına yedekleme yapar.

2. **A4 Resmi Raporlama Motoru**:
   - Türkak akreditasyon standartlarına (FR.317 Topraklama, FR.164 Jeneratör vb.) birebir uyumlu mm (milimetre) hassasiyetinde A4 CSS motoru kullanılmıştır.
   - Android cihazlarda sistemin yerel `PrintManager` servisine bağlanarak doğrudan PDF kaydetme veya yazdırma sağlar.

3. **Uygulama İçi Arama ve Hızlı Notlar**:
   - Firma, şube ve rapor aramaları anlık olarak yerel indekste taranır.
   - Cihaz kamerasıyla fotoğraf çekme, galeriye kaydetme ve rapora ekleme desteklenir.
