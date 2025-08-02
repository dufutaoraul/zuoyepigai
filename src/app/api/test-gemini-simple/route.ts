import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 开始简单Gemini API测试...');

    const apiKey = process.env.GEMINI_API_KEY;
    const modelId = process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash';
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'GEMINI_API_KEY未配置',
        apiKeyExists: false 
      });
    }

    console.log('🔑 API Key存在，开始测试连接...');
    console.log('🔍 API Key前缀:', apiKey.substring(0, 10) + '...');

    // 最简单的文本请求，不涉及图片
    const requestBody = {
      contents: [{
        role: "user",
        parts: [{ text: "请回复'测试成功'" }]
      }],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.1
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
    console.log('📡 请求URL:', apiUrl);

    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AssignmentGrader/1.0)'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000) // 30秒超时
    });

    console.log('📊 响应状态:', response.status);
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API错误响应:', errorText);
      
      return NextResponse.json({
        success: false,
        error: `Gemini API请求失败: ${response.status}`,
        details: errorText,
        apiKeyExists: true,
        networkConnected: true,
        responseStatus: response.status
      });
    }

    const result = await response.json();
    console.log('✅ Gemini API响应成功:', result);

    // 验证响应格式
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ 响应格式异常:', result);
      return NextResponse.json({
        success: false,
        error: 'Gemini API返回格式异常',
        rawResponse: result,
        apiKeyExists: true,
        networkConnected: true
      });
    }

    const aiResponse = result.candidates[0].content.parts[0].text;
    console.log('🤖 AI回复:', aiResponse);

    return NextResponse.json({
      success: true,
      message: 'Gemini API连接测试成功',
      aiResponse: aiResponse,
      apiKeyExists: true,
      networkConnected: true,
      responseStatus: response.status
    });

  } catch (error) {
    console.error('💥 测试过程异常:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Gemini API测试失败',
      details: error instanceof Error ? error.message : '未知网络错误',
      apiKeyExists: !!process.env.GEMINI_API_KEY,
      networkConnected: false
    }, { status: 500 });
  }
}