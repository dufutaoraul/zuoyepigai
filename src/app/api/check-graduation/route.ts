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

    // 直接从作业综合统计字段分析毕业资格
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

async function getGraduationProgressFromDB(studentId: string) {
  const sb = await getSupabase();
  
  // 直接从数据库查询该学员的所有合格作业提交记录
  const { data: submissions, error } = await sb
    .from('submissions')
    .select(`
      *,
      assignment:assignments(*)
    `)
    .eq('学号', studentId)
    .eq('毕业合格统计', '合格');

  if (error) {
    console.error('查询提交记录失败:', error);
    throw new Error('查询提交记录失败');
  }

  if (!submissions || submissions.length === 0) {
    return {
      qualified: false,
      message: '未找到该学员的合格作业记录，请先完成并通过至少一个作业。'
    };
  }

  console.log(`找到 ${submissions.length} 个合格的作业提交记录`);
  
  // 分析已完成的作业
  let mandatoryCompletedCount = 0;
  let w1d2AfternoonCompletedCount = 0;  
  let otherOptionalCompletedCount = 0;
  
  const completedMandatoryTasks: string[] = [];
  const completedW1D2Tasks: string[] = [];
  const completedOtherTasks: string[] = [];
  const missingMandatoryTasks = [...MANDATORY_TASKS];

  for (const submission of submissions) {
    const assignment = submission.assignment;
    if (!assignment) continue;

    const taskName = assignment.assignment_title;
    const isOptional = !assignment.is_mandatory;
    
    // 判断是否为第一周第二天下午的作业
    // 由于数据库缺少day_text字段，暂时通过作业名称判断
    const isW1D2Afternoon = W1D2_AFTERNOON_OPTIONAL_TASKS.includes(taskName);

    console.log(`分析作业: ${taskName}, 类型: ${assignment.is_mandatory ? '必做' : '选做'}, W1D2: ${isW1D2Afternoon}`);

    if (assignment.is_mandatory && MANDATORY_TASKS.includes(taskName)) {
      // 必做作业
      mandatoryCompletedCount++;
      completedMandatoryTasks.push(taskName);
      const index = missingMandatoryTasks.indexOf(taskName);
      if (index > -1) {
        missingMandatoryTasks.splice(index, 1);
      }
    } else if (isOptional && isW1D2Afternoon && W1D2_AFTERNOON_OPTIONAL_TASKS.includes(taskName)) {
      // 第一周第二天下午的选做作业
      w1d2AfternoonCompletedCount++;
      completedW1D2Tasks.push(taskName);
    } else if (isOptional && !isW1D2Afternoon) {
      // 其他选做作业
      otherOptionalCompletedCount++;
      completedOtherTasks.push(taskName);
    }
  }

  console.log('统计结果:', {
    mandatoryCompletedCount,
    w1d2AfternoonCompletedCount,
    otherOptionalCompletedCount,
    missingMandatoryTasks: missingMandatoryTasks.slice(0, 5)
  });

  // 判断毕业资格
  const condition1Passed = mandatoryCompletedCount >= MANDATORY_TASKS.length;
  const condition2Passed = w1d2AfternoonCompletedCount >= 1;
  const condition3Passed = otherOptionalCompletedCount >= 1;
  const isQualified = condition1Passed && condition2Passed && condition3Passed;

  // 生成详细的毕业资格报告
  const missingRequirements = [];
  if (!condition1Passed) {
    missingRequirements.push(
      `还需完成 ${missingMandatoryTasks.length} 个必做作业：${missingMandatoryTasks.slice(0, 3).join('、')}${missingMandatoryTasks.length > 3 ? '等' : ''}`
    );
  }
  if (!condition2Passed) {
    missingRequirements.push('需要完成第一周第二天下午的选做作业中至少1个');
  }
  if (!condition3Passed) {
    missingRequirements.push('需要完成其他选做作业中至少1个');
  }

  let message = '';
  if (isQualified) {
    message = '🎉 恭喜您，已满足所有毕业条件！您可以联系管理员申请毕业证书。';
  } else {
    message = `尚未满足毕业条件。${missingRequirements.join('；')}。`;
  }

  return {
    qualified: isQualified,
    message,
    details: {
      standard1: {
        name: '必做作业标准',
        pass: condition1Passed,
        completed: mandatoryCompletedCount,
        total: MANDATORY_TASKS.length,
        pending: missingMandatoryTasks.slice(0, 10) // 显示前10个缺失的作业
      },
      standard2: {
        name: '第一周第二天下午选做作业标准',
        pass: condition2Passed,
        completed: w1d2AfternoonCompletedCount,
        required: 1,
        available: W1D2_AFTERNOON_OPTIONAL_TASKS
      },
      standard3: {
        name: '其他选做作业标准',
        pass: condition3Passed,
        completed: otherOptionalCompletedCount,
        required: 1,
        available: completedOtherTasks.length + (submissions.length - mandatoryCompletedCount - w1d2AfternoonCompletedCount - otherOptionalCompletedCount)
      }
    }
  };
}