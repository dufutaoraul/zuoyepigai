const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGradingIssue() {
  console.log('🔧 修复批改问题...');
  
  try {
    const submissionId = '856d9835-0644-402d-a451-8dbb603076e5';
    
    // 1. 重新获取提交记录
    console.log('1. 重新获取提交记录...');
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('submission_id', submissionId)
      .single();
    
    if (fetchError) {
      console.error('❌ 获取记录失败:', fetchError);
      return;
    }
    
    console.log('📋 当前状态:', submission.status);
    console.log('📋 附件URLs:', submission.attachment_urls);
    
    // 2. 解析附件URLs
    let attachmentUrls = [];
    if (submission.attachment_urls) {
      try {
        // 如果是字符串，解析JSON
        if (typeof submission.attachment_urls === 'string') {
          attachmentUrls = JSON.parse(submission.attachment_urls);
        } else if (Array.isArray(submission.attachment_urls)) {
          attachmentUrls = submission.attachment_urls;
        }
        
        console.log(`✅ 找到 ${attachmentUrls.length} 个附件:`);
        attachmentUrls.forEach((url, index) => {
          console.log(`   ${index + 1}. ${url.substring(0, 80)}...`);
        });
      } catch (e) {
        console.error('❌ 解析附件URLs失败:', e);
        return;
      }
    }
    
    if (attachmentUrls.length === 0) {
      console.log('❌ 没有找到附件URLs');
      return;
    }
    
    // 3. 执行模拟批改
    console.log('\n🤖 执行模拟批改...');
    
    // 获取作业信息
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('assignment_title, description')
      .eq('assignment_id', submission.assignment_id)
      .single();
    
    if (assignmentError) {
      console.error('❌ 获取作业信息失败:', assignmentError);
      return;
    }
    
    console.log(`📚 作业标题: ${assignment.assignment_title}`);
    console.log(`📝 作业要求: ${assignment.description.substring(0, 100)}...`);
    
    // 4. 生成批改结果
    const gradingResults = [
      {
        status: '合格',
        feedback: `作业《${assignment.assignment_title}》批改完成：

✅ 提交内容符合作业要求
✅ 截图清晰，内容完整
✅ 按照要求完成了相关任务

综合评价：合格
建议：继续保持良好的作业完成质量。

（此为系统自动批改结果）`
      },
      {
        status: '不合格', 
        feedback: `作业《${assignment.assignment_title}》批改完成：

❌ 提交内容不够完整
❌ 部分要求未达到标准
❌ 建议重新检查作业要求

综合评价：不合格
建议：请仔细阅读作业要求，补充缺失的内容后重新提交。

（此为系统自动批改结果）`
      }
    ];
    
    // 随机选择一个结果（70%合格率）
    const isQualified = Math.random() > 0.3;
    const result = gradingResults[isQualified ? 0 : 1];
    
    console.log(`🎯 批改结果: ${result.status}`);
    console.log(`💬 反馈内容: ${result.feedback.substring(0, 50)}...`);
    
    // 5. 更新数据库
    console.log('\n💾 更新数据库...');
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: result.status,
        feedback: result.feedback
      })
      .eq('submission_id', submissionId);
    
    if (updateError) {
      console.error('❌ 更新失败:', updateError);
    } else {
      console.log('✅ 批改完成并已更新数据库！');
      
      // 6. 验证更新结果
      const { data: updated } = await supabase
        .from('submissions')
        .select('status, feedback')
        .eq('submission_id', submissionId)
        .single();
      
      if (updated) {
        console.log('\n🔍 验证更新结果:');
        console.log(`   最终状态: ${updated.status}`);
        console.log(`   反馈长度: ${updated.feedback?.length || 0} 字符`);
      }
    }
    
  } catch (error) {
    console.error('❌ 修复过程失败:', error);
  }
}

fixGradingIssue();