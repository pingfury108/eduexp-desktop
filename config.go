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
	Theme               string `toml:"theme"`                // 主题: light/dark
	Language            string `toml:"language"`             // 语言: zh-CN/en-US
	AutoStart           bool   `toml:"auto_start"`           // 开机自启动
	EnableNotifications bool   `toml:"enable_notifications"` // 启用通知
	LogLevel            string `toml:"log_level"`            // 日志级别: debug/info/warning/error
	MaxLogEntries       int    `toml:"max_log_entries"`      // 最大日志条数
}

// EduExpConfig EduExp模块配置
type EduExpConfig struct {
	// TODO: 添加 EduExp 相关配置项
	ServerPort    string `toml:"server_port"`    // 服务器端口
	DataPath      string `toml:"data_path"`      // 数据目录路径
	CacheEnabled  bool   `toml:"cache_enabled"`  // 是否启用缓存
	BackupEnabled bool   `toml:"backup_enabled"` // 是否启用自动备份
}

// WorkflowConfig 工作流配置
type WorkflowConfig struct {
	// TODO: 添加工作流相关配置项
	MaxConcurrentJobs int    `toml:"max_concurrent_jobs"` // 最大并发任务数
	JobTimeout        int    `toml:"job_timeout"`         // 任务超时时间(秒)
	RetryCount        int    `toml:"retry_count"`         // 重试次数
	WorkspacePath     string `toml:"workspace_path"`      // 工作空间路径
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
			Theme:               "light",
			Language:            "zh-CN",
			AutoStart:           false,
			EnableNotifications: true,
			LogLevel:            "info",
			MaxLogEntries:       1000,
		},
		EduExp: EduExpConfig{
			ServerPort:    "8080",
			DataPath:      "",
			CacheEnabled:  true,
			BackupEnabled: true,
		},
		Workflow: WorkflowConfig{
			MaxConcurrentJobs: 5,
			JobTimeout:        300,
			RetryCount:        3,
			WorkspacePath:     "",
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
