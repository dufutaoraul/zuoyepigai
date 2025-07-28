'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Submission, Assignment } from '@/types';

interface SubmissionWithAssignment extends Submission {
  assignment: Assignment;
}

export default function MyAssignmentsPage() {
  const [studentId, setStudentId] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionWithAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // 查询学员作业提交历史
  const fetchSubmissions = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assignment:assignments(*)
        `)
        .eq('student_id', studentId)
        .order('submission_date', { ascending: false });

      if (error) throw error;
      
      setSubmissions(data || []);
      if (data?.length === 0) {
        setMessage('暂无作业提交记录');
      } else {
        setMessage('');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setMessage('查询失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理重新提交
  const handleResubmit = async (submissionId: string) => {
    if (newFiles.length === 0) {
      setMessage('请选择要上传的文件');
      return;
    }

    setLoading(true);
    try {
      // 上传新文件
      const attachmentUrls: string[] = [];
      
      for (const file of newFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('assignments')
          .upload(fileName, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(fileName);
        
        attachmentUrls.push(publicUrl);
      }

      // 更新提交记录
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          attachments_url: attachmentUrls,
          status: '批改中',
          feedback: null
        })
        .eq('submission_id', submissionId);

      if (updateError) throw updateError;

      // 触发重新批改
      const submission = submissions.find(s => s.submission_id === submissionId);
      if (submission) {
        try {
          await fetch('/api/grade-assignment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId,
              assignmentId: submission.assignment_id,
              attachmentUrls
            })
          });
        } catch (error) {
          console.error('Error triggering AI grading:', error);
        }
      }

      setMessage('重新提交成功！正在进行AI批改...');
      setEditingSubmission(null);
      setNewFiles([]);
      fetchSubmissions();
      
    } catch (error) {
      console.error('Error resubmitting assignment:', error);
      setMessage('重新提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '合格':
        return 'bg-green-100 text-green-800';
      case '不合格':
        return 'bg-red-100 text-red-800';
      case '批改中':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
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

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            查询我的作业
          </h1>

          {/* 学号输入 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  请输入学号
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入学号查询作业记录"
                />
              </div>
              <button
                onClick={fetchSubmissions}
                disabled={loading || !studentId}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '查询中...' : '查询'}
              </button>
            </div>
          </div>

          {/* 消息显示 */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.includes('成功') 
                ? 'bg-green-100 text-green-800' 
                : message.includes('失败')
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {message}
            </div>
          )}

          {/* 作业列表 */}
          {submissions.length > 0 && (
            <div className="space-y-6">
              {submissions.map((submission) => (
                <div key={submission.submission_id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {submission.assignment.assignment_title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>第{submission.assignment.day_number}天</p>
                        <p>提交时间: {formatDate(submission.submission_date)}</p>
                        <p>
                          类型: 
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            submission.assignment.is_mandatory 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {submission.assignment.is_mandatory ? '必做' : '选做'}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                  </div>

                  {/* 批改反馈 */}
                  {submission.feedback && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700 mb-1">批改反馈:</p>
                      <p className="text-sm text-gray-600">{submission.feedback}</p>
                    </div>
                  )}

                  {/* 附件显示 */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">已提交附件:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {submission.attachments_url.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border rounded-md p-2 hover:bg-gray-50"
                        >
                          <img
                            src={url}
                            alt={`附件 ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 重新提交功能 */}
                  {submission.status === '不合格' && (
                    <div className="border-t pt-4">
                      {editingSubmission === submission.submission_id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              重新上传附件
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => setNewFiles(e.target.files ? Array.from(e.target.files) : [])}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          {newFiles.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">新选择的文件:</p>
                              <ul className="space-y-1">
                                {newFiles.map((file, index) => (
                                  <li key={index} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {file.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResubmit(submission.submission_id)}
                              disabled={loading || newFiles.length === 0}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? '提交中...' : '确认重新提交'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingSubmission(null);
                                setNewFiles([]);
                              }}
                              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingSubmission(submission.submission_id)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          重新提交
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}