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
  submission_id: string;
  student_id: string;
  assignment_id: string;
  submission_date: string;
  attachments_urls: string[];
  status: '批改中' | '合格' | '不合格' | '批改失败';
  feedback?: string;
}