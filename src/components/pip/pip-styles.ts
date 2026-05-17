// PiP 窗口样式 - 纯 CSS，不依赖 Tailwind 构建链
// 作为字符串常量注入到 PiP 窗口的 document.head
// 暗色模式通过 .dark class 控制（由主窗口 THEME_CHANGE 消息驱动）

export const pipStyles = `
:root {
  --pip-bg: #ffffff;
  --pip-text: #18181b;
  --pip-muted: #71717a;
  --pip-border: #e4e4e7;
  --pip-accent: #3b82f6;
  --pip-success: #22c55e;
  --pip-danger: #ef4444;
  --pip-hover: #f4f4f5;
  --pip-card: #ffffff;
  --pip-radius: 8px;
  --pip-checkbox-size: 18px;
  --pip-input-bg: #ffffff;
  --pip-select-bg: #f4f4f5;
}

.dark {
  --pip-bg: #09090b;
  --pip-text: #fafafa;
  --pip-muted: #a1a1aa;
  --pip-border: #27272a;
  --pip-hover: #18181b;
  --pip-card: #18181b;
  --pip-input-bg: #18181b;
  --pip-select-bg: #27272a;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--pip-bg);
  color: var(--pip-text);
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.pip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--pip-border);
  background: var(--pip-card);
}

.pip-header-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
}

.pip-header-date {
  font-size: 12px;
  color: var(--pip-muted);
  font-weight: 400;
}

.pip-header-icon {
  width: 16px;
  height: 16px;
  fill: var(--pip-accent);
}

.pip-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pip-pin-btn {
  background: none;
  border: none;
  color: var(--pip-accent);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: color 0.15s;
}

.pip-pin-btn.unpinned {
  color: var(--pip-muted);
}

.pip-pin-btn:hover {
  background: var(--pip-hover);
}


.pip-stats {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--pip-muted);
  display: flex;
  gap: 8px;
}

.pip-stats span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.pip-task-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.pip-task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 0;
}

.pip-task-item:hover {
  background: var(--pip-hover);
}

.pip-subtask-indicator {
  font-size: 11px;
  color: var(--pip-muted);
  cursor: pointer;
  flex-shrink: 0;
  padding: 0 2px;
}

.pip-task-item.has-subtasks .pip-task-title {
  cursor: pointer;
}

.pip-subtask-list {
  padding: 4px 12px 4px 40px;
  border-top: 1px solid var(--pip-border);
}

.pip-subtask-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 12px;
}

.pip-subtask-item.done span {
  color: var(--pip-muted);
  text-decoration: line-through;
}

.pip-subtask-checkbox {
  appearance: none;
  width: 14px;
  height: 14px;
  border: 2px solid var(--pip-border);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: all 0.15s;
}

.pip-subtask-checkbox:checked {
  background: var(--pip-success);
  border-color: var(--pip-success);
}

.pip-subtask-checkbox:checked::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 3px;
  width: 3px;
  height: 6px;
  border: solid white;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

.pip-task-item.completed {
  opacity: 0.6;
}

.pip-checkbox {
  appearance: none;
  width: var(--pip-checkbox-size);
  height: var(--pip-checkbox-size);
  border: 2px solid var(--pip-border);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: all 0.15s;
}

.pip-checkbox:checked {
  background: var(--pip-success);
  border-color: var(--pip-success);
}

.pip-checkbox:checked::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.pip-checkbox:hover {
  border-color: var(--pip-accent);
}

.pip-task-emoji {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.pip-task-title {
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pip-task-item.completed .pip-task-title {
  text-decoration: line-through;
}

.pip-task-level {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  flex-shrink: 0;
  font-weight: 600;
}

.pip-task-level.high {
  background: #fef2f2;
  color: #dc2626;
}

.pip-task-level.medium {
  background: #fef9c3;
  color: #ca8a04;
}

.pip-task-level.low {
  background: #f0fdf4;
  color: #16a34a;
}

.dark .pip-task-level.high {
  background: #451a1a;
  color: #fca5a5;
}

.dark .pip-task-level.medium {
  background: #422006;
  color: #fde047;
}

.dark .pip-task-level.low {
  background: #052e16;
  color: #86efac;
}

.pip-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--pip-muted);
  font-size: 13px;
  padding: 20px;
}

.pip-add-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid var(--pip-border);
  background: var(--pip-card);
}

.pip-add-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pip-add-input {
  flex: 1;
  border: 1px solid var(--pip-border);
  border-radius: var(--pip-radius);
  padding: 6px 10px;
  font-size: 13px;
  background: var(--pip-input-bg);
  color: var(--pip-text);
  outline: none;
  font-family: inherit;
}

.pip-add-input:focus {
  border-color: var(--pip-accent);
}

.pip-add-input::placeholder {
  color: var(--pip-muted);
}

.pip-add-select {
  border: 1px solid var(--pip-border);
  border-radius: var(--pip-radius);
  padding: 6px 8px;
  font-size: 12px;
  background: var(--pip-select-bg);
  color: var(--pip-text);
  outline: none;
  font-family: inherit;
  cursor: pointer;
  min-width: 0;
}

.pip-add-select:focus {
  border-color: var(--pip-accent);
}

.pip-add-btn {
  background: var(--pip-accent);
  color: white;
  border: none;
  border-radius: var(--pip-radius);
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  font-weight: 500;
  font-family: inherit;
}

.pip-add-btn:hover {
  opacity: 0.9;
}

.pip-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pip-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--pip-muted);
}

.pip-loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--pip-border);
  border-top-color: var(--pip-accent);
  border-radius: 50%;
  animation: pip-spin 0.6s linear infinite;
}

@keyframes pip-spin {
  to { transform: rotate(360deg); }
}
`;