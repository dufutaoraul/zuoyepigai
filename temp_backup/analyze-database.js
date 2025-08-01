import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabase() {
  console.log('开始分析数据库表结构...\n');
  
  try {
    // 分析submissions表
    console.log('=== 分析submissions表 ===');
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .limit(10);
    
    if (submissionsError) {
      console.error('submissions表查询错误:', submissionsError);
    } else {
      console.log(`submissions表记录数: ${submissions?.length || 0}`);
      if (submissions && submissions.length > 0) {
        console.log('表结构字段:', Object.keys(submissions[0]));
        console.log('示例记录:', JSON.stringify(submissions[0], null, 2));
      }
    }
    
    // 分析students表
    console.log('\n=== 分析students表 ===');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(10);
    
    if (studentsError) {
      console.error('students表查询错误:', studentsError);
    } else {
      console.log(`students表记录数: ${students?.length || 0}`);
      if (students && students.length > 0) {
        console.log('表结构字段:', Object.keys(students[0]));
        console.log('示例记录:', JSON.stringify(students[0], null, 2));
      }
    }
    
    // 分析assignments表
    console.log('\n=== 分析assignments表 ===');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(10);
    
    if (assignmentsError) {
      console.error('assignments表查询错误:', assignmentsError);
    } else {
      console.log(`assignments表记录数: ${assignments?.length || 0}`);
      if (assignments && assignments.length > 0) {
        console.log('表结构字段:', Object.keys(assignments[0]));
        console.log('示例记录:', JSON.stringify(assignments[0], null, 2));
      }
    }
    
    // 获取总记录数
    console.log('\n=== 获取总记录数 ===');
    
    const { count: submissionsCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });
    console.log(`submissions总记录数: ${submissionsCount}`);
    
    const { count: studentsCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    console.log(`students总记录数: ${studentsCount}`);
    
    const { count: assignmentsCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true });
    console.log(`assignments总记录数: ${assignmentsCount}`);
    
    // 检查空字段和数据质量
    console.log('\n=== 检查数据质量 ===');
    
    // 检查submissions表的空字段
    const { data: submissionsWithNulls } = await supabase
      .from('submissions')
      .select('*')
      .or('feedback.is.null,attachments_url.is.null');
    
    console.log(`submissions表中有空字段的记录数: ${submissionsWithNulls?.length || 0}`);
    
    // 联表查询，展示完整信息
    console.log('\n=== 联表查询示例 ===');
    const { data: joinedData, error: joinError } = await supabase
      .from('submissions')
      .select(`
        submission_id,
        submission_date,
        status,
        feedback,
        students (
          student_id,
          student_name
        ),
        assignments (
          assignment_id,
          day_number,
          assignment_title,
          is_mandatory,
          description
        )
      `)
      .order('submission_date', { ascending: false })
      .limit(5);
    
    if (joinError) {
      console.error('联表查询错误:', joinError);
    } else {
      console.log('联表查询结果（最新5条）:');
      joinedData?.forEach((record, index) => {
        console.log(`\n记录 ${index + 1}:`);
        console.log(`  学员: ${record.students?.student_name} (${record.students?.student_id})`);
        console.log(`  作业: 第${record.assignments?.day_number}天 - ${record.assignments?.assignment_title}`);
        console.log(`  提交时间: ${record.submission_date}`);
        console.log(`  状态: ${record.status}`);
        console.log(`  反馈: ${record.feedback ? record.feedback.substring(0, 100) + '...' : '无反馈'}`);
      });
    }
    
  } catch (error) {
    console.error('数据库分析出错:', error);
  }
}

// 运行分析
analyzeDatabase();