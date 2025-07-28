const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function alterDayNumberToText() {
  console.log('🔄 准备修改day_number字段类型从integer到text...');
  
  try {
    // 使用原始SQL来修改字段类型
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE assignments 
        ALTER COLUMN day_number TYPE TEXT 
        USING day_number::TEXT;
      `
    });

    if (error) {
      console.error('❌ 修改字段类型失败:', error);
      
      // 尝试另一种方法：直接使用SQL查询
      console.log('\n🔄 尝试使用PostgreSQL函数执行...');
      
      // 创建一个临时函数来执行ALTER TABLE
      const { data: funcData, error: funcError } = await supabase.rpc('alter_day_number_type');
      
      if (funcError) {
        console.error('❌ 第二种方法也失败:', funcError);
        console.log('\n📋 需要手动在Supabase SQL编辑器中执行以下命令:');
        console.log('ALTER TABLE assignments ALTER COLUMN day_number TYPE TEXT USING day_number::TEXT;');
        return false;
      }
    }

    console.log('✅ day_number字段类型修改成功！');
    return true;

  } catch (error) {
    console.error('❌ 执行失败:', error);
    console.log('\n📋 请在Supabase SQL编辑器中手动执行:');
    console.log('ALTER TABLE assignments ALTER COLUMN day_number TYPE TEXT USING day_number::TEXT;');
    return false;
  }
}

async function updateFirstRowAfterAlter() {
  const targetId = '584a1f2f-79ef-45ed-b5e3-eed6727ad93d';
  const newDayValue = '第一周第五天下午';
  
  console.log('\n🔄 修改第一行day_number值...');
  console.log(`目标记录: 生成历史视频`);
  console.log(`新值: ${newDayValue}`);
  
  try {
    const { data, error } = await supabase
      .from('assignments')
      .update({ day_number: newDayValue })
      .eq('assignment_id', targetId)
      .select();

    if (error) {
      console.error('❌ 更新失败:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('\n✅ 更新成功！');
      console.log('更新后的数据:');
      console.log(`assignment_title: ${data[0].assignment_title}`);
      console.log(`day_number: ${data[0].day_number}`);
    }

  } catch (error) {
    console.error('❌ 更新失败:', error);
  }
}

async function main() {
  const alterSuccess = await alterDayNumberToText();
  
  if (alterSuccess) {
    // 如果字段类型修改成功，继续更新第一行
    await updateFirstRowAfterAlter();
  } else {
    console.log('\n⚠️ 字段类型修改失败，无法继续更新数据');
    console.log('请先手动修改字段类型，然后运行update-first-day5.js');
  }
}

main();