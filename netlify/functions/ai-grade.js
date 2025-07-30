// Netlify Function 专门处理AI批改
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🚀 Netlify Function: AI批改开始');
  
  // CORS 头设置
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('📋 检查环境变量...');
    
    // 检查所有必需的环境变量
    const requiredEnvVars = {
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
      DEEPSEEK_MODEL_ID: process.env.DEEPSEEK_MODEL_ID,
      DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    console.log('📊 环境变量状态:', {
      DEEPSEEK_API_KEY: !!requiredEnvVars.DEEPSEEK_API_KEY,
      DEEPSEEK_MODEL_ID: !!requiredEnvVars.DEEPSEEK_MODEL_ID,
      DEEPSEEK_API_URL: !!requiredEnvVars.DEEPSEEK_API_URL,
      SUPABASE_URL: !!requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_KEY: !!requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY
    });

    // 检查缺失的环境变量
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('❌ 缺失环境变量:', missingVars);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Configuration Error',
          details: `Missing environment variables: ${missingVars.join(', ')}`,
          missingVars
        })
      };
    }

    // 解析请求体
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { studentId, assignmentId, attachmentUrls } = requestBody;

    if (!studentId || !assignmentId || !attachmentUrls || attachmentUrls.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '缺少必要参数' })
      };
    }

    console.log('📝 请求参数:', { studentId, assignmentId, attachmentCount: attachmentUrls.length });

    // 创建Supabase客户端
    const supabase = createClient(
      requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL,
      requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY
    );

    // 获取作业信息
    console.log('📖 获取作业信息...');
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('description, assignment_title')
      .eq('assignment_id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      console.error('❌ 获取作业信息失败:', assignmentError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '获取作业信息失败' })
      };
    }

    console.log('✅ 作业信息获取成功:', assignmentData.assignment_title);

    // 调用DeepSeek API
    console.log('🤖 开始调用DeepSeek API...');
    const gradingResult = await callDeepSeekAPI(
      requiredEnvVars.DEEPSEEK_API_KEY,
      requiredEnvVars.DEEPSEEK_MODEL_ID,
      requiredEnvVars.DEEPSEEK_API_URL,
      assignmentData.description,
      attachmentUrls,
      assignmentData.assignment_title
    );

    console.log('✅ AI批改完成:', gradingResult);

    // 更新数据库
    console.log('💾 更新数据库...');
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
      console.error('❌ 数据库更新失败:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '更新批改结果失败' })
      };
    }

    console.log('🎉 AI批改流程完成');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result: gradingResult
      })
    };

  } catch (error) {
    console.error('💥 Netlify Function执行错误:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        details: error.message || '未知错误'
      })
    };
  }
};

// DeepSeek API调用函数
async function callDeepSeekAPI(apiKey, modelId, apiUrl, assignmentDescription, attachmentUrls, assignmentTitle) {
  console.log('🔗 DeepSeek API调用参数:', {
    apiUrl,
    modelId,
    hasApiKey: !!apiKey,
    apiKeyPreview: apiKey ? apiKey.substring(0, 15) + '...' : 'null'
  });

  // 构建Prompt
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

  // 构建消息内容
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

  try {
    console.log('📤 发送请求到DeepSeek...');
    
    // 使用动态导入node-fetch
    const { default: fetch } = await import('node-fetch');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log('📨 DeepSeek响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepSeek API错误:', response.status, errorText);
      
      // 分析错误类型
      let errorMessage = `DeepSeek API调用失败 (${response.status})`;
      if (response.status === 401) {
        errorMessage = 'DeepSeek API密钥无效或过期';
      } else if (response.status === 429) {
        errorMessage = 'DeepSeek API请求频率超限或余额不足';
      } else if (response.status === 403) {
        errorMessage = 'DeepSeek API访问被拒绝，可能是地理位置限制';
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ DeepSeek API响应成功');

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('DeepSeek API返回格式异常');
    }

    const aiResponse = result.choices[0].message.content;
    console.log('🤖 AI回复:', aiResponse);

    // 解析AI响应
    const isQualified = aiResponse.includes('合格') && !aiResponse.includes('不合格');

    return {
      status: isQualified ? '合格' : '不合格',
      feedback: aiResponse
    };

  } catch (error) {
    console.error('💥 DeepSeek API调用异常:', error);
    throw error;
  }
}