"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, User, FileText, Calendar } from 'lucide-react';

interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  type: string;
  workspaceId: string;
  isActive: boolean;
  stages: ApprovalStage[];
  createdAt: string;
  updatedAt: string;
}

interface ApprovalStage {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  order: number;
  type: string;
  approverType: string;
  approverId?: string;
  timeoutHours?: number;
  isRequired: boolean;
  conditions?: string;
  createdAt: string;
  updatedAt: string;
}

interface Approval {
  id: string;
  workflowId: string;
  stageId: string;
  title: string;
  description?: string;
  type: string;
  entityId: string;
  status: string;
  priority: string;
  requesterId: string;
  workspaceId: string;
  dueDate?: string;
  completedAt?: string;
  workflow: ApprovalWorkflow;
  stage: ApprovalStage;
  requester: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  comments: ApprovalComment[];
  history: ApprovalHistory[];
  createdAt: string;
  updatedAt: string;
}

interface ApprovalComment {
  id: string;
  approvalId: string;
  userId: string;
  content: string;
  action: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface ApprovalHistory {
  id: string;
  approvalId: string;
  userId: string;
  action: string;
  details?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface ApprovalManagerProps {
  workspaceId: string;
}

export function ApprovalManager({ workspaceId }: ApprovalManagerProps) {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [myApprovals, setMyApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
  const [isCreateApprovalOpen, setIsCreateApprovalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const fetchData = async () => {
    try {
      const [workflowsRes, approvalsRes, myApprovalsRes] = await Promise.all([
        fetch(`/api/approval-workflows?workspaceId=${workspaceId}`),
        fetch(`/api/approvals?workspaceId=${workspaceId}`),
        fetch(`/api/approvals?workspaceId=${workspaceId}&userId=${localStorage.getItem('userId')}`),
      ]);

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData);
      }

      if (approvalsRes.ok) {
        const approvalsData = await approvalsRes.json();
        setApprovals(approvalsData);
      }

      if (myApprovalsRes.ok) {
        const myApprovalsData = await myApprovalsRes.json();
        setMyApprovals(myApprovalsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Approval Workflows</h1>
        <div className="flex gap-2">
          <Dialog open={isCreateWorkflowOpen} onOpenChange={setIsCreateWorkflowOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Approval Workflow</DialogTitle>
              </DialogHeader>
              <CreateWorkflowForm 
                workspaceId={workspaceId} 
                onSuccess={() => {
                  setIsCreateWorkflowOpen(false);
                  fetchData();
                }} 
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateApprovalOpen} onOpenChange={setIsCreateApprovalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Request Approval
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Request Approval</DialogTitle>
              </DialogHeader>
              <CreateApprovalForm 
                workflows={workflows}
                workspaceId={workspaceId}
                onSuccess={() => {
                  setIsCreateApprovalOpen(false);
                  fetchData();
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="approvals">All Approvals</TabsTrigger>
          <TabsTrigger value="my-approvals">My Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {workflow.name}
                    </CardTitle>
                    <Badge variant="outline">{workflow.type}</Badge>
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Approval Stages:</h4>
                    <div className="flex flex-wrap gap-2">
                      {workflow.stages.map((stage, index) => (
                        <Badge key={stage.id} variant="secondary">
                          {index + 1}. {stage.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {workflows.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No approval workflows</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first approval workflow to start managing approvals
                  </p>
                  <Button onClick={() => setIsCreateWorkflowOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="grid gap-4">
            {approvals.map((approval) => (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(approval.status)}
                      {approval.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(approval.status)}>
                        {approval.status}
                      </Badge>
                      <Badge className={getPriorityColor(approval.priority)}>
                        {approval.priority}
                      </Badge>
                    </div>
                  </div>
                  {approval.description && (
                    <p className="text-sm text-muted-foreground">{approval.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Requested by {approval.requester.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(approval.createdAt), 'MMM dd, yyyy')}
                      </div>
                      {approval.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Due {format(new Date(approval.dueDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Current Stage:</h4>
                      <Badge variant="outline">{approval.stage.name}</Badge>
                    </div>

                    {approval.comments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Comments:</h4>
                        <div className="space-y-2">
                          {approval.comments.slice(0, 2).map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2 text-sm">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={comment.user.avatar} />
                                <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium">{comment.user.name}:</span>
                                <span className="ml-1">{comment.content}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {approvals.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No approvals</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    No approval requests found
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-approvals" className="space-y-4">
          <div className="grid gap-4">
            {myApprovals.map((approval) => (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(approval.status)}
                      {approval.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(approval.status)}>
                        {approval.status}
                      </Badge>
                      <Badge className={getPriorityColor(approval.priority)}>
                        {approval.priority}
                      </Badge>
                    </div>
                  </div>
                  {approval.description && (
                    <p className="text-sm text-muted-foreground">{approval.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(approval.createdAt), 'MMM dd, yyyy')}
                      </div>
                      {approval.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Due {format(new Date(approval.dueDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Current Stage:</h4>
                      <Badge variant="outline">{approval.stage.name}</Badge>
                    </div>

                    {approval.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprovalAction(approval.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApprovalAction(approval.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {myApprovals.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No approvals assigned</h3>
                  <p className="text-muted-foreground text-center">
                    You don't have any approvals pending
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateWorkflowForm({ workspaceId, onSuccess }: { workspaceId: string; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'task',
    stages: [
      { name: 'Initial Review', description: '', order: 0, type: 'sequential', approverType: 'user', approverId: '', isRequired: true }
    ]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/approval-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, workspaceId }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Workflow Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="leave">Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Approval Stages</Label>
        {formData.stages.map((stage, index) => (
          <div key={index} className="border rounded p-3 space-y-2">
            <Input
              placeholder="Stage name"
              value={stage.name}
              onChange={(e) => {
                const newStages = [...formData.stages];
                newStages[index].name = e.target.value;
                setFormData({ ...formData, stages: newStages });
              }}
              required
            />
            <Textarea
              placeholder="Stage description"
              value={stage.description}
              onChange={(e) => {
                const newStages = [...formData.stages];
                newStages[index].description = e.target.value;
                setFormData({ ...formData, stages: newStages });
              }}
            />
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full">Create Workflow</Button>
    </form>
  );
}

function CreateApprovalForm({ workflows, workspaceId, onSuccess }: { 
  workflows: ApprovalWorkflow[]; 
  workspaceId: string; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    workflowId: '',
    title: '',
    description: '',
    type: 'task',
    entityId: '',
    priority: 'medium',
    dueDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating approval:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="workflow">Workflow</Label>
        <Select value={formData.workflowId} onValueChange={(value) => setFormData({ ...formData, workflowId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select workflow" />
          </SelectTrigger>
          <SelectContent>
            {workflows.map((workflow) => (
              <SelectItem key={workflow.id} value={workflow.id}>
                {workflow.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full">Request Approval</Button>
    </form>
  );
}

function handleApprovalAction(approvalId: string, action: string) {
  // This would open a dialog to add a comment and confirm the action
  console.log(`Approval ${action} for ${approvalId}`);
}