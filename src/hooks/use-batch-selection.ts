'use client';

import { useState, useCallback, useMemo } from 'react';

interface UseBatchSelectionOptions {
  totalCount?: number;
}

export function useBatchSelection(options: UseBatchSelectionOptions = {}) {
  const { totalCount } = options;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // 选中数量
  const selectedCount = selectedIds.size;

  // 是否全选
  const isAllSelected = useMemo(() => {
    if (!totalCount || totalCount === 0) return false;
    return selectedIds.size === totalCount;
  }, [selectedIds.size, totalCount]);

  // 是否部分选中
  const isPartialSelected = useMemo(() => {
    if (!totalCount || totalCount === 0) return false;
    return selectedIds.size > 0 && selectedIds.size < totalCount;
  }, [selectedIds.size, totalCount]);

  // 切换选择模式
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) {
        // 退出选择模式时清空选择
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  // 进入选择模式
  const enterSelectMode = useCallback(() => {
    setIsSelectMode(true);
  }, []);

  // 退出选择模式
  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  // 切换单个选择
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // 选择单个
  const select = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  // 取消选择单个
  const deselect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // 全选
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  // 取消全选
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 切换全选
  const toggleSelectAll = useCallback((ids: string[]) => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll(ids);
    }
  }, [isAllSelected, selectAll, deselectAll]);

  // 获取选中的 ID 数组
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  // 检查是否选中
  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  return {
    // 状态
    selectedIds,
    selectedCount,
    isSelectMode,
    isAllSelected,
    isPartialSelected,
    // 操作
    toggleSelectMode,
    enterSelectMode,
    exitSelectMode,
    toggleSelection,
    select,
    deselect,
    selectAll,
    deselectAll,
    toggleSelectAll,
    getSelectedIds,
    isSelected,
  };
}
