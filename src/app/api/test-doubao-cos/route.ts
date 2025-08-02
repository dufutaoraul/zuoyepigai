import { NextRequest, NextResponse } from 'next/server';
import { tencentStorage } from '@/lib/tencent-storage';

export async function POST() {
  try {
    console.log('=== 测试豆包API访问腾讯云COS图片 ===');
    
    // 检查豆包API环境变量
    const doubaoApiKey = process.env.DOUBAO_API_KEY;
    const doubaoModelId = process.env.DOUBAO_MODEL_ID;
    const doubaoApiUrl = process.env.DOUBAO_API_URL;
    
    if (!doubaoApiKey || !doubaoModelId || !doubaoApiUrl) {
      return NextResponse.json({
        success: false,
        error: '缺少豆包API配置',
        missing: {
          apiKey: !doubaoApiKey,
          modelId: !doubaoModelId,
          apiUrl: !doubaoApiUrl
        }
      }, { status: 500 });
    }
    
    console.log('豆包API配置检查通过');
    
    // 第一步：上传一张测试图片到腾讯云COS
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageData.split(',')[1], 'base64');
    
    const testFileName = `test/doubao-test-${Date.now()}.png`;
    console.log('开始上传测试图片到腾讯云COS:', testFileName);
    
    const imageUrl = await tencentStorage.uploadFile(testFileName, imageBuffer, 'image/png');
    console.log('测试图片上传成功:', imageUrl);
    
    // 第二步：测试豆包API能否访问这个图片
    const testPrompt = `这是一个图片访问测试。请看图片并回复"图片访问成功"。如果无法访问图片，请说明具体问题。`;
    
    // 构建豆包API请求
    const requestBody = {
      model: doubaoModelId,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: testPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    };
    
    console.log('开始调用豆包API...');
    console.log('图片URL:', imageUrl);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(doubaoApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': doubaoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30秒超时
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`豆包API响应时间: ${responseTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('豆包API调用失败:', response.status, errorText);
        
        return NextResponse.json({
          success: false,
          error: '豆包API调用失败',
          details: {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            responseTime,
            imageUrl
          }
        }, { status: 500 });
      }
      
      const result = await response.json();
      console.log('豆包API调用成功');
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        return NextResponse.json({
          success: false,
          error: '豆包API返回格式异常',
          details: {
            result,
            responseTime,
            imageUrl
          }
        }, { status: 500 });
      }
      
      const aiResponse = result.choices[0].message.content;
      console.log('豆包AI回复:', aiResponse);
      
      // 判断是否成功访问图片
      const accessSuccess = aiResponse.includes('图片访问成功') || 
                           aiResponse.includes('看到') || 
                           aiResponse.includes('图片') ||
                           !aiResponse.includes('无法') && !aiResponse.includes('不能');
      
      return NextResponse.json({
        success: true,
        message: '豆包API测试完成',
        results: {
          imageUploadSuccess: true,
          imageUrl,
          doubaoApiSuccess: true,
          imageAccessSuccess: accessSuccess,
          aiResponse,
          responseTime,
          testFileName
        },
        conclusion: accessSuccess ? 
          '✅ 豆包API可以正常访问腾讯云COS图片！' : 
          '❌ 豆包API无法正常访问腾讯云COS图片'
      });
      
    } catch (fetchError) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.error('豆包API网络错误:', fetchError);
      
      return NextResponse.json({
        success: false,
        error: '豆包API网络错误',
        details: {
          errorMessage: fetchError instanceof Error ? fetchError.message : '未知错误',
          responseTime,
          imageUrl,
          errorType: 'network_error'
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('=== 测试过程出错 ===', error);
    
    return NextResponse.json({
      success: false,
      error: '测试过程出错',
      details: {
        errorMessage: error instanceof Error ? error.message : '未知错误',
        errorStack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: '请使用POST方法测试豆包API访问腾讯云COS图片',
    endpoint: '/api/test-doubao-cos',
    method: 'POST'
  });
}