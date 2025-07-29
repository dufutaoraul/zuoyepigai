import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('API Routes called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // 最简单的响应
    return NextResponse.json({ 
      success: true, 
      message: 'API working',
      received: body 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}