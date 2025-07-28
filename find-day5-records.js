const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findDay5Records() {
  console.log('🔍 查找day_number=5的所有记录...');
  
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('assignment_id, day_number, assignment_title, description')
      .eq('day_number', 5);

    if (error) {
      console.error('查询失败:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log(`\n找到 ${data.length} 条day_number=5的记录:`);
      data.forEach((row, index) => {
        console.log(`\n第${index + 1}条记录:`);
        console.log(`assignment_id: ${row.assignment_id}`);
        console.log(`day_number: ${row.day_number}`);
        console.log(`assignment_title: ${row.assignment_title}`);
        console.log(`description: ${row.description.substring(0, 80)}...`);
      });

      // 也查看第一条day_number=5的完整信息
      const firstDay5 = data[0];
      console.log('\n📋 第一条day_number=5记录的详细信息:');
      console.log(`完整description: ${firstDay5.description}`);
      
    } else {
      console.log('❌ 没有找到day_number=5的记录');
    }

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

findDay5Records();