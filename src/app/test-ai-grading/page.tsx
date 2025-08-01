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
      
      const response = await fetch('/api/grade-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: 'TEST123',
          assignmentId: '00000000-0000-0000-0000-000000000000',
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
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '测试中...' : '直接测试Gemini API'}
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
              <li>测试过程中请查看浏览器控制台获取详细日志</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}