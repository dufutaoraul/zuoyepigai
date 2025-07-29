import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('AI批改API被调用');
    
    const { studentId, assignmentId, attachmentUrls } = await request.json();
    console.log('请求参数:', { studentId, assignmentId, attachmentCount: attachmentUrls?.length });

    if (!studentId || !assignmentId || !attachmentUrls || attachmentUrls.length === 0) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 1. 获取作业要求描述
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('description, assignment_title')
      .eq('assignment_id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      console.error('获取作业信息失败:', assignmentError);
      return NextResponse.json({ error: '获取作业信息失败' }, { status: 500 });
    }

    console.log('作业信息:', { title: assignmentData.assignment_title, description: assignmentData.description });

    // 2. 调用豆包AI进行批改
    const gradingResult = await callDouBaoAPI(assignmentData.description, attachmentUrls, assignmentData.assignment_title);
    
    // 3. 更新数据库
    console.log('开始更新数据库，批改结果:', gradingResult);
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: gradingResult.status,
        feedback: gradingResult.feedback
      })
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('数据库更新失败:', updateError);
      return NextResponse.json({ error: '更新批改结果失败' }, { status: 500 });
    }

    console.log('数据库更新成功');

    return NextResponse.json({ 
      success: true, 
      result: gradingResult 
    });

  } catch (error) {
    console.error('API错误:', error);
    
    // 如果出错，将状态更新为批改失败
    try {
      await supabase
        .from('submissions')
        .update({
          status: '批改失败',
          feedback: `批改过程出错：${error instanceof Error ? error.message : '未知错误'}`
        })
        .eq('student_id', request.json().then(data => data.studentId))
        .eq('assignment_id', request.json().then(data => data.assignmentId))
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (dbError) {
      console.error('更新失败状态时出错:', dbError);
    }

    return NextResponse.json({ 
      error: 'AI批改失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 调用豆包AI API进行批改
async function callDouBaoAPI(assignmentDescription: string, attachmentUrls: string[], assignmentTitle: string) {
  const apiKey = process.env.DOUBAO_API_KEY;
  const modelId = process.env.DOUBAO_MODEL_ID;
  const apiUrl = process.env.DOUBAO_API_URL;

  if (!apiKey || !modelId || !apiUrl) {
    throw new Error('豆包API配置缺失');
  }

  // 构建优化的Prompt
  const prompt = `你是一个专业的作业批改老师。请根据以下作业要求判断学员提交的图片作业是否合格。

**作业标题**: ${assignmentTitle}

**详细作业要求**: 
${assignmentDescription}

**评判标准**:
- 请仔细查看学员提交的图片内容
- 判断是否符合上述作业要求
- 如果符合要求，返回"合格"，反馈内容只说"恭喜您，您的作业审核合格"
- 如果不符合要求，返回"不合格"，说明不合格原因并提出具体的修改意见

**重要**: 请严格按照要求进行评判，确保评判的公正性和准确性。

现在请批改学员提交的作业图片。`;

  // 构建消息内容，包含文本和图片
  const messageContent: any[] = [
    {
      type: "text",
      text: prompt
    }
  ];

  // 添加图片内容
  for (const imageUrl of attachmentUrls) {
    messageContent.push({
      type: "image_url",
      image_url: {
        url: imageUrl
      }
    });
  }

  const requestBody = {
    model: modelId,
    messages: [
      {
        role: "user",
        content: messageContent
      }
    ],
    max_tokens: 1000,
    temperature: 0.1
  };

  console.log('调用豆包API，请求体:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('豆包API调用失败:', response.status, errorText);
      throw new Error(`豆包API调用失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('豆包API响应:', result);

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('豆包API返回格式异常');
    }

    const aiResponse = result.choices[0].message.content;
    
    // 解析AI响应，判断是否合格
    const isQualified = aiResponse.includes('合格') && !aiResponse.includes('不合格');
    
    return {
      status: isQualified ? '合格' : '不合格',
      feedback: aiResponse
    };

  } catch (error) {
    console.error('豆包API调用异常:', error);
    throw new Error(`AI批改失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}