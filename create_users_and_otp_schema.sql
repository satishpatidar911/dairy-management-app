-- ====================================================================
-- 🥛 DAIRY FARM PRO: USER LOGIN & 2-FACTOR MOBILE OTP AUTHENTICATION SCHEMA
-- ====================================================================
-- इस SQL स्क्रिप्ट को अपने Supabase Dashboard > SQL Editor में पेस्ट करके 'RUN' करें।
-- ====================================================================

-- 1. ऐप यूजर्स टेबल (Owner, Manager, Worker Login Credentials)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id VARCHAR(50) UNIQUE NOT NULL,         -- यूजरनेम या लॉगिन आईडी (उदा. 'owner', 'manager')
    password VARCHAR(255) NOT NULL,              -- पासवर्ड या पिन (उदा. 'owner@123')
    full_name VARCHAR(100) NOT NULL,             -- पूरा नाम
    mobile VARCHAR(15) NOT NULL,                 -- मोबाइल नंबर (जिस पर OTP आएगा)
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'worker')), -- 'admin'=मालिक, 'manager'=मुनीम, 'worker'=ग्वाला
    is_active BOOLEAN DEFAULT TRUE,              -- एक्टिव स्टेटस
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. मोबाइल OTP वेरिफिकेशन टेबल (2-Step Verification)
CREATE TABLE IF NOT EXISTS public.user_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile VARCHAR(15) NOT NULL,                 -- जिस मोबाइल नंबर पर OTP भेजा गया
    otp_code VARCHAR(6) NOT NULL,                -- 6 अंकों का सुरक्षित OTP कोड
    expires_at TIMESTAMPTZ NOT NULL,             -- OTP की वैधता (5 मिनट)
    is_verified BOOLEAN DEFAULT FALSE,           -- क्या OTP इस्तेमाल हो चुका है
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) सक्षम करें एवं एक्सेस पॉलिसी बनाएं
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_otps ENABLE ROW LEVEL SECURITY;

-- पॉलिसी: सार्वजनिक / एनोनिमस यूजर लॉगिन चेक कर सकें
DROP POLICY IF EXISTS "Allow public read active app_users" ON public.app_users;
CREATE POLICY "Allow public read active app_users"
    ON public.app_users FOR SELECT
    USING (is_active = true);

-- पॉलिसी: यूजर OTP पढ़ और लिख सकें
DROP POLICY IF EXISTS "Allow public access user_otps" ON public.user_otps;
CREATE POLICY "Allow public access user_otps"
    ON public.user_otps FOR ALL
    USING (true)
    WITH CHECK (true);

-- ====================================================================
-- 4. डिफॉल्ट लॉगिन आईडी और पासवर्ड डालें (DEFAULT USERS INSERT)
-- ====================================================================

-- A) मालिक (OWNER / ADMIN)
INSERT INTO public.app_users (login_id, password, full_name, mobile, role, is_active)
VALUES (
    'owner',                    -- लॉगिन आईडी
    'owner@123',                -- पासवर्ड
    'सतीश पाटीदार (मालिक)',      -- नाम
    '8770234735',               -- मोबाइल नंबर (OTP के लिए)
    'admin',                    -- रोल (मालिक)
    true
)
ON CONFLICT (login_id) 
DO UPDATE SET 
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name,
    mobile = EXCLUDED.mobile,
    role = EXCLUDED.role;

-- B) मुनीम / मैनेजर (MANAGER / MUNIM)
INSERT INTO public.app_users (login_id, password, full_name, mobile, role, is_active)
VALUES (
    'manager',                  -- लॉगिन आईडी
    'manager@123',              -- पासवर्ड
    'मोहन लाल (मुनीम)',          -- नाम
    '9876543210',               -- मोबाइल नंबर
    'manager',                  -- रोल (मुनीम)
    true
)
ON CONFLICT (login_id) 
DO UPDATE SET 
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name,
    mobile = EXCLUDED.mobile,
    role = EXCLUDED.role;

-- C) ग्वाला / कर्मचारी (WORKER / GWALA)
INSERT INTO public.app_users (login_id, password, full_name, mobile, role, is_active)
VALUES (
    'worker',                   -- लॉगिन आईडी
    'worker@123',               -- पासवर्ड
    'राजू (ग्वाला)',            -- नाम
    '9876500000',               -- मोबाइल नंबर
    'worker',                   -- रोल (ग्वाला)
    true
)
ON CONFLICT (login_id) 
DO UPDATE SET 
    password = EXCLUDED.password,
    full_name = EXCLUDED.full_name,
    mobile = EXCLUDED.mobile,
    role = EXCLUDED.role;

-- जांच करने के लिए:
SELECT id, login_id, full_name, mobile, role, is_active FROM public.app_users;
