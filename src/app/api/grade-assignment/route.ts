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

// 必做作业列表 - 根据参考文件
const MANDATORY_TASKS = [
  "三项全能作品集",
  "遇事不决问AI",
  "AI让生活更美好",
  "综合问答练习",
  "用netlify部署自己的网站",
  "小微智能体上线",
  "生成历史视频",
  "拆解小红书账号",
  "生成小红书图文",
  "改编历史视频工作流",
  "复制拆解小红书账号工作流",
  "复制生成小红书图文工作流",
  "开启AI全球化之路",
  "油管账号注册",
  "情绪驱动设计账号",
  "分析对标出报告",
  "金句卡片生成器插件",
  "创建dify机器人",
  "n8n本地部署",
  "cursor安装Supabase MCP数据库",
  "改编扣子官方模板应用",
  "改编官方其他应用模板",
  "按模板做UI前端界面",
  "API接入小程序",
  "N8N辩论工作流",
  "N8N新闻播报",
  "用SupabaseMCP搭建商业网站",
  "调用封装MCP服务"
];

// 第一周第二天下午的选做作业
const W1D2_AFTERNOON_OPTIONAL_TASKS = [
  "AI能力坐标定位",
  "爱学一派逆向工程分析", 
  "AI工作流挑战赛",
  "四步冲刺挑战"
];

export async function POST(request: NextRequest) {
  try {
    const { studentId, assignmentId, attachmentUrls } = await request.json();

    if (!studentId || !assignmentId || !attachmentUrls) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 调用豆包AI进行作业批改
    const gradingResult = await gradeWithDouBaoAI(attachmentUrls, assignmentId);

    // 更新数据库中的批改结果
    const sb = await getSupabase();
    const { error } = await sb
      .from('submissions')
      .update({
        status: gradingResult.status,
        feedback: gradingResult.feedback
      })
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId);

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json({ error: '更新批改结果失败' }, { status: 500 });
    }

    // 如果批改结果为合格，触发毕业进度更新
    if (gradingResult.status === '合格') {
      try {
        // 直接调用更新函数而不是通过HTTP请求
        await updateStudentGraduationProgress(studentId);
      } catch (updateError) {
        console.error('Error updating graduation progress:', updateError);
        // 不影响主要的批改流程，只记录错误
      }
    }

    return NextResponse.json({ 
      success: true, 
      result: gradingResult 
    });

  } catch (error) {
    console.error('Grading error:', error);
    return NextResponse.json({ error: '批改过程出错' }, { status: 500 });
  }
}

async function gradeWithDouBaoAI(attachmentUrls: string[], assignmentId: string) {
  try {
    // 获取作业要求
    const sb = await getSupabase();
    const { data: assignment } = await sb
      .from('assignments')
      .select('description, assignment_title')
      .eq('assignment_id', assignmentId)
      .single();

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // 调用豆包AI进行批改
    const douBaoApiKey = process.env.DOUBAO_API_KEY;
    
    if (!douBaoApiKey) {
      console.log('DouBao API key not configured, using mock result');
      const isQualified = Math.random() > 0.3;
      return {
        status: isQualified ? '合格' : '不合格',
        feedback: isQualified 
          ? '恭喜您，您的作业审核合格' 
          : `您的作业审核不合格。不合格原因：提交的内容不符合作业要求。修改意见：请仔细阅读作业要求《${assignment.assignment_title}》，确保提交的内容符合所有要求点，然后重新提交。`
      };
    }

    // 添加调试日志
    console.log('开始调用DouBao API，作业ID:', assignmentId);
    console.log('附件数量:', attachmentUrls.length);

    // 豆包AI API调用示例（需要根据实际API文档调整）
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${douBaoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'ep-20250524195324-l4t8t',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的作业批改助手。请根据学员选择的作业对应的"详细作业要求"判断收到的图片是否符合要求。

作业标题: ${assignment.assignment_title}
详细作业要求: ${assignment.description}

批改规则：
1. 仔细查看所有提交的图片
2. 严格按照"详细作业要求"判断是否符合要求
3. 符合要求：返回"合格"，反馈内容只说"恭喜您，您的作业审核合格"
4. 不符合要求：返回"不合格"，说明不合格原因并提出修改意见

输出格式必须是JSON格式：
{
  "status": "合格" 或 "不合格",
  "feedback": "反馈内容"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请批改以下作业：'
              },
              ...attachmentUrls.map(url => ({
                type: 'image_url',
                image_url: {
                  url: url
                }
              }))
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
      signal: AbortSignal.timeout(30000) // 30秒超时
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DouBao API error: ${response.status}`, errorText);
      throw new Error(`DouBao API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('DouBao API 响应:', result);
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid DouBao API response format');
    }
    
    const aiResponse = result.choices[0].message.content;
    
    // 尝试解析AI返回的JSON格式结果
    try {
      const gradingResult = JSON.parse(aiResponse);
      return {
        status: gradingResult.status === '合格' ? '合格' : '不合格',
        feedback: gradingResult.feedback || '批改完成'
      };
    } catch (parseError) {
      // 如果解析失败，使用简单的文本分析
      const isQualified = aiResponse.includes('合格') && !aiResponse.includes('不合格');
      return {
        status: isQualified ? '合格' : '不合格',
        feedback: aiResponse
      };
    }

  } catch (error) {
    console.error('DouBao AI grading error:', error);
    // 出错时返回错误状态，避免无限等待
    return {
      status: '批改失败',
      feedback: '批改过程中出现错误，请重新提交或联系管理员'
    };
  }
}

