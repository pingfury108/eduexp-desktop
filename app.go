package main

import (
	"context"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"sync"
	"syscall"
)

// App struct
type App struct {
	ctx            context.Context
	processManager *ProcessManager // 进程管理器
	configManager  *ConfigManager  // 配置管理器
	exitOnce       sync.Once       // 确保退出逻辑只执行一次
	appDataDir     string          // 应用数据目录
}

// NewApp creates a new App application struct
func NewApp() *App {
	app := &App{}

	// 初始化配置管理器
	var err error
	app.configManager, err = NewConfigManager()
	if err != nil {
		// 如果配置管理器初始化失败，记录错误但不阻止应用启动
		// TODO: 这里可以添加日志记录
		_ = err
	}

	// 获取应用数据目录
	app.appDataDir = app.getAppDataDir()

	// 在 Wails 中，主要依赖 OnShutdown 和 OnBeforeClose 钩子
	// 但仍然保留系统信号监听作为备用
	go app.setupExitHandler()
	return app
}

// getAppDataDir 获取应用数据目录
func (a *App) getAppDataDir() string {
	// 获取用户主目录
	userHomeDir, err := os.UserHomeDir()
	if err != nil {
		// 如果获取失败，使用当前目录
		return "."
	}

	// 根据操作系统确定数据目录
	var appDataDir string
	switch runtime.GOOS {
	case "windows":
		// Windows: %APPDATA%\eduexp-desktop
		appDataDir = filepath.Join(userHomeDir, "AppData", "Roaming", "eduexp-desktop")
	case "darwin":
		// macOS: ~/Library/Application Support/eduexp-desktop
		appDataDir = filepath.Join(userHomeDir, "Library", "Application Support", "eduexp-desktop")
	default:
		// Linux/Unix: ~/.local/share/eduexp-desktop
		appDataDir = filepath.Join(userHomeDir, ".local", "share", "eduexp-desktop")
	}

	return appDataDir
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// 创建进程管理器
	a.processManager = NewProcessManager(ctx)

	// 注册新的进程
	a.registerProcesses()
}

// getExecutableName 根据操作系统返回可执行文件名
func (a *App) getExecutableName(baseName string) string {
	if runtime.GOOS == "windows" {
		return baseName + ".exe"
	}
	return baseName
}

// registerProcesses 注册应用进程
func (a *App) registerProcesses() {
	binDir := filepath.Join(a.appDataDir, "bin")

	// 注册 workflowui 进程
	workflowuiDataDir := filepath.Join(a.appDataDir, "data", "workflowui")
	workflowuiExe := a.getExecutableName("workflowui")
	a.processManager.RegisterProcess("workflowui", &ProcessConfig{
		Name:    "workflowui",
		Command: filepath.Join(binDir, workflowuiExe),
		Args:    []string{},
		WorkDir: workflowuiDataDir,
	})

	// 注册 edu-tools 进程
	eduToolsDataDir := filepath.Join(a.appDataDir, "data", "edu-tools")
	eduToolsExe := a.getExecutableName("edu-tools")
	a.processManager.RegisterProcess("edu-tools", &ProcessConfig{
		Name:    "edu-tools",
		Command: filepath.Join(binDir, eduToolsExe),
		Args:    []string{},
		WorkDir: eduToolsDataDir,
	})

	// 确保数据目录存在
	os.MkdirAll(workflowuiDataDir, 0755)
	os.MkdirAll(eduToolsDataDir, 0755)

	// 确保bin目录存在
	os.MkdirAll(binDir, 0755)
}

// shutdown is called when the app is shutting down
func (a *App) shutdown(ctx context.Context) {
	a.cleanup()
}

// beforeClose is called before the app closes
func (a *App) beforeClose(ctx context.Context) bool {
	// 清理所有子进程
	if a.processManager != nil {
		a.processManager.StopAllProcesses()
	}
	// 返回 false 表示允许关闭
	return false
}

// setupExitHandler 监听系统退出信号，停止所有子进程
func (a *App) setupExitHandler() {
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	<-signalChan // 阻塞直到收到信号
	a.cleanup()
}

// cleanup 统一的清理逻辑，确保只执行一次
func (a *App) cleanup() {
	a.exitOnce.Do(func() {
		if a.processManager != nil {
			a.processManager.StopAllProcesses()
			a.processManager.ReleaseResources()
		}
		// 注意：在 Wails 中，不要调用 os.Exit(0)，让 Wails 自己处理退出
	})
}

// ===============================
// 进程管理相关接口
// ===============================

// RegisterProcess 注册进程配置
func (a *App) RegisterProcess(name string, config *ProcessConfig) {
	if a.processManager != nil {
		a.processManager.RegisterProcess(name, config)
	}
}

// GetRegisteredProcesses 获取已注册的进程列表
func (a *App) GetRegisteredProcesses() []string {
	if a.processManager != nil {
		return a.processManager.GetRegisteredProcesses()
	}
	return []string{}
}

// GetRegisteredProcessNames 获取注册的进程名称（新增方法）
func (a *App) GetRegisteredProcessNames() []string {
	return a.GetRegisteredProcesses()
}

// StartProcess 启动指定进程
func (a *App) StartProcess(processName string, extraArgs ...string) string {
	if a.processManager != nil {
		return a.processManager.StartProcess(processName, extraArgs...)
	}
	return "Process manager not initialized"
}

// StopProcess 停止指定进程
func (a *App) StopProcess(processName string) string {
	if a.processManager != nil {
		return a.processManager.StopProcess(processName)
	}
	return "Process manager not initialized"
}

// GetProcessStatus 获取指定进程状态
func (a *App) GetProcessStatus(processName string) string {
	if a.processManager != nil {
		return a.processManager.GetProcessStatus(processName)
	}
	return "Process manager not initialized"
}

// GetAllProcessStatus 获取所有进程状态
func (a *App) GetAllProcessStatus() map[string]string {
	if a.processManager != nil {
		return a.processManager.GetAllProcessStatus()
	}
	return map[string]string{}
}

// GetProcessOutput 获取指定进程的输出日志
func (a *App) GetProcessOutput(processName string) string {
	if a.processManager != nil {
		return a.processManager.GetProcessOutput(processName)
	}
	return "Process manager not initialized"
}

// GetAppDataDir 获取应用数据目录
func (a *App) GetAppDataDir() string {
	return a.appDataDir
}
