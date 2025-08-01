import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeSubmissionsStructure() {
  console.log('=== 分析当前submissions表结构 ===\n');
  
  try {
    // 1. 获取submissions表的详细样本数据
    console.log('📊 当前submissions表字段分析:');
    console.log('='.repeat(50));
    
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('查询失败:', error);
      return;
    }
    
    if (submissions && submissions.length > 0) {
      const fields = Object.keys(submissions[0]);
      console.log(`当前字段数量: ${fields.length}`);
      console.log('当前字段列表:');
      fields.forEach((field, index) => {
        const sampleValue = submissions[0][field];
        console.log(`  ${index + 1}. ${field}: ${typeof sampleValue} - "${String(sampleValue).substring(0, 50)}..."`);
      });
      
      console.log('\n📋 样本数据:');
      submissions.forEach((submission, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  submission_id: ${submission.submission_id}`);
        console.log(`  student_id: ${submission.student_id}`);
        console.log(`  assignment_id: ${submission.assignment_id}`);
        console.log(`  submission_date: ${submission.submission_date}`);
        console.log(`  status: ${submission.status}`);
        console.log(`  feedback: ${submission.feedback ? submission.feedback.substring(0, 100) + '...' : '无'}`);
        console.log(`  attachments_url: ${submission.attachments_url ? JSON.stringify(submission.attachments_url).substring(0, 100) + '...' : '无'}`);
      });
    }
    
    // 2. 分析需要显示的信息和当前缺失的字段
    console.log('\n\n🎯 用户需求分析:');
    console.log('='.repeat(50));
    console.log('用户希望在submissions表中显示：');
    console.log('1. 学号 - 需要关联students表');
    console.log('2. 姓名 - 需要关联students表');
    console.log('3. 第几天 - 需要关联assignments表');
    console.log('4. 作业名称 - 需要关联assignments表');
    console.log('5. 是否必做 - 需要关联assignments表');
    console.log('6. 作业详情 - 需要关联assignments表');
    console.log('7. 学员提交的作业内容 - 当前缺失字段');
    console.log('8. AI评估的作业结果 - 当前有feedback字段');
    console.log('9. 是否能够毕业及其原因 - 当前缺失字段');
    
    // 3. 测试联表查询当前可获得的信息
    console.log('\n\n🔍 当前联表查询可获得的信息:');
    console.log('='.repeat(50));
    
    const { data: joinedData, error: joinError } = await supabase
      .from('submissions')
      .select(`
        *,
        students (
          student_id,
          student_name
        ),
        assignments (
          day_number,
          assignment_title,
          is_mandatory,
          description
        )
      `)
      .limit(2);
    
    if (joinError) {
      console.error('联表查询失败:', joinError);
    } else {
      console.log('✅ 通过联表查询可以获得的信息:');
      joinedData?.forEach((record, index) => {
        console.log(`\n联表记录 ${index + 1}:`);
        console.log(`  学号: ${record.students?.student_id || '未知'}`);
        console.log(`  姓名: ${record.students?.student_name || '未知'}`);
        console.log(`  第几天: ${record.assignments?.day_number || '未知'}`);
        console.log(`  作业名称: ${record.assignments?.assignment_title || '未知'}`);
        console.log(`  是否必做: ${record.assignments?.is_mandatory ? '必做' : '选做'}`);
        console.log(`  作业详情: ${record.assignments?.description?.substring(0, 50) || '无'}...`);
        console.log(`  提交内容: ${record.attachments_url ? '有附件' : '无附件'} (需要新增专门字段)`);
        console.log(`  AI评估: ${record.feedback?.substring(0, 50) || '无评估'}...`);
        console.log(`  毕业状态: 缺失字段`);
      });
    }
    
    // 4. 识别缺失的关键字段
    console.log('\n\n❌ 识别缺失的关键字段:');
    console.log('='.repeat(50));
    console.log('需要新增的字段:');
    console.log('1. submission_content (TEXT) - 学员提交的作业内容文字描述');
    console.log('2. can_graduate (BOOLEAN) - 是否能够毕业');
    console.log('3. graduation_reason (TEXT) - 毕业/不毕业的原因');
    console.log('4. ai_score (INTEGER) - AI评分 (0-100)');
    console.log('5. submission_type (TEXT) - 提交类型 (文字/图片/文件等)');
    
    console.log('\n💡 建议的完整submissions表结构:');
    console.log('='.repeat(50));
    console.log('基础字段:');
    console.log('  - submission_id (UUID, 主键)');
    console.log('  - student_id (TEXT, 外键 -> students)');
    console.log('  - assignment_id (UUID, 外键 -> assignments)');
    console.log('  - submission_date (TIMESTAMP)');
    console.log('  - created_at, updated_at (TIMESTAMP)');
    console.log('');
    console.log('提交内容字段:');
    console.log('  - submission_content (TEXT) - 作业文字内容');
    console.log('  - attachments_url (JSONB) - 附件链接');
    console.log('  - submission_type (TEXT) - 提交类型');
    console.log('');
    console.log('评估结果字段:');
    console.log('  - status (TEXT) - 状态(合格/不合格/批改中)');
    console.log('  - feedback (TEXT) - AI详细反馈');
    console.log('  - ai_score (INTEGER) - AI评分');
    console.log('');
    console.log('毕业判定字段:');
    console.log('  - can_graduate (BOOLEAN) - 是否能毕业');
    console.log('  - graduation_reason (TEXT) - 毕业原因');
    
  } catch (error) {
    console.error('分析过程中出错:', error);
  }
}

// 执行分析
analyzeSubmissionsStructure();