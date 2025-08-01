import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeCurrentTables() {
  console.log('=== 分析当前6个表单的结构和用途 ===\n');
  
  const tablesToAnalyze = [
    'students',           // 基础表
    'assignments',        // 基础表  
    'submissions',        // 基础表
    'admin_submissions_view',      // 视图
    'assignments_progress_view',   // 视图
    'student_progress_view'        // 视图
  ];
  
  for (const tableName of tablesToAnalyze) {
    console.log(`\n📋 分析 ${tableName}:`);
    console.log('='.repeat(50));
    
    try {
      // 检查是否为视图
      const isView = tableName.includes('_view');
      
      if (isView) {
        // 对于视图，尝试查询一些数据来了解结构
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName} 不存在或查询失败: ${error.message}`);
        } else {
          console.log(`✅ ${tableName} (视图) - 存在`);
          if (data && data.length > 0) {
            const fields = Object.keys(data[0]);
            console.log(`   字段数量: ${fields.length}`);
            console.log(`   字段列表: ${fields.join(', ')}`);
          }
        }
      } else {
        // 对于基础表，查询结构和数据量
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName} 不存在或查询失败: ${error.message}`);
        } else {
          // 获取数据量
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          console.log(`✅ ${tableName} (基础表)`);
          console.log(`   数据量: ${count || 0} 条记录`);
          
          if (data && data.length > 0) {
            const fields = Object.keys(data[0]);
            console.log(`   字段数量: ${fields.length}`);
            console.log(`   字段列表: ${fields.join(', ')}`);
            
            // 显示示例数据
            console.log(`   示例记录:`, JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
          }
        }
      }
    } catch (err) {
      console.log(`❌ 分析 ${tableName} 时出错:`, err.message);
    }
  }
  
  console.log('\n\n🎯 核心业务分析:');
  console.log('='.repeat(50));
  console.log('根据作业批改系统的核心需求，我们需要：');
  console.log('1. 📝 学员名单表 - 存储学员基本信息');
  console.log('2. 📚 作业清单表 - 存储作业定义和要求');  
  console.log('3. 📊 作业提交审核总表 - 存储提交记录和批改结果');
  console.log('');
  
  console.log('📊 表格分类建议:');
  console.log('🟢 【保留】基础数据表:');
  console.log('   • students - 学员名单（核心业务表）');
  console.log('   • assignments - 作业清单（核心业务表）');
  console.log('   • submissions - 作业提交审核总表（核心业务表）');
  console.log('');
  console.log('🔴 【删除】冗余视图:');
  console.log('   • admin_submissions_view - 可用联表查询替代');
  console.log('   • assignments_progress_view - 可用聚合查询替代');
  console.log('   • student_progress_view - 可用聚合查询替代');
  console.log('');
  
  console.log('💡 删除理由:');
  console.log('   1. 视图增加了数据库复杂度');
  console.log('   2. 相同功能可以通过简单的联表查询实现');
  console.log('   3. 减少维护成本和潜在的同步问题');
  console.log('   4. 3个基础表已经完全满足业务需求');
}

// 执行分析
analyzeCurrentTables();