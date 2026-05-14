// PiP 窗口生命周期管理器
// 管理 Document Picture-in-Picture 窗口的打开、关闭、数据同步

import { PipTaskItem } from './pip-types';
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
  private queryClient: any = null; // QueryClient reference
  private onPipClosed: (() => void) | null = null;

  // 检查浏览器是否支持 Document PiP API
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  }

  // 打开 PiP 窗口
  async openPipWindow(
    queryClient: any,
    initialTasks: PipTaskItem[],
    date: string,
    onClosed?: () => void
  ): Promise<boolean> {
    if (!PiPManager.isSupported()) return false;
    if (this.pipWindow) {
      // 已有窗口，聚焦并刷新数据
      this.pipWindow.focus();
      this.syncChannel?.sendToPip({ type: 'DATA_REFRESH', tasks: initialTasks });
      return true;
    }

    this.queryClient = queryClient;
    this.onPipClosed = onClosed ?? null;

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
      this.miniApp.init();

      // 监听 PiP 窗口关闭事件
      this.pipWindow.addEventListener('pagehide', () => {
        this.handlePipClosed();
      });

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
  sendDataRefresh(tasks: PipTaskItem[]) {
    if (this.syncChannel && this.isOpen()) {
      this.syncChannel.sendToPip({ type: 'DATA_REFRESH', tasks });
    }
  }

  // 设置主窗口侧的 broadcast 消息处理
  private setupMainWindowSync() {
    if (!this.syncChannel) return;

    this.syncChannel.onMessage((message) => {
      switch (message.type) {
        case 'PIP_READY':
          // PiP 窗口准备好，发送初始数据
          // 注意：INIT 数据已在 openPipWindow 时通过 miniApp.init() 内的 broadcast 发送
          // 这里可以发送额外的确认信息
          break;
        case 'TASK_TOGGLE':
          // PiP 窗口切换了任务，刷新主窗口的查询缓存
          if (this.queryClient) {
            this.queryClient.invalidateQueries({ queryKey: ['todos'] });
          }
          break;
        case 'TASK_CREATED':
          // PiP 窗口创建了新任务，刷新主窗口的查询缓存
          if (this.queryClient) {
            this.queryClient.invalidateQueries({ queryKey: ['todos'] });
          }
          break;
        case 'PIP_CLOSED':
          this.handlePipClosed();
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