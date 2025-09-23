"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Clock, Users, Target, MoreHorizontal, Edit } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
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

interface ProjectMilestone {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: string;
}

interface ProjectGanttProps {
  projectId: string;
}

export function ProjectGantt({ projectId }: ProjectGanttProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"days" | "weeks" | "months">("weeks");

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const [tasksResponse, milestonesResponse] = await Promise.all([
        fetch(`/api/tasks?projectId=${projectId}`),
        fetch(`/api/projects/${projectId}/milestones`)
      ]);

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData);
      }
    } catch (error) {
      console.error("Failed to fetch project data:", error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo": return "bg-gray-100 text-gray-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "in_review": return "bg-yellow-100 text-yellow-800";
      case "done": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTaskProgress = (task: Task) => {
    if (task.status === "done") return 100;
    if (task.status === "in_review") return 80;
    if (task.status === "in_progress") return 40;
    return 0;
  };

  const getTimelineDates = () => {
    const allDates = [
      ...tasks.map(t => t.startDate).filter(Boolean),
      ...tasks.map(t => t.dueDate).filter(Boolean),
      ...milestones.map(m => m.dueDate).filter(Boolean)
    ].map(date => new Date(date as string));

    if (allDates.length === 0) {
      const now = new Date();
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) };
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add some padding
    const start = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const end = new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    return { start, end };
  };

  const generateTimeline = () => {
    const { start, end } = getTimelineDates();
    const timeline = [];
    const current = new Date(start);

    while (current <= end) {
      timeline.push(new Date(current));
      
      if (viewMode === "days") {
        current.setDate(current.getDate() + 1);
      } else if (viewMode === "weeks") {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return timeline;
  };

  const calculatePosition = (date: Date | string) => {
    const { start, end } = getTimelineDates();
    const totalDuration = end.getTime() - start.getTime();
    const position = ((new Date(date).getTime() - start.getTime()) / totalDuration) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const calculateWidth = (startDate: Date | string, endDate: Date | string) => {
    const { start, end } = getTimelineDates();
    const totalDuration = end.getTime() - start.getTime();
    const taskDuration = new Date(endDate).getTime() - new Date(startDate).getTime();
    const width = (taskDuration / totalDuration) * 100;
    return Math.max(1, width);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading Gantt chart...</p>
        </div>
      </div>
    );
  }

  const timeline = generateTimeline();

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gantt Chart</h2>
            <p className="text-sm text-muted-foreground">Visualize project timeline and dependencies</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: "days" | "weeks" | "months") => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Timeline
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border shadow-sm">
          {/* Timeline Header */}
          <div className="border-b bg-gray-50">
            <div className="flex">
              <div className="w-80 p-4 border-r">
                <h3 className="font-semibold text-sm">Tasks & Milestones</h3>
              </div>
              <div className="flex-1 relative">
                <div className="flex h-12">
                  {timeline.map((date, index) => (
                    <div
                      key={index}
                      className="flex-1 border-r text-xs text-center p-2 font-medium text-gray-600"
                    >
                      {viewMode === "days" && date.getDate()}
                      {viewMode === "weeks" && `W${Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`}
                      {viewMode === "months" && date.toLocaleString('default', { month: 'short' })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="divide-y">
            {tasks.map((task) => {
              const progress = calculateTaskProgress(task);
              const hasDates = task.startDate && task.dueDate;
              
              return (
                <div key={task.id} className="flex hover:bg-gray-50">
                  <div className="w-80 p-4 border-r">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={task.assignee.avatar} />
                              <AvatarFallback className="text-[8px]">
                                {task.assignee.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {task.assignee.name || task.assignee.email}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 relative p-4">
                    {hasDates ? (
                      <div className="relative h-8">
                        <div
                          className="absolute top-2 h-4 bg-blue-200 rounded-full"
                          style={{
                            left: `${calculatePosition(task.startDate)}%`,
                            width: `${calculateWidth(task.startDate, task.dueDate)}%`,
                          }}
                        >
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div
                          className="absolute -top-6 text-xs text-gray-600"
                          style={{ left: `${calculatePosition(task.startDate)}%` }}
                        >
                          {new Date(task.startDate).toLocaleDateString()}
                        </div>
                        <div
                          className="absolute -top-6 text-xs text-gray-600"
                          style={{ left: `${calculatePosition(task.dueDate)}%` }}
                        >
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No dates set</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Milestones */}
            {milestones.map((milestone) => (
              <div key={milestone.id} className="flex hover:bg-gray-50">
                <div className="w-80 p-4 border-r">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-purple-500" />
                        <h4 className="font-medium text-sm">{milestone.name}</h4>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(milestone.status)}`}>
                        {milestone.status}
                      </Badge>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 relative p-4">
                  {milestone.dueDate ? (
                    <div className="relative h-8">
                      <div
                        className="absolute top-2 w-3 h-3 bg-purple-500 rounded-full transform -translate-x-1/2"
                        style={{ left: `${calculatePosition(milestone.dueDate)}%` }}
                      />
                      <div
                        className="absolute -top-6 text-xs text-purple-600 font-medium"
                        style={{ left: `${calculatePosition(milestone.dueDate)}%` }}
                      >
                        {new Date(milestone.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No due date set</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Today Line */}
          <div className="absolute top-12 bottom-0 w-0.5 bg-red-500 pointer-events-none" style={{ left: `${calculatePosition(new Date())}%` }}>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-500 rounded-full" />
            <span>Task Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span>Milestone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-500" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}