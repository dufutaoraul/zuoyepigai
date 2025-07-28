// 测试Supabase连接和设置数据
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 环境变量未配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🚀 测试Supabase连接...');
  console.log('📍 URL:', supabaseUrl);

  try {
    // 测试连接
    const { data, error } = await supabase
      .from('students')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  表格不存在');
        console.log('请先在Supabase控制台执行 supabase-tables.sql 中的SQL语句');
        console.log('步骤：');
        console.log('1. 登录 https://supabase.com');
        console.log('2. 进入项目 zuoyepigai');
        console.log('3. 点击 SQL Editor');
        console.log('4. 执行 supabase-tables.sql 中的SQL代码');
        return false;
      } else {
        console.error('❌ 连接错误:', error);
        return false;
      }
    }

    console.log('✅ Supabase连接成功！');
    return true;
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    return false;
  }
}

async function insertSampleData() {
  console.log('\n📊 插入示例数据...');

  try {
    // 检查是否已有数据
    const { data: existingStudents } = await supabase
      .from('students')
      .select('student_id')
      .limit(1);

    if (existingStudents && existingStudents.length > 0) {
      console.log('📝 数据已存在，跳过插入');
      return true;
    }

    // 插入学员数据
    console.log('🔄 插入学员数据...');
    const { error: studentsError } = await supabase
      .from('students')
      .insert([
        { student_id: '2024001', student_name: '张三' },
        { student_id: '2024002', student_name: '李四' },
        { student_id: '2024003', student_name: '王五' },
        { student_id: '2024004', student_name: '赵六' },
        { student_id: '2024005', student_name: '钱七' }
      ]);

    if (studentsError) {
      console.error('❌ 学员数据插入失败:', studentsError);
      return false;
    }

    // 插入作业数据
    console.log('🔄 插入作业数据...');
    const { error: assignmentsError } = await supabase
      .from('assignments')
      .insert([
        {
          day_number: 1,
          assignment_title: 'HTML基础页面制作',
          is_mandatory: true,
          description: '创建一个包含标题、段落、列表和链接的基础HTML页面。要求：1. 使用语义化标签；2. 包含meta标签；3. 结构清晰合理。'
        },
        {
          day_number: 1,
          assignment_title: 'CSS样式练习',
          is_mandatory: false,
          description: '为HTML页面添加基础样式。要求：1. 使用外部CSS文件；2. 设置字体、颜色、间距；3. 实现简单的布局。'
        },
        {
          day_number: 2,
          assignment_title: 'JavaScript基础语法',
          is_mandatory: true,
          description: '编写JavaScript代码实现基础功能。要求：1. 变量声明和数据类型；2. 条件判断和循环；3. 函数定义和调用。'
        },
        {
          day_number: 2,
          assignment_title: '网页交互效果',
          is_mandatory: false,
          description: '使用JavaScript实现网页交互。要求：1. 按钮点击事件；2. 表单验证；3. DOM操作。'
        },
        {
          day_number: 3,
          assignment_title: '响应式布局设计',
          is_mandatory: true,
          description: '创建响应式网页布局。要求：1. 使用CSS Grid或Flexbox；2. 适配不同屏幕尺寸；3. 移动端友好。'
        }
      ]);

    if (assignmentsError) {
      console.error('❌ 作业数据插入失败:', assignmentsError);
      return false;
    }

    console.log('✅ 示例数据插入成功！');
    return true;
  } catch (error) {
    console.error('❌ 数据插入失败:', error);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  
  if (connected) {
    await insertSampleData();
    console.log('\n🎉 数据库设置完成！');
    console.log('\n📋 接下来可以：');
    console.log('1. 运行 npm run dev 启动开发服务器');
    console.log('2. 访问 http://localhost:3000 查看应用');
    console.log('3. 在Supabase控制台创建 "assignments" 存储桶用于文件上传');
  }
}

main().catch(console.error);