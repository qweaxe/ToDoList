// PiP 悬浮窗数据类型定义

// 精简任务结构 - 只传输必要字段，减少跨窗口数据量
export interface PipTaskItem {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  categoryEmoji: string | null;
  levelValue: number | null; // 3=高, 2=中, 1=低
}

// 精简分类结构
export interface PipCategory {
  id: string;
  name: string;
  emoji: string | null;
}

// 精简等级结构
export interface PipLevel {
  id: string;
  name: string;
  value: number; // 3=高, 2=中, 1=低
}

// 主窗口 → PiP 窗口的消息
export type MainToPipMessage =
  | { type: 'INIT'; tasks: PipTaskItem[]; date: string; categories: PipCategory[]; levels: PipLevel[]; isDark: boolean }
  | { type: 'TASK_TOGGLE'; taskId: string; newStatus: string }
  | { type: 'DATA_REFRESH'; tasks: PipTaskItem[]; categories: PipCategory[]; levels: PipLevel[] }
  | { type: 'THEME_CHANGE'; isDark: boolean }
  | { type: 'PING' };

// PiP 窗口 → 主窗口的消息
export type PipToMainMessage =
  | { type: 'PIP_READY' }
  | { type: 'TASK_TOGGLE'; taskId: string; newStatus: string }
  | { type: 'TASK_CREATED'; task: PipTaskItem }
  | { type: 'PIP_CLOSED' }
  | { type: 'PONG' }
  | { type: 'PIN_TOGGLE'; isPinned: boolean };

// 所有消息类型
export type SyncMessage = MainToPipMessage | PipToMainMessage;

// BroadcastChannel 名称
export const SYNC_CHANNEL_NAME = 'todo-pip-sync';