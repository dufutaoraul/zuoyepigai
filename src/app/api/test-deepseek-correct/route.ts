import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 测试DeepSeek API的正确格式...');
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const modelId = process.env.DEEPSEEK_MODEL_ID || 'deepseek-chat';
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

    if (!apiKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    // 根据错误信息，尝试不同的消息格式
    const testFormats = [
      {
        name: 'Format 1: 纯文本数组',
        messages: [
          {
            role: "user",
            content: "请回复：测试成功"
          }
        ]
      },
      {
        name: 'Format 2: 内容对象数组 - 只有文本',
        messages: [
          {
            role: "user", 
            content: [
              {
                type: "text",
                text: "请回复：测试成功"
              }
            ]
          }
        ]
      },
      {
        name: 'Format 3: 图片格式 - url对象',
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请描述这张图片"
              },
              {
                type: "image_url",
                image_url: {
                  url: "https://via.placeholder.com/300x200.png?text=Test"
                }
              }
            ]
          }
        ]
      },
      {
        name: 'Format 4: 图片格式 - 直接字符串',
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text", 
                text: "请描述这张图片"
              },
              {
                type: "image_url",
                image_url: "https://via.placeholder.com/300x200.png?text=Test"
              }
            ]
          }
        ]
      },
      {
        name: 'Format 5: 图片格式 - image类型',
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请描述这张图片"
              },
              {
                type: "image",
                image: "https://via.placeholder.com/300x200.png?text=Test"
              }
            ]
          }
        ]
      }
    ];

    const results = [];

    for (const format of testFormats) {
      try {
        console.log(`🧪 测试 ${format.name}...`);
        
        const requestBody = {
          model: modelId,
          messages: format.messages,
          max_tokens: 100,
          temperature: 0.1
        };

        console.log(`请求体:`, JSON.stringify(requestBody, null, 2));

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
        
        let parsedResponse = null;
        if (response.ok) {
          try {
            parsedResponse = JSON.parse(responseText);
          } catch (e) {
            // ignore parse error
          }
        }
        
        results.push({
          format: format.name,
          success: response.ok,
          status: response.status,
          error: response.ok ? null : responseText.substring(0, 500),
          response: parsedResponse ? parsedResponse.choices?.[0]?.message?.content : null,
          requestBody: format.messages
        });

        console.log(`${format.name}: ${response.ok ? '✅ 成功' : '❌ 失败'} (${response.status})`);
        if (!response.ok) {
          console.log(`错误详情:`, responseText.substring(0, 200));
        }

      } catch (error) {
        results.push({
          format: format.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          requestBody: format.messages
        });
        console.log(`${format.name}: ❌ 异常 - ${error}`);
      }
    }

    const successfulFormats = results.filter(r => r.success);
    const failedFormats = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful: successfulFormats.length,
        failed: failedFormats.length,
        successfulFormats: successfulFormats.map(r => r.format),
        failedFormats: failedFormats.map(r => r.format)
      },
      results,
      recommendation: successfulFormats.length > 0 ? 
        `使用格式: ${successfulFormats[0].format}` : 
        '没有找到有效格式，需要查看DeepSeek文档'
    });

  } catch (error) {
    console.error('💥 格式测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}