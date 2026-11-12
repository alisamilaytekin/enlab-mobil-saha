import os
import sys
import json
import shutil
import zipfile
import subprocess
import glob

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(PROJECT_DIR, 'src')
ANDROID_DIR = os.path.join(PROJECT_DIR, 'android')
DIST_DIR = os.path.join(PROJECT_DIR, 'dist')
TOOLS_DIR = os.path.join(PROJECT_DIR, 'tools')
UBER_JAR = os.path.join(TOOLS_DIR, 'uber-apk-signer.jar')
KEYSTORE_FILE = os.path.join(TOOLS_DIR, 'enlab_release.jks')
VERSION_FILE = os.path.join(PROJECT_DIR, 'version.json')

STORED_FILES = {
    'resources.arsc',
    'res/drawable/ic_launcher.png'
}

def get_current_version_info():
    default_info = {"major": 0, "minor": 1, "version": "v0.1", "build_count": 1}
    if not os.path.exists(VERSION_FILE):
        return default_info
    try:
        with open(VERSION_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default_info

def bump_to_next_version(info):
    major = info.get("major", 0)
    minor = info.get("minor", 1) + 1
    next_info = {
        "major": major,
        "minor": minor,
        "version": f"v{major}.{minor}",
        "build_count": info.get("build_count", 1) + 1
    }
    with open(VERSION_FILE, 'w', encoding='utf-8') as f:
        json.dump(next_info, f, indent=2, ensure_ascii=False)
    return next_info

def write_zip_entry(zout, file_path, archive_path):
    # resources.arsc ve ic_launcher.png MUTLAKA sıkıştırmasız (STORED) olmalıdır
    is_stored = archive_path in STORED_FILES or archive_path.endswith('.arsc')
    comp_type = zipfile.ZIP_STORED if is_stored else zipfile.ZIP_DEFLATED

    with open(file_path, 'rb') as f:
        data = f.read()

    zinfo = zipfile.ZipInfo(archive_path)
    zinfo.compress_type = comp_type
    zinfo.external_attr = 0o644 << 16
    zout.writestr(zinfo, data)

def build(target_version=None):
    print("=" * 65)
    print("Hızlı Rapor - APK Derleme & İmzama Aracı")
    print("=" * 65)

    if not os.path.exists(SRC_DIR):
        print(f"[!] HATA: 'src' klasörü bulunamadı: {SRC_DIR}")
        return False
    if not os.path.exists(ANDROID_DIR):
        print(f"[!] HATA: 'android' klasörü bulunamadı: {ANDROID_DIR}")
        return False

    ver_info = get_current_version_info()
    current_ver = target_version or ver_info.get("version", "v0.1")
    apk_filename = f"Hizli_Rapor_{current_ver}.apk"

    print(f"[*] Derlenen Versiyon : {current_ver}")
    print(f"[*] Çıktı Dosyası     : {apk_filename}\n")

    os.makedirs(DIST_DIR, exist_ok=True)
    temp_apk = os.path.join(DIST_DIR, 'unsigned_temp.apk')
    if os.path.exists(temp_apk):
        try: os.remove(temp_apk)
        except Exception: pass

    for old_candidate in glob.glob(os.path.join(DIST_DIR, "*aligned-*.apk")):
        try: os.remove(old_candidate)
        except Exception: pass

    # 0. AndroidManifest kontrolu ve yama (tools/patch_android_manifest.py)
    manifest_script = os.path.join(TOOLS_DIR, 'patch_android_manifest.py')
    if os.path.exists(manifest_script):
        print("[0/3] AndroidManifest.xml uyumluluk kontrolu yapiliyor...")
        mres = subprocess.run([sys.executable, manifest_script], capture_output=True, text=True, encoding='utf-8')
        if mres.returncode != 0:
            print(f"[!] HATA: AndroidManifest yamasi basarisiz:\n{mres.stderr or mres.stdout}")
            return False
        for line in (mres.stdout or '').strip().splitlines():
            print(f"  {line}")

    # 0b. JS Modullerini Otomatik Paketle (src/js -> src/app.js)
    bundle_script = os.path.join(TOOLS_DIR, 'bundle.py')
    if os.path.exists(bundle_script):
        print("[0/3] src/js modulleri paketleniyor (tools/bundle.py)...")
        res = subprocess.run([sys.executable, bundle_script], capture_output=True, text=True, encoding='utf-8')
        if res.returncode != 0:
            print(f"[!] HATA: Modul paketleme basarisiz:\n{res.stderr or res.stdout}")
            return False
        print("  -> Moduller basariyla 'src/app.js' olarak paketlendi.\n")

    print("[1/3] Dosyalar Android standartlarında (STORED/DEFLATED) paketleniyor...")
    file_count = 0
    with zipfile.ZipFile(temp_apk, 'w') as zout:
        # 1. Android native dosyaları
        for root, dirs, files in os.walk(ANDROID_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ANDROID_DIR).replace('\\', '/')
                write_zip_entry(zout, full_path, rel_path)
                file_count += 1

        # 2. Web uygulaması kaynak dosyaları (assets/ içine)
        for root, dirs, files in os.walk(SRC_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, SRC_DIR).replace('\\', '/')
                archive_path = f"assets/{rel_path}"
                write_zip_entry(zout, full_path, archive_path)
                file_count += 1

    print(f"  -> {file_count} dosya paketlendi. Geçici APK: {os.path.getsize(temp_apk) / 1024:.1f} KB")

    # 3. APK Zipalign & Sign
    print("\n[2/3] APK Zipalign (4-byte hizalama) ve Kurumsal Sertifika ile İmzalanıyor (v1, v2, v3)...")
    if not os.path.exists(UBER_JAR):
        print(f"[!] HATA: uber-apk-signer bulunamadı: {UBER_JAR}")
        return False

    cmd = [
        "java", "-jar", UBER_JAR,
        "-a", temp_apk,
        "--out", DIST_DIR,
        "--ks", KEYSTORE_FILE,
        "--ksAlias", "enlab",
        "--ksPass", "enlab2026",
        "--ksKeyPass", "enlab2026",
        "--allowResign",
        "--verbose"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("[!] İmzalama sırasında hata oluştu:")
        print(res.stderr or res.stdout)
        return False

    print("  -> Zipalign ve imzalama başarılı!")

    # 4. Sonuç dosyasını adlandır
    print("\n[3/3] Çıktı APK hazırlanıyor...")
    signed_candidates = glob.glob(os.path.join(DIST_DIR, "*aligned-*.apk"))
    dist_apk = os.path.join(DIST_DIR, apk_filename)
    root_apk = os.path.join(PROJECT_DIR, apk_filename)

    if signed_candidates:
        if os.path.exists(dist_apk):
            try: os.remove(dist_apk)
            except Exception: pass
        os.rename(signed_candidates[0], dist_apk)

        # Ana klasöre de kopyala
        shutil.copy2(dist_apk, root_apk)

        # Temizlik
        if os.path.exists(temp_apk):
            try: os.remove(temp_apk)
            except Exception: pass
        for extra in glob.glob(os.path.join(DIST_DIR, "*.idsig")):
            try: os.remove(extra)
            except Exception: pass

        if target_version is None:
            next_ver_info = bump_to_next_version(ver_info)
            next_ver_str = next_ver_info['version']
        else:
            next_ver_str = "(Sabit versiyon)"

        size_kb = os.path.getsize(dist_apk) / 1024
        print("=" * 65)
        print("TEBRİKLER! APK BAŞARIYLA DERLENDİ VE İMZALANDI:")
        print(f"  -> Dosya Adı           : {apk_filename}")
        print(f"  -> Konum (Ana Klasör)  : {root_apk}")
        print(f"  -> Konum (dist Klasörü): {dist_apk}")
        print(f"  -> Boyut               : {size_kb:.1f} KB")
        print(f"  -> İmza                : Kurumsal ENLAB (v1, v2, v3)")
        print(f"  -> Sonraki Versiyon    : {next_ver_str}")
        print("=" * 65)
        return True
    else:
        print("[!] HATA: İmzalı APK çıktısı bulunamadı.")
        return False

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else None
    ok = build(target)
    if not ok:
        sys.exit(1)
