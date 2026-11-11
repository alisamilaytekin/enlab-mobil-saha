-- ============================================================================
-- HIZLI RAPOR - MÜŞTERİ RAPOR PORTALI VERİTABANI ŞEMASI (SUPABASE POSTGRES)
-- Supabase Dashboard -> SQL Editor bölümüne yapıştırıp "Run" butonuna basın.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. MÜŞTERİ / İŞYERİ KLASÖRLERİ
CREATE TABLE IF NOT EXISTS public.portal_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_slug TEXT NOT NULL UNIQUE,
    work_order_code TEXT DEFAULT '',
    local_wo_id TEXT DEFAULT '',
    company_name TEXT NOT NULL,
    company_branch TEXT DEFAULT '',
    company_address TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    pin_hash TEXT,
    has_pin BOOLEAN NOT NULL DEFAULT FALSE,
    branding_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_folders_slug ON public.portal_folders (share_slug);
CREATE INDEX IF NOT EXISTS idx_portal_folders_local_wo ON public.portal_folders (local_wo_id);
CREATE INDEX IF NOT EXISTS idx_portal_folders_updated ON public.portal_folders (updated_at DESC);

-- 2. YÜKLENEN RAPORLAR (Uygulama A4 HTML veya Harici PDF)
CREATE TABLE IF NOT EXISTS public.portal_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.portal_folders(id) ON DELETE CASCADE,
    share_slug TEXT NOT NULL UNIQUE,
    verify_code TEXT NOT NULL,
    local_inspection_id TEXT DEFAULT '',
    report_no TEXT NOT NULL,
    equipment_name TEXT NOT NULL,
    template_code TEXT DEFAULT '',
    inspection_date TEXT DEFAULT '',
    next_inspection_date TEXT DEFAULT '',
    inspector_name TEXT DEFAULT '',
    result_status TEXT DEFAULT 'UYGUN',
    source_type TEXT NOT NULL DEFAULT 'app_html', -- 'app_html' | 'uploaded_pdf'
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'text/html',
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    upload_ready BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_reports_slug ON public.portal_reports (share_slug);
CREATE INDEX IF NOT EXISTS idx_portal_reports_folder ON public.portal_reports (folder_id);
CREATE INDEX IF NOT EXISTS idx_portal_reports_verify ON public.portal_reports (report_no, verify_code);
CREATE INDEX IF NOT EXISTS idx_portal_reports_local_insp ON public.portal_reports (folder_id, local_inspection_id);

-- 3. GÜVENLİK: RLS AKTİF (Doğrudan anonim erişim kapalı; yalnızca Vercel sunucu API erişir)
ALTER TABLE public.portal_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_reports ENABLE ROW LEVEL SECURITY;

-- 4. RAPOR DOSYALARI İÇİN ÖZEL (PRIVATE) STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reports',
    'reports',
    false,
    52428800, -- 50 MB max dosya boyutu
    ARRAY['text/html', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['text/html', 'application/pdf'];
