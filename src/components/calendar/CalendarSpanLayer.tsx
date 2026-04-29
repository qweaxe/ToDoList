'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { CalendarSpanBar } from './CalendarSpanBar';
import type { CrossDaySpan } from '@/types/cross-day-span';
import {
  calculateSpanPosition,
  isCrossWeekSpan,
  getCrossWeekSpanFragments,
} from '@/lib/cross-day-utils';

interface CalendarSpanLayerProps {
  spans: CrossDaySpan[];
  onTaskClick?: (taskId: string) => void;
}

interface CellDimensions {
  width: number;
  height: number;
  gap: number;
}

export function CalendarSpanLayer({ spans, onTaskClick }: CalendarSpanLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<CellDimensions>({
    width: 68,
    height: 80,
    gap: 4,
  });

  // 使用 ResizeObserver 测量单元格尺寸
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      // 找到第一个单元格元素来测量尺寸
      const cell = container.querySelector('[data-calendar-cell]');
      if (cell) {
        const rect = cell.getBoundingClientRect();
        // 从 CSS 类推断 gap（gap-1 = 4px, gap-2 = 8px）
        const gap = container.classList.contains('gap-2') ? 8 : 4;
        setDimensions({
          width: rect.width,
          height: rect.height,
          gap,
        });
      }
    };

    // 初始测量
    updateDimensions();

    // 使用 ResizeObserver 监听尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      // debounce 测量
      setTimeout(updateDimensions, 100);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 计算每个横跨条的渲染数据
  const renderedSpans = useMemo(() => {
    return spans.map((span) => {
      if (isCrossWeekSpan(span)) {
        // 跨周任务：渲染多个片段
        const fragments = getCrossWeekSpanFragments(
          span,
          dimensions.width,
          dimensions.height,
          dimensions.gap
        );
        return {
          span,
          fragments,
          isCrossWeek: true,
        };
      } else {
        // 单周任务：渲染单个横跨条
        const position = calculateSpanPosition(
          span,
          dimensions.width,
          dimensions.height,
          dimensions.gap
        );
        return {
          span,
          position,
          isCrossWeek: false,
        };
      }
    });
  }, [spans, dimensions]);

  if (spans.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ top: 0 }}
    >
      {renderedSpans.map((item) => {
        if (item.isCrossWeek && item.fragments) {
          // 渲染跨周任务的多个片段
          return item.fragments.map((fragment, idx) => (
            <CalendarSpanBar
              key={`${item.span.taskId}-${idx}`}
              span={item.span}
              left={fragment.left}
              width={fragment.width}
              top={fragment.top}
              height={fragment.height}
              onTaskClick={onTaskClick}
            />
          ));
        } else if (!item.isCrossWeek && item.position) {
          // 渲染单周任务
          return (
            <CalendarSpanBar
              key={item.span.taskId}
              span={item.span}
              left={item.position.left}
              width={item.position.width}
              top={item.position.top}
              height={item.position.height}
              onTaskClick={onTaskClick}
            />
          );
        }
        return null;
      })}
    </div>
  );
}