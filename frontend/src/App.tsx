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

  return (
    <div id="App">
      <div className="server-controls">
        <div id="input" className="input-box">
          <input
        id="port"
        className="input"
        onChange={updatePort}
            value={port}
            autoComplete="off"
        type="number"
        placeholder="Enter port number"
        disabled={isRunning}
        />
          <button
            className={`btn ${isRunning ? 'btn-disabled' : 'btn-start'}`}
      onClick={startServer}
            disabled={isRunning}
            >
              Start Server
                </button>
                  <button
                  className={`btn ${!isRunning ? 'btn-disabled' : 'btn-stop'}`}
            onClick={stopServer}
            disabled={!isRunning}
            >
              Stop Server
                </button>
        </div>
              <div className="status-box">
                <span>Status: </span>
          <span className={`status ${serverStatus.toLowerCase()}`}>
            {serverStatus}
    </span>
      <button className="btn btn-logs" onClick={fetchLogs}>
        Refresh Logs
          </button>
        </div>
        </div>
      <div id="result" className="result">{resultText}</div>
        <div className="logs-container">
          <h3>Server Logs:</h3>
            <div className="logs-output">
              {serverLogs.map((log, index) => (
            <div key={index} className="log-entry">
              {log}
              </div>
              ))}
        </div>
      </div>
    </div>
              );
}

export default App;
