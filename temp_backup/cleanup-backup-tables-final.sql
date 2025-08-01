-- 清理多余的备份表
-- 删除在修复过程中创建的备份表

BEGIN;

-- 1. 检查现有的备份表
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%backup%'
ORDER BY table_name;

-- 2. 删除毕业统计修复时创建的备份表
DROP TABLE IF EXISTS submissions_backup_graduation;

-- 3. 删除其他可能的备份表（如果存在）
DROP TABLE IF EXISTS submissions_backup;
DROP TABLE IF EXISTS submissions_temp;
DROP TABLE IF EXISTS submissions_old;

-- 4. 验证清理结果
SELECT 
    '清理完成' as 状态,
    COUNT(*) as 剩余表数量
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%backup%';

-- 5. 显示当前的表结构
SELECT 
    table_name as 表名,
    table_type as 类型
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

COMMIT;