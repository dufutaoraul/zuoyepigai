import { NextRequest, NextResponse } from 'next/server';
import { googleStorage } from '@/lib/google-storage';

export async function POST(request: NextRequest) {
  console.log('=== 开始文件上传 ===');
  
  try {
    // 检查环境变量
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    const serviceAccountKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY;
    
    console.log('环境变量检查:', {
      hasProjectId: !!projectId,
      projectId,
      hasBucketName: !!bucketName,
      bucketName,
      hasServiceAccountKey: !!serviceAccountKey,
      serviceAccountKeyLength: serviceAccountKey?.length || 0
    });

    if (!projectId || !bucketName || !serviceAccountKey) {
      const missingVars = [];
      if (!projectId) missingVars.push('GOOGLE_CLOUD_PROJECT_ID');
      if (!bucketName) missingVars.push('GOOGLE_CLOUD_STORAGE_BUCKET');
      if (!serviceAccountKey) missingVars.push('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
      
      return NextResponse.json(
        { 
          error: '缺少必要的环境变量',
          missingVariables: missingVars
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log('接收到文件:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '没有找到文件' },
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
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`文件转换完成，大小: ${buffer.length} bytes`);

      // 上传到Google Cloud Storage
      try {
        const publicUrl = await googleStorage.uploadFile(fileName, buffer, file.type);
        uploadedUrls.push(publicUrl);
        console.log(`文件上传成功: ${publicUrl}`);
      } catch (uploadError) {
        console.error(`文件上传失败 ${fileName}:`, uploadError);
        throw uploadError;
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