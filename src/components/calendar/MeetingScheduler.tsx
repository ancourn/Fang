"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  Plus,
  Search,
  Filter,
  Check,
  X,
  HelpCircle,
  Mail,
  Phone,
  MessageSquare
} from "lucide-react";
import { EventCard } from "./EventCard";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  meetingUrl?: string;
  type: "event" | "meeting" | "reminder" | "deadline";
  status: "confirmed" | "tentative" | "cancelled";
  visibility: "public" | "private" | "confidential";
  color: string;
  creator: {
    id: string;
    name?: string;
    email: string;
    avatar?: string;
  };
  attendees: Array<{
    id: string;
    user?: {
      id: string;
      name?: string;
      email: string;
      avatar?: string;
    };
    status: "invited" | "accepted" | "declined" | "tentative";
    role: "organizer" | "attendee" | "optional";
  }>;
  _count: {
    attendees: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface MeetingRoom {
  id: string;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  equipment?: string[];
  isActive: boolean;
}

interface MeetingSchedulerProps {
  workspaceId: string;
  channelId?: string;
  className?: string;
}

const mockMeetingRooms: MeetingRoom[] = [
  {
    id: "1",
    name: "Conference Room A",
    description: "Large conference room with projector and whiteboard",
    location: "Floor 2, Building A",
    capacity: 12,
    equipment: ["Projector", "Whiteboard", "Video Conference", "Speakers"],
    isActive: true
  },
  {
    id: "2",
    name: "Conference Room B",
    description: "Medium-sized meeting room",
    location: "Floor 2, Building A",
    capacity: 8,
    equipment: ["TV Screen", "Whiteboard"],
    isActive: true
  },
  {
    id: "3",
    name: "Huddle Space",
    description: "Small informal meeting space",
    location: "Floor 1, Building B",
    capacity: 4,
    equipment: ["TV Screen"],
    isActive: true
  }
];

const mockUsers = [
  {
    id: "1",
    name: "Alice Chen",
    email: "alice@example.com",
    avatar: "/api/placeholder/32/32",
    status: "online"
  },
  {
    id: "2",
    name: "Bob Wang",
    email: "bob@example.com",
    avatar: "/api/placeholder/32/32",
    status: "away"
  },
  {
    id: "3",
    name: "Carol Liu",
    email: "carol@example.com",
    avatar: "/api/placeholder/32/32",
    status: "online"
  },
  {
    id: "4",
    name: "David Zhang",
    email: "david@example.com",
    avatar: "/api/placeholder/32/32",
    status: "offline"
  }
];

export function MeetingScheduler({ workspaceId, channelId, className }: MeetingSchedulerProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleScheduleMeeting = () => {
    // This will be implemented with the API
    console.log("Schedule meeting with:", {
      room: selectedRoom,
      users: selectedUsers,
      workspaceId,
      channelId
    });
    setIsCreateDialogOpen(false);
    setSelectedRoom(null);
    setSelectedUsers([]);
  };

  const getRoomAvailability = (room: MeetingRoom) => {
    // Mock availability - in real app, this would check against existing bookings
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour >= 9 && currentHour < 17) {
      return { available: false, nextAvailable: "5:00 PM" };
    }
    return { available: true, nextAvailable: "Now" };
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">Schedule Meeting</TabsTrigger>
          <TabsTrigger value="rooms">Meeting Rooms</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="flex-1 mt-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Schedule New Meeting</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Schedule New Meeting</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Meeting Title</label>
                        <Input placeholder="Enter meeting title" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Description</label>
                        <textarea 
                          placeholder="Enter meeting description (optional)" 
                          className="w-full p-2 border rounded-md resize-none"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Date and Time */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Date and Time</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Start Time</label>
                          <input 
                            type="datetime-local" 
                            className="w-full p-2 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">End Time</label>
                          <input 
                            type="datetime-local" 
                            className="w-full p-2 border rounded-md"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card 
                          className={cn(
                            "cursor-pointer transition-colors",
                            !selectedRoom && "border-2 border-dashed border-muted-foreground/25"
                          )}
                          onClick={() => setSelectedRoom(null)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Video className="h-5 w-5 text-blue-600" />
                              <div>
                                <h4 className="font-medium">Virtual Meeting</h4>
                                <p className="text-sm text-muted-foreground">Online video conference</p>
                              </div>
                              {!selectedRoom && <Check className="h-4 w-4 ml-auto text-green-600" />}
                            </div>
                          </CardContent>
                        </Card>
                        
                        {mockMeetingRooms.map(room => {
                          const availability = getRoomAvailability(room);
                          return (
                            <Card 
                              key={room.id}
                              className={cn(
                                "cursor-pointer transition-colors",
                                selectedRoom?.id === room.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                              )}
                              onClick={() => setSelectedRoom(room)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div className="flex-1">
                                      <h4 className="font-medium">{room.name}</h4>
                                      <p className="text-sm text-muted-foreground">{room.location}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Users className="h-3 w-3" />
                                        <span className="text-xs">{room.capacity} people</span>
                                        {room.equipment && room.equipment.length > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            • {room.equipment.slice(0, 2).join(", ")}
                                            {room.equipment.length > 2 && "..."}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 mt-2">
                                        <div className={cn(
                                          "w-2 h-2 rounded-full",
                                          availability.available ? "bg-green-500" : "bg-red-500"
                                        )} />
                                        <span className="text-xs">
                                          {availability.available ? "Available" : "Occupied"}
                                        </span>
                                        {!availability.available && (
                                          <span className="text-xs text-muted-foreground">
                                            • Next: {availability.nextAvailable}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {selectedRoom?.id === room.id && (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Attendees */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Attendees</h3>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users to invite..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {filteredUsers.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleUserToggle(user.id)}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className="relative">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm">
                                  {user.name.charAt(0)}
                                </div>
                                <div className={cn(
                                  "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background",
                                  user.status === "online" ? "bg-green-500" :
                                  user.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                                )} />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                            {selectedUsers.includes(user.id) && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                      {selectedUsers.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">
                            {selectedUsers.length} attendee{selectedUsers.length !== 1 ? "s" : ""} selected
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleScheduleMeeting}>
                        Schedule Meeting
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium">Quick Video Call</h3>
                    <p className="text-sm text-muted-foreground">Start instant video meeting</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-medium">Book Room</h3>
                    <p className="text-sm text-muted-foreground">Reserve meeting room</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-medium">Find Time</h3>
                    <p className="text-sm text-muted-foreground">Schedule with team</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Meetings */}
            <div className="flex-1 p-4">
              <h3 className="text-sm font-medium mb-4">Recent Meetings</h3>
              <div className="space-y-2">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No recent meetings</p>
                  <p className="text-sm">Schedule your first meeting to get started</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="rooms" className="flex-1 mt-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Meeting Rooms</h2>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </div>

            {/* Rooms Grid */}
            <div className="flex-1 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockMeetingRooms.map(room => {
                  const availability = getRoomAvailability(room);
                  return (
                    <Card key={room.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-base">{room.name}</span>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            availability.available ? "bg-green-500" : "bg-red-500"
                          )} />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {room.description && (
                            <p className="text-sm text-muted-foreground">{room.description}</p>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3" />
                            <span>{room.location}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-3 w-3" />
                            <span>{room.capacity} people capacity</span>
                          </div>
                          
                          {room.equipment && room.equipment.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-1">Equipment:</p>
                              <div className="flex flex-wrap gap-1">
                                {room.equipment.map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                "text-xs font-medium",
                                availability.available ? "text-green-600" : "text-red-600"
                              )}>
                                {availability.available ? "Available" : "Occupied"}
                              </span>
                              <Button size="sm" disabled={!availability.available}>
                                Book
                              </Button>
                            </div>
                            {!availability.available && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Next available: {availability.nextAvailable}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming" className="flex-1 mt-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Upcoming Meetings</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Meetings List */}
            <div className="flex-1 p-4">
              <div className="space-y-2">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No upcoming meetings</p>
                  <p className="text-sm">Schedule a meeting to see it here</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}