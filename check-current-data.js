const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentData() {
  console.log('🔍 检查当前assignments表数据...');
  
  try {
    // 1. 检查表结构
    console.log('1. 检查表中的前5条数据:');
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .limit(5);

    if (error) {
      console.error('查询失败:', error);
      return;
    }

    console.log('表结构字段:');
    if (assignments.length > 0) {
      console.log(Object.keys(assignments[0]));
      
      console.log('\n前5个作业数据:');
      assignments.forEach((a, idx) => {
        console.log(`${idx + 1}. 字段情况:`);
        console.log(`   assignment_id: ${a.assignment_id}`);
        console.log(`   day_number: ${a.day_number}`);
        console.log(`   assignment_title: ${a.assignment_title}`);
        console.log(`   description: ${a.description?.substring(0, 50)}...`);
        console.log(`   is_mandatory: ${a.is_mandatory}`);
        console.log(`   day_text字段: ${a.day_text || '不存在'}`);
        console.log('');
      });
    }

    // 2. 检查所有作业的天数分布
    console.log('2. 检查所有作业的天数分布:');
    const { data: allAssignments } = await supabase
      .from('assignments')
      .select('day_number, assignment_title, description');

    const dayStats = {};
    allAssignments?.forEach(a => {
      dayStats[a.day_number] = (dayStats[a.day_number] || 0) + 1;
    });

    console.log('按day_number分布:');
    Object.entries(dayStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([day, count]) => {
        console.log(`  第${day}天: ${count} 个作业`);
      });

    // 3. 检查description中是否包含原始天数格式
    console.log('\n3. 检查description中的原始天数格式:');
    allAssignments?.slice(0, 10).forEach((a, idx) => {
      const originalDay = a.description.split(' - ')[0];
      console.log(`${idx + 1}. ${a.assignment_title}`);
      console.log(`   day_number: ${a.day_number}`);
      console.log(`   原始格式: "${originalDay}"`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkCurrentData();