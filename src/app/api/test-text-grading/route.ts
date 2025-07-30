import { NextRequest, NextResponse } from 'next/server';
import { callAIWithFallback } from '@/lib/ai-fallback';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 开始文本批改测试...');
    
    // 模拟一个简单的文本作业，不包含图片
    const testAssignmentDescription = `
作业要求：请简单回答"我已经完成了作业"这句话即可。

评判标准：
- 如果提交内容包含"我已经完成了作业"，则判定为合格
- 如果提交内容不包含该句话，则判定为不合格
    `.trim();

    const testAssignmentTitle = "简单文本测试作业";
    
    // 不包含任何图片URL，用空数组
    const emptyAttachmentUrls: string[] = [];

    console.log('📝 测试参数:', {
      title: testAssignmentTitle,
      description: testAssignmentDescription,
      attachmentCount: emptyAttachmentUrls.length
    });

    // 调用AI批改，但不包含图片
    const gradingResult = await callAIWithFallback(
      testAssignmentDescription, 
      emptyAttachmentUrls, 
      testAssignmentTitle
    );

    console.log('✅ 文本批改测试完成:', gradingResult);

    return NextResponse.json({
      success: true,
      testType: 'text-only-grading',
      input: {
        title: testAssignmentTitle,
        description: testAssignmentDescription,
        attachmentCount: emptyAttachmentUrls.length
      },
      result: gradingResult,
      analysis: {
        usedFallback: gradingResult.feedback.includes('AI批改服务暂时不可用'),
        isRealAI: !gradingResult.feedback.includes('AI批改服务暂时不可用'),
        responseLength: gradingResult.feedback.length
      }
    });

  } catch (error) {
    console.error('💥 文本批改测试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testType: 'text-only-grading'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Text grading test endpoint',
    usage: 'POST to this endpoint to test AI grading without images',
    description: 'Tests if the AI grading works when no images are involved'
  });
}