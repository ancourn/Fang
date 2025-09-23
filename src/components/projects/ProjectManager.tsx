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
import { Calendar, Clock, Users, DollarSign, Target, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ProjectBoard } from "./ProjectBoard";
import { ProjectGantt } from "./ProjectGantt";
import { ProjectResources } from "./ProjectResources";

interface ProjectMember {
  id: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  role: string;
  joinedAt: string;
}

interface ProjectMilestone {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: string;
}

interface ProjectResource {
  id: string;
  name: string;
  type: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  allocated: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  manager?: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  members: ProjectMember[];
  milestones: ProjectMilestone[];
  resources: ProjectResource[];
  _count: {
    tasks: number;
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectManagerProps {
  workspaceId: string;
}

export function ProjectManager({ workspaceId }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeView, setActiveView] = useState("board");

  useEffect(() => {
    fetchProjects();
  }, [workspaceId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/projects?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (formData: FormData) => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          name: formData.get("name"),
          description: formData.get("description"),
          priority: formData.get("priority"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate"),
          budget: formData.get("budget") ? parseFloat(formData.get("budget") as string) : null,
        }),
      });

      if (response.ok) {
        await fetchProjects();
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "on_hold": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProgress = (project: Project) => {
    const completedTasks = project._count.tasks * 0.7; // Simulated progress
    return Math.min(completedTasks, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="h-full flex flex-col">
        {/* Project Header */}
        <div className="border-b p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
                <Badge className={getStatusColor(selectedProject.status)}>
                  {selectedProject.status}
                </Badge>
                <Badge className={getPriorityColor(selectedProject.priority)}>
                  {selectedProject.priority}
                </Badge>
              </div>
              {selectedProject.description && (
                <p className="text-muted-foreground mb-4">{selectedProject.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {selectedProject.manager && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedProject.manager.avatar} />
                      <AvatarFallback className="text-xs">
                        {selectedProject.manager.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedProject.manager.name}</span>
                  </div>
                )}
                {selectedProject.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedProject.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedProject.endDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(selectedProject.endDate).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedProject.budget && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>${selectedProject.budget.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{selectedProject._count.members} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>{selectedProject._count.tasks} tasks</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {calculateProgress(selectedProject).toFixed(0)}%
                  </span>
                </div>
                <Progress value={calculateProgress(selectedProject)} className="w-full max-w-md" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>
                ← Back
              </Button>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeView} onValueChange={setActiveView} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="board" className="h-full mt-0">
              <ProjectBoard projectId={selectedProject.id} />
            </TabsContent>
            <TabsContent value="gantt" className="h-full mt-0">
              <ProjectGantt projectId={selectedProject.id} />
            </TabsContent>
            <TabsContent value="resources" className="h-full mt-0">
              <ProjectResources projectId={selectedProject.id} />
            </TabsContent>
            <TabsContent value="details" className="h-full mt-0 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle>Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProject.milestones.length > 0 ? (
                      <div className="space-y-3">
                        {selectedProject.milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{milestone.name}</h4>
                              {milestone.description && (
                                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                              )}
                              {milestone.dueDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <Badge className={getStatusColor(milestone.status)}>
                              {milestone.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No milestones yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedProject.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.user.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.user.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{member.user.name || member.user.email}</h4>
                              <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{member.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Resources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProject.resources.length > 0 ? (
                      <div className="space-y-3">
                        {selectedProject.resources.map((resource) => (
                          <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{resource.name}</h4>
                              <p className="text-sm text-muted-foreground capitalize">{resource.type}</p>
                              {resource.quantity && resource.unit && (
                                <p className="text-xs text-muted-foreground">
                                  {resource.quantity} {resource.unit}
                                </p>
                              )}
                              {resource.cost && (
                                <p className="text-xs text-muted-foreground">
                                  ${resource.cost.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <Badge variant={resource.allocated ? "default" : "secondary"}>
                              {resource.allocated ? "Allocated" : "Available"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No resources allocated</p>
                    )}
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
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and track progress</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form action={createProject} className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" name="name" required />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
              </div>
              <div>
                <Label htmlFor="budget">Budget ($)</Label>
                <Input id="budget" name="budget" type="number" min="0" step="1000" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">Create your first project to get started</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{calculateProgress(project).toFixed(0)}%</span>
                  </div>
                  <Progress value={calculateProgress(project)} />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project._count.members}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{project._count.tasks} tasks</span>
                    </div>
                    {project.budget && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>${project.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => setSelectedProject(project)}
                >
                  View Project
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}