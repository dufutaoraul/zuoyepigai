import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🖼️ 开始图片批改测试...');
    
    const { imageUrl } = await request.json();
    
    // 如果没有提供图片URL，使用一个公开的测试图片
    const testImageUrl = imageUrl || 'https://via.placeholder.com/300x200.png?text=Test+Image';
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const modelId = process.env.DEEPSEEK_MODEL_ID || 'deepseek-chat';
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'DeepSeek API key not configured'
      }, { status: 500 });
    }

    const testPrompt = `请看这张图片并简单描述你看到了什么。如果你能看到图片，请回复"我可以看到图片：[描述内容]"。如果你看不到图片，请回复"无法访问图片"。`;

    const messageContent = [
      {
        type: "text",
        text: testPrompt
      },
      {
        type: "image_url",
        image_url: testImageUrl  // 修正为DeepSeek API期望的格式
      }
    ];

    const requestBody = {
      model: modelId,
      messages: [
        {
          role: "user",
          content: messageContent
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    };

    console.log('📤 发送图片测试请求:', {
      imageUrl: testImageUrl,
      messageContentLength: messageContent.length
    });

    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000)
    });

    const responseTime = Date.now() - startTime;
    
    console.log('📨 DeepSeek图片测试响应:', {
      status: response.status,
      responseTime,
      ok: response.ok
    });

    const responseText = await response.text();
    console.log('📄 原始响应内容:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `DeepSeek API error: ${response.status}`,
        errorDetails: responseText,
        responseTime,
        testImageUrl,
        analysis: {
          likely_cause: response.status === 400 ? 'Image URL format/access issue' : 
                       response.status === 401 ? 'Authentication issue' :
                       response.status === 403 ? 'Permission/geographic restriction' :
                       'Unknown API error'
        }
      });
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse DeepSeek response',
        responseText: responseText.substring(0, 500),
        parseError: parseError instanceof Error ? parseError.message : 'Parse error'
      });
    }

    const aiResponse = result.choices?.[0]?.message?.content || 'No response content';
    
    return NextResponse.json({
      success: true,
      testType: 'image-grading',
      testImageUrl,
      responseTime,
      aiResponse,
      fullResponse: result,
      analysis: {
        canAccessImage: aiResponse.includes('我可以看到图片') || aiResponse.includes('图片'),
        imageAccessDenied: aiResponse.includes('无法访问') || aiResponse.includes('看不到'),
        responseLength: aiResponse.length
      }
    });

  } catch (error) {
    console.error('💥 图片批改测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown',
      testType: 'image-grading'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Image grading test endpoint',
    usage: 'POST with optional imageUrl to test AI grading with images',
    description: 'Tests if DeepSeek can access and process image URLs'
  });
}