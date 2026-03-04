'use client';

import { ChevronUp, Minus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useLevels,
} from '@/hooks/use-levels';
import { useViewStore } from '@/hooks/use-view-store';
import { cn } from '@/lib/utils';

// 固定的三个等级配置
const FIXED_LEVELS = [
  { name: '高', value: 3, icon: <ChevronUp className="h-4 w-4" />, color: 'bg-red-500 text-white', description: '需要优先处理' },
  { name: '中', value: 2, icon: <Minus className="h-4 w-4" />, color: 'bg-yellow-500 text-white', description: '正常处理' },
  { name: '低', value: 1, icon: <ChevronDown className="h-4 w-4" />, color: 'bg-gray-400 text-white', description: '有空时处理' },
];

export function LevelManager() {
  const { data, isLoading } = useLevels();
  const { setCurrentView, setTaskListFilter } = useViewStore();

  const levels = data?.data || [];

  // 合并固定等级和数据库中的使用统计
  const displayLevels = FIXED_LEVELS.map(fixed => {
    const dbLevel = levels.find(l => l.name === fixed.name);
    return {
      ...fixed,
      id: dbLevel?.id || '',
      todoCount: dbLevel?.todoCount || 0,
    };
  });

  // 点击任务数量，跳转到任务列表视图
  const handleTodoCountClick = (level: { id: string; name: string }) => {
    setTaskListFilter({
      type: 'level',
      id: level.id,
      name: `${level.name}优先级`,
      year: new Date().getFullYear(),
    });
    setCurrentView('task-list');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          加载中...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>任务等级</CardTitle>
        <CardDescription>
          任务优先级分为高、中、低三个等级，数值越大优先级越高
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayLevels.map((level) => (
            <div
              key={level.name}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg',
                    level.color
                  )}
                >
                  {level.icon}
                </div>
                <div>
                  <div className="font-medium text-lg">{level.name}优先级</div>
                  <div className="text-sm text-muted-foreground">
                    {level.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="text-sm cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleTodoCountClick(level)}
                >
                  {level.todoCount} 个任务
                </Badge>
                <div className="text-sm text-muted-foreground">
                  值: {level.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">等级说明</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <span className="text-red-500 font-medium">高</span>：紧急重要的事项，需要优先处理</li>
            <li>• <span className="text-yellow-500 font-medium">中</span>：常规事项，按正常节奏处理</li>
            <li>• <span className="text-gray-400 font-medium">低</span>：不紧急的事项，有时间再处理</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
