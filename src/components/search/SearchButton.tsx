"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchModal } from "./SearchModal";
import { useAuth } from "@/contexts/AuthContext";

export function SearchButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const currentWorkspaceId = user?.workspaces[0]?.id || "";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <Search className="h-4 w-4" />
      </Button>
      
      <SearchModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        workspaceId={currentWorkspaceId}
      />
    </>
  );
}