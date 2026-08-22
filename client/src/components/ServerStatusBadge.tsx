import React, { useEffect, useState } from 'react';

export const ServerStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<{ ip: string; port: string | number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/v1/health');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.success && data.data && data.data.serverIp && data.data.serverPort) {
          setStatus({
            ip: data.data.serverIp,
            port: data.data.serverPort,
          });
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading || error || !status) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none z-50"
      aria-live="polite"
      aria-label="Server status"
    >
      Server: {status.ip}:{status.port}
    </div>
  );
};
