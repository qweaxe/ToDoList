# API 接口文档

本文档描述了 ToDo List 应用的外部 API 接口，供第三方程序（如 Obsidian 插件、脚本工具等）调用。

---

## 目录

1. [认证方式](#认证方式)
2. [API Token 管理](#api-token-管理)
3. [数据导出接口](#数据导出接口)
4. [任务写入接口](#任务写入接口)
5. [增量同步接口](#增量同步接口)
6. [现有数据接口](#现有数据接口)
7. [错误处理](#错误处理)
8. [调用示例](#调用示例)

---

## 认证方式

### Bearer Token 认证

所有 API 请求需要在请求头中携带 API Token：

```
Authorization: Bearer <your_api_token>
```

### 获取 API Token

1. 登录 ToDo List 应用
2. 进入 **设置** → **API 密钥**
3. 点击 **创建新密钥**
4. 输入密钥名称（如 "Obsidian Plugin"）
5. 可选：设置过期天数
6. 点击创建后，**立即复制并保存 Token**（仅显示一次）

### Token 格式

```
tdl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- 前缀：`tdl_`
- 总长度：约 40 个字符

---

## API Token 管理

### 创建 API Token

**请求**
```
POST /api/api-keys
Content-Type: application/json
```

**请求体**
```json
{
  "name": "My Plugin",
  "expiresInDays": 30  // 可选，不设置则永不过期
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "name": "My Plugin",
    "createdAt": "2026-04-02T10:00:00.000Z",
    "expiresAt": "2026-05-02T10:00:00.000Z",
    "token": "tdl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "warning": "请保存此 Token，关闭后将无法再次查看"
  }
}
```

### 查看所有 Token

**请求**
```
GET /api/api-keys
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "name": "Obsidian Plugin",
      "createdAt": "2026-04-02T10:00:00.000Z",
      "lastUsedAt": "2026-04-02T12:00:00.000Z",
      "expiresAt": null,
      "isExpired": false
    }
  ]
}
```

### 撤销 Token

**请求**
```
DELETE /api/api-keys/{id}
```

**响应**
```json
{
  "success": true,
  "message": "API Key 已撤销"
}
```

---

## 数据导出接口

### 导出所有任务

**请求**
```
GET /api/export/todos
Authorization: Bearer <your_token>
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期筛选 (YYYY-MM-DD) |
| endDate | string | 否 | 截止日期筛选 (YYYY-MM-DD) |
| status | string | 否 | 状态筛选 (pending/in_progress/completed) |
| categoryId | string | 否 | 分类 ID 筛选 |
| levelId | string | 否 | 等级 ID 筛选 |
| format | string | 否 | 输出格式 (json/csv)，默认 json |

**响应 (JSON)**
```json
{
  "success": true,
  "data": {
    "exportedAt": "2026-04-02T10:00:00.000Z",
    "total": 50,
    "todos": [
      {
        "id": "clxxx...",
        "title": "完成项目报告",
        "description": "Q1 季度报告",
        "status": "completed",
        "startDate": "2026-03-01",
        "dueDate": "2026-03-15",
        "completedAt": "2026-03-14",
        "isMilestone": false,
        "isCycleTask": false,
        "subTasks": [
          { "id": "st1", "text": "收集数据", "isDone": true },
          { "id": "st2", "text": "撰写报告", "isDone": true }
        ],
        "category": {
          "id": "clxxx...",
          "name": "工作",
          "emoji": "💼",
          "color": "blue"
        },
        "level": {
          "id": "clxxx...",
          "name": "高",
          "value": 3
        },
        "createdAt": "2026-03-01T08:00:00.000Z",
        "updatedAt": "2026-03-14T16:00:00.000Z"
      }
    ]
  }
}
```

**响应 (CSV)**

请求添加 `?format=csv` 会返回 CSV 文件下载：

```
ID,标题,描述,状态,开始日期,截止日期,完成日期,里程碑,周期任务,分类,等级,创建时间
clxxx...,"完成项目报告","Q1 季度报告",completed,2026-03-01,2026-03-15,2026-03-14,否,否,工作,高,2026-03-01T08:00:00.000Z
```

### 完整数据备份

**请求**
```
GET /api/export/backup
Authorization: Bearer <your_token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "exportedAt": "2026-04-02T10:00:00.000Z",
    "version": "1.0",
    "stats": {
      "totalTodos": 150,
      "completedTodos": 100,
      "pendingTodos": 40,
      "inProgressTodos": 10,
      "totalCategories": 5,
      "totalRecurrenceRules": 3
    },
    "todos": [...],
    "categories": [
      {
        "id": "clxxx...",
        "name": "工作",
        "description": "工作相关任务",
        "emoji": "💼",
        "color": "blue",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "recurrenceRules": [
      {
        "id": "clxxx...",
        "frequency": "WEEKLY",
        "interval": 1,
        "byDay": [1, 2, 3, 4, 5],
        "cronExpr": null,
        "startDate": "2026-01-01",
        "endDate": null,
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 任务写入接口

以下接口支持通过 API Token 进行写入操作。

### 创建任务

**请求**
```
POST /api/todos
Authorization: Bearer <your_token>
Content-Type: application/json
```

**请求体**
```json
{
  "title": "完成项目报告",
  "description": "Q1 季度报告",
  "startDate": "2026-04-02",
  "dueDate": "2026-04-15",
  "categoryId": "clxxx...",
  "levelId": "clxxx...",
  "isMilestone": false,
  "isCycleTask": false,
  "priority": 0,
  "subTasks": [
    { "id": "st1", "text": "收集数据", "isDone": false },
    { "id": "st2", "text": "撰写报告", "isDone": false }
  ]
}
```

**请求字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 任务标题（1-100字符） |
| description | string | 否 | 任务描述（最多1000字符） |
| startDate | string | 是 | 开始日期 (YYYY-MM-DD) |
| dueDate | string | 是 | 截止日期 (YYYY-MM-DD) |
| categoryId | string | 否 | 分类 ID |
| levelId | string | 否 | 等级 ID |
| isMilestone | boolean | 否 | 是否为里程碑 |
| isCycleTask | boolean | 否 | 是否为周期任务 |
| priority | number | 否 | 优先级（默认 0） |
| subTasks | array | 否 | 子任务列表 |
| recurrenceRule | object | 否 | 周期规则（仅当 isCycleTask=true 时有效） |

**recurrenceRule 字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| frequency | string | 是 | 频率：DAILY/WEEKLY/MONTHLY/YEARLY/CUSTOM |
| interval | number | 否 | 间隔（默认 1） |
| byDay | array | 否 | 星期几（0-6，0为周日），用于 WEEKLY |
| cronExpr | string | 否 | Cron 表达式，用于 CUSTOM |
| startDate | string | 是 | 规则开始日期 |
| endDate | string | 否 | 规则结束日期 |

**响应**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "title": "完成项目报告",
    "description": "Q1 季度报告",
    "status": "pending",
    "startDate": "2026-04-02",
    "dueDate": "2026-04-15",
    "completedAt": null,
    "isMilestone": false,
    "isCycleTask": false,
    "priority": 0,
    "subTasks": [
      { "id": "st1", "text": "收集数据", "isDone": false },
      { "id": "st2", "text": "撰写报告", "isDone": false }
    ],
    "category": { "id": "clxxx...", "name": "工作", "emoji": "💼", "color": "blue" },
    "level": { "id": "clxxx...", "name": "高", "value": 3 },
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z"
  }
}
```

### 更新任务

**请求**
```
PUT /api/todos/{id}
Authorization: Bearer <your_token>
Content-Type: application/json
```

**请求体**
```json
{
  "title": "更新后的标题",
  "status": "in_progress",
  "dueDate": "2026-04-20"
}
```

> 所有字段均为可选，只传需要更新的字段

**响应**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "title": "更新后的标题",
    "status": "in_progress",
    "dueDate": "2026-04-20",
    ...
  }
}
```

### 删除任务

**请求**
```
DELETE /api/todos/{id}
Authorization: Bearer <your_token>
```

**响应**
```json
{
  "success": true,
  "message": "任务已删除"
}
```

### 切换任务状态

在 `pending` 和 `completed` 之间切换任务状态。

**请求**
```
POST /api/todos/toggle
Authorization: Bearer <your_token>
Content-Type: application/json
```

**请求体**
```json
{
  "id": "clxxx..."
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "status": "completed",
    "completedAt": "2026-04-02",
    ...
  }
}
```

### 批量操作

**请求**
```
POST /api/todos/batch
Authorization: Bearer <your_token>
Content-Type: application/json
```

#### 批量删除

**请求体**
```json
{
  "action": "delete",
  "ids": ["clxxx...", "clyyy...", "clzzz..."]
}
```

**响应**
```json
{
  "success": true,
  "message": "已删除 3 个任务"
}
```

#### 批量更新状态

**请求体**
```json
{
  "action": "update",
  "ids": ["clxxx...", "clyyy..."],
  "data": {
    "status": "completed",
    "categoryId": "clnew..."
  }
}
```

**data 字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 状态：pending/in_progress/completed |
| categoryId | string | 分类 ID（null 表示移除分类） |
| levelId | string | 等级 ID（null 表示移除等级） |

**响应**
```json
{
  "success": true,
  "message": "已更新 2 个任务"
}
```

### 获取单个任务详情

**请求**
```
GET /api/todos/{id}
Authorization: Bearer <your_token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "title": "完成项目报告",
    "description": "Q1 季度报告",
    "status": "pending",
    "startDate": "2026-04-02",
    "dueDate": "2026-04-15",
    "completedAt": null,
    "isMilestone": false,
    "isCycleTask": false,
    "priority": 0,
    "subTasks": [...],
    "category": {...},
    "level": {...},
    "recurrenceRule": {...},
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z"
  }
}
```

---

## 增量同步接口

### 增量同步数据

获取指定时间后的数据变更，用于客户端数据同步。

**请求**
```
GET /api/sync?since=2026-04-01T00:00:00Z
Authorization: Bearer <your_token>
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| since | string | 否 | ISO 8601 时间戳，不传则默认同步最近 7 天 |

