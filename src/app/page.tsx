"use client";

import { FeishuLayout } from "@/components/layout/FeishuLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <FeishuLayout>
        <ChatInterface />
      </FeishuLayout>
    </ProtectedRoute>
  );
}