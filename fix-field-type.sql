-- 修复 attachments_url 字段类型
-- 在Supabase SQL Editor中执行

-- 1. 检查当前字段类型
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
    AND column_name = 'attachments_url';

-- 2. 如果字段类型是TEXT[]，转换为JSONB类型
-- 首先备份现有数据
DO $$
BEGIN
    -- 检查字段是否存在且类型不对
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
            AND column_name = 'attachments_url' 
            AND data_type = 'ARRAY'
    ) THEN
        -- 删除旧字段，添加新的JSONB字段
        ALTER TABLE submissions DROP COLUMN IF EXISTS attachments_url;
        ALTER TABLE submissions ADD COLUMN attachments_url JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- 如果字段不存在，创建JSONB类型字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
            AND column_name = 'attachments_url'
    ) THEN
        ALTER TABLE submissions ADD COLUMN attachments_url JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. 验证修复结果
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
    AND column_name = 'attachments_url';