"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  User, 
  Calendar, 
  MessageSquare, 
  Paperclip,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle
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

interface TaskCardProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: Task["status"]) => void;
  onAssigneeChange?: (taskId: string, assigneeId?: string) => void;
  onDelete?: (taskId: string) => void;
  className?: string;
}

const statusColors = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  in_review: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800"
};

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  in_review: AlertTriangle,
  done: CheckCircle2
};

const priorityColors = {
  low: "border-green-200",
  medium: "border-yellow-200",
  high: "border-orange-200",
  urgent: "border-red-200"
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent"
};

export function TaskCard({
  task,
  onTaskClick,
  onStatusChange,
  onAssigneeChange,
  onDelete,
  className
}: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const StatusIcon = statusIcons[task.status];

  const handleStatusChange = (newStatus: Task["status"]) => {
    onStatusChange?.(task.id, newStatus);
    setIsMenuOpen(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      });
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4",
        priorityColors[task.priority],
        className
      )}
      onClick={() => onTaskClick?.(task)}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <StatusIcon className={cn(
              "h-4 w-4 flex-shrink-0",
              task.status === "done" ? "text-green-600" : "text-gray-400"
            )} />
            <h3 className="text-sm font-medium line-clamp-2 flex-1">
              {task.title}
            </h3>
          </div>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleStatusChange("todo")}>
                <Circle className="h-3 w-3 mr-2" />
                Mark as To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
                <Clock className="h-3 w-3 mr-2" />
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("in_review")}>
                <AlertTriangle className="h-3 w-3 mr-2" />
                Mark as In Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("done")}>
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Mark as Done
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                    setIsMenuOpen(false);
                  }}
                  className="text-red-600"
                >
                  Delete Task
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {task.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.slice(0, 3).map((label) => (
              <Badge 
                key={label.id} 
                variant="secondary" 
                className="text-xs px-1.5 py-0"
                style={{ backgroundColor: label.color + "20", color: label.color }}
              >
                {label.name}
              </Badge>
            ))}
            {task.labels.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{task.labels.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className={cn(
            "flex items-center gap-1 text-xs mb-2",
            isOverdue ? "text-red-600" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.dueDate)}</span>
            {isOverdue && <span className="text-red-600 font-medium">(Overdue)</span>}
          </div>
        )}

        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
              <AvatarFallback className="text-xs">
                {task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {task.assignee.name || task.assignee.email}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {task._count.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task._count.comments}</span>
              </div>
            )}
            {task._count.attachments > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{task._count.attachments}</span>
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {priorityLabels[task.priority]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}