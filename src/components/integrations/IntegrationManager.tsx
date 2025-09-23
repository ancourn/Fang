"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plug, 
  Plus, 
  ExternalLink, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  Key,
  Webhook,
  Database,
  Zap,
  Shield
} from "lucide-react";

interface IntegrationConnection {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  icon?: string;
  description: string;
  workspaceId: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  permissions: string[];
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
  workspaceId: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: "active" | "inactive" | "failed";
  secret?: string;
  createdAt: string;
  lastTriggered?: string;
  workspaceId: string;
}

interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  isPopular: boolean;
  workspaceId: string;
}

interface IntegrationManagerProps {
  workspaceId: string;
}

export function IntegrationManager({ workspaceId }: IntegrationManagerProps) {
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, [workspaceId]);

  const loadIntegrations = async () => {
    try {
      // Mock data - replace with actual API calls
      setConnections([
        {
          id: "1",
          name: "Google Drive",
          type: "storage",
          status: "connected",
          lastSync: "2024-01-15T10:30:00Z",
          icon: "📁",
          description: "Connect to Google Drive for file storage",
          workspaceId
        },
        {
          id: "2",
          name: "Slack",
          type: "communication",
          status: "connected",
          lastSync: "2024-01-15T09:15:00Z",
          icon: "💬",
          description: "Connect to Slack for team communication",
          workspaceId
        },
        {
          id: "3",
          name: "GitHub",
          type: "development",
          status: "error",
          lastSync: "2024-01-14T16:45:00Z",
          icon: "🐙",
          description: "Connect to GitHub for code collaboration",
          workspaceId
        }
      ]);

      setApiKeys([
        {
          id: "1",
          name: "Production API Key",
          key: "sk_prod_1234567890abcdef",
          prefix: "sk_prod_",
          permissions: ["read", "write"],
          lastUsed: "2024-01-15T10:30:00Z",
          createdAt: "2024-01-01T00:00:00Z",
          workspaceId
        },
        {
          id: "2",
          name: "Read-only Key",
          key: "sk_read_0987654321fedcba",
          prefix: "sk_read_",
          permissions: ["read"],
          createdAt: "2024-01-10T00:00:00Z",
          workspaceId
        }
      ]);

      setWebhooks([
        {
          id: "1",
          name: "New Document Webhook",
          url: "https://example.com/webhook/documents",
          events: ["document.created", "document.updated"],
          status: "active",
          secret: "whsec_1234567890abcdef",
          createdAt: "2024-01-01T00:00:00Z",
          lastTriggered: "2024-01-15T10:30:00Z",
          workspaceId
        },
        {
          id: "2",
          name: "Task Completion Hook",
          url: "https://example.com/webhook/tasks",
          events: ["task.completed"],
          status: "inactive",
          createdAt: "2024-01-05T00:00:00Z",
          workspaceId
        }
      ]);

      setTemplates([
        {
          id: "1",
          name: "Google Workspace",
          description: "Connect Google Docs, Sheets, and Drive",
          category: "Productivity",
          icon: "📊",
          isPopular: true,
          workspaceId
        },
        {
          id: "2",
          name: "Microsoft 365",
          description: "Connect Outlook, Teams, and OneDrive",
          category: "Productivity",
          icon: "📧",
          isPopular: true,
          workspaceId
        },
        {
          id: "3",
          name: "Salesforce",
          description: "Connect your CRM for customer data",
          category: "CRM",
          icon: "🎯",
          isPopular: false,
          workspaceId
        },
        {
          id: "4",
          name: "Jira",
          description: "Connect Jira for project management",
          category: "Development",
          icon: "🐛",
          isPopular: true,
          workspaceId
        }
      ]);
    } catch (error) {
      console.error("Failed to load integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "disconnected":
      case "inactive":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "error":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: "default",
      active: "default",
      disconnected: "secondary",
      inactive: "secondary",
      error: "destructive",
      failed: "destructive"
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Plug className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your workspace with external services and tools
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>
                Manage your connections to external services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{connection.icon}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{connection.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {connection.description}
                        </p>
                        {connection.lastSync && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {new Date(connection.lastSync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connection.status)}
                      {getStatusBadge(connection.status)}
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for programmatic access to your workspace
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{apiKey.name}</h3>
                        <Badge variant="outline">{apiKey.prefix}••••••••</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                        {apiKey.lastUsed && (
                          <span>Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                        )}
                        {apiKey.expiresAt && (
                          <span>Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configure webhooks to receive real-time notifications
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{webhook.name}</h3>
                        {getStatusIcon(webhook.status)}
                        {getStatusBadge(webhook.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {webhook.url}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {new Date(webhook.createdAt).toLocaleDateString()}</span>
                        {webhook.lastTriggered && (
                          <span>Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{template.icon}</AvatarFallback>
                    </Avatar>
                    {template.isPopular && (
                      <Badge variant="default">Popular</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{template.category}</Badge>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}