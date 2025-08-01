import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查环境变量
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const serviceAccountKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY;
    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

    const envStatus = {
      hasProjectId: !!projectId,
      projectId: projectId || 'NOT_SET',
      hasBucketName: !!bucketName,
      bucketName: bucketName || 'NOT_SET',
      hasServiceAccountKey: !!serviceAccountKey,
      serviceAccountKeyLength: serviceAccountKey ? serviceAccountKey.length : 0,
      serviceAccountKeyPreview: serviceAccountKey ? serviceAccountKey.substring(0, 100) + '...' : 'NOT_SET'
    };

    // 尝试解析服务账号密钥
    let credentialsValid = false;
    let credentialsError = '';
    
    if (serviceAccountKey) {
      try {
        const credentials = JSON.parse(serviceAccountKey);
        credentialsValid = true;
      } catch (error) {
        credentialsError = error instanceof Error ? error.message : 'JSON parse error';
      }
    }

    return NextResponse.json({
      environment: envStatus,
      credentials: {
        valid: credentialsValid,
        error: credentialsError
      }
    });

  } catch (error) {
    console.error('Debug upload error:', error);
    return NextResponse.json(
      { 
        error: '调试失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}