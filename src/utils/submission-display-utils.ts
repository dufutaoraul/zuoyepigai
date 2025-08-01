import { Submission, Assignment, SubmissionFormatted } from '@/types';

/**
 * 将原始的Submission数据转换为显示用的SubmissionDisplay格式
 */
export function convertToSubmissionDisplay(
  submission: Submission,
  assignment: Assignment,
  studentName: string
): SubmissionFormatted {
  return {
    ...submission,
    student_name: studentName,
    day_text: assignment.day_text,
    assignment_title: assignment.assignment_title,
    is_mandatory: assignment.is_mandatory,
    description: assignment.description,
    必做选做: assignment.is_mandatory ? '必做' : '选做',
    学员提交的作业数量: submission.attachments_url.length
  };
}

/**
 * 获取带有关联数据的提交记录查询SQL
 */
export const getSubmissionsWithJoinQuery = () => {
  return `
    submissions.*,
    assignments.day_text,
    assignments.assignment_title,
    assignments.is_mandatory,
    assignments.description
  `;
};

/**
 * 获取完整的提交记录显示数据的查询配置
 */
export const getSubmissionDisplayQuery = () => {
  return {
    select: getSubmissionsWithJoinQuery(),
    from: 'submissions',
    join: 'assignments ON submissions.assignment_id = assignments.assignment_id'
  };
};