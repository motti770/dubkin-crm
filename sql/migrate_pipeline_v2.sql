-- ============================================================
-- Migration v2 — עדכון פיפליין לשירות מתמשך (MRR)
-- תאריך: 2026-02-21
-- ============================================================

BEGIN;

-- 1. הוספת שלבים חדשים
INSERT INTO pipeline_stages (name, display_name, position, color) VALUES
  ('filtering',  'סינון',         2, '#EF4444'),
  ('demo',       'הדגמה',         3, '#F59E0B'),
  ('onboarding', 'Onboarding',    4, '#3B82F6'),
  ('renewal',    'חידוש / Upsell',6, '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- 2. עדכון השלב הקיים "lead" → ליד (שלב 1)
UPDATE pipeline_stages SET display_name = 'ליד', position = 1, color = '#6B7280'
WHERE name = 'lead';

-- 3. עדכון שלב "active" → שלב 5
UPDATE pipeline_stages SET position = 5
WHERE name = 'active';

-- 4. עדכון שלב "archive" → שלב 7
UPDATE pipeline_stages SET position = 7
WHERE name = 'archive';

-- 5. העברת deals מהשלבים הישנים לשלב "lead" לפני מחיקה
UPDATE deals SET stage_id = (SELECT id FROM pipeline_stages WHERE name = 'lead')
WHERE stage_id IN (
  SELECT id FROM pipeline_stages WHERE name IN ('discovery', 'pricing', 'closing')
);

-- 6. מחיקת שלבים ישנים שאינם רלוונטיים
DELETE FROM pipeline_stages WHERE name IN ('discovery', 'pricing', 'closing');

-- 7. הוספת שדה plan_type לטבלת deals
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'managed'
    CHECK (plan_type IN ('managed', 'self'));

-- 8. הוספת שדה lead_source לטבלת deals
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100);

-- תוצאה
SELECT name, display_name, position, color FROM pipeline_stages ORDER BY position;

COMMIT;
