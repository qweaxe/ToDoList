# API 接口文档

本文档描述了 ToDo List 应用的外部 API 接口，供第三方程序（如 Obsidian 插件、脚本工具等）调用。

---

## 目录

1. [认证方式](#认证方式)
2. [API Token 管理](#api-token-管理)
3. [数据导出接口](#数据导出接口)
4. [现有数据接口](#现有数据接口)
5. [错误处理](#错误处理)
6. [调用示例](#调用示例)

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

  async getTodos(): Promise<TodoItem[]> {
    const response = await requestUrl({
      url: `${this.baseUrl}/api/export/todos`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    const data = response.json;
    if (!data.success) {
      throw new Error(data.error);
    }

    return data.data.todos;
  }

  async getDailyTasks(date: string): Promise<any> {
    const response = await requestUrl({
      url: `${this.baseUrl}/api/todos/daily?date=${date}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    return response.json;
  }
}

// 使用
const api = new TodoListAPI('tdl_xxx...', 'https://your-domain.com');
const todos = await api.getTodos();
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
| 1.0 | 2026-04-02 | 初始版本，支持 API Token 认证和数据导出 |
