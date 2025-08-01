const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDayTextDisplay() {
  console.log('🚀 修复天数显示格式...');
  
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

    // 2. 分析description字段，提取原始天数格式
    console.log('2. 分析作业数据，提取原始天数格式...');
    const dayMapping = {};
    
    allAssignments.forEach((assignment, idx) => {
      const parts = assignment.description.split(' - ');
      const originalDayText = parts[0];
      
      // 验证是否为有效的天数格式
      const isValidDayFormat = originalDayText.includes('第') && (originalDayText.includes('天') || originalDayText.includes('周'));
      
      if (isValidDayFormat) {
        dayMapping[assignment.day_number] = originalDayText;
        console.log(`${idx + 1}. day_number: ${assignment.day_number} -> "${originalDayText}" (${assignment.assignment_title})`);
      }
    });

    // 3. 显示天数映射
    console.log('\n📊 天数格式映射:');
    Object.entries(dayMapping)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([dayNumber, dayText]) => {
        console.log(`   第${dayNumber}天 -> "${dayText}"`);
      });

    // 4. 创建更新脚本（暂时不执行）
    console.log('\n📝 生成SQL更新脚本...');
    let updateScript = '-- 更新天数格式的SQL脚本\n';
    
    allAssignments.forEach(assignment => {
      const parts = assignment.description.split(' - ');
      const originalDayText = parts[0];
      const cleanDescription = parts.slice(1).join(' - ');
      
      const isValidDayFormat = originalDayText.includes('第') && (originalDayText.includes('天') || originalDayText.includes('周'));
      
      if (isValidDayFormat) {
        updateScript += `UPDATE assignments SET description = '${cleanDescription.replace(/'/g, "''")}' WHERE assignment_id = '${assignment.assignment_id}';\n`;
      }
    });

    const fs = require('fs');
    fs.writeFileSync('update-descriptions.sql', updateScript);
    console.log('📁 SQL脚本已保存到 update-descriptions.sql');

    // 5. 创建前端显示映射
    const frontendMapping = {};
    allAssignments.forEach(assignment => {
      const parts = assignment.description.split(' - ');
      const originalDayText = parts[0];
      const isValidDayFormat = originalDayText.includes('第') && (originalDayText.includes('天') || originalDayText.includes('周'));
      
      if (isValidDayFormat) {
        frontendMapping[assignment.day_number] = originalDayText;
      }
    });

    const mappingScript = `// 天数显示映射
export const dayNumberToText = ${JSON.stringify(frontendMapping, null, 2)};

// 获取天数显示文本
export function getDayText(dayNumber) {
  return dayNumberToText[dayNumber] || \`第\${dayNumber}天\`;
}
`;

    fs.writeFileSync('day-mapping.ts', mappingScript);
    console.log('📁 前端映射已保存到 day-mapping.ts');

    console.log('\n✅ 分析完成！');
    console.log('现在有两个选择:');
    console.log('1. 在Supabase中手动添加day_text字段并运行更新');
    console.log('2. 使用前端映射文件 day-mapping.ts 在显示时转换天数格式');

  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

fixDayTextDisplay();