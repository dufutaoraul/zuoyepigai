-- 将day_number列完全替换为Excel中"第几天"列的内容
-- 基于作业标题进行匹配更新

-- 第一周第一天的作业
UPDATE assignments SET day_number = '第一周第一天' WHERE assignment_title = '三项全能作品集';
UPDATE assignments SET day_number = '第一周第一天' WHERE assignment_title = '遇事不决问AI';
UPDATE assignments SET day_number = '第一周第一天' WHERE assignment_title = '用AI一句话生成游戏';
UPDATE assignments SET day_number = '第一周第一天' WHERE assignment_title = '用AI生成PPT';

-- 第一周第二天上午的作业
UPDATE assignments SET day_number = '第一周第二天上午' WHERE assignment_title = 'AI让生活更美好';
UPDATE assignments SET day_number = '第一周第二天上午' WHERE assignment_title = '综合问答练习';

-- 第一周第二天下午的作业
UPDATE assignments SET day_number = '第一周第二天下午' WHERE assignment_title = 'AI能力坐标定位';
UPDATE assignments SET day_number = '第一周第二天下午' WHERE assignment_title = '爱学一派逆向工程分析';
UPDATE assignments SET day_number = '第一周第二天下午' WHERE assignment_title = 'AI工作流挑战赛';
UPDATE assignments SET day_number = '第一周第二天下午' WHERE assignment_title = '四步冲刺挑战';

-- 第一周第三天的作业
UPDATE assignments SET day_number = '第一周第三天' WHERE assignment_title = '用netlify部署自己的网站';
UPDATE assignments SET day_number = '第一周第三天' WHERE assignment_title = '48小时创业行动计划';
UPDATE assignments SET day_number = '第一周第三天' WHERE assignment_title = '专属课程外挂';

-- 第一周第四天的作业
UPDATE assignments SET day_number = '第一周第四天' WHERE assignment_title = '小微智能体上线';
UPDATE assignments SET day_number = '第一周第四天' WHERE assignment_title = '自己的产品客服上线小微';

-- 第一周第五天上午的作业
UPDATE assignments SET day_number = '第一周第五天上午' WHERE assignment_title = '生成历史视频';
UPDATE assignments SET day_number = '第一周第五天上午' WHERE assignment_title = '拆解小红书账号';
UPDATE assignments SET day_number = '第一周第五天上午' WHERE assignment_title = '生成小红书图文';

-- 第一周第五天下午的作业
UPDATE assignments SET day_number = '第一周第五天下午' WHERE assignment_title = '改编历史视频工作流';
UPDATE assignments SET day_number = '第一周第五天下午' WHERE assignment_title = '复制拆解小红书账号工作流';
UPDATE assignments SET day_number = '第一周第五天下午' WHERE assignment_title = '复制生成小红书图文工作流';
UPDATE assignments SET day_number = '第一周第五天下午' WHERE assignment_title = '修改任意工作流';

-- 第一周第六天的作业
UPDATE assignments SET day_number = '第一周第六天' WHERE assignment_title = '开启AI全球化之路';

-- 第一周第七天上午的作业
UPDATE assignments SET day_number = '第一周第七天上午' WHERE assignment_title = '油管账号注册';
UPDATE assignments SET day_number = '第一周第七天上午' WHERE assignment_title = '情绪驱动设计账号';
UPDATE assignments SET day_number = '第一周第七天上午' WHERE assignment_title = '分析对标出报告';

-- 第一周第七天下午的作业
UPDATE assignments SET day_number = '第一周第七天下午' WHERE assignment_title = '虚拟资料';
UPDATE assignments SET day_number = '第一周第七天下午' WHERE assignment_title = 'AI写作';
UPDATE assignments SET day_number = '第一周第七天下午' WHERE assignment_title = 'AI音乐创作';

-- 第二周第一天上午的作业
UPDATE assignments SET day_number = '第二周第一天上午' WHERE assignment_title = '金句卡片生成器插件';
UPDATE assignments SET day_number = '第二周第一天上午' WHERE assignment_title = '谷歌插件上架';
UPDATE assignments SET day_number = '第二周第一天上午' WHERE assignment_title = '创建dify机器人';

-- 第二周第一天下午的作业
UPDATE assignments SET day_number = '第二周第一天下午' WHERE assignment_title = 'n8n本地部署';
UPDATE assignments SET day_number = '第二周第一天下午' WHERE assignment_title = 'cursor安装Supabase MCP数据库';

-- 第二周第二天的作业
UPDATE assignments SET day_number = '第二周第二天' WHERE assignment_title = '改编扣子官方模板应用';
UPDATE assignments SET day_number = '第二周第二天' WHERE assignment_title = '改编官方其他应用模板';
UPDATE assignments SET day_number = '第二周第二天' WHERE assignment_title = '创建自己产品的扣子应用';

-- 第二周第三天的作业
UPDATE assignments SET day_number = '第二周第三天' WHERE assignment_title = '按模板做UI前端界面';
UPDATE assignments SET day_number = '第二周第三天' WHERE assignment_title = '自己产品的UI前端界面';

-- 第二周第四天的作业
UPDATE assignments SET day_number = '第二周第四天' WHERE assignment_title = 'API接入小程序';
UPDATE assignments SET day_number = '第二周第四天' WHERE assignment_title = '完善小程序功能细节';
UPDATE assignments SET day_number = '第二周第四天' WHERE assignment_title = '做自己产品的小程序';

-- 第二周第五天的作业
UPDATE assignments SET day_number = '第二周第五天' WHERE assignment_title = 'N8N辩论工作流';
UPDATE assignments SET day_number = '第二周第五天' WHERE assignment_title = 'N8N高我工作流';
UPDATE assignments SET day_number = '第二周第五天' WHERE assignment_title = 'N8N新闻播报';
UPDATE assignments SET day_number = '第二周第五天' WHERE assignment_title = '修改N8N新闻机器人';
UPDATE assignments SET day_number = '第二周第五天' WHERE assignment_title = 'manus做网站';
UPDATE assignments SET day_number = '第二周第五天' WHERE assignment_title = 'heyboss做网站';

-- 第二周第六天的作业
UPDATE assignments SET day_number = '第二周第六天' WHERE assignment_title = '用SupabaseMCP搭建商业网站';
UPDATE assignments SET day_number = '第二周第六天' WHERE assignment_title = '调用封装MCP服务';
UPDATE assignments SET day_number = '第二周第六天' WHERE assignment_title = 'CEO指挥AI员工';

-- 验证更新结果
SELECT assignment_title, day_number FROM assignments ORDER BY assignment_title;