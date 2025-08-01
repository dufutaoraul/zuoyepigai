-- 为submissions表添加作业统计字段
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS assignment_evaluation_detail TEXT,
ADD COLUMN IF NOT EXISTS assignment_comprehensive_statistics TEXT;

-- 添加字段注释
COMMENT ON COLUMN submissions.assignment_evaluation_detail IS '作业评估详情，格式：第一周第一天 - 三项全能作品集 - 必做 - 合格';
COMMENT ON COLUMN submissions.assignment_comprehensive_statistics IS '作业综合统计情况，包含该学员所有合格作业的汇总记录';