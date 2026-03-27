'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckSquare, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'username' | 'question' | 'reset' | 'success';

// 错误码到翻译key的映射
const ERROR_CODE_MAP: Record<string, string> = {
  USER_NOT_FOUND: 'userNotFound',
  NO_SECURITY_QUESTION: 'noSecurityQuestion',
  ACCOUNT_LOCKED: 'accountLocked',
  WRONG_ANSWER: 'wrongAnswer',
  VALIDATION_ERROR: 'validationError',
  INTERNAL_ERROR: 'internalError',
};

export function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('username');
  const [form, setForm] = useState({
    username: '',
    question: '',
    answer: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 显示错误消息
  const showErrorMessage = (code: string, data?: Record<string, unknown>) => {
    const translationKey = ERROR_CODE_MAP[code] || 'unknownError';

    if (code === 'ACCOUNT_LOCKED' && data?.remainingMinutes) {
      toast.error(t(translationKey, { minutes: data.remainingMinutes }));
    } else if (code === 'WRONG_ANSWER' && data?.attemptsLeft) {
      toast.error(t(translationKey, { attempts: data.attemptsLeft }));
    } else {
      toast.error(t(translationKey));
    }
  };

  // 提交用户名，获取安全问题
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username) {
      toast.error(t('enterUsername'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username }),
      });

      const data = await response.json();

      if (!data.success) {
        showErrorMessage(data.code, data.data);
      } else {
        setForm({ ...form, question: data.data.question });
        setStep('question');
      }
    } catch {
      toast.error(t('forgotPasswordFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 提交答案和新密码
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.answer || !form.newPassword) {
      toast.error(t('fillAllFields'));
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          answer: form.answer,
          newPassword: form.newPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        showErrorMessage(data.code, data.data);
      } else {
        setStep('success');
      }
    } catch {
      toast.error(t('resetPasswordFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-3xl font-bold">
            <CheckSquare className="h-10 w-10 text-primary" />
            <span>To Do List</span>
          </div>
          <p className="text-muted-foreground mt-2">{t('forgotPassword')}</p>
        </div>

        {/* 卡片 */}
        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {step === 'username' && t('forgotPassword')}
              {step === 'question' && t('answerSecurityQuestion')}
              {step === 'reset' && t('setNewPassword')}
              {step === 'success' && t('resetSuccess')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 步骤1: 输入用户名 */}
            {step === 'username' && (
              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('username')}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={t('usernamePlaceholder')}
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('nextStep')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBackToLogin}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('backToLogin')}
                </Button>
              </form>
            )}

            {/* 步骤2: 显示安全问题 */}
            {step === 'question' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep('reset');
                }}
                className="space-y-4"
              >
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('yourSecurityQuestion')}
                  </p>
                  <p className="font-medium">{form.question}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer">{t('yourAnswer')}</Label>
                  <Input
                    id="answer"
                    type="text"
                    placeholder={t('answerPlaceholder')}
                    value={form.answer}
                    onChange={(e) =>
                      setForm({ ...form, answer: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {t('verifyAndReset')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('username')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('back')}
                </Button>
              </form>
            )}

            {/* 步骤3: 设置新密码 */}
            {step === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('newPassword')}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder={t('newPasswordPlaceholder')}
                    value={form.newPassword}
                    onChange={(e) =>
                      setForm({ ...form, newPassword: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    {t('confirmNewPassword')}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('resetPassword')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('question')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('back')}
                </Button>
              </form>
            )}

            {/* 成功页面 */}
            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <KeyRound className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-muted-foreground">{t('resetSuccessDesc')}</p>
                <Button className="w-full" onClick={handleBackToLogin}>
                  {t('backToLogin')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 版权信息 */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('copyright')}
        </p>
      </div>
    </div>
  );
}
