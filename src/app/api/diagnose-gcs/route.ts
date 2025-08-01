import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export async function GET() {
  try {
    console.log('=== 开始诊断Google Cloud Storage ===');
    
    // 检查环境变量
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    const serviceAccountKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY;
    
    console.log('环境变量状态:', {
      projectId,
      bucketName,
      hasServiceKey: !!serviceAccountKey,
      serviceKeyLength: serviceAccountKey?.length
    });
    
    if (!projectId || !bucketName || !serviceAccountKey) {
      return NextResponse.json({
        success: false,
        error: '缺少环境变量',
        missing: {
          projectId: !projectId,
          bucketName: !bucketName,
          serviceAccountKey: !serviceAccountKey
        }
      });
    }
    
    // 步骤1：解析JSON
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
      console.log('JSON解析成功');
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      return NextResponse.json({
        success: false,
        error: 'JSON解析失败',
        details: parseError instanceof Error ? parseError.message : '未知错误'
      });
    }
    
    // 步骤2：验证JSON结构
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'JSON密钥缺少必要字段',
        missingFields,
        availableFields: Object.keys(credentials)
      });
    }
    
    console.log('JSON结构验证通过');
    
    // 步骤3：初试初始化Storage客户端
    let storage;
    try {
      storage = new Storage({
        projectId,
        credentials,
      });
      console.log('Storage客户端初始化成功');
    } catch (initError) {
      console.error('Storage客户端初始化失败:', initError);
      return NextResponse.json({
        success: false,
        error: 'Storage客户端初始化失败',
        details: initError instanceof Error ? initError.message : '未知错误'
      });
    }
    
    // 步骤4：检查存储桶是否存在
    try {
      const bucket = storage.bucket(bucketName);
      const [exists] = await bucket.exists();
      
      if (!exists) {
        return NextResponse.json({
          success: false,
          error: '存储桶不存在',
          bucketName,
          suggestion: '请在Google Cloud Console中创建存储桶'
        });
      }
      
      console.log('存储桶存在验证通过');
    } catch (bucketError) {
      console.error('检查存储桶时出错:', bucketError);
      return NextResponse.json({
        success: false,
        error: '无法访问存储桶',
        bucketName,
        details: bucketError instanceof Error ? bucketError.message : '未知错误'
      });
    }
    
    // 步骤5：测试权限
    try {
      const bucket = storage.bucket(bucketName);
      const testFileName = `test-${Date.now()}.txt`;
      const testContent = 'test content';
      const file = bucket.file(testFileName);
      
      // 尝试上传测试文件
      await file.save(Buffer.from(testContent), {
        metadata: { contentType: 'text/plain' }
      });
      
      console.log('测试文件上传成功');
      
      // 清理测试文件
      await file.delete();
      console.log('测试文件删除成功');
      
      return NextResponse.json({
        success: true,
        message: '所有检查通过！Google Cloud Storage配置正确',
        config: {
          projectId,
          bucketName,
          clientEmail: credentials.client_email
        }
      });
      
    } catch (permissionError) {
      console.error('权限测试失败:', permissionError);
      return NextResponse.json({
        success: false,
        error: '权限测试失败',
        details: permissionError instanceof Error ? permissionError.message : '未知错误',
        suggestion: '检查服务账号是否有Storage Admin权限'
      });
    }
    
  } catch (error) {
    console.error('=== 诊断过程中出现错误 ===', error);
    return NextResponse.json({
      success: false,
      error: '诊断过程出错',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}