'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DebugPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDouBaoConnection = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-doubao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testDouBaoDetailed = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/debug-doubao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testEnvironmentVariables = () => {
    const envTest = {
      hasNextPublicSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasNextPublicSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      // 注意：客户端无法访问非 NEXT_PUBLIC_ 的环境变量
      clientSideCheck: 'Only NEXT_PUBLIC_ variables are accessible on client side'
    };
    setTestResult(envTest);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🔧 系统诊断工具
          </h1>

          <div className="grid gap-6">
            {/* 豆包API连接测试 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                豆包API连接测试
              </h2>
              <p className="text-gray-600 mb-4">
                测试豆包API的连接状态和环境变量配置
              </p>
              <div className="space-x-3">
                <button
                  onClick={testDouBaoConnection}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '测试中...' : '快速测试'}
                </button>
                <button
                  onClick={testDouBaoDetailed}
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '诊断中...' : '详细诊断'}
                </button>
              </div>
            </div>

            {/* 环境变量检查 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                客户端环境变量检查
              </h2>
              <p className="text-gray-600 mb-4">
                检查客户端可访问的环境变量（仅限NEXT_PUBLIC_开头）
              </p>
              <button
                onClick={testEnvironmentVariables}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                检查环境变量
              </button>
            </div>

            {/* 测试结果显示 */}
            {testResult && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  测试结果
                </h2>
                <div className={`p-4 rounded-md ${
                  testResult.success === true 
                    ? 'bg-green-50 border border-green-200' 
                    : testResult.success === false
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 常见问题说明 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-4">
                💡 常见问题排查
              </h2>
              <div className="space-y-3 text-sm text-yellow-700">
                <div>
                  <strong>1. 环境变量未配置</strong>
                  <p>确保在Netlify项目设置中正确配置了所有环境变量</p>
                </div>
                <div>
                  <strong>2. 豆包API域名限制</strong>
                  <p>豆包可能限制了调用域名，需要在豆包控制台添加Netlify域名到白名单</p>
                </div>
                <div>
                  <strong>3. 网络超时</strong>
                  <p>Netlify Functions默认10秒超时，AI批改可能需要更长时间</p>
                </div>
                <div>
                  <strong>4. API密钥格式</strong>
                  <p>检查API密钥是否包含正确的"Bearer "前缀</p>
                </div>
              </div>
            </div>

            {/* 部署信息 */}
            <div className="bg-gray-100 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📊 部署信息
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>构建时间:</strong> {new Date().toISOString()}
                </div>
                <div>
                  <strong>Next.js版本:</strong> 15.4.4
                </div>
                <div>
                  <strong>Node环境:</strong> {typeof window === 'undefined' ? 'Server' : 'Client'}
                </div>
                <div>
                  <strong>用户代理:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}