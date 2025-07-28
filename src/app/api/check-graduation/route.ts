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
    
    // 1. 获取该学员所有合格的作业提交及其分类信息
    const { data: qualifiedSubmissions, error: submissionError } = await sb
      .from('submissions')
      .select(`
        assignment_id, 
        assignments!inner(
          assignment_id,
          assignment_title,
          is_mandatory,
          assignment_category,
          day_number
        )
      `)
      .eq('student_id', studentId)
      .eq('status', '合格');

    if (submissionError) {
      throw submissionError;
    }

    // 2. 获取所有作业信息
    const { data: allAssignments, error: assignmentError } = await sb
      .from('assignments')
      .select('assignment_id, assignment_title, is_mandatory, assignment_category, day_number');

    if (assignmentError) {
      throw assignmentError;
    }

    // 3. 分析毕业资格 - 三个标准
    const qualifiedIds = new Set(qualifiedSubmissions?.map((s: any) => s.assignment_id) || []);
    
    // 标准一：检查所有必做作业是否全部合格
    const mandatoryAssignments = allAssignments?.filter((a: any) => a.is_mandatory) || [];
    const completedMandatory = mandatoryAssignments.filter((a: any) => qualifiedIds.has(a.assignment_id));
    const standard1Pass = completedMandatory.length === mandatoryAssignments.length;
    
    // 标准二：检查"第一周第二天下午"的四个选做作业中至少有1个合格
    const w1d2AfternoonAssignments = allAssignments?.filter((a: any) => 
      a.assignment_category === 'W1D2_Afternoon_Optional'
    ) || [];
    const completedW1D2Afternoon = w1d2AfternoonAssignments.filter((a: any) => qualifiedIds.has(a.assignment_id));
    const standard2Pass = completedW1D2Afternoon.length >= 1;
    
    // 标准三：检查除"第一周第二天下午"外的所有其他"选做"作业中至少有1个合格
    const otherOptionalAssignments = allAssignments?.filter((a: any) => 
      !a.is_mandatory && a.assignment_category !== 'W1D2_Afternoon_Optional'
    ) || [];
    const completedOtherOptional = otherOptionalAssignments.filter((a: any) => qualifiedIds.has(a.assignment_id));
    const standard3Pass = completedOtherOptional.length >= 1;
    
    // 最终判断：三个标准全部满足才能毕业
    const qualified = standard1Pass && standard2Pass && standard3Pass;
    
    // 生成详细反馈信息
    let message = '';
    let reasons = [];
    
    if (qualified) {
      message = '恭喜您，已满足所有毕业条件！您可以联系管理员申请毕业证书。';
    } else {
      if (!standard1Pass) {
        const pendingMandatory = mandatoryAssignments.filter((a: any) => !qualifiedIds.has(a.assignment_id));
        reasons.push(`必做作业未全部完成，还需完成：${pendingMandatory.map((a: any) => a.assignment_title).join('、')}`);
      }
      if (!standard2Pass) {
        reasons.push(`"第一周第二天下午"的特定选做作业需要至少完成1个（${w1d2AfternoonAssignments.map((a: any) => a.assignment_title).join('、')}）`);
      }
      if (!standard3Pass) {
        reasons.push('其他选做作业需要至少完成1个');
      }
      
      message = `尚未满足毕业条件。原因：${reasons.join('；')}。`;
    }

    return {
      qualified,
      message,
      details: {
        standard1: {
          name: '必做作业标准',
          pass: standard1Pass,
          completed: completedMandatory.length,
          total: mandatoryAssignments.length,
          pending: mandatoryAssignments.filter((a: any) => !qualifiedIds.has(a.assignment_id)).map((a: any) => a.assignment_title)
        },
        standard2: {
          name: '第一周第二天下午选做作业标准',
          pass: standard2Pass,
          completed: completedW1D2Afternoon.length,
          required: 1,
          available: w1d2AfternoonAssignments.map((a: any) => a.assignment_title)
        },
        standard3: {
          name: '其他选做作业标准',
          pass: standard3Pass,
          completed: completedOtherOptional.length,
          required: 1,
          available: otherOptionalAssignments.length
        }
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