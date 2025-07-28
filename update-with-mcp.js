const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateFirstRowWithMCP() {
  const targetId = '584a1f2f-79ef-45ed-b5e3-eed6727ad93d';
  const targetTitle = '生成历史视频';
  const oldValue = '5';
  const newValue = '第一周第五天下午';
  
  console.log('🔄 使用MCP服务更新第一行数据...');
  console.log(`目标记录: ${targetTitle}`);
  console.log(`assignment_id: ${targetId}`);
  console.log(`当前day_number: "${oldValue}"`);
  console.log(`新day_number: "${newValue}"`);
  
  try {
    // 现在字段是TEXT类型，可以直接更新中文内容
    const { data, error } = await supabase
      .from('assignments')
      .update({ day_number: newValue })
      .eq('assignment_id', targetId)
      .select('assignment_id, assignment_title, day_number');

    if (error) {
      console.error('❌ 更新失败:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('\n✅ 更新成功！');
      console.log('更新后的数据:');
      console.log(`assignment_title: ${data[0].assignment_title}`);
      console.log(`day_number: "${data[0].day_number}"`);
      console.log(`assignment_id: ${data[0].assignment_id}`);
      
      // 验证更新结果
      console.log('\n🔍 验证更新结果...');
      if (data[0].day_number === newValue) {
        console.log('✅ 完美！day_number已成功更改为中文格式');
      } else {
        console.log('⚠️ 更新可能有问题，值不匹配');
      }
      
    } else {
      console.log('❌ 没有返回更新后的数据');
    }

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

updateFirstRowWithMCP();