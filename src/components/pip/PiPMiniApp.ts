// PiP 窗口迷你应用 - 纯 vanilla JS，在 PiP 窗口的独立 document 中运行
// 不使用 React，因为 PiP 窗口无法进行 hydration

import { PipTaskItem, PipCategory, PipLevel } from './pip-types';
import { PipSyncChannel } from './broadcast-sync';
import { pipStyles } from './pip-styles';

export class PiPMiniApp {
  private pipWindow: Window;
  private syncChannel: PipSyncChannel;
  private tasks: PipTaskItem[] = [];
  private categories: PipCategory[] = [];
  private levels: PipLevel[] = [];
  private date: string = '';
  private isLoading: boolean = true;
  private isPinned: boolean = true;

  // DOM 元素引用
  private taskListEl: HTMLElement | null = null;
  private statsEl: HTMLElement | null = null;
  private addInputEl: HTMLInputElement | null = null;
  private addBtnEl: HTMLButtonElement | null = null;
  private categorySelectEl: HTMLSelectElement | null = null;
  private levelSelectEl: HTMLSelectElement | null = null;
  private pinBtnEl: HTMLButtonElement | null = null;

  constructor(pipWindow: Window, syncChannel: PipSyncChannel) {
    this.pipWindow = pipWindow;
    this.syncChannel = syncChannel;
  }

