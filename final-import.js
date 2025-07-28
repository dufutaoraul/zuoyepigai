// 最终学员数据导入脚本（假设表格已创建）
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
const supabaseClient = createClient(supabaseUrl, anonKey);

async function checkTables() {
  console.log('🔍 检查数据库表格...');
  
  try {
    const { data, error } = await supabaseClient
      .from('students')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ students表不存在，请先创建表格');
      return false;
    } else if (error) {
      console.log('⚠️  数据库连接问题:', error.message);
      return false;
    } else {
      console.log('✅ students表存在');
      return true;
    }
  } catch (error) {
    console.log('❌ 表格检查失败:', error.message);
    return false;
  }
}

async function importStudents() {
  console.log('📖 读取Excel学员数据...');
  
  try {
    const workbook = XLSX.readFile('爱学AI创富营学员名单汇总总表.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Excel中共有 ${jsonData.length} 行数据`);
    
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
    
    // 清理现有数据
    console.log('\n🧹 清理现有学员数据...');
    const { error: deleteError } = await supabaseAdmin
      .from('students')
      .delete()
      .neq('student_id', '');
    
    if (deleteError && deleteError.code !== '42P01') {
      console.log('⚠️  清理数据警告:', deleteError.message);
    }
    
    // 批量导入
    console.log('📤 开始批量导入学员数据...');
    
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
          console.log('🔄 尝试逐条导入...');
          
          for (const student of batch) {
            try {
              const { error: singleError } = await supabaseAdmin
                .from('students')
                .insert([student]);
              
              if (!singleError) {
                successCount++;
                if (successCount <= 10) {
                  console.log(`✅ ${student.student_id} → ${student.student_name}`);
                }
              } else {
                console.log(`❌ ${student.student_id} 失败: ${singleError.message}`);
              }
            } catch (e) {
              console.log(`❌ ${student.student_id} 异常`);
            }
          }
        } else {
          successCount += batch.length;
          console.log(`✅ 第 ${batchNum} 批数据导入成功`);
        }
      } catch (batchError) {
        console.log(`❌ 第 ${batchNum} 批数据导入异常: ${batchError.message}`);
      }
      
      // 延迟避免频率限制
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\n🎉 学员数据导入完成！`);
    console.log(`✅ 成功导入: ${successCount}/${students.length} 条`);
    console.log(`📊 成功率: ${((successCount / students.length) * 100).toFixed(1)}%`);
    
    return successCount;
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    return 0;
  }
}

async function testQueries() {
  console.log('\n🧪 测试学号查询功能...');
  
  try {
    // 获取总数
    const { count } = await supabaseClient
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 数据库中学员总数: ${count}`);
    
    // 获取测试数据
    const { data: testStudents, error } = await supabaseClient
      .from('students')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ 查询失败:', error.message);
      return;
    }
    
    if (testStudents && testStudents.length > 0) {
      console.log('📋 测试用学号和姓名:');
      testStudents.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.student_id} → ${student.student_name}`);
      });
      
      // 测试单个查询
      const testId = testStudents[0].student_id;
      const { data: result, error: queryError } = await supabaseClient
        .from('students')
        .select('student_name')
        .eq('student_id', testId)
        .single();
      
      if (queryError) {
        console.log('❌ 单个查询失败:', queryError.message);
      } else {
        console.log(`✅ 学号查询测试成功: ${testId} → ${result.student_name}`);
        console.log('🎉 网站学号输入功能将正常工作！');
      }
    }
  } catch (error) {
    console.log('❌ 测试异常:', error.message);
  }
}

async function main() {
  console.log('🚀 开始最终学员数据导入...\n');
  
  // 1. 检查表格
  const tablesExist = await checkTables();
  if (!tablesExist) {
    console.log('\n❌ 请先在Supabase控制台创建表格');
    console.log('1. 访问 https://supabase.com');
    console.log('2. 进入项目 zuoyepigai');
    console.log('3. 点击 SQL Editor');
    console.log('4. 执行建表SQL');
    return;
  }
  
  // 2. 导入学员数据
  const importedCount = await importStudents();
  if (importedCount === 0) {
    console.log('❌ 导入失败');
    return;
  }
  
  // 3. 测试功能
  await testQueries();
  
  console.log('\n🎉 任务完成！现在您可以：');
  console.log('1. 访问您的网站');
  console.log('2. 在作业提交页面输入学号');
  console.log('3. 验证姓名自动显示');
  
  console.log('\n🔍 建议测试的学号:');
  console.log('- AXCF2025010001 → Mike');
  console.log('- AXCF2025010002 → 缘起');
  console.log('- AXCF2025010003 → 兔子');
}

main().catch(console.error);