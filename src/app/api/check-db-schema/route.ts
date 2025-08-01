import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 方法1：尝试查询submissions表来看实际字段
    console.log('尝试查询submissions表...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);

    console.log('Submissions查询结果:', { sampleData, sampleError });

    // 方法2：尝试查询assignments表来对比
    console.log('尝试查询assignments表...');
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1);

    console.log('Assignments查询结果:', { assignmentData, assignmentError });

    // 方法3：尝试一个简单的插入测试（不实际插入）
    const testInsertData = {
      student_id: 'TEST',
      assignment_id: '00000000-0000-0000-0000-000000000000'
    };

    // 获取所有可能的错误信息
    return NextResponse.json({
      success: true,
      submissions: {
        sampleDataError: sampleError?.message || null,
        sampleDataCode: sampleError?.code || null,
        sampleDataKeys: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
        hasData: (sampleData && sampleData.length > 0) || false,
        tableExists: !sampleError || sampleError.code !== 'PGRST106'
      },
      assignments: {
        assignmentDataError: assignmentError?.message || null,
        assignmentDataCode: assignmentError?.code || null,
        assignmentDataKeys: assignmentData && assignmentData.length > 0 ? Object.keys(assignmentData[0]) : [],
        hasData: (assignmentData && assignmentData.length > 0) || false,
        tableExists: !assignmentError || assignmentError.code !== 'PGRST106'
      },
      testInsertData
    });

  } catch (error) {
    console.error('Check DB schema error:', error);
    return NextResponse.json({
      error: 'Failed to check database schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}