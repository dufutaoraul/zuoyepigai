-- 检查原submissions表中attachments_url字段的实际数据类型和内容
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'submissions' 
  AND column_name = 'attachments_url';

-- 查看实际数据内容和类型
SELECT 
  attachments_url,
  pg_typeof(attachments_url) as actual_type,
  jsonb_typeof(attachments_url) as jsonb_type
FROM submissions 
LIMIT 3;