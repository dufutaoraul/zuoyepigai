const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDayTextColumn() {
  console.log('🚀 添加day_text字段到assignments表...');
  
  try {
    // 1. 添加day_text列
    console.log('1. 添加day_text列...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE assignments ADD COLUMN IF NOT EXISTS day_text TEXT;'
    });

    if (alterError) {
      console.error('添加列失败:', alterError);
      return;
    }

    console.log('✅ day_text列添加成功！');

    // 2. 获取所有当前数据并更新day_text字段
    console.log('2. 获取当前所有作业数据...');
    const { data: allAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select('*');

    if (fetchError) {
      console.error('获取数据失败:', fetchError);
      return;
    }

    console.log(`找到 ${allAssignments.length} 个作业`);

    // 3. 逐个更新作业的day_text字段
    console.log('3. 逐个更新作业的day_text字段...');
    
    for (let i = 0; i < allAssignments.length; i++) {
      const assignment = allAssignments[i];
      
      // 从description中提取原始天数格式
      const originalDayText = assignment.description.split(' - ')[0];
      
      try {
        // 更新记录，添加day_text字段
        const { error: updateError } = await supabase
          .from('assignments')
          .update({ 
            day_text: originalDayText,
            // 同时清理description，移除重复的天数信息
            description: assignment.description.split(' - ').slice(1).join(' - ')
          })
          .eq('assignment_id', assignment.assignment_id);

        if (updateError) {
          console.error(`更新作业 "${assignment.assignment_title}" 失败:`, updateError.message);
        } else {
          console.log(`✅ ${i + 1}/${allAssignments.length}. "${originalDayText}" - ${assignment.assignment_title}`);
        }
      } catch (e) {
        console.error(`更新作业 "${assignment.assignment_title}" 异常:`, e.message);
      }
      
      // 短暂延迟
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. 验证更新结果
    console.log('\n4. 验证更新结果...');
    const { data: updatedAssignments, error: verifyError } = await supabase
      .from('assignments')
      .select('day_text, day_number, assignment_title')
      .limit(10);

    if (verifyError) {
      console.error('验证失败:', verifyError);
      return;
    }

    console.log('\n✅ 更新完成！前10个作业验证:');
    updatedAssignments.forEach((a, idx) => {
      console.log(`${idx + 1}. day_text: "${a.day_text}" | day_number: ${a.day_number} | ${a.assignment_title}`);
    });

    // 5. 统计不同的day_text格式
    const { data: allUpdated } = await supabase
      .from('assignments')
      .select('day_text');

    const dayTextStats = {};
    allUpdated?.forEach(a => {
      if (a.day_text) {
        dayTextStats[a.day_text] = (dayTextStats[a.day_text] || 0) + 1;
      }
    });

    console.log('\n📊 day_text格式统计:');
    Object.entries(dayTextStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dayText, count]) => {
        console.log(`   "${dayText}": ${count} 个作业`);
      });

  } catch (error) {
    console.error('❌ 添加day_text字段失败:', error);
  }
}

addDayTextColumn();