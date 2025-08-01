'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function GraduationCheckContent() {
  const searchParams = useSearchParams();
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    qualified: boolean;
    message: string;
    details?: {
      standard1?: {
        name: string;
        pass: boolean;
        completed: number;
        total: number;
        pending: string[];
      };
      standard2?: {
        name: string;
        pass: boolean;
        completed: number;
        required: number;
        available: string[];
      };
      standard3?: {
        name: string;
        pass: boolean;
        completed: number;
        required: number;
        available: number;
      };
    };
  } | null>(null);

  // 初始化时读取URL参数或localStorage
  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    const savedStudentId = localStorage.getItem('lastStudentId');
    
    if (urlStudentId) {
      setStudentId(urlStudentId);
      localStorage.setItem('lastStudentId', urlStudentId);
    } else if (savedStudentId) {
      setStudentId(savedStudentId);
    }
  }, [searchParams]);

  const handleCheck = async () => {
    if (!studentId) {
      alert('请输入学号');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 调用Netlify Function检查毕业资格
      const response = await fetch('/api/check-graduation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        throw new Error('检查请求失败');
      }

      const data = await response.json();
      setResult(data);
      
    } catch (error) {
      console.error('Error checking graduation:', error);
      setResult({
        qualified: false,
        message: '检查失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            查询毕业资格
          </h1>

          <div className="bg-white rounded-lg shadow-md p-8">
            {/* 学号输入 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学号
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    localStorage.setItem('lastStudentId', e.target.value);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入学号"
                />
                <button
                  onClick={handleCheck}
                  disabled={loading || !studentId}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '检查中...' : '检查资格'}
                </button>
              </div>
            </div>

            {/* 检查结果 */}
            {result && (
              <div className="border-t pt-6">
                <div className={`p-6 rounded-lg ${
                  result.qualified 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      result.qualified ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {result.qualified ? (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className={`text-lg font-semibold ${
                        result.qualified ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.qualified ? '🎉 恭喜您！' : '😔 很遗憾'}
                      </h3>
                    </div>
                  </div>

                  <p className={`text-base mb-4 ${
                    result.qualified ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>

                  {/* 详细信息 - 三个标准 */}
                  {result.details && (
                    <div className="bg-white rounded-md p-4">
                      <h4 className="font-medium text-gray-800 mb-3">毕业标准检查详情</h4>
                      
                      {/* 标准一：必做作业 */}
                      {result.details.standard1 && (
                        <div className="mb-4 p-3 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-700">{result.details.standard1.name}</h5>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              result.details.standard1.pass 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.details.standard1.pass ? '✓ 通过' : '✗ 未通过'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            已完成: {result.details.standard1.completed}/{result.details.standard1.total} 个必做作业
                          </div>
                          {result.details.standard1.pending.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-red-600 mb-1">待完成作业:</p>
                              <ul className="text-xs text-red-500 space-y-1">
                                {result.details.standard1.pending.map((assignment, index) => (
                                  <li key={index}>• {assignment}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 标准二：第一周第二天下午选做作业 */}
                      {result.details.standard2 && (
                        <div className="mb-4 p-3 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-700">{result.details.standard2.name}</h5>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              result.details.standard2.pass 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.details.standard2.pass ? '✓ 通过' : '✗ 未通过'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            已完成: {result.details.standard2.completed}/{result.details.standard2.required} 个（至少需要{result.details.standard2.required}个）
                          </div>
                          {result.details.standard2.available.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 mb-1">可选作业:</p>
                              <ul className="text-xs text-gray-500 space-y-1">
                                {result.details.standard2.available.map((assignment, index) => (
                                  <li key={index}>• {assignment}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {!result.details.standard2.pass && (
                            <div className="mt-2 text-sm text-red-600">
                              ❌ 需要完成至少{result.details.standard2.required}个"第一周第二天下午"的选做作业
                            </div>
                          )}
                        </div>
                      )}

                      {/* 标准三：其他选做作业 */}
                      {result.details.standard3 && (
                        <div className="mb-4 p-3 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-700">{result.details.standard3.name}</h5>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              result.details.standard3.pass 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.details.standard3.pass ? '✓ 通过' : '✗ 未通过'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            已完成: {result.details.standard3.completed}/{result.details.standard3.required} 个（至少需要{result.details.standard3.required}个）
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            共有 {result.details.standard3.available} 个其他选做作业可选择
                          </div>
                          {!result.details.standard3.pass && (
                            <div className="mt-2 text-sm text-red-600">
                              ❌ 需要完成至少{result.details.standard3.required}个其他选做作业
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 操作建议 */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-2">接下来您可以:</h4>
                    <div className="space-y-2">
                      {result.qualified ? (
                        <p className="text-blue-700 text-sm">
                          您已满足所有毕业条件，可以联系管理员申请毕业证书。
                        </p>
                      ) : (
                        <div className="space-y-2 text-sm">
                          <Link 
                            href="/submit-assignment"
                            className="block text-blue-600 hover:text-blue-800 underline"
                          >
                            → 前往提交剩余的必做作业
                          </Link>
                          <Link 
                            href="/my-assignments"
                            className="block text-blue-600 hover:text-blue-800 underline"
                          >
                            → 查看我的作业提交记录
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 帮助信息 */}
            <div className="mt-8 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">💡 关于毕业资格审核</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p className="font-medium">毕业需要同时满足以下三个标准:</p>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>标准一</strong>：所有"必做"作业均需完成且状态为"合格"</li>
                  <li>• <strong>标准二</strong>："第一周第二天下午"的选做作业中至少完成1个</li>
                  <li>• <strong>标准三</strong>：其他选做作业中至少完成1个</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  只有三个标准全部满足，才能获得毕业资格。系统实时检查，满足条件后即可申请毕业证书。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GraduationCheckPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <GraduationCheckContent />
    </Suspense>
  );
}