-- 🐃 SHIVAJI MILK CENTER - ANIMALS INSERT QUERY
-- Supabase SQL Editor me paste karke RUN karein:

INSERT INTO public.animals (
  id,
  tag_no,
  name,
  type,
  breed,
  gender,
  origin,
  dob,
  purchase_date,
  purchase_price,
  mother_tag,
  weight,
  daily_capacity,
  status,
  lactation_no,
  photo,
  notes
) VALUES
('ANM-4708', 'SJKF_2023_CWS_019_KSHIPRA', 'KSHIPRA', 'buffalo', 'Murrah (मुर्राह)', 'female', 'own', '2022-01-01', NULL, 0, 'CWS0015', 450, 0, 'heifer', 1, '/images/murrah_buffalo_1.jpg', 'KAALI CHOTI'),
('ANM-2616', 'SJKF_2024_CWS_016_NARMADA', 'NARMADA(LAL KEDI)', 'buffalo', 'Murrah (मुर्राह)', 'female', 'own', '2024-01-01', NULL, 0, 'GIR CWS0014', 450, 0, 'pregnant', 1, '/images/murrah_buffalo_1.jpg', 'LAL KHEDI'),
('ANM-9996', 'SJKF_2021_CWS_015_PARWATI', 'PARWATI', 'cow', 'Gir (गीर)', 'female', 'own', '2021-01-01', NULL, 0, 'GHAR KI', 450, 14, 'milking', 1, 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80', 'KALI SABSE BADI GAY GHAR KI'),
('ANM-9237', 'SJKF_2020_CWS_014_GANGA', 'GANGA', 'cow', 'Gir (गीर)', 'female', 'own', '2020-01-01', NULL, 0, '', 450, 14, 'milking', 1, 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=600&q=80', 'GHAR KI SABSE BADI LAL'),
('ANM-2125', 'SJKF_2024_BHS_013_RUKHMA', 'RUKHMA', 'buffalo', 'Murrah (मुर्राह)', 'female', 'own', '2024-10-23', NULL, 0, 'NO', 450, 10, 'milking', 1, '/images/murrah_buffalo_1.jpg', 'GHAR KI PADI'),
('ANM-3692', 'SJKF_2024_BHS_012_RADHA', 'RADHA', 'buffalo', 'Murrah (मुर्राह)', 'female', 'own', '2025-07-22', NULL, 0, 'AMBA KI PADI', 450, 10, 'milking', 1, '/images/murrah_buffalo_1.jpg', 'GHAKI'),
('ANM-2219', 'SJKF_2025_BHB_011_BANNI', 'BANNI ', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2025-04-01', 165000, '', 450, 10, 'milking', 2, '/images/murrah_buffalo_1.jpg', 'CHANDAN DA WALI'),
('ANM-1652', 'SJKF_2025_BHB_010_KAJAL', 'JAGDISH(TEEN ANCHALI)', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2025-04-01', 95000, '', 450, 10, 'milking', 3, '/images/murrah_buffalo_1.jpg', 'TEEN ANCHALI'),
('ANM-6563', 'SJKF_2025_BHB_009_WASUNDHARA', 'VASHUNDHARA(JAGDISH)', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2025-07-05', 100000, '', 450, 10, 'dry', 2, '/images/murrah_buffalo_2.jpg', 'JAGDISH DA WALI'),
('ANM-5434', 'SJKF_2025_BHB_008_PAYAL', 'PAYAL(RAKESH RAJPUT)', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2025-07-14', 201000, '', 450, 18, 'pregnant', 2, '/images/murrah_buffalo_1.jpg', 'RAKESH RAJPUT'),
('ANM-0817', 'SJKF_2025_BHB_007_RANI', 'RANI', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2025-04-01', 140000, '', 450, 14, 'milking', 2, '/images/murrah_buffalo_1.jpg', 'CHANDAN  DA WALI'),
('ANM-2371', 'SJKF_2025_BHB_006_CHAMELI', 'CHAMELI(DACTORNI)CHANDAN DA WALI', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2025-03-01', 115000, '', 450, 12, 'milking', 2, '/images/murrah_buffalo_2.jpg', 'CHANDAN DA WALI'),
('ANM-1783', 'SJKF_2025_BHB_005_LAXMI', 'LAXMI(SHERUDA WALI)', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2025-04-19', 110000, '', 450, 14, 'milking', 3, '/images/murrah_buffalo_1.jpg', 'SHERU DA WALI'),
('ANM-3500', 'SJKF_2025_BHB_004_KAMLA', 'KAMLA(CHANDAN DA WALI)', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2026-07-04', 110000, '', 450, 10, 'dry', 1, '/images/murrah_buffalo_2.jpg', 'BECH DEE'),
('ANM-7224', 'SJKF_2024_BHB_003_AAMBA', 'AAMBA', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2025-04-01', 111000, '', 450, 10, 'milking', 2, '/images/murrah_buffalo_2.jpg', 'AAMBA'),
('ANM-8080', 'SJKF_2024_BHB_002_CHANDRAMUKHI', 'CHANDRAMUKHI', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2026-07-01', 95000, '', 450, 8, 'milking', 1, '/images/murrah_buffalo_2.jpg', 'BECH DI'),
('ANM-8440', 'SJKF_2024_BHB_001_GOURI', 'GOURI(GHATIYA WALI)', 'buffalo', 'Murrah (मुर्राह)', 'female', 'purchased', '2022-01-01', '2024-07-01', 98500, '', 450, 5, 'dry', 3, 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80', 'GHATIYA GHOSLA WALI')
ON CONFLICT (id) DO UPDATE SET
  tag_no = EXCLUDED.tag_no,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  breed = EXCLUDED.breed,
  gender = EXCLUDED.gender,
  origin = EXCLUDED.origin,
  dob = EXCLUDED.dob,
  purchase_date = EXCLUDED.purchase_date,
  purchase_price = EXCLUDED.purchase_price,
  mother_tag = EXCLUDED.mother_tag,
  weight = EXCLUDED.weight,
  daily_capacity = EXCLUDED.daily_capacity,
  status = EXCLUDED.status,
  lactation_no = EXCLUDED.lactation_no,
  photo = EXCLUDED.photo,
  notes = EXCLUDED.notes;

-- Check total count after insert:
SELECT COUNT(*) AS total_animals FROM public.animals;
