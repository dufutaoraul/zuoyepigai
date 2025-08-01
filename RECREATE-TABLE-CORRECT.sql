-- 完全重建assignments表，使用正确的原始天数格式
-- 1. 删除现有表
DROP TABLE IF EXISTS assignments CASCADE;

-- 2. 重新创建表，使用正确的字段
CREATE TABLE assignments (
  assignment_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  day_text TEXT,  -- 存储原始格式如"第一周第一天"
  assignment_title TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT FALSE,
  description TEXT,
  assignment_category TEXT DEFAULT 'Regular_Optional',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX idx_assignments_day_text ON assignments(day_text);
CREATE INDEX idx_assignments_mandatory ON assignments(is_mandatory);
CREATE INDEX idx_assignments_category ON assignments(assignment_category);