'use client';

import { useState } from 'react';

interface EnvironmentInfo {
  success: boolean;
  environment: string;
  nodeVersion?: string;
  runtime?: string;
  envVars?: any;
  error?: string;
  aiResponse?: string;
  responseTime?: number;
}

export default function DebugComparePage() {
  const [nextjsResult, setNextjsResult] = useState<EnvironmentInfo | null>(null);
  const [netlifyResult, setNetlifyResult] = useState<EnvironmentInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const testEnvironments = async () => {
    setLoading(true);
    setNextjsResult(null);
    setNetlifyResult(null);

    try {
      // 并行测试两种环境
      const [nextjsResponse, netlifyResponse] = await Promise.allSettled([
        // 测试 Next.js API Route
        fetch('/api/debug-env', { 
          method: 'GET',
          cache: 'no-cache' 
        }).then(res => res.json()),
        
        // 测试 Netlify Function  
        fetch('/.netlify/functions/debug-env', { 
          method: 'GET',
          cache: 'no-cache'
        }).then(res => res.json())
      ]);

      if (nextjsResponse.status === 'fulfilled') {
        setNextjsResult(nextjsResponse.value);
      } else {
        setNextjsResult({
          success: false,
          environment: 'Next.js API Route',
          error: nextjsResponse.reason?.message || 'Request failed'
        });
      }

      if (netlifyResponse.status === 'fulfilled') {
        setNetlifyResult(netlifyResponse.value);
      } else {
        setNetlifyResult({
          success: false,
          environment: 'Netlify Function',
          error: netlifyResponse.reason?.message || 'Request failed'
        });
      }

    } catch (error) {
      console.error('环境测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAPICall = async () => {
    setLoading(true);

    try {
      // 并行测试API调用
      const [nextjsResponse, netlifyResponse] = await Promise.allSettled([
        // 测试 Next.js API Route 的外部API调用
        fetch('/api/debug-env', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache'
        }).then(res => res.json()),
        
        // 测试 Netlify Function 的外部API调用
        fetch('/.netlify/functions/debug-env', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache'
        }).then(res => res.json())
      ]);

      if (nextjsResponse.status === 'fulfilled') {
        setNextjsResult(nextjsResponse.value);
      } else {
        setNextjsResult({
          success: false,
          environment: 'Next.js API Route',
          error: nextjsResponse.reason?.message || 'API call failed'
        });
      }

      if (netlifyResponse.status === 'fulfilled') {
        setNetlifyResult(netlifyResponse.value);
      } else {
        setNetlifyResult({
          success: false,
          environment: 'Netlify Function',
          error: netlifyResponse.reason?.message || 'API call failed'
        });
      }

    } catch (error) {
      console.error('API调用测试失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (result: EnvironmentInfo | null, title: string) => {
    if (!result) {
      return (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          <p className="text-gray-500">暂无数据</p>
        </div>
      );
    }

    const bgColor = result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = result.success ? 'text-green-800' : 'text-red-800';

    return (
      <div className={`${bgColor} border p-4 rounded`}>
        <h3 className={`font-bold text-lg mb-2 ${textColor}`}>
          {title} {result.success ? '✅' : '❌'}
        </h3>
        
        {result.error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded">
            <strong>错误:</strong> {result.error}
          </div>
        )}

        {result.aiResponse && (
          <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded">
            <strong>AI响应:</strong> {result.aiResponse}
            {result.responseTime && <span className="text-sm text-gray-600"> ({result.responseTime}ms)</span>}
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div><strong>环境:</strong> {result.environment}</div>
          {result.nodeVersion && <div><strong>Node版本:</strong> {result.nodeVersion}</div>}
          {result.runtime && <div><strong>运行时:</strong> {result.runtime}</div>}
          
          {result.envVars && (
            <div>
              <strong>环境变量状态:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>DEEPSEEK_API_KEY: {result.envVars.DEEPSEEK_API_KEY ? '✅' : '❌'} 
                  {result.envVars.deepseekKeyPreview && <span className="text-xs text-gray-600"> ({result.envVars.deepseekKeyPreview})</span>}
                </li>
                <li>DEEPSEEK_API_URL: {result.envVars.DEEPSEEK_API_URL ? '✅' : '❌'}
                  {result.envVars.deepseekUrl && <span className="text-xs text-gray-600"> ({result.envVars.deepseekUrl})</span>}
                </li>
                <li>DEEPSEEK_MODEL_ID: {result.envVars.DEEPSEEK_MODEL_ID ? '✅' : '❌'}
                  {result.envVars.deepseekModel && <span className="text-xs text-gray-600"> ({result.envVars.deepseekModel})</span>}
                </li>
                <li>SUPABASE_SERVICE_ROLE_KEY: {result.envVars.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}</li>
              </ul>
            </div>
          )}
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gray-600">查看完整响应</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🔍 环境对比调试</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={testEnvironments}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '测试中...' : '测试环境信息'}
        </button>
        
        <button
          onClick={testAPICall}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? '测试中...' : '测试API调用'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderResult(nextjsResult, 'Next.js API Route')}
        {renderResult(netlifyResult, 'Netlify Function')}
      </div>

      {nextjsResult && netlifyResult && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-bold text-lg mb-2">📊 对比分析</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>环境变量访问对比:</strong>
              <ul className="list-disc list-inside ml-4">
                <li>Next.js API Route: {nextjsResult.envVars?.DEEPSEEK_API_KEY ? '可以访问' : '无法访问'} DeepSeek API Key</li>
                <li>Netlify Function: {netlifyResult.envVars?.DEEPSEEK_API_KEY ? '可以访问' : '无法访问'} DeepSeek API Key</li>
              </ul>
            </div>
            <div>
              <strong>API调用成功率:</strong>
              <ul className="list-disc list-inside ml-4">
                <li>Next.js API Route: {nextjsResult.success && nextjsResult.aiResponse ? '成功' : '失败'}</li>
                <li>Netlify Function: {netlifyResult.success && netlifyResult.aiResponse ? '成功' : '失败'}</li>
              </ul>
            </div>
            {nextjsResult.responseTime && netlifyResult.responseTime && (
              <div>
                <strong>响应时间对比:</strong>
                <ul className="list-disc list-inside ml-4">
                  <li>Next.js API Route: {nextjsResult.responseTime}ms</li>
                  <li>Netlify Function: {netlifyResult.responseTime}ms</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}