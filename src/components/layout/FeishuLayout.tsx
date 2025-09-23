"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChannelManager } from "@/components/channels/ChannelManager";
import { DocumentManager } from "@/components/documents/DocumentManager";
import { TaskManager } from "@/components/tasks/TaskManager";
import { CalendarManager } from "@/components/calendar/CalendarManager";
import { MeetingManager } from "@/components/meetings/MeetingManager";
import { KnowledgeManager } from "@/components/knowledge/KnowledgeManager";
import { ApprovalManager } from "@/components/approvals/ApprovalManager";
import { NotificationButton } from "@/components/notifications/NotificationButton";
import { FileManager } from "@/components/files/FileManager";
import { SearchButton } from "@/components/search/SearchButton";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { ProjectManager } from "@/components/projects/ProjectManager";
import { WorkflowManager } from "@/components/workflows/WorkflowManager";
import { SecurityManager } from "@/components/security/SecurityManager";
import { IntegrationManager } from "@/components/integrations/IntegrationManager";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { SettingsManager } from "@/components/settings/SettingsManager";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Home, 
  MessageSquare, 
  Users, 
  FileText, 
  CheckSquare as CheckSquareIcon, 
  File, 
  Calendar, 
  Video,
  BookOpen,
  Brain,
  FolderKanban,
  Workflow,
  Shield,
  Plug,
  Settings, 
  Search,
  Plus,
  Bell,
  ChevronDown,
  MoreHorizontal,
  CheckCircle,
  LogOut,
  BarChart3
} from "lucide-react";

interface FeishuLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Messages", icon: MessageSquare, href: "/messages" },
  { name: "Channels", icon: Users, href: "/channels" },
  { name: "Documents", icon: FileText, href: "/documents" },
  { name: "Tasks", icon: CheckSquareIcon, href: "/tasks" },
  { name: "Files", icon: File, href: "/files" },
  { name: "Calendar", icon: Calendar, href: "/calendar" },
  { name: "Meetings", icon: Video, href: "/meetings" },
  { name: "Projects", icon: FolderKanban, href: "/projects" },
  { name: "Workflows", icon: Workflow, href: "/workflows" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Knowledge", icon: BookOpen, href: "/knowledge" },
  { name: "Approvals", icon: CheckCircle, href: "/approvals" },
  { name: "AI Assistant", icon: Brain, href: "/ai" },
  { name: "Security", icon: Shield, href: "/security" },
  { name: "Integrations", icon: Plug, href: "/integrations" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

interface Channel {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  type: "public" | "private";
  workspaceId: string;
  isMember: boolean;
  members: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email: string;
      avatar?: string;
      status: string;
    };
  }>;
  _count: {
    members: number;
    messages: number;
  };
}

interface Document {
  id: string;
  title: string;
  content: string;
  type: "doc" | "sheet" | "slide";
  workspaceId: string;
  channelId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  channel?: {
    id: string;
    name: string;
    displayName?: string;
  };
  _count: {
    files: number;
  };
}

