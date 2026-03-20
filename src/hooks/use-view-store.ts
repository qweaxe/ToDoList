import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTodayString } from '@/lib/date-utils';

// 视图类型
export type ViewType = 'day' | 'calendar' | 'week' | 'quarter' | 'year' | 'settings' | 'overdue' | 'task-list';

// 设置子页面类型
export type SettingsTab = 'categories' | 'levels' | 'account';

// 任务列表筛选类型
export type TaskListFilterType = 'category' | 'level';

interface TaskListFilter {
  type: TaskListFilterType;
  id: string;
  name: string;
  year: number;
}

interface ViewState {
  // 当前视图
  currentView: ViewType;

  // 当前选中的日期
  selectedDate: string;

  // 日历视图的年月
  calendarYear: number;
  calendarMonth: number;

  // 周视图的开始日期
  weekStartDate: string;

  // 季度视图的年份和季度
  quarterYear: number;
  quarterNumber: 1 | 2 | 3 | 4;

  // 年度视图的年份
  yearlyYear: number;

  // 设置页面的子标签
  settingsTab: SettingsTab;

  // 任务列表筛选条件
  taskListFilter: TaskListFilter | null;

  // 侧边栏是否展开（移动端）
  sidebarOpen: boolean;

  // 操作方法
  setCurrentView: (view: ViewType) => void;
  setSelectedDate: (date: string) => void;
  setCalendarYear: (year: number) => void;
  setCalendarMonth: (month: number) => void;
  setWeekStartDate: (date: string) => void;
  setQuarterYear: (year: number) => void;
  setQuarterNumber: (quarter: 1 | 2 | 3 | 4) => void;
  setYearlyYear: (year: number) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setTaskListFilter: (filter: TaskListFilter | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // 快捷操作
  goToToday: () => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
}

// 获取当前日期信息
const now = new Date();
const today = getTodayString();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const currentQuarter = Math.ceil(currentMonth / 3) as 1 | 2 | 3 | 4;

export const useViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      // 初始值
      currentView: 'day',
      selectedDate: today,
      calendarYear: currentYear,
      calendarMonth: currentMonth,
      weekStartDate: today,
      quarterYear: currentYear,
      quarterNumber: currentQuarter,
      yearlyYear: currentYear,
      settingsTab: 'categories',
      taskListFilter: null,
      sidebarOpen: false,

      // 操作方法
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setCalendarYear: (year) => set({ calendarYear: year }),
      setCalendarMonth: (month) => set({ calendarMonth: month }),
      setWeekStartDate: (date) => set({ weekStartDate: date }),
      setQuarterYear: (year) => set({ quarterYear: year }),
      setQuarterNumber: (quarter) => set({ quarterNumber: quarter }),
      setYearlyYear: (year) => set({ yearlyYear: year }),
      setSettingsTab: (tab) => set({ settingsTab: tab }),
      setTaskListFilter: (filter) => set({ taskListFilter: filter }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // 快捷操作
      goToToday: () => {
        const now = new Date();
        set({
          selectedDate: getTodayString(),
          calendarYear: now.getFullYear(),
          calendarMonth: now.getMonth() + 1,
          weekStartDate: getTodayString(),
        });
      },

      goToPreviousMonth: () => {
        const { calendarYear, calendarMonth } = get();
        if (calendarMonth === 1) {
          set({ calendarYear: calendarYear - 1, calendarMonth: 12 });
        } else {
          set({ calendarMonth: calendarMonth - 1 });
        }
      },

      goToNextMonth: () => {
        const { calendarYear, calendarMonth } = get();
        if (calendarMonth === 12) {
          set({ calendarYear: calendarYear + 1, calendarMonth: 1 });
        } else {
          set({ calendarMonth: calendarMonth + 1 });
        }
      },

      goToPreviousWeek: () => {
        const { weekStartDate } = get();
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() - 7);
        set({ weekStartDate: date.toISOString().split('T')[0] });
      },

      goToNextWeek: () => {
        const { weekStartDate } = get();
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + 7);
        set({ weekStartDate: date.toISOString().split('T')[0] });
      },
    }),
    {
      name: 'todo-list-view-storage',
      partialize: (state) => ({
        currentView: state.currentView,
        selectedDate: state.selectedDate,
        calendarYear: state.calendarYear,
        calendarMonth: state.calendarMonth,
      }),
    }
  )
);
