import { useState, useEffect } from 'react';
import { GetWorkflowUIStatus } from '../../wailsjs/go/main/App';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ServiceStatusIndicatorProps {
  className?: string;
  showText?: boolean;
}

export default function ServiceStatusIndicator({ 
  className = '', 
  showText = true 
}: ServiceStatusIndicatorProps) {
  const [status, setStatus] = useState<'running' | 'stopped' | 'error'>('stopped');
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const statusText = await GetWorkflowUIStatus();
      if (statusText.includes('running') || statusText.includes('started')) {
        setStatus('running');
      } else if (statusText.includes('not running') || statusText.includes('stopped')) {
        setStatus('stopped');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000); // 每10秒检查一次
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          color: 'text-success',
          bgColor: 'bg-success',
          text: '服务运行中',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'stopped':
        return {
          color: 'text-warning',
          bgColor: 'bg-warning',
          text: '服务已停止',
          icon: <XCircle className="w-4 h-4" />
        };
      case 'error':
        return {
          color: 'text-error',
          bgColor: 'bg-error',
          text: '服务异常',
          icon: <AlertCircle className="w-4 h-4" />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${config.bgColor}`}></div>
        {isChecking && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-base-content opacity-30 animate-ping"></div>
        )}
      </div>
      
      {showText && (
        <div className="flex items-center gap-1">
          <span className={`${config.color} text-sm font-medium`}>
            {config.icon}
          </span>
          <span className="text-sm text-base-content opacity-70">
            {config.text}
          </span>
        </div>
      )}
    </div>
  );
} 