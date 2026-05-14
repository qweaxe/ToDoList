// PiP 悬浮窗数据类型定义

// 精简任务结构 - 只传输必要字段，减少跨窗口数据量
export interface PipTaskItem {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  categoryEmoji: string | null;
  levelValue: number | null; // 3=高, 2=中, 1=低
}

// 主窗口 → PiP 窗口的消息
export type MainToPipMessage =
  | { type: 'INIT'; tasks: PipTaskItem[]; date: string }
  | { type: 'TASK_TOGGLE'; taskId: string; newStatus: string }
  | { type: 'TASK_CREATED'; task: PipTaskItem }
  | { type: 'DATA_REFRESH'; tasks: PipTaskItem[] };

// PiP 窗口 → 主窗口的消息
export type PipToMainMessage =
  | { type: 'PIP_READY' }
  | { type: 'TASK_TOGGLE'; taskId: string }
  | { type: 'TASK_CREATED'; title: string }
  | { type: 'PIP_CLOSED' };

// 所有消息类型
export type SyncMessage = MainToPipMessage | PipToMainMessage;

// BroadcastChannel 名称
export const SYNC_CHANNEL_NAME = 'todo-pip-sync';