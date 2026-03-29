'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface AuthPageProps {
  callbackUrl?: string;
}

export function AuthPage({ callbackUrl }: AuthPageProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // 登录表单状态
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    remember: false,
  });

  // 注册表单状态
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginForm.username || !loginForm.password) {
      toast.error(t('enterUsernameAndPassword'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username: loginForm.username,
        password: loginForm.password,
        redirect: false,
      });

      if (result?.ok) {
        toast.success(t('loginSuccess'));
        router.push(callbackUrl || '/');
        router.refresh();
      } else {
        toast.error(result?.error || t('loginFailed'));
      }
    } catch {
      toast.error(t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerForm.username || !registerForm.password) {
      toast.error(t('enterUsernameAndPassword'));
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
          name: registerForm.name || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error);
      } else {
        toast.success(t('registerSuccess'));
        setActiveTab('login');
        setLoginForm({ ...loginForm, username: registerForm.username });
        setRegisterForm({
          username: '',
          password: '',
          confirmPassword: '',
          name: '',
        });
      }
    } catch {
      toast.error(t('registerFailed'));
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-muted-foreground mt-2">{t('tagline')}</p>
        </div>

        {/* 登录/注册卡片 */}
        <Card className="border shadow-lg">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('login')}</TabsTrigger>
                <TabsTrigger value="register">{t('register')}</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* 登录表单 */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">{t('username')}</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder={t('usernamePlaceholder')}
                      value={loginForm.username}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, username: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('password')}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder={t('passwordPlaceholder')}
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={loginForm.remember}
                      onCheckedChange={(checked) =>
                        setLoginForm({ ...loginForm, remember: !!checked })
                      }
                    />
                    <Label htmlFor="remember" className="text-sm font-normal">
                      {t('rememberMe')}
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('loginButton')}
                  </Button>

                  <div className="text-center">
                    <Link
                      href={`/${locale}/forgot-password`}
                      className="text-sm text-primary hover:underline"
                    >
                      {t('forgotPassword')}
                    </Link>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    {t('testAccount')}
                  </p>
                </form>
              </TabsContent>

              {/* 注册表单 */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">{t('username')} *</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder={t('usernameRequiredHint')}
                      value={registerForm.username}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, username: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-name">{t('nickname')}</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder={t('nicknamePlaceholder')}
                      value={registerForm.name}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, name: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">{t('password')} *</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder={t('passwordRequiredHint')}
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, password: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">{t('confirmPassword')} *</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder={t('confirmPasswordPlaceholder')}
                      value={registerForm.confirmPassword}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('registerButton')}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* 版权信息 */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('copyright')}
        </p>
      </div>
    </div>
  );
}