**响应**
```json
{
  "success": true,
  "data": {
    "syncTime": "2026-04-02T15:30:00.000Z",
    "since": "2026-04-01T00:00:00.000Z",
    "todos": {
      "new": [
        {
          "id": "clxxx...",
          "title": "新创建的任务",
          "status": "pending",
          "startDate": "2026-04-02",
          "dueDate": "2026-04-05",
          "category": {...},
          "level": {...},
          "createdAt": "2026-04-02T10:00:00.000Z",
          "updatedAt": "2026-04-02T10:00:00.000Z"
        }
      ],
      "updated": [
        {
          "id": "clyyy...",
          "title": "已更新的任务",
          "status": "completed",
          "completedAt": "2026-04-02",
          ...
        }
      ],
      "total": 5
    },
    "categories": {
      "new": [...],
      "updated": [...],
      "total": 2
    },
    "deleted": {
      "todos": [],
      "categories": [],
      "note": "时间戳方案无法获取已删除记录，如需完整同步请使用 SyncLog 方案"
    }
  }
}
```

**响应字段说明**

| 字段 | 说明 |
|------|------|
| syncTime | 本次同步时间，可作为下次同步的 since 参数 |
| since | 本次同步的起始时间 |
| todos.new | 新创建的任务（createdAt >= since） |
| todos.updated | 更新的任务（createdAt < since && updatedAt >= since） |
| categories.new | 新创建的分类 |
| categories.updated | 更新的分类 |
| deleted | 已删除记录（当前方案暂不支持） |