  // 初始化迷你应用：注入样式、构建 DOM、绑定事件
  init(initialIsDark: boolean = false) {
    const doc = this.pipWindow.document;

    // 应用初始主题
    if (initialIsDark) {
      doc.documentElement.classList.add('dark');
    }

    // 注入 CSS
    const styleEl = doc.createElement('style');
    styleEl.textContent = pipStyles;
    doc.head.appendChild(styleEl);

    // 设置标题
    doc.title = 'Todo List';

    // 构建 DOM 结构
    const body = doc.body;
    body.innerHTML = '';

    // 标题栏
    const header = doc.createElement('div');
    header.className = 'pip-header';
    header.innerHTML = `
      <div class="pip-header-title">
        <svg class="pip-header-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 11h-1.7c0 .74.16 1.43.43 2.05.22.49.57.95 1.27.95.7 0 1.05-.46 1.27-.95.27-.62.43-1.31.43-2.05H19zm-8.5 0h-1.7c0 .74.16 1.43.43 2.05.22.49.57.95 1.27.95.7 0 1.05-.46 1.27-.95.27-.62.43-1.31.43-2.05H10.5zM21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
        </svg>
        <span>Todo List</span>
        <span class="pip-header-date" id="pip-date"></span>
      </div>
      <div class="pip-header-actions">
        <button class="pip-pin-btn pinned" id="pip-pin-btn" title="Toggle pin">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" fill="currentColor"/>
          </svg>
        </button>
        <button class="pip-close-btn" id="pip-close-btn" title="Close">&#x2715;</button>
      </div>
    `;
    body.appendChild(header);

    // 统计行
    const stats = doc.createElement('div');
    stats.className = 'pip-stats';
    stats.id = 'pip-stats';
    body.appendChild(stats);
    this.statsEl = stats;

    // 任务列表容器
    const taskList = doc.createElement('div');
    taskList.className = 'pip-task-list';
    taskList.id = 'pip-task-list';
    body.appendChild(taskList);
    this.taskListEl = taskList;

    // 快速添加栏（标题 + 分类/等级）
    const addBar = doc.createElement('div');
    addBar.className = 'pip-add-bar';
    addBar.innerHTML = `
      <div class="pip-add-row">
        <input class="pip-add-input" id="pip-add-input" type="text" placeholder="Add a task..." />
        <button class="pip-add-btn" id="pip-add-btn">Add</button>
      </div>
      <div class="pip-add-row">
        <select class="pip-add-select" id="pip-category-select" title="Category">
          <option value="">-- cat --</option>
        </select>
        <select class="pip-add-select" id="pip-level-select" title="Priority">
          <option value="">-- pri --</option>
        </select>
      </div>
    `;
    body.appendChild(addBar);

    // 获取元素引用
    this.addInputEl = doc.getElementById('pip-add-input') as HTMLInputElement;
    this.addBtnEl = doc.getElementById('pip-add-btn') as HTMLButtonElement;
    this.categorySelectEl = doc.getElementById('pip-category-select') as HTMLSelectElement;
    this.levelSelectEl = doc.getElementById('pip-level-select') as HTMLSelectElement;
    this.pinBtnEl = doc.getElementById('pip-pin-btn') as HTMLButtonElement;
    const closeBtn = doc.getElementById('pip-close-btn');
    const dateEl = doc.getElementById('pip-date');

    // 绑定关闭按钮
    closeBtn?.addEventListener('click', () => {
      this.syncChannel.sendToMain({ type: 'PIP_CLOSED' });
      this.pipWindow.close();
    });

    // 绑定置顶按钮
    this.pinBtnEl?.addEventListener('click', () => this.handlePinToggle());

    // 绑定快速添加
    this.addBtnEl?.addEventListener('click', () => this.handleCreateTask());
    this.addInputEl?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleCreateTask();
      }
    });

    // 设置日期显示
    if (dateEl) {
      dateEl.textContent = this.date || this.formatDate(new Date());
    }

    // 注册 broadcast 消息处理器
    this.syncChannel.onMessage((message) => {
      switch (message.type) {
        case 'INIT':
          this.tasks = message.tasks;
          this.categories = message.categories;
          this.levels = message.levels;
          this.date = message.date;
          this.isLoading = false;
          if (message.isDark !== undefined) {
            this.applyTheme(message.isDark);
          }
          if (dateEl) dateEl.textContent = this.formatDateFromString(message.date);
          this.renderCategoryOptions();
          this.renderLevelOptions();
          this.render();
          break;
        case 'DATA_REFRESH':
          this.tasks = message.tasks;
          this.categories = message.categories;
          this.levels = message.levels;
          this.isLoading = false;
          this.renderCategoryOptions();
          this.renderLevelOptions();
          this.render();
          break;
        case 'TASK_TOGGLE':
          if ('newStatus' in message) {
            this.handleToggleFromMain(message.taskId, message.newStatus as string);
          }
          break;
        case 'TASK_CREATED':
          if ('task' in message) {
            this.tasks.push(message.task as PipTaskItem);
            this.render();
          }
          break;
        case 'THEME_CHANGE':
          this.applyTheme(message.isDark);
          break;
        case 'PING':
          this.syncChannel.sendToMain({ type: 'PONG' });
          break;
      }
    });

    // 通知主窗口 PiP 已准备好接收数据
    this.syncChannel.sendToMain({ type: 'PIP_READY' });

    // 同时直接 fetch API 获取数据（作为备份）
    this.fetchDailyTodos();

    // 显示加载状态
    this.renderLoading();
  }

  // 应用主题
  private applyTheme(isDark: boolean) {
    const html = this.pipWindow.document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  // 处理置顶按钮点击
  private handlePinToggle() {
    this.isPinned = !this.isPinned;
    if (this.pinBtnEl) {
      this.pinBtnEl.className = this.isPinned ? 'pip-pin-btn pinned' : 'pip-pin-btn unpinned';
    }
    // 通知主窗口置顶状态变化
    this.syncChannel.sendToMain({ type: 'PIN_TOGGLE', isPinned: this.isPinned });
    // 尝试 focus 窗口以恢复置顶效果
    if (this.isPinned) {
      this.pipWindow.focus();
    }
  }

  // 更新任务数据（由 PiPManager 调用）
  updateTasks(tasks: PipTaskItem[]) {
    this.tasks = tasks;
    this.isLoading = false;
    this.render();
  }

  // 设置日期
  setDate(date: string) {
    this.date = date;
    const dateEl = this.pipWindow.document.getElementById('pip-date');
    if (dateEl) dateEl.textContent = this.formatDateFromString(date);
  }

  // 更新分类下拉选项
  private renderCategoryOptions() {
    if (!this.categorySelectEl) return;
    let html = '<option value="">-- cat --</option>';
    for (const cat of this.categories) {
      html += `<option value="${cat.id}">${cat.emoji || ''} ${cat.name}</option>`;
    }
    this.categorySelectEl.innerHTML = html;
  }

  // 更新等级下拉选项
  private renderLevelOptions() {
    if (!this.levelSelectEl) return;
    let html = '<option value="">-- pri --</option>';
    for (const level of this.levels) {
      html += `<option value="${level.id}">${level.name}</option>`;
    }
    this.levelSelectEl.innerHTML = html;
  }

  // 渲染任务列表
  private render() {
    if (!this.taskListEl) return;

    const pending = this.tasks.filter(t => t.status === 'pending');
    const completed = this.tasks.filter(t => t.status === 'completed');

    // 更新统计
    this.renderStats(pending.length, completed.length);

    // 构建 HTML
    let html = '';

    // 待办任务
    if (pending.length > 0) {
      pending.forEach(task => {
        html += this.renderTaskItem(task);
      });
    }

    // 已完成任务
    if (completed.length > 0) {
      html += `<div style="height:1px;background:var(--pip-border);margin:8px 12px;"></div>`;
      completed.forEach(task => {
        html += this.renderTaskItem(task);
      });
    }

    // 无任务
    if (this.tasks.length === 0) {
      html = `<div class="pip-empty">No tasks today</div>`;
    }

    this.taskListEl.innerHTML = html;

    // 绑定 checkbox 事件
    const checkboxes = this.taskListEl.querySelectorAll<HTMLInputElement>('.pip-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const taskId = cb.dataset.id!;
        this.handleToggleTask(taskId);
      });
    });
  }

  // 渲染单个任务项
  private renderTaskItem(task: PipTaskItem): string {
    const isCompleted = task.status === 'completed';
    const emoji = task.categoryEmoji || '';
    const levelLabel = task.levelValue === 3 ? 'high' : task.levelValue === 2 ? 'medium' : task.levelValue === 1 ? 'low' : '';
    const levelTag = levelLabel ? `<span class="pip-task-level ${levelLabel}">${task.levelValue === 3 ? 'H' : task.levelValue === 2 ? 'M' : 'L'}</span>` : '';

    return `
      <div class="pip-task-item ${isCompleted ? 'completed' : ''}">
        <input type="checkbox" class="pip-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''} />
        <span class="pip-task-emoji">${emoji}</span>
        <span class="pip-task-title">${this.escapeHtml(task.title)}</span>
        ${levelTag}
      </div>
    `;
  }

  // 渲染统计信息
  private renderStats(pending: number, completed: number) {
    if (!this.statsEl) return;
    this.statsEl.innerHTML = `
      <span>${pending} pending</span>
      <span>${completed} done</span>
    `;
  }

  // 渲染加载状态
  private renderLoading() {
    if (!this.taskListEl) return;
    this.taskListEl.innerHTML = `
      <div class="pip-loading">
        <div class="pip-loading-spinner"></div>
      </div>
    `;
  }

  // 处理 checkbox 切换
  private async handleToggleTask(taskId: string) {
    // 乐观更新：立即在本地切换状态
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    task.status = newStatus;
    this.render();

    // 调用 API
    try {
      const res = await fetch('/api/todos/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      });
      if (!res.ok) {
        // 回滚
        task.status = newStatus === 'completed' ? 'pending' : 'completed';
        this.render();
        return;
      }
      // 通知主窗口
      this.syncChannel.sendToMain({ type: 'TASK_TOGGLE', taskId });
    } catch {
      // 回滚
      task.status = newStatus === 'completed' ? 'pending' : 'completed';
      this.render();
    }
  }

  // 处理主窗口的 toggle 通知
  private handleToggleFromMain(taskId: string, newStatus: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = newStatus as 'pending' | 'completed';
    this.render();
  }

  // 处理快速创建任务
  private async handleCreateTask() {
    if (!this.addInputEl || !this.addBtnEl) return;
    const title = this.addInputEl.value.trim();
    if (!title) return;

    // 禁用按钮防止重复提交
    this.addBtnEl.disabled = true;
    this.addInputEl.value = '';

    const today = new Date().toISOString().split('T')[0];
    const categoryId = this.categorySelectEl?.value || undefined;
    const levelId = this.levelSelectEl?.value || undefined;

    // 重置选择器
    if (this.categorySelectEl) this.categorySelectEl.value = '';
    if (this.levelSelectEl) this.levelSelectEl.value = '';

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          startDate: today,
          dueDate: today,
          priority: 0,
          categoryId,
          levelId,
        }),
      });

      if (res.ok) {
        const result: any = await res.json();
        if (result.success && result.data) {
          // 构造 PipTaskItem 发回主窗口
          const pipTask: PipTaskItem = {
            id: result.data.id,
            title: result.data.title,
            status: result.data.status === 'completed' ? 'completed' : 'pending',
            categoryEmoji: result.data.category?.emoji ?? null,
            levelValue: result.data.level?.value ?? null,
          };
          // 通知主窗口（发完整 task 数据，不再只发 title）
          this.syncChannel.sendToMain({ type: 'TASK_CREATED', task: pipTask });
          // 本地也加入新任务
          this.tasks.push(pipTask);
          this.render();
        }
      }
    } catch {
      // 恢复输入
      this.addInputEl.value = title;
    }

    this.addBtnEl.disabled = false;
    this.addInputEl.focus();
  }

  // 直接从 API 获取当日任务数据
  private async fetchDailyTodos() {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(`/api/todos/daily?date=${today}`);
      if (res.ok) {
        const result: any = await res.json();
        if (result.success && result.data) {
          const pending: PipTaskItem[] = result.data.today.pending.map((t: any) => ({
            id: t.id,
            title: t.title,
            status: 'pending',
            categoryEmoji: t.category?.emoji ?? null,
            levelValue: t.level?.value ?? null,
          }));
          const completed: PipTaskItem[] = result.data.today.completed.map((t: any) => ({
            id: t.id,
            title: t.title,
            status: 'completed',
            categoryEmoji: t.category?.emoji ?? null,
            levelValue: t.level?.value ?? null,
          }));
          this.tasks = [...pending, ...completed];
          this.isLoading = false;
          this.render();
        }
      }
    } catch {
      // API 请求失败，等待主窗口 broadcast 提供数据
    }
  }

  // HTML 转义
  private escapeHtml(text: string): string {
    const div = this.pipWindow.document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 日期格式化
  private formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  private formatDateFromString(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return this.formatDate(d);
  }

  // 销毁迷你应用
  destroy() {
    this.taskListEl = null;
    this.statsEl = null;
    this.addInputEl = null;
    this.addBtnEl = null;
    this.categorySelectEl = null;
    this.levelSelectEl = null;
    this.pinBtnEl = null;
  }
}