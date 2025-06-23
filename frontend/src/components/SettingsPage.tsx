import { useState } from 'react';

interface AppSettings {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  autoStart: boolean;
  enableNotifications: boolean;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
  maxLogEntries: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'zh-CN',
    autoStart: false,
    enableNotifications: true,
    logLevel: 'info',
    maxLogEntries: 1000
  });

  const [isChanged, setIsChanged] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setIsChanged(true);
  };

  const handleSave = () => {
    // 这里可以调用保存设置的API
    console.log('Saving settings:', settings);
    setIsChanged(false);
    // 显示保存成功的提示
  };

  const handleReset = () => {
    setSettings({
      theme: 'light',
      language: 'zh-CN',
      autoStart: false,
      enableNotifications: true,
      logLevel: 'info',
      maxLogEntries: 1000
    });
    setIsChanged(true);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-base-content mb-2">应用设置</h2>
          <p className="text-base-content opacity-70">配置应用程序的行为和外观</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          
          {/* Appearance Settings */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                外观设置
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-base-content">主题</span>
                  </label>
                  <select 
                    className="select select-bordered w-full text-base-content"
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark')}
                  >
                    <option value="light">浅色模式</option>
                    <option value="dark">深色模式</option>
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-base-content">语言</span>
                  </label>
                  <select 
                    className="select select-bordered w-full text-base-content"
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value as 'zh-CN' | 'en-US')}
                  >
                    <option value="zh-CN">中文（简体）</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Application Settings */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                应用程序设置
              </h3>
              
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label cursor-pointer justify-between">
                    <div className="flex flex-col">
                      <span className="label-text font-medium text-base-content">开机自启动</span>
                      <span className="text-sm text-base-content opacity-70">应用程序随系统启动</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary"
                      checked={settings.autoStart}
                      onChange={(e) => updateSetting('autoStart', e.target.checked)}
                    />
                  </label>
                </div>
                
                <div className="form-control">
                  <label className="label cursor-pointer justify-between">
                    <div className="flex flex-col">
                      <span className="label-text font-medium text-base-content">启用通知</span>
                      <span className="text-sm text-base-content opacity-70">显示系统通知消息</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary"
                      checked={settings.enableNotifications}
                      onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Logging Settings */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                日志设置
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-base-content">日志级别</span>
                  </label>
                  <select 
                    className="select select-bordered w-full text-base-content"
                    value={settings.logLevel}
                    onChange={(e) => updateSetting('logLevel', e.target.value as 'debug' | 'info' | 'warning' | 'error')}
                  >
                    <option value="debug">调试 (Debug)</option>
                    <option value="info">信息 (Info)</option>
                    <option value="warning">警告 (Warning)</option>
                    <option value="error">错误 (Error)</option>
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-base-content">最大日志条数</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full text-base-content"
                    value={settings.maxLogEntries}
                    onChange={(e) => updateSetting('maxLogEntries', parseInt(e.target.value) || 1000)}
                    min="100"
                    max="10000"
                    step="100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-xl mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                关于
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-base-content opacity-70 font-medium">版本号</span>
                  <span className="font-medium text-base-content">v1.0.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content opacity-70 font-medium">构建日期</span>
                  <span className="font-medium text-base-content">2024-01-20</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content opacity-70 font-medium">开发者</span>
                  <span className="font-medium text-base-content">EduExp Team</span>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button className="btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    导出日志
                  </button>
                  <button className="btn btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    检查更新
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isChanged && (
          <div className="fixed bottom-6 right-6 flex gap-3">
            <button 
              className="btn btn-outline text-base-content"
              onClick={handleReset}
            >
              重置
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSave}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              保存设置
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 