**同步策略建议**

1. 首次同步：不传 since 参数，获取最近 7 天数据
2. 增量同步：使用上次的 syncTime 作为 since 参数
3. 合并数据：
   - 将 `new` 数组合并到本地数据
   - 使用 `updated` 数组覆盖本地对应记录
   - 注意：当前方案无法检测删除操作

---

## 现有数据接口

以下接口同样支持 Bearer Token 认证：

### 获取任务列表

```
GET /api/todos
Authorization: Bearer <your_token>
```

### 获取日视图数据

```
GET /api/todos/daily?date=2026-04-02
Authorization: Bearer <your_token>
```

### 获取周视图数据

```
GET /api/todos/weekly?startDate=2026-03-30
Authorization: Bearer <your_token>
```

### 获取月视图数据

```
GET /api/todos/monthly?year=2026&month=4
Authorization: Bearer <your_token>
```

### 获取年度统计

```
GET /api/todos/yearly?year=2026
Authorization: Bearer <your_token>
```

### 获取分类列表

```
GET /api/categories
Authorization: Bearer <your_token>
```

### 获取等级列表

```
GET /api/levels
```
> 此接口无需认证

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

### 常见错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 请求参数错误 |
| 401 | 未授权（Token 无效或已过期） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 常见错误信息

| 错误信息 | 说明 |
|---------|------|
| 缺少 Authorization 头 | 请求未携带 Token |
| 无效的 Token 格式 | Token 格式不正确 |
| Token 不存在或已撤销 | Token 已被删除 |
| Token 已过期 | Token 超过有效期 |
| 未授权访问 | Token 验证失败 |

