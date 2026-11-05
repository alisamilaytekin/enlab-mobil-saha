// ============================================================================
// HIZLI RAPOR - MODÜL 00: SİSTEM SABİTLERİ (CONSTANTS)
// ============================================================================

window.HIZLI_RAPOR_CONSTANTS = {
    APP_NAME: 'Hızlı Rapor',
    VERSION: '0.29',
    
    // Rapor ve Muayene Durumları
    STATUS: {
        TO_COMPLETE: 'Tamamlanacak',
        TO_SIGN: 'İmzalanacak',
        PENDING_APPROVAL: 'İmzalandı / Onay Bekliyor',
        APPROVED: 'Onaylandı',
        EDIT_REQUIRED: 'Düzenlenecek',
        SENT: 'Rapor Gönderilmiş'
    },
    
    // Değerlendirme Sonuçları
    RESULTS: {
        SUITABLE: 'UYGUN',
        UNSUITABLE: 'UYGUN DEĞİL',
        NOT_APPLICABLE: 'KAPSAM DIŞI',
        NOT_INSPECTED: 'KONTROL EDİLMEDİ'
    },
    
    // Şablon ID'leri
    TEMPLATES: {
        ELECTRICAL_2201: '2201',
        GROUNDING_2202: '2202',
        GENERATOR_2205: '2205',
        LIGHTNING_2203: '2203',
        TRANSFORMER_2204: '2204',
        ILLUMINATION_2206: '2206',
        THERMAL_2207: '2207',
        BODY_PROTECTION_2208: '2208'
    },
    
    // Veri Saklama Anahtarları
    STORAGE: {
        DB_V3: 'enlab_offline_db_v3_clean',
        DB_V2: 'enlab_offline_db_v2',
        CUSTOM_DEFECTS: 'enlab_item_custom_defects_v2',
        DEFECT_LIBRARY: 'enlab_defects_library_v1',
        USER_ACCOUNTS: 'enlab_user_accounts_v1',
        CURRENT_USER: 'enlab_current_user_v1',
        COMPANY_SETTINGS: 'enlab_company_branding_v1'
    }
};
