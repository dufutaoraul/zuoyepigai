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

      // 初始化Google Cloud Storage客户端
      this.storage = new Storage({
        projectId,
        credentials,
      });

      return this.storage;
    } catch (error) {
      throw new Error('Invalid Google Cloud service account key format');
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
      const storage = this.initializeStorage();
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      // 上传文件
      await file.save(fileBuffer, {
        metadata: {
          contentType,
        },
        public: true, // 设置为公共可读
      });

      // 返回公共访问URL
      return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    } catch (error) {
      console.error('Error uploading file to Google Cloud Storage:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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