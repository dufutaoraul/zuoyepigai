const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCategoryField() {
  console.log('🚀 添加assignment_category字段...');
  
  try {
    // 1. 获取所有现有作业
    console.log('1. 获取现有作业数据...');
    const { data: assignments, error: fetchError } = await supabase
      .from('assignments')
      .select('*');

    if (fetchError) {
      console.error('获取数据失败:', fetchError);
      return;
    }

    console.log(`发现 ${assignments.length} 个作业`);

    // 2. 遍历每个作业，更新category字段
    console.log('2. 更新作业分类...');
    
    // 第一周第二天下午的特殊选做作业名单
    const w1d2AfternoonTitles = ['AI能力坐标定位', '爱学一派逆向工程分析', 'AI工作流挑战赛', '四步冲刺挑战'];
    
    for (let assignment of assignments) {
      let category = 'Regular_Optional';
      
      if (assignment.is_mandatory) {
        category = 'Mandatory';
      } else if (w1d2AfternoonTitles.includes(assignment.assignment_title)) {
        category = 'W1D2_Afternoon_Optional';
      }

      // 更新单个作业的category
      const { error: updateError } = await supabase
        .from('assignments')
        .update({ assignment_category: category })
        .eq('assignment_id', assignment.assignment_id);

      if (updateError) {
        console.error(`更新作业 "${assignment.assignment_title}" 失败:`, updateError);
      } else {
        console.log(`✅ 更新: ${assignment.assignment_title} -> ${category}`);
      }
    }

    // 3. 验证结果
    console.log('3. 验证分类结果...');
    const { data: updatedAssignments, error: verifyError } = await supabase
      .from('assignments')
      .select('assignment_title, is_mandatory, assignment_category');

    if (verifyError) {
      console.error('验证失败:', verifyError);
      return;
    }

    // 统计结果
    const mandatory = updatedAssignments.filter(a => a.assignment_category === 'Mandatory').length;
    const w1d2Afternoon = updatedAssignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional').length;
    const regularOptional = updatedAssignments.filter(a => a.assignment_category === 'Regular_Optional').length;

    console.log('✅ 分类完成！');
    console.log(`📊 必做作业 (Mandatory): ${mandatory}`);
    console.log(`📊 第一周第二天下午选做 (W1D2_Afternoon_Optional): ${w1d2Afternoon}`);
    console.log(`📊 其他选做 (Regular_Optional): ${regularOptional}`);

    // 显示特殊作业
    console.log('🎯 特殊毕业标准作业（第一周第二天下午）:');
    updatedAssignments
      .filter(a => a.assignment_category === 'W1D2_Afternoon_Optional')
      .forEach(a => console.log(`   - ${a.assignment_title}`));

  } catch (error) {
    console.error('❌ 添加分类字段过程中出错:', error);
  }
}

addCategoryField();