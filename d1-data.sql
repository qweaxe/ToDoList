-- D1 (SQLite) Data Migration
-- Converted from PostgreSQL data dump

-- Users data (PBKDF2 hashed passwords, format: "salt:hash" base64)
INSERT OR IGNORE INTO users (id, username, password, name, createdAt, updatedAt, securityQuestion, securityAnswer, securityAnswerAttempts, securityAnswerLockedAt) VALUES
    ('cmmt9ujg40000l804927vwgtk', 'test123', 'NVR3X7CabmkzzpykIeKckw==:xmdbPFwzTOiv7RBoRcuK9RX9sYMaTlfVBlkBe8xaXpQ=', '测试账号', '2026-03-16T14:21:22.037Z', '2026-03-16T14:21:22.037Z', NULL, NULL, 0, NULL),
    ('cmmuph3ay0000jl04gyaxn4eh', 'test1234', 'yxuZ8e/jK08nq+LNMxhBig==:DXn1o7xWk0N/wNp+tb2dwWrVsFDKoVUDybi/rTP3tUY=', 'test1234', '2026-03-17T14:26:34.618Z', '2026-03-17T14:26:34.618Z', NULL, NULL, 0, NULL),
    ('cllegacyuser000000000000', 'admin', 'yaBE/jDvs2ZJegy/11DpbA==:Gdszdd/ydjaOFnAN69Y4A6IchhQOVtJ9Iv7sO5utPE0=', '管理员', '2026-03-16T09:14:45.137Z', '2026-03-16T09:14:45.137Z', NULL, NULL, 0, NULL),
    ('cmmx7i62q0000jy0469qjk4ey', 'test', 'MOfWrfqVAL4pxrWFSHAXjw==:WQRYpxtaG8xBqM6OYNRZCzm6bCOtrXpRKYU6QwoZjvQ=', 'test', '2026-03-19T08:26:50.307Z', '2026-03-19T08:26:50.307Z', NULL, NULL, 0, NULL);

-- Levels data
INSERT OR IGNORE INTO levels (id, name, value, description, createdAt, updatedAt) VALUES
    ('cmmbuvfki0005l204xv0lsc5o', '高', 3, '高优先级，需要优先处理', '2026-03-04T09:50:04.435Z', '2026-03-04T09:50:04.435Z'),
    ('cmmbuvgca0006l2046c1nv9r6', '中', 2, '中等优先级，正常处理', '2026-03-04T09:50:05.434Z', '2026-03-04T09:50:05.434Z'),
    ('cmmbuvh410007l204u66t16jl', '低', 1, '低优先级，有空时处理', '2026-03-04T09:50:06.433Z', '2026-03-04T09:50:06.433Z');

