const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFirstRow() {
  console.log('🔍 查询assignments表的第一行数据...');
  
  try {
    // 查询第一行数据
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .limit(1);

    if (error) {
      console.error('查询失败:', error);
      return;
    }

    if (data && data.length > 0) {
      const firstRow = data[0];
      console.log('\n📊 第一行数据内容:');
      console.log(`assignment_id: ${firstRow.assignment_id}`);
      console.log(`day_number: ${firstRow.day_number}`);
      console.log(`assignment_title: ${firstRow.assignment_title}`);
      console.log(`description: ${firstRow.description.substring(0, 80)}...`);
      console.log(`is_mandatory: ${firstRow.is_mandatory}`);
      
      // 保存第一行的ID供后续更新使用
      console.log('\n✅ 找到第一行数据，assignment_id:', firstRow.assignment_id);
      return firstRow.assignment_id;
    } else {
      console.log('❌ 没有找到任何数据');
    }

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

checkFirstRow();