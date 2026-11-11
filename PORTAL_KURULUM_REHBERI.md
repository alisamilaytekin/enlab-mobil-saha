# Hızlı Rapor — İnternet Müşteri Portalı ve Alan Adı (Domain) Kurulum Rehberi

Bu rehber ile **Hızlı Rapor (Android / Web)** uygulamanızda hazırladığınız periyodik kontrol raporlarını tek dokunuşla internete yükleyebilir, müşterilerinize şifreli/şifresiz **özel klasör ve rapor bağlantısı** paylaşabilir, raporların üzerindeki **Kare Kod (QR)** ve **Doğrulama Kodu** ile internet üzerinden doğrulama ve resmi A4 PDF indirme imkânı sunabilirsiniz.

---

## Sistem Mimarisi Özeti

1. **Veritabanı ve Dosya Depolama (Supabase — Ücretsiz Plan):**
   - Müşteri giriş hesapları (`portal_customer_accounts`), müşteri klasörleri (`portal_folders`), rapor bilgileri (`portal_reports`) ve yüklenen A4 HTML / harici PDF dosyaları güvenli şekilde saklanır.
   - Storage alanı **private (özel)** tutulur; dosyalar yalnızca ilgili firmanın oturum açması sonrasında sunucu üzerinden servis edilir.
2. **Web Portalı ve API (Vercel — Ücretsiz Hobby Plan):**
   - Müşterilerin kullanıcı adı ve şifreyle giriş yapıp kendi raporlarını gördüğü web sitesi (`/` müşteri girişi ve doğrulama sayfası, `/p/<kod>` müşteri klasörü, `/r/<kod>` rapor görüntüleyici, `/admin` web yönetici paneli).
   - Katı çok kiracılı izolasyon (multi-tenant isolation) sayesinde her firma yalnızca kendi raporlarını görür; başka firmaların klasör veya raporlarına erişemez.
3. **Yerel Wi-Fi / Bilgisayar Sunucusu (İsteğe Bağlı):**
   - İnternete çıkmadan ofis içi veya test amaçlı kullanmak isterseniz `start_portal_local.bat` dosyasını çalıştırmanız yeterlidir.

---

## Adım 1: Domain (Alan Adı) Alma veya Alt Alan Adı Bağlama

Eğer zaten firmanıza ait bir domain varsa (ör. `tekkomermuhendislik.com`), yeni domain almanıza gerek kalmadan:
- **`rapor.tekkomermuhendislik.com`** şeklinde bir alt alan adı (subdomain) açmanız hem daha profesyonel durur hem ana web sitenizi hiç etkilemez.

Yeni bir domain alacaksanız **Cloudflare Registrar**, **Turhost**, **Natro**, **İsimtescil** veya **Namecheap** üzerinden `.com` veya `.com.tr` alabilirsiniz (ör. `tekkomerrapor.com` veya mevcut şirket adınız).

---

## Adım 2: Ücretsiz Supabase Kurulumu (Veritabanı + Dosya Alanı)

