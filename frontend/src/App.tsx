import { useState, useEffect } from 'react';
import './App.css';
import WorkflowPage from './components/WorkflowPage';
import ApiServerPage from './components/ApiServerPage';
import SettingsPage from './components/SettingsPage';
import { GetGlobalConfig } from '../wailsjs/go/main/App';
import { FileText, Server, Settings } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('api-server');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');

  // 加载并应用主题设置
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const globalConfig = await GetGlobalConfig();
        const theme = globalConfig.Theme || 'light';
        setCurrentTheme(theme);
        document.documentElement.setAttribute('data-theme', theme);
      } catch (error) {
        console.error('Failed to load theme:', error);
        // 使用默认主题
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    loadTheme();
  }, []);

  const navigationItems = [
    {
      id: 'workflow',
      name: '工作流',
      icon: <FileText className="w-5 h-5 flex-shrink-0" />
    },
    {
      id: 'api-server',
      name: 'EduTools',
      icon: <Server className="w-5 h-5 flex-shrink-0" />
    }
  ];

  const settingsItem = {
    id: 'settings',
    name: '设置',
    icon: <Settings className="w-5 h-5 flex-shrink-0" />
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'workflow':
        return <WorkflowPage />;
      case 'api-server':
        return <ApiServerPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ApiServerPage />;
    }
  };

  return (
    <div className="flex h-screen bg-base-200">
      {/* Left Sidebar */}
      <div className={`bg-base-100 shadow-lg transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Collapse Toggle Button */}
        <div className="p-4 border-b border-base-300">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="btn btn-outline btn-sm w-full flex justify-center text-base-content border-base-content/20 hover:bg-base-200 hover:border-base-content/40"
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 text-base-content ${sidebarCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-content' 
                    : 'hover:bg-base-200 text-base-content'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && <span className="font-medium text-base-content">{item.name}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Settings at Bottom */}
        <div className="p-2 border-t border-base-300">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'settings' 
                ? 'bg-primary text-primary-content' 
                : 'hover:bg-base-200 text-base-content'
            }`}
            title={sidebarCollapsed ? settingsItem.name : undefined}
          >
            {settingsItem.icon}
            {!sidebarCollapsed && <span className="font-medium text-base-content">{settingsItem.name}</span>}
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
