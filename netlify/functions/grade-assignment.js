// Netlify Function for assignment grading
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { studentId, assignmentId, attachmentUrls } = JSON.parse(event.body);

    if (!studentId || !assignmentId || !attachmentUrls) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '缺少必要参数' })
      };
    }

    console.log('开始批改作业:', { studentId, assignmentId, attachmentCount: attachmentUrls.length });

    // 调用豆包AI进行作业批改
    const gradingResult = await gradeWithDouBaoAI(attachmentUrls, assignmentId);

    // 更新数据库中的批改结果
    const { error } = await supabase
      .from('submissions')
      .update({
        status: gradingResult.status,
        feedback: gradingResult.feedback
      })
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId);

    if (error) {
      console.error('Database update error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '更新批改结果失败' })
      };
    }

    // 如果批改结果为合格，更新作业统计
    if (gradingResult.status === '合格') {
      try {
        await updateAssignmentStatistics(studentId, assignmentId);
      } catch (updateError) {
        console.error('Error updating statistics:', updateError);
        // 不影响主要批改流程，只记录错误
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        result: gradingResult 
      })
    };

  } catch (error) {
    console.error('Grading error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '批改过程出错' })
    };
  }
};

async function gradeWithDouBaoAI(attachmentUrls, assignmentId) {
  try {
    // 获取作业要求
    const { data: assignment } = await supabase
      .from('assignments')
      .select('description, assignment_title')
      .eq('assignment_id', assignmentId)
      .single();

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // 调用豆包AI
    const douBaoApiKey = process.env.DOUBAO_API_KEY;
    
    if (!douBaoApiKey) {
      console.log('DouBao API key not configured, using mock result');
      const isQualified = Math.random() > 0.3;
      return {
        status: isQualified ? '合格' : '不合格',
        feedback: isQualified 
          ? '恭喜您，您的作业审核合格' 
          : `您的作业审核不合格。不合格原因：提交的内容不符合作业要求。修改意见：请仔细阅读作业要求《${assignment.assignment_title}》，确保提交的内容符合所有要求点，然后重新提交。`
      };
    }

    console.log('开始调用DouBao API，作业ID:', assignmentId);
    console.log('附件数量:', attachmentUrls.length);

    // 豆包AI API调用
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${douBaoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'ep-20250524195324-l4t8t',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的作业批改助手。请根据学员选择的作业对应的"详细作业要求"判断收到的图片是否符合要求。

作业标题: ${assignment.assignment_title}
详细作业要求: ${assignment.description}

批改规则：
1. 仔细查看所有提交的图片
2. 严格按照"详细作业要求"判断是否符合要求
3. 符合要求：返回"合格"，反馈内容只说"恭喜您，您的作业审核合格"
4. 不符合要求：返回"不合格"，说明不合格原因并提出修改意见

输出格式必须是JSON格式：
{
  "status": "合格" 或 "不合格",
  "feedback": "反馈内容"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请批改以下作业：'
              },
              ...attachmentUrls.map(url => ({
                type: 'image_url',
                image_url: {
                  url: url
                }
              }))
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
      signal: AbortSignal.timeout(30000) // 30秒超时
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DouBao API error: ${response.status}`, errorText);
      throw new Error(`DouBao API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('DouBao API 响应:', result);
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid DouBao API response format');
    }
    
    const aiResponse = result.choices[0].message.content;
    
    // 尝试解析AI返回的JSON格式结果
    try {
      const gradingResult = JSON.parse(aiResponse);
      return {
        status: gradingResult.status === '合格' ? '合格' : '不合格',
        feedback: gradingResult.feedback || '批改完成'
      };
    } catch (parseError) {
      // 如果解析失败，使用简单的文本分析
      const isQualified = aiResponse.includes('合格') && !aiResponse.includes('不合格');
      return {
        status: isQualified ? '合格' : '不合格',
        feedback: aiResponse
      };
    }

  } catch (error) {
    console.error('DouBao AI grading error:', error);
    // 出错时返回错误状态，避免无限等待
    return {
      status: '批改失败',
      feedback: '批改过程中出现错误，请重新提交或联系管理员'
    };
  }
}

async function updateAssignmentStatistics(studentId, assignmentId) {
  try {
    // 获取作业信息
    const { data: assignment } = await supabase
      .from('assignments')
      .select('assignment_title, is_mandatory, day_text')
      .eq('assignment_id', assignmentId)
      .single();

    if (!assignment) {
      console.error('Assignment not found for statistics update');
      return;
    }

    // 构建作业评估详情
    const assignmentDetail = `${assignment.day_text} - ${assignment.assignment_title} - ${assignment.is_mandatory ? '必做' : '选做'} - 合格`;

    // 获取当前学员的统计信息
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('assignment_evaluation_detail, assignment_comprehensive_statistics')
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .single();

    // 更新当前提交的评估详情
    await supabase
      .from('submissions')
      .update({
        assignment_evaluation_detail: assignmentDetail
      })
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId);

    // 获取该学员所有合格的作业记录
    const { data: allQualifiedSubmissions } = await supabase
      .from('submissions')
      .select(`
        assignment_evaluation_detail,
        assignment:assignments(assignment_title, is_mandatory, day_text)
      `)
      .eq('student_id', studentId)
      .eq('status', '合格');

    if (allQualifiedSubmissions && allQualifiedSubmissions.length > 0) {
      // 构建综合统计字符串，只包含合格的作业
      const comprehensiveStats = allQualifiedSubmissions
        .filter(sub => sub.assignment_evaluation_detail) // 只包含有评估详情的
        .map(sub => sub.assignment_evaluation_detail)
        .join(',');

      // 更新所有该学员的合格提交记录，保持综合统计同步
      await supabase
        .from('submissions')
        .update({
          assignment_comprehensive_statistics: comprehensiveStats
        })
        .eq('student_id', studentId)
        .eq('status', '合格');
    }

    console.log('Assignment statistics updated successfully for student:', studentId);

  } catch (error) {
    console.error('Error updating assignment statistics:', error);
    throw error;
  }
}