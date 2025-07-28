// 直接导入学员数据（假设表格已存在）
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAndCreateSchema() {
  console.log('🔍 检查数据库状态...');
  
  try {
    // 首先尝试查询现有表
    const { data, error } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('⚠️  表格不存在，尝试创建简单测试表...');
      
      // 尝试创建一个简单的学员表
      const createSQL = `
        CREATE TABLE IF NOT EXISTS students (
          student_id TEXT PRIMARY KEY,
          student_name TEXT NOT NULL
        );
      `;
      
      // 通过PostgreSQL REST API执行SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: createSQL })
      });
      
      if (response.ok) {
        console.log('✅ 表格创建成功');
        return true;
      } else {
        console.log('❌ 表格创建失败，状态码:', response.status);
        const errorText = await response.text();
        console.log('错误信息:', errorText);
        return false;
      }
    } else if (error) {
      console.log('❌ 数据库连接错误:', error.message);
      return false;
    } else {
      console.log('✅ 表格已存在');
      return true;
    }
  } catch (err) {
    console.log('❌ 检查失败:', err.message);
    return false;
  }
}

async function importStudentsData() {
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
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
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
    
    // 开始导入数据
    console.log('\n📤 开始导入学员数据到Supabase...');
    
    // 清理现有数据
    console.log('🧹 清理现有数据...');
    try {
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .neq('student_id', '');
      
      if (deleteError && deleteError.code !== '42P01') {
        console.log('⚠️  清理数据时出现问题:', deleteError.message);
      }
    } catch (cleanError) {
      console.log('⚠️  清理数据跳过:', cleanError.message);
    }
    
    // 批量导入数据
    const batchSize = 20; // 减小批次大小
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(students.length / batchSize);
      
      console.log(`📥 导入第 ${batchNum}/${totalBatches} 批数据 (${batch.length} 条)...`);
      
      try {
        const { data, error } = await supabase
          .from('students')
          .insert(batch);
        
        if (error) {
          console.log(`⚠️  第 ${batchNum} 批数据批量导入失败: ${error.message}`);
          console.log('🔄 尝试逐条导入...');
          
          // 逐条导入
          for (const student of batch) {
            try {
              const { error: singleError } = await supabase
                .from('students')
                .insert([student]);
              
              if (singleError) {
                console.log(`❌ ${student.student_id} 导入失败: ${singleError.message}`);
                failedCount++;
              } else {
                successCount++;
                if (successCount <= 10) {
                  console.log(`✅ ${student.student_id} → ${student.student_name} 导入成功`);
                }
              }
            } catch (singleErr) {
              console.log(`❌ ${student.student_id} 导入异常: ${singleErr.message}`);
              failedCount++;
            }
            
            // 添加小延迟
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          successCount += batch.length;
          console.log(`✅ 第 ${batchNum} 批数据导入成功`);
        }
      } catch (batchError) {
        console.log(`❌ 第 ${batchNum} 批数据导入异常: ${batchError.message}`);
        failedCount += batch.length;
      }
      
      // 批次间延迟
      if (i + batchSize < students.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n🎉 导入完成！`);
    console.log(`✅ 成功导入: ${successCount} 条`);
    console.log(`❌ 导入失败: ${failedCount} 条`);
    console.log(`📊 总计处理: ${successCount + failedCount} 条`);
    
    return successCount;
  } catch (error) {
    console.error('❌ 导入过程发生错误:', error);
    return 0;
  }
}

async function testQueryFunction() {
  console.log('\n🧪 测试查询功能...');
  
  try {
    // 获取总数
    const { count, error: countError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ 查询总数失败:', countError.message);
      return;
    }
    
    console.log(`📊 数据库中学员总数: ${count}`);
    
    // 获取前5个学员测试
    const { data: testStudents, error: queryError } = await supabase
      .from('students')
      .select('*')
      .limit(5);
    
    if (queryError) {
      console.log('❌ 查询学员数据失败:', queryError.message);
      return;
    }
    
    if (testStudents && testStudents.length > 0) {
      console.log('📋 随机测试数据:');
      testStudents.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.student_id} → ${student.student_name}`);
      });
      
      // 测试单个查询
      const testId = testStudents[0].student_id;
      const { data: singleResult, error: singleError } = await supabase
        .from('students')
        .select('student_name')
        .eq('student_id', testId)
        .single();
      
      if (singleError) {
        console.log('❌ 单个查询测试失败:', singleError.message);
      } else {
        console.log(`✅ 单个查询测试成功: ${testId} → ${singleResult.student_name}`);
      }
    } else {
      console.log('⚠️  没有找到测试数据');
    }
  } catch (error) {
    console.log('❌ 测试查询异常:', error.message);
  }
}

async function main() {
  console.log('🚀 开始直接导入学员数据流程...\n');
  
  // 1. 检查数据库状态
  const dbReady = await testAndCreateSchema();
  if (!dbReady) {
    console.log('\n❌ 数据库未准备就绪');
    console.log('\n📋 请提供以下信息之一：');
    console.log('1. Supabase Service Role Key（用于创建表格）');
    console.log('2. 手动在Supabase控制台创建students表格');
    console.log('\n创建表格的SQL：');
    console.log('CREATE TABLE students (student_id TEXT PRIMARY KEY, student_name TEXT NOT NULL);');
    return;
  }
  
  // 2. 导入学员数据
  console.log('\n开始导入学员数据...');
  const importedCount = await importStudentsData();
  
  if (importedCount > 0) {
    // 3. 测试查询功能
    await testQueryFunction();
    
    console.log('\n🎉 任务完成！现在您可以：');
    console.log('1. 访问您的网站测试学号查询功能');
    console.log('2. 使用任意学号测试姓名自动显示');
    console.log('3. 测试作业提交功能');
  } else {
    console.log('\n❌ 导入失败，请检查权限设置');
  }
}

// 运行主程序
main().catch(console.error);