"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  Eye,
  Edit,
  MessageSquare,
  Share,
  Download,
  Calendar,
  Loader2,
  RefreshCw
} from "lucide-react";

interface DocumentStats {
  totalDocuments: number;
  totalViews: number;
  totalEdits: number;
  totalComments: number;
  totalShares: number;
  totalDownloads: number;
  activeUsers: number;
  documentsByType: {
    doc: number;
    sheet: number;
    slide: number;
  };
  documentsByCategory: {
    [key: string]: number;
  };
  topDocuments: Array<{
    id: string;
    title: string;
    views: number;
    edits: number;
    comments: number;
    lastActivity: string;
  }>;
  userActivity: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    documentsCreated: number;
    documentsEdited: number;
    comments: number;
    lastActive: string;
  }>;
  activityTrend: Array<{
    date: string;
    views: number;
    edits: number;
    comments: number;
  }>;
}

interface DocumentAnalyticsProps {
  workspaceId: string;
  timeRange?: "7d" | "30d" | "90d" | "1y";
}

export function DocumentAnalytics({ workspaceId, timeRange = "30d" }: DocumentAnalyticsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [workspaceId, selectedTimeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/analytics?workspaceId=${workspaceId}&timeRange=${selectedTimeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.analytics);
      } else {
        setError("Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Fetch analytics error:", error);
      setError("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No analytics data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Analytics</h2>
          <p className="text-muted-foreground">Track document usage and collaboration insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalDocuments)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.documentsByType.doc} docs, {stats.documentsByType.sheet} sheets, {stats.documentsByType.slide} slides
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              Across all documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.activeUsers)}</div>
            <p className="text-xs text-muted-foreground">
              Collaborating on documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Edits</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalEdits)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalComments} comments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Documents</CardTitle>
            <CardDescription>Most active documents by engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {stats.topDocuments.slice(0, 10).map((doc, index) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <h4 className="font-medium truncate">{doc.title}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{doc.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Edit className="h-3 w-3" />
                          <span>{doc.edits}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{doc.comments}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(doc.lastActivity)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Most active contributors</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {stats.userActivity.slice(0, 10).map((userActivity, index) => (
                  <div key={userActivity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">{userActivity.name || userActivity.email}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{userActivity.documentsCreated} created</span>
                          <span>{userActivity.documentsEdited} edited</span>
                          <span>{userActivity.comments} comments</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Active {formatDate(userActivity.lastActive)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Trend</CardTitle>
          <CardDescription>Document activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(stats.activityTrend.reduce((sum, day) => sum + day.views, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(stats.activityTrend.reduce((sum, day) => sum + day.edits, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Edits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(stats.activityTrend.reduce((sum, day) => sum + day.comments, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Comments</div>
              </div>
            </div>
            
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {stats.activityTrend.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm font-medium">{formatDate(day.date)}</div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-blue-600" />
                        <span>{day.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Edit className="h-3 w-3 text-green-600" />
                        <span>{day.edits}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-purple-600" />
                        <span>{day.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Document Categories */}
      {Object.keys(stats.documentsByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents by Category</CardTitle>
            <CardDescription>Distribution of documents across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.documentsByCategory).map(([category, count]) => (
                <div key={category} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}