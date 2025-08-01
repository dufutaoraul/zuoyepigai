import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callAIWithFallback } from '@/lib/ai-fallback';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 开始模拟真实批改流程调试...');
    
    const { studentId, assignmentId } = await request.json();
    
    if (!studentId || !assignmentId) {
      return NextResponse.json({
        error: 'Missing studentId or assignmentId',
        usage: 'POST with studentId and assignmentId to debug real grading flow'
      }, { status: 400 });
    }

    // 1. 获取作业信息（和真实流程一样）
    console.log('📖 获取作业信息...', { studentId, assignmentId });
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('description, assignment_title')
      .eq('assignment_id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      console.error('❌ 获取作业信息失败:', assignmentError);
      return NextResponse.json({
        success: false,
        error: 'Failed to get assignment info',
        details: assignmentError
      });
    }

    console.log('✅ 作业信息获取成功:', assignmentData);

    // 2. 获取学生最新提交的图片URLs（和真实流程一样）
    console.log('📎 获取学生提交的附件...');
    const { data: submissionData, error: submissionError } = await supabase
      .from('submissions')
      .select('attachments_url')
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (submissionError || !submissionData) {
      console.error('❌ 获取提交信息失败:', submissionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to get submission info',
        details: submissionError
      });
    }

    const attachmentUrls = submissionData.attachments_url || [];
    console.log('📎 获取到的附件URLs:', attachmentUrls);

    if (attachmentUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No attachment URLs found in submission'
      });
    }

    // 3. 测试图片URL可访问性
    console.log('🔗 测试图片URL可访问性...');
    const urlTests = [];
    for (const url of attachmentUrls) {
      try {
        const testResponse = await fetch(url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(10000)
        });
        urlTests.push({
          url: url,
          accessible: testResponse.ok,
          status: testResponse.status,
          headers: Object.fromEntries(testResponse.headers.entries())
        });
        console.log(`URL测试: ${url} - ${testResponse.ok ? '✅' : '❌'} (${testResponse.status})`);
      } catch (error) {
        urlTests.push({
          url: url,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.log(`URL测试: ${url} - ❌ 异常: ${error}`);
      }
    }

    // 4. 调用AI批改（和真实流程一样）
    console.log('🤖 开始AI批改调用...');
    let gradingResult;
    let aiError = null;
    
    try {
      gradingResult = await callAIWithFallback(
        assignmentData.description, 
        attachmentUrls, 
        assignmentData.assignment_title
      );
      console.log('✅ AI批改完成:', gradingResult);
    } catch (error) {
      aiError = error instanceof Error ? error.message : 'Unknown AI error';
      console.error('❌ AI批改失败:', aiError);
      gradingResult = {
        status: '批改失败',
        feedback: `批改过程出错：${aiError}`
      };
    }

    // 5. 返回完整的调试信息
    return NextResponse.json({
      success: true,
      debugInfo: {
        assignment: {
          id: assignmentId,
          title: assignmentData.assignment_title,
          description: assignmentData.description
        },
        submission: {
          studentId: studentId,
          attachmentCount: attachmentUrls.length,
          attachmentUrls: attachmentUrls
        },
        urlAccessibility: urlTests,
        aiGrading: {
          result: gradingResult,
          error: aiError,
          usedFallback: gradingResult?.feedback?.includes('AI批改服务暂时不可用') || false
        }
      },
      analysis: {
        assignmentDataOk: !!assignmentData,
        hasAttachments: attachmentUrls.length > 0,
        allUrlsAccessible: urlTests.every(test => test.accessible),
        aiGradingWorked: !gradingResult?.feedback?.includes('AI批改服务暂时不可用'),
        mostLikelyIssue: 
          !urlTests.every(test => test.accessible) ? 'Image URLs not accessible' :
          gradingResult?.feedback?.includes('AI批改服务暂时不可用') ? 'AI API call failed' :
          'Unknown issue'
      }
    });

  } catch (error) {
    console.error('💥 真实批改调试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Real grading debug endpoint',
    usage: 'POST with studentId and assignmentId to debug the actual grading flow',
    description: 'Simulates the exact same flow as real grading with detailed debugging'
  });
}