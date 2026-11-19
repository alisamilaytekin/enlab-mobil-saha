# -*- coding: utf-8 -*-
"""
Evrensel Form & A4 PDF Motoru (Universal Form & PDF Engine v1) Doğrulama Testi
"""
import os
import re
import sys

def verify_universal_engine():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    registry_path = os.path.join(root, 'src', 'js', '06b-universal-schema-registry.js')
    pdf_engine_path = os.path.join(root, 'src', 'js', '10e-pdf-universal.js')
    editor_path = os.path.join(root, 'src', 'js', '06-editor-specialized.js')
    app_js_path = os.path.join(root, 'src', 'app.js')
    templates_path = os.path.join(root, 'src', 'templates.js')

    for p in [registry_path, pdf_engine_path, editor_path, app_js_path, templates_path]:
        assert os.path.exists(p), f"Eksik dosya: {p}"

    with open(registry_path, 'r', encoding='utf-8') as f:
        reg_src = f.read()
    with open(pdf_engine_path, 'r', encoding='utf-8') as f:
        pdf_src = f.read()
    with open(templates_path, 'r', encoding='utf-8') as f:
        tpl_src = f.read()
    with open(app_js_path, 'r', encoding='utf-8') as f:
        app_src = f.read()

    # 1. Katalogdaki tüm 29 şablon ID'sinin kontrolü
    catalog_ids = re.findall(r'\{\s*id:\s*"(\d+)"', tpl_src)
    unique_ids = sorted(set(catalog_ids))
    print(f"[OK] Katalogda bulunan benzersiz sablon sayisi: {len(unique_ids)}")
    assert len(unique_ids) >= 25, "En az 25 şablon olmalı!"

    # 2. Yeni evrensel şema kayıt defterindeki şablonların kontrolü
    master_ids = re.findall(r"'(\d{4})'\s*:\s*\{", reg_src)
    print(f"[OK] UniversalSchemaRegistry icinde dogrudan tanimli semalar ({len(master_ids)} adet): {', '.join(master_ids)}")

    # 3. Kalıcı Semantic ID kontrolü (chk_<tid>_<slug>)
    semantic_chk_ids = re.findall(r"id:\s*'chk_\d{4}_[a-z0-9_]+'", reg_src)
    print(f"[OK] Kalici Semantic ID'li gozle kontrol kriteri sayisi: {len(semantic_chk_ids)}")
    assert len(semantic_chk_ids) >= 80, "En az 80 kalıcı semantic ID'li kriter olmalı!"

    # 4. PDF Engine temel yeteneklerinin kontrolü
    required_symbols = [
        'UniversalSchemaRegistry',
        'UniversalTenantOverlay',
        'UniversalPdfEngine',
        'buildDocumentAST',
        'paginateASTToA4Pages',
        'sealReportSnapshot',
        'unsealReportSnapshot',
        'openUniversalTemplateStudioModal',
        'evaluateRowLimitRules',
        'buildUniversalSignatureBlock'
    ]
    for sym in required_symbols:
        assert sym in app_src, f"src/app.js içinde '{sym}' bulunamadı!"
    print(f"[OK] Tum {len(required_symbols)} temel Evrensel Motor API'si src/app.js icinde aktif.")

    print("=" * 65)
    print("TUM EVRENSEL FORM & PDF MOTORU TESTLERI BASARIYLA GECTI!")
    print("=" * 65)

if __name__ == '__main__':
    verify_universal_engine()
