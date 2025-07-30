import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 测试DeepSeek API的不同格式...');
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const modelId = process.env.DEEPSEEK_MODEL_ID || 'deepseek-chat';
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
    const testImageUrl = 'https://via.placeholder.com/300x200.png?text=Test+Image';

    if (!apiKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const formats = [
      {
        name: 'Format 1 - OpenAI style',
        content: [
          { type: "text", text: "请描述这张图片" },
          { 
            type: "image_url", 
            image_url: { url: testImageUrl }
          }
        ]
      },
      {
        name: 'Format 2 - Direct string',
        content: [
          { type: "text", text: "请描述这张图片" },
          { 
            type: "image_url", 
            image_url: testImageUrl
          }
        ]
      },
      {
        name: 'Format 3 - Simple object',
        content: [
          { type: "text", text: "请描述这张图片" },
          { 
            type: "image", 
            image: testImageUrl
          }
        ]
      }
    ];

    const results = [];

    for (const format of formats) {
      try {
        console.log(`🧪 测试 ${format.name}...`);
        
        const requestBody = {
          model: modelId,
          messages: [
            {
              role: "user",
              content: format.content
            }
          ],
          max_tokens: 100,
          temperature: 0.1
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(15000)
        });

        const responseText = await response.text();
        
        results.push({
          format: format.name,
          success: response.ok,
          status: response.status,
          error: response.ok ? null : responseText,
          response: response.ok ? JSON.parse(responseText) : null
        });

        console.log(`${format.name}: ${response.ok ? '✅ 成功' : '❌ 失败'} (${response.status})`);

      } catch (error) {
        results.push({
          format: format.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.log(`${format.name}: ❌ 异常 - ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      testImageUrl,
      results,
      summary: {
        successful: results.filter(r => r.success).map(r => r.format),
        failed: results.filter(r => !r.success).map(r => r.format)
      }
    });

  } catch (error) {
    console.error('💥 格式测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}