'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/types/api';

interface Category {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  todoCount: number;
}

// Get all categories
export function useCategories() {
  return useQuery<{
    success: boolean;
    data: Category[];
  }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      return res.json();
    },
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        toast.success('Category created successfully');
      } else {
        toast.error(result.error || 'Creation failed');
      }
    },
    onError: () => {
      toast.error('Failed to create category');
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryInput }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        toast.success('Category updated successfully');
      } else {
        toast.error(result.error || 'Update failed');
      }
    },
    onError: () => {
      toast.error('Failed to update category');
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        toast.success('Category deleted successfully');
      } else {
        toast.error(result.error || 'Deletion failed');
      }
    },
    onError: () => {
      toast.error('Failed to delete category');
    },
  });
}
