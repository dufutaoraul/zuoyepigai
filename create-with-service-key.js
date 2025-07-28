// 使用Service Role Key通过不同方法创建表格
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTablesViaPostgREST() {
  console.log('🔑 使用Service Role Key直接创建表格...');
  
  // 方法1: 尝试通过PostgREST直接执行SQL
  try {
    console.log('📋 方法1: 通过PostgREST创建students表...');
    
    // 构造PostgreSQL连接URL
    const dbUrl = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    const postgrestUrl = `${supabaseUrl}/rest/v1/rpc/exec`;
    
    const response = await fetch(postgrestUrl, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: `
          CREATE TABLE IF NOT EXISTS students (
            student_id VARCHAR(20) PRIMARY KEY,
            student_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
    });
    
    if (response.ok) {
      console.log('✅ 方法1成功: students表创建');
    } else {
      const errorText = await response.text();
      console.log('⚠️  方法1失败:', response.status, errorText);
    }
    
  } catch (error) {
    console.log('❌ 方法1异常:', error.message);
  }
  
  // 方法2: 尝试通过Supabase管理API
  try {
    console.log('📋 方法2: 通过管理API创建表格...');
    
    const managementUrl = `${supabaseUrl}/rest/v1/`;
    const headers = {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    };
    
    // 尝试创建表格的SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS students (
        student_id VARCHAR(20) PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS assignments (
        assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        day_number INTEGER NOT NULL,
        assignment_title VARCHAR(200) NOT NULL,
        is_mandatory BOOLEAN NOT NULL DEFAULT true,
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS submissions (
        submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id VARCHAR(20) REFERENCES students(student_id),
        assignment_id UUID REFERENCES assignments(assignment_id),
        submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        attachments_url JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) DEFAULT '批改中',
        feedback TEXT
      );
    `;
    
    // 尝试多种RPC调用方式
    const rpcMethods = ['exec', 'execute', 'sql', 'query'];
    
    for (const method of rpcMethods) {
      try {
        const rpcUrl = `${managementUrl}rpc/${method}`;
        const rpcResponse = await fetch(rpcUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ sql: createTableSQL })
        });
        
        if (rpcResponse.ok) {
          console.log(`✅ 方法2成功: 通过${method}创建表格`);
          return true;
        } else {
          const errorText = await rpcResponse.text();
          console.log(`⚠️  ${method}失败:`, rpcResponse.status);
        }
      } catch (methodError) {
        console.log(`⚠️  ${method}异常:`, methodError.message);
      }
    }
    
  } catch (error) {
    console.log('❌ 方法2异常:', error.message);
  }
  
  // 方法3: 尝试通过原始HTTP请求
  try {
    console.log('📋 方法3: 直接HTTP请求...');
    
    const rawResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        'Range': '',
        'X-Client-Info': 'supabase-js/2.39.7'
      },
      body: JSON.stringify({
        sql: 'CREATE TABLE IF NOT EXISTS students (student_id VARCHAR(20) PRIMARY KEY, student_name VARCHAR(100) NOT NULL);'
      })
    });
    
    console.log('Raw response status:', rawResponse.status);
    const rawText = await rawResponse.text();
    console.log('Raw response:', rawText);
    
  } catch (error) {
    console.log('❌ 方法3异常:', error.message);
  }
  
  return false;
}

async function testTableCreation() {
  console.log('🧪 测试表格是否已创建...');
  
  try {
    // 尝试查询students表
    const { data, error } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ students表不存在');
      return false;
    } else if (error) {
      console.log('⚠️  查询错误:', error.message);
      return false;
    } else {
      console.log('✅ students表存在');
      return true;
    }
  } catch (error) {
    console.log('❌ 测试异常:', error.message);
    return false;
  }
}

async function createTablesByInsertion() {
  console.log('📋 方法4: 通过插入数据隐式创建表格...');
  
  try {
    // 尝试直接插入一条测试数据，这可能会触发表格创建
    const { data, error } = await supabase
      .from('students')
      .insert([
        { student_id: 'TEST001', student_name: '测试用户' }
      ]);
    
    if (error) {
      console.log('❌ 插入测试数据失败:', error.message);
      
      // 如果表不存在，尝试使用Supabase的schema builder
      try {
        console.log('🔄 尝试通过schema操作...');
        
        // 这是一个实验性的方法
        const schemaResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'OPTIONS',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        
        console.log('Schema response:', schemaResponse.status);
        
      } catch (schemaError) {
        console.log('Schema操作失败:', schemaError.message);
      }
      
      return false;
    } else {
      console.log('✅ 测试数据插入成功，表格已存在或创建成功');
      
      // 删除测试数据
      await supabase
        .from('students')
        .delete()
        .eq('student_id', 'TEST001');
      
      return true;
    }
  } catch (error) {
    console.log('❌ 方法4异常:', error.message);
    return false;
  }
}

async function importStudentsIfTableExists() {
  console.log('📖 开始导入学员数据...');
  
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
    console.log('🔍 前10条数据预览:');
    students.slice(0, 10).forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.student_id} → ${student.student_name}`);
    });
    
    // 批量导入
    console.log('\n📤 开始批量导入...');
    const batchSize = 50;
    let successCount = 0;
    
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
          console.log(`⚠️  第 ${batchNum} 批失败: ${error.message.substring(0, 100)}...`);
          
          // 尝试逐条插入
          for (const student of batch) {
            try {
              const { error: singleError } = await supabase
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
          console.log(`✅ 第 ${batchNum} 批导入成功`);
        }
      } catch (batchError) {
        console.log(`❌ 第 ${batchNum} 批异常`);
      }
      
      // 延迟
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n🎉 导入完成！成功: ${successCount}/${students.length}`);
    return successCount;
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    return 0;
  }
}

async function testFinalResult() {
  console.log('\n🧪 测试最终结果...');
  
  try {
    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 学员总数: ${count}`);
    
    if (count > 0) {
      const { data: testStudents } = await supabase
        .from('students')
        .select('*')
        .limit(3);
      
      console.log('📋 测试学员:');
      testStudents.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.student_id} → ${student.student_name}`);
      });
      
      // 测试查询功能
      const testId = testStudents[0].student_id;
      const { data: result } = await supabase
        .from('students')
        .select('student_name')
        .eq('student_id', testId)
        .single();
      
      console.log(`✅ 查询测试: ${testId} → ${result.student_name}`);
      console.log('🎉 学号输入功能将正常工作！');
    }
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

async function main() {
  console.log('🚀 使用Service Role Key完成所有工作...\n');
  
  // 1. 尝试多种方法创建表格
  let tablesCreated = await createTablesViaPostgREST();
  
  if (!tablesCreated) {
    // 2. 测试表格是否已存在
    tablesCreated = await testTableCreation();
  }
  
  if (!tablesCreated) {
    // 3. 尝试通过插入数据创建表格
    tablesCreated = await createTablesByInsertion();
  }
  
  if (tablesCreated) {
    console.log('\n✅ 表格准备就绪，开始导入数据...');
    
    // 4. 导入学员数据
    const importedCount = await importStudentsIfTableExists();
    
    if (importedCount > 0) {
      // 5. 测试最终结果
      await testFinalResult();
      
      console.log('\n🎉 所有工作完成！');
      console.log('现在可以访问您的网站测试学号输入功能了！');
    } else {
      console.log('❌ 数据导入失败');
    }
  } else {
    console.log('\n❌ 无法创建表格');
    console.log('这可能是Supabase配置的限制');
    console.log('建议在Supabase控制台手动执行建表SQL');
  }
}

main().catch(console.error);