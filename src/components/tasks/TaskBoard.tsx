"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { TaskCard } from "./TaskCard";
import { 
  Plus, 
  Search, 
  Filter, 
  Circle, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Users,
  Calendar
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  assignee?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  creator: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  _count: {
    comments: number;
    attachments: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskBoardProps {
  workspaceId: string;
  channelId?: string;
  className?: string;
}

const columns = [
  {
    id: "todo" as const,
    title: "To Do",
    icon: Circle,
    color: "bg-gray-100",
    textColor: "text-gray-800"
  },
  {
    id: "in_progress" as const,
    title: "In Progress",
    icon: Clock,
    color: "bg-blue-100",
    textColor: "text-blue-800"
  },
  {
    id: "in_review" as const,
    title: "In Review",
    icon: AlertTriangle,
    color: "bg-yellow-100",
    textColor: "text-yellow-800"
  },
  {
    id: "done" as const,
    title: "Done",
    icon: CheckCircle2,
    color: "bg-green-100",
    textColor: "text-green-800"
  }
];

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Design new landing page",
    description: "Create a modern, responsive landing page for the new product launch",
    status: "todo",
    priority: "high",
    dueDate: "2024-01-15",
    assignee: {
      id: "1",
      name: "Alice Chen",
      email: "alice@example.com",
      avatar: "/api/placeholder/32/32"
    },
    creator: {
      id: "1",
      name: "Alice Chen",
      email: "alice@example.com",
      avatar: "/api/placeholder/32/32"
    },
    labels: [
      { id: "1", name: "Design", color: "#8b5cf6" },
      { id: "2", name: "Frontend", color: "#3b82f6" }
    ],
    _count: {
      comments: 3,
      attachments: 2
    },
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-01T10:00:00Z"
  },
  {
    id: "2",
    title: "Implement user authentication",
    description: "Add JWT-based authentication with refresh tokens",
    status: "in_progress",
    priority: "urgent",
    dueDate: "2024-01-10",
    assignee: {
      id: "2",
      name: "Bob Wang",
      email: "bob@example.com",
      avatar: "/api/placeholder/32/32"
    },
    creator: {
      id: "2",
      name: "Bob Wang",
      email: "bob@example.com",
      avatar: "/api/placeholder/32/32"
    },
    labels: [
      { id: "3", name: "Backend", color: "#10b981" },
      { id: "4", name: "Security", color: "#ef4444" }
    ],
    _count: {
      comments: 5,
      attachments: 1
    },
    createdAt: "2024-01-02T10:00:00Z",
    updatedAt: "2024-01-03T10:00:00Z"
  },
  {
    id: "3",
    title: "Write API documentation",
    description: "Document all REST API endpoints with examples",
    status: "in_review",
    priority: "medium",
    dueDate: "2024-01-12",
    assignee: {
      id: "3",
      name: "Carol Liu",
      email: "carol@example.com",
      avatar: "/api/placeholder/32/32"
    },
    creator: {
      id: "3",
      name: "Carol Liu",
      email: "carol@example.com",
      avatar: "/api/placeholder/32/32"
    },
    labels: [
      { id: "5", name: "Documentation", color: "#f59e0b" }
    ],
    _count: {
      comments: 2,
      attachments: 0
    },
    createdAt: "2024-01-03T10:00:00Z",
    updatedAt: "2024-01-04T10:00:00Z"
  },
  {
    id: "4",
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment",
    status: "done",
    priority: "high",
    dueDate: "2024-01-08",
    assignee: {
      id: "4",
      name: "David Zhang",
      email: "david@example.com",
      avatar: "/api/placeholder/32/32"
    },
    creator: {
      id: "4",
      name: "David Zhang",
      email: "david@example.com",
      avatar: "/api/placeholder/32/32"
    },
    labels: [
      { id: "6", name: "DevOps", color: "#06b6d4" }
    ],
    _count: {
      comments: 1,
      attachments: 3
    },
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-05T10:00:00Z"
  }
];

export function TaskBoard({ workspaceId, channelId, className }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCreateTask = () => {
    // This will be implemented with the API
    console.log("Create new task");
    setIsCreateDialogOpen(false);
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return filteredTasks.filter(task => task.status === status);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Task Board</h2>
          <Badge variant="outline">{filteredTasks.length} tasks</Badge>
          {channelId && (
            <Badge variant="secondary">Channel: {channelId}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Task title" />
                <textarea 
                  placeholder="Description (optional)" 
                  className="w-full p-2 border rounded-md resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <select className="flex-1 p-2 border rounded-md">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input 
                    type="date" 
                    className="flex-1 p-2 border rounded-md"
                    placeholder="Due date"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask}>
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Board */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              const Icon = column.icon;
              
              return (
                <div key={column.id} className="flex flex-col h-full">
                  <Card className="mb-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4" />
                        <span>{column.title}</span>
                        <Badge variant="outline" className="ml-auto">
                          {columnTasks.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  
                  <div className="space-y-2 flex-1">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onTaskClick={handleTaskClick}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                    
                    {columnTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Task Details Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTask.title}
                <Badge variant="outline" className="text-xs">
                  {selectedTask.priority}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTask.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Status</h4>
                  <Badge className={cn(
                    "text-xs",
                    selectedTask.status === "todo" && "bg-gray-100 text-gray-800",
                    selectedTask.status === "in_progress" && "bg-blue-100 text-blue-800",
                    selectedTask.status === "in_review" && "bg-yellow-100 text-yellow-800",
                    selectedTask.status === "done" && "bg-green-100 text-green-800"
                  )}>
                    {selectedTask.status.replace("_", " ")}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Priority</h4>
                  <Badge variant="outline" className="text-xs">
                    {selectedTask.priority}
                  </Badge>
                </div>
                
                {selectedTask.dueDate && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Due Date</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                {selectedTask.assignee && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Assignee</h4>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                        {selectedTask.assignee.name?.charAt(0) || selectedTask.assignee.email.charAt(0)}
                      </div>
                      <span className="text-sm">{selectedTask.assignee.name || selectedTask.assignee.email}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedTask.labels.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Labels</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTask.labels.map((label) => (
                      <Badge 
                        key={label.id} 
                        variant="secondary" 
                        className="text-xs"
                        style={{ backgroundColor: label.color + "20", color: label.color }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Created by {selectedTask.creator.name || selectedTask.creator.email}</span>
                  <span>•</span>
                  <span>{new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                </div>
                <Button variant="outline" size="sm">
                  Edit Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}