package main

import (
	"bufio"
	"context"
	"fmt"
	"os/exec"
	"runtime"
	"sync"
	"syscall"
	"time"
)

// ProcessConfig 进程配置
type ProcessConfig struct {
	Name    string   // 进程名称
	Command string   // 命令
	Args    []string // 参数
	WorkDir string   // 工作目录
}

// Process 单个进程的管理
type Process struct {
	Config  *ProcessConfig
	cmd     *exec.Cmd
	running bool
	output  string
	mu      sync.Mutex
}

// ProcessManager 进程管理器
type ProcessManager struct {
	processes map[string]*Process       // 进程管理器，key为进程名称
	configs   map[string]*ProcessConfig // 注册的进程配置
	mu        sync.RWMutex              // 保护进程映射
	ctx       context.Context           // 上下文
}

// NewProcessManager 创建进程管理器
func NewProcessManager(ctx context.Context) *ProcessManager {
	pm := &ProcessManager{
		processes: make(map[string]*Process),
		configs:   make(map[string]*ProcessConfig),
		ctx:       ctx,
	}

	// 注册默认的Caddy文件服务器进程
	pm.RegisterProcess("caddy-fileserver", &ProcessConfig{
		Name:    "caddy-fileserver",
		Command: "caddy",
		Args:    []string{"file-server", "-b"},
		WorkDir: "",
	})

	return pm
}

// RegisterProcess 注册进程配置
func (pm *ProcessManager) RegisterProcess(name string, config *ProcessConfig) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.configs[name] = config
	pm.processes[name] = &Process{
		Config: config,
	}
}

// GetRegisteredProcesses 获取已注册的进程列表
func (pm *ProcessManager) GetRegisteredProcesses() []string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	names := make([]string, 0, len(pm.configs))
	for name := range pm.configs {
		names = append(names, name)
	}
	return names
}

// StartProcess 启动指定进程
func (pm *ProcessManager) StartProcess(processName string, extraArgs ...string) string {
	pm.mu.RLock()
	process, exists := pm.processes[processName]
	config, configExists := pm.configs[processName]
	pm.mu.RUnlock()

	if !exists || !configExists {
		return fmt.Sprintf("Process '%s' not found", processName)
	}

	process.mu.Lock()
	defer process.mu.Unlock()

	if process.running {
		return fmt.Sprintf("Process '%s' is already running!", processName)
	}

	// 构建完整的参数列表
	args := append(config.Args, extraArgs...)
	process.cmd = exec.CommandContext(pm.ctx, config.Command, args...)

	// 设置工作目录
	if config.WorkDir != "" {
		process.cmd.Dir = config.WorkDir
	}

	process.cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true, // 允许后续杀死整个进程组
	}

	// 捕获标准输出和错误
	stdoutPipe, _ := process.cmd.StdoutPipe()
	stderrPipe, _ := process.cmd.StderrPipe()

	go func() {
		scanner := bufio.NewScanner(stdoutPipe)
		for scanner.Scan() {
			process.mu.Lock()
			process.output += "[OUT] " + scanner.Text() + "\n"
			process.mu.Unlock()
		}
	}()
	go func() {
		scanner := bufio.NewScanner(stderrPipe)
		for scanner.Scan() {
			process.mu.Lock()
			process.output += "[ERR] " + scanner.Text() + "\n"
			process.mu.Unlock()
		}
	}()

	if err := process.cmd.Start(); err != nil {
		return fmt.Sprintf("Failed to start process '%s': %v", processName, err)
	}

	process.running = true

	// 监控子进程状态
	go func() {
		process.cmd.Wait()
		process.mu.Lock()
		process.running = false
		process.mu.Unlock()
	}()

	return fmt.Sprintf("Process '%s' started successfully", processName)
}

