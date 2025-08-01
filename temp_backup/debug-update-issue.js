const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUpdateIssue() {
  console.log('🔍 分析更新失败的原因...');
  
  try {
    // 1. 检查目标记录是否存在
    console.log('\n1. 检查目标记录是否存在:');
    const { data: checkData, error: checkError } = await supabase
      .from('assignments')
      .select('assignment_id, assignment_title, day_number')
      .eq('assignment_id', '584a1f2f-79ef-45ed-b5e3-eed6727ad93d');

    if (checkError) {
      console.error('❌ 查询失败:', checkError);
      return;
    }

    if (checkData && checkData.length > 0) {
      console.log('✅ 目标记录存在:');
      console.log(`   assignment_title: ${checkData[0].assignment_title}`);
      console.log(`   day_number: "${checkData[0].day_number}"`);
      console.log(`   assignment_id: ${checkData[0].assignment_id}`);
    } else {
      console.log('❌ 目标记录不存在！');
      return;
    }

    // 2. 检查表中是否有任何中文day_number
    console.log('\n2. 检查表中是否有中文day_number:');
    const { data: allData, error: allError } = await supabase
      .from('assignments')
      .select('assignment_id, assignment_title, day_number')
      .limit(10);

    if (allData) {
      console.log('前10条记录的day_number:');
      allData.forEach((row, index) => {
        const hasChineseChars = /[\u4e00-\u9fff]/.test(row.day_number);
        console.log(`${index + 1}. "${row.day_number}" (${hasChineseChars ? '包含中文' : '纯数字/英文'}) - ${row.assignment_title.substring(0, 15)}...`);
      });
    }

    // 3. 尝试再次更新并获取详细错误信息
    console.log('\n3. 尝试再次更新目标记录:');
    const { data: updateData, error: updateError, status, statusText } = await supabase
      .from('assignments')
      .update({ day_number: '第一周第五天下午' })
      .eq('assignment_id', '584a1f2f-79ef-45ed-b5e3-eed6727ad93d')
      .select();

    console.log(`HTTP状态: ${status} ${statusText}`);
    
    if (updateError) {
      console.error('❌ 更新错误详情:', updateError);
    }
    
    if (updateData) {
      console.log('✅ 更新返回的数据:', updateData);
    }

    // 4. 检查是否有RLS政策阻止更新
    console.log('\n4. 检查可能的权限问题:');
    try {
      const { data: testUpdate, error: testError } = await supabase
        .from('assignments')
        .update({ assignment_title: checkData[0].assignment_title }) // 更新为相同值
        .eq('assignment_id', '584a1f2f-79ef-45ed-b5e3-eed6727ad93d')
        .select();

      if (testError) {
        console.log('❌ 基础更新也失败，可能是权限问题:', testError);
      } else {
        console.log('✅ 基础更新成功，不是权限问题');
      }
    } catch (e) {
      console.log('❌ 权限测试异常:', e.message);
    }

    // 5. 最终验证当前状态
    console.log('\n5. 最终验证当前状态:');
    const { data: finalCheck, error: finalError } = await supabase
      .from('assignments')
      .select('assignment_id, assignment_title, day_number')
      .eq('assignment_id', '584a1f2f-79ef-45ed-b5e3-eed6727ad93d');

    if (finalCheck && finalCheck.length > 0) {
      console.log('当前记录状态:');
      console.log(`   day_number: "${finalCheck[0].day_number}"`);
      console.log(`   是否为中文: ${/[\u4e00-\u9fff]/.test(finalCheck[0].day_number)}`);
    }

  } catch (error) {
    console.error('❌ 调试过程异常:', error);
  }
}

debugUpdateIssue();