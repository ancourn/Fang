"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  Clock, 
  Zap, 
  Calendar, 
  MessageSquare, 
  FileText,
  Users,
  MoreHorizontal,
  Edit,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { WorkflowBuilder } from "./WorkflowBuilder";
import { WorkflowExecutions } from "./WorkflowExecutions";

interface WorkflowExecution {
  id: string;
  status: string;
  triggerData?: string;
  result?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: string;
  actions: string;
  isActive: boolean;
  createdBy: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  executions: WorkflowExecution[];
  _count: {
    executions: number;
  };
}

interface WorkflowManagerProps {
  workspaceId: string;
}

export function WorkflowManager({ workspaceId }: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeView, setActiveView] = useState("list");

  useEffect(() => {
    fetchWorkflows();
  }, [workspaceId]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch(`/api/workflows?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (formData: FormData) => {
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          name: formData.get("name"),
          description: formData.get("description"),
          triggerType: formData.get("triggerType"),
          triggerConfig: "{}",
          actions: "[]",
        }),
      });

      if (response.ok) {
        await fetchWorkflows();
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
    }
  };

  const toggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        await fetchWorkflows();
      }
    } catch (error) {
      console.error("Failed to toggle workflow:", error);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchWorkflows();
      }
    } catch (error) {
      console.error("Failed to execute workflow:", error);
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case "time": return <Clock className="h-4 w-4" />;
      case "event": return <Zap className="h-4 w-4" />;
      case "api": return <Settings className="h-4 w-4" />;
      case "manual": return <Play className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getTriggerColor = (triggerType: string) => {
    switch (triggerType) {
      case "time": return "bg-blue-100 text-blue-800";
      case "event": return "bg-green-100 text-green-800";
      case "api": return "bg-purple-100 text-purple-800";
      case "manual": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Activity className="h-4 w-4 text-blue-500" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateSuccessRate = (workflow: Workflow) => {
    const executions = workflow.executions;
    if (executions.length === 0) return 0;
    const successful = executions.filter(e => e.status === "completed").length;
    return (successful / executions.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading workflows...</p>
        </div>
      </div>
    );
  }

  if (selectedWorkflow) {
    return (
      <div className="h-full flex flex-col">
        {/* Workflow Header */}
        <div className="border-b p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{selectedWorkflow.name}</h1>
                <Badge className={getTriggerColor(selectedWorkflow.triggerType)}>
                  {getTriggerIcon(selectedWorkflow.triggerType)}
                  <span className="ml-1">{selectedWorkflow.triggerType}</span>
                </Badge>
                <Badge variant={selectedWorkflow.isActive ? "default" : "secondary"}>
                  {selectedWorkflow.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {selectedWorkflow.description && (
                <p className="text-muted-foreground mb-4">{selectedWorkflow.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedWorkflow.creator.avatar} />
                    <AvatarFallback className="text-xs">
                      {selectedWorkflow.creator.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedWorkflow.creator.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span>{selectedWorkflow._count.executions} executions</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>{calculateSuccessRate(selectedWorkflow).toFixed(1)}% success rate</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toggleWorkflow(selectedWorkflow.id, !selectedWorkflow.isActive)}
              >
                {selectedWorkflow.isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => executeWorkflow(selectedWorkflow.id)}>
                <Play className="h-4 w-4 mr-2" />
                Run Now
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedWorkflow(null)}>
                ← Back
              </Button>
            </div>
          </div>
        </div>

        {/* Workflow Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeView} onValueChange={setActiveView} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="builder">Builder</TabsTrigger>
              <TabsTrigger value="executions">Executions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="builder" className="h-full mt-0">
              <WorkflowBuilder workflow={selectedWorkflow} onUpdate={fetchWorkflows} />
            </TabsContent>
            <TabsContent value="executions" className="h-full mt-0">
              <WorkflowExecutions workflowId={selectedWorkflow.id} />
            </TabsContent>
            <TabsContent value="settings" className="h-full mt-0 overflow-y-auto">
              <div className="p-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Workflow Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="workflowName">Name</Label>
                        <Input id="workflowName" defaultValue={selectedWorkflow.name} />
                      </div>
                      <div>
                        <Label htmlFor="workflowDescription">Description</Label>
                        <Textarea id="workflowDescription" defaultValue={selectedWorkflow.description || ""} rows={3} />
                      </div>
                      <div>
                        <Label htmlFor="triggerType">Trigger Type</Label>
                        <Select defaultValue={selectedWorkflow.triggerType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="time">Time-based</SelectItem>
                            <SelectItem value="event">Event-based</SelectItem>
                            <SelectItem value="api">API Trigger</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={selectedWorkflow.isActive}
                          onChange={(e) => toggleWorkflow(selectedWorkflow.id, e.target.checked)}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <h4 className="font-medium text-red-800 mb-2">Delete Workflow</h4>
                        <p className="text-sm text-red-600 mb-4">
                          This will permanently delete the workflow and all its execution history.
                        </p>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Workflow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Automate your business processes with custom workflows</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <form action={createWorkflow} className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div>
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select name="triggerType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time-based</SelectItem>
                    <SelectItem value="event">Event-based</SelectItem>
                    <SelectItem value="api">API Trigger</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Workflow</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
          <p className="text-muted-foreground mb-4">Create your first workflow to automate your business processes</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Badge className={getTriggerColor(workflow.triggerType)}>
                    {getTriggerIcon(workflow.triggerType)}
                    <span className="ml-1">{workflow.triggerType}</span>
                  </Badge>
                  <Badge variant={workflow.isActive ? "default" : "secondary"}>
                    {workflow.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {workflow.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {workflow.description}
                  </p>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span>{calculateSuccessRate(workflow).toFixed(1)}%</span>
                  </div>
                  <Progress value={calculateSuccessRate(workflow)} />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      <span>{workflow._count.executions} runs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => executeWorkflow(workflow.id)}
                    disabled={!workflow.isActive}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}