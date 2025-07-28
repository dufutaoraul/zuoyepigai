import { NextRequest, NextResponse } from 'next/server';

// 延迟导入supabase以避免构建时错误
let supabase: any = null;

const getSupabase = async () => {
  if (!supabase) {
    const { supabase: sb } = await import('@/lib/supabase');
    supabase = sb;
  }
  return supabase;
};

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: '缺少学号参数' }, { status: 400 });
    }

    // 检查毕业资格
    const graduationResult = await checkGraduationWithDify(studentId);

    return NextResponse.json(graduationResult);

  } catch (error) {
    console.error('Graduation check error:', error);
    return NextResponse.json({ 
      qualified: false,
      message: '检查过程出错，请稍后重试'
    }, { status: 500 });
  }
}

async function checkGraduationWithDify(studentId: string) {
  try {
    // 方法1: 使用Dify工作流（如果配置了的话）
    const difyApiKey = process.env.DIFY_API_KEY;
    const difyWorkflowUrl = process.env.DIFY_WORKFLOW_URL;

    if (difyApiKey && difyWorkflowUrl) {
      try {
        const response = await fetch(difyWorkflowUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${difyApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {
              student_id: studentId
            },
            response_mode: 'blocking',
            user: 'graduation-check'
          })
        });

        if (response.ok) {
          const result = await response.json();
          return parseGraduationResult(result);
        }
      } catch (difyError) {
        console.error('Dify workflow error:', difyError);
      }
    }

    // 方法2: 直接查询数据库进行检查（备用方案）
    return await checkGraduationDirectly(studentId);

  } catch (error) {
    console.error('Graduation check error:', error);
    throw error;
  }
}

async function checkGraduationDirectly(studentId: string) {
  try {
    const sb = await getSupabase();
    
    // 1. 获取所有必做作业
    const { data: mandatoryAssignments, error: assignmentError } = await sb
      .from('assignments')
      .select('assignment_id, assignment_title, day_number')
      .eq('is_mandatory', true);

    if (assignmentError) {
      throw assignmentError;
    }

    // 2. 获取该学员所有合格的作业提交
    const { data: qualifiedSubmissions, error: submissionError } = await sb
      .from('submissions')
      .select('assignment_id, assignment:assignments(assignment_title)')
      .eq('student_id', studentId)
      .eq('status', '合格');

    if (submissionError) {
      throw submissionError;
    }

    // 3. 分析毕业资格
    const totalMandatory = mandatoryAssignments?.length || 0;
    const completedMandatoryIds = new Set(
      qualifiedSubmissions?.map((s: any) => s.assignment_id) || []
    );
    const completedMandatory = mandatoryAssignments?.filter(
      (assignment: any) => completedMandatoryIds.has(assignment.assignment_id)
    ).length || 0;

    // 4. 找出未完成的必做作业
    const pendingAssignments = mandatoryAssignments?.filter(
      (assignment: any) => !completedMandatoryIds.has(assignment.assignment_id)
    ).map((assignment: any) => `第${assignment.day_number}天: ${assignment.assignment_title}`) || [];

    // 5. 判断是否符合毕业条件
    const qualified = completedMandatory === totalMandatory;

    return {
      qualified,
      message: qualified 
        ? '恭喜您，已满足所有毕业条件！您可以联系管理员申请毕业证书。'
        : `尚未满足毕业条件。您还需要完成 ${totalMandatory - completedMandatory} 个必做作业。`,
      details: {
        totalMandatory,
        completedMandatory,
        pendingAssignments
      }
    };

  } catch (error) {
    console.error('Direct graduation check error:', error);
    throw error;
  }
}

function parseGraduationResult(difyResult: any) {
  try {
    // 根据Dify工作流的返回格式解析结果
    // 这里需要根据实际的Dify返回格式进行调整
    const data = difyResult.data;
    const outputs = data.outputs;
    
    return {
      qualified: outputs.qualified === true || outputs.qualified === 'true',
      message: outputs.message || '毕业资格检查完成',
      details: outputs.details || null
    };
  } catch (error) {
    console.error('Error parsing Dify result:', error);
    throw new Error('解析Dify结果失败');
  }
}