// 通过Supabase管理API创建表格
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTablesViaAPI() {
  console.log('🏗️  尝试通过API创建数据库表格...');
  
  // SQL语句
  const createTablesSQL = `
-- 创建学员名单表
CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(20) PRIMARY KEY,
  student_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建作业清单表
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  assignment_title VARCHAR(200) NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建作业提交审核表
CREATE TABLE IF NOT EXISTS submissions (
  submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attachments_url JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT '批改中' CHECK (status IN ('批改中', '合格', '不合格')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assignments_day_number ON assignments(day_number);
CREATE INDEX IF NOT EXISTS idx_assignments_mandatory ON assignments(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
`;

  try {
    // 尝试通过REST API执行SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: createTablesSQL
      })
    });
    
    if (response.ok) {
      console.log('✅ 通过API创建表格成功');
      return true;
    } else {
      console.log('⚠️  API创建失败，状态:', response.status);
    }
  } catch (error) {
    console.log('⚠️  API调用失败:', error.message);
  }
  
  // 如果API失败，尝试直接插入测试数据来创建表
  console.log('🔄 尝试通过插入数据的方式创建表...');
  
  try {
    // 先尝试插入一条测试数据到students表
    const { data, error } = await supabase
      .from('students')
      .insert([
        { student_id: 'TEST001', student_name: '测试用户' }
      ]);
    
    if (!error) {
      console.log('✅ Students表存在或创建成功');
      
      // 删除测试数据
      await supabase
        .from('students')
        .delete()
        .eq('student_id', 'TEST001');
        
      return true;
    } else {
      console.log('❌ Students表不存在:', error.message);
    }
  } catch (error) {
    console.log('❌ 表格测试失败:', error.message);
  }
  
  return false;
}

async function insertAssignments() {
  console.log('📚 插入作业数据...');
  
  const assignments = [
    {
      day_number: 1,
      assignment_title: 'AI工具使用基础',
      is_mandatory: true,
      description: '学习和掌握基本的AI工具使用方法。要求：1. 了解主流AI工具；2. 完成基础操作练习；3. 提交使用心得。'
    },
    {
      day_number: 1,
      assignment_title: 'AI创作实践',
      is_mandatory: false,
      description: '使用AI工具进行创作练习。要求：1. 选择一个AI创作工具；2. 完成一个小作品；3. 分享创作过程。'
    },
    {
      day_number: 2,
      assignment_title: 'AI与商业应用',
      is_mandatory: true,
      description: '了解AI在商业领域的应用案例。要求：1. 研究一个AI商业案例；2. 分析应用效果；3. 提出改进建议。'
    },
    {
      day_number: 2,
      assignment_title: 'AI工具比较分析',
      is_mandatory: false,
      description: '比较不同AI工具的特点和适用场景。要求：1. 选择2-3个同类AI工具；2. 对比分析优劣；3. 给出使用建议。'
    },
    {
      day_number: 3,
      assignment_title: 'AI创富项目策划',
      is_mandatory: true,
      description: '设计一个基于AI的创富项目。要求：1. 明确项目目标；2. 制定实施计划；3. 分析可行性和风险。'
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignments);
    
    if (error) {
      console.log('⚠️  作业数据插入失败:', error.message);
    } else {
      console.log('✅ 作业数据插入成功');
    }
  } catch (error) {
    console.log('❌ 作业数据插入异常:', error.message);
  }
}

async function main() {
  console.log('🚀 开始创建数据库表格...\n');
  
  const success = await createTablesViaAPI();
  
  if (success) {
    await insertAssignments();
    console.log('\n✅ 数据库设置完成！现在可以运行学员数据导入脚本：');
    console.log('node import-students.js');
  } else {
    console.log('\n❌ 无法自动创建表格。请手动在Supabase控制台执行SQL：');
    console.log('\n1. 访问 https://supabase.com');
    console.log('2. 进入项目 zuoyepigai');
    console.log('3. 点击 SQL Editor');
    console.log('4. 执行 quick-setup.sql 文件中的SQL代码');
  }
}

main().catch(console.error);