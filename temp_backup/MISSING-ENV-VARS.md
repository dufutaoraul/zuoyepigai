# 🚨 缺失的Netlify环境变量

根据截图分析，你需要在Netlify项目设置中添加以下环境变量：

## 必需的Supabase环境变量

```
NEXT_PUBLIC_SUPABASE_URL=https://auoflshbrysbhqmnapjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTUyMjQsImV4cCI6MjA2OTI3MTIyNH0.RE-KpbFjeEF2IUW8BSCzSnnGnKAiBPGGl6MIV7QYea4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ
```

## 豆包API问题分析

从诊断结果看，豆包API返回HTML而不是JSON，可能原因：

1. **域名限制**: 豆包可能限制了调用域名
2. **认证问题**: API密钥可能需要特殊格式
3. **地区限制**: 可能有地理位置限制

## 添加步骤

1. 进入Netlify项目设置
2. 点击 "Environment variables"  
3. 点击 "Add variable"
4. 逐个添加上述变量
5. 重新部署项目

## 测试步骤

添加环境变量后：
1. 重新部署项目
2. 访问 `/debug` 页面
3. 测试豆包API连接
4. 查看详细错误信息

---

**如果豆包API仍然失败，可能需要联系豆包客服添加Netlify域名到白名单。**