-- Categories data
INSERT OR IGNORE INTO categories (id, name, description, emoji, color, createdAt, updatedAt, userId) VALUES
    ('cmmbuvbpl0000l204sqqyzu0c', '工作', '工作相关任务', '💼', 'bg-blue-500', '2026-03-04T09:49:59.433Z', '2026-03-04T09:49:59.433Z', 'cllegacyuser000000000000'),
    ('cmmbuvche0001l2044mi9i598', '生活', '日常生活事务', '🏠', 'bg-green-500', '2026-03-04T09:50:00.434Z', '2026-03-04T09:50:00.434Z', 'cllegacyuser000000000000'),
    ('cmmbuvd980002l20460p67w1q', '学习', '学习与成长', '📚', 'bg-purple-500', '2026-03-04T09:50:01.437Z', '2026-03-04T09:50:01.437Z', 'cllegacyuser000000000000'),
    ('cmmbuve0z0003l204a05dau4b', '健康', '健康与运动', '💪', 'bg-red-500', '2026-03-04T09:50:02.436Z', '2026-03-04T09:50:02.436Z', 'cllegacyuser000000000000'),
    ('cmmbuvesr0004l204k1w05yyf', '娱乐', '休闲与娱乐', '🎮', 'bg-yellow-500', '2026-03-04T09:50:03.435Z', '2026-03-04T09:50:03.435Z', 'cllegacyuser000000000000'),
    ('cmmc3ghvl0002k004x3n1bblz', '事业', NULL, '📈', NULL, '2026-03-04T13:50:24.129Z', '2026-03-04T13:50:24.129Z', 'cllegacyuser000000000000'),
    ('cmmt9uk820001l80438k0dv2d', '工作', NULL, '💼', 'blue', '2026-03-16T14:21:23.043Z', '2026-03-16T14:21:23.043Z', 'cmmt9ujg40000l804927vwgtk'),
    ('cmmt9uk820002l804v07e5996', '学习', NULL, '📚', 'green', '2026-03-16T14:21:23.043Z', '2026-03-16T14:21:23.043Z', 'cmmt9ujg40000l804927vwgtk'),
    ('cmmt9uk820003l804eqbmp6xv', '生活', NULL, '🏠', 'orange', '2026-03-16T14:21:23.043Z', '2026-03-16T14:21:23.043Z', 'cmmt9ujg40000l804927vwgtk'),
    ('cmmuph4330001jl04zdpkvtjg', '工作', NULL, '💼', 'blue', '2026-03-17T14:26:35.632Z', '2026-03-17T14:26:35.632Z', 'cmmuph3ay0000jl04gyaxn4eh'),
    ('cmmuph4330002jl04uzd5a2xk', '学习', NULL, '📚', 'green', '2026-03-17T14:26:35.632Z', '2026-03-17T14:26:35.632Z', 'cmmuph3ay0000jl04gyaxn4eh'),
    ('cmmuph4330003jl04jn2leyy5', '生活', NULL, '🏠', 'orange', '2026-03-17T14:26:35.632Z', '2026-03-17T14:26:35.632Z', 'cmmuph3ay0000jl04gyaxn4eh'),
    ('cmmx7i6xf0001jy04wzyj1d6f', '工作', NULL, '💼', 'blue', '2026-03-19T08:26:51.411Z', '2026-03-19T08:26:51.411Z', 'cmmx7i62q0000jy0469qjk4ey'),
    ('cmmx7i6xf0002jy04o2sby6t6', '学习', NULL, '📚', 'green', '2026-03-19T08:26:51.411Z', '2026-03-19T08:26:51.411Z', 'cmmx7i62q0000jy0469qjk4ey'),
    ('cmmx7i6xf0003jy04xvpacsb7', '生活', NULL, '🏠', 'orange', '2026-03-19T08:26:51.411Z', '2026-03-19T08:26:51.411Z', 'cmmx7i62q0000jy0469qjk4ey');

