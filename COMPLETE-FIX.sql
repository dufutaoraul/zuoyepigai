-- 完整的数据库修复SQL - 一次性执行
-- 1. 添加assignment_category字段
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_category TEXT DEFAULT 'Regular_Optional';

-- 2. 更新所有必做作业的分类
UPDATE assignments 
SET assignment_category = 'Mandatory' 
WHERE is_mandatory = true;

-- 3. 更新特殊的"第一周第二天下午"选做作业
UPDATE assignments 
SET assignment_category = 'W1D2_Afternoon_Optional' 
WHERE assignment_title IN ('AI能力坐标定位', '爱学一派逆向工程分析', 'AI工作流挑战赛', '四步冲刺挑战');

-- 4. 验证结果
SELECT 
  assignment_category,
  COUNT(*) as count,
  STRING_AGG(assignment_title, ', ') as examples
FROM assignments 
GROUP BY assignment_category;

-- 5. 检查特殊作业
SELECT assignment_title, is_mandatory, assignment_category 
FROM assignments 
WHERE assignment_category = 'W1D2_Afternoon_Optional';

-- 6. 统计概览
SELECT 
  '总作业数' as metric, COUNT(*)::text as value FROM assignments
UNION ALL
SELECT 
  '必做作业', COUNT(*)::text FROM assignments WHERE assignment_category = 'Mandatory'
UNION ALL
SELECT 
  '第一周第二天下午选做', COUNT(*)::text FROM assignments WHERE assignment_category = 'W1D2_Afternoon_Optional'
UNION ALL
SELECT 
  '其他选做', COUNT(*)::text FROM assignments WHERE assignment_category = 'Regular_Optional';