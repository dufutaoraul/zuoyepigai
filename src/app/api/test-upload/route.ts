import { NextRequest, NextResponse } from 'next/server';
import { googleStorage } from '@/lib/google-storage';

export async function GET() {
  try {
    console.log('=== 测试上传功能 ===');
    
    // 创建一个小的测试文件
    const testContent = 'This is a test file';
    const testBuffer = Buffer.from(testContent, 'utf-8');
    const testFileName = `test/${Date.now()}-test.txt`;
    
    console.log('开始测试上传:', testFileName);
    
    // 尝试上传测试文件
    const publicUrl = await googleStorage.uploadFile(testFileName, testBuffer, 'text/plain');
    
    console.log('测试上传成功:', publicUrl);
    
    return NextResponse.json({
      success: true,
      message: '测试上传成功',
      url: publicUrl,
      fileName: testFileName
    });
    
  } catch (error) {
    console.error('=== 测试上传失败 ===', error);
    
    // 详细错误信息
    let errorDetails: any = {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    // 如果是Google Cloud错误，提取更多信息
    if (error && typeof error === 'object' && 'code' in error) {
      errorDetails.code = (error as any).code;
      errorDetails.details = (error as any).details;
    }
    
    return NextResponse.json({
      success: false,
      error: '测试上传失败',
      details: errorDetails,
      environment: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
        hasServiceKey: !!process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY
      }
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: '请使用GET方法测试' });
}