-- 清理多余的备份表
DROP TABLE IF EXISTS submissions_backup;

-- 检查剩余的表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%submission%'
ORDER BY table_name;