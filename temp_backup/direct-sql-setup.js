// 直接使用SQL创建表格和导入数据
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// 配置信息
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`SQL执行失败: ${response.status} - ${errorText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('SQL执行异常:', error.message);
    return false;
  }
}

async function createTablesDirectly() {
  console.log('🏗️  直接创建数据库表格...');
  
  // 先尝试删除现有表格（如果存在）
  console.log('🗑️  清理现有表格...');
  await executeSQL('DROP TABLE IF EXISTS submissions CASCADE;');
  await executeSQL('DROP TABLE IF EXISTS assignments CASCADE;');
  await executeSQL('DROP TABLE IF EXISTS students CASCADE;');
  
  // 创建学员表
  console.log('📋 创建students表...');
  const studentsSQL = `
    CREATE TABLE students (
      student_id VARCHAR(20) PRIMARY KEY,
      student_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  const studentsCreated = await executeSQL(studentsSQL);
  if (studentsCreated) {
    console.log('✅ Students表创建成功');
  }
  
  // 创建作业表
  console.log('📚 创建assignments表...');
  const assignmentsSQL = `
    CREATE TABLE assignments (
      assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      day_number INTEGER NOT NULL,
      assignment_title VARCHAR(200) NOT NULL,
      is_mandatory BOOLEAN NOT NULL DEFAULT true,
      description TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  const assignmentsCreated = await executeSQL(assignmentsSQL);
  if (assignmentsCreated) {
    console.log('✅ Assignments表创建成功');
  }
  
  // 创建提交表
  console.log('📝 创建submissions表...');
  const submissionsSQL = `
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
  `;
  
  const submissionsCreated = await executeSQL(submissionsSQL);
  if (submissionsCreated) {
    console.log('✅ Submissions表创建成功');
  }
  
  // 创建索引
  console.log('🔍 创建索引...');
  await executeSQL('CREATE INDEX IF NOT EXISTS idx_assignments_day_number ON assignments(day_number);');
  await executeSQL('CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);');
  
  return studentsCreated && assignmentsCreated && submissionsCreated;
}

async function insertAssignmentsDirectly() {
  console.log('📚 插入作业数据...');
  
  const assignments = [
    { day: 1, title: 'AI工具使用基础', mandatory: true, desc: '学习和掌握基本的AI工具使用方法。要求：1. 了解主流AI工具；2. 完成基础操作练习；3. 提交使用心得。' },
    { day: 1, title: 'AI创作实践', mandatory: false, desc: '使用AI工具进行创作练习。要求：1. 选择一个AI创作工具；2. 完成一个小作品；3. 分享创作过程。' },
    { day: 2, title: 'AI与商业应用', mandatory: true, desc: '了解AI在商业领域的应用案例。要求：1. 研究一个AI商业案例；2. 分析应用效果；3. 提出改进建议。' },
    { day: 2, title: 'AI工具比较分析', mandatory: false, desc: '比较不同AI工具的特点和适用场景。要求：1. 选择2-3个同类AI工具；2. 对比分析优劣；3. 给出使用建议。' },
    { day: 3, title: 'AI创富项目策划', mandatory: true, desc: '设计一个基于AI的创富项目。要求：1. 明确项目目标；2. 制定实施计划；3. 分析可行性和风险。' }
  ];
  
  for (const assignment of assignments) {
    const sql = `
      INSERT INTO assignments (day_number, assignment_title, is_mandatory, description) 
      VALUES (${assignment.day}, '${assignment.title.replace(/'/g, "''")}', ${assignment.mandatory}, '${assignment.desc.replace(/'/g, "''")}');
    `;
    
    const success = await executeSQL(sql);
    if (success) {
      console.log(`✅ 插入作业: ${assignment.title}`);
    } else {
      console.log(`❌ 插入失败: ${assignment.title}`);
    }
  }
}

async function importStudentsDirectly() {
  console.log('📖 读取并导入学员数据...');
  
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
      const studentId = row['学号'] ? String(row['学号']).trim() : null;
      const studentName = row['姓名'] ? String(row['姓名']).trim() : null;
      
      if (studentId && studentName) {
        students.push({
          id: studentId,
          name: studentName.replace(/'/g, "''") // 转义单引号
        });
      }
    }
    
    console.log(`✅ 处理后有效学员数据: ${students.length} 条`);
    console.log('🔍 前5条数据预览:');
    students.slice(0, 5).forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.id} → ${student.name}`);
    });
    
    // 批量插入学员数据
    console.log('\n📤 开始批量插入学员数据...');
    
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(students.length / batchSize);
      
      console.log(`📥 插入第 ${batchNum}/${totalBatches} 批数据 (${batch.length} 条)...`);
      
      // 构建批量插入SQL
      const values = batch.map(student => 
        `('${student.id}', '${student.name}')`
      ).join(', ');
      
      const batchSQL = `
        INSERT INTO students (student_id, student_name) 
        VALUES ${values};
      `;
      
      const success = await executeSQL(batchSQL);
      if (success) {
        successCount += batch.length;
        console.log(`✅ 第 ${batchNum} 批数据插入成功`);
      } else {
        console.log(`⚠️  第 ${batchNum} 批数据插入失败，尝试逐条插入...`);
        
        // 逐条插入
        for (const student of batch) {
          const singleSQL = `INSERT INTO students (student_id, student_name) VALUES ('${student.id}', '${student.name}');`;
          const singleSuccess = await executeSQL(singleSQL);
          if (singleSuccess) {
            successCount++;
          }
        }
      }
      
      // 添加延迟
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n🎉 学员数据插入完成！`);
    console.log(`✅ 成功插入: ${successCount} 条`);
    console.log(`📊 成功率: ${((successCount / students.length) * 100).toFixed(1)}%`);
    
    return successCount;
  } catch (error) {
    console.error('❌ 导入学员数据失败:', error.message);
    return 0;
  }
}

async function testFunctionality() {
  console.log('\n🧪 测试功能...');
  
  try {
    // 测试查询学员数据
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(3);
    
    if (studentsError) {
      console.log('❌ 查询学员失败:', studentsError.message);
      return;
    }
    
    console.log('📋 测试学员数据:');
    students.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.student_id} → ${student.student_name}`);
    });
    
    // 测试学号查询功能
    if (students.length > 0) {
      const testId = students[0].student_id;
      const { data: nameResult, error: nameError } = await supabase
        .from('students')
        .select('student_name')
        .eq('student_id', testId)
        .single();
      
      if (nameError) {
        console.log('❌ 学号查询失败:', nameError.message);
      } else {
        console.log(`✅ 学号查询测试成功: ${testId} → ${nameResult.student_name}`);
      }
    }
    
    // 测试作业数据
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(3);
    
    if (assignmentsError) {
      console.log('❌ 查询作业失败:', assignmentsError.message);
    } else {
      console.log(`📚 作业数据: ${assignments.length} 条`);
    }
    
    // 获取总数
    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 学员总数: ${count}`);
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

async function main() {
  console.log('🚀 开始直接数据库设置...\n');
  
  // 1. 创建表格
  const tablesCreated = await createTablesDirectly();
  if (!tablesCreated) {
    console.log('❌ 表格创建失败');
    return;
  }
  
  // 2. 插入作业数据
  await insertAssignmentsDirectly();
  
  // 3. 导入学员数据
  const importedCount = await importStudentsDirectly();
  if (importedCount === 0) {
    console.log('❌ 学员数据导入失败');
    return;
  }
  
  // 4. 测试功能
  await testFunctionality();
  
  console.log('\n🎉 数据库设置完成！');
  console.log('\n📋 现在您可以：');
  console.log('1. 访问您的网站');
  console.log('2. 测试学号输入功能');
  console.log('3. 验证姓名自动显示');
  console.log('\n🔍 建议测试的学号:');
  console.log('- AXCF2025010001 (Mike)');
  console.log('- AXCF2025010002 (缘起)');
  console.log('- AXCF2025010003 (兔子)');
}

main().catch(console.error);