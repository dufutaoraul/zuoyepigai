const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simpleFinalExecute() {
  console.log('🚀 简化执行 - 使用现有表结构...');
  
  try {
    // 1. 清空现有数据
    console.log('1. 清空现有assignments表...');
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .neq('assignment_title', '');

    if (deleteError && !deleteError.message.includes('0 rows')) {
      console.log('清空数据错误:', deleteError.message);
    }

    // 2. 读取Excel数据
    console.log('2. 读取Excel数据...');
    const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // 3. 处理数据 - 只使用现有字段
    console.log('3. 处理数据 - 使用原始Excel格式...');
    const assignments = data.map((row, index) => {
      const originalDayText = row['第几天'] || '';
      const title = row['具体作业'] || '';
      const typeText = row['必做/选做'] || '';
      const isMandatory = typeText.includes('必做');
      const description = row['作业详细要求'] || '';
      
      return {
        // 使用现有的day_number字段，但存储我们需要的值
        day_number: index + 1, // 临时使用索引
        assignment_title: title,
        is_mandatory: isMandatory,
        description: description,
        // 在description中包含天数信息
        day_info: originalDayText
      };
    });

    console.log(`准备插入 ${assignments.length} 个作业`);
    console.log('示例数据:', {
      title: assignments[0].assignment_title,
      day_info: assignments[0].day_info,
      mandatory: assignments[0].is_mandatory
    });

    // 4. 批量插入
    console.log('4. 插入数据...');
    const batchSize = 10;
    let successCount = 0;

    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      const simpleBatch = batch.map(a => ({
        assignment_title: a.assignment_title,
        is_mandatory: a.is_mandatory,
        description: `[${a.day_info}] ${a.description}` // 在描述中包含天数信息
      }));

      try {
        const { error: insertError } = await supabase
          .from('assignments')
          .insert(simpleBatch);

        if (insertError) {
          console.error(`批次 ${i}-${i + batch.length} 插入失败:`, insertError.message);
        } else {
          successCount += batch.length;
          console.log(`✅ 插入批次 ${i + 1}-${i + batch.length}`);
        }
      } catch (e) {
        console.error(`批次 ${i}-${i + batch.length} 异常:`, e.message);
      }
    }

    // 5. 验证结果
    console.log('5. 验证结果...');
    const { data: finalAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select('assignment_title, is_mandatory, description')
      .order('created_at');

    if (fetchError) {
      console.error('验证失败:', fetchError);
      return;
    }

    console.log('\n🎉 执行完成！');
    console.log(`📊 成功插入: ${finalAssignments.length} 个作业`);
    console.log(`📊 必做作业: ${finalAssignments.filter(a => a.is_mandatory).length} 个`);
    console.log(`📊 选做作业: ${finalAssignments.filter(a => !a.is_mandatory).length} 个`);

    // 显示前几个作业
    console.log('\n📝 前5个作业示例:');
    finalAssignments.slice(0, 5).forEach((a, idx) => {
      const dayInfo = a.description.match(/\[(.*?)\]/)?.[1] || '未知天数';
      console.log(`   ${idx + 1}. ${dayInfo} - ${a.assignment_title} (${a.is_mandatory ? '必做' : '选做'})`);
    });

    // 查找包含"第二天下午"的特殊作业
    const w1d2Assignments = finalAssignments.filter(a => 
      a.description.includes('第二天下午') && !a.is_mandatory
    );
    console.log('\n🎯 第二天下午特殊选做作业:');
    w1d2Assignments.forEach(a => {
      console.log(`   - ${a.assignment_title}`);
    });

  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

simpleFinalExecute();