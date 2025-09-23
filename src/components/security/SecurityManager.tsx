"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  FileText,
  Settings,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { SecurityPolicy, SecurityAuditLog } from '@/types';

interface SecurityManagerProps {
  workspaceId: string;
}

export function SecurityManager({ workspaceId }: SecurityManagerProps) {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [securityMetrics, setSecurityMetrics] = useState({
    totalUsers: 0,
    mfaEnabled: 0,
    securityIncidents: 0,
    complianceScore: 0
  });

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      const [policiesRes, logsRes] = await Promise.all([
        fetch(`/api/security/policies?workspaceId=${workspaceId}`),
        fetch(`/api/security/audit-logs?workspaceId=${workspaceId}&limit=100`)
      ]);

      const [policiesData, logsData] = await Promise.all([
        policiesRes.json(),
        logsRes.json()
      ]);

      setPolicies(policiesData);
      setAuditLogs(logsData.logs || []);
      
      // Calculate security metrics
      const metrics = {
        totalUsers: 150, // This would come from an API
        mfaEnabled: policiesData.filter(p => p.type === 'mfa').length,
        securityIncidents: logsData.logs?.filter(l => l.riskLevel === 'high').length || 0,
        complianceScore: 85 // This would be calculated from compliance data
      };
      setSecurityMetrics(metrics);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async (formData: FormData) => {
    try {
      const response = await fetch('/api/security/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          type: formData.get('type'),
          config: {},
          workspaceId
        })
      });

      if (response.ok) {
        setShowCreatePolicy(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating policy:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'password': return <Lock className="h-4 w-4" />;
      case 'mfa': return <Shield className="h-4 w-4" />;
      case 'session': return <Clock className="h-4 w-4" />;
      case 'access_control': return <Users className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
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
        <div>
          <h1 className="text-2xl font-bold">Security & Compliance</h1>
          <p className="text-muted-foreground">
            Manage security policies, monitor audit logs, and ensure compliance
          </p>
        </div>
        <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Security Policy</DialogTitle>
              <DialogDescription>
                Configure a new security policy for your workspace
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreatePolicy} className="space-y-4">
              <div>
                <Label htmlFor="name">Policy Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="type">Policy Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">Password Policy</SelectItem>
                    <SelectItem value="mfa">Multi-Factor Authentication</SelectItem>
                    <SelectItem value="session">Session Management</SelectItem>
                    <SelectItem value="data_retention">Data Retention</SelectItem>
                    <SelectItem value="access_control">Access Control</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create Policy</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Active users in workspace</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">MFA Enabled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.mfaEnabled}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((securityMetrics.mfaEnabled / securityMetrics.totalUsers) * 100)}% adoption rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.securityIncidents}</div>
                <p className="text-xs text-muted-foreground">High-risk events this month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.complianceScore}%</div>
                <p className="text-xs text-muted-foreground">Overall compliance status</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.user?.name} • {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getRiskLevelColor(log.riskLevel)}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {policies.slice(0, 5).map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getPolicyIcon(policy.type)}
                        <div>
                          <p className="text-sm font-medium">{policy.name}</p>
                          <p className="text-xs text-muted-foreground">{policy.type}</p>
                        </div>
                      </div>
                      <Badge variant={policy.isActive ? "default" : "secondary"}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search policies..." className="w-64" />
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getPolicyIcon(policy.type)}
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                    </div>
                    <Badge variant={policy.isActive ? "default" : "secondary"}>
                      {policy.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{policy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Type:</span>
                      <Badge variant="outline">{policy.type}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Applied to:</span>
                      <span>{policy.userSecuritySettings?.length || 0} users</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Created:</span>
                      <span>{new Date(policy.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search audit logs..." className="w-64" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user?.name || 'System'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {log.action.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.resource || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-white ${getRiskLevelColor(log.riskLevel)}`}
                        >
                          {log.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(log.status)}
                          <span className="text-sm">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>GDPR Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">92%</div>
                  <p className="text-sm text-muted-foreground">Compliant</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>SOC 2 Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">78%</div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ISO 27001</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">65%</div>
                  <p className="text-sm text-muted-foreground">Planning</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>
                Track and manage security incidents and responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No security incidents reported</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Report Incident
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}