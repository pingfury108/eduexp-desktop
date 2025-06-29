import { useState, useEffect } from 'react';
import { GetGlobalConfig, UpdateGlobalConfig, GetConfigInfo, GetEduExpConfig, UpdateEduExpConfig, GetWorkflowConfig, UpdateWorkflowConfig, GetLicenseConfig, UpdateLicenseConfig } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { Settings, Building, Workflow, Eye, EyeOff, Download, Key, X, Plus, Trash2, Edit } from 'lucide-react';

interface GlobalSettings {
  theme: 'light' | 'dark';
}

interface EduExpSettings {
  arkApiKey: string;
  arkModeModel: string;
  arkOcrModeModel: string;
  arkTextModeModel: string;
}

interface WorkflowSettings {
  apiKey: string;
  workflows: Record<string, WorkflowDef>;
}

interface WorkflowDef {
  name: string;
  workflow_id: string;
  app_id: string;
  parameters: WorkflowParameter[];
}

interface WorkflowParameter {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
  default_value: string;
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
    theme: 'light'
  });
  
  const [eduexpSettings, setEduexpSettings] = useState<EduExpSettings>({
    arkApiKey: '',
    arkModeModel: '',
    arkOcrModeModel: '',
    arkTextModeModel: ''
  });

  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings>({
    apiKey: '',
    workflows: {}
  });

  const [licenseSettings, setLicenseSettings] = useState<LicenseSettings>({
    licenseKey: '',
    expiryDate: '',
    userLimit: 1,
    featureFlags: []
  });

  const [configInfo, setConfigInfo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  // 工作流模态框相关状态
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [editingWorkflowKey, setEditingWorkflowKey] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDef>({
    name: '',
    workflow_id: '',
    app_id: '',
    parameters: []
  });
  
  // API Key 显示/隐藏状态
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyTesting, setApiKeyTesting] = useState(false);

  // 许可证密钥弹窗状态
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseKeyTesting, setLicenseKeyTesting] = useState(false);

  // 检测API密钥
  const testApiKey = async () => {
    if (!workflowSettings.apiKey.trim()) {
      alert('请输入API密钥');
      return;
    }

    // 简单的格式验证
    if (!workflowSettings.apiKey.startsWith('pat_')) {
      alert('API密钥格式不正确，应以 "pat_" 开头');
      return;
    }

    setApiKeyTesting(true);
    try {
      // TODO: 这里可以添加实际的API调用来验证密钥
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('API密钥验证成功！');
    } catch (error) {
      alert('API密钥验证失败，请检查密钥是否正确');
    } finally {
      setApiKeyTesting(false);
    }
  };

  // 许可证密钥管理函数
  const openLicenseModal = () => {
    setLicenseKeyInput(licenseSettings.licenseKey);
    setIsLicenseModalOpen(true);
  };

  const closeLicenseModal = () => {
    setIsLicenseModalOpen(false);
    setLicenseKeyInput('');
    setLicenseKeyTesting(false);
  };

  const testLicenseKey = async () => {
    if (!licenseKeyInput.trim()) {
      alert('请输入许可证密钥');
      return;
    }

    setLicenseKeyTesting(true);
    try {
      // TODO: 这里可以添加实际的许可证验证API调用
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('许可证密钥验证成功！');
    } catch (error) {
      alert('许可证密钥验证失败，请检查密钥是否正确');
    } finally {
      setLicenseKeyTesting(false);
    }
  };

  const saveLicenseKey = () => {
    if (!licenseKeyInput.trim()) {
      alert('请输入许可证密钥');
      return;
    }

    updateLicenseSetting('licenseKey', licenseKeyInput);
    closeLicenseModal();
  };

  // 应用主题到页面
  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', globalSettings.theme);
  }, [globalSettings.theme]);

  // ESC键关闭模态框
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isWorkflowModalOpen) {
          closeWorkflowModal();
        }
        if (isLicenseModalOpen) {
          closeLicenseModal();
        }
      }
    };

    if (isWorkflowModalOpen || isLicenseModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isWorkflowModalOpen, isLicenseModalOpen]);

  // 加载配置数据
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        
        // 加载全局配置
        try {
          const globalConfig = await GetGlobalConfig();
          const theme = globalConfig.Theme === 'dark' ? 'dark' : 'light';
          setGlobalSettings({
            theme: theme
          });
        } catch (error) {
          console.error('Failed to load global config:', error);
          setGlobalSettings({ theme: 'light' });
        }
        
        // 加载EduExp配置
        try {
          const eduexpConfig = await GetEduExpConfig();
          setEduexpSettings({
            arkApiKey: eduexpConfig.ArkApiKey || '',
            arkModeModel: eduexpConfig.ArkModeModel || '',
            arkOcrModeModel: eduexpConfig.ArkOcrModeModel || '',
            arkTextModeModel: eduexpConfig.ArkTextModeModel || ''
          });
        } catch (error) {
          console.error('Failed to load eduexp config:', error);
          setEduexpSettings({
            arkApiKey: '',
            arkModeModel: '',
            arkOcrModeModel: '',
            arkTextModeModel: ''
          });
        }

        // 加载工作流配置
        try {
          const workflowConfig = await GetWorkflowConfig();
          // 转换后端数据结构到前端格式
          const workflows: Record<string, WorkflowDef> = {};
          if (workflowConfig.Workflows) {
            Object.entries(workflowConfig.Workflows).forEach(([key, backendWorkflow]) => {
              workflows[key] = {
                name: backendWorkflow.Name || '',
                workflow_id: backendWorkflow.WorkflowID || '',
                app_id: backendWorkflow.AppID || '',
                parameters: (backendWorkflow.Parameters || []).map(param => ({
                  key: param.Key || '',
                  label: param.Label || '',
                  type: param.Type || 'text',
                  required: param.Required || false,
                  options: param.Options || [],
                  default_value: param.DefaultValue || ''
                }))
              };
            });
          }
          
          setWorkflowSettings({
            apiKey: workflowConfig.ApiKey || '',
            workflows: workflows
          });
        } catch (error) {
          console.error('Failed to load workflow config:', error);
          setWorkflowSettings({
            apiKey: '',
            workflows: {}
          });
        }

        // 加载许可配置
        try {
          const licenseConfig = await GetLicenseConfig();
          setLicenseSettings({
            licenseKey: licenseConfig.LicenseKey || '',
            expiryDate: licenseConfig.ExpiryDate || '',
            userLimit: licenseConfig.UserLimit || 1,
            featureFlags: licenseConfig.FeatureFlags || []
          });
        } catch (error) {
          console.error('Failed to load license config:', error);
          setLicenseSettings({
            licenseKey: '',
            expiryDate: '',
            userLimit: 1,
            featureFlags: []
          });
        }
        
        // 获取配置信息
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
            Theme: settings.theme
          };
          await UpdateGlobalConfig(backendSettings);
          console.log('Saved global settings:', settings);
          break;
        case 'eduexp':
          backendSettings = {
            ArkApiKey: settings.arkApiKey,
            ArkModeModel: settings.arkModeModel,
            ArkOcrModeModel: settings.arkOcrModeModel,
            ArkTextModeModel: settings.arkTextModeModel
          };
          await UpdateEduExpConfig(backendSettings);
          console.log('Saved eduexp settings:', settings);
          break;
        case 'workflow':
          // 转换前端工作流数据结构到后端格式
          const workflowSettings = settings as WorkflowSettings;
          const backendWorkflows: Record<string, any> = {};
          Object.entries(workflowSettings.workflows).forEach(([key, workflow]) => {
            backendWorkflows[key] = {
              Name: workflow.name,
              WorkflowID: workflow.workflow_id,
              AppID: workflow.app_id,
              Parameters: workflow.parameters.map((param) => ({
                Key: param.key,
                Label: param.label,
                Type: param.type,
                Required: param.required,
                Options: param.options,
                DefaultValue: param.default_value
              }))
            };
          });
          
          backendSettings = {
            ApiKey: workflowSettings.apiKey,
            Workflows: backendWorkflows
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

  // 工作流管理函数
  const openWorkflowModal = (workflowKey?: string) => {
    if (workflowKey && workflowSettings.workflows[workflowKey]) {
      setEditingWorkflowKey(workflowKey);
      setEditingWorkflow(workflowSettings.workflows[workflowKey]);
    } else {
      setEditingWorkflowKey(null);
      setEditingWorkflow({
        name: '',
        workflow_id: '',
        app_id: '',
        parameters: []
      });
    }
    setIsWorkflowModalOpen(true);
  };

  const closeWorkflowModal = () => {
    setIsWorkflowModalOpen(false);
    setEditingWorkflowKey(null);
    setEditingWorkflow({
      name: '',
      workflow_id: '',
      app_id: '',
      parameters: []
    });
  };

  const saveWorkflow = () => {
    if (!editingWorkflow.name.trim()) {
      alert('请输入工作流名称');
      return;
    }

    const newWorkflows = { ...workflowSettings.workflows };
    const workflowKey = editingWorkflowKey || editingWorkflow.name.toLowerCase().replace(/\s+/g, '_');
    
    if (editingWorkflowKey && editingWorkflowKey !== workflowKey) {
      // 如果名称改变了，删除旧的key
      delete newWorkflows[editingWorkflowKey];
    }
    
    newWorkflows[workflowKey] = editingWorkflow;
    
    const newSettings = { ...workflowSettings, workflows: newWorkflows };
    setWorkflowSettings(newSettings);
    autoSave('workflow', newSettings);
    closeWorkflowModal();
  };

  const deleteWorkflow = (workflowKey: string) => {
    if (confirm('确定要删除这个工作流吗？')) {
      const newWorkflows = { ...workflowSettings.workflows };
      delete newWorkflows[workflowKey];
      
      const newSettings = { ...workflowSettings, workflows: newWorkflows };
      setWorkflowSettings(newSettings);
      autoSave('workflow', newSettings);
    }
  };

  const addParameter = () => {
    setEditingWorkflow({
      ...editingWorkflow,
      parameters: [
        ...editingWorkflow.parameters,
        {
          key: '',
          label: '',
          type: 'text',
          required: false,
          options: [],
          default_value: ''
        }
      ]
    });
  };

  const updateParameter = (index: number, field: keyof WorkflowParameter, value: any) => {
    const newParameters = [...editingWorkflow.parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setEditingWorkflow({ ...editingWorkflow, parameters: newParameters });
  };

  const removeParameter = (index: number) => {
    const newParameters = editingWorkflow.parameters.filter((_, i) => i !== index);
    setEditingWorkflow({ ...editingWorkflow, parameters: newParameters });
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
        <p className="text-base-content opacity-70 mb-8">配置应用程序的主题外观</p>
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


    </div>
  );

  // 渲染EduExp配置
  const renderEduExpSettings = () => (
    <div className="space-y-0">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-base-content mb-6">EduExp配置</h3>
        <p className="text-base-content opacity-70">配置EduExp模块的ark(火山云)API和模型设置</p>
      </div>

      {/* ark API Key */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">API 密钥</span>
          </div>
          <input
            type="password"
            className="input input-bordered w-64 text-base-content"
            value={eduexpSettings.arkApiKey}
            onChange={(e) => updateEduExpSetting('arkApiKey', e.target.value)}
            placeholder="输入火山方舟 API 密钥"
          />
        </div>
      </div>

      {/* ark mode 模型 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">通用模型</span>
          </div>
          <input
            type="text"
            className="input input-bordered w-64 text-base-content"
            value={eduexpSettings.arkModeModel}
            onChange={(e) => updateEduExpSetting('arkModeModel', e.target.value)}
            placeholder="输入通用模型名称"
          />
        </div>
      </div>

      {/* ark ocr mode 模型 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">OCR 模型</span>
          </div>
          <input
            type="text"
            className="input input-bordered w-64 text-base-content"
            value={eduexpSettings.arkOcrModeModel}
            onChange={(e) => updateEduExpSetting('arkOcrModeModel', e.target.value)}
            placeholder="输入 OCR 识别模型名称"
          />
        </div>
      </div>

      {/* ark text mode 模型 */}
      <div className="form-control py-4 border-b border-base-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-base font-medium text-base-content">文本模型</span>
          </div>
          <input
            type="text"
            className="input input-bordered w-64 text-base-content"
            value={eduexpSettings.arkTextModeModel}
            onChange={(e) => updateEduExpSetting('arkTextModeModel', e.target.value)}
            placeholder="输入文本处理模型名称"
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
        <p className="text-base-content opacity-70">配置扣子工作流的API密钥和工作流定义</p>
      </div>

      {/* 扣子 API Key */}
      <div className="py-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-base-content mb-2">API 密钥</h4>
          <p className="text-sm text-base-content opacity-70">用于调用扣子工作流的API密钥</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <input
              type={showApiKey ? "text" : "password"}
              className="input input-bordered w-full pr-12 text-base-content"
              value={workflowSettings.apiKey}
              onChange={(e) => updateWorkflowSetting('apiKey', e.target.value)}
              placeholder="API 密钥"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm btn-square"
              onClick={() => setShowApiKey(!showApiKey)}
              title={showApiKey ? "隐藏密钥" : "显示密钥"}
            >
              {showApiKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <button
            className="btn btn-primary btn-sm px-6"
            onClick={testApiKey}
            disabled={apiKeyTesting}
          >
            {apiKeyTesting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                检测中
              </>
            ) : (
              '检测'
            )}
          </button>
        </div>
      </div>

      {/* 工作流定义 */}
      <div className="py-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-lg font-semibold text-base-content">工作流定义</h4>
            <p className="text-sm text-base-content opacity-70">管理扣子工作流配置</p>
          </div>
          <button
            onClick={() => openWorkflowModal()}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加工作流
          </button>
        </div>
        
        {Object.keys(workflowSettings.workflows).length === 0 ? (
          <div className="text-center py-8 text-base-content opacity-50">
            暂无工作流配置，点击上方按钮添加
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(workflowSettings.workflows).map(([key, workflow]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <h5 className="font-medium text-base-content">{workflow.name}</h5>
                  <p className="text-sm text-base-content opacity-70">
                    工作流ID: {workflow.workflow_id} | 应用ID: {workflow.app_id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openWorkflowModal(key)}
                    className="btn btn-sm btn-ghost"
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => deleteWorkflow(key)}
                    className="btn btn-sm btn-ghost text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
      <div className="py-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-base-content mb-2">许可证密钥</h4>
          <p className="text-sm text-base-content opacity-70">软件授权许可证密钥</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <input
              type="password"
              className="input input-bordered w-full text-base-content"
              value={licenseSettings.licenseKey}
              readOnly
              placeholder={licenseSettings.licenseKey ? "已配置许可证密钥" : "未配置许可证密钥"}
            />
          </div>
          
          <button
            className="btn btn-primary btn-sm px-6"
            onClick={openLicenseModal}
          >
            {licenseSettings.licenseKey ? '更换密钥' : '添加密钥'}
          </button>
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
                <Settings className="w-5 h-5" />
                <div>
                  <div className="font-medium">全局配置</div>
                  <div className="text-xs opacity-70">主题外观设置</div>
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
                <Building className="w-5 h-5" />
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
                <Workflow className="w-5 h-5" />
                <div>
                  <div className="font-medium">工作流配置</div>
                  <div className="text-xs opacity-70">扣子API、工作流定义</div>
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
                <Key className="w-5 h-5" />
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

      {/* 工作流编辑模态框 */}
      {isWorkflowModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeWorkflowModal}
        >
          <div 
            className="bg-base-100 rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-base-content">
                {editingWorkflowKey ? '编辑工作流' : '添加工作流'}
              </h3>
              <button
                onClick={closeWorkflowModal}
                className="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
                title="关闭"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 基本信息 */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="label">
                  <span className="label-text">工作流名称</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={editingWorkflow.name}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                  placeholder="输入工作流名称"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">工作流ID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={editingWorkflow.workflow_id}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, workflow_id: e.target.value })}
                  placeholder="输入工作流ID"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">应用ID</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={editingWorkflow.app_id}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, app_id: e.target.value })}
                  placeholder="输入应用ID"
                />
              </div>
            </div>

            {/* 参数配置 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-base-content">参数配置</h4>
                <button
                  onClick={addParameter}
                  className="btn btn-sm btn-outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加参数
                </button>
              </div>

              {editingWorkflow.parameters.length === 0 ? (
                <div className="text-center py-4 text-base-content opacity-50">
                  暂无参数，点击上方按钮添加
                </div>
              ) : (
                <div className="space-y-4">
                  {editingWorkflow.parameters.map((param, index) => (
                    <div key={index} className="border border-base-300 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-base-content">参数 {index + 1}</span>
                        <button
                          onClick={() => removeParameter(index)}
                          className="btn btn-sm btn-ghost text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">
                            <span className="label-text">参数键</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={param.key}
                            onChange={(e) => updateParameter(index, 'key', e.target.value)}
                            placeholder="参数键"
                          />
                        </div>
                        
                        <div>
                          <label className="label">
                            <span className="label-text">参数标签</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={param.label}
                            onChange={(e) => updateParameter(index, 'label', e.target.value)}
                            placeholder="参数标签"
                          />
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text">参数类型</span>
                          </label>
                          <select
                            className="select select-bordered select-sm w-full"
                            value={param.type}
                            onChange={(e) => updateParameter(index, 'type', e.target.value)}
                          >
                            <option value="text">文本</option>
                            <option value="select">选择</option>
                            <option value="number">数字</option>
                            <option value="boolean">布尔值</option>
                          </select>
                        </div>

                        <div>
                          <label className="label">
                            <span className="label-text">默认值</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={param.default_value}
                            onChange={(e) => updateParameter(index, 'default_value', e.target.value)}
                            placeholder="默认值"
                          />
                        </div>
                      </div>

                      <div className="flex items-center mt-3">
                        <label className="label cursor-pointer">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm mr-2"
                            checked={param.required}
                            onChange={(e) => updateParameter(index, 'required', e.target.checked)}
                          />
                          <span className="label-text">必填参数</span>
                        </label>
                      </div>

                      {param.type === 'select' && (
                        <div className="mt-3">
                          <label className="label">
                            <span className="label-text">选项列表（每行一个）</span>
                          </label>
                          <textarea
                            className="textarea textarea-bordered w-full"
                            rows={3}
                            value={param.options.join('\n')}
                            onChange={(e) => updateParameter(index, 'options', e.target.value.split('\n').filter(o => o.trim()))}
                            placeholder="选项1&#10;选项2&#10;选项3"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={closeWorkflowModal}
                className="btn btn-ghost"
              >
                取消
              </button>
              <button
                onClick={saveWorkflow}
                className="btn btn-primary"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 许可证密钥编辑模态框 */}
      {isLicenseModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeLicenseModal}
        >
          <div 
            className="bg-base-100 rounded-lg p-6 w-[500px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-base-content">
                {licenseSettings.licenseKey ? '更换许可证密钥' : '添加许可证密钥'}
              </h3>
              <button
                onClick={closeLicenseModal}
                className="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
                title="关闭"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="label">
                  <span className="label-text">许可证密钥</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="输入许可证密钥"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={testLicenseKey}
                className="btn btn-outline"
                disabled={licenseKeyTesting}
              >
                {licenseKeyTesting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    验证中
                  </>
                ) : (
                  '验证密钥'
                )}
              </button>
              <button
                onClick={closeLicenseModal}
                className="btn btn-ghost"
              >
                取消
              </button>
              <button
                onClick={saveLicenseKey}
                className="btn btn-primary"
              >
                {licenseSettings.licenseKey ? '更新密钥' : '保存密钥'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 