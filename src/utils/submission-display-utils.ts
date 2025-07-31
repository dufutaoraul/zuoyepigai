import { Submission, Assignment, SubmissionDisplay } from '@/types';

/**
 * 将原始的Submission数据转换为显示用的SubmissionDisplay格式
 */
export function convertToSubmissionDisplay(
  submission: Submission,
  assignment: Assignment,
  studentName: string
): SubmissionDisplay {
  return {
    学号: submission.student_id,
    姓名: studentName,
    第几天: assignment.day_text || '未知',
    具体作业: assignment.assignment_title,
    必做选做: assignment.is_mandatory ? '必做' : '选做',
    作业详细要求: assignment.description || '无详细要求',
    学员提交的作业: submission.attachments_url || [],
    AI的作业评估: submission.feedback || '暂无评估',
    毕业合格统计: submission.status,
    submission_id: submission.submission_id,
    assignment_id: submission.assignment_id
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