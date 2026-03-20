'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export function ChangePassword() {
  const t = useTranslations('settings');
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.currentPassword || !form.newPassword) {
      toast.error(t('enterAllPasswords'));
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error);
      } else {
        toast.success(t('passwordChanged'));
        setForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch {
      toast.error(t('passwordChangeFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          {t('changePassword')}
        </CardTitle>
        <CardDescription>{t('changePasswordDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t('currentPassword')}</Label>
            <Input
              id="current-password"
              type="password"
              placeholder={t('currentPasswordPlaceholder')}
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">{t('newPassword')}</Label>
            <Input
              id="new-password"
              type="password"
              placeholder={t('newPasswordPlaceholder')}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">{t('confirmNewPassword')}</Label>
            <Input
              id="confirm-new-password"
              type="password"
              placeholder={t('confirmNewPasswordPlaceholder')}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('changePasswordButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}