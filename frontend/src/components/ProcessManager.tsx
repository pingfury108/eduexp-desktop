import { useState } from 'react';

interface WorkflowService {
  status: 'running' | 'stopped' | 'error';
  port: string;
  startTime?: string;
}

export default function ProcessManager() {
  // 工作流服务状态
  const [workflowService, setWorkflowService] = useState<WorkflowService>({
    status: 'stopped',
    port: '8081'
  });
  
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [tempPort, setTempPort] = useState('8081');
  const [logs, setLogs] = useState<string[]>([
    '2024-01-15 10:30:00 - 工作流服务初始化',
    '2024-01-15 10:30:01 - 正在加载配置文件',
    '2024-01-15 10:30:02 - 服务启动成功，监听端口 8081',
    '2024-01-15 10:30:03 - 等待工作流请求...'
  ]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'running':
        return 'badge badge-success';
      case 'stopped':
        return 'badge badge-warning';
      case 'error':
        return 'badge badge-error';
      default:
        return 'badge badge-neutral';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return '运行中';
      case 'stopped':
        return '已停止';
      case 'error':
        return '错误';
      default:
        return '未知';
    }
  };

  // 工作流服务管理
  const handleStartService = () => {
    // TODO: 调用后端API启动工作流服务
    setWorkflowService({
      ...workflowService,
      status: 'running',
      startTime: new Date().toLocaleString('zh-CN')
    });
    
    // 添加启动日志
    const timestamp = new Date().toLocaleString('zh-CN');
    setLogs(prev => [...prev, `${timestamp} - 工作流服务启动成功`]);
  };

  const handleStopService = () => {
    // TODO: 调用后端API停止工作流服务
    setWorkflowService({
      ...workflowService,
      status: 'stopped',
      startTime: undefined
    });
    
    // 添加停止日志
    const timestamp = new Date().toLocaleString('zh-CN');
    setLogs(prev => [...prev, `${timestamp} - 工作流服务已停止`]);
  };

  const handleUpdatePort = () => {
    setWorkflowService({
      ...workflowService,
      port: tempPort
    });
    setIsPortModalOpen(false);
    
    // 添加端口变更日志
    const timestamp = new Date().toLocaleString('zh-CN');
    setLogs(prev => [...prev, `${timestamp} - 端口已变更为 ${tempPort}`]);
  };

  const openPortModal = () => {
    setTempPort(workflowService.port);
    setIsPortModalOpen(true);
  };

  const openLogModal = () => {
    setIsLogModalOpen(true);
  };

  return (
    <>
      {/* 工作流服务状态卡片 */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">服务端口</div>
              <div className="stat-value text-2xl">{workflowService.port}</div>
              <div className="stat-actions">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={openPortModal}
                >
                  修改端口
                </button>
              </div>
            </div>
            
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">运行状态</div>
              <div className="stat-value text-2xl">
                <span className={`text-${workflowService.status === 'running' ? 'success' : 'warning'}`}>
                  {getStatusText(workflowService.status)}
                </span>
              </div>
            </div>
            
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">日志查看</div>
              <div className="stat-value text-lg">
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={openLogModal}
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
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10l6 6m0-6l-6 6" />
                </svg>
                停止服务
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={handleStartService}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10v18a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                启动服务
              </button>
            )}
            
            <button
              className="btn btn-outline"
              onClick={() => window.open(`http://localhost:${workflowService.port}`, '_blank')}
              disabled={workflowService.status !== 'running'}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              访问服务
            </button>
          </div>
        </div>
      </div>

      {/* 端口配置模态框 */}
      {isPortModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">修改服务端口</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium text-base-content">端口号</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={tempPort}
                onChange={(e) => setTempPort(e.target.value)}
                placeholder="输入端口号"
                min="1024"
                max="65535"
              />
              <label className="label">
                <span className="label-text-alt text-base-content opacity-70">端口范围: 1024-65535</span>
              </label>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-outline text-base-content"
                onClick={() => setIsPortModalOpen(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleUpdatePort}
                disabled={!tempPort || parseInt(tempPort) < 1024 || parseInt(tempPort) > 65535}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 日志查看模态框 */}
      {isLogModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl h-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">工作流服务日志</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setIsLogModalOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-base-300 rounded-lg p-4 font-mono text-sm overflow-y-auto h-64">
              {logs.map((log, index) => (
                <div key={index} className="mb-1 text-base-content">
                  {log}
                </div>
              ))}
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-outline"
                onClick={() => setLogs([])}
              >
                清空日志
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setIsLogModalOpen(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 