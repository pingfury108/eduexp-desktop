import { useState } from 'react';

interface WorkflowItem {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  description: string;
  lastRun: string;
}

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([
    {
      id: '1',
      name: '数据处理流程',
      status: 'stopped',
      description: '处理用户上传的数据文件',
      lastRun: '2024-01-20 14:30:00'
    },
    {
      id: '2', 
      name: '自动化测试',
      status: 'running',
      description: '执行自动化测试流程',
      lastRun: '2024-01-20 15:45:00'
    },
    {
      id: '3',
      name: '报告生成',
      status: 'error',
      description: '生成日常业务报告',
      lastRun: '2024-01-20 13:15:00'
    }
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'running':
        return 'badge badge-success';
      case 'stopped':
        return 'badge badge-warning';
      case 'error':
        return 'badge badge-error';
      default:
        return 'badge badge-neutral';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return '运行中';
      case 'stopped':
        return '已停止';
      case 'error':
        return '错误';
      default:
        return '未知';
    }
  };

  const handleCreateWorkflow = () => {
    if (newWorkflowName.trim()) {
      const newWorkflow: WorkflowItem = {
        id: Date.now().toString(),
        name: newWorkflowName,
        status: 'stopped',
        description: newWorkflowDesc,
        lastRun: new Date().toLocaleString('zh-CN')
      };
      setWorkflows([...workflows, newWorkflow]);
      setNewWorkflowName('');
      setNewWorkflowDesc('');
      setIsCreateModalOpen(false);
    }
  };

  const handleRunWorkflow = (id: string) => {
    setWorkflows(workflows.map(workflow => 
      workflow.id === id 
        ? { ...workflow, status: 'running' as const, lastRun: new Date().toLocaleString('zh-CN') }
        : workflow
    ));
  };

  const handleStopWorkflow = (id: string) => {
    setWorkflows(workflows.map(workflow => 
      workflow.id === id 
        ? { ...workflow, status: 'stopped' as const }
        : workflow
    ));
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter(workflow => workflow.id !== id));
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-base-content mb-2">工作流管理</h2>
            <p className="text-base-content opacity-70">创建和管理自动化工作流程</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            创建工作流
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat bg-base-100 shadow-lg rounded-lg">
            <div className="stat-figure text-success">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">运行中</div>
            <div className="stat-value text-success">{workflows.filter(w => w.status === 'running').length}</div>
          </div>
          
          <div className="stat bg-base-100 shadow-lg rounded-lg">
            <div className="stat-figure text-warning">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">已停止</div>
            <div className="stat-value text-warning">{workflows.filter(w => w.status === 'stopped').length}</div>
          </div>
          
          <div className="stat bg-base-100 shadow-lg rounded-lg">
            <div className="stat-figure text-error">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">错误</div>
            <div className="stat-value text-error">{workflows.filter(w => w.status === 'error').length}</div>
          </div>
        </div>

        {/* Workflows List */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-xl mb-4">工作流列表</h3>
            
            {workflows.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-base-content opacity-70">暂无工作流，点击上方按钮创建新的工作流</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>名称</th>
                      <th>描述</th>
                      <th>状态</th>
                      <th>最后运行</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflows.map((workflow) => (
                      <tr key={workflow.id}>
                        <td>
                          <div className="font-medium text-base-content">{workflow.name}</div>
                        </td>
                        <td>
                          <div className="text-sm text-base-content opacity-70">{workflow.description}</div>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(workflow.status)}>
                            {getStatusText(workflow.status)}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm text-base-content">{workflow.lastRun}</div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {workflow.status === 'running' ? (
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => handleStopWorkflow(workflow.id)}
                              >
                                停止
                              </button>
                            ) : (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleRunWorkflow(workflow.id)}
                              >
                                运行
                              </button>
                            )}
                            <button
                              className="btn btn-error btn-sm"
                              onClick={() => handleDeleteWorkflow(workflow.id)}
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Workflow Modal */}
      {isCreateModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">创建新工作流</h3>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium text-base-content">工作流名称</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="输入工作流名称"
              />
            </div>
            
            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-medium text-base-content">描述</span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                value={newWorkflowDesc}
                onChange={(e) => setNewWorkflowDesc(e.target.value)}
                placeholder="输入工作流描述"
                rows={3}
              />
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-outline text-base-content"
                onClick={() => setIsCreateModalOpen(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateWorkflow}
                disabled={!newWorkflowName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 