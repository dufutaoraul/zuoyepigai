import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始详细豆包API诊断...');
    
    const apiKey = process.env.DOUBAO_API_KEY;
    const modelId = process.env.DOUBAO_MODEL_ID;
    const apiUrl = process.env.DOUBAO_API_URL;
    
    console.log('📋 环境变量详情:');
    console.log('- API Key 长度:', apiKey?.length || 0);
    console.log('- API Key 前缀:', apiKey?.substring(0, 8) + '...');
    console.log('- Model ID:', modelId);
    console.log('- API URL:', apiUrl);
    
    if (!apiKey || !modelId || !apiUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing configuration',
        details: {
          hasApiKey: !!apiKey,
          hasModelId: !!modelId,
          hasApiUrl: !!apiUrl
        }
      });
    }

    // 测试多种格式
    const testConfigs = [
      {
        name: 'Bearer前缀',
        auth: `Bearer ${apiKey}`,
        url: apiUrl
      },
      {
        name: '无前缀',
        auth: apiKey,
        url: apiUrl
      },
      {
        name: 'Authorization格式',
        auth: `Bearer ${apiKey}`,
        url: apiUrl.replace('/api/v3/', '/api/v3/')
      }
    ];

    const results = [];

    for (const config of testConfigs) {
      try {
        console.log(`🧪 测试配置: ${config.name}`);
        console.log(`- URL: ${config.url}`);
        console.log(`- Auth: ${config.auth.substring(0, 15)}...`);
        
        const testPayload = {
          model: modelId,
          messages: [
            {
              role: 'user',
              content: '你好'
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        };

        console.log('📤 请求体:', JSON.stringify(testPayload, null, 2));

        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Authorization': config.auth,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(10000)
        });

        const responseText = await response.text();
        console.log(`📨 ${config.name} 响应状态:`, response.status);
        console.log(`📨 ${config.name} 响应头:`, Object.fromEntries(response.headers.entries()));
        console.log(`📨 ${config.name} 响应内容 (前200字符):`, responseText.substring(0, 200));

        let responseData = null;
        let isJSON = false;
        
        try {
          responseData = JSON.parse(responseText);
          isJSON = true;
        } catch (e) {
          isJSON = false;
        }

        results.push({
          config: config.name,
          success: response.ok && isJSON,
          status: response.status,
          isJSON: isJSON,
          isHTML: responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html'),
          responsePreview: responseText.substring(0, 100),
          responseLength: responseText.length,
          headers: Object.fromEntries(response.headers.entries()),
          data: isJSON ? responseData : null
        });

        if (response.ok && isJSON) {
          console.log(`✅ ${config.name} 配置成功!`);
          break;
        }

      } catch (error) {
        console.error(`❌ ${config.name} 配置失败:`, error);
        results.push({
          config: config.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.name : 'Unknown'
        });
      }
    }

    return NextResponse.json({
      success: results.some(r => r.success),
      message: '豆包API多格式测试完成',
      results: results,
      environment: {
        apiKeyLength: apiKey.length,
        modelId: modelId,
        apiUrl: apiUrl,
        nodeEnv: process.env.NODE_ENV
      },
      recommendations: [
        '1. 检查火山引擎控制台中推理接入点状态',
        '2. 确认API Key权限和有效期',
        '3. 验证模型ID是否正确',
        '4. 检查火山引擎账户余额',
        '5. 尝试在火山引擎控制台直接测试API'
      ]
    });

  } catch (error) {
    console.error('💥 诊断过程发生错误:', error);
    return NextResponse.json({
      success: false,
      error: 'Diagnostic error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'DouBao detailed diagnostic endpoint ready',
    usage: 'POST to this endpoint to run comprehensive tests'
  });
}