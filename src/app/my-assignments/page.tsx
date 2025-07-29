'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Submission, Assignment } from '@/types';
import { getDayTextFromAssignment } from '@/utils/day-text-utils';

interface SubmissionWithAssignment extends Submission {
  assignment: Assignment;
}

function MyAssignmentsContent() {
  const searchParams = useSearchParams();
  const [studentId, setStudentId] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionWithAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletingSubmission, setDeletingSubmission] = useState<string | null>(null);
  const [keepExistingFiles, setKeepExistingFiles] = useState(true);

  // 初始化时读取URL参数或localStorage
  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    const savedStudentId = localStorage.getItem('lastStudentId');
    
    if (urlStudentId) {
      setStudentId(urlStudentId);
      localStorage.setItem('lastStudentId', urlStudentId);
      // 自动查询
      fetchSubmissionsWithId(urlStudentId);
    } else if (savedStudentId) {
      setStudentId(savedStudentId);
      fetchSubmissionsWithId(savedStudentId);
    }
  }, [searchParams]);

  // 查询学员作业提交历史
  const fetchSubmissions = async () => {
    if (!studentId) return;
    await fetchSubmissionsWithId(studentId);
  };
  
  const fetchSubmissionsWithId = async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assignment:assignments(*)
        `)
        .eq('student_id', id)
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
    if (!keepExistingFiles && newFiles.length === 0) {
      setMessage('请选择要上传的文件，或者选择保留原有文件');
      return;
    }

    setLoading(true);
    try {
      let finalAttachmentUrls: string[] = [];
      
      // 如果保留原有文件，先获取原有文件URL
      if (keepExistingFiles) {
        const currentSubmission = submissions.find(s => s.submission_id === submissionId);
        if (currentSubmission) {
          finalAttachmentUrls = [...currentSubmission.attachments_urls];
        }
      }
      
      // 上传新文件（如果有）
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from('assignments')
            .upload(fileName, file);
          
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage
            .from('assignments')
            .getPublicUrl(fileName);
          
          finalAttachmentUrls.push(publicUrl);
        }
      }

      // 更新提交记录
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          attachments_urls: finalAttachmentUrls,
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

      setMessage('重新提交成功！正在进行AI批改，大概需要2-3分钟时间，请耐心等待...');
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
      case '批改失败':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 删除作业
  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('确定要删除这个作业提交记录吗？删除后无法恢复。')) {
      return;
    }
    
    setDeletingSubmission(submissionId);
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('submission_id', submissionId);
        
      if (error) throw error;
      
      setMessage('作业删除成功');
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      setMessage('删除失败，请重试');
    } finally {
      setDeletingSubmission(null);
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
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    localStorage.setItem('lastStudentId', e.target.value);
                  }}
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
                        <p>{getDayTextFromAssignment(submission.assignment)}</p>
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
                      {submission.attachments_urls.map((url, index) => (
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

                  {/* 操作按钮 */}
                  <div className="border-t pt-4">
                    {/* 重新提交功能 */}
                    {(submission.status === '不合格' || submission.status === '批改失败') && editingSubmission === submission.submission_id && (
                      <div className="mb-4 space-y-4">
                        {/* 原有文件处理选项 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            文件处理方式
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={keepExistingFiles}
                                onChange={() => setKeepExistingFiles(true)}
                                className="mr-2"
                              />
                              <span className="text-sm">保留原有文件，可添加新文件</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={!keepExistingFiles}
                                onChange={() => setKeepExistingFiles(false)}
                                className="mr-2"
                              />
                              <span className="text-sm">删除原有文件，重新上传</span>
                            </label>
                          </div>
                        </div>

                        {/* 当前文件显示 */}
                        {keepExistingFiles && submission.attachments_urls.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">当前文件 (将保留):</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {submission.attachments_urls.map((url, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={url}
                                    alt={`原文件 ${index + 1}`}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                  <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                                    保留
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {keepExistingFiles ? '添加新文件' : '重新上传文件'}
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
                                <li key={index} className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
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
                              setKeepExistingFiles(true);
                            }}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* 操作按钮行 */}
                    <div className="flex gap-2 flex-wrap">
                      {/* 重新提交按钮 - 仅当状态为不合格或批改失败且未在编辑时显示 */}
                      {(submission.status === '不合格' || submission.status === '批改失败') && editingSubmission !== submission.submission_id && (
                        <button
                          onClick={() => setEditingSubmission(submission.submission_id)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          重新提交
                        </button>
                      )}
                      
                      {/* 删除按钮 - 始终显示 */}
                      <button
                        onClick={() => handleDeleteSubmission(submission.submission_id)}
                        disabled={deletingSubmission === submission.submission_id || editingSubmission === submission.submission_id}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingSubmission === submission.submission_id ? '删除中...' : '删除作业'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyAssignmentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <MyAssignmentsContent />
    </Suspense>
  );
}