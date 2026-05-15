'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDailyTodos, useToggleTodo, useCreateTodo } from '@/hooks/use-todos';
import { useCategories } from '@/hooks/use-categories';
import { useLevels } from '@/hooks/use-levels';
import { useViewStore } from '@/hooks/use-view-store';
import { cn } from '@/lib/utils';

// 非 Chrome 浏览器的回退浮动面板
// 可拖拽、可折叠，在应用内显示迷你待办列表
export function FloatingPanel() {
  const t = useTranslations('pip');
  const { selectedDate, floatingPanelOpen, floatingPanelPosition, setFloatingPanelOpen, setFloatingPanelPosition } = useViewStore();

  const { data: dailyData, isLoading } = useDailyTodos(selectedDate);
  const { data: categoriesData } = useCategories();
  const { data: levelsData } = useLevels();
  const toggleTodo = useToggleTodo();
  const createTodo = useCreateTodo();

  const [addInput, setAddInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // 提取任务列表
  const pending = dailyData?.data?.today?.pending ?? [];
  const completed = dailyData?.data?.today?.completed ?? [];
  const allTasks = [...pending, ...completed];

  const categories = categoriesData?.data ?? [];
  const levels = levelsData?.data ?? [];

  // 拖拽逻辑
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    const pos = floatingPanelPosition ?? { x: 0, y: -200 };
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [floatingPanelPosition]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setFloatingPanelPosition({
      x: dragStart.current.posX + dx,
      y: dragStart.current.posY + dy,
    });
  }, [isDragging, setFloatingPanelPosition]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 切换任务状态
  const handleToggle = useCallback((id: string) => {
    toggleTodo.mutate(id);
  }, [toggleTodo]);

  // 创建新任务
  const handleCreate = useCallback(() => {
    const trimmed = addInput.trim();
    if (!trimmed) return;

    createTodo.mutate(
      {
        title: trimmed,
        startDate: selectedDate,
        dueDate: selectedDate,
        priority: 0,
        categoryId: selectedCategory || undefined,
        levelId: selectedLevel || undefined,
      },
      {
        onSuccess: () => {
          setAddInput('');
          setSelectedCategory('');
          setSelectedLevel('');
        },
      }
    );
  }, [addInput, createTodo, selectedDate, selectedCategory, selectedLevel]);

  // 折叠/展开
  const handleToggleCollapse = useCallback(() => {
    setFloatingPanelOpen(!floatingPanelOpen);
  }, [floatingPanelOpen, setFloatingPanelOpen]);

  const position = floatingPanelPosition ?? { x: 0, y: -200 };

  // 折叠状态：只显示一个小圆点 + 任务数
  if (!floatingPanelOpen) {
    return (
      <div
        className="fixed z-50 cursor-pointer"
        style={{
          right: '80px',
          bottom: `${-position.y}px`,
          transform: `translateX(${position.x}px)`,
        }}
        onClick={handleToggleCollapse}
      >
        <div className={cn(
          'h-10 w-10 rounded-full shadow-lg',
          'bg-primary text-primary-foreground',
          'flex items-center justify-center',
          'hover:bg-primary/90 transition-colors',
        )}>
          <span className="text-xs font-bold">{allTasks.length}</span>
        </div>
      </div>
    );
  }

  // 展开状态：显示迷你任务列表
  return (
    <div
      className="fixed z-50 w-72 shadow-xl border rounded-lg bg-background"
      style={{
        right: '80px',
        bottom: `${-position.y}px`,
        transform: `translateX(${position.x}px)`,
      }}
    >
      {/* 标题栏 - 可拖拽 */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b cursor-grab active:cursor-grabbing"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold flex-1">Todo List</span>
        <span className="text-xs text-muted-foreground">
          {pending.length}/{allTasks.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={handleToggleCollapse}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* 任务列表 */}
      <ScrollArea className="h-[280px]">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="text-center text-muted-foreground text-sm py-4">
              Loading...
            </div>
          ) : allTasks.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-4">
              {t('noTasks')}
            </div>
          ) : (
            <>
              {/* 待办 */}
              {pending.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted/50"
                >
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => handleToggle(task.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-xs">
                    {task.category?.emoji ?? ''}
                  </span>
                  <span className="text-sm truncate flex-1">
                    {task.title}
                  </span>
                  {task.level && (
                    <span className={cn(
                      'text-[10px] px-1 rounded font-semibold',
                      task.level.value === 3 && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      task.level.value === 2 && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                      task.level.value === 1 && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    )}>
                      {task.level.value === 3 ? 'H' : task.level.value === 2 ? 'M' : 'L'}
                    </span>
                  )}
                </div>
              ))}
              {/* 已完成 */}
              {completed.length > 0 && (
                <>
                  <div className="border-t my-1" />
                  {completed.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted/50 opacity-60"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleToggle(task.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-xs">
                        {task.category?.emoji ?? ''}
                      </span>
                      <span className="text-sm truncate flex-1 line-through">
                        {task.title}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* 快速添加 */}
      <div className="px-3 py-2 border-t space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder={t('addPlaceholder')}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!addInput.trim() || createTodo.isPending}
            className="h-8"
          >
            {t('add')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {levels.map(level => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}