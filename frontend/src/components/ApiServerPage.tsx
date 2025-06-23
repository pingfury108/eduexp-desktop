import { useState, useEffect } from 'react';
import { StartGinServer, StopGinServer, GetServerOutput, GetServerStatus } from "../../wailsjs/go/main/App";

export default function ApiServerPage() {
  const [resultText, setResultText] = useState("Enter a port number and click Start Server");
  const [port, setPort] = useState('8080');
  const [serverStatus, setServerStatus] = useState('stopped');
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updatePort = (e: React.ChangeEvent<HTMLInputElement>) => setPort(e.target.value);

  // Function to fetch server status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        GetServerStatus()
          .then((status: string) => setServerStatus(status))
          .catch(() => setServerStatus('unknown'));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning]);

  async function startServer() {
    try {
      const message = await StartGinServer(port);
      setResultText(message);
      setIsRunning(true);
      await fetchLogs();
    } catch (error) {
      setResultText(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function stopServer() {
    try {
      const message = await StopGinServer();
      setResultText(message);
      setIsRunning(false);
      await fetchLogs();
    } catch (error) {
      setResultText(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function fetchLogs() {
    try {
      const logs = await GetServerOutput();
      setServerLogs(logs.split('\n').filter(line => line.trim() !== ''));
    } catch (error) {
      setServerLogs([`Error fetching logs: ${error instanceof Error ? error.message : String(error)}`]);
    }
  }

  const getStatusBadgeClass = () => {
    switch (serverStatus.toLowerCase()) {
      case 'running':
        return 'badge badge-success';
      case 'stopped':
        return 'badge badge-error';
      default:
        return 'badge badge-warning';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-base-content mb-2">API服务器管理</h2>
          <p className="text-base-content opacity-70">管理您的 Gin Web 服务器</p>
        </div>

        {/* Server Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat bg-base-100 shadow-lg rounded-lg">
            <div className="stat-figure text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <div className="stat-title">服务器状态</div>
            <div className={`stat-value ${serverStatus === 'running' ? 'text-success' : 'text-error'}`}>
              {serverStatus === 'running' ? '运行中' : '已停止'}
            </div>
          </div>
          
          <div className="stat bg-base-100 shadow-lg rounded-lg">
            <div className="stat-figure text-info">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m16-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div className="stat-title">端口</div>
            <div className="stat-value text-info">{port}</div>
          </div>
          
          <div className="stat bg-base-100 shadow-lg rounded-lg">
            <div className="stat-figure text-secondary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="stat-title">日志条数</div>
            <div className="stat-value text-secondary">{serverLogs.length}</div>
          </div>
        </div>

        {/* Main Controls Card */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title text-xl mb-4">服务器控制</h3>
            
            {/* Server Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-base-content">端口号</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full text-base-content"
                  value={port}
                  onChange={updatePort}
                  placeholder="输入端口号"
                  disabled={isRunning}
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-base-content">服务器状态</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className={getStatusBadgeClass()}>
                    {serverStatus === 'running' ? '运行中' : serverStatus === 'stopped' ? '已停止' : '未知'}
                  </span>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={fetchLogs}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    刷新
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                className={`btn flex-1 ${isRunning ? 'btn-disabled' : 'btn-success'}`}
                onClick={startServer}
                disabled={isRunning}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                启动服务器
              </button>
              <button
                className={`btn flex-1 ${!isRunning ? 'btn-disabled' : 'btn-error'}`}
                onClick={stopServer}
                disabled={!isRunning}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                </svg>
                停止服务器
              </button>
            </div>

            {/* Result Alert */}
            <div className={`alert ${serverStatus === 'running' ? 'alert-success' : 'alert-info'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{resultText}</span>
            </div>
          </div>
        </div>

        {/* Server Logs Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-header p-4 border-b border-base-300">
            <div className="flex justify-between items-center">
              <h3 className="card-title text-lg font-semibold">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                服务器日志
              </h3>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setServerLogs([])}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                清空日志
              </button>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="mockup-code bg-base-300 max-h-96 overflow-y-auto">
              {serverLogs.length > 0 ? (
                                  serverLogs.map((log, index) => (
                    <pre key={index} className="text-sm">
                      <code className="text-base-content opacity-80">{log}</code>
                    </pre>
                  ))
                ) : (
                  <pre className="text-sm">
                    <code className="text-base-content opacity-60">暂无日志信息</code>
                  </pre>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 