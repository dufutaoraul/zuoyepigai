const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateFirstRowToText() {
  // 第一条day_number=5的记录（现在应该是"5"字符串）
  const targetId = '584a1f2f-79ef-45ed-b5e3-eed6727ad93d';
  const targetTitle = '生成历史视频';
  const newDayValue = '第一周第五天下午';
  
  console.log('🔄 更新第一行day_number值（字段类型已改为TEXT）...');
  console.log(`目标记录: ${targetTitle}`);
  console.log(`assignment_id: ${targetId}`);
  console.log(`新day_number值: ${newDayValue}`);
  
  try {
    // 先验证当前值
    const { data: currentData, error: fetchError } = await supabase
      .from('assignments')
      .select('assignment_id, assignment_title, day_number')
      .eq('assignment_id', targetId);

    if (fetchError) {
      console.error('❌ 查询当前值失败:', fetchError);
      return;
    }

    if (currentData && currentData.length > 0) {
      console.log(`\n当前值: day_number = "${currentData[0].day_number}"`);
      console.log(`assignment_title = "${currentData[0].assignment_title}"`);
    }

    // 更新记录
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
      console.log(`assignment_title: ${data[0].assignment_title}`);
      console.log(`day_number: ${data[0].day_number}`);
      console.log(`assignment_id: ${data[0].assignment_id}`);
    } else {
      console.log('❌ 没有找到要更新的记录');
    }

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

updateFirstRowToText();