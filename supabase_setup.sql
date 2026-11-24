-- ==========================================================
-- DG TOWING LLC — Tablas exclusivas (No toca nada de URENA TAX)
-- Pega y ejecuta esto en Supabase -> SQL Editor -> New Query
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.dg_towing_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  customer_name TEXT DEFAULT 'Web Lead',
  customer_first_name TEXT DEFAULT '',
  customer_last_name TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  service_type TEXT DEFAULT 'Towing',
  vehicle TEXT NOT NULL,
  pickup TEXT NOT NULL,
  destination TEXT NOT NULL,
  miles NUMERIC DEFAULT 0,
  rate_per_mile NUMERIC DEFAULT 0,
  estimated_range TEXT DEFAULT '',
  extra_fee NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Pending',
  status TEXT DEFAULT 'Quote',
  notes TEXT DEFAULT ''
);

ALTER TABLE public.dg_towing_jobs ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT '';
ALTER TABLE public.dg_towing_jobs ADD COLUMN IF NOT EXISTS customer_first_name TEXT DEFAULT '';
ALTER TABLE public.dg_towing_jobs ADD COLUMN IF NOT EXISTS customer_last_name TEXT DEFAULT '';
ALTER TABLE public.dg_towing_jobs ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'Towing';
ALTER TABLE public.dg_towing_jobs ADD COLUMN IF NOT EXISTS rate_per_mile NUMERIC DEFAULT 0;

-- Activar Row Level Security (Seguridad)
ALTER TABLE public.dg_towing_jobs ENABLE ROW LEVEL SECURITY;

-- 1. Permitir que la web pública guarde nuevas cotizaciones (solo INSERT)
DROP POLICY IF EXISTS "Public can insert web quotes" ON public.dg_towing_jobs;
CREATE POLICY "Public can insert web quotes"
  ON public.dg_towing_jobs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status IN ('Quote', 'Pending', 'En Route', 'Completed', 'Cancelled'));

-- 2. Solo el usuario autenticado (Dariel/Admin) puede ver, editar o borrar trabajos
DROP POLICY IF EXISTS "Authenticated users can view jobs" ON public.dg_towing_jobs;
CREATE POLICY "Authenticated users can view jobs"
  ON public.dg_towing_jobs
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update jobs" ON public.dg_towing_jobs;
CREATE POLICY "Authenticated users can update jobs"
  ON public.dg_towing_jobs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete jobs" ON public.dg_towing_jobs;
CREATE POLICY "Authenticated users can delete jobs"
  ON public.dg_towing_jobs
  FOR DELETE
  TO authenticated
  USING (true);

-- ==========================================================
-- TABLA DE LOGS DE ENVÍOS (Email & WhatsApp)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.dg_towing_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  template_type TEXT DEFAULT '',
  status TEXT DEFAULT 'Enviado',
  error_message TEXT DEFAULT ''
);

ALTER TABLE public.dg_towing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert web logs" ON public.dg_towing_logs;
CREATE POLICY "Public can insert web logs"
  ON public.dg_towing_logs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.dg_towing_logs;
CREATE POLICY "Authenticated users can view logs"
  ON public.dg_towing_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete logs" ON public.dg_towing_logs;
CREATE POLICY "Authenticated users can delete logs"
  ON public.dg_towing_logs FOR DELETE TO authenticated USING (true);

-- ==========================================================
-- TABLA DE CONFIGURACIÓN (Copia BCC, Alerta Web, Google Review)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.dg_towing_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  bcc_email TEXT DEFAULT '',
  notify_email TEXT DEFAULT 'info@dgtowingllc.com',
  google_review_url TEXT DEFAULT 'https://dgtowingllc.com',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.dg_towing_settings (id, bcc_email, notify_email, google_review_url)
VALUES (1, '', 'info@dgtowingllc.com', 'https://dgtowingllc.com')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.dg_towing_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.dg_towing_settings;
CREATE POLICY "Authenticated users can manage settings"
  ON public.dg_towing_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
