const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateFirstDay5() {
  // 第一条day_number=5的记录ID和信息
  const targetId = '584a1f2f-79ef-45ed-b5e3-eed6727ad93d';
  const targetTitle = '生成历史视频';
  const newDayValue = '第一周第五天下午';
  
  console.log('🔄 准备更新第一条day_number=5的记录...');
  console.log(`目标记录: ${targetTitle}`);
  console.log(`assignment_id: ${targetId}`);
  console.log(`当前day_number: 5`);
  console.log(`新day_number: ${newDayValue}`);
  
  try {
    // 更新指定记录的day_number
    const { data, error } = await supabase
      .from('assignments')
      .update({ day_number: newDayValue })
      .eq('assignment_id', targetId)
      .select();

    if (error) {
      console.error('❌ 更新失败:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('\n✅ 更新成功！');
      console.log('更新后的数据:');
      console.log(`assignment_id: ${data[0].assignment_id}`);
      console.log(`assignment_title: ${data[0].assignment_title}`);
      console.log(`day_number: ${data[0].day_number}`);
      console.log(`description: ${data[0].description.substring(0, 80)}...`);
    } else {
      console.log('❌ 没有找到要更新的记录');
    }

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

updateFirstDay5();