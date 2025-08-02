import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      canReachGoogle: false,
      canReachGemini: false,
      dnsWorking: false,
      proxyDetected: false
    }
  };

  try {
    console.log('🔍 开始网络诊断...');

    // 测试1: 基本Google连接
    console.log('📡 测试Google基本连接...');
    try {
      const googleResponse = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
      diagnostics.tests.googleBasic = {
        success: true,
        status: googleResponse.status,
        headers: Object.fromEntries(googleResponse.headers.entries())
      };
      diagnostics.summary.canReachGoogle = true;
      console.log('✅ Google基本连接成功');
    } catch (error) {
      diagnostics.tests.googleBasic = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.log('❌ Google基本连接失败:', error);
    }

    // 测试2: DNS解析测试
    console.log('🌐 测试DNS解析...');
    try {
      const dnsResponse = await fetch('https://8.8.8.8', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      diagnostics.tests.dnsTest = {
        success: true,
        status: dnsResponse.status
      };
      diagnostics.summary.dnsWorking = true;
      console.log('✅ DNS解析正常');
    } catch (error) {
      diagnostics.tests.dnsTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.log('❌ DNS解析问题:', error);
    }

    // 测试3: 直接测试Gemini API域名连通性
    console.log('⚡ 测试Gemini API域名连通性...');
    try {
      const geminiDomainResponse = await fetch('https://generativelanguage.googleapis.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
      diagnostics.tests.geminiDomain = {
        success: true,
        status: geminiDomainResponse.status,
        headers: Object.fromEntries(geminiDomainResponse.headers.entries())
      };
      diagnostics.summary.canReachGemini = true;
      console.log('✅ Gemini域名可达');
    } catch (error) {
      diagnostics.tests.geminiDomain = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.log('❌ Gemini域名不可达:', error);
    }

    // 测试4: 尝试使用不同的User-Agent
    console.log('🎭 测试不同User-Agent...');
    try {
      const userAgentResponse = await fetch('https://generativelanguage.googleapis.com', {
        method: 'HEAD',
        headers: {
          'User-Agent': 'curl/7.68.0'
        },
        signal: AbortSignal.timeout(10000)
      });
      diagnostics.tests.differentUserAgent = {
        success: true,
        status: userAgentResponse.status
      };
      console.log('✅ 不同User-Agent成功');
    } catch (error) {
      diagnostics.tests.differentUserAgent = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.log('❌ 不同User-Agent失败:', error);
    }

    // 测试5: 检查环境变量
    diagnostics.environment = {
      nodeEnv: process.env.NODE_ENV,
      hasHttpProxy: !!process.env.HTTP_PROXY,
      hasHttpsProxy: !!process.env.HTTPS_PROXY,
      hasAllProxy: !!process.env.ALL_PROXY,
      geminiApiKeyExists: !!process.env.GEMINI_API_KEY,
      geminiApiKeyPrefix: process.env.GEMINI_API_KEY ? 
        process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'Not found'
    };

    // 检查代理
    if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.ALL_PROXY) {
      diagnostics.summary.proxyDetected = true;
    }

    // 生成建议
    const suggestions = [];
    
    if (!diagnostics.summary.canReachGoogle) {
      suggestions.push('无法连接Google，可能是网络防火墙或代理问题');
    }
    
    if (!diagnostics.summary.canReachGemini) {
      suggestions.push('无法连接Gemini API域名，可能被屏蔽或需要代理');
      suggestions.push('尝试使用VPN或代理服务器');
      suggestions.push('检查公司/学校网络是否屏蔽Google服务');
    }
    
    if (diagnostics.summary.proxyDetected) {
      suggestions.push('检测到代理设置，确认代理配置是否正确');
    }
    
    if (!diagnostics.summary.dnsWorking) {
      suggestions.push('DNS解析可能有问题，尝试更换DNS服务器');
    }

    diagnostics.suggestions = suggestions;

    return NextResponse.json({
      success: true,
      diagnostics: diagnostics
    });

  } catch (error) {
    console.error('💥 网络诊断异常:', error);
    
    return NextResponse.json({
      success: false,
      error: '网络诊断失败',
      details: error instanceof Error ? error.message : '未知错误',
      partialDiagnostics: diagnostics
    }, { status: 500 });
  }
}