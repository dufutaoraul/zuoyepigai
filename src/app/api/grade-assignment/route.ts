import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { studentId, assignmentId, attachmentUrls } = await request.json();

    if (!studentId || !assignmentId || !attachmentUrls) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

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
      return NextResponse.json({ error: '更新批改结果失败' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      result: gradingResult 
    });

  } catch (error) {
    console.error('Grading error:', error);
    return NextResponse.json({ error: '批改过程出错' }, { status: 500 });
  }
}

async function gradeWithDouBaoAI(attachmentUrls: string[], assignmentId: string) {
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

    // 这里是豆包AI调用的示例代码
    // 实际使用时需要替换为真实的豆包API调用
    const douBaoApiKey = process.env.DOUBAO_API_KEY;
    
    if (!douBaoApiKey) {
      // 如果没有配置API密钥，返回模拟结果
      console.log('DouBao API key not configured, using mock result');
      return {
        status: Math.random() > 0.3 ? '合格' : '不合格',
        feedback: '这是模拟的批改反馈。在实际环境中，这里会是豆包AI的真实批改结果。'
      };
    }

    // 豆包AI API调用示例（需要根据实际API文档调整）
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${douBaoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'doubao-vision',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的作业批改助手。请根据作业要求批改学生提交的作业图片，并给出"合格"或"不合格"的评价以及具体的批改意见。

作业标题: ${assignment.assignment_title}
作业要求: ${assignment.description}

请你：
1. 仔细查看所有提交的图片
2. 根据作业要求判断是否达标
3. 给出"合格"或"不合格"的结论
4. 提供具体的批改意见和建议

输出格式应该是JSON格式：
{
  "status": "合格" 或 "不合格",
  "feedback": "具体的批改意见"
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
      })
    });

    if (!response.ok) {
      throw new Error(`DouBao API error: ${response.status}`);
    }

    const result = await response.json();
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
    // 出错时返回默认结果
    return {
      status: '批改中',
      feedback: '批改过程中出现错误，请联系管理员'
    };
  }
}