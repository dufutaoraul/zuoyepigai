const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 手动执行每个SQL语句
async function executeFinalDatabase() {
  console.log('🚀 开始执行最终数据库配置...');
  
  try {
    // 1. 删除现有表
    console.log('1. 删除现有表...');
    try {
      await supabase.from('submissions').delete().neq('submission_id', '00000000-0000-0000-0000-000000000000');
      console.log('  - 清空submissions表');
    } catch (e) { console.log('  - submissions表不存在或已空'); }
    
    try {
      await supabase.from('assignments').delete().neq('assignment_id', '00000000-0000-0000-0000-000000000000');
      console.log('  - 清空assignments表');
    } catch (e) { console.log('  - assignments表不存在或已空'); }

    // 2. 插入新数据（直接使用API，因为表结构应该已经存在）
    console.log('2. 插入作业数据...');
    
    const assignments = [
      {
        day_text: '第一周第一天',
        assignment_title: '三项全能作品集',
        is_mandatory: true,
        description: '你的截图需要包含以下三个内容：\n1.网站截图\n2.思维导图截图或者播客截图或者与notebook LM对话截图。\n3.用AI生成的图片或者视频截图',
        assignment_category: 'Mandatory'
      },
      {
        day_text: '第一周第一天',
        assignment_title: '遇事不决问AI',
        is_mandatory: true,
        description: '用 AI 解决的问题，你的截图需要包含：你跟AI的对话截图，截图里面需要能够看清楚你的问题和AI的回答。',
        assignment_category: 'Mandatory'
      },
      {
        day_text: '第一周第一天',
        assignment_title: '用AI一句话生成游戏',
        is_mandatory: false,
        description: '你的截图需要包含：1.你跟AI的对话截图，截图里面需要能够看清楚你的提示词和AI的回答。2.游戏界面截图、运行效果截图。',
        assignment_category: 'Regular_Optional'
      },
      {
        day_text: '第一周第一天',
        assignment_title: '用AI生成PPT',
        is_mandatory: false,
        description: '你的截图需要包含：1.你跟AI的对话截图，截图里面需要能够看清楚你的提示词和AI的回答。2. AI生成的ppt截图，截图能看出包含PPT界面即可。',
        assignment_category: 'Regular_Optional'
      },
      {
        day_text: '第一周第二天',
        assignment_title: 'AI让生活更美好',
        is_mandatory: true,
        description: '你的截图需要包含：与AI的对话截图，AI给你的建议',
        assignment_category: 'Mandatory'
      },
      {
        day_text: '第一周第二天',
        assignment_title: '综合问答练习',
        is_mandatory: true,
        description: '你的截图需要包含:你跟AI的对话截图,截图里面需要能够看清楚你的问题和AI的回答。（作业要求详见飞书文档。）',
        assignment_category: 'Mandatory'
      },
      {
        day_text: '第一周第二天下午',
        assignment_title: 'AI能力坐标定位',
        is_mandatory: false,
        description: '你的截图里面包括：电脑画的坐标图可以、手绘的图也可以、有显示三条计划。',
        assignment_category: 'W1D2_Afternoon_Optional'
      },
      {
        day_text: '第一周第二天下午',
        assignment_title: '爱学一派逆向工程分析',
        is_mandatory: false,
        description: '你的截图需要包括：1.一份简短的商业机会分析报告截图。2，截图里需要包含机会描述、解决方案构想和商业模式创新三个部分。',
        assignment_category: 'W1D2_Afternoon_Optional'
      },
      {
        day_text: '第一周第二天下午',
        assignment_title: 'AI工作流挑战赛',
        is_mandatory: false,
        description: '你的截图需要包括：1.一份清晰的"AI工作流"图或文字描述。2.需要至少只用两个以上的AI工具。3，需要设计一个AI工作流，清晰地说明第1步用什么AI做什么，第2步用什么AI做什么，等。',
        assignment_category: 'W1D2_Afternoon_Optional'
      },
      {
        day_text: '第一周第二天下午',
        assignment_title: '四步冲刺挑战',
        is_mandatory: false,
        description: '你的截图需要包括：1.一个可演示的产品原型（或SOP）截图。2. 一份包含真实用户反馈的记录截图。3.项目路演PPT截图。',
        assignment_category: 'W1D2_Afternoon_Optional'
      }
    ];

    // 先插入前10个作业作为测试
    console.log('3. 插入前10个作业数据...');
    const { data: insertData, error: insertError } = await supabase
      .from('assignments')
      .insert(assignments);

    if (insertError) {
      console.error('插入失败:', insertError);
      console.log('尝试通过upsert插入...');
      
      // 尝试逐个插入
      for (let i = 0; i < assignments.length; i++) {
        try {
          const { error: singleError } = await supabase
            .from('assignments')
            .insert([assignments[i]]);
          
          if (singleError) {
            console.error(`插入第${i+1}个作业失败:`, singleError.message);
          } else {
            console.log(`✅ 插入作业: ${assignments[i].assignment_title}`);
          }
        } catch (e) {
          console.error(`插入第${i+1}个作业异常:`, e.message);
        }
      }
    } else {
      console.log('✅ 成功插入前10个作业');
    }

    // 4. 验证数据
    console.log('4. 验证数据...');
    const { data: allAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select('day_text, assignment_title, is_mandatory, assignment_category');

    if (fetchError) {
      console.error('验证失败:', fetchError);
      return;
    }

    console.log('\n🎉 数据库配置完成！');
    console.log(`📊 成功插入: ${allAssignments.length} 个作业`);
    
    // 统计
    const mandatory = allAssignments.filter(a => a.assignment_category === 'Mandatory').length;
    const w1d2 = allAssignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional').length;
    const regular = allAssignments.filter(a => a.assignment_category === 'Regular_Optional').length;
    
    console.log(`📊 必做作业: ${mandatory} 个`);
    console.log(`📊 第二天下午选做: ${w1d2} 个`);
    console.log(`📊 其他选做: ${regular} 个`);

    // 显示天数格式
    console.log('\n📅 天数格式验证:');
    const dayTextStats = {};
    allAssignments.forEach(a => {
      if (a.day_text) {
        dayTextStats[a.day_text] = (dayTextStats[a.day_text] || 0) + 1;
      }
    });
    
    Object.entries(dayTextStats).forEach(([dayText, count]) => {
      console.log(`   "${dayText}": ${count} 个作业`);
    });

    // 显示特殊作业
    const specialAssignments = allAssignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional');
    console.log('\n🎯 第二天下午特殊作业:');
    specialAssignments.forEach(a => {
      console.log(`   - "${a.day_text}" - ${a.assignment_title}`);
    });

  } catch (error) {
    console.error('❌ 执行过程中出错:', error);
  }
}

executeFinalDatabase();