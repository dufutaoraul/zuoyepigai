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
  
  // 1. 首先尝试DeepSeek
  try {
    return await callDeepSeekAPI(assignmentDescription, attachmentUrls, assignmentTitle);
  } catch (error) {
    console.warn('DeepSeek API失败，尝试备用方案:', error);
  }

  // 2. 如果DeepSeek失败，尝试简单的图片验证
  return await callFallbackValidation(assignmentDescription, attachmentUrls, assignmentTitle);
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