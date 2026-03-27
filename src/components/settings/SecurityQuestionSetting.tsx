'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// 预设安全问题列表
const PRESET_QUESTIONS = [
  'preset_motherName',
  'preset_firstSchool',
  'preset_birthCity',
  'preset_favoriteMovie',
  'preset_firstPet',
];

// 错误码到翻译key的映射
const ERROR_CODE_MAP: Record<string, string> = {
  UNAUTHORIZED: 'unauthorized',
  VALIDATION_ERROR: 'validationError',
  INTERNAL_ERROR: 'internalError',
};

export function SecurityQuestionSetting() {
  const t = useTranslations('settings');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasSecurityQuestion, setHasSecurityQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isCustomQuestion, setIsCustomQuestion] = useState(false);
  const [form, setForm] = useState({
    question: '',
    customQuestion: '',
    answer: '',
  });

  // 获取当前安全问题状态
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/auth/security-question');
        const data = await response.json();
        if (data.success) {
          setHasSecurityQuestion(data.data.hasSecurityQuestion);
          setCurrentQuestion(data.data.question);
        }
      } catch {
        toast.error(t('fetchSecurityQuestionFailed'));
      } finally {
        setIsFetching(false);
      }
    };
    fetchStatus();
  }, [t]);

  const handleQuestionChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomQuestion(true);
      setForm({ ...form, question: '' });
    } else {
      setIsCustomQuestion(false);
      setForm({ ...form, question: t(value), customQuestion: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const question = isCustomQuestion ? form.customQuestion : form.question;
    if (!question || !form.answer) {
      toast.error(t('fillAllFields'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/security-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer: form.answer,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        const errorKey = ERROR_CODE_MAP[data.code] || 'securityQuestionSetFailed';
        toast.error(t(errorKey));
      } else {
        toast.success(t('securityQuestionSet'));
        setHasSecurityQuestion(true);
        setCurrentQuestion(question);
        setForm({ question: '', customQuestion: '', answer: '' });
        setIsCustomQuestion(false);
      }
    } catch {
      toast.error(t('securityQuestionSetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch('/api/auth/security-question', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        const errorKey = ERROR_CODE_MAP[data.code] || 'securityQuestionDeleteFailed';
        toast.error(t(errorKey));
      } else {
        toast.success(t('securityQuestionDeleted'));
        setHasSecurityQuestion(false);
        setCurrentQuestion(null);
      }
    } catch {
      toast.error(t('securityQuestionDeleteFailed'));
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasSecurityQuestion ? (
            <ShieldCheck className="h-5 w-5 text-green-500" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-yellow-500" />
          )}
          {t('securityQuestion')}
        </CardTitle>
        <CardDescription>
          {hasSecurityQuestion
            ? t('securityQuestionDescSet')
            : t('securityQuestionDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasSecurityQuestion && currentQuestion && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              {t('currentQuestion')}
            </p>
            <p className="font-medium">{currentQuestion}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label>{t('selectQuestion')}</Label>
            <Select onValueChange={handleQuestionChange} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectQuestionPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {PRESET_QUESTIONS.map((q) => (
                  <SelectItem key={q} value={q}>
                    {t(q)}
                  </SelectItem>
                ))}
                <SelectItem value="custom">{t('customQuestion')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustomQuestion && (
            <div className="space-y-2">
              <Label htmlFor="custom-question">{t('customQuestionLabel')}</Label>
              <Input
                id="custom-question"
                type="text"
                placeholder={t('customQuestionPlaceholder')}
                value={form.customQuestion}
                onChange={(e) =>
                  setForm({ ...form, customQuestion: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="answer">{t('securityAnswer')}</Label>
            <Input
              id="answer"
              type="text"
              placeholder={t('securityAnswerPlaceholder')}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasSecurityQuestion ? t('updateQuestion') : t('setQuestion')}
            </Button>

            {hasSecurityQuestion && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isLoading}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('deleteQuestion')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('deleteQuestionConfirmTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('deleteQuestionConfirmDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {t('confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}