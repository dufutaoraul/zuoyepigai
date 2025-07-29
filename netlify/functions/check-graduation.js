// Netlify Function for graduation check
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 必做作业列表
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

const W1D2_AFTERNOON_OPTIONAL_TASKS = [
  "AI能力坐标定位",
  "爱学一派逆向工程分析", 
  "AI工作流挑战赛",
  "四步冲刺挑战"
];

exports.handler = async (event, context) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { studentId } = JSON.parse(event.body);

    if (!studentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '缺少学号参数' })
      };
    }

    // 先更新该学员的毕业进度数据
    await updateStudentGraduationProgress(studentId);
    
    // 从数据库获取毕业资格检查结果
    const graduationResult = await getGraduationProgressFromDB(studentId);

    return {
      statusCode: 200,
      body: JSON.stringify(graduationResult)
    };

  } catch (error) {
    console.error('Graduation check error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        qualified: false,
        message: '检查过程出错，请稍后重试'
      })
    };
  }
};

async function updateStudentGraduationProgress(studentId) {
  // 先尝试创建graduation_progress表（如果不存在）
  try {
    await createGraduationProgressTableIfNotExists();
  } catch (tableError) {
    console.log('Table creation attempt completed:', tableError);
  }
  
  // 获取该学员所有合格的作业提交
  const { data: qualifiedSubmissions } = await supabase
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

  // 统计逻辑（与API路由相同）
  let mandatoryCompletedCount = 0;
  let mandatoryCompletedList = [];
  let w1d2AfternoonCompletedCount = 0;
  let w1d2AfternoonCompletedList = [];
  let otherOptionalCompletedCount = 0;
  let otherOptionalCompletedList = [];

  for (const submission of qualifiedSubmissions) {
    const assignment = submission.assignment;
    const assignmentTitle = assignment.assignment_title;

    if (assignment.is_mandatory && MANDATORY_TASKS.includes(assignmentTitle)) {
      mandatoryCompletedCount++;
      mandatoryCompletedList.push(submission.assignment_id);
    }
    else if (!assignment.is_mandatory && W1D2_AFTERNOON_OPTIONAL_TASKS.includes(assignmentTitle)) {
      w1d2AfternoonCompletedCount++;
      w1d2AfternoonCompletedList.push(submission.assignment_id);
    }
    else if (!assignment.is_mandatory) {
      otherOptionalCompletedCount++;
      otherOptionalCompletedList.push(submission.assignment_id);
    }
  }

  const condition1Passed = mandatoryCompletedCount >= MANDATORY_TASKS.length;
  const condition2Passed = w1d2AfternoonCompletedCount >= 1;
  const condition3Passed = otherOptionalCompletedCount >= 1;
  const isQualified = condition1Passed && condition2Passed && condition3Passed;

  const missingRequirements = [];
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

  await supabase
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
}

async function getGraduationProgressFromDB(studentId) {
  const { data: graduationProgress, error } = await supabase
    .from('graduation_progress')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error) {
    console.error('Error getting graduation progress:', error);
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

async function createGraduationProgressTableIfNotExists() {
  // 简化的表创建逻辑，实际上在Supabase中需要手动创建
  console.log('Graduation progress table should be created manually in Supabase');
}