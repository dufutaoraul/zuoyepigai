import { NextRequest, NextResponse } from 'next/server';
import { googleStorage } from '@/lib/google-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // 清理文件名
      const originalName = file.name;
      const extension = originalName.split('.').pop() || '';
      const nameWithoutExt = originalName.replace(`.${extension}`, '');
      const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '');
      const finalName = cleanName || 'file';
      const fileName = `assignments/${Date.now()}-${finalName}.${extension}`;

      // 将File转换为Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 上传到Google Cloud Storage
      const publicUrl = await googleStorage.uploadFile(fileName, buffer, file.type);
      uploadedUrls.push(publicUrl);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { 
        error: '文件上传失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}