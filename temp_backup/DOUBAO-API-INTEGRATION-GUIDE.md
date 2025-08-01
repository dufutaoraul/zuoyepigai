# 豆包(Doubao)视觉大模型API集成指南

## 🎯 项目背景
我需要将现有的AI作业批改系统从DeepSeek API（不支持图片）迁移到豆包的视觉大模型API，以实现真正的图片内容批改功能。

## 📋 需要获取的关键信息

### 1. **基础认证信息**
请帮我确认豆包API需要哪些认证信息：
- [ ] API Key格式和获取方式
- [ ] Access Token获取方法
- [ ] API密钥(Secret)是否需要
- [ ] 区域(Region)配置要求
- [ ] 其他认证参数

### 2. **API端点配置**
请提供豆包视觉大模型的API配置：
- [ ] 基础API URL（如：https://open.volcengineapi.com/api/v3/...）
- [ ] 视觉模型的具体端点路径
- [ ] 是否需要版本号参数
- [ ] 推荐使用的模型ID/名称

### 3. **图片处理能力**
请确认豆包API的图片处理规格：
- [ ] 支持的图片格式（JPG、PNG、GIF等）
- [ ] 图片大小限制（最大文件大小、像素限制）
- [ ] 图片传输方式：
  - [ ] 支持图片URL方式
  - [ ] 支持Base64编码方式
  - [ ] 支持文件上传方式
- [ ] 单次请求可处理的图片数量限制

### 4. **请求格式示例**
请提供完整的API调用示例：

```javascript
// 期望的请求格式示例
{
  "model": "具体模型名称",
  "messages": [
    {
      "role": "user", 
      "content": [
        {
          "type": "text",
          "text": "请批改这个作业"
        },
        {
          "type": "image_url", // 或者其他字段名
          "image_url": "https://example.com/image.jpg" // 或其他格式
        }
      ]
    }
  ],
  "max_tokens": 1000,
  "temperature": 0.1
  // 其他必需参数
}
```

### 5. **响应格式**
请提供API响应的数据结构：
- [ ] 成功响应的JSON结构
- [ ] AI回复内容的字段路径（如：response.choices[0].message.content）
- [ ] 错误响应的格式和常见错误码
- [ ] 使用量统计信息位置

### 6. **认证头设置**
请提供HTTP请求头的配置：
```javascript
headers: {
  "Authorization": "Bearer YOUR_API_KEY", // 或其他格式
  "Content-Type": "application/json",
  // 其他必需的头信息
}
```

### 7. **环境变量配置**
基于以上信息，我需要在Netlify中设置这些环境变量：
```bash
# 豆包API配置
DOUBAO_API_KEY=your_api_key_here
DOUBAO_API_URL=https://具体的api端点
DOUBAO_MODEL_ID=推荐的视觉模型名称
DOUBAO_REGION=区域配置（如果需要）
# 其他必需的环境变量
```

### 8. **限制和注意事项**
请告知以下限制：
- [ ] API调用频率限制（QPS/QPM）
- [ ] 每月/每日调用量限制
- [ ] 单次请求的tokens限制
- [ ] 图片处理的特殊要求或限制
- [ ] 地理位置访问限制（如海外访问）

## 🔧 当前代码结构
我的现有代码在 `src/lib/ai-fallback.ts` 中，主要函数：
```javascript
async function callAIWithFallback(
  assignmentDescription: string,
  attachmentUrls: string[], // 图片URL数组
  assignmentTitle: string
): Promise<AIGradingResult>
```

需要AI根据作业要求和图片内容，返回：
```javascript
{
  status: '合格' | '不合格',
  feedback: string // 详细的批改反馈
}
```

## 🎯 最终目标
获得完整的豆包API集成代码示例，能够：
1. 正确认证和调用豆包视觉API
2. 发送图片URL和文本提示词
3. 接收并解析AI的批改结果
4. 处理错误和异常情况

## ❓ 额外问题
1. 豆包API是否有官方的Node.js SDK？
2. 是否支持Netlify Functions环境？
3. 是否有测试用的免费额度？
4. 相比DeepSeek，豆包的图片识别能力如何？

请基于豆包官方文档提供详细的技术集成方案，谢谢！