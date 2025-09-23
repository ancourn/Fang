"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, MoreHorizontal, Calendar, Clock, User, MessageSquare, Paperclip } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
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
    files: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectBoardProps {
  projectId: string;
}

const columns = [
  { id: "todo", title: "To Do", color: "bg-gray-100" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100" },
  { id: "in_review", title: "In Review", color: "bg-yellow-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
];

export function ProjectBoard({ projectId }: ProjectBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (formData: FormData) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          title: formData.get("title"),
          description: formData.get("description"),
          priority: formData.get("priority"),
          dueDate: formData.get("dueDate"),
          assigneeId: formData.get("assigneeId"),
        }),
      });

      if (response.ok) {
        await fetchTasks();
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Project Board</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form action={createTask} className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
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
                  <Input id="dueDate" name="dueDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="assigneeId">Assignee</Label>
                  <Select name="assigneeId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {/* Add team members here */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-6 h-full">
          {columns.map((column) => (
            <div key={column.id} className="flex-1 min-w-80">
              <div className={`${column.color} rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{column.title}</h3>
                  <Badge variant="secondary">
                    {getTasksByStatus(column.id).length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                {getTasksByStatus(column.id).map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {/* Labels */}
                        {task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.labels.map((label) => (
                              <Badge
                                key={label.id}
                                variant="outline"
                                className="text-xs"
                                style={{ backgroundColor: label.color + "20", borderColor: label.color }}
                              >
                                {label.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            {task.assignee && (
                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={task.assignee.avatar} />
                                  <AvatarFallback className="text-[8px]">
                                    {task.assignee.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {task._count.comments > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{task._count.comments}</span>
                              </div>
                            )}
                            {task._count.files > 0 && (
                              <div className="flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                <span>{task._count.files}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Change Buttons */}
                      <div className="mt-3 flex gap-1">
                        {column.id !== "todo" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => {
                              const currentIndex = columns.findIndex(c => c.id === column.id);
                              const prevColumn = columns[currentIndex - 1];
                              updateTaskStatus(task.id, prevColumn.id);
                            }}
                          >
                            ←
                          </Button>
                        )}
                        {column.id !== "done" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => {
                              const currentIndex = columns.findIndex(c => c.id === column.id);
                              const nextColumn = columns[currentIndex + 1];
                              updateTaskStatus(task.id, nextColumn.id);
                            }}
                          >
                            →
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}