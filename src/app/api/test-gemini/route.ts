import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Gemini API测试端点',
    usage: 'POST请求测试Gemini API集成',
    requiredEnvVars: [
      'GEMINI_API_KEY',
      'GEMINI_MODEL_ID (可选，默认为gemini-1.5-flash)',
      'GEMINI_API_URL (可选，自动生成)'
    ]
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始Gemini API连接测试...');
    
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const modelId = process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash';
    const apiUrl = process.env.GEMINI_API_URL || `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
    
    console.log('📋 环境变量检查:', {
      hasApiKey: !!geminiApiKey,
      modelId: modelId,
      apiUrl: apiUrl,
      apiKeyPreview: geminiApiKey ? geminiApiKey.substring(0, 15) + '...' : 'null'
    });
    
    if (!geminiApiKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing configuration',
        details: '缺少GEMINI_API_KEY环境变量',
        env: {
          hasApiKey: !!geminiApiKey,
          modelId: modelId,
          apiUrl: apiUrl
        }
      });
    }

    console.log('✅ 环境变量完整，开始测试连接...');
    
    // 测试1: 文本连接测试
    console.log('📝 测试1: 文本连接测试...');
    const textTestResult = await testGeminiConnection(apiUrl, geminiApiKey, modelId, 'text');
    
    // 测试2: 图片识别测试
    console.log('🖼️ 测试2: 图片识别测试...');
    const imageTestResult = await testGeminiConnection(apiUrl, geminiApiKey, modelId, 'image');

    const overallSuccess = textTestResult.success && imageTestResult.success;
    
    console.log(`📊 测试结果: ${overallSuccess ? '✅ 成功' : '❌ 失败'}`);
    
    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? 'Gemini API集成测试全部通过' : 'Gemini API集成测试存在问题',
      tests: {
        textConnection: textTestResult,
        imageRecognition: imageTestResult
      },
      config: {
        apiUrl: apiUrl,
        modelId: modelId,
        apiKeyFormat: geminiApiKey.substring(0, 15) + '...'
      },
      recommendation: {
        canUseForGrading: overallSuccess,
        nextSteps: overallSuccess ? 
          ['部署到Netlify', '测试实际批改功能'] :
          ['检查API配置', '确认账户权限', '联系Google技术支持']
      }
    });

  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Request timeout',
        details: '请求超时，可能是网络问题或API服务响应慢'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      hasKey: !!process.env.GEMINI_API_KEY
    });
  }
}

// Gemini API连接测试函数
async function testGeminiConnection(apiUrl: string, apiKey: string, modelId: string, testType: 'text' | 'image') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), testType === 'image' ? 90000 : 30000);
    
    let requestBody;
    
    if (testType === 'text') {
      requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              { text: "请回复：Gemini API连接测试成功" }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.1
        }
      };
    } else {
      // 图片识别测试 - 使用一个简单的测试图片
      const testImageUrl = 'https://via.placeholder.com/400x300.png?text=Gemini图片识别测试';
      
      try {
        // 获取图片并转换为base64
        const imageResponse = await fetch(testImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Data = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/png';
        
        requestBody = {
          contents: [
            {
              role: "user",
              parts: [
                { text: "请描述这张图片的内容，如果能看到文字请说出文字内容。" },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.1
          }
        };
      } catch (imageError) {
        return {
          success: false,
          testType,
          error: 'Image processing failed',
          details: `无法处理测试图片: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`
        };
      }
    }
    
    console.log(`📤 发送${testType === 'text' ? '文本' : '图片'}请求...`);
    
    const testResponse = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`📨 ${testType}测试响应状态:`, testResponse.status);

    const responseText = await testResponse.text();
    console.log(`📨 ${testType}测试响应长度:`, responseText.length);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ ${testType}测试JSON解析失败:`, parseError);
      return {
        success: false,
        testType,
        error: 'Invalid JSON response',
        details: 'API返回非JSON格式数据',
        responsePreview: responseText.substring(0, 200),
        parseError: parseError instanceof Error ? parseError.message : 'Parse error',
        statusCode: testResponse.status
      };
    }

    if (!testResponse.ok) {
      console.error(`❌ ${testType}测试API请求失败:`, responseData);
      return {
        success: false,
        testType,
        error: `Gemini API error: ${testResponse.status}`,
        details: responseData,
        statusCode: testResponse.status,
        troubleshooting: [
          '检查API密钥是否正确',
          '检查模型ID是否有效',
          '检查账户配额是否充足',
          '确认API URL格式正确'
        ]
      };
    }

    if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
      console.error(`❌ ${testType}测试返回格式异常:`, responseData);
      return {
        success: false,
        testType,
        error: 'Invalid response format',
        details: 'Gemini API返回格式异常',
        responseData
      };
    }

    const aiResponse = responseData.candidates[0].content.parts[0].text || '';
    console.log(`✅ ${testType}测试成功! AI回复:`, aiResponse.substring(0, 100));
    
    return {
      success: true,
      testType,
      statusCode: testResponse.status,
      response: aiResponse,
      usage: responseData.usageMetadata,
      canRecognize: testType === 'image' ? (aiResponse.length > 10 && (aiResponse.includes('图') || aiResponse.includes('image') || aiResponse.includes('Gemini'))) : true,
      requestBody
    };

  } catch (error) {
    console.error(`💥 ${testType}测试异常:`, error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        testType,
        error: 'Request timeout',
        details: `${testType}测试请求超时`
      };
    }
    
    return {
      success: false,
      testType,
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}