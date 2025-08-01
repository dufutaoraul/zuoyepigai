'use client';

import { useState } from 'react';

export default function TestFormDataPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFormData = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // 创建一个测试文件
      const testFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
      formData.append('files', testFile);
      
      console.log('发送FormData测试请求...');
      
      const response = await fetch('/api/test-formdata', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('测试结果:', data);
      setResult(data);
      
    } catch (error) {
      console.error('测试失败:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setLoading(false);
    }
  };

  const testRealUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      console.log('发送真实文件上传请求...');
      
      const response = await fetch('/api/upload-files', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('上传结果:', data);
      setResult(data);
      
    } catch (error) {
      console.error('上传失败:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      testRealUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">FormData 测试页面</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">测试1：基础FormData解析</h2>
            <button
              onClick={testFormData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '测试中...' : '测试FormData解析'}
            </button>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">测试2：实际文件上传</h2>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {result && (
            <div>
              <h2 className="text-xl font-semibold mb-4">测试结果</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}