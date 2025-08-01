const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabase() {
  console.log('🚀 开始修复数据库...');
  
  try {
    // 1. 先修复表结构 - 添加assignment_category字段
    console.log('1. 修复表结构...');
    
    try {
      const { error: alterError } = await supabase
        .rpc('exec_sql', { 
          sql: 'ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_category TEXT DEFAULT \'Regular_Optional\';' 
        });
      
      if (alterError) {
        console.log('修改表结构时的响应:', alterError);
      }
    } catch (structureError) {
      console.log('修改表结构时出错（可能字段已存在）:', structureError.message);
    }

    // 2. 清理现有assignments表数据
    console.log('2. 清理现有assignments表数据...');
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .gte('assignment_id', 1); // 删除所有记录
    
    if (deleteError) {
      console.log('删除现有数据时出错:', deleteError.message);
    }

    // 3. 读取并处理Excel数据
    console.log('3. 重新生成作业数据...');
    const XLSX = require('xlsx');
    
    const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // 4. 处理和分类作业
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
      
      // 确定作业类别
      let category = 'Regular_Optional';
      if (isMandatory) {
        category = 'Mandatory';
      } else if ((dayNumber === 1 || dayNumber === 2) && dayText.includes('下午')) {
        category = 'W1D2_Afternoon_Optional';
      }
      
      return {
        assignment_id: index + 1,
        day_number: dayNumber,
        assignment_title: title,
        is_mandatory: isMandatory,
        description: description,
        assignment_category: category
      };
    });

    // 5. 插入新数据
    console.log('5. 插入新的作业数据...');
    const { data: insertData, error: insertError } = await supabase
      .from('assignments')
      .insert(assignments);

    if (insertError) {
      console.error('插入数据时出错:', insertError);
      return;
    }

    // 6. 验证数据
    console.log('6. 验证数据...');
    const { data: allAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select('*');

    if (fetchError) {
      console.error('获取数据时出错:', fetchError);
      return;
    }

    // 统计结果
    const totalCount = allAssignments.length;
    const mandatoryCount = allAssignments.filter(a => a.is_mandatory).length;
    const w1d2AfternoonCount = allAssignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional').length;
    const regularOptionalCount = allAssignments.filter(a => a.assignment_category === 'Regular_Optional').length;

    console.log('✅ 数据库修复完成！');
    console.log(`📊 统计结果:`);
    console.log(`   - 总作业数: ${totalCount}`);
    console.log(`   - 必做作业: ${mandatoryCount}`);
    console.log(`   - 第一周第二天下午选做: ${w1d2AfternoonCount}`);
    console.log(`   - 其他选做: ${regularOptionalCount}`);

    // 显示第一周第二天下午的特殊作业
    const specialAssignments = allAssignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional');
    console.log('🎯 特殊毕业标准作业（第一周第二天下午）:');
    specialAssignments.forEach(a => {
      console.log(`   - ${a.assignment_title}`);
    });

    // 按天数统计
    const byDay = {};
    allAssignments.forEach(a => {
      if (a.day_number) {
        byDay[a.day_number] = (byDay[a.day_number] || 0) + 1;
      }
    });
    console.log('📅 按天数分布:', byDay);

  } catch (error) {
    console.error('❌ 修复过程中出错:', error);
  }
}

fixDatabase();