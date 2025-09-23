"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  MapPin, 
  Video, 
  Users, 
  Clock,
  Calendar,
  User,
  Check,
  X,
  HelpCircle,
  Edit,
  Trash2
} from "lucide-react";

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

interface EventCardProps {
  event: CalendarEvent;
  onEventClick?: (event: CalendarEvent) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  onRSVP?: (eventId: string, status: "accepted" | "declined" | "tentative") => void;
  className?: string;
  compact?: boolean;
}

const typeIcons = {
  event: Calendar,
  meeting: Users,
  reminder: Clock,
  deadline: MapPin
};

const statusColors = {
  confirmed: "bg-green-100 text-green-800",
  tentative: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800"
};

const statusIcons = {
  confirmed: Check,
  tentative: HelpCircle,
  cancelled: X
};

const attendeeStatusColors = {
  invited: "bg-gray-100 text-gray-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  tentative: "bg-yellow-100 text-yellow-800"
};

export function EventCard({
  event,
  onEventClick,
  onEventEdit,
  onEventDelete,
  onRSVP,
  className,
  compact = false
}: EventCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const TypeIcon = typeIcons[event.type];
  const StatusIcon = statusIcons[event.status];

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (event.allDay) {
      return date.toLocaleDateString("en-US", { 
        weekday: "short", 
        month: "short", 
        day: "numeric" 
      });
    } else {
      return date.toLocaleString("en-US", { 
        weekday: "short", 
        month: "short", 
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }
  };

  const formatTime = (dateString: string) => {
    if (event.allDay) return "All day";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit" 
    });
  };

  const getAttendeeStatus = () => {
    return event.attendees.find(a => a.user?.id === "current-user")?.status || "invited";
  };

  const handleRSVP = (status: "accepted" | "declined" | "tentative") => {
    onRSVP?.(event.id, status);
  };

  if (compact) {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4",
          `border-l-[${event.color}]`,
          className
        )}
        onClick={() => onEventClick?.(event)}
        style={{ borderLeftColor: event.color }}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 flex-shrink-0" style={{ color: event.color }} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{event.title}</h4>
              <p className="text-xs text-muted-foreground">
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </p>
            </div>
            <StatusIcon className="h-4 w-4 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4",
        className
      )}
      onClick={() => onEventClick?.(event)}
      style={{ borderLeftColor: event.color }}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TypeIcon className="h-4 w-4 flex-shrink-0" style={{ color: event.color }} />
            <h3 className="text-sm font-medium line-clamp-2 flex-1">
              {event.title}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant="secondary" 
              className={cn("text-xs", statusColors[event.status])}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {event.status}
            </Badge>
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEventEdit?.(event)}>
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Event
                </DropdownMenuItem>
                {onEventDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventDelete(event.id);
                      setIsMenuOpen(false);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete Event
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {event.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        {/* Time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Clock className="h-3 w-3" />
          <span>
            {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Meeting URL */}
        {event.meetingUrl && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Video className="h-3 w-3" />
            <span className="truncate">Meeting link available</span>
          </div>
        )}

        {/* Attendees */}
        {event._count.attendees > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <div className="flex -space-x-2">
              {event.attendees.slice(0, 3).map((attendee) => (
                <Avatar key={attendee.id} className="h-5 w-5 border-2 border-background">
                  <AvatarImage src={attendee.user?.avatar} alt={attendee.user?.name} />
                  <AvatarFallback className="text-xs">
                    {attendee.user?.name?.charAt(0) || attendee.user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {event._count.attendees > 3 && (
                <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                  +{event._count.attendees - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {event._count.attendees} attendee{event._count.attendees !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* RSVP Actions */}
        {onRSVP && getAttendeeStatus() !== "accepted" && (
          <div className="flex gap-1 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleRSVP("accepted");
              }}
            >
              <Check className="h-3 w-3 mr-1" />
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleRSVP("tentative");
              }}
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Maybe
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleRSVP("declined");
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Decline
            </Button>
          </div>
        )}

        {/* Creator */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <User className="h-3 w-3" />
          <span>Created by {event.creator.name || event.creator.email}</span>
        </div>
      </CardContent>
    </Card>
  );
}