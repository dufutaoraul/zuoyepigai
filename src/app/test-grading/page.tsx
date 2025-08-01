'use client';

import { useState } from 'react';

interface TestResult {
  success: boolean;
  testType: string;
  error?: string;
  result?: any;
  aiResponse?: string;
  analysis?: any;
}

export default function TestGradingPage() {
  const [textResult, setTextResult] = useState<TestResult | null>(null);
  const [imageResult, setImageResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testTextGrading = async () => {
    setLoading(true);
    setTextResult(null);
    
    try {
      const response = await fetch('/api/test-text-grading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      setTextResult(result);
    } catch (error) {
      setTextResult({
        success: false,
        testType: 'text-grading',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testImageGrading = async (imageUrl?: string) => {
    setLoading(true);
    setImageResult(null);
    
    try {
      const response = await fetch('/api/test-image-grading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });
      
      const result = await response.json();
      setImageResult(result);
    } catch (error) {
      setImageResult({
        success: false,
        testType: 'image-grading',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (result: TestResult | null, title: string) => {
    if (!result) return null;

    const bgColor = result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = result.success ? 'text-green-800' : 'text-red-800';

    return (
      <div className={`${bgColor} border p-4 rounded mb-4`}>
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
          </div>
        )}

        {result.analysis && (
          <div className="mb-3">
            <strong>分析结果:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              {result.testType === 'text-only-grading' && (
                <>
                  <li>是否使用后备机制: {result.analysis.usedFallback ? '是' : '否'}</li>
                  <li>是否真实AI响应: {result.analysis.isRealAI ? '是' : '否'}</li>
                </>
              )}
              {result.testType === 'image-grading' && (
                <>
                  <li>能否访问图片: {result.analysis.canAccessImage ? '能' : '不能'}</li>
                  <li>图片访问被拒: {result.analysis.imageAccessDenied ? '是' : '否'}</li>
                </>
              )}
            </ul>
          </div>
        )}

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gray-600">查看完整响应</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🧪 AI批改诊断测试</h1>
      
      <div className="mb-6 space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="font-bold text-lg mb-2">测试目的</h2>
          <p className="text-sm text-gray-700">
            通过两个独立测试确定AI批改失败的具体原因：
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 text-sm text-gray-700">
            <li><strong>文本测试</strong>: 不包含图片的纯文本批改，验证基础AI功能</li>
            <li><strong>图片测试</strong>: 包含图片URL的批改，验证图片访问能力</li>
          </ul>
        </div>

        <div className="space-x-4">
          <button
            onClick={testTextGrading}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试文本批改'}
          </button>
          
          <button
            onClick={() => testImageGrading()}
            disabled={loading}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试图片批改'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {renderResult(textResult, '文本批改测试')}
        {renderResult(imageResult, '图片批改测试')}
        
        {textResult && imageResult && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-bold text-lg mb-2">🔍 综合诊断</h3>
            <div className="space-y-2 text-sm">
              {textResult.analysis?.isRealAI && imageResult.analysis?.canAccessImage && (
                <p className="text-green-700">✅ 文本和图片批改都正常，问题可能在实际业务逻辑中</p>
              )}
              {textResult.analysis?.isRealAI && !imageResult.analysis?.canAccessImage && (
                <p className="text-orange-700">⚠️ 文本批改正常，但图片访问有问题 - 这很可能是根本原因</p>
              )}
              {!textResult.analysis?.isRealAI && (
                <p className="text-red-700">❌ 连文本批改都无法正常工作，问题在AI服务配置</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}