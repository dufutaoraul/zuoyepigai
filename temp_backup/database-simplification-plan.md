# 数据库简化方案

## 📊 当前状况分析

### 现有6个表单：
1. **students** (基础表) - 260条记录 ✅
2. **assignments** (基础表) - 51条记录 ✅  
3. **submissions** (基础表) - 15条记录 ✅
4. **admin_submissions_view** (视图) ❌ 冗余
5. **assignments_progress_view** (视图) ❌ 冗余
6. **student_progress_view** (视图) ❌ 冗余

## 🎯 简化方案

### 保留的3个核心表：

#### 1. `students` - 学员名单表
```sql
字段：student_id, student_name, created_at, updated_at
用途：存储学员基本信息
数据：260个学员
```

#### 2. `assignments` - 作业清单表  
```sql
字段：assignment_id, day_number, assignment_title, is_mandatory, description, sort_order, created_at, updated_at
用途：存储作业定义和要求
数据：51个作业
```

#### 3. `submissions` - 作业提交审核总表
```sql
字段：submission_id, student_id, assignment_id, submission_date, status, feedback, attachments_url, created_at, updated_at
用途：存储提交记录和批改结果
数据：15条提交记录
```

### 删除的3个冗余视图：

#### ❌ `admin_submissions_view`
- **删除理由**：可用简单联表查询替代
- **替代方案**：
```sql
SELECT s.*, st.student_name, a.assignment_title, a.day_number
FROM submissions s 
LEFT JOIN students st ON s.student_id = st.student_id
LEFT JOIN assignments a ON s.assignment_id = a.assignment_id
ORDER BY s.submission_date DESC;
```

#### ❌ `assignments_progress_view` 
- **删除理由**：可用聚合查询替代
- **替代方案**：
```sql
SELECT a.*, 
       COUNT(s.submission_id) as total_submissions,
       COUNT(CASE WHEN s.status = '合格' THEN 1 END) as passed_submissions
FROM assignments a 
LEFT JOIN submissions s ON a.assignment_id = s.assignment_id
GROUP BY a.assignment_id
ORDER BY a.sort_order;
```

#### ❌ `student_progress_view`
- **删除理由**：可用聚合查询替代  
- **替代方案**：
```sql
SELECT st.*,
       COUNT(s.submission_id) as total_submissions,
       COUNT(CASE WHEN s.status = '合格' THEN 1 END) as passed_submissions
FROM students st
LEFT JOIN submissions s ON st.student_id = s.student_id  
GROUP BY st.student_id
ORDER BY MAX(s.submission_date) DESC;
```

## 🚀 执行计划

### 第1步：备份当前数据
```sql
-- 导出视图数据（如需要）
SELECT * FROM admin_submissions_view;
SELECT * FROM assignments_progress_view; 
SELECT * FROM student_progress_view;
```

### 第2步：删除冗余视图
```sql
DROP VIEW IF EXISTS admin_submissions_view;
DROP VIEW IF EXISTS assignments_progress_view;
DROP VIEW IF EXISTS student_progress_view;
```

### 第3步：验证核心表完整性
```sql
-- 检查3个核心表
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments  
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions;
```

## 💡 简化后的优势

1. **简洁明了**：只有3个核心表，结构清晰
2. **易于维护**：无需维护视图同步问题
3. **性能更好**：减少不必要的复杂查询  
4. **灵活查询**：可根据需要灵活组合联表查询
5. **降低复杂度**：新手更容易理解和使用

## 📋 常用查询示例

### 查看最新提交记录
```sql
SELECT s.submission_date, st.student_name, a.assignment_title, s.status
FROM submissions s
JOIN students st ON s.student_id = st.student_id  
JOIN assignments a ON s.assignment_id = a.assignment_id
ORDER BY s.submission_date DESC;
```

### 查看学员进度统计
```sql
SELECT st.student_name,
       COUNT(s.submission_id) as total_submissions,
       COUNT(CASE WHEN s.status = '合格' THEN 1 END) as passed_count
FROM students st
LEFT JOIN submissions s ON st.student_id = s.student_id
GROUP BY st.student_id, st.student_name;
```

### 查看作业完成情况
```sql  
SELECT a.assignment_title,
       COUNT(s.submission_id) as submission_count,
       COUNT(CASE WHEN s.status = '合格' THEN 1 END) as passed_count
FROM assignments a
LEFT JOIN submissions s ON a.assignment_id = s.assignment_id
GROUP BY a.assignment_id, a.assignment_title
ORDER BY a.sort_order;
```

---

**结论**：删除3个冗余视图，保留3个核心表，既满足业务需求又大大简化了数据库结构。