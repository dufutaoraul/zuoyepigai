-- 检查原submissions表的实际字段结构
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- 查看前几条数据，确认字段名
SELECT * FROM submissions LIMIT 2;