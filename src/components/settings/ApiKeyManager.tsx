'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  Calendar,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

interface NewKeyData {
  id: string;
  name: string;
  token: string;
  warning: string;
  createdAt: string;
  expiresAt: string | null;
}

export function ApiKeyManager() {
  const t = useTranslations();
  const locale = typeof window !== 'undefined' ? document.documentElement.lang : 'zh';
  const dateFnsLocale = locale === 'zh' ? zhCN : enUS;
  const { toast } = useToast();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [expireDays, setExpireDays] = useState('');
  const [newKeyData, setNewKeyData] = useState<NewKeyData | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  // 加载 API Keys
  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/api-keys');
      const data = await res.json();
      if (data.success) {
        setApiKeys(data.data);
      }
    } catch (error) {
      toast({
        title: t('settings.loadFailed'),
        description: t('settings.apiKeyLoadError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 首次加载
  useState(() => {
    loadApiKeys();
  });

  // 创建新的 API Key
  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: t('common.error'),
        description: t('settings.apiKeyNameRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const body: { name: string; expiresInDays?: number } = { name: newKeyName.trim() };
      if (expireDays) {
        body.expiresInDays = parseInt(expireDays);
      }

      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setNewKeyData(data.data);
        setNewKeyName('');
        setExpireDays('');
        loadApiKeys();
      } else {
        toast({
          title: t('common.error'),
          description: data.error || t('settings.apiKeyCreateError'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.apiKeyCreateError'),
        variant: 'destructive',
      });
    }
  };

  // 复制 Token
  const handleCopy = async () => {
    if (newKeyData?.token) {
      await navigator.clipboard.writeText(newKeyData.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t('common.copied'),
        description: t('settings.apiKeyCopied'),
      });
    }
  };

  // 删除 API Key
  const handleDelete = async () => {
    if (!deleteKeyId) return;

    try {
      const res = await fetch(`/api/api-keys/${deleteKeyId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: t('common.success'),
          description: t('settings.apiKeyRevoked'),
        });
        loadApiKeys();
      } else {
        toast({
          title: t('common.error'),
          description: data.error || t('settings.apiKeyDeleteError'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.apiKeyDeleteError'),
        variant: 'destructive',
      });
    } finally {
      setDeleteKeyId(null);
    }
  };

  // 关闭新 Token 弹窗
  const handleCloseNewToken = () => {
    setNewKeyData(null);
    setShowToken(false);
    setIsCreateOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('settings.apiKeys')}
            </CardTitle>
            <CardDescription>{t('settings.apiKeysDesc')}</CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t('settings.createApiKey')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('settings.noApiKeys')}</p>
            <p className="text-sm mt-1">{t('settings.noApiKeysDesc')}</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    key.isExpired && 'opacity-60 bg-muted'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{key.name}</span>
                      {key.isExpired && (
                        <Badge variant="destructive" className="text-xs">
                          {t('settings.expired')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t('settings.createdAt')}:{' '}
                        {format(new Date(key.createdAt), 'yyyy-MM-dd', {
                          locale: dateFnsLocale,
                        })}
                      </span>
                      {key.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t('settings.expiresAt')}:{' '}
                          {format(new Date(key.expiresAt), 'yyyy-MM-dd', {
                            locale: dateFnsLocale,
                          })}
                        </span>
                      )}
                      {key.lastUsedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t('settings.lastUsed')}:{' '}
                          {format(new Date(key.lastUsedAt), 'yyyy-MM-dd HH:mm', {
                            locale: dateFnsLocale,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteKeyId(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* 使用说明 */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
          <p className="font-medium mb-2">{t('settings.apiKeyUsage')}</p>
          <code className="block bg-background p-2 rounded text-xs overflow-x-auto">
            curl -H "Authorization: Bearer &lt;your-token&gt;" https://your-domain/api/export/todos
          </code>
        </div>
      </CardContent>

      {/* 创建 API Key 弹窗 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.createApiKey')}</DialogTitle>
            <DialogDescription>{t('settings.createApiKeyDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('settings.apiKeyName')}</Label>
              <Input
                id="name"
                placeholder={t('settings.apiKeyNamePlaceholder')}
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expire">{t('settings.expireDays')}</Label>
              <Input
                id="expire"
                type="number"
                placeholder={t('settings.expireDaysPlaceholder')}
                value={expireDays}
                onChange={(e) => setExpireDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.expireDaysHint')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 显示新 Token 弹窗 */}
      <Dialog open={!!newKeyData} onOpenChange={() => handleCloseNewToken()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              {t('settings.apiKeyCreated')}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {newKeyData?.warning}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('settings.apiKeyName')}</Label>
              <p className="font-medium">{newKeyData?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.apiKeyToken')}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                  {showToken
                    ? newKeyData?.token
                    : newKeyData?.token?.replace(/./g, '•')}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseNewToken}>
              {t('common.close')}
            </Button>
            <Button onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t('common.copied')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  {t('common.copy')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.revokeApiKey')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.revokeApiKeyDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
