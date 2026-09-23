import { useEffect } from 'react';

export const useAppVersion = () => {
  useEffect(() => {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
    const commitHash = typeof __GIT_COMMIT_HASH__ !== 'undefined' ? __GIT_COMMIT_HASH__ : 'dev';
    const buildTimestamp = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : new Date().toISOString();
    const environment = typeof __ENVIRONMENT__ !== 'undefined' ? __ENVIRONMENT__ : 'development';

    console.log(
      `%c[Shop Inventory App] %cVersion: %c${version} %c(Commit: %c${commitHash}%c) | Built: %c${buildTimestamp} %c| Env: %c${environment}`,
      'color: #3b82f6; font-weight: bold; font-size: 14px;',
      'color: #6b7280; font-weight: normal;',
      'color: #10b981; font-weight: bold;',
      'color: #6b7280;',
      'color: #8b5cf6; font-weight: bold;',
      'color: #6b7280;',
      'color: #f59e0b; font-weight: bold;',
      'color: #6b7280;',
      'color: #ef4444; font-weight: bold;'
    );
  }, []);
};
