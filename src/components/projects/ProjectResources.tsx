"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, DollarSign, Clock, Package, Settings, MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface ProjectResource {
  id: string;
  name: string;
  type: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  allocated: boolean;
  allocationDate?: string;
  notes?: string;
}

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
  allocation?: number; // percentage allocation
}

interface ResourceAllocation {
  resourceId: string;
  taskId: string;
  quantity: number;
  startDate: string;
  endDate: string;
}

interface ProjectResourcesProps {
  projectId: string;
}

export function ProjectResources({ projectId }: ProjectResourcesProps) {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateResourceDialog, setShowCreateResourceDialog] = useState(false);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"resources" | "team" | "budget">("resources");

  useEffect(() => {
    fetchResourcesData();
  }, [projectId]);

  const fetchResourcesData = async () => {
    try {
      const [resourcesResponse, membersResponse, allocationsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}/resources`),
        fetch(`/api/projects/${projectId}/members`),
        fetch(`/api/projects/${projectId}/allocations`)
      ]);

      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData);
      }

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData);
      }

      if (allocationsResponse.ok) {
        const allocationsData = await allocationsResponse.json();
        setAllocations(allocationsData);
      }
    } catch (error) {
      console.error("Failed to fetch resources data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createResource = async (formData: FormData) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          type: formData.get("type"),
          quantity: formData.get("quantity") ? parseFloat(formData.get("quantity") as string) : null,
          unit: formData.get("unit"),
          cost: formData.get("cost") ? parseFloat(formData.get("cost") as string) : null,
          notes: formData.get("notes"),
        }),
      });

      if (response.ok) {
        await fetchResourcesData();
        setShowCreateResourceDialog(false);
      }
    } catch (error) {
      console.error("Failed to create resource:", error);
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "human": return <Users className="h-4 w-4" />;
      case "equipment": return <Settings className="h-4 w-4" />;
      case "material": return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case "human": return "bg-blue-100 text-blue-800";
      case "equipment": return "bg-orange-100 text-orange-800";
      case "material": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTotalBudget = () => {
    return resources.reduce((total, resource) => total + (resource.cost || 0), 0);
  };

  const calculateAllocatedBudget = () => {
    return resources
      .filter(resource => resource.allocated)
      .reduce((total, resource) => total + (resource.cost || 0), 0);
  };

  const calculateTeamUtilization = () => {
    const humanResources = members.filter(member => member.role === "member" || member.role === "manager");
    const totalAllocation = humanResources.reduce((total, member) => total + (member.allocation || 100), 0);
    return humanResources.length > 0 ? totalAllocation / humanResources.length : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Resource Management</h2>
            <p className="text-sm text-muted-foreground">Manage project resources, team allocation, and budget</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showCreateResourceDialog} onOpenChange={setShowCreateResourceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Resource</DialogTitle>
                </DialogHeader>
                <form action={createResource} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Resource Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="type">Resource Type</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="human">Human Resource</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input id="quantity" name="quantity" type="number" min="0" step="0.1" />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input id="unit" name="unit" placeholder="e.g., hours, pieces, kg" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input id="cost" name="cost" type="number" min="0" step="0.01" />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" rows={3} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateResourceDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Resource</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Resources</p>
                  <p className="text-2xl font-bold">{resources.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">${calculateTotalBudget().toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Utilization</p>
                  <p className="text-2xl font-bold">{calculateTeamUtilization().toFixed(0)}%</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={(value: "resources" | "team" | "budget") => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resources List */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  {resources.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No resources added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resources.map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              {getResourceTypeIcon(resource.type)}
                            </div>
                            <div>
                              <h4 className="font-medium">{resource.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-xs ${getResourceTypeColor(resource.type)}`}>
                                  {resource.type}
                                </Badge>
                                {resource.quantity && resource.unit && (
                                  <span className="text-xs text-muted-foreground">
                                    {resource.quantity} {resource.unit}
                                  </span>
                                )}
                                {resource.cost && (
                                  <span className="text-xs text-muted-foreground">
                                    ${resource.cost.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={resource.allocated ? "default" : "secondary"}>
                              {resource.allocated ? "Allocated" : "Available"}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resource Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle>Resource Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Budget Allocation</span>
                        <span className="text-sm text-muted-foreground">
                          ${calculateAllocatedBudget().toLocaleString()} / ${calculateTotalBudget().toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={calculateTotalBudget() > 0 ? (calculateAllocatedBudget() / calculateTotalBudget()) * 100 : 0} 
                        className="w-full" 
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Resource Utilization</span>
                        <span className="text-sm text-muted-foreground">
                          {resources.filter(r => r.allocated).length} / {resources.length}
                        </span>
                      </div>
                      <Progress 
                        value={resources.length > 0 ? (resources.filter(r => r.allocated).length / resources.length) * 100 : 0} 
                        className="w-full" 
                      />
                    </div>

                    <div className="pt-4">
                      <h4 className="font-medium mb-3">Allocation Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Human Resources:</span>
                          <span>{resources.filter(r => r.type === "human").length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Equipment:</span>
                          <span>{resources.filter(r => r.type === "equipment").length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Materials:</span>
                          <span>{resources.filter(r => r.type === "material").length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No team members assigned</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{member.user.name || member.user.email}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Allocation:</span>
                            <span>{member.allocation || 100}%</span>
                          </div>
                          <Progress value={member.allocation || 100} className="w-full" />
                          <div className="text-xs text-muted-foreground">
                            Joined: {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Budget</p>
                        <p className="text-2xl font-bold">${calculateTotalBudget().toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Allocated</p>
                        <p className="text-2xl font-bold">${calculateAllocatedBudget().toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Budget Utilization</span>
                        <span className="text-sm text-muted-foreground">
                          {calculateTotalBudget() > 0 ? ((calculateAllocatedBudget() / calculateTotalBudget()) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={calculateTotalBudget() > 0 ? (calculateAllocatedBudget() / calculateTotalBudget()) * 100 : 0} 
                        className="w-full" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget by Resource Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["human", "equipment", "material"].map((type) => {
                      const typeResources = resources.filter(r => r.type === type);
                      const typeBudget = typeResources.reduce((total, r) => total + (r.cost || 0), 0);
                      const percentage = calculateTotalBudget() > 0 ? (typeBudget / calculateTotalBudget()) * 100 : 0;
                      
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getResourceTypeIcon(type)}
                              <span className="text-sm font-medium capitalize">{type}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ${typeBudget.toLocaleString()} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="w-full" />
                        </div>
                      );
                    })}
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