// StopProcess 停止指定进程
func (pm *ProcessManager) StopProcess(processName string) string {
	pm.mu.RLock()
	process, exists := pm.processes[processName]
	pm.mu.RUnlock()

	if !exists {
		return fmt.Sprintf("Process '%s' not found", processName)
	}

	process.mu.Lock()
	defer process.mu.Unlock()

	if !process.running || process.cmd == nil || process.cmd.Process == nil {
		return fmt.Sprintf("Process '%s' is not running", processName)
	}

	var err error
	if runtime.GOOS != "windows" {
		// Unix-like 系统：获取进程组并杀死整个组
		pgid, err := syscall.Getpgid(process.cmd.Process.Pid)
		if err == nil {
			// 注意：负号表示杀死整个进程组
			err = syscall.Kill(-pgid, syscall.SIGKILL)
		}
	} else {
		// Windows：直接终止进程
		err = process.cmd.Process.Kill()
	}

	if err != nil {
		return fmt.Sprintf("Failed to kill process '%s': %v", processName, err)
	}

	// 等待进程真正退出
	go func() {
		process.cmd.Wait()
	}()

	process.running = false
	return fmt.Sprintf("Process '%s' stopped (forcefully)", processName)
}

// GetProcessStatus 获取指定进程状态
func (pm *ProcessManager) GetProcessStatus(processName string) string {
	pm.mu.RLock()
	process, exists := pm.processes[processName]
	pm.mu.RUnlock()

	if !exists {
		return fmt.Sprintf("Process '%s' not found", processName)
	}

	process.mu.Lock()
	defer process.mu.Unlock()

	if process.running {
		return fmt.Sprintf("Process '%s' is running", processName)
	}
	return fmt.Sprintf("Process '%s' is stopped", processName)
}

// GetAllProcessStatus 获取所有进程状态
func (pm *ProcessManager) GetAllProcessStatus() map[string]string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	status := make(map[string]string)
	for name, process := range pm.processes {
		process.mu.Lock()
		if process.running {
			status[name] = "running"
		} else {
			status[name] = "stopped"
		}
		process.mu.Unlock()
	}
	return status
}

// GetProcessOutput 获取指定进程的输出日志
func (pm *ProcessManager) GetProcessOutput(processName string) string {
	pm.mu.RLock()
	process, exists := pm.processes[processName]
	pm.mu.RUnlock()

	if !exists {
		return fmt.Sprintf("Process '%s' not found", processName)
	}

	process.mu.Lock()
	defer process.mu.Unlock()
	return process.output
}

// StopAllProcesses 停止所有运行中的进程
func (pm *ProcessManager) StopAllProcesses() {
	pm.mu.RLock()
	var wg sync.WaitGroup
	for _, process := range pm.processes {
		if process.running {
			wg.Add(1)
			go func(p *Process) {
				defer wg.Done()
				p.stopGracefully()
			}(process)
		}
	}
	pm.mu.RUnlock()
	wg.Wait()
}

// ReleaseResources 释放所有进程资源
func (pm *ProcessManager) ReleaseResources() {
	pm.mu.RLock()
	for _, process := range pm.processes {
		if process.cmd != nil && process.cmd.Process != nil {
			process.cmd.Process.Release()
		}
	}
	pm.mu.RUnlock()
}

// stopGracefully 优雅地停止单个进程
func (p *Process) stopGracefully() {
	p.mu.Lock()
	defer p.mu.Unlock()

	if !p.running || p.cmd == nil || p.cmd.Process == nil {
		return
	}

	// 首先尝试优雅地终止（发送SIGTERM）
	var err error
	if runtime.GOOS != "windows" {
		// Unix-like 系统：首先尝试优雅关闭
		pgid, pgidErr := syscall.Getpgid(p.cmd.Process.Pid)
		if pgidErr == nil {
			// 发送SIGTERM信号进行优雅关闭
			err = syscall.Kill(-pgid, syscall.SIGTERM)
			if err == nil {
				// 等待进程退出，最多等待5秒
				done := make(chan error, 1)
				go func() {
					done <- p.cmd.Wait()
				}()

				select {
				case <-done:
					// 进程已经优雅退出
					p.running = false
					return
				case <-time.After(5 * time.Second):
					// 超时，强制杀死
					syscall.Kill(-pgid, syscall.SIGKILL)
				}
			}
		}
	} else {
		// Windows：直接终止进程
		err = p.cmd.Process.Kill()
	}

	// 等待进程真正退出
	if p.cmd.ProcessState == nil {
		go func() {
			p.cmd.Wait() // 等待进程退出，清理僵尸进程
		}()
	}

	p.running = false
}
