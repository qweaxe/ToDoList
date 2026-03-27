'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useViewStore } from '@/hooks/use-view-store';
import { X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'security-banner-dismissed';

export function SecurityBanner() {
  const t = useTranslations('settings');
  const { setCurrentView, setSettingsTab } = useViewStore();
  const [show, setShow] = useState(false);
  const [hasSecurityQuestion, setHasSecurityQuestion] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    // 检查是否已关闭
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') {
      return;
    }

    // 检查是否设置了安全问题
    fetch('/api/auth/security-question')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHasSecurityQuestion(data.data.hasSecurityQuestion);
          setShow(!data.data.hasSecurityQuestion);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  const handleSetup = () => {
    setCurrentView('settings');
    setSettingsTab('account');
    setShow(false);
  };

  if (!show || hasSecurityQuestion === null) {
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <ShieldAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <span className="text-yellow-800 dark:text-yellow-200">
              {t('securityBannerMessage')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-400 dark:text-yellow-300 dark:hover:bg-yellow-900"
              onClick={handleSetup}
            >
              {t('setupNow')}
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded"
            >
              <X className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}