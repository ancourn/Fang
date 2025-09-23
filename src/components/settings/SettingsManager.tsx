"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw
} from "lucide-react";

interface WorkspaceSettings {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  domain: string;
  timezone: string;
  language: string;
  defaultPermissions: string;
}

interface UserPreferences {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  desktopNotifications: boolean;
  messageNotifications: boolean;
  taskNotifications: boolean;
  meetingNotifications: boolean;
  documentNotifications: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  loginAlerts: boolean;
  dataEncryption: boolean;
}

interface SettingsManagerProps {
  workspaceId: string;
}

export function SettingsManager({ workspaceId }: SettingsManagerProps) {
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [workspaceId]);

  const loadSettings = async () => {
    try {
      // Mock data - replace with actual API calls
      setWorkspaceSettings({
        id: workspaceId,
        name: "My Workspace",
        description: "Team collaboration workspace",
        domain: "myworkspace.com",
        timezone: "UTC",
        language: "en",
        defaultPermissions: "member"
      });

      setUserPreferences({
        theme: "system",
        emailNotifications: true,
        pushNotifications: true,
        language: "en",
        timezone: "UTC",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "24h"
      });

      setNotificationSettings({
        emailNotifications: true,
        pushNotifications: true,
        desktopNotifications: true,
        messageNotifications: true,
        taskNotifications: true,
        meetingNotifications: true,
        documentNotifications: false
      });

      setSecuritySettings({
        twoFactorEnabled: false,
        sessionTimeout: 3600,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        },
        loginAlerts: true,
        dataEncryption: true
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your workspace and personal preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workspace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Workspace Information
              </CardTitle>
              <CardDescription>
                Basic information about your workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceSettings?.name || ""}
                    onChange={(e) => workspaceSettings && setWorkspaceSettings({
                      ...workspaceSettings,
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-domain">Domain</Label>
                  <Input
                    id="workspace-domain"
                    value={workspaceSettings?.domain || ""}
                    onChange={(e) => workspaceSettings && setWorkspaceSettings({
                      ...workspaceSettings,
                      domain: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-description">Description</Label>
                <Textarea
                  id="workspace-description"
                  value={workspaceSettings?.description || ""}
                  onChange={(e) => workspaceSettings && setWorkspaceSettings({
                    ...workspaceSettings,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={workspaceSettings?.timezone || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={workspaceSettings?.language || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Default Permissions
              </CardTitle>
              <CardDescription>
                Set default permissions for new workspace members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={workspaceSettings?.defaultPermissions || ""}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select default role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Preferences
              </CardTitle>
              <CardDescription>
                Customize your personal experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <Select value={userPreferences?.theme || ""}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences?.emailNotifications || false}
                    onCheckedChange={(checked) => userPreferences && setUserPreferences({
                      ...userPreferences,
                      emailNotifications: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences?.pushNotifications || false}
                    onCheckedChange={(checked) => userPreferences && setUserPreferences({
                      ...userPreferences,
                      pushNotifications: checked
                    })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={userPreferences?.dateFormat || ""}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select value={userPreferences?.timeFormat || ""}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings?.emailNotifications || false}
                    onCheckedChange={(checked) => notificationSettings && setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on mobile
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings?.pushNotifications || false}
                    onCheckedChange={(checked) => notificationSettings && setNotificationSettings({
                      ...notificationSettings,
                      pushNotifications: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Desktop Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive desktop browser notifications
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings?.desktopNotifications || false}
                    onCheckedChange={(checked) => notificationSettings && setNotificationSettings({
                      ...notificationSettings,
                      desktopNotifications: checked
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        New messages and mentions
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.messageNotifications || false}
                      onCheckedChange={(checked) => notificationSettings && setNotificationSettings({
                        ...notificationSettings,
                        messageNotifications: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Tasks</Label>
                      <p className="text-sm text-muted-foreground">
                        Task assignments and updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.taskNotifications || false}
                      onCheckedChange={(checked) => notificationSettings && setNotificationSettings({
                        ...notificationSettings,
                        taskNotifications: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Meetings</Label>
                      <p className="text-sm text-muted-foreground">
                        Meeting reminders and updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.meetingNotifications || false}
                      onCheckedChange={(checked) => notificationSettings && setNotificationSettings({
                        ...notificationSettings,
                        meetingNotifications: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Documents</Label>
                      <p className="text-sm text-muted-foreground">
                        Document updates and comments
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.documentNotifications || false}
                      onCheckedChange={(checked) => notificationSettings && setNotificationSettings({
                        ...notificationSettings,
                        documentNotifications: checked
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings?.twoFactorEnabled || false}
                    onCheckedChange={(checked) => securitySettings && setSecuritySettings({
                      ...securitySettings,
                      twoFactorEnabled: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone logs into your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings?.loginAlerts || false}
                    onCheckedChange={(checked) => securitySettings && setSecuritySettings({
                      ...securitySettings,
                      loginAlerts: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt sensitive data at rest
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings?.dataEncryption || false}
                    onCheckedChange={(checked) => securitySettings && setSecuritySettings({
                      ...securitySettings,
                      dataEncryption: checked
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Password Policy</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="min-length">Minimum Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      value={securitySettings?.passwordPolicy.minLength || 8}
                      onChange={(e) => securitySettings && setSecuritySettings({
                        ...securitySettings,
                        passwordPolicy: {
                          ...securitySettings.passwordPolicy,
                          minLength: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={securitySettings?.passwordPolicy.requireUppercase || false}
                      onCheckedChange={(checked) => securitySettings && setSecuritySettings({
                        ...securitySettings,
                        passwordPolicy: {
                          ...securitySettings.passwordPolicy,
                          requireUppercase: checked
                        }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings?.passwordPolicy.requireNumbers || false}
                      onCheckedChange={(checked) => securitySettings && setSecuritySettings({
                        ...securitySettings,
                        passwordPolicy: {
                          ...securitySettings.passwordPolicy,
                          requireNumbers: checked
                        }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Special Characters</Label>
                    <Switch
                      checked={securitySettings?.passwordPolicy.requireSpecialChars || false}
                      onCheckedChange={(checked) => securitySettings && setSecuritySettings({
                        ...securitySettings,
                        passwordPolicy: {
                          ...securitySettings.passwordPolicy,
                          requireSpecialChars: checked
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Manage your workspace data and exports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
                  <Download className="h-6 w-6" />
                  <div className="text-left">
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download all your workspace data
                    </p>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
                  <Upload className="h-6 w-6" />
                  <div className="text-left">
                    <h4 className="font-medium">Import Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Import data from other platforms
                    </p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="font-medium text-red-900">Delete Workspace</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Permanently delete your workspace and all its data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm" className="mt-3">
                    Delete Workspace
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}