import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// 初始化 S3 客户端
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.CLOUDFLARE_BUCKET_NAME!;

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType } = await request.json();
    
    if (!fileName || !fileType) {
      return NextResponse.json({ error: '缺少文件名或文件类型' }, { status: 400 });
    }

    // 清理文件名
    const sanitizedFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // 生成预签名URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: sanitizedFileName,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5分钟过期
    const publicUrl = `https://pub-672c16ae6aa44b2cad664361d24d5626.r2.dev/${sanitizedFileName}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error('生成预签名URL失败:', error);
    return NextResponse.json({ error: '生成上传URL失败' }, { status: 500 });
  }
}