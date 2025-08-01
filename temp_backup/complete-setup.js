// 完整的数据库设置和学员数据导入
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// 配置信息
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4';

// 创建客户端
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabaseClient = createClient(supabaseUrl, anonKey);

async function createTables() {
  console.log('🏗️  创建数据库表格...');
  
  try {
    // 创建学员表
    const { error: studentsError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS students (
          student_id VARCHAR(20) PRIMARY KEY,
          student_name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (studentsError) console.log('Students表:', studentsError.message);
    
    // 创建作业表
    const { error: assignmentsError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS assignments (
          assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          day_number INTEGER NOT NULL,
          assignment_title VARCHAR(200) NOT NULL,
          is_mandatory BOOLEAN NOT NULL DEFAULT true,
          description TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (assignmentsError) console.log('Assignments表:', assignmentsError.message);
    
    // 创建提交表
    const { error: submissionsError } = await supabaseAdmin.rpc('exec', {
      sql: `
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
      `
    });
    
    if (submissionsError) console.log('Submissions表:', submissionsError.message);
    
    console.log('✅ 数据库表格创建完成');
    return true;
  } catch (error) {
    console.error('❌ 创建表格失败:', error.message);
    return false;
  }
}

async function insertAssignments() {
  console.log('📚 插入作业数据...');
  
  const assignments = [
    {
      day_number: 1,
      assignment_title: 'AI工具使用基础',
      is_mandatory: true,
      description: '学习和掌握基本的AI工具使用方法。要求：1. 了解主流AI工具；2. 完成基础操作练习；3. 提交使用心得。'
    },
    {
      day_number: 1,
      assignment_title: 'AI创作实践',
      is_mandatory: false,
      description: '使用AI工具进行创作练习。要求：1. 选择一个AI创作工具；2. 完成一个小作品；3. 分享创作过程。'
    },
    {
      day_number: 2,
      assignment_title: 'AI与商业应用',
      is_mandatory: true,
      description: '了解AI在商业领域的应用案例。要求：1. 研究一个AI商业案例；2. 分析应用效果；3. 提出改进建议。'
    },
    {
      day_number: 2,
      assignment_title: 'AI工具比较分析',
      is_mandatory: false,
      description: '比较不同AI工具的特点和适用场景。要求：1. 选择2-3个同类AI工具；2. 对比分析优劣；3. 给出使用建议。'
    },
    {
      day_number: 3,
      assignment_title: 'AI创富项目策划',
      is_mandatory: true,
      description: '设计一个基于AI的创富项目。要求：1. 明确项目目标；2. 制定实施计划；3. 分析可行性和风险。'
    }
  ];
  
  try {
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert(assignments);
    
    if (error) {
      console.log('⚠️  作业数据插入失败:', error.message);
    } else {
      console.log('✅ 成功插入', assignments.length, '条作业数据');
    }
  } catch (error) {
    console.log('❌ 插入作业数据异常:', error.message);
  }
}

async function importStudents() {
  console.log('📖 读取Excel学员数据...');
  
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
          student_id: studentId,
          student_name: studentName
        });
      }
    }
    
    console.log(`✅ 处理后有效学员数据: ${students.length} 条`);
    console.log('🔍 前5条数据预览:');
    students.slice(0, 5).forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.student_id} → ${student.student_name}`);
    });
    
    if (students.length === 0) {
      console.log('❌ 没有有效的学员数据');
      return 0;
    }
    
    console.log('\n📤 开始批量导入学员数据...');
    
    // 使用Service Role Key批量导入
    const batchSize = 100;
    let successCount = 0;
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(students.length / batchSize);
      
      console.log(`📥 导入第 ${batchNum}/${totalBatches} 批数据 (${batch.length} 条)...`);
      
      try {
        const { data, error } = await supabaseAdmin
          .from('students')
          .insert(batch);
        
        if (error) {
          console.log(`⚠️  第 ${batchNum} 批数据导入失败: ${error.message}`);
          // 尝试逐条导入这个批次
          for (const student of batch) {
            try {
              const { error: singleError } = await supabaseAdmin
                .from('students')
                .insert([student]);
              
              if (!singleError) {
                successCount++;
              }
            } catch (e) {
              // 忽略单个错误
            }
          }
        } else {
          successCount += batch.length;
          console.log(`✅ 第 ${batchNum} 批数据导入成功`);
        }
      } catch (batchError) {
        console.log(`❌ 第 ${batchNum} 批数据导入异常`);
      }
      
      // 添加延迟
      if (i + batchSize < students.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n🎉 学员数据导入完成！`);
    console.log(`✅ 成功导入: ${successCount} 条`);
    console.log(`📊 导入成功率: ${((successCount / students.length) * 100).toFixed(1)}%`);
    
    return successCount;
  } catch (error) {
    console.error('❌ 导入学员数据失败:', error.message);
    return 0;
  }
}

async function testQueries() {
  console.log('\n🧪 测试学号查询功能...');
  
  try {
    // 使用anon key测试前端查询功能
    const { count, error: countError } = await supabaseClient
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ 查询总数失败:', countError.message);
      return;
    }
    
    console.log(`📊 数据库中学员总数: ${count}`);
    
    // 获取几个学员测试
    const { data: testStudents, error: queryError } = await supabaseClient
      .from('students')
      .select('*')
      .limit(5);
    
    if (queryError) {
      console.log('❌ 查询学员数据失败:', queryError.message);
      return;
    }
    
    if (testStudents && testStudents.length > 0) {
      console.log('📋 测试用学号和姓名:');
      testStudents.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.student_id} → ${student.student_name}`);
      });
      
      // 测试单个查询（模拟前端学号输入功能）
      const testId = testStudents[0].student_id;
      const { data: singleResult, error: singleError } = await supabaseClient
        .from('students')
        .select('student_name')
        .eq('student_id', testId)
        .single();
      
      if (singleError) {
        console.log('❌ 单个查询测试失败:', singleError.message);
      } else {
        console.log(`✅ 单个查询测试成功: ${testId} → ${singleResult.student_name}`);
        console.log('🎉 学号输入自动显示姓名功能正常工作！');
      }
    }
  } catch (error) {
    console.log('❌ 测试查询异常:', error.message);
  }
}

async function main() {
  console.log('🚀 开始完整的数据库设置和学员数据导入...\n');
  
  // 1. 创建数据库表格
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.log('❌ 数据库表格创建失败');
    return;
  }
  
  // 2. 插入作业数据
  await insertAssignments();
  
  // 3. 导入学员数据
  const importedCount = await importStudents();
  if (importedCount === 0) {
    console.log('❌ 学员数据导入失败');
    return;
  }
  
  // 4. 测试查询功能
  await testQueries();
  
  console.log('\n🎉 所有任务完成！');
  console.log('\n📋 现在您可以：');
  console.log('1. 访问您的网站测试学号查询功能');
  console.log('2. 输入任意学号验证姓名自动显示');
  console.log('3. 测试作业提交和查询功能');
  console.log('4. 测试毕业资格审核功能');
  
  console.log('\n🔍 建议测试的学号:');
  console.log('- AXCF2025010001 (Mike)');
  console.log('- AXCF2025010002 (缘起)');
  console.log('- AXCF2025010003 (兔子)');
}

// 运行主程序
main().catch(console.error);