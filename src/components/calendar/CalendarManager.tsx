"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "./CalendarView";
import { MeetingScheduler } from "./MeetingScheduler";
import { 
  Calendar as CalendarIcon, 
  Video, 
  Clock,
  BarChart3
} from "lucide-react";

interface CalendarManagerProps {
  workspaceId: string;
  channelId?: string;
  className?: string;
}

export function CalendarManager({ workspaceId, channelId, className }: CalendarManagerProps) {
  const [activeView, setActiveView] = useState("calendar");

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Availability</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="flex-1 mt-0">
          <CalendarView workspaceId={workspaceId} channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="scheduler" className="flex-1 mt-0">
          <MeetingScheduler workspaceId={workspaceId} channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="availability" className="flex-1 mt-0">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Team Availability</p>
              <p className="text-sm">Team availability view coming soon...</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="flex-1 mt-0">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Calendar Analytics</p>
              <p className="text-sm">Meeting analytics and insights coming soon...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}