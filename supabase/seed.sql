-- ========================================================================
-- PRODUCTION DATABASE SEED SCRIPT (CLEAN PRODUCTION BASELINE)
-- Seeds only the base church organization structure without mock records.
-- ========================================================================

-- Insert baseline Church record
INSERT INTO public.churches (id, name, name_ar, location)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'St. Mark & St. George Coptic Orthodox Church',
    'كنيسة الشهيد العظيم مارمرقس والشهيد مارجرجس',
    'Diocese of Church Service'
)
ON CONFLICT (id) DO NOTHING;
