import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 查询submissions表的结构
    const { data: submissionsSchema, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'submissions')
      .eq('table_schema', 'public');

    if (schemaError) {
      console.error('Schema query error:', schemaError);
      return NextResponse.json({
        error: 'Failed to query schema',
        details: schemaError.message
      }, { status: 500 });
    }

    // 也试试简单查询submissions表来看实际字段
    const { data: sampleData, error: sampleError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      submissionsSchema,
      sampleDataError: sampleError?.message || null,
      sampleDataKeys: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
      tableExists: !sampleError || sampleError.code !== 'PGRST106'
    });

  } catch (error) {
    console.error('Check DB schema error:', error);
    return NextResponse.json({
      error: 'Failed to check database schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}