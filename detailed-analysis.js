import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function detailedAnalysis() {
  console.log('=== 详细字段使用情况分析 ===\n');
  
  try {
    // 获取所有submissions记录进行详细分析
    const { data: allSubmissions, error } = await supabase
      .from('submissions')
      .select('*');
    
    if (error) {
      console.error('查询submissions失败:', error);
      return;
    }
    
    console.log(`总submissions记录数: ${allSubmissions.length}\n`);
    
    // 分析每个字段的使用情况
    const fieldAnalysis = {};
    const fields = [
      'submission_id', 'student_id', 'assignment_id', 'submission_date',
      'attachments_urls', 'status', 'feedback', 'created_at', 'updated_at',
      'assignment_evaluation_detail', 'assignment_comprehensive_statistics', 'attachments_url'
    ];
    
    fields.forEach(field => {
      fieldAnalysis[field] = {
        total: allSubmissions.length,
        null_count: 0,
        empty_string_count: 0,
        empty_array_count: 0,
        has_value_count: 0,
        unique_values: new Set()
      };
    });
    
    // 统计字段使用情况
    allSubmissions.forEach(record => {
      fields.forEach(field => {
        const value = record[field];
        
        if (value === null || value === undefined) {
          fieldAnalysis[field].null_count++;
        } else if (value === '') {
          fieldAnalysis[field].empty_string_count++;
        } else if (Array.isArray(value) && value.length === 0) {
          fieldAnalysis[field].empty_array_count++;
        } else {
          fieldAnalysis[field].has_value_count++;
          if (typeof value === 'string' && value.length < 100) {
            fieldAnalysis[field].unique_values.add(value);
          }
        }
      });
    });
    
    // 输出分析结果
    console.log('字段使用情况分析:');
    console.log('==================');
    
    fields.forEach(field => {
      const analysis = fieldAnalysis[field];
      const nullPercentage = ((analysis.null_count / analysis.total) * 100).toFixed(1);
      const emptyPercentage = ((analysis.empty_array_count / analysis.total) * 100).toFixed(1);
      const hasValuePercentage = ((analysis.has_value_count / analysis.total) * 100).toFixed(1);
      
      console.log(`\n${field}:`);
      console.log(`  - 空值(null): ${analysis.null_count} (${nullPercentage}%)`);
      console.log(`  - 空字符串: ${analysis.empty_string_count}`);
      console.log(`  - 空数组: ${analysis.empty_array_count} (${emptyPercentage}%)`);
      console.log(`  - 有值: ${analysis.has_value_count} (${hasValuePercentage}%)`);
      
      if (analysis.unique_values.size > 0 && analysis.unique_values.size <= 10) {
        console.log(`  - 唯一值: ${Array.from(analysis.unique_values).join(', ')}`);
      }
    });
    
    // 检查重复字段
    console.log('\n=== 重复字段检查 ===');
    console.log('发现可能重复的字段:');
    console.log('- attachments_urls 和 attachments_url (两个都存储附件URL)');
    
    // 比较这两个字段的数据
    let attachments_urls_has_data = 0;
    let attachments_url_has_data = 0;
    let both_have_data = 0;
    let data_mismatch = 0;
    
    allSubmissions.forEach(record => {
      const urls = record.attachments_urls;
      const url = record.attachments_url;
      
      if (urls && Array.isArray(urls) && urls.length > 0) {
        attachments_urls_has_data++;
      }
      if (url && Array.isArray(url) && url.length > 0) {
        attachments_url_has_data++;
      }
      if ((urls && Array.isArray(urls) && urls.length > 0) && 
          (url && Array.isArray(url) && url.length > 0)) {
        both_have_data++;
        // 检查数据是否一致
        if (JSON.stringify(urls) !== JSON.stringify(url)) {
          data_mismatch++;
        }
      }
    });
    
    console.log(`attachments_urls有数据的记录: ${attachments_urls_has_data}`);
    console.log(`attachments_url有数据的记录: ${attachments_url_has_data}`);
    console.log(`两个字段都有数据的记录: ${both_have_data}`);
    console.log(`两个字段数据不一致的记录: ${data_mismatch}`);
    
    // 分析提交按时间排序情况
    console.log('\n=== 时间排序分析 ===');
    const sortedByDate = [...allSubmissions].sort((a, b) => 
      new Date(b.submission_date) - new Date(a.submission_date)
    );
    
    console.log('最新的5条提交记录:');
    sortedByDate.slice(0, 5).forEach((record, index) => {
      console.log(`${index + 1}. ${record.submission_date} - 学员ID: ${record.student_id}`);
    });
    
  } catch (error) {
    console.error('详细分析出错:', error);
  }
}

// 运行详细分析
detailedAnalysis();