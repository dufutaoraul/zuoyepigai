// AI调用诊断工具 - 分析是否真正调用了DeepSeek
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function analyzeAICall() {
  console.log('🔍 分析AI批改调用情况...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Supabase配置缺失');
    return;
  }
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // 1. 查看最近的提交记录
    console.log('1️⃣ 查看最近的作业提交记录...');
    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (submissionError) {
      console.error('❌ 查询提交记录失败:', submissionError);
      return;
    }
    
    console.log('📊 最近5次提交:');
    submissions.forEach((sub, index) => {
      console.log(`${index + 1}. 学员ID: ${sub.student_id}`);
      console.log(`   作业: ${sub.assignment_id}`);
      console.log(`   状态: ${sub.status}`);
      console.log(`   反馈: ${sub.feedback}`);
      console.log(`   时间: ${sub.created_at}`);
      console.log('---');
    });
    
    // 2. 分析批改结果类型
    console.log('\n2️⃣ 分析批改结果类型...');
    const recentSubmission = submissions[0];
    
    if (!recentSubmission) {
      console.log('❌ 没有找到提交记录');
      return;
    }
    
    const feedback = recentSubmission.feedback;
    
    // 判断是否为后备机制响应
    if (feedback.includes('AI批改服务暂时不可用')) {
      console.log('🔧 结果分析: 触发了后备机制');
      console.log('📝 原因可能是:');
      console.log('   - DeepSeek API调用失败');
      console.log('   - 网络连接问题');
      console.log('   - API密钥或配置错误');
      console.log('   - 服务器环境限制');
      
      return 'FALLBACK';
    }
    
    // 判断是否为真实AI响应
    if (feedback.includes('恭喜您，您的作业审核合格') || 
        feedback.includes('不合格') && !feedback.includes('AI批改服务暂时不可用')) {
      console.log('✅ 结果分析: 真实的AI批改响应');
      console.log('🤖 这是DeepSeek的真实回复');
      
      return 'REAL_AI';
    }
    
    // 其他情况
    console.log('❓ 结果分析: 未知类型的响应');
    console.log('📝 反馈内容:', feedback);
    
    return 'UNKNOWN';
    
  } catch (error) {
    console.error('💥 诊断过程出错:', error);
  }
}

async function testDeepSeekDirectly() {
  console.log('\n3️⃣ 直接测试DeepSeek API...');
  
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
  
  if (!apiKey) {
    console.log('❌ DeepSeek API密钥未配置');
    return false;
  }
  
  try {
    const { default: fetch } = await import('node-fetch');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: '测试：请判断一个作业是否合格，如果是测试请回复"这是一个测试调用"'
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      }),
      timeout: 30000
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ DeepSeek API调用失败:', response.status);
      console.log('📝 错误详情:', errorText);
      
      // 分析错误类型
      if (response.status === 401) {
        console.log('💡 问题: API密钥无效或过期');
      } else if (response.status === 429) {
        console.log('💡 问题: 请求频率超限或余额不足');
      } else if (response.status === 403) {
        console.log('💡 问题: 权限不足或地理位置限制');
      }
      
      return false;
    }
    
    const result = await response.json();
    console.log('✅ DeepSeek API调用成功!');
    console.log('🤖 AI响应:', result.choices[0].message.content);
    
    return true;
    
  } catch (error) {
    console.log('❌ DeepSeek API调用异常:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 问题: 无法解析DeepSeek API域名');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 问题: 连接被拒绝，可能是网络限制');
    }
    
    return false;
  }
}

// 主诊断流程
async function runDiagnosis() {
  console.log('🚀 开始AI调用诊断...\n');
  
  const callType = await analyzeAICall();
  const apiWorking = await testDeepSeekDirectly();
  
  console.log('\n📊 诊断结果汇总:');
  console.log('- 最近批改类型:', callType);
  console.log('- DeepSeek API状态:', apiWorking ? '✅ 正常' : '❌ 异常');
  
  console.log('\n🔧 建议操作:');
  if (callType === 'FALLBACK' && !apiWorking) {
    console.log('1. 检查Netlify环境变量中的DEEPSEEK_API_KEY');
    console.log('2. 确认DEEPSEEK_API_URL配置正确');
    console.log('3. 检查DeepSeek账户余额和权限');
    console.log('4. 可能需要使用VPN或代理访问DeepSeek API');
  } else if (callType === 'FALLBACK' && apiWorking) {
    console.log('1. 本地API正常，但Netlify环境有问题');
    console.log('2. 检查Netlify的环境变量配置');
    console.log('3. 查看Netlify Functions日志');
  } else if (callType === 'REAL_AI') {
    console.log('✅ AI批改功能正常工作');
  }
}

runDiagnosis().catch(console.error);