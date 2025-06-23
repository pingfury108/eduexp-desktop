package main

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"
)

// App struct
type App struct {
	ctx            context.Context
	processManager *ProcessManager // 进程管理器
	exitOnce       sync.Once       // 确保退出逻辑只执行一次
}

// NewApp creates a new App application struct
func NewApp() *App {
	app := &App{}

	// 在 Wails 中，主要依赖 OnShutdown 和 OnBeforeClose 钩子
	// 但仍然保留系统信号监听作为备用
	go app.setupExitHandler()
	return app
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// 创建进程管理器
	a.processManager = NewProcessManager(ctx)
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

// 兼容性方法：保持与原有API的兼容
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
