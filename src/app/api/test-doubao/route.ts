import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'DouBao test endpoint ready',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Testing DouBao API connection...');
    
    // 检查环境变量
    const douBaoApiKey = process.env.DOUBAO_API_KEY;
    const modelId = process.env.DOUBAO_MODEL_ID;
    const apiUrl = process.env.DOUBAO_API_URL;
    
    console.log('Environment check:', {
      hasApiKey: !!douBaoApiKey,
      hasModelId: !!modelId,
      hasApiUrl: !!apiUrl,
      apiKeyPreview: douBaoApiKey ? douBaoApiKey.substring(0, 10) + '...' : 'null',
      modelId: modelId,
      apiUrl: apiUrl
    });
    
    if (!douBaoApiKey) {
      return NextResponse.json({ 
        success: false,
        error: 'DOUBAO_API_KEY not configured',
        hasKey: false,
        env: {
          hasApiKey: false,
          hasModelId: !!modelId,
          hasApiUrl: !!apiUrl
        }
      });
    }

    console.log('API Key found, testing connection...');

    // 测试豆包API连接
    const testApiUrl = apiUrl || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const testModelId = modelId || 'ep-20250524195324-l4t8t';
    
    console.log('Making request to:', testApiUrl);
    console.log('Using model:', testModelId);
    console.log('Authorization header:', douBaoApiKey.substring(0, 20) + '...');
    
    const testResponse = await fetch(testApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': douBaoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: testModelId,
        messages: [
          {
            role: 'user',
            content: '测试连接，请回复"连接成功"'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    console.log('DouBao API response status:', testResponse.status);

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('DouBao API error:', errorText);
      
      return NextResponse.json({
        success: false,
        error: `DouBao API error: ${testResponse.status}`,
        details: errorText,
        hasKey: true,
        statusCode: testResponse.status
      });
    }

    const responseData = await testResponse.json();
    console.log('DouBao API success:', responseData);

    return NextResponse.json({
      success: true,
      message: 'DouBao API connection successful',
      hasKey: true,
      response: responseData,
      statusCode: testResponse.status
    });

  } catch (error) {
    console.error('DouBao test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      hasKey: !!process.env.DOUBAO_API_KEY
    });
  }
}