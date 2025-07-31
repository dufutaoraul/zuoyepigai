// AI服务后备方案
export interface AIGradingResult {
  status: '合格' | '不合格';
  feedback: string;
}

// 尝试多个AI服务的后备策略
export async function callAIWithFallback(
  assignmentDescription: string, 
  attachmentUrls: string[], 
  assignmentTitle: string
): Promise<AIGradingResult> {
  
  // 检查是否配置了豆包API
  const doubaoApiKey = process.env.DOUBAO_API_KEY;
  const doubaoApiUrl = process.env.DOUBAO_API_URL;
  
  if (doubaoApiKey && doubaoApiUrl) {
    console.log('🔥 使用豆包API进行图片批改');
    try {
      return await callDoubaoAPI(assignmentDescription, attachmentUrls, assignmentTitle);
    } catch (error) {
      console.error('❌ 豆包API调用失败，回退到文本批改:', error);
      return await callTextBasedGrading(assignmentDescription, attachmentUrls, assignmentTitle);
    }
  }
  
  // 回退到文本批改方案
  console.log('📝 使用文本批改方案 (豆包API未配置)');
  return await callTextBasedGrading(assignmentDescription, attachmentUrls, assignmentTitle);
}

// 基于文本的批改方案（DeepSeek不支持图片）
async function callTextBasedGrading(
  assignmentDescription: string,
  attachmentUrls: string[],
  assignmentTitle: string
): Promise<AIGradingResult> {
  
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const modelId = process.env.DEEPSEEK_MODEL_ID || 'deepseek-chat';
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY未配置');
  }

  // 构建适合文本批改的提示词
  const prompt = `你是一个专业的作业批改老师。请根据以下信息进行批改：

**作业标题**: ${assignmentTitle}

**作业要求**: 
${assignmentDescription}

**学员提交情况**:
- 学员提交了 ${attachmentUrls.length} 张图片作为作业
- 由于技术限制，无法直接查看图片内容

**批改指导**:
基于作业要求的性质，请提供以下批改建议：

1. 如果作业要求是展示操作结果、截图等视觉内容：
   - 说明"由于技术限制无法查看图片，建议学员补充文字说明或联系助教人工批改"
   
2. 如果作业要求相对简单（如简单操作、基础任务）：
   - 可以假设学员已按要求完成，给予"合格"判定
   - 但提醒学员确保图片清晰完整

**重要**：
- 如果判定为"合格"，回复内容包含"合格"字样
- 如果判定为"不合格"，回复内容包含"不合格"字样
- 提供具体的反馈建议

请基于作业要求的复杂程度和重要性进行合理批改。`;

  try {
    const requestBody = {
      model: modelId,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    };

    console.log('📤 发送文本批改请求到DeepSeek...');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepSeek文本批改失败:', response.status, errorText);
      throw new Error(`DeepSeek API调用失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ DeepSeek文本批改成功');

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('DeepSeek API返回格式异常');
    }

    const aiResponse = result.choices[0].message.content;
    console.log('🤖 AI批改回复:', aiResponse);

    // 解析AI响应
    const isQualified = aiResponse.includes('合格') && !aiResponse.includes('不合格');

    return {
      status: isQualified ? '合格' : '不合格',
      feedback: aiResponse
    };

  } catch (error) {
    console.error('💥 文本批改异常:', error);
    throw error;
  }
}

async function callDeepSeekAPI(
  assignmentDescription: string, 
  attachmentUrls: string[], 
  assignmentTitle: string
): Promise<AIGradingResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const modelId = process.env.DEEPSEEK_MODEL_ID || 'deepseek-chat';
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY未配置');
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

  // 添加图片内容 - 使用DeepSeek API的正确格式
  for (const imageUrl of attachmentUrls) {
    messageContent.push({
      type: "image_url",
      image_url: imageUrl  // DeepSeek可能期望直接是字符串，而不是对象
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

  // 在Netlify环境中使用原生fetch，本地使用node-fetch
  let fetchFunction;
  if (typeof fetch !== 'undefined') {
    fetchFunction = fetch;
  } else {
    const { default: nodeFetch } = await import('node-fetch');
    fetchFunction = nodeFetch;
  }
  
  const response = await fetchFunction(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; NetlifyBot/1.0)'
    },
    body: JSON.stringify(requestBody),
    // Netlify环境使用signal，本地使用timeout
    ...(typeof AbortSignal !== 'undefined' ? 
      { signal: AbortSignal.timeout(30000) } : 
      { timeout: 30000 }
    )
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API调用失败: ${response.status} ${errorText}`);
  }

  const result = await response.json();

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
}

// 豆包API调用函数
async function callDoubaoAPI(
  assignmentDescription: string, 
  attachmentUrls: string[], 
  assignmentTitle: string
): Promise<AIGradingResult> {
  
  const apiKey = process.env.DOUBAO_API_KEY;
  const modelId = process.env.DOUBAO_MODEL_ID || 'doubao-vision';
  const apiUrl = process.env.DOUBAO_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('豆包API配置不完整 - 缺少API_KEY或API_URL');
  }

  // 构建专业的作业批改提示词
  const prompt = `你是一个专业的作业批改老师。请根据以下作业要求判断学员提交的图片作业是否合格。

**作业标题**: ${assignmentTitle}

**详细作业要求**: 
${assignmentDescription}

**评判标准**:
- 请仔细查看学员提交的图片内容
- 判断是否符合上述作业要求
- 检查操作步骤是否正确
- 验证结果是否达到预期

**回复格式**:
- 如果符合要求，请在回复中包含"合格"字样，并简要说明符合的方面
- 如果不符合要求，请在回复中包含"不合格"字样，详细说明不合格的原因和改进建议

请现在开始批改学员提交的作业图片。`;

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

  console.log('📤 发送请求到豆包API...');
  console.log('🖼️ 图片数量:', attachmentUrls.length);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000) // 豆包处理图片可能需要更长时间
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 豆包API调用失败:', response.status, errorText);
      throw new Error(`豆包API调用失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ 豆包API调用成功');

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error('❌ 豆包API返回格式异常:', result);
      throw new Error('豆包API返回格式异常');
    }

    const aiResponse = result.choices[0].message.content;
    console.log('🤖 豆包AI批改回复:', aiResponse);

    // 解析AI响应，判断是否合格
    const isQualified = aiResponse.includes('合格') && !aiResponse.includes('不合格');
    
    return {
      status: isQualified ? '合格' : '不合格',
      feedback: aiResponse
    };

  } catch (error) {
    console.error('💥 豆包API调用异常:', error);
    throw error;
  }
}

// 简单的后备验证（当AI服务不可用时）
async function callFallbackValidation(
  assignmentDescription: string, 
  attachmentUrls: string[], 
  assignmentTitle: string
): Promise<AIGradingResult> {
  
  console.log('使用后备验证方案');
  
  // 基本的图片存在性检查
  if (!attachmentUrls || attachmentUrls.length === 0) {
    return {
      status: '不合格',
      feedback: '未提交作业图片，请上传作业截图后重新提交。'
    };
  }

  // 简单的URL有效性检查
  for (const url of attachmentUrls) {
    if (!url || !url.startsWith('http')) {
      return {
        status: '不合格',
        feedback: '作业图片链接无效，请重新上传图片。'
      };
    }
  }

  // 当AI服务不可用时，标记为需要手动检查
  return {
    status: '不合格',
    feedback: 'AI批改服务暂时不可用，您的作业已收到，请联系助教进行人工批改。作业内容：图片数量' + attachmentUrls.length + '张。'
  };
}