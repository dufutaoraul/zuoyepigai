'use client';

import { useState } from 'react';

export default function TestDouBaoPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDouBao = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing DouBao API...');
      
      const response = await fetch('/api/test-doubao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log('DouBao test result:', data);
      setResult(data);
      
    } catch (error) {
      console.error('Test error:', error);
      setResult({ 
        success: false, 
        error: 'Network error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          DouBao API 连接测试
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={testDouBao}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试 DouBao API 连接'}
          </button>
          
          {result && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">测试结果:</h2>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              
              {result.success === false && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  <h3 className="font-bold">错误信息:</h3>
                  <p><strong>错误:</strong> {result.error}</p>
                  {result.details && <p><strong>详情:</strong> {result.details}</p>}
                  {result.statusCode && <p><strong>状态码:</strong> {result.statusCode}</p>}
                  <p><strong>API Key状态:</strong> {result.hasKey ? '已配置' : '未配置'}</p>
                </div>
              )}
              
              {result.success === true && (
                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  <h3 className="font-bold">连接成功! ✅</h3>
                  <p>DouBao API 正常工作</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}