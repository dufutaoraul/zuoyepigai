const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function manuallyAddDayText() {
  console.log('🚀 手动处理day_text字段...');
  
  try {
    // 1. 获取所有作业数据
    console.log('1. 获取所有作业数据...');
    const { data: allAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select('*');

    if (fetchError) {
      console.error('获取数据失败:', fetchError);
      return;
    }

    console.log(`找到 ${allAssignments.length} 个作业`);

    // 2. 检查是否有day_text字段
    console.log('2. 检查表结构...');
    if (allAssignments.length > 0) {
      const hasdayText = 'day_text' in allAssignments[0];
      console.log(`day_text字段存在: ${hasDateText}`);
      
      if (!hasDateText) {
        console.log('⚠️ day_text字段不存在，需要通过Supabase控制台手动添加');
        console.log('请在Supabase SQL编辑器中执行:');
        console.log('ALTER TABLE assignments ADD COLUMN day_text TEXT;');
        console.log('然后重新运行此脚本');
        return;
      }
    }

    // 3. 逐个处理作业，提取原始天数格式
    console.log('3. 逐个处理作业数据...');
    
    const processedAssignments = [];
    
    for (let i = 0; i < allAssignments.length; i++) {
      const assignment = allAssignments[i];
      
      // 从description中提取原始天数格式
      const parts = assignment.description.split(' - ');
      const originalDayText = parts[0];
      const cleanDescription = parts.slice(1).join(' - ');
      
      // 验证是否为有效的天数格式
      const isValidDayFormat = originalDayText.includes('第') && (originalDayText.includes('天') || originalDayText.includes('周'));
      
      if (isValidDayFormat) {
        processedAssignments.push({
          assignment_id: assignment.assignment_id,
          original_day_text: originalDayText,
          cleaned_description: cleanDescription,
          assignment_title: assignment.assignment_title
        });
        
        console.log(`${i + 1}/${allAssignments.length}. "${originalDayText}" - ${assignment.assignment_title}`);
      } else {
        console.log(`⚠️ ${i + 1}/${allAssignments.length}. 无效格式: "${originalDayText}" - ${assignment.assignment_title}`);
      }
    }

    console.log(`\n处理完成，有效作业数: ${processedAssignments.length}`);

    // 4. 显示所有要更新的数据，等待确认
    console.log('\n📋 准备更新的数据:');
    processedAssignments.forEach((a, idx) => {
      console.log(`${idx + 1}. ${a.original_day_text} -> ${a.assignment_title}`);
    });

    console.log('\n✅ 数据准备完成！');
    console.log('请确认Supabase中已添加day_text字段，然后运行update-day-text.js继续更新');

    // 5. 保存处理结果到文件
    const fs = require('fs');
    fs.writeFileSync('processed-assignments.json', JSON.stringify(processedAssignments, null, 2));
    console.log('📁 处理结果已保存到 processed-assignments.json');

  } catch (error) {
    console.error('❌ 处理失败:', error);
  }
}

manuallyAddDayText();