const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simpleFix() {
  console.log('🚀 开始简单修复数据库...');
  
  try {
    // 1. 读取Excel数据
    console.log('1. 读取Excel数据...');
    const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`发现 ${data.length} 个作业`);
    console.log('示例数据:', data[0]);

    // 2. 处理数据（不包含assignment_category字段）
    console.log('2. 处理作业数据...');
    const assignments = data.map((row, index) => {
      const dayText = row['第几天'] || '';
      let dayNumber = null;
      
      // 解析天数 - 支持上午/下午格式
      if (dayText.includes('第一天上午') || (dayText.includes('第一天') && !dayText.includes('下午'))) dayNumber = 1;
      else if (dayText.includes('第一天下午')) dayNumber = 1;
      else if (dayText.includes('第二天上午') || (dayText.includes('第二天') && !dayText.includes('下午'))) dayNumber = 2;
      else if (dayText.includes('第二天下午')) dayNumber = 2;
      else if (dayText.includes('第三天')) dayNumber = 3;
      else if (dayText.includes('第四天')) dayNumber = 4;
      else if (dayText.includes('第五天')) dayNumber = 5;
      else if (dayText.includes('第六天')) dayNumber = 6;
      else if (dayText.includes('第七天')) dayNumber = 7;
      // 兼容旧格式
      else if (dayText.includes('第一周第一天')) dayNumber = 1;
      else if (dayText.includes('第一周第二天')) dayNumber = 2;
      else if (dayText.includes('第一周第三天')) dayNumber = 3;
      else if (dayText.includes('第一周第四天')) dayNumber = 4;
      else if (dayText.includes('第一周第五天')) dayNumber = 5;
      else if (dayText.includes('第二周')) dayNumber = 6;
      else if (dayText.includes('第三周')) dayNumber = 7;

      const title = row['具体作业'] || '';
      const typeText = row['必做/选做'] || '';
      const isMandatory = typeText.includes('必做');
      const description = row['作业详细要求'] || '';
      
      return {
        // 不指定assignment_id，让数据库自动生成
        day_number: dayNumber,
        assignment_title: title,
        is_mandatory: isMandatory,
        description: description
      };
    });

    // 3. 清理现有数据
    console.log('3. 清理现有数据...');
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .neq('assignment_title', ''); // 删除所有有标题的记录（即所有记录）
    
    if (deleteError && !deleteError.message.includes('0 rows')) {
      console.log('清理数据时出错:', deleteError.message);
    }

    // 4. 插入新数据（分批插入以避免超时）
    console.log('4. 插入新数据...');
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
      .order('day_number');

    if (fetchError) {
      console.error('获取数据验证时出错:', fetchError);
      return;
    }

    console.log('✅ 修复完成！');
    console.log(`📊 总计: ${allAssignments.length} 个作业`);
    console.log(`📊 必做作业: ${allAssignments.filter(a => a.is_mandatory).length} 个`);
    console.log(`📊 选做作业: ${allAssignments.filter(a => !a.is_mandatory).length} 个`);

    // 按天数统计
    const byDay = {};
    allAssignments.forEach(a => {
      if (a.day_number) {
        byDay[a.day_number] = (byDay[a.day_number] || 0) + 1;
      }
    });
    console.log('📅 按天数分布:', byDay);

    // 显示前几个作业作为示例
    console.log('📝 前5个作业示例:');
    allAssignments.slice(0, 5).forEach(a => {
      console.log(`   第${a.day_number}天: ${a.assignment_title} (${a.is_mandatory ? '必做' : '选做'})`);
    });

  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

simpleFix();