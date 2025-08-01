// 部署调试脚本 - 本地测试AI API连接
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });

async function testDeepSeekConnection() {
  console.log('🔍 开始DeepSeek API连接测试...');
  
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const modelId = process.env.DEEPSEEK_MODEL_ID || 'deepseek-chat';
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  
  console.log('📋 环境变量检查:', {
    hasApiKey: !!apiKey,
    hasModelId: !!modelId,
    hasApiUrl: !!apiUrl,
    apiKeyPreview: apiKey ? apiKey.substring(0, 15) + '...' : 'null',
    modelId: modelId,
    apiUrl: apiUrl
  });
  
  if (!apiKey) {
    console.error('❌ DEEPSEEK_API_KEY 未配置');
    return false;
  }
  
  try {
    // 动态导入 node-fetch
    const { default: fetch } = await import('node-fetch');
    
    const requestBody = {
      model: modelId,
      messages: [
        {
          role: 'user',
          content: '测试连接，请回复"连接成功"'
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    };
    
    console.log('📤 发送测试请求...');
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DeepSeek-Test/1.0'
      },
      body: JSON.stringify(requestBody),
      timeout: 30000
    });
    
    const responseTime = Date.now() - startTime;
    console.log('⏱️ 响应时间:', responseTime, 'ms');
    console.log('📨 HTTP状态码:', response.status);
    console.log('📨 响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📨 响应内容长度:', responseText.length);
    console.log('📨 响应内容预览:', responseText.substring(0, 300));
    
    // 检查是否是HTML响应（通常表示访问被阻止）
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('❌ 返回HTML页面，可能的原因：');
      console.error('  - 域名不在DeepSeek API白名单中');
      console.error('  - 地理位置限制');
      console.error('  - API服务被防火墙阻止');
      return false;
    }
    
    if (!response.ok) {
      console.error('❌ API请求失败:', response.status);
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ 错误详情:', errorData);
        
        // 分析具体错误类型
        if (errorData.error) {
          const error = errorData.error;
          if (error.code === 'invalid_api_key') {
            console.error('💡 建议: 检查API密钥是否正确');
          } else if (error.code === 'insufficient_quota') {
            console.error('💡 建议: 检查账户余额');
          } else if (error.code === 'rate_limit_exceeded') {
            console.error('💡 建议: 等待一段时间后重试');
          } else if (error.code === 'model_not_found') {
            console.error('💡 建议: 检查模型ID是否正确');
          }
        }
      } catch (parseError) {
        console.error('❌ 错误响应格式异常');
      }
      return false;
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ API连接成功!');
      console.log('📝 AI响应:', result.choices?.[0]?.message?.content);
      return true;
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError.message);
      return false;
    }
    
  } catch (error) {
    console.error('💥 网络错误:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 建议: 检查网络连接和DNS设置');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 建议: DeepSeek API服务可能不可用');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 建议: 网络超时，尝试稍后重试');
    }
    
    return false;
  }
}

async function testSupabaseConnection() {
  console.log('\n🔍 开始Supabase连接测试...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📋 Supabase配置检查:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!serviceKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'null'
  });
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Supabase环境变量缺失');
    return false;
  }
  
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // 测试数据库连接
    const { data, error } = await supabase
      .from('assignments')
      .select('assignment_id, assignment_title')
      .limit(1);
      
    if (error) {
      console.error('❌ Supabase连接失败:', error.message);
      return false;
    }
    
    console.log('✅ Supabase连接成功!');
    console.log('📊 测试数据:', data);
    return true;
    
  } catch (error) {
    console.error('💥 Supabase连接错误:', error.message);
    return false;
  }
}

// 主测试流程
async function runDiagnostics() {
  console.log('🚀 开始部署诊断测试...\n');
  
  const deepSeekOk = await testDeepSeekConnection();
  const supabaseOk = await testSupabaseConnection();
  
  console.log('\n📊 诊断结果汇总:');
  console.log('- DeepSeek API:', deepSeekOk ? '✅ 正常' : '❌ 异常');
  console.log('- Supabase DB:', supabaseOk ? '✅ 正常' : '❌ 异常');
  
  if (!deepSeekOk || !supabaseOk) {
    console.log('\n🔧 修复建议:');
    if (!deepSeekOk) {
      console.log('1. 检查DeepSeek API密钥和网络连接');
      console.log('2. 尝试使用VPN或代理');
      console.log('3. 联系DeepSeek客服确认服务状态');
    }
    if (!supabaseOk) {
      console.log('1. 检查Supabase URL和Service Key');
      console.log('2. 确认数据库表结构正确');
    }
  } else {
    console.log('\n🎉 所有服务连接正常，部署应该可以成功！');
  }
}

// 运行诊断
runDiagnostics().catch(error => {
  console.error('💥 诊断脚本运行失败:', error);
  process.exit(1);
});