import { useState, useEffect } from 'react';
import './App.css';
import WorkflowPage from './components/WorkflowPage';
import ApiServerPage from './components/ApiServerPage';
import SettingsPage from './components/SettingsPage';
import { GetGlobalConfig } from '../wailsjs/go/main/App';

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
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'api-server',
      name: 'EduTools',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      )
    }
  ];

  const settingsItem = {
    id: 'settings',
    name: '设置',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
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
