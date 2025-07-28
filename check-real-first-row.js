const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRealFirstRow() {
  console.log('🔍 查询assignments表的数据（不同排序方式）...');
  
  try {
    // 方法1：按照创建时间排序（如果有的话）
    console.log('\n1. 按默认顺序查询前3行:');
    const { data: defaultData, error: defaultError } = await supabase
      .from('assignments')
      .select('assignment_id, day_number, assignment_title')
      .limit(3);

    if (defaultData) {
      defaultData.forEach((row, index) => {
        console.log(`第${index + 1}行: day_number=${row.day_number}, title="${row.assignment_title}"`);
      });
    }

    // 方法2：按assignment_title排序
    console.log('\n2. 按assignment_title排序查询前3行:');
    const { data: titleData, error: titleError } = await supabase
      .from('assignments')
      .select('assignment_id, day_number, assignment_title')
      .order('assignment_title')
      .limit(3);

    if (titleData) {
      titleData.forEach((row, index) => {
        console.log(`第${index + 1}行: day_number=${row.day_number}, title="${row.assignment_title}"`);
      });
    }

    // 方法3：按day_number排序
    console.log('\n3. 按day_number排序查询前3行:');
    const { data: dayData, error: dayError } = await supabase
      .from('assignments')
      .select('assignment_id, day_number, assignment_title')
      .order('day_number')
      .limit(3);

    if (dayData) {
      dayData.forEach((row, index) => {
        console.log(`第${index + 1}行: day_number=${row.day_number}, title="${row.assignment_title}"`);
      });
    }

    // 方法4：查看总共有多少条记录
    const { count, error: countError } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 总共有 ${count} 条记录`);

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

checkRealFirstRow();