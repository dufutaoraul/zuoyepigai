import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeAssignments() {
  console.log('=== 分析assignments表详情 ===\n');
  
  try {
    // 获取所有assignments记录
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('查询assignments失败:', error);
      return;
    }
    
    console.log(`总assignments记录数: ${assignments.length}\n`);
    
    // 分析day_number字段的格式
    console.log('=== day_number字段格式分析 ===');
    const dayNumberFormats = {};
    
    assignments.forEach((record, index) => {
      const dayNumber = record.day_number;
      const format = typeof dayNumber === 'string' ? '字符串' : '数字';
      
      if (!dayNumberFormats[format]) {
        dayNumberFormats[format] = [];
      }
      dayNumberFormats[format].push({
        value: dayNumber,
        title: record.assignment_title,
        id: record.assignment_id
      });
      
      // 显示前10条记录
      if (index < 10) {
        console.log(`${index + 1}. day_number: "${dayNumber}" (${format}) - ${record.assignment_title}`);
      }
    });
    
    console.log('\n=== day_number格式统计 ===');
    Object.keys(dayNumberFormats).forEach(format => {
      console.log(`${format}: ${dayNumberFormats[format].length} 条记录`);
    });
    
    // 显示所有不同的day_number值
    console.log('\n=== 所有day_number值 ===');
    const uniqueDayNumbers = [...new Set(assignments.map(a => a.day_number))];
    uniqueDayNumbers.forEach((dayNumber, index) => {
      console.log(`${index + 1}. "${dayNumber}"`);
    });
    
    // 检查是否有重复的作业标题
    console.log('\n=== 检查重复作业标题 ===');
    const titleCounts = {};
    assignments.forEach(record => {
      const title = record.assignment_title;
      titleCounts[title] = (titleCounts[title] || 0) + 1;
    });
    
    const duplicateTitles = Object.entries(titleCounts).filter(([title, count]) => count > 1);
    if (duplicateTitles.length > 0) {
      console.log('发现重复的作业标题:');
      duplicateTitles.forEach(([title, count]) => {
        console.log(`- "${title}": ${count} 次`);
      });
    } else {
      console.log('没有重复的作业标题');
    }
    
    // 检查描述字段长度
    console.log('\n=== 描述字段分析 ===');
    const descriptionLengths = assignments.map(a => ({
      title: a.assignment_title,
      length: a.description ? a.description.length : 0,
      hasDescription: !!a.description
    }));
    
    const avgLength = descriptionLengths.reduce((sum, item) => sum + item.length, 0) / descriptionLengths.length;
    const withoutDescription = descriptionLengths.filter(item => !item.hasDescription).length;
    
    console.log(`平均描述长度: ${avgLength.toFixed(1)} 字符`);
    console.log(`没有描述的作业: ${withoutDescription} 个`);
    
    // 显示最短和最长的描述示例
    const sorted = descriptionLengths.sort((a, b) => a.length - b.length);
    console.log(`\n最短描述 (${sorted[0].length} 字符): ${sorted[0].title}`);
    console.log(`最长描述 (${sorted[sorted.length-1].length} 字符): ${sorted[sorted.length-1].title}`);
    
  } catch (error) {
    console.error('分析assignments出错:', error);
  }
}

// 运行分析
analyzeAssignments();