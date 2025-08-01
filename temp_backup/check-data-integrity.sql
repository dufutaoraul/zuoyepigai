-- 检查数据完整性和可能的问题
-- 在Supabase SQL Editor中执行

-- 1. 检查students表是否有数据
SELECT COUNT(*) as student_count FROM students;
SELECT student_id, student_name FROM students LIMIT 5;

-- 2. 检查assignments表是否有数据
SELECT COUNT(*) as assignment_count FROM assignments;
SELECT assignment_id, assignment_title FROM assignments LIMIT 5;

-- 3. 检查submissions表结构和数据
SELECT COUNT(*) as submission_count FROM submissions;
SELECT * FROM submissions ORDER BY created_at DESC LIMIT 3;

-- 4. 检查外键约束
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='submissions';

-- 5. 检查存储bucket
SELECT * FROM storage.buckets WHERE id = 'assignments';