-- Holidays data
INSERT OR IGNORE INTO holidays (id, date, name, isHoliday, year, createdAt) VALUES
    ('cmmbuxpx10001jl04u6atj4jh', '2026-01-01', '元旦', 1, 2026, '2026-03-04T09:51:51.157Z'),
    ('cmmbuxpx10002jl04b5a422rv', '2026-04-04', '清明节', 1, 2026, '2026-03-04T09:51:51.157Z'),
    ('cmmbuxqou0004jl04lfee2b7j', '2026-01-04', '元旦调休', 0, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxqou0003jl047v3sixhx', '2026-04-06', '清明节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxqug0005jl04e9vqb9wp', '2026-01-03', '元旦', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxqun0006jl04cqjk9mfn', '2026-04-05', '清明节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxqv10007jl04vcjniz2y', '2026-01-02', '元旦', 1, 2026, '2026-03-04T09:51:51.157Z'),
    ('cmmbuxrgg0009jl04d8w00uuq', '2026-01-25', '元旦调休', 0, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxrgf0008jl04cg5ool0d', '2026-04-26', '劳动节调休', 0, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxrlx000ajl04y9tv1jo8', '2026-05-01', '劳动节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxrm9000bjl04enrjbd8f', '2026-02-15', '春节调休', 0, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxrms000cjl04z0e08eek', '2026-05-02', '劳动节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxs80000djl04hido5ssp', '2026-02-16', '除夕', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxs80000ejl048umvz0zu', '2026-05-03', '劳动节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxsde000fjl04kg67ym5e', '2026-02-17', '春节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxsdw000gjl04o2yyink3', '2026-05-04', '劳动节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxsek000hjl04ofazl3th', '2026-02-18', '春节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxszl000ijl04f9at97is', '2026-05-05', '劳动节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxszm000jjl04zez36doo', '2026-02-19', '春节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxt4w000kjl04rvl215g3', '2026-02-20', '春节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxt5h000ljl04yymr1tjn', '2026-02-21', '春节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxt6e000mjl04sn92g0u2', '2026-02-22', '春节', 1, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxtr6000njl04pkn206nq', '2026-05-09', '劳动节调休', 0, 2026, '2026-03-04T09:51:51.158Z'),
    ('cmmbuxtrd000ojl042ysqw5pq', '2026-02-28', '春节调休', 0, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxtwd000pjl04afdidh7l', '2026-03-01', '春节调休', 0, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxtx4000qjl04fn3jil3s', '2026-06-19', '端午节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxty7000rjl04q2a0x5wc', '2026-06-20', '端午节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxuir000sjl04sngndoin', '2026-10-04', '中秋节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxuj2000tjl047q1ntqyf', '2026-06-21', '端午节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxunu000ujl04ki0jyma5', '2026-09-27', '国庆调休', 0, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxuot000vjl04bwkuk1xe', '2026-10-01', '国庆节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxupy000wjl04ck2fglx3', '2026-10-02', '国庆节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxvac000xjl0462ama293', '2026-10-05', '国庆节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxvap000yjl0409wd04g3', '2026-10-03', '国庆节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxvfb000zjl04zoacqo5x', '2026-10-08', '国庆节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxvgf0010jl04vwed3o0f', '2026-10-06', '国庆节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxvhq0011jl04mp6d7ol7', '2026-10-07', '国庆节', 1, 2026, '2026-03-04T09:51:51.159Z'),
    ('cmmbuxw1y0012jl04etm8i59u', '2026-10-10', '国庆调休', 0, 2026, '2026-03-04T09:51:51.159Z');

-- API Keys data
INSERT OR IGNORE INTO api_keys (id, name, key, userId, createdAt, lastUsedAt, expiresAt) VALUES
    ('cmnh61hzq0001lh04zxbxpszz', 'Obsidian_test', 'bd62bf7a28d04b4a77f61d526f3d9d237f1edd15d563cd4b0269d1bad8ed0f89', 'cllegacyuser000000000000', '2026-04-02T07:41:16.503Z', NULL, NULL);

-- Todos data
INSERT OR IGNORE INTO todos (id, title, description, status, subTasks, isCycleTask, recurrenceRuleId, parentRuleId, categoryId, levelId, priority, isMilestone, createdAt, updatedAt, userId, startDate, dueDate, completedAt) VALUES
    ('cmmbuwdpz0001l404k427sdwh', '锻炼', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuve0z0003l204a05dau4b', NULL, 0, 0, '2026-03-04T09:50:48.493Z', '2026-03-04T09:51:11.034Z', 'cllegacyuser000000000000', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z'),
    ('cmmbvf6f60001l10433vzhwjx', '将To Do部署到Vercel上并打通访问', '', 'completed', '[{"id":"8188bb71-8306-45c8-9066-cac19595a2b9","text":"代码上传GitHub","isDone":true},{"id":"c96b3ebb-8e41-4593-b8bb-3d8b8f8f0a76","text":"supabase环境配置","isDone":true},{"id":"d70dbb13-761b-4610-9b55-51b08d15a874","text":"vercel任务的配置","isDone":true},{"id":"152059ff-7747-4449-b020-3761dae3710d","text":"测试功能","isDone":true}]', 0, NULL, NULL, 'cmmbuvd980002l20460p67w1q', NULL, 0, 0, '2026-03-04T10:05:25.465Z', '2026-03-04T10:08:55.196Z', 'cllegacyuser000000000000', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z', '2026-03-04T00:00:00.000Z'),
    ('cmmc3dre80001k004x4zf6biw', '整车场景确认', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', NULL, 0, 0, '2026-03-04T13:48:16.494Z', '2026-03-05T15:50:45.584Z', 'cllegacyuser000000000000', '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z'),
    ('cmmc3flno0001jr04odgzz6c0', '3月规划', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuvche0001l2044mi9i598', NULL, 0, 0, '2026-03-04T13:49:42.172Z', '2026-03-15T15:12:04.502Z', 'cllegacyuser000000000000', '2026-03-05T00:00:00.000Z', '2026-03-05T00:00:00.000Z', '2026-03-15T00:00:00.000Z'),
    ('cmmla2hfx0001js047uzlpv6k', '手机膜更换', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuvche0001l2044mi9i598', NULL, 0, 0, '2026-03-11T00:05:23.048Z', '2026-03-11T15:20:48.058Z', 'cllegacyuser000000000000', '2026-03-11T00:00:00.000Z', '2026-03-11T00:00:00.000Z', '2026-03-11T00:00:00.000Z'),
    ('cmmmo9as20001l504kr8vorng', '安装ccswitch', '', 'completed', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', NULL, 0, 0, '2026-03-11T23:30:21.838Z', '2026-03-12T02:35:07.313Z', 'cllegacyuser000000000000', '2026-03-12T00:00:00.000Z', '2026-03-12T00:00:00.000Z', '2026-03-12T00:00:00.000Z'),
    ('cmmmuujmy0001l804wgp281yw', '工业互联网材料整理，汇报思路讲解', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-03-12T02:34:50.789Z', '2026-03-12T15:56:25.368Z', 'cllegacyuser000000000000', '2026-03-12T00:00:00.000Z', '2026-03-12T00:00:00.000Z', '2026-03-12T00:00:00.000Z'),
    ('cmmmuytt20001l204vcmzacky', 'skill-creator的整理优化', '', 'completed', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', NULL, 0, 0, '2026-03-12T02:38:10.590Z', '2026-03-15T15:09:14.835Z', 'cllegacyuser000000000000', '2026-03-12T00:00:00.000Z', '2026-03-12T00:00:00.000Z', '2026-03-15T00:00:00.000Z'),
    ('cmmno1zox0001k404qrhu1nbl', '主机从仓库拉取skills项目', '', 'completed', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', NULL, 0, 0, '2026-03-12T16:12:27.049Z', '2026-03-12T16:15:00.142Z', 'cllegacyuser000000000000', '2026-03-13T00:00:00.000Z', '2026-03-13T00:00:00.000Z', '2026-03-13T00:00:00.000Z'),
    ('cmmnnlfbg0001js04hnq1cydv', '确认CodeCraft的需求确认书', '', 'completed', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', NULL, 0, 0, '2026-03-12T15:59:34.145Z', '2026-03-17T00:49:12.026Z', 'cllegacyuser000000000000', '2026-03-11T00:00:00.000Z', '2026-03-15T00:00:00.000Z', '2026-03-17T00:00:00.000Z'),
    ('cmmnnm3020003js0431tqlf1e', 'NGR2.0的文档完成', '', 'pending', '[{"id":"c50f20aa-5d6b-48fa-b0a3-fe340fc9793f","text":"建设方案","isDone":true},{"id":"7833e735-3c47-4ca4-81ca-4c6170951a83","text":"指标手册","isDone":true},{"id":"ceec4698-e4e5-4fec-a102-5a4154d282ff","text":"应用指南","isDone":false}]', 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-03-12T16:00:04.843Z', '2026-03-20T02:32:48.885Z', 'cllegacyuser000000000000', '2026-03-12T00:00:00.000Z', '2026-03-17T00:00:00.000Z', NULL),
    ('cmmil7xo80001js043i416q8x', '列举待办事项', '只要是有想法的就列举出来，先不考虑可行性和时间周期等问题', 'completed', '[{"id":"20627326-40b3-4dbc-a426-e89eae5689ec","text":"工作：五羊文档撰写","isDone":false},{"id":"dfcb8d4c-5e1e-48ea-9212-2b4f25c8775c","text":"工作：财务整车场景对比倒数","isDone":true},{"id":"cfebcbfa-c656-4e66-9994-423c7d419ab3","text":"项目：ToDoList软件完善","isDone":true},{"id":"80453a33-747c-4958-b670-d8cb4152768a","text":"项目：股票分析初步使用","isDone":true},{"id":"b802f8bc-8f45-45c8-99e7-36cd0478a948","text":"项目：LifeNexus的需求整理","isDone":true},{"id":"4841f915-7726-4410-88d3-50d2926aeb6d","text":"项目：工作电脑与NAS的文件夹同步","isDone":false},{"id":"8df3cb24-91af-44bd-9053-b63919f46994","text":"阅读：沧浪之水","isDone":false},{"id":"b75676e1-4a3e-4e33-a18e-625154a0e4a6","text":"阅读：聪明的投资者","isDone":false},{"id":"b613e5e1-d96c-47cf-b571-ff3351a4561a","text":"阅读：鸟哥的Linux私房菜","isDone":false},{"id":"18554c18-eb82-4500-b203-b3c29d784c78","text":"项目:财务状况分析与总结","isDone":true},{"id":"198877c3-79ce-4ac9-afb0-be857e24f35b","text":"工作:智能体开发","isDone":true}]', 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', NULL, 0, 0, '2026-03-09T02:54:14.837Z', '2026-04-09T00:27:46.160Z', 'cllegacyuser000000000000', '2026-03-09T00:00:00.000Z', '2026-03-15T00:00:00.000Z', '2026-04-09T08:27:46.159Z'),
    ('cmncepbi30001ic04zjqj49ny', '取快递 5-3-28001', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuvche0001l2044mi9i598', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-03-29T23:44:53.685Z', '2026-03-30T11:12:06.325Z', 'cllegacyuser000000000000', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z'),
    ('cmncm3k6y0001jy046hk6bifg', 'workbuddy注册', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvgca0006l2046c1nv9r6', 0, 0, '2026-03-30T03:11:55.441Z', '2026-03-30T07:28:25.600Z', 'cllegacyuser000000000000', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z'),
    ('cmncitmq60001jy04h5w6auci', '谈话', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-03-30T01:40:13.321Z', '2026-03-30T11:32:33.127Z', 'cllegacyuser000000000000', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z'),
    ('cmnchyzg20001jv04fvd2013j', '整理房间，丢弃杂物', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuvche0001l2044mi9i598', 'cmmbuvgca0006l2046c1nv9r6', 0, 0, '2026-03-30T01:16:23.466Z', '2026-04-04T03:20:21.124Z', 'cllegacyuser000000000000', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z', '2026-04-04T00:00:00.000Z'),
    ('cmncgul080001l804uctikqhc', '考虑卖出本金部分', '', 'completed', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-03-30T00:44:58.514Z', '2026-04-10T02:12:05.444Z', 'cllegacyuser000000000000', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z', '2026-04-10T02:12:05.000Z'),
    ('cmnch4pih0001jp043epwo31r', '购买AI账户', '', 'completed', '[{"id":"666002cd-bbd0-440a-85d2-dc8d2d620477","text":"Claude pro","isDone":true},{"id":"d8751a93-0e3e-4649-9cb3-b7d51943e96a","text":"Gemini","isDone":true},{"id":"3b8cfca0-f7be-4b3b-b8cf-dfa901a02808","text":"狗云服务器","isDone":true}]', 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-03-30T00:52:49.888Z', '2026-04-08T07:18:09.863Z', 'cllegacyuser000000000000', '2026-03-30T00:00:00.000Z', '2026-03-31T00:00:00.000Z', '2026-04-08T15:18:09.000Z'),
    ('cmncsqrwy0001jj04t5pk4c5l', '系统分析师报名、复习计划', '', 'completed', '[{"id":"c448ba38-77ce-48e3-a958-c3d4e18f1ab4","text":"报名","isDone":true},{"id":"cb618790-018f-4ddc-ae83-b8130e01c18e","text":"复习计划","isDone":true}]', 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvfki0005l204xv0lsc5o', 0, 1, '2026-03-30T06:17:56.432Z', '2026-04-04T03:20:49.656Z', 'cllegacyuser000000000000', '2026-03-30T00:00:00.000Z', '2026-03-31T00:00:00.000Z', '2026-04-04T00:00:00.000Z'),
    ('cmndbvquh0001jo04pbsnqz5c', '完成初版右侧交易投资策略', '', 'completed', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', 'cmmbuvgca0006l2046c1nv9r6', 0, 0, '2026-03-30T15:13:40.836Z', '2026-04-02T11:37:17.212Z', 'cllegacyuser000000000000', '2026-03-31T00:00:00.000Z', '2026-03-31T00:00:00.000Z', '2026-04-02T00:00:00.000Z'),
    ('cmndcaeg70001jl045iy89uui', '专利交底书', '', 'pending', NULL, 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvfki0005l204xv0lsc5o', 0, 1, '2026-03-30T15:25:04.608Z', '2026-03-30T15:25:04.608Z', 'cllegacyuser000000000000', '2026-03-30T00:00:00.000Z', '2026-03-31T00:00:00.000Z', NULL),
    ('cmncesvfl0001jo04ooz0vgf0', 'to do list 功能修复', '', 'completed', '[{"id":"61e16c2e-6883-4455-9992-8e44855263ed","text":"登录页测试账号信息删除","isDone":true},{"id":"1413ce81-5655-436a-aec3-97aee60495d0","text":"创建完成新任务后，看看源码是否会自动获取任务","isDone":true}]', 0, NULL, NULL, NULL, NULL, 0, 0, '2026-03-29T23:47:39.484Z', '2026-03-30T11:12:51.962Z', 'cllegacyuser000000000000', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z', '2026-03-30T00:00:00.000Z'),
    ('cmne8wczp0001la04boemnps3', '小龙虾OpenClaw科普PPT改造', '要求生动有趣，学生能够理解的内容', 'pending', NULL, 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvgca0006l2046c1nv9r6', 0, 0, '2026-03-31T06:37:55.848Z', '2026-04-02T11:38:47.564Z', 'cllegacyuser000000000000', '2026-03-31T00:00:00.000Z', '2026-04-21T00:00:00.000Z', NULL),
    ('cmnhhi06u0001js043dc2ct9u', '燎原大数据考试', '', 'pending', NULL, 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-04-02T13:02:02.158Z', '2026-04-02T13:02:02.158Z', 'cllegacyuser000000000000', '2026-05-19T00:00:00.000Z', '2026-05-19T00:00:00.000Z', NULL),
    ('cmnkbo32w0001l8044v3hjbrs', '系统分析师论文一篇', '', 'completed', NULL, 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-04-04T12:42:06.674Z', '2026-04-06T13:23:56.872Z', 'cllegacyuser000000000000', '2026-04-04T00:00:00.000Z', '2026-04-06T00:00:00.000Z', '2026-04-06T21:23:56.871Z'),
    ('cmnjxauig0001l104xel30fvi', '完成Claude踩坑指南的除购买Claude的其余内容', '', 'pending', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', 'cmmbuvfki0005l204xv0lsc5o', 0, 1, '2026-04-04T05:59:54.615Z', '2026-04-04T05:59:54.615Z', 'cllegacyuser000000000000', '2026-04-04T00:00:00.000Z', '2026-04-04T00:00:00.000Z', NULL),
    ('cmnjzorso0001jl047qeeoanh', '形成LifeNexus的初版', '', 'pending', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', 'cmmbuvfki0005l204xv0lsc5o', 0, 1, '2026-04-04T07:06:43.310Z', '2026-04-08T08:19:42.572Z', 'cllegacyuser000000000000', '2026-04-04T00:00:00.000Z', '2026-04-18T00:00:00.000Z', NULL),
    ('cmnoghu2v0001l504n4zvc3ur', 'LifeNexus的代码上传并更新至仓库', '', 'completed', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-04-07T10:08:17.855Z', '2026-04-07T13:56:42.053Z', 'cllegacyuser000000000000', '2026-04-07T00:00:00.000Z', '2026-04-07T23:59:00.000Z', '2026-04-07T21:56:42.052Z'),
    ('cmnogfu6q0001js04a3unaism', 'AI培训师报名', 'AI数据治理', 'completed', NULL, 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvgca0006l2046c1nv9r6', 0, 0, '2026-04-07T10:06:44.653Z', '2026-04-08T07:21:40.150Z', 'cllegacyuser000000000000', '2026-04-08T00:00:00.000Z', '2026-04-08T23:59:00.000Z', '2026-04-08T15:21:40.149Z'),
    ('cmnpre9ah0001kz04uxp9wyqt', '将Supabase的库迁移到东京', '', 'completed', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', NULL, 0, 0, '2026-04-08T08:01:12.896Z', '2026-04-09T02:26:51.990Z', 'cllegacyuser000000000000', '2026-04-08T00:00:00.000Z', '2026-04-08T23:59:00.000Z', '2026-04-09T10:26:51.989Z'),
    ('cmnpttb680001l7049dk4qeiv', '财务场景的文档完成', '', 'pending', '[{"id":"c9cbb22b-dca1-4d08-b787-0d08dd7250b0","text":"文档思路构建","isDone":false}]', 0, NULL, NULL, 'cmmbuvbpl0000l204sqqyzu0c', 'cmmbuvfki0005l204xv0lsc5o', 0, 0, '2026-04-08T09:08:53.377Z', '2026-04-08T09:08:53.377Z', 'cllegacyuser000000000000', '2026-04-08T00:00:00.000Z', '2026-04-13T23:59:00.000Z', NULL),
    ('cmnq6rj5h0001js04kohropih', '研究一下Gemini的API启用机制', '', 'pending', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', 'cmmbuvgca0006l2046c1nv9r6', 0, 0, '2026-04-08T15:11:26.447Z', '2026-04-08T15:11:26.447Z', 'cllegacyuser000000000000', '2026-04-08T20:00:00.000Z', '2026-04-10T23:59:00.000Z', NULL),
    ('cmnro9plh0001l804tg83bawa', '完成在cloudflare上的部署（确认是否一定要用D1）', '', 'pending', NULL, 0, NULL, NULL, 'cmmc3ghvl0002k004x3n1bblz', 'cmmbuvgca0006l2046c1nv9r6', 0, 0, '2026-04-09T16:09:14.307Z', '2026-04-09T16:09:14.307Z', 'cllegacyuser000000000000', '2026-04-09T00:00:00.000Z', '2026-04-09T23:59:00.000Z', NULL);
