import { NextRequest, NextResponse } from 'next/server';
import { cloudflareR2Storage } from '@/lib/cloudflare-r2';

export async function POST(request: NextRequest) {
  console.log('=== 开始文件上传 ===');
  
  try {
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
      hasBucketName: !!bucketName,
      bucketName,
      hasAccountId: !!accountId,
      accountId: accountId ? accountId.substring(0, 8) + '***' : 'undefined',
      hasEndpoint: !!endpoint,
      endpoint
    });

    if (!accessKeyId || !secretAccessKey || !bucketName || !accountId || !endpoint) {
      const missingVars = [];
      if (!accessKeyId) missingVars.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
      if (!secretAccessKey) missingVars.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
      if (!bucketName) missingVars.push('CLOUDFLARE_R2_BUCKET_NAME');
      if (!accountId) missingVars.push('CLOUDFLARE_R2_ACCOUNT_ID');
      if (!endpoint) missingVars.push('CLOUDFLARE_R2_ENDPOINT');
      
      return NextResponse.json(
        { 
          error: '缺少必要的环境变量',
          missingVariables: missingVars
        },
        { status: 500 }
      );
    }

    let formData;
    let files: File[] = [];
    
    try {
      formData = await request.formData();
      files = formData.getAll('files') as File[];
      
      console.log('FormData解析成功');
      console.log('接收到文件数量:', files.length);
      console.log('文件详情:', files.map((f, index) => ({ 
        index,
        name: (f as any).name, 
        size: (f as any).size, 
        type: (f as any).type,
        constructor: f ? f.constructor.name : 'null',
        hasArrayBuffer: typeof (f as any).arrayBuffer === 'function'
      })));
      
    } catch (formError) {
      console.error('FormData解析失败:', formError);
      return NextResponse.json(
        { 
          error: 'FormData解析失败',
          details: formError instanceof Error ? formError.message : '未知错误'
        },
        { status: 400 }
      );
    }
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          error: '没有找到文件',
          formDataKeys: Array.from(formData.keys()),
          formDataSize: formData.get('files') ? 'files key exists' : 'files key missing'
        },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      console.log(`处理文件: ${file.name}`);
      
      // 清理文件名
      const originalName = file.name;
      const extension = originalName.split('.').pop() || '';
      const nameWithoutExt = originalName.replace(`.${extension}`, '');
      const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '');
      const finalName = cleanName || 'file';
      const fileName = `assignments/${Date.now()}-${finalName}.${extension}`;

      console.log(`文件名处理: ${originalName} -> ${fileName}`);

      // 将File转换为Buffer
      let buffer: Buffer;
      try {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        console.log(`文件转换完成，大小: ${buffer.length} bytes`);
      } catch (bufferError) {
        console.error(`文件转换失败 ${fileName}:`, bufferError);
        throw new Error(`文件转换失败: ${bufferError instanceof Error ? bufferError.message : '未知错误'}`);
      }

      // 上传到Cloudflare R2
      try {
        console.log(`开始上传文件到Cloudflare R2: ${fileName}`);
        const publicUrl = await cloudflareR2Storage.uploadFile(fileName, buffer, file.type);
        uploadedUrls.push(publicUrl);
        console.log(`文件上传成功: ${publicUrl}`);
      } catch (uploadError) {
        console.error(`文件上传失败 ${fileName}:`, uploadError);
        throw new Error(`文件上传失败: ${uploadError instanceof Error ? uploadError.message : '未知错误'}`);
      }
    }

    console.log('=== 所有文件上传完成 ===');
    return NextResponse.json({
      success: true,
      urls: uploadedUrls
    });

  } catch (error) {
    console.error('=== 文件上传错误 ===', error);
    return NextResponse.json(
      { 
        error: '文件上传失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}