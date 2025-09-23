"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Users,
  FileText,
  MessageSquare,
  CheckSquare,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Clock,
  Target,
  Zap,
  Settings,
  Plus
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {change > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            {Math.abs(change)}% from last month
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  workspaceId: string;
}

interface AnalyticsReport {
  id: string;
  name: string;
  type: string;
  status: string;
  lastGenerated?: string;
  schedule?: string;
  workspaceId: string;
}

interface AnalyticsManagerProps {
  workspaceId: string;
}

export function AnalyticsDashboard({ workspaceId }: AnalyticsManagerProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string>("default");
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [workspaceId]);

  const loadAnalytics = async () => {
    try {
      // Mock data - replace with actual API calls
      setDashboards([
        {
          id: "default",
          name: "Workspace Overview",
          description: "Key metrics and insights for your workspace",
          isDefault: true,
          workspaceId
        },
        {
          id: "productivity",
          name: "Productivity Analytics",
          description: "Track team productivity and task completion",
          isDefault: false,
          workspaceId
        },
        {
          id: "engagement",
          name: "User Engagement",
          description: "Monitor user activity and engagement metrics",
          isDefault: false,
          workspaceId
        }
      ]);

      setReports([
        {
          id: "1",
          name: "Monthly Activity Report",
          type: "pdf",
          status: "completed",
          lastGenerated: "2024-01-15T10:30:00Z",
          schedule: "monthly",
          workspaceId
        },
        {
          id: "2",
          name: "Team Performance Summary",
          type: "excel",
          status: "scheduled",
          schedule: "weekly",
          workspaceId
        },
        {
          id: "3",
          name: "Quarterly Business Review",
          type: "pdf",
          status: "generating",
          workspaceId
        }
      ]);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your workspace performance and generate insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Active Users"
              value="1,234"
              change={12}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              description="Users active in the last 30 days"
            />
            <MetricCard
              title="Documents Created"
              value="456"
              change={8}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              description="New documents this month"
            />
            <MetricCard
              title="Messages Sent"
              value="12.5K"
              change={15}
              icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
              description="Total messages this month"
            />
            <MetricCard
              title="Tasks Completed"
              value="789"
              change={-3}
              icon={<CheckSquare className="h-4 w-4 text-muted-foreground" />}
              description="Tasks completed this month"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Activity Trend</CardTitle>
                <CardDescription>Daily active users over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Activity chart visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Types Distribution</CardTitle>
                <CardDescription>Breakdown of document types created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Document types chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest activities in your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { user: "Alice Chen", action: "created document", time: "2 minutes ago", icon: FileText },
                  { user: "Bob Smith", action: "completed task", time: "15 minutes ago", icon: CheckSquare },
                  { user: "Carol Davis", action: "joined workspace", time: "1 hour ago", icon: Users },
                  { user: "David Wilson", action: "sent message", time: "2 hours ago", icon: MessageSquare },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <activity.icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((dashboard) => (
              <Card key={dashboard.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    {dashboard.isDefault && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                  <CardDescription>{dashboard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm">
                      View Dashboard
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>
                    Manage your automated reports and exports
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium">{report.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {report.type.toUpperCase()}
                          </span>
                          {report.schedule && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {report.schedule}
                            </span>
                          )}
                          {report.lastGenerated && (
                            <span>Last: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          report.status === "completed" ? "default" :
                          report.status === "scheduled" ? "secondary" :
                          report.status === "generating" ? "default" : "destructive"
                        }
                      >
                        {report.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  AI-powered insights from your workspace data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900">Productivity Peak</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your team is most productive on Tuesdays and Wednesdays between 10 AM - 12 PM.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900">Collaboration Success</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Document collaboration has increased by 45% this month.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-900">Meeting Optimization</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Consider reducing meeting duration by 15 minutes to improve focus time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Suggestions to improve your workspace efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Automate Routine Tasks</h4>
                      <p className="text-sm text-muted-foreground">
                        Set up workflows for recurring tasks to save time.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Improve Document Organization</h4>
                      <p className="text-sm text-muted-foreground">
                        Create better folder structure for easier file discovery.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Enhance Team Communication</h4>
                      <p className="text-sm text-muted-foreground">
                        Consider creating dedicated channels for specific projects.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}