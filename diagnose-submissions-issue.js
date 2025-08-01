import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseSubmissionsIssue() {
  console.log('=== 诊断submissions表问题 ===\n');
  
  try {
    // 1. 检查submissions表当前字段
    console.log('📊 1. 检查submissions表当前字段:');
    console.log('='.repeat(50));
    
    const { data: submissionSample, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);
    
    if (subError) {
      console.error('❌ submissions表查询失败:', subError);
    } else if (submissionSample && submissionSample.length > 0) {
      const fields = Object.keys(submissionSample[0]);
      console.log(`✅ submissions表字段总数: ${fields.length}`);
      console.log('当前字段:');
      fields.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field}`);
      });
      
      // 检查新增字段是否存在
      const expectedNewFields = ['submission_content', 'submission_type', 'ai_score', 'can_graduate', 'graduation_reason'];
      console.log('\n新增字段检查:');
      expectedNewFields.forEach(field => {
        const exists = fields.includes(field);
        console.log(`  ${exists ? '✅' : '❌'} ${field}: ${exists ? '已存在' : '未找到'}`);
      });
      
      console.log('\n样本数据:');
      console.log(JSON.stringify(submissionSample[0], null, 2));
    } else {
      console.log('❌ submissions表无数据');
    }
    
    // 2. 检查students表
    console.log('\n\n👥 2. 检查students表:');
    console.log('='.repeat(50));
    
    const { data: studentsSample, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(3);
    
    if (studentsError) {
      console.error('❌ students表查询失败:', studentsError);
    } else {
      console.log(`✅ students表数据量: ${studentsSample?.length || 0}`);
      if (studentsSample && studentsSample.length > 0) {
        console.log('样本数据:');
        studentsSample.forEach((student, index) => {
          console.log(`  ${index + 1}. ID: ${student.student_id}, 姓名: ${student.student_name}`);
        });
      }
    }
    
    // 3. 检查assignments表
    console.log('\n\n📚 3. 检查assignments表:');
    console.log('='.repeat(50));
    
    const { data: assignmentsSample, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(3);
    
    if (assignmentsError) {
      console.error('❌ assignments表查询失败:', assignmentsError);
    } else {
      console.log(`✅ assignments表数据量: ${assignmentsSample?.length || 0}`);
      if (assignmentsSample && assignmentsSample.length > 0) {
        console.log('样本数据:');
        assignmentsSample.forEach((assignment, index) => {
          console.log(`  ${index + 1}. ID: ${assignment.assignment_id}, 标题: ${assignment.assignment_title}, 第几天: ${assignment.day_number}`);
        });
      }
    }
    
    // 4. 测试关联查询 - 用传统的JOIN方式
    console.log('\n\n🔗 4. 测试传统JOIN关联查询:');
    console.log('='.repeat(50));
    
    // 使用rpc或者直接的SQL查询来测试关联
    const { data: joinData, error: joinError } = await supabase
      .from('submissions')
      .select(`
        submission_id,
        student_id,
        assignment_id,
        submission_date,
        status,
        feedback,
        students!inner(student_id, student_name),
        assignments!inner(assignment_id, assignment_title, day_number, is_mandatory, description)
      `)
      .limit(2);
    
    if (joinError) {
      console.error('❌ 关联查询失败:', joinError);
      
      // 尝试替代方案：手动关联
      console.log('\n尝试手动关联查询...');
      const { data: submissions } = await supabase.from('submissions').select('*').limit(2);
      
      if (submissions && submissions.length > 0) {
        console.log('手动关联结果:');
        for (const submission of submissions) {
          // 查找对应的学员
          const { data: student } = await supabase
            .from('students')
            .select('student_id, student_name')
            .eq('student_id', submission.student_id)
            .single();
          
          // 查找对应的作业
          const { data: assignment } = await supabase
            .from('assignments')
            .select('assignment_id, assignment_title, day_number, is_mandatory, description')
            .eq('assignment_id', submission.assignment_id)
            .single();
          
          console.log(`\n📋 提交记录:`);
          console.log(`  submission_id: ${submission.submission_id}`);
          console.log(`  学号: ${student?.student_id || '未找到'}`);
          console.log(`  姓名: ${student?.student_name || '未找到'}`);
          console.log(`  第几天: ${assignment?.day_number || '未找到'}`);
          console.log(`  作业名称: ${assignment?.assignment_title || '未找到'}`);
          console.log(`  是否必做: ${assignment?.is_mandatory ? '必做' : '选做'}`);
          console.log(`  状态: ${submission.status}`);
          console.log(`  提交时间: ${submission.submission_date}`);
        }
      }
    } else {
      console.log(`✅ 关联查询成功，获得 ${joinData?.length || 0} 条记录`);
      joinData?.forEach((record, index) => {
        console.log(`\n📋 记录 ${index + 1}:`);
        console.log(`  学号: ${record.students?.student_id || '无'}`);
        console.log(`  姓名: ${record.students?.student_name || '无'}`);
        console.log(`  第几天: ${record.assignments?.day_number || '无'}`);
        console.log(`  作业名称: ${record.assignments?.assignment_title || '无'}`);
        console.log(`  状态: ${record.status}`);
      });
    }
    
    // 5. 检查外键关系
    console.log('\n\n🔑 5. 检查外键关系:');
    console.log('='.repeat(50));
    
    const { data: submissions } = await supabase.from('submissions').select('student_id, assignment_id').limit(5);
    
    if (submissions && submissions.length > 0) {
      console.log('检查外键匹配情况:');
      
      for (const submission of submissions.slice(0, 2)) {
        // 检查student_id是否在students表中存在
        const { data: studentExists } = await supabase
          .from('students')
          .select('student_id')
          .eq('student_id', submission.student_id);
        
        // 检查assignment_id是否在assignments表中存在
        const { data: assignmentExists } = await supabase
          .from('assignments')
          .select('assignment_id')
          .eq('assignment_id', submission.assignment_id);
        
        console.log(`\n提交记录外键检查:`);
        console.log(`  student_id: ${submission.student_id} - ${studentExists && studentExists.length > 0 ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`  assignment_id: ${submission.assignment_id} - ${assignmentExists && assignmentExists.length > 0 ? '✅ 存在' : '❌ 不存在'}`);
      }
    }
    
    console.log('\n\n🔍 问题总结:');
    console.log('='.repeat(50));
    console.log('基于以上检查，可能的问题包括:');
    console.log('1. 新增字段未成功添加到数据库');
    console.log('2. 关联查询语法不正确');
    console.log('3. 外键关系数据不匹配');
    console.log('4. Supabase的关联查询需要设置正确的关系');
    
  } catch (error) {
    console.error('诊断过程中出错:', error);
  }
}

// 执行诊断
diagnoseSubmissionsIssue();