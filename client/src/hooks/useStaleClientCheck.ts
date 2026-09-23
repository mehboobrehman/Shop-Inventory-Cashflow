import { useEffect, useState, createElement as h } from 'react';
import { toast } from 'react-toastify';

interface VersionResponse {
  version: string;
  commitHash: string;
  buildTimestamp: string;
  environment: string;
}

export const useStaleClientCheck = () => {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [latestVersionInfo, setLatestVersionInfo] = useState<VersionResponse | null>(null);

  useEffect(() => {
    const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
    const currentCommit = typeof __GIT_COMMIT_HASH__ !== 'undefined' ? __GIT_COMMIT_HASH__ : 'dev';

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (response.ok) {
          const data: VersionResponse = await response.json();
          const isVersionMismatch = data.version && data.version !== currentVersion;
          const isCommitMismatch = 
            data.commitHash && 
            data.commitHash !== 'dev' && 
            data.commitHash !== 'unknown' && 
            currentCommit !== 'dev' && 
            currentCommit !== 'unknown' && 
            data.commitHash !== currentCommit;

          if (isVersionMismatch || isCommitMismatch) {
            setNewVersionAvailable(true);
            setLatestVersionInfo(data);
            
            toast.info(
              () => h(
                'div',
                { className: 'flex flex-col space-y-2' },
                h(
                  'div',
                  { className: 'font-bold text-sm text-gray-900 flex items-center' },
                  h('span', { className: 'mr-2' }, '🚀'),
                  `New version available (${data.version})!`
                ),
                h(
                  'p',
                  { className: 'text-xs text-gray-600' },
                  'A fresh update has been deployed. Please refresh to load the latest fixes and features.'
                ),
                h(
                  'button',
                  {
                    onClick: () => window.location.reload(),
                    className: 'mt-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded shadow transition-colors w-full text-center'
                  },
                  'Refresh Now'
                )
              ),
              {
                position: 'top-right',
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                toastId: 'stale-client-refresh-toast',
              }
            );
          }
        }
      } catch (err) {
        console.debug('Failed to check for stale client version:', err);
      }
    };

    checkVersion();

    const interval = setInterval(checkVersion, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { newVersionAvailable, latestVersionInfo };
};
