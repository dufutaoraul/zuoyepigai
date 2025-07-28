const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function continueInsert() {
  console.log('🚀 继续插入剩余作业...');
  
  try {
    // 1. 检查当前数据
    console.log('1. 检查当前数据...');
    const { data: currentAssignments, error: checkError } = await supabase
      .from('assignments')
      .select('assignment_title');

    if (checkError) {
      console.error('检查失败:', checkError);
      return;
    }

    console.log(`当前已有 ${currentAssignments.length} 个作业`);

    // 2. 读取Excel数据
    console.log('2. 读取Excel数据...');
    const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // 3. 处理剩余数据（从第11个开始）
    console.log('3. 处理剩余数据...');
    const allAssignments = data.map((row, index) => {
      const dayText = row['第几天'] || '';
      const title = row['具体作业'] || '';
      const typeText = row['必做/选做'] || '';
      const isMandatory = typeText.includes('必做');
      const description = row['作业详细要求'] || '';
      
      // 映射天数到数字
      let dayNumber = 1;
      if (dayText.includes('第一天')) dayNumber = 1;
      else if (dayText.includes('第二天')) dayNumber = 2;
      else if (dayText.includes('第三天')) dayNumber = 3;
      else if (dayText.includes('第四天')) dayNumber = 4;
      else if (dayText.includes('第五天')) dayNumber = 5;
      else if (dayText.includes('第二周')) dayNumber = 6;
      else dayNumber = index % 7 + 1;
      
      return {
        day_number: dayNumber,
        assignment_title: title,
        is_mandatory: isMandatory,
        description: `${dayText} - ${description}`
      };
    });

    // 获取已存在的作业标题
    const existingTitles = new Set(currentAssignments.map(a => a.assignment_title));
    
    // 过滤出还没插入的作业
    const remainingAssignments = allAssignments.filter(a => 
      !existingTitles.has(a.assignment_title)
    );

    console.log(`需要插入 ${remainingAssignments.length} 个剩余作业`);

    // 4. 插入剩余作业（分批插入）
    const batchSize = 5;
    let successCount = 0;

    for (let i = 0; i < remainingAssignments.length; i += batchSize) {
      const batch = remainingAssignments.slice(i, i + batchSize);
      
      console.log(`\n插入批次 ${Math.floor(i/batchSize) + 1}:`);
      
      for (const assignment of batch) {
        try {
          const { error: insertError } = await supabase
            .from('assignments')
            .insert([assignment]);

          if (insertError) {
            console.error(`  ❌ ${assignment.assignment_title}: ${insertError.message}`);
          } else {
            successCount++;
            const dayInfo = assignment.description.split(' - ')[0];
            console.log(`  ✅ ${dayInfo} - ${assignment.assignment_title} (${assignment.is_mandatory ? '必做' : '选做'})`);
          }
        } catch (e) {
          console.error(`  ❌ ${assignment.assignment_title}: ${e.message}`);
        }
        
        // 短暂延迟
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // 5. 最终验证
    console.log('\n5. 最终验证...');
    const { data: finalAssignments, error: finalError } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at');

    if (finalError) {
      console.error('最终验证失败:', finalError);
      return;
    }

    console.log('\n🎉 全部插入完成！');
    console.log(`📊 总计: ${finalAssignments.length} 个作业`);
    console.log(`📊 本次新增: ${successCount} 个作业`);
    
    const mandatory = finalAssignments.filter(a => a.is_mandatory).length;
    const optional = finalAssignments.filter(a => !a.is_mandatory).length;
    
    console.log(`📊 必做作业: ${mandatory} 个`);
    console.log(`📊 选做作业: ${optional} 个`);

    // 按天数统计
    const dayStats = {};
    finalAssignments.forEach(a => {
      dayStats[a.day_number] = (dayStats[a.day_number] || 0) + 1;
    });
    
    console.log('\n📅 按天数分布:');
    Object.entries(dayStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([day, count]) => {
        console.log(`  第${day}天: ${count} 个作业`);
      });

    // 显示第二天下午的特殊作业
    const w1d2Assignments = finalAssignments.filter(a => 
      a.description.includes('第二天下午') && !a.is_mandatory
    );
    
    if (w1d2Assignments.length > 0) {
      console.log('\n🎯 第二天下午特殊选做作业 (毕业标准二):');
      w1d2Assignments.forEach(a => {
        console.log(`   - ${a.assignment_title}`);
      });
    }

    console.log('\n✅ 数据库配置完成！网站现在可以正常使用了！');

  } catch (error) {
    console.error('❌ 继续插入失败:', error);
  }
}

continueInsert();