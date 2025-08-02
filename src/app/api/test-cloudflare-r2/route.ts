import { NextRequest, NextResponse } from 'next/server';
import { cloudflareR2Storage } from '@/lib/cloudflare-r2';

export async function GET() {
  try {
    console.log('=== 测试Cloudflare R2配置 ===');
    
    // 检查环境变量
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    
    console.log('环境变量检查:', {
      hasAccessKeyId: !!accessKeyId,
      accessKeyId: accessKeyId ? accessKeyId.substring(0, 8) + '***' : 'undefined',
      hasSecretKey: !!secretAccessKey,
      secretKeyLength: secretAccessKey?.length || 0,
      bucketName,
      accountId: accountId ? accountId.substring(0, 8) + '***' : 'undefined',
      endpoint
    });

    if (!accessKeyId || !secretAccessKey || !bucketName || !accountId || !endpoint) {
      const missingVars = [];
      if (!accessKeyId) missingVars.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
      if (!secretAccessKey) missingVars.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
      if (!bucketName) missingVars.push('CLOUDFLARE_R2_BUCKET_NAME');
      if (!accountId) missingVars.push('CLOUDFLARE_R2_ACCOUNT_ID');
      if (!endpoint) missingVars.push('CLOUDFLARE_R2_ENDPOINT');
      
      return NextResponse.json({
        success: false,
        error: '缺少必要的环境变量',
        missingVariables: missingVars,
        configGuide: '请参考Cloudflare R2配置指南配置环境变量'
      }, { status: 500 });
    }
    
    // 创建一个小的测试文件
    const testContent = `Cloudflare R2测试文件
创建时间: ${new Date().toLocaleString('zh-CN')}
存储桶: ${bucketName}
账户ID: ${accountId?.substring(0, 8)}***`;
    
    const testBuffer = Buffer.from(testContent, 'utf-8');
    const testFileName = `test/r2-test-${Date.now()}.txt`;
    
    console.log('开始测试上传:', testFileName);
    
    // 尝试上传测试文件
    const publicUrl = await cloudflareR2Storage.uploadFile(testFileName, testBuffer, 'text/plain');
    
    console.log('测试上传成功:', publicUrl);
    
    // 尝试检查文件是否存在
    const fileExists = await cloudflareR2Storage.fileExists(testFileName);
    console.log('文件存在性检查:', fileExists);
    
    return NextResponse.json({
      success: true,
      message: 'Cloudflare R2配置测试成功！',
      details: {
        uploadUrl: publicUrl,
        fileName: testFileName,
        fileExists,
        bucketName,
        accountId: accountId?.substring(0, 8) + '***',
        endpoint,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('=== Cloudflare R2测试失败 ===', error);
    
    // 详细错误信息
    let errorDetails: any = {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    // 如果是AWS SDK错误，提取更多信息
    if (error && typeof error === 'object' && 'name' in error) {
      errorDetails.code = (error as any).code;
      errorDetails.name = (error as any).name;
      errorDetails.statusCode = (error as any).$metadata?.httpStatusCode;
    }
    
    return NextResponse.json({
      success: false,
      error: 'Cloudflare R2测试失败',
      details: errorDetails,
      environment: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? process.env.CLOUDFLARE_R2_ACCESS_KEY_ID.substring(0, 8) + '***' : 'undefined',
        bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID ? process.env.CLOUDFLARE_R2_ACCOUNT_ID.substring(0, 8) + '***' : 'undefined',
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
      },
      troubleshooting: {
        '密钥错误': '检查CLOUDFLARE_R2_ACCESS_KEY_ID和CLOUDFLARE_R2_SECRET_ACCESS_KEY是否正确',
        '存储桶错误': '检查CLOUDFLARE_R2_BUCKET_NAME名称是否正确',
        '账户ID错误': '检查CLOUDFLARE_R2_ACCOUNT_ID是否正确',
        '端点错误': '检查CLOUDFLARE_R2_ENDPOINT是否正确',
        '权限错误': '确保API Token有对应存储桶的读写权限'
      }
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: '请使用GET方法测试Cloudflare R2配置' });
}