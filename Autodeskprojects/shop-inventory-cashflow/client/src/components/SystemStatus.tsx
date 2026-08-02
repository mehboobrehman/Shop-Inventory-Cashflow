import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('Checking...');
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/v1/health');
        const data = await response.json();
        if (data.success) {
          setStatus('Operational');
          setTimestamp(new Date(data.data.timestamp).toLocaleTimeString());
        } else {
          setStatus('Error');
        }
      } catch (error) {
        setStatus('Offline');
        toast.error('System health check failed');
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4 text-sm">
      <p className="font-medium text-gray-500">System Status</p>
      <p className={`font-bold ${status === 'Operational' ? 'text-green-600' : 'text-red-600'}`}>
        {status}
      </p>
      {timestamp && <p className="text-xs text-gray-400">Last checked: {timestamp}</p>}
    </div>
  );
};
