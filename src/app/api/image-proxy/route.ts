import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 从查询参数获取图片URL
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少图片URL参数' },
        { status: 400 }
      );
    }
    
    console.log('图片代理请求:', imageUrl);
    
    // 验证URL是否来自腾讯云COS
    if (!imageUrl.includes('pigaizuoye-1328156262.cos.ap-guangzhou.myqcloud.com')) {
      return NextResponse.json(
        { error: '只允许代理腾讯云COS图片' },
        { status: 403 }
      );
    }
    
    // 从腾讯云COS获取图片
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000) // 10秒超时
    });
    
    if (!imageResponse.ok) {
      console.error('获取图片失败:', imageResponse.status, imageResponse.statusText);
      return NextResponse.json(
        { 
          error: '获取图片失败',
          status: imageResponse.status,
          statusText: imageResponse.statusText
        },
        { status: imageResponse.status }
      );
    }
    
    // 获取图片数据和类型
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    console.log(`图片代理成功: ${imageUrl}, 大小: ${imageBuffer.byteLength} bytes, 类型: ${contentType}`);
    
    // 返回图片数据
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('图片代理错误:', error);
    
    return NextResponse.json(
      { 
        error: '图片代理失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ message: '请使用GET方法访问图片代理' });
}