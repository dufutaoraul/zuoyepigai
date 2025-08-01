const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDayFormat() {
  console.log('🚀 修正天数格式 - 使用Excel中的原始格式...');
  
  try {
    // 1. 读取Excel获取原始格式
    console.log('1. 读取Excel文件获取原始天数格式...');
    const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`发现 ${data.length} 个作业`);
    console.log('示例原始天数格式:', data[0]['第几天']);

    // 2. 删除现有数据
    console.log('2. 清理现有assignments表...');
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .neq('assignment_title', ''); 

    if (deleteError && !deleteError.message.includes('0 rows')) {
      console.log('清理数据时出错:', deleteError.message);
    }

    // 3. 处理数据 - 保持原始天数格式！
    console.log('3. 处理作业数据 - 保持原始格式...');
    const assignments = data.map((row, index) => {
      // 完全保持Excel中的原始格式！
      const originalDayText = row['第几天'] || '';
      const title = row['具体作业'] || '';
      const typeText = row['必做/选做'] || '';
      const isMandatory = typeText.includes('必做');
      const description = row['作业详细要求'] || '';
      
      // 确定作业类别 - 基于原始文本格式
      let category = 'Regular_Optional';
      if (isMandatory) {
        category = 'Mandatory';
      } else if (originalDayText.includes('第二天下午')) {
        // 只有第二天下午的选做作业才是特殊类别
        category = 'W1D2_Afternoon_Optional';
      }
      
      return {
        day_text: originalDayText,  // 保持完全原始格式！
        assignment_title: title,
        is_mandatory: isMandatory,
        description: description
        // 暂时不包含assignment_category字段
      };
    });

    console.log('处理后的示例数据:');
    console.log('天数格式:', assignments[0].day_text);
    console.log('作业标题:', assignments[0].assignment_title);

    // 4. 插入数据（分批插入）
    console.log('4. 插入数据到Supabase...');
    const batchSize = 10;
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('assignments')
        .insert(batch);
      
      if (insertError) {
        console.error(`插入第 ${i}-${i + batch.length} 批数据时出错:`, insertError);
        continue;
      }
      console.log(`✅ 插入第 ${i + 1}-${i + batch.length} 个作业`);
    }

    // 5. 验证结果
    console.log('5. 验证结果...');
    const { data: allAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at');

    if (fetchError) {
      console.error('获取数据验证时出错:', fetchError);
      return;
    }

    console.log('✅ 修正完成！');
    console.log(`📊 总计: ${allAssignments.length} 个作业`);
    
    // 显示天数格式示例
    console.log('📅 天数格式示例（前10个）:');
    allAssignments.slice(0, 10).forEach((a, index) => {
      console.log(`   ${index + 1}. "${a.day_text}" - ${a.assignment_title} (${a.is_mandatory ? '必做' : '选做'})`);
    });

    // 验证特殊的第二天下午作业
    const specialAssignments = allAssignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional');
    console.log('🎯 第二天下午特殊选做作业:');
    specialAssignments.forEach(a => {
      console.log(`   - "${a.day_text}" - ${a.assignment_title}`);
    });

    // 统计各种格式的天数
    const dayFormats = {};
    allAssignments.forEach(a => {
      if (a.day_text) {
        dayFormats[a.day_text] = (dayFormats[a.day_text] || 0) + 1;
      }
    });
    
    console.log('📊 天数格式统计:');
    Object.entries(dayFormats).forEach(([format, count]) => {
      console.log(`   "${format}": ${count}个作业`);
    });

  } catch (error) {
    console.error('❌ 修正过程中出错:', error);
  }
}

fixDayFormat();