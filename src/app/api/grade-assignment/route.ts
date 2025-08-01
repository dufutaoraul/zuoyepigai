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
    
    // 3. 更新数据库
    console.log('开始更新数据库，批改结果:', gradingResult);
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: gradingResult.status,
        feedback: gradingResult.feedback,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('数据库更新失败:', updateError);
      return NextResponse.json({ error: '更新批改结果失败' }, { status: 500 });
    }

    console.log('数据库更新成功');

    return NextResponse.json({ 
      success: true, 
      result: gradingResult 
    });

  } catch (error) {
    console.error('API错误:', error);
    
    // 如果出错，将状态更新为批改失败（使用已解析的数据）
    if (requestData?.studentId && requestData?.assignmentId) {
      try {
        await supabase
          .from('submissions')
          .update({
            status: '批改失败',
            feedback: `批改过程出错：${error instanceof Error ? error.message : '未知错误'}`,
            updated_at: new Date().toISOString()
          })
          .eq('student_id', requestData.studentId)
          .eq('assignment_id', requestData.assignmentId)
          .order('created_at', { ascending: false })
          .limit(1);
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