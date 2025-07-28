'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GraduationCheckPage() {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    qualified: boolean;
    message: string;
    details?: {
      totalMandatory: number;
      completedMandatory: number;
      pendingAssignments: string[];
    };
  } | null>(null);

  const handleCheck = async () => {
    if (!studentId) {
      alert('请输入学号');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 调用Dify工作流检查毕业资格
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
                  onChange={(e) => setStudentId(e.target.value)}
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

                  {/* 详细信息 */}
                  {result.details && (
                    <div className="bg-white rounded-md p-4">
                      <h4 className="font-medium text-gray-800 mb-3">详细信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>必做作业总数:</span>
                          <span className="font-medium">{result.details.totalMandatory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>已完成必做作业:</span>
                          <span className="font-medium text-green-600">{result.details.completedMandatory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>完成率:</span>
                          <span className="font-medium">
                            {((result.details.completedMandatory / result.details.totalMandatory) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* 未完成的作业列表 */}
                      {result.details.pendingAssignments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-medium text-red-700 mb-2">需要完成的必做作业:</h5>
                          <ul className="space-y-1">
                            {result.details.pendingAssignments.map((assignment, index) => (
                              <li key={index} className="text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {assignment}
                              </li>
                            ))}
                          </ul>
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
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 需要完成所有"必做"作业且状态为"合格"</li>
                <li>• "选做"作业不影响毕业资格，但可以提升综合能力</li>
                <li>• 系统实时检查，一旦满足条件即可申请毕业</li>
                <li>• 如有疑问，请联系管理员或教师</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}