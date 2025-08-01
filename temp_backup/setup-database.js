import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 开始设置数据库...');

  try {
    // 检查连接
    console.log('📡 测试Supabase连接...');
    const { error: connectionError } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (connectionError && connectionError.code === '42P01') {
      console.log('⚠️  表格不存在，需要手动创建表格');
      console.log('请在Supabase控制台中执行 database-setup.sql 中的SQL语句');
      return;
    }

    // 检查是否有示例数据
    console.log('📊 检查现有数据...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(5);

    if (studentsError) {
      console.error('❌ 查询学员数据失败:', studentsError);
      return;
    }

    console.log(`📝 当前学员数量: ${students.length}`);

    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(5);

    if (assignmentsError) {
      console.error('❌ 查询作业数据失败:', assignmentsError);
      return;
    }

    console.log(`📚 当前作业数量: ${assignments.length}`);

    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .limit(5);

    if (submissionsError) {
      console.error('❌ 查询提交数据失败:', submissionsError);
      return;
    }

    console.log(`📄 当前提交数量: ${submissions.length}`);

    // 如果没有数据，插入示例数据
    if (students.length === 0) {
      console.log('🔄 插入示例学员数据...');
      const { error: insertStudentsError } = await supabase
        .from('students')
        .insert([
          { student_id: '2024001', student_name: '张三' },
          { student_id: '2024002', student_name: '李四' },
          { student_id: '2024003', student_name: '王五' },
          { student_id: '2024004', student_name: '赵六' },
          { student_id: '2024005', student_name: '钱七' }
        ]);

      if (insertStudentsError) {
        console.error('❌ 插入学员数据失败:', insertStudentsError);
      } else {
        console.log('✅ 学员数据插入成功');
      }
    }

    if (assignments.length === 0) {
      console.log('🔄 插入示例作业数据...');
      const { error: insertAssignmentsError } = await supabase
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

      if (insertAssignmentsError) {
        console.error('❌ 插入作业数据失败:', insertAssignmentsError);
      } else {
        console.log('✅ 作业数据插入成功');
      }
    }

    console.log('🎉 数据库设置完成！');
    console.log('\n📋 接下来的步骤:');
    console.log('1. 运行 npm install 安装依赖');
    console.log('2. 运行 npm run dev 启动开发服务器');
    console.log('3. 在Supabase控制台创建 "assignments" 存储桶');

  } catch (error) {
    console.error('❌ 数据库设置失败:', error);
  }
}

setupDatabase();