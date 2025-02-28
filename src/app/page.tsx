'use client';

import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { loadThreads, isLoading } = useStore();

  useEffect(() => {
    setIsClient(true);
    loadThreads();
  }, [loadThreads]);

  // Don't render anything until we're on the client
  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--claude-dark-100)] text-white">
        <div className="text-lg">Loading your chats...</div>
      </div>
    );
  }

  return (
    <main className="relative flex h-screen bg-[var(--claude-dark-100)]">
      <div 
        className="fixed left-0 top-0 bottom-0 w-64 z-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Sidebar isHovered={isHovered} />
      </div>
      <div className="flex-1 flex flex-col pl-64">
        <ChatInterface />
      </div>
    </main>
  );
}
