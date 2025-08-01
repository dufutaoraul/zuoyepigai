-- 检查students表的实际字段结构
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;