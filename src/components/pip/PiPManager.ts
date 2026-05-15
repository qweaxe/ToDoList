// PiP 窗口生命周期管理器
// 管理 Document Picture-in-Picture 窗口的打开、关闭、数据同步、心跳检测

import { PipTaskItem, PipCategory, PipLevel } from './pip-types';
import { PipSyncChannel, todoToPipTask } from './broadcast-sync';
import { PiPMiniApp } from './PiPMiniApp';

// Document Picture-in-Picture API 类型声明（Chrome 116+）
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
      window?: Window;
    };
  }
}

export class PiPManager {
  private pipWindow: Window | null = null;
  private syncChannel: PipSyncChannel | null = null;
  private miniApp: PiPMiniApp | null = null;
  private queryClient: any = null;
  private onPipClosed: (() => void) | null = null;

  // 心跳相关
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private missedPongs: number = 0;
  private readonly MAX_MISSED_PONGS = 3;
  private readonly HEARTBEAT_INTERVAL = 5000; // 5s

  // 主题监听
  private themeObserver: MutationObserver | null = null;

  // 检查浏览器是否支持 Document PiP API
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  }

  // 打开 PiP 窗口
  async openPipWindow(
    queryClient: any,
    initialTasks: PipTaskItem[],
    initialCategories: PipCategory[],
    initialLevels: PipLevel[],
    date: string,
    onClosed?: () => void
  ): Promise<boolean> {
    if (!PiPManager.isSupported()) return false;
    if (this.pipWindow) {
      // 已有窗口，聚焦并刷新数据
      this.pipWindow.focus();
      this.syncChannel?.sendToPip({
        type: 'DATA_REFRESH',
        tasks: initialTasks,
        categories: initialCategories,
        levels: initialLevels,
      });
      return true;
    }

    this.queryClient = queryClient;
    this.onPipClosed = onClosed ?? null;

    // 读取当前主题
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    try {
      // 创建 PiP 窗口
      this.pipWindow = await window.documentPictureInPicture!.requestWindow({
        width: 320,
        height: 500,
      });

      // 创建 BroadcastChannel
      this.syncChannel = new PipSyncChannel();

      // 设置主窗口侧的消息处理器
      this.setupMainWindowSync();

      // 创建并初始化迷你应用
      this.miniApp = new PiPMiniApp(this.pipWindow, this.syncChannel);
      this.miniApp.setDate(date);
      this.miniApp.init(isDark);

      // 启动心跳检测
      this.startHeartbeat();

      // 启动主题监听
      this.startThemeObserver();

      return true;
    } catch (error) {
      console.error('Failed to open PiP window:', error);
      this.cleanup();
      return false;
    }
  }

  // 关闭 PiP 窗口
  closePipWindow() {
    if (this.pipWindow) {
      this.pipWindow.close();
    }
    this.handlePipClosed();
  }

  // 检查 PiP 窗口是否打开
  isOpen(): boolean {
    return this.pipWindow !== null && !this.pipWindow.closed;
  }

  // 从主窗口向 PiP 发送数据刷新
  sendDataRefresh(tasks: PipTaskItem[], categories: PipCategory[], levels: PipLevel[]) {
    if (this.syncChannel && this.isOpen()) {
      this.syncChannel.sendToPip({ type: 'DATA_REFRESH', tasks, categories, levels });
    }
  }

  // 发送 TASK_TOGGLE 消息到 PiP
  sendTaskToggle(taskId: string, newStatus: string) {
    if (this.syncChannel && this.isOpen()) {
      this.syncChannel.sendToPip({ type: 'TASK_TOGGLE', taskId, newStatus });
    }
  }

  // 聚焦 PiP 窗口（供置顶按钮调用）
  focusPipWindow() {
    if (this.pipWindow && !this.pipWindow.closed) {
      this.pipWindow.focus();
    }
  }

  // 启动心跳检测
  private startHeartbeat() {
    this.stopHeartbeat();
    this.missedPongs = 0;

    this.heartbeatTimer = setInterval(() => {
      // 先检查 pipWindow.closed
      if (this.pipWindow && this.pipWindow.closed) {
        this.handlePipClosed();
        return;
      }

      if (!this.syncChannel || !this.isOpen()) return;

      this.missedPongs++;
      if (this.missedPongs >= this.MAX_MISSED_PONGS) {
        // 连续 3 次 PING 无响应，判定窗口已死
        this.handlePipClosed();
        return;
      }

      this.syncChannel.sendToPip({ type: 'PING' });
    }, this.HEARTBEAT_INTERVAL);
  }

  // 停止心跳检测
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 启动主题监听（监听主窗口 document.documentElement class 变化）
  private startThemeObserver() {
    this.stopThemeObserver();

    if (typeof document === 'undefined') return;

    this.themeObserver = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      if (this.syncChannel && this.isOpen()) {
        this.syncChannel.sendToPip({ type: 'THEME_CHANGE', isDark });
      }
    });

    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  // 停止主题监听
  private stopThemeObserver() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
  }

  // 设置主窗口侧的 broadcast 消息处理
  private setupMainWindowSync() {
    if (!this.syncChannel) return;

    this.syncChannel.onMessage((message) => {
      switch (message.type) {
        case 'PIP_READY':
          // PiP 窗口准备好，发送初始数据
          break;
        case 'TASK_TOGGLE':
          // PiP 窗口切换了任务，刷新主窗口的查询缓存
          if (this.queryClient) {
            this.queryClient.invalidateQueries({ queryKey: ['todos'] });
          }
          break;
        case 'TASK_CREATED':
          // PiP 窗口创建了新任务，做乐观插入 + invalidate
          if (this.queryClient && message.task) {
            this.queryClient.invalidateQueries({ queryKey: ['todos'] });
          }
          break;
        case 'PONG':
          // 心跳回复，重置 missed 计数
          this.missedPongs = 0;
          break;
        case 'PIP_CLOSED':
          this.handlePipClosed();
          break;
        case 'PIN_TOGGLE':
          // 置顶按钮切换
          if (message.isPinned) {
            this.focusPipWindow();
          }
          break;
      }
    });
  }

  // 处理 PiP 窗口关闭
  private handlePipClosed() {
    this.cleanup();
    if (this.onPipClosed) {
      this.onPipClosed();
      this.onPipClosed = null;
    }
  }

  // 清理资源
  private cleanup() {
    this.stopHeartbeat();
    this.stopThemeObserver();

    if (this.miniApp) {
      this.miniApp.destroy();
      this.miniApp = null;
    }
    if (this.syncChannel) {
      this.syncChannel.close();
      this.syncChannel = null;
    }
    this.pipWindow = null;
    this.queryClient = null;
  }
}

// 单例实例
let pipManagerInstance: PiPManager | null = null;

export function getPipManager(): PiPManager {
  if (!pipManagerInstance) {
    pipManagerInstance = new PiPManager();
  }
  return pipManagerInstance;
}