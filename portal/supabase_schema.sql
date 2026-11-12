-- ============================================================================
-- HIZLI RAPOR - MÜŞTERİ RAPOR PORTALI VERİTABANI ŞEMASI (SUPABASE POSTGRES)
-- Supabase Dashboard -> SQL Editor bölümüne yapıştırıp "Run" butonuna basın.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. MÜŞTERİ FİRMA GİRİŞ HESAPLARI (Çok Kiracılı / Multi-Tenant İzolasyon)
CREATE TABLE IF NOT EXISTS public.portal_customer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE CHECK (char_length(username) >= 3 AND username = LOWER(BTRIM(username))),
    company_name TEXT NOT NULL,
    company_key TEXT NOT NULL DEFAULT '',
    owner_company_slug TEXT NOT NULL DEFAULT '',
    owner_company_name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INTEGER NOT NULL DEFAULT 1,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_customer_accounts_owner
    ON public.portal_customer_accounts (owner_company_slug, company_key);

-- 2. MÜŞTERİ / İŞYERİ KLASÖRLERİ
CREATE TABLE IF NOT EXISTS public.portal_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_slug TEXT NOT NULL UNIQUE,
    work_order_code TEXT DEFAULT '',
    local_wo_id TEXT DEFAULT '',
    owner_company_slug TEXT NOT NULL DEFAULT '',
    owner_company_name TEXT NOT NULL DEFAULT '',
    customer_account_id UUID REFERENCES public.portal_customer_accounts(id) ON DELETE SET NULL,
    require_auth BOOLEAN NOT NULL DEFAULT FALSE,
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
CREATE INDEX IF NOT EXISTS idx_portal_folders_owner_company ON public.portal_folders (owner_company_slug, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_folders_customer_account ON public.portal_folders (customer_account_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_folders_updated ON public.portal_folders (updated_at DESC);

-- 3. YÜKLENEN RAPORLAR (Uygulama A4 HTML veya Harici PDF)
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

-- 4. GÜVENLİK: RLS AKTİF (Doğrudan anonim erişim kapalı; yalnızca Vercel sunucu API erişir)
ALTER TABLE public.portal_customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_reports ENABLE ROW LEVEL SECURITY;

-- 5. RAPOR DOSYALARI İÇİN ÖZEL (PRIVATE) STORAGE BUCKET
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

-- ============================================================================
-- 6. YAZILIM SAĞLAYICISI / FİRMA YÖNETİMİ / CİHAZ & İŞ EMİRLERİ (SAAS ÇEKİRDEK)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saas_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    branding_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_tenants_slug ON public.saas_tenants (slug);

CREATE TABLE IF NOT EXISTS public.saas_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.saas_tenants(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE CHECK (char_length(username) >= 3 AND username = LOWER(BTRIM(username))),
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'inspector' CHECK (role IN ('manager', 'inspector')),
    full_name TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Elektrik Mühendisi',
    ministry_reg_no TEXT NOT NULL DEFAULT '',
    diploma_no_date TEXT NOT NULL DEFAULT '',
    emo_no TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INTEGER NOT NULL DEFAULT 1,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_users_tenant ON public.saas_users (tenant_id, role, is_active);

CREATE TABLE IF NOT EXISTS public.saas_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.saas_tenants(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'Diğer',
    code TEXT NOT NULL DEFAULT '',
    brand TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    report_name TEXT NOT NULL,
    thermal_report_name TEXT NOT NULL DEFAULT '',
    is_thermal BOOLEAN NOT NULL DEFAULT FALSE,
    serial TEXT NOT NULL DEFAULT '',
    cal_date TEXT NOT NULL DEFAULT '',
    valid_date TEXT NOT NULL DEFAULT '',
    cert_no TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_devices_tenant ON public.saas_devices (tenant_id, is_active, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.saas_user_devices (
    user_id UUID NOT NULL REFERENCES public.saas_users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.saas_devices(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_saas_user_devices_device ON public.saas_user_devices (device_id);

CREATE TABLE IF NOT EXISTS public.saas_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.saas_tenants(id) ON DELETE CASCADE,
    assigned_user_id UUID NOT NULL REFERENCES public.saas_users(id) ON DELETE CASCADE,
    work_order_code TEXT NOT NULL DEFAULT '',
    company_name TEXT NOT NULL,
    company_branch TEXT NOT NULL DEFAULT '',
    company_address TEXT NOT NULL DEFAULT '',
    isg_katip_no TEXT NOT NULL DEFAULT '',
    sgk_sicil_no TEXT NOT NULL DEFAULT '',
    contact_email TEXT NOT NULL DEFAULT '',
    field_notes TEXT NOT NULL DEFAULT '',
    template_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    created_by UUID REFERENCES public.saas_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_work_orders_tenant ON public.saas_work_orders (tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_saas_work_orders_user ON public.saas_work_orders (assigned_user_id, status, updated_at DESC);

ALTER TABLE public.saas_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_work_orders ENABLE ROW LEVEL SECURITY;
