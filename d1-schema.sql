-- D1 (SQLite) Schema for To Do List
-- Converted from PostgreSQL schema

-- Enable foreign keys (D1 supports this)
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    securityQuestion TEXT,
    securityAnswer TEXT,
    securityAnswerAttempts INTEGER DEFAULT 0 NOT NULL,
    securityAnswerLockedAt TEXT,
    tokenVersion INTEGER DEFAULT 0 NOT NULL
);

-- 存量环境迁移（D1 控制台执行）：
-- ALTER TABLE users ADD COLUMN tokenVersion INTEGER NOT NULL DEFAULT 0;

-- Levels table (system-wide)
CREATE TABLE IF NOT EXISTS levels (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    value INTEGER UNIQUE NOT NULL,
    description TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT NOT NULL
);

-- Categories table (user-specific)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    color TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT NOT NULL,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE(userId, name)
);

-- Recurrence rules table
CREATE TABLE IF NOT EXISTS recurrence_rules (
    id TEXT PRIMARY KEY,
    frequency TEXT NOT NULL,
    interval INTEGER DEFAULT 1 NOT NULL,
    byDay TEXT,
    cronExpr TEXT,
    isActive INTEGER DEFAULT 1 NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT NOT NULL,
    userId TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    subTasks TEXT,
    isCycleTask INTEGER DEFAULT 0 NOT NULL,
    recurrenceRuleId TEXT,
    parentRuleId TEXT,
    categoryId TEXT,
    levelId TEXT,
    priority INTEGER DEFAULT 0 NOT NULL,
    isMilestone INTEGER DEFAULT 0 NOT NULL,
    estimatedDuration INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT NOT NULL,
    userId TEXT NOT NULL,
    startDate TEXT NOT NULL,
    dueDate TEXT NOT NULL,
    completedAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (levelId) REFERENCES levels(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (recurrenceRuleId) REFERENCES recurrence_rules(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    todoId TEXT NOT NULL,
    remindAt TEXT NOT NULL,
    type TEXT NOT NULL,
    offset INTEGER,
    sent INTEGER DEFAULT 0 NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (todoId) REFERENCES todos(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Holidays table (system-wide cache)
CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    isHoliday INTEGER NOT NULL,
    year INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    lastUsedAt TEXT,
    expiresAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 周期任务幂等索引：(parentRuleId, 日历日 dueDate, title) 唯一
-- parentRuleId 为 NULL（手动任务）不参与唯一约束，不受影响
-- 存量环境迁移（D1 控制台执行）：
-- 前置条件：先执行去重（scripts/dedup-recurrence-instances.ts 输出的 SQL），否则建索引失败
CREATE UNIQUE INDEX IF NOT EXISTS idx_todos_rule_date_title
    ON todos(parentRuleId, date(dueDate), title);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_userId ON todos(userId);
CREATE INDEX IF NOT EXISTS idx_todos_startDate ON todos(startDate);
CREATE INDEX IF NOT EXISTS idx_todos_dueDate ON todos(dueDate);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_categoryId ON todos(categoryId);
CREATE INDEX IF NOT EXISTS idx_todos_levelId ON todos(levelId);

CREATE INDEX IF NOT EXISTS idx_categories_userId ON categories(userId);

CREATE INDEX IF NOT EXISTS idx_recurrence_rules_userId ON recurrence_rules(userId);

CREATE INDEX IF NOT EXISTS idx_reminders_todoId ON reminders(todoId);
CREATE INDEX IF NOT EXISTS idx_reminders_remindAt_sent ON reminders(remindAt, sent);

CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year);

CREATE INDEX IF NOT EXISTS idx_api_keys_userId ON api_keys(userId);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- Inbox items table（捕获箱条目）
-- 存量环境迁移（D1 控制台执行，纯新增无回填）：
-- ALTER TABLE todos ADD COLUMN estimatedDuration INTEGER;
CREATE TABLE IF NOT EXISTS inbox_items (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    userId TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    convertedToTodoId TEXT,
    convertedAt TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_inbox_items_userId_createdAt ON inbox_items(userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_inbox_items_userId_convertedToTodoId ON inbox_items(userId, convertedToTodoId);

-- Time entries table（时间记录条目）
CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    duration INTEGER NOT NULL,
    todoId TEXT,
    userId TEXT NOT NULL,
    categoryId TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (todoId) REFERENCES todos(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_time_entries_userId ON time_entries(userId);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_categoryId ON time_entries(categoryId);
CREATE INDEX IF NOT EXISTS idx_time_entries_todoId ON time_entries(todoId);

-- Rate limits table（认证端点速率限制，固定窗口计数，秒级时间戳）
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    expiresAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expiresAt ON rate_limits(expiresAt);
