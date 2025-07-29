import { NextRequest, NextResponse } from 'next/server';

// 延迟导入supabase以避免构建时错误
let supabase: any = null;

const getSupabase = async () => {
  if (!supabase) {
    const { supabase: sb } = await import('@/lib/supabase');
    supabase = sb;
  }
  return supabase;
};

export async function POST(request: NextRequest) {
  try {
    const sb = await getSupabase();
    
    // 执行SQL创建毕业统计表
    const { error: createTableError } = await sb.rpc('exec_sql', {
      sql: `
        -- 创建毕业统计表
        CREATE TABLE IF NOT EXISTS graduation_progress (
            student_id VARCHAR PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
            
            -- 必做作业统计
            mandatory_completed_count INTEGER DEFAULT 0,
            mandatory_total_count INTEGER DEFAULT 28, -- 根据参考文件中的必做作业数量
            mandatory_completed_list TEXT[] DEFAULT '{}', -- 已完成的必做作业ID数组
            
            -- 第一周第二天下午选做作业统计  
            w1d2_afternoon_completed_count INTEGER DEFAULT 0,
            w1d2_afternoon_required_count INTEGER DEFAULT 1,
            w1d2_afternoon_completed_list TEXT[] DEFAULT '{}', -- 已完成的作业ID数组
            
            -- 其他选做作业统计
            other_optional_completed_count INTEGER DEFAULT 0, 
            other_optional_required_count INTEGER DEFAULT 1,
            other_optional_completed_list TEXT[] DEFAULT '{}', -- 已完成的作业ID数组
            
            -- 毕业状态
            is_qualified BOOLEAN DEFAULT FALSE,
            missing_requirements TEXT[] DEFAULT '{}', -- 缺失的要求描述
            last_updated TIMESTAMP DEFAULT NOW()
        );

        -- 创建索引优化查询
        CREATE INDEX IF NOT EXISTS idx_graduation_progress_qualified ON graduation_progress(is_qualified);
        CREATE INDEX IF NOT EXISTS idx_graduation_progress_updated ON graduation_progress(last_updated);
      `
    });

    if (createTableError) {
      console.error('创建表错误:', createTableError);
      // 尝试直接创建表（如果rpc不可用）
      const { error: directCreateError } = await sb
        .from('graduation_progress')
        .select('student_id')
        .limit(1);
      
      if (directCreateError && directCreateError.code === '42P01') {
        // 表不存在，需要创建
        return NextResponse.json({ 
          error: '需要手动创建graduation_progress表',
          sql: `
            CREATE TABLE graduation_progress (
                student_id VARCHAR PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
                mandatory_completed_count INTEGER DEFAULT 0,
                mandatory_total_count INTEGER DEFAULT 28,
                mandatory_completed_list TEXT[] DEFAULT '{}',
                w1d2_afternoon_completed_count INTEGER DEFAULT 0,
                w1d2_afternoon_required_count INTEGER DEFAULT 1,
                w1d2_afternoon_completed_list TEXT[] DEFAULT '{}',
                other_optional_completed_count INTEGER DEFAULT 0, 
                other_optional_required_count INTEGER DEFAULT 1,
                other_optional_completed_list TEXT[] DEFAULT '{}',
                is_qualified BOOLEAN DEFAULT FALSE,
                missing_requirements TEXT[] DEFAULT '{}',
                last_updated TIMESTAMP DEFAULT NOW()
            );
          `
        }, { status: 500 });
      }
    }

    // 获取所有必做作业，分析现有数据
    const { data: assignments, error: assignmentsError } = await sb
      .from('assignments')
      .select('*')
      .order('day_number', { ascending: true });

    if (assignmentsError) {
      throw assignmentsError;
    }

    // 获取现有学生数据
    const { data: students, error: studentsError } = await sb
      .from('students')
      .select('student_id');

    if (studentsError) {
      throw studentsError;
    }

    // 为每个学生初始化毕业进度记录
    const graduationRecords = students.map((student: any) => ({
      student_id: student.student_id,
      mandatory_completed_count: 0,
      mandatory_total_count: 28,
      mandatory_completed_list: [],
      w1d2_afternoon_completed_count: 0,
      w1d2_afternoon_required_count: 1,
      w1d2_afternoon_completed_list: [],
      other_optional_completed_count: 0,
      other_optional_required_count: 1,
      other_optional_completed_list: [],
      is_qualified: false,
      missing_requirements: [],
      last_updated: new Date().toISOString()
    }));

    // 批量插入初始记录（使用upsert避免重复）
    const { error: insertError } = await sb
      .from('graduation_progress')
      .upsert(graduationRecords, {
        onConflict: 'student_id',
        ignoreDuplicates: true
      });

    if (insertError) {
      console.error('插入初始记录错误:', insertError);
    }

    return NextResponse.json({ 
      success: true,
      message: '毕业统计表创建成功',
      assignments_count: assignments?.length || 0,
      students_count: students?.length || 0,
      assignments: assignments
    });

  } catch (error) {
    console.error('Setup graduation table error:', error);
    return NextResponse.json({ 
      error: '设置毕业统计表失败', 
      details: error 
    }, { status: 500 });
  }
}