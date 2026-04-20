import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format, addWeeks, subWeeks } from 'date-fns';
import { getTodayString } from '@/lib/date-utils';

// 视图类型
export type ViewType = 'day' | 'calendar' | 'week' | 'quarter' | 'year' | 'settings' | 'overdue' | 'task-list' | 'inbox';

// 设置子页面类型
export type SettingsTab = 'categories' | 'levels' | 'account' | 'api' | 'admin';

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

  // hydration 完成标记
  _hydrated: boolean;

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

// 获取当前日期信息的函数（不在模块顶层调用，避免 SSR 不匹配）
function getCurrentDateInfo() {
  const now = new Date();
  const today = getTodayString();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3) as 1 | 2 | 3 | 4;
  return { today, currentYear, currentMonth, currentQuarter };
}

export const useViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      // 初始值使用固定默认值，避免 SSR 不匹配
      currentView: 'day',
      selectedDate: '1970-01-01', // 占位值，hydration 后会更新
      calendarYear: 1970,
      calendarMonth: 1,
      weekStartDate: '1970-01-01',
      quarterYear: 1970,
      quarterNumber: 1,
      yearlyYear: 1970,
      settingsTab: 'categories',
      taskListFilter: null,
      sidebarOpen: false,
      _hydrated: false,

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
        const { today, currentYear, currentMonth } = getCurrentDateInfo();
        set({
          selectedDate: today,
          calendarYear: currentYear,
          calendarMonth: currentMonth,
          weekStartDate: today,
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
        // weekStartDate 是 yyyy-MM-dd 格式，使用 parseISO 解析
        const date = weekStartDate.includes('T')
          ? subWeeks(new Date(weekStartDate), 1)
          : new Date(`${weekStartDate}T12:00:00`); // 使用中午时间避免时区边界问题
        const prevDate = subWeeks(date, 1);
        set({ weekStartDate: format(prevDate, 'yyyy-MM-dd') });
      },

      goToNextWeek: () => {
        const { weekStartDate } = get();
        const date = weekStartDate.includes('T')
          ? new Date(weekStartDate)
          : new Date(`${weekStartDate}T12:00:00`); // 使用中午时间避免时区边界问题
        const nextDate = addWeeks(date, 1);
        set({ weekStartDate: format(nextDate, 'yyyy-MM-dd') });
      },
    }),
    {
      name: 'todo-list-view-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentView: state.currentView,
        // 不持久化日期相关状态，每次访问都从今天开始
        // selectedDate: state.selectedDate,
        // calendarYear: state.calendarYear,
        // calendarMonth: state.calendarMonth,
      }),
      onRehydrateStorage: () => (state) => {
        // hydration 完成后，更新为当前日期
        if (state) {
          const { today, currentYear, currentMonth, currentQuarter } = getCurrentDateInfo();
          state.selectedDate = today;
          state.calendarYear = currentYear;
          state.calendarMonth = currentMonth;
          state.weekStartDate = today;
          state.quarterYear = currentYear;
          state.quarterNumber = currentQuarter;
          state.yearlyYear = currentYear;
          state._hydrated = true;
        }
      },
    }
  )
);
