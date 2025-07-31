'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface StudentSubmissionDetail {
  submission_id: string;
  student_id: string;
  student_name: string;
  day_text: string;
  assignment_title: string;
  is_mandatory: boolean;
  description: string;
  attachments_url: string[];
  status: '批改中' | '合格' | '不合格' | '批改失败';
  feedback?: string;
  submission_date: string;
  graduation_status?: {
    qualified: boolean;
    details: string;
  };
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<StudentSubmissionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<Array<{student_id: string, student_name: string}>>([]);

  useEffect(() => {
    loadStudents();
    loadAllSubmissions();
  }, []);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('student_id, student_name')
        .order('student_name');
      
      if (error) {
        console.error('加载学生列表失败:', error);
        return;
      }
      
      setStudents(data || []);
    } catch (error) {
      console.error('加载学生列表异常:', error);
    }
  };

  const loadAllSubmissions = async () => {
    setLoading(true);
    try {
      // 复杂JOIN查询获取完整信息
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          submission_id,
          student_id,
          submission_date,
          attachments_url,
          status,
          feedback,
          assignment:assignments (
            assignment_id,
            assignment_title,
            day_text,
            is_mandatory,
            description
          ),
          student:students (
            student_id,
            student_name
          )
        `)
        .order('submission_date', { ascending: false });

      if (error) {
        console.error('加载提交数据失败:', error);
        return;
      }

      // 处理数据格式并添加毕业状态
      const processedSubmissions = await Promise.all(
        (data || []).map(async (item: any) => {
          const submission: StudentSubmissionDetail = {
            submission_id: item.submission_id,
            student_id: item.student_id,
            student_name: item.student?.student_name || '未知学员',
            day_text: item.assignment?.day_text || '未知时间',
            assignment_title: item.assignment?.assignment_title || '未知作业',
            is_mandatory: item.assignment?.is_mandatory || false,
            description: item.assignment?.description || '无描述',
            attachments_url: item.attachments_url || [],
            status: item.status,
            feedback: item.feedback,
            submission_date: item.submission_date,
          };

          // 获取毕业状态（异步计算）
          try {
            const graduationStatus = await checkGraduationStatus(item.student_id);
            submission.graduation_status = graduationStatus;
          } catch (error) {
            console.error(`计算学员 ${item.student_id} 毕业状态失败:`, error);
            submission.graduation_status = { qualified: false, details: '计算失败' };
          }

          return submission;
        })
      );

      setSubmissions(processedSubmissions);
    } catch (error) {
      console.error('加载数据异常:', error);
    } finally {
      setLoading(false);
    }
  };

  // 调用现有的毕业状态检查API
  const checkGraduationStatus = async (studentId: string) => {
    try {
      const response = await fetch('/api/check-graduation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        throw new Error('API调用失败');
      }

      const result = await response.json();
      return {
        qualified: result.qualified,
        details: result.message
      };
    } catch (error) {
      console.error('毕业状态检查失败:', error);
      return { qualified: false, details: '检查失败' };
    }
  };

  const filteredSubmissions = selectedStudent
    ? submissions.filter(s => s.student_id === selectedStudent)
    : submissions;

  const deleteSubmission = async (submissionId: string) => {
    if (!confirm('确定要删除这条提交记录吗？')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('submission_id', submissionId);

      if (error) {
        alert('删除失败: ' + error.message);
        return;
      }

      alert('删除成功');
      // 重新加载数据
      loadAllSubmissions();
    } catch (error) {
      console.error('删除异常:', error);
      alert('删除异常');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载管理数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">📊 学员作业管理后台</h1>
          
          {/* 筛选器 */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">筛选学员:</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部学员 ({submissions.length} 条记录)</option>
                {students.map(student => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.student_name} ({student.student_id})
                  </option>
                ))}
              </select>
              
              <button
                onClick={loadAllSubmissions}
                className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 刷新数据
              </button>
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">第几天</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">具体作业</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">必做/选做</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作业详细要求</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学员提交的作业</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI的作业评估</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">毕业合格统计</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.submission_id} className="hover:bg-gray-50">
                    {/* 学号 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.student_id}
                    </td>
                    {/* 姓名 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.student_name}
                    </td>
                    {/* 第几天 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.day_text}
                    </td>
                    {/* 具体作业 */}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <div className="font-medium">{submission.assignment_title}</div>
                      </div>
                    </td>
                    {/* 必做/选做 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.is_mandatory 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {submission.is_mandatory ? '必做' : '选做'}
                      </span>
                    </td>
                    {/* 作业详细要求 */}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <div className="text-gray-600 text-xs truncate" title={submission.description}>
                          {submission.description || '无详细要求'}
                        </div>
                      </div>
                    </td>
                    {/* 学员提交的作业 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col gap-1">
                        {submission.attachments_url.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs truncate max-w-32"
                          >
                            📎 附件{index + 1}
                          </a>
                        ))}
                        {submission.attachments_url.length === 0 && (
                          <span className="text-gray-400 text-xs">暂无附件</span>
                        )}
                      </div>
                    </td>
                    {/* AI的作业评估 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          submission.status === '合格' ? 'bg-green-100 text-green-800' :
                          submission.status === '不合格' ? 'bg-red-100 text-red-800' :
                          submission.status === '批改中' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status}
                        </span>
                        {submission.feedback && (
                          <div className="text-xs text-gray-500 mt-1 max-w-32 truncate" title={submission.feedback}>
                            {submission.feedback}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* 毕业合格统计 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.graduation_status ? (
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            submission.graduation_status.qualified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {submission.graduation_status.qualified ? '✅ 可毕业' : '❌ 不可毕业'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1 max-w-32 truncate" title={submission.graduation_status.details}>
                            {submission.graduation_status.details}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">计算中...</span>
                      )}
                    </td>
                    {/* 操作 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteSubmission(submission.submission_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        🗑️ 删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无数据</p>
          </div>
        )}
      </div>
    </div>
  );
}