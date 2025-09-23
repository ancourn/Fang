"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Settings, 
  Play, 
  Save, 
  Trash2, 
  Edit,
  Zap,
  Clock,
  MessageSquare,
  FileText,
  Users,
  Mail,
  CheckCircle,
  ArrowRight,
  GripVertical
} from "lucide-react";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowTrigger {
  type: string;
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: string;
  actions: string;
  isActive: boolean;
}

interface WorkflowBuilderProps {
  workflow: Workflow;
  onUpdate: () => void;
}

const triggerTypes = [
  { type: "time", name: "Time-based", icon: Clock, description: "Run at specific times or intervals" },
  { type: "event", name: "Event-based", icon: Zap, description: "Triggered by system events" },
  { type: "api", name: "API Trigger", icon: Settings, description: "Triggered via API calls" },
  { type: "manual", name: "Manual", icon: Play, description: "Triggered manually by users" },
];

const actionTypes = [
  { type: "send_email", name: "Send Email", icon: Mail, description: "Send email notifications" },
  { type: "create_task", name: "Create Task", icon: CheckCircle, description: "Create new tasks" },
  { type: "send_message", name: "Send Message", icon: MessageSquare, description: "Send chat messages" },
  { type: "create_document", name: "Create Document", icon: FileText, description: "Generate documents" },
  { type: "update_user", name: "Update User", icon: Users, description: "Update user information" },
  { type: "api_call", name: "API Call", icon: Settings, description: "Make HTTP requests" },
];

