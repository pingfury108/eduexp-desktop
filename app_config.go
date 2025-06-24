package main

import "fmt"

// ===============================
// 配置管理相关接口
// ===============================

// GetGlobalConfig 获取全局配置
func (a *App) GetGlobalConfig() *GlobalConfig {
	if a.configManager == nil {
		return nil
	}
	config := a.configManager.GetConfig()
	if config == nil {
		return nil
	}
	return &config.Global
}

// UpdateGlobalConfig 更新全局配置
func (a *App) UpdateGlobalConfig(global GlobalConfig) string {
	if a.configManager == nil {
		return "Configuration manager not initialized"
	}

	err := a.configManager.UpdateGlobalConfig(global)
	if err != nil {
		return fmt.Sprintf("Failed to update global config: %v", err)
	}

	return "Global configuration updated successfully"
}

// GetEduExpConfig 获取EduExp配置
func (a *App) GetEduExpConfig() *EduExpConfig {
	if a.configManager == nil {
		return nil
	}
	config := a.configManager.GetConfig()
	if config == nil {
		return nil
	}
	return &config.EduExp
}

// UpdateEduExpConfig 更新EduExp配置
func (a *App) UpdateEduExpConfig(eduexp EduExpConfig) string {
	if a.configManager == nil {
		return "Configuration manager not initialized"
	}

	err := a.configManager.UpdateEduExpConfig(eduexp)
	if err != nil {
		return fmt.Sprintf("Failed to update EduExp config: %v", err)
	}

	return "EduExp configuration updated successfully"
}

// GetWorkflowConfig 获取工作流配置
func (a *App) GetWorkflowConfig() *WorkflowConfig {
	if a.configManager == nil {
		return nil
	}
	config := a.configManager.GetConfig()
	if config == nil {
		return nil
	}
	return &config.Workflow
}

// UpdateWorkflowConfig 更新工作流配置
func (a *App) UpdateWorkflowConfig(workflow WorkflowConfig) string {
	if a.configManager == nil {
		return "Configuration manager not initialized"
	}

	err := a.configManager.UpdateWorkflowConfig(workflow)
	if err != nil {
		return fmt.Sprintf("Failed to update workflow config: %v", err)
	}

	return "Workflow configuration updated successfully"
}

// GetLicenseConfig 获取许可配置
func (a *App) GetLicenseConfig() *LicenseConfig {
	if a.configManager == nil {
		return nil
	}
	config := a.configManager.GetConfig()
	if config == nil {
		return nil
	}
	return &config.License
}

// UpdateLicenseConfig 更新许可配置
func (a *App) UpdateLicenseConfig(license LicenseConfig) string {
	if a.configManager == nil {
		return "Configuration manager not initialized"
	}

	err := a.configManager.UpdateLicenseConfig(license)
	if err != nil {
		return fmt.Sprintf("Failed to update license config: %v", err)
	}

	return "License configuration updated successfully"
}

// GetFullConfig 获取完整配置
func (a *App) GetFullConfig() *Config {
	if a.configManager == nil {
		return nil
	}
	return a.configManager.GetConfig()
}

// ResetConfigToDefault 重置配置为默认值
func (a *App) ResetConfigToDefault() string {
	if a.configManager == nil {
		return "Configuration manager not initialized"
	}

	err := a.configManager.ResetToDefault()
	if err != nil {
		return fmt.Sprintf("Failed to reset config to default: %v", err)
	}

	return "Configuration reset to default successfully"
}

// GetConfigFilePath 获取配置文件路径
func (a *App) GetConfigFilePath() string {
	if a.configManager == nil {
		return ""
	}
	return a.configManager.GetConfigFile()
}

// GetConfigInfo 获取配置信息
func (a *App) GetConfigInfo() map[string]string {
	info := make(map[string]string)

	if a.configManager == nil {
		info["status"] = "Config manager not initialized"
		return info
	}

	info["config_dir"] = a.configManager.GetConfigDir()
	info["config_file"] = a.configManager.GetConfigFile()
	info["status"] = "Initialized"

	return info
}
