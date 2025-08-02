'use client';

import { useState } from 'react';

export default function TestAIGradingPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAIGrading = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🧪 开始测试AI批改API...');
      
      // 首先获取一个真实的作业ID
      console.log('📋 获取测试作业信息...');
      const testAssignmentResponse = await fetch('/api/get-test-assignment');
      if (!testAssignmentResponse.ok) {
        throw new Error(`获取测试作业失败: ${testAssignmentResponse.status}`);
      }
      
      const testAssignmentData = await testAssignmentResponse.json();
      console.log('✅ 获取到测试作业:', testAssignmentData.assignment);
      
      const response = await fetch('/api/grade-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: 'TEST123',
          assignmentId: testAssignmentData.assignment.assignment_id,
          attachmentUrls: ['https://via.placeholder.com/300x200.png?text=Test+Image']
        })
      });
      
      console.log('📡 AI批改API响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API调用失败: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ AI批改API响应数据:', data);
      
      setResult(`✅ 测试成功！\n状态: ${response.status}\n结果: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      console.error('❌ AI批改API测试失败:', error);
      setResult(`❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const testGeminiDirect = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🔬 直接测试Gemini API...');
      
      const response = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: '这是一个测试',
          imageUrls: ['https://via.placeholder.com/300x200.png?text=Test+Image']
        })
      });
      
      console.log('📡 Gemini API响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API调用失败: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Gemini API响应数据:', data);
      
      setResult(`✅ Gemini测试成功！\n状态: ${response.status}\n结果: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      console.error('❌ Gemini API测试失败:', error);
      setResult(`❌ Gemini测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const testGeminiSimple = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🔍 简单Gemini连接测试...');
      
      const response = await fetch('/api/test-gemini-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      console.log('📡 简单测试响应状态:', response.status);
      
      const data = await response.json();
      console.log('✅ 简单测试响应数据:', data);
      
      if (data.success) {
        setResult(`✅ 简单连接测试成功！\nAI回复: ${data.aiResponse}\n完整结果: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 简单连接测试失败:\n错误: ${data.error}\n详情: ${data.details}\n完整结果: ${JSON.stringify(data, null, 2)}`);
      }
      
    } catch (error) {
      console.error('❌ 简单连接测试失败:', error);
      setResult(`❌ 简单连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const diagnoseNetwork = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🔍 开始网络诊断...');
      
      const response = await fetch('/api/diagnose-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      console.log('📡 网络诊断响应状态:', response.status);
      
      const data = await response.json();
      console.log('🔍 网络诊断结果:', data);
      
      if (data.success) {
        const diag = data.diagnostics;
        let resultText = `🔍 网络诊断报告 (${diag.timestamp})\n\n`;
        
        resultText += `📊 测试摘要:\n`;
        resultText += `- Google可达: ${diag.summary.canReachGoogle ? '✅' : '❌'}\n`;
        resultText += `- Gemini可达: ${diag.summary.canReachGemini ? '✅' : '❌'}\n`;
        resultText += `- DNS正常: ${diag.summary.dnsWorking ? '✅' : '❌'}\n`;
        resultText += `- 代理检测: ${diag.summary.proxyDetected ? '⚠️ 有代理' : '✅ 无代理'}\n\n`;
        
        resultText += `🌐 环境信息:\n`;
        resultText += `- API密钥: ${diag.environment.geminiApiKeyExists ? '✅ 存在' : '❌ 缺失'}\n`;
        resultText += `- 代理设置: ${diag.environment.hasHttpProxy || diag.environment.hasHttpsProxy ? '⚠️ 有' : '✅ 无'}\n\n`;
        
        if (diag.suggestions && diag.suggestions.length > 0) {
          resultText += `💡 建议:\n`;
          diag.suggestions.forEach((suggestion: string, index: number) => {
            resultText += `${index + 1}. ${suggestion}\n`;
          });
        }
        
        resultText += `\n📋 详细结果:\n${JSON.stringify(data, null, 2)}`;
        
        setResult(resultText);
      } else {
        setResult(`❌ 网络诊断失败:\n错误: ${data.error}\n详情: ${data.details}\n完整结果: ${JSON.stringify(data, null, 2)}`);
      }
      
    } catch (error) {
      console.error('❌ 网络诊断失败:', error);
      setResult(`❌ 网络诊断失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI批改功能测试</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div className="space-y-4">
            <button
              onClick={testAIGrading}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 mr-4"
            >
              {loading ? '测试中...' : '测试完整AI批改流程'}
            </button>
            
            <button
              onClick={testGeminiDirect}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mr-4"
            >
              {loading ? '测试中...' : '直接测试Gemini API'}
            </button>
            
            <button
              onClick={testGeminiSimple}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 mr-4"
            >
              {loading ? '测试中...' : '简单连接测试'}
            </button>
            
            <button
              onClick={diagnoseNetwork}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? '诊断中...' : '网络诊断'}
            </button>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">测试结果:</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
              {result || '点击按钮开始测试...'}
            </pre>
          </div>
          
          <div className="text-sm text-gray-600">
            <h4 className="font-medium mb-2">说明:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>完整AI批改流程</strong>: 测试整个批改API，包括数据库操作</li>
              <li><strong>直接Gemini API</strong>: 只测试Gemini File API的图片处理</li>
              <li><strong>简单连接测试</strong>: 测试Gemini API基本连接</li>
              <li><strong>网络诊断</strong>: 全面诊断网络连接问题</li>
              <li>测试过程中请查看浏览器控制台获取详细日志</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}