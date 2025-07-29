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
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: '缺少学号参数' }, { status: 400 });
    }

    // 先更新该学员的毕业进度数据
    await updateStudentGraduationProgress(studentId);
    
    // 从数据库获取毕业资格检查结果
    const graduationResult = await getGraduationProgressFromDB(studentId);

    return NextResponse.json(graduationResult);

  } catch (error) {
    console.error('Graduation check error:', error);
    return NextResponse.json({ 
      qualified: false,
      message: '检查过程出错，请稍后重试'
    }, { status: 500 });
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

async function getGraduationProgressFromDB(studentId: string) {
  const sb = await getSupabase();
  
  // 先尝试创建graduation_progress表（如果不存在）
  try {
    await createGraduationProgressTableIfNotExists(sb);
  } catch (tableError) {
    console.log('Table creation attempt completed:', tableError);
  }
  
  // 从毕业进度表获取数据
  const { data: graduationProgress, error } = await sb
    .from('graduation_progress')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error) {
    console.error('Error getting graduation progress:', error);
    // 如果是表不存在的错误，返回友好提示
    if (error.code === '42P01') {
      return {
        qualified: false,
        message: '毕业统计功能正在初始化中，请稍后重试'
      };
    }
    throw error;
  }

  if (!graduationProgress) {
    return {
      qualified: false,
      message: '未找到该学员的毕业进度记录'
    };
  }

  // 构建详细的毕业资格报告
  const { is_qualified, missing_requirements } = graduationProgress;
  
  let message = '';
  if (is_qualified) {
    message = '恭喜您，已满足所有毕业条件！您可以联系管理员申请毕业证书。';
  } else {
    message = `尚未满足毕业条件。原因：${missing_requirements.join('；')}。`;
  }

  return {
    qualified: is_qualified,
    message,
    details: {
      standard1: {
        name: '必做作业标准',
        pass: graduationProgress.mandatory_completed_count >= graduationProgress.mandatory_total_count,
        completed: graduationProgress.mandatory_completed_count,
        total: graduationProgress.mandatory_total_count,
        progress: `${graduationProgress.mandatory_completed_count}/${graduationProgress.mandatory_total_count}`
      },
      standard2: {
        name: '第一周第二天下午选做作业标准',
        pass: graduationProgress.w1d2_afternoon_completed_count >= graduationProgress.w1d2_afternoon_required_count,
        completed: graduationProgress.w1d2_afternoon_completed_count,
        required: graduationProgress.w1d2_afternoon_required_count,
        progress: `${graduationProgress.w1d2_afternoon_completed_count}/${graduationProgress.w1d2_afternoon_required_count}`
      },
      standard3: {
        name: '其他选做作业标准',
        pass: graduationProgress.other_optional_completed_count >= graduationProgress.other_optional_required_count,
        completed: graduationProgress.other_optional_completed_count,
        required: graduationProgress.other_optional_required_count,
        progress: `${graduationProgress.other_optional_completed_count}/${graduationProgress.other_optional_required_count}`
      },
      lastUpdated: graduationProgress.last_updated
    }
  };
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