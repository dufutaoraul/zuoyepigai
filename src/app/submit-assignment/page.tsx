'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Student, Assignment } from '@/types';

export default function SubmitAssignmentPage() {
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [dayNumber, setDayNumber] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 根据学号查询学员姓名
  const handleStudentIdChange = async (id: string) => {
    setStudentId(id);
    if (id.length > 0) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('student_name')
          .eq('student_id', id)
          .single();
        
        if (data) {
          setStudentName(data.student_name);
        } else {
          setStudentName('');
        }
      } catch (error) {
        setStudentName('');
      }
    } else {
      setStudentName('');
    }
  };

  // 根据学习天数查询作业列表
  const handleDayNumberChange = async (day: string) => {
    setDayNumber(day);
    setAssignmentId('');
    setSelectedAssignment(null);
    
    if (day) {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('day_number', parseInt(day));
        
        if (data) {
          setAssignments(data);
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

      // 提交作业记录
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          student_id: studentId,
          assignment_id: assignmentId,
          submission_date: new Date().toISOString(),
          attachments_url: attachmentUrls,
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

      setMessage('作业提交成功！正在进行AI批改...');
      
      // 重置表单
      setStudentId('');
      setStudentName('');
      setDayNumber('');
      setAssignmentId('');
      setSelectedAssignment(null);
      setFiles([]);
      
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
                  value={dayNumber}
                  onChange={(e) => handleDayNumberChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">请选择学习天数</option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>第{day}天</option>
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
                  disabled={!dayNumber}
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
                message.includes('成功') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}