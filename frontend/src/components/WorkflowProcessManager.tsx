import { useState, useEffect } from 'react';
import { 
  StartWorkflowUI, 
  StopWorkflowUI, 
  GetWorkflowUIStatus, 
  GetWorkflowUIOutput,
  GetEduExpConfig,
  UpdateEduExpConfig
} from '../../wailsjs/go/main/App';

interface WorkflowService {
  status: 'running' | 'stopped' | 'error';
  port: string;
  startTime?: string;
}

export default function WorkflowProcessManager() {
  const [workflowService, setWorkflowService] = useState<WorkflowService>({
    status: 'stopped',
    port: '8081'
  });
  
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [tempPort, setTempPort] = useState('8081');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPortFromConfig = async () => {
    try {
      const eduExpConfig = await GetEduExpConfig();
      if (eduExpConfig && eduExpConfig.ServerPort) {
        setWorkflowService(prev => ({ ...prev, port: eduExpConfig.ServerPort }));
        setTempPort(eduExpConfig.ServerPort);
      }
    } catch (error) {
      console.error('Failed to load port from config:', error);
    }
  };

  const checkProcessStatus = async () => {
    try {
      const status = await GetWorkflowUIStatus();
      if (status.includes('running') || status.includes('started')) {
        setWorkflowService(prev => ({ ...prev, status: 'running' }));
      } else if (status.includes('not running') || status.includes('stopped')) {
        setWorkflowService(prev => ({ ...prev, status: 'stopped' }));
      } else {
        setWorkflowService(prev => ({ ...prev, status: 'error' }));
      }
    } catch (error) {
      setWorkflowService(prev => ({ ...prev, status: 'error' }));
    }
  };

  const fetchLogs = async () => {
    try {
      const output = await GetWorkflowUIOutput();
      if (output && output.trim()) {
        const logLines = output.split('\n').filter((line: string) => line.trim());
        setLogs(logLines);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  useEffect(() => {
    loadPortFromConfig();
    checkProcessStatus();
    
    const interval = setInterval(checkProcessStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartService = async () => {
    setIsLoading(true);
    try {
      const result = await StartWorkflowUI([]);
      if (result.includes('successfully') || result.includes('started')) {
        setWorkflowService(prev => ({ ...prev, status: 'running', startTime: new Date().toLocaleString() }));
      }
    } catch (error) {
      console.error('Error starting WorkflowUI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopService = async () => {
    setIsLoading(true);
    try {
      await StopWorkflowUI();
      setWorkflowService(prev => ({ ...prev, status: 'stopped', startTime: undefined }));
    } catch (error) {
      console.error('Error stopping WorkflowUI:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title text-xl mb-4">
          WorkflowUI 服务管理
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">服务端口</div>
            <div className="stat-value text-2xl">{workflowService.port}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">运行状态</div>
            <div className="stat-value text-xl">
              <span className={
                workflowService.status === 'running' ? 'badge badge-success' :
                workflowService.status === 'stopped' ? 'badge badge-warning' : 'badge badge-error'
              }>
                {workflowService.status === 'running' ? '运行中' : 
                 workflowService.status === 'stopped' ? '已停止' : '错误'}
              </span>
            </div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">服务日志</div>
            <div className="stat-value text-lg">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setIsLogModalOpen(true);
                  fetchLogs();
                }}
              >
                查看日志
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {workflowService.status === 'running' ? (
            <button
              className="btn btn-warning"
              onClick={handleStopService}
              disabled={isLoading}
            >
              {isLoading && <span className="loading loading-spinner loading-sm mr-2"></span>}
              停止服务
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleStartService}
              disabled={isLoading}
            >
              {isLoading && <span className="loading loading-spinner loading-sm mr-2"></span>}
              启动服务
            </button>
          )}
          
          <button
            className="btn btn-outline"
            onClick={() => window.open(`http://localhost:${workflowService.port}`, '_blank')}
            disabled={workflowService.status !== 'running'}
          >
            访问服务
          </button>
        </div>
      </div>

      {/* 日志模态框 */}
      {isLogModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">WorkflowUI 日志</h3>
            <div className="bg-base-300 rounded p-4 font-mono text-sm h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-8 opacity-50">暂无日志输出</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setIsLogModalOpen(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 