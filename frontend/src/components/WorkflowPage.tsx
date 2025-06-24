import { useState, useEffect } from 'react';
import { GetWorkflowConfig } from '../../wailsjs/go/main/App';
import ProcessManager from './ProcessManager';

interface WorkflowItem {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  description: string;
  lastRun: string;
  workflow_id: string;
  app_id: string;
}

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载工作流配置
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        const workflowConfig = await GetWorkflowConfig();
        
        const workflowItems: WorkflowItem[] = [];
        if (workflowConfig.Workflows) {
          Object.entries(workflowConfig.Workflows).forEach(([key, workflow]) => {
            workflowItems.push({
              id: key,
              name: workflow.Name || '未命名功能',
              status: 'stopped',
              description: workflow.WorkflowID ? `工作流ID: ${workflow.WorkflowID}` : '无工作流ID',
              lastRun: '未调用',
              workflow_id: workflow.WorkflowID || '',
              app_id: workflow.AppID || ''
            });
          });
        }
        
        setWorkflows(workflowItems);
      } catch (error) {
        console.error('Failed to load workflows:', error);
        setWorkflows([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-4 text-base-content">加载工作流配置中...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl">
        {/* 进程管理组件 */}
        <ProcessManager />

        {/* 服务功能列表 */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="mb-4">
              <h3 className="card-title text-xl">服务功能列表</h3>
            </div>
            
            {workflows.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚙️</div>
                <p className="text-base-content opacity-70 mb-4">暂无功能配置</p>
                <p className="text-sm text-base-content opacity-50">请前往设置页面添加工作流配置</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>功能名称</th>
                      <th>描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflows.map((workflow) => (
                      <tr key={workflow.id}>
                        <td>
                          <div>
                            <div className="font-medium text-base-content">{workflow.name}</div>
                            <div className="text-xs text-base-content opacity-50">ID: {workflow.workflow_id}</div>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-base-content opacity-70">{workflow.description}</div>
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
    </div>
  );
} 