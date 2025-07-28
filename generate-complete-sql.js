// 生成包含所有学员数据的完整SQL文件
const XLSX = require('xlsx');
const fs = require('fs');

function generateCompleteSQL() {
  console.log('📖 读取Excel文件生成完整SQL...');
  
  try {
    // 读取Excel文件
    const workbook = XLSX.readFile('爱学AI创富营学员名单汇总总表.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Excel中共有 ${jsonData.length} 行数据`);
    
    // 处理学员数据
    const students = [];
    for (const row of jsonData) {
      let studentId = row['学号'] ? String(row['学号']).trim() : null;
      let studentName = row['姓名'] ? String(row['姓名']).trim() : null;
      
      if (studentId && studentName) {
        // 转义SQL中的单引号
        studentName = studentName.replace(/'/g, "''");
        students.push({
          id: studentId,
          name: studentName
        });
      }
    }
    
    console.log(`✅ 处理后有效学员数据: ${students.length} 条`);
    
    // 生成完整的SQL文件
    let sqlContent = `-- 🚀 爱学AI创富营数据库完整设置SQL
-- 复制此文件全部内容到Supabase SQL Editor并执行
-- 一次性完成所有表格创建和 ${students.length} 个学员数据导入

-- 1. 创建学员名单表
CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(20) PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建作业清单表
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  assignment_title VARCHAR(200) NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建作业提交审核表
CREATE TABLE IF NOT EXISTS submissions (
  submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments_url JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT '批改中' CHECK (status IN ('批改中', '合格', '不合格')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_assignments_day_number ON assignments(day_number);
CREATE INDEX IF NOT EXISTS idx_assignments_mandatory ON assignments(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 5. 插入AI创富营作业数据
INSERT INTO assignments (day_number, assignment_title, is_mandatory, description) VALUES
(1, 'AI工具使用基础', true, '学习和掌握基本的AI工具使用方法。要求：1. 了解主流AI工具；2. 完成基础操作练习；3. 提交使用心得。'),
(1, 'AI创作实践', false, '使用AI工具进行创作练习。要求：1. 选择一个AI创作工具；2. 完成一个小作品；3. 分享创作过程。'),
(2, 'AI与商业应用', true, '了解AI在商业领域的应用案例。要求：1. 研究一个AI商业案例；2. 分析应用效果；3. 提出改进建议。'),
(2, 'AI工具比较分析', false, '比较不同AI工具的特点和适用场景。要求：1. 选择2-3个同类AI工具；2. 对比分析优劣；3. 给出使用建议。'),
(3, 'AI创富项目策划', true, '设计一个基于AI的创富项目。要求：1. 明确项目目标；2. 制定实施计划；3. 分析可行性和风险。'),
(4, 'AI创富项目实施', true, '开始实施AI创富项目。要求：1. 按计划执行项目；2. 记录实施过程；3. 及时调整策略。'),
(5, 'AI创富项目总结', true, '完成AI创富项目总结。要求：1. 分析项目成果；2. 总结经验教训；3. 制定后续计划。');

-- 6. 批量插入所有 ${students.length} 个学员数据
INSERT INTO students (student_id, student_name) VALUES
`;

    // 生成所有学员的INSERT语句
    const insertValues = students.map(student => 
      `('${student.id}', '${student.name}')`
    ).join(',\n');
    
    sqlContent += insertValues + ';\n\n';
    sqlContent += `-- ✅ 设置完成！\n`;
    sqlContent += `-- 共创建 3 个表格，插入 7 条作业数据，插入 ${students.length} 个学员数据\n`;
    sqlContent += `-- 执行成功后会显示: "Success. No rows returned"\n\n`;
    sqlContent += `-- 🧪 验证数据的查询语句:\n`;
    sqlContent += `-- SELECT COUNT(*) FROM students; -- 应该显示 ${students.length}\n`;
    sqlContent += `-- SELECT COUNT(*) FROM assignments; -- 应该显示 7\n`;
    sqlContent += `-- SELECT * FROM students LIMIT 5; -- 查看前5个学员\n`;
    
    // 写入文件
    fs.writeFileSync('COMPLETE-DATABASE-SETUP.sql', sqlContent, 'utf8');
    
    console.log('✅ 生成完整SQL文件: COMPLETE-DATABASE-SETUP.sql');
    console.log(`📊 包含 ${students.length} 个学员数据`);
    console.log('🔍 前10个学员预览:');
    students.slice(0, 10).forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.id} → ${student.name}`);
    });
    
    return sqlContent;
    
  } catch (error) {
    console.error('❌ 生成SQL失败:', error.message);
    return null;
  }
}

// 执行生成
generateCompleteSQL();