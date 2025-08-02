import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callAIWithFallback } from '@/lib/ai-fallback';

export async function POST(request: NextRequest) {
  let requestData: any = null;
  
  try {
    console.log('AI批改API被调用');
    
    // 先解析请求数据，避免在catch中重复解析
    requestData = await request.json();
    const { studentId, assignmentId, attachmentUrls } = requestData;
    console.log('请求参数:', { studentId, assignmentId, attachmentCount: attachmentUrls?.length });

    if (!studentId || !assignmentId || !attachmentUrls || attachmentUrls.length === 0) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 1. 获取作业要求描述
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('description, assignment_title')
      .eq('assignment_id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      console.error('获取作业信息失败:', assignmentError);
      return NextResponse.json({ error: '获取作业信息失败' }, { status: 500 });
    }

    console.log('作业信息:', { title: assignmentData.assignment_title, description: assignmentData.description });

    // 2. 调用AI进行批改（带后备方案）
    const gradingResult = await callAIWithFallback(assignmentData.description, attachmentUrls, assignmentData.assignment_title);
    
    // 3. 更新数据库 - 使用xmin字段定位最新记录
    console.log('开始更新数据库，批改结果:', gradingResult);
    
    // 先查询所有匹配的记录，在代码中找到最新的
    const { data: allRecords, error: queryError } = await supabase
      .from('submissions')
      .select('xmin')
      .eq('学号', studentId)
      .eq('assignment_id', assignmentId);

    if (queryError || !allRecords || allRecords.length === 0) {
      console.error('查询最新submission记录失败:', queryError);
      return NextResponse.json({ error: '找不到对应的作业记录' }, { status: 500 });
    }

    // 在代码中找到最大的xmin值（最新记录）
    const latestRecord = allRecords.reduce((latest, current) => {
      return parseInt(current.xmin) > parseInt(latest.xmin) ? current : latest;
    });

    console.log('找到要更新的记录，xmin:', latestRecord.xmin);

    // 使用xmin精确更新最新记录
    const { error: updateError, count } = await supabase
      .from('submissions')
      .update({
        '毕业合格统计': gradingResult.status,
        'AI的作业评估': gradingResult.feedback
      })
      .eq('学号', studentId)
      .eq('assignment_id', assignmentId)
      .eq('xmin', latestRecord.xmin);

    if (updateError) {
      console.error('数据库更新失败:', updateError);
      return NextResponse.json({ error: '更新批改结果失败' }, { status: 500 });
    }

    console.log('数据库更新成功，更新记录数:', count, 'xmin:', latestRecord.xmin);

    return NextResponse.json({ 
      success: true, 
      result: gradingResult 
    });

  } catch (error) {
    console.error('API错误:', error);
    
    // 如果出错，将状态更新为批改失败（使用已解析的数据）
    if (requestData?.studentId && requestData?.assignmentId) {
      try {
        // 先查询所有匹配记录，在代码中找到最新的
        const { data: failureAllRecords } = await supabase
          .from('submissions')
          .select('xmin')
          .eq('学号', requestData.studentId)
          .eq('assignment_id', requestData.assignmentId);

        if (failureAllRecords && failureAllRecords.length > 0) {
          const failureSubmissionData = failureAllRecords.reduce((latest, current) => {
            return parseInt(current.xmin) > parseInt(latest.xmin) ? current : latest;
          });
          // 使用xmin进行精确更新
          await supabase
            .from('submissions')
            .update({
              '毕业合格统计': '批改失败',
              'AI的作业评估': `批改过程出错：${error instanceof Error ? error.message : '未知错误'}`
            })
            .eq('学号', requestData.studentId)
            .eq('assignment_id', requestData.assignmentId)
            .eq('xmin', failureSubmissionData.xmin);
        }
      } catch (dbError) {
        console.error('更新失败状态时出错:', dbError);
      }
    }

    return NextResponse.json({ 
      error: 'AI批改失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// AI批改功能已移至 /src/lib/ai-fallback.ts