import { NextRequest, NextResponse } from 'next/server';
import { tencentStorage } from '@/lib/tencent-storage';

export async function GET() {
  try {
    console.log('=== 测试腾讯云COS配置 ===');
    
    // 检查环境变量
    const secretId = process.env.TENCENT_SECRET_ID;
    const secretKey = process.env.TENCENT_SECRET_KEY;
    const bucketName = process.env.TENCENT_COS_BUCKET;
    const region = process.env.TENCENT_COS_REGION;
    
    console.log('环境变量检查:', {
      hasSecretId: !!secretId,
      secretId: secretId ? secretId.substring(0, 8) + '***' : 'undefined',
      hasSecretKey: !!secretKey,
      secretKeyLength: secretKey?.length || 0,
      bucketName,
      region
    });

    if (!secretId || !secretKey || !bucketName || !region) {
      const missingVars = [];
      if (!secretId) missingVars.push('TENCENT_SECRET_ID');
      if (!secretKey) missingVars.push('TENCENT_SECRET_KEY');
      if (!bucketName) missingVars.push('TENCENT_COS_BUCKET');
      if (!region) missingVars.push('TENCENT_COS_REGION');
      
      return NextResponse.json({
        success: false,
        error: '缺少必要的环境变量',
        missingVariables: missingVars,
        configGuide: '请参考 TENCENT-COS-CONFIG.md 文件配置环境变量'
      }, { status: 500 });
    }
    
    // 创建一个小的测试文件
    const testContent = `腾讯云COS测试文件
创建时间: ${new Date().toLocaleString('zh-CN')}
存储桶: ${bucketName}
地域: ${region}`;
    
    const testBuffer = Buffer.from(testContent, 'utf-8');
    const testFileName = `test/cos-test-${Date.now()}.txt`;
    
    console.log('开始测试上传:', testFileName);
    
    // 尝试上传测试文件
    const publicUrl = await tencentStorage.uploadFile(testFileName, testBuffer, 'text/plain');
    
    console.log('测试上传成功:', publicUrl);
    
    // 尝试检查文件是否存在
    const fileExists = await tencentStorage.fileExists(testFileName);
    console.log('文件存在性检查:', fileExists);
    
    return NextResponse.json({
      success: true,
      message: '腾讯云COS配置测试成功！',
      details: {
        uploadUrl: publicUrl,
        fileName: testFileName,
        fileExists,
        bucketName,
        region,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('=== 腾讯云COS测试失败 ===', error);
    
    // 详细错误信息
    let errorDetails: any = {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    // 如果是腾讯云COS错误，提取更多信息
    if (error && typeof error === 'object' && 'code' in error) {
      errorDetails.code = (error as any).code;
      errorDetails.details = (error as any).details;
    }
    
    return NextResponse.json({
      success: false,
      error: '腾讯云COS测试失败',
      details: errorDetails,
      environment: {
        secretId: process.env.TENCENT_SECRET_ID ? process.env.TENCENT_SECRET_ID.substring(0, 8) + '***' : 'undefined',
        bucketName: process.env.TENCENT_COS_BUCKET,
        region: process.env.TENCENT_COS_REGION,
        hasSecretKey: !!process.env.TENCENT_SECRET_KEY
      },
      troubleshooting: {
        '密钥错误': '检查TENCENT_SECRET_ID和TENCENT_SECRET_KEY是否正确',
        '存储桶错误': '检查TENCENT_COS_BUCKET名称是否正确',
        '地域错误': '检查TENCENT_COS_REGION是否为ap-guangzhou',
        '权限错误': '确保API密钥有对应存储桶的读写权限'
      }
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: '请使用GET方法测试腾讯云COS配置' });
}