export function FeishuLayout({ children }: FeishuLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedWorkspace, setSelectedWorkspace] = useState(user?.workspaces[0] || null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  if (!user) {
    return null; // Will be handled by ProtectedRoute
  }

  const workspaces = user.workspaces || [];

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
    setSelectedDocument(null);
    setActiveTab("channels");
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setSelectedChannel(null);
    setActiveTab("documents");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Workspace Switcher */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedWorkspace?.avatar} alt={selectedWorkspace?.name} />
                  <AvatarFallback>
                    {selectedWorkspace?.name?.charAt(0) || "W"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedWorkspace?.name || "No Workspace"}</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                sidebarCollapsed && "rotate-90"
              )} />
            </Button>
          </div>
          
          {!sidebarCollapsed && (
            <div className="mt-2 space-y-1">
              {workspaces.map((workspace) => (
                <Button
                  key={workspace.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    selectedWorkspace?.id === workspace.id && "bg-accent"
                  )}
                  onClick={() => setSelectedWorkspace(workspace)}
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={workspace.avatar} alt={workspace.name} />
                    <AvatarFallback className="text-xs">
                      {workspace.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate flex-1">{workspace.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {workspace.role}
                  </Badge>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    activeTab === item.name.toLowerCase() && "bg-accent"
                  )}
                  onClick={() => setActiveTab(item.name.toLowerCase())}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {!sidebarCollapsed && item.name}
                </Button>
              ))}
            </div>

            {!sidebarCollapsed && (
              <>
                {/* Channels Section */}
                {selectedWorkspace && activeTab === "channels" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-xs font-medium text-muted-foreground">CHANNELS</h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <ChannelManager
                        workspaceId={selectedWorkspace.id}
                        onChannelSelect={handleChannelSelect}
                        selectedChannelId={selectedChannel?.id}
                      />
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {selectedWorkspace && activeTab === "documents" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-xs font-medium text-muted-foreground">DOCUMENTS</h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <DocumentManager
                        workspaceId={selectedWorkspace.id}
                        onDocumentSelect={handleDocumentSelect}
                        selectedDocumentId={selectedDocument?.id}
                      />
                    </div>
                  </div>
                )}

                {/* Quick Channels for other tabs */}
                {selectedWorkspace && activeTab !== "channels" && activeTab !== "documents" && activeTab !== "meetings" && activeTab !== "projects" && activeTab !== "workflows" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-xs font-medium text-muted-foreground">CHANNELS</h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <span className="mr-2">#</span>
                        <span className="flex-1 text-left">general</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                      >
                        <span className="mr-2">#</span>
                        <span className="flex-1 text-left">random</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Direct Messages */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-xs font-medium text-muted-foreground">DIRECT MESSAGES</h4>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <div className="relative mr-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">A</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background bg-green-500" />
                      </div>
                      <span className="flex-1 text-left">Alice Chen</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
              </div>
            )}
          </Button>
          {!sidebarCollapsed && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start mt-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Feishu Clone</h1>
            {selectedWorkspace && (
              <Badge variant="outline">{selectedWorkspace.name}</Badge>
            )}
            {selectedChannel && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">#{selectedChannel.displayName || selectedChannel.name}</span>
                  <Badge variant="outline" className="text-xs">{selectedChannel.type}</Badge>
                </div>
              </>
            )}
            {selectedDocument && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{selectedDocument.title}</span>
                  <Badge variant="outline" className="text-xs">{selectedDocument.type}</Badge>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SearchButton />
            <NotificationButton />
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "files" && selectedWorkspace ? (
            <FileManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "tasks" && selectedWorkspace ? (
            <TaskManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "calendar" && selectedWorkspace ? (
            <CalendarManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "meetings" && selectedWorkspace ? (
            <MeetingManager workspaceId={selectedWorkspace.id} channelId={selectedChannel?.id} />
          ) : activeTab === "projects" && selectedWorkspace ? (
            <ProjectManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "workflows" && selectedWorkspace ? (
            <WorkflowManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "analytics" && selectedWorkspace ? (
            <AnalyticsDashboard workspaceId={selectedWorkspace.id} />
          ) : activeTab === "knowledge" && selectedWorkspace ? (
            <KnowledgeManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "approvals" && selectedWorkspace ? (
            <ApprovalManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "ai" && selectedWorkspace ? (
            <AIAssistant workspaceId={selectedWorkspace.id} />
          ) : activeTab === "security" && selectedWorkspace ? (
            <SecurityManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "integrations" && selectedWorkspace ? (
            <IntegrationManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "settings" && selectedWorkspace ? (
            <SettingsManager workspaceId={selectedWorkspace.id} />
          ) : activeTab === "documents" && selectedWorkspace ? (
            <DocumentManager 
              workspaceId={selectedWorkspace.id} 
              channelId={selectedChannel?.id}
              onDocumentSelect={handleDocumentSelect}
              selectedDocumentId={selectedDocument?.id}
            />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}