1. **[supabase.com](https://supabase.com)** adresine girip GitHub veya e-posta ile ücretsiz hesap açın.
2. **New Project** diyerek yeni proje oluşturun:
   - **Region:** Avrupa'dan size en yakın bölgeyi seçin (**Frankfurt** veya **London** Türkiye için en hızlısıdır).
   - Güçlü bir Database Password belirleyip kaydedin.
3. Proje açıldığında sol menüden **SQL Editor** > **New Query** bölümüne girin.
4. Bilgisayarınızda proje klasöründeki [`portal/supabase_schema.sql`](portal/supabase_schema.sql) dosyasını açıp içindeki tüm SQL kodunu kopyalayın, Supabase SQL Editor'e yapıştırın ve **Run** butonuna basın.
   - Bu işlem `portal_folders` ve `portal_reports` tablolarını, indeksleri ve `reports` isimli **özel (private)** dosya depolama alanını otomatik oluşturur.
5. Sol alt çark ikonundan **Project Settings > API Keys** (veya **Connect / API**) sayfasına girin ve şu 2 bilgiyi bir yere not alın:
   - **Project URL** (`SUPABASE_URL` — ör. `https://abcdefghijkl.supabase.co`)
   - **Secret key (`sb_secret_...`)** veya **Legacy `service_role` secret** (`SUPABASE_SERVICE_ROLE_KEY` — *DİKKAT: `anon` / `sb_publishable_` değil, gizli olan **`sb_secret_...`** veya **`service_role`** anahtarı seçilmelidir ve kimseyle paylaşılmamalıdır*).

---

## Adım 3: Kodu GitHub'a Gönderme ve Vercel'de Yayına Alma

1. Proje ana klasöründeki [`push_to_github.bat`](push_to_github.bat) dosyasına çift tıklayarak yeni eklenen `portal/` klasörünü ve güncellenen uygulama kodlarını GitHub deponuza gönderin.
2. **[vercel.com](https://vercel.com)** adresine girip GitHub hesabınızla ücretsiz oturum açın.
3. **Add New... > Project** butonuna tıklayın ve GitHub'daki **`enlab-mobil-saha`** deponuzu seçin (**Import**).
4. Kurulum ekranında **ÇOK ÖNEMLİ İKİ AYAR**:
   - **Root Directory (Kök Klasör):** `Edit` butonuna basıp **`portal`** klasörünü seçin!
   - **Environment Variables (Ortam Değişkenleri):** Aşağıdaki 4 değişkeni tek tek ekleyin:
     | Değişken Adı | Örnek / Açıklama |
     | --- | --- |
     | `SUPABASE_URL` | Supabase **Project URL** değeriniz |
     | `SUPABASE_SERVICE_ROLE_KEY` | Supabase gizli **service_role** anahtarınız |
     | `PORTAL_ADMIN_KEY` | Sadece sizin bileceğiniz güçlü bir yükleme şifresi (ör. `TkmPortal!2026#94`) |
     | `PORTAL_TOKEN_SECRET` | Rastgele uzun gizli bir metin (ör. klavyeden karmaşık 32 karakter) |
5. **Deploy** butonuna basın. Yaklaşık 30 saniye içinde siteniz yayına alınır (Vercel size önce `https://proje-adiniz.vercel.app` gibi ücretsiz bir HTTPS adresi verir).

---

## Adım 4: Domain'i Vercel'e Bağlama (Özel Alan Adı + Otomatik SSL)

1. Vercel projenizde **Settings > Domains** sekmesine girin.
2. Kullanacağınız adresi yazın (ör. `rapor.sirketadi.com`) ve **Add** deyin.
3. Vercel size ekleyeceğiniz **DNS Kaydı**nı gösterecektir:
   - **Subdomain için (`rapor.sirketadi.com`):** Domain firmanızın DNS panelinden Type: **`CNAME`**, Name: **`rapor`**, Target: **`cname.vercel-dns.com`** (veya Vercel'in verdiği hedef) kaydını ekleyin.
   - **Ana domain için (`sirketrapor.com`):** Type: **`A`**, Name: **`@`**, Value: Vercel'in verdiği IP (`76.76.21.21` veya panelde gösterilen güncel IP).
   - *(Eğer Cloudflare DNS kullanıyorsanız ilk kurulumda Proxy/Turuncu bulutu kapalı "DNS Only" yapmanız SSL doğrulamasını hızlandırır.)*
4. Birkaç dakika içinde Vercel otomatik ücretsiz HTTPS sertifikasını aktif eder ve **`https://rapor.sirketadi.com`** siteniz kullanıma hazır hale gelir!

---

## Adım 5: Android / Web Uygulamasını Kullanma (Otomatik Bağlantı & Müşteri Girişi)

1. Yeni oluşturulan **`Hizli_Rapor_v0.60.apk`** (veya `dist/` altındaki güncel APK) dosyasını Android telefonunuza kurun.
2. Uygulama **sunucu adresi veya yönetici şifresi istemeden** doğrudan bulut portalına (`https://hizli-rapor-portal.vercel.app`) bağlanır.
3. **Ayarlar > Şirket & Marka Bilgileri** bölümünden firma kısa adınızı / şirket adınızı veya rapor ön ekinizi belirlediğinizde, yüklenen müşteri klasörleri ve rapor bağlantıları otomatik olarak şirket ön ekinizle oluşur (ör. `/p/tkm-...`, `/r/tkm-...`) ve `/admin` panelinde şirkete göre filtrelenebilir.
4. *(İsteğe Bağlı — Özel Domain veya Kendi Sunucunuz)* Yalnızca farklı bir domain (`rapor.sirketadi.com`) ya da yerel/özel sunucu kullanacaksanız **Ayarlar > Bulut Müşteri Portalı (Otomatik) > Gelişmiş / Özel Domain & Varsayılan PIN** bölümünü açıp özel URL veya anahtar girebilirsiniz.
5. İsterseniz **Bağlantıyı Test Et** butonuna basarak sunucu bağlantısını tek dokunuşla doğrulayabilirsiniz.

---

## Adım 6: Günlük Kullanım Akışı

### A) Uygulamadan Doğrudan Rapor Yükleme
- İş Emri detayında **"İnternete Yükle"** butonuna veya A4 Rapor Önizleme ekranında alt bardaki **"Portal Yükle"** butonuna dokunun.
- Yüklenecek raporları seçin (isterseniz aynı klasöre ek **Hazır PDF** de ekleyebilirsiniz).
- **Müşteri Firma Giriş Bilgileri** bölümünde müşteri adı üzerinden otomatik önerilen **Kullanıcı Adı** ve **Şifre** hazır gelir (aynı müşteriye sonraki işlerde uygulama aynı firmayı otomatik hatırlayıp yeni klasörü de aynı firmanın hesabına bağlar).
- **"İnternete Yükle ve Link Oluştur"** dediğinizde:
  1. Her rapor için benzersiz link ve 6 haneli doğrulama kodu üretilir.
  2. Raporların A4 karekodu (QR) **otomatik olarak canlı rapor doğrulama linki** olacak şekilde işlenir.
  3. Aynı müşteri/iş klasörüne tekrar yükleme yapıldığında mevcut müşteri hesabı ve bağlantıları korunur, içerik güncellenir.
- Çıkan ekrandan tek tıkla **Girişi Kopyala**, **Paylaş (WhatsApp vb.)** veya **E-postaya Aktar** butonlarını kullanabilirsiniz.

### B) Bilgisayardan / Tarayıcıdan Müşteri Hesapları & Harici PDF Yönetimi
- Tarayıcıdan `https://hizli-rapor-portal.vercel.app/admin` adresine girip `PORTAL_ADMIN_KEY` ile oturum açabilirsiniz.
- Buradan yeni müşteri firma hesapları açabilir, mevcut firmaların şifrelerini sıfırlayabilir, hesapları pasife alabilir veya klasörleri firmalara atayabilirsiniz.
- Bilgisayarınızdaki hazır PDF dosyalarını (50 MB'a kadar) doğrudan ilgili müşteri firmasına ve klasörüne yükleyebilirsiniz.

### C) Müşteri Deneyimi (Firma İzolasyonu)
- Müşteri **`https://hizli-rapor-portal.vercel.app`** ana sayfasından (veya kendisine gönderilen klasör/rapor linkinden) **Kullanıcı Adı ve Şifre** ile giriş yapar.
- Giriş yapan firma yalnızca **kendi işletmesine ait** klasörleri ve tüm dönem raporlarını görür, orijinal A4 görünümüyle inceler ve **PDF İndir / Yazdır** yapar. Başka bir firmanın linkini açsa bile sunucu seviyesinde engellenir.
- QR kod veya **Rapor No + 6 Haneli Doğrulama Kodu** ile sorgulama yapan dış kişiler yalnızca raporun geçerli olduğunu teyit eder; firmanın adı, ekipman bilgisi ve rapor dosyası oturum açılmadan görüntülenmez.

---

## Bilgisayarda İnternetsiz Yerel Test / Wi-Fi Kullanımı

Canlı Vercel/Supabase kurulumuna geçmeden önce kendi bilgisayarınızda test etmek isterseniz:
1. Ana klasördeki **`start_portal_local.bat`** dosyasına çift tıklayın.
2. Açılan siyah pencerede yerel adres (ör. `http://localhost:8090`), aynı Wi-Fi'daki telefon adresi (ör. `http://192.168.1.35:8090`) ve varsayılan yönetici anahtarı görünür.
3. Telefon ve bilgisayar aynı Wi-Fi ağındayken Ayarlar'a `http://192.168.x.x:8090` yazıp tüm sistemi canlı deneyebilirsiniz.
