import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 获取第一个作业作为测试用例
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('assignment_id, assignment_title, description')
      .limit(1)
      .single();

    if (assignmentError || !assignmentData) {
      console.error('获取测试作业失败:', assignmentError);
      return NextResponse.json({ error: '获取测试作业失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assignment: assignmentData
    });

  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json({ 
      error: '获取测试作业失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}