---

## 调用示例

### cURL

```bash
# 导出所有任务
curl -H "Authorization: Bearer tdl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
     https://your-domain.com/api/export/todos

# 导出 CSV 格式
curl -H "Authorization: Bearer tdl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
     -o todos.csv \
     https://your-domain.com/api/export/todos?format=csv

# 完整备份
curl -H "Authorization: Bearer tdl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
     https://your-domain.com/api/export/backup
```

### JavaScript / TypeScript

```javascript
const API_TOKEN = 'tdl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const BASE_URL = 'https://your-domain.com';

async function fetchTodos() {
  const response = await fetch(`${BASE_URL}/api/export/todos`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// 使用示例
fetchTodos().then(data => {
  console.log(`导出了 ${data.data.total} 条任务`);
  data.data.todos.forEach(todo => {
    console.log(`- ${todo.title} [${todo.status}]`);
  });
});
```

### Python

```python
import requests

API_TOKEN = 'tdl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
BASE_URL = 'https://your-domain.com'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

# 导出任务
response = requests.get(f'{BASE_URL}/api/export/todos', headers=headers)
data = response.json()

if data['success']:
    print(f"导出了 {data['data']['total']} 条任务")
    for todo in data['data']['todos']:
        print(f"- {todo['title']} [{todo['status']}]")

# 下载 CSV
response = requests.get(f'{BASE_URL}/api/export/todos?format=csv', headers=headers)
with open('todos.csv', 'w', encoding='utf-8') as f:
    f.write(response.text)
```

### Obsidian 插件示例

```typescript
// 在 Obsidian 插件中使用
import { requestUrl } from 'obsidian';

interface TodoItem {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  // ... 其他字段
}

export class TodoListAPI {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  private async request(path: string, method: string, body?: any): Promise<any> {
    const response = await requestUrl({
      url: `${this.baseUrl}${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = response.json;
    if (!data.success) {
      throw new Error(data.error);
    }
    return data;
  }

  // 获取任务列表
  async getTodos(): Promise<TodoItem[]> {
    const data = await this.request('/api/export/todos', 'GET');
    return data.data.todos;
  }

  // 获取日视图数据
  async getDailyTasks(date: string): Promise<any> {
    return this.request(`/api/todos/daily?date=${date}`, 'GET');
  }

  // 创建任务
  async createTodo(todo: {
    title: string;
    startDate: string;
    dueDate: string;
    description?: string;
    categoryId?: string;
    levelId?: string;
  }): Promise<any> {
    return this.request('/api/todos', 'POST', todo);
  }

  // 更新任务
  async updateTodo(id: string, data: Partial<TodoItem>): Promise<any> {
    return this.request(`/api/todos/${id}`, 'PUT', data);
  }

  // 删除任务
  async deleteTodo(id: string): Promise<void> {
    await this.request(`/api/todos/${id}`, 'DELETE');
  }

  // 切换任务状态
  async toggleTodo(id: string): Promise<any> {
    return this.request('/api/todos/toggle', 'POST', { id });
  }

  // 增量同步
  async sync(since?: string): Promise<any> {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return this.request(`/api/sync${query}`, 'GET');
  }
}

// 使用示例
const api = new TodoListAPI('tdl_xxx...', 'https://your-domain.com');

// 创建新任务
const newTodo = await api.createTodo({
  title: '从 Obsidian 创建的任务',
  startDate: '2026-04-02',
  dueDate: '2026-04-05',
  categoryId: 'clxxx...',
});

