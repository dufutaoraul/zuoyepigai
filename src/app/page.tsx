'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            在线学习与作业管理平台
          </h1>
          <p className="text-xl text-gray-600">
            智能化作业提交、批改和毕业资格审核
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* 提交作业 */}
            <Link href="/submit-assignment">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    提交作业
                  </h3>
                  <p className="text-gray-600">
                    选择作业并上传附件进行提交
                  </p>
                </div>
              </div>
            </Link>

            {/* 查询我的作业 */}
            <Link href="/my-assignments">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    查询我的作业
                  </h3>
                  <p className="text-gray-600">
                    查看作业提交历史和批改结果
                  </p>
                </div>
              </div>
            </Link>

            {/* 查询毕业资格 */}
            <Link href="/graduation-check">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    查询毕业资格
                  </h3>
                  <p className="text-gray-600">
                    检查是否满足毕业条件
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 管理员入口 */}
        <div className="text-center mt-12">
          <Link href="/admin">
            <div className="inline-flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              管理后台
            </div>
          </Link>
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-8">
          <p className="text-gray-500">
            基于Gemini AI自动批改 · 智能毕业资格审核
          </p>
        </div>
      </div>
    </div>
  );
}