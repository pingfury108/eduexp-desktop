import { useState, useEffect } from 'react';
import { GetGlobalConfig, UpdateGlobalConfig, GetConfigInfo, GetEduExpConfig, UpdateEduExpConfig, GetWorkflowConfig, UpdateWorkflowConfig, GetLicenseConfig, UpdateLicenseConfig } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';

interface GlobalSettings {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  autoStart: boolean;
  enableNotifications: boolean;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
  maxLogEntries: number;
}

interface EduExpSettings {
  serverPort: string;
  dataPath: string;
  cacheEnabled: boolean;
  backupEnabled: boolean;
}

interface WorkflowSettings {
  maxConcurrentJobs: number;
  jobTimeout: number;
  retryCount: number;
  workspacePath: string;
}

interface LicenseSettings {
  licenseKey: string;
  expiryDate: string;
  userLimit: number;
  featureFlags: string[];
}

type SettingSection = 'global' | 'eduexp' | 'workflow' | 'license';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>('global');
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    theme: 'light',
    language: 'zh-CN',
    autoStart: false,
    enableNotifications: true,
    logLevel: 'info',
    maxLogEntries: 1000
  });
  
  const [eduexpSettings, setEduexpSettings] = useState<EduExpSettings>({
    serverPort: '8080',
    dataPath: '',
    cacheEnabled: true,
    backupEnabled: true
  });

  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings>({
    maxConcurrentJobs: 5,
    jobTimeout: 300,
    retryCount: 3,
    workspacePath: ''
  });

  const [licenseSettings, setLicenseSettings] = useState<LicenseSettings>({
    licenseKey: '',
    expiryDate: '',
    userLimit: 1,
    featureFlags: []
  });

  const [configInfo, setConfigInfo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // 加载配置数据
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        
        // 使用默认配置值
        setGlobalSettings({
          theme: 'light',
          language: 'zh-CN',
          autoStart: false,
          enableNotifications: true,
          logLevel: 'info',
          maxLogEntries: 1000
        });
        
        setEduexpSettings({
          serverPort: '8080',
          dataPath: '',
          cacheEnabled: true,
          backupEnabled: true
        });

        setWorkflowSettings({
          maxConcurrentJobs: 5,
          jobTimeout: 300,
          retryCount: 3,
          workspacePath: ''
        });

        setLicenseSettings({
          licenseKey: '',
          expiryDate: '',
          userLimit: 1,
          featureFlags: []
        });
        
        // 获取真实的配置信息
        try {
          const configInfo = await GetConfigInfo();
          setConfigInfo(configInfo);
        } catch (error) {
          console.error('Failed to get config info:', error);
          setConfigInfo({
            status: 'Failed to load config info',
            config_dir: '获取失败',
            config_file: '获取失败'
          });
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // 自动保存函数
  const autoSave = async (section: SettingSection, settings: any) => {
    try {
      // 需要将前端的小写字段转换为后端的大写字段
      let backendSettings: any;
      
      switch (section) {
        case 'global':
          backendSettings = {
            Theme: settings.theme,
            Language: settings.language,
            AutoStart: settings.autoStart,
            EnableNotifications: settings.enableNotifications,
            LogLevel: settings.logLevel,
            MaxLogEntries: settings.maxLogEntries
          };
          await UpdateGlobalConfig(backendSettings);
          console.log('Saved global settings:', settings);
          break;
        case 'eduexp':
          backendSettings = {
            ServerPort: settings.serverPort,
            DataPath: settings.dataPath,
            CacheEnabled: settings.cacheEnabled,
            BackupEnabled: settings.backupEnabled
          };
          await UpdateEduExpConfig(backendSettings);
          console.log('Saved eduexp settings:', settings);
          break;
        case 'workflow':
          backendSettings = {
            MaxConcurrentJobs: settings.maxConcurrentJobs,
            JobTimeout: settings.jobTimeout,
            RetryCount: settings.retryCount,
            WorkspacePath: settings.workspacePath
          };
          await UpdateWorkflowConfig(backendSettings);
          console.log('Saved workflow settings:', settings);
          break;
        case 'license':
          backendSettings = {
            LicenseKey: settings.licenseKey,
            ExpiryDate: settings.expiryDate,
            UserLimit: settings.userLimit,
            FeatureFlags: settings.featureFlags
          };
          await UpdateLicenseConfig(backendSettings);
          console.log('Saved license settings:', settings);
          break;
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  // 更新全局设置
  const updateGlobalSetting = <K extends keyof GlobalSettings>(
    key: K,
    value: GlobalSettings[K]
  ) => {
    const newSettings = { ...globalSettings, [key]: value };
    setGlobalSettings(newSettings);
    autoSave('global', newSettings);
  };

  // 更新EduExp设置
  const updateEduExpSetting = <K extends keyof EduExpSettings>(
    key: K,
    value: EduExpSettings[K]
  ) => {
    const newSettings = { ...eduexpSettings, [key]: value };
    setEduexpSettings(newSettings);
    autoSave('eduexp', newSettings);
  };

  // 更新工作流设置
  const updateWorkflowSetting = <K extends keyof WorkflowSettings>(
    key: K,
    value: WorkflowSettings[K]
  ) => {
    const newSettings = { ...workflowSettings, [key]: value };
    setWorkflowSettings(newSettings);
    autoSave('workflow', newSettings);
  };

  // 更新许可设置
  const updateLicenseSetting = <K extends keyof LicenseSettings>(
    key: K,
    value: LicenseSettings[K]
  ) => {
    const newSettings = { ...licenseSettings, [key]: value };
    setLicenseSettings(newSettings);
    autoSave('license', newSettings);
  };



  if (loading) {
    return (
      <div className="flex h-full">
        <div className="flex items-center justify-center flex-1">
          <div className="loading loading-spinner loading-lg"></div>
          <span className="ml-4 text-base-content">加载配置中...</span>
        </div>
      </div>
    );
  }

  // 渲染全局配置
  const renderGlobalSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-base-content mb-6">全局配置</h3>
        <p className="text-base-content opacity-70 mb-8">配置应用程序的基本行为和外观</p>
      </div>

      {/* 主题 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">主题</span>
          </div>
          <select 
            className="select select-bordered w-48 text-base-content"
            value={globalSettings.theme}
            onChange={(e) => updateGlobalSetting('theme', e.target.value as 'light' | 'dark')}
          >
            <option value="light">浅色模式</option>
            <option value="dark">深色模式</option>
          </select>
        </div>
      </div>

      {/* 语言 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">语言</span>
          </div>
          <select 
            className="select select-bordered w-48 text-base-content"
            value={globalSettings.language}
            onChange={(e) => updateGlobalSetting('language', e.target.value as 'zh-CN' | 'en-US')}
          >
            <option value="zh-CN">中文（简体）</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </div>

      {/* 开机自启动 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">开机自启动</span>
            <p className="text-sm text-base-content opacity-70">应用程序随系统启动</p>
          </div>
          <input 
            type="checkbox" 
            className="toggle toggle-primary"
            checked={globalSettings.autoStart}
            onChange={(e) => updateGlobalSetting('autoStart', e.target.checked)}
          />
        </div>
      </div>

      {/* 启用通知 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">启用通知</span>
            <p className="text-sm text-base-content opacity-70">显示系统通知消息</p>
          </div>
          <input 
            type="checkbox" 
            className="toggle toggle-primary"
            checked={globalSettings.enableNotifications}
            onChange={(e) => updateGlobalSetting('enableNotifications', e.target.checked)}
          />
        </div>
      </div>

      {/* 日志级别 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">日志级别</span>
          </div>
          <select 
            className="select select-bordered w-48 text-base-content"
            value={globalSettings.logLevel}
            onChange={(e) => updateGlobalSetting('logLevel', e.target.value as 'debug' | 'info' | 'warning' | 'error')}
          >
            <option value="debug">调试 (Debug)</option>
            <option value="info">信息 (Info)</option>
            <option value="warning">警告 (Warning)</option>
            <option value="error">错误 (Error)</option>
          </select>
        </div>
      </div>

      {/* 最大日志条数 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">最大日志条数</span>
          </div>
          <input
            type="number"
            className="input input-bordered w-48 text-base-content"
            value={globalSettings.maxLogEntries}
            onChange={(e) => updateGlobalSetting('maxLogEntries', parseInt(e.target.value) || 1000)}
            min="100"
            max="10000"
            step="100"
          />
        </div>
      </div>
    </div>
  );

  // 渲染EduExp配置
  const renderEduExpSettings = () => (
    <div className="space-y-0">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-base-content mb-6">EduExp配置</h3>
        <p className="text-base-content opacity-70">配置EduExp模块的服务器和数据设置</p>
      </div>

      {/* 服务器端口 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">服务器端口</span>
          </div>
          <input
            type="text"
            className="input input-bordered w-48 text-base-content"
            value={eduexpSettings.serverPort}
            onChange={(e) => updateEduExpSetting('serverPort', e.target.value)}
            placeholder="8080"
          />
        </div>
      </div>

      {/* 数据目录路径 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">数据目录路径</span>
          </div>
          <input
            type="text"
            className="input input-bordered w-48 text-base-content"
            value={eduexpSettings.dataPath}
            onChange={(e) => updateEduExpSetting('dataPath', e.target.value)}
            placeholder="/path/to/data"
          />
        </div>
      </div>

      {/* 启用缓存 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">启用缓存</span>
            <p className="text-sm text-base-content opacity-70">提高数据访问性能</p>
          </div>
          <input 
            type="checkbox" 
            className="toggle toggle-primary"
            checked={eduexpSettings.cacheEnabled}
            onChange={(e) => updateEduExpSetting('cacheEnabled', e.target.checked)}
          />
        </div>
      </div>

      {/* 启用自动备份 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">启用自动备份</span>
            <p className="text-sm text-base-content opacity-70">定期备份重要数据</p>
          </div>
          <input 
            type="checkbox" 
            className="toggle toggle-primary"
            checked={eduexpSettings.backupEnabled}
            onChange={(e) => updateEduExpSetting('backupEnabled', e.target.checked)}
          />
        </div>
      </div>
    </div>
  );

  // 渲染工作流配置
  const renderWorkflowSettings = () => (
    <div className="space-y-0">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-base-content mb-6">工作流配置</h3>
        <p className="text-base-content opacity-70">配置工作流执行的并发、超时和重试设置</p>
      </div>

      {/* 最大并发任务数 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">最大并发任务数</span>
          </div>
          <input
            type="number"
            className="input input-bordered w-48 text-base-content"
            value={workflowSettings.maxConcurrentJobs}
            onChange={(e) => updateWorkflowSetting('maxConcurrentJobs', parseInt(e.target.value) || 5)}
            min="1"
            max="20"
          />
        </div>
      </div>

      {/* 任务超时时间 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">任务超时时间(秒)</span>
          </div>
          <input
            type="number"
            className="input input-bordered w-48 text-base-content"
            value={workflowSettings.jobTimeout}
            onChange={(e) => updateWorkflowSetting('jobTimeout', parseInt(e.target.value) || 300)}
            min="30"
            max="3600"
          />
        </div>
      </div>

      {/* 重试次数 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">重试次数</span>
          </div>
          <input
            type="number"
            className="input input-bordered w-48 text-base-content"
            value={workflowSettings.retryCount}
            onChange={(e) => updateWorkflowSetting('retryCount', parseInt(e.target.value) || 3)}
            min="0"
            max="10"
          />
        </div>
      </div>

      {/* 工作空间路径 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">工作空间路径</span>
          </div>
          <input
            type="text"
            className="input input-bordered w-48 text-base-content"
            value={workflowSettings.workspacePath}
            onChange={(e) => updateWorkflowSetting('workspacePath', e.target.value)}
            placeholder="/path/to/workspace"
          />
        </div>
      </div>
    </div>
  );

  // 渲染许可配置
  const renderLicenseSettings = () => (
    <div className="space-y-0">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-base-content mb-6">许可配置</h3>
        <p className="text-base-content opacity-70">配置软件许可证和使用限制</p>
      </div>

      {/* 许可证密钥 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">许可证密钥</span>
          </div>
          <input
            type="text"
            className="input input-bordered w-48 text-base-content"
            value={licenseSettings.licenseKey}
            onChange={(e) => updateLicenseSetting('licenseKey', e.target.value)}
            placeholder="输入许可证密钥"
          />
        </div>
      </div>

      {/* 过期日期 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">过期日期</span>
          </div>
          <input
            type="date"
            className="input input-bordered w-48 text-base-content"
            value={licenseSettings.expiryDate}
            onChange={(e) => updateLicenseSetting('expiryDate', e.target.value)}
          />
        </div>
      </div>

      {/* 用户数量限制 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">用户数量限制</span>
          </div>
          <input
            type="number"
            className="input input-bordered w-48 text-base-content"
            value={licenseSettings.userLimit}
            onChange={(e) => updateLicenseSetting('userLimit', parseInt(e.target.value) || 1)}
            min="1"
            max="1000"
          />
        </div>
      </div>

      {/* 版本号 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-base-content">版本号</span>
          <span className="font-medium text-base-content">v1.0.0</span>
        </div>
      </div>

      {/* 构建日期 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-base-content">构建日期</span>
          <span className="font-medium text-base-content">2024-01-20</span>
        </div>
      </div>

      {/* 开发者 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-base-content">开发者</span>
          <span className="font-medium text-base-content">EduExp Team</span>
        </div>
      </div>

      {/* 状态 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-base-content">状态</span>
          <span className="font-medium text-base-content">{configInfo.status || '未知'}</span>
        </div>
      </div>

      {/* 配置目录 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-base-content">配置目录</span>
          <span className="font-medium text-base-content text-sm">{configInfo.config_dir || '未设置'}</span>
        </div>
      </div>

      {/* 配置文件 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <span className="text-base font-medium text-base-content">配置文件</span>
          <span className="font-medium text-base-content text-sm">{configInfo.config_file || '未设置'}</span>
        </div>
      </div>
    </div>
  );

  // 根据当前选中的部分渲染内容
  const renderContent = () => {
    switch (activeSection) {
      case 'global':
        return renderGlobalSettings();
      case 'eduexp':
        return renderEduExpSettings();
      case 'workflow':
        return renderWorkflowSettings();
      case 'license':
        return renderLicenseSettings();
      default:
        return renderGlobalSettings();
    }
  };

  return (
    <div className="flex h-full">
      {/* 左侧导航 */}
      <div className="w-80 bg-base-200 border-r border-base-300 flex flex-col">

        
        <nav className="flex-1 p-4">
          <div className="space-y-2">

            
            <button
              onClick={() => setActiveSection('global')}
              className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                activeSection === 'global'
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-300 text-base-content'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div className="font-medium">全局配置</div>
                  <div className="text-xs opacity-70">主题、语言、系统设置</div>
                </div>
              </div>
            </button>
            

            
            <button
              onClick={() => setActiveSection('eduexp')}
              className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                activeSection === 'eduexp'
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-300 text-base-content'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h4a1 1 0 011 1v5m-6 0V9a1 1 0 011-1h4a1 1 0 011 1v11" />
                </svg>
                <div>
                  <div className="font-medium">EduExp配置</div>
                  <div className="text-xs opacity-70">服务器、数据、缓存设置</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setActiveSection('workflow')}
              className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                activeSection === 'workflow'
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-300 text-base-content'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <div>
                  <div className="font-medium">工作流配置</div>
                  <div className="text-xs opacity-70">任务、超时、重试设置</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setActiveSection('license')}
              className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                activeSection === 'license'
                  ? 'bg-primary text-primary-content'
                  : 'hover:bg-base-300 text-base-content'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                </svg>
                <div>
                  <div className="font-medium">许可配置</div>
                  <div className="text-xs opacity-70">许可证、用户限制设置</div>
                </div>
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* 右侧内容区域 */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 