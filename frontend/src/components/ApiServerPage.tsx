import { useState, useEffect } from 'react';
import { StartEduTools, StopEduTools, GetEduToolsStatus, GetEduToolsOutput, GetEduExpConfig, UpdateEduExpConfig } from "../../wailsjs/go/main/App";

interface EduToolsService {
  status: 'running' | 'stopped' | 'error';
  port: string;
  startTime?: string;
}

export default function ApiServerPage() {
  // EduTools 服务状态管理
  const [eduToolsService, setEduToolsService] = useState<EduToolsService>({
    status: 'stopped',
    port: '8080'
  });
  
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [tempPort, setTempPort] = useState('8080');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // EduTools 状态检查
  const checkEduToolsStatus = async () => {
    try {
      const status = await GetEduToolsStatus();
      if (status.includes('running') || status.includes('started')) {
        setEduToolsService(prev => ({ ...prev, status: 'running' }));
      } else if (status.includes('not running') || status.includes('stopped')) {
        setEduToolsService(prev => ({ ...prev, status: 'stopped' }));
      } else {
        setEduToolsService(prev => ({ ...prev, status: 'error' }));
      }
    } catch (error) {
      setEduToolsService(prev => ({ ...prev, status: 'error' }));
    }
  };

  // EduTools 日志获取
  const fetchEduToolsLogs = async () => {
    try {
      const output = await GetEduToolsOutput();
      if (output && output.trim()) {
        const logLines = output.split('\n').filter((line: string) => line.trim());
        setLogs(logLines);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  // 从配置加载端口号
  const loadPortFromConfig = async () => {
    try {
      const eduExpConfig = await GetEduExpConfig();
      const port = eduExpConfig.EduToolsPort || '8080';
      setEduToolsService(prev => ({ ...prev, port }));
      setTempPort(port);
    } catch (error) {
      console.error('Failed to load port from config:', error);
      // 使用默认端口
      setEduToolsService(prev => ({ ...prev, port: '8080' }));
      setTempPort('8080');
    }
  };

  const savePortConfig = async () => {
    try {
      // 获取当前EduExp配置
      const currentConfig = await GetEduExpConfig();
      
      // 创建更新的配置对象
      const updatedConfig = {
        ArkApiKey: currentConfig.ArkApiKey,
        ArkModeModel: currentConfig.ArkModeModel,
        ArkOcrModeModel: currentConfig.ArkOcrModeModel,
        ArkTextModeModel: currentConfig.ArkTextModeModel,
        EduToolsPort: tempPort
      };
      
      // 保存到配置
      const result = await UpdateEduExpConfig(updatedConfig as any);
      if (result.includes('successfully')) {
        setEduToolsService(prev => ({ ...prev, port: tempPort }));
        setIsPortModalOpen(false);
      } else {
        console.error('Failed to save port config:', result);
      }
    } catch (error) {
      console.error('Failed to save port config:', error);
    }
  };

  // EduTools 状态定期检查
  useEffect(() => {
    loadPortFromConfig();
    checkEduToolsStatus();
    const interval = setInterval(checkEduToolsStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // EduTools 启动
  const handleStartEduTools = async () => {
    setIsLoading(true);
    try {
      const result = await StartEduTools([]);
      if (result.includes('successfully') || result.includes('started')) {
        setEduToolsService(prev => ({ ...prev, status: 'running', startTime: new Date().toLocaleString() }));
        await fetchEduToolsLogs();
      } else {
        setEduToolsService(prev => ({ ...prev, status: 'error' }));
        
        const errorMsg = result.startsWith('ERROR:') ? result : `启动失败: ${result}`;
        setErrorMessage(errorMsg);
        setIsErrorModalOpen(true);
        
        console.error('Failed to start EduTools:', result);
      }
    } catch (error) {
      console.error('Error starting EduTools:', error);
      setEduToolsService(prev => ({ ...prev, status: 'error' }));
      setErrorMessage(`启动 EduTools 时发生异常: ${error}`);
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // EduTools 停止
  const handleStopEduTools = async () => {
    setIsLoading(true);
    try {
      await StopEduTools();
      setEduToolsService(prev => ({ ...prev, status: 'stopped', startTime: undefined }));
      await fetchEduToolsLogs();
    } catch (error) {
      console.error('Error stopping EduTools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        {/* EduTools 服务管理 */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              EduTools 服务管理
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">服务端口</div>
                <div className="stat-value text-2xl flex items-center gap-2">
                  {eduToolsService.port}
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsPortModalOpen(true)}
                    title="编辑端口"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">运行状态</div>
                <div className="stat-value text-xl">
                  <span className={
                    eduToolsService.status === 'running' ? 'badge badge-success' :
                    eduToolsService.status === 'stopped' ? 'badge badge-warning' : 'badge badge-error'
                  }>
                    {eduToolsService.status === 'running' ? '运行中' : 
                     eduToolsService.status === 'stopped' ? '已停止' : '错误'}
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
                      fetchEduToolsLogs();
                    }}
                  >
                    查看日志
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {eduToolsService.status === 'running' ? (
                <button
                  className="btn btn-warning"
                  onClick={handleStopEduTools}
                  disabled={isLoading}
                >
                  {isLoading && <span className="loading loading-spinner loading-sm mr-2"></span>}
                  停止服务
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={handleStartEduTools}
                  disabled={isLoading}
                >
                  {isLoading && <span className="loading loading-spinner loading-sm mr-2"></span>}
                  启动服务
                </button>
              )}
              
              <button
                className="btn btn-outline"
                onClick={() => {
                  const url = `http://localhost:${eduToolsService.port}`;
                  console.log('尝试打开URL:', url);
                  
                  // 尝试打开新窗口
                  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                  
                  // 检查是否成功打开 - 延迟检查以避免误判
                  setTimeout(() => {
                    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                      // 如果弹窗被阻止，显示URL模态框
                      setIsUrlModalOpen(true);
                    }
                  }, 500);
                }}
                disabled={eduToolsService.status !== 'running'}
                title={eduToolsService.status !== 'running' ? '服务未运行' : `访问 http://localhost:${eduToolsService.port}`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                访问服务
              </button>
            </div>
          </div>

          {/* 日志模态框 */}
          {isLogModalOpen && (
            <div className="modal modal-open">
              <div className="modal-box max-w-4xl">
                <h3 className="font-bold text-lg mb-4">EduTools 日志</h3>
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

          {/* 端口编辑模态框 */}
          {isPortModalOpen && (
            <div className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">编辑服务端口</h3>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">端口号</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={tempPort}
                    onChange={(e) => setTempPort(e.target.value)}
                    placeholder="请输入端口号"
                    min="1"
                    max="65535"
                  />
                  <label className="label">
                    <span className="label-text-alt">端口范围：1-65535</span>
                  </label>
                </div>
                <div className="modal-action">
                  <button 
                    className="btn btn-primary" 
                    onClick={savePortConfig}
                    disabled={!tempPort || parseInt(tempPort) < 1 || parseInt(tempPort) > 65535}
                  >
                    保存
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => {
                      setIsPortModalOpen(false);
                      setTempPort(eduToolsService.port);
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    <h3 className="font-bold text-lg text-error">启动失败</h3>
                    <p className="text-sm opacity-70">EduTools 进程启动时遇到错误</p>
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
                    </ul>
                  </div>
                </div>
                
                <div className="modal-action">
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      setIsLogModalOpen(true);
                      fetchEduToolsLogs();
                      setIsErrorModalOpen(false);
                    }}
                  >
                    查看日志
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

          {/* URL访问模态框 */}
          {isUrlModalOpen && (
            <div className="modal modal-open">
              <div className="modal-box">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-info">访问服务</h3>
                    <p className="text-sm opacity-70">浏览器可能阻止了弹窗，请手动访问服务</p>
                  </div>
                </div>
                
                <div className="bg-base-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-sm mb-2">服务地址：</h4>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      className="input input-bordered flex-1 font-mono text-sm"
                      value={`http://localhost:${eduToolsService.port}`}
                      readOnly
                    />
                    <button 
                      className="btn btn-square btn-outline btn-sm"
                      onClick={() => {
                        const url = `http://localhost:${eduToolsService.port}`;
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(url).then(() => {
                            alert('地址已复制到剪贴板！');
                          }).catch(err => {
                            console.error('复制失败:', err);
                            alert('复制失败，请手动复制地址');
                          });
                        } else {
                          alert('浏览器不支持自动复制，请手动复制地址');
                        }
                      }}
                      title="复制地址"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="alert alert-info mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">
                    如果无法访问服务，请检查：
                    <br />• 服务是否正常运行
                    <br />• 端口 {eduToolsService.port} 是否被占用
                    <br />• 防火墙是否允许该端口
                  </span>
                </div>
                
                <div className="modal-action">
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      const url = `http://localhost:${eduToolsService.port}`;
                      window.location.href = url;
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    在当前页面访问
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      const url = `http://localhost:${eduToolsService.port}`;
                      try {
                        window.open(url, '_blank', 'noopener,noreferrer');
                      } catch (error) {
                        console.error('打开新窗口失败:', error);
                      }
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    重试新窗口
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setIsUrlModalOpen(false)}
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 