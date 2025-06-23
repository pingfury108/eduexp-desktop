import { useState, useEffect } from 'react';
import './App.css';
import { StartGinServer, StopGinServer, GetServerOutput, GetServerStatus } from "../wailsjs/go/main/App";

function App() {
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
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Bar */}
        <div className="navbar bg-base-100 rounded-box shadow-lg mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-base-content">
              Gin Server Manager
            </h1>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-base-content/70 text-lg">
            Manage your Gin web server with ease
          </p>
        </div>

        {/* Main Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Server Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Port Number</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={port}
                  onChange={updatePort}
                  placeholder="Enter port number"
                  disabled={isRunning}
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Server Status</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className={getStatusBadgeClass()}>
                    {serverStatus}
                  </span>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={fetchLogs}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
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
                Start Server
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
                Stop Server
              </button>
            </div>

            {/* Result Alert */}
            <div className="alert alert-info mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{resultText}</span>
            </div>

            {/* Server Logs */}
            <div className="card bg-base-200">
              <div className="card-header p-4 border-b border-base-300">
                <h3 className="card-title text-lg font-semibold">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Server Logs
                </h3>
              </div>
              <div className="card-body p-4">
                <div className="mockup-code bg-base-300 max-h-96 overflow-y-auto">
                  {serverLogs.length > 0 ? (
                    serverLogs.map((log, index) => (
                      <pre key={index} className="text-sm">
                        <code className="text-base-content/80">{log}</code>
                      </pre>
                    ))
                  ) : (
                    <pre className="text-sm">
                      <code className="text-base-content/60">No logs available</code>
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
