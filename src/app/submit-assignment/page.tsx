'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Student, Assignment } from '@/types';
import { getUniqueDayTexts, getAssignmentsByDayText, getDayTextFromAssignment } from '@/utils/day-text-utils';

export default function SubmitAssignmentPage() {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentIdFromStorage, setStudentIdFromStorage] = useState('');
  const [selectedDayText, setSelectedDayText] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [gradingResult, setGradingResult] = useState<{status: string, feedback: string} | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 初始化时从localStorage读取学号
  useEffect(() => {
    const savedStudentId = localStorage.getItem('lastStudentId');
    if (savedStudentId) {
      setStudentIdFromStorage(savedStudentId);
      setStudentId(savedStudentId);
      handleStudentIdChange(savedStudentId);
    }
  }, []);

  // 根据学号查询学员姓名
  const handleStudentIdChange = async (id: string) => {
    setStudentId(id);
    if (id.length > 0) {
      try {
        // 清除之前的姓名，避免显示旧数据
        setStudentName('');
        
        const { data, error } = await supabase
          .from('students')
          .select('student_name')
          .eq('student_id', id)
          .single();
        
        if (data && !error) {
          setStudentName(data.student_name);
          // 保存到localStorage
          localStorage.setItem('lastStudentId', id);
        } else {
          setStudentName('');
        }
      } catch (error) {
        console.error('Error fetching student name:', error);
        setStudentName('');
      }
    } else {
      setStudentName('');
    }
  };

  // 获取所有可用的天数 - 使用正确的Excel格式
  useEffect(() => {
    const fetchAvailableDays = async () => {
      try {
        // 使用工具函数获取正确排序的天数文本
        const uniqueDayTexts = getUniqueDayTexts();
        setAvailableDays(uniqueDayTexts);
      } catch (error) {
        console.error('Error fetching available days:', error);
      }
    };

    fetchAvailableDays();
  }, []);

  // 根据选择的天数查询作业列表 - 使用正确的Excel格式
  const handleDayTextChange = async (dayText: string) => {
    setSelectedDayText(dayText);
    setAssignmentId('');
    setSelectedAssignment(null);
    
    if (dayText) {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*');
        
        if (data) {
          // 使用工具函数根据天数文本过滤作业
          const filteredAssignments = getAssignmentsByDayText(dayText, data);
          setAssignments(filteredAssignments);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setAssignments([]);
      }
    } else {
      setAssignments([]);
    }
  };

  // 根据作业ID显示作业详情
  const handleAssignmentChange = (id: string) => {
    setAssignmentId(id);
    const assignment = assignments.find(a => a.assignment_id === id);
    setSelectedAssignment(assignment || null);
  };

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // 清理文件名 - 移除中文字符、空格和特殊字符
  const sanitizeFileName = (originalName: string): string => {
    // 获取文件扩展名
    const extension = originalName.split('.').pop() || '';
    // 移除扩展名后的文件名
    const nameWithoutExt = originalName.replace(`.${extension}`, '');
    // 只保留英文字母、数字、连字符和下划线
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '');
    // 如果清理后为空，使用默认名称
    const finalName = cleanName || 'file';
    return `${finalName}.${extension}`;
  };

  // 轮询检查批改结果
  const pollGradingResult = async (studentId: string, assignmentId: string) => {
    const maxAttempts = 30; // 最多轮询30次 (约3分钟)
    let attempts = 0;
    
    const checkResult = async (): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('status, feedback')
          .eq('student_id', studentId)
          .eq('assignment_id', assignmentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) throw error;
        
        if (data && data.status !== '批改中') {
          // 批改完成或失败
          setGradingResult({
            status: data.status,
            feedback: data.feedback || '批改完成'
          });
          setShowResult(true);
          if (data.status === '批改失败') {
            setMessage(`批改失败：${data.feedback}`);
          } else {
            setMessage(`批改完成！结果：${data.status}`);
          }
          return;
        }
        
        // 如果还在批改中，继续轮询
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(() => checkResult(), 6000); // 6秒后再次检查
        } else {
          setMessage('批改超时，请稍后查看结果');
        }
      } catch (error) {
        console.error('Error polling grading result:', error);
        setMessage('检查批改结果时出错');
      }
    };
    
    // 开始轮询
    setTimeout(() => checkResult(), 6000); // 6秒后开始第一次检查
  };

  // 提交作业
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId || !studentName || !assignmentId || files.length === 0) {
      setMessage('请填写所有必填字段并上传至少一个文件');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 上传文件到Supabase存储
      const attachmentUrls: string[] = [];
      
      for (const file of files) {
        const cleanFileName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}-${cleanFileName}`;
        const { data, error } = await supabase.storage
          .from('assignments')
          .upload(fileName, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(fileName);
        
        attachmentUrls.push(publicUrl);
      }

      // 提交作业记录
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          student_id: studentId,
          assignment_id: assignmentId,
          submission_date: new Date().toISOString(),
          attachments_urls: attachmentUrls,
          status: '批改中'
        });

      if (insertError) throw insertError;

      // 触发AI批改（这里需要调用API）
      try {
        await fetch('/api/grade-assignment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId,
            assignmentId,
            attachmentUrls
          })
        });
      } catch (error) {
        console.error('Error triggering AI grading:', error);
      }

      setMessage('作业提交成功！正在进行AI批改，大概需要2-3分钟时间，请耐心等待。您可以返回首页继续提交其他作业，或查看已有作业记录。');
      
      // 开始轮询检查批改结果
      await pollGradingResult(studentId, assignmentId);
      
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setMessage('提交失败，请重试');
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
            提交作业
          </h1>

          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 学号输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => handleStudentIdChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入学号"
                  required
                />
              </div>

              {/* 学员姓名显示 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  value={studentName}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  placeholder="根据学号自动显示"
                />
              </div>

              {/* 学习天数选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学习天数 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDayText}
                  onChange={(e) => handleDayTextChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">请选择学习天数</option>
                  {availableDays.map(dayText => (
                    <option key={dayText} value={dayText}>{dayText}</option>
                  ))}
                </select>
              </div>

              {/* 作业选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作业项目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignmentId}
                  onChange={(e) => handleAssignmentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedDayText}
                  required
                >
                  <option value="">请选择作业项目</option>
                  {assignments.map(assignment => (
                    <option key={assignment.assignment_id} value={assignment.assignment_id}>
                      {assignment.assignment_title} ({assignment.is_mandatory ? '必做' : '选做'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 作业详情显示 */}
              {selectedAssignment && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-800 mb-2">作业详情</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">类型:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedAssignment.is_mandatory 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedAssignment.is_mandatory ? '必做' : '选做'}
                      </span>
                    </p>
                    <p><span className="font-medium">要求:</span></p>
                    <div className="bg-white p-3 rounded border">
                      {selectedAssignment.description}
                    </div>
                  </div>
                </div>
              )}

              {/* 文件上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上传附件 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  支持上传多张图片，格式：JPG、PNG、GIF等
                </p>
                
                {/* 显示已选择的文件 */}
                {files.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">已选择的文件:</p>
                    <ul className="space-y-1">
                      {files.map((file, index) => (
                        <li key={index} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '提交中...' : '提交作业'}
              </button>
            </form>

            {/* 消息显示 */}
            {message && (
              <div className={`mt-4 p-4 rounded-md ${
                message.includes('成功') || message.includes('完成')
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
                
                {/* 在等待批改时显示操作按钮 */}
                {message.includes('正在进行AI批改') && (
                  <div className="flex gap-3 mt-4">
                    <Link
                      href="/"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      返回首页
                    </Link>
                    <Link
                      href={`/my-assignments?studentId=${encodeURIComponent(studentId)}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      查看我的作业
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 批改结果显示 */}
            {showResult && gradingResult && (
              <div className="mt-6 p-6 bg-white rounded-lg shadow-md border-2 border-blue-200">
                <h3 className="text-xl font-bold mb-4 text-center">
                  AI批改结果
                </h3>
                
                <div className="space-y-4">
                  {/* 批改状态 */}
                  <div className="text-center">
                    <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${
                      gradingResult.status === '合格' 
                        ? 'bg-green-500 text-white' 
                        : gradingResult.status === '不合格'
                        ? 'bg-red-500 text-white'
                        : gradingResult.status === '批改失败'
                        ? 'bg-gray-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {gradingResult.status}
                    </span>
                  </div>
                  
                  {/* 批改反馈 */}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium text-gray-700 mb-2">批改反馈：</h4>
                    <div className="text-gray-600 whitespace-pre-wrap">
                      {gradingResult.feedback}
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-4 justify-center mt-6">
                    <button
                      onClick={() => {
                        setShowResult(false);
                        setGradingResult(null);
                        setMessage('');
                        // 重置表单但保留学号和姓名
                        setSelectedDayText('');
                        setAssignmentId('');
                        setSelectedAssignment(null);
                        setFiles([]);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      提交新作业
                    </button>
                    <Link
                      href={`/my-assignments?studentId=${encodeURIComponent(studentId)}`}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      查看我的作业
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}