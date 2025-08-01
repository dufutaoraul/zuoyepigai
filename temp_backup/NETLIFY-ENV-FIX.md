# Netlify环境变量修复指南

## 🚨 问题确认
- 本地DeepSeek API测试：✅ 正常
- Netlify部署API调用：❌ 触发后备机制
- 诊断结论：Netlify环境变量配置问题

## 🔧 立即修复步骤

### 1. 登录Netlify控制台
1. 访问 https://app.netlify.com/
2. 找到你的项目（gzynew）
3. 点击 "Site settings"
4. 选择 "Environment variables"

### 2. 检查并更新环境变量

**关键变量检查清单：**

```bash
# DeepSeek API配置（必须完全正确）
DEEPSEEK_API_KEY=sk-fc4b239f067a4f6d85297a916b309ca3  # 你的真实API密钥
DEEPSEEK_MODEL_ID=deepseek-chat
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://auoflshbrysbhqmnapjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2Zsc2hicnlzYmhxbW5hcGpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5NTIyNCwiZXhwIjoyMDY5MjcxMjI0fQ.3Wa3DDinp-0rFuJTXQAwXtY9g1KWmfLomV-_WXIqkqQ
```

### 3. 特别注意事项

⚠️ **常见错误：**
- API URL多了或少了路径
- API Key复制时多了空格
- 环境变量名称拼写错误
- 使用了错误的引号或特殊字符

✅ **正确格式：**
- 变量名：`DEEPSEEK_API_KEY`（不是 `DEEPSEEK_API_KEY `）
- 变量值：直接粘贴，不要加引号
- API URL：完整URL，以https://开头

### 4. 验证方法

更新环境变量后：
1. 在Netlify控制台触发重新部署
2. 等待部署完成（2-5分钟）
3. 重新测试作业提交功能
4. 查看批改反馈是否为真实AI响应

### 5. 调试方法

如果仍然不工作：
1. 查看Netlify Functions日志：
   - 在Netlify控制台 → Functions → 查看日志
2. 检查网络请求：
   - F12开发者工具 → Network面板
   - 查看API调用的具体错误

## 🎯 预期结果

修复后，AI批改反馈应该变为：
- ✅ "恭喜您，您的作业审核合格"
- ❌ "不合格，原因：[具体原因和建议]"

而不是："AI批改服务暂时不可用..."

## 📞 如需帮助

如果按照以上步骤操作后仍有问题，请提供：
1. Netlify控制台的环境变量截图
2. Netlify Functions的错误日志
3. 重新测试后的结果截图