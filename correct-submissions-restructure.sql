-- 正确的submissions表重构脚本
-- 基于实际字段结构：学号、姓名等中文字段

BEGIN;

-- 1. 创建临时表保存现有数据
CREATE TABLE submissions_backup AS 
SELECT * FROM submissions;

-- 2. 删除原表
DROP TABLE submissions;

-- 3. 创建新的submissions表，按照要求的字段顺序
CREATE TABLE submissions (
    学号 TEXT NOT NULL,
    姓名 TEXT,
    第几天 TEXT,
    具体作业 TEXT,
    "必做/选做" TEXT,
    作业详细要求 TEXT,
    学员提交的作业 JSONB,
    "AI的作业评估" TEXT,
    毕业合格统计 TEXT,
    -- 保留系统字段
    submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID,
    submission_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 从备份表和students表关联插入数据，获取真实姓名
INSERT INTO submissions (
    学号,
    姓名,
    第几天,
    具体作业,
    "必做/选做",
    作业详细要求,
    学员提交的作业,
    "AI的作业评估",
    毕业合格统计,
    submission_id,
    assignment_id,
    submission_date,
    created_at
)
SELECT 
    sb.学号,
    COALESCE(s.name, sb.姓名) as 姓名,  -- 优先使用students表的真实姓名
    sb.第几天,
    sb.具体作业,
    sb.必做选做 as "必做/选做",
    sb.作业详细要求,
    sb.学员提交的作业,
    sb."ai的作业评估" as "AI的作业评估",
    sb.毕业合格统计,
    sb.submission_id,
    sb.assignment_id,
    sb.submission_date,
    sb.created_at
FROM submissions_backup sb
LEFT JOIN students s ON sb.学号 = s.student_id;

-- 5. 删除备份表
DROP TABLE submissions_backup;

-- 6. 创建索引提高查询性能
CREATE INDEX idx_submissions_student_id ON submissions(学号);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);

COMMIT;

-- 验证结果
SELECT 
    学号,
    姓名,
    第几天,
    具体作业,
    "必做/选做",
    作业详细要求,
    "AI的作业评估",
    毕业合格统计
FROM submissions 
ORDER BY 学号, 第几天
LIMIT 5;