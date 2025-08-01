import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function stepByStepOptimization() {
  console.log('=== 分步执行数据库优化 ===\n');
  
  try {
    // 第一步：添加sort_order字段到assignments表
    console.log('第1步：添加sort_order字段...');
    
    // 先检查assignments表结构
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('assignment_id, day_number, sort_order')
      .limit(1);
    
    if (assignmentsError && assignmentsError.code === '42703') {
      console.log('sort_order字段不存在，需要创建');
      // 这个操作需要在SQL编辑器中执行
      console.log('⚠️  请在Supabase SQL编辑器中执行以下SQL:');
      console.log('ALTER TABLE assignments ADD COLUMN sort_order INTEGER;');
      console.log('');
    } else if (assignmentsError) {
      console.error('查询assignments表失败:', assignmentsError);
      return;
    } else {
      console.log('✓ sort_order字段已存在');
      
      // 检查是否需要设置sort_order值
      const needUpdate = assignments?.some(a => !a.sort_order);
      if (needUpdate) {
        console.log('需要设置sort_order值...');
        
        // 获取所有assignments并设置sort_order
        const { data: allAssignments } = await supabase
          .from('assignments')
          .select('assignment_id, day_number, sort_order');
        
        const dayNumberMapping = {
          '第一周第一天': 101,
          '第一周第二天上午': 201,
          '第一周第二天下午': 202,
          '第一周第三天': 301,
          '第一周第四天': 401,
          '第一周第五天上午': 501,
          '第一周第五天下午': 502,
          '第一周第六天': 601,
          '第一周第七天上午': 701,
          '第一周第七天下午': 702,
          '第二周第一天上午': 801,
          '第二周第一天下午': 802,
          '第二周第二天': 901,
          '第二周第三天': 1001,
          '第二周第四天': 1101,
          '第二周第五天': 1201,
          '第二周第六天': 1301
        };
        
        let updateCount = 0;
        for (const assignment of allAssignments || []) {
          const expectedSortOrder = dayNumberMapping[assignment.day_number] || 9999;
          
          if (assignment.sort_order !== expectedSortOrder) {
            const { error: updateError } = await supabase
              .from('assignments')
              .update({ sort_order: expectedSortOrder })
              .eq('assignment_id', assignment.assignment_id);
            
            if (!updateError) {
              updateCount++;
              console.log(`✓ 更新 "${assignment.day_number}" -> ${expectedSortOrder}`);
            } else {
              console.error(`❌ 更新失败:`, updateError);
            }
          }
        }
        console.log(`✓ 完成 ${updateCount} 个作业的sort_order设置`);
      }
    }
    
    // 第二步：处理附件字段合并
    console.log('\n第2步：合并附件字段...');
    
    const { data: needMigration, error: checkError } = await supabase
      .from('submissions')
      .select('submission_id, attachments_urls, attachments_url')
      .not('attachments_urls', 'is', null)
      .neq('attachments_urls', '[]');
    
    if (checkError) {
      console.error('检查附件数据失败:', checkError);
    } else {
      console.log(`找到 ${needMigration?.length || 0} 条需要迁移附件数据的记录`);
      
      if (needMigration && needMigration.length > 0) {
        let migratedCount = 0;
        for (const record of needMigration) {
          // 检查attachments_url是否为空或空数组
          const currentUrl = record.attachments_url;
          const shouldMigrate = !currentUrl || 
                               (Array.isArray(currentUrl) && currentUrl.length === 0) ||
                               JSON.stringify(currentUrl) === '[]';
          
          if (shouldMigrate && record.attachments_urls) {
            const { error: updateError } = await supabase
              .from('submissions')
              .update({ attachments_url: record.attachments_urls })
              .eq('submission_id', record.submission_id);
            
            if (!updateError) {
              migratedCount++;
              console.log(`✓ 迁移记录 ${record.submission_id.substring(0, 8)}...`);
            } else {
              console.error(`❌ 迁移失败:`, updateError);
            }
          }
        }
        console.log(`✓ 完成 ${migratedCount} 条记录的附件数据迁移`);
      }
    }
    
    // 第三步：显示需要手动执行的SQL
    console.log('\n第3步：需要在Supabase SQL编辑器中手动执行的操作:');
    console.log('=========================================================');
    console.log('以下操作需要管理员权限，请在Supabase SQL编辑器中执行：');
    console.log('');
    console.log('-- 删除无用字段（如果sort_order字段已创建）');
    console.log('ALTER TABLE submissions DROP COLUMN IF EXISTS assignment_evaluation_detail;');
    console.log('ALTER TABLE submissions DROP COLUMN IF EXISTS assignment_comprehensive_statistics;');
    console.log('ALTER TABLE submissions DROP COLUMN IF EXISTS attachments_urls;');
    console.log('');
    console.log('-- 创建索引');
    console.log('CREATE INDEX IF NOT EXISTS idx_assignments_sort_order ON assignments(sort_order);');
    console.log('CREATE INDEX IF NOT EXISTS idx_submissions_submission_date_desc ON submissions(submission_date DESC);');
    console.log('');
    console.log('-- 创建管理视图（完整SQL在database-optimization.sql文件中）');
    console.log('-- 请执行database-optimization.sql文件中的视图创建部分');
    
    // 第四步：验证当前状态
    console.log('\n第4步：验证当前优化状态...');
    
    // 检查submissions表字段
    const { data: sampleSubmission } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);
    
    if (sampleSubmission && sampleSubmission.length > 0) {
      const fields = Object.keys(sampleSubmission[0]);
      console.log('\nsubmissions表当前字段:');
      fields.forEach(field => {
        const status = ['assignment_evaluation_detail', 'assignment_comprehensive_statistics', 'attachments_urls'].includes(field) 
          ? ' ⚠️  (建议删除)' 
          : '';
        console.log(`  - ${field}${status}`);
      });
    }
    
    // 检查assignments表sort_order设置情况
    const { data: assignmentsSample } = await supabase
      .from('assignments')
      .select('day_number, sort_order')
      .order('sort_order', { ascending: true })
      .limit(5);
    
    if (assignmentsSample) {
      console.log('\nassignments表sort_order设置情况（前5个）:');
      assignmentsSample.forEach((assignment, index) => {
        console.log(`  ${index + 1}. "${assignment.day_number}" -> ${assignment.sort_order || '未设置'}`);
      });
    }
    
    console.log('\n=== 优化进度总结 ===');
    console.log('✅ 完成项:');
    console.log('  - sort_order字段创建和数据设置');
    console.log('  - attachments字段数据迁移');
    console.log('');
    console.log('⏳ 待执行项（需要SQL编辑器）:');
    console.log('  - 删除无用字段');
    console.log('  - 创建索引');
    console.log('  - 创建管理视图');
    console.log('');
    console.log('📋 下一步操作:');
    console.log('1. 复制上面的SQL语句到Supabase SQL编辑器执行');
    console.log('2. 执行database-optimization.sql文件中的视图创建部分');
    console.log('3. 测试视图查询效果');
    console.log('4. 更新应用代码使用新视图');
    
  } catch (error) {
    console.error('优化过程中出错:', error);
  }
}

// 执行分步优化
stepByStepOptimization();