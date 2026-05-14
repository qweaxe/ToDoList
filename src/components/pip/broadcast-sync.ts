import { SYNC_CHANNEL_NAME, PipTaskItem, MainToPipMessage, PipToMainMessage } from './pip-types';

// 跨窗口数据同步模块
// 使用 BroadcastChannel API 在主窗口和 PiP 窗口之间通信

type MessageHandler = (message: MainToPipMessage | PipToMainMessage) => void;

export class PipSyncChannel {
  private channel: BroadcastChannel;
  private handlers: Set<MessageHandler> = new Set();

  constructor() {
    this.channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    this.channel.onmessage = (event: MessageEvent) => {
      const data = event.data as MainToPipMessage | PipToMainMessage;
      this.handlers.forEach(handler => handler(data));
    };
  }

  // 主窗口发送消息到 PiP 窗口
  sendToPip(message: MainToPipMessage) {
    this.channel.postMessage(message);
  }

  // PiP 窗口发送消息到主窗口
  sendToMain(message: PipToMainMessage) {
    this.channel.postMessage(message);
  }

  // 注册消息处理器
  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  // 关闭通道
  close() {
    this.handlers.clear();
    this.channel.close();
  }
}

// 将完整 Todo 对象转换为精简的 PipTaskItem
export function todoToPipTask(todo: {
  id: string;
  title: string;
  status: string;
  category: { emoji: string | null } | null;
  level: { value: number } | null;
}): PipTaskItem {
  return {
    id: todo.id,
    title: todo.title,
    status: todo.status === 'completed' ? 'completed' : 'pending',
    categoryEmoji: todo.category?.emoji ?? null,
    levelValue: todo.level?.value ?? null,
  };
}