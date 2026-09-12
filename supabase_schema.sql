-- ====================================================================
-- DAIRY FARMING MANAGEMENT SYSTEM — SUPABASE DATABASE SCHEMA
-- ====================================================================

-- 1. FARM PROFILE & BRANDING
CREATE TABLE IF NOT EXISTS public.farm_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    farm_name TEXT NOT NULL DEFAULT 'श्री कृष्णा डेयरी फार्म',
    owner_name TEXT NOT NULL DEFAULT 'सतीश कुमार',
    phone TEXT DEFAULT '9876543210',
    address TEXT DEFAULT 'ग्राम - रामपुर, जिला - जयपुर',
    tagline TEXT DEFAULT 'शुद्ध एवं ताजा दूध, स्वस्थ परिवार',
    upi_id TEXT DEFAULT 'dairyfarm@upi',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ANIMALS (CATTLE) TABLE
CREATE TABLE IF NOT EXISTS public.animals (
    id TEXT PRIMARY KEY,
    tag_no TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'cow', -- 'cow' | 'buffalo'
    breed TEXT,
    gender TEXT DEFAULT 'female',
    dob DATE,
    purchase_date DATE,
    purchase_price NUMERIC DEFAULT 0,
    weight NUMERIC DEFAULT 0,
    daily_capacity NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'milking', -- 'milking' | 'pregnant' | 'dry' | 'sick' | 'heifer'
    lactation_no INTEGER DEFAULT 1,
    last_calving_date DATE,
    photo TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS DIRECTORY
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    morning_qty NUMERIC DEFAULT 0,
    evening_qty NUMERIC DEFAULT 0,
    rate NUMERIC DEFAULT 60,
    milk_type TEXT DEFAULT 'mix',
    balance NUMERIC DEFAULT 0,
    advance NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active',
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMER TRANSACTIONS / KHATA LEDGER
CREATE TABLE IF NOT EXISTS public.customer_transactions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL, -- 'milk_supply' | 'payment_received'
    shift TEXT, -- 'morning' | 'evening'
    liters NUMERIC DEFAULT 0,
    rate NUMERIC DEFAULT 0,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_mode TEXT DEFAULT 'cash', -- 'cash' | 'upi' | 'bank'
    balance_after NUMERIC DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MILK PRODUCTION ENTRIES
CREATE TABLE IF NOT EXISTS public.milk_entries (
    id TEXT PRIMARY KEY,
    entry_mode TEXT DEFAULT 'animal_wise', -- 'animal_wise' | 'bulk_total'
    bulk_type TEXT, -- 'cow' | 'buffalo'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift TEXT NOT NULL DEFAULT 'morning', -- 'morning' | 'evening'
    animal_id TEXT,
    animal_name TEXT,
    animal_type TEXT,
    quantity NUMERIC NOT NULL DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    snf NUMERIC DEFAULT 0,
    rate NUMERIC DEFAULT 0,
    recorded_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMER MILK SALES (Google Sheets / Direct)
CREATE TABLE IF NOT EXISTS public.customer_sales (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift TEXT NOT NULL DEFAULT 'morning',
    quantity NUMERIC NOT NULL DEFAULT 0,
    rate NUMERIC DEFAULT 60,
    amount NUMERIC NOT NULL DEFAULT 0,
    source TEXT DEFAULT 'Google Sheets',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DAIRY PLANT WHOLESALE SALES (FAT + SNF Master)
CREATE TABLE IF NOT EXISTS public.dairy_sales (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift TEXT NOT NULL DEFAULT 'morning',
    dairy_name TEXT NOT NULL,
    milk_type TEXT DEFAULT 'buffalo',
    quantity NUMERIC NOT NULL DEFAULT 0,
    fat NUMERIC NOT NULL DEFAULT 0,
    snf NUMERIC NOT NULL DEFAULT 0,
    rate NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    slip_no TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RATE MASTER PRICING MATRIX CONFIG
CREATE TABLE IF NOT EXISTS public.rate_master_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    cow_base_fat NUMERIC DEFAULT 3.5,
    cow_base_snf NUMERIC DEFAULT 8.5,
    cow_base_rate NUMERIC DEFAULT 38.0,
    cow_fat_diff NUMERIC DEFAULT 0.40,
    cow_snf_diff NUMERIC DEFAULT 0.25,
    buffalo_base_fat NUMERIC DEFAULT 6.5,
    buffalo_base_snf NUMERIC DEFAULT 9.0,
    buffalo_base_rate NUMERIC DEFAULT 68.0,
    buffalo_fat_diff NUMERIC DEFAULT 0.65,
    buffalo_snf_diff NUMERIC DEFAULT 0.35,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'feed' | 'fodder' | 'medicine' | 'labor' | 'utility' | 'equipment' | 'other'
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payee TEXT,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FEED & FODDER INVENTORY
CREATE TABLE IF NOT EXISTS public.feed_stock (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stock_quantity NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    daily_usage NUMERIC DEFAULT 0,
    cost_per_unit NUMERIC DEFAULT 0,
    min_threshold NUMERIC DEFAULT 50,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. HEALTH & MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS public.health_records (
    id TEXT PRIMARY KEY,
    animal_id TEXT NOT NULL,
    animal_name TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    disease TEXT NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    doctor TEXT,
    cost NUMERIC DEFAULT 0,
    medicine TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. VACCINATIONS SCHEDULE
CREATE TABLE IF NOT EXISTS public.vaccinations (
    id TEXT PRIMARY KEY,
    vaccine_name TEXT NOT NULL,
    target TEXT DEFAULT 'all',
    next_due_date DATE NOT NULL,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. BREEDING & CALVING TRACKER
CREATE TABLE IF NOT EXISTS public.breeding_records (
    id TEXT PRIMARY KEY,
    animal_id TEXT NOT NULL,
    animal_name TEXT,
    ai_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bull_id TEXT,
    technician TEXT,
    expected_calving_date DATE,
    status TEXT DEFAULT 'inseminated', -- 'inseminated' | 'confirmed_pregnant' | 'calved' | 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & SET PERMISSIVE POLICIES
-- ====================================================================

DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename IN (
            'farm_profile', 'animals', 'customers', 'customer_transactions',
            'milk_entries', 'customer_sales', 'dairy_sales', 'rate_master_config',
            'expenses', 'feed_stock', 'health_records', 'vaccinations', 'breeding_records'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public Read All" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Public Read All" ON public.%I FOR SELECT USING (true);', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public Insert All" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Public Insert All" ON public.%I FOR INSERT WITH CHECK (true);', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public Update All" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Public Update All" ON public.%I FOR UPDATE USING (true);', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public Delete All" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Public Delete All" ON public.%I FOR DELETE USING (true);', tbl);
    END LOOP;
END $$;

-- Insert initial default farm_profile & rate_master_config
INSERT INTO public.farm_profile (id, farm_name, owner_name, phone, address, tagline, upi_id)
VALUES ('default', 'श्री कृष्णा डेयरी फार्म', 'सतीश कुमार', '9876543210', 'ग्राम - रामपुर, जिला - जयपुर', 'शुद्ध एवं ताजा दूध, स्वस्थ परिवार', 'dairyfarm@upi')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.rate_master_config (id, cow_base_fat, cow_base_snf, cow_base_rate, cow_fat_diff, cow_snf_diff, buffalo_base_fat, buffalo_base_snf, buffalo_base_rate, buffalo_fat_diff, buffalo_snf_diff)
VALUES ('default', 3.5, 8.5, 38.0, 0.40, 0.25, 6.5, 9.0, 68.0, 0.65, 0.35)
ON CONFLICT (id) DO NOTHING;
