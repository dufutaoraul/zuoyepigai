const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCompleteSolution() {
  console.log('🚀 创建完整的天数格式解决方案...');
  
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

    // 2. 为每个作业创建详细的天数映射
    console.log('2. 创建每个作业的天数映射...');
    const assignmentDayMapping = {};
    const cleanedDescriptions = [];
    
    allAssignments.forEach((assignment, idx) => {
      const parts = assignment.description.split(' - ');
      const originalDayText = parts[0];
      const cleanDescription = parts.slice(1).join(' - ');
      
      // 验证是否为有效的天数格式
      const isValidDayFormat = originalDayText.includes('第') && (originalDayText.includes('天') || originalDayText.includes('周'));
      
      if (isValidDayFormat) {
        assignmentDayMapping[assignment.assignment_id] = originalDayText;
        cleanedDescriptions.push({
          assignment_id: assignment.assignment_id,
          day_text: originalDayText,
          clean_description: cleanDescription,
          assignment_title: assignment.assignment_title
        });
        
        console.log(`${idx + 1}. ${assignment.assignment_id} -> "${originalDayText}" (${assignment.assignment_title})`);
      } else {
        console.log(`⚠️ ${idx + 1}. 无效格式: "${originalDayText}" - ${assignment.assignment_title}`);
      }
    });

    // 3. 创建前端工具函数
    const frontendUtils = `// 作业天数显示映射工具
export const assignmentDayMapping = ${JSON.stringify(assignmentDayMapping, null, 2)};

// 根据assignment_id获取天数显示文本
export function getAssignmentDayText(assignmentId: string): string {
  return assignmentDayMapping[assignmentId] || '未知天数';
}

// 根据作业对象获取天数显示文本
export function getDayTextFromAssignment(assignment: any): string {
  if (assignment.day_text) {
    return assignment.day_text;
  }
  if (assignment.assignment_id && assignmentDayMapping[assignment.assignment_id]) {
    return assignmentDayMapping[assignment.assignment_id];
  }
  return assignment.day_number ? \`第\${assignment.day_number}天\` : '未知天数';
}

// 为下拉列表获取所有唯一的天数文本（按顺序）
export function getUniqueDayTexts(): string[] {
  const dayTexts = Object.values(assignmentDayMapping);
  const uniqueDayTexts = [...new Set(dayTexts)];
  
  // 简单排序：先按周，再按天
  return uniqueDayTexts.sort((a, b) => {
    const aWeek = a.includes('第一周') ? 1 : 2;
    const bWeek = b.includes('第一周') ? 1 : 2;
    
    if (aWeek !== bWeek) return aWeek - bWeek;
    
    // 在同一周内按天数排序
    const aDayMatch = a.match(/第(.*?)天/);
    const bDayMatch = b.match(/第(.*?)天/);
    
    if (aDayMatch && bDayMatch) {
      const aDayNumber = aDayMatch[1];
      const bDayNumber = bDayMatch[1];
      
      const dayOrder = ['一', '二', '三', '四', '五', '六', '七'];
      const aIndex = dayOrder.indexOf(aDayNumber);
      const bIndex = dayOrder.indexOf(bDayNumber);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
    }
    
    return a.localeCompare(b);
  });
}

// 根据天数文本获取该天的所有作业
export function getAssignmentsByDayText(dayText: string, allAssignments: any[]): any[] {
  const assignmentIds = Object.entries(assignmentDayMapping)
    .filter(([id, text]) => text === dayText)
    .map(([id]) => id);
  
  return allAssignments.filter(assignment => 
    assignmentIds.includes(assignment.assignment_id)
  );
}
`;

    const fs = require('fs');
    fs.writeFileSync('src/utils/day-text-utils.ts', frontendUtils);
    console.log('📁 前端工具函数已保存到 src/utils/day-text-utils.ts');

    // 4. 创建数据库更新脚本（清理description字段）
    let updateSQL = '-- 清理作业描述中的重复天数信息\n\n';
    cleanedDescriptions.forEach(item => {
      updateSQL += `UPDATE assignments SET description = '${item.clean_description.replace(/'/g, "''")}' WHERE assignment_id = '${item.assignment_id}';\n`;
    });

    fs.writeFileSync('update-clean-descriptions.sql', updateSQL);
    console.log('📁 描述清理脚本已保存到 update-clean-descriptions.sql');

    // 5. 创建天数统计报告
    console.log('\n📊 天数分布统计:');
    const dayTextStats = {};
    Object.values(assignmentDayMapping).forEach(dayText => {
      dayTextStats[dayText] = (dayTextStats[dayText] || 0) + 1;
    });

    Object.entries(dayTextStats)
      .sort(([a], [b]) => {
        const aWeek = a.includes('第一周') ? 1 : 2;
        const bWeek = b.includes('第一周') ? 1 : 2;
        if (aWeek !== bWeek) return aWeek - bWeek;
        return a.localeCompare(b);
      })
      .forEach(([dayText, count]) => {
        console.log(`   "${dayText}": ${count} 个作业`);
      });

    console.log('\n✅ 完整解决方案创建完成！');
    console.log('下一步: 更新前端代码使用新的工具函数');

  } catch (error) {
    console.error('❌ 创建解决方案失败:', error);
  }
}

createCompleteSolution();