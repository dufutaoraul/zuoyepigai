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
  
  console.log('🚀 开始AI批改流程...');
  console.log('📋 作业信息:', { title: assignmentTitle, imageCount: attachmentUrls.length });
  
  // 检查是否配置了Gemini API
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiApiUrl = process.env.GEMINI_API_URL;
  
  if (geminiApiKey && geminiApiUrl) {
    console.log('🔥 尝试使用Gemini API进行图片批改');
    try {
      // 设置更短的超时时间，快速失败
      const result = await Promise.race([
        callGeminiAPI(assignmentDescription, attachmentUrls, assignmentTitle),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API超时')), 30000)
        )
      ]);
      console.log('✅ Gemini API批改成功');
      return result;
    } catch (error) {
      console.error('❌ Gemini API调用失败，回退到文本批改:', error);
    }
  }
  
  // 尝试DeepSeek API
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekApiKey && deepseekApiKey !== 'sk-your-deepseek-key-here') {
    console.log('🔄 尝试使用DeepSeek API进行文本批改');
    try {
      const result = await Promise.race([
        callTextBasedGrading(assignmentDescription, attachmentUrls, assignmentTitle),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('DeepSeek API超时')), 20000)
        )
      ]);
      console.log('✅ DeepSeek API批改成功');
      return result;
    } catch (error) {
      console.error('❌ DeepSeek API调用失败，使用智能后备方案:', error);
    }
  }
  
  // 最终后备方案：智能判断
  console.log('🛡️ 使用智能后备批改方案');
  return await callIntelligentFallback(assignmentDescription, attachmentUrls, assignmentTitle);
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

// Gemini API调用函数
async function callGeminiAPI(
  assignmentDescription: string, 
  attachmentUrls: string[], 
  assignmentTitle: string
): Promise<AIGradingResult> {
  
  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash';
  const apiUrl = process.env.GEMINI_API_URL || `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

  if (!apiKey) {
    throw new Error('Gemini API配置不完整 - 缺少GEMINI_API_KEY');
  }

  console.log('📤 发送请求到Gemini API...');
  console.log('🖼️ 图片数量:', attachmentUrls.length);

  // 构建友好的作业批改提示词
  const prompt = `你是一位专业且友善的作业批改老师。请根据以下要求批改学员提交的图片作业：

**作业标题**: ${assignmentTitle}

**作业要求**: ${assignmentDescription}

**批改标准** (友好且宽松):
- 如果图片显示了与作业要求相关的界面、内容或操作结果，判定为"合格"
- 重点关注学员是否在正确方向上进行了尝试和实践
- 给予积极鼓励，认可学员的努力

**回复格式**:
- 符合要求请明确说"合格"并给予鼓励
- 不符合要求请说"不合格"并提供具体改进建议
- 语言要友好、具体、有建设性

请现在批改学员的作业图片。`;

  // 构建Gemini API的请求格式
  const parts: any[] = [{ text: prompt }];

  // 处理图片 - 转换为base64格式
  let processedImageCount = 0;
  for (const imageUrl of attachmentUrls) {
    try {
      console.log(`🔄 处理图片: ${imageUrl}`);
      
      // 获取图片数据
      const imageResponse = await fetch(imageUrl, {
        signal: AbortSignal.timeout(10000) // 单个图片10秒超时
      });
      
      if (!imageResponse.ok) {
        console.warn(`⚠️ 图片获取失败 (${imageResponse.status}): ${imageUrl}`);
        continue;
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Data = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
      
      processedImageCount++;
      console.log(`✅ 图片处理成功 (${processedImageCount}/${attachmentUrls.length})`);
      
    } catch (error) {
      console.warn(`⚠️ 图片处理失败: ${imageUrl}`, error);
    }
  }

  if (processedImageCount === 0) {
    throw new Error('所有图片处理失败，无法进行批改');
  }

  const requestBody = {
    contents: [{
      role: "user", 
      parts: parts
    }],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.1
    }
  };

  console.log(`📊 发送批改请求: ${processedImageCount}张图片`);

  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API请求失败:', response.status, errorText);
      throw new Error(`Gemini API调用失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Gemini API响应成功');

    // 验证响应格式
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Gemini API返回格式异常:', result);
      throw new Error('Gemini API返回数据格式异常');
    }

    const aiResponse = result.candidates[0].content.parts[0].text;
    console.log('🤖 Gemini批改结果:', aiResponse.substring(0, 100) + '...');

    // 智能解析批改结果
    const isQualified = aiResponse.includes('合格') && !aiResponse.includes('不合格');
    
    return {
      status: isQualified ? '合格' : '不合格',
      feedback: aiResponse
    };

  } catch (error) {
    console.error('💥 Gemini API调用异常:', error);
    throw error;
  }
}

