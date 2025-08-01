// 完整的数据库设置和学员数据导入脚本
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4';

const supabase = createClient(supabaseUrl, supabaseKey);

// 创建数据库表格
async function createTables() {
  console.log('🏗️  开始创建数据库表格...');
  
  try {
    // 创建学员表
    const { error: studentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS students (
          student_id VARCHAR(20) PRIMARY KEY,
          student_name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (studentsError) {
      console.log('⚠️  通过RPC创建表失败，尝试直接插入数据测试...');
    }

    // 测试表是否存在
    const { data: testData, error: testError } = await supabase
      .from('students')
      .select('count')
      .limit(1);

    if (testError && testError.code === '42P01') {
      console.error('❌ 数据库表格不存在，需要手动创建');
      console.log('\n📋 请按以下步骤操作：');
      console.log('1. 打开 https://supabase.com');
      console.log('2. 登录并进入项目 zuoyepigai');
      console.log('3. 点击 SQL Editor');
      console.log('4. 执行以下SQL代码：\n');
      
      console.log(`
-- 创建学员名单表
CREATE TABLE students (
  student_id VARCHAR(20) PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建作业清单表
CREATE TABLE assignments (
  assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  assignment_title VARCHAR(200) NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建作业提交审核表
CREATE TABLE submissions (
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

-- 创建索引
CREATE INDEX idx_assignments_day_number ON assignments(day_number);
CREATE INDEX idx_assignments_mandatory ON assignments(is_mandatory);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- 插入作业数据
INSERT INTO assignments (day_number, assignment_title, is_mandatory, description) VALUES
(1, 'AI工具使用基础', true, '学习和掌握基本的AI工具使用方法。要求：1. 了解主流AI工具；2. 完成基础操作练习；3. 提交使用心得。'),
(1, 'AI创作实践', false, '使用AI工具进行创作练习。要求：1. 选择一个AI创作工具；2. 完成一个小作品；3. 分享创作过程。'),
(2, 'AI与商业应用', true, '了解AI在商业领域的应用案例。要求：1. 研究一个AI商业案例；2. 分析应用效果；3. 提出改进建议。'),
(2, 'AI工具比较分析', false, '比较不同AI工具的特点和适用场景。要求：1. 选择2-3个同类AI工具；2. 对比分析优劣；3. 给出使用建议。'),
(3, 'AI创富项目策划', true, '设计一个基于AI的创富项目。要求：1. 明确项目目标；2. 制定实施计划；3. 分析可行性和风险。');
      `);
      
      return false;
    }

    console.log('✅ 数据库表格检查通过');
    return true;
  } catch (error) {
    console.error('❌ 创建表格失败:', error);
    return false;
  }
}

// 读取Excel文件
async function readExcelData() {
  console.log('📖 读取Excel学员数据...');
  
  try {
    const workbook = XLSX.readFile('爱学AI创富营学员名单汇总总表.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 读取到 ${jsonData.length} 条原始数据`);
    
    // 处理数据
    const students = [];
    for (const row of jsonData) {
      const studentId = row['学号'] ? String(row['学号']).trim() : null;
      const studentName = row['姓名'] ? String(row['姓名']).trim() : null;
      
      if (studentId && studentName && studentId !== '' && studentName !== '') {
        students.push({
          student_id: studentId,
          student_name: studentName
        });
      }
    }
    
    console.log(`✅ 处理后有效学员数据: ${students.length} 条`);
    return students;
  } catch (error) {
    console.error('❌ 读取Excel文件失败:', error);
    return [];
  }
}

// 导入学员数据
async function importStudents(students) {
  console.log('📤 开始导入学员数据...');
  
  try {
    // 清理现有数据
    console.log('🧹 清理现有数据...');
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .neq('student_id', '');
    
    // 批量插入数据
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      console.log(`📥 插入第 ${Math.floor(i/batchSize) + 1} 批数据 (${batch.length} 条)...`);
      
      const { data, error } = await supabase
        .from('students')
        .insert(batch);
      
      if (error) {
        console.log(`⚠️  批量插入失败，尝试逐条插入...`);
        
        // 逐条插入
        for (const student of batch) {
          try {
            const { error: singleError } = await supabase
              .from('students')
              .insert(student);
            
            if (!singleError) {
              successCount++;
              if (successCount <= 5) {
                console.log(`✅ 成功导入: ${student.student_id} → ${student.student_name}`);
              }
            } else {
              console.log(`❌ 导入失败: ${student.student_id} → ${singleError.message}`);
            }
          } catch (e) {
            console.log(`❌ 导入异常: ${student.student_id}`);
          }
        }
      } else {
        successCount += batch.length;
        console.log(`✅ 第 ${Math.floor(i/batchSize) + 1} 批数据导入成功`);
      }
      
      // 添加延迟避免频率限制
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`🎉 导入完成！成功导入 ${successCount} 条学员数据`);
    return successCount;
  } catch (error) {
    console.error('❌ 导入过程失败:', error);
    return 0;
  }
}

// 测试查询功能
async function testQueries() {
  console.log('🧪 测试学号查询功能...');
  
  try {
    // 获取前5个学员测试
    const { data: testStudents, error } = await supabase
      .from('students')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    if (!testStudents || testStudents.length === 0) {
      console.log('⚠️  没有找到学员数据');
      return;
    }
    
    console.log('📋 测试用学号和姓名:');
    testStudents.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.student_id} → ${student.student_name}`);
    });
    
    // 测试单个查询
    const testId = testStudents[0].student_id;
    const { data: result, error: queryError } = await supabase
      .from('students')
      .select('student_name')
      .eq('student_id', testId)
      .single();
    
    if (queryError) {
      console.error('❌ 单个查询测试失败:', queryError);
    } else {
      console.log(`✅ 查询测试成功: ${testId} → ${result.student_name}`);
    }
    
    // 获取总数
    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 数据库中学员总数: ${count}`);
    
  } catch (error) {
    console.error('❌ 测试查询失败:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始完整的数据库设置和数据导入流程...\n');
  
  // 1. 检查和创建表格
  const tablesReady = await createTables();
  if (!tablesReady) {
    console.log('\n❌ 请先在Supabase控制台手动创建表格，然后重新运行此脚本');
    return;
  }
  
  // 2. 读取Excel数据
  const students = await readExcelData();
  if (students.length === 0) {
    console.log('❌ 没有有效的学员数据');
    return;
  }
  
  // 3. 导入学员数据
  const importedCount = await importStudents(students);
  if (importedCount === 0) {
    console.log('❌ 学员数据导入失败');
    return;
  }
  
  // 4. 测试查询功能
  await testQueries();
  
  console.log('\n🎉 完整流程执行完成！');
  console.log('\n📋 现在您可以：');
  console.log('1. 访问您的网站测试学号查询功能');
  console.log('2. 使用测试学号验证姓名自动显示');
  console.log('3. 测试作业提交和查询功能');
  console.log('4. 测试毕业资格审核功能');
}

// 执行主函数
main().catch(console.error);