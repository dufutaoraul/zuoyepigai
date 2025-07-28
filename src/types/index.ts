export interface Student {
  student_id: string;
  student_name: string;
}

export interface Assignment {
  assignment_id: string;
  day_number: number;
  assignment_title: string;
  is_mandatory: boolean;
  description: string;
}

export interface Submission {
  submission_id: string;
  student_id: string;
  assignment_id: string;
  submission_date: string;
  attachments_url: string[];
  status: '批改中' | '合格' | '不合格';
  feedback?: string;
}