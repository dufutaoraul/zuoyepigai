import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('API Routes called');
    
    const { studentId, assignmentId, attachmentUrls } = await request.json();
    console.log('Request body:', { studentId, assignmentId, attachmentCount: attachmentUrls?.length });

    if (!studentId || !assignmentId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 简单的批改结果
    const gradingResult = {
      status: '合格',
      feedback: '恭喜您，您的作业审核合格'
    };

    // 更新数据库
    console.log('开始更新数据库');
    const { error } = await supabase
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

    console.log('数据库更新成功');

    return NextResponse.json({ 
      success: true, 
      result: gradingResult 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}