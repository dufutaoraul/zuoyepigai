import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== 测试FormData解析 ===');
  
  try {
    console.log('Request content type:', request.headers.get('content-type'));
    console.log('Request method:', request.method);
    
    // 尝试解析FormData
    const formData = await request.formData();
    console.log('FormData解析成功');
    
    // 获取所有键
    const keys = Array.from(formData.keys());
    console.log('FormData keys:', keys);
    
    // 获取files
    const files = formData.getAll('files');
    console.log('Files count:', files.length);
    
    const fileDetails = files.map((file, index) => {
      if (file instanceof File) {
        return {
          index,
          name: file.name,
          size: file.size,
          type: file.type,
          isFile: true
        };
      } else {
        return {
          index,
          value: file,
          isFile: false
        };
      }
    });
    
    console.log('File details:', fileDetails);
    
    return NextResponse.json({
      success: true,
      message: 'FormData解析成功',
      data: {
        keys,
        filesCount: files.length,
        fileDetails,
        contentType: request.headers.get('content-type')
      }
    });
    
  } catch (error) {
    console.error('FormData解析失败:', error);
    
    return NextResponse.json({
      success: false,
      error: 'FormData解析失败',
      details: {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        contentType: request.headers.get('content-type'),
        method: request.method
      }
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: '请使用POST方法并发送FormData进行测试'
  });
}