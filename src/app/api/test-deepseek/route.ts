import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'DeepSeek test endpoint ready',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始DeepSeek API连接测试...');
    
    const deepSeekApiKey = process.env.DEEPSEEK_API_KEY;
    const modelId = process.env.DEEPSEEK_MODEL_ID;
    const apiUrl = process.env.DEEPSEEK_API_URL;
    
    console.log('📋 环境变量检查:', {
      hasApiKey: !!deepSeekApiKey,
      hasModelId: !!modelId,
      hasApiUrl: !!apiUrl,
      apiKeyPreview: deepSeekApiKey ? deepSeekApiKey.substring(0, 15) + '...' : 'null',
      modelId: modelId,
      apiUrl: apiUrl
    });
    
    if (!deepSeekApiKey || !modelId || !apiUrl) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing configuration',
        details: '缺少必要的环境变量配置',
        env: {
          hasApiKey: !!deepSeekApiKey,
          hasModelId: !!modelId,
          hasApiUrl: !!apiUrl
        }
      });
    }

    console.log('✅ 环境变量完整，开始测试连接...');
    
    console.log('📤 请求详情:');
    console.log('- URL:', apiUrl);
    console.log('- Model:', modelId);
    console.log('- Auth:', `Bearer ${deepSeekApiKey.substring(0, 20)}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时
    
    const testResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepSeekApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'user',
            content: '测试连接，请回复"连接成功"'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📨 API响应状态:', testResponse.status);
    console.log('📨 响应头:', Object.fromEntries([...testResponse.headers.entries()]));

    const responseText = await testResponse.text();
    console.log('📨 响应长度:', responseText.length);
    console.log('📨 响应内容预览:', responseText.substring(0, 300));

    // 检查是否返回HTML（域名限制问题）
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('❌ 返回HTML页面，可能是域名限制');
      return NextResponse.json({
        success: false,
        error: 'Domain not authorized',
        details: 'DeepSeek API返回HTML页面，表明域名未在白名单中',
        responsePreview: responseText.substring(0, 200),
        statusCode: testResponse.status
      });
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON response',
        details: 'API返回非JSON格式数据',
        responsePreview: responseText.substring(0, 200),
        parseError: parseError instanceof Error ? parseError.message : 'Parse error',
        statusCode: testResponse.status
      });
    }

    if (!testResponse.ok) {
      console.error('❌ API请求失败:', responseData);
      return NextResponse.json({
        success: false,
        error: `DeepSeek API error: ${testResponse.status}`,
        details: responseData,
        statusCode: testResponse.status,
        troubleshooting: [
          '检查API密钥是否正确',
          '检查模型ID是否有效',
          '检查账户余额是否充足',
          '确认API URL格式正确'
        ]
      });
    }

    console.log('✅ DeepSeek API测试成功!');
    return NextResponse.json({
      success: true,
      message: 'DeepSeek API连接测试成功',
      data: responseData,
      config: {
        apiUrl: apiUrl,
        modelId: modelId,
        authFormat: `Bearer ${deepSeekApiKey.substring(0, 15)}...`
      },
      statusCode: testResponse.status
    });

  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Request timeout',
        details: '请求超时（20秒），可能是网络问题或API服务响应慢'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      hasKey: !!process.env.DEEPSEEK_API_KEY
    });
  }
}