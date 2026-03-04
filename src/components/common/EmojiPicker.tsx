'use client';

import { useState, useRef } from 'react';
import { Smile, Upload, Clock, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// 常用 Emoji 分类
const EMOJI_CATEGORIES = {
  '常用': ['📝', '✅', '⭐', '🔥', '💡', '📌', '🎯', '💪', '🚀', '⚡', '🌟', '✨', '💫', '🎉', '🎊'],
  '工作': ['💼', '📊', '📈', '📉', '📋', '📁', '📂', '🗂️', '📑', '🖨️', '📠', '💻', '🖥️', '⌨️', '📱'],
  '生活': ['🏠', '🏡', '🍳', '🍳', '🛒', '🛍️', '🎁', '🎉', '🎈', '🎊', '🎄', '🎃', '🎅', '🧹', '🧺'],
  '学习': ['📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒', '📃', '📄', '🗞️', '📑', '🔖', '✏️', '🖊️'],
  '健康': ['💪', '🏃', '🚴', '🏋️', '🧘', '⚽', '🏀', '🎾', '🏐', '🎯', '🥇', '🏆', '🩺', '💊', '❤️'],
  '娱乐': ['🎮', '🎬', '🎭', '🎨', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🎲', '🃏', '🎯', '🎱', '🏆'],
  '美食': ['🍎', '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐'],
  '出行': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '✈️', '🚀', '🚁'],
  '自然': ['🌸', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁'],
  '表情': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘'],
};

// 所有 emoji 列表（用于搜索）
const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

// 从 localStorage 获取最近使用的 emoji
function getRecentEmojis(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('recent-emojis');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return [];
}

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(getRecentEmojis);
  const [activeTab, setActiveTab] = useState('常用');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 保存最近使用的 emoji
  const saveRecentEmoji = (emoji: string) => {
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 15);
    setRecentEmojis(newRecent);
    localStorage.setItem('recent-emojis', JSON.stringify(newRecent));
  };

  // 选择 emoji
  const handleSelect = (emoji: string) => {
    saveRecentEmoji(emoji);
    onChange(emoji);
    setOpen(false);
  };

  // 自定义上传
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        // 将图片转为可使用的格式（这里简化处理，实际可能需要上传到服务器）
        onChange(dataUrl);
        saveRecentEmoji(dataUrl);
        setOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // 搜索过滤
  const filteredEmojis = searchQuery
    ? ALL_EMOJIS.filter(emoji =>
        // 简单的搜索逻辑，实际可以更复杂
        emoji.includes(searchQuery) ||
        // 可以添加 emoji 名称搜索
        false
      )
    : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start', className)}
        >
          {value ? (
            <span className="text-xl mr-2">
              {value.startsWith('data:') ? (
                <img src={value} alt="icon" className="w-5 h-5 inline-block" />
              ) : (
                value
              )}
            </span>
          ) : (
            <Smile className="h-4 w-4 mr-2" />
          )}
          {value || '选择图标'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索 emoji..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {searchQuery ? (
          // 搜索结果
          <ScrollArea className="h-64 p-2">
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, index) => (
                <button
                  key={index}
                  className="w-8 h-8 text-lg hover:bg-muted rounded flex items-center justify-center"
                  onClick={() => handleSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
              {filteredEmojis.length === 0 && (
                <div className="col-span-8 text-center text-muted-foreground py-4">
                  未找到匹配的 emoji
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          // 分类选择
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-0 bg-transparent">
              <TabsTrigger
                value="最近"
                className="px-3 py-2 text-xs data-[state=active]:bg-muted"
                disabled={recentEmojis.length === 0}
              >
                <Clock className="h-3 w-3 mr-1" />
                最近
              </TabsTrigger>
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="px-3 py-2 text-xs data-[state=active]:bg-muted"
                >
                  {category}
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="上传"
                className="px-3 py-2 text-xs data-[state=active]:bg-muted"
              >
                <Upload className="h-3 w-3 mr-1" />
                上传
              </TabsTrigger>
            </TabsList>

            {/* 最近使用 */}
            <TabsContent value="最近" className="mt-0">
              <ScrollArea className="h-56 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {recentEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="w-8 h-8 text-lg hover:bg-muted rounded flex items-center justify-center"
                      onClick={() => handleSelect(emoji)}
                    >
                      {emoji.startsWith('data:') ? (
                        <img src={emoji} alt="icon" className="w-5 h-5" />
                      ) : (
                        emoji
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 各分类 */}
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <TabsContent key={category} value={category} className="mt-0">
                <ScrollArea className="h-56 p-2">
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        className="w-8 h-8 text-lg hover:bg-muted rounded flex items-center justify-center"
                        onClick={() => handleSelect(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}

            {/* 上传 */}
            <TabsContent value="上传" className="mt-0">
              <div className="p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      点击上传自定义图标
                    </span>
                  </div>
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  支持 PNG, JPG, SVG 格式
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* 清除选择 */}
        {value && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              清除选择
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
