import { Storage } from '@google-cloud/storage';

class GoogleCloudStorage {
  private storage: Storage | null = null;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || '';
  }

  private initializeStorage() {
    if (this.storage) {
      return this.storage;
    }

    // 从环境变量获取配置
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const serviceAccountKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY;

    if (!projectId || !serviceAccountKey || !this.bucketName) {
      throw new Error('Missing Google Cloud Storage configuration');
    }

    try {
      // 解析服务账号密钥JSON
      const credentials = JSON.parse(serviceAccountKey);

      // 验证必要的字段
      if (!credentials.client_email || !credentials.private_key) {
        throw new Error('Service account key missing required fields: client_email or private_key');
      }

      console.log('Google Cloud Storage配置:', {
        projectId,
        clientEmail: credentials.client_email,
        hasPrivateKey: !!credentials.private_key
      });

      // 初始化Google Cloud Storage客户端
      this.storage = new Storage({
        projectId,
        credentials,
      });

      return this.storage;
    } catch (error) {
      console.error('Google Cloud Storage初始化错误:', error);
      if (error instanceof SyntaxError) {
        throw new Error('Invalid Google Cloud service account key JSON format');
      }
      throw new Error(`Google Cloud Storage configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 上传文件到Google Cloud Storage
   * @param fileName 文件名
   * @param fileBuffer 文件内容
   * @param contentType 文件类型
   * @returns 公共访问URL
   */
  async uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    try {
      console.log(`开始上传文件到Google Cloud Storage: ${fileName}`);
      
      const storage = this.initializeStorage();
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      console.log(`存储桶: ${this.bucketName}, 文件: ${fileName}, 大小: ${fileBuffer.length} bytes`);

      // 上传文件
      try {
        console.log('开始调用file.save()...');
        await file.save(fileBuffer, {
          metadata: {
            contentType,
          },
        });
        console.log('file.save()调用成功');
        
        // 检查是否启用了统一存储桶级访问
        try {
          console.log('尝试设置文件为公共可读...');
          await file.makePublic();
          console.log('文件设置为公共可读成功');
        } catch (aclError) {
          console.log('无法设置单个文件权限，可能启用了统一存储桶级访问:', aclError instanceof Error ? aclError.message : aclError);
          // 这不是致命错误，文件已经上传成功
          // 如果存储桶配置了公共访问，文件仍然可以被访问
        }
        
      } catch (saveError) {
        console.error('file.save()失败:', saveError);
        throw saveError;
      }

      console.log(`文件上传成功: ${fileName}`);

      // 返回公共访问URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
      console.log(`公共URL: ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      console.error('上传文件到Google Cloud Storage时出错:', {
        fileName,
        bucketName: this.bucketName,
        errorType: typeof error,
        errorConstructor: error ? error.constructor.name : 'null',
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details,
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // 提供更详细的错误信息
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        if (error.message.includes('No such bucket')) {
          throw new Error(`Storage bucket '${this.bucketName}' does not exist`);
        }
        if (error.message.includes('Access denied') || error.message.includes('403')) {
          throw new Error('Access denied - check service account permissions');
        }
        if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
          throw new Error('Invalid service account credentials');
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
      const storage = this.initializeStorage();
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      await file.delete();
    } catch (error) {
      console.error('Error deleting file from Google Cloud Storage:', error);
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
      const storage = this.initializeStorage();
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }
}

// 导出单例实例
export const googleStorage = new GoogleCloudStorage();