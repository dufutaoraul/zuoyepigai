-- 最终修复submissions表字段顺序和重复问题
-- 2025-01-30 执行完成

-- 问题：
-- 1. 学号字段重复（学号 和 student_id）
-- 2. 字段顺序不符合要求

-- 解决方案：
-- 1. 重新创建表，按正确顺序排列字段
-- 2. 去除重复的学号字段，只保留一个"学号"字段
-- 3. 业务字段在前，系统字段在后

-- 最终字段顺序：
-- 1. 学号 (text)
-- 2. 姓名 (text) 
-- 3. 第几天 (text)
-- 4. 具体作业 (text)
-- 5. 必做/选做 (text)
-- 6. 作业详细要求 (text)
-- 7. 学员提交的作业 (jsonb)
-- 8. AI的作业评估 (text)
-- 9. 毕业合格统计 (text)
-- 10. submission_id (uuid, 主键)
-- 11. assignment_id (uuid)
-- 12. submission_date (timestamptz)
-- 13. created_at (timestamptz)
-- 14. attachments_url (text[])
-- 15. status (text)
-- 16. feedback (text)

-- 修复结果：
-- ✅ 字段顺序完全正确
-- ✅ 去除重复学号字段
-- ✅ 数据完整迁移（15条记录）
-- ✅ 保持应用兼容性
-- ✅ 创建同步触发器

-- 执行时间：2025-01-30
-- 状态：修复完成