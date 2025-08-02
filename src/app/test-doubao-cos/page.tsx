'use client';

import { useState } from 'react';

export default function TestDoubaoCoS() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      console.log('开始测试豆包API访问腾讯云COS...');
      
      const response = await fetch('/api/test-doubao-cos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResult(data);
      
      console.log('测试结果:', data);
    } catch (error) {
      console.error('测试出错:', error);
      setResult({
        success: false,
        error: '测试请求失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 豆包API访问腾讯云COS测试
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              这个测试将验证豆包API能否正常访问腾讯云COS存储的图片，用于解决AI批改超时问题。
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">测试流程：</h3>
              <ol className="list-decimal list-inside text-blue-800 space-y-1">
                <li>上传一张测试图片到腾讯云COS</li>
                <li>调用豆包API分析这张图片</li>
                <li>检查豆包是否能正常访问并处理图片</li>
                <li>测量响应时间和成功率</li>
              </ol>
            </div>
          </div>

          <button
            onClick={runTest}
            disabled={testing}
            className={`px-6 py-3 rounded-lg font-medium ${
              testing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {testing ? '测试中...' : '开始测试'}
          </button>

          {testing && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                <span className="text-yellow-800">正在测试豆包API访问腾讯云COS，请稍候...</span>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">
                📊 测试结果
              </h2>
              
              <div className={`rounded-lg p-4 border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className={`font-semibold mb-3 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? '✅ 测试成功' : '❌ 测试失败'}
                </div>

                {result.success && result.results && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>图片上传：</strong>
                        <span className={result.results.imageUploadSuccess ? 'text-green-600' : 'text-red-600'}>
                          {result.results.imageUploadSuccess ? ' 成功' : ' 失败'}
                        </span>
                      </div>
                      <div>
                        <strong>豆包API调用：</strong>
                        <span className={result.results.doubaoApiSuccess ? 'text-green-600' : 'text-red-600'}>
                          {result.results.doubaoApiSuccess ? ' 成功' : ' 失败'}
                        </span>
                      </div>
                      <div>
                        <strong>图片访问：</strong>
                        <span className={result.results.imageAccessSuccess ? 'text-green-600' : 'text-red-600'}>
                          {result.results.imageAccessSuccess ? ' 成功' : ' 失败'}
                        </span>
                      </div>
                      <div>
                        <strong>响应时间：</strong>
                        <span className="text-blue-600"> {result.results.responseTime}ms</span>
                      </div>
                    </div>
                    
                    {result.results.imageUrl && (
                      <div>
                        <strong>测试图片URL：</strong>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-xs break-all">
                          {result.results.imageUrl}
                        </div>
                      </div>
                    )}
                    
                    {result.results.aiResponse && (
                      <div>
                        <strong>豆包AI回复：</strong>
                        <div className="mt-1 p-3 bg-gray-100 rounded">
                          {result.results.aiResponse}
                        </div>
                      </div>
                    )}
                    
                    {result.conclusion && (
                      <div className="mt-4 p-3 bg-blue-100 rounded font-medium text-blue-900">
                        {result.conclusion}
                      </div>
                    )}
                  </div>
                )}

                {!result.success && (
                  <div className="space-y-3">
                    <div>
                      <strong>错误信息：</strong>
                      <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                        {result.error}
                      </div>
                    </div>
                    
                    {result.details && (
                      <div>
                        <strong>详细信息：</strong>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}