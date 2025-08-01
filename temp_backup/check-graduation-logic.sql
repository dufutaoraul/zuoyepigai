-- 检查现有的毕业合格统计数据和逻辑
SELECT 
    学号,
    姓名,
    具体作业,
    "AI的作业评估",
    毕业合格统计,
    CASE 
        WHEN 毕业合格统计 LIKE '%不合格%' THEN '不合格记录'
        ELSE '合格记录'
    END as 记录类型
FROM submissions 
WHERE 毕业合格统计 IS NOT NULL
ORDER BY 学号, 第几天
LIMIT 10;

-- 查看不合格记录的详细信息
SELECT DISTINCT 毕业合格统计 
FROM submissions 
WHERE 毕业合格统计 LIKE '%不合格%'
ORDER BY 毕业合格统计;