export function WorkflowBuilder({ workflow, onUpdate }: WorkflowBuilderProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [trigger, setTrigger] = useState<WorkflowTrigger>({ type: workflow.triggerType, config: {} });
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showTriggerDialog, setShowTriggerDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [draggingStep, setDraggingStep] = useState<string | null>(null);

  useEffect(() => {
    // Load existing workflow configuration
    try {
      const actions = JSON.parse(workflow.actions);
      const triggerConfig = JSON.parse(workflow.triggerConfig);
      
      setSteps(actions.map((action: any, index: number) => ({
        id: action.id || `step-${index}`,
        type: action.type,
        name: action.name || action.type,
        config: action.config || {},
        position: action.position || { x: 100 + (index * 200), y: 100 }
      })));
      
      setTrigger({
        type: workflow.triggerType,
        config: triggerConfig
      });
    } catch (error) {
      console.error("Failed to parse workflow configuration:", error);
    }
  }, [workflow]);

  const saveWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          triggerConfig: JSON.stringify(trigger.config),
          actions: JSON.stringify(steps),
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
    }
  };

  const addStep = (type: string) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      name: type,
      config: {},
      position: { x: 100 + (steps.length * 200), y: 100 }
    };
    setSteps([...steps, newStep]);
    setShowActionDialog(false);
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const deleteStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
    setSelectedStep(null);
  };

  const updateTrigger = (newTrigger: WorkflowTrigger) => {
    setTrigger(newTrigger);
    setShowTriggerDialog(false);
  };

  const getActionIcon = (type: string) => {
    const action = actionTypes.find(a => a.type === type);
    return action ? action.icon : Settings;
  };

  const getTriggerIcon = (type: string) => {
    const trigger = triggerTypes.find(t => t.type === type);
    return trigger ? trigger.icon : Settings;
  };

  const IconComponent = ({ type, isTrigger = false }: { type: string; isTrigger?: boolean }) => {
    const Icon = isTrigger ? getTriggerIcon(type) : getActionIcon(type);
    return <Icon className="h-5 w-5" />;
  };

  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggingStep(stepId);
    e.dataTransfer.setData("text/plain", stepId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingStep) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      updateStep(draggingStep, {
        position: { x, y }
      });
      
      setDraggingStep(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Workflow Builder</h2>
            <Badge variant="outline">
              {steps.length} steps
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showTriggerDialog} onOpenChange={setShowTriggerDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Trigger
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Trigger</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Trigger Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {triggerTypes.map((triggerType) => (
                        <Button
                          key={triggerType.type}
                          variant={trigger.type === triggerType.type ? "default" : "outline"}
                          className="h-20 flex-col"
                          onClick={() => updateTrigger({ type: triggerType.type, config: {} })}
                        >
                          <triggerType.icon className="h-6 w-6 mb-2" />
                          <span className="text-xs">{triggerType.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTriggerDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowTriggerDialog(false)}>
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Action</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Action Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {actionTypes.map((actionType) => (
                        <Button
                          key={actionType.type}
                          variant="outline"
                          className="h-20 flex-col"
                          onClick={() => addStep(actionType.type)}
                        >
                          <actionType.icon className="h-6 w-6 mb-2" />
                          <span className="text-xs">{actionType.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={saveWorkflow}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto relative bg-gray-50">
        <div 
          className="relative w-full h-full min-h-[600px]"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Trigger Node */}
          <div
            className="absolute top-8 left-8 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowTriggerDialog(true)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IconComponent type={trigger.type} isTrigger />
              </div>
              <div>
                <h3 className="font-medium text-sm">Trigger</h3>
                <p className="text-xs text-muted-foreground capitalize">{trigger.type}</p>
              </div>
            </div>
          </div>

          {/* Connection Line */}
          {steps.length > 0 && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <line
                x1="120"
                y1="80"
                x2={steps[0].position.x + 40}
                y2={steps[0].position.y + 40}
                stroke="#94a3b8"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#94a3b8"
                  />
                </marker>
              </defs>
            </svg>
          )}

          {/* Action Steps */}
          {steps.map((step, index) => (
            <div key={step.id}>
              {/* Step Node */}
              <div
                draggable
                className={`absolute bg-white border-2 rounded-lg p-4 shadow-sm cursor-move hover:shadow-md transition-all ${
                  selectedStep === step.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
                }`}
                style={{
                  left: step.position.x,
                  top: step.position.y,
                  width: "160px"
                }}
                onClick={() => setSelectedStep(step.id)}
                onDragStart={(e) => handleDragStart(e, step.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gray-100 rounded">
                      <IconComponent type={step.type} />
                    </div>
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStep(step.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <h4 className="font-medium text-sm mb-1">{step.name}</h4>
                <p className="text-xs text-muted-foreground capitalize">{step.type.replace('_', ' ')}</p>
              </div>

              {/* Connection Line to Next Step */}
              {index < steps.length - 1 && (
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <line
                    x1={step.position.x + 80}
                    y1={step.position.y + 40}
                    x2={steps[index + 1].position.x + 40}
                    y2={steps[index + 1].position.y + 40}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                </svg>
              )}
            </div>
          ))}

          {/* Step Configuration Panel */}
          {selectedStep && (
            <div className="absolute top-4 right-4 w-80 bg-white border rounded-lg shadow-lg">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Configure Step</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStep(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="stepName">Name</Label>
                  <Input
                    id="stepName"
                    value={steps.find(s => s.id === selectedStep)?.name || ""}
                    onChange={(e) => updateStep(selectedStep, { name: e.target.value })}
                  />
                </div>
                
                {/* Step-specific configuration */}
                {steps.find(s => s.id === selectedStep)?.type === "send_email" && (
                  <>
                    <div>
                      <Label htmlFor="emailTo">To</Label>
                      <Input
                        id="emailTo"
                        placeholder="recipient@example.com"
                        value={steps.find(s => s.id === selectedStep)?.config.to || ""}
                        onChange={(e) => updateStep(selectedStep, {
                          config: { ...steps.find(s => s.id === selectedStep)!.config, to: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailSubject">Subject</Label>
                      <Input
                        id="emailSubject"
                        placeholder="Email subject"
                        value={steps.find(s => s.id === selectedStep)?.config.subject || ""}
                        onChange={(e) => updateStep(selectedStep, {
                          config: { ...steps.find(s => s.id === selectedStep)!.config, subject: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailBody">Body</Label>
                      <Textarea
                        id="emailBody"
                        placeholder="Email content"
                        rows={3}
                        value={steps.find(s => s.id === selectedStep)?.config.body || ""}
                        onChange={(e) => updateStep(selectedStep, {
                          config: { ...steps.find(s => s.id === selectedStep)!.config, body: e.target.value }
                        })}
                      />
                    </div>
                  </>
                )}

                {steps.find(s => s.id === selectedStep)?.type === "create_task" && (
                  <>
                    <div>
                      <Label htmlFor="taskTitle">Task Title</Label>
                      <Input
                        id="taskTitle"
                        placeholder="Task title"
                        value={steps.find(s => s.id === selectedStep)?.config.title || ""}
                        onChange={(e) => updateStep(selectedStep, {
                          config: { ...steps.find(s => s.id === selectedStep)!.config, title: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskDescription">Description</Label>
                      <Textarea
                        id="taskDescription"
                        placeholder="Task description"
                        rows={3}
                        value={steps.find(s => s.id === selectedStep)?.config.description || ""}
                        onChange={(e) => updateStep(selectedStep, {
                          config: { ...steps.find(s => s.id === selectedStep)!.config, description: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taskAssignee">Assignee</Label>
                      <Input
                        id="taskAssignee"
                        placeholder="Assignee email or ID"
                        value={steps.find(s => s.id === selectedStep)?.config.assignee || ""}
                        onChange={(e) => updateStep(selectedStep, {
                          config: { ...steps.find(s => s.id === selectedStep)!.config, assignee: e.target.value }
                        })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}