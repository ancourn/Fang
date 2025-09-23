"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  User
} from "lucide-react";

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

interface WorkflowExecutionsProps {
  workflowId: string;
}

export function WorkflowExecutions({ workflowId }: WorkflowExecutionsProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  useEffect(() => {
    fetchExecutions();
  }, [workflowId]);

  const fetchExecutions = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/executions`);
      if (response.ok) {
        const data = await response.json();
        setExecutions(data);
      }
    } catch (error) {
      console.error("Failed to fetch executions:", error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDuration = (execution: WorkflowExecution) => {
    if (!execution.completedAt) return null;
    const start = new Date(execution.startedAt);
    const end = new Date(execution.completedAt);
    const duration = end.getTime() - start.getTime();
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    if (duration < 3600000) return `${(duration / 60000).toFixed(1)}m`;
    return `${(duration / 3600000).toFixed(1)}h`;
  };

  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = !searchTerm || 
      execution.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || execution.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportExecutions = () => {
    const data = filteredExecutions.map(execution => ({
      ID: execution.id,
      Status: execution.status,
      Started: new Date(execution.startedAt).toISOString(),
      Completed: execution.completedAt ? new Date(execution.completedAt).toISOString() : '',
      Duration: getDuration(execution) || '',
      User: execution.user?.name || execution.user?.email || '',
      'Trigger Data': execution.triggerData || '',
      Result: execution.result || '',
      'Error Message': execution.errorMessage || ''
    }));
    
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-executions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading executions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Execution History</h2>
            <p className="text-sm text-muted-foreground">
              {executions.length} total executions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchExecutions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportExecutions}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search executions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Executions List */}
      <div className="flex-1 overflow-auto">
        {filteredExecutions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No executions found</h3>
            <p className="text-muted-foreground">
              {executions.length === 0 ? "Run the workflow to see execution history" : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredExecutions.map((execution) => (
              <div 
                key={execution.id} 
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedExecution(execution)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(execution.startedAt).toLocaleString()}</span>
                    </div>

                    {execution.user && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{execution.user.name || execution.user.email}</span>
                      </div>
                    )}

                    {getDuration(execution) && (
                      <div className="text-sm text-muted-foreground">
                        Duration: {getDuration(execution)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {execution.status === "running" && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span className="text-xs">Running</span>
                      </div>
                    )}
                    <Button variant="ghost" size="sm">
                      →
                    </Button>
                  </div>
                </div>

                {/* Execution Details Preview */}
                {(execution.triggerData || execution.result || execution.errorMessage) && (
                  <div className="mt-3 pl-8">
                    <div className="text-xs text-muted-foreground space-y-1">
                      {execution.triggerData && (
                        <div>
                          <strong>Trigger:</strong> {JSON.stringify(JSON.parse(execution.triggerData), null, 2).substring(0, 100)}...
                        </div>
                      )}
                      {execution.result && (
                        <div>
                          <strong>Result:</strong> {JSON.stringify(JSON.parse(execution.result), null, 2).substring(0, 100)}...
                        </div>
                      )}
                      {execution.errorMessage && (
                        <div className="text-red-600">
                          <strong>Error:</strong> {execution.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Details Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedExecution.status)}
                  <h3 className="text-lg font-semibold">Execution Details</h3>
                  <Badge className={getStatusColor(selectedExecution.status)}>
                    {selectedExecution.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedExecution(null)}
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Execution ID</label>
                    <p className="text-sm font-mono">{selectedExecution.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedExecution.status)}
                      <span className="capitalize">{selectedExecution.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Started</label>
                    <p className="text-sm">{new Date(selectedExecution.startedAt).toLocaleString()}</p>
                  </div>
                  {selectedExecution.completedAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Completed</label>
                      <p className="text-sm">{new Date(selectedExecution.completedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {getDuration(selectedExecution) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Duration</label>
                      <p className="text-sm">{getDuration(selectedExecution)}</p>
                    </div>
                  )}
                  {selectedExecution.user && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Triggered By</label>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedExecution.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {selectedExecution.user.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{selectedExecution.user.name || selectedExecution.user.email}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trigger Data */}
                {selectedExecution.triggerData && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Trigger Data</label>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(JSON.parse(selectedExecution.triggerData), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Result */}
                {selectedExecution.result && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Result</label>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(JSON.parse(selectedExecution.result), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Error Message */}
                {selectedExecution.errorMessage && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Error Message</label>
                    <div className="bg-red-50 border border-red-200 p-3 rounded">
                      <p className="text-sm text-red-800">{selectedExecution.errorMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}