import { useState, useEffect } from 'react';
import { 
  GetRegisteredProcesses,
  GetAllProcessStatus,
  StartProcess, 
  StopProcess, 
  GetProcessStatus, 
  GetProcessOutput,
  StartWorkflowUI,
  GetEduExpConfig,
  UpdateEduExpConfig
} from '../../wailsjs/go/main/App';

interface ProcessInfo {
  name: string;
  displayName: string;
  status: 'running' | 'stopped' | 'error';
  startTime?: string;
  hasSpecialStart?: boolean; // 是否有特殊启动方法
}

export default function ProcessManager() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorProcessName, setErrorProcessName] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalPort, setGlobalPort] = useState('8081');

  // 进程显示名称映射
  const getDisplayName = (processName: string): string => {
    const nameMap: Record<string, string> = {
      'workflowui': 'WorkflowUI 服务',
      'edu-tools': 'EduTools 工具',
      'caddy-fileserver': 'Caddy 文件服务器'
    };
    return nameMap[processName] || processName;
  };

  // 检查是否有特殊启动方法
  const hasSpecialStartMethod = (processName: string): boolean => {
    return processName === 'workflowui';
  };

  // 加载已注册的进程列表
  const loadProcesses = async () => {
    try {
      const processNames = await GetRegisteredProcesses();
      const processInfos: ProcessInfo[] = processNames.map(name => ({
        name,
        displayName: getDisplayName(name),
        status: 'stopped' as const,
        hasSpecialStart: hasSpecialStartMethod(name)
      }));
      setProcesses(processInfos);
      
      // 设置默认选中第一个进程
      if (processInfos.length > 0 && !selectedProcess) {
        setSelectedProcess(processInfos[0].name);
      }
    } catch (error) {
      console.error('Failed to load processes:', error);
    }
  };

  // 检查所有进程状态
  const checkAllProcessStatus = async () => {
    try {
      const statusMap = await GetAllProcessStatus();
      setProcesses(prev => prev.map(process => {
        const statusText = statusMap[process.name] || 'unknown';
        let status: 'running' | 'stopped' | 'error' = 'stopped';
        
        if (statusText.includes('running') || statusText.includes('started')) {
          status = 'running';
        } else if (statusText.includes('not running') || statusText.includes('stopped')) {
          status = 'stopped';
        } else if (statusText.includes('error') || statusText.includes('failed')) {
          status = 'error';
        }
        
        return { ...process, status };
      }));
    } catch (error) {
      console.error('Failed to check process status:', error);
    }
  };

  // 获取指定进程的日志
  const fetchProcessLogs = async (processName: string) => {
    try {
      const output = await GetProcessOutput(processName);
      if (output && output.trim()) {
        const logLines = output.split('\n').filter((line: string) => line.trim());
        setLogs(logLines);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    }
  };

  // 加载全局端口配置
  const loadGlobalPort = async () => {
    try {
      // 使用默认端口，因为端口配置已从EduExp配置中移除
      setGlobalPort('8080');
    } catch (error) {
      console.error('Failed to load global port:', error);
    }
  };

  // 初始化和定期检查
  useEffect(() => {
    loadProcesses();
    loadGlobalPort();
    checkAllProcessStatus();
    
    const statusInterval = setInterval(checkAllProcessStatus, 3000); // 每3秒检查状态
    return () => clearInterval(statusInterval);
  }, []);

  // 启动进程
  const handleStartProcess = async (processName: string) => {
    setIsLoading(true);
    try {
      let result: string;
      
      if (processName === 'workflowui') {
        // WorkflowUI 使用特殊启动方法
        result = await StartWorkflowUI([]);
      } else {
        // 其他进程使用通用启动方法
        result = await StartProcess(processName, []);
      }
      
      if (result.includes('successfully') || result.includes('started')) {
        // 更新本地状态
        setProcesses(prev => prev.map(p => 
          p.name === processName 
            ? { ...p, status: 'running', startTime: new Date().toLocaleString('zh-CN') }
            : p
        ));
        
        // 立即检查状态
        setTimeout(checkAllProcessStatus, 1000);
      } else {
        // 启动失败，更新状态为错误
        setProcesses(prev => prev.map(p => 
          p.name === processName 
            ? { ...p, status: 'error', startTime: undefined }
            : p
        ));
        
        // 显示错误信息
        const errorMsg = result.startsWith('ERROR:') ? result : `启动失败: ${result}`;
        setErrorMessage(errorMsg);
        setErrorProcessName(processName);
        setIsErrorModalOpen(true);
        
        console.error(`Failed to start ${processName}:`, result);
      }
    } catch (error) {
      // 异常情况，更新状态为错误
      setProcesses(prev => prev.map(p => 
        p.name === processName 
          ? { ...p, status: 'error', startTime: undefined }
          : p
      ));
      
      setErrorMessage(`启动 ${processName} 时发生异常: ${error}`);
      setErrorProcessName(processName);
      setIsErrorModalOpen(true);
      console.error(`Error starting ${processName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // 停止进程
  const handleStopProcess = async (processName: string) => {
    setIsLoading(true);
    try {
      const result = await StopProcess(processName);
      
      if (result.includes('stopped') || result.includes('successfully')) {
        // 更新本地状态
        setProcesses(prev => prev.map(p => 
          p.name === processName 
            ? { ...p, status: 'stopped', startTime: undefined }
            : p
        ));
        
        // 立即检查状态
        setTimeout(checkAllProcessStatus, 1000);
      } else {
        console.error(`Failed to stop ${processName}:`, result);
      }
    } catch (error) {
      console.error(`Error stopping ${processName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // 打开日志模态框
  const openLogModal = (processName: string) => {
    setSelectedProcess(processName);
    setIsLogModalOpen(true);
    fetchProcessLogs(processName);
  };

  // 获取状态样式
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

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <>
      {/* 进程管理主界面 */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            进程管理
          </h2>

          {/* 进程状态总览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">已注册进程</div>
              <div className="stat-value text-2xl">{processes.length}</div>
              <div className="stat-desc">个服务进程</div>
            </div>
            
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">运行中进程</div>
              <div className="stat-value text-2xl text-success">
                {processes.filter(p => p.status === 'running').length}
              </div>
              <div className="stat-desc">个进程正在运行</div>
            </div>
            
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title">全局配置</div>
              <div className="stat-value text-lg">端口: {globalPort}</div>
              <div className="stat-desc">默认服务端口</div>
            </div>
          </div>

          {/* 进程列表 */}
          {processes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔧</div>
              <p className="text-base-content opacity-70">暂无注册的进程</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>进程名称</th>
                    <th>状态</th>
                    <th>启动时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((process) => (
                    <tr key={process.name} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                              <span className="text-xs">{process.displayName.charAt(0)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-base-content">{process.displayName}</div>
                            <div className="text-xs text-base-content opacity-50">{process.name}</div>
                            {process.hasSpecialStart && (
                              <div className="badge badge-outline badge-xs">特殊配置</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={getStatusBadgeClass(process.status)}>
                            {getStatusText(process.status)}
                          </span>
                          {isLoading && <span className="loading loading-spinner loading-sm"></span>}
                        </div>
                      </td>
                      <td>
                        {process.startTime ? (
                          <span className="text-sm text-base-content opacity-70">{process.startTime}</span>
                        ) : (
                          <span className="text-base-content opacity-50">未启动</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {process.status === 'running' ? (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleStopProcess(process.name)}
                              disabled={isLoading}
                            >
                              停止
                            </button>
                          ) : (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleStartProcess(process.name)}
                              disabled={isLoading}
                            >
                              启动
                            </button>
                          )}
                          
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openLogModal(process.name)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            日志
                          </button>

                          {process.name === 'workflowui' && process.status === 'running' && (
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => window.open(`http://localhost:${globalPort}`, '_blank')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              访问
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 全局操作按钮 */}
          <div className="flex gap-4 mt-6 flex-wrap">
            <button
              className="btn btn-info btn-outline"
              onClick={checkAllProcessStatus}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新状态
            </button>
            
            <button
              className="btn btn-outline"
              onClick={loadProcesses}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新加载进程列表
            </button>
          </div>
        </div>
      </div>

      {/* 错误信息弹窗 */}
      {isErrorModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-error">进程启动失败</h3>
                <p className="text-sm opacity-70">
                  {errorProcessName && getDisplayName(errorProcessName)} 进程启动时遇到错误
                </p>
              </div>
            </div>
            
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2">错误详情：</h4>
              <div className="text-sm font-mono whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                {errorMessage}
              </div>
            </div>
            
            <div className="flex gap-2 text-sm opacity-70 mb-4">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p>请检查以下可能的原因：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>可执行文件是否存在于 bin 目录</li>
                  <li>配置文件是否正确</li>
                  <li>端口是否被占用</li>
                  <li>是否有足够的权限</li>
                  <li>进程依赖的服务是否正常</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  if (errorProcessName) {
                    openLogModal(errorProcessName);
                    setIsErrorModalOpen(false);
                  }
                }}
                disabled={!errorProcessName}
              >
                查看日志
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  if (errorProcessName) {
                    handleStartProcess(errorProcessName);
                    setIsErrorModalOpen(false);
                  }
                }}
                disabled={!errorProcessName || isLoading}
              >
                重试启动
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsErrorModalOpen(false)}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 日志查看模态框 */}
      {isLogModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl h-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {selectedProcess && getDisplayName(selectedProcess)} - 进程日志
              </h3>
              <div className="flex gap-2">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => fetchProcessLogs(selectedProcess)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  刷新
                </button>
                <button 
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={() => setIsLogModalOpen(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="bg-base-300 rounded-lg p-4 font-mono text-sm overflow-y-auto h-64">
              {logs.length === 0 ? (
                <div className="text-base-content opacity-50 text-center py-8">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  暂无日志输出
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1 text-base-content whitespace-pre-wrap">
                    <span className="text-base-content opacity-60">{(index + 1).toString().padStart(3, '0')} |</span> {log}
                  </div>
                ))
              )}
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-outline"
                onClick={clearLogs}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
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