export interface Student {
  student_id: string;
  student_name: string;
}

export interface Assignment {
  assignment_id: string;
  day_text?: string;  // 新格式：原始格式如"第一周第一天"
  day_number?: number; // 旧格式：兼容性支持
  assignment_title: string;
  is_mandatory: boolean;
  description: string;
  assignment_category?: string;
}

export interface Submission {
  // 业务字段（按显示顺序）
  student_id: string;
  student_name?: string;
  day_text?: string;
  assignment_title?: string;
  is_mandatory?: boolean;
  description?: string;
  attachments_url: string[];
  status: '批改中' | '合格' | '不合格' | '批改失败';
  feedback?: string;
  graduation_status?: string;
  
  // 中文字段名（实际数据库字段）
  '学号'?: string;
  '毕业合格统计'?: '批改中' | '合格' | '不合格' | '批改失败';
  'AI的作业评估'?: string;
  
  // 系统字段
  submission_id: string;
  assignment_id: string;
  submission_date: string;
  created_at?: string;
  updated_at?: string;
}

// 辅助类型：用于格式化显示
export interface SubmissionFormatted extends Submission {
  必做选做: string;       // is_mandatory转换为"必做"/"选做"
  学员提交的作业数量: number; // attachments_url.length
}
