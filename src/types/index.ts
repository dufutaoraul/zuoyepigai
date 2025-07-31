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
  attachments_url: string[];
  status: '批改中' | '合格' | '不合格' | '批改失败';
  feedback?: string;
}

// 新增：按照希望的字段顺序显示的提交记录接口
export interface SubmissionDisplay {
  学号: string;           // student_id
  姓名: string;           // 通过关联查询获取student_name
  第几天: string;         // day_text
  具体作业: string;       // assignment_title
  必做选做: string;       // is_mandatory转换为"必做"/"选做"
  作业详细要求: string;   // description
  学员提交的作业: string[]; // attachments_url
  AI的作业评估: string;   // feedback
  毕业合格统计: string;   // status
  submission_id?: string; // 保留原始ID用于操作
  assignment_id?: string; // 保留原始assignment_id用于操作
}
