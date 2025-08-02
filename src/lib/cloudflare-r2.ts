import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

class CloudflareR2Storage {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private accountId: string;

  constructor() {
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
    this.accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
  }

  private initializeStorage() {
    if (this.s3Client) {
      return this.s3Client;
    }

    // 从环境变量获取配置
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;

    if (!accessKeyId || !secretAccessKey || !this.bucketName || !this.accountId || !endpoint) {
      throw new Error('Missing Cloudflare R2 configuration');
    }

    console.log('Cloudflare R2配置:', {
      accessKeyId: accessKeyId.substring(0, 8) + '***',
      hasSecretKey: !!secretAccessKey,
      bucketName: this.bucketName,
      accountId: this.accountId.substring(0, 8) + '***',
      endpoint: endpoint
    });

    // 初始化S3客户端连接到Cloudflare R2
    this.s3Client = new S3Client({
      region: 'auto', // Cloudflare R2使用auto region
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      // Cloudflare R2特定配置
      forcePathStyle: true,
    });

    return this.s3Client;
  }

  /**
   * 上传文件到Cloudflare R2
   * @param fileName 文件名
   * @param fileBuffer 文件内容
   * @param contentType 文件类型
   * @returns 公共访问URL
   */
  async uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    try {
      console.log(`开始上传文件到Cloudflare R2: ${fileName}`);
      
      const s3Client = this.initializeStorage();

      console.log(`存储桶: ${this.bucketName}, 文件: ${fileName}, 大小: ${fileBuffer.length} bytes`);

      // 上传文件到Cloudflare R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      });

      const result = await s3Client.send(command);

      console.log(`文件上传成功: ${fileName}`, result);

      // 构建公共访问URL - 使用正确的公共域名标识符
      const publicUrl = `https://pub-672c16ae6aa44b2cad664361d24d5626.r2.dev/${fileName}`;
      console.log(`公共URL: ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      console.error('上传文件到Cloudflare R2时出错:', {
        fileName,
        bucketName: this.bucketName,
        accountId: this.accountId.substring(0, 8) + '***',
        errorType: typeof error,
        errorConstructor: error ? error.constructor.name : 'null',
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.code,
        errorName: (error as any)?.name,
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // 提供更详细的错误信息
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        if (error.message.includes('NoSuchBucket')) {
          throw new Error(`Storage bucket '${this.bucketName}' does not exist`);
        }
        if (error.message.includes('AccessDenied') || error.message.includes('403')) {
          throw new Error('Access denied - check R2 API credentials');
        }
        if (error.message.includes('InvalidAccessKeyId') || error.message.includes('401')) {
          throw new Error('Invalid R2 API credentials');
        }
        if (error.message.includes('404')) {
          throw new Error(`Storage bucket '${this.bucketName}' not found`);
        }
        throw new Error(`Upload failed: ${error.message}`);
      } else {
        console.error('Non-Error object thrown:', error);
        throw new Error(`Upload failed: ${JSON.stringify(error)}`);
      }
    }
  }

  /**
   * 删除文件
   * @param fileName 文件名
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      const s3Client = this.initializeStorage();
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await s3Client.send(command);
      
      console.log(`文件删除成功: ${fileName}`);
    } catch (error) {
      console.error('Error deleting file from Cloudflare R2:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 检查文件是否存在
   * @param fileName 文件名
   * @returns 是否存在
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const s3Client = this.initializeStorage();
      
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await s3Client.send(command);
      
      return true;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * 获取文件的直接访问URL
   * @param fileName 文件名
   * @returns 公共访问URL
   */
  getPublicUrl(fileName: string): string {
    return `https://pub-672c16ae6aa44b2cad664361d24d5626.r2.dev/${fileName}`;
  }
}

// 导出单例实例
export const cloudflareR2Storage = new CloudflareR2Storage();