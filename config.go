package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
)

// Config 应用配置结构
type Config struct {
	Global   GlobalConfig   `toml:"global"`
	EduExp   EduExpConfig   `toml:"eduexp"`
	Workflow WorkflowConfig `toml:"workflow"`
	License  LicenseConfig  `toml:"license"`
}

// GlobalConfig 全局配置
type GlobalConfig struct {
	Theme string `toml:"theme"` // 主题: light/dark
}

// EduExpConfig EduExp模块配置
type EduExpConfig struct {
	ArkApiKey        string `toml:"ark_api_key"`         // ark(火山云) API Key
	ArkModeModel     string `toml:"ark_mode_model"`      // ark mode 模型
	ArkOcrModeModel  string `toml:"ark_ocr_mode_model"`  // ark ocr mode 模型
	ArkTextModeModel string `toml:"ark_text_mode_model"` // ark text mode 模型
}

// WorkflowConfig 工作流配置
type WorkflowConfig struct {
	ApiKey    string                 `toml:"apikey"`    // 扣子 API Key
	Workflows map[string]WorkflowDef `toml:"workflows"` // 工作流定义
}

// WorkflowDef 工作流定义
type WorkflowDef struct {
	Name       string              `toml:"name"`        // 工作流名称
	WorkflowID string              `toml:"workflow_id"` // 工作流ID
	AppID      string              `toml:"app_id"`      // 应用ID
	Parameters []WorkflowParameter `toml:"parameters"`  // 参数列表
}

// WorkflowParameter 工作流参数
type WorkflowParameter struct {
	Key          string   `toml:"key"`           // 参数键
	Label        string   `toml:"label"`         // 参数标签
	Type         string   `toml:"type"`          // 参数类型
	Required     bool     `toml:"required"`      // 是否必需
	Options      []string `toml:"options"`       // 选项列表（用于select类型）
	DefaultValue string   `toml:"default_value"` // 默认值
}

// LicenseConfig 许可配置
type LicenseConfig struct {
	// TODO: 添加许可相关配置项
	LicenseKey   string   `toml:"license_key"`   // 许可证密钥
	ExpiryDate   string   `toml:"expiry_date"`   // 过期日期
	UserLimit    int      `toml:"user_limit"`    // 用户数量限制
	FeatureFlags []string `toml:"feature_flags"` // 功能标志
}

// ConfigManager 配置管理器
type ConfigManager struct {
	configDir  string  // 配置目录
	configFile string  // 配置文件路径
	config     *Config // 当前配置
}

// NewConfigManager 创建配置管理器
func NewConfigManager() (*ConfigManager, error) {
	// 获取用户配置目录
	userConfigDir, err := os.UserConfigDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get user config directory: %v", err)
	}

	// 创建应用配置目录
	appConfigDir := filepath.Join(userConfigDir, "eduexp-desktop")
	if err := os.MkdirAll(appConfigDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create config directory: %v", err)
	}

	configFile := filepath.Join(appConfigDir, "config.toml")

	manager := &ConfigManager{
		configDir:  appConfigDir,
		configFile: configFile,
	}

	// 加载配置
	if err := manager.LoadConfig(); err != nil {
		return nil, err
	}

	return manager, nil
}

// GetDefaultConfig 获取默认配置
func GetDefaultConfig() *Config {
	return &Config{
		Global: GlobalConfig{
			Theme: "light",
		},
		EduExp: EduExpConfig{
			ArkApiKey:        "",
			ArkModeModel:     "",
			ArkOcrModeModel:  "",
			ArkTextModeModel: "",
		},
		Workflow: WorkflowConfig{
			ApiKey:    "",
			Workflows: map[string]WorkflowDef{},
		},
		License: LicenseConfig{
			LicenseKey:   "",
			ExpiryDate:   "",
			UserLimit:    1,
			FeatureFlags: []string{},
		},
	}
}

// LoadConfig 加载配置
func (cm *ConfigManager) LoadConfig() error {
	// 如果配置文件不存在，创建默认配置
	if _, err := os.Stat(cm.configFile); os.IsNotExist(err) {
		cm.config = GetDefaultConfig()
		return cm.SaveConfig()
	}

	// 读取配置文件
	var config Config
	if _, err := toml.DecodeFile(cm.configFile, &config); err != nil {
		// 如果解析失败，使用默认配置并备份原文件
		cm.backupCorruptedConfig()
		cm.config = GetDefaultConfig()
		return cm.SaveConfig()
	}

	cm.config = &config
	return nil
}

// SaveConfig 保存配置
func (cm *ConfigManager) SaveConfig() error {
	file, err := os.Create(cm.configFile)
	if err != nil {
		return fmt.Errorf("failed to create config file: %v", err)
	}
	defer file.Close()

	encoder := toml.NewEncoder(file)
	if err := encoder.Encode(cm.config); err != nil {
		return fmt.Errorf("failed to encode config: %v", err)
	}

	return nil
}

// GetConfig 获取当前配置
func (cm *ConfigManager) GetConfig() *Config {
	return cm.config
}

// UpdateGlobalConfig 更新全局配置
func (cm *ConfigManager) UpdateGlobalConfig(global GlobalConfig) error {
	cm.config.Global = global
	return cm.SaveConfig()
}

// UpdateEduExpConfig 更新EduExp配置
func (cm *ConfigManager) UpdateEduExpConfig(eduexp EduExpConfig) error {
	cm.config.EduExp = eduexp
	return cm.SaveConfig()
}

// UpdateWorkflowConfig 更新工作流配置
func (cm *ConfigManager) UpdateWorkflowConfig(workflow WorkflowConfig) error {
	cm.config.Workflow = workflow
	return cm.SaveConfig()
}

// UpdateLicenseConfig 更新许可配置
func (cm *ConfigManager) UpdateLicenseConfig(license LicenseConfig) error {
	cm.config.License = license
	return cm.SaveConfig()
}

// GetConfigDir 获取配置目录
func (cm *ConfigManager) GetConfigDir() string {
	return cm.configDir
}

// GetConfigFile 获取配置文件路径
func (cm *ConfigManager) GetConfigFile() string {
	return cm.configFile
}

// backupCorruptedConfig 备份损坏的配置文件
func (cm *ConfigManager) backupCorruptedConfig() {
	backupFile := cm.configFile + ".backup"
	os.Rename(cm.configFile, backupFile)
}

// ResetToDefault 重置为默认配置
func (cm *ConfigManager) ResetToDefault() error {
	cm.config = GetDefaultConfig()
	return cm.SaveConfig()
}
