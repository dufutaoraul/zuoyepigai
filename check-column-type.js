const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumnType() {
  console.log('🔍 检查day_number列的类型和数据...');
  
  try {
    // 查询第一条记录，看看数据类型
    const { data, error } = await supabase
      .from('assignments')
      .select('assignment_id, assignment_title, day_number')
      .limit(3);

    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('\n📊 前3条记录的day_number值:');
      data.forEach((row, index) => {
        console.log(`${index + 1}. ${row.assignment_title}`);
        console.log(`   day_number: "${row.day_number}" (类型: ${typeof row.day_number})`);
        console.log(`   assignment_id: ${row.assignment_id}`);
        console.log('');
      });

      // 特别检查我们要修改的那条记录
      const targetRecord = data.find(r => r.assignment_id === '584a1f2f-79ef-45ed-b5e3-eed6727ad93d');
      if (targetRecord) {
        console.log('🎯 找到目标记录（生成历史视频）:');
        console.log(`   当前day_number: "${targetRecord.day_number}"`);
        console.log(`   数据类型: ${typeof targetRecord.day_number}`);
      } else {
        console.log('⚠️ 没找到目标记录，让我查找一下...');
        
        const { data: targetData, error: targetError } = await supabase
          .from('assignments')
          .select('assignment_id, assignment_title, day_number')
          .eq('assignment_id', '584a1f2f-79ef-45ed-b5e3-eed6727ad93d');
          
        if (targetData && targetData.length > 0) {
          console.log('🎯 找到目标记录:');
          console.log(`   ${targetData[0].assignment_title}`);
          console.log(`   day_number: "${targetData[0].day_number}"`);
          console.log(`   数据类型: ${typeof targetData[0].day_number}`);
        }
      }

    } else {
      console.log('❌ 没有找到任何数据');
    }

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

checkColumnType();