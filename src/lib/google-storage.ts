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
      await file.save(fileBuffer, {
        metadata: {
          contentType,
        },
        public: true, // 设置为公共可读
      });

      console.log(`文件上传成功: ${fileName}`);

      // 返回公共访问URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
      console.log(`公共URL: ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      console.error('上传文件到Google Cloud Storage时出错:', {
        fileName,
        bucketName: this.bucketName,
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details
      });
      
      // 提供更详细的错误信息
      if (error instanceof Error) {
        if (error.message.includes('No such bucket')) {
          throw new Error(`Storage bucket '${this.bucketName}' does not exist`);
        }
        if (error.message.includes('Access denied')) {
          throw new Error('Access denied - check service account permissions');
        }
        if (error.message.includes('Invalid credentials')) {
          throw new Error('Invalid service account credentials');
        }
        throw new Error(`Upload failed: ${error.message}`);
      } else {
        throw new Error('Upload failed: Unknown error');
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