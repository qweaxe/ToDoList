'use client';

/**
 * Mutation 管理器
 * 用于管理乐观更新的请求取消，解决竞态条件问题
 */

/**
 * MutationManager 类
 * 管理每个资源 ID 对应的 AbortController
 * 当同一资源有新的 mutation 时，自动取消之前未完成的请求
 */
class MutationManager {
  private controllers = new Map<string, AbortController>();

  /**
   * 取消指定 ID 的进行中请求
   */
  abort(id: string) {
    const controller = this.controllers.get(id);
    if (controller) {
      controller.abort();
      this.controllers.delete(id);
    }
  }

  /**
   * 为指定 ID 创建新的 AbortController
   * 自动取消之前的请求
   */
  createController(id: string): AbortController {
    // 先取消之前的请求
    this.abort(id);
    // 创建新的 controller
    const controller = new AbortController();
    this.controllers.set(id, controller);
    return controller;
  }

  /**
   * 清理指定 ID 的 controller（请求完成后调用）
   */
  clear(id: string) {
    this.controllers.delete(id);
  }

  /**
   * 检查指定 ID 是否有进行中的请求
   */
  hasPending(id: string): boolean {
    const controller = this.controllers.get(id);
    return !!controller && !controller.signal.aborted;
  }
}

// 全局单例
export const mutationManager = new MutationManager();

/**
 * 检查错误是否为取消错误
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
