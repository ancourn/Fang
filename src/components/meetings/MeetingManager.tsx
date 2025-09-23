"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Video, 
  Phone, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import { VideoConference } from "./VideoConference";
import { useAuth } from "@/contexts/AuthContext";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  roomId?: string;
  startTime?: string;
  endTime?: string;
  status: "scheduled" | "active" | "ended" | "cancelled";
  workspaceId: string;
  channelId?: string;
  createdAt: string;
  updatedAt: string;
  host: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    role: string;
    joinedAt?: string;
    isMuted: boolean;
    isVideoOn: boolean;
    isScreenSharing: boolean;
  }>;
  recordings: Array<{
    id: string;
    filename: string;
    url: string;
    duration?: number;
    size?: number;
    format: string;
    thumbnail?: string;
    createdAt: string;
  }>;
  channel?: {
    id: string;
    name: string;
  };
}

interface MeetingManagerProps {
  workspaceId: string;
  channelId?: string;
}

export function MeetingManager({ workspaceId, channelId }: MeetingManagerProps) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isInMeeting, setIsInMeeting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    fetchMeetings();
  }, [workspaceId, channelId]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ workspaceId });
      if (channelId) params.append("channelId", channelId);
      
      const response = await fetch(`/api/meetings?${params}`);
      if (!response.ok) throw new Error("Failed to fetch meetings");
      
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setError("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          workspaceId,
          channelId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create meeting");

      await fetchMeetings();
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "", startTime: "", endTime: "" });
    } catch (error) {
      console.error("Error creating meeting:", error);
      setError("Failed to create meeting");
    }
  };

  const handleJoinMeeting = async (meeting: Meeting) => {
    try {
      // Join meeting via API
      const response = await fetch(`/api/meetings/${meeting.id}/join`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to join meeting");

      setActiveMeeting(meeting);
      setIsInMeeting(true);
    } catch (error) {
      console.error("Error joining meeting:", error);
      setError("Failed to join meeting");
    }
  };

  const handleLeaveMeeting = async () => {
    if (activeMeeting) {
      try {
        await fetch(`/api/meetings/${activeMeeting.id}/join`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error leaving meeting:", error);
      }
    }
    
    setIsInMeeting(false);
    setActiveMeeting(null);
    await fetchMeetings(); // Refresh meetings list
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete meeting");

      await fetchMeetings();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      setError("Failed to delete meeting");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "ended": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "No time set";
    return new Date(dateString).toLocaleString();
  };

  if (isInMeeting && activeMeeting) {
    return (
      <VideoConference
        meetingId={activeMeeting.id}
        roomId={activeMeeting.roomId || ""}
        onLeave={handleLeaveMeeting}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meetings</h2>
          <p className="text-muted-foreground">
            Schedule and join video conferences
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Meeting</DialogTitle>
              <DialogDescription>
                Schedule a new video conference for your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter meeting title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter meeting description"
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time (Optional)</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time (Optional)</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMeeting} disabled={!formData.title}>
                Create Meeting
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No meetings yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first video conference to collaborate with your team.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Meeting
              </Button>
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{meeting.title}</h3>
                      <Badge className={getStatusColor(meeting.status)}>
                        {meeting.status}
                      </Badge>
                      {meeting.hostId === user?.id && (
                        <Badge variant="outline">Host</Badge>
                      )}
                    </div>
                    
                    {meeting.description && (
                      <p className="text-muted-foreground mb-3">{meeting.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(meeting.startTime)}
                      </div>
                      {meeting.endTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDateTime(meeting.endTime)}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {meeting.participants.length} participants
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={meeting.host.avatar} />
                        <AvatarFallback className="text-xs">
                          {meeting.host.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        Hosted by {meeting.host.name}
                      </span>
                    </div>

                    {meeting.channel && (
                      <div className="text-sm text-muted-foreground">
                        Channel: {meeting.channel.name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {meeting.status === "scheduled" || meeting.status === "active" ? (
                      <Button
                        onClick={() => handleJoinMeeting(meeting)}
                        className="flex items-center gap-2"
                      >
                        <Video className="h-4 w-4" />
                        {meeting.status === "active" ? "Join Meeting" : "Start Meeting"}
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        <Phone className="h-4 w-4" />
                        Meeting Ended
                      </Button>
                    )}
                    
                    {meeting.hostId === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Participants */}
                {meeting.participants.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Participants</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {meeting.participants.slice(0, 5).map((participant) => (
                        <Avatar key={participant.id} className="h-6 w-6">
                          <AvatarImage src={participant.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {participant.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {meeting.participants.length > 5 && (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          +{meeting.participants.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recordings */}
                {meeting.recordings.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4" />
                      <span className="text-sm font-medium">Recordings</span>
                    </div>
                    <div className="space-y-1">
                      {meeting.recordings.map((recording) => (
                        <div key={recording.id} className="text-sm text-muted-foreground">
                          {recording.filename} • {recording.duration}s
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}