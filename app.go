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
	"time"
)

// App struct
type App struct {
	ctx      context.Context
	cmd      *exec.Cmd  // 保存进程对象
	running  bool       // 运行状态
	output   string     // 记录输出日志
	mu       sync.Mutex // 保护共享字段
	exitOnce sync.Once  // 确保退出逻辑只执行一次
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
}

// shutdown is called when the app is shutting down
func (a *App) shutdown(ctx context.Context) {
	a.cleanup()
}

// beforeClose is called before the app closes
func (a *App) beforeClose(ctx context.Context) bool {
	// 清理子进程
	if a.running {
		a.stopServerGracefully()
	}
	// 返回 false 表示允许关闭
	return false
}

// setupExitHandler 监听系统退出信号，停止子进程
func (a *App) setupExitHandler() {
	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	<-signalChan // 阻塞直到收到信号
	a.cleanup()
}

// cleanup 统一的清理逻辑，确保只执行一次
func (a *App) cleanup() {
	a.exitOnce.Do(func() {
		if a.running {
			a.stopServerGracefully()
		}

		// 确保资源释放
		if a.cmd != nil && a.cmd.Process != nil {
			a.cmd.Process.Release()
		}
		// 注意：在 Wails 中，不要调用 os.Exit(0)，让 Wails 自己处理退出
	})
}

// stopServerGracefully 优雅地停止服务器
func (a *App) stopServerGracefully() {
	a.mu.Lock()
	defer a.mu.Unlock()

	if !a.running || a.cmd == nil || a.cmd.Process == nil {
		return
	}

	// 首先尝试优雅地终止（发送SIGTERM）
	var err error
	if runtime.GOOS != "windows" {
		// Unix-like 系统：首先尝试优雅关闭
		pgid, pgidErr := syscall.Getpgid(a.cmd.Process.Pid)
		if pgidErr == nil {
			// 发送SIGTERM信号进行优雅关闭
			err = syscall.Kill(-pgid, syscall.SIGTERM)
			if err == nil {
				// 等待进程退出，最多等待5秒
				done := make(chan error, 1)
				go func() {
					done <- a.cmd.Wait()
				}()

				select {
				case <-done:
					// 进程已经优雅退出
					a.running = false
					return
				case <-time.After(5 * time.Second):
					// 超时，强制杀死
					syscall.Kill(-pgid, syscall.SIGKILL)
				}
			}
		}
	} else {
		// Windows：直接终止进程
		err = a.cmd.Process.Kill()
	}

	// 等待进程真正退出
	if a.cmd.ProcessState == nil {
		go func() {
			a.cmd.Wait() // 等待进程退出，清理僵尸进程
		}()
	}

	a.running = false
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

	// 监控子进程状态
	go func() {
		a.cmd.Wait()
		a.mu.Lock()
		a.running = false
		a.mu.Unlock()
	}()

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
	if runtime.GOOS != "windows" {
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

	// 等待进程真正退出
	go func() {
		a.cmd.Wait()
	}()

	a.running = false
	return "Server stopped (forcefully)"
}

// GetServerStatus 获取状态
func (a *App) GetServerStatus() string {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.running {
		return "Server is running"
	}
	return "Server is stopped"
}

// GetServerOutput 获取输出日志
func (a *App) GetServerOutput() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.output
}