// 增量同步
const syncResult = await api.sync('2026-04-01T00:00:00Z');
console.log(`新增 ${syncResult.data.todos.new.length} 个任务`);
console.log(`更新 ${syncResult.data.todos.updated.length} 个任务`);
```

---

## 安全建议

1. **妥善保管 Token**：Token 相当于密码，不要分享给他人
2. **设置过期时间**：为临时使用的 Token 设置较短的有效期
3. **及时撤销**：不再使用的 Token 应立即撤销
4. **使用 HTTPS**：确保 API 请求通过加密连接发送
5. **定期轮换**：建议定期更换 API Token

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.2 | 2026-04-30 | 新增时间追踪 API、任务预计耗时字段 |
| 1.1 | 2026-04-02 | 新增任务写入接口、增量同步接口 |
| 1.0 | 2026-04-02 | 初始版本，支持 API Token 认证和数据导出 |

---

## 时间追踪 API

### 创建时间记录

**请求**
```
POST /api/time-entries
Authorization: Bearer <your_token>
Content-Type: application/json
```

**请求体**
```json
{
  "title": "完成项目报告",
  "description": "Q1 季度报告撰写",
  "date": "2026-04-30",
  "startTime": "2026-04-30T09:00:00",
  "endTime": "2026-04-30T10:30:00",
  "categoryId": "clxxx...",
  "todoId": "clxxx..."  // 可选，关联任务
}
```

**请求字段说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 活动名称（1-100字符） |
| description | string | 否 | 详细描述 |
| date | string | 是 | 记录日期 (YYYY-MM-DD) |
| startTime | string | 是 | 开始时间 (ISO datetime) |
| endTime | string | 是 | 结束时间 (ISO datetime) |
| categoryId | string | 否 | 分类 ID |
| todoId | string | 否 | 关联的任务 ID |

**响应**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "title": "完成项目报告",
    "description": "Q1 季度报告撰写",
    "date": "2026-04-30T12:00:00.000Z",
    "startTime": "2026-04-30T01:00:00.000Z",
    "endTime": "2026-04-30T02:30:00.000Z",
    "duration": 90,
    "category": { "id": "clxxx...", "name": "工作", "emoji": "💼" },
    "todo": { "id": "clxxx...", "title": "Q1 报告" },
    "createdAt": "2026-04-30T09:00:00.000Z"
  }
}
```

### 获取时间记录列表

**请求**
```
GET /api/time-entries?date=2026-04-30
Authorization: Bearer <your_token>
```

**查询参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| date | string | 指定日期筛选 (YYYY-MM-DD) |
| startDate | string | 日期范围开始 |
| endDate | string | 日期范围结束 |
| categoryId | string | 分类筛选 |
| todoId | string | 任务筛选 |

### 获取日统计数据

**请求**
```
GET /api/time-entries/daily?date=2026-04-30
Authorization: Bearer <your_token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "date": "2026-04-30",
    "entries": [...],
    "stats": {
      "totalDuration": 480,
      "taskTime": 360,
      "otherTime": 120,
      "categoryDistribution": [
        {
          "categoryId": "clxxx...",
          "categoryName": "工作",
          "categoryEmoji": "💼",
          "duration": 300
        }
      ]
    }
  }
}
```

### 更新时间记录

**请求**
```
PUT /api/time-entries/{id}
Authorization: Bearer <your_token>
```

### 删除时间记录

**请求**
```
DELETE /api/time-entries/{id}
Authorization: Bearer <your_token>
```

---

## 任务预计耗时

任务创建/更新时可添加 `estimatedDuration` 字段：

```json
{
  "title": "大型项目",
  "startDate": "2026-04-01",
  "dueDate": "2026-04-30",
  "estimatedDuration": 2880  // 48小时 = 2天（分钟）
}
```

**预设选项对应分钟数**

| 选项 | 分钟数 |
|------|--------|
| 15分钟 | 15 |
| 1小时 | 60 |
| 2小时 | 120 |
| 4小时 | 240 |
| 8小时 | 480 |
| 2天 | 2880 |
| 1周 | 10080 |

**用途**：`estimatedDuration >= 480`（>= 8小时/1工作日）的任务在日历/周视图显示跨天横跨框。
