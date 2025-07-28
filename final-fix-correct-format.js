const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalFixCorrectFormat() {
  console.log('🚀 最终修复 - 严格按Excel原始格式...');
  
  try {
    // 1. 重建表结构
    console.log('1. 重建assignments表结构...');
    
    // 通过RPC执行SQL
    const recreateTableSQL = `
      -- 删除现有表
      DROP TABLE IF EXISTS assignments CASCADE;
      DROP TABLE IF EXISTS submissions CASCADE;
      
      -- 重新创建assignments表，使用正确字段
      CREATE TABLE assignments (
        assignment_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        day_text TEXT,  -- 存储"第一周第一天"原始格式
        assignment_title TEXT NOT NULL,
        is_mandatory BOOLEAN DEFAULT FALSE,
        description TEXT,
        assignment_category TEXT DEFAULT 'Regular_Optional',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 重新创建submissions表
      CREATE TABLE submissions (
        submission_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id TEXT NOT NULL,
        assignment_id uuid NOT NULL REFERENCES assignments(assignment_id),
        submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        attachments_url TEXT[],
        status TEXT DEFAULT '批改中',
        feedback TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建索引
      CREATE INDEX idx_assignments_day_text ON assignments(day_text);
      CREATE INDEX idx_assignments_mandatory ON assignments(is_mandatory);
      CREATE INDEX idx_assignments_category ON assignments(assignment_category);
      CREATE INDEX idx_submissions_student_id ON submissions(student_id);
      CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
    `;

    // 分步执行SQL
    const sqlCommands = [
      'DROP TABLE IF EXISTS assignments CASCADE;',
      'DROP TABLE IF EXISTS submissions CASCADE;',
      `CREATE TABLE assignments (
        assignment_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        day_text TEXT,
        assignment_title TEXT NOT NULL,
        is_mandatory BOOLEAN DEFAULT FALSE,
        description TEXT,
        assignment_category TEXT DEFAULT 'Regular_Optional',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      `CREATE TABLE submissions (
        submission_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id TEXT NOT NULL,
        assignment_id uuid NOT NULL REFERENCES assignments(assignment_id),
        submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        attachments_url TEXT[],
        status TEXT DEFAULT '批改中',
        feedback TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    ];

    for (const sql of sqlCommands) {
      try {
        await supabase.rpc('exec_sql', { sql });
        console.log('✅ 执行SQL成功');
      } catch (error) {
        console.log('执行SQL:', error.message);
      }
    }

    // 等待一下让表结构生效
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. 读取Excel数据
    console.log('2. 读取Excel数据...');
    const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`发现 ${data.length} 个作业`);
    console.log('原始天数格式示例:', data[0]['第几天']);

    // 3. 处理数据 - 严格保持原始格式
    console.log('3. 处理数据 - 保持Excel完全原始格式...');
    const assignments = data.map((row, index) => {
      const originalDayText = row['第几天'] || '';  // 完全保持原始格式
      const title = row['具体作业'] || '';
      const typeText = row['必做/选做'] || '';
      const isMandatory = typeText.includes('必做');
      const description = row['作业详细要求'] || '';
      
      // 根据原始天数文本确定类别
      let category = 'Regular_Optional';
      if (isMandatory) {
        category = 'Mandatory';
      } else if (originalDayText.includes('第二天下午')) {
        category = 'W1D2_Afternoon_Optional';
      }
      
      return {
        day_text: originalDayText,  // 严格保持原始格式！
        assignment_title: title,
        is_mandatory: isMandatory,
        description: description,
        assignment_category: category
      };
    });

    console.log('处理示例:');
    console.log(`  天数: "${assignments[0].day_text}"`);
    console.log(`  标题: "${assignments[0].assignment_title}"`);
    console.log(`  类别: ${assignments[0].assignment_category}`);

    // 4. 插入数据
    console.log('4. 插入数据...');
    const batchSize = 10;
    let successCount = 0;
    
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      const { data: insertData, error: insertError } = await supabase
        .from('assignments')
        .insert(batch);
      
      if (insertError) {
        console.error(`插入批次 ${i}-${i + batch.length} 失败:`, insertError.message);
        continue;
      }
      
      successCount += batch.length;
      console.log(`✅ 插入批次 ${i + 1}-${i + batch.length}`);
    }

    // 5. 验证结果
    console.log('5. 验证最终结果...');
    const { data: finalAssignments, error: fetchError } = await supabase
      .from('assignments')
      .select('day_text, assignment_title, is_mandatory, assignment_category')
      .order('created_at');

    if (fetchError) {
      console.error('验证失败:', fetchError);
      return;
    }

    console.log('\n🎉 最终修复完成！');
    console.log(`📊 成功插入: ${finalAssignments.length} 个作业`);
    
    // 统计分类
    const mandatory = finalAssignments.filter(a => a.assignment_category === 'Mandatory').length;
    const w1d2 = finalAssignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional').length;
    const regular = finalAssignments.filter(a => a.assignment_category === 'Regular_Optional').length;
    
    console.log(`📊 必做作业: ${mandatory} 个`);
    console.log(`📊 第二天下午选做: ${w1d2} 个`);
    console.log(`📊 其他选做: ${regular} 个`);

    // 显示天数格式示例
    console.log('\n📅 天数格式验证（前10个）:');
    finalAssignments.slice(0, 10).forEach((a, idx) => {
      console.log(`   ${idx + 1}. "${a.day_text}" - ${a.assignment_title}`);
    });

    // 显示特殊作业
    const specialAssignments = finalAssignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional');
    console.log('\n🎯 第二天下午特殊选做作业:');
    specialAssignments.forEach(a => {
      console.log(`   - "${a.day_text}" - ${a.assignment_title}`);
    });

    // 统计所有天数格式
    const dayTextStats = {};
    finalAssignments.forEach(a => {
      if (a.day_text) {
        dayTextStats[a.day_text] = (dayTextStats[a.day_text] || 0) + 1;
      }
    });
    
    console.log('\n📊 完整天数格式统计:');
    Object.entries(dayTextStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dayText, count]) => {
        console.log(`   "${dayText}": ${count} 个作业`);
      });

  } catch (error) {
    console.error('❌ 最终修复失败:', error);
  }
}

finalFixCorrectFormat();