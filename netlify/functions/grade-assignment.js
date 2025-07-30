// Netlify Functions 显式 API 路由
import { supabase } from './lib/supabase.js';

export async function handler(event, context) {
  // 只处理 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };
  }

  try {
    console.log('AI批改API被调用');
    
    const { studentId, assignmentId, attachmentUrls } = JSON.parse(event.body);
    console.log('请求参数:', { studentId, assignmentId, attachmentCount: attachmentUrls?.length });

    if (!studentId || !assignmentId || !attachmentUrls || attachmentUrls.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '缺少必要参数' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // 1. 获取作业要求描述
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('description, assignment_title')
      .eq('assignment_id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      console.error('获取作业信息失败:', assignmentError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '获取作业信息失败' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log('作业信息:', { title: assignmentData.assignment_title, description: assignmentData.description });

    // 2. 调用DeepSeek AI进行批改
    const gradingResult = await callDeepSeekAPI(assignmentData.description, attachmentUrls, assignmentData.assignment_title);
    
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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '更新批改结果失败' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log('数据库更新成功');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        result: gradingResult 
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('API错误:', error);
    
    // 如果出错，将状态更新为批改失败
    try {
      const { studentId, assignmentId } = JSON.parse(event.body);
      await supabase
        .from('submissions')
        .update({
          status: '批改失败',
          feedback: `批改过程出错：${error.message || '未知错误'}`
        })
        .eq('student_id', studentId)
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (dbError) {
      console.error('更新失败状态时出错:', dbError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'AI批改失败',
        details: error.message || '未知错误'
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}

// 调用DeepSeek AI API进行批改
async function callDeepSeekAPI(assignmentDescription, attachmentUrls, assignmentTitle) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const modelId = process.env.DEEPSEEK_MODEL_ID;
  const apiUrl = process.env.DEEPSEEK_API_URL;

  console.log('DeepSeek API配置检查:', {
    hasApiKey: !!apiKey,
    hasModelId: !!modelId,
    hasApiUrl: !!apiUrl,
    apiKeyPreview: apiKey ? apiKey.substring(0, 15) + '...' : 'null',
    modelId: modelId,
    apiUrl: apiUrl,
    attachmentCount: attachmentUrls.length
  });

  if (!apiKey || !modelId || !apiUrl) {
    const missing = [];
    if (!apiKey) missing.push('DEEPSEEK_API_KEY');
    if (!modelId) missing.push('DEEPSEEK_MODEL_ID');
    if (!apiUrl) missing.push('DEEPSEEK_API_URL');
    throw new Error(`DeepSeek API配置缺失: ${missing.join(', ')}`);
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
  const messageContent = [
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

  console.log('调用DeepSeek API开始');
  console.log('请求URL:', apiUrl);
  console.log('请求头Authorization:', `Bearer ${apiKey.substring(0, 20)}...`);
  console.log('请求体大小:', JSON.stringify(requestBody).length, 'bytes');
  console.log('消息内容数量:', requestBody.messages[0].content.length);

  try {
    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      // 增加超时设置
      signal: AbortSignal.timeout(30000) // 30秒超时
    });
    
    const responseTime = Date.now() - startTime;
    console.log('DeepSeek API响应时间:', responseTime, 'ms');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API调用失败:', response.status, errorText);
      throw new Error(`DeepSeek API调用失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('DeepSeek API响应:', result);

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('DeepSeek API返回格式异常');
    }

    const aiResponse = result.choices[0].message.content;
    
    // 解析AI响应，判断是否合格
    const isQualified = aiResponse.includes('合格') && !aiResponse.includes('不合格');
    
    return {
      status: isQualified ? '合格' : '不合格',
      feedback: aiResponse
    };

  } catch (error) {
    console.error('DeepSeek API调用异常:', error);
    throw new Error(`AI批改失败: ${error.message || '未知错误'}`);
  }
}