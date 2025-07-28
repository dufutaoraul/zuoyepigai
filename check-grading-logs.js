const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkGradingStatus() {
  console.log('🔍 检查批改状态和日志...');
  
  try {
    // 1. 查看最新的提交记录
    console.log('1. 查看最新的提交记录:');
    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(assignment_title, description),
        student:students(student_name)
      `)
      .order('submission_date', { ascending: false })
      .limit(5);

    if (submissionError) {
      console.error('❌ 查询提交记录失败:', submissionError);
      return;
    }

    if (submissions && submissions.length > 0) {
      console.log(`找到 ${submissions.length} 条最新提交记录:`);
      
      submissions.forEach((submission, index) => {
        console.log(`\n${index + 1}. 提交记录:`);
        console.log(`   学员: ${submission.student?.student_name || '未知'}`);
        console.log(`   作业: ${submission.assignment?.assignment_title || '未知'}`);
        console.log(`   状态: ${submission.status}`);
        console.log(`   反馈: ${submission.feedback || '无反馈'}`);
        console.log(`   提交时间: ${submission.submission_date}`);
        console.log(`   附件: ${submission.attachment_urls ? JSON.parse(submission.attachment_urls).length : 0} 个文件`);
        
        // 特别标记批改中的记录
        if (submission.status === '批改中') {
          console.log('   ⚠️ 此记录仍在批改中！');
        }
      });
    } else {
      console.log('❌ 没有找到提交记录');
      return;
    }

    // 2. 检查环境变量配置
    console.log('\n2. 检查AI批改配置:');
    
    // 模拟检查环境变量 (我们无法直接访问服务器环境变量)
    console.log('豆包API配置状态: 需要在Netlify中检查');
    console.log('模型ID: ep-20250524195324-l4t8t');
    
    // 3. 查找批改中的记录并尝试手动触发批改
    const pendingSubmissions = submissions.filter(s => s.status === '批改中');
    
    if (pendingSubmissions.length > 0) {
      console.log(`\n3. 发现 ${pendingSubmissions.length} 条待批改记录:`);
      
      pendingSubmissions.forEach((submission, index) => {
        console.log(`\n待批改记录 ${index + 1}:`);
        console.log(`   submission_id: ${submission.submission_id}`);
        console.log(`   student_id: ${submission.student_id}`);
        console.log(`   assignment_id: ${submission.assignment_id}`);
        
        if (submission.attachment_urls) {
          const urls = JSON.parse(submission.attachment_urls);
          console.log(`   图片URLs:`);
          urls.forEach((url, urlIndex) => {
            console.log(`     ${urlIndex + 1}. ${url}`);
          });
        }
      });
      
      console.log('\n💡 解决方案建议:');
      console.log('1. 检查Netlify环境变量是否配置了DOUBAO_API_KEY');
      console.log('2. 检查Netlify Functions部署是否成功');
      console.log('3. 查看Netlify Function执行日志');
      console.log('4. 手动重新触发批改API');
      
    } else {
      console.log('\n✅ 没有发现待批改的记录');
    }

  } catch (error) {
    console.error('❌ 检查过程失败:', error);
  }
}

checkGradingStatus();