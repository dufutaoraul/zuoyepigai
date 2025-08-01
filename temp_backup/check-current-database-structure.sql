-- 检查当前数据库中的表结构
-- 请在Supabase SQL Editor中执行此查询来查看实际的表结构

-- 1. 检查assignments表的字段
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- 2. 检查submissions表的字段
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- 3. 查看assignments表的前几条数据
SELECT * FROM assignments LIMIT 3;

-- 4. 查看submissions表的前几条数据
SELECT * FROM submissions LIMIT 3;