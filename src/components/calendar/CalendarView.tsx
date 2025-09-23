"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter,
  Grid,
  List,
  Users,
  MapPin,
  Video
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

interface CalendarViewProps {
  workspaceId: string;
  channelId?: string;
  className?: string;
}

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Team Standup Meeting",
    description: "Daily team sync to discuss progress and blockers",
    startTime: "2024-01-15T09:00:00Z",
    endTime: "2024-01-15T09:30:00Z",
    allDay: false,
    location: "Conference Room A",
    meetingUrl: "https://meet.example.com/standup",
    type: "meeting",
    status: "confirmed",
    visibility: "public",
    color: "#3b82f6",
    creator: {
      id: "1",
      name: "Alice Chen",
      email: "alice@example.com",
      avatar: "/api/placeholder/32/32"
    },
    attendees: [
      {
        id: "1",
        user: {
          id: "1",
          name: "Alice Chen",
          email: "alice@example.com",
          avatar: "/api/placeholder/32/32"
        },
        status: "accepted",
        role: "organizer"
      },
      {
        id: "2",
        user: {
          id: "2",
          name: "Bob Wang",
          email: "bob@example.com",
          avatar: "/api/placeholder/32/32"
        },
        status: "accepted",
        role: "attendee"
      },
      {
        id: "3",
        user: {
          id: "3",
          name: "Carol Liu",
          email: "carol@example.com",
          avatar: "/api/placeholder/32/32"
        },
        status: "tentative",
        role: "attendee"
      }
    ],
    _count: {
      attendees: 3
    },
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-10T10:00:00Z"
  },
  {
    id: "2",
    title: "Project Deadline: Q1 Planning",
    description: "Finalize Q1 project plans and deliverables",
    startTime: "2024-01-20T17:00:00Z",
    endTime: "2024-01-20T18:00:00Z",
    allDay: false,
    type: "deadline",
    status: "confirmed",
    visibility: "public",
    color: "#ef4444",
    creator: {
      id: "2",
      name: "Bob Wang",
      email: "bob@example.com",
      avatar: "/api/placeholder/32/32"
    },
    attendees: [
      {
        id: "2",
        user: {
          id: "2",
          name: "Bob Wang",
          email: "bob@example.com",
          avatar: "/api/placeholder/32/32"
        },
        status: "accepted",
        role: "organizer"
      }
    ],
    _count: {
      attendees: 1
    },
    createdAt: "2024-01-12T10:00:00Z",
    updatedAt: "2024-01-12T10:00:00Z"
  },
  {
    id: "3",
    title: "Client Presentation",
    description: "Present Q4 results and Q1 roadmap to client",
    startTime: "2024-01-25T14:00:00Z",
    endTime: "2024-01-25T15:30:00Z",
    allDay: false,
    meetingUrl: "https://meet.example.com/client-presentation",
    type: "meeting",
    status: "confirmed",
    visibility: "confidential",
    color: "#8b5cf6",
    creator: {
      id: "3",
      name: "Carol Liu",
      email: "carol@example.com",
      avatar: "/api/placeholder/32/32"
    },
    attendees: [
      {
        id: "3",
        user: {
          id: "3",
          name: "Carol Liu",
          email: "carol@example.com",
          avatar: "/api/placeholder/32/32"
        },
        status: "accepted",
        role: "organizer"
      },
      {
        id: "4",
        user: {
          id: "4",
          name: "David Zhang",
          email: "david@example.com",
          avatar: "/api/placeholder/32/32"
        },
        status: "accepted",
        role: "attendee"
      }
    ],
    _count: {
      attendees: 2
    },
    createdAt: "2024-01-13T10:00:00Z",
    updatedAt: "2024-01-13T10:00:00Z"
  }
];

export function CalendarView({ workspaceId, channelId, className }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "list">("month");

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCreateEvent = () => {
    // This will be implemented with the API
    console.log("Create new event");
    setIsCreateDialogOpen(false);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const renderMonthView = () => {
    const days = generateMonthDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const dayEvents = getEventsForDate(day);
          
          return (
            <div
              key={index}
              className={cn(
                "min-h-24 p-1 border border-border rounded-lg",
                !isCurrentMonth && "bg-muted/50",
                isToday && "bg-blue-50 border-blue-200"
              )}
            >
              <div className={cn(
                "text-sm font-medium mb-1",
                !isCurrentMonth && "text-muted-foreground",
                isToday && "text-blue-600"
              )}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.color + "20", color: event.color }}
                    onClick={() => handleEventClick(event)}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const sortedEvents = [...filteredEvents].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return (
      <div className="space-y-2">
        {sortedEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onEventClick={handleEventClick}
          />
        ))}
        {sortedEvents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No events found</p>
            <p className="text-sm">Try adjusting your search or create a new event</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Calendar</h2>
          <Badge variant="outline">{filteredEvents.length} events</Badge>
          {channelId && (
            <Badge variant="secondary">Channel: {channelId}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Event title" />
                <textarea 
                  placeholder="Description (optional)" 
                  className="w-full p-2 border rounded-md resize-none"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="datetime-local" 
                    className="p-2 border rounded-md"
                  />
                  <input 
                    type="datetime-local" 
                    className="p-2 border rounded-md"
                  />
                </div>
                <div className="flex gap-2">
                  <select className="flex-1 p-2 border rounded-md">
                    <option value="event">Event</option>
                    <option value="meeting">Meeting</option>
                    <option value="reminder">Reminder</option>
                    <option value="deadline">Deadline</option>
                  </select>
                  <input 
                    type="color" 
                    className="w-12 p-1 border rounded-md"
                    defaultValue="#3b82f6"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent}>
                    Create Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">
            {currentDate.toLocaleDateString("en-US", { 
              month: "long", 
              year: "numeric" 
            })}
          </h3>
          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {viewMode === "month" ? renderMonthView() : renderListView()}
        </div>
      </ScrollArea>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedEvent.title}
                <Badge variant="outline" className="text-xs">
                  {selectedEvent.type}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedEvent.description && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Start Time</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedEvent.startTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">End Time</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedEvent.endTime).toLocaleString()}
                  </p>
                </div>
                
                {selectedEvent.location && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Location</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  </div>
                )}
                
                {selectedEvent.meetingUrl && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Meeting Link</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Video className="h-3 w-3" />
                      <span className="truncate">Join meeting</span>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedEvent.attendees.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Attendees ({selectedEvent.attendees.length})</h4>
                  <div className="space-y-1">
                    {selectedEvent.attendees.map(attendee => (
                      <div key={attendee.id} className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          {attendee.user?.name?.charAt(0) || attendee.user?.email?.charAt(0) || "U"}
                        </div>
                        <span className="text-sm">{attendee.user?.name || attendee.user?.email}</span>
                        <Badge variant="outline" className="text-xs">
                          {attendee.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {attendee.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Created by {selectedEvent.creator.name || selectedEvent.creator.email}</span>
                  <span>•</span>
                  <span>{new Date(selectedEvent.createdAt).toLocaleDateString()}</span>
                </div>
                <Button variant="outline" size="sm">
                  Edit Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}