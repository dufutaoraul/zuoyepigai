// 导入学员数据到Supabase
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function readExcelFile() {
  console.log('📖 读取Excel文件...');
  
  try {
    // 读取Excel文件
    const workbook = XLSX.readFile('爱学AI创富营学员名单汇总总表.xlsx');
    
    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    console.log('📋 工作表名称:', sheetName);
    
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON数据
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log('📊 数据行数:', jsonData.length);
    
    // 显示前几行数据以便检查
    console.log('🔍 数据预览:');
    console.log(jsonData.slice(0, 3));
    
    return jsonData;
  } catch (error) {
    console.error('❌ 读取Excel文件失败:', error);
    return null;
  }
}

async function processStudentData(rawData) {
  console.log('🔄 处理学员数据...');
  
  const students = [];
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // 尝试从不同可能的列名中获取数据
    let studentId = null;
    let studentName = null;
    
    // 常见的学号列名
    const idColumns = ['学号', '编号', 'ID', 'id', '序号', '学员编号'];
    const nameColumns = ['姓名', '名字', '学员姓名', '真实姓名', 'name', 'Name'];
    
    // 查找学号
    for (const col of idColumns) {
      if (row[col]) {
        studentId = String(row[col]).trim();
        break;
      }
    }
    
    // 查找姓名
    for (const col of nameColumns) {
      if (row[col]) {
        studentName = String(row[col]).trim();
        break;
      }
    }
    
    // 如果没有找到明确的列名，使用第一列作为学号，第二列作为姓名
    if (!studentId || !studentName) {
      const keys = Object.keys(row);
      if (keys.length >= 2) {
        studentId = studentId || String(row[keys[0]]).trim();
        studentName = studentName || String(row[keys[1]]).trim();
      }
    }
    
    // 验证数据
    if (studentId && studentName && studentId !== '' && studentName !== '') {
      // 生成标准化的学号（如果不是标准格式）
      let formattedId = studentId;
      if (!/^\d{4}\d{3}$/.test(studentId)) {
        // 如果不是7位数字，尝试格式化
        const num = parseInt(studentId);
        if (!isNaN(num)) {
          formattedId = `2024${String(num).padStart(3, '0')}`;
        }
      }
      
      students.push({
        student_id: formattedId,
        student_name: studentName,
        original_id: studentId // 保存原始ID用于调试
      });
    }
  }
  
  console.log(`✅ 处理完成，有效学员数据: ${students.length} 条`);
  
  // 显示前几条处理后的数据
  console.log('🔍 处理后数据预览:');
  console.log(students.slice(0, 5));
  
  return students;
}

async function importToSupabase(students) {
  console.log('📤 导入数据到Supabase...');
  
  try {
    // 先清空现有的示例数据
    console.log('🧹 清理现有示例数据...');
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .like('student_id', '2024%');
    
    if (deleteError) {
      console.log('⚠️  清理数据时出现错误（可能是表为空）:', deleteError.message);
    }
    
    // 批量插入新数据（每次插入100条）
    const batchSize = 100;
    let successCount = 0;
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      console.log(`📥 插入第 ${Math.floor(i/batchSize) + 1} 批数据 (${batch.length} 条)...`);
      
      const { data, error } = await supabase
        .from('students')
        .insert(batch.map(s => ({
          student_id: s.student_id,
          student_name: s.student_name
        })));
      
      if (error) {
        console.error(`❌ 第 ${Math.floor(i/batchSize) + 1} 批数据插入失败:`, error);
        
        // 尝试逐条插入以找出问题数据
        for (const student of batch) {
          try {
            const { error: singleError } = await supabase
              .from('students')
              .insert({
                student_id: student.student_id,
                student_name: student.student_name
              });
            
            if (singleError) {
              console.error(`❌ 插入学员失败 [${student.student_id}] ${student.student_name}:`, singleError.message);
            } else {
              successCount++;
            }
          } catch (e) {
            console.error(`❌ 插入学员异常 [${student.student_id}] ${student.student_name}:`, e);
          }
        }
      } else {
        successCount += batch.length;
        console.log(`✅ 第 ${Math.floor(i/batchSize) + 1} 批数据插入成功`);
      }
    }
    
    console.log(`🎉 导入完成！成功导入 ${successCount} 条学员数据`);
    
    // 验证导入结果
    const { data: verifyData, error: verifyError } = await supabase
      .from('students')
      .select('count')
      .single();
    
    if (!verifyError) {
      console.log(`📊 数据库中当前学员总数: ${verifyData?.count || '未知'}`);
    }
    
    return successCount;
    
  } catch (error) {
    console.error('❌ 导入过程中发生错误:', error);
    return 0;
  }
}

async function testLookup() {
  console.log('🧪 测试学号查询功能...');
  
  try {
    // 获取前5个学员进行测试
    const { data: testStudents, error } = await supabase
      .from('students')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ 查询测试数据失败:', error);
      return;
    }
    
    if (!testStudents || testStudents.length === 0) {
      console.log('⚠️  没有找到测试数据');
      return;
    }
    
    console.log('📋 测试用学号和姓名:');
    testStudents.forEach(student => {
      console.log(`  学号: ${student.student_id} → 姓名: ${student.student_name}`);
    });
    
    // 测试查询功能
    const testId = testStudents[0].student_id;
    const { data: lookupResult, error: lookupError } = await supabase
      .from('students')
      .select('student_name')
      .eq('student_id', testId)
      .single();
    
    if (lookupError) {
      console.error('❌ 学号查询测试失败:', lookupError);
    } else {
      console.log(`✅ 查询测试成功: ${testId} → ${lookupResult.student_name}`);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

async function main() {
  console.log('🚀 开始导入学员数据...\n');
  
  // 1. 读取Excel文件
  const rawData = await readExcelFile();
  if (!rawData) {
    console.log('❌ 无法读取Excel文件，退出');
    return;
  }
  
  // 2. 处理数据
  const students = await processStudentData(rawData);
  if (students.length === 0) {
    console.log('❌ 没有有效的学员数据，退出');
    return;
  }
  
  // 3. 导入到Supabase
  const importedCount = await importToSupabase(students);
  
  // 4. 测试查询功能
  if (importedCount > 0) {
    console.log('\n');
    await testLookup();
  }
  
  console.log('\n🎉 学员数据导入完成！');
  console.log('\n📋 下一步:');
  console.log('1. 访问您的网站测试学号查询功能');
  console.log('2. 使用测试学号验证姓名自动显示');
  console.log('3. 如有问题，检查数据格式或联系技术支持');
}

// 运行导入程序
main().catch(console.error);