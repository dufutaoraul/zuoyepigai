const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://auoflshbrysbhqmnapjp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStoragePolicies() {
  console.log('🔄 创建存储桶查看策略...');
  
  try {
    // 1. 先检查assignments桶是否存在
    console.log('1. 检查assignments存储桶是否存在...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ 获取存储桶列表失败:', bucketError.message);
      return;
    }
    
    const assignmentsBucket = buckets.find(bucket => bucket.name === 'assignments');
    
    if (!assignmentsBucket) {
      console.log('❌ assignments存储桶不存在，请先在Dashboard中创建');
      console.log('创建步骤:');
      console.log('  1. 进入Supabase Dashboard -> Storage');
      console.log('  2. 点击 New bucket');
      console.log('  3. 名称: assignments');
      console.log('  4. 设置为 Public bucket');
      console.log('  5. 点击 Create bucket');
      return;
    }
    
    console.log('✅ assignments存储桶已存在');
    
    // 2. 尝试创建查看文件的策略
    console.log('\n2. 创建查看文件策略...');
    
    // 注意：MCP可能无法直接创建RLS策略，但我们可以尝试
    const selectPolicySQL = `
      CREATE POLICY "Allow public access" ON storage.objects 
      FOR SELECT USING (bucket_id = 'assignments');
    `;
    
    console.log('需要执行的SQL:');
    console.log(selectPolicySQL);
    
    // 尝试通过RPC执行（可能会失败，因为RLS策略需要特殊权限）
    try {
      // 这个方法可能不存在，但值得尝试
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: selectPolicySQL
      });
      
      if (error) {
        console.log('❌ 无法通过MCP创建策略:', error.message);
        console.log('\n📋 请在Supabase SQL编辑器中手动执行:');
        console.log(selectPolicySQL);
      } else {
        console.log('✅ 策略创建成功!');
      }
    } catch (e) {
      console.log('❌ MCP无法创建RLS策略 (这是正常的)');
      console.log('\n📋 请在Supabase SQL编辑器中手动执行:');
      console.log(selectPolicySQL);
    }
    
    // 3. 测试文件上传和读取
    console.log('\n3. 测试存储桶功能...');
    
    // 创建一个测试文件
    const testContent = 'test file content';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    console.log(`上传测试文件: ${testFileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(testFileName, testBlob);
    
    if (uploadError) {
      console.error('❌ 文件上传失败:', uploadError.message);
      
      if (uploadError.message.includes('Bucket not found')) {
        console.log('\n⚠️ 存储桶不存在或配置错误');
        console.log('请确认在Dashboard中正确创建了assignments桶');
      }
    } else {
      console.log('✅ 文件上传成功!');
      console.log('上传路径:', uploadData.path);
      
      // 测试获取公共URL
      const { data: urlData } = supabase.storage
        .from('assignments')
        .getPublicUrl(testFileName);
      
      console.log('✅ 公共URL生成成功:', urlData.publicUrl);
      
      // 清理测试文件
      await supabase.storage
        .from('assignments')
        .remove([testFileName]);
      
      console.log('✅ 测试文件已清理');
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

createStoragePolicies();