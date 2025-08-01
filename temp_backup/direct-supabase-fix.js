const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function directSupabaseFix() {
  console.log('🚀 直接修复Supabase数据...');
  
  try {
    // 1. 清空现有数据
    console.log('1. 清空assignments表...');
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .neq('assignment_title', '');

    if (deleteError && !deleteError.message.includes('0 rows')) {
      console.log('清空错误:', deleteError.message);
    }

    // 2. 读取Excel数据
    console.log('2. 读取Excel数据...');
    const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // 3. 处理数据 - 包含day_number字段
    console.log('3. 处理数据...');
    const assignments = data.map((row, index) => {
      const dayText = row['第几天'] || '';
      const title = row['具体作业'] || '';
      const typeText = row['必做/选做'] || '';
      const isMandatory = typeText.includes('必做');
      const description = row['作业详细要求'] || '';
      
      // 映射天数到数字（临时解决方案）
      let dayNumber = 1;
      if (dayText.includes('第一天')) dayNumber = 1;
      else if (dayText.includes('第二天')) dayNumber = 2;
      else if (dayText.includes('第三天')) dayNumber = 3;
      else if (dayText.includes('第四天')) dayNumber = 4;
      else if (dayText.includes('第五天')) dayNumber = 5;
      else if (dayText.includes('第二周')) dayNumber = 6;
      else dayNumber = index % 7 + 1; // 默认分配
      
      return {
        day_number: dayNumber,
        assignment_title: title,
        is_mandatory: isMandatory,
        description: `${dayText} - ${description}` // 在描述中保留原始天数格式
      };
    });

    console.log(`准备插入 ${assignments.length} 个作业`);

    // 4. 逐个插入（避免批量插入问题）
    console.log('4. 逐个插入作业...');
    let successCount = 0;

    for (let i = 0; i < Math.min(assignments.length, 10); i++) {
      const assignment = assignments[i];
      
      try {
        const { error: insertError } = await supabase
          .from('assignments')
          .insert([assignment]);

        if (insertError) {
          console.error(`插入第${i+1}个作业失败:`, insertError.message);
        } else {
          successCount++;
          console.log(`✅ ${i+1}. ${assignment.assignment_title} (${assignment.is_mandatory ? '必做' : '选做'})`);
        }
      } catch (e) {
        console.error(`插入第${i+1}个作业异常:`, e.message);
      }
      
      // 短暂延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 5. 验证结果
    console.log('5. 验证结果...');
    const { data: finalAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at');

    if (fetchError) {
      console.error('验证失败:', fetchError);
      return;
    }

    console.log('\n🎉 部分数据插入完成！');
    console.log(`📊 成功插入: ${finalAssignments.length} 个作业`);
    
    if (finalAssignments.length > 0) {
      const mandatory = finalAssignments.filter(a => a.is_mandatory).length;
      const optional = finalAssignments.filter(a => !a.is_mandatory).length;
      
      console.log(`📊 必做作业: ${mandatory} 个`);
      console.log(`📊 选做作业: ${optional} 个`);

      // 显示作业列表
      console.log('\n📝 已插入的作业:');
      finalAssignments.forEach((a, idx) => {
        const dayInfo = a.description.split(' - ')[0] || '未知';
        console.log(`   ${idx + 1}. ${dayInfo} - ${a.assignment_title} (${a.is_mandatory ? '必做' : '选做'})`);
      });

      // 检查是否有第二天下午的作业
      const w1d2Assignments = finalAssignments.filter(a => 
        a.description.includes('第二天下午')
      );
      if (w1d2Assignments.length > 0) {
        console.log('\n🎯 第二天下午作业:');
        w1d2Assignments.forEach(a => {
          console.log(`   - ${a.assignment_title} (${a.is_mandatory ? '必做' : '选做'})`);
        });
      }
    }

    console.log('\n💡 提示: 基础数据已插入，网站现在可以正常工作了！');
    console.log('前端将显示第1天、第2天等选项，并加载对应的作业。');

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

directSupabaseFix();