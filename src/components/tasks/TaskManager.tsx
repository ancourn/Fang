"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskBoard } from "./TaskBoard";
import { 
  LayoutList, 
  Calendar, 
  Users, 
  BarChart3,
  CheckSquare
} from "lucide-react";

interface TaskManagerProps {
  workspaceId: string;
  channelId?: string;
  className?: string;
}

export function TaskManager({ workspaceId, channelId, className }: TaskManagerProps) {
  const [activeView, setActiveView] = useState("board");

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="board" className="flex items-center gap-2">
            <LayoutList className="h-4 w-4" />
            <span className="hidden sm:inline">Board</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="board" className="flex-1 mt-0">
          <TaskBoard workspaceId={workspaceId} channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="list" className="flex-1 mt-0">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">List View</p>
              <p className="text-sm">Task list view coming soon...</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="calendar" className="flex-1 mt-0">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Calendar View</p>
              <p className="text-sm">Task calendar view coming soon...</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="flex-1 mt-0">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Analytics</p>
              <p className="text-sm">Task analytics coming soon...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}