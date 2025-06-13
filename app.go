package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"sync"
	"syscall"
)

// App struct
type App struct {
	ctx     context.Context
	cmd     *exec.Cmd  // 保存进程对象
	running bool       // 运行状态
	output  string     // 记录输出日志
	mu      sync.Mutex // 保护共享字段
}

// NewApp creates a new App application struct
func NewApp() *App {
	app := &App{}
	go app.setupExitHandler() // 启动退出信号监听
	return app
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// 监听应用退出信号
	go func() {
		<-ctx.Done()
		if a.running {
			a.StopGinServer()
		}

		// 确保资源释放
		if a.cmd != nil && a.cmd.Process != nil {
			a.cmd.Process.Release()
		}
		os.Exit(0)
	}()
}

// setupExitHandler 监听系统退出信号，停止子进程
func (a *App) setupExitHandler() {
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	<-signalChan // 阻塞直到收到信号
	if a.running {
		a.StopGinServer()
	}
	os.Exit(0)
}

// StartGinServer 启动服务（带输出捕获）
func (a *App) StartGinServer(port string) string {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.running {
		return "Server is already running!"
	}

	a.cmd = exec.CommandContext(a.ctx, "caddy", "file-server", "-b", "--listen", "0.0.0.0:"+port)

	a.cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true, // 允许后续杀死整个进程组
	}

	// 捕获标准输出和错误
	stdoutPipe, _ := a.cmd.StdoutPipe()
	stderrPipe, _ := a.cmd.StderrPipe()

	go func() {
		scanner := bufio.NewScanner(stdoutPipe)
		for scanner.Scan() {
			a.output += "[OUT] " + scanner.Text() + "\n"
		}
	}()
	go func() {
		scanner := bufio.NewScanner(stderrPipe)
		for scanner.Scan() {
			a.output += "[ERR] " + scanner.Text() + "\n"
		}
	}()

	if err := a.cmd.Start(); err != nil {
		return fmt.Sprintf("Failed to start: %v", err)
	}

	a.running = true
	return fmt.Sprintf("Server started on port %s", port)
}

// StopGinServer 停止服务
func (a *App) StopGinServer() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	if !a.running || a.cmd == nil || a.cmd.Process == nil {
		return "Server is not running"
	}
	var err error
	if isUnix := runtime.GOOS != "windows"; isUnix {
		// Unix-like 系统：获取进程组并杀死整个组
		pgid, err := syscall.Getpgid(a.cmd.Process.Pid)
		if err == nil {
			// 注意：负号表示杀死整个进程组
			err = syscall.Kill(-pgid, syscall.SIGKILL)
		}
	} else {
		// Windows：直接终止进程
		err = a.cmd.Process.Kill()
	}
	if err != nil {
		return fmt.Sprintf("Failed to kill process: %v", err)
	}
	a.running = false
	return "Server stopped (forcefully)"
}

// GetServerStatus 获取状态
func (a *App) GetServerStatus() string {
	if a.running {
		return "Server is running"
	}
	return "Server is stopped"
}

// GetServerOutput 获取输出日志
func (a *App) GetServerOutput() string {
	return a.output
}
