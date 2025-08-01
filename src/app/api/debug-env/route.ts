import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // 收集运行时环境信息
    const envInfo = {
      // 基本环境信息
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      
      // Next.js 运行时信息
      runtime: process.env.NEXT_RUNTIME || 'nodejs',
      
      // 环境变量检查
      envVars: {
        DEEPSEEK_API_KEY: !!process.env.DEEPSEEK_API_KEY,
        DEEPSEEK_MODEL_ID: !!process.env.DEEPSEEK_MODEL_ID, 
        DEEPSEEK_API_URL: !!process.env.DEEPSEEK_API_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        
        // 显示实际值的前几位（用于调试）
        deepseekKeyPreview: process.env.DEEPSEEK_API_KEY ? 
          process.env.DEEPSEEK_API_KEY.substring(0, 15) + '...' : 'undefined',
        deepseekUrl: process.env.DEEPSEEK_API_URL || 'undefined',
        deepseekModel: process.env.DEEPSEEK_MODEL_ID || 'undefined'
      },
      
      // 全局对象检查
      globals: {
        hasFetch: typeof fetch !== 'undefined',
        hasProcess: typeof process !== 'undefined',
        hasBuffer: typeof Buffer !== 'undefined',
        hasConsole: typeof console !== 'undefined'
      },
      
      // 时间戳和位置信息
      timestamp: new Date().toISOString(),
      location: process.env.NETLIFY ? 'Netlify' : 'Local',
      isProduction: process.env.NODE_ENV === 'production',
      
      // Netlify 特定信息
      netlifyInfo: {
        isNetlify: !!process.env.NETLIFY,
        buildId: process.env.BUILD_ID || 'undefined',
        site: process.env.SITE_NAME || 'undefined',
        deployUrl: process.env.DEPLOY_URL || 'undefined'
      }
    };

    console.log('🔍 Next.js API Route 环境信息:', envInfo);

    return NextResponse.json({
      success: true,
      environment: 'Next.js API Route',
      ...envInfo
    });

  } catch (error) {
    console.error('💥 环境检测错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: 'Next.js API Route',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  // 测试能否进行外部API调用
  try {
    console.log('🧪 测试外部API调用能力...');
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.DEEPSEEK_API_URL;
    
    if (!apiKey || !apiUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing API configuration',
        hasApiKey: !!apiKey,
        hasApiUrl: !!apiUrl,
        environment: 'Next.js API Route'
      });
    }

    // 尝试调用DeepSeek API
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL_ID || 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'Test from Next.js API Route - please reply "SUCCESS"'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(30000)
    });

    const responseTime = Date.now() - startTime;
    
    console.log('📊 API调用结果:', {
      status: response.status,
      responseTime,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `API call failed: ${response.status}`,
        errorDetails: errorText,
        responseTime,
        environment: 'Next.js API Route'
      });
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'External API call successful',
      responseTime,
      aiResponse: result.choices?.[0]?.message?.content,
      environment: 'Next.js API Route'
    });

  } catch (error) {
    console.error('💥 外部API调用失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown',
      environment: 'Next.js API Route'
    }, { status: 500 });
  }
}