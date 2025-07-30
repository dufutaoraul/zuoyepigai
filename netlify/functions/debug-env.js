// Netlify Function 环境检测
exports.handler = async (event, context) => {
  console.log('🔍 Netlify Function 环境检测开始');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 收集运行时环境信息
    const envInfo = {
      // 基本环境信息
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      
      // Netlify Function 运行时信息
      runtime: 'netlify-function',
      awsLambdaVersion: context.awsRequestId ? 'AWS Lambda' : 'Local',
      
      // 环境变量检查 - 详细记录
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
        deepseekModel: process.env.DEEPSEEK_MODEL_ID || 'undefined',
        supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'undefined'
      },
      
      // 全局对象检查
      globals: {
        hasFetch: typeof fetch !== 'undefined',
        hasProcess: typeof process !== 'undefined',
        hasBuffer: typeof Buffer !== 'undefined',
        hasConsole: typeof console !== 'undefined',
        hasRequire: typeof require !== 'undefined'
      },
      
      // 时间戳和位置信息
      timestamp: new Date().toISOString(),
      location: 'Netlify Function',
      isProduction: process.env.NODE_ENV === 'production',
      
      // Netlify 特定信息
      netlifyInfo: {
        isNetlify: !!process.env.NETLIFY,
        buildId: process.env.BUILD_ID || 'undefined',
        site: process.env.SITE_NAME || 'undefined',
        deployUrl: process.env.DEPLOY_URL || 'undefined',
        functionName: context.functionName || 'undefined',
        region: process.env.AWS_REGION || 'undefined'
      },
      
      // Lambda context 信息
      lambdaContext: {
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        awsRequestId: context.awsRequestId,
        memoryLimitInMB: context.memoryLimitInMB,
        remainingTimeInMillis: context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : 'N/A'
      }
    };

    console.log('📊 Netlify Function 详细环境信息:', JSON.stringify(envInfo, null, 2));

    // 如果是POST请求，测试外部API调用
    if (event.httpMethod === 'POST') {
      console.log('🧪 Netlify Function 测试外部API调用...');
      
      const apiKey = process.env.DEEPSEEK_API_KEY;
      const apiUrl = process.env.DEEPSEEK_API_URL;
      const modelId = process.env.DEEPSEEK_MODEL_ID;
      
      console.log('🔑 API配置检查:', {
        hasApiKey: !!apiKey,
        hasApiUrl: !!apiUrl,
        hasModelId: !!modelId,
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiUrl: apiUrl,
        modelId: modelId
      });
      
      if (!apiKey || !apiUrl) {
        const missingConfig = {
          success: false,
          error: 'Missing API configuration in Netlify Function',
          hasApiKey: !!apiKey,
          hasApiUrl: !!apiUrl,
          hasModelId: !!modelId,
          environment: 'Netlify Function',
          envInfo
        };
        
        console.error('❌ Netlify Function 配置缺失:', missingConfig);
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify(missingConfig)
        };
      }

      try {
        // 动态导入 node-fetch
        let fetchFunction;
        try {
          const { default: nodeFetch } = await import('node-fetch');
          fetchFunction = nodeFetch;
          console.log('✅ 使用 node-fetch');
        } catch (importError) {
          // 如果 node-fetch 不可用，尝试使用全局 fetch
          if (typeof fetch !== 'undefined') {
            fetchFunction = fetch;
            console.log('✅ 使用全局 fetch');
          } else {
            throw new Error('No fetch implementation available');
          }
        }

        const startTime = Date.now();
        
        const requestBody = {
          model: modelId || 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: 'Test from Netlify Function - please reply "SUCCESS"'
            }
          ],
          max_tokens: 50,
          temperature: 0.1
        };
        
        console.log('📤 发送请求到DeepSeek API...');
        console.log('📋 请求配置:', {
          url: apiUrl,
          model: requestBody.model,
          authHeader: `Bearer ${apiKey.substring(0, 10)}...`
        });

        const response = await fetchFunction(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Netlify-Function-Debug/1.0'
          },
          body: JSON.stringify(requestBody),
          timeout: 30000
        });

        const responseTime = Date.now() - startTime;
        
        console.log('📨 DeepSeek API 响应:', {
          status: response.status,
          statusText: response.statusText,
          responseTime,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ DeepSeek API 调用失败:', errorText);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: false,
              error: `DeepSeek API call failed: ${response.status}`,
              errorDetails: errorText,
              responseTime,
              environment: 'Netlify Function',
              envInfo
            })
          };
        }

        const result = await response.json();
        console.log('✅ DeepSeek API 调用成功:', result);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'External API call successful from Netlify Function',
            responseTime,
            aiResponse: result.choices?.[0]?.message?.content,
            environment: 'Netlify Function',
            envInfo
          })
        };

      } catch (apiError) {
        console.error('💥 Netlify Function API调用异常:', apiError);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            error: apiError.message || 'Unknown API error',
            errorType: apiError.name || 'Unknown',
            environment: 'Netlify Function',
            envInfo
          })
        };
      }
    }

    // GET请求返回环境信息
    return {
      statusCode: 200,  
      headers,
      body: JSON.stringify({
        success: true,
        environment: 'Netlify Function',
        ...envInfo
      })
    };

  } catch (error) {
    console.error('💥 Netlify Function 环境检测错误:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        environment: 'Netlify Function',
        timestamp: new Date().toISOString()
      })
    };
  }
};