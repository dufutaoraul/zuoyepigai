# 腾讯云COS配置指南

## 🔧 环境变量配置

### Netlify环境变量设置

请在Netlify项目设置 → Environment Variables 中添加以下环境变量：

```bash
# 腾讯云COS配置
TENCENT_SECRET_ID=你的SecretId
TENCENT_SECRET_KEY=你的SecretKey
TENCENT_COS_REGION=ap-guangzhou
TENCENT_COS_BUCKET=pigaizuoye-1328156262
```

### 🔐 密钥说明

- **TENCENT_SECRET_ID**: 腾讯云API密钥ID（类似用户名）
- **TENCENT_SECRET_KEY**: 腾讯云API密钥（类似密码，严格保密！）
- **TENCENT_COS_REGION**: 存储桶地域（已设定为广州：ap-guangzhou）
- **TENCENT_COS_BUCKET**: 存储桶名称（已设定为：pigaizuoye-1328156262）

## 📋 获取腾讯云密钥步骤

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 点击右上角头像 → "访问管理"
3. 左侧菜单"访问密钥" → "API密钥管理"
4. 点击"新建密钥"
5. 复制 SecretId 和 SecretKey

## ⚠️ 安全注意事项

1. **绝不要**将SecretKey提交到Git代码仓库
2. **绝不要**在聊天或公开场所分享SecretKey
3. **只在**Netlify环境变量中配置这些密钥
4. 如果密钥泄露，立即到腾讯云控制台删除并重新生成

## 🚀 配置完成后

1. 在Netlify重新部署项目
2. 测试文件上传功能
3. 检查图片是否能正常显示

## 🌐 存储桶URL格式

上传的文件将生成如下格式的URL：
```
https://pigaizuoye-1328156262.cos.ap-guangzhou.myqcloud.com/assignments/文件名
```

这个URL国内外用户都可以正常访问，无需翻墙。