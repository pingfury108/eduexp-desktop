package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ===============================
// 应用特定进程管理接口
// ===============================

// WorkflowUIConfig 工作流UI配置结构
type WorkflowUIConfig struct {
	Coze CozeConfig `json:"coze"`
}

// CozeConfig 扣子配置结构
type CozeConfig struct {
	APIKey    string                 `json:"apikey"`
	Workflows map[string]interface{} `json:"workflows"`
}

// StartWorkflowUI 启动 WorkflowUI 进程
func (a *App) StartWorkflowUI(extraArgs []string) string {
	// 从配置管理器获取配置
	if a.configManager == nil {
		return "ERROR: Configuration manager not initialized"
	}

	config := a.configManager.GetConfig()
	if config == nil {
		return "ERROR: Failed to get configuration - please check your configuration file"
	}

	// 获取 workflowui 的数据目录
	workflowuiDataDir := filepath.Join(a.appDataDir, "data", "workflowui")

	// 确保数据目录存在
	if err := os.MkdirAll(workflowuiDataDir, 0755); err != nil {
		return fmt.Sprintf("ERROR: Failed to create workflowui data directory '%s': %v", workflowuiDataDir, err)
	}

	// 生成 config.json 文件
	configFile := filepath.Join(workflowuiDataDir, "config.json")
	if err := a.generateWorkflowUIConfig(configFile, config); err != nil {
		return fmt.Sprintf("ERROR: Failed to generate config.json file '%s': %v", configFile, err)
	}

	// 检查 workflowui 可执行文件是否存在
	binDir := filepath.Join(a.appDataDir, "bin")
	workflowuiExe := a.getExecutableName("workflowui")
	workflowuiPath := filepath.Join(binDir, workflowuiExe)
	if _, err := os.Stat(workflowuiPath); os.IsNotExist(err) {
		return fmt.Sprintf("ERROR: WorkflowUI executable not found at '%s'. Please ensure the workflowui binary is installed in the bin directory", workflowuiPath)
	}

	// 构建启动参数
	args := []string{
		"--config", "config.json", // 使用相对路径，因为工作目录就是数据目录
	}

	// 添加端口参数（如果配置中有）
	if config.EduExp.ServerPort != "" {
		args = append(args, "--port", config.EduExp.ServerPort)
	}

	// 添加额外参数
	args = append(args, extraArgs...)

	// 启动进程并返回结果
	result := a.StartProcess("workflowui", args...)

	// 如果启动失败，添加更多调试信息
	if !strings.Contains(result, "successfully") {
		debugInfo := fmt.Sprintf("\nDEBUG INFO:\n- Executable: %s\n- Working Directory: %s\n- Config File: %s\n- Arguments: %v",
			workflowuiPath, workflowuiDataDir, configFile, args)
		result += debugInfo
	}

	return result
}

// generateWorkflowUIConfig 生成 WorkflowUI 的配置文件
func (a *App) generateWorkflowUIConfig(configFile string, config *Config) error {
	// 转换配置格式
	workflowUIConfig := WorkflowUIConfig{
		Coze: CozeConfig{
			APIKey:    config.Workflow.ApiKey,
			Workflows: make(map[string]interface{}),
		},
	}

	// 转换工作流定义格式
	for key, workflow := range config.Workflow.Workflows {
		workflowUIConfig.Coze.Workflows[key] = map[string]interface{}{
			"name":        workflow.Name,
			"workflow_id": workflow.WorkflowID,
			"app_id":      workflow.AppID,
			"parameters":  workflow.Parameters,
		}
	}

	// 生成 JSON 文件
	data, err := json.MarshalIndent(workflowUIConfig, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %v", err)
	}

	// 写入文件
	if err := os.WriteFile(configFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %v", err)
	}

	return nil
}

// StopWorkflowUI 停止 WorkflowUI 进程
func (a *App) StopWorkflowUI() string {
	return a.StopProcess("workflowui")
}

// GetWorkflowUIStatus 获取 WorkflowUI 进程状态
func (a *App) GetWorkflowUIStatus() string {
	return a.GetProcessStatus("workflowui")
}

// GetWorkflowUIOutput 获取 WorkflowUI 进程输出
func (a *App) GetWorkflowUIOutput() string {
	return a.GetProcessOutput("workflowui")
}

// StartEduTools 启动 EduTools 进程
func (a *App) StartEduTools(extraArgs []string) string {
	// 检查 edu-tools 可执行文件是否存在
	binDir := filepath.Join(a.appDataDir, "bin")
	eduToolsExe := a.getExecutableName("edu-tools")
	eduToolsPath := filepath.Join(binDir, eduToolsExe)
	if _, err := os.Stat(eduToolsPath); os.IsNotExist(err) {
		return fmt.Sprintf("ERROR: EduTools executable not found at '%s'. Please ensure the edu-tools binary is installed in the bin directory", eduToolsPath)
	}

	// 确保数据目录存在
	eduToolsDataDir := filepath.Join(a.appDataDir, "data", "edu-tools")
	if err := os.MkdirAll(eduToolsDataDir, 0755); err != nil {
		return fmt.Sprintf("ERROR: Failed to create edu-tools data directory '%s': %v", eduToolsDataDir, err)
	}

	// 启动进程并返回结果
	result := a.StartProcess("edu-tools", extraArgs...)

	// 如果启动失败，添加更多调试信息
	if !strings.Contains(result, "successfully") {
		debugInfo := fmt.Sprintf("\nDEBUG INFO:\n- Executable: %s\n- Working Directory: %s\n- Arguments: %v",
			eduToolsPath, eduToolsDataDir, extraArgs)
		result += debugInfo
	}

	return result
}

// StopEduTools 停止 EduTools 进程
func (a *App) StopEduTools() string {
	return a.StopProcess("edu-tools")
}

// GetEduToolsStatus 获取 EduTools 进程状态
func (a *App) GetEduToolsStatus() string {
	return a.GetProcessStatus("edu-tools")
}

// GetEduToolsOutput 获取 EduTools 进程输出
func (a *App) GetEduToolsOutput() string {
	return a.GetProcessOutput("edu-tools")
}

// ===============================
// 兼容性方法：保持与原有API的兼容
// ===============================

// StartGinServer 启动服务（兼容旧接口，默认启动caddy-fileserver）
func (a *App) StartGinServer(port string) string {
	return a.StartProcess("caddy-fileserver", "--listen", "0.0.0.0:"+port)
}

// StopGinServer 停止服务（兼容旧接口）
func (a *App) StopGinServer() string {
	return a.StopProcess("caddy-fileserver")
}

// GetServerStatus 获取状态（兼容旧接口）
func (a *App) GetServerStatus() string {
	return a.GetProcessStatus("caddy-fileserver")
}

// GetServerOutput 获取输出日志（兼容旧接口）
func (a *App) GetServerOutput() string {
	return a.GetProcessOutput("caddy-fileserver")
}
