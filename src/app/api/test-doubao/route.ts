import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'DouBao test endpoint ready',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始豆包API连接测试...');
    
    const douBaoApiKey = process.env.DOUBAO_API_KEY;
    const modelId = process.env.DOUBAO_MODEL_ID;
    const apiUrl = process.env.DOUBAO_API_URL;
    
    console.log('📋 环境变量检查:', {
      hasApiKey: !!douBaoApiKey,
      hasModelId: !!modelId,
      hasApiUrl: !!apiUrl,
      apiKeyPreview: douBaoApiKey ? douBaoApiKey.substring(0, 15) + '...' : 'null',
      modelId: modelId,
      apiUrl: apiUrl
    });
    
    if (!douBaoApiKey || !modelId || !apiUrl) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing configuration',
        details: '缺少必要的环境变量配置',
        env: {
          hasApiKey: !!douBaoApiKey,
          hasModelId: !!modelId,
          hasApiUrl: !!apiUrl
        }
      });
    }

    console.log('✅ 环境变量完整，开始测试连接...');

    // 确保API Key格式正确
    const authHeader = douBaoApiKey.startsWith('Bearer ') ? douBaoApiKey : `Bearer ${douBaoApiKey}`;
    
    console.log('📤 请求详情:');
    console.log('- URL:', apiUrl);
    console.log('- Model:', modelId);
    console.log('- Auth:', authHeader.substring(0, 20) + '...');
    
    // 测试1: 文本连接测试
    console.log('📝 测试1: 文本连接测试...');
    const textTestResult = await testDoubaoConnection(apiUrl, authHeader, modelId, 'text');
    
    // 测试2: 图片识别测试
    console.log('🖼️ 测试2: 图片识别测试...');
    const imageTestResult = await testDoubaoConnection(apiUrl, authHeader, modelId, 'image');

    const overallSuccess = textTestResult.success && imageTestResult.success;
    
    console.log(`📊 测试结果: ${overallSuccess ? '✅ 成功' : '❌ 失败'}`);
    
    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? '豆包API集成测试全部通过' : '豆包API集成测试存在问题',
      tests: {
        textConnection: textTestResult,
        imageRecognition: imageTestResult
      },
      config: {
        apiUrl: apiUrl,
        modelId: modelId,
        authFormat: authHeader.substring(0, 15) + '...'
      },
      recommendation: {
        canUseForGrading: overallSuccess,
        nextSteps: overallSuccess ? 
          ['设置环境变量', '部署到Netlify', '测试实际批改功能'] :
          ['检查API配置', '确认账户权限', '联系豆包技术支持']
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
      hasKey: !!process.env.DOUBAO_API_KEY
    });
  }
}

// 豆包API连接测试函数
async function testDoubaoConnection(apiUrl: string, authHeader: string, modelId: string, testType: 'text' | 'image') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), testType === 'image' ? 60000 : 30000);
    
    let requestBody;
    
    if (testType === 'text') {
      requestBody = {
        model: modelId,
        messages: [
          {
            role: 'user',
            content: '请回复：豆包API连接测试成功'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      };
    } else {
      // 图片识别测试
      const testImageUrl = 'https://via.placeholder.com/400x300.png?text=豆包图片识别测试';
      requestBody = {
        model: modelId,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请描述这张图片的内容，如果能看到文字请说出文字内容。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: testImageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      };
    }
    
    console.log(`📤 发送${testType === 'text' ? '文本' : '图片'}请求...`);
    
    const testResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`📨 ${testType}测试响应状态:`, testResponse.status);

    const responseText = await testResponse.text();
    console.log(`📨 ${testType}测试响应长度:`, responseText.length);

    // 检查是否返回HTML（域名限制问题）
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
      console.error(`❌ ${testType}测试返回HTML页面，可能是域名限制`);
      return {
        success: false,
        testType,
        error: 'Domain not authorized',
        details: '豆包API返回HTML页面，表明域名未在白名单中',
        troubleshooting: [
          '1. 登录豆包AI开放平台控制台',
          '2. 找到API密钥管理页面',
          '3. 添加Netlify域名到白名单',
          '4. 确认API密钥有效且未过期'
        ],
        responsePreview: responseText.substring(0, 200),
        statusCode: testResponse.status
      };
    }

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
        error: `DouBao API error: ${testResponse.status}`,
        details: responseData,
        statusCode: testResponse.status,
        troubleshooting: [
          '检查API密钥是否正确',
          '检查模型ID是否有效',
          '检查账户余额是否充足',
          '确认API URL格式正确'
        ]
      };
    }

    const aiResponse = responseData.choices?.[0]?.message?.content || '';
    console.log(`✅ ${testType}测试成功! AI回复:`, aiResponse.substring(0, 100));
    
    return {
      success: true,
      testType,
      statusCode: testResponse.status,
      response: aiResponse,
      usage: responseData.usage,
      canRecognize: testType === 'image' ? (aiResponse.length > 10 && aiResponse.includes('图')) : true,
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