// 智能后备批改方案（当AI服务不可用时）
async function callIntelligentFallback(
  assignmentDescription: string, 
  attachmentUrls: string[], 
  assignmentTitle: string
): Promise<AIGradingResult> {
  
  console.log('🛡️ 使用智能后备批改方案');
  
  // 基本的图片存在性检查
  if (!attachmentUrls || attachmentUrls.length === 0) {
    return {
      status: '不合格',
      feedback: '❌ 未提交作业图片，请上传作业截图后重新提交。'
    };
  }

  // 简单的URL有效性检查
  for (const url of attachmentUrls) {
    if (!url || !url.startsWith('http')) {
      return {
        status: '不合格',
        feedback: '❌ 作业图片链接无效，请重新上传图片。'
      };
    }
  }

  // 基于作业类型的智能判断
  const description = assignmentDescription.toLowerCase();
  const title = assignmentTitle.toLowerCase();
  
  // 检查是否是简单的操作类作业
  const isSimpleTask = 
    description.includes('截图') || 
    description.includes('界面') ||
    description.includes('页面') ||
    description.includes('显示') ||
    description.includes('打开') ||
    title.includes('基础') ||
    title.includes('入门') ||
    title.includes('第一') ||
    title.includes('day1') ||
    title.includes('day 1');

  // 检查是否是复杂的编程作业
  const isComplexTask = 
    description.includes('代码') ||
    description.includes('编程') ||
    description.includes('算法') ||
    description.includes('函数') ||
    description.includes('逻辑') ||
    title.includes('高级') ||
    title.includes('项目');

  if (isSimpleTask && attachmentUrls.length > 0) {
    return {
      status: '合格',
      feedback: `✅ 您已提交了${attachmentUrls.length}张作业图片。基于作业要求的基础性质，初步判定为合格。\n\n📝 温馨提示：AI批改服务暂时不可用，此次采用智能预判。如需详细反馈，请联系助教进行人工复核。\n\n🎯 作业要求：${assignmentDescription}`
    };
  } else if (isComplexTask) {
    return {
      status: '不合格',
      feedback: `⚠️ 您提交了${attachmentUrls.length}张作业图片。由于此作业涉及复杂内容，需要详细的代码审查。\n\n🔍 请联系助教进行人工批改，以确保作业质量。\n\n📋 作业要求：${assignmentDescription}\n\n💡 建议：请确保图片清晰，包含完整的代码或操作过程。`
    };
  } else {
    // 默认情况：给予合格但建议人工复核
    return {
      status: '合格',
      feedback: `📸 您已提交了${attachmentUrls.length}张作业图片。\n\n✅ 基于提交情况，暂时标记为合格。\n\n⚠️ 注意：AI批改服务暂时不可用，建议联系助教进行详细批改以获得更准确的反馈。\n\n📋 作业内容：${assignmentTitle}\n📝 具体要求：${assignmentDescription}`
    };
  }
}

// 简单的后备验证（保留原有函数以防兼容性问题）
async function callFallbackValidation(
  assignmentDescription: string, 
  attachmentUrls: string[], 
  assignmentTitle: string
): Promise<AIGradingResult> {
  
  console.log('使用简单后备验证方案');
  return await callIntelligentFallback(assignmentDescription, attachmentUrls, assignmentTitle);
}
