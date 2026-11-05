# -*- coding: utf-8 -*-
import os
import sys

def bundle():
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    js_dir = os.path.join(project_dir, 'src', 'js')
    output_app_js = os.path.join(project_dir, 'src', 'app.js')

    if not os.path.exists(js_dir):
        print(f"[!] HATA: '{js_dir}' klasoru bulunamadi!")
        return False

    module_files = sorted([f for f in os.listdir(js_dir) if f.endswith('.js')])
    if not module_files:
        print("[!] HATA: src/js/ icinde JS modulu bulunamadi!")
        return False

    print("=" * 65)
    print("Hizli Rapor - Modul Paketleyici (Bundle Engine)")
    print("=" * 65)

    bundled_parts = []
    total_lines = 0

    for mf in module_files:
        mf_path = os.path.join(js_dir, mf)
        with open(mf_path, 'r', encoding='utf-8') as f:
            content = f.read()

        line_count = len(content.splitlines())
        total_lines += line_count
        print(f"  [OK] {mf:28s} : {line_count:5d} satir")
        bundled_parts.append(content)

    full_bundle = "\n\n".join(bundled_parts)
    with open(output_app_js, 'w', encoding='utf-8') as f:
        f.write(full_bundle)

    output_lines = len(full_bundle.splitlines())
    output_size_kb = len(full_bundle.encode('utf-8')) / 1024

    print("-" * 65)
    print(f"BASARILI: {len(module_files)} modul paketlendi -> src/app.js")
    print(f"  -> Toplam Satir : {output_lines}")
    print(f"  -> Dosya Boyutu : {output_size_kb:.1f} KB")
    print("=" * 65)
    return True

if __name__ == '__main__':
    success = bundle()
    sys.exit(0 if success else 1)