async function updateStudentGraduationProgress(studentId: string) {
  const sb = await getSupabase();
  
  // 先尝试创建graduation_progress表（如果不存在）
  try {
    await createGraduationProgressTableIfNotExists(sb);
  } catch (tableError) {
    console.log('Table creation attempt completed:', tableError);
  }
  
  // 获取该学员所有合格的作业提交
  const { data: qualifiedSubmissions } = await sb
    .from('submissions')
    .select(`
      assignment_id,
      status,
      assignment:assignments(
        assignment_title,
        is_mandatory,
        day_number,
        assignment_category
      )
    `)
    .eq('student_id', studentId)
    .eq('status', '合格');

  if (!qualifiedSubmissions) {
    return;
  }

  // 初始化统计数据
  let mandatoryCompletedCount = 0;
  let mandatoryCompletedList: string[] = [];
  let w1d2AfternoonCompletedCount = 0;
  let w1d2AfternoonCompletedList: string[] = [];
  let otherOptionalCompletedCount = 0;
  let otherOptionalCompletedList: string[] = [];

  // 分析每个合格的提交
  for (const submission of qualifiedSubmissions) {
    const assignment = submission.assignment;
    const assignmentTitle = assignment.assignment_title;

    // 检查是否为必做作业
    if (assignment.is_mandatory && MANDATORY_TASKS.includes(assignmentTitle)) {
      mandatoryCompletedCount++;
      mandatoryCompletedList.push(submission.assignment_id);
    }
    // 检查是否为第一周第二天下午的选做作业
    else if (!assignment.is_mandatory && W1D2_AFTERNOON_OPTIONAL_TASKS.includes(assignmentTitle)) {
      w1d2AfternoonCompletedCount++;
      w1d2AfternoonCompletedList.push(submission.assignment_id);
    }
    // 其他选做作业
    else if (!assignment.is_mandatory) {
      otherOptionalCompletedCount++;
      otherOptionalCompletedList.push(submission.assignment_id);
    }
  }

  // 判断毕业资格
  const condition1Passed = mandatoryCompletedCount >= MANDATORY_TASKS.length;
  const condition2Passed = w1d2AfternoonCompletedCount >= 1;
  const condition3Passed = otherOptionalCompletedCount >= 1;
  const isQualified = condition1Passed && condition2Passed && condition3Passed;

  // 生成缺失要求
  const missingRequirements: string[] = [];
  if (!condition1Passed) {
    const missingCount = MANDATORY_TASKS.length - mandatoryCompletedCount;
    missingRequirements.push(`缺少 ${missingCount} 个必做作业`);
  }
  if (!condition2Passed) {
    missingRequirements.push('缺少第一周第二天下午的选做作业（需至少完成1个）');
  }
  if (!condition3Passed) {
    missingRequirements.push('缺少其他选做作业（需至少完成1个）');
  }

  // 更新数据库中的毕业进度
  const { error } = await sb
    .from('graduation_progress')
    .upsert({
      student_id: studentId,
      mandatory_completed_count: mandatoryCompletedCount,
      mandatory_total_count: MANDATORY_TASKS.length,
      mandatory_completed_list: mandatoryCompletedList,
      w1d2_afternoon_completed_count: w1d2AfternoonCompletedCount,
      w1d2_afternoon_required_count: 1,
      w1d2_afternoon_completed_list: w1d2AfternoonCompletedList,
      other_optional_completed_count: otherOptionalCompletedCount,
      other_optional_required_count: 1,
      other_optional_completed_list: otherOptionalCompletedList,
      is_qualified: isQualified,
      missing_requirements: missingRequirements,
      last_updated: new Date().toISOString()
    }, {
      onConflict: 'student_id'
    });

  if (error) {
    console.error(`Error updating graduation progress for ${studentId}:`, error);
    throw error;
  }
}

async function createGraduationProgressTableIfNotExists(sb: any) {
  // 尝试创建graduation_progress表
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS graduation_progress (
        student_id VARCHAR PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
        
        -- 必做作业统计
        mandatory_completed_count INTEGER DEFAULT 0,
        mandatory_total_count INTEGER DEFAULT 28,
        mandatory_completed_list TEXT[] DEFAULT '{}',
        
        -- 第一周第二天下午选做作业统计  
        w1d2_afternoon_completed_count INTEGER DEFAULT 0,
        w1d2_afternoon_required_count INTEGER DEFAULT 1,
        w1d2_afternoon_completed_list TEXT[] DEFAULT '{}',
        
        -- 其他选做作业统计
        other_optional_completed_count INTEGER DEFAULT 0, 
        other_optional_required_count INTEGER DEFAULT 1,
        other_optional_completed_list TEXT[] DEFAULT '{}',
        
        -- 毕业状态
        is_qualified BOOLEAN DEFAULT FALSE,
        missing_requirements TEXT[] DEFAULT '{}',
        last_updated TIMESTAMP DEFAULT NOW()
    );

    -- 创建索引优化查询
    CREATE INDEX IF NOT EXISTS idx_graduation_progress_qualified ON graduation_progress(is_qualified);
    CREATE INDEX IF NOT EXISTS idx_graduation_progress_updated ON graduation_progress(last_updated);
  `;
  
  try {
    // 尝试执行SQL - 如果Supabase支持raw SQL
    if (sb.rpc) {
      await sb.rpc('exec_sql', { sql: createTableSQL });
    }
  } catch (error) {
    console.log('Table creation via RPC failed, table may already exist:', error);
  }
}