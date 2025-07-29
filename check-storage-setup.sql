-- 检查和创建Supabase存储bucket
-- 在Supabase SQL Editor中执行

-- 1. 创建assignments存储bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignments',
  'assignments', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 设置存储bucket权限策略
-- 允许所有用户上传文件
CREATE POLICY IF NOT EXISTS "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'assignments');

-- 允许所有用户查看文件
CREATE POLICY IF NOT EXISTS "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'assignments');

-- 3. 验证bucket是否存在
SELECT * FROM storage.buckets WHERE id = 'assignments';