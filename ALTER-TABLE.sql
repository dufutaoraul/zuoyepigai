-- 修改assignments表结构 - 使用原始天数格式
-- 1. 添加新的day_text字段存储原始格式
ALTER TABLE assignments ADD COLUMN day_text TEXT;

-- 2. 删除旧的day_number字段（如果需要的话）
-- ALTER TABLE assignments DROP COLUMN day_number;

-- 3. 添加assignment_category字段（如果还没有的话）
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_category TEXT DEFAULT 